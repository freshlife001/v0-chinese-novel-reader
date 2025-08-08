import { NextRequest, NextResponse } from 'next/server'
import { getNovelById, getChaptersByNovelId } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const novelId = params.id
    
    const novel = await getNovelById(novelId)
    
    if (!novel) {
      return NextResponse.json({ error: '小说不存在' }, { status: 404 })
    }

    // Get chapters for this novel
    const chapters = await getChaptersByNovelId(novelId)
    
    return NextResponse.json({ 
      novel: {
        ...novel,
        chapters: chapters.map(ch => ({
          id: ch.chapterNumber,
          title: ch.title,
          url: ch.url,
          isVip: ch.isVip
        }))
      }
    })
  } catch (error) {
    console.error('Get novel error:', error)
    return NextResponse.json({ error: '获取小说信息失败' }, { status: 500 })
  }
}
