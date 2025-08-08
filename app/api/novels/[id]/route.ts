import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const novelId = params.id
    
    // Check if we have Blob storage configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: '存储服务未配置' }, { status: 500 })
    }

    // Import Vercel Blob functions only if token is available
    const { list } = await import('@vercel/blob')
    
    // Get novel from Blob storage
    const { blobs } = await list({
      prefix: `novels/${novelId}.json`,
      limit: 1
    })
    
    if (blobs.length === 0) {
      return NextResponse.json({ error: '小说不存在' }, { status: 404 })
    }

    const response = await fetch(blobs[0].url)
    if (!response.ok) {
      return NextResponse.json({ error: '获取小说信息失败' }, { status: 500 })
    }

    const novel = await response.json()
    
    return NextResponse.json({ novel })
  } catch (error) {
    console.error('Get novel error:', error)
    return NextResponse.json({ error: '获取小说信息失败' }, { status: 500 })
  }
}
