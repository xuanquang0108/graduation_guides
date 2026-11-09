# Graduation Guide

Thiệp mời lễ tốt nghiệp **Uyên Như — Chủ Nhật 22.11.2026, 16:30–17:00, TP. Hồ Chí Minh**.

Trang một trang: hero chữ kinetic (canvas) → chi tiết buổi lễ → bản đồ bãi xe → lời cảm ơn.
Xây bằng Next.js (App Router) + Tailwind CSS.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở <http://localhost:3000>.

## Sửa nội dung

Toàn bộ chữ hiển thị nằm trong [`lib/site-config.ts`](lib/site-config.ts) —
ngày giờ, địa chỉ, lời mời, tiêu đề từng khối đều sửa ở đó.

- `components/HeroSection.tsx` — canvas chữ kinetic + meta đầu/cuối trang.
- `components/MapSection.tsx` — sơ đồ bãi xe (SVG) + lộ trình Google Maps.
- `components/EventSection.tsx`, `components/ClosingSection.tsx` — khối nội dung.
