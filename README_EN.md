<p align="center">
  <img src="./qrcode.jpg" width="200" alt="Forgot Password Manager Mini Program QR Code" />
</p>

<h1 align="center">Forgot Password Manager</h1>

<p align="center">
  A password manager WeChat Mini Program powered by AES-256 symmetric encryption<br/>
  <strong>Open source and transparent — the code is the trust</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-WeChat_MiniProgram-07C160?logo=wechat&logoColor=white" alt="WeChat MiniProgram" />
  <img src="https://img.shields.io/badge/encryption-AES--256--CBC-blue" alt="AES-256" />
  <img src="https://img.shields.io/badge/key_derivation-PBKDF2-orange" alt="PBKDF2" />
  <img src="https://img.shields.io/badge/hash-SHA--256-red" alt="SHA-256" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
</p>

<p align="center">
  <a href="https://www.wangjimima.com/">Website</a> &nbsp;·&nbsp;
  <a href="./README.md">中文</a>
</p>

---

## Try It Now

Open WeChat and scan the QR code above to try "Forgot Password Manager".

> No registration required. Just set a 6-digit PIN code on first launch.

---

## Features

### Password Management
- Add, edit, delete, and view password entries
- Search by website name or username
- One-tap copy for username, password, and URL

### Password Generator
- Customizable length (6–32 characters)
- Toggle uppercase, lowercase, digits, and special symbols
- One-tap generate and auto-fill

### Security
- 6-digit PIN code protection with attempt limit (5 tries)
- Auto-lock when the app goes to background (configurable: 1 / 5 / 10 / 30 min or never)
- PIN reset available (all data will be erased and cannot be recovered)

### Encryption Demo
- Built-in interactive encryption demo page
- Watch the full plaintext → encrypt → decrypt process in real time
- Wrong-key decryption test to experience the strength of AES firsthand

### Data Management
- Export encrypted data to clipboard for backup
- One-tap clear all data

---

## Encryption In Depth

This is the heart of the project and the foundation of your password security. Below is a complete walkthrough of every step from PIN input to secure storage.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User enters PIN                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  ① Generate random Salt                                     │
│     CryptoJS.lib.WordArray.random(128/8)                    │
│     Output: 16-byte random hex string                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
          ┌───────┴───────┐
          ▼               ▼
┌──────────────┐  ┌──────────────────────────────────────────┐
│ ② PIN Hash   │  │ ③ Key Derivation                         │
│              │  │                                          │
│ SHA-256      │  │ PBKDF2(PIN, Salt)                        │
│ (PIN + Salt) │  │   - Iterations: 10,000                   │
│              │  │   - Key size: 256 bit                     │
│ Output: hash │  │                                          │
│ (verify only)│  │ Output: 256-bit AES encryption key       │
└──────────────┘  └────────────────┬─────────────────────────┘
                                   │
                                   ▼
                  ┌──────────────────────────────────────────┐
                  │ ④ AES-256-CBC Encryption                 │
                  │                                          │
                  │ Plaintext(JSON) + Key + Random IV        │
                  │   → PKCS7 padding                        │
                  │   → CBC mode block encryption             │
                  │   → Base64 encoded output                 │
                  │                                          │
                  │ Output: ciphertext (stored locally)       │
                  └──────────────────────────────────────────┘
