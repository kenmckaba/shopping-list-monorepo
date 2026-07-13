# 🚀 Supabase Cloud Deployment Guide

## Prerequisites Completed ✅
- ✅ Supabase project active: `mjhdypqdirkhoaumjkyw.supabase.co`
- ✅ API keys already configured in `.env.local`
- ✅ Client data layer uses Supabase directly
- ✅ Authentication updated to Supabase Auth

## Step 1: Set Up Supabase Database Schema

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `mjhdypqdirkhoaumjkyw`
3. **Go to SQL Editor** (left sidebar)
4. **Run the schema**: Copy and paste the content from `supabase-setup.sql`
5. **Click "Run"** to create all tables and policies

## Step 2: Configure Authentication (Optional)

### Option A: Magic Link Authentication (Recommended)
- **Already configured** - users can sign in with email only
- **No additional setup needed**

### Option B: Email + Password Authentication
1. Go to **Authentication > Settings** in Supabase
2. Disable "Enable email confirmations" for easier testing
3. Enable "Allow manual creation of users"

## Step 3: Test Locally with Supabase

```bash
# Start the development server
yarn dev:client

# Open your browser to http://localhost:3000
# Try the new Supabase authentication
```

## Step 4: Deploy Frontend to Vercel

### 4a: Connect to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository: `kenmckaba/shopping-list-monorepo`
3. **Root Directory**: Set to `apps/client`
4. **Framework Preset**: Next.js
5. **Node.js Version**: 18.x

### 4b: Configure Environment Variables in Vercel
In Vercel dashboard → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://mjhdypqdirkhoaumjkyw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qaGR5cHFkaXJraG9hdW1qa3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMjQxMDQsImV4cCI6MjA5MTcwMDEwNH0.nJXsLeDziJG30AA6GEhX1fgmJJQN2jb-9eL0GF09b2s
```

### 4c: Configure Build Settings
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### 4d: Deploy
Click **"Deploy"** - Your app will be live at `https://your-app.vercel.app`

## Step 5: Update CORS in Supabase (Important!)

1. Go to **Authentication > Settings** in Supabase
2. Add your Vercel domain to **Site URL**: `https://your-app.vercel.app`
3. Add to **Redirect URLs**: `https://your-app.vercel.app/**`

## Step 6: Test Production App

✅ **Authentication**: Sign up/in with email
✅ **Create Lists**: Add new shopping lists
✅ **Add Items**: Add items to lists
✅ **Real-time Updates**: Check/uncheck items
✅ **Persistence**: Data saved in Supabase PostgreSQL

## 🎉 You're Done!

### **Cost Breakdown:**
- **Supabase**: FREE (up to 50MB database, 50,000 monthly active users)
- **Vercel**: FREE (unlimited deployments, 100GB bandwidth/month)
- **Total Monthly Cost**: **$0** for personal use!

### **What You Get:**
- ✅ **Global CDN** via Vercel
- ✅ **Automatic HTTPS**
- ✅ **PostgreSQL Database** with backups
- ✅ **Built-in Authentication**
- ✅ **Real-time subscriptions**
- ✅ **Automatic scaling**

### **Next Steps (Optional):**
1. **Custom Domain**: Add your own domain in Vercel settings
2. **Email Templates**: Customize auth emails in Supabase
3. **Row Level Security**: Fine-tune database permissions
4. **Real-time Features**: Add live collaboration with Supabase subscriptions

### **Troubleshooting:**
- If login fails: Check CORS settings in Supabase
- If table errors appear: Verify `supabase-setup.sql` was run successfully
- If build fails: Check environment variables in Vercel

---
**Need help?** Check the deployment logs in Vercel dashboard or Supabase logs.