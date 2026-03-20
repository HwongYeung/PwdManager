const StorageManager = require('../../utils/storage.js')

Page({
  data: {
    settings: {
      auto_lock: 300,
      theme: 'light'
    },
    autoLockOptions: [
      { label: '1分钟', value: 60 },
      { label: '5分钟', value: 300 },
      { label: '10分钟', value: 600 },
      { label: '30分钟', value: 1800 },
      { label: '永不', value: 0 }
    ]
  },

  onLoad() {
    this.loadSettings()
  },

  /**
   * 加载设置
   */
  loadSettings() {
    const settings = StorageManager.getSettings()
    this.setData({ settings })
  },

  /**
   * 修改PIN码
   */
  changePin() {
    wx.showModal({
      title: '修改PIN码',
      content: '修改PIN码需要重新验证当前PIN码，确定要继续吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除当前认证状态，跳转到验证页面
          const app = getApp()
          app.setAuthenticated(false)
          app.globalData.currentPin = null
          
          wx.redirectTo({
            url: '/pages/pin-verify/pin-verify'
          })
        }
      }
    })
  },

  /**
   * 修改自动锁定时间
   */
  changeAutoLock() {
    const { autoLockOptions, settings } = this.data
    const currentIndex = autoLockOptions.findIndex(item => item.value === settings.auto_lock)
    
    wx.showActionSheet({
      itemList: autoLockOptions.map(item => item.label),
      success: (res) => {
        const selectedOption = autoLockOptions[res.tapIndex]
        const newSettings = {
          ...settings,
          auto_lock: selectedOption.value
        }
        
        StorageManager.saveSettings(newSettings)
        this.setData({ settings: newSettings })
        
        wx.showToast({
          title: '设置已保存',
          icon: 'success'
        })
      }
    })
  },

  /**
   * 导出数据
   */
  exportData() {
    wx.showModal({
      title: '导出数据',
      content: '将会导出加密后的密码数据到剪贴板，请妥善保管',
      success: (res) => {
        if (res.confirm) {
          this.performExport()
        }
      }
    })
  },

  /**
   * 执行导出
   */
  performExport() {
    try {
      const encryptedData = wx.getStorageSync(StorageManager.STORAGE_KEYS.ENCRYPTED_DATA)
      const salt = wx.getStorageSync(StorageManager.STORAGE_KEYS.SALT)
      
      const exportData = {
        encrypted_data: encryptedData,
        salt: salt,
        export_time: new Date().toISOString(),
        version: '1.0'
      }
      
      wx.setClipboardData({
        data: JSON.stringify(exportData),
        success: () => {
          wx.showToast({
            title: '数据已复制到剪贴板',
            icon: 'success'
          })
        }
      })
    } catch (error) {
      wx.showToast({
        title: '导出失败',
        icon: 'error'
      })
    }
  },

  /**
   * 清除所有数据
   */
  clearAllData() {
    wx.showModal({
      title: '清除所有数据',
      content: '此操作将删除所有密码和设置，且无法恢复，确定要继续吗？',
      confirmText: '确定清除',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          StorageManager.clearAll()
          wx.showToast({
            title: '数据已清除',
            icon: 'success'
          })
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/pin-setup/pin-setup'
            })
          }, 1500)
        }
      }
    })
  },

  /**
   * 关于应用
   */
  showAbout() {
    wx.showModal({
      title: '关于忘记密码管家',
      content: '版本：1.0.0\n\n忘记密码管家 - 一个安全的本地密码管理工具，使用加密算法保护您的密码数据。\n\n所有数据仅存储在本地，不会上传到任何服务器。',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})