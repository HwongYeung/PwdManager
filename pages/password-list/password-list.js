const StorageManager = require('../../utils/storage.js')

Page({
  data: {
    passwords: [],
    allPasswords: [], // 缓存全部数据，避免搜索时重复解密
    searchValue: '',
    showSearch: false
  },

  onLoad() {
    // 设置认证状态
    const app = getApp()
    app.setAuthenticated(true)
    
    // 加载密码数据
    this.loadPasswords()
  },

  onShow() {
    // 每次显示页面时重新加载数据
    this.loadPasswords()

    // 更新自定义 tabBar 选中态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  /**
   * 加载密码数据
   */
  loadPasswords() {
    const app = getApp()
    const pin = app.globalData.currentPin
    
    if (!pin) {
      // 如果没有PIN码，跳转到验证页面
      wx.redirectTo({
        url: '/pages/pin-verify/pin-verify'
      })
      return
    }

    const data = StorageManager.getPasswordData(pin)
    this.setData({
      passwords: data.passwords || [],
      allPasswords: data.passwords || []
    })
  },

  /**
   * 显示/隐藏搜索框
   */
  toggleSearch() {
    this.setData({
      showSearch: !this.data.showSearch,
      searchValue: ''
    })
    
    if (!this.data.showSearch) {
      // 隐藏搜索框时重新加载所有数据
      this.loadPasswords()
    }
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    const value = e.detail.value
    this.setData({
      searchValue: value
    })
    
    this.filterPasswords(value)
  },

  /**
   * 过滤密码
   */
  filterPasswords(keyword) {
    const allPasswords = this.data.allPasswords

    if (!keyword) {
      this.setData({
        passwords: allPasswords
      })
      return
    }
    
    const filtered = allPasswords.filter(item => {
      return item.title.toLowerCase().includes(keyword.toLowerCase()) ||
             item.username.toLowerCase().includes(keyword.toLowerCase())
    })
    
    this.setData({
      passwords: filtered
    })
  },

  /**
   * 跳转到密码详情
   */
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/password-detail/password-detail?id=${id}`
    })
  },

  /**
   * 添加新密码
   */
  addPassword() {
    wx.navigateTo({
      url: '/pages/password-edit/password-edit'
    })
  },

  /**
   * 跳转到设置页面
   */
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  }
})