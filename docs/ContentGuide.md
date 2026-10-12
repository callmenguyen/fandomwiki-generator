# Hướng dẫn YAML

## Cấu hình wiki

```yaml
name: Fandom Wiki
description: Thư viện các thế giới truyện của tôi.
language: vi
basePath: ""
```

`name` bắt buộc. `description`, `language` và `basePath` có giá trị mặc định. `BASE_PATH` trong môi trường build ưu tiên hơn `site.yml`; dùng chuỗi rỗng cho domain gốc, `/ten-repository` cho project Pages. Không dùng URL đầy đủ hay `..`.

Giao diện hiện dùng tiếng Việt. `language` thiết lập ngôn ngữ tài liệu HTML và sắp xếp tên, không dịch các nhãn giao diện.

## Các trường bài viết

| Trường | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `id` | Chuỗi bắt buộc | ID toàn cục: chữ thường ASCII, số và dấu `-`; không dùng `index` |
| `type` | Chuỗi bắt buộc | `universe`, `series`, `character`, `event` |
| `name` | Chuỗi bắt buộc | Tên hiển thị, hỗ trợ Unicode |
| `summary` | Chuỗi bắt buộc | Mô tả ngắn dạng văn bản thuần |
| `universe` | ID | Bắt buộc cho series/character/event; không được đặt trên universe |
| `series` | Danh sách ID | Các bộ truyện của bài, cùng vũ trụ với bài |
| `participants` | Danh sách ID | Chỉ dùng trên event, trỏ đến character |
| `related` | Danh sách ID | Liên kết tới bất kỳ loại bài, kể cả vũ trụ khác |
| `aliases` | Danh sách chuỗi | Tên khác dùng trong infobox và tìm kiếm |
| `tags` | Danh sách chuỗi | Nhãn hiển thị và tìm kiếm |
| `facts` | Mapping | Khóa là nhãn; giá trị chuỗi, số hoặc boolean |
| `sections` | Danh sách | Mỗi mục có `title` và `body` Markdown |
| `date` | Chuỗi | Thời điểm hiển thị, phải đặt trong dấu nháy với ngày ISO |
| `order` | Số | Sắp xếp tăng dần, mặc định 0; sự kiện dùng làm thứ tự dòng thời gian |
| `image` | Chuỗi | URL HTTPS hoặc `/assets/ten-anh.webp` |
| `imageCaption` | Chuỗi | Chú thích ảnh |

Tất cả trường danh sách mặc định `[]`, facts mặc định `{}` và sections mặc định `[]`. Các trường không nhận diện bị từ chối để bắt lỗi gõ sai. Tránh đặt dữ liệu bí mật vào YAML hoặc assets vì output là public khi xuất bản.

## Vũ trụ và bộ truyện

```yaml
id: my-world
type: universe
name: Thế giới của tôi
summary: Thế giới nơi câu chuyện diễn ra.
```

```yaml
id: my-story
type: series
name: Bộ truyện của tôi
summary: Cuộc phiêu lưu đầu tiên.
universe: my-world
```

Trang vũ trụ tự liệt kê các bài thuộc vũ trụ; trang bộ truyện tự liệt kê nhân vật/sự kiện có tham chiếu tới bộ truyện. Một nhân vật/sự kiện có thể thuộc nhiều bộ truyện trong cùng vũ trụ. Dùng `related` hoặc wiki link để liên kết giữa các vũ trụ.

## Sự kiện

```yaml
id: first-journey
type: event
name: Hành trình đầu tiên
summary: Hai người bạn rời quê hương.
universe: my-world
series: [my-story]
participants: [my-character]
date: "Năm 1, ngày đầu mùa hạ"
order: 10
sections:
  - title: Diễn biến
    body: |
      [[my-character]] bắt đầu hành trình.
```

Cần tạo bài `my-character` trước khi validate/build. Các sự kiện ở vũ trụ khác nhau có thể dùng cùng một số `order`; giá trị bằng nhau được sắp theo tên. Đây là chỉ số thứ tự do admin đặt, không phải phép chuyển đổi lịch.

## Markdown và liên kết

Trong `sections[].body`, dùng Markdown cho đoạn văn, tiêu đề phụ, danh sách, bảng, chữ đậm và liên kết ngoài. HTML thô được hiển thị như văn bản để tránh chèn mã vào trang.

- `[[my-character]]`: liên kết nội bộ, tự dùng tên bài.
- `[[my-character|người bạn cũ]]`: liên kết với nhãn riêng.
- `[Nguồn tư liệu](https://example.com)`: liên kết ngoài.
- Wiki link trong inline code hoặc code block không được coi là tham chiếu.

Nên dùng wiki link cho nội dung nội bộ để build phát hiện liên kết thiếu và không bị sai base path. Backlinks tự liệt kê các bài tham chiếu bằng YAML và wiki link. Khối `summary`, `facts`, `tags` không xử lý Markdown/wiki link.

## Hình ảnh

Đặt ảnh tại `public/assets/linh-an.webp`, sau đó:

```yaml
image: /assets/linh-an.webp
imageCaption: Linh An tại Vân Cảng
```

Generator thêm base path khi render ảnh của infobox. Không đặt `/fandomwiki-generator` vào `image`. Với ảnh trong Markdown, dùng HTTPS nếu cần cùng nội dung deploy ở cả root và subpath; đường dẫn Markdown được giữ nguyên. Các file ảnh được copy tại build nhưng URL ảnh bên ngoài và sự tồn tại ảnh không được kiểm tra qua mạng.

## Thêm, sửa và xóa

1. Thêm hoặc sửa file YAML trong `content/`.
2. Chạy `npm run validate` để kiểm tra schema và tham chiếu.
3. Chạy `npm run dev` để đọc trang sinh ra.
4. Push lên GitHub; CI kiểm tra và workflow Pages build lại.

Đổi tên `name` không ảnh hưởng URL. Đổi `id` hoặc `type` làm thay URL; cần cập nhật mọi tham chiếu và các liên kết bên ngoài. Xóa một bài cũng cần xóa/sửa các tham chiếu còn lại. Build thành công sẽ loại trang cũ khỏi `dist/`.
