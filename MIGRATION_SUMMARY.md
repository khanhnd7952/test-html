# AdData Tool - Migration to Scripts Structure

## Tổng quan
Đã thành công nâng cấp AdData Tool từ cấu trúc đơn script sang cấu trúc multiple scripts per project.

## Những thay đổi chính

### 1. Database Schema Changes
- **Trước**: Project có 1 scriptId và data trực tiếp
- **Sau**: Project có data.scripts array, mỗi script có scriptId, name, và data riêng
- Thêm field `description` cho project
- Xóa field `scriptId` ở level project (chuyển vào scripts)

### 2. Backend API Changes
- Cập nhật Project model với validation mới
- Thêm các API endpoints cho script management:
  - `GET /api/projects/:id/scripts` - Lấy tất cả scripts của project
  - `GET /api/projects/:id/scripts/:scriptId` - Lấy script cụ thể
  - `POST /api/projects/:id/scripts` - Thêm script mới
  - `PUT /api/projects/:id/scripts/:scriptId` - Cập nhật script
  - `DELETE /api/projects/:id/scripts/:scriptId` - Xóa script
- Cập nhật `GET /api/projects/script-ids` để lấy từ scripts array

### 3. Frontend Changes
- Thêm Script Management Section với:
  - Script selector dropdown
  - Buttons: Thêm Script, Sửa Script, Xóa Script
  - Current script info display
- Thêm modals cho add/edit script
- Cập nhật logic save/load để làm việc với scripts
- Cập nhật import/export để hỗ trợ cả cấu trúc cũ và mới

### 4. Migration System
- Tạo migration script để chuyển đổi dữ liệu hiện tại
- API endpoints: `/api/migration/status`, `/api/migration/simple`
- Tự động chuyển đổi old structure → new structure

## Cấu trúc dữ liệu mới

### Project Structure
```json
{
  "id": "uuid",
  "name": "Project Name",
  "description": "Optional description",
  "data": {
    "scripts": [
      {
        "scriptId": "SCRIPT_001",
        "name": "Script Name",
        "data": {
          "defaultAdUnitData": { ... },
          "bidfloorConfig": { ... }
        }
      }
    ]
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Tính năng mới

### Script Management
- Mỗi project có thể có nhiều scripts
- Mỗi script có ID và name riêng
- Có thể thêm/sửa/xóa scripts trong project
- Switch giữa các scripts để edit

### Enhanced UI
- Script selector dropdown
- Current script info display
- Script count trong project list
- Status indicators (có dữ liệu/trống)

### Backward Compatibility
- Import function hỗ trợ cả file cũ và mới
- Migration tự động khi load old projects
- Export với version indicator

## Migration Status
✅ Database schema updated
✅ Backend APIs implemented
✅ Frontend UI updated
✅ Script management features added
✅ Import/Export updated
✅ Migration system working
✅ Existing data migrated successfully

## Testing Checklist
- [x] Load existing projects
- [x] Create new project with script
- [x] Add multiple scripts to project
- [x] Switch between scripts
- [x] Edit script data
- [x] Delete scripts
- [x] Export project (new format)
- [x] Import old format files
- [x] Import new format files
- [x] Migration API endpoints

## Kết luận
Migration thành công! AdData Tool bây giờ hỗ trợ multiple scripts per project với đầy đủ tính năng quản lý scripts và backward compatibility.
