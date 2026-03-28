# Mixer System - Mobile Client

Ứng dụng di động của hệ thống Mixer System, được phát triển bằng **React Native** và hỗ trợ test nhanh qua **Expo Go**.

---

## 🚀 Hướng dẫn khởi chạy nhanh (Quick Start)

Dự án đã được cấu hình để chạy trên **Expo SDK 54**, giúp cả nhóm có thể test trực tiếp trên điện thoại (iOS/Android) mà không cần cài đặt Android Studio hay Xcode phức tạp.

### Bước 1: Cài đặt môi trường
Đảm bảo bạn đã cài đặt Node.js (phiên bản 18 trở lên). Sau đó chạy lệnh sau để tải các thư viện cần thiết:
```bash
npm install --legacy-peer-deps
```

### Bước 2: Cấu hình API (Rất quan trọng)
Mở file `src/services/api.ts`. Thay đổi biến `LOCAL_IP` thành địa chỉ IP máy tính của bạn:
```typescript
const LOCAL_IP = '192.168.1.XX'; // Thay bằng IP của bạn (lấy từ lệnh ipconfig)
```
*Lưu ý: Không commit thay đổi IP cá nhân này lên GitHub.*

### Bước 3: Chạy ứng dụng
Chạy lệnh sau để phát sóng ứng dụng:
```bash
npx expo start --tunnel
```
Sau khi mã QR xuất hiện:
- **Android**: Mở app **Expo Go**, chọn "Scan QR Code".
- **iOS (iPhone)**: Mở ứng dụng **Camera**, quét mã QR và chọn mở bằng Expo Go.

---

## 🛠️ Cấu trúc dự án
- `src/services/api.ts`: Cấu hình kết nối đến Backend.
- `src/stores/`: Quản lý trạng thái ứng dụng (Zustand).
- `src/screens/`: Chứa giao diện các màn hình.

## 📝 Lưu ý cho Team
- **Backend**: Đảm bảo Server Backend (`/server`) đang chạy đồng thời để App có thể gọi dữ liệu.
- **Hot Reload**: Khi bạn sửa code và lưu (Ctrl+S), ứng dụng trên điện thoại sẽ tự động cập nhật ngay lập tức.
- **Lỗi Cache**: Nếu gặp lỗi lạ sau khi kéo code mới, hãy chạy `npx expo start -c --tunnel` để xóa bộ nhớ đệm.

---

Chúc nhóm hoàn thành đồ án thật tốt! 🚀
