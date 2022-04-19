// https://www.npmjs.com/package/node-schedule
const schedule = require('node-schedule')
const qs = require('qs')
const axios = require('axios')
// to PHP API
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'

try {
  const isDev = process.env.NODE_ENV !== 'production'
  require('dotenv').config()
  isDev && console.log(process.env)

  const watchdogCronConfig = '0 */15 7-17 * * 0-6'
  let watchdogLock = false
  console.log(`啟動 watchdog 排程 ${watchdogCronConfig}`)
  schedule.scheduleJob(watchdogCronConfig, function () {
    if (!watchdogLock) {
      watchdogLock = true
      const url = `http://${process.env.API_HOST}:${process.env.API_PORT}/api/query_json_api.php`
      axios.post(
        url,
        qs.stringify({ type: 'watchdog' })
      ).then(({ data }) => {
        console.log(data.message)
      }).catch((err) => {
        console.error(err)
      }).finally(() => {
        console.log('已完成 watchdog 請求')
        watchdogLock = false
      })
    }
  })

  const schedulerCronConfig = '0 */5 7-22 * * 0-6'
  let schedulerLock = false
  console.log(`啟動 scheduler 排程 ${schedulerCronConfig}`)
  schedule.scheduleJob(schedulerCronConfig, function () {
    if (!schedulerLock) {
      schedulerLock = true
      const url = `http://${process.env.API_HOST}:${process.env.API_PORT}/api/schedule_json_api.php`
      axios.post(
        url,
        qs.stringify({ type: 'reqular' })
      ).then(({ data }) => {
        console.log(data.message)
      }).catch((err) => {
        console.error(err)
      }).finally(() => {
        console.log('已完成 scheduler 請求')
        schedulerLock = false
      })
    }
  })

  console.log('LAH排程伺服器已啟動')
} catch (e) {
  console.error('LAH排程伺服器啟動失敗', e)
// eslint-disable-next-line no-empty
} finally {}