```

### Step 1 — Random Salt Generation

```javascript
static generateSalt() {
  return CryptoJS.lib.WordArray.random(128 / 8).toString()
}
```

A **128-bit (16-byte)** random salt is generated each time a PIN is set.

- **Same PIN + different salt = completely different key**, preventing rainbow table attacks
- The salt is stored alongside the encrypted data (the salt itself is not a secret, but only meaningful when combined with the PIN)

### Step 2 — PIN Hash Verification

```javascript
static hashPin(pin, salt) {
  return CryptoJS.SHA256(pin + salt).toString()
}
```

**SHA-256** hashes `PIN + Salt` into a 256-bit digest.

- The hash is used **only to verify whether the PIN is correct**, not to encrypt data
- SHA-256 is a one-way function — **the PIN cannot be reverse-engineered from the hash**
- The system stores only the hash; **the plaintext PIN is never stored**

### Step 3 — Key Derivation (PBKDF2)

```javascript
static deriveKey(pin, salt) {
  return CryptoJS.PBKDF2(pin, salt, {
    keySize: 256 / 32,   // 256-bit output
    iterations: 10000     // 10,000 iterations
  }).toString()
}
```

**PBKDF2** (Password-Based Key Derivation Function 2) is purpose-built for deriving keys from passwords:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Input | PIN + Salt | User PIN combined with random salt |
| Iterations | 10,000 | Multiplies brute-force cost (each guess requires 10,000 rounds) |
| Output size | 256 bit | Matches AES-256 key requirement |
| Underlying hash | HMAC-SHA1 | CryptoJS PBKDF2 default |

**Why not use the PIN directly as the key?**

A 6-digit PIN has only 10^6 = 1,000,000 possible combinations — brute-forceable in milliseconds. PBKDF2 amplifies the computational cost of each guess by thousands of times through 10,000 iterations, dramatically increasing the time required for brute-force attacks.

### Step 4 — AES-256-CBC Encryption

```javascript
static encrypt(data, key) {
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.toString()   // Base64 encoded output
}
```

**AES-256** (Advanced Encryption Standard) is the most widely adopted symmetric encryption standard worldwide:

- **Key length**: 256 bits — brute-forcing requires 2^256 attempts; the lifespan of the universe is not enough
- **Mode**: CBC (Cipher Block Chaining) — each plaintext block is XORed with the previous ciphertext block before encryption, producing different ciphertext for identical plaintext at different positions
- **Padding**: PKCS7 — standard padding ensuring plaintext of any length can be correctly encrypted
- **IV**: CryptoJS automatically generates a random IV and embeds it in the ciphertext header, ensuring identical plaintext produces different ciphertext each time

### Decryption

```javascript
static decrypt(encryptedData, key) {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
}
```

Decryption is the reverse of encryption — **only someone with the correct PIN (and thus the correct derived key) can decrypt the data**. A wrong key produces garbled output or null, revealing no meaningful information.

### Storage Structure

```javascript
{
  "pin_hash":       "a3f2...8b1c",   // SHA-256(PIN + Salt), verification only
  "salt":           "7e4d...f1a9",   // 128-bit random salt
  "encrypted_data": "U2Fsd...Q==",   // AES-256-CBC encrypted password data (Base64)
  "settings": {                      // App settings (unencrypted)
    "auto_lock": 300,
    "theme": "light"
  }
}
```

### Security Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| PIN verification | SHA-256 | One-way hash; PIN cannot be reversed |
| Key derivation | PBKDF2 (10,000 iterations) | Amplifies brute-force cost |
| Data encryption | AES-256-CBC + PKCS7 | Military-grade symmetric encryption |
| Random salt | 128-bit random | Prevents rainbow table attacks |
| Random IV | Auto-generated per encryption | Same plaintext yields different ciphertext |
| Open source | Full source code available | Encryption logic is auditable, no backdoors |

---

## Project Structure

```
PwdManager/
├── app.js                          # App entry (PIN check, auto-lock)
├── app.json                        # App config (routes, tabBar)
├── app.wxss                        # Global styles
├── custom-tab-bar/                 # Custom bottom tab bar
│   ├── index.js
│   ├── index.wxml
│   ├── index.wxss
│   └── index.json
├── pages/
│   ├── pin-setup/                  # PIN setup page
│   ├── pin-verify/                 # PIN verification page
│   ├── password-list/              # Password list page (Tab)
│   ├── password-detail/            # Password detail page
│   ├── password-edit/              # Password add/edit page
│   ├── crypto-demo/                # Encryption demo page (Tab)
│   └── settings/                   # Settings page
├── utils/
│   ├── crypto.js                   # Crypto utilities (AES-256 / PBKDF2 / SHA-256)
│   └── storage.js                  # Local storage manager
├── components/
│   └── custom-navbar/              # Custom navigation bar component
├── miniprogram_npm/
│   ├── crypto-js/                  # CryptoJS library
│   └── tdesign-miniprogram/        # TDesign UI components
├── qrcode.jpg                      # Mini Program QR code
└── package.json
```

---

## Local Development

### Prerequisites

- [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) (Stable)
- Node.js 14+

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/HwongYeung/PwdManager.git
cd PwdManager

# 2. Install dependencies
npm install

# 3. Open the project directory in WeChat DevTools

# 4. Build npm packages in DevTools
#    Menu → Tools → Build npm

# 5. Compile and run
```

### Tech Stack

| Technology | Purpose |
|-----------|---------|
| WeChat Mini Program Native Framework | Application framework |
| [TDesign Mini Program](https://tdesign.tencent.com/miniprogram) | UI components |
| [CryptoJS](https://github.com/brix/crypto-js) | Cryptography (AES / PBKDF2 / SHA-256) |
| JavaScript ES6+ | Language |

---

## User Guide

### First Launch

1. Scan the QR code above in WeChat, or search for "Forgot Password Manager"
2. Set a 6-digit PIN code (remember it — it cannot be recovered)
3. After confirming, you will be taken to the password management page

### Daily Use

1. Open the Mini Program and enter your PIN to unlock
2. Tap the `+` button at the bottom right to add a password entry
3. Tap any entry to view details; supports one-tap copy
4. Switch to the "Encryption Demo" tab at the bottom to see encryption in action

### Security Tips

- **Remember your PIN** — forgetting it means all data is permanently lost
- **Back up regularly** — export encrypted data from the Settings page
- **Stay updated** — follow the project for security patches

---

## FAQ

**Q: What if I forget my PIN?**
> The PIN is the only credential that can decrypt your data. If forgotten, the app can only be reset (all data will be erased) and passwords cannot be recovered.

**Q: Where is my data stored?**
> Password data is encrypted with AES-256 before storage. Even if the data is obtained, it cannot be decrypted without the PIN.

**Q: Will my data survive a phone change?**
> WeChat Mini Program local data does not migrate with your WeChat account. Export your data via "Settings → Export Data" before switching devices.

**Q: Is AES-256 secure?**
> AES-256 is a classified-level encryption standard approved by the U.S. government, widely used by banks, military, and government agencies worldwide. Brute-forcing AES-256 would take longer than the age of the universe.

**Q: Does the demo page use the real encryption?**
> Yes. The demo page calls the exact same encryption functions (`crypto.js`) that protect your data. What you see is what you get.

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

<p align="center">
  <strong>Scan to try "Forgot Password Manager"</strong><br/><br/>
  <img src="./qrcode.jpg" width="180" alt="Forgot Password Manager QR Code" /><br/><br/>
  Your passwords belong to you.
</p>
