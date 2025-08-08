import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始调试导入系统...')
    
    // 检查环境变量
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN
    console.log('🔑 BLOB_READ_WRITE_TOKEN 存在:', hasToken)
    
    if (!hasToken) {
      return NextResponse.json({
        error: 'BLOB_READ_WRITE_TOKEN 未配置',
        debug: {
          hasToken: false,
          env: process.env.NODE_ENV
        }
      })
    }

    // 测试 Blob 存储连接
    const { list, put } = await import('@vercel/blob')
    console.log('✅ Blob 模块导入成功')

    // 测试列出文件
    const { blobs } = await list({ limit: 5 })
    console.log('📁 当前 Blob 文件数量:', blobs.length)

    // 测试创建任务文件
    const testTaskId = `debug_task_${Date.now()}`
    const testTaskData = {
      taskId: testTaskId,
      status: 'test',
      createdAt: new Date().toISOString(),
      debug: true
    }

    console.log('🧪 创建测试任务:', testTaskId)
    const testBlob = await put(
      `import-tasks/${testTaskId}.json`, 
      JSON.stringify(testTaskData, null, 2),
      {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true
      }
    )

    console.log('✅ 测试任务创建成功:', testBlob.url)

    // 验证任务文件是否可以读取
    const verifyResponse = await fetch(testBlob.url)
    const verifyData = await verifyResponse.json()
    console.log('✅ 测试任务验证成功:', verifyData)

    // 清理测试文件
    const { del } = await import('@vercel/blob')
    await del(testBlob.url)
    console.log('🗑️ 测试任务清理完成')

    return NextResponse.json({
      success: true,
      debug: {
        hasToken: true,
        blobCount: blobs.length,
        testTaskCreated: true,
        testTaskVerified: true,
        testTaskCleaned: true,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ 调试导入系统失败:', error)
    return NextResponse.json({
      error: error.message,
      debug: {
        hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}
