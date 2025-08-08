import { NextRequest, NextResponse } from 'next/server'
import { createImportTask, getImportTask, updateImportTask, getAllImportTasks, deleteImportTask, createChapterUrls } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.TURSO_AUTH_TOKEN) {
      return NextResponse.json({ tasks: [] })
    }

    const tasks = await getAllImportTasks()
    
    // Transform database tasks to match frontend interface
    const transformedTasks = tasks.map(task => ({
      taskId: task.id,
      novelId: task.novelId,
      status: task.status === 'in_progress' ? 'processing' : task.status,
      progress: task.totalChapters > 0 ? Math.round((task.importedChapters / task.totalChapters) * 100) : 0,
      importedCount: task.importedChapters,
      failedCount: task.failedChapters,
      skippedCount: 0, // Not tracked in current schema
      totalChapters: task.totalChapters,
      logs: [`任务创建于 ${new Date(task.createdAt).toLocaleString()}`],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      error: task.errorMessage
    }))
    
    return NextResponse.json({ tasks: transformedTasks })
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

    const success = await deleteImportTask(taskId)
    
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: '删除任务失败' }, { status: 500 })
    }
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
      novelId: task.novelId,
      chaptersCount: taskData.chapters?.length || 0
    })
    
    return NextResponse.json({ 
      success: true, 
      taskId: task.id,
      novelId: task.novelId,
      chaptersCount: taskData.chapters?.length || 0
    })
  } catch (error) {
    console.error('❌ 创建导入任务失败:', error)
    return NextResponse.json({ 
      error: `创建任务失败: ${error.message}` 
    }, { status: 500 })
  }
}