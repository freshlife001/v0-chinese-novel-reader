import { NextResponse } from 'next/server'

export async function POST() {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        success: false,
        message: 'BLOB_READ_WRITE_TOKEN 环境变量未配置',
        details: null
      }, { status: 500 })
    }

    // Import Vercel Blob
    const { put } = await import('@vercel/blob')
    
    // Create test data
    const testData = {
      message: 'Blob 存储测试文件',
      timestamp: new Date().toISOString(),
      test: true
    }
    
    // Upload test file with allowOverwrite to avoid conflicts
    const blob = await put(
      `test/blob-test-${Date.now()}.json`,
      JSON.stringify(testData, null, 2),
      {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true // Allow overwriting test files
      }
    )
    
    return NextResponse.json({
      success: true,
      message: '测试文件上传成功',
      details: {
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `文件上传失败: ${error.message}`,
      details: { error: error.message }
    }, { status: 500 })
  }
}
