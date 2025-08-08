# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chinese novel reader application built with Next.js 15 and deployed on Vercel. The application allows users to:
- Browse and read Chinese novels
- Import novels from external websites using web scraping
- Manage novel content through an admin interface
- Store novel data using Vercel Blob storage

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Package management
npm install          # Install dependencies
```

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Storage**: Vercel Blob for novel and chapter data
- **Web Scraping**: Cheerio for parsing novel content from external sites
- **UI Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React

## Key Architecture Components

### Data Storage
- **Turso Database**: SQLite database for novels, chapters, and import tasks
- **Novels Table**: Stores novel metadata (title, author, description, etc.)
- **Chapters Table**: Stores chapter content with foreign key to novels
- **Import Tasks Table**: Tracks import progress and status
- **Indexes**: Optimized queries for title, author, category, and created_at

### API Routes Structure
```
/app/api/
├── novels/              # CRUD operations for novels
├── import/              # Novel import from URLs
├── import-chapters/     # Chapter import processing
├── import-status/       # Import task status tracking
├── blob-test/           # Storage configuration testing
└── chapters/            # Individual chapter retrieval
```

### Admin Interface
- **Path**: `/admin/`
- **Features**: Import management, storage testing, novel management
- **Key Pages**:
  - `/admin/import` - Import novels from URLs
  - `/admin/blob-test` - Test Vercel Blob configuration
  - `/admin/import-status` - Monitor import progress

### Novel Import Process
1. **URL Parsing**: Uses Cheerio with specific CSS selectors to extract novel info
2. **Duplicate Detection**: Checks for existing novels by title and author
3. **Resume Support**: Can continue interrupted imports
4. **Chapter Processing**: Imports chapters individually with progress tracking

## Environment Configuration

### Required Environment Variables
```bash
TURSO_DATABASE_URL       # Turso database URL (e.g., libsql://your-db.turso.io)
TURSO_AUTH_TOKEN         # Turso database authentication token
```

### Database Setup
1. Create a Turso database: `turso db create chinese-novel-reader`
2. Get database URL: `turso db show chinese-novel-reader --url`
3. Create auth token: `turso db tokens create chinese-novel-reader`
4. Run schema: `turso db execute chinese-novel-reader --file lib/schema.sql`

### Local Development
For local development, you can use a local SQLite file:
```bash
TURSO_DATABASE_URL=file:local.db
# No TURSO_AUTH_TOKEN needed for local files
```

### Vercel Configuration
- **Build Settings**: ESLint and TypeScript errors ignored during builds (see next.config.mjs)
- **Environment Variables**: Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel project settings

## Key Files and Patterns

### Component Structure
- **UI Components**: Located in `/components/ui/` (shadcn/ui)
- **Pages**: App Router structure in `/app/`
- **Layout**: Root layout in `/app/layout.tsx`

### Data Models
```typescript
interface Novel {
  id: string
  title: string
  author: string
  description: string
  category: string
  chapters: Chapter[]
  cover?: string
  status: string
  lastUpdate?: string
  createdAt: string
}

interface Chapter {
  id: number
  title: string
  content: string
  url?: string
  isVip?: boolean
}
```

### Import CSS Selectors
The import system uses specific CSS selectors for parsing:
- Title: `div:nth-child(2) > div > div.info-main > div > h1`
- Author: `body > div:nth-child(2) > div > div.info-main > div > div.w100.dispc > span`
- Description: `body > div:nth-child(2) > div > div.info-main > div > div.info-main-intro > p`
- Chapters: `body > div.container.border3-2.mt8.mb20 > ul a`

## Development Notes

### Build Configuration
- TypeScript and ESLint errors are ignored during builds (next.config.mjs)
- Image optimization is disabled (`unoptimized: true`)
- Uses Geist font family

### Storage Dependencies
- Application requires Vercel Blob storage to function properly
- Falls back gracefully when storage is not configured
- Import functionality is disabled without proper storage setup

### Chinese Language Support
- All UI text is in Chinese
- Novel content parsing optimized for Chinese novel websites
- Character encoding handled automatically by Next.js

### Error Handling
- Graceful fallbacks for missing storage configuration
- Comprehensive error handling in API routes
- User-friendly error messages in Chinese