"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Star, Users, Clock, Heart, Share2, MessageCircle, ChevronRight, Loader2, Search, List, Grid, ChevronDown, ChevronUp } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function NovelDetailPage({ params }: { params: { id: string } }) {
  // 解包params属性
  const resolvedParams = React.use(params)
  const { id } = resolvedParams
  
  const [novel, setNovel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showAllChapters, setShowAllChapters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [chaptersPerPage] = useState(50)

  useEffect(() => {
    // 获取小说详情
    fetch(`/api/novels/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.novel) {
          setNovel(data.novel)
        } else {
          setError(data.error || '小说不存在')
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('获取小说详情失败:', error)
        setError('获取小说详情失败')
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在加载小说详情...</p>
        </div>
      </div>
    )
  }

  if (error || !novel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">小说不存在</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link href="/novels">
            <Button>返回小说库</Button>
          </Link>
        </div>
      </div>
    )
  }

  // 过滤章节
  const filteredChapters = novel.chapters?.filter((chapter: any) =>
    chapter.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // 分页逻辑
  const totalPages = Math.ceil(filteredChapters.length / chaptersPerPage)
  const startIndex = (currentPage - 1) * chaptersPerPage
  const endIndex = startIndex + chaptersPerPage
  const currentChapters = filteredChapters.slice(startIndex, endIndex)

  // 显示最新章节和开始章节
  const latestChapters = novel.chapters?.slice(-5) || []
  const firstChapters = novel.chapters?.slice(0, 5) || []

  // 获取用户的阅读进度
  const getUserReadingProgress = () => {
    if (typeof window !== 'undefined') {
      const progress = localStorage.getItem(`novel_${id}_progress`)
      return progress ? JSON.parse(progress) : null
    }
    return null
  }

  // 检查用户是否有阅读进度
  const hasReadingProgress = () => {
    const progress = getUserReadingProgress()
    return progress !== null
  }

  // 获取继续阅读的章节链接
  const getContinueReadingChapter = () => {
    const progress = getUserReadingProgress()
    if (progress && progress.chapterId && novel.chapters && novel.chapters.length > 0) {
      // 查找用户上次阅读的章节
      const chapter = novel.chapters.find((ch: any) => ch.id.toString() === progress.chapterId.toString())
      if (chapter) {
        return chapter
      }
    }
    // 如果没有找到上次阅读的章节，默认返回最新章节
    return novel.chapters[novel.chapters.length - 1]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <Link href="/" className="text-2xl font-bold text-gray-900">书海阁</Link>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-700 hover:text-blue-600">首页</Link>
              <Link href="/novels" className="text-gray-700 hover:text-blue-600">小说库</Link>
              <Link href="/categories" className="text-gray-700 hover:text-blue-600">分类</Link>
              <Link href="/ranking" className="text-gray-700 hover:text-blue-600">排行榜</Link>
            </nav>
            <Button variant="outline">登录</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Novel Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-48 h-64 mx-auto md:mx-0 flex-shrink-0">
                    <Image
                      src={novel.cover || `/placeholder.svg?height=256&width=192&text=${encodeURIComponent(novel.title)}`}
                      alt={novel.title}
                      width={192}
                      height={256}
                      className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">{novel.title}</h1>
                        <Badge variant={novel.status === '连载中' ? 'default' : 'secondary'}>
                          {novel.status}
                        </Badge>
                      </div>
                      <p className="text-lg text-gray-600">作者：{novel.author}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{novel.category}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{novel.chapters?.length || 0}</div>
                        <div className="text-sm text-gray-600">章节</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{Math.floor((novel.wordCount || 0) / 10000)}万</div>
                        <div className="text-sm text-gray-600">字数</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">{novel.importedChapters || 0}</div>
                        <div className="text-sm text-gray-600">已导入</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {novel.chapters && novel.chapters.length > 0 && (
                        <>
                          <Link href={`/novel/${novel.id}/chapter/${novel.chapters[0].id}`}>
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                              <BookOpen className="h-5 w-5 mr-2" />
                              从头阅读
                            </Button>
                          </Link>
                          {hasReadingProgress() && (
                            <Link href={`/novel/${novel.id}/chapter/${getContinueReadingChapter().id}`}>
                              <Button size="lg" variant="outline">
                                <BookOpen className="h-5 w-5 mr-2" />
                                继续阅读
                              </Button>
                            </Link>
                          )}
                        </>
                      )}
                      <Button variant="outline" size="lg">
                        <Heart className="h-5 w-5 mr-2" />
                        收藏
                      </Button>
                      <Button variant="outline" size="lg">
                        <Share2 className="h-5 w-5 mr-2" />
                        分享
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>作品简介</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{novel.description || '暂无简介'}</p>
              </CardContent>
            </Card>

            {/* Chapter List */}
            {novel.chapters && novel.chapters.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>章节目录</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>最后更新：{new Date(novel.lastUpdate).toLocaleDateString()}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllChapters(!showAllChapters)}
                      >
                        {showAllChapters ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            收起目录
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            展开目录
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!showAllChapters ? (
                    // 简化视图：显示最新和开始章节
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 mb-4">
                        共 {novel.chapters.length} 章节
                      </div>
                      
                      {/* 最新章节 */}
                      {latestChapters.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="font-semibold text-gray-900 mb-2">最新章节</h4>
                          {latestChapters.map((chapter) => (
                            <Link key={chapter.id} href={`/novel/${novel.id}/chapter/${chapter.id}`}>
                              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm font-medium">{chapter.title}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {latestChapters.length > 0 && firstChapters.length > 0 && (
                        <Separator className="my-4" />
                      )}

                      {/* 开始章节 */}
                      {firstChapters.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="font-semibold text-gray-900 mb-2">从头开始</h4>
                          {firstChapters.map((chapter) => (
                            <Link key={chapter.id} href={`/novel/${novel.id}/chapter/${chapter.id}`}>
                              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm font-medium">{chapter.title}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // 完整章节目录
                    <div className="space-y-4">
                      {/* 搜索和控制栏 */}
                      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              placeholder="搜索章节..."
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1) // 重置到第一页
                              }}
                              className="pl-10"
                            />
                          </div>
                          <div className="text-sm text-gray-600 whitespace-nowrap">
                            共 {filteredChapters.length} 章
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Select value={viewMode} onValueChange={(value: 'grid' | 'list') => setViewMode(value)}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="list">
                                <div className="flex items-center">
                                  <List className="h-4 w-4 mr-2" />
                                  列表
                                </div>
                              </SelectItem>
                              <SelectItem value="grid">
                                <div className="flex items-center">
                                  <Grid className="h-4 w-4 mr-2" />
                                  网格
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* 章节列表 */}
                      <ScrollArea className="h-[600px] rounded-md border">
                        <div className="p-4">
                          {filteredChapters.length > 0 ? (
                            <>
                              {viewMode === 'list' ? (
                                // 列表视图
                                <div className="space-y-1">
                                  {currentChapters.map((chapter, index) => (
                                    <Link key={chapter.id} href={`/novel/${novel.id}/chapter/${chapter.id}`}>
                                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                                        <div className="flex items-center space-x-3">
                                          <span className="text-sm text-gray-500 w-12">
                                            第{startIndex + index + 1}章
                                          </span>
                                          <span className="text-sm font-medium flex-1">
                                            {chapter.title}
                                          </span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                // 网格视图
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {currentChapters.map((chapter, index) => (
                                    <Link key={chapter.id} href={`/novel/${novel.id}/chapter/${chapter.id}`}>
                                      <div className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                        <div className="text-xs text-gray-500 mb-1">
                                          第{startIndex + index + 1}章
                                        </div>
                                        <div className="text-sm font-medium line-clamp-2">
                                          {chapter.title}
                                        </div>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              )}

                              {/* 分页控制 */}
                              {totalPages > 1 && (
                                <div className="flex items-center justify-center space-x-2 mt-6 pt-4 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                  >
                                    上一页
                                  </Button>
                                  
                                  <div className="flex items-center space-x-1">
                                    {/* 显示页码 */}
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                      let pageNum
                                      if (totalPages <= 5) {
                                        pageNum = i + 1
                                      } else if (currentPage <= 3) {
                                        pageNum = i + 1
                                      } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i
                                      } else {
                                        pageNum = currentPage - 2 + i
                                      }
                                      
                                      return (
                                        <Button
                                          key={pageNum}
                                          variant={currentPage === pageNum ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => setCurrentPage(pageNum)}
                                          className="w-8 h-8 p-0"
                                        >
                                          {pageNum}
                                        </Button>
                                      )
                                    })}
                                  </div>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                  >
                                    下一页
                                  </Button>
                                  
                                  <div className="text-sm text-gray-600 ml-4">
                                    第 {currentPage} / {totalPages} 页
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-8">
                              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">没有找到匹配的章节</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      {/* 快速跳转 */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">快速跳转到第</span>
                          <Input
                            type="number"
                            min="1"
                            max={novel.chapters.length}
                            placeholder="章节号"
                            className="w-20 h-8"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const chapterNum = parseInt((e.target as HTMLInputElement).value)
                                if (chapterNum >= 1 && chapterNum <= novel.chapters.length) {
                                  const targetChapter = novel.chapters[chapterNum - 1]
                                  if (targetChapter) {
                                    window.open(`/novel/${novel.id}/chapter/${targetChapter.id}`, '_blank')
                                  }
                                }
                              }
                            }}
                          />
                          <span className="text-sm text-gray-600">章</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (novel.chapters.length > 0) {
                                window.open(`/novel/${novel.id}/chapter/${novel.chapters[0].id}`, '_blank')
                              }
                            }}
                          >
                            第一章
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (novel.chapters.length > 0) {
                                const lastChapter = novel.chapters[novel.chapters.length - 1]
                                window.open(`/novel/${novel.id}/chapter/${lastChapter.id}`, '_blank')
                              }
                            }}
                          >
                            最新章
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Info */}
            <Card>
              <CardHeader>
                <CardTitle>作者信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-blue-600">
                      {novel.author.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{novel.author}</h3>
                    <p className="text-sm text-gray-600">作者</p>
                  </div>
                  <Button variant="outline" className="w-full">关注作者</Button>
                </div>
              </CardContent>
            </Card>

            {/* Novel Stats */}
            <Card>
              <CardHeader>
                <CardTitle>小说统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">分类</span>
                    <span className="font-medium">{novel.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">状态</span>
                    <span className="font-medium">{novel.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">章节数</span>
                    <span className="font-medium">{novel.chapters?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">字数</span>
                    <span className="font-medium">{Math.floor((novel.wordCount || 0) / 10000)}万字</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">创建时间</span>
                    <span className="font-medium">{new Date(novel.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reading Progress */}
            {novel.chapters && novel.chapters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>阅读工具</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" asChild>
                    <Link href={`/novel/${novel.id}/chapter/${novel.chapters[0].id}`}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      从头开始
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/novel/${novel.id}/chapter/${getContinueReadingChapter().id}`}>
                      继续阅读
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Heart className="h-4 w-4 mr-2" />
                    加入书架
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
