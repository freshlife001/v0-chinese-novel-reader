"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, LinkIcon, Download, CheckCircle, AlertCircle, Loader2, Info, List, RefreshCw, Plus, Clock, Activity, Timer, ExternalLink, Code, Zap } from 'lucide-react'
import Link from "next/link"
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export default function ImportPage() {
  const [url, setUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'analyzing' | 'importing' | 'success' | 'error'>('idle')
  const [novelInfo, setNovelInfo] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [taskId, setTaskId] = useState<string>("")

  const handleAnalyzeUrl = async () => {
    if (!url.trim()) {
      setErrorMessage("请输入有效的网页链接")
      return
    }

    setImportStatus('analyzing')
    setErrorMessage("")
    setNovelInfo(null)
    setDebugInfo([])
    setTaskId("")
    
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '解析失败')
      }

      if (result.success && result.data) {
        setNovelInfo(result.data)
        setImportStatus('idle')
        
        // 添加调试信息
        const debugMessages = [
          `标题: ${result.data.title || '未找到'}`,
          `作者: ${result.data.author || '未找到'}`,
          `简介: ${result.data.description ? (result.data.description.substring(0, 50) + '...') : '未找到'}`,
          `章节数: ${result.data.chapters ? result.data.chapters.length : 0}`,
        ]

        // 如果是已存在的小说，添加续导信息
        if (result.data.isExisting && result.data.resumeInfo) {
          const resumeInfo = result.data.resumeInfo
          const totalPending = resumeInfo.pendingChapters.length + resumeInfo.newChapters.length
          const estimatedTimeDaily = Math.ceil(totalPending / 15) // 每日CronJob处理15章
          const estimatedTimeExternal = Math.ceil(totalPending / 15) // 外部调用每次15章
          
          debugMessages.push(
            `📚 检测到已存在的小说！`,
            `总章节数: ${resumeInfo.totalChapters}`,
            `已导入章节: ${resumeInfo.importedChapters}`,
            `失败重试章节: ${resumeInfo.pendingChapters.length}`,
            `新增章节: ${resumeInfo.newChapters.length}`,
            `总待导入: ${totalPending}`,
            `⏰ 每日CronJob: 每天处理15章，需${estimatedTimeDaily}天`,
            `🚀 外部调用: 每次处理15章，可快速完成`,
            `续导信息: ${resumeInfo.message}`
          )
        } else if (result.data.chapters) {
          const estimatedTimeDaily = Math.ceil(result.data.chapters.length / 15)
          const estimatedTimeExternal = Math.ceil(result.data.chapters.length / 15)
          debugMessages.push(
            `⏰ 每日CronJob: 每天处理15章，需${estimatedTimeDaily}天`,
            `🚀 外部调用: 每次处理15章，可快速完成`
          )
        }

        setDebugInfo(debugMessages)
      } else {
        throw new Error('解析结果无效')
      }
    } catch (error) {
      setImportStatus('error')
      setErrorMessage(error.message || "解析网页失败，请检查链接是否正确")
    }
  }

  const handleImport = async () => {
    if (!novelInfo) return

    console.log('🚀 开始混合导入流程...')
    console.log('📚 小说信息:', JSON.stringify(novelInfo, null, 2))

    setIsImporting(true)
    setImportStatus('importing')
    
    const isResume = novelInfo.isExisting
    const actionText = isResume ? '续导' : '导入'
    const newTaskId = `hybrid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('🆔 生成混合任务ID:', newTaskId)
    console.log('🔄 导入模式:', actionText)
    
    setTaskId(newTaskId)

    try {
      console.log('📝 第一步：保存/更新小说基本信息...')
      
      // 第一步：保存/更新小说基本信息
      const saveData = {
        ...novelInfo,
        existingNovelId: novelInfo.existingNovelId || null
      }
      
      console.log('💾 准备保存的小说数据:', JSON.stringify(saveData, null, 2))
      
      const saveResponse = await fetch('/api/save-novel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData)
      })

      console.log('💾 保存小说响应状态:', saveResponse.status)
      const saveResult = await saveResponse.json()
      console.log('💾 保存小说响应数据:', JSON.stringify(saveResult, null, 2))
      
      if (!saveResponse.ok) {
        throw new Error(saveResult.error || '保存小说信息失败')
      }

      const novelId = saveResult.novelId
      console.log('✅ 小说保存成功，ID:', novelId)

      console.log('📋 第二步：创建混合导入任务...')
      
      // 计算待导入章节数
      let totalChaptersToImport = 0
      let chaptersToImport = novelInfo.chapters || []
      
      if (isResume && novelInfo.resumeInfo) {
        chaptersToImport = [
          ...novelInfo.resumeInfo.pendingChapters,
          ...novelInfo.resumeInfo.newChapters
        ]
        totalChaptersToImport = chaptersToImport.length
      } else {
        totalChaptersToImport = novelInfo.chapters?.length || 0
      }
      
      console.log('📊 待导入章节数:', totalChaptersToImport)

      if (chaptersToImport.length > 0) {
        const chapterUrls = chaptersToImport
          .sort((a, b) => a.id - b.id)
          .map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            url: chapter.url
          }))

        console.log('📖 准备导入的章节列表:', JSON.stringify(chapterUrls.slice(0, 3), null, 2), '...(共', chapterUrls.length, '章)')

        // 创建混合任务
        const importResponse = await fetch('/api/import-chapters-async', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            novelId,
            chapterUrls,
            batchSize: 15, // 混合模式每次处理15个章节
            isResume,
            taskId: newTaskId
          })
        })

        console.log('🔄 创建混合任务响应状态:', importResponse.status)
        const importResult = await importResponse.json()
        console.log('🔄 创建混合任务响应数据:', JSON.stringify(importResult, null, 2))
        
        if (!importResponse.ok) {
          throw new Error(importResult.error || '创建混合任务失败')
        }

        console.log('✅ 混合任务创建成功')
        
        // 更新任务标题
        const taskResponse = await fetch('/api/import-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId: newTaskId,
            novelId,
            novelTitle: novelInfo.title,
            status: 'pending',
            progress: 0,
            importedCount: 0,
            failedCount: 0,
            skippedCount: importResult.skippedChapters || 0,
            totalChapters: importResult.totalChapters || 0,
            chapterQueue: chapterUrls,
            logs: [
              `📚 混合导入任务创建成功: ${novelInfo.title}`,
              `📋 总章节数: ${importResult.totalChapters}`,
              `📋 待导入章节: ${importResult.pendingChapters}`,
              `📋 已跳过章节: ${importResult.skippedChapters}`,
              `⏰ 每日CronJob自动处理`,
              `🚀 可使用外部程序加速处理`,
              `📡 外部API: ${window.location.origin}/api/process-import-queue`
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            hybrid: true // 标记为混合任务
          })
        })

        if (taskResponse.ok) {
          console.log('✅ 任务信息更新成功')
        }
      } else {
        console.log('⚠️ 没有需要导入的章节')
      }

      console.log('🎉 混合导入流程完成')
      setImportStatus('success')
      setIsImporting(false)

      // 保存novelId以便后续跳转
      setNovelInfo(prev => ({ ...prev, id: novelId }))

    } catch (error) {
      console.error('❌ 混合导入流程失败:', error)
      console.error('❌ 错误堆栈:', error.stack)
      
      setImportStatus('error')
      setErrorMessage(error.message || "创建混合任务失败，请重试")
      setIsImporting(false)
    }
  }

  const runDebugTest = async () => {
    try {
      console.log('🔍 运行调试测试...')
      const response = await fetch('/api/debug-import')
      const result = await response.json()
      
      console.log('🔍 调试结果:', result)
      
      if (result.success) {
        setDebugInfo([
          '✅ 环境变量配置正确',
          `✅ Blob 存储连接正常 (${result.debug.blobCount} 个文件)`,
          '✅ 任务文件创建成功',
          '✅ 任务文件读取成功',
          '✅ 任务文件清理成功',
          `🕐 测试时间: ${result.debug.timestamp}`
        ])
      } else {
        setDebugInfo([
          '❌ 调试测试失败',
          `❌ 错误: ${result.error}`,
          `🔑 Token 存在: ${result.debug?.hasToken}`,
          `🕐 测试时间: ${result.debug?.timestamp}`
        ])
      }
      setShowDebug(true)
    } catch (error) {
      console.error('❌ 调试测试异常:', error)
      setDebugInfo([
        '❌ 调试测试异常',
        `❌ 错误: ${error.message}`,
        `🕐 测试时间: ${new Date().toISOString()}`
      ])
      setShowDebug(true)
    }
  }

  const testExternalAPI = async () => {
    try {
      const response = await fetch('/api/process-import-queue')
      const result = await response.json()
      
      setDebugInfo([
        '🚀 外部API测试结果:',
        `✅ API响应正常`,
        `📊 处理任务数: ${result.processedTasks || 0}`,
        `📋 待处理任务数: ${result.totalPendingTasks || 0}`,
        `⏰ 响应时间: ${result.timestamp}`,
        result.nextCallRecommended ? '🔄 建议继续调用' : '✅ 暂无更多任务'
      ])
      setShowDebug(true)
    } catch (error) {
      setDebugInfo([
        '❌ 外部API测试失败',
        `❌ 错误: ${error.message}`,
        `🕐 测试时间: ${new Date().toISOString()}`
      ])
      setShowDebug(true)
    }
  }

  const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app'

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
              <span className="text-lg text-gray-600">混合导入</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={runDebugTest}>
                🔍 调试测试
              </Button>
              <Button variant="outline" size="sm" onClick={testExternalAPI}>
                🚀 测试外部API
              </Button>
              <Link href="/admin/import-status">
                <Button variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  导入状态
                </Button>
              </Link>
              <Link href="/novels">
                <Button variant="outline">小说库</Button>
              </Link>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">混合导入系统</h1>
            <p className="text-gray-600">每日CronJob + 外部API调用，灵活高效的导入方案</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* 导入表单 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LinkIcon className="h-5 w-5" />
                    <span>输入小说网页链接</span>
                  </CardTitle>
                  <CardDescription>
                    支持主流小说网站，使用混合导入系统处理
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="url">网页链接</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/novel/123"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleAnalyzeUrl}
                    disabled={importStatus === 'analyzing' || !url.trim()}
                    className="w-full"
                  >
                    {importStatus === 'analyzing' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        解析中...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        解析网页
                      </>
                    )}
                  </Button>

                  {errorMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* 混合导入说明 */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-purple-800">
                    <Zap className="h-5 w-5" />
                    <span>混合导入系统</span>
                  </CardTitle>
                  <CardDescription className="text-purple-700">
                    结合每日CronJob和外部API调用的灵活方案
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-purple-800">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>每日CronJob自动处理（免费）</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>外部程序可加速处理</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>支持多任务并行</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>自动重试和错误恢复</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 外部API说明 */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <ExternalLink className="h-5 w-5" />
                    <span>外部API调用</span>
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    使用外部程序加速导入处理
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-green-800">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-green-800">API端点:</Label>
                      <div className="mt-1 p-2 bg-green-100 rounded font-mono text-xs break-all">
                        {currentDomain}/api/process-import-queue
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>GET: 处理待处理任务</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>POST: 支持参数控制</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>无需鉴权，可直接调用</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>每次处理15个章节</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 使用示例 */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-800">
                    <Code className="h-5 w-5" />
                    <span>外部调用示例</span>
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    使用curl或其他工具调用API
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-blue-800">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-blue-800">简单调用:</Label>
                      <div className="mt-1 p-2 bg-blue-100 rounded font-mono text-xs">
                        curl {currentDomain}/api/process-import-queue
                      </div>
                    </div>
                    <div>
                      <Label className="text-blue-800">定时调用 (每分钟):</Label>
                      <div className="mt-1 p-2 bg-blue-100 rounded font-mono text-xs">
                        */1 * * * * curl {currentDomain}/api/process-import-queue
                      </div>
                    </div>
                    <div>
                      <Label className="text-blue-800">POST调用 (控制参数):</Label>
                      <div className="mt-1 p-2 bg-blue-100 rounded font-mono text-xs">
                        curl -X POST -H "Content-Type: application/json" -d '{`{"maxTasks": 3}`}' {currentDomain}/api/process-import-queue
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 调试信息 */}
              {debugInfo.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Info className="h-5 w-5" />
                      <span>解析信息</span>
                      {novelInfo?.isExisting && (
                        <Badge variant="secondary" className="ml-2">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          续导模式
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1 font-mono">
                      {debugInfo.map((info, index) => (
                        <div key={index} className={`border-b border-gray-100 py-1 last:border-0 ${
                          info.startsWith('📚') ? 'text-blue-600 font-semibold' : 
                          info.startsWith('⏰') ? 'text-orange-600 font-semibold' : 
                          info.startsWith('🚀') ? 'text-green-600 font-semibold' : ''
                        }`}>
                          {info}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {showDebug && debugInfo.length > 0 && (
                <Card className="border-indigo-200 bg-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-indigo-800">
                      <Info className="h-5 w-5" />
                      <span>系统测试结果</span>
                    </CardTitle>
                    <CardDescription className="text-indigo-700">
                      混合导入系统各组件的测试结果
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1 font-mono">
                      {debugInfo.map((info, index) => (
                        <div key={index} className={`border-b border-indigo-100 py-1 last:border-0 ${
                          info.startsWith('✅') || info.startsWith('🚀') ? 'text-green-600 font-semibold' : 
                          info.startsWith('❌') ? 'text-red-600 font-semibold' :
                          info.startsWith('🔑') || info.startsWith('🕐') || info.startsWith('📊') ? 'text-indigo-600' : ''
                        }`}>
                          {info}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 预览区域 */}
            <div className="space-y-6">
              {novelInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {novelInfo.isExisting ? (
                        <>
                          <RefreshCw className="h-5 w-5 text-blue-600" />
                          <span>混合续导</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-5 w-5 text-purple-600" />
                          <span>混合导入</span>
                        </>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {novelInfo.isExisting 
                        ? '每日CronJob + 外部API加速续导'
                        : '每日CronJob + 外部API加速导入'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-4">
                      <img
                        src={novelInfo.cover || "/placeholder.svg"}
                        alt={novelInfo.title}
                        className="w-20 h-28 object-cover rounded"
                      />
                      <div className="flex-1 space-y-2">
                        <div>
                          <Label>小说标题</Label>
                          <Input value={novelInfo.title} readOnly className="mt-1" />
                        </div>
                        <div>
                          <Label>作者</Label>
                          <Input value={novelInfo.author} readOnly className="mt-1" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>分类</Label>
                      <Input value={novelInfo.category} readOnly className="mt-1" />
                    </div>

                    <div>
                      <Label>简介</Label>
                      <Textarea 
                        value={novelInfo.description} 
                        readOnly 
                        className="mt-1 h-24" 
                      />
                    </div>

                    {/* 混合续导信息显示 */}
                    {novelInfo.isExisting && novelInfo.resumeInfo && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
                        <div>
                          <Label>总章节数</Label>
                          <div className="text-lg font-semibold text-blue-600">
                            {novelInfo.resumeInfo.totalChapters}
                          </div>
                        </div>
                        <div>
                          <Label>已导入章节</Label>
                          <div className="text-lg font-semibold text-green-600">
                            {novelInfo.resumeInfo.importedChapters}
                          </div>
                        </div>
                        <div>
                          <Label>失败重试</Label>
                          <div className="text-lg font-semibold text-red-600">
                            {novelInfo.resumeInfo.pendingChapters.length}
                          </div>
                        </div>
                        <div>
                          <Label>新增章节</Label>
                          <div className="text-lg font-semibold text-orange-600">
                            {novelInfo.resumeInfo.newChapters.length}
                          </div>
                        </div>
                        <div>
                          <Label>每日CronJob</Label>
                          <div className="text-lg font-semibold text-blue-600">
                            {Math.ceil((novelInfo.resumeInfo.pendingChapters.length + novelInfo.resumeInfo.newChapters.length) / 15)} 天
                          </div>
                        </div>
                        <div>
                          <Label>外部API加速</Label>
                          <div className="text-lg font-semibold text-green-600">
                            可快速完成
                          </div>
                        </div>
                      </div>
                    )}

                    {!novelInfo.isExisting && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
                        <div>
                          <Label>章节数</Label>
                          <div className="text-lg font-semibold text-blue-600">
                            {novelInfo.chapters?.length || 0}
                          </div>
                        </div>
                        <div>
                          <Label>状态</Label>
                          <div className="text-lg font-semibold text-green-600">
                            {novelInfo.status}
                          </div>
                        </div>
                        <div>
                          <Label>每日CronJob</Label>
                          <div className="text-lg font-semibold text-blue-600">
                            {Math.ceil((novelInfo.chapters?.length || 0) / 15)} 天
                          </div>
                        </div>
                        <div>
                          <Label>外部API加速</Label>
                          <div className="text-lg font-semibold text-green-600">
                            可快速完成
                          </div>
                        </div>
                      </div>
                    )}

                    {importStatus === 'success' ? (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>混合导入任务已创建，支持多种处理方式</span>
                          <div className="flex space-x-2">
                            <Link href={`/admin/import-status`}>
                              <Button size="sm" variant="outline">查看状态</Button>
                            </Link>
                            {novelInfo.id && (
                              <Link href={`/novel/${novelInfo.id}`}>
                                <Button size="sm">查看小说</Button>
                              </Link>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Button 
                        onClick={handleImport}
                        disabled={isImporting || (novelInfo.isExisting && novelInfo.resumeInfo && 
                          (novelInfo.resumeInfo.pendingChapters.length + novelInfo.resumeInfo.newChapters.length) === 0)}
                        className="w-full"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            创建混合任务中...
                          </>
                        ) : novelInfo.isExisting && novelInfo.resumeInfo && 
                          (novelInfo.resumeInfo.pendingChapters.length + novelInfo.resumeInfo.newChapters.length) === 0 ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            所有章节已导入
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            创建混合{novelInfo.isExisting ? '续导' : '导入'}任务
                            {novelInfo.isExisting && novelInfo.resumeInfo && 
                              ` (${novelInfo.resumeInfo.pendingChapters.length + novelInfo.resumeInfo.newChapters.length}章)`
                            }
                          </>
                        )}
                      </Button>
                    )}

                    {taskId && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm text-purple-800">
                          <div className="font-semibold mb-1">混合导入任务已创建</div>
                          <div className="font-mono text-xs">任务ID: {taskId}</div>
                          <div className="mt-2 text-xs space-y-1">
                            <div>⏰ 每日CronJob自动处理</div>
                            <div>🚀 外部API: {currentDomain}/api/process-import-queue</div>
                          </div>
                          <div className="mt-2">
                            <Link href="/admin/import-status">
                              <Button size="sm" variant="outline">
                                <Activity className="h-4 w-4 mr-2" />
                                查看混合任务状态
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {!novelInfo && (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">等待解析</h3>
                    <p className="text-gray-500">
                      请输入小说网页链接，混合导入系统将自动处理
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 混合导入优势 */}
              <Card>
                <CardHeader>
                  <CardTitle>混合导入优势</CardTitle>
                  <CardDescription>
                    结合每日CronJob和外部API的最佳方案
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <Timer className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-semibold">每日自动处理</div>
                        <div className="text-gray-600">CronJob每天自动处理，无需人工干预</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Zap className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold">外部加速</div>
                        <div className="text-gray-600">使用外部程序可大幅加速处理速度</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <ExternalLink className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div>
                        <div className="font-semibold">无需鉴权</div>
                        <div className="text-gray-600">外部API无需鉴权，可直接调用</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Activity className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div>
                        <div className="font-semibold">灵活控制</div>
                        <div className="text-gray-600">支持参数控制和多任务并行处理</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
