import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { join } from 'path'
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
    
    // Read schema.sql file
    const schemaPath = join(__dirname, 'schema.sql')
    const schemaContent = readFileSync(schemaPath, 'utf8')
    
    // Parse SQL statements more carefully to handle triggers with multiple statements
    const statements = []
    let currentStatement = ''
    let inTrigger = false
    
    const lines = schemaContent.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Skip empty lines and comments
      if (trimmedLine === '' || trimmedLine.startsWith('--')) {
        continue
      }
      
      currentStatement += line + '\n'
      
      // Check if we're in a trigger
      if (trimmedLine.toUpperCase().includes('CREATE TRIGGER')) {
        inTrigger = true
      }
      
      // End of statement (semicolon) and not in trigger middle
      if (trimmedLine.endsWith(';') && !inTrigger) {
        const cleaned = currentStatement.trim()
        if (cleaned.length > 0) {
          statements.push(cleaned)
        }
        currentStatement = ''
      } 
      // End of trigger (END;)
      else if (trimmedLine === 'END;' && inTrigger) {
        const cleaned = currentStatement.trim()
        if (cleaned.length > 0) {
          statements.push(cleaned)
        }
        currentStatement = ''
        inTrigger = false
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim())
    }
    
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
      WHERE type='table' AND name IN ('novels', 'chapters', 'import_tasks', 'chapter_urls')
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