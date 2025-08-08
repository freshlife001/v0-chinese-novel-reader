import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { novelId, chapterUrls, batchSize = 10, isResume = false, taskId } = await request.json()
    
    if (!novelId || !chapterUrls || !Array.isArray(chapterUrls) || !taskId) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 })
    }

    if (!process.env.TURSO_AUTH_TOKEN) {
      return NextResponse.json({ 
        error: '数据库服务未配置，无法导入章节'
      }, { status: 500 })
    }

    // TODO: Implement async chapter import with new database structure
    return NextResponse.json({
      success: true,
      taskId,
      message: '异步导入功能正在重构中',
      totalChapters: chapterUrls.length,
      pendingChapters: chapterUrls.length,
      skippedChapters: 0,
      estimatedMinutes: 0
    })
    
  } catch (error) {
    console.error('创建异步导入任务失败:', error)
    return NextResponse.json({
      error: `创建任务失败: ${error.message}`
    }, { status: 500 })
  }
}