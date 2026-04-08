# Antigravity Full Test Runbook cho Kobe Tracker

## Mục đích

Đây là file điều phối test duy nhất để Antigravity đọc và chạy full test cho dự án Kobe Tracker. File này phải giúp agent biết:

- case nào chạy tự động bằng shell
- case nào bắt buộc chạy manual
- case nào là hybrid
- chạy như thế nào
- dữ liệu đầu vào là gì
- tiêu chuẩn pass của từng case
- fail trông như thế nào

## Bắt buộc đọc trước khi chạy

Antigravity không được chạy runbook này ngay lập tức nếu chưa đọc các file sau:

1. [skill-test.md](/Users/alvin/Desktop/App tiêm chủng/Test Case/skill-test.md)
2. [test-case-kobe-tracker.md](/Users/alvin/Desktop/App tiêm chủng/Test Case/test-case-kobe-tracker.md)
3. [README.md](/Users/alvin/Desktop/App tiêm chủng/README.md)

Yêu cầu tối thiểu trước khi thực thi:

- phải đọc `skill-test.md` trước để hiểu phạm vi QA, loại bug cần bắt, và cách phân loại pass/fail
- phải đọc `test-case-kobe-tracker.md` để hiểu nghiệp vụ gốc của từng case
- phải đọc `README.md` để biết dependency hạ tầng, env và API surface của dự án

Nếu chưa đọc `skill-test.md`, Antigravity phải tự đánh dấu toàn bộ full run là `BLOCKED`.

## Quick Start

Đây là trình tự chạy ngắn gọn mà Antigravity phải làm theo:

### Bước 1: Đọc tài liệu bắt buộc

- đọc [skill-test.md](/Users/alvin/Desktop/App tiêm chủng/Test Case/skill-test.md)
- đọc [test-case-kobe-tracker.md](/Users/alvin/Desktop/App tiêm chủng/Test Case/test-case-kobe-tracker.md)
- đọc [README.md](/Users/alvin/Desktop/App tiêm chủng/README.md)

### Bước 2: Chuẩn bị môi trường runtime

```bash
bash "./Test Case/scripts/00-prepare-runtime.sh"
```

### Bước 3: Chạy preflight tự động

```bash
bash "./Test Case/scripts/01-preflight-home.sh"
bash "./Test Case/scripts/02-build-health.sh"
bash "./Test Case/scripts/03-unauthorized-api.sh"
```

### Bước 4: Làm manual login để lấy session

1. mở app trên browser
2. chạy `AG-MAN-01`
3. chạy `AG-MAN-02`
4. export cookie vào `./Test Case/runtime/auth.cookie`
5. xác minh session:

```bash
bash "./Test Case/scripts/04-check-auth-session.sh"
```

### Bước 5: Chạy toàn bộ auto suite

```bash
bash "./Test Case/scripts/run-auto-suite.sh"
```

### Bước 6: Chạy hybrid và manual cases còn lại

- chạy `AG-HYB-01`
- chạy `AG-HYB-02`
- chạy `AG-MAN-03` đến `AG-MAN-07`

### Bước 7: Kết luận full run

- tổng hợp tất cả file result trong `./Test Case/runtime/logs/`
- áp tiêu chuẩn ở mục `Tiêu chuẩn kết thúc full run`
- kết luận `FULL RUN PASS`, `FAIL`, hoặc `PARTIAL / BLOCKED`

## Quy ước mode thực thi

- `AUTO_SH`: chạy hoàn toàn bằng shell command hoặc script `.sh`
- `MANUAL`: phải thao tác bằng trình duyệt hoặc inbox thật
- `HYBRID`: cần một bước manual để lấy precondition, sau đó phần chính chạy bằng shell

## Quy ước đầu ra bắt buộc

Antigravity phải ghi kết quả cho từng case theo format:

```text
[CASE_ID] STATUS=PASS|FAIL|BLOCKED
mode=<AUTO_SH|MANUAL|HYBRID>
evidence=<đường dẫn log, screenshot, response body, hoặc mô tả ngắn>
reason=<nếu FAIL hoặc BLOCKED thì ghi rõ nguyên nhân>
```

## Quy ước thư mục runtime

Antigravity nên tạo các file tạm sau trong lúc test:

- `./Test Case/runtime/`
- `./Test Case/runtime/logs/`
- `./Test Case/runtime/artifacts/`
- `./Test Case/runtime/auth.cookie`
- `./Test Case/runtime/response.json`

Không commit các file runtime này vào git.

## Preflight bắt buộc

