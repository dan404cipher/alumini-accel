# Quick Fix: Email Sending Issue

## Problem
Emails cannot be sent because SMTP configuration is missing or commented out in the `.env` file.

## Solution

### Step 1: Open the Backend .env File
Navigate to: `alumini-accel/api/.env`

### Step 2: Uncomment and Configure SMTP Settings

Find these lines (they may be commented out with `#`):
```env
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

Uncomment them and update with your values:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

### Step 3: Get Gmail App Password (if using Gmail)

1. **Enable 2-Step Verification:**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification" if not already enabled

2. **Create App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Type "AlumniAccel" as the name
   - Click "Generate"
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

3. **Update .env File:**
   - Paste the password in `SMTP_PASS`
   - **Remove ALL spaces** from the password
   - Example: `SMTP_PASS=abcdefghijklmnop` (no spaces)

### Step 4: Restart Backend Server

After updating the `.env` file, restart your backend server:
```bash
cd alumini-accel/api
npm run dev
```

### Step 5: Verify Configuration

The server logs should show:
- "SMTP connection verified successfully" (if verification passes)
- Or specific error messages if configuration is incorrect

## Common Issues

### Issue: "BadCredentials" or "Invalid login"
- **Cause:** App Password is incorrect or has spaces
- **Fix:** 
  1. Generate a new App Password
  2. Copy it exactly (16 characters, no spaces)
  3. Update `SMTP_PASS` in `.env`
  4. Restart server

### Issue: "SMTP configuration missing"
- **Cause:** `SMTP_USER` or `SMTP_PASS` are commented out or empty
- **Fix:** Uncomment and set both variables in `.env`

### Issue: "Connection timeout"
- **Cause:** Network or firewall blocking SMTP port
- **Fix:** Check firewall settings, ensure port 587 is open

## Testing

After configuration, try sending an invitation again. The error message should now be more detailed if there are still issues.

## Need More Help?

See `SMTP_SETUP_GUIDE.md` for detailed instructions.

