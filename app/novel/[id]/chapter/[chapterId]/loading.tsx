import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Loader2 } from 'lucide-react'

export default function ChapterLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <span className="font-bold">书海阁</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">正在加载章节内容...</p>
          </div>

          {/* Chapter Header Loading */}
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mx-auto mb-2"></div>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
            </div>
          </div>

          {/* Chapter Content Loading */}
          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Loading */}
          <div className="flex items-center justify-between mt-8">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </main>
    </div>
  )
}
