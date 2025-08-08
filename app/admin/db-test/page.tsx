import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from "next/link"
import { useState } from 'react'

export default function DatabaseTestPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDatabaseTest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/debug-import')
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      setTestResults({ error: '测试失败: ' + error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-green-600" />
              <Link href="/admin" className="text-2xl font-bold text-gray-900">书海阁</Link>
              <span className="text-gray-400">|</span>
              <span className="text-lg text-gray-600">数据库测试</span>
            </div>
            <Link href="/admin">
              <Button variant="outline">返回管理后台</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">数据库测试</h1>
          <p className="text-gray-600">验证 Turso 数据库连接和功能</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 测试控制 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>数据库连接测试</span>
              </CardTitle>
              <CardDescription>
                测试 Turso 数据库的连接和基本功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={runDatabaseTest} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    '开始测试'
                  )}
                </Button>
                
                {testResults && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">测试结果:</h3>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 测试状态 */}
          <Card>
            <CardHeader>
              <CardTitle>系统状态</CardTitle>
              <CardDescription>
                数据库相关服务的当前状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Turso 数据库</span>
                  {testResults?.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">认证令牌</span>
                  {testResults?.debug?.hasToken ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">数据库表</span>
                  {testResults?.debug?.tableCount > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 数据库信息 */}
        {testResults?.debug && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>数据库详细信息</CardTitle>
              <CardDescription>
                数据库连接和表的详细信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">连接信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>认证令牌状态:</span>
                      <span className={testResults.debug.hasToken ? 'text-green-600' : 'text-red-600'}>
                        {testResults.debug.hasToken ? '已配置' : '未配置'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>数据库连接:</span>
                      <span className={testResults.debug.databaseConnected ? 'text-green-600' : 'text-red-600'}>
                        {testResults.debug.databaseConnected ? '正常' : '异常'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>表数量:</span>
                      <span>{testResults.debug.tableCount}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">数据库表</h4>
                  <div className="text-sm">
                    {testResults.debug.tables && testResults.debug.tables.length > 0 ? (
                      <ul className="space-y-1">
                        {testResults.debug.tables.map((table: any, index: number) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>{table.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">暂无数据库表</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}