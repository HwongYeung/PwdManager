const StorageManager = require('../../utils/storage.js')

Page({
  data: {
    isEdit: false,
    id: '',
    formData: {
      title: '',
      url: '',
      username: '',
      password: '',
      notes: ''
    },
    showPassword: false,
    showPasswordGenerator: false,
    generatorOptions: {
      length: 12,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false
    }
  },

  onLoad(options) {
    const { id } = options
    
    if (id) {
      // 编辑模式
      this.setData({ 
        isEdit: true,
        id 
      })
      this.loadPasswordData(id)
    } else {
      // 新增模式
      this.setData({ isEdit: false })
    }
  },

  /**
   * 加载密码数据
   */
  loadPasswordData(id) {
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

    this.setData({
      formData: {
        title: password.title,
        url: password.url,
        username: password.username,
        password: password.password,
        notes: password.notes || ''
      }
    })
  },

  /**
   * 表单输入处理
   */
  onInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`formData.${field}`]: value
    })
  },

  /**
   * 切换密码显示
   */
  togglePasswordVisibility() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  /**
   * 显示密码生成器
   */
  showPasswordGenerator() {
    this.setData({
      showPasswordGenerator: true
    })
  },

  /**
   * 隐藏密码生成器
   */
  hidePasswordGenerator() {
    this.setData({
      showPasswordGenerator: false
    })
  },

  /**
   * 生成器选项改变
   */
  onGeneratorOptionChange(e) {
    const { option } = e.currentTarget.dataset
    
    if (option === 'length') {
      // 滑块改变
      const { value } = e.detail
      this.setData({
        [`generatorOptions.${option}`]: value
      })
    } else {
      // 复选框改变
      const { value } = e.detail
      this.setData({
        [`generatorOptions.${option}`]: value.length > 0
      })
    }
  },

  /**
   * 生成密码
   */
  generatePassword() {
    const { generatorOptions } = this.data
    let charset = ''
    
    if (generatorOptions.includeLowercase) {
      charset += 'abcdefghijklmnopqrstuvwxyz'
    }
    if (generatorOptions.includeUppercase) {
      charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    }
    if (generatorOptions.includeNumbers) {
      charset += '0123456789'
    }
    if (generatorOptions.includeSymbols) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    }
    
    if (!charset) {
      wx.showToast({
        title: '请至少选择一种字符类型',
        icon: 'error'
      })
      return
    }
    
    let password = ''
    for (let i = 0; i < generatorOptions.length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    this.setData({
      'formData.password': password,
      showPasswordGenerator: false
    })
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { formData } = this.data
    
    if (!formData.title.trim()) {
      wx.showToast({
        title: '请输入网站名称',
        icon: 'error'
      })
      return false
    }
    
    if (!formData.username.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'error'
      })
      return false
    }
    
    if (!formData.password.trim()) {
      wx.showToast({
        title: '请输入密码',
        icon: 'error'
      })
      return false
    }
    
    return true
  },

  /**
   * 保存密码
   */
  savePassword() {
    if (!this.validateForm()) {
      return
    }
    
    const app = getApp()
    const pin = app.globalData.currentPin
    const { isEdit, id, formData } = this.data
    
    const data = StorageManager.getPasswordData(pin)
    const passwords = data.passwords || []
    
    const now = new Date().toLocaleString('zh-CN')
    
    if (isEdit) {
      // 编辑模式
      const index = passwords.findIndex(item => item.id === id)
      if (index !== -1) {
        passwords[index] = {
          ...passwords[index],
          ...formData,
          updated_at: now
        }
      }
    } else {
      // 新增模式
      const newPassword = {
        id: this.generateId(),
        ...formData,
        created_at: now,
        updated_at: now
      }
      passwords.push(newPassword)
    }
    
    const success = StorageManager.savePasswordData({
      passwords
    }, pin)
    
    if (success) {
      wx.showToast({
        title: isEdit ? '更新成功' : '添加成功',
        icon: 'success'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } else {
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  },

  /**
   * 生成唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
  }
})