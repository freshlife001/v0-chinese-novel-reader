import { NextResponse } from 'next/server'

export async function GET() {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        success: false,
        message: 'BLOB_READ_WRITE_TOKEN 环境变量未配置',
        details: null
      }, { status: 500 })
    }

    // Import Vercel Blob
    const { list } = await import('@vercel/blob')
    
    // Test connection by listing blobs
    const result = await list({ limit: 1 })
    
    return NextResponse.json({
      success: true,
      message: 'Blob 存储连接成功',
      details: {
        blobCount: result.blobs.length,
        hasMore: result.hasMore,
        cursor: result.cursor
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Blob 连接失败: ${error.message}`,
      details: { error: error.message }
    }, { status: 500 })
  }
}
