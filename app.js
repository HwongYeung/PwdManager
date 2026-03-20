// app.js
const StorageManager = require('./utils/storage.js')

App({
  onLaunch() {
    // 检查PIN码设置状态
    this.checkPinStatus()
  },

  onShow() {
    // 应用从后台切换到前台时，重新验证PIN码
    if (this.globalData.isAuthenticated) {
      this.checkAutoLock()
    }
  },

  onHide() {
    // 应用切换到后台时，记录时间
    this.globalData.backgroundTime = Date.now()
  },

  /**
   * 检查PIN码设置状态
   */
  checkPinStatus() {
    const hasPinCode = StorageManager.hasPinCode()
    
    if (!hasPinCode) {
      // 未设置PIN码，跳转到设置页面
      wx.redirectTo({
        url: '/pages/pin-setup/pin-setup'
      })
    } else {
      // 已设置PIN码，跳转到验证页面
      wx.redirectTo({
        url: '/pages/pin-verify/pin-verify'
      })
    }
  },

  /**
   * 检查自动锁定
   */
  checkAutoLock() {
    const settings = StorageManager.getSettings()
    const autoLockSeconds = settings.auto_lock

    // auto_lock 为 0 表示永不自动锁定
    if (autoLockSeconds === 0) return

    const autoLockTime = autoLockSeconds * 1000 // 转换为毫秒
    const backgroundTime = this.globalData.backgroundTime

    if (backgroundTime && Date.now() - backgroundTime > autoLockTime) {
      // 超过自动锁定时间，需要重新验证PIN码
      this.globalData.isAuthenticated = false
      wx.redirectTo({
        url: '/pages/pin-verify/pin-verify'
      })
    }
  },

  /**
   * 设置认证状态
   */
  setAuthenticated(status) {
    this.globalData.isAuthenticated = status
    if (status) {
      this.globalData.backgroundTime = null
    }
  },

  globalData: {
    isAuthenticated: false,
    backgroundTime: null,
    currentPin: null // 临时存储当前会话的PIN码
  }
})
