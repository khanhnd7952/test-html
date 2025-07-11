# AdData JSON Serializer Tool

## Mô tả
Tool web đơn giản để tạo và serialize JSON cho class `AdData` từ Unity C#. Tool này giúp bạn dễ dàng tạo ra cấu trúc JSON tương ứng với class `AdData` mà không cần phải viết code C#.

## Cấu trúc dữ liệu được hỗ trợ

### AdData Class
```csharp
internal class AdData
{
    internal AdUnitData DefaultAdUnitData;
    internal BFSuperConfig BidfloorConfig;
}
```

### BFSuperConfig Class
```csharp
internal class BFSuperConfig
{
    internal BFSuperAdUnitConfig Interstitial;
    internal BFSuperAdUnitConfig Rewarded;
    internal string Banner;
}
```

### AdUnitData Class
```csharp
class AdUnitData
{
    internal string interstitialId;
    internal string rewardedVideoId;
    internal string bannerId;
    internal string aoaId;
}
```

### BFSuperAdUnitConfig Class
```csharp
internal class BFSuperAdUnitConfig
{
    internal string DefaultId;
    internal string[] BidfloorIds;
    internal int BidFloorLoadCount = 3;
    internal bool BidFloorAutoRetry = false;
    internal int AutoReloadInterval = 99999;
}
```

## Cách sử dụng

1. **Mở file `index.html`** trong trình duyệt web
2. **Quản lý Project** (Tính năng mới!):

### 🏷️ **PROJECT IDENTIFIER**
   - **Project Name**: Nhập tên project để quản lý dữ liệu riêng biệt
   - **💾 Lưu Project**: Lưu dữ liệu hiện tại vào database
   - **📂 Danh sách Projects**: Xem và quản lý tất cả projects đã lưu
   - **🧹 Clear Data**: Xóa sạch dữ liệu nhưng giữ lại project
   - **🗑️ Xóa Project**: Xóa hoàn toàn project và tất cả dữ liệu
   - **📤 Export Project**: Xuất project ra file JSON
   - **📥 Import Project**: Nhập project từ file JSON

3. **Điền thông tin** vào 2 nhóm chính:

### 🎯 **DEFAULT CONFIGURATION**
   - **Default Ad Unit Data**: Các ID mặc định cho interstitial, rewarded video, banner và AOA

### 💰 **BIDFLOOR CONFIGURATION**
   - **Bidfloor Interstitial Config**: Cấu hình cho interstitial ads với bidfloor
   - **Bidfloor Rewarded Config**: Cấu hình cho rewarded ads với bidfloor
   - **Bidfloor Banner Config**: ID cho banner với bidfloor

4. **Sử dụng các nút chức năng**:
   - **🔄 Tạo JSON**: Tạo JSON từ dữ liệu đã nhập
   - **📋 Copy JSON**: Copy JSON vào clipboard
   - **💾 Tải xuống JSON**: Tải file JSON về máy
   - **📥 Import JSON Data**: Import dữ liệu AdData từ JSON vào form
   - **📝 Dữ liệu mẫu**: Tải dữ liệu mẫu để test

## Phân biệt Clear Data vs Delete Project

### 🧹 **Clear Data**
- **Mục đích**: Xóa sạch tất cả dữ liệu trong form
- **Project**: Vẫn được giữ lại trong database
- **Kết quả**: Form trống, project name vẫn còn
- **Sử dụng khi**: Muốn bắt đầu lại với project hiện tại

### 🗑️ **Delete Project**
- **Mục đích**: Xóa hoàn toàn project khỏi database
- **Project**: Bị xóa vĩnh viễn
- **Kết quả**: Form trống, project name cũng bị xóa
- **Sử dụng khi**: Không cần project này nữa

## Import JSON Data

### 📥 **Import AdData từ JSON**
Tính năng này cho phép import dữ liệu AdData từ JSON (ví dụ từ Unity) vào form để chỉnh sửa.

#### 🔧 **Cách sử dụng:**
1. **Click "📥 Import JSON Data"**
2. **Chọn file JSON** hoặc **paste JSON text**
3. **Chọn validation option:**
   - ✅ **Validate Ad IDs**: Kiểm tra format trước khi import
   - ❌ **Skip validation**: Import tất cả kể cả ID không hợp lệ
4. **Click "📥 Import Data"**

#### 📋 **Supported JSON Formats:**

**Format mới (hiện tại):**
```json
{
  "DefaultAdUnitData": {...},
  "BidfloorConfig": {
    "Interstitial": {...},
    "Rewarded": {...},
    "Banner": "..."
  }
}
```

**Format cũ (backward compatible):**
```json
{
  "DefaultAdUnitData": {...},
  "BidfloorInterstitial": {...},
  "BidfloorRewarded": {...},
  "BidfloorBanner": "..."
}
```

#### ⚡ **Smart Features:**
- **Auto-detect format**: Tự động nhận diện cấu trúc JSON
- **Validation option**: Có thể bỏ qua validation nếu cần
- **Auto-save**: Tự động lưu vào project hiện tại (nếu có)
- **Error reporting**: Báo lỗi chi tiết nếu có ID không hợp lệ

## Format Ad ID

### 📋 **MAX Ad ID Format**
- **Độ dài**: Đúng 16 ký tự
- **Ký tự cho phép**: Chữ thường (a-z) và số (0-9)
- **Ví dụ hợp lệ**: `a1b2c3d4e5f6g7h8`
- **Ví dụ không hợp lệ**:
  - `A1B2C3D4E5F6G7H8` (có chữ hoa)
  - `a1b2c3d4e5f6g7h` (thiếu 1 ký tự)
  - `a1b2-c3d4-e5f6-g7h8` (có ký tự đặc biệt)

### 🎯 **Validation Features**
- **Real-time check**: Kiểm tra ngay khi nhập
- **Visual feedback**: Màu xanh (hợp lệ) / đỏ (không hợp lệ)
- **Error messages**: Thông báo lỗi cụ thể
- **JSON blocking**: Không cho tạo JSON khi có lỗi

## Tính năng

### 🆕 **Tính năng Database & Project Management**
- ✅ **Project Database**: Lưu trữ dữ liệu trong localStorage của trình duyệt
- ✅ **Auto-save**: Tự động lưu khi thay đổi project name
- ✅ **Project Switching**: Chuyển đổi giữa các projects dễ dàng
- ✅ **Export/Import**: Xuất/nhập projects dưới dạng JSON
- ✅ **Project List**: Quản lý danh sách projects với thông tin chi tiết

### 🎨 **Tính năng Giao diện**
- ✅ **Giao diện được nhóm**: Chia thành 3 nhóm chính Project, Default và Bidfloor
- ✅ **Thiết kế thân thiện**: Dễ sử dụng với thiết kế responsive và gradient đẹp mắt
- ✅ **Modal Windows**: Popup cho quản lý projects và import
- ✅ **Dynamic Arrays**: Thêm/xóa Bidfloor IDs động
- ✅ **Organized Layout**: Cấu trúc rõ ràng và logic

### ⚙️ **Tính năng Chức năng**
- ✅ **Ad ID Validation**: Kiểm tra format MAX Ad ID (16 ký tự chữ thường + số)
- ✅ **Real-time Validation**: Hiển thị lỗi ngay khi nhập
- ✅ **JSON Generation Block**: Không cho tạo JSON khi có ID không hợp lệ
- ✅ **Import JSON Data**: Import dữ liệu AdData từ JSON với validation
- ✅ **Multi-format Support**: Hỗ trợ cả format cũ và mới
- ✅ **Export JSON**: Copy hoặc tải xuống file JSON
- ✅ **Sample Data**: Dữ liệu mẫu với ID hợp lệ để test
- ✅ **Real-time Preview**: Xem JSON ngay khi tạo

## Ví dụ JSON Output

```json
{
  "DefaultAdUnitData": {
    "interstitialId": "a1b2c3d4e5f6g7h8",
    "rewardedVideoId": "b2c3d4e5f6g7h8i9",
    "bannerId": "c3d4e5f6g7h8i9j0",
    "aoaId": "d4e5f6g7h8i9j0k1"
  },
  "BidfloorConfig": {
    "Interstitial": {
      "DefaultId": "e5f6g7h8i9j0k1l2",
      "BidfloorIds": [
        "f6g7h8i9j0k1l2m3",
        "g7h8i9j0k1l2m3n4"
      ],
      "BidFloorLoadCount": 5,
      "BidFloorAutoRetry": true,
      "AutoReloadInterval": 30000
    },
    "Rewarded": {
      "DefaultId": "h8i9j0k1l2m3n4o5",
      "BidfloorIds": [
        "i9j0k1l2m3n4o5p6",
        "j0k1l2m3n4o5p6q7"
      ],
      "BidFloorLoadCount": 3,
      "BidFloorAutoRetry": false,
      "AutoReloadInterval": 60000
    },
    "Banner": "k1l2m3n4o5p6q7r8"
  }
}
```

## Files

- `index.html`: Giao diện chính của tool
- `script.js`: Logic JavaScript xử lý tạo JSON
- `README.md`: Hướng dẫn sử dụng

## Yêu cầu hệ thống

- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)
- Không cần cài đặt thêm gì khác

## Lưu ý

- Tool này chỉ tạo JSON structure, không kết nối trực tiếp với Unity
- JSON được tạo ra tương thích với cấu trúc class C# gốc
- Có thể sử dụng JSON này để import vào Unity hoặc các ứng dụng khác

## Hỗ trợ

Nếu có vấn đề hoặc cần thêm tính năng, vui lòng liên hệ hoặc tạo issue.