Trước khi chạy test, Antigravity phải xác nhận:

- app đã `build` pass
- app đang chạy ở local hoặc staging
- có `BASE_URL`
- nếu test cron thật thì có `CRON_SECRET`
- nếu test luồng reminder thật thì Supabase + Resend phải được cấu hình

## Biến môi trường chuẩn cho test

Antigravity phải export hoặc inject các biến sau trước khi chạy shell cases:

```bash
export BASE_URL="${BASE_URL:-http://localhost:3000}"
export COOKIE_JAR="${COOKIE_JAR:-./Test Case/runtime/auth.cookie}"
export RUNTIME_DIR="${RUNTIME_DIR:-./Test Case/runtime}"
export LOG_DIR="${LOG_DIR:-./Test Case/runtime/logs}"
export ARTIFACT_DIR="${ARTIFACT_DIR:-./Test Case/runtime/artifacts}"
export CRON_SECRET="${CRON_SECRET:-}"
export USER_A_EMAIL="${USER_A_EMAIL:-qa-user-a@example.com}"
export USER_B_EMAIL="${USER_B_EMAIL:-qa-user-b@example.com}"
mkdir -p "$RUNTIME_DIR" "$LOG_DIR" "$ARTIFACT_DIR"
```

## Quy tắc dùng shell

### 1. Với `AUTO_SH`

Antigravity có thể:

- chạy trực tiếp file `.sh` đã được tạo sẵn trong `./Test Case/scripts/`
- dùng `bash "./Test Case/scripts/<script-name>.sh"`
- hoặc chạy toàn bộ suite bằng `bash "./Test Case/scripts/run-auto-suite.sh"`

### 2. Với `HYBRID`

Antigravity phải:

1. hoàn tất bước manual được mô tả
2. xác minh precondition đã có
3. mới chạy block shell

### 3. Với `MANUAL`

Antigravity phải:

- ghi lại từng bước đã làm
- chụp screenshot nếu có UI
- ghi rõ pass hoặc fail dựa trên tiêu chuẩn trong case

## Điều kiện BLOCKED

Case phải được đánh `BLOCKED` nếu:

- thiếu session hợp lệ cho case cần auth
- thiếu `.env.local` hoặc app chưa cấu hình Supabase
- app chưa chạy
- không có quyền truy cập inbox OTP
- không có CRON secret khi test cron protected

## Chuỗi thực thi khuyến nghị

Antigravity nên chạy theo thứ tự:

1. `bash "./Test Case/scripts/00-prepare-runtime.sh"`
2. `bash "./Test Case/scripts/01-preflight-home.sh"`
3. `bash "./Test Case/scripts/02-build-health.sh"`
4. `bash "./Test Case/scripts/03-unauthorized-api.sh"`
5. `AG-MAN-01` và `AG-MAN-02`
6. `bash "./Test Case/scripts/04-check-auth-session.sh"`
7. `bash "./Test Case/scripts/run-auto-suite.sh"` hoặc chạy từng script `AUTO_SH`
8. `AG-HYB-01`, `AG-HYB-02`
9. `AG-MAN-03` đến `AG-MAN-07`

## Inventory script đã tạo

- `./Test Case/scripts/00-prepare-runtime.sh`
- `./Test Case/scripts/01-preflight-home.sh`
- `./Test Case/scripts/02-build-health.sh`
- `./Test Case/scripts/03-unauthorized-api.sh`
- `./Test Case/scripts/04-check-auth-session.sh`
- `./Test Case/scripts/05-create-child.sh`
- `./Test Case/scripts/06-generate-schedule.sh`
- `./Test Case/scripts/07-regenerate-no-duplicate.sh`
- `./Test Case/scripts/08-get-schedule.sh`
- `./Test Case/scripts/09-create-custom-item.sh`
- `./Test Case/scripts/10-update-item.sh`
- `./Test Case/scripts/11-complete-item.sh`
- `./Test Case/scripts/12-download-calendar.sh`
- `./Test Case/scripts/13-update-reminder-preferences.sh`
- `./Test Case/scripts/14-cron-unauthorized.sh`
- `./Test Case/scripts/15-cron-authorized.sh`
- `./Test Case/scripts/run-auto-suite.sh`

## Cách lấy session cho các case có auth

Kobe Tracker dùng OTP email, nên nhiều shell case cần session cookie hợp lệ.

Antigravity phải dùng cách sau:

