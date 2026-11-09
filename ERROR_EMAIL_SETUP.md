# Email Error Reporting Setup Guide

Weather Forecaster can automatically email you error reports when fatal or critical errors occur. Since the app is hosted on GitHub Pages (static), we need a separate backend for email delivery.

## Option 1: Vercel Serverless Function (Recommended)

### Step 1: Deploy the Backend

1. Create a new GitHub repository for the error reporting backend
2. Push the `api/report-error.js` file to that repository
3. Add the `vercel.json` file to the root
4. Connect the repository to Vercel (vercel.com)
5. Deploy - Vercel will automatically create the API endpoint

### Step 2: Configure Resend (Email Service)

1. Sign up at [resend.com](https://resend.com) (free tier available)
2. Create an API key in your Resend dashboard
3. Verify your email address (this will be where error reports are sent)

### Step 3: Set Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

- `RESEND_API_KEY`: Your Resend API key (e.g., `re_xxxxxxxxxxxx`)
- `ERROR_EMAIL`: Your email address (e.g., `your-email@example.com`)

### Step 4: Update Weather Forecaster Configuration

1. Get your deployed Vercel function URL (e.g., `https://your-error-backend.vercel.app/api/report-error`)
2. In Weather Forecaster, create a `.env.local` file:

```bash
VITE_ERROR_REPORTING_ENDPOINT=https://your-error-backend.vercel.app/api/report-error
```

3. Update Weather Forecaster and push to GitHub

### Step 5: Enable Email Reporting

In Weather Forecaster:
1. Go to Settings page
2. Enable "Email Error Reports"
3. Test by triggering an error (use `window.__weatherForecaster.testError()`)

## Option 2: Use a Third-Party Service (Easier)

If you don't want to deploy your own backend, use a service like:

### Sentry (Production-Grade)
1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project
3. Get your DSN (Data Source Name)
4. Add Sentry SDK to Weather Forecaster:
   ```bash
   npm install @sentry/react
   ```
5. Initialize in `src/main.jsx`:
   ```javascript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: "production"
   });
   ```

### LogRocket (Session Replay)
1. Sign up at [logrocket.com](https://logrocket.com)
2. Add their SDK similarly to Sentry
3. Provides video replays of errors

## Option 3: No Email (Local Only)

The error management system works perfectly without email:
- All errors are captured and stored locally
- View full error history at `/errors`
- Export reports as JSON
- Manually share reports when needed

## Testing Email Delivery

After setup, test the email system:

```javascript
// In browser console
window.__weatherForecaster.testError()
```

Check your email for the error report.

## Security Notes

- API keys are stored in server environment variables (never exposed to frontend)
- The backend validates requests before sending emails
- Error grouping prevents email spam from duplicate errors
- Only fatal and critical errors trigger emails by default

## Troubleshooting

**Emails not arriving:**
- Check Vercel function logs for errors
- Verify RESEND_API_KEY is correct
- Check your email spam folder
- Ensure ERROR_EMAIL is verified in Resend

**Function not deploying:**
- Verify `vercel.json` is in repository root
- Check file path: `api/report-error.js`
- Ensure Node.js runtime is selected in Vercel

**Endpoint not accessible:**
- Check Vercel deployment logs
- Verify the function URL is correct
- Test with curl or Postman first

## Architecture Diagram

```
Weather Forecaster (GitHub Pages)
        ↓
Error occurs → errorManager.logError()
        ↓
POST to Vercel Function (HTTPS)
        ↓
Vercel validates request
        ↓
Store error (Vercel KV or log)
        ↓
Check for duplicates (grouping)
        ↓
Send email via Resend API
        ↓
You receive email notification
```

## Cost Considerations

- **Vercel**: Free tier should handle error reporting volume
- **Resend**: Free tier: 3,000 emails/month
- For higher volume, upgrade plans are available
- Alternative: Use AWS SES (~$0.10 per 1,000 emails)

## Recovery Notifications

The system can send recovery notifications when errors are resolved:

1. In the Error History page, mark an error as "Resolved"
2. The system tracks resolution status
3. Future occurrences of the same error will trigger new emails
4. Resolved errors are shown in the dashboard

This helps you know when issues reoccur after you thought they were fixed.
