# AdData Web Tools

Web-based tools that replicate the functionality of the Unity AdDataEncryptionTool and AdDataDecryptionTool. These tools provide a browser-based interface for encrypting and decrypting AdData configurations using the same AES-256 encryption format as the Unity tools.

## Files

- **`index.html`** - Main landing page with links to both tools
- **`addata-encryption-tool.html`** - Web-based encryption tool
- **`addata-decryption-tool.html`** - Web-based decryption tool

## Features

### Encryption Tool
- **AdData Configuration Form** with sections for:
  - Default Configuration (Interstitial, Rewarded, Banner IDs)
  - Bidfloor Configuration (separate sections for each ad type)
  - Dynamic array management for bidfloor IDs
  - Settings for load count, auto retry, and retry intervals

- **Real-time Validation**:
  - MAX ad unit IDs must be exactly 16 characters
  - Only lowercase letters and numbers allowed
  - Visual warning indicators and messages
  - Validation confirmation dialog before encryption

- **Encryption Features**:
  - AES-256 encryption with PBKDF2 key derivation
  - 10,000 iterations for key derivation (matching Unity implementation)
  - Same encryption format as Unity AdEnc utility
  - JSON serialization with pretty printing

- **Export Options**:
  - Copy encrypted result to clipboard
  - Export to .txt file
  - Fixed-size result display with scrolling

### Decryption Tool
- **Input Methods**:
  - Load encrypted data from file
  - Paste encrypted data directly
  - Clear buttons for easy data management

- **Decryption Features**:
  - Compatible with Unity AdEnc encryption format
  - Automatic JSON validation after decryption
  - Visual feedback for validation status

- **Export Options**:
  - Copy decrypted JSON to clipboard
  - Export to .json file

### Common Features
- **UI Design**:
  - Fixed-size windows (400-800px width, 600-1200px height)
  - Scrollable content areas to prevent UI stretching
  - Visual separation with emojis (🎯 Interstitial, 🎁 Rewarded, 📱 Banner)
  - Collapsible sections with smooth animations

- **Responsive Design**:
  - Works on desktop and mobile devices
  - Adaptive layout for different screen sizes

## Technical Implementation

### Encryption Algorithm
The tools use the same encryption parameters as the Unity AdEnc utility:
- **Algorithm**: AES-256-CBC
- **Key Derivation**: PBKDF2 with 10,000 iterations
- **Salt Size**: 16 bytes (128 bits)
- **IV Size**: 16 bytes (128 bits)
- **Padding**: PKCS7
- **Output Format**: Base64 encoded (Salt + IV + Encrypted Data)

### AdData Structure
The tools work with the same AdData structure as the Unity class:

```javascript
{
    DII: '',        // Default Interstitial ID
    DRI: '',        // Default Rewarded ID
    DBI: '',        // Default Banner ID
    BFID: '',       // Bidfloor Interstitial Default ID
    BFIBFS: [],     // Bidfloor Interstitial IDs array
    BFILC: 3,       // Bidfloor Interstitial Load Count
    BFIAR: false,   // Bidfloor Interstitial Auto Retry
    BFIARI: 99999,  // Bidfloor Interstitial Auto Retry Interval
    BFRD: '',       // Bidfloor Rewarded Default ID
    BFRBFS: [],     // Bidfloor Rewarded IDs array
    BFRLC: 3,       // Bidfloor Rewarded Load Count
    BFRAR: false,   // Bidfloor Rewarded Auto Retry
    BFRARI: 99999,  // Bidfloor Rewarded Auto Retry Interval
    BFB: ''         // Bidfloor Banner ID
}
```

### Dependencies
- **CryptoJS 4.1.1** - For AES encryption/decryption functionality
- Loaded from CDN: `https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js`

## Usage

1. **Open the tools**:
   - Open `index.html` in a web browser
   - Click on either "Encryption Tool" or "Decryption Tool"

2. **Encryption**:
   - Enter the encryption password (default: `ikame2099`)
   - Fill in the AdData configuration fields
   - Add bidfloor IDs using the + and - buttons
   - Click "Encrypt" to generate encrypted data
   - Copy to clipboard or export to file

3. **Decryption**:
   - Enter the decryption password
   - Load encrypted data from file or paste directly
   - Click "Decrypt" to decrypt the data
   - View validation status and export results

## Validation Rules

### MAX Ad Unit ID Validation
- Must be exactly 16 characters long
- Can only contain lowercase letters (a-z) and numbers (0-9)
- Pattern: `/^[a-z0-9]{16}$/`

### Examples of Valid IDs
- `abc123def456789a`
- `1234567890abcdef`
- `test1234test5678`

### Examples of Invalid IDs
- `ABC123def456789a` (contains uppercase)
- `abc123def456789` (only 15 characters)
- `abc123def456789ab` (17 characters)
- `abc123def456789!` (contains special character)

## Browser Compatibility

The tools work in all modern browsers that support:
- ES6 JavaScript features
- CSS Grid and Flexbox
- File API for file loading
- Clipboard API for copy functionality

Tested browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Security Notes

- Encryption is performed client-side in the browser
- No data is sent to external servers
- The default password (`ikame2099`) matches the Unity tool
- Use strong passwords for production encryption

## Differences from Unity Tool

### Advantages of Web Version
- Cross-platform compatibility (works on any OS with a browser)
- No Unity installation required
- Responsive design for mobile devices
- Instant access without compilation

### Limitations
- Requires internet connection for CryptoJS library (or can be made offline)
- No integration with Unity Editor workflows
- Limited to browser file system access

## Future Enhancements

Potential improvements that could be added:
- Offline mode with bundled CryptoJS
- Drag-and-drop file support
- Batch processing of multiple files
- Configuration templates/presets
- Dark mode theme
- Additional export formats