1. chạy manual login trong browser
2. sau khi login thành công, export cookie của domain app vào file `./Test Case/runtime/auth.cookie`
3. chỉ khi file cookie tồn tại và request `GET /api/me/children` trả `200`, các shell case cần auth mới được chạy

Nếu không export được cookie jar, toàn bộ shell case cần auth phải đánh `BLOCKED`.

## Test cases chi tiết

---

## AG-PRE-01

- Tên: Kiểm tra app boot được
- Mode: `AUTO_SH`
- Mục tiêu: xác minh app chạy được trước khi test feature

### Cách chạy

```bash
bash "./Test Case/scripts/01-preflight-home.sh"
```

### Pass

- response có status `200`
- HTML trả về có chứa text `Kobe Tracker` hoặc nội dung trang chủ

### Fail

- connection refused
- timeout
- status khác `200`
- HTML lỗi server

---

## AG-PRE-02

- Tên: Health check build artifacts
- Mode: `AUTO_SH`
- Mục tiêu: xác minh app đã build được ở môi trường hiện tại

### Cách chạy

```bash
bash "./Test Case/scripts/02-build-health.sh"
```

### Pass

- cả 3 lệnh exit code `0`

### Fail

- bất kỳ lệnh nào exit code khác `0`
- log có compile error hoặc lint error

---

## AG-PRE-03

- Tên: Unauthorized API khi chưa có session
- Mode: `AUTO_SH`
- Mục tiêu: xác minh API bảo vệ đúng

### Cách chạy

```bash
bash "./Test Case/scripts/03-unauthorized-api.sh"
```

### Pass

- status code là `401`

### Fail

- trả `200`
- lộ dữ liệu children khi chưa login

---

## AG-MAN-01

- Tên: Yêu cầu OTP với email hợp lệ
- Mode: `MANUAL`
- Mục tiêu: xác minh user có thể bắt đầu login flow

### Cách chạy

1. Mở trang chủ
2. Nhập email hợp lệ
3. Nhấn `Gửi mã OTP`

### Pass

- UI chuyển sang bước nhập OTP
- có thông báo đã gửi OTP
- không có lỗi validation

### Fail

- không gửi được OTP
- UI không chuyển bước
- lỗi server xuất hiện

---

## AG-MAN-02

- Tên: Xác thực OTP hợp lệ
- Mode: `MANUAL`
- Mục tiêu: tạo session hợp lệ cho các case sau

### Cách chạy

1. Lấy OTP từ inbox thật
2. Nhập OTP
3. Nhấn `Xác thực và vào app`
4. Export cookie domain app vào `./Test Case/runtime/auth.cookie`
5. Chạy script xác minh session:

```bash
bash "./Test Case/scripts/04-check-auth-session.sh"
```

### Pass

- vào được dashboard
- có session hợp lệ
- shell command bên dưới trả `200`

```bash
curl -sS -b "$COOKIE_JAR" -o "$ARTIFACT_DIR/ag-man-02-verify.json" -w "%{http_code}" "$BASE_URL/api/me/children" | tee "$LOG_DIR/ag-man-02-status.txt"
```

- shell verification trả `200`

### Fail

- OTP đúng nhưng vẫn không login
- không export được cookie
- `GET /api/me/children` không trả `200`

---

## AG-MAN-03

- Tên: Gửi OTP với email không hợp lệ
- Mode: `MANUAL`
- Mục tiêu: xác minh validation đầu vào

### Cách chạy

1. Mở trang login
2. Nhập email sai định dạng
3. Nhấn gửi OTP

### Pass

- có validation error
- không chuyển sang bước nhập OTP

### Fail

- vẫn gửi request hợp lệ
- vẫn vào bước verify

---

## AG-MAN-04

- Tên: Xác thực OTP sai hoặc hết hạn
- Mode: `MANUAL`
- Mục tiêu: xác minh xử lý lỗi auth

### Cách chạy

1. Yêu cầu OTP
2. Nhập OTP sai hoặc đã hết hạn
3. Nhấn xác thực

### Pass

- hiển thị lỗi rõ ràng
- không tạo session

### Fail

- OTP sai nhưng vẫn đăng nhập

---

## AG-AUTO-01

- Tên: Tạo hồ sơ bé đầu tiên
- Mode: `AUTO_SH`
- Precondition: có session hợp lệ trong `COOKIE_JAR`

### Cách chạy

```bash
bash "./Test Case/scripts/05-create-child.sh"
```

### Pass

- response có object `child`
- `child.id` không rỗng

### Fail

- status không phải `200`
- response không có `child.id`

---

## AG-AUTO-02

