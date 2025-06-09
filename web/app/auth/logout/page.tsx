'use client'

import { useEffect } from 'react'
import { AUTH_CONFIG, getServiceUrlClient, getEnvironmentInfo } from '@/app/lib/auth'

export default function LogoutPage() {
  useEffect(() => {
    // 清除认证cookie
    document.cookie = 'cas_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    
    // 动态获取当前服务URL和环境信息
    const serviceUrl = getServiceUrlClient()
    const envInfo = getEnvironmentInfo()
    
    console.log(`[登出] 环境: ${envInfo.environment}`)
    console.log(`[登出] 回调地址: ${serviceUrl}`)
    
    // 跳转到CAS登出
    const casLogoutUrl = `${AUTH_CONFIG.CAS_SERVER}/logout?service=${encodeURIComponent(serviceUrl)}`
    
    setTimeout(() => {
      window.location.href = casLogoutUrl
    }, 1000)
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-gray-900">正在登出...</p>
        <p className="text-sm text-gray-500 mt-2">
          正在清理您的登录状态
        </p>
      </div>
    </div>
  )
} 