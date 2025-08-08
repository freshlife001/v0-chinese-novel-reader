# Turso Migration Guide

This guide documents the migration from Vercel Blob storage to Turso database for the Chinese novel reader project.

## Why Migrate?

Vercel Blob storage had several limitations:
- Limited querying capabilities
- No structured data relationships
- Higher cost for frequent access
- Limited indexing options

Turso provides:
- Full SQLite database functionality
- Structured data with relationships
- Better performance for queries
- Lower cost for frequent access
- Strong typing and data integrity

## What Changed

### Storage Layer
- **Before**: Vercel Blob storage with JSON files
- **After**: Turso SQLite database with structured tables

### Data Models
- **Novels**: Now stored in `novels` table with proper fields
- **Chapters**: Stored in `chapters` table with foreign key relationship
- **Import Tasks**: New `import_tasks` table for tracking progress

### API Changes
- All API endpoints now use Turso database queries
- Better error handling and type safety
- Improved performance with database indexes

## Database Schema

The new database includes three main tables:

### Novels Table
- Stores novel metadata (title, author, description, etc.)
- Includes fields for cover, status, word count, etc.
- Auto timestamps for created_at and updated_at

### Chapters Table
- Stores chapter content with foreign key to novels
- Includes chapter number, title, content, URL
- Supports VIP chapters and metadata

### Import Tasks Table
- Tracks import progress and status
- Supports resume functionality
- Records success/failure statistics

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm add @libsql/client
```

### 2. Set Up Database
Run the setup script:
```bash
./scripts/setup-db.sh
```

Or manually:
```bash
# Create database
turso db create chinese-novel-reader

# Get credentials
turso db show chinese-novel-reader --url
turso db tokens create chinese-novel-reader

# Apply schema
turso db execute chinese-novel-reader --file lib/schema.sql
```

### 3. Configure Environment
Add to `.env`:
```bash
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

### 4. Test the Migration
```bash
npm run dev
```

## Benefits of the Migration

1. **Better Performance**: Database queries are faster than file operations
2. **Data Integrity**: Foreign keys and constraints ensure data consistency
3. **Improved Search**: Full-text search capabilities
4. **Scalability**: Better handling of large datasets
5. **Cost Efficiency**: Lower cost for frequent access patterns

## Backwards Compatibility

The migration maintains:
- Same API endpoints and response formats
- Same UI and user experience
- Same import functionality
- Same admin interface

## Local Development

For local development, you can use a local SQLite file:
```bash
TURSO_DATABASE_URL=file:local.db
```

No authentication token is needed for local files.

## Troubleshooting

### Common Issues
1. **Connection Errors**: Check database URL and auth token
2. **Schema Issues**: Ensure schema was applied correctly
3. **Permission Errors**: Verify auth token has proper permissions

### Debug Commands
```bash
# Check database status
turso db show chinese-novel-reader

# Test connection
turso db execute chinese-novel-reader "SELECT name FROM sqlite_master WHERE type='table';"

# Check tables
turso db execute chinese-novel-reader ".tables"
```

## Future Enhancements

With Turso, we can now implement:
- Full-text search
- Advanced filtering and sorting
- User accounts and preferences
- Reading progress tracking
- Recommendation engine
- Analytics and reporting