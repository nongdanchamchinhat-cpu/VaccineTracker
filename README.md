# Kobe Tracker

Kobe Tracker đã được nâng từ prototype HTML sang một ứng dụng Next.js multi-user cho phụ huynh Việt Nam.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Supabase Auth (OTP email) + Postgres
- Calendar reminder miễn phí qua `.ics`
- Resend cho email reminder server-side khi cần public rộng
- Vercel Cron cho job quét reminder mỗi 15 phút
- Sentry cho runtime/error monitoring

## Tính năng đã implement

- Đăng nhập bằng OTP email
- Tạo nhiều hồ sơ bé trên cùng một tài khoản
- Khởi tạo lịch từ bộ template `vn_default_v1`
- Timeline lịch tiêm với filter `Tất cả / Cần tiêm / Đã tiêm`
- Mark complete, skip, cập nhật chi phí thực tế
- Thêm mũi custom ngoài lịch mẫu
- Export file `.ics` theo từng bé với nhắc `trước 1 ngày` và `trước 2 giờ`
- Link thêm nhanh từng mũi vào Google Calendar
- Lưu cài đặt reminder theo từng hồ sơ bé
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
4. Chạy migration SQL trong [supabase/migrations/0001_init.sql](/Users/alvin/Desktop/App tiêm chủng/supabase/migrations/0001_init.sql).
5. Cấu hình Supabase email template để gửi OTP.

## Chạy local

```bash
env PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin npm run dev
```

## API chính

- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/logout`
- `GET /api/me/children`
- `PATCH /api/me/reminder-preferences`
- `POST /api/children`
- `GET /api/children/:id/schedule`
- `POST /api/children/:id/schedule/from-template`
- `GET /api/children/:id/calendar.ics`
- `POST /api/schedule-items`
- `PATCH /api/schedule-items/:id`
- `POST /api/schedule-items/:id/complete`
- `GET /api/cron/reminders`

## Notes triển khai

- `vercel.json` đã cấu hình cron 15 phút cho `/api/cron/reminders`.
- Route cron kiểm tra header `Authorization: Bearer $CRON_SECRET`.
- Nếu chưa có `RESEND_API_KEY` và `REMINDER_FROM_EMAIL`, cron sẽ tự bỏ qua email reminder thay vì fail runtime.
- Calendar export là đường nhắc lịch miễn phí mặc định của v1.
- Email reminder gộp theo bé và theo cửa sổ nhắc `before_1_day` / `before_2_hours`.
- App chỉ hỗ trợ thị trường Việt Nam trong v1 và có disclaimer rõ ràng trong UI.