- Tên: Sinh lịch mẫu từ template
- Mode: `AUTO_SH`
- Precondition:
  - đã chạy `AG-AUTO-01`
  - đã lấy được `child_id`

### Cách chạy

Script tự đọc `CHILD_ID` từ env hoặc file runtime do case trước tạo:

```bash
bash "./Test Case/scripts/06-generate-schedule.sh"
```

### Pass

- response có field `created`
- giá trị `created` lớn hơn `0`

### Fail

- không sinh được lịch
- response báo lỗi template hoặc auth

---

## AG-AUTO-03

- Tên: Không tạo trùng lịch mẫu
- Mode: `AUTO_SH`
- Precondition: đã có `CHILD_ID`

### Cách chạy

```bash
bash "./Test Case/scripts/07-regenerate-no-duplicate.sh"
```

### Pass

- tổng số item sau khi regenerate không tăng bất thường
- không có duplicate template item

### Fail

- số lượng item bị nhân đôi

---

## AG-AUTO-04

- Tên: Đọc timeline lịch tiêm
- Mode: `AUTO_SH`
- Precondition: đã có `CHILD_ID`

### Cách chạy

```bash
bash "./Test Case/scripts/08-get-schedule.sh"
```

### Pass

- response có mảng `items`
- ít nhất một item có `status = planned`

### Fail

- response lỗi
- không có `items`

---

## AG-AUTO-05

- Tên: Thêm mũi custom
- Mode: `AUTO_SH`
- Precondition: đã có `CHILD_ID`

### Cách chạy

```bash
bash "./Test Case/scripts/09-create-custom-item.sh"
```

### Pass

- response có `item`
- `item.template_source = custom`

### Fail

- không tạo được item
- `template_source` không đúng

---

## AG-AUTO-06

- Tên: Cập nhật mũi tiêm
- Mode: `AUTO_SH`
- Precondition:
  - có `SCHEDULE_ITEM_ID`
  - item thuộc user đang login

### Cách chạy

```bash
bash "./Test Case/scripts/10-update-item.sh"
```

### Pass

- response có `item`
- dữ liệu trả về phản ánh đúng thay đổi

### Fail

- patch không lưu
- dữ liệu trả về không đúng

---

## AG-AUTO-07

- Tên: Đánh dấu đã tiêm
- Mode: `AUTO_SH`
- Precondition: có `SCHEDULE_ITEM_ID`

### Cách chạy

```bash
bash "./Test Case/scripts/11-complete-item.sh"
```

### Pass

- response có `item.status = completed`
- `completed_at` không rỗng

### Fail

- status không đổi
- không có `completed_at`

---

## AG-AUTO-08

- Tên: Tải file `.ics`
- Mode: `AUTO_SH`
- Precondition: đã có `CHILD_ID`

### Cách chạy

```bash
bash "./Test Case/scripts/12-download-calendar.sh"
```

### Pass

- response header có `Content-Type: text/calendar`
- file output chứa `BEGIN:VCALENDAR`
- file output chứa ít nhất một `BEGIN:VEVENT`

### Fail

- tải không thành công
- file không đúng định dạng ICS

---

## AG-AUTO-09

- Tên: Lưu cài đặt reminder
- Mode: `AUTO_SH`
- Precondition: đã có `CHILD_ID`

### Cách chạy

```bash
bash "./Test Case/scripts/13-update-reminder-preferences.sh"
```

### Pass

- response có `reminderPreferences`
- giá trị đã lưu đúng với request

### Fail

- không lưu được preference
- response thiếu object cập nhật

---

## AG-AUTO-10

- Tên: Cron unauthorized khi thiếu secret
- Mode: `AUTO_SH`
- Mục tiêu: xác minh cron route không mở sai cách khi có secret

### Cách chạy

```bash
bash "./Test Case/scripts/14-cron-unauthorized.sh"
```

### Pass

- nếu môi trường có `CRON_SECRET`, status phải là `401`
- nếu môi trường không set `CRON_SECRET`, case này được ghi `PASS (NOT_PROTECTED_BY_CONFIG)` hoặc `BLOCKED` tùy policy test

### Fail

- route protected nhưng vẫn trả `200` khi không có auth header

---

## AG-AUTO-11

- Tên: Cron authorized
- Mode: `AUTO_SH`
- Precondition:
  - có `CRON_SECRET`
  - môi trường có cấu hình Supabase service role
  - có dữ liệu reminder đến hạn hoặc chấp nhận kết quả `sentGroups = 0`

### Cách chạy

