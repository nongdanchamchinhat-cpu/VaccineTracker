import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { jsonError } from "@/lib/api";
import { ensureProfile } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email: body.email,
      token: body.token,
      type: "email",
    });

    if (error || !data.user) {
      return jsonError(error?.message ?? "OTP không hợp lệ.", 400);
    }

    await ensureProfile(data.user.id, data.user.email ?? body.email);
    trackEvent("otp_verified", { userId: data.user.id });

    return NextResponse.json({ message: "Đăng nhập thành công." });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request", 400);
  }
}
