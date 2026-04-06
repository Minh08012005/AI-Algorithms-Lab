**AI Algorithms Lab**

Ứng dụng web tương tác dùng để trực quan hoá và thử nghiệm các thuật toán tìm kiếm và trò chơi trong môn Trí tuệ Nhân tạo (AI). Mục tiêu của project là giúp sinh viên xây dựng, so sánh và luyện tập các thuật toán bằng các bài toán mẫu (bảng, đồ thị) như DFS, BFS, DLS, A\*, Minimax, Alpha-Beta, v.v.

**Tính năng chính**

- **Trực quan hoá thuật toán**: bước từng bước, hiển thị trạng thái mở/rộng, đường đi hiện tại.
- **Bộ đề mẫu đa dạng**: nhiều trường hợp khởi tạo để thử nghiệm khả năng tìm kiếm và tối ưu.
- **Hỗ trợ nhiều thuật toán**: danh mục thuật toán ở phần tiếp theo.
- **Chạy local & deploy dễ dàng**: sử dụng Vite + React; đã có workflow GitHub Actions để deploy lên GitHub Pages.

**Thuật toán được hỗ trợ**

1. Thuật toán tìm kiếm cơ bản (uninformed/search without heuristics)
   - DFS (Depth-First Search)
   - BFS (Breadth-First Search)
   - DLS (Depth-Limited Search)
   - Hill Climbing (tìm kiếm leo đồi)
   - Greedy Best-First Search (tìm kiếm tốt nhất đầu tiên)

2. Thuật toán có heuristic (informed search)
   - A\* (A-star) — hỗ trợ hàm heuristic tùy chỉnh
   - Branch and Bound (Tìm kiếm Nhánh và Cận)

3. Thuật toán đối kháng (adversarial search)
   - Minimax
   - Alpha-Beta Pruning

Mỗi thuật toán có thể được cấu hình (giới hạn độ sâu, chọn heuristic, v.v.) để so sánh hiệu năng và kết quả.

**Cấu trúc project (những file quan trọng)**

- `package.json` — scripts (`dev`, `build`, `preview`)
- `vite.config.js` — cấu hình build (đã đặt `base: './'` cho GitHub Pages)
- `src/` — mã nguồn React
  - `src/modules/HeuristicSearchModule.jsx` — logic và giao diện cho tìm kiếm heuristic
  - `src/modules/SearchModule.jsx` — các thuật toán tìm kiếm cơ bản
  - `src/modules/heuristicEngine.js`, `src/modules/heuristicUtils.js` — helper cho heuristic
  - `src/components/Sidebar.jsx`, `src/components/Node.jsx` — giao diện trực quan
- `.github/workflows/deploy.yml` — workflow CI/CD để build và deploy lên GitHub Pages

**Chạy project trên máy local**

1. Cài đặt dependencies:

```bash
cd ai-lab
npm ci
```

2. Chạy môi trường phát triển:

```bash
npm run dev
```

3. Build production:

```bash
npm run build
```

**Triển khai (đã cấu hình sẵn)**

- Repository có GitHub Actions workflow (`.github/workflows/deploy.yml`) để build và deploy `dist/` lên nhánh `gh-pages`.
- Nếu GitHub Pages không public tự động, vào Settings → Pages và chọn source: `gh-pages` (root).
- Nếu tổ chức/repo có giới hạn Actions, tạo một Personal Access Token (PAT) với scope `repo` và lưu vào Secrets (ví dụ `GH_PAGES_TOKEN`) rồi cập nhật workflow để dùng token đó.

**Hướng dẫn đóng góp**

- Fork repo, tạo branch cho tính năng/bugfix, mở Pull Request với mô tả thay đổi và test case.
- Giữ những thay đổi nhỏ và rõ ràng; thêm ví dụ hoặc đề mẫu mới vào `src/data/`.

**Gợi ý cho việc học hàng ngày**

- Mỗi ngày chọn 1 thuật toán, thử với 3 đề mẫu khác nhau: trường hợp đơn giản, trường hợp đường đi tối ưu dài, và trường hợp bẫy (dead-end).
- So sánh số nút được mở, thời gian, và đường đi tìm được; ghi lại kết quả để theo dõi tiến bộ.

**Giấy phép**

- Thêm file `LICENSE` theo nhu cầu (MIT khuyến khích cho mục học tập).

---

Nếu bạn muốn, tôi có thể mở rộng README với ảnh chụp màn hình, ví dụ cấu hình heuristic, hoặc mẫu kết quả chạy cho từng thuật toán.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
