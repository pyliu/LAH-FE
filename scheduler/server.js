'use strict'

const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { URL } = require('url')

const ROOT_DIR = path.resolve(__dirname, '..')
const ENV_PATH = path.join(ROOT_DIR, '.env')
const PKG_PATH = path.join(ROOT_DIR, 'package.json')

function getTimestamp () {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function logInfo (...args) {
  console.log(`[${getTimestamp()}] [INFO]`, ...args)
}

function logWarn (...args) {
  console.warn(`[${getTimestamp()}] [WARN]`, ...args)
}

function logError (...args) {
  console.error(`[${getTimestamp()}] [ERROR]`, ...args)
}

function parseEnvFile (filePath) {
  const result = {}
  if (!fs.existsSync(filePath)) {
    return result
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('#')) {
        continue
      }
      const eqIdx = line.indexOf('=')
      if (eqIdx === -1) {
        continue
      }
      const key = line.slice(0, eqIdx).trim()
      let val = line.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (key) {
        result[key] = val
      }
    }
  } catch (err) {
    logError('讀取 .env 失敗:', err.message)
  }
  return result
}

function readPkgVersion () {
  try {
    if (fs.existsSync(PKG_PATH)) {
      const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'))
      return pkg.version || '1.9.9'
    }
  } catch (e) {}
  return '1.9.9'
}

function buildPublicRuntimeConfig (env) {
  return {
    pkgVersion: readPkgVersion(),
    perPage: env.PER_PAGE,
    websocketHost: env.WEBSOCKET_HOST,
    websocketPort: env.WEBSOCKET_PORT,
    APIHost: env.API_HOST,
    APIPort: env.API_PORT,
    axios: {
      browserBaseURL: env.BROWSER_BASE_URL
    },
    webap: {
      x: env.WEBAP_X,
      reg: env.WEBAP_REG,
      reg2: env.WEBAP_REG2,
      sur: env.WEBAP_SUR,
      sur2: env.WEBAP_SUR2,
      val: env.WEBAP_VAL,
      use: env.WEBAP_USE,
      ext: env.WEBAP_EXT,
      taoyuan: env.WEBAP_TAOYUAN
    },
    monitor: {
      host: {
        L05: {
          ip: env.MONITOR_HOST_L05_IP,
          port: env.MONITOR_HOST_L05_PORT
        },
        SMS: {
          ip: env.MONITOR_HOST_SMS_IP,
          port: env.MONITOR_HOST_SMS_PORT,
          dir: env.MONITOR_HOST_SMS_DIR
        },
        Grafana: {
          ip: env.GRAFANA_HOST,
          port: env.GRAFANA_PORT
        },
        SRMAS: {
          ip: env.SRMAS_HOST
        }
      },
      capacity: {
        threshold: {
          danger: env.CAPACITY_DANGER || 85,
          warning: env.CAPACITY_WARNING || 80
        }
      }
    },
    isDev: process.env.NODE_ENV !== 'production'
  }
}

function syncRuntimeConfigJs (triggerReason = '手動/啟動') {
  const fileEnv = parseEnvFile(ENV_PATH)
  Object.keys(fileEnv).forEach((k) => {
    process.env[k] = fileEnv[k]
  })
  const pubCfg = buildPublicRuntimeConfig(process.env)
  const jsContent = 'window.__LAH_CONFIG__ = ' + JSON.stringify(pubCfg, null, 2) + ';\n'

  const targets = [
    path.join(ROOT_DIR, 'dist', 'runtime-config.js'),
    path.join(ROOT_DIR, 'static', 'runtime-config.js')
  ]

  let updatedCount = 0
  targets.forEach((targetPath) => {
    const dir = path.dirname(targetPath)
    if (!fs.existsSync(dir)) {
      logInfo(`[組態注入] 目錄不存在，略過: ${targetPath}`)
      return
    }

    try {
      let isSame = false
      if (fs.existsSync(targetPath)) {
        const currentContent = fs.readFileSync(targetPath, 'utf8')
        if (currentContent === jsContent) {
          isSame = true
        }
      }
      if (isSame) {
        return
      }
      fs.writeFileSync(targetPath, jsContent, 'utf8')
      updatedCount++
      logInfo(`[組態注入] 成功更新 runtime-config.js (${triggerReason}): ${targetPath} (${Buffer.byteLength(jsContent)} bytes)`)
    } catch (err) {
      logError(`[組態注入] 寫入 runtime-config.js 失敗 (${targetPath}):`, err.message)
    }
  })
  return updatedCount
}

