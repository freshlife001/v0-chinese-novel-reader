import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ tasks: [] })
    }

    const { list } = await import('@vercel/blob')
    
    // 获取所有导入任务
    const { blobs } = await list({
      prefix: 'import-tasks/',
      limit: 100
    })
    
    const tasks = []
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url)
        if (response.ok) {
          const task = await response.json()
          tasks.push(task)
        }
      } catch (error) {
        console.error('Error loading task:', error)
      }
    }
    
    // 按创建时间倒序排列
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Get import tasks error:', error)
    return NextResponse.json({ tasks: [] })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { taskId } = await request.json()
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: '存储服务未配置' }, { status: 500 })
    }

    const { del } = await import('@vercel/blob')
    
    // 删除任务文件
    await del(`import-tasks/${taskId}.json`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete import task error:', error)
    return NextResponse.json({ error: '删除任务失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 开始创建导入任务...')
    const taskData = await request.json()
    console.log('📝 接收到任务数据:', JSON.stringify(taskData, null, 2))
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN 未配置')
      return NextResponse.json({ error: '存储服务未配置' }, { status: 500 })
    }

    const { put } = await import('@vercel/blob')
    console.log('📝 准备保存任务到 Blob 存储...')
    
    // 保存任务状态到 Blob 存储
    const blob = await put(`import-tasks/${taskData.taskId}.json`, JSON.stringify(taskData, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true
    })
    
    console.log('✅ 任务保存成功:', {
      taskId: taskData.taskId,
      blobUrl: blob.url,
      pathname: blob.pathname
    })
    
    return NextResponse.json({ 
      success: true, 
      taskId: taskData.taskId,
      blobUrl: blob.url 
    })
  } catch (error) {
    console.error('❌ 创建导入任务失败:', error)
    return NextResponse.json({ 
      error: `创建任务失败: ${error.message}` 
    }, { status: 500 })
  }
}
