import { NextRequest, NextResponse } from 'next/server'
import { getChapterByNumber } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const { id: novelId, chapterId } = await params
    
    const chapterNumber = parseInt(chapterId)
    if (isNaN(chapterNumber)) {
      return NextResponse.json({ error: '章节ID无效' }, { status: 400 })
    }
    
    const chapter = await getChapterByNumber(novelId, chapterNumber)
    
    if (!chapter) {
      return NextResponse.json({ error: '章节不存在' }, { status: 404 })
    }
    
    return NextResponse.json({ chapter })
  } catch (error) {
    console.error('Get chapter error:', error)
    return NextResponse.json({ error: '获取章节内容失败' }, { status: 500 })
  }
}
