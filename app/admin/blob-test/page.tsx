"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, CheckCircle, AlertCircle, Loader2, Database, Upload } from 'lucide-react'
import Link from "next/link"
import { useState } from "react"

export default function BlobTestPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [testing, setTesting] = useState(false)

  const runBlobTests = async () => {
    setTesting(true)
    setTestResults([])
    
    const tests = [
      {
        name: "检查环境变量",
        test: async () => {
          const response = await fetch('/api/blob-test/env')
          const result = await response.json()
          return { success: response.ok, message: result.message, details: result.details }
        }
      },
      {
        name: "测试 Blob 连接",
        test: async () => {
          const response = await fetch('/api/blob-test/connection')
          const result = await response.json()
          return { success: response.ok, message: result.message, details: result.details }
        }
      },
      {
        name: "测试文件上传",
        test: async () => {
          const response = await fetch('/api/blob-test/upload', { method: 'POST' })
          const result = await response.json()
          return { success: response.ok, message: result.message, details: result.details }
        }
      },
      {
        name: "测试文件列表",
        test: async () => {
          const response = await fetch('/api/blob-test/list')
          const result = await response.json()
          return { success: response.ok, message: result.message, details: result.details }
        }
      }
    ]

    for (const testCase of tests) {
      try {
        const result = await testCase.test()
        setTestResults(prev => [...prev, { name: testCase.name, ...result }])
      } catch (error) {
        setTestResults(prev => [...prev, { 
          name: testCase.name, 
          success: false, 
          message: `测试失败: ${error.message}`,
          details: null
        }])
      }
    }
    
    setTesting(false)
  }

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
              <span className="text-lg text-gray-600">Blob 存储测试</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline">返回管理</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Blob 存储测试</h1>
            <p className="text-gray-600">验证 Vercel Blob 存储配置和功能</p>
          </div>

          <div className="grid gap-6">
            {/* Test Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>存储测试</span>
                </CardTitle>
                <CardDescription>
                  运行一系列测试来验证 Blob 存储是否正常工作
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runBlobTests}
                  disabled={testing}
                  className="w-full"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      开始测试
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Test Results */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>测试结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {testResults.map((result, index) => (
                      <Alert key={index} variant={result.success ? "default" : "destructive"}>
                        {result.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>
                          <div className="font-semibold">{result.name}</div>
                          <div className="mt-1">{result.message}</div>
                          {result.details && (
                            <div className="mt-2 text-sm font-mono bg-gray-100 p-2 rounded">
                              {JSON.stringify(result.details, null, 2)}
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success Actions */}
            {testResults.length > 0 && testResults.every(r => r.success) && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>测试通过！</span>
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Blob 存储配置正确，您现在可以开始导入小说了
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <Link href="/admin/import">
                      <Button>开始导入小说</Button>
                    </Link>
                    <Link href="/novels">
                      <Button variant="outline">查看小说库</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>测试说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">测试项目</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li><strong>环境变量检查</strong>: 验证 BLOB_READ_WRITE_TOKEN 是否正确配置</li>
                    <li><strong>Blob 连接测试</strong>: 测试与 Vercel Blob 服务的连接</li>
                    <li><strong>文件上传测试</strong>: 创建一个测试文件并上传到 Blob 存储</li>
                    <li><strong>文件列表测试</strong>: 列出 Blob 存储中的文件</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">如果测试失败</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>检查 Vercel 项目设置中的 Blob 存储集成</li>
                    <li>确认环境变量已正确部署</li>
                    <li>尝试重新部署项目</li>
                    <li>查看 Vercel 函数日志获取详细错误信息</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
