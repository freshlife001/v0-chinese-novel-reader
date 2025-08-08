import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN
    const tokenLength = process.env.BLOB_READ_WRITE_TOKEN?.length || 0
    
    return NextResponse.json({
      success: hasToken,
      message: hasToken 
        ? `环境变量配置正确 (Token 长度: ${tokenLength})` 
        : '环境变量 BLOB_READ_WRITE_TOKEN 未配置',
      details: {
        hasToken,
        tokenLength: hasToken ? tokenLength : 0,
        environment: process.env.NODE_ENV || 'unknown'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `检查环境变量失败: ${error.message}`,
      details: null
    }, { status: 500 })
  }
}
