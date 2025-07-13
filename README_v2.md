# AdData JSON Serializer Tool v2.0

Tool web động để tạo và serialize JSON cho Unity AdData với bidfloor configuration. Phiên bản 2.0 được nâng cấp từ HTML tĩnh sang web app động với Node.js, Express và database.

## ✨ Tính năng v2.0 (Simplified)

- 🚀 **Web app động** với Node.js + Express
- 🗄️ **Database** lưu trữ projects (SQLite)
- 🆔 **Script ID** - trường mới cho project management
- 💾 **Lưu project** vào database
- 📂 **Load project** từ database
- 📤 **Export project** ra file JSON
- 📥 **Import project** từ file JSON
- ✅ **Real-time validation** với feedback tức thì
- 🎨 **UI đơn giản** và dễ sử dụng

## 🏗️ Kiến trúc

```
ad-data-tool/
├── src/
│   ├── controllers/     # API Controllers
│   ├── models/         # Database Models
│   ├── routes/         # API Routes
│   ├── middleware/     # Custom Middleware
│   ├── config/         # Database & App Config
│   └── utils/          # Utility functions
├── frontend/           # Frontend Assets
│   ├── public/
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   └── views/          # EJS Templates
├── database/           # SQLite Database
├── tests/              # Test files
├── package.json
├── server.js
└── README.md
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite với Sequelize ORM
- **Frontend**: EJS templates, Vanilla JavaScript
- **Security**: Helmet, CORS, Rate limiting
- **Testing**: Jest, Supertest
- **Development**: Nodemon

## 📦 Cài đặt

### Yêu cầu hệ thống
- Node.js >= 16.0.0
- npm hoặc yarn

### Cài đặt dependencies
```bash
npm install
```

### Khởi tạo database
```bash
npm run init-db
```

## 🚀 Chạy ứng dụng

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

Ứng dụng sẽ chạy tại: http://localhost:3000

## 🧪 Testing

### Chạy tests
```bash
npm test
```

### Chạy tests với coverage
```bash
npm test -- --coverage
```

## 📋 API Documentation

### Projects API

#### GET /api/projects
Lấy danh sách tất cả projects

#### GET /api/projects/:id
Lấy project theo ID

#### GET /api/projects/by-name/:name
Lấy project theo tên

#### POST /api/projects
Tạo project mới

#### PUT /api/projects/:id
Cập nhật project

#### DELETE /api/projects/:id
Xóa project

## 🗄️ Database Schema

### Projects Table
- id (UUID, Primary Key)
- name (String, Unique)
- scriptId (String, NEW FIELD)
- data (JSON - AdData structure)
- createdAt (DateTime)
- updatedAt (DateTime)

## 📝 AdData Structure

```json
{
  "defaultAdUnitData": {
    "interstitialId": "a1b2c3d4e5f6g7h8",
    "rewardedVideoId": "b2c3d4e5f6g7h8i9",
    "bannerId": "c3d4e5f6g7h8i9j0",
    "aoaId": "d4e5f6g7h8i9j0k1"
  },
  "bidfloorConfig": {
    "interstitial": {
      "defaultId": "e5f6g7h8i9j0k1l2",
      "bidfloorIds": ["f6g7h8i9j0k1l2m3", "g7h8i9j0k1l2m3n4"],
      "loadCount": 3,
      "autoReloadInterval": 99999,
      "autoRetry": false
    },
    "rewarded": {
      "defaultId": "h8i9j0k1l2m3n4o5",
      "bidfloorIds": ["i9j0k1l2m3n4o5p6", "j0k1l2m3n4o5p6q7"],
      "loadCount": 3,
      "autoReloadInterval": 99999,
      "autoRetry": false
    },
    "banner": {
      "bidfloorBanner": "k1l2m3n4o5p6q7r8"
    }
  }
}
```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Sequelize ORM
- **XSS Protection**: Input sanitization

## 🚀 Deployment

### Production Build
```bash
# Install production dependencies
npm ci --only=production

# Initialize database
npm run init-db

# Start application
npm start
```

## 🔄 Migration từ v1.0

Để migrate từ phiên bản HTML tĩnh:

1. Export projects từ localStorage (nếu có)
2. Cài đặt v2.0 theo hướng dẫn trên
3. Import projects vào database mới
4. Kiểm tra và cập nhật Ad IDs nếu cần

## 🎯 Tính năng chính

### 💾 **Lưu Project**
- Nhập tên project và Script ID
- Điền thông tin AdData
- Click "Lưu Project" để lưu vào database

### 📂 **Load Project**
- Click "Load Project" để xem danh sách
- Click "Load" để tải project vào form

### 📤 **Export Project**
- Click "Export Project" để tải file JSON

### 📥 **Import Project**
- Click "Import Project" để tải project từ file JSON

## 🎯 Roadmap

- [ ] Thêm tính năng backup/restore
- [ ] Cải thiện UI/UX
- [ ] Thêm validation nâng cao
- [ ] Mobile responsive improvements
