# Fandom Wiki Generator

Wiki tĩnh cho nhiều vũ trụ và bộ truyện. Admin viết YAML, chạy build và xuất bản HTML/CSS/JS lên GitHub Pages hoặc Vercel. Không cần database, tài khoản người đọc hay backend.

## Chạy ở local

Yêu cầu **Node.js 22.13+ (nhánh 22), 24 hoặc 26+** và npm.

```sh
npm ci
npm run validate
npm run build
npm run dev
```

Mở <http://127.0.0.1:4173>. Preview tự build khi khởi động; sau khi sửa YAML, dừng và chạy lại `npm run dev`. Kết quả build nằm trong `dist/`; không chỉnh sửa trực tiếp thư mục này. Dùng HTTP preview thay vì mở file HTML bằng `file://` để tìm kiếm tải được JSON.

## Quản lý nội dung

- `site.yml`: tên wiki, mô tả, ngôn ngữ HTML và đường dẫn triển khai.
- `content/`: file `.yml`/`.yaml`, có thể tổ chức thành thư mục con tùy ý.
- `public/assets/`: ảnh hoặc tài nguyên tự cung cấp; xuất sang `dist/assets/`.
- `src/`: bộ đọc, kiểm tra dữ liệu, renderer, build và preview.
- `web/`: CSS và tìm kiếm chạy trên trình duyệt.

Đã có 7 bài mẫu thuộc hai vũ trụ độc lập. Có thể xóa/thay các bài mẫu khi bắt đầu wiki của bạn; nhớ cập nhật toàn bộ tham chiếu liên quan.

```yaml
id: linh-an
type: character
name: Linh An
summary: Người học việc có khả năng nghe thấy ký ức trong pha lê.
universe: aurora
series: [nguoi-giu-anh-sang]
aliases: [Người giữ ánh sáng]
tags: [Nhân vật chính]
facts:
  Tuổi: 19
  Quê quán: Vân Cảng
related: [minh-kha]
sections:
  - title: Tiểu sử
    body: |
      **Linh An** gặp [[minh-kha]] tại kho lưu trữ.
      Câu chuyện bắt đầu sau [[dem-pha-le-vo|Đêm Pha Lê Vỡ]].
```

Các ID trong ví dụ phải có bài tương ứng. Chi tiết đầy đủ tại [docs/ContentGuide.md](docs/ContentGuide.md).

## GitHub Pages

1. Trong repository, vào **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Push nội dung lên nhánh `main`, hoặc chạy workflow **Deploy wiki to GitHub Pages** bằng `workflow_dispatch`.
3. Workflow kiểm tra dữ liệu, chạy lint và coverage, build với `base_path` lấy từ GitHub, sau đó deploy artifact `dist/`.

URL mặc định của repository này: <https://callmenguyen.github.io/fandomwiki-generator/>. URL chỉ hoạt động khi Pages được bật và workflow deploy thành công. Nếu dùng tên miền riêng hoặc repository `<username>.github.io`, workflow tự lấy base path phù hợp.

Kiểm tra đường dẫn project ở local:

```sh
BASE_PATH=/fandomwiki-generator npm run build
BASE_PATH=/fandomwiki-generator npm run dev
```

Hướng dẫn chính thức: [GitHub Pages với workflow tùy chỉnh](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Vercel

Import repository vào Vercel. `vercel.json` cấu hình framework `Other`, build command `npm run build`, output directory `dist`. Giữ `site.yml` với `basePath: ""` và không đặt `BASE_PATH` của GitHub Pages trên Vercel. Mỗi lần push sẽ build lại nội dung, theo cấu hình Git integration của project.

Hướng dẫn chính thức: [cấu hình build và output directory](https://vercel.com/docs/builds/configure-a-build).

## Kiểm tra

```sh
npm run check
npx playwright install chromium
npm run test:e2e
npm audit
```

`check` chạy ESLint, unit/integration test với coverage tối thiểu 80% cho bộ sinh, sau đó build. E2E kiểm tra liên kết bài viết, tìm kiếm/alias, lọc danh mục, lỗi tải search index và màn hình di động trên Chromium với base path của project Pages. CI thực hiện các kiểm tra này trên Node.js 22.

## Nguyên tắc build

- ID duy nhất trên toàn wiki; tham chiếu sai, sai loại bài và lỗi YAML làm build thất bại.
- Markdown không cho phép HTML thô; tên, nhãn và thông tin YAML được escape.
- Build hoàn thành trong thư mục tạm trước khi thay output. Lỗi validation/render giữ bản build trước.
- Bộ sinh chỉ thay `dist/` có marker `.fandomwiki-output`, từ chối symlink và thư mục output không do nó tạo.
- Tài nguyên trong `public/assets/` không được trùng CSS/JS của bộ sinh; symlink bị từ chối.
- Tìm kiếm tải JSON phía trình duyệt, hỗ trợ tên, tên khác, mô tả và tags; việc đọc bài và liên kết hoạt động khi tắt JavaScript.
- Dòng thời gian dùng `order`, không suy đoán thứ tự từ chuỗi ngày trong các lịch hư cấu.

Phạm vi triển khai theo [docs/RequirementsOutline.md](docs/RequirementsOutline.md).
