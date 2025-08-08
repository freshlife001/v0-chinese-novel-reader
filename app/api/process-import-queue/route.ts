import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { getPendingImportTasks, getAllImportTasks, getNovelById, getChaptersByNovelId, createChapter, updateImportTask, getPendingChapterUrls, updateChapterUrl, createChapterUrls, ImportTask } from '@/lib/db'

// 提取章节内容的函数
async function extractChapterContent(chapterUrl: string): Promise<{ title: string; content: string }> {
  try {
    const response = await fetch(chapterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      }
    })

    if (!response.ok) {
      throw new Error(`无法获取章节内容 (${response.status}: ${response.statusText})`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 解析章节标题
    const title = $('h1').first().text().trim() || 
                  $('.chapter-title').text().trim() ||
                  $('title').text().split('_')[0].trim()

    // 解析章节内容
    let content = $('.content').html() ||
                  $('.chapter-content').html() ||
                  $('#content').html() ||
                  $('div').filter((i, el) => $(el).text().length > 500).first().html()

    // 清理内容
    if (content) {
      const contentCheerio = cheerio.load(content)
      // 移除广告和无关元素
      contentCheerio('script, style, .ad, .advertisement').remove()
      content = contentCheerio.text().trim()
      
      // 格式化段落
      content = content
        .replace(/\s{3,}/g, '\n\n') // 连续3个或更多空格替换为双换行
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n')
    }

    return {
      title: title || '未知标题',
      content: content || '无法获取章节内容'
    }
  } catch (error) {
    console.error(`提取章节内容失败: ${chapterUrl}`, error)
    throw error
  }
}

// 从索引页HTML中解析章节URL
async function parseChapterUrlsFromIndex(indexPageHtml: string, baseUrl: string): Promise<Array<{id: number; title: string; url: string; isVip: boolean}>> {
  try {
    const $ = cheerio.load(indexPageHtml)
    const chapters = []
    
    // 使用与import API相同的选择器
    $('body > div.container.border3-2.mt8.mb20 > ul  a').each((i, el) => {
      const chapterTitle = $(el).text().trim()
      const chapterHref = $(el).attr('href')
      
      if (chapterTitle && chapterHref) {
        chapters.push({
          id: chapters.length + 1,
          title: chapterTitle,
          url: chapterHref.startsWith('http') ? chapterHref : new URL(chapterHref, baseUrl).href,
          isVip: false
        })
      }
    })
    
    return chapters
  } catch (error) {
    console.error('解析索引页章节失败:', error)
    return []
  }
}

