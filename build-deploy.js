const fs = require("fs");
const path = require("path");

console.log("🚀 Building deployment package...\n");

// Create dist directory
const distDir = path.join(__dirname, "dist");
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
  console.log("✓ Cleaned old dist folder");
}
fs.mkdirSync(distDir);
console.log("✓ Created dist folder");

// Copy public folder (maintain folder structure)
const publicDir = path.join(__dirname, "public");
const distPublicDir = path.join(distDir, "public");
copyRecursive(publicDir, distPublicDir);
console.log("✓ Copied public files");

// Create netlify folder structure in dist
const distNetlifyDir = path.join(distDir, "netlify");
const distFunctionsDir = path.join(distNetlifyDir, "functions");
fs.mkdirSync(distNetlifyDir, { recursive: true });
fs.mkdirSync(distFunctionsDir, { recursive: true });
console.log("✓ Created netlify/functions folder");

// Copy server function
const serverFunction = path.join(
  __dirname,
  "netlify",
  "functions",
  "server.js"
);
const distServerFunction = path.join(distFunctionsDir, "server.js");
fs.copyFileSync(serverFunction, distServerFunction);
console.log("✓ Copied serverless function");

// Copy database folder for supabase client (to root of dist)
const databaseDir = path.join(__dirname, "database");
const distDatabaseDir = path.join(distDir, "database");
fs.mkdirSync(distDatabaseDir, { recursive: true });
fs.copyFileSync(
  path.join(databaseDir, "supabase.js"),
  path.join(distDatabaseDir, "supabase.js")
);
console.log("✓ Copied database files");

// Copy package.json and package-lock.json
fs.copyFileSync(
  path.join(__dirname, "package.json"),
  path.join(distDir, "package.json")
);
if (fs.existsSync(path.join(__dirname, "package-lock.json"))) {
  fs.copyFileSync(
    path.join(__dirname, "package-lock.json"),
    path.join(distDir, "package-lock.json")
  );
}
console.log("✓ Copied package files");

// Copy netlify.toml
fs.copyFileSync(
  path.join(__dirname, "netlify.toml"),
  path.join(distDir, "netlify.toml")
);
console.log("✓ Copied netlify.toml");

// Create .env.example for reference
const envExample = `# Environment Variables - Set these in Netlify Dashboard
SUPABASE_URL=https://mrueqcfkcslaijidndkg.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=production
`;
fs.writeFileSync(path.join(distDir, ".env.example"), envExample);
console.log("✓ Created .env.example");

// Create deployment instructions
const instructions = `# 🚀 Netlify Deployment Instructions

## Your deployment package is ready in the 'dist' folder!

### Deploy via Netlify Dashboard (Drag & Drop):

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Login with your account

2. **Deploy Site**
   - Click "Add new site" → "Deploy manually"
   - Drag & drop the entire 'dist' folder
   - Wait for deployment to complete

3. **Set Environment Variables**
   After deployment, go to: Site settings → Environment variables
   
   Add these variables:
   \`\`\`
   SUPABASE_URL=https://mrueqcfkcslaijidndkg.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydWVxY2ZrY3NsYWlqaWRuZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTc2ODcsImV4cCI6MjA4MDEzMzY4N30.uDH-aEpeUy7xjpYB9Yk96LF7y3r1NV7Be6J-_dsjk6c
   SESSION_SECRET=your-random-secure-key-here
   NODE_ENV=production
   \`\`\`

4. **Trigger Redeploy**
   - Go to: Deploys → Trigger deploy → Deploy site
   - This ensures environment variables are loaded

5. **Test Your Site**
   - Homepage: https://your-site.netlify.app
   - Order page: https://your-site.netlify.app/order
   - Admin: https://your-site.netlify.app/admin-login.html

## ✅ That's it! Your site is live!

### Updating Your Site:

1. Make changes to your code
2. Run: \`npm run build:deploy\`
3. Drag & drop the new 'dist' folder to Netlify

### Files Included:
- All HTML, CSS, JS files from public/
- Serverless function for backend API
- Netlify configuration (netlify.toml)
- Database connection (supabase.js)
- Package dependencies (package.json)

### What Netlify Will Do:
- Install dependencies automatically
- Run serverless functions
- Serve static files
- Handle redirects
- Enable HTTPS
`;

fs.writeFileSync(path.join(distDir, "DEPLOY-INSTRUCTIONS.md"), instructions);
console.log("✓ Created deployment instructions");

console.log("\n✅ Build complete!");
console.log("\n📦 Deployment package created in: dist/");
console.log("\n📋 Next steps:");
console.log("   1. Go to https://app.netlify.com");
console.log('   2. Drag & drop the "dist" folder');
console.log(
  "   3. Set environment variables (see dist/DEPLOY-INSTRUCTIONS.md)"
);
console.log("\n🎉 Your site will be live in minutes!\n");

// Helper function to copy directory recursively
function copyRecursive(src, dest) {
  if (fs.lstatSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}
