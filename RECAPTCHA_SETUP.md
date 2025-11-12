# Google reCAPTCHA Setup Guide

This guide explains how to set up Google reCAPTCHA v2 for the mentee registration form.

## Prerequisites

1. A Google account
2. Access to Google reCAPTCHA Admin Console

## Step 1: Register Your Site with Google reCAPTCHA

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click on the "+" button to create a new site
3. Fill in the form:
   - **Label**: Give your site a name (e.g., "Alumni Accel - Mentee Registration")
   - **reCAPTCHA type**: Select **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - **Domains**: Add your domains:
     - `localhost` (for development)
     - Your production domain (e.g., `yourdomain.com`)
     - You can add multiple domains
   - Accept the reCAPTCHA Terms of Service
   - Click **Submit**

## Step 2: Get Your Keys

After registration, you'll receive two keys:
- **Site Key** (public) - Used in the frontend
- **Secret Key** (private) - Used in the backend

## Step 3: Configure Frontend Environment Variables

1. Navigate to the `client` directory
2. Create or update your `.env` file (or `.env.local` for local development)
3. Add the following:

```env
VITE_RECAPTCHA_SITE_KEY=your-site-key-here
```

**Example:**
```env
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

> **Note**: The example key above is Google's test key. Replace it with your actual site key.

## Step 4: Configure Backend Environment Variables

1. Navigate to the `api` directory
2. Create or update your `.env` file
3. Add the following:

```env
RECAPTCHA_SECRET_KEY=your-secret-key-here
```

**Example:**
```env
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

> **Note**: The example key above is Google's test key. Replace it with your actual secret key.

## Step 5: Restart Your Servers

After adding the environment variables:

1. **Frontend**: Restart your Vite dev server
   ```bash
   cd client
   npm run dev
   ```

2. **Backend**: Restart your Node.js server
   ```bash
   cd api
   npm run dev
   ```

## Testing

### Using Google's Test Keys (Development Only)

Google provides test keys that always pass verification:

- **Site Key**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

These keys work for testing but should **never** be used in production.

### Testing the Integration

1. Open the mentee registration form
2. Fill out all required fields
3. Complete the reCAPTCHA checkbox
4. Submit the form
5. The form should submit successfully if reCAPTCHA verification passes

## Troubleshooting

### reCAPTCHA Widget Not Showing

- Check that `VITE_RECAPTCHA_SITE_KEY` is set in your frontend `.env` file
- Ensure the environment variable is prefixed with `VITE_` (required for Vite)
- Restart your frontend dev server after adding the variable
- Check browser console for any errors

### reCAPTCHA Verification Failing

- Verify that `RECAPTCHA_SECRET_KEY` is set in your backend `.env` file
- Check that the secret key matches the site key (they must be from the same reCAPTCHA site)
- Ensure your domain is added to the reCAPTCHA site configuration
- Check backend logs for detailed error messages

### Domain Mismatch Errors

- Ensure all domains (including `localhost` for development) are added in the reCAPTCHA Admin Console
- For production, add your actual domain (e.g., `yourdomain.com`, `www.yourdomain.com`)

## Security Notes

1. **Never commit keys to version control**: Always use `.env` files and add them to `.gitignore`
2. **Use different keys for development and production**: Create separate reCAPTCHA sites for each environment
3. **Keep secret keys secure**: The secret key should only be used on the backend and never exposed to the frontend
4. **Monitor reCAPTCHA analytics**: Check the reCAPTCHA Admin Console regularly for suspicious activity

## Additional Resources

- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/display)
- [react-google-recaptcha Documentation](https://github.com/dozoisch/react-google-recaptcha)