// 处理导入任务的函数
async function processImportTask(task: ImportTask, maxChapters: number = 15): Promise<{ success: number; failed: number; error?: string }> {
  try {
    console.log(`🔄 开始处理导入任务: ${task.id}`)
    
    // 更新任务状态为进行中
    await updateImportTask(task.id, { status: 'in_progress' })
    
    // 获取小说信息
    const novel = await getNovelById(task.novelId)
    if (!novel) {
      throw new Error('小说不存在')
    }
    
    // 获取已导入的章节
    const existingChapters = await getChaptersByNovelId(task.novelId)
    const existingChapterNumbers = new Set(existingChapters.map(ch => ch.chapterNumber))
    
    // 获取待处理的章节URL
    let pendingChapterUrls = await getPendingChapterUrls(task.id, maxChapters)
    console.log(`📋 找到 ${pendingChapterUrls.length} 个待处理的章节URL`)
    
    // 如果没有待处理的章节URL，尝试从索引页重新获取
    if (pendingChapterUrls.length === 0 && task.totalChapters > 0 && task.sourceUrl && task.indexPageHtml) {
      console.log(`📝 任务 ${task.id} 没有待处理的章节URL，尝试从索引页重新获取...`)
      
      // 从索引页HTML中解析章节URL
      const parsedChapters = await parseChapterUrlsFromIndex(task.indexPageHtml, task.sourceUrl)
      console.log(`📝 从索引页解析出 ${parsedChapters.length} 个章节`)
      
      if (parsedChapters.length > 0) {
        // 找出还没有导入的章节
        const newChaptersToImport = parsedChapters.filter(chapter => 
          !existingChapterNumbers.has(chapter.id)
        )
        
        console.log(`📝 找到 ${newChaptersToImport.length} 个新章节需要导入`)
        
        if (newChaptersToImport.length > 0) {
          // 只创建 maxChapters 个章节URL记录
          const chaptersToCreate = newChaptersToImport.slice(0, maxChapters)
          console.log(`📝 创建 ${chaptersToCreate.length} 个章节URL记录 (限制: ${maxChapters})`)
          
          // 创建新的章节URL记录
          await createChapterUrls(task.id, task.novelId, chaptersToCreate)
          
          // 重新获取待处理的章节URL
          pendingChapterUrls = await getPendingChapterUrls(task.id, maxChapters)
          console.log(`📝 重新获取到 ${pendingChapterUrls.length} 个待处理的章节URL`)
        }
      }
    }
    
    let successCount = 0
    let failedCount = 0
    
    // 处理每个章节URL
    for (const chapterUrl of pendingChapterUrls) {
      // 检查章节是否已存在
      if (existingChapterNumbers.has(chapterUrl.chapterNumber)) {
        console.log(`⏭️ 章节 ${chapterUrl.chapterNumber} 已存在，跳过`)
        await updateChapterUrl(chapterUrl.id, { status: 'imported' })
        continue
      }
      
      try {
        console.log(`📖 正在提取章节 ${chapterUrl.chapterNumber}: ${chapterUrl.title}`)
        
        // 使用 extractChapterContent 函数提取章节内容
        const { title, content } = await extractChapterContent(chapterUrl.url)
        
        // 创建章节
        await createChapter({
          novelId: task.novelId,
          chapterNumber: chapterUrl.chapterNumber,
          title: title || chapterUrl.title,
          content: content,
          url: chapterUrl.url,
          isVip: chapterUrl.isVip
        })
        
        // 更新章节URL状态
        await updateChapterUrl(chapterUrl.id, { status: 'imported' })
        
        console.log(`✅ 章节 ${chapterUrl.chapterNumber} 导入成功`)
        successCount++
      } catch (error) {
        console.error(`❌ 导入章节 ${chapterUrl.chapterNumber} 失败:`, error)
        
        // 更新章节URL状态为失败
        await updateChapterUrl(chapterUrl.id, { 
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : '未知错误'
        })
        
        failedCount++
      }
    }
    
    // 更新任务状态
    const newImportedCount = task.importedChapters + successCount
    const newFailedCount = task.failedChapters + failedCount
    const totalProcessed = newImportedCount + newFailedCount
    
    let newStatus = task.status
    if (totalProcessed >= task.totalChapters) {
      newStatus = 'completed'
    } else if (pendingChapterUrls.length === 0) {
      // 没有更多待处理的章节
      newStatus = 'completed'
    } else {
      newStatus = 'pending' // 还有章节需要处理
    }
    
    await updateImportTask(task.id, {
      importedChapters: newImportedCount,
      failedChapters: newFailedCount,
      status: newStatus
    })
    
    console.log(`✅ 任务 ${task.id} 处理完成: 成功${successCount}章, 失败${failedCount}章`)
    
    return { success: successCount, failed: failedCount }
  } catch (error) {
    console.error(`❌ 处理导入任务失败: ${task.id}`, error)
    
    // 更新任务状态为失败
    await updateImportTask(task.id, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : '未知错误'
    })
    
    return { success: 0, failed: 0, error: error instanceof Error ? error.message : '未知错误' }
  }
}

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

    // 获取待处理的任务
    const pendingTasks = await getPendingImportTasks()
    const allTasks = await getAllImportTasks()
    
    console.log(`📋 队列状态: ${pendingTasks.length} 个待处理任务, 总计 ${allTasks.length} 个任务`)
    
    // 处理待导入的任务
    let totalProcessed = 0
    let totalSuccess = 0
    let totalFailed = 0
    const processedTasks = []
    
    // 只处理前3个任务，避免单次处理过多
    const tasksToProcess = pendingTasks.slice(0, 3)
    
    for (const task of tasksToProcess) {
      console.log(`🔄 开始处理任务: ${task.id}`)
      
      try {
        const result = await processImportTask(task, 15) // 默认导入15个章节
        totalProcessed++
        totalSuccess += result.success
        totalFailed += result.failed
        
        processedTasks.push({
          taskId: task.id,
          success: result.success,
          failed: result.failed,
          error: result.error
        })
        
        console.log(`✅ 任务 ${task.id} 处理完成: 成功${result.success}章, 失败${result.failed}章`)
      } catch (error) {
        console.error(`❌ 处理任务 ${task.id} 失败:`, error)
        totalProcessed++
        totalFailed++
        
        processedTasks.push({
          taskId: task.id,
          success: 0,
          failed: 1,
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }
    
    // 获取更新后的队列状态
    const updatedPendingTasks = await getPendingImportTasks()
    
    return NextResponse.json({ 
      success: true, 
      message: '导入队列处理完成',
      processedTasks: totalProcessed,
      successfulChapters: totalSuccess,
      failedChapters: totalFailed,
      totalPendingTasks: updatedPendingTasks.length,
      totalTasks: allTasks.length,
      processedTaskDetails: processedTasks,
      pendingTasks: updatedPendingTasks.slice(0, 5), // 返回前5个待处理任务
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
    const { maxTasks = 5, maxChapters = 15, taskIds = [] } = body
    
    console.log('🔄 外部API POST调用 - 处理导入队列', { maxTasks, maxChapters, taskIds })
    
    if (!process.env.TURSO_AUTH_TOKEN) {
      return NextResponse.json({ error: 'Turso database not configured' }, { status: 500 })
    }

    // 获取待处理的任务
    let tasksToProcess = []
    
    if (taskIds.length > 0) {
      // 如果指定了任务ID，只处理这些任务
      const allTasks = await getAllImportTasks()
      tasksToProcess = allTasks.filter(task => taskIds.includes(task.id) && task.status === 'pending')
    } else {
      // 否则处理待处理的任务
      const pendingTasks = await getPendingImportTasks()
      tasksToProcess = pendingTasks.slice(0, maxTasks)
    }
    
    console.log(`📋 将处理 ${tasksToProcess.length} 个任务`)
    
    // 处理任务
    let totalProcessed = 0
    let totalSuccess = 0
    let totalFailed = 0
    const processedTasks = []
    
    for (const task of tasksToProcess) {
      console.log(`🔄 开始处理任务: ${task.id}`)
      
      try {
        const result = await processImportTask(task, maxChapters)
        totalProcessed++
        totalSuccess += result.success
        totalFailed += result.failed
        
        processedTasks.push({
          taskId: task.id,
          success: result.success,
          failed: result.failed,
          error: result.error
        })
        
        console.log(`✅ 任务 ${task.id} 处理完成: 成功${result.success}章, 失败${result.failed}章`)
      } catch (error) {
        console.error(`❌ 处理任务 ${task.id} 失败:`, error)
        totalProcessed++
        totalFailed++
        
        processedTasks.push({
          taskId: task.id,
          success: 0,
          failed: 1,
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }
    
    // 获取更新后的队列状态
    const updatedPendingTasks = await getPendingImportTasks()
    const allTasks = await getAllImportTasks()
    
    return NextResponse.json({ 
      success: true, 
      message: '导入队列处理完成',
      processedTasks: totalProcessed,
      successfulChapters: totalSuccess,
      failedChapters: totalFailed,
      totalPendingTasks: updatedPendingTasks.length,
      totalTasks: allTasks.length,
      processedTaskDetails: processedTasks,
      pendingTasks: updatedPendingTasks.slice(0, 5), // 返回前5个待处理任务
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ 外部API POST调用失败:', error)
    return NextResponse.json({ 
      error: `API调用失败: ${error instanceof Error ? error.message : '未知错误'}`,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}