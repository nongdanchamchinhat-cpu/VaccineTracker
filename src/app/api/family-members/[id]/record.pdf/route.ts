import { NextResponse } from "next/server";
import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";

import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { ScheduleItem } from "@/lib/types";
import { formatCurrency, formatDateVN } from "@/lib/utils";

function drawLine(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  color = rgb(0.1, 0.14, 0.19),
) {
  page.drawText(text, {
    x,
    y,
    size,
    color,
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { id } = await context.params;

    const [{ data: member, error: memberError }, { data: items, error: itemsError }] =
      await Promise.all([
        supabase.from("family_members").select("*").eq("id", id).single(),
        supabase
          .from("member_vaccine_items")
          .select("*")
          .eq("member_id", id)
          .order("scheduled_date", { ascending: true })
          .order("sort_order", { ascending: true }),
      ]);

    if (memberError || !member) return jsonError("Không tìm thấy hồ sơ thành viên.", 404);
    if (itemsError) return jsonError(itemsError.message, 400);

    const pdf = await PDFDocument.create();
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
    let page = pdf.addPage([595.28, 841.89]);

    let y = 800;
    page.drawText("Family Vaccine Tracker", {
      x: 40,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0.05, 0.44, 0.42),
    });

    y -= 28;
    page.drawText(`So tiem chung: ${member.name}`, {
      x: 40,
      y,
      size: 22,
      font: boldFont,
      color: rgb(0.1, 0.14, 0.19),
    });

    y -= 22;
    page.drawText(
      `Nhom doi tuong: ${member.member_type} | Ngay sinh: ${formatDateVN(member.birth_date)}`,
      {
        x: 40,
        y,
        size: 11,
        font: regularFont,
      },
    );

    y -= 28;
    page.drawText("Lich mau chi mang tinh tham khao, can co xac nhan cua bac si truoc khi tiem.", {
      x: 40,
      y,
      size: 10,
      font: regularFont,
      color: rgb(0.45, 0.5, 0.56),
    });

    y -= 30;
    const typedItems = (items ?? []) as ScheduleItem[];

    for (const item of typedItems) {
      if (y < 90) {
        page = pdf.addPage([595.28, 841.89]);
        y = 800;
      }

      page.drawRectangle({
        x: 40,
        y: y - 12,
        width: 515,
        height: 58,
        borderColor: rgb(0.88, 0.9, 0.92),
        borderWidth: 1,
      });

      drawLine(page, item.vaccine_name, 52, y + 28, 12, rgb(0.1, 0.14, 0.19));
      drawLine(
        page,
        `${formatDateVN(item.scheduled_date)} | ${item.milestone} | ${item.status}`,
        52,
        y + 12,
        10,
        rgb(0.28, 0.34, 0.39),
      );
      drawLine(
        page,
        `${item.disease} | ${item.origin} | ${formatCurrency(item.estimated_price)}`,
        52,
        y - 2,
        9,
        rgb(0.39, 0.45, 0.5),
      );
      y -= 74;
    }

    const bytes = await pdf.save();

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${member.name}-record.pdf"`,
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
