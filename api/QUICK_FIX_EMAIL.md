# 🚨 QUICK FIX: Email Not Sending

## Problem
Gmail is rejecting your App Password: "Username and Password not accepted"

## ✅ SOLUTION (5 Steps)

### Step 1: Check 2-Step Verification
1. Open: https://myaccount.google.com/security
2. Scroll to "2-Step Verification"
3. **MUST be enabled** - If not, enable it first!

### Step 2: Create NEW App Password
1. Open: https://myaccount.google.com/apppasswords
2. If you see "App passwords aren't available" → 2-Step Verification is NOT enabled (go back to Step 1)
3. Click **"Select app"** → Choose **"Mail"**
4. Click **"Select device"** → Choose **"Other (Custom name)"**
5. Type: **"AlumniAccel"**
6. Click **"Generate"**
7. **Copy the password** - You'll see something like: `abcd efgh ijkl mnop`

### Step 3: Update .env File
1. Open: `alumini-accel/api/.env`
2. Find the line: `SMTP_PASS=dtnmcalkbzwuadzc`
3. Replace with your NEW password (remove ALL spaces):
   ```env
   SMTP_PASS=abcdefghijklmnop  # 16 characters, NO spaces
   ```
4. **Save the file**

### Step 4: Test Connection
Run this command:
```bash
cd api
node test-smtp.js
```

You should see: ✅ SUCCESS!

### Step 5: Restart Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

## 🎯 Common Mistakes

❌ **Wrong**: Using regular Gmail password  
✅ **Correct**: Use App Password (16 characters)

❌ **Wrong**: Password with spaces: `abcd efgh ijkl mnop`  
✅ **Correct**: Remove spaces: `abcdefghijklmnop`

❌ **Wrong**: 2-Step Verification not enabled  
✅ **Correct**: Must enable 2-Step Verification first

❌ **Wrong**: Using old/expired App Password  
✅ **Correct**: Create fresh App Password

## 📝 Current Status
- ✅ Password length: 16 characters (correct)
- ❌ Gmail authentication: FAILED (password rejected)
- 🔧 **Action Required**: Create NEW App Password

## 🔍 Verify Your Fix
After updating .env:
```bash
cd api
node test-smtp.js
```

If you see ✅ SUCCESS → Email will work!
If you see ❌ FAILED → Follow steps again

