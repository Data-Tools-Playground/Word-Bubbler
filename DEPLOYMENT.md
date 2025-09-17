# Deployment Guide - Word Bubbler with Profile System

The app now includes API routes and database integration, requiring a server environment. GitHub Pages (static hosting) is no longer suitable.

## Recommended: Deploy to Vercel

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js configuration

2. **Configure Environment Variables in Vercel**
   ```
   # Database (Required for Profile System)
   DB_HOST=your-postgres-host
   DB_PORT=5432
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=word_bubble_profiles

   # Twilio SMS (Optional - for SMS integration)
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_PHONE_NUMBER=your-twilio-number
   NEXT_PUBLIC_TWILIO_PHONE_NUMBER=your-twilio-number
   ```

3. **Database Setup**
   - Use Vercel Postgres, Supabase, or any PostgreSQL provider
   - Run the schema from `database/schema.sql`
   - Update connection string in environment variables

4. **Deploy**
   - Push to main branch
   - Vercel will automatically build and deploy
   - Access your live app at `https://your-app.vercel.app`

## Alternative: Offline Mode Only

If you want to keep GitHub Pages deployment, you can:

1. Temporarily disable profile features
2. Re-enable `output: 'export'` in `next.config.ts`
3. Comment out database imports in components
4. Use only the offline word cloud analysis mode

## Features by Deployment Type

| Feature | GitHub Pages | Vercel |
|---------|-------------|--------|
| Offline word cloud analysis | ✅ | ✅ |
| Real-time collaborative polling | ❌ | ✅ |
| SMS integration | ❌ | ✅ |
| Profile building & evolution | ❌ | ✅ |
| Longitudinal insights | ❌ | ✅ |
| Opinion leader analysis | ❌ | ✅ |

## Current Status

- ❌ GitHub Actions disabled (incompatible with API routes)
- ✅ Local development working on http://localhost:3000
- 🚀 Ready for Vercel deployment with full feature set