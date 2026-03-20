const CryptoUtil = require('./crypto.js')

/**
 * 存储管理类
 */
class StorageManager {
  
  static STORAGE_KEYS = {
    PIN_HASH: 'pin_hash',
    SALT: 'salt',
    ENCRYPTED_DATA: 'encrypted_data',
    SETTINGS: 'settings'
  }

  /**
   * 检查是否已设置PIN码
   */
  static hasPinCode() {
    const pinHash = wx.getStorageSync(this.STORAGE_KEYS.PIN_HASH)
    return !!pinHash
  }

  /**
   * 设置PIN码
   * @param {string} pin PIN码
   */
  static setPinCode(pin) {
    try {
      const salt = CryptoUtil.generateSalt()
      const pinHash = CryptoUtil.hashPin(pin, salt)
      
      wx.setStorageSync(this.STORAGE_KEYS.PIN_HASH, pinHash)
      wx.setStorageSync(this.STORAGE_KEYS.SALT, salt)
      
      // 初始化空的密码数据
      const initialData = { passwords: [] }
      const key = CryptoUtil.deriveKey(pin, salt)
      const encryptedData = CryptoUtil.encrypt(initialData, key)
      wx.setStorageSync(this.STORAGE_KEYS.ENCRYPTED_DATA, encryptedData)
      
      // 初始化设置
      const defaultSettings = {
        auto_lock: 300,
        theme: 'light'
      }
      wx.setStorageSync(this.STORAGE_KEYS.SETTINGS, defaultSettings)
      
      return true
    } catch (error) {
      console.error('设置PIN码失败:', error)
      return false
    }
  }

  /**
   * 验证PIN码
   * @param {string} pin PIN码
   */
  static verifyPin(pin) {
    try {
      const storedHash = wx.getStorageSync(this.STORAGE_KEYS.PIN_HASH)
      const salt = wx.getStorageSync(this.STORAGE_KEYS.SALT)
      
      if (!storedHash || !salt) {
        return false
      }
      
      const pinHash = CryptoUtil.hashPin(pin, salt)
      return pinHash === storedHash
    } catch (error) {
      console.error('验证PIN码失败:', error)
      return false
    }
  }

  /**
   * 获取解密后的密码数据
   * @param {string} pin PIN码
   */
  static getPasswordData(pin) {
    try {
      const salt = wx.getStorageSync(this.STORAGE_KEYS.SALT)
      const encryptedData = wx.getStorageSync(this.STORAGE_KEYS.ENCRYPTED_DATA)
      
      if (!salt || !encryptedData) {
        return { passwords: [] }
      }
      
      const key = CryptoUtil.deriveKey(pin, salt)
      const decryptedData = CryptoUtil.decrypt(encryptedData, key)
      
      return decryptedData || { passwords: [] }
    } catch (error) {
      console.error('获取密码数据失败:', error)
      return { passwords: [] }
    }
  }

  /**
   * 保存加密的密码数据
   * @param {object} data 密码数据
   * @param {string} pin PIN码
   */
  static savePasswordData(data, pin) {
    try {
      const salt = wx.getStorageSync(this.STORAGE_KEYS.SALT)
      const key = CryptoUtil.deriveKey(pin, salt)
      const encryptedData = CryptoUtil.encrypt(data, key)
      
      wx.setStorageSync(this.STORAGE_KEYS.ENCRYPTED_DATA, encryptedData)
      return true
    } catch (error) {
      console.error('保存密码数据失败:', error)
      return false
    }
  }

  /**
   * 获取应用设置
   */
  static getSettings() {
    try {
      const settings = wx.getStorageSync(this.STORAGE_KEYS.SETTINGS)
      return settings || {
        auto_lock: 300,
        theme: 'light'
      }
    } catch (error) {
      console.error('获取设置失败:', error)
      return {
        auto_lock: 300,
        theme: 'light'
      }
    }
  }

  /**
   * 保存应用设置
   * @param {object} settings 设置数据
   */
  static saveSettings(settings) {
    try {
      wx.setStorageSync(this.STORAGE_KEYS.SETTINGS, settings)
      return true
    } catch (error) {
      console.error('保存设置失败:', error)
      return false
    }
  }

  /**
   * 清除所有数据
   */
  static clearAll() {
    try {
      wx.removeStorageSync(this.STORAGE_KEYS.PIN_HASH)
      wx.removeStorageSync(this.STORAGE_KEYS.SALT)
      wx.removeStorageSync(this.STORAGE_KEYS.ENCRYPTED_DATA)
      wx.removeStorageSync(this.STORAGE_KEYS.SETTINGS)
      return true
    } catch (error) {
      console.error('清除数据失败:', error)
      return false
    }
  }
}

module.exports = StorageManager