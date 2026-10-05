# Bongmao Thiệp cưới

Công cụ tạo **thiệp cưới** và **thiệp mời dự lễ tốt nghiệp** online, miễn phí. Chỉ là trang web tĩnh (HTML), không cần máy chủ hay cơ sở dữ liệu.

## Cấu trúc

| File / thư mục | Dùng để |
|---|---|
| `index.html` | Toàn bộ công cụ: soạn thiệp, các mẫu, và trang khách xem |
| `netlify/functions/` | Hai hàm nhỏ lưu thiệp và ảnh lên Netlify Blobs (miễn phí, không cần cài gì) |
| `package.json` | Khai báo thư viện `@netlify/blobs` cho hai hàm trên |
| `music/` | Nhạc nền có sẵn (Public domain / CC BY, xem `music/CREDITS.txt`) |
| `seg/` | Bộ tách người khỏi nền chạy ngay trên trình duyệt (Apache 2.0) |
| `netlify.toml` | Cấu hình đăng lên Netlify |

## Cách dùng

1. Mở trang `https://<trang-cua-ban>.netlify.app`, soạn thiệp cưới hoặc thiệp tốt nghiệp.
2. Tab **Gửi khách** › bấm **Lưu & lấy link gửi khách**. Thiệp được lưu lên mạng (Netlify Blobs) và có ngay link dạng `…/?t=abc123`, không cần tải hay đăng file nào.
3. Gửi link cho khách, hoặc sao chép lời mời riêng cho từng người (link có tên khách). Khách có nút **chia sẻ** để gửi tiếp cho người khác.
4. Sửa thiệp rồi bấm lưu lần nữa, link giữ nguyên. Muốn sửa trên máy khác, dùng nút **Sao chép link chỉnh sửa** (đừng gửi link này cho khách).

Mỗi người mở trang chủ đều tạo được thiệp riêng của mình; quyền sửa thiệp nằm ở mã bí mật lưu trong trình duyệt của người tạo.

## Lưu ý về Netlify (gói miễn phí)

Lưu thiệp và khách mở thiệp **không** cần đăng lại trang. Chỉ khi cập nhật mã nguồn (thêm mẫu mới) Netlify mới đăng lại một lần, trừ khoảng 15 trên 300 điểm miễn phí mỗi tháng. Lượt mở thiệp và tải ảnh cũng tính một ít điểm theo dung lượng, thiệp cá nhân thường dùng rất ít.
