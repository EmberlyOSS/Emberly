# VirusTotal Integration Guide

## Overview

Emberly now includes optional **VirusTotal malware scanning** for uploaded files. This provides an additional layer of security by checking files against the VirusTotal database of known malware signatures.

## Setup

### 1. Get a VirusTotal API Key

- Go to [virustotal.com](https://www.virustotal.com)
- Sign up for a free account (or use existing account)
- Navigate to Settings → API key
- Copy your API key

### 2. Add Environment Variable

Add your VirusTotal API key to your `.env.local` file:

```bash
VIRUSTOTAL_API_KEY=your_api_key_here
```

### 3. Verify Integration

Once set up, the system will automatically:
1. Calculate SHA-256 hash of uploaded files
2. Check if the hash is known to VirusTotal (free, no file upload needed)
3. Return results showing detection status and counts

## How It Works

### Hash-Based Checking (Default)

The integration uses **VirusTotal's hash lookup API** by default, which:
- ✅ Doesn't require uploading files (privacy-friendly)
- ✅ Respects rate limits (4 requests/minute free tier)
- ✅ Provides instant results for known files
- ✅ No additional cost beyond free tier

**Process:**
1. User uploads file
2. System calculates SHA-256 hash
3. Query VirusTotal database: "Have you seen this file before?"
4. If found: Check malware detection count (e.g., "2/71 vendors detected")
5. Block upload if malicious

### File Submission (Optional)

To scan unknown files, you can enable automatic submission:

```typescript
// In validateFileSecurityChecksWithVT, uncomment:
if (!vtResult.scanPerformed && process.env.VIRUSTOTAL_AUTO_SUBMIT === 'true') {
  const submitResult = await submitToVirusTotal(buffer, filename)
  return { ...result, virusTotal: submitResult }
}
```

Then add to `.env.local`:
```bash
VIRUSTOTAL_AUTO_SUBMIT=true
```

**Warning:** Automatic submission counts against your rate limit (4 uploads/minute free tier).

## File Types Scanned

VirusTotal scanning is automatically applied to:
- ✅ Documents (.pdf, .docx, .xlsx, etc.)
- ✅ Executables (.exe, .dll, .app, etc.)
- ✅ Archives (.zip, .rar, .7z, etc.)
- ✅ Scripts (.sh, .py, .js, etc.)
- ✅ Compressed files (.gz, .bz2, etc.)

**NOT scanned** (to respect privacy):
- ❌ Images (.jpg, .png, .gif, etc.)
- ❌ Videos (.mp4, .mkv, .mov, etc.)
- ❌ Audio (.mp3, .wav, .flac, etc.)

## Security Features Stack

Emberly combines multiple security approaches:

1. **Local Validation** (Always enabled)
   - Dangerous file type blocking (.exe, .bat, .sh, etc.)
   - MIME type validation
   - Zip bomb detection (compression ratio analysis)

2. **VirusTotal Scanning** (If API key configured)
   - Hash-based malware detection
   - 71+ antivirus engine signatures

3. **Rate Limiting**
   - Per-IP upload limits
   - Per-user quota enforcement
   - VirusTotal API rate limits (4 req/min free)

## Handling Rate Limits

If VirusTotal rate limit is hit:

```typescript
{
  "valid": true,  // File not blocked, but...
  "virusTotal": {
    "scanPerformed": false,
    "detected": false,
    "rateLimited": true,
    "error": "VirusTotal rate limit reached. Please try again later."
  }
}
```

**Behavior:**
- Upload proceeds (file isn't blocked)
- Admin is logged about rate limiting
- User may retry in 1 minute
- Implement retry logic on frontend if desired

## Logging & Monitoring

File security events are logged to:

**Location:** `packages/lib/logger` 

**Log Entry:**
```typescript
{
  fileName: "document.pdf",
  mimeType: "application/pdf",
  error: null,  // null if passed
  virusTotal: {
    scanPerformed: true,
    detected: true,
    detectionCount: 2,
    detectionRatio: "2/71",
    permalink: "https://www.virustotal.com/gui/file/..."
  },
  userId: "user-123"
}
```

## Cost

- **Free Tier:** 4 API requests/minute (hash lookups)
- **Premium:** Higher limits, IP whitelisting
- **Cost:** $0 for hash lookups, $0.003 per file submission

For most deployments, hash lookups are sufficient and completely free.

## Best Practices

1. **Always** keep `VIRUSTOTAL_API_KEY` in `.env.local` (never commit to git)
2. **Monitor** your API usage in VirusTotal dashboard
3. **Never** auto-submit files without user consent (disabled by default)
4. **Log** all security events for audit trails
5. **Educate** users about file security
6. **Test** with known-good and known-bad file hashes

## Testing

### Test Hash Lookups

```bash
# Known malware (EICAR test file)
curl -H "x-apikey: YOUR_API_KEY" \
  "https://www.virustotal.com/api/v3/files/131f95c51cc819465fa1797f6ccacf9d494aaff2b9b8ea4c2f1c079d3cda5528"

# Result should show detections
```

### In Local Development

1. Add `VIRUSTOTAL_API_KEY` to `.env.local`
2. Upload any file - should check VT
3. Check server logs for VT results
4. Enable `VIRUSTOTAL_AUTO_SUBMIT=true` for testing (careful with rate limits)

## Troubleshooting

### "VirusTotal API error"

- **Cause:** Invalid API key
- **Fix:** Verify key in `.env.local`, check VirusTotal dashboard

### "VirusTotal rate limit reached"

- **Cause:** Exceeded 4 requests/minute
- **Fix:** Wait 1 minute or upgrade to premium tier

### Empty VT results

- **Cause:** File hash not in VT database (likely safe, just unknown)
- **Fix:** This is normal. Upload proceeds.

## Privacy Notes

- **Hash lookups:** File hash sent to VT, file contents remain local ✅
- **Auto-submit:** Full file uploaded to VT (if enabled) ⚠️
- **Metadata:** Filename, size, MIME type sent with hash lookup
- **Storage:** VT stores file for future reference (if submitted)

For maximum privacy, use hash-only lookup (default setting).

## Future Enhancements

- [ ] ClamAV integration (self-hosted scanning)
- [ ] YARA rules for custom threat detection
- [ ] File behavior sandboxing
- [ ] Real-time threat feeds
- [ ] Admin dashboard for security metrics
