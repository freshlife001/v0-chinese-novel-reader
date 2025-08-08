import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = params.taskId
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: '存储服务未配置' }, { status: 500 })
    }

    const { list } = await import('@vercel/blob')
    
    // 获取任务状态
    const { blobs } = await list({
      prefix: `import-tasks/${taskId}.json`,
      limit: 1
    })
    
    if (blobs.length === 0) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    const response = await fetch(blobs[0].url)
    if (!response.ok) {
      return NextResponse.json({ error: '获取任务状态失败' }, { status: 500 })
    }

    const taskStatus = await response.json()
    
    return NextResponse.json({ task: taskStatus })
  } catch (error) {
    console.error('Get import status error:', error)
    return NextResponse.json({ error: '获取导入状态失败' }, { status: 500 })
  }
}