function randomDelay (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function postFormUrlEncoded (targetUrl, formObj) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(targetUrl)
      const bodyStr = Object.keys(formObj)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(formObj[k]))
        .join('&')
      const isHttps = parsedUrl.protocol === 'https:'
      const client = isHttps ? https : http

      const req = client.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(bodyStr)
          },
          timeout: 240000
        },
        (res) => {
          const chunks = []
          res.on('data', chunk => chunks.push(chunk))
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8')
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve({ data: JSON.parse(raw) })
              } catch (e) {
                resolve({ data: { message: raw } })
              }
            } else {
              const err = new Error('HTTP ' + res.statusCode)
              err.response = { status: res.statusCode, statusText: res.statusMessage || '' }
              reject(err)
            }
          })
        }
      )

      req.on('timeout', () => {
        req.destroy(new Error('Request timeout'))
      })
      req.on('error', err => reject(err))
      req.write(bodyStr)
      req.end()
    } catch (err) {
      reject(err)
    }
  })
}

function formatHttpError (prefix, err) {
  const status = err.response ? `[${err.response.status} ${err.response.statusText}]` : ''
  const code = err.code ? `(${err.code})` : ''
  const message = err.message || err.toString()
  return `${prefix}失敗 ${code} ${status}: ${message}`.replace(/\s+/g, ' ').trim()
}

try {
  logInfo('LAH排程伺服器正在啟動 (Zero-Dependency Mode)...')
  syncRuntimeConfigJs('服務啟動')

  if (fs.existsSync(ENV_PATH)) {
    fs.watchFile(ENV_PATH, { interval: 5000 }, () => {
      logInfo('偵測到 .env 變更，重新同步 runtime-config.js')
      syncRuntimeConfigJs('.env 檔案變更')
    })
  } else {
    logWarn(`未找到 .env 設定檔 (${ENV_PATH})，已採用環境變數進行組態注入`)
  }

  const getBaseApiUrl = () => {
    const host = process.env.API_HOST || '127.0.0.1'
    const port = process.env.API_PORT || '80'
    return `http://${host}:${port}`
  }

  const watchdogCronConfig = '0 */1 7-17 * * 0-6'
  const schedulerCronConfig = '0 */5 7-22 * * 0-6'
  logInfo(`啟動 watchdog 排程 ${watchdogCronConfig}`)
  logInfo(`啟動 scheduler 排程 ${schedulerCronConfig}`)

  let lastTriggeredMinute = ''

  setInterval(() => {
    const now = new Date()
    const hour = now.getHours()
    const min = now.getMinutes()
    const minKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${hour}-${min}`

    if (lastTriggeredMinute === minKey) {
      return
    }
    lastTriggeredMinute = minKey

    // 定期保底檢查 runtime-config.js（每 5 分鐘確認一次，確保外部解壓縮覆蓋後能自動恢復）
    if (min % 5 === 0) {
      try {
        syncRuntimeConfigJs('定期排程保底檢查')
      } catch (err) {
        logError('定期排程同步 runtime-config.js 發生異常:', err.message)
      }
    }

    if (hour >= 7 && hour <= 17) {
      setTimeout(() => {
        const url = `${getBaseApiUrl()}/api/query_json_api.php`
        const startTime = Date.now()
        postFormUrlEncoded(url, { type: 'watchdog' })
          .then(({ data }) => {
            const cost = Date.now() - startTime
            const msg = data && data.message ? (typeof data.message === 'string' ? data.message : JSON.stringify(data.message)) : 'OK'
            logInfo(`[watchdog] 執行成功 (${cost}ms): ${msg}`)
          })
          .catch((err) => {
            logError(formatHttpError('[watchdog]', err))
          })
      }, randomDelay(50, 500))
    }

    if (hour >= 7 && hour <= 22 && min % 5 === 0) {
      setTimeout(() => {
        const url = `${getBaseApiUrl()}/api/schedule_json_api.php`
        const startTime = Date.now()
        postFormUrlEncoded(url, { type: 'regular' })
          .then(({ data }) => {
            const cost = Date.now() - startTime
            const msg = data && data.message ? (typeof data.message === 'string' ? data.message : JSON.stringify(data.message)) : 'OK'
            logInfo(`[scheduler] 執行成功 (${cost}ms): ${msg}`)
          })
          .catch((err) => {
            logError(formatHttpError('[scheduler]', err))
          })
      }, randomDelay(50, 500))
    }
  }, 1000)

  if (typeof process.send === 'function') {
    process.send('ready')
  }
  logInfo('LAH排程伺服器已就緒並進入監聽循環')
} catch (e) {
  logError('LAH排程伺服器啟動失敗', e)
}
