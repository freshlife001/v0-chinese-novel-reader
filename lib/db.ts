import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export interface Novel {
  id: string
  title: string
  author: string
  description?: string
  category: string
  cover?: string
  status: string
  source?: string
  wordCount: number
  createdAt: string
  updatedAt: string
  lastUpdate?: string
  latestChapter?: string
}

export interface Chapter {
  id: number
  novelId: string
  chapterNumber: number
  title: string
  content: string
  url?: string
  isVip: boolean
  createdAt: string
  updatedAt: string
}

export interface ImportTask {
  id: string
  novelId?: string
  taskType: 'import' | 'update' | 'retry'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  totalChapters: number
  importedChapters: number
  failedChapters: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export async function getAllNovels(): Promise<Novel[]> {
  try {
    const result = await client.execute({
      sql: `
        SELECT 
          id,
          title,
          author,
          description,
          category,
          cover,
          status,
          source,
          word_count as "wordCount",
          created_at as "createdAt",
          updated_at as "updatedAt",
          last_update as "lastUpdate",
          latest_chapter as "latestChapter"
        FROM novels 
        ORDER BY created_at DESC
      `,
      args: []
    })
    
    return result.rows as unknown as Novel[]
  } catch (error) {
    console.error('Error getting novels:', error)
    return []
  }
}

export async function getNovelById(id: string): Promise<Novel | null> {
  try {
    const result = await client.execute({
      sql: `
        SELECT 
          id,
          title,
          author,
          description,
          category,
          cover,
          status,
          source,
          word_count as "wordCount",
          created_at as "createdAt",
          updated_at as "updatedAt",
          last_update as "lastUpdate",
          latest_chapter as "latestChapter"
        FROM novels 
        WHERE id = ?
      `,
      args: [id]
    })
    
    return result.rows[0] as unknown as Novel || null
  } catch (error) {
    console.error('Error getting novel by ID:', error)
    return null
  }
}

export async function createNovel(novel: Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>): Promise<Novel> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  try {
    const result = await client.execute({
      sql: `
        INSERT INTO novels (
          id, title, author, description, category, cover, status, 
          source, word_count, created_at, updated_at, last_update, latest_chapter
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        novel.title,
        novel.author,
        novel.description,
        novel.category,
        novel.cover,
        novel.status,
        novel.source,
        novel.wordCount,
        now,
        now,
        novel.lastUpdate,
        novel.latestChapter
      ]
    })
    
    return {
      id,
      ...novel,
      createdAt: now,
      updatedAt: now
    } as Novel
  } catch (error) {
    console.error('Error creating novel:', error)
    throw error
  }
}

export async function updateNovel(id: string, updates: Partial<Novel>): Promise<Novel | null> {
  try {
    const fields = []
    const args = []
    
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue
      
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      fields.push(`${dbField} = ?`)
      args.push(value)
    }
    
    if (fields.length === 0) return null
    
    args.push(id)
    
    await client.execute({
      sql: `UPDATE novels SET ${fields.join(', ')} WHERE id = ?`,
      args
    })
    
    return getNovelById(id)
  } catch (error) {
    console.error('Error updating novel:', error)
    throw error
  }
}

export async function getChaptersByNovelId(novelId: string): Promise<Chapter[]> {
  try {
    const result = await client.execute({
      sql: `
        SELECT 
          id,
          novel_id as "novelId",
          chapter_number as "chapterNumber",
          title,
          content,
          url,
          is_vip as "isVip",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM chapters 
        WHERE novel_id = ?
        ORDER BY chapter_number ASC
      `,
      args: [novelId]
    })
    
    return result.rows as unknown as Chapter[]
  } catch (error) {
    console.error('Error getting chapters:', error)
    return []
  }
}

export async function getChapterByNumber(novelId: string, chapterNumber: number): Promise<Chapter | null> {
  try {
    const result = await client.execute({
      sql: `
        SELECT 
          id,
          novel_id as "novelId",
          chapter_number as "chapterNumber",
          title,
          content,
          url,
          is_vip as "isVip",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM chapters 
        WHERE novel_id = ? AND chapter_number = ?
      `,
      args: [novelId, chapterNumber]
    })
    
    return result.rows[0] as unknown as Chapter || null
  } catch (error) {
    console.error('Error getting chapter by number:', error)
    return null
  }
}

export async function createChapter(chapter: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chapter> {
  try {
    const result = await client.execute({
      sql: `
        INSERT INTO chapters (
          novel_id, chapter_number, title, content, url, is_vip, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      args: [
        chapter.novelId,
        chapter.chapterNumber,
        chapter.title,
        chapter.content,
        chapter.url || null,
        chapter.isVip
      ]
    })
    
    // Get the inserted chapter
    const insertedChapter = await getChapterByNumber(chapter.novelId, chapter.chapterNumber)
    if (!insertedChapter) {
      throw new Error('Failed to retrieve created chapter')
    }
    
    return insertedChapter
  } catch (error) {
    console.error('Error creating chapter:', error)
    throw error
  }
}

export async function createImportTask(task: Omit<ImportTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<ImportTask> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  try {
    await client.execute({
      sql: `
        INSERT INTO import_tasks (
          id, novel_id, task_type, status, total_chapters, imported_chapters, failed_chapters, error_message, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        task.novelId || null,
        task.taskType,
        task.status,
        Number(task.totalChapters) || 0,
        Number(task.importedChapters) || 0,
        Number(task.failedChapters) || 0,
        task.errorMessage || null,
        now,
        now
      ]
    })
    
    return {
      id,
      ...task,
      createdAt: now,
      updatedAt: now
    } as ImportTask
  } catch (error) {
    console.error('Error creating import task:', error)
    throw error
  }
}

export async function updateImportTask(id: string, updates: Partial<ImportTask>): Promise<ImportTask | null> {
  try {
    const fields = []
    const args = []
    
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue
      
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      fields.push(`${dbField} = ?`)
      
      // Convert numeric values to ensure proper type
      if (key.includes('Chapters')) {
        args.push(Number(value) || 0)
      } else if (value === undefined || value === null) {
        args.push(null)
      } else {
        args.push(value)
      }
    }
    
    if (fields.length === 0) return null
    
    args.push(id)
    
    await client.execute({
      sql: `UPDATE import_tasks SET ${fields.join(', ')} WHERE id = ?`,
      args
    })
    
    const result = await client.execute({
      sql: 'SELECT * FROM import_tasks WHERE id = ?',
      args: [id]
    })
    
    const task = result.rows[0]
    if (!task) return null
    
    return {
      id: task.id,
      novelId: task.novel_id,
      taskType: task.task_type,
      status: task.status,
      totalChapters: task.total_chapters,
      importedChapters: task.imported_chapters,
      failedChapters: task.failed_chapters,
      errorMessage: task.error_message,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    } as unknown as ImportTask
  } catch (error) {
    console.error('Error updating import task:', error)
    throw error
  }
}

export async function getImportTask(id: string): Promise<ImportTask | null> {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM import_tasks WHERE id = ?',
      args: [id]
    })
    
    const task = result.rows[0]
    if (!task) return null
    
    return {
      id: task.id,
      novelId: task.novel_id,
      taskType: task.task_type,
      status: task.status,
      totalChapters: task.total_chapters,
      importedChapters: task.imported_chapters,
      failedChapters: task.failed_chapters,
      errorMessage: task.error_message,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    } as unknown as ImportTask
  } catch (error) {
    console.error('Error getting import task:', error)
    return null
  }
}

export async function getAllImportTasks(): Promise<ImportTask[]> {
  try {
    const result = await client.execute({
      sql: `
        SELECT 
          id,
          novel_id as "novelId",
          task_type as "taskType",
          status,
          total_chapters as "totalChapters",
          imported_chapters as "importedChapters",
          failed_chapters as "failedChapters",
          error_message as "errorMessage",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM import_tasks 
        ORDER BY created_at DESC
      `,
      args: []
    })
    
    return result.rows as unknown as ImportTask[]
  } catch (error) {
    console.error('Error getting all import tasks:', error)
    return []
  }
}

export async function getPendingImportTasks(limit: number = 10): Promise<ImportTask[]> {
  try {
    const result = await client.execute({
      sql: `
        SELECT 
          id,
          novel_id as "novelId",
          task_type as "taskType",
          status,
          total_chapters as "totalChapters",
          imported_chapters as "importedChapters",
          failed_chapters as "failedChapters",
          error_message as "errorMessage",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM import_tasks 
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT ?
      `,
      args: [limit]
    })
    
    return result.rows as unknown as ImportTask[]
  } catch (error) {
    console.error('Error getting pending import tasks:', error)
    return []
  }
}

export default client