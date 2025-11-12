# Gmail SMTP Setup Guide

## Problem: "Invalid login: Username and Password not accepted"

This error means Gmail is rejecting your App Password. Follow these steps to fix it:

## Step-by-Step Solution

### Step 1: Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Click on "2-Step Verification"
3. If not enabled, follow the steps to enable it
4. **This is REQUIRED** - App Passwords only work with 2-Step Verification enabled

### Step 2: Create a New App Password
1. Go to https://myaccount.google.com/apppasswords
2. If you don't see this option, make sure 2-Step Verification is enabled first
3. Click "Select app" → Choose "Mail"
4. Click "Select device" → Choose "Other (Custom name)"
5. Type: "AlumniAccel"
6. Click "Generate"
7. A 16-character password will appear (e.g., `abcd efgh ijkl mnop`)
8. **Copy this password immediately** - you won't see it again!

### Step 3: Update .env File
1. Open `alumini-accel/api/.env`
2. Update the SMTP_PASS:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=pavithra@v-accel.ai
   SMTP_PASS=gtxu txlo ddwn bedw
   ```


### Step 4: Restart Server
```bash
cd api
# Stop server (Ctrl+C)
npm run dev
```

### Step 5: Test Connection
The server will automatically test the connection on startup. Check logs for:
- ✅ "SMTP connection verified successfully" → Working!
- ❌ "SMTP Authentication failed" → App Password still wrong

## Common Issues

### Issue 1: "App Passwords" option not visible
**Solution**: Enable 2-Step Verification first at https://myaccount.google.com/security

### Issue 2: App Password doesn't work after copying
**Solution**: 
- Make sure you copied the FULL 16 characters
- Remove ALL spaces
- If still fails, create a NEW App Password

### Issue 3: "Less secure app access" error
**Solution**: Use App Passwords (not regular password). App Passwords are the modern, secure way.

### Issue 4: Multiple Gmail accounts
**Solution**: Make sure `SMTP_USER` matches the Gmail account where you created the App Password

## Verify Your Setup

Run this command to test:
```bash
cd api
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'mp9597000@gmail.com',
    pass: 'YOUR_APP_PASSWORD_WITHOUT_SPACES'
  }
});
transporter.verify().then(() => {
  console.log('✅ SMTP Connection: SUCCESS');
  process.exit(0);
}).catch((err) => {
  console.log('❌ SMTP Connection: FAILED');
  console.log('Error:', err.message);
  process.exit(1);
});
"
```

## Still Not Working?

1. **Double-check**: App Password is exactly 16 characters (no spaces)
2. **Verify**: 2-Step Verification is enabled on Gmail
3. **Confirm**: SMTP_USER matches the Gmail account
4. **Try**: Create a fresh App Password
5. **Check**: Gmail account is not locked or restricted

## Alternative: Use a Different Email Service

If Gmail continues to cause issues, you can use:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (free tier: 62,000 emails/month)
- **Outlook/Hotmail** (similar setup to Gmail)

For production, consider using a dedicated email service instead of Gmail.

