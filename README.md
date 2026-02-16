# Coffee Roastery Manager (FastAPI + React)

Ứng dụng quản lý xưởng rang cà phê chạy local bằng Docker Compose, giao diện tiếng Việt, có đủ menu nghiệp vụ cho Admin/Kho/Sales.

## 1) Chạy nhanh (Windows PowerShell)
```powershell
docker compose up --build
```

- Web: http://localhost:3000
- API docs: http://localhost:8002/docs
- Tài khoản mặc định: `admin / Admin@12345`

## 2) Đổi port khi máy đang bận cổng
PowerShell:
```powershell
$env:API_PORT=8010
$env:WEB_PORT=3300
docker compose up --build
```

## 3) Cấu trúc monorepo
- `backend/`: FastAPI + SQLAlchemy + Alembic + SQLite (`backend/data/app.db`)
- `frontend/`: React (Vite)
- `docker-compose.yml`: 2 services `api` + `frontend`

## 4) Menu hệ thống
1. Tổng quan
2. Nhập hàng
3. Sản xuất
4. Sản phẩm
5. CRM
6. Bán hàng
7. Khách hàng
8. Chi phí & Công nợ
9. Báo cáo
10. Cài đặt

## 5) Seed dữ liệu mặc định
- 4 loại nhân:
  1) Robusta S18
  2) Culi Robusta S18
  3) Robusta Honey S18
  4) Arabica S18
- Users:
  - Admin: `admin / Admin@12345`
  - Kho: `warehouse / warehouse123`
  - Sales: `sales / sales123`

## 6) Reset sạch để chạy lại
```powershell
docker compose down -v
Remove-Item .\backend\data\app.db -ErrorAction SilentlyContinue
Remove-Item .\backend\backups\* -ErrorAction SilentlyContinue
docker compose up --build
```

## 7) Backup SQLite
- API backup: `POST /system/update/backup`
- File tạo trong `./backend/backups`

## 8) Migration + Update flow
- Container API tự chạy `alembic upgrade head` mỗi lần start.
- Sau migrate, app startup sẽ tự seed dữ liệu mặc định nếu DB trống.

## 9) Chạy test backend
```bash
cd backend
pytest -q
```
