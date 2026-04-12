# Test Case cho dự án Kobe Tracker

## Thông tin chung

- Dự án: Kobe Tracker
- Loại ứng dụng: Web app nhiều người dùng
- Stack chính: Next.js, Supabase Auth, Postgres, Resend, Vercel Cron
- Mục tiêu test: xác minh các luồng chính của phụ huynh khi dùng ứng dụng theo dõi lịch tiêm

## Tiền điều kiện

- Đã cấu hình `.env.local`
- Đã chạy migration Supabase
- Đã có môi trường Supabase hoạt động
- Đã cấu hình OTP email
- Đã cấu hình Resend và cron endpoint
- App chạy được ở local hoặc staging

## Test cases

### TC-01: Gửi OTP với email hợp lệ

- Mục tiêu: xác minh người dùng có thể yêu cầu OTP
- Precondition: chưa đăng nhập
- Steps:
  1. Mở trang chủ
  2. Nhập email hợp lệ
  3. Nhấn `Gửi mã OTP`
- Expected result:
  - API `POST /api/auth/request-otp` trả về thành công
  - UI chuyển sang bước nhập mã xác thực
  - Hiển thị thông báo đã gửi OTP

### TC-02: Gửi OTP với email không hợp lệ

- Mục tiêu: xác minh validate đầu vào
- Precondition: chưa đăng nhập
- Steps:
  1. Mở trang chủ
  2. Nhập email sai định dạng
  3. Nhấn `Gửi mã OTP`
- Expected result:
  - Request bị chặn ở client hoặc server
  - Hiển thị lỗi rõ ràng
  - Không chuyển sang bước verify

### TC-03: Verify OTP hợp lệ

- Mục tiêu: xác minh đăng nhập thành công
- Precondition: đã yêu cầu OTP thành công
- Steps:
  1. Nhập OTP đúng
  2. Nhấn `Xác thực và vào app`
- Expected result:
  - Đăng nhập thành công
  - Session được tạo
  - Vào dashboard

### TC-04: Verify OTP không hợp lệ

- Mục tiêu: xác minh xử lý sai OTP
- Precondition: đã yêu cầu OTP
- Steps:
  1. Nhập OTP sai hoặc hết hạn
  2. Nhấn xác thực
- Expected result:
  - API trả lỗi phù hợp
  - UI hiển thị lỗi
  - Không đăng nhập

### TC-05: Tạo hồ sơ bé đầu tiên

- Mục tiêu: xác minh onboarding hồ sơ bé
- Precondition: user đã đăng nhập và chưa có hồ sơ bé
- Steps:
  1. Nhập tên bé
  2. Chọn ngày sinh
  3. Chọn giới tính hoặc để trống
  4. Nhấn `Tạo hồ sơ và sinh lịch mẫu`
- Expected result:
  - Tạo record trong bảng `children`
  - Tạo record mặc định trong `reminder_preferences`
  - Sinh lịch từ template vào `child_vaccine_items`
  - Dashboard hiển thị timeline của bé vừa tạo

### TC-06: Không tạo trùng lịch mẫu khi khởi tạo lại

- Mục tiêu: xác minh tránh duplicate schedule
- Precondition: bé đã được generate lịch mẫu
- Steps:
  1. Gọi lại endpoint `POST /api/children/:id/schedule/from-template`
- Expected result:
  - Không tạo duplicate cho các mũi template đã có
  - Tổng số mũi template không tăng bất thường

### TC-07: Hiển thị timeline đúng dữ liệu

- Mục tiêu: xác minh lịch hiển thị đúng
- Precondition: đã có ít nhất 1 hồ sơ bé với lịch mẫu
- Steps:
  1. Mở dashboard
  2. Kiểm tra danh sách mũi
- Expected result:
  - Hiển thị đúng tên vaccine, bệnh, mốc, ngày hẹn
  - Trạng thái mặc định là `planned`
  - Số lượng mũi đúng với dữ liệu đã seed

### TC-08: Filter `Cần tiêm`

- Mục tiêu: xác minh filter planned
- Precondition: có ít nhất 1 mũi `completed`
- Steps:
  1. Chọn tab `Cần tiêm`
- Expected result:
  - Chỉ hiển thị các mũi có trạng thái `planned`

### TC-09: Filter `Đã tiêm`

- Mục tiêu: xác minh filter completed
- Precondition: có ít nhất 1 mũi `completed`
- Steps:
  1. Chọn tab `Đã tiêm`
- Expected result:
  - Chỉ hiển thị các mũi `completed`

### TC-10: Tìm kiếm theo tên vaccine

- Mục tiêu: xác minh search hoạt động
- Precondition: có dữ liệu lịch
- Steps:
  1. Nhập một phần tên vaccine vào ô tìm kiếm
- Expected result:
  - Chỉ hiển thị các item khớp

### TC-11: Đánh dấu mũi đã tiêm

- Mục tiêu: xác minh complete flow
- Precondition: có mũi `planned`
- Steps:
  1. Nhấn `Đã tiêm` trên một item
- Expected result:
  - API `POST /api/schedule-items/:id/complete` thành công
  - Trạng thái item đổi sang `completed`
  - `completed_at` được ghi nhận
  - Tiến độ dashboard tăng lên

### TC-12: Sửa chi phí thực tế và trạng thái

- Mục tiêu: xác minh chỉnh sửa item
- Precondition: có item bất kỳ
- Steps:
  1. Nhấn `Sửa chi tiết`
  2. Sửa ngày hẹn, chi phí, notes hoặc status
  3. Nhấn lưu
