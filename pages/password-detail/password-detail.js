const StorageManager = require('../../utils/storage.js')

Page({
  data: {
    password: null,
    showPassword: false,
    id: ''
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({ id })
    this.loadPasswordDetail(id)
  },

  /**
   * 加载密码详情
   */
  loadPasswordDetail(id) {
    const app = getApp()
    const pin = app.globalData.currentPin
    
    if (!pin) {
      wx.redirectTo({
        url: '/pages/pin-verify/pin-verify'
      })
      return
    }

    const data = StorageManager.getPasswordData(pin)
    const password = data.passwords.find(item => item.id === id)
    
    if (!password) {
      wx.showToast({
        title: '密码不存在',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({ password })
  },

  /**
   * 切换密码显示/隐藏
   */
  togglePasswordVisibility() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  /**
   * 复制到剪贴板
   */
  copyToClipboard(e) {
    const type = e.currentTarget.dataset.type
    const { password } = this.data
    let text = ''
    let label = ''

    switch (type) {
      case 'username':
        text = password.username
        label = '用户名'
        break
      case 'password':
        text = password.password
        label = '密码'
        break
      case 'url':
        text = password.url
        label = '网址'
        break
      default:
        return
    }

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: `${label}已复制`,
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'error'
        })
      }
    })
  },

  /**
   * 编辑密码
   */
  editPassword() {
    wx.navigateTo({
      url: `/pages/password-edit/password-edit?id=${this.data.id}`
    })
  },

  /**
   * 删除密码
   */
  deletePassword() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个密码吗？',
      confirmText: '删除',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          this.performDelete()
        }
      }
    })
  },

  /**
   * 执行删除操作
   */
  performDelete() {
    const app = getApp()
    const pin = app.globalData.currentPin
    const { id } = this.data
    
    const data = StorageManager.getPasswordData(pin)
    const newPasswords = data.passwords.filter(item => item.id !== id)
    
    const success = StorageManager.savePasswordData({
      passwords: newPasswords
    }, pin)
    
    if (success) {
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } else {
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      })
    }
  },

  /**
   * 打开网址
   */
  openUrl() {
    const { password } = this.data
    if (!password.url) return
    
    // 确保URL有协议前缀
    let url = password.url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showModal({
          title: '提示',
          content: '网址已复制到剪贴板，请在浏览器中打开',
          showCancel: false
        })
      }
    })
  }
})