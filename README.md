# AdData JSON Serializer Tool

## Mô tả
Tool web đơn giản để tạo và serialize JSON cho class `AdData` từ Unity C#. Tool này giúp bạn dễ dàng tạo ra cấu trúc JSON tương ứng với class `AdData` mà không cần phải viết code C#.

## Cấu trúc dữ liệu được hỗ trợ

### AdData Class
```csharp
internal class AdData
{
    internal AdUnitData DefaultAdUnitData;
    internal BFSuperAdUnitConfig BidfloorInterstitial;
    internal BFSuperAdUnitConfig BidfloorRewarded;
    internal string BidfloorBanner;
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
   - **🗑️ Xóa Project**: Xóa project hiện tại
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
   - **📝 Dữ liệu mẫu**: Tải dữ liệu mẫu để test

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
- ✅ **Validation**: Kiểm tra dữ liệu đầu vào
- ✅ **Export JSON**: Copy hoặc tải xuống file JSON
- ✅ **Sample Data**: Dữ liệu mẫu để test nhanh
- ✅ **Real-time Preview**: Xem JSON ngay khi tạo

## Ví dụ JSON Output

```json
{
  "DefaultAdUnitData": {
    "interstitialId": "ca-app-pub-1234567890123456/1234567890",
    "rewardedVideoId": "ca-app-pub-1234567890123456/0987654321",
    "bannerId": "ca-app-pub-1234567890123456/1122334455",
    "aoaId": "ca-app-pub-1234567890123456/5544332211"
  },
  "BidfloorInterstitial": {
    "DefaultId": "bf-interstitial-default-001",
    "BidfloorIds": [
      "bf-interstitial-001",
      "bf-interstitial-002"
    ],
    "BidFloorLoadCount": 5,
    "BidFloorAutoRetry": true,
    "AutoReloadInterval": 30000
  },
  "BidfloorRewarded": {
    "DefaultId": "bf-rewarded-default-001",
    "BidfloorIds": [
      "bf-rewarded-001",
      "bf-rewarded-002"
    ],
    "BidFloorLoadCount": 3,
    "BidFloorAutoRetry": false,
    "AutoReloadInterval": 60000
  },
  "BidfloorBanner": "bf-banner-001"
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
