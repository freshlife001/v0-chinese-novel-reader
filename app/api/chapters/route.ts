import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    const { chapterUrl } = await request.json()
    
    if (!chapterUrl) {
      return NextResponse.json({ error: '请提供章节URL' }, { status: 400 })
    }

    const response = await fetch(chapterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: '无法获取章节内容' }, { status: 400 })
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

    return NextResponse.json({
      success: true,
      data: {
        title,
        content: content || '无法获取章节内容'
      }
    })
  } catch (error) {
    console.error('Chapter fetch error:', error)
    return NextResponse.json({ error: '获取章节失败' }, { status: 500 })
  }
}
