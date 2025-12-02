# Environment Setup Guide

## Quick Switch Between Local and Production

### Option 1: Using Environment Files (Recommended)

**For Local Development:**
```bash
npm run dev
```
Uses `.env.development` automatically

**For Production Build:**
```bash
npm run build:prod
```
Uses `.env.production` automatically

### Option 2: Manual .env File

Edit `.env` file and change the API URL:

**Local:**
```
VITE_API_URL=/api
```

**Production:**
```
VITE_API_URL=https://royalblue-bear-657267.hostingersite.com/api
```

## Current Setup

- **Local API**: Uses vite proxy → `http://localhost/Backend/api`
- **Production API**: `https://royalblue-bear-657267.hostingersite.com/api`

## Commands

```bash
# Local development
npm run dev

# Production build
npm run build:prod

# Preview production build
npm run preview
```

## Deploy to Production

1. Run: `npm run build:prod`
2. Upload `dist/` folder to your hosting
3. Frontend will automatically connect to production backend
