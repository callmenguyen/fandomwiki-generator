# Hướng dẫn tạo và quản lý nhân vật

Bạn có thể viết YAML thủ công hoặc nhờ một AI agent tạo file trong repository. Cả hai cách đều dùng cùng schema và cùng lệnh kiểm tra; không cần database hay màn hình quản trị.

## Chuẩn bị

1. Clone repository và mở thư mục dự án trong editor/agent.
2. Cài Node.js phù hợp với `engines.node` trong `package.json`, rồi chạy `npm ci`.
3. Xem `content/universes/` và `content/series/` để chọn vũ trụ và bộ truyện. Dùng trường `id`, không dùng tên file hoặc `name`, để tham chiếu.

Các ví dụ dưới đây dùng vũ trụ `aurora`, bộ truyện `nguoi-giu-anh-sang` và nhân vật `linh-an` có sẵn trong repo. Nếu bạn đã xóa dữ liệu mẫu, thay những ID đó bằng ID tồn tại trong wiki của bạn.

## Tạo nhân vật thủ công

### 1. Tạo file YAML

Tạo `content/characters/mai-chi.yml` với nội dung:

```yaml
id: mai-chi
type: character
name: Mai Chi
summary: Người vẽ bản đồ các thành phố nổi, giúp Linh An tìm đường đến kho ký ức cổ.
universe: aurora
series: [nguoi-giu-anh-sang]
aliases: [Người vẽ đường mây]
tags: [Người dẫn đường, Nhà thám hiểm]
facts:
  Tuổi: 24
  Quê quán: Vân Cảng
  Nghề nghiệp: Người vẽ bản đồ
related: [linh-an]
sections:
  - title: Tiểu sử
    body: |
      **Mai Chi** lớn lên tại Vân Cảng và dành nhiều năm khảo sát các tuyến đường giữa những đảo nổi.
  - title: Tính cách
    body: |
      Chi cẩn trọng, thích ghi chép và luôn kiểm chứng các tuyến đường trước khi dẫn đoàn đi qua.
  - title: Vai trò trong truyện
    body: |
      Chi giúp [[linh-an]] lần theo những tuyến đường bị bỏ quên trong [[nguoi-giu-anh-sang]].
order: 7
```

`id` phải duy nhất trong toàn wiki: chữ thường ASCII, số và dấu `-`, không dùng `index`. Tên hiển thị có thể dùng tiếng Việt. `id`, `type`, `name`, `summary`, `universe` là các trường cần có cho nhân vật. `series` có thể bỏ nếu nhân vật chưa thuộc bộ truyện; nếu có thì bộ truyện phải thuộc cùng vũ trụ.

`summary` và `facts` là văn bản thuần. Đặt nội dung dài, Markdown và wiki link trong `sections[].body`. Khoảng trắng trong YAML có ý nghĩa; dùng dấu cách, tránh tab.

### 2. Tạo liên kết và ảnh

- `[[linh-an]]` tự hiển thị tên bài đích.
- `[[linh-an|người giữ pha lê]]` dùng nhãn riêng.
- `related: [linh-an]` thêm danh sách bài liên quan.
- Backlinks được sinh tự động; không cần viết trường `backlinks` trong YAML.

Nếu có ảnh, đặt file tại `public/assets/mai-chi.webp`, rồi thêm:

```yaml
image: /assets/mai-chi.webp
imageCaption: Mai Chi tại Vân Cảng
```

Không đưa base path GitHub Pages vào đường dẫn ảnh. Có thể dùng URL HTTPS thay ảnh local. Chỉ ghi đường dẫn tới ảnh bạn đã có; bộ sinh không tự tạo ảnh. Xem [docs/ContentGuide.md](docs/ContentGuide.md) để biết toàn bộ trường và quy tắc.

### 3. Kiểm tra và xem trước

```sh
npm run validate
npm run build
npm run docs:generate
npm run dev
```

Mở <http://127.0.0.1:4173/characters/mai-chi.html>. Nếu validate thất bại, đọc tên file/trường trong lỗi, sửa YAML hoặc ID tham chiếu rồi chạy lại. Không thay schema để bỏ qua lỗi dữ liệu.

### 4. Đưa nội dung lên GitHub

```sh
git add content/characters/mai-chi.yml README.md
git commit -m "content: add Mai Chi character"
git push
```

Nếu thêm ảnh, stage riêng file ảnh đó. Nếu đang làm trên feature branch, mở PR vào `main`. Sau khi nội dung được push/merge vào `main`, CI kiểm tra và workflow Pages cập nhật wiki. Trong **Settings → Pages → Source**, chọn **GitHub Actions**. Website lấy HTML từ `dist/`; không commit hoặc sửa trực tiếp `dist/`.

## Tạo nhân vật bằng AI

Skill ở [.agents/skills/create-character/SKILL.md](.agents/skills/create-character/SKILL.md). Skill là hướng dẫn cho agent; không phải dịch vụ AI tự chạy và không cần API key trong repo.

### Agent hỗ trợ repo skills

Mở repository trong Codex hoặc agent có khả năng đọc skill của dự án. Nếu `$create-character` xuất hiện trong danh sách skill, dùng prompt:

```text
Dùng $create-character để tạo nhân vật Mai Chi trong vũ trụ aurora,
thuộc bộ truyện nguoi-giu-anh-sang. Chi 24 tuổi, là người vẽ bản đồ
tại Vân Cảng và là bạn của Linh An. Bạn có thể sáng tác thêm tiểu sử
và tính cách phù hợp với bối cảnh hiện có. Tạo file YAML, validate,
build và cập nhật README. Chưa commit hoặc push.
```

Nếu skill chưa xuất hiện, mở lại phiên agent sau khi clone/pull, hoặc dùng cách chỉ định file bên dưới. Đọc danh sách skill thực tế của agent thay vì giả định mọi công cụ đều hỗ trợ cú pháp `$...`.

### Agent bất kỳ có quyền đọc/sửa repository

```text
Đọc và làm theo .agents/skills/create-character/SKILL.md trong repo này.
Tạo Mai Chi: id mai-chi, vũ trụ aurora, bộ truyện nguoi-giu-anh-sang,
24 tuổi, người vẽ bản đồ Vân Cảng, liên quan đến linh-an.
Chỉ dùng thông tin tôi cung cấp; không sáng tác thêm chi tiết tiểu sử.
Tạo YAML, kiểm tra tham chiếu, chạy validate/build và docs:generate.
Báo lại các file đã tạo và kết quả kiểm tra. Chưa commit/push.
```

Bạn có thể cho phép agent sáng tác thêm hoặc yêu cầu bám hoàn toàn theo dữ liệu cung cấp. Ghi rõ tên, vũ trụ/bộ truyện, vai trò, quan hệ và phạm vi sáng tác. Nếu cần vũ trụ hoặc bộ truyện mới, yêu cầu tạo chúng trong cùng nhiệm vụ để mọi tham chiếu đều hợp lệ.

Để sửa nhân vật, chỉ định ID hiện tại và phần cần thay đổi. Nếu muốn agent commit/push, yêu cầu rõ trong prompt; việc dùng skill tự nó không cấp quyền xuất bản.

### Chat AI chỉ trả lời văn bản

Nếu AI không có quyền truy cập repo, cung cấp nội dung skill, schema liên quan trong `docs/ContentGuide.md`, ID vũ trụ/bộ truyện và các bài liên quan. Yêu cầu AI trả YAML. Sau đó lưu YAML vào `content/characters/` và tự chạy các lệnh kiểm tra ở phần thủ công. Đừng coi câu trả lời “đã validate” là kết quả thực nếu AI không chạy lệnh trong repository.

## README tự cập nhật

README có header và được sinh từ các nguồn sau:

| Phần README | Nguồn |
| --- | --- |
| Tên package, version, Node.js | `package.json` |
| Danh sách lệnh và dependency | `package.json` |
| Tên/mô tả wiki, số lượng và danh sách bài | `site.yml`, `content/**/*.yml`, `content/**/*.yaml` |
| Trường, kiểu dữ liệu và mặc định YAML | Zod schema trong `src/content.js` |
| File mã nguồn | Cấu trúc `src/` |
| Tên workflow và thư mục artifact | `.github/workflows/pages.yml` |
| Nội dung hướng dẫn, giải thích chức năng | `docs/README.template.md` |

Sửa lời hướng dẫn ở template, rồi chạy `npm run docs:generate`. Không sửa trực tiếp README vì lần sinh tiếp theo sẽ thay nội dung. Khi thay đổi hành vi code, cập nhật lời mô tả trong template/guide nếu cần; script không suy luận được ý nghĩa của mọi thay đổi mã nguồn.

```sh
npm run docs:generate
npm run docs:check
```

`docs:check` báo lỗi nếu README chưa khớp nguồn, và không ghi file. Sinh README là deterministic: đầu vào không thay đổi thì không tạo commit mới; không chèn thời gian hiện tại vào tài liệu.

Workflow **Verify wiki** sinh tài liệu trong job kiểm tra. Sau khi lint/tests/build/audit/E2E thành công trên `main`, job `sync-readme` sinh lại từ đúng commit đã kiểm tra và chỉ commit `README.md` nếu có thay đổi. PR không nhận quyền ghi để cập nhật tài liệu. Nếu `main` đã có commit mới, lượt cũ bỏ qua cập nhật để không ghi tài liệu lỗi thời.

Bot dùng `GITHUB_TOKEN` và quyền `contents: write` của job. Commit do token này tạo không kích hoạt vòng lặp push workflow. [Cơ chế của GitHub](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

Nếu tổ chức hoặc ruleset/branch protection không cho bot push, job sẽ báo lỗi. Chạy `docs:generate` ở local và đưa README vào PR, hoặc dùng cơ chế bot được maintainer cho phép; không cần tắt bảo vệ nhánh.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
| --- | --- |
| `Duplicate id` | Đặt ID mới hoặc sửa đúng file nhân vật đã tồn tại |
| Reference không tồn tại | Kiểm tra `id` của bài đích; tạo bài thiếu nếu thuộc phạm vi yêu cầu |
| Bộ truyện khác vũ trụ | Chọn bộ truyện thuộc `universe` của nhân vật |
| Unknown/unrecognized field | Đối chiếu schema; đặt thuộc tính riêng trong `facts` |
| Ngày YAML bị hiểu thành giá trị khác | Đặt ngày trong dấu nháy |
| Website hiện README | Chọn Source **GitHub Actions**, chạy workflow **Deploy wiki to GitHub Pages** |
| Không thấy thay đổi trong preview | Dừng và chạy lại `npm run dev` |
| README không khớp | Chạy `npm run docs:generate`, kiểm tra job `sync-readme` |
