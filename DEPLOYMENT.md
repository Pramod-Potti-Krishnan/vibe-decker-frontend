# Deckster Deployment Guide

This guide will walk you through deploying the Deckster frontend to deckster.xyz using Vercel.

## Prerequisites

- Git installed and configured
- GitHub account
- Vercel account (free tier is sufficient)
- Access to deckster.xyz domain management

## Step 1: Push Code to GitHub

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name: `deckster-frontend` (or your preferred name)
   - Description: "AI-powered presentation builder frontend"
   - Keep it public or private as preferred
   - DO NOT initialize with README (we already have code)

2. Push your local code to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/deckster-frontend.git
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```
   
   When prompted:
   - Set up and deploy: Y
   - Which scope: Select your account
   - Link to existing project: N
   - Project name: deckster
   - In which directory: ./
   - Want to override settings: N

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

## Step 3: Configure Environment Variables

In Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following:
   ```
   NEXT_PUBLIC_API_URL = https://vibe-decker-agents-mvp10-production.up.railway.app
   ```
4. Click "Save"

## Step 4: Configure Custom Domain

### In Vercel Dashboard:

1. Go to Project Settings → Domains
2. Add domain: `deckster.xyz`
3. Add www subdomain: `www.deckster.xyz`

### DNS Configuration:

Choose one of these options:

#### Option 1: Use Vercel's Nameservers (Easiest)
Change your domain's nameservers to:
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

#### Option 2: Add Individual Records
Add these DNS records at your domain registrar:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

## Step 5: Deploy and Verify

1. Push any changes to trigger deployment:
   ```bash
   git add .
   git commit -m "Configure for production deployment"
   git push
   ```

2. Monitor deployment in Vercel dashboard

3. Once deployed, verify:
   - https://deckster.xyz loads correctly
   - https://www.deckster.xyz redirects properly
   - SSL certificate is active
   - API connections work

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] API endpoint accessible
- [ ] WebSocket connections working
- [ ] SEO metadata visible
- [ ] Favicon loading
- [ ] Mobile responsive

## Monitoring and Maintenance

### Analytics
Enable Vercel Analytics:
1. Go to Project → Analytics
2. Enable Web Analytics
3. View metrics at: https://vercel.com/YOUR_USERNAME/deckster/analytics

### Logs
View logs:
1. Go to Project → Functions
2. View real-time logs
3. Set up log drains if needed

### Updates
To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push
```

Vercel automatically deploys on push to main branch.

## Troubleshooting

### Domain Not Working
- Wait 24-48 hours for DNS propagation
- Verify DNS records using: `nslookup deckster.xyz`
- Check Vercel domain status in dashboard

### API Connection Issues
- Verify NEXT_PUBLIC_API_URL is set correctly
- Check browser console for CORS errors
- Ensure API is accessible from production

### Build Failures
- Check build logs in Vercel dashboard
- Run `pnpm build` locally to test
- Verify all dependencies are in package.json

### WebSocket Connection Failed
- Ensure WSS protocol is used in production
- Check for mixed content warnings
- Verify API supports WebSocket on production URL

## Support

- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Create issue in GitHub repository for bugs

## Security Notes

- Never commit `.env.local` file
- Keep API keys in Vercel environment variables
- Enable 2FA on GitHub and Vercel accounts
- Regularly update dependencies