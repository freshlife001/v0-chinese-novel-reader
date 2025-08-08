import { NextRequest, NextResponse } from 'next/server'
import { createNovel, updateNovel, createImportTask } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const novelData = await request.json()
    
    if (!novelData.title || !novelData.author) {
      return NextResponse.json({ error: '小说标题和作者不能为空' }, { status: 400 })
    }

    let novelId = novelData.existingNovelId
    let isUpdate = false
    
    if (novelId) {
      // 更新已存在的小说
      isUpdate = true
    } else {
      // 创建新小说
      novelId = crypto.randomUUID()
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
      createdAt: isUpdate ? novelData.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    let savedNovel
    if (isUpdate) {
      // 更新已存在的小说
      savedNovel = await updateNovel(novelId, novelToSave)
    } else {
      // 创建新小说
      savedNovel = await createNovel(novelToSave)
    }

    // 创建导入任务
    if (novelData.chapters && novelData.chapters.length > 0) {
      const taskId = crypto.randomUUID()
      await createImportTask({
        novelId: savedNovel.id,
        taskType: isUpdate ? 'update' : 'import',
        status: 'pending',
        totalChapters: novelData.chapters.length,
        importedChapters: 0,
        failedChapters: 0
      })
    }

    return NextResponse.json({ 
      success: true, 
      novelId: savedNovel.id,
      isUpdate,
      message: isUpdate ? '小说信息更新成功' : '小说保存成功'
    })
  } catch (error) {
    console.error('Save novel error:', error)
    return NextResponse.json({ 
      error: `保存失败: ${error.message}` 
    }, { status: 500 })
  }
}
