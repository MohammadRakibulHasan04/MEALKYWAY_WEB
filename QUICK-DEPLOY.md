# 🚀 Quick Deploy to Netlify - 5 Minutes

## Step 1: Push to GitHub (1 min)

```bash
git add .
git commit -m "Deploy to Netlify"
git push origin main
```

## Step 2: Connect to Netlify (2 min)

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and select this repository
4. Build settings (auto-detected):
   - Build command: `npm install`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

## Step 3: Add Environment Variables (1 min)

In Netlify Dashboard → Site settings → Environment variables, add:

```bash
SUPABASE_URL=https://mrueqcfkcslaijidndkg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydWVxY2ZrY3NsYWlqaWRuZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTc2ODcsImV4cCI6MjA4MDEzMzY4N30.uDH-aEpeUy7xjpYB9Yk96LF7y3r1NV7Be6J-_dsjk6c
SESSION_SECRET=your-random-secret-key-here-change-this
NODE_ENV=production
```

**⚠️ IMPORTANT**: Change `SESSION_SECRET` to a random string!

## Step 4: Deploy (1 min)

Click **"Deploy site"** and wait for build to complete.

## Step 5: Test Your Site

- Homepage: `https://your-site.netlify.app`
- Order page: `https://your-site.netlify.app/order`
- Admin: `https://your-site.netlify.app/admin-login.html`

---

## ✅ Your Site is Live!

**What works:**

- ✅ Customer order form
- ✅ Multi-day order system
- ✅ Custom date picker
- ✅ Admin panel with authentication
- ✅ Order management (edit, delete, export)
- ✅ Real-time database with Supabase

**Next Steps:**

1. Test all features
2. Add custom domain (optional)
3. Share your link!

---

## 🐛 If Something Goes Wrong

**Build Failed?**

- Check build logs in Netlify dashboard
- Ensure environment variables are set

**API Not Working?**

- Verify environment variables are correct
- Check Functions logs for errors

**Need Help?**

- See `DEPLOY-CHECKLIST.md` for detailed troubleshooting
- Check `NETLIFY-DEPLOYMENT.md` for full documentation
