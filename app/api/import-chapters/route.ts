import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    const { novelId, chapterUrls, batchSize = 10, isResume = false } = await request.json()
    
    if (!novelId || !chapterUrls || !Array.isArray(chapterUrls)) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 })
    }

    // Check if we have Blob storage configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ 
        error: '存储服务未配置，无法导入章节',
        logs: ['❌ Blob 存储未配置，请联系管理员']
      }, { status: 500 })
    }

    // Import Vercel Blob functions only if token is available
    const { put, list } = await import('@vercel/blob')

    let importedCount = 0
    let failedCount = 0
    let skippedCount = 0
    const totalChapters = chapterUrls.length
    const results = []
    const logs = []

    // 在处理章节之前，按照章节ID排序
    chapterUrls.sort((a, b) => a.id - b.id)

    logs.push(`📚 ${isResume ? '续导' : '开始导入'}小说(ID: ${novelId})的章节，共${totalChapters}章`)
    logs.push(`📋 章节将按顺序导入: 第${chapterUrls[0]?.id}章 至 第${chapterUrls[chapterUrls.length - 1]?.id}章`)
    logs.push(`⚙️ 导入设置: 每批处理${batchSize}章，每批完成后休息10秒`)

    // 如果是续导，先检查已存在的章节
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
        
        logs.push(`🔍 检测到已存在${existingChapters.size}个章节，将跳过已导入的章节`)
      } catch (error) {
        logs.push(`⚠️ 检查已存在章节时出错: ${error.message}`)
      }
    }

    // 计算总批次数
    const totalBatches = Math.ceil(chapterUrls.length / batchSize)
    
    // Process chapters in batches with rate limiting
    for (let i = 0; i < chapterUrls.length; i += batchSize) {
      const currentBatch = Math.floor(i / batchSize) + 1
      const batch = chapterUrls.slice(i, i + batchSize)
      
      logs.push(`📖 开始处理第${currentBatch}/${totalBatches}批次 (第${i+1}至${Math.min(i+batchSize, totalChapters)}章)`)
      
      // 串行处理每个章节，避免并发过多
      const batchResults = []
      for (const chapterInfo of batch) {
        try {
          // 检查章节是否已存在
          if (existingChapters.has(chapterInfo.id)) {
            logs.push(`⏭️ 跳过已存在的章节: ${chapterInfo.title}`)
            skippedCount++
            batchResults.push({
              success: true,
              chapterId: chapterInfo.id,
              title: chapterInfo.title,
              skipped: true
            })
            continue
          }

          logs.push(`🔍 开始获取章节: ${chapterInfo.title}`)
          const startTime = Date.now()
          
          // 添加随机延迟，避免请求过于频繁
          const randomDelay = Math.random() * 2000 + 1000 // 1-3秒随机延迟
          await new Promise(resolve => setTimeout(resolve, randomDelay))
          
          const chapterContent = await fetchChapterContent(chapterInfo.url)
          const endTime = Date.now()
          
          if (!chapterContent || chapterContent === '无法获取章节内容') {
            logs.push(`❌ 章节内容获取失败: ${chapterInfo.title}`)
            failedCount++
            batchResults.push({
              success: false,
              chapterId: chapterInfo.id,
              title: chapterInfo.title,
              error: '无法获取章节内容'
            })
            continue
          }
          
          const contentLength = chapterContent.length
          logs.push(`✅ 章节内容获取成功: ${chapterInfo.title} (${contentLength}字符, 耗时${endTime-startTime}ms)`)

          const chapterData = {
            id: chapterInfo.id,
            title: chapterInfo.title,
            content: chapterContent,
            url: chapterInfo.url,
            novelId: novelId,
            wordCount: Math.floor(contentLength / 2), // Estimate word count
            createdAt: new Date().toISOString()
          }

          // Save chapter content using Vercel Blob with allowOverwrite
          const chapterBlob = await put(
            `chapters/${novelId}/${chapterInfo.id}.json`, 
            JSON.stringify(chapterData, null, 2),
            {
              access: 'public',
              contentType: 'application/json',
              allowOverwrite: true // Allow overwriting existing chapters
            }
          )
          
          logs.push(`💾 章节保存成功: ${chapterInfo.title}`)
          importedCount++
          
          batchResults.push({
            success: true,
            chapterId: chapterInfo.id,
            title: chapterInfo.title,
            wordCount: chapterData.wordCount,
            blobUrl: chapterBlob.url,
            skipped: false
          })
          
        } catch (error) {
          logs.push(`❌ 导入章节失败 ${chapterInfo.title}: ${error.message}`)
          failedCount++
          batchResults.push({
            success: false,
            chapterId: chapterInfo.id,
            title: chapterInfo.title,
            error: error.message
          })
        }
      }

      results.push(...batchResults)

      // Add batch completion log
      const batchSuccess = batchResults.filter(r => r.success && !r.skipped).length
      const batchSkipped = batchResults.filter(r => r.skipped).length
      const batchFailed = batchResults.filter(r => !r.success).length
      
      logs.push(`📊 第${currentBatch}批次完成: 新导入${batchSuccess}章，跳过${batchSkipped}章，失败${batchFailed}章`)
      
      // 如果不是最后一批，则休息10秒
      if (currentBatch < totalBatches) {
        logs.push(`😴 批次间休息10秒，避免请求过于频繁...`)
        await new Promise(resolve => setTimeout(resolve, 10000)) // 休息10秒
        logs.push(`🚀 休息完毕，继续处理下一批次`)
      }
    }

    // Update novel info with chapter count and word count
    try {
      logs.push(`🔄 正在更新小说信息...`)
      
      // Get existing novel info
      const { blobs: novelBlobs } = await list({
        prefix: `novels/${novelId}.json`,
        limit: 1
      })
      
      if (novelBlobs.length > 0) {
        const novelResponse = await fetch(novelBlobs[0].url)
        if (novelResponse.ok) {
          const novel = await novelResponse.json()
          
          // Calculate total word count from successfully imported chapters
          const newWordCount = results.reduce((sum, result) => {
            return sum + (result.success && !result.skipped ? (result.wordCount || 0) : 0)
          }, 0)
          
          // Update novel info
          const updatedNovel = {
            ...novel,
            wordCount: (novel.wordCount || 0) + newWordCount,
            importedChapters: (novel.importedChapters || 0) + importedCount,
            updatedAt: new Date().toISOString(),
            lastImportAt: new Date().toISOString()
          }
          
          // Save updated novel info with allowOverwrite
          await put(`novels/${novelId}.json`, JSON.stringify(updatedNovel, null, 2), {
            access: 'public',
            contentType: 'application/json',
            allowOverwrite: true // Allow overwriting the novel file
          })
          
          logs.push(`📚 小说信息更新成功: 新增字数=${newWordCount}, 总导入章节=${updatedNovel.importedChapters}`)
        }
      }
    } catch (error) {
      logs.push(`❌ 更新小说信息失败: ${error.message}`)
    }

    const totalTime = Math.ceil((totalBatches - 1) * 10 / 60) // 估算总休息时间（分钟）
    logs.push(`🎉 ${isResume ? '续导' : '导入'}完成: 新导入=${importedCount}, 跳过=${skippedCount}, 失败=${failedCount}, 总计=${totalChapters}`)
    if (totalBatches > 1) {
      logs.push(`⏱️ 总休息时间约${totalTime}分钟，感谢您的耐心等待`)
    }

    return NextResponse.json({
      success: true,
      importedCount,
      failedCount,
      skippedCount,
      totalChapters,
      results,
      logs,
      message: `${isResume ? '续导' : '导入'}完成: 新导入 ${importedCount}章，跳过 ${skippedCount}章，失败 ${failedCount}章`
    })
  } catch (error) {
    console.error('Import chapters error:', error)
    return NextResponse.json({
      error: `导入章节失败: ${error.message}`,
      logs: [`❌ 导入过程出错: ${error.message}`]
    }, { status: 500 })
  }
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
