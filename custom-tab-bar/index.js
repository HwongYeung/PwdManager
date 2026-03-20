Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/password-list/password-list',
        text: '密码管理',
        icon: 'lock-on',
        selectedIcon: 'lock-on'
      },
      {
        pagePath: '/pages/crypto-demo/crypto-demo',
        text: '算法演示',
        icon: 'secured',
        selectedIcon: 'secured'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const item = this.data.list[index]

      wx.switchTab({
        url: item.pagePath
      })
    }
  }
})
