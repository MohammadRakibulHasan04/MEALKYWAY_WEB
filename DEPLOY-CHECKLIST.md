# 🚀 Netlify Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Files Ready

- [x] `netlify.toml` - Netlify configuration
- [x] `netlify/functions/server.js` - Serverless backend
- [x] `public/_redirects` - Route redirects
- [x] `package.json` - All dependencies listed
- [x] `.gitignore` - .env and sensitive files excluded

### 2. Environment Variables to Set in Netlify

```
SUPABASE_URL=https://mrueqcfkcslaijidndkg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydWVxY2ZrY3NsYWlqaWRuZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTc2ODcsImV4cCI6MjA4MDEzMzY4N30.uDH-aEpeUy7xjpYB9Yk96LF7y3r1NV7Be6J-_dsjk6c
SESSION_SECRET=mealky-way-production-secret-2024-secure-key
NODE_ENV=production
```

---

## 📝 Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Easiest)

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Login to Netlify**

   - Go to https://app.netlify.com
   - Sign in with GitHub

3. **Import Repository**

   - Click "Add new site" → "Import an existing project"
   - Select "Deploy with GitHub"
   - Choose your repository: `MohammadRakibulHasan04/MEALKYWAY_WEB`

4. **Configure Build Settings**

   - Base directory: (leave empty)
   - Build command: `npm install`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

5. **Add Environment Variables**

   - Go to Site settings → Environment variables
   - Add all variables from above
   - **IMPORTANT**: Generate a new `SESSION_SECRET` (use random string)

6. **Deploy**
   - Click "Deploy site"
   - Wait 2-3 minutes for build to complete

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod

# Follow prompts and set environment variables
```

---

## 🔧 Post-Deployment Tasks

### 1. Test Your Site

- ✅ Homepage loads: `https://your-site.netlify.app/`
- ✅ Order page works: `https://your-site.netlify.app/order`
- ✅ Admin login: `https://your-site.netlify.app/admin-login.html`
- ✅ Admin panel: `https://your-site.netlify.app/admin/panel`

### 2. Test API Endpoints

- Test order submission
- Test admin login
- Test order management

### 3. Database Verification

- Ensure Supabase is accessible
- Check tables have proper data
- Verify admin user exists

### 4. Custom Domain (Optional)

- Go to Site settings → Domain management
- Click "Add custom domain"
- Follow DNS configuration steps

---

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore` (not pushed to GitHub)
- [ ] Environment variables set in Netlify dashboard
- [ ] SESSION_SECRET is unique and secure
- [ ] Admin password is strong
- [ ] Supabase RLS (Row Level Security) policies are enabled

---

## 📊 Monitoring

### Check Logs

- Netlify Dashboard → Functions → View logs
- Monitor for errors or issues

### Analytics

- Enable Netlify Analytics (optional)
- Track visitor stats

---

## 🐛 Troubleshooting

### Build Fails

- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

### API Not Working

- Check environment variables are set correctly
- View function logs for errors
- Test API endpoints directly

### Database Connection Issues

- Verify Supabase credentials
- Check Supabase project is active
- Review Supabase logs

### 404 Errors

- Check `_redirects` file exists in `public/`
- Verify redirect rules in `netlify.toml`

---

## 📞 Support Resources

- Netlify Docs: https://docs.netlify.com
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: Create issue in your repository

---

## 🎉 Success!

Once deployed, your site will be live at:

- **Netlify URL**: `https://your-site-name.netlify.app`
- **Custom Domain**: (if configured)

Share your link and start accepting orders! 🥛
