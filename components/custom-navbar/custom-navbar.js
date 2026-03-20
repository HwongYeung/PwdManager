// 自定义导航栏组件
Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    showBack: {
      type: Boolean,
      value: true
    },
    textColor: {
      type: String,
      value: '#ffffff'
    },
    backgroundColor: {
      type: String,
      value: '#1976D2'
    }
  },

  data: {
    statusBarHeight: 0,
    titleBarHeight: 25, // 50rpx ≈ 25px
    navbarHeight: 0
  },

  lifetimes: {
    attached() {
      this.setNavbarInfo()
    }
  },

  methods: {
    /**
     * 设置导航栏信息
     */
    setNavbarInfo() {
      const systemInfo = wx.getSystemInfoSync()
      const { statusBarHeight } = systemInfo
      
      // 固定标题栏高度为50rpx (约25px)
      const titleBarHeight = 25
      
      // 总导航栏高度
      const navbarHeight = statusBarHeight + titleBarHeight
      
      this.setData({
        statusBarHeight,
        titleBarHeight,
        navbarHeight
      })
    },

    /**
     * 返回按钮点击事件
     */
    onBack() {
      this.triggerEvent('back')
      
      // 默认行为：返回上一页
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        wx.switchTab({
          url: '/pages/password-list/password-list'
        })
      }
    }
  }
})