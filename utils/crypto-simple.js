/**
 * 简化版加密工具类 - 适用于微信小程序
 * 使用微信小程序原生API和简单的加密算法
 */
class SimpleCrypto {
  
  /**
   * 生成随机盐值
   */
  static generateSalt() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let salt = ''
    for (let i = 0; i < 16; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return salt
  }

  /**
   * 简单哈希函数 (使用字符串操作模拟)
   * 注意：这不是真正的SHA-256，仅用于演示
   */
  static simpleHash(str) {
    let hash = 0
    if (str.length === 0) return hash.toString()
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    
    // 转换为正数，确保结果一致性
    hash = Math.abs(hash)
    return hash.toString(36)
  }

  /**
   * 生成PIN码的哈希值
   */
  static hashPin(pin, salt) {
    return this.simpleHash(pin + salt)
  }

  /**
   * 微信小程序兼容的Base64编码
   */
  static base64Encode(str) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let result = ''
    let i = 0
    
    while (i < str.length) {
      const a = str.charCodeAt(i++)
      const b = i < str.length ? str.charCodeAt(i++) : 0
      const c = i < str.length ? str.charCodeAt(i++) : 0
      
      const bitmap = (a << 16) | (b << 8) | c
      
      result += chars.charAt((bitmap >> 18) & 63)
      result += chars.charAt((bitmap >> 12) & 63)
      result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '='
      result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '='
    }
    
    return result
  }

  /**
   * 微信小程序兼容的Base64解码
   */
  static base64Decode(str) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let result = ''
    let i = 0
    
    // 移除非Base64字符
    str = str.replace(/[^A-Za-z0-9+/=]/g, '')
    
    while (i < str.length) {
      const encoded1 = chars.indexOf(str.charAt(i++))
      const encoded2 = chars.indexOf(str.charAt(i++))
      const encoded3 = chars.indexOf(str.charAt(i++))
      const encoded4 = chars.indexOf(str.charAt(i++))
      
      if (encoded1 === -1 || encoded2 === -1) break
      
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | 
                    ((encoded3 === -1 ? 0 : encoded3) << 6) | 
                    (encoded4 === -1 ? 0 : encoded4)
      
      result += String.fromCharCode((bitmap >> 16) & 255)
      
      if (encoded3 !== -1 && str.charAt(i-2) !== '=') {
        result += String.fromCharCode((bitmap >> 8) & 255)
      }
      
      if (encoded4 !== -1 && str.charAt(i-1) !== '=') {
        result += String.fromCharCode(bitmap & 255)
      }
    }
    
    return result
  }

  /**
   * 简化的字符串加密 - 避免Base64编码问题
   */
  static simpleEncrypt(text, key) {
    let result = []
    for (let i = 0; i < text.length; i++) {
      const textChar = text.charCodeAt(i)
      const keyChar = key.charCodeAt(i % key.length)
      result.push(textChar ^ keyChar)
    }
    return result.join(',') // 使用逗号分隔的数字数组
  }

  /**
   * 简化的字符串解密
   */
  static simpleDecrypt(encryptedText, key) {
    try {
      const numbers = encryptedText.split(',').map(n => parseInt(n))
      let result = ''
      for (let i = 0; i < numbers.length; i++) {
        const keyChar = key.charCodeAt(i % key.length)
        result += String.fromCharCode(numbers[i] ^ keyChar)
      }
      return result
    } catch (error) {
      console.error('解密失败:', error)
      return null
    }
  }

  /**
   * 从PIN码派生密钥
   */
  static deriveKey(pin, salt) {
    // 简单的密钥派生：重复哈希PIN码和盐值
    let key = pin + salt
    for (let i = 0; i < 1000; i++) {
      key = this.simpleHash(key)
    }
    return key.substring(0, 32) // 取前32个字符作为密钥
  }

  /**
   * 加密数据
   */
  static encrypt(data, key) {
    try {
      const jsonStr = JSON.stringify(data)
      return this.simpleEncrypt(jsonStr, key)
    } catch (error) {
      console.error('加密失败:', error)
      return null
    }
  }

  /**
   * 解密数据
   */
  static decrypt(encryptedData, key) {
    try {
      const decryptedStr = this.simpleDecrypt(encryptedData, key)
      if (!decryptedStr) {
        console.error('解密结果为空')
        return null
      }
      
      return JSON.parse(decryptedStr)
    } catch (error) {
      console.error('解密失败:', error)
      console.error('尝试清除损坏的数据...')
      
      // 如果解密失败，可能是旧数据格式，返回空数据让用户重新开始
      return { passwords: [] }
    }
  }
}

module.exports = SimpleCrypto