import { NextRequest, NextResponse } from 'next/server'
import { AUTH_CONFIG, getServiceUrlServer, getEnvironmentInfo } from '@/app/lib/auth'

// CAS XML解析函数 - Node.js环境专用，模拟Java的命名空间感知解析
function parseCasXmlResponse(xmlText: string): { success: boolean; user?: string; attributes?: any; error?: string } {
  try {
    console.log(`[CAS解析] ==================== 开始解析 ====================`)
    console.log(`[CAS解析] 原始XML响应长度: ${xmlText.length}`)
    console.log(`[CAS解析] 完整XML响应:`)
    console.log(xmlText)
    console.log(`[CAS解析] ==================== XML结束 ====================`)
    
    // 检查认证是否成功 - 支持带命名空间和不带命名空间的格式
    const successPattern = /<(?:cas:)?authenticationSuccess[^>]*>/i
    const hasSuccess = successPattern.test(xmlText)
    
    if (hasSuccess) {
      console.log('[CAS解析] ✅ 发现认证成功节点')
      
      // 提取用户名 - 支持 <cas:user> 和 <user> 格式
      let username = 'unknown'
      const userPatterns = [
        /<cas:user[^>]*>(.*?)<\/cas:user>/i,     // 带命名空间：<cas:user>
        /<user[^>]*>(.*?)<\/user>/i              // 不带命名空间：<user>
      ]
      
      for (const pattern of userPatterns) {
        const match = xmlText.match(pattern)
        if (match && match[1]) {
          username = match[1].trim()
          console.log(`[CAS解析] 📝 用户名: ${username}`)
          break
        }
      }
      
      if (username === 'unknown') {
        console.warn('[CAS解析] ⚠️ 未找到用户名')
      }
      
      // 提取用户属性 - 支持 <cas:attributes> 和 <attributes> 格式
      const attributes: any = {}
      
      // 查找attributes块
      const attributesPatterns = [
        /<cas:attributes[^>]*>([\s\S]*?)<\/cas:attributes>/i,  // 带命名空间
        /<attributes[^>]*>([\s\S]*?)<\/attributes>/i           // 不带命名空间
      ]
      
      let attributesBlock = ''
      for (const pattern of attributesPatterns) {
        const match = xmlText.match(pattern)
        if (match && match[1]) {
          attributesBlock = match[1]
          console.log('[CAS解析] 📋 找到attributes节点')
          break
        }
      }
      
      if (attributesBlock) {
        console.log('[CAS解析] 📋 属性块内容:')
        console.log(attributesBlock)
        
        // 提取属性 - 模拟Java的getLocalName()行为
        // 匹配任何XML元素：<prefix:name>value</prefix:name> 或 <name>value</name>
        const attributePattern = /<(?:cas:)?([^>\s]+)[^>]*>([\s\S]*?)<\/(?:cas:)?[^>]+>/g
        let match
        
        while ((match = attributePattern.exec(attributesBlock)) !== null) {
          let fieldName = match[1].trim()
          let value = match[2].trim()
          
          // 跳过空值和嵌套标签
          if (!value || value.includes('<')) continue
          
          // 模拟Java的getLocalName() - 去掉命名空间前缀
          if (fieldName.includes(':')) {
            fieldName = fieldName.split(':').pop() || fieldName
          }
          
          // URL解码（类似Java代码）
          try {
            value = decodeURIComponent(value)
          } catch (e) {
            // 如果解码失败，使用原值
            console.log(`[CAS解析] ⚠️ URL解码失败: ${fieldName}=${value}`)
          }
          
          attributes[fieldName] = value
          console.log(`[CAS解析] 📋 提取属性 ${fieldName}: ${value}`)
        }
      } else {
        console.log('[CAS解析] ⚠️ 未找到attributes节点')
      }
      
      console.log(`[CAS解析] ✅ 解析成功 - 用户: ${username}`)
      console.log(`[CAS解析] 📋 最终属性:`, attributes)
      
      return {
        success: true,
        user: username,
        attributes
      }
      
    } else {
      // 检查认证失败 - 支持带命名空间和不带命名空间的格式
      const failurePatterns = [
        /<cas:authenticationFailure[^>]*>([\s\S]*?)<\/cas:authenticationFailure>/i,
        /<authenticationFailure[^>]*>([\s\S]*?)<\/authenticationFailure>/i
      ]
      
      for (const pattern of failurePatterns) {
        const match = xmlText.match(pattern)
        if (match) {
          const errorMsg = match[1].trim() || '认证失败'
          console.log(`[CAS解析] ❌ 认证失败: ${errorMsg}`)
          return { success: false, error: errorMsg }
        }
      }
      
      console.log('[CAS解析] ❓ 未找到认证结果节点')
      
      // 调试：查看XML结构
      const rootMatch = xmlText.match(/<([^>\s]+)/)
      if (rootMatch) {
        console.log(`[CAS解析] 📄 根元素: ${rootMatch[1]}`)
      }
      
      // 列出所有主要元素
      const elementMatches = xmlText.match(/<[^>/\s]+/g)
      if (elementMatches) {
        console.log(`[CAS解析] 📋 发现的元素:`, elementMatches.slice(0, 10))
      }
      
      return { success: false, error: '未找到认证结果节点' }
    }
    
  } catch (error) {
    console.error('[CAS解析] 💥 解析异常:', error)
    return { success: false, error: '解析异常: ' + String(error) }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ticket } = await request.json()
    
    if (!ticket) {
      console.log('[CAS验证] ❌ 缺少ticket参数')
      return NextResponse.json({ success: false, error: '缺少ticket参数' })
    }

    // 动态获取当前服务URL和环境信息
    const serviceUrl = getServiceUrlServer(request)
    const envInfo = getEnvironmentInfo(request.nextUrl.host)

    console.log(`[CAS验证] 🔧 环境: ${envInfo.environment}`)
    console.log(`[CAS验证] 🌐 服务地址: ${serviceUrl}`)
    console.log(`[CAS验证] 🎫 Ticket: ${ticket}`)

    // ⚠️ 关键修复：验证时的service必须与重定向时一致！
    // 重定向时用的是 serviceUrl + '/auth/callback'
    // 验证时也必须用相同的地址
    const callbackUrl = serviceUrl + '/auth/callback'

    // 调用CAS服务器验证ticket
    const validateUrl = `${AUTH_CONFIG.CAS_SERVER}/serviceValidate?service=${encodeURIComponent(callbackUrl)}&ticket=${ticket}`
    
    console.log(`[CAS验证] 📡 完整验证URL: ${validateUrl}`)
    console.log(`[CAS验证] 📋 详细参数:`)
    console.log(`   - CAS服务器: ${AUTH_CONFIG.CAS_SERVER}`)
    console.log(`   - Service参数: ${callbackUrl}`)
    console.log(`   - Service编码后: ${encodeURIComponent(callbackUrl)}`)
    console.log(`   - Ticket参数: ${ticket}`)
    console.log(`[CAS验证] ✅ 确保与重定向时service参数一致`)
    
    const response = await fetch(validateUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'CAS-Client'
      }
    })
    
    console.log(`[CAS验证] 📡 HTTP状态: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      console.error(`[CAS验证] HTTP错误: ${response.status} ${response.statusText}`)
      return NextResponse.json({ 
        success: false, 
        error: `HTTP错误: ${response.status}` 
      })
    }
    
    const xmlText = await response.text()
    console.log('wocaonima')
    console.log(xmlText)
    
    // 使用正则表达式模拟Java的命名空间感知XML解析
    const parseResult = parseCasXmlResponse(xmlText)
    
    if (parseResult.success) {
      return NextResponse.json({ 
        success: true, 
        user: parseResult.user,
        attributes: parseResult.attributes
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: parseResult.error 
      })
    }
    
  } catch (error) {
    console.error('[CAS验证] 💥 验证错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '服务器内部错误: ' + String(error)
    })
  }
} 