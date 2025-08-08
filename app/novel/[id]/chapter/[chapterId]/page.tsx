"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { BookOpen, ChevronLeft, ChevronRight, Settings, Moon, Sun, Type, Bookmark, MessageCircle, Share2, Menu, Loader2 } from 'lucide-react'
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ChapterPage({ 
  params 
}: { 
  params: { id: string; chapterId: string } 
}) {
  const router = useRouter()
  const [fontSize, setFontSize] = useState([18])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [fontFamily, setFontFamily] = useState("serif")
  const [chapter, setChapter] = useState<any>(null)
  const [novel, setNovel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // 页面加载时滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    // 获取章节内容和小说信息
    Promise.all([
      fetch(`/api/novels/${params.id}/chapters/${params.chapterId}`),
      fetch(`/api/novels/${params.id}`)
    ])
      .then(([chapterRes, novelRes]) => Promise.all([chapterRes.json(), novelRes.json()]))
      .then(([chapterData, novelData]) => {
        if (chapterData.chapter) {
          setChapter(chapterData.chapter)
        } else {
          setError(chapterData.error || '章节不存在')
        }
        
        if (novelData.novel) {
          setNovel(novelData.novel)
        }
        
        setLoading(false)
      })
      .catch(error => {
        console.error('获取章节内容失败:', error)
        setError('获取章节内容失败')
        setLoading(false)
      })
  }, [params.id, params.chapterId])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value)
  }

  // 章节导航函数
  const navigateToChapter = (chapterId: string) => {
    // 先滚动到顶部，然后导航
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    // 稍微延迟导航，确保滚动动画完成
    setTimeout(() => {
      router.push(`/novel/${params.id}/chapter/${chapterId}`)
    }, 300)
  }

  // 键盘导航支持
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // 避免在输入框中触发
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const currentChapterIndex = novel?.chapters?.findIndex((ch: any) => ch.id.toString() === params.chapterId) ?? -1
      
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        // 上一章
        if (currentChapterIndex > 0) {
          const prevChapter = novel.chapters[currentChapterIndex - 1]
          navigateToChapter(prevChapter.id.toString())
        }
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        // 下一章
        if (currentChapterIndex < (novel?.chapters?.length || 0) - 1) {
          const nextChapter = novel.chapters[currentChapterIndex + 1]
          navigateToChapter(nextChapter.id.toString())
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [novel, params.chapterId, params.id, router])

  // 获取上一章和下一章
  const currentChapterIndex = novel?.chapters?.findIndex((ch: any) => ch.id.toString() === params.chapterId) ?? -1
  const prevChapter = currentChapterIndex > 0 ? novel.chapters[currentChapterIndex - 1] : null
  const nextChapter = currentChapterIndex < (novel?.chapters?.length || 0) - 1 ? novel.chapters[currentChapterIndex + 1] : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在加载章节内容...</p>
        </div>
      </div>
    )
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">章节不存在</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link href={`/novel/${params.id}`}>
            <Button>返回小说详情</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur-sm ${
        isDarkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <span className="font-bold">书海阁</span>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <Link 
                  href={`/novel/${params.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {novel?.title || '小说详情'}
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-600">{chapter.title}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`border-b ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-3">
                <Type className="h-4 w-4" />
                <span className="text-sm">字体大小:</span>
                <div className="w-24">
                  <Slider
                    value={fontSize}
                    onValueChange={handleFontSizeChange}
                    max={24}
                    min={12}
                    step={1}
                  />
                </div>
                <span className="text-sm w-8">{fontSize[0]}px</span>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm">字体:</span>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serif">宋体</SelectItem>
                    <SelectItem value="sans-serif">黑体</SelectItem>
                    <SelectItem value="monospace">等宽</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="flex items-center space-x-2"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="text-sm">{isDarkMode ? '日间' : '夜间'}</span>
              </Button>

              <div className="text-xs text-gray-500 ml-auto">
                快捷键: ← 或 A (上一章) | → 或 D (下一章)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Chapter Header */}
          <div className="text-center mb-8" id="chapter-top">
            <h1 className="text-3xl font-bold mb-2">{chapter.title}</h1>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>字数: {chapter.wordCount || '未知'}</span>
              <span>发布时间: {new Date(chapter.createdAt).toLocaleString()}</span>
              {currentChapterIndex >= 0 && (
                <span>第 {currentChapterIndex + 1} / {novel?.chapters?.length || 0} 章</span>
              )}
            </div>
          </div>

          {/* Chapter Content */}
          <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
            <CardContent className="p-8">
              <div 
                className="prose prose-lg max-w-none leading-relaxed"
                style={{ 
                  fontSize: `${fontSize[0]}px`,
                  fontFamily: fontFamily === 'serif' ? 'serif' : fontFamily === 'sans-serif' ? 'sans-serif' : 'monospace',
                  lineHeight: '2'
                }}
              >
                {chapter.content
                  .replace(/\s{3,}/g, '\n\n') // 将连续3个或更多空格替换为双换行
                  .split('\n\n')
                  .map((paragraph: string, index: number) => (
                    paragraph.trim() && (
                      <p key={index} className="mb-6 text-justify">
                        {paragraph.trim()}
                      </p>
                    )
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Chapter Navigation */}
          <div className="flex items-center justify-between mt-8">
            <div>
              {prevChapter ? (
                <Button 
                  variant="outline" 
                  className="flex items-center space-x-2"
                  onClick={() => navigateToChapter(prevChapter.id.toString())}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>上一章</span>
                </Button>
              ) : (
                <Button variant="outline" disabled className="flex items-center space-x-2">
                  <ChevronLeft className="h-4 w-4" />
                  <span>上一章</span>
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                title="回到顶部"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            <div>
              {nextChapter ? (
                <Button 
                  className="flex items-center space-x-2"
                  onClick={() => navigateToChapter(nextChapter.id.toString())}
                >
                  <span>下一章</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button disabled className="flex items-center space-x-2">
                  <span>下一章</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Additional Navigation */}
          <div className="flex items-center justify-center mt-8 space-x-4">
            <Link href={`/novel/${params.id}`}>
              <Button variant="outline">返回小说详情</Button>
            </Link>
            
            {/* 章节进度条 */}
            {novel?.chapters && novel.chapters.length > 1 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>阅读进度:</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ 
                      width: `${((currentChapterIndex + 1) / novel.chapters.length) * 100}%` 
                    }}
                  ></div>
                </div>
                <span>{Math.round(((currentChapterIndex + 1) / novel.chapters.length) * 100)}%</span>
              </div>
            )}
          </div>

          {/* Quick Chapter Navigation */}
          {novel?.chapters && novel.chapters.length > 1 && (
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">快速跳转</h3>
              <div className="flex flex-wrap gap-2">
                {novel.chapters.slice(Math.max(0, currentChapterIndex - 2), currentChapterIndex + 3).map((chap: any, index: number) => {
                  const actualIndex = Math.max(0, currentChapterIndex - 2) + index
                  const isCurrentChapter = chap.id.toString() === params.chapterId
                  
                  return (
                    <Button
                      key={chap.id}
                      variant={isCurrentChapter ? "default" : "outline"}
                      size="sm"
                      onClick={() => !isCurrentChapter && navigateToChapter(chap.id.toString())}
                      disabled={isCurrentChapter}
                      className="text-xs"
                    >
                      第{actualIndex + 1}章
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