```bash
bash "./Test Case/scripts/15-cron-authorized.sh"
```

### Pass

- response có `ok = true`
- response chứa `inspectedChildren`
- nếu có dữ liệu đến hạn thì có `sentGroups >= 1`

### Fail

- status khác `200`
- cron route crash
- response không có `ok`

---

## AG-HYB-01

- Tên: Xác minh email reminder thật
- Mode: `HYBRID`
- Precondition:
  - `AG-AUTO-11` đã chạy
  - có reminder đến hạn
  - tester có quyền xem inbox của `reminder_email`

### Cách chạy

1. Dùng shell chạy cron authorized
2. Mở inbox của email nhận nhắc
3. Tìm email vừa gửi

### Pass

- inbox nhận được email
- subject có tên bé
- body có tên vaccine, ngày giờ và chi phí dự kiến

### Fail

- delivery log báo sent nhưng inbox không có mail
- nội dung mail sai bé hoặc sai mũi

---

## AG-HYB-02

- Tên: Kiểm tra không gửi trùng reminder
- Mode: `HYBRID`
- Precondition:
  - đã có một reminder vừa gửi
  - có quyền xem DB hoặc log delivery

### Cách chạy

1. Gọi cron authorized lần 1
2. Gọi cron authorized lần 2 trong cùng cửa sổ nhắc
3. So sánh số lượng delivery hoặc inbox

### Pass

- không có email duplicate cho cùng `child_vaccine_item_id + reminder_key`
- số lượng delivery không tăng trùng

### Fail

- có nhiều email giống nhau cho cùng một nhắc

---

## AG-MAN-05

- Tên: Chuyển giữa nhiều hồ sơ bé trên UI
- Mode: `MANUAL`
- Precondition: tài khoản có ít nhất 2 bé

### Cách chạy

1. Login
2. Chọn bé A
3. Ghi nhận timeline
4. Chọn bé B
5. Ghi nhận timeline và form reminder

### Pass

- dữ liệu đổi đúng theo bé được chọn
- form reminder không giữ nhầm state từ bé trước
- link `.ics` tải theo đúng bé đang chọn

### Fail

- timeline không đổi
- reminder form giữ state sai
- dữ liệu lẫn giữa hai bé

---

## AG-MAN-06

- Tên: Validate thông báo lỗi khi nhập dữ liệu sai trên form custom
- Mode: `MANUAL`
- Precondition: đã login

### Cách chạy

1. Mở form thêm mũi custom
2. Bỏ trống các field bắt buộc
3. Submit

### Pass

- form không submit thành công
- có validation hoặc lỗi rõ ràng

### Fail

- tạo item dù thiếu field bắt buộc

---

## AG-MAN-07

- Tên: Kiểm tra disclaimer y khoa
- Mode: `MANUAL`
- Mục tiêu: xác minh UI có cảnh báo đúng phạm vi sử dụng

### Cách chạy

1. Login
2. Mở dashboard
3. Tìm khối disclaimer

### Pass

- có cảnh báo rằng lịch mẫu chỉ mang tính tham khảo
- có nhắc cần bác sĩ xác nhận trước khi tiêm

### Fail

- không có disclaimer
- disclaimer sai ý nghĩa sản phẩm

## Tiêu chuẩn kết thúc full run

Antigravity chỉ được kết luận `FULL RUN PASS` khi:

- tất cả case `AUTO_SH` không bị fail
- tất cả case `MANUAL` critical không bị fail
- không có case security nào fail
- không có case auth nào fail
- không có duplicate reminder trong case anti-dup

## Điều kiện kết luận FAIL toàn bộ

Full run phải kết luận `FAIL` nếu xảy ra một trong các điểm sau:

- login OTP không dùng được
- unauthorized API bị bypass
- user A đọc hoặc sửa được dữ liệu user B
- generate template bị duplicate
- complete item không cập nhật trạng thái
- calendar export không ra file hợp lệ
- cron route crash hoặc gửi reminder trùng

## Điều kiện kết luận PARTIAL / BLOCKED

Antigravity có thể kết luận `PARTIAL` hoặc `BLOCKED` nếu:

- code pass nhưng thiếu hạ tầng như OTP inbox, Supabase, Resend
- shell cases chạy được nhưng reminder thật không test được do thiếu provider config
- manual cases cần browser/inbox nhưng môi trường test không có

Trong trường hợp đó phải ghi rõ:

- case nào bị block
- block vì thiếu gì
- nếu bổ sung gì thì có thể chạy tiếp
