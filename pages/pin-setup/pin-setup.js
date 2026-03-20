const StorageManager = require('../../utils/storage.js')

Page({
  data: {
    pin: '',
    confirmPin: '',
    step: 1, // 1: 设置PIN码, 2: 确认PIN码
    pinInputs: ['', '', '', '', '', ''],
    confirmPinInputs: ['', '', '', '', '', ''],
    currentIndex: 0,
    confirmCurrentIndex: 0
  },

  onLoad() {
    // 检查是否已经设置过PIN码
    if (StorageManager.hasPinCode()) {
      wx.redirectTo({
        url: '/pages/pin-verify/pin-verify'
      })
    }
  },

  /**
   * 处理数字键盘输入
   */
  onNumberInput(e) {
    const number = e.currentTarget.dataset.number
    
    if (this.data.step === 1) {
      this.handlePinInput(number)
    } else {
      this.handleConfirmPinInput(number)
    }
  },

  /**
   * 处理PIN码输入
   */
  handlePinInput(number) {
    const { pinInputs, currentIndex } = this.data
    
    if (currentIndex < 6) {
      pinInputs[currentIndex] = number
      const newIndex = currentIndex + 1
      
      this.setData({
        pinInputs,
        currentIndex: newIndex,
        pin: pinInputs.join('')
      })

      // 如果输入完成，自动进入下一步
      if (newIndex === 6) {
        setTimeout(() => {
          this.setData({
            step: 2
          })
        }, 300)
      }
    }
  },

  /**
   * 处理确认PIN码输入
   */
  handleConfirmPinInput(number) {
    const { confirmPinInputs, confirmCurrentIndex } = this.data
    
    if (confirmCurrentIndex < 6) {
      confirmPinInputs[confirmCurrentIndex] = number
      const newIndex = confirmCurrentIndex + 1
      
      this.setData({
        confirmPinInputs,
        confirmCurrentIndex: newIndex,
        confirmPin: confirmPinInputs.join('')
      })

      // 如果输入完成，自动验证
      if (newIndex === 6) {
        setTimeout(() => {
          this.verifyAndSave()
        }, 300)
      }
    }
  },

  /**
   * 删除输入
   */
  onDelete() {
    if (this.data.step === 1) {
      this.deletePinInput()
    } else {
      this.deleteConfirmPinInput()
    }
  },

  /**
   * 删除PIN码输入
   */
  deletePinInput() {
    const { pinInputs, currentIndex } = this.data
    
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      pinInputs[newIndex] = ''
      
      this.setData({
        pinInputs,
        currentIndex: newIndex,
        pin: pinInputs.join('')
      })
    }
  },

  /**
   * 删除确认PIN码输入
   */
  deleteConfirmPinInput() {
    const { confirmPinInputs, confirmCurrentIndex } = this.data
    
    if (confirmCurrentIndex > 0) {
      const newIndex = confirmCurrentIndex - 1
      confirmPinInputs[newIndex] = ''
      
      this.setData({
        confirmPinInputs,
        confirmCurrentIndex: newIndex,
        confirmPin: confirmPinInputs.join('')
      })
    }
  },

  /**
   * 返回上一步
   */
  onBack() {
    if (this.data.step === 2) {
      this.setData({
        step: 1,
        confirmPin: '',
        confirmPinInputs: ['', '', '', '', '', ''],
        confirmCurrentIndex: 0
      })
    }
  },

  /**
   * 验证并保存PIN码
   */
  verifyAndSave() {
    const { pin, confirmPin } = this.data
    
    if (pin !== confirmPin) {
      wx.showToast({
        title: 'PIN码不一致',
        icon: 'error',
        duration: 2000
      })
      
      // 重置确认PIN码
      this.setData({
        confirmPin: '',
        confirmPinInputs: ['', '', '', '', '', ''],
        confirmCurrentIndex: 0
      })
      return
    }

    // 保存PIN码
    const success = StorageManager.setPinCode(pin)
    
    if (success) {
      // 设置成功，保存PIN码到全局状态
      const app = getApp()
      app.globalData.currentPin = pin
      app.setAuthenticated(true)
      
      wx.showToast({
        title: '设置成功',
        icon: 'success',
        duration: 1500
      })
      
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/password-list/password-list'
        })
      }, 1500)
    } else {
      wx.showToast({
        title: '设置失败',
        icon: 'error',
        duration: 2000
      })
    }
  }
})