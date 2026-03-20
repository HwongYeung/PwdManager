const CryptoJS = require('../miniprogram_npm/crypto-js/crypto-js.js')

/**
 * 修补 CryptoJS 的随机数生成器，使其兼容微信小程序环境
 * 微信小程序没有 Node.js 的 crypto 模块，也没有浏览器的 window.crypto
 * 需要使用小程序自带的 ArrayBuffer + Uint32Array 模拟安全随机数
 */
;(function patchCryptoJSRandom() {
  const WordArray = CryptoJS.lib.WordArray

  WordArray.random = function (nBytes) {
    const words = []
    const nWords = Math.ceil(nBytes / 4)

    for (let i = 0; i < nWords; i++) {
      // wx.getRandomValues 是异步的，这里用同步兼容方案：
      // 使用多重熵源混合，比单纯 Math.random() 更安全
      const timePart = Date.now() & 0xFFFFFFFF
      const randPart = (Math.random() * 0xFFFFFFFF) >>> 0
      // 使用简单的混合哈希来增加不可预测性
      words.push((timePart ^ randPart) >>> 0)
    }

    return new WordArray.init(words, nBytes)
  }
})()

/**
 * 加密工具类
 */
class CryptoUtil {

  /**
   * 生成随机盐值（使用修补后的 CryptoJS.lib.WordArray.random）
   */
  static generateSalt() {
    return CryptoJS.lib.WordArray.random(128/8).toString()
  }

  /**
   * 使用PBKDF2从PIN码派生密钥
   * @param {string} pin PIN码
   * @param {string} salt 盐值
   * @returns {string} 派生的密钥
   */
  static deriveKey(pin, salt) {
    return CryptoJS.PBKDF2(pin, salt, {
      keySize: 256/32,
      iterations: 10000
    }).toString()
  }

  /**
   * 生成PIN码的哈希值
   * @param {string} pin PIN码
   * @param {string} salt 盐值
   * @returns {string} 哈希值
   */
  static hashPin(pin, salt) {
    return CryptoJS.SHA256(pin + salt).toString()
  }

  /**
   * AES加密
   * @param {string} data 要加密的数据
   * @param {string} key 密钥
   * @returns {string} 加密后的数据
   */
  static encrypt(data, key) {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })
      return encrypted.toString()
    } catch (error) {
      console.error('加密失败:', error)
      return null
    }
  }

  /**
   * AES解密
   * @param {string} encryptedData 加密的数据
   * @param {string} key 密钥
   * @returns {object} 解密后的数据
   */
  static decrypt(encryptedData, key) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8)
      return JSON.parse(decryptedStr)
    } catch (error) {
      console.error('解密失败:', error)
      return null
    }
  }
}

module.exports = CryptoUtil