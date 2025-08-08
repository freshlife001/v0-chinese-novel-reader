import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    const { novelId, chapterUrls, batchSize = 10, isResume = false, taskId } = await request.json()
    
    if (!novelId || !chapterUrls || !Array.isArray(chapterUrls) || !taskId) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ 
        error: '存储服务未配置，无法导入章节'
      }, { status: 500 })
    }

    console.log('📋 创建CronJob导入任务...')
    console.log('📊 参数信息:', {
      novelId,
      chapterCount: chapterUrls.length,
      batchSize,
      isResume,
      taskId
    })

    const { put, list } = await import('@vercel/blob')
    
    // 按章节ID排序
    const sortedChapters = chapterUrls.sort((a, b) => a.id - b.id)
    
    // 如果是续导，检查已存在的章节
    let chapterQueue = sortedChapters
    let existingChapters = new Set()
    
    if (isResume) {
      try {
        const { blobs } = await list({
          prefix: `chapters/${novelId}/`,
          limit: 1000
        })
        
        existingChapters = new Set(
          blobs.map(blob => {
            const match = blob.pathname.match(/chapters\/[^\/]+\/(\d+)\.json$/)
            return match ? parseInt(match[1]) : null
          }).filter(id => id !== null)
        )
        
        // 过滤掉已存在的章节
        chapterQueue = sortedChapters.filter(chapter => !existingChapters.has(chapter.id))
        
        console.log(`🔍 续导模式: 总章节${sortedChapters.length}，已存在${existingChapters.size}，待导入${chapterQueue.length}`)
      } catch (error) {
        console.error('检查已存在章节失败:', error)
      }
    }

    // 创建任务数据（包含章节队列）
    const taskData = {
      taskId,
      novelId,
      novelTitle: '', // 将在导入页面设置
      status: 'pending',
      progress: 0,
      importedCount: 0,
      failedCount: 0,
      skippedCount: existingChapters.size,
      totalChapters: sortedChapters.length,
      chapterQueue, // 待处理的章节队列
      logs: [
        `📚 CronJob任务创建成功`,
        `📋 总章节数: ${sortedChapters.length}`,
        `📋 待导入章节: ${chapterQueue.length}`,
        `📋 已跳过章节: ${existingChapters.size}`,
        `⏰ 任务将由CronJob每分钟处理，每次处理10个章节`,
        `⏱️ 预计完成时间: ${Math.ceil(chapterQueue.length / 10)}分钟`
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cronJob: true, // 标记为CronJob任务
      batchSize: 10 // CronJob每次处理的章节数
    }

    console.log('💾 保存CronJob任务到存储...')
    
    // 保存任务到存储
    await put(`import-tasks/${taskId}.json`, JSON.stringify(taskData, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true
    })

    console.log('✅ CronJob任务创建成功')
    
    return NextResponse.json({
      success: true,
      taskId,
      message: `CronJob导入任务已创建，将每分钟处理10个章节，预计${Math.ceil(chapterQueue.length / 10)}分钟完成`,
      totalChapters: sortedChapters.length,
      pendingChapters: chapterQueue.length,
      skippedChapters: existingChapters.size,
      estimatedMinutes: Math.ceil(chapterQueue.length / 10)
    })
    
  } catch (error) {
    console.error('创建CronJob任务失败:', error)
    return NextResponse.json({
      error: `创建任务失败: ${error.message}`
    }, { status: 500 })
  }
}

// 指数退避重试机制
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
      // 指数退避：2^attempt 秒，最大30秒
      const delay = Math.min(Math.pow(2, attempt) * 1000, 30000)
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
    
    if (attempt === maxRetries) {
      logs.push(`💀 重试次数已用完: ${chapterTitle}`)
    }
  }
}

throw lastError || new Error('获取章节内容失败')
}

async function fetchChapterContent(chapterUrl: string): Promise<string> {
try {
  const response = await fetch(chapterUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': 'https://www.google.com/', // 添加 Referer 头
      'Cache-Control': 'no-cache',
    },
    // 添加超时设置
    signal: AbortSignal.timeout(30000) // 30秒超时
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // Try multiple selectors to get chapter content
  let content = ''
  
  // Common chapter content selectors
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
    // If no content found, try to get the longest text paragraph
    let longestText = ''
    $('div, p').each((i, el) => {
      const text = $(el).text().trim()
      if (text.length > longestText.length && text.length > 200) {
        longestText = text
      }
    })
    content = longestText
  }

  // Clean content
  if (content) {
    const contentCheerio = cheerio.load(content)
    // Remove ads and irrelevant elements
    contentCheerio('script, style, .ad, .advertisement, .adsbygoogle').remove()
    content = contentCheerio.text().trim()
    
    // Format paragraphs - 将连续3个或更多空格替换为换行
    content = content
      .replace(/\s{3,}/g, '\n\n') // 连续3个或更多空格替换为双换行
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n')
  }

  return content || '无法获取章节内容'
} catch (error) {
  console.error('Fetch chapter content error:', error)
  throw new Error(`获取章节内容失败: ${error.message}`)
}
}
