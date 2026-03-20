const StorageManager = require('../../utils/storage.js')

Page({
  data: {
    pinInputs: ['', '', '', '', '', ''],
    currentIndex: 0,
    isVerifying: false,
    errorCount: 0,
    maxErrors: 5
  },

  onLoad() {
    // 检查是否已设置PIN码
    if (!StorageManager.hasPinCode()) {
      wx.redirectTo({
        url: '/pages/pin-setup/pin-setup'
      })
    }
  },

  onShow() {
    // 重置输入状态
    this.setData({
      pinInputs: ['', '', '', '', '', ''],
      currentIndex: 0,
      isVerifying: false
    })
  },

  /**
   * 处理数字键盘输入
   */
  onNumberInput(e) {
    if (this.data.isVerifying) return
    
    const number = e.currentTarget.dataset.number
    const { pinInputs, currentIndex } = this.data
    
    if (currentIndex < 6) {
      pinInputs[currentIndex] = number
      const newIndex = currentIndex + 1
      
      this.setData({
        pinInputs,
        currentIndex: newIndex
      })

      // 如果输入完成，自动验证
      if (newIndex === 6) {
        setTimeout(() => {
          this.verifyPin()
        }, 300)
      }
    }
  },

  /**
   * 删除输入
   */
  onDelete() {
    if (this.data.isVerifying) return
    
    const { pinInputs, currentIndex } = this.data
    
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      pinInputs[newIndex] = ''
      
      this.setData({
        pinInputs,
        currentIndex: newIndex
      })
    }
  },

  /**
   * 验证PIN码
   */
  verifyPin() {
    const pin = this.data.pinInputs.join('')
    
    this.setData({
      isVerifying: true
    })

    // 模拟验证延迟
    setTimeout(() => {
      const isValid = StorageManager.verifyPin(pin)
      
      if (isValid) {
        // 验证成功，保存PIN码到全局状态
        const app = getApp()
        app.globalData.currentPin = pin
        app.setAuthenticated(true)
        
        wx.showToast({
          title: '验证成功',
          icon: 'success',
          duration: 1000
        })
        
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/password-list/password-list'
          })
        }, 1000)
      } else {
        // 验证失败
        this.handleVerifyError()
      }
    }, 500)
  },

  /**
   * 处理验证错误
   */
  handleVerifyError() {
    const newErrorCount = this.data.errorCount + 1
    
    this.setData({
      errorCount: newErrorCount,
      isVerifying: false,
      pinInputs: ['', '', '', '', '', ''],
      currentIndex: 0
    })

    if (newErrorCount >= this.data.maxErrors) {
      wx.showModal({
        title: '验证失败',
        content: `PIN码错误次数过多，请重新设置PIN码`,
        showCancel: false,
        confirmText: '重新设置',
        success: () => {
          // 清除所有数据，重新设置
          StorageManager.clearAll()
          wx.redirectTo({
            url: '/pages/pin-setup/pin-setup'
          })
        }
      })
    } else {
      wx.showToast({
        title: `PIN码错误 (${newErrorCount}/${this.data.maxErrors})`,
        icon: 'error',
        duration: 2000
      })
    }
  },

  /**
   * 忘记PIN码
   */
  onForgetPin() {
    wx.showModal({
      title: '忘记PIN码',
      content: '重置PIN码将清除所有已保存的密码数据，确定要继续吗？',
      confirmText: '确定重置',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          StorageManager.clearAll()
          wx.redirectTo({
            url: '/pages/pin-setup/pin-setup'
          })
        }
      }
    })
  }
})