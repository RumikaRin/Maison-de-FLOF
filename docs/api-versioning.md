# API Versioning Policy

Ngày áp dụng: 26/07/2026

## Trạng thái hiện tại

Maison de FLOF hiện dùng các route không gắn version dưới `/api`. Đây là
contract nội bộ giữa cùng một Next.js deployment và các client trong
repository. OpenAPI 3.1 tại `docs/openapi.yaml` là nguồn chuẩn cho method,
security, response và schema.

Mọi lỗi JSON dùng envelope:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  },
  "requestId": "correlation-id"
}
```

`details` chỉ xuất hiện khi dữ liệu đã được sanitizer. Success payload hiện tại
được giữ tương thích trừ khi OpenAPI và client cùng thay đổi trong một PR.

## Khi nào tạo `/api/v1`

Tạo namespace version khi ít nhất một điều sau xảy ra:

- API được cung cấp cho client hoặc đối tác triển khai độc lập.
- Có generated SDK được phát hành bên ngoài repository.
- Cần thay đổi không tương thích về field, status, pagination hoặc ownership.
- Hai phiên bản client phải hoạt động đồng thời qua nhiều release.

Không tạo version mới cho field tùy chọn, endpoint mới hoặc sửa lỗi giữ nguyên
contract.

## Quy trình breaking change

1. Thêm route/schema version mới và giữ version cũ hoạt động.
2. Gắn `Deprecation: true`, `Sunset` và `Link` tới migration guide trên version
   cũ.
3. Duy trì tối thiểu 90 ngày cho external client; internal-only client được
   giữ ít nhất hai production release.
4. Theo dõi traffic version cũ trước khi gỡ.
5. Xóa version cũ chỉ qua PR có OpenAPI diff, migration guide, compatibility
   test và release note.

## Generated client

Không publish generated TypeScript client khi route còn unversioned và chỉ
dùng nội bộ. Khi `/api/v1` được thiết lập, client phải sinh từ OpenAPI đã lint,
được pin theo semantic version và có contract test source ↔ OpenAPI trong CI.

