import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { jsonError } from "@/lib/api";
import { assertRateLimit, getRequestKey } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateLimit = assertRateLimit(
      getRequestKey(["otp-request", ip, body.email.toLowerCase()]),
      5,
      15 * 60 * 1000,
    );

    if (!rateLimit.ok) {
      return jsonError(
        `Bạn gửi OTP quá nhiều lần. Thử lại sau ${rateLimit.retryAfterSeconds} giây.`,
        429,
      );
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: body.email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return jsonError(error.message, 400);
    }

    trackEvent("otp_requested", { email: body.email });

    return NextResponse.json({
      message: "OTP đã được gửi. Kiểm tra email để lấy mã xác thực.",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request", 400);
  }
}
