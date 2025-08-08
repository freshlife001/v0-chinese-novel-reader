import { NextRequest, NextResponse } from 'next/server'
import { getPendingImportTasks, getAllImportTasks } from '@/lib/db'

export async function GET(request: NextRequest) {
  console.log('🔄 外部API调用 - 处理导入队列')
  
  try {
    // 可选：添加简单的访问控制（基于IP、User-Agent等）
    const userAgent = request.headers.get('user-agent')
    const origin = request.headers.get('origin')
    
    console.log('📡 请求信息:', {
      userAgent: userAgent?.substring(0, 50),
      origin,
      timestamp: new Date().toISOString()
    })

    if (!process.env.TURSO_AUTH_TOKEN) {
      console.log('❌ Turso 数据库未配置')
      return NextResponse.json({ error: 'Turso database not configured' }, { status: 500 })
    }

    // Get queue status
    const pendingTasks = await getPendingImportTasks()
    const allTasks = await getAllImportTasks()
    
    console.log(`📋 队列状态: ${pendingTasks.length} 个待处理任务, 总计 ${allTasks.length} 个任务`)
    
    return NextResponse.json({ 
      success: true, 
      message: '导入队列状态获取成功',
      processedTasks: 0,
      totalPendingTasks: pendingTasks.length,
      totalTasks: allTasks.length,
      pendingTasks: pendingTasks.slice(0, 5), // 返回前5个待处理任务
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ 外部API调用失败:', error)
    return NextResponse.json({ 
      error: `API调用失败: ${error instanceof Error ? error.message : '未知错误'}`,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // POST方法支持，可以传递参数控制处理行为
  try {
    const body = await request.json().catch(() => ({}))
    const { maxTasks = 5, taskIds = [] } = body
    
    console.log('🔄 外部API POST调用 - 处理导入队列', { maxTasks, taskIds })
    
    if (!process.env.TURSO_AUTH_TOKEN) {
      return NextResponse.json({ error: 'Turso database not configured' }, { status: 500 })
    }

    // TODO: Implement queue processing with new database structure
    return NextResponse.json({ 
      success: true, 
      message: '导入队列处理功能正在重构中',
      processedTasks: 0,
      totalPendingTasks: 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ 外部API POST调用失败:', error)
    return NextResponse.json({ 
      error: `API调用失败: ${error.message}` 
    }, { status: 500 })
  }
}