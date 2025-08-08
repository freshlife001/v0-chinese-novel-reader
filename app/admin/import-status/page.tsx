"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Loader2, CheckCircle, XCircle, Clock, Trash2, RefreshCw, Eye, AlertCircle } from 'lucide-react'
import Link from "next/link"
import { useEffect, useState } from "react"

interface ImportTask {
  taskId: string
  novelId?: string
  novelTitle?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  importedCount: number
  failedCount: number
  skippedCount: number
  totalChapters: number
  currentBatch?: number
  totalBatches?: number
  logs: string[]
  results?: any[]
  createdAt: string
  updatedAt: string
  completedAt?: string
  error?: string
}

export default function ImportStatusPage() {
  const [tasks, setTasks] = useState<ImportTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<ImportTask | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [error, setError] = useState("")

  const fetchTasks = async () => {
    try {
      console.log('📋 开始获取导入任务列表...')
      const response = await fetch('/api/import-tasks')
      console.log('📋 获取任务响应状态:', response.status)
      
      const data = await response.json()
      console.log('📋 获取任务响应数据:', data)
      
      // 确保 tasks 始终是数组
      const taskList = Array.isArray(data.tasks) ? data.tasks : []
      console.log('📋 任务列表长度:', taskList.length)
      
      setTasks(taskList)
      setError("")
    } catch (error) {
      console.error('❌ 获取导入任务失败:', error)
      setError(`获取任务失败: ${error.message}`)
      setTasks([]) // 确保在错误时也设置为空数组
    } finally {
      setLoading(false)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      console.log('🗑️ 删除任务:', taskId)
      const response = await fetch('/api/import-tasks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId })
      })

      if (response.ok) {
        console.log('✅ 任务删除成功')
        // 确保 tasks 是数组再进行过滤
        setTasks(prevTasks => Array.isArray(prevTasks) ? prevTasks.filter(task => task.taskId !== taskId) : [])
        if (selectedTask?.taskId === taskId) {
          setSelectedTask(null)
        }
      } else {
        console.error('❌ 删除任务失败:', response.status)
      }
    } catch (error) {
      console.error('❌ 删除任务异常:', error)
    }
  }

  useEffect(() => {
    console.log('🔄 组件初始化，开始获取任务...')
    fetchTasks()
  }, [])

  // 自动刷新正在进行的任务
  useEffect(() => {
    if (!autoRefresh) {
      console.log('⏸️ 自动刷新已暂停')
      return
    }

    console.log('🔄 设置自动刷新定时器 (30秒间隔)...')
    const interval = setInterval(() => {
      // 确保 tasks 是数组再检查
      if (!Array.isArray(tasks)) {
        console.log('⚠️ tasks 不是数组，跳过检查')
        return
      }

      const hasActiveTasks = tasks.some(task => 
        task && (task.status === 'pending' || task.status === 'processing')
      )
      
      console.log('🔍 检查活跃任务:', hasActiveTasks, '任务数量:', tasks.length)
      
      if (hasActiveTasks) {
        console.log('🔄 发现活跃任务，刷新状态...')
        fetchTasks()
      }
    }, 30000) // 每30秒刷新一次

    return () => {
      console.log('🛑 清理自动刷新定时器')
      clearInterval(interval)
    }
  }, [tasks, autoRefresh])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '等待中'
      case 'processing':
        return '进行中'
      case 'completed':
        return '已完成'
      case 'failed':
        return '失败'
      default:
        return '未知'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在加载导入任务...</p>
        </div>
      </div>
    )
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
              <span className="text-lg text-gray-600">导入状态</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? '自动刷新' : '手动刷新'}
              </Button>
              <Button variant="outline" onClick={fetchTasks}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Link href="/admin/import">
                <Button>新建导入</Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline">返回管理</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">导入状态监控</h1>
          <p className="text-gray-600">查看所有导入任务的实时状态和详细日志</p>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 任务列表 */}
          <div className="lg:col-span-2 space-y-4">
            {Array.isArray(tasks) && tasks.length > 0 ? (
              tasks.map((task) => {
                // 确保 task 对象存在且有必要的属性
                if (!task || !task.taskId) {
                  console.warn('⚠️ 发现无效任务对象:', task)
                  return null
                }

                return (
                  <Card 
                    key={task.taskId} 
                    className={`cursor-pointer transition-all ${
                      selectedTask?.taskId === task.taskId ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(task.status || 'unknown')}
                          <div>
                            <CardTitle className="text-lg">
                              {task.novelTitle || `任务 ${task.taskId.slice(0, 8)}`}
                            </CardTitle>
                            <CardDescription>
                              创建时间: {task.createdAt ? new Date(task.createdAt).toLocaleString() : '未知'}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(task.status || 'unknown')}>
                            {getStatusText(task.status || 'unknown')}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteTask(task.taskId)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* 进度条 */}
                        {task.status === 'processing' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>导入进度</span>
                              <span>{task.progress || 0}%</span>
                            </div>
                            <Progress value={task.progress || 0} className="w-full" />
                            {task.currentBatch && task.totalBatches && (
                              <div className="text-xs text-gray-600 text-center">
                                第 {task.currentBatch} / {task.totalBatches} 批次
                              </div>
                            )}
                          </div>
                        )}

                        {/* 统计信息 */}
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-blue-600">{task.totalChapters || 0}</div>
                            <div className="text-xs text-gray-600">总章节</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">{task.importedCount || 0}</div>
                            <div className="text-xs text-gray-600">已导入</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-yellow-600">{task.skippedCount || 0}</div>
                            <div className="text-xs text-gray-600">跳过</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-red-600">{task.failedCount || 0}</div>
                            <div className="text-xs text-gray-600">失败</div>
                          </div>
                        </div>

                        {/* 最新日志 */}
                        {Array.isArray(task.logs) && task.logs.length > 0 && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <div className="font-mono">
                              {task.logs[task.logs.length - 1]}
                            </div>
                          </div>
                        )}

                        {/* 错误信息 */}
                        {task.error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{task.error}</AlertDescription>
                          </Alert>
                        )}

                        {/* 完成时间 */}
                        {task.completedAt && (
                          <div className="text-sm text-gray-600">
                            完成时间: {new Date(task.completedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              }).filter(Boolean) // 过滤掉 null 值
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无导入任务</h3>
                  <p className="text-gray-500 mb-4">
                    {error ? '获取任务列表失败' : '还没有任何导入任务'}
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Button onClick={fetchTasks} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      重试
                    </Button>
                    <Link href="/admin/import">
                      <Button>开始导入</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 详细信息面板 */}
          <div className="space-y-6">
            {selectedTask ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="h-5 w-5" />
                      <span>任务详情</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">任务ID:</span>
                        <div className="font-mono text-xs">{selectedTask.taskId}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">状态:</span>
                        <div className="flex items-center space-x-1 mt-1">
                          {getStatusIcon(selectedTask.status || 'unknown')}
                          <span>{getStatusText(selectedTask.status || 'unknown')}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">创建时间:</span>
                        <div>{selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleString() : '未知'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">更新时间:</span>
                        <div>{selectedTask.updatedAt ? new Date(selectedTask.updatedAt).toLocaleString() : '未知'}</div>
                      </div>
                    </div>

                    {selectedTask.novelId && (
                      <div className="pt-4 border-t">
                        <Link href={`/novel/${selectedTask.novelId}`}>
                          <Button variant="outline" className="w-full">
                            <BookOpen className="h-4 w-4 mr-2" />
                            查看小说
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>实时日志</CardTitle>
                    <CardDescription>
                      导入过程的详细日志记录
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] rounded-md border p-4">
                      <div className="text-sm space-y-1 font-mono">
                        {Array.isArray(selectedTask.logs) && selectedTask.logs.length > 0 ? (
                          selectedTask.logs.map((log, index) => (
                            <div key={index} className={`py-1 ${
                              log.includes('😴') || log.includes('⏱️') ? 'text-orange-600' :
                              log.includes('✅') || log.includes('🎉') ? 'text-green-600' :
                              log.includes('❌') || log.includes('💀') ? 'text-red-600' :
                              log.includes('🔄') ? 'text-blue-600' : ''
                            }`}>
                              {log}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 text-center py-8">
                            暂无日志记录
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">选择任务</h3>
                  <p className="text-gray-500">点击左侧任务查看详细信息</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
