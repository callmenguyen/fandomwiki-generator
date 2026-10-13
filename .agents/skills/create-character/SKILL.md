---
name: create-character
description: Tạo hoặc cập nhật nhân vật trong Fandom Wiki Generator từ mô tả của người dùng, viết YAML đúng schema và kiểm tra liên kết với vũ trụ, bộ truyện, sự kiện hiện có. Dùng khi người dùng muốn thêm hoặc sửa nhân vật trong repository này.
---

# Tạo nhân vật cho Fandom Wiki

Tạo hoặc cập nhật file YAML có thể build thành trang wiki. Giữ ngôn ngữ, bối cảnh và phạm vi sáng tác mà người dùng yêu cầu.

## Đọc nguồn trước khi viết

Từ root repository, đọc:

- `src/content.js`: schema và quy tắc validation hiện tại; đây là nguồn quyết định trường được hỗ trợ.
- [GUIDE.md](../../../GUIDE.md) và [docs/ContentGuide.md](../../../docs/ContentGuide.md): cách viết YAML, ảnh và liên kết.
- YAML của vũ trụ, bộ truyện, nhân vật/sự kiện được nhắc đến trong `content/`. Có thể tìm bằng `rg`; tham chiếu dùng trường `id`, không suy từ tên file.
- `package.json`: các lệnh thực tế để validate, build và sinh README.

Không cần đọc toàn bộ wiki nếu chỉ vài bài liên quan đủ xác định bối cảnh.

## Chọn dữ liệu và phạm vi

- Dùng tên, vai trò, quan hệ và chi tiết được cung cấp. Chỉ sáng tác thêm khi yêu cầu cho phép; nếu người dùng muốn bám nguồn, bỏ qua chi tiết chưa biết thay vì biến chúng thành sự thật trong canon.
- Khi thiếu vũ trụ/bộ truyện và không thể suy ra từ yêu cầu, hỏi phần cần xác định, kèm ID có sẵn phù hợp. Có thể chuẩn bị nội dung không phụ thuộc câu trả lời trước.
- Chỉ tạo bài vũ trụ/bộ truyện/sự kiện phụ khi thuộc yêu cầu. Không tạo placeholder chỉ để làm validation xanh.
- Nếu cập nhật nhân vật, giữ ID/type và thông tin không được yêu cầu thay đổi. Nếu tạo mới, kiểm tra ID chưa tồn tại trên toàn wiki; không ghi đè nhân vật khác.
- ID dùng chữ thường ASCII, số và dấu `-`; chuyển tên tiếng Việt sang slug phù hợp, tránh `index`.

## Viết YAML

Đặt nhân vật mới tại `content/characters/<id>.yml`, hoặc giữ file hiện tại nếu đang cập nhật:

- Trường cơ bản: `id`, `type: character`, `name`, `summary`, `universe`.
- `series` là danh sách ID bộ truyện cùng vũ trụ; có thể bỏ nếu không thuộc bộ truyện.
- Dùng `facts` cho thuộc tính riêng (chuỗi/số/boolean), không thêm key không có trong schema.
- Dùng `sections` với `title` và `body` cho nội dung dài. Chọn các mục hợp với thông tin hiện có, chẳng hạn tiểu sử, tính cách, năng lực, vai trò, quan hệ.
- `summary`, tên và facts là văn bản thuần. Chỉ dùng Markdown và `[[id]]` / `[[id|nhãn]]` trong section body.
- `related` chỉ trỏ đến ID hiện có. Backlinks tự sinh, không viết vào YAML. Không đặt `participants` trên character.
- Chỉ thêm `image` nếu có ảnh/URL thực tế được cung cấp. Ảnh local nằm trong `public/assets/`, dùng `/assets/<file>` và không ghi base path Pages.
- Viết chuỗi có ký tự đặc biệt bằng quoting hợp lệ; dùng block scalar `|` cho Markdown nhiều dòng. Không chèn HTML thô hoặc thông tin bí mật.

Không đổi schema, template website hay CI chỉ để thêm một nhân vật.

## Kiểm tra và bàn giao

Khi có môi trường chạy repository:

1. Chạy `npm run validate`, sửa lỗi YAML/tham chiếu trong phạm vi thay đổi.
2. Chạy `npm run build`; không sửa hoặc commit output `dist/`.
3. Chạy `npm run docs:generate` để README phản ánh nội dung mới; sửa lời mô tả tại template nếu yêu cầu liên quan, không sửa README sinh ra trực tiếp.
4. Rà soát diff và báo file, ID/URL nhân vật, các chi tiết đã sáng tác nếu có, cùng kết quả lệnh đã chạy.

Nếu thiếu dependency, dùng lệnh cài đặt đã được repo quy định và tuân thủ quyền thực thi của môi trường. Nếu chỉ có chat hoặc không chạy được lệnh, trả YAML/đường dẫn và ghi rõ kiểm tra chưa được thực thi; không tuyên bố đã validate.

Chỉ commit/push hoặc xuất bản khi yêu cầu hay quyền đã có trong phiên bao gồm hành động đó. Việc dùng skill không tự cấp quyền xuất bản.
