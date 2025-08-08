import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function GET(request: NextRequest) {
  console.log('🕐 CronJob 开始执行 - 导入章节任务')
  
  try {
    // 验证CronJob请求（可选：添加密钥验证）
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ CronJob 认证失败')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.log('❌ Blob 存储未配置')
      return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 })
    }

    const { list, put } = await import('@vercel/blob')
    
    // 获取所有待处理的任务
    console.log('📋 获取待处理任务...')
    const { blobs } = await list({
      prefix: 'import-tasks/',
      limit: 100
    })
    
    const pendingTasks = []
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url)
        if (response.ok) {
          const task = await response.json()
          if (task.status === 'pending' || task.status === 'processing') {
            pendingTasks.push(task)
          }
        }
      } catch (error) {
        console.error('❌ 读取任务失败:', error)
      }
    }
    
    console.log(`📊 发现 ${pendingTasks.length} 个待处理任务`)
    
    if (pendingTasks.length === 0) {
      console.log('✅ 没有待处理任务，CronJob 完成')
      return NextResponse.json({ 
        success: true, 
        message: '没有待处理任务',
        processedTasks: 0
      })
    }

    let processedTasks = 0
    const maxTasksPerRun = 3 // 每次CronJob最多处理3个任务，避免超时

    // 处理待处理的任务
    for (const task of pendingTasks.slice(0, maxTasksPerRun)) {
      try {
        console.log(`🔄 开始处理任务: ${task.taskId}`)
        await processImportTask(task)
        processedTasks++
        console.log(`✅ 任务处理完成: ${task.taskId}`)
      } catch (error) {
        console.error(`❌ 处理任务失败 ${task.taskId}:`, error)
        // 标记任务为失败
        await updateTaskStatus(task.taskId, {
          ...task,
          status: 'failed',
          error: error.message,
          updatedAt: new Date().toISOString()
        })
      }
    }

    console.log(`🎉 CronJob 完成，处理了 ${processedTasks} 个任务`)
    
    return NextResponse.json({ 
      success: true, 
      message: `处理了 ${processedTasks} 个任务`,
      processedTasks,
      totalPendingTasks: pendingTasks.length
    })

  } catch (error) {
    console.error('❌ CronJob 执行失败:', error)
    return NextResponse.json({ 
      error: `CronJob failed: ${error.message}` 
    }, { status: 500 })
  }
}

async function processImportTask(task: any) {
  console.log(`📖 处理导入任务: ${task.novelId}`)
  
  if (!task.chapterQueue || !Array.isArray(task.chapterQueue)) {
    throw new Error('任务缺少章节队列')
  }

  const { put, list } = await import('@vercel/blob')
  
  // 更新任务状态为处理中
  if (task.status === 'pending') {
    await updateTaskStatus(task.taskId, {
      ...task,
      status: 'processing',
      updatedAt: new Date().toISOString()
    })
  }

  // 每次处理10个章节
  const batchSize = 10
  const chaptersToProcess = task.chapterQueue.slice(0, batchSize)
  
  if (chaptersToProcess.length === 0) {
    // 没有更多章节需要处理，标记任务完成
    await updateTaskStatus(task.taskId, {
      ...task,
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: [...(task.logs || []), '🎉 所有章节导入完成']
    })
    return
  }

  console.log(`📚 本次处理 ${chaptersToProcess.length} 个章节`)
  
  let importedCount = task.importedCount || 0
  let failedCount = task.failedCount || 0
  let skippedCount = task.skippedCount || 0
  const logs = [...(task.logs || [])]
  
  logs.push(`📖 开始处理批次: ${chaptersToProcess.length} 个章节`)

  // 检查已存在的章节
  let existingChapters = new Set()
  try {
    const { blobs: chapterBlobs } = await list({
      prefix: `chapters/${task.novelId}/`,
      limit: 1000
    })
    
    existingChapters = new Set(
      chapterBlobs.map(blob => {
        const match = blob.pathname.match(/chapters\/[^\/]+\/(\d+)\.json$/)
        return match ? parseInt(match[1]) : null
      }).filter(id => id !== null)
    )
  } catch (error) {
    console.error('检查已存在章节失败:', error)
  }

  // 处理每个章节
  for (const chapterInfo of chaptersToProcess) {
    try {
      // 检查章节是否已存在
      if (existingChapters.has(chapterInfo.id)) {
        logs.push(`⏭️ 跳过已存在的章节: ${chapterInfo.title}`)
        skippedCount++
        continue
      }

      logs.push(`🔍 开始获取章节: ${chapterInfo.title}`)
      
      // 获取章节内容（带重试机制）
      const chapterContent = await fetchChapterContentWithRetry(chapterInfo.url, chapterInfo.title, logs)
      
      if (!chapterContent || chapterContent === '无法获取章节内容') {
        logs.push(`❌ 章节内容获取失败: ${chapterInfo.title}`)
        failedCount++
        continue
      }
      
      const contentLength = chapterContent.length
      logs.push(`✅ 章节内容获取成功: ${chapterInfo.title} (${contentLength}字符)`)

      const chapterData = {
        id: chapterInfo.id,
        title: chapterInfo.title,
        content: chapterContent,
        url: chapterInfo.url,
        novelId: task.novelId,
        wordCount: Math.floor(contentLength / 2),
        createdAt: new Date().toISOString()
      }

      // 保存章节内容
      await put(
        `chapters/${task.novelId}/${chapterInfo.id}.json`, 
        JSON.stringify(chapterData, null, 2),
        {
          access: 'public',
          contentType: 'application/json',
          allowOverwrite: true
        }
      )
      
      logs.push(`💾 章节保存成功: ${chapterInfo.title}`)
      importedCount++
      
      // 添加小延迟，避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      logs.push(`❌ 导入章节失败 ${chapterInfo.title}: ${error.message}`)
      failedCount++
    }
  }

  // 更新章节队列（移除已处理的章节）
  const remainingQueue = task.chapterQueue.slice(batchSize)
  const totalChapters = task.totalChapters || task.chapterQueue.length
  const progress = Math.floor(((totalChapters - remainingQueue.length) / totalChapters) * 100)

  logs.push(`📊 批次完成: 新导入${importedCount - (task.importedCount || 0)}章，跳过${skippedCount - (task.skippedCount || 0)}章，失败${failedCount - (task.failedCount || 0)}章`)

  // 更新任务状态
  const updatedTask = {
    ...task,
    chapterQueue: remainingQueue,
    importedCount,
    failedCount,
    skippedCount,
    progress,
    logs,
    updatedAt: new Date().toISOString()
  }

  // 如果队列为空，标记任务完成
  if (remainingQueue.length === 0) {
    updatedTask.status = 'completed'
    updatedTask.completedAt = new Date().toISOString()
    updatedTask.progress = 100
    logs.push('🎉 所有章节导入完成')
  }

  await updateTaskStatus(task.taskId, updatedTask)

  // 更新小说信息
  await updateNovelInfo(task.novelId, importedCount - (task.importedCount || 0))
}

async function fetchChapterContentWithRetry(
  chapterUrl: string, 
  chapterTitle: string, 
  logs: string[], 
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        const delay = Math.min(Math.pow(2, attempt) * 1000, 10000)
        logs.push(`🔄 第${attempt}次重试 ${chapterTitle}，等待${delay/1000}秒...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
      const content = await fetchChapterContent(chapterUrl)
      
      if (attempt > 1) {
        logs.push(`✅ 重试成功: ${chapterTitle}`)
      }
      
      return content
    } catch (error) {
      lastError = error
      logs.push(`❌ 第${attempt}次尝试失败: ${chapterTitle} - ${error.message}`)
    }
  }

  throw lastError || new Error('获取章节内容失败')
}

async function fetchChapterContent(chapterUrl: string): Promise<string> {
  const response = await fetch(chapterUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': 'https://www.google.com/',
      'Cache-Control': 'no-cache',
    },
    signal: AbortSignal.timeout(30000)
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  let content = ''
  const contentSelectors = [
    '#content',
    '.content',
    '.chapter-content',
    '.novel-content',
    '.txt',
    'div[id*="content"]',
    'div[class*="content"]'
  ]

  for (const selector of contentSelectors) {
    const element = $(selector)
    if (element.length > 0 && element.text().trim().length > 100) {
      content = element.html() || element.text()
      break
    }
  }

  if (!content) {
    let longestText = ''
    $('div, p').each((i, el) => {
      const text = $(el).text().trim()
      if (text.length > longestText.length && text.length > 200) {
        longestText = text
      }
    })
    content = longestText
  }

  if (content) {
    const contentCheerio = cheerio.load(content)
    contentCheerio('script, style, .ad, .advertisement, .adsbygoogle').remove()
    content = contentCheerio.text().trim()
    
    content = content
      .replace(/\s{3,}/g, '\n\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n')
  }

  return content || '无法获取章节内容'
}

async function updateTaskStatus(taskId: string, taskData: any) {
  try {
    const { put } = await import('@vercel/blob')
    
    await put(`import-tasks/${taskId}.json`, JSON.stringify(taskData, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true
    })
  } catch (error) {
    console.error('更新任务状态失败:', error)
  }
}

async function updateNovelInfo(novelId: string, newChapterCount: number) {
  if (newChapterCount <= 0) return

  try {
    const { put, list } = await import('@vercel/blob')
    
    const { blobs: novelBlobs } = await list({
      prefix: `novels/${novelId}.json`,
      limit: 1
    })
    
    if (novelBlobs.length > 0) {
      const novelResponse = await fetch(novelBlobs[0].url)
      if (novelResponse.ok) {
        const novel = await novelResponse.json()
        
        const updatedNovel = {
          ...novel,
          importedChapters: (novel.importedChapters || 0) + newChapterCount,
          updatedAt: new Date().toISOString(),
          lastImportAt: new Date().toISOString()
        }
        
        await put(`novels/${novelId}.json`, JSON.stringify(updatedNovel, null, 2), {
          access: 'public',
          contentType: 'application/json',
          allowOverwrite: true
        })
      }
    }
  } catch (error) {
    console.error('更新小说信息失败:', error)
  }
}
