import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BookOpen, Loader2 } from 'lucide-react'

export default function NovelsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">书海阁</span>
              <span className="text-gray-400">|</span>
              <span className="text-lg text-gray-600">小说库</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">小说库</h1>
          <p className="text-gray-600">浏览所有已导入的小说</p>
        </div>

        {/* Loading Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Loading Content */}
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在加载小说列表...</p>
        </div>

        {/* Loading Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex">
                <div className="w-24 h-32 bg-gray-200 animate-pulse"></div>
                <div className="flex-1 p-4">
                  <CardHeader className="p-0 mb-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex space-x-3">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
