import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const { id: novelId, chapterId } = params
    
    // Check if we have Blob storage configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: '存储服务未配置' }, { status: 500 })
    }

    // Import Vercel Blob functions only if token is available
    const { list } = await import('@vercel/blob')
    
    // Get chapter from Blob storage
    const { blobs } = await list({
      prefix: `chapters/${novelId}/${chapterId}.json`,
      limit: 1
    })
    
    if (blobs.length === 0) {
      return NextResponse.json({ error: '章节不存在' }, { status: 404 })
    }

    const response = await fetch(blobs[0].url)
    if (!response.ok) {
      return NextResponse.json({ error: '获取章节内容失败' }, { status: 500 })
    }

    const chapter = await response.json()
    
    return NextResponse.json({ chapter })
  } catch (error) {
    console.error('Get chapter error:', error)
    return NextResponse.json({ error: '获取章节内容失败' }, { status: 500 })
  }
}
