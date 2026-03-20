const CryptoUtil = require('../../utils/crypto.js')

Page({
  data: {
    // 用户输入
    inputText: '',
    inputKey: '',

    // 演示结果
    salt: '',
    derivedKey: '',
    encryptedText: '',
    decryptedText: '',

    // 流程步骤状态
    steps: [],
    hasResult: false,
    isProcessing: false,

    // 预设示例
    examples: [
      { label: '银行密码', text: 'MyBank@2024', key: '168920' },
      { label: '邮箱密码', text: 'Email#Secure!99', key: '052738' },
      { label: '中文内容', text: '这是一段中文密码测试', key: '331256' }
    ]
  },

  onLoad() {},

  onShow() {
    // 更新自定义 tabBar 选中态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  /**
   * 输入明文
   */
  onInputText(e) {
    this.setData({
      inputText: e.detail.value,
      hasResult: false,
      steps: []
    })
  },

  /**
   * 输入密钥(模拟PIN码)
   */
  onInputKey(e) {
    this.setData({
      inputKey: e.detail.value,
      hasResult: false,
      steps: []
    })
  },

  /**
   * 使用预设示例
   */
  useExample(e) {
    const index = e.currentTarget.dataset.index
    const example = this.data.examples[index]
    this.setData({
      inputText: example.text,
      inputKey: example.key,
      hasResult: false,
      steps: []
    })
  },

  /**
   * 执行加密演示
   */
  runDemo() {
    const { inputText, inputKey } = this.data

    if (!inputText.trim()) {
      wx.showToast({ title: '请输入明文内容', icon: 'error' })
      return
    }
    if (!inputKey.trim()) {
      wx.showToast({ title: '请输入模拟PIN码', icon: 'error' })
      return
    }

    this.setData({ isProcessing: true, steps: [], hasResult: false })

    // 使用 setTimeout 逐步展示流程，让用户看到每一步
    const steps = []

    // 第1步：生成盐值
    setTimeout(() => {
      const salt = CryptoUtil.generateSalt()
      steps.push({
        index: 1,
        title: '生成随机盐值 (Salt)',
        desc: '每次加密都会生成不同的随机盐值，确保相同密码产生不同密文',
        result: salt
      })
      this.setData({ steps: [...steps], salt })
    }, 300)

    // 第2步：派生密钥
    setTimeout(() => {
      const salt = this.data.salt
      const derivedKey = CryptoUtil.deriveKey(inputKey, salt)
      steps.push({
        index: 2,
        title: '派生加密密钥 (PBKDF2)',
        desc: 'PIN码 + 盐值经过 10000 次 PBKDF2 迭代运算，生成 256 位 AES 密钥',
        input: 'PIN: ' + inputKey + ' + Salt: ' + salt.substring(0, 8) + '...',
        result: derivedKey.substring(0, 32) + '...'
      })
      this.setData({ steps: [...steps], derivedKey })
    }, 900)

    // 第3步：AES加密
    setTimeout(() => {
      const derivedKey = this.data.derivedKey
      const dataToEncrypt = { text: inputText }
      const encryptedText = CryptoUtil.encrypt(dataToEncrypt, derivedKey)
      steps.push({
        index: 3,
        title: 'AES-CBC 加密',
        desc: '使用派生密钥对明文进行 AES-CBC 加密，输出 Base64 编码的密文',
        input: inputText,
        result: encryptedText
      })
      this.setData({ steps: [...steps], encryptedText })
    }, 1500)

    // 第4步：AES解密
    setTimeout(() => {
      const derivedKey = this.data.derivedKey
      const encryptedText = this.data.encryptedText
      const decryptedData = CryptoUtil.decrypt(encryptedText, derivedKey)
      const decryptedText = decryptedData ? decryptedData.text : '解密失败'
      steps.push({
        index: 4,
        title: 'AES-CBC 解密还原',
        desc: '使用相同密钥解密密文，成功还原为原始明文',
        input: encryptedText ? encryptedText.substring(0, 32) + '...' : '',
        result: decryptedText
      })
      this.setData({
        steps: [...steps],
        decryptedText,
        hasResult: true,
        isProcessing: false
      })
    }, 2100)
  },

  /**
   * 错误密钥演示 - 展示错误的密钥无法解密
   */
  runWrongKeyDemo() {
    const { encryptedText, inputKey } = this.data

    if (!encryptedText) {
      wx.showToast({ title: '请先执行加密演示', icon: 'error' })
      return
    }

    // 用一个错误的密钥尝试解密
    const wrongKey = inputKey === '000000' ? '111111' : '000000'
    const wrongSalt = CryptoUtil.generateSalt()
    const wrongDerivedKey = CryptoUtil.deriveKey(wrongKey, wrongSalt)
    const result = CryptoUtil.decrypt(encryptedText, wrongDerivedKey)

    const steps = [...this.data.steps]
    steps.push({
      index: 5,
      title: '错误密钥解密测试',
      desc: '使用错误的 PIN "' + wrongKey + '" 尝试解密 —— 完全无法还原数据',
      input: '错误PIN: ' + wrongKey,
      result: result ? JSON.stringify(result) : '解密失败 (乱码/空值)',
      isError: true
    })
    this.setData({ steps })
  },

  /**
   * 重置演示
   */
  resetDemo() {
    this.setData({
      inputText: '',
      inputKey: '',
      salt: '',
      derivedKey: '',
      encryptedText: '',
      decryptedText: '',
      steps: [],
      hasResult: false,
      isProcessing: false
    })
  }
})
