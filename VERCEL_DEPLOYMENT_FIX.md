# Vercel Deployment Fix Guide

## Problem: Getting React Template Instead of Your App

### Root Causes & Solutions

## 1. API URL Configuration (Most Likely Issue)

Your app has hardcoded `http://localhost:5000` URLs. Vercel needs production URLs.

### Fix: Create Environment-Aware API Configuration

#### Step 1: Update API Service
Replace all hardcoded URLs with environment variables:

```javascript
// In all components, replace:
axios.get('http://localhost:5000/api/results')

// With:
axios.get(process.env.REACT_APP_API_URL + '/results')
```

#### Step 2: Update Environment Files
- **Development**: `.env` (already exists)
- **Production**: `.env.production` (created for you)

## 2. Vercel Configuration

### Files Created:
- `vercel.json` - Vercel deployment configuration
- `.env.production` - Production environment variables

### Update `.env.production`:
```
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
```

## 3. Build Configuration

### Check `package.json` build script:
```json
{
  "scripts": {
    "build": "react-scripts build"
  }
}
```

## 4. Deployment Steps

### Step 1: Update All API Calls
Find and replace all hardcoded URLs:

**Files to update:**
- `src/components/ExamList.js`
- `src/components/Results.js`
- `src/components/ExamResults.js`
- `src/components/StudentPerformance.js`
- `src/components/ExamPaperViewer.js`
- `src/context/AuthContext.js`

**Search for:** `http://localhost:5000/api`
**Replace with:** `${process.env.REACT_APP_API_URL}`

### Step 2: Deploy Backend First
1. Deploy your backend to Vercel/Railway/Render
2. Get the production URL
3. Update `.env.production` with the backend URL

### Step 3: Deploy Frontend
1. Push changes to GitHub
2. Connect repository to Vercel
3. Vercel will auto-detect React app
4. Configure environment variables in Vercel dashboard

## 5. Common Vercel Issues & Fixes

### Issue: Build fails
**Fix:** Ensure all imports are correct and no missing dependencies

### Issue: API calls fail
**Fix:** Check environment variables in Vercel dashboard

### Issue: Routing doesn't work
**Fix:** `vercel.json` handles SPA routing (already created)

### Issue: Shows default React page
**Fix:** Check if `index.js` imports correct `App` component

## 6. Quick Test Checklist

Before deploying:
- [ ] All API URLs use environment variables
- [ ] Backend is deployed and accessible
- [ ] `.env.production` has correct backend URL
- [ ] Build runs locally: `npm run build`
- [ ] Preview build works: `serve -s build`

## 7. Alternative: Use Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

## 8. Environment Variables in Vercel Dashboard

1. Go to Vercel project dashboard
2. Settings → Environment Variables
3. Add: `REACT_APP_API_URL` = `https://your-backend-url.vercel.app/api`

## 9. Debugging Steps

If still showing React template:

1. Check Vercel build logs
2. Verify build output contains your components
3. Check network tab for API call failures
4. Ensure environment variables are set correctly

## 10. Backend Deployment Options

### Option 1: Vercel Serverless
- Convert Express routes to serverless functions
- Place in `api/` directory

### Option 2: Railway/Render
- Deploy Node.js app directly
- Get production URL for frontend

### Option 3: Vercel + External Backend
- Deploy frontend on Vercel
- Deploy backend on Railway/Render/DigitalOcean

## Next Steps

1. Update all hardcoded API URLs
2. Deploy backend to get production URL
3. Update `.env.production`
4. Deploy frontend to Vercel
5. Test in production environment

This should resolve the React template issue and show your actual application.