- Expected result:
  - API `PATCH /api/schedule-items/:id` thành công
  - UI cập nhật đúng dữ liệu mới
  - Nếu chọn `completed`, có thời điểm hoàn thành

### TC-13: Chuyển trạng thái sang `skipped`

- Mục tiêu: xác minh bỏ qua mũi
- Precondition: có item `planned`
- Steps:
  1. Mở form sửa
  2. Đổi status thành `skipped`
  3. Lưu
- Expected result:
  - Item chuyển sang `skipped`
  - Item không còn nằm trong tab `Cần tiêm`

### TC-14: Tạo mũi custom

- Mục tiêu: xác minh thêm mũi ngoài template
- Precondition: đã có hồ sơ bé
- Steps:
  1. Mở form `Thêm mũi`
  2. Nhập đầy đủ thông tin
  3. Lưu
- Expected result:
  - Tạo record mới trong `child_vaccine_items`
  - `template_source = custom`
  - Mũi mới hiển thị trên dashboard

### TC-15: Tải file `.ics`

- Mục tiêu: xác minh calendar export
- Precondition: đã có ít nhất 1 mũi
- Steps:
  1. Nhấn `Tải file Calendar (.ics)`
- Expected result:
  - Tải được file `.ics`
  - File chứa thông tin của đúng hồ sơ bé đang chọn
  - Có event và alarm nhắc lịch

### TC-16: Lưu cài đặt reminder

- Mục tiêu: xác minh cấu hình email reminder
- Precondition: đã có hồ sơ bé
- Steps:
  1. Sửa email nhận nhắc
  2. Bật hoặc tắt `Nhắc trước 1 ngày`
  3. Bật hoặc tắt `Nhắc trước 2 giờ`
  4. Nhấn lưu
- Expected result:
  - API `PATCH /api/me/reminder-preferences` thành công
  - Bảng `reminder_preferences` được cập nhật đúng

### TC-17: Cron gửi reminder đúng cửa sổ nhắc

- Mục tiêu: xác minh job nền hoạt động đúng
- Precondition:
  - Có item `planned`
  - Thời gian item rơi vào cửa sổ nhắc
  - `reminder_preferences.email_enabled = true`
- Steps:
  1. Gọi `GET /api/cron/reminders` với cron secret hợp lệ
- Expected result:
  - Email được gửi qua Resend
  - `notification_deliveries` ghi trạng thái `sent`
  - Không gửi cho item ngoài cửa sổ nhắc

### TC-18: Không gửi trùng reminder

- Mục tiêu: xác minh cơ chế chống duplicate
- Precondition: một reminder vừa được gửi thành công
- Steps:
  1. Gọi lại cron trong cùng cửa sổ nhắc
- Expected result:
  - Không tạo thêm delivery trùng cho cùng `child_vaccine_item_id + channel + reminder_key`

### TC-19: Xử lý lỗi gửi email

- Mục tiêu: xác minh khi Resend lỗi
- Precondition: mock hoặc làm Resend trả lỗi
- Steps:
  1. Gọi cron reminder
- Expected result:
  - `notification_deliveries.status = failed`
  - Có `error_message`
  - Không crash toàn bộ cron job

### TC-20: Phân quyền dữ liệu giữa 2 user

- Mục tiêu: xác minh security
- Precondition:
  - Có user A và user B
  - User A đã có hồ sơ bé
- Steps:
  1. Đăng nhập bằng user B
  2. Cố truy cập schedule hoặc calendar của bé thuộc user A
- Expected result:
  - Không đọc hoặc sửa được dữ liệu của user A
  - API trả lỗi phù hợp hoặc không tìm thấy dữ liệu

### TC-21: API bị từ chối khi chưa đăng nhập

- Mục tiêu: xác minh bắt buộc xác thực
- Precondition: chưa có session
- Steps:
  1. Gọi trực tiếp các API nội bộ như `/api/children`, `/api/schedule-items`
- Expected result:
  - Trả `401 Unauthorized`

### TC-22: Chuyển giữa nhiều hồ sơ bé

- Mục tiêu: xác minh multi-child flow
- Precondition: cùng một tài khoản có từ 2 bé trở lên
- Steps:
  1. Chọn bé A
  2. Kiểm tra lịch và reminder
  3. Chuyển sang bé B
- Expected result:
  - Dashboard đổi đúng dữ liệu theo bé
  - Reminder form không giữ nhầm state của bé trước
  - File `.ics` tải đúng theo bé đang chọn

## Mức độ ưu tiên nên test trước

- P0:
  - OTP login
  - Tạo hồ sơ bé
  - Sinh lịch mẫu
  - Đánh dấu đã tiêm
  - Phân quyền dữ liệu
- P1:
  - Thêm mũi custom
  - Update item
  - Reminder preferences
  - Calendar export
- P2:
  - Error handling của cron
  - UI/UX edge cases

## Kết quả mong đợi khi release

Ứng dụng đạt yêu cầu release khi:

- Người dùng mới có thể đăng nhập bằng OTP
- Có thể tạo hồ sơ bé và thấy lịch mẫu ngay
- Có thể quản lý trạng thái mũi tiêm và chi phí
- Có thể tải lịch `.ics`
- Reminder gửi đúng và không gửi trùng
- Không có lỗi lộ dữ liệu giữa các user
