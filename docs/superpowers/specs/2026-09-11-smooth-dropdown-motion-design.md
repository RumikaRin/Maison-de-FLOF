# Thiết Kế Kỹ Thuật: Nâng Cấp Hiệu Ứng Mega-Menu Dropdown Mượt Mà (Studio Fluid Motion)

- **Ngày lập**: 2026-09-11
- **Trạng thái**: Đã phê duyệt (Approved)
- **Mục tiêu**: Nâng cấp toàn diện chuyển động đóng/mở của Mega-Menu Dropdown ("Sản phẩm", "Bảng màu") trên thanh điều hướng `Header.tsx`, mang lại cảm giác lướt êm ái, tiếp đất mềm mại chuẩn Studio cao cấp, triệt tiêu hoàn toàn hiện tượng biến mất giật cục khi đóng và chớp màn hình của backdrop scrim.

---

## 1. YÊU CẦU & ĐỘNG HỌC CHUYỂN ĐỘNG (MOTION DYNAMICS)

1. **Hiệu ứng Mở (Entrance Transition)**:
   - Khi bấm vào nút "Sản phẩm" hoặc "Bảng màu", mega-panel lướt nhẹ từ trên xuống:
     - `opacity`: `0 → 1`
     - `transform`: `translateY(-10px) → translateY(0)`
   - Thời lượng: `320ms`.
   - Easing curve: `cubic-bezier(0.16, 1, 0.3, 1)` (Ease-Out Expo) — phản hồi tức thì và hãm tốc cực êm.

2. **Hiệu ứng Đóng (Exit Transition)**:
   - Khi đóng menu (click ra ngoài, bấm lại nút, bấm ESC hoặc bấm link điều hướng):
     - `opacity`: `1 → 0`
     - `transform`: `translateY(0) → translateY(-8px)`
   - Thời lượng: `220ms` với `ease-in-out` gọn gàng.
   - Không dùng `hidden={!open}` (gây biến mất đột ngột trong 0ms), thay bằng kỹ thuật `visibility: hidden` + `pointer-events: none` kết hợp transition mượt mà.

3. **Lớp Phủ Mờ Nền (Backdrop Scrim)**:
   - Không render điều kiện chớp tắt `openPanel ? <div /> : null`.
   - Render cố định lớp scrim với `transition: opacity 300ms ease-fl-out`, khi mở chuyển sang `opacity-100 pointer-events-auto`, khi đóng chuyển sang `opacity-0 pointer-events-none`.

4. **Staggered Reveal cho Nội Dung Bên Trong (Haptic Depth)**:
   - Cột phân loại bề mặt / họ màu bên trái và khối editorial highlight bên phải xuất hiện so le nhẹ (stagger delay: 40ms, 90ms, 140ms), tạo cảm giác có lớp lang và chiều sâu không gian.

5. **Accessibility (`prefers-reduced-motion`)**:
   - Khi người dùng bật chế độ giảm chuyển động, tắt toàn bộ `transform translateY`, chỉ giữ crossfade opacity đơn giản trong `150ms`.

---

## 2. KIẾN TRÚC & THAY ĐỔI CHI TIẾT

### 2.1. Cấu hình CSS (`src/app/globals.css`)
Thêm các rules tối ưu GPU cho MegaPanel và Scrim:
```css
/* ============================================================
   Studio Fluid Mega-Menu Transition Engine
   ============================================================ */
.fl-mega-panel {
  position: absolute;
  inset-inline: 0;
  top: 100%;
  border-top: 1px solid hsl(var(--border));
  background-color: var(--atelier-paper, #FAF9F6);
  box-shadow: 0 20px 48px -12px rgba(43, 35, 30, 0.12);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  pointer-events: none;
  transition: opacity 240ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 320ms cubic-bezier(0.16, 1, 0.3, 1),
              visibility 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.fl-mega-panel.is-open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

@media (prefers-reduced-motion: no-preference) {
  .fl-mega-panel.is-open .fl-panel-col-1 {
    animation: fl-item-reveal 320ms cubic-bezier(0.16, 1, 0.3, 1) 40ms both;
  }
  .fl-mega-panel.is-open .fl-panel-col-2 {
    animation: fl-item-reveal 320ms cubic-bezier(0.16, 1, 0.3, 1) 90ms both;
  }
  .fl-mega-panel.is-open .fl-panel-promo {
    animation: fl-item-reveal 340ms cubic-bezier(0.16, 1, 0.3, 1) 140ms both;
  }
  @keyframes fl-item-reveal {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .fl-mega-panel {
    transform: none !important;
    transition: opacity 150ms ease-out, visibility 150ms ease-out !important;
  }
}
```

### 2.2. Cập Nhật `Header.tsx` (`src/components/layout/Header.tsx`)
1. **Thay đổi `MegaPanel` component**:
   - Sử dụng class `.fl-mega-panel` và toggle class `is-open`.
   - Bỏ thuộc tính `hidden={!open}` làm đứt gãy transition.
2. **Cập nhật Scrim**:
   - Luôn tồn tại trong DOM với trạng thái `opacity-0 pointer-events-none`.
   - Khi `openPanel !== null`, thêm `opacity-100 pointer-events-auto` kèm `onClick={() => closePanel()}`.
3. **Gắn các class cột**:
   - Gắn `fl-panel-col-1`, `fl-panel-col-2`, `fl-panel-promo` vào `ProductPanel` và `ColourPanel` để kích hoạt hiệu ứng xuất hiện có thứ tự.

---

## 3. KẾ HOẠCH XÁC THỰC (VERIFICATION PLAN)

1. **Kiểm tra tự động**:
   - Viết unit test kiểm tra các class và cấu hình CSS mới.
   - Chạy `npm run typecheck && npm run lint`.
   - Chạy `npm test` xác nhận 226+ tests pass.
2. **Kiểm tra trực quan trên trình duyệt (Browser DevTools)**:
   - Mở menu: Quan sát chuyển động lướt xuống mượt mà trong 320ms.
   - Đóng menu: Quan sát hiệu ứng trượt nhẹ lên và fade-out êm ái trong 220ms, không biến mất đột ngột.
   - Bấm chuyển qua lại giữa "Sản phẩm" và "Bảng màu": Chuyển đổi êm ả, không chớp giật.
