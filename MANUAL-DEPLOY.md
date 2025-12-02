# 🚀 Manual Deployment Guide - Netlify CLI

## Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

Wait for installation to complete.

## Step 2: Login to Netlify

```bash
netlify login
```

This will open your browser. Login with your Netlify/GitHub account.

## Step 3: Initialize Site (First Time Only)

```bash
netlify init
```

Follow the prompts:

- **Create & configure a new site**
- Choose your team
- Site name: `mealkyway` (or your preferred name)
- Build command: `npm install`
- Directory to deploy: `public`
- Netlify functions folder: `netlify/functions`

## Step 4: Set Environment Variables

```bash
netlify env:set SUPABASE_URL "https://mrueqcfkcslaijidndkg.supabase.co"
netlify env:set SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydWVxY2ZrY3NsYWlqaWRuZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTc2ODcsImV4cCI6MjA4MDEzMzY4N30.uDH-aEpeUy7xjpYB9Yk96LF7y3r1NV7Be6J-_dsjk6c"
netlify env:set SESSION_SECRET "your-random-secure-secret-key-here"
netlify env:set NODE_ENV "production"
```

**Important:** Change the `SESSION_SECRET` to your own random string!

## Step 5: Deploy

### Option A: Deploy to Preview (Test First)

```bash
netlify deploy
```

This creates a draft URL to test before going live.

### Option B: Deploy to Production (Live Site)

```bash
netlify deploy --prod
```

This publishes your site immediately.

## Step 6: Verify Deployment

After deployment completes, you'll see:

- **Website Draft URL**: https://xxxxx--site-name.netlify.app (for preview)
- **Live URL**: https://site-name.netlify.app (for production)

Test these URLs:

- Homepage: `/`
- Order page: `/order`
- Admin login: `/admin-login.html`
- Admin panel: `/admin/panel`

---

## 📋 Quick Reference Commands

```bash
# Check status
netlify status

# Open site in browser
netlify open

# Open admin dashboard
netlify open:admin

# View logs
netlify logs

# Check environment variables
netlify env:list

# Redeploy
netlify deploy --prod

# Link existing site (if you created site on dashboard)
netlify link
```

---

## 🐛 Troubleshooting

### CLI Not Found

```bash
# Reinstall globally
npm install -g netlify-cli

# Or use npx (no install needed)
npx netlify-cli login
npx netlify-cli deploy --prod
```

### Build Fails

```bash
# Test locally first
npm install
npm start

# Check for errors
netlify deploy --build
```

### Functions Not Working

- Verify environment variables: `netlify env:list`
- Check function logs: `netlify functions:log server`
- Test locally: `netlify dev`

---

## 🔄 Redeploying Updates

After making changes:

```bash
# Stage changes
git add .
git commit -m "Update features"

# Deploy
netlify deploy --prod
```

---

## ✅ Success!

Your site is now live! 🎉

**Next Steps:**

1. Test all features on live site
2. Add custom domain (optional): `netlify domains:add yourdomain.com`
3. Enable HTTPS (automatic on Netlify)
4. Share your link!

**Site URLs:**

- Netlify URL: Check output after deployment
- Functions: `/.netlify/functions/server`
- Admin: `/admin-login.html`
