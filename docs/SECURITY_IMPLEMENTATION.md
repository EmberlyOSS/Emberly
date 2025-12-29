# File Upload Security Implementation

## Overview

All file upload endpoints now have comprehensive security validation with VirusTotal integration.

## Protected Endpoints

### 1. Single File Upload
**Route:** `POST /api/files`
- Accepts form data with file
- Validates before storage
- Full buffer scanning

### 2. Chunked Upload (Initialization)
**Route:** `POST /api/files/chunks`
- Validates filename + MIME type
- Lightweight check (no buffer yet)
- Initializes upload session

### 3. Chunked Upload (Completion)
**Route:** `POST /api/files/chunks/[uploadId]/complete`
- Validates assembled file metadata
- Checks against dangerous types
- Cleans up on failure

## Security Stack

Each endpoint runs:

```
1. Basic Security Check
   ├─ Dangerous extensions (.exe, .bat, .sh, .py, etc.)
   ├─ Dangerous MIME types
   └─ Validates against 50+ dangerous file types

2. Zip Bomb Detection
   ├─ ZIP signature verification
   ├─ Compression ratio analysis (max 100:1)
   ├─ File count limits (max 10,000)
   └─ Uncompressed size limits (max 50GB)

3. VirusTotal Scanning (Optional)
   ├─ Hash-based lookup (no file upload)
   ├─ 71+ antivirus engines
   ├─ Rate limit aware (4 req/min free)
   └─ Privacy-focused (images/videos/audio skipped)
```

## Logging

All three endpoints log:

**On Failure:**
```json
{
  "level": "warn",
  "message": "File security validation failed",
  "fileName": "document.pdf",
  "mimeType": "application/pdf",
  "error": "File flagged as malware by VirusTotal",
  "virusTotal": {
    "scanPerformed": true,
    "detected": true,
    "detectionCount": 2,
    "detectionRatio": "2/71",
    "permalink": "https://www.virustotal.com/gui/file/..."
  },
  "userId": "user-123"
}
```

**On VirusTotal Scan:**
```json
{
  "level": "info",
  "message": "File scanned by VirusTotal",
  "fileName": "report.pdf",
  "detected": false,
  "detectionRatio": "0/71",
  "permalink": "https://www.virustotal.com/gui/file/...",
  "userId": "user-123"
}
```

## Configuration

### Required Environment Variable

```bash
VIRUSTOTAL_API_KEY=your_free_api_key_here
```

- Get from: https://www.virustotal.com/gui/sign-up
- Free tier: 4 requests/minute
- Hash lookups are free and unlimited

### Optional Environment Variable

```bash
VIRUSTOTAL_AUTO_SUBMIT=true
```

- Enables automatic file submission for scanning
- Counts against rate limit
- Disabled by default to respect user privacy

## Error Handling

### File Rejected (400/403)

```json
{
  "error": "File extension \".exe\" is not allowed. Executable and script files cannot be uploaded."
}
```

### Rate Limited (No Upload)

```json
{
  "error": "File failed security validation"
}
```

File passes local checks but VirusTotal rate limit reached. Upload still succeeds but VT scan is skipped.

### Malware Detected

```json
{
  "error": "File flagged as malware by VirusTotal (2/71 detections). Scan: https://www.virustotal.com/gui/file/..."
}
```

## Performance Impact

- **Local checks:** ~1-5ms
- **VirusTotal hash lookup:** ~100-500ms
- **Total per file:** ~100-600ms

No file uploads are blocked due to performance.

## Blocked File Types

### Executables
`.exe`, `.bat`, `.cmd`, `.com`, `.scr`, `.elf`, `.bin`, `.dll`, `.so`, `.dylib`

### Scripts
`.sh`, `.bash`, `.pl`, `.py`, `.rb`, `.php`, `.asp`, `.aspx`, `.jsp`

### Dangerous Office
`.docm`, `.xlsm`, `.pptm`, `.potm`, `.ppam`, `.ppsm`

### Other
`.jar`, `.class`, `.msi`, `.cab`, `.lnk`, `.url`, `.hta`, `.chm`, `.inf`, `.reg`

## Testing

### Test a Safe File

```bash
curl -F "file=@document.pdf" http://localhost:3000/api/files \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "file": {
    "id": "...",
    "name": "document.pdf",
    "size": 1024
  }
}
```

### Test a Dangerous Extension

```bash
curl -F "file=@script.exe" http://localhost:3000/api/files \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response (400):
```json
{
  "error": "File extension \".exe\" is not allowed. Executable and script files cannot be uploaded."
}
```

## Monitoring

Check logs for security events:

```bash
# All security violations
grep "File security validation failed" logs/

# VirusTotal scans
grep "File scanned by VirusTotal" logs/

# Warnings (double extensions, hidden files)
grep "File security warnings" logs/
```

## Future Enhancements

- [ ] Real-time threat feed integration
- [ ] ClamAV self-hosted scanning
- [ ] Admin dashboard for security metrics
- [ ] Quarantine system for suspicious files
- [ ] User notifications on detection
- [ ] Automated malware cleanup
