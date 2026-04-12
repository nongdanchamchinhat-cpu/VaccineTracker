# Skill Test QA cho Kobe Tracker

## Mục đích

Tài liệu này mô tả bộ kỹ năng kiểm thử tối thiểu cho người test hoặc QA khi làm việc với dự án Kobe Tracker. Mục tiêu là bảo đảm người test không chỉ “bấm thử”, mà có thể kiểm tra đúng các luồng nghiệp vụ, dữ liệu và rủi ro production của một ứng dụng web nhiều người dùng.

## Phạm vi kỹ năng cần có

### 1. Hiểu sản phẩm

Tester cần nắm được các khối nghiệp vụ chính:

- Đăng nhập bằng OTP email qua Supabase Auth
- Quản lý nhiều hồ sơ bé trên cùng một tài khoản
- Sinh lịch tiêm từ template `vn_default_v1`
- Theo dõi timeline lịch tiêm với các trạng thái `planned`, `completed`, `skipped`
- Thêm mũi tiêm custom ngoài lịch mẫu
- Cập nhật chi phí dự kiến và chi phí thực tế
- Tải file `.ics` cho từng hồ sơ bé
- Gửi email reminder qua cron + Resend

### 2. Kỹ năng kiểm thử giao diện

Tester phải có khả năng:

- Kiểm tra UI trên desktop và mobile
- Kiểm tra trạng thái loading, success, error
- Kiểm tra form validation
- Kiểm tra filter, tìm kiếm và cập nhật dữ liệu sau thao tác
- Quan sát sự nhất quán giữa UI và dữ liệu backend

### 3. Kỹ năng kiểm thử API

Tester phải đọc và test được các API chính:

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

Tester cần biết:

- phân biệt request hợp lệ và không hợp lệ
- xác minh HTTP status code
- kiểm tra response body
- kiểm tra lỗi xác thực và lỗi phân quyền

### 4. Kỹ năng kiểm thử dữ liệu

Tester cần hiểu quan hệ giữa các bảng:

- `profiles`
- `children`
- `vaccine_templates`
- `child_vaccine_items`
- `reminder_preferences`
- `notification_deliveries`

Tester cần kiểm tra được:

- dữ liệu có được tạo đúng sau mỗi action
- lịch mẫu có sinh đúng theo ngày sinh
- một tài khoản không xem/sửa được dữ liệu của tài khoản khác
- log gửi reminder có chống trùng

### 5. Kỹ năng kiểm thử reminder và job nền

Tester cần xác minh:

- cron chạy đúng endpoint
- email chỉ gửi khi đến cửa sổ nhắc
- không gửi lại cùng một reminder đã claim
- email hiển thị đúng tên bé, mũi tiêm, thời gian và chi phí
- trường hợp lỗi gửi mail được ghi log trạng thái `failed`

## Checklist năng lực tối thiểu

Người test đạt yêu cầu khi có thể tự thực hiện:

- Tạo user mới bằng OTP và đăng nhập thành công
- Tạo hồ sơ bé mới và sinh lịch từ template
- Cập nhật 1 mũi thành `completed`
- Cập nhật 1 mũi thành `skipped`
- Tạo 1 mũi custom
- Tải file `.ics` và kiểm tra nội dung cơ bản
- Chỉnh cài đặt reminder email
- Gọi cron reminder và kiểm tra delivery log
- Kiểm tra lỗi unauthorized khi gọi API không có session
- Kiểm tra dữ liệu của user A không lộ sang user B

## Tiêu chí đánh giá tester

### Mức cơ bản

- Chạy được test theo checklist
- Ghi lại bug có bước tái hiện rõ ràng
- Phân biệt bug UI, bug API và bug dữ liệu

### Mức khá

- Chủ động kiểm thử edge cases
- Kiểm tra được response bất thường
- Đối chiếu dữ liệu DB với hành vi UI

### Mức tốt

- Phát hiện được lỗi logic nghiệp vụ
- Phát hiện được rủi ro production như gửi mail trùng, sai phân quyền, sai timezone
- Viết được test case rõ, có precondition, step, expected result

## Nguyên tắc khi test dự án này

- Không coi “build pass” là đủ
- Luôn test cả happy path và unhappy path
- Luôn kiểm tra dữ liệu sau thao tác quan trọng
- Ưu tiên test các điểm rủi ro cao: auth, phân quyền, reminder, lịch mẫu, cron
- Với bug production, phải ghi rõ mức độ ảnh hưởng và dữ liệu liên quan

## Kết luận

Skill test cho Kobe Tracker không chỉ là kiểm tra giao diện. Người test phải đủ khả năng kiểm tra luồng xác thực, dữ liệu nhiều người dùng, reminder nền và tính toàn vẹn của lịch tiêm trong môi trường production.
