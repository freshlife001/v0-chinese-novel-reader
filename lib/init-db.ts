import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export async function initializeDatabase() {
  try {
    console.log('Initializing database...')
    
    // Define all SQL statements manually to avoid parsing issues
    const statements = [
      // Tables
      `CREATE TABLE IF NOT EXISTS novels (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT '其他',
        cover TEXT,
        status TEXT DEFAULT '连载中',
        source TEXT,
        word_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_update TEXT,
        latest_chapter TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        novel_id TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        url TEXT,
        is_vip BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
        UNIQUE(novel_id, chapter_number)
      )`,
      
      `CREATE TABLE IF NOT EXISTS import_tasks (
        id TEXT PRIMARY KEY,
        novel_id TEXT,
        task_type TEXT NOT NULL,
        status TEXT NOT NULL,
        total_chapters INTEGER DEFAULT 0,
        imported_chapters INTEGER DEFAULT 0,
        failed_chapters INTEGER DEFAULT 0,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
      )`,
      
      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_novels_title ON novels(title)`,
      `CREATE INDEX IF NOT EXISTS idx_novels_author ON novels(author)`,
      `CREATE INDEX IF NOT EXISTS idx_novels_category ON novels(category)`,
      `CREATE INDEX IF NOT EXISTS idx_novels_created_at ON novels(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_chapters_novel_id ON chapters(novel_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chapters_novel_number ON chapters(novel_id, chapter_number)`,
      `CREATE INDEX IF NOT EXISTS idx_import_tasks_status ON import_tasks(status)`,
      `CREATE INDEX IF NOT EXISTS idx_import_tasks_novel_id ON import_tasks(novel_id)`,
      
      // Triggers
      `CREATE TRIGGER IF NOT EXISTS update_novels_updated_at 
        AFTER UPDATE ON novels
        FOR EACH ROW
      BEGIN
        UPDATE novels SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END`,
      
      `CREATE TRIGGER IF NOT EXISTS update_chapters_updated_at 
        AFTER UPDATE ON chapters
        FOR EACH ROW
      BEGIN
        UPDATE chapters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END`,
      
      `CREATE TRIGGER IF NOT EXISTS update_import_tasks_updated_at 
        AFTER UPDATE ON import_tasks
        FOR EACH ROW
      BEGIN
        UPDATE import_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END`
    ]
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      try {
        await client.execute({
          sql: statement,
          args: []
        })
        console.log(`Statement ${i + 1}/${statements.length} executed successfully`)
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error)
        console.error('Statement:', statement.substring(0, 100) + '...')
        throw error
      }
    }
    
    console.log('Database initialized successfully!')
    
    // Verify tables exist
    const tables = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('novels', 'chapters', 'import_tasks')
    `)
    
    console.log('Verified tables:', tables.rows.map(row => row.name))
    
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Database initialization failed:', error)
      process.exit(1)
    })
}

export default initializeDatabase