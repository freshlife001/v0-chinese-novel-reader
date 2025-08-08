import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const novelData = await request.json()
    
    if (!novelData.title || !novelData.author) {
      return NextResponse.json({ error: '小说标题和作者不能为空' }, { status: 400 })
    }

    // Check if we have Blob storage configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: '存储服务未配置，无法保存小说' }, { status: 500 })
    }

    // Import Vercel Blob functions only if token is available
    const { put } = await import('@vercel/blob')

    let novelId = novelData.existingNovelId
    let isUpdate = false
    
    if (novelId) {
      // 更新已存在的小说
      isUpdate = true
    } else {
      // 创建新小说
      novelId = Date.now().toString()
    }
    
    // Prepare novel data to save
    const novelToSave = {
      id: novelId,
      title: novelData.title,
      author: novelData.author,
      description: novelData.description || '',
      category: novelData.category || '其他',
      cover: novelData.cover || '',
      status: novelData.status || '连载中',
      lastUpdate: new Date().toISOString(),
      latestChapter: novelData.latestChapter || '',
      wordCount: novelData.wordCount || 0,
      source: novelData.source || '',
      chapters: novelData.chapters || [],
      createdAt: isUpdate ? novelData.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      importedChapters: novelData.importedChapters || 0
    }

    // Save novel info using Vercel Blob with allowOverwrite for updates
    const novelBlob = await put(`novels/${novelId}.json`, JSON.stringify(novelToSave, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true // Allow overwriting existing files
    })

    // Update novels index
    await updateNovelsIndex(novelToSave, isUpdate)

    return NextResponse.json({ 
      success: true, 
      novelId,
      isUpdate,
      blobUrl: novelBlob.url,
      message: isUpdate ? '小说信息更新成功' : '小说保存成功'
    })
  } catch (error) {
    console.error('Save novel error:', error)
    return NextResponse.json({ 
      error: `保存失败: ${error.message}` 
    }, { status: 500 })
  }
}

async function updateNovelsIndex(novel: any, isUpdate: boolean) {
  try {
    const { put, list } = await import('@vercel/blob')
    
    // Get existing index
    let novels = []
    try {
      const { blobs } = await list({
        prefix: 'novels/index.json',
        limit: 1
      })
      
      if (blobs.length > 0) {
        const indexResponse = await fetch(blobs[0].url)
        if (indexResponse.ok) {
          novels = await indexResponse.json()
        }
      }
    } catch (error) {
      console.log('No existing index found, creating new one')
    }
    
    const novelSummary = {
      id: novel.id,
      title: novel.title,
      author: novel.author,
      category: novel.category,
      status: novel.status,
      chapters: novel.chapters.length,
      lastUpdate: novel.lastUpdate,
      createdAt: novel.createdAt,
      cover: novel.cover,
      importedChapters: novel.importedChapters || 0
    }
    
    if (isUpdate) {
      // Update existing novel in index
      const existingIndex = novels.findIndex(n => n.id === novel.id)
      if (existingIndex >= 0) {
        novels[existingIndex] = novelSummary
      } else {
        novels.push(novelSummary)
      }
    } else {
      // Add new novel to index
      novels.push(novelSummary)
    }
    
    // Save updated index to Blob with allowOverwrite
    await put('novels/index.json', JSON.stringify(novels, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true // Allow overwriting the index file
    })
  } catch (error) {
    console.error('Update index error:', error)
  }
}
