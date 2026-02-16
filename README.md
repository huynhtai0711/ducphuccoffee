# Coffee Roastery Manager

Ứng dụng quản lý xưởng rang cà phê (mobile-first PWA) gồm:
- **Backend**: FastAPI + SQLite + Alembic
- **Frontend**: React + Vite + Tailwind + form validation (React Hook Form + Zod) + toast (sonner)
- **Docker Compose** để chạy đồng bộ.

## 1) Chạy nhanh bằng Docker Compose
```bash
docker compose up --build
```
- Frontend (Docker): `http://localhost:5174`
- API (Docker): `http://localhost:8001`
- Frontend dev (Vite): `http://localhost:5173` (hoặc cổng trong `npm run dev`)

Tài khoản seed:
- `admin / admin123`
- `warehouse / warehouse123`
- `sales / sales123`


## 1.1) Giao diện mobile-first (UI/UX)
- Mobile ưu tiên thao tác nhanh với **Bottom Navigation 5 tab**: Tổng quan, Nhập hàng, Rang, Bán hàng, CRM.
- Có nút **FAB (+)** ở góc phải để tạo nhanh các tác vụ thường dùng.
- Form tạo mới mở dạng **Bottom Sheet** (trượt từ dưới lên), nút lưu sticky ở đáy để thao tác 1 tay.
- Desktop/tablet tự chuyển sang layout **Sidebar + Main content**.
- Toàn bộ nhãn/validation/toast sử dụng tiếng Việt.

## 2) Chạy local không Docker
### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 3) Reset dữ liệu
```bash
rm -f backend/data/roastery.db
cd backend && alembic upgrade head
```
Khi API chạy lại sẽ seed dữ liệu mặc định.

## 4) Backup DB
### Qua API
- Vào trang **System → Update** và bấm **Backup DB**.
### Qua CLI
```bash
cp backend/data/roastery.db backend/backups/roastery-$(date +%Y%m%d-%H%M%S).db
```

## 5) Update hệ thống (Safe level 1)
1. Vào trang **System → Update**.
2. Backup DB trước.
3. Upload `update.zip` có `manifest.json` (version, min_schema, checksum).
4. Hệ thống ghi update log và trả lệnh restart:
```bash
docker compose restart
```

## 6) Migrations (Alembic)
Tạo migration mới:
```bash
cd backend
alembic revision --autogenerate -m "your message"
```
Chạy migration:
```bash
alembic upgrade head
```
Rollback 1 bước:
```bash
alembic downgrade -1
```

## 7) Tính năng chính đã có
- JWT login + role/permission flags + audit logs.
- Sổ cái kho (StockLedger) là nguồn tồn kho duy nhất.
- Nhập hàng green bean (VAT/NoVAT).
- Product recipe (tối đa 4 bean, tổng 100%).
- Rang theo FIFO, tính yield + cost/kg.
- Bán hàng theo FIFO thành phẩm, VAT 0% hoặc 8%, hỗ trợ nhiều payment.
- Soft delete sales và rollback ledger.
- CRM khách hàng + follow-up + dashboard today/overdue.
- Dashboard KPI + cảnh báo dưới ngưỡng tồn kho.
- Báo cáo sales theo date range + export CSV.
- Trang System Update: version/schema, backup, upload update.zip.
- PWA manifest + hướng dẫn Add to Home Screen (Chrome: menu ⋮ → Add to Home screen).

## 8) Test
```bash
cd backend
pytest -q
```

## 9) Cấu trúc thư mục
- `backend/app`: API, models, services
- `backend/alembic`: migrations
- `backend/data`: SQLite database
- `backend/backups`: backup DB
- `frontend/src`: UI pages/components
