import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Upload, Database, Settings, BarChart3, TestTube } from 'lucide-react'
import Link from "next/link"

export default function AdminPage() {
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
              <span className="text-lg text-gray-600">管理后台</span>
            </div>
            <Link href="/">
              <Button variant="outline">返回首页</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理后台</h1>
          <p className="text-gray-600">管理您的小说网站内容</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Blob 存储测试 */}
          <Card className="hover:shadow-lg transition-shadow border-blue-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TestTube className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>存储测试</CardTitle>
                  <CardDescription>验证 Blob 存储配置</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                测试 Vercel Blob 存储连接和功能
              </p>
              <Link href="/admin/blob-test">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">开始测试</Button>
              </Link>
            </CardContent>
          </Card>

          {/* 导入小说 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Upload className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>导入小说</CardTitle>
                  <CardDescription>从网页链接导入小说内容</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                支持从各大小说网站导入小说章节和信息
              </p>
              <Link href="/admin/import">
                <Button className="w-full">开始导入</Button>
              </Link>
            </CardContent>
          </Card>

          {/* 小说管理 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Database className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>小说管理</CardTitle>
                  <CardDescription>管理已导入的小说</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                编辑、删除或更新小说信息和章节
              </p>
              <Link href="/novels">
                <Button variant="outline" className="w-full">管理小说</Button>
              </Link>
            </CardContent>
          </Card>

          {/* 数据统计 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>数据统计</CardTitle>
                  <CardDescription>查看网站运营数据</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                小说阅读量、用户活跃度等统计信息
              </p>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full">查看统计</Button>
              </Link>
            </CardContent>
          </Card>

          {/* 系统设置 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Settings className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <CardTitle>系统设置</CardTitle>
                  <CardDescription>网站基本设置</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                网站名称、SEO设置、用户权限等
              </p>
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full">系统设置</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 快速统计 */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">网站概览</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                <div className="text-sm text-gray-600">总小说数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">0</div>
                <div className="text-sm text-gray-600">总章节数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
                <div className="text-sm text-gray-600">今日访问</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">0</div>
                <div className="text-sm text-gray-600">活跃用户</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">快速开始</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/admin/blob-test">
              <Button variant="outline" className="bg-white">
                <TestTube className="h-4 w-4 mr-2" />
                测试存储
              </Button>
            </Link>
            <Link href="/admin/import">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                导入第一本小说
              </Button>
            </Link>
            <Link href="/novels">
              <Button variant="outline" className="bg-white">
                <Database className="h-4 w-4 mr-2" />
                查看小说库
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
