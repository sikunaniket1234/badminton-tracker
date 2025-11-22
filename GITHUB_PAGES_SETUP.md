# GitHub Pages Deployment Guide

## Steps to Deploy to GitHub Pages

### 1. Create a GitHub Repository
- Go to [github.com/new](https://github.com/new)
- Create a new repository named **`badminton-tracker`**
- Do NOT initialize with README (we have one)

### 2. Push Code to GitHub
```bash
cd o:\New folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/badminton-tracker.git
git push -u origin main
```

### 3. Update Homepage URL
Replace `YOUR_USERNAME` in `package.json` with your actual GitHub username:
```json
"homepage": "https://YOUR_USERNAME.github.io/badminton-tracker",
```

Then rebuild:
```bash
npm run build
git add .
git commit -m "Update homepage URL"
git push
```

### 4. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under "Build and deployment":
   - Source: Select **GitHub Actions**
   - The workflow will automatically deploy when you push to main

### 5. Wait for Deployment
- The GitHub Actions workflow will automatically build and deploy
- Check the **Actions** tab to see deployment status
- Your site will be live at: `https://YOUR_USERNAME.github.io/badminton-tracker`

## Files Configured for GitHub Pages

- **`vite.config.ts`** - Added base path `/badminton-tracker/`
- **`package.json`** - Added homepage URL
- **`.github/workflows/deploy.yml`** - Automated deployment workflow
- **`public/.nojekyll`** - Tells GitHub to serve as static site

## Features

✅ All data stored in browser localStorage (no backend needed)
✅ Fully responsive design
✅ No external API calls
✅ Works offline after first load

## Testing Before Deploy

To test the build locally:
```bash
npm run build
npm install -g serve
serve -s dist
```

Then visit: `http://localhost:3000/badminton-tracker/`
