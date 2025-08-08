import { NextRequest, NextResponse } from 'next/server'
import client from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始调试导入系统...')
    
    // 检查环境变量
    const hasToken = !!process.env.TURSO_AUTH_TOKEN
    console.log('🔑 TURSO_AUTH_TOKEN 存在:', hasToken)
    
    if (!hasToken) {
      return NextResponse.json({
        error: 'TURSO_AUTH_TOKEN 未配置',
        debug: {
          hasToken: false,
          env: process.env.NODE_ENV
        }
      })
    }

    // 测试数据库连接
    console.log('✅ 测试数据库连接...')
    const result = await client.execute({
      sql: 'SELECT name FROM sqlite_master WHERE type="table";',
      args: []
    })
    
    console.log('📁 数据库表数量:', result.rows.length)
    console.log('📋 数据库表列表:', result.rows)

    return NextResponse.json({
      success: true,
      debug: {
        hasToken: true,
        tableCount: result.rows.length,
        tables: result.rows,
        databaseConnected: true,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ 调试导入系统失败:', error)
    return NextResponse.json({
      error: error.message,
      debug: {
        hasToken: !!process.env.TURSO_AUTH_TOKEN,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}