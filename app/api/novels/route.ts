import { NextRequest, NextResponse } from 'next/server'
import { getAllNovels } from '@/lib/db'
import client from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const novels = await getAllNovels()
    
    // Get chapter counts for each novel
    const novelIds = novels.map(novel => novel.id)
    let chapterCounts: { [key: string]: number } = {}
    
    if (novelIds.length > 0) {
      try {
        // Get chapter counts in a single query
        const placeholders = novelIds.map(() => '?').join(',')
        const result = await client.execute({
          sql: `
            SELECT novel_id, COUNT(*) as count 
            FROM chapters 
            WHERE novel_id IN (${placeholders})
            GROUP BY novel_id
          `,
          args: novelIds
        })
        
        chapterCounts = result.rows.reduce((acc, row) => {
          acc[row.novel_id] = row.count
          return acc
        }, {} as { [key: string]: number })
      } catch (error) {
        console.error('Error getting chapter counts:', error)
      }
    }
    
    // Transform novels to match the expected format
    const transformedNovels = novels.map(novel => ({
      id: novel.id,
      title: novel.title,
      author: novel.author,
      category: novel.category,
      status: novel.status,
      chapters: chapterCounts[novel.id] || 0,
      lastUpdate: novel.lastUpdate,
      createdAt: novel.createdAt,
      cover: novel.cover
    }))
    
    return NextResponse.json({ novels: transformedNovels })
  } catch (error) {
    console.error('Get novels error:', error)
    return NextResponse.json({ novels: [] })
  }
}
