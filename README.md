# Family Vaccine Tracker

Ứng dụng Next.js + Supabase để quản lý lịch tiêm cho cả gia đình: trẻ sơ sinh, trẻ em, thiếu niên, người lớn, cao tuổi và thai kỳ.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Supabase Auth (OTP email) + Postgres
- Calendar reminder miễn phí qua `.ics`
- Resend cho email reminder server-side khi cần public rộng
- Vercel Cron cho job quét reminder mỗi 15 phút
- Sentry cho runtime/error monitoring

## Tính năng đã implement

- Đăng nhập bằng OTP email
- Tạo nhiều thành viên gia đình trên cùng một tài khoản
- Khởi tạo lịch theo `member_type` từ các bộ template phù hợp
- Timeline lịch tiêm với filter `Tất cả / Cần tiêm / Đã tiêm`
- Mark complete, skip, cập nhật chi phí thực tế
- Thêm mũi custom ngoài lịch mẫu
- Export file `.ics` theo từng thành viên với nhắc `trước 1 ngày` và `trước 2 giờ`
- Link thêm nhanh từng mũi vào Google Calendar
- Lưu cài đặt reminder theo từng thành viên
- Cron gửi email reminder thật qua Resend khi đã cấu hình provider
- Delivery log chống gửi trùng

## Thiết lập môi trường

1. Copy `.env.example` thành `.env.local`.
2. Điền:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL`
3. Nếu muốn dùng email reminder server-side thì điền thêm:
   - `RESEND_API_KEY`
   - `REMINDER_FROM_EMAIL`
4. Chạy các migration trong `supabase/migrations/` theo thứ tự.
5. Cấu hình Supabase email template để gửi OTP.

## Chạy local

```bash
env PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin npm run dev
```

## API chính

- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/logout`
- `GET /api/me/family-members`
- `PATCH /api/me/reminder-preferences`
- `POST /api/family-members`
- `GET /api/family-members/:id/schedule`
- `POST /api/family-members/:id/schedule/from-template`
- `GET /api/family-members/:id/calendar.ics`
- `POST /api/schedule-items`
- `PATCH /api/schedule-items/:id`
- `POST /api/schedule-items/:id/complete`
- `GET /api/cron/reminders`

## Notes triển khai

- `vercel.json` đã cấu hình cron 15 phút cho `/api/cron/reminders`.
- Route cron kiểm tra header `Authorization: Bearer $CRON_SECRET`.
- Nếu chưa có `RESEND_API_KEY` và `REMINDER_FROM_EMAIL`, cron sẽ tự bỏ qua email reminder thay vì fail runtime.
- Calendar export là đường nhắc lịch miễn phí mặc định của v1.
- Email reminder gộp theo thành viên và theo cửa sổ nhắc `before_1_day` / `before_2_hours`.
- App chỉ hỗ trợ thị trường Việt Nam trong v1 và có disclaimer rõ ràng trong UI.
