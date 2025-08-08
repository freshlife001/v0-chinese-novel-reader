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
    
    // List all blobs
    const result = await list({ limit: 10 })
    
    return NextResponse.json({
      success: true,
      message: `成功列出 ${result.blobs.length} 个文件`,
      details: {
        blobCount: result.blobs.length,
        blobs: result.blobs.map(blob => ({
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt
        })),
        hasMore: result.hasMore
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `列出文件失败: ${error.message}`,
      details: { error: error.message }
    }, { status: 500 })
  }
}
