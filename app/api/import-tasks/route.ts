import { NextRequest, NextResponse } from 'next/server'
import { createImportTask, getImportTask, updateImportTask, getAllImportTasks } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.TURSO_AUTH_TOKEN) {
      return NextResponse.json({ tasks: [] })
    }

    const tasks = await getAllImportTasks()
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Get import tasks error:', error)
    return NextResponse.json({ tasks: [] })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { taskId } = await request.json()
    
    if (!process.env.TURSO_AUTH_TOKEN) {
      return NextResponse.json({ error: '数据库服务未配置' }, { status: 500 })
    }

    // TODO: Implement task deletion from database
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
    
    if (!process.env.TURSO_AUTH_TOKEN) {
      console.error('❌ TURSO_AUTH_TOKEN 未配置')
      return NextResponse.json({ error: '数据库服务未配置' }, { status: 500 })
    }

    // Convert task data to database format
    const dbTaskData = {
      novelId: taskData.novelId,
      taskType: 'import' as const,
      status: 'pending' as const,
      totalChapters: taskData.totalChapters || 0,
      importedChapters: 0,
      failedChapters: 0
    }

    const task = await createImportTask(dbTaskData)
    
    console.log('✅ 任务创建成功:', {
      taskId: task.id,
      novelId: task.novelId
    })
    
    return NextResponse.json({ 
      success: true, 
      taskId: task.id,
      novelId: task.novelId
    })
  } catch (error) {
    console.error('❌ 创建导入任务失败:', error)
    return NextResponse.json({ 
      error: `创建任务失败: ${error.message}` 
    }, { status: 500 })
  }
}