'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('正在验证身份...')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    const ticket = searchParams.get('ticket')
    
    if (!ticket) {
      setStatus('认证失败：未获取到ticket')
      clearAuthCookies()
      startCountdown(5)
      return
    }

    console.log(`[回调页面] 🎫 收到ticket: ${ticket}`)
    
    // 验证ticket
    validateTicket(ticket)
  }, [searchParams])

  const clearAuthCookies = () => {
    console.log('[回调页面] 🧹 清理认证cookie')
    // 清除所有认证相关的cookie
    document.cookie = 'cas_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'cas_user_data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    // 可能还有其他认证相关的cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
  }

  const startCountdown = (seconds: number) => {
    setCountdown(seconds)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = '/'
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const validateTicket = async (ticket: string) => {
    try {
      setStatus('正在验证票据...')
      
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticket }),
      })

      const result = await response.json()
      
      console.log('[回调页面] 🔍 验证结果:', result)

      if (result.success) {
        setStatus('认证成功，正在跳转...')
        
        // 设置认证cookie - 包含用户信息
        const userData = {
          username: result.user,
          attributes: result.attributes || {},
          loginTime: new Date().toISOString()
        }
        
        // 设置用户cookie
        document.cookie = `cas_user=${result.user}; path=/; max-age=86400`
        
        // 如果有属性，也保存一份
        if (result.attributes) {
          document.cookie = `cas_user_data=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=86400`
          console.log('[回调页面] 💾 用户数据已保存:', userData)
        }
        
        console.log(`[回调页面] ✅ 认证成功 - 用户: ${result.user}`)
        
        // 跳转到首页
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } else {
        console.error('[回调页面] ❌ 认证失败:', result.error)
        console.log('[回调页面] 🎫 Ticket已失效，需要重新认证')
        setStatus(`认证失败：${result.error}`)
        
        // 清理cookie，因为ticket已经消费且验证失败
        clearAuthCookies()
        
        console.log('[回调页面] 🔍 请查看上面的详细日志信息')
        startCountdown(5) // 5秒后刷新
      }
    } catch (error) {
      console.error('[回调页面] 💥 网络错误:', error)
      console.log('[回调页面] 🎫 网络异常，清理认证状态')
      setStatus('认证失败：网络错误')
      
      // 网络错误也清理cookie
      clearAuthCookies()
      
      console.log('[回调页面] 🔍 请查看上面的详细日志信息')
      startCountdown(5) // 5秒后刷新
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-gray-900 mb-2">{status}</p>
        <p className="text-sm text-gray-500">
          正在与统一身份认证系统验证您的身份
        </p>
        {status.includes('失败') && countdown > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-700 mb-2">
              🔍 请打开浏览器开发者工具查看控制台日志
            </p>
            <p className="text-sm text-orange-600 mb-2">
              🎫 认证票据已失效，将重新进行认证流程
            </p>
            <p className="text-xs text-yellow-600">
              {countdown} 秒后自动重新跳转...
            </p>
          </div>
        )}
        {status.includes('失败') && (
          <div className="mt-2">
            <p className="text-xs text-gray-400">
              按 F12 打开开发者工具查看详细信息
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900">正在加载...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
} 