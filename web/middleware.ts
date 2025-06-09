import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_CONFIG, getServiceUrlServer, getEnvironmentInfo } from '@/app/lib/auth'

// 不需要认证的路径
const PUBLIC_PATHS = [
  '/auth',
  '/api',
  '/_next',
  '/favicon.ico',
  '/icons',
  '/live2d'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 检查是否为公开路径
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // 检查是否已认证（简单检查cookie）
  const casUser = request.cookies.get('cas_user')
  
  if (!casUser) {
    // 动态获取当前服务URL
    const serviceUrl = getServiceUrlServer(request)
    const envInfo = getEnvironmentInfo(request.nextUrl.host)
    
    console.log(`[CAS中间件] ==================== 开始重定向 ====================`)
    console.log(`[CAS中间件] 环境: ${envInfo.environment}`)
    console.log(`[CAS中间件] 服务地址: ${serviceUrl}`)
    console.log(`[CAS中间件] 请求路径: ${pathname}`)
    console.log(`[CAS中间件] 请求方法: ${request.method}`)
    console.log(`[CAS中间件] 请求Host: ${request.nextUrl.host}`)
    console.log(`[CAS中间件] 请求协议: ${request.nextUrl.protocol}`)
    
    // 构建CAS登录URL
    const callbackUrl = serviceUrl + '/auth/callback'
    const casLoginUrl = `${AUTH_CONFIG.CAS_SERVER}/login?service=${encodeURIComponent(callbackUrl)}`
    
    console.log(`[CAS中间件] 📋 详细参数:`)
    console.log(`   - CAS服务器: ${AUTH_CONFIG.CAS_SERVER}`)
    console.log(`   - 基础服务地址: ${serviceUrl}`)
    console.log(`   - 回调地址: ${callbackUrl}`)
    console.log(`   - 回调地址编码: ${encodeURIComponent(callbackUrl)}`)
    console.log(`   - 完整CAS登录URL: ${casLoginUrl}`)
    console.log(`[CAS中间件] ==================== 重定向结束 ====================`)
    console.log(`[CAS中间件] 🔄 重定向到CAS: ${casLoginUrl}`)
    
    // 使用浏览器重定向（不是fetch）
    // 添加状态码确保是永久重定向
    return NextResponse.redirect(new URL(casLoginUrl), {
      status: 302,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // 确保只匹配页面请求，不匹配API和静态资源
    '/((?!api|_next/static|_next/image|favicon.ico|icons|live2d).*)',
  ],
} 