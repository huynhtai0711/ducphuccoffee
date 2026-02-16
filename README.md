# Coffee Roastery Manager (FastAPI + React)

Ứng dụng quản lý xưởng rang cà phê (UI tiếng Việt), chạy local bằng Docker Compose trên Windows.

## Chạy nhanh (Windows PowerShell)
```powershell
docker compose up --build
```

- Backend docs: http://localhost:8001/docs
- Frontend: http://localhost:3000
- Tài khoản mặc định: `admin / admin123`

## Cấu trúc
- `backend/`: FastAPI, SQLAlchemy 2.x, Alembic, SQLite (`backend/data/roastery.db`)
- `frontend/`: React (Vite), dashboard + các module nghiệp vụ
- `docker-compose.yml`: API map `8001:8000`, frontend map `3000:3000`

## Module menu
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

## Seed mặc định khi DB trống
- User: `admin / admin123`
- Bean types:
  1. Robusta S18
  2. Culi Robusta S18
  3. Robusta Honey S18
  4. Arabica S18

## Reset DB sạch
```powershell
Remove-Item .\backend\data\roastery.db -ErrorAction SilentlyContinue
cd .\backend
alembic upgrade head
cd ..
```

## Backup / Restore
### Backup
- API: `POST /system/update/backup`
- File backup lưu tại `backend/backups/`

### Restore thủ công
```powershell
Copy-Item .\backend\backups\<file_backup>.db .\backend\data\roastery.db -Force
```

## Test backend
```bash
cd backend
pytest -q
```

## Ghi chú bảo mật
- Hash password dùng **Argon2id** qua passlib (không dùng bcrypt).
