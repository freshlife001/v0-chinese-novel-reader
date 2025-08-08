import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BookOpen, Loader2 } from 'lucide-react'

export default function NovelLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">书海阁</span>
            </div>
            <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在加载小说详情...</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Loading */}
          <div className="lg:col-span-2 space-y-6">
            {/* Novel Info Loading */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-48 h-64 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="text-center">
                          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description Loading */}
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Loading */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-24 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mx-auto"></div>
                  </div>
                  <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
