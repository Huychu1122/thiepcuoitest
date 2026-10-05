# Bongmao Thiệp cưới

Công cụ tạo **thiệp cưới** và **thiệp mời dự lễ tốt nghiệp** online, miễn phí. Chỉ là trang web tĩnh (HTML), không cần máy chủ hay cơ sở dữ liệu.

## Cấu trúc

| File / thư mục | Dùng để |
|---|---|
| `index.html` | Toàn bộ công cụ: soạn thiệp, các mẫu, và trang khách xem |
| `thiep.json` | Thiệp bạn đã lưu (khi có file này, ai mở link sẽ thấy thiệp) |
| `music/` | Nhạc nền có sẵn (Public domain / CC BY, xem `music/CREDITS.txt`) |
| `seg/` | Bộ tách người khỏi nền chạy ngay trên trình duyệt (Apache 2.0) |
| `netlify.toml` | Cấu hình đăng lên Netlify |

## Cách dùng

1. **Soạn thiệp:** mở `https://<trang-cua-ban>.netlify.app/#sua` (thêm `#sua` vào cuối link để vào chế độ chỉnh sửa).
2. **Lưu thiệp:** tab *Gửi khách* › bấm **Lưu thiệp** → trình duyệt tải về file `thiep.json`.
3. **Đăng thiệp:** trên GitHub, vào repo này › *Add file* › *Upload files* › kéo `thiep.json` vào (thay file cũ) › *Commit changes*. Netlify tự cập nhật sau khoảng 1 phút.
4. **Gửi khách:** link gốc `https://<trang-cua-ban>.netlify.app` là thiệp. Link riêng từng khách lấy ở tab *Gửi khách* (dạng `…/#to-…` cho thiệp cưới, `…/#tn-…` cho thiệp tốt nghiệp).

## Lưu ý về Netlify (gói miễn phí)

Mỗi lần GitHub có commit mới, Netlify đăng lại một lần và trừ khoảng 15 trên 300 điểm miễn phí mỗi tháng. Nên soạn và xem thử thoải mái ở chế độ `#sua` (không tốn gì), xong hẳn mới tải `thiep.json` lên một lần.
