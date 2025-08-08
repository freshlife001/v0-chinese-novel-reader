import { NextRequest, NextResponse } from 'next/server'
import { getImportTask } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = params.taskId
    
    if (!process.env.TURSO_AUTH_TOKEN) {
      return NextResponse.json({ error: '数据库服务未配置' }, { status: 500 })
    }

    const task = await getImportTask(taskId)
    
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }
    
    return NextResponse.json({ task })
  } catch (error) {
    console.error('Get import status error:', error)
    return NextResponse.json({ error: '获取导入状态失败' }, { status: 500 })
  }
}