// 认证配置 - 支持环境变量
export const AUTH_CONFIG = {
  CAS_SERVER: process.env.NEXT_PUBLIC_CAS_SERVER || 'https://rz.zjcst.edu.cn/sso',
  PRODUCTION_URL: process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://chat.zjcst.cn',
  // 本地开发端口配置
  LOCAL_PORTS: [':3000', ':8080', ':8000', ':5173', ':4200']
}

// 环境检测函数
export function isLocalDevelopment(host?: string): boolean {
  if (typeof window !== 'undefined') {
    host = window.location.host
  }
  
  if (!host) return false
  
  return (
    host.includes('localhost') || 
    host.includes('127.0.0.1') || 
    host.includes('192.168.') ||
    host.includes('10.0.') ||
    host.includes('172.16.') ||
    AUTH_CONFIG.LOCAL_PORTS.some(port => host.includes(port)) ||
    // 自定义开发域名检测
    host.endsWith('.local') ||
    host.endsWith('.dev')
  )
}

// 动态获取服务URL - 服务端版本
export function getServiceUrlServer(request: any): string {
  const protocol = request.nextUrl.protocol
  const host = request.nextUrl.host
  
  if (isLocalDevelopment(host)) {
    // 本地开发使用真实的运行地址
    const localUrl = `${protocol}//${host}`
    console.log(`[服务地址] 🔧 本地开发环境: ${localUrl}`)
    return localUrl
  }
  
  console.log(`[服务地址] 🌐 生产环境: ${AUTH_CONFIG.PRODUCTION_URL}`)
  return AUTH_CONFIG.PRODUCTION_URL
}

// 动态获取服务URL - 客户端版本
export function getServiceUrlClient(): string {
  if (typeof window === 'undefined') {
    return AUTH_CONFIG.PRODUCTION_URL
  }
  
  const { protocol, host } = window.location
  
  if (isLocalDevelopment(host)) {
    // 本地开发使用真实的运行地址
    const localUrl = `${protocol}//${host}`
    console.log(`[服务地址] 🔧 本地开发环境: ${localUrl}`)
    return localUrl
  }
  
  console.log(`[服务地址] 🌐 生产环境: ${AUTH_CONFIG.PRODUCTION_URL}`)
  return AUTH_CONFIG.PRODUCTION_URL
}

// 获取当前环境信息
export function getEnvironmentInfo(host?: string): {
  isDev: boolean
  environment: string
  serviceUrl: string
  host?: string
  protocol?: string
} {
  const isDev = isLocalDevelopment(host)
  
  let currentHost = host
  let currentProtocol = 'https:'
  
  if (typeof window !== 'undefined') {
    currentHost = window.location.host
    currentProtocol = window.location.protocol
  }
  
  return {
    isDev,
    environment: isDev ? '🟢 本地开发' : '🔴 线上生产',
    serviceUrl: isDev ? 
      `${currentProtocol}//${currentHost}` :  // 使用真实地址
      AUTH_CONFIG.PRODUCTION_URL,
    host: currentHost,
    protocol: currentProtocol
  }
}

// 调试信息输出
export function logEnvironmentInfo(): void {
  if (typeof window !== 'undefined') {
    const envInfo = getEnvironmentInfo()
    console.log('🔧 [认证环境配置]')
    console.log(`   环境: ${envInfo.environment}`)
    console.log(`   主机: ${envInfo.host}`)
    console.log(`   协议: ${envInfo.protocol}`)
    console.log(`   服务URL: ${envInfo.serviceUrl}`)
    console.log(`   CAS服务器: ${AUTH_CONFIG.CAS_SERVER}`)
    
    if (envInfo.isDev) {
      console.log(`   ⚠️  本地开发地址: ${envInfo.serviceUrl}`)
      console.log(`   📝  需要在CAS服务器注册此地址`)
    }
  }
} 