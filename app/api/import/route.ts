import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: '请提供有效的URL' }, { status: 400 })
    }

    console.log('正在解析URL:', url)

    // 获取网页内容
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    })

    if (!response.ok) {
      return NextResponse.json({ 
        error: `无法访问该网页 (${response.status}: ${response.statusText})` 
      }, { status: 400 })
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 严格按照提供的选择器解析小说信息
    const novelInfo = parseNovelWithSelectors($, url)

    if (!novelInfo.title) {
      return NextResponse.json({ 
        error: '无法解析小说信息，请检查链接是否正确' 
      }, { status: 400 })
    }

    // 检查是否已存在相同的小说
    const existingNovel = await checkExistingNovel(novelInfo.title, novelInfo.author)
    
    if (existingNovel) {
      // 如果小说已存在，返回续导信息
      const resumeInfo = await getResumeImportInfo(existingNovel, novelInfo.chapters)
      
      return NextResponse.json({ 
        success: true, 
        data: {
          ...novelInfo,
          isExisting: true,
          existingNovelId: existingNovel.id,
          resumeInfo
        }
      })
    }

    return NextResponse.json({ success: true, data: novelInfo })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: `解析失败: ${error.message}` 
    }, { status: 500 })
  }
}

function parseNovelWithSelectors($: cheerio.CheerioAPI, url: string) {
  try {
    // 严格使用提供的选择器
    // 小说标题: div:nth-child(2) > div > div.info-main > div > h1
    const title = $('div:nth-child(2) > div > div.info-main > div > h1').text().trim()
    console.log('解析标题:', title)

    // 作者: body > div:nth-child(2) > div > div.info-main > div > div.w100.dispc > span
    const author = $('body > div:nth-child(2) > div > div.info-main > div > div.w100.dispc > span').text().trim()
    console.log('解析作者:', author)

    // 简介: body > div:nth-child(2) > div > div.info-main > div > div.info-main-intro > p
    const description = $('body > div:nth-child(2) > div > div.info-main > div > div.info-main-intro > p').text().trim()
    console.log('解析简介:', description.substring(0, 50) + '...')

    // 章节链接: body > div.container.border3-2.mt8.mb20 > ul  a
    const chapters = []
    $('body > div.container.border3-2.mt8.mb20 > ul  a').each((i, el) => {
      const chapterTitle = $(el).text().trim()
      const chapterHref = $(el).attr('href')
      
      if (chapterTitle && chapterHref) {
        chapters.push({
          id: chapters.length + 1,
          title: chapterTitle,
          url: chapterHref.startsWith('http') ? chapterHref : new URL(chapterHref, url).href,
          isVip: false
        })
      }
    })
    console.log('解析章节数:', chapters.length)

    // 尝试获取封面图片
    let cover = `/placeholder.svg?height=300&width=200&text=${encodeURIComponent(title || '未知小说')}`
    
    // 尝试从页面中找到封面图片
    const imgSrc = $('div.info-main img').attr('src')
    if (imgSrc) {
      cover = imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, url).href
    }

    return {
      title: title || '未知标题',
      author: author || '未知作者',
      description: description || '暂无简介',
      category: '其他', // 未提供分类选择器
      chapters,
      cover,
      status: '连载中', // 未提供状态选择器
      lastUpdate: '', // 未提供更新时间选择器
      latestChapter: chapters.length > 0 ? chapters[chapters.length - 1].title : '',
      wordCount: chapters.length * 2000, // 估算字数
      source: url
    }
  } catch (error) {
    console.error('解析小说信息时出错:', error)
    return {
      title: '',
      author: '',
      description: '',
      category: '其他',
      chapters: [],
      cover: '',
      status: '未知',
      source: url
    }
  }
}

// 检查是否已存在相同的小说
async function checkExistingNovel(title: string, author: string) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return null
    }

    const { list } = await import('@vercel/blob')
    
    // 获取所有小说文件
    const { blobs } = await list({
      prefix: 'novels/',
      limit: 100
    })
    
    const novelBlobs = blobs.filter(blob => 
      blob.pathname.startsWith('novels/') && 
      blob.pathname.endsWith('.json') && 
      !blob.pathname.includes('index.json')
    )
    
    // 检查每个小说是否匹配
    for (const blob of novelBlobs) {
      try {
        const response = await fetch(blob.url)
        if (response.ok) {
          const novel = await response.json()
          // 匹配标题和作者
          if (novel.title === title && novel.author === author) {
            return novel
          }
        }
      } catch (error) {
        console.error('检查小说时出错:', error)
      }
    }
    
    return null
  } catch (error) {
    console.error('检查已存在小说时出错:', error)
    return null
  }
}

// 获取续导信息
async function getResumeImportInfo(existingNovel: any, latestChapters: any[]) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return {
        totalChapters: latestChapters.length,
        importedChapters: 0,
        pendingChapters: latestChapters,
        newChapters: [],
        message: 'Blob 存储未配置'
      }
    }

    const { list } = await import('@vercel/blob')
    
    // 获取已导入的章节
    const { blobs } = await list({
      prefix: `chapters/${existingNovel.id}/`,
      limit: 1000
    })
    
    const importedChapterIds = new Set(
      blobs.map(blob => {
        const match = blob.pathname.match(/chapters\/[^\/]+\/(\d+)\.json$/)
        return match ? parseInt(match[1]) : null
      }).filter(id => id !== null)
    )
    
    console.log('已导入章节IDs:', Array.from(importedChapterIds))
    console.log('最新章节数量:', latestChapters.length)
    console.log('已存在小说章节数量:', existingNovel.chapters?.length || 0)
    
    // 分析章节状态
    const pendingChapters = []
    const newChaptersToImport = []
    const existingChapterCount = existingNovel.chapters?.length || 0
    
    // 遍历最新获取的章节列表
    latestChapters.forEach((chapter, index) => {
      const chapterId = index + 1
      
      // 如果章节还没有被导入
      if (!importedChapterIds.has(chapterId)) {
        if (chapterId <= existingChapterCount) {
          // 之前存在但导入失败或未完成的章节
          pendingChapters.push({
            ...chapter,
            id: chapterId,
            status: 'pending'
          })
        } else {
          // 新增的章节
          newChaptersToImport.push({
            ...chapter,
            id: chapterId,
            status: 'new'
          })
        }
      }
    })

    // 确保章节按ID排序
    pendingChapters.sort((a, b) => a.id - b.id)
    newChaptersToImport.sort((a, b) => a.id - b.id)
    
    console.log('待重试章节数:', pendingChapters.length)
    console.log('新增章节数:', newChaptersToImport.length)
    
    const totalPendingChapters = pendingChapters.length + newChaptersToImport.length
    
    return {
      totalChapters: latestChapters.length,
      importedChapters: importedChapterIds.size,
      pendingChapters,
      newChapters: newChaptersToImport,
      message: `发现已存在的小说，共${latestChapters.length}章，已导入${importedChapterIds.size}章，待导入${totalPendingChapters}章（失败重试${pendingChapters.length}章，新增${newChaptersToImport.length}章）`
    }
  } catch (error) {
    console.error('获取续导信息时出错:', error)
    return {
      totalChapters: latestChapters.length,
      importedChapters: 0,
      pendingChapters: latestChapters,
      newChapters: [],
      message: `获取续导信息失败: ${error.message}`
    }
  }
}
