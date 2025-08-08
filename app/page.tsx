"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Search, Star, TrendingUp, Clock, Users, AlertCircle } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HomePage() {
  const [featuredNovels, setFeaturedNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Get imported novels
    fetch('/api/novels')
      .then(res => res.json())
      .then(data => {
        setFeaturedNovels(data.novels || [])
        setLoading(false)
      })
      .catch(error => {
        console.error('获取小说列表失败:', error)
        setError('获取小说列表失败')
        setLoading(false)
      })
  }, [])

  const categories = [
    { name: "玄幻", count: "2.1万", icon: "⚡" },
    { name: "都市", count: "1.8万", icon: "🏙️" },
    { name: "科幻", count: "1.2万", icon: "🚀" },
    { name: "历史", count: "0.9万", icon: "📜" },
    { name: "武侠", count: "1.5万", icon: "⚔️" },
    { name: "言情", count: "2.3万", icon: "💕" }
  ]

  const hotNovels = featuredNovels.slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">书海阁</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">首页</Link>
              <Link href="/novels" className="text-gray-700 hover:text-blue-600 transition-colors">小说库</Link>
              <Link href="/categories" className="text-gray-700 hover:text-blue-600 transition-colors">分类</Link>
              <Link href="/ranking" className="text-gray-700 hover:text-blue-600 transition-colors">排行榜</Link>
              <Link href="/admin" className="text-gray-700 hover:text-blue-600 transition-colors">管理</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="搜索小说、作者..." 
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline">登录</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            探索无限的故事世界
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            数万本精品小说，随时随地畅享阅读
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input 
                placeholder="搜索你想看的小说..." 
                className="pl-10 h-12 text-gray-900"
              />
            </div>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 h-12 px-8">
              开始阅读
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{featuredNovels.length}</div>
              <div className="text-gray-600">已导入小说</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">1,000+</div>
              <div className="text-gray-600">签约作者</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">500万+</div>
              <div className="text-gray-600">注册用户</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">24/7</div>
              <div className="text-gray-600">在线阅读</div>
            </div>
          </div>
        </div>
      </section>

      {/* Configuration Notice */}
      {!process.env.BLOB_READ_WRITE_TOKEN && (
        <section className="py-4 bg-yellow-50 border-b">
          <div className="container mx-auto px-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>配置提醒：</strong> Vercel Blob 存储尚未配置。请在 Vercel 项目设置中添加 Blob 存储集成以启用小说导入功能。
                <Link href="/admin/import" className="ml-2 text-blue-600 hover:underline">
                  前往导入页面
                </Link>
              </AlertDescription>
            </Alert>
          </div>
        </section>
      )}

      {/* Featured Novels */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-gray-900">精品推荐</h3>
            <Link href="/novels">
              <Button variant="outline">查看更多</Button>
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">加载失败</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>重试</Button>
            </div>
          ) : featuredNovels.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredNovels.map((novel) => (
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
              <p className="text-gray-500 mb-4">还没有导入任何小说，开始导入第一本小说吧！</p>
              <Link href="/admin/import">
                <Button>导入小说</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">热门分类</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link key={category.name} href={`/category/${category.name}`}>
                <Card className="text-center hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <h4 className="font-semibold text-gray-900">{category.name}</h4>
                    <p className="text-sm text-gray-600">{category.count}本</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Hot Rankings */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center mb-6">
                <TrendingUp className="h-6 w-6 text-red-500 mr-2" />
                <h3 className="text-2xl font-bold text-gray-900">热门榜单</h3>
              </div>
              {hotNovels.length > 0 ? (
                <div className="space-y-4">
                  {hotNovels.map((novel, index) => (
                    <div key={novel.id} className="flex items-center p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{novel.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{novel.author}</span>
                          <Badge variant="outline" className="text-xs">{novel.category}</Badge>
                        </div>
                      </div>
                      <Link href={`/novel/${novel.id}`}>
                        <Button variant="ghost" size="sm">阅读</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无热门小说</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center mb-6">
                <Clock className="h-6 w-6 text-blue-500 mr-2" />
                <h3 className="text-2xl font-bold text-gray-900">最近更新</h3>
              </div>
              <div className="space-y-4">
                {featuredNovels.slice(0, 5).map((novel, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <h4 className="font-semibold text-gray-900">{novel.title}</h4>
                      <p className="text-sm text-gray-600">{novel.latestChapter || '最新章节'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">刚刚更新</p>
                      <Link href={`/novel/${novel.id}`}>
                        <Button variant="ghost" size="sm" className="mt-1">阅读</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6" />
                <h4 className="text-xl font-bold">书海阁</h4>
              </div>
              <p className="text-gray-400">
                专业的在线小说阅读平台，为您提供优质的阅读体验。
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">小说分类</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/category/玄幻" className="hover:text-white">玄幻小说</Link></li>
                <li><Link href="/category/都市" className="hover:text-white">都市小说</Link></li>
                <li><Link href="/category/科幻" className="hover:text-white">科幻小说</Link></li>
                <li><Link href="/category/历史" className="hover:text-white">历史小说</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">服务支持</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">帮助中心</Link></li>
                <li><Link href="/contact" className="hover:text-white">联系我们</Link></li>
                <li><Link href="/feedback" className="hover:text-white">意见反馈</Link></li>
                <li><Link href="/about" className="hover:text-white">关于我们</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">关注我们</h5>
              <p className="text-gray-400 mb-4">获取最新小说推荐和更新通知</p>
              <div className="flex space-x-2">
                <Input placeholder="输入邮箱" className="bg-gray-800 border-gray-700" />
                <Button>订阅</Button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 书海阁. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
