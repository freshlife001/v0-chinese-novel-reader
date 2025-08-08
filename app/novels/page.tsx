"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Search, Filter, Plus, Clock, Users, Loader2 } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState, Suspense } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Separate component for search functionality
function NovelsSearch({ 
  searchTerm, 
  setSearchTerm, 
  category, 
  setCategory, 
  status, 
  setStatus, 
  sortBy, 
  setSortBy, 
  categories 
}: {
  searchTerm: string
  setSearchTerm: (term: string) => void
  category: string
  setCategory: (cat: string) => void
  status: string
  setStatus: (status: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
  categories: string[]
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="搜索小说或作者..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.filter(c => c !== 'all').map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="连载中">连载中</SelectItem>
              <SelectItem value="已完结">已完结</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">最新导入</SelectItem>
              <SelectItem value="chapters">章节数量</SelectItem>
              <SelectItem value="title">书名排序</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// Main novels content component
function NovelsContent() {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState("all")
  const [sortBy, setSortBy] = useState("latest")

  useEffect(() => {
    // Get imported novels
    fetch('/api/novels')
      .then(res => res.json())
      .then(data => {
        setNovels(data.novels || [])
        setLoading(false)
      })
      .catch(error => {
        console.error('获取小说列表失败:', error)
        setLoading(false)
      })
  }, [])

  // Filter and sort novels
  const filteredNovels = novels
    .filter(novel => {
      // Search filter
      if (searchTerm && !novel.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !novel.author.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      // Category filter
      if (category !== 'all' && novel.category !== category) {
        return false
      }
      
      // Status filter
      if (status !== 'all' && novel.status !== status) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      // Sort
      switch (sortBy) {
        case 'latest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'chapters':
          return b.chapters - a.chapters
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  // Get all categories
  const categories = ['all', ...new Set(novels.map(novel => novel.category))]

  return (
    <>
      {/* Search and Filter */}
      <Suspense fallback={
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      }>
        <NovelsSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          category={category}
          setCategory={setCategory}
          status={status}
          setStatus={setStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          categories={categories}
        />
      </Suspense>

      {/* Novels List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在加载小说列表...</p>
        </div>
      ) : filteredNovels.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNovels.map((novel) => (
            <Card key={novel.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex">
                <div className="w-24 h-32 flex-shrink-0">
                  <Image
                    src={novel.cover || `/placeholder.svg?height=128&width=96&text=${encodeURIComponent(novel.title)}`}
                    alt={novel.title}
                    width={96}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-4">
                  <CardHeader className="p-0 mb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-1">{novel.title}</CardTitle>
                      <Badge variant="secondary">{novel.category}</Badge>
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      作者：{novel.author}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {novel.chapters}章
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {novel.status}
                        </span>
                      </div>
                    </div>
                    <Link href={`/novel/${novel.id}`}>
                      <Button className="w-full" size="sm">
                        开始阅读
                      </Button>
                    </Link>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无小说</h3>
          <p className="text-gray-500 mb-4">还没有导入任何小说，或没有符合筛选条件的小说</p>
          <Link href="/admin/import">
            <Button>导入小说</Button>
          </Link>
        </div>
      )}

      {/* Pagination */}
      {filteredNovels.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <Button variant="outline" disabled>上一页</Button>
            <Button variant="outline" className="bg-blue-50">1</Button>
            <Button variant="outline" disabled>下一页</Button>
          </div>
        </div>
      )}
    </>
  )
}

export default function NovelsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <Link href="/" className="text-2xl font-bold text-gray-900">书海阁</Link>
              <span className="text-gray-400">|</span>
              <span className="text-lg text-gray-600">小说库</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/import">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  导入小说
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">小说库</h1>
          <p className="text-gray-600">浏览所有已导入的小说</p>
        </div>

        <Suspense fallback={
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">正在加载小说列表...</p>
          </div>
        }>
          <NovelsContent />
        </Suspense>
      </div>
    </div>
  )
}
