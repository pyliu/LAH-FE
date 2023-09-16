// https://www.npmjs.com/package/node-schedule
const schedule = require('node-schedule')
const debounce = require('lodash/debounce')
const qs = require('qs')
const axios = require('axios')
// to PHP API
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
function randomDelay (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
};
try {
  const isDev = process.env.NODE_ENV !== 'production'
  const cfg = require('dotenv').config()
  isDev && console.log(cfg)
  const baseAPIUrl = `http://${process.env.API_HOST}:${process.env.API_PORT}`
  const watchdogCronConfig = '0 */15 7-17 * * 0-6'
  console.log(`啟動 watchdog 排程 ${watchdogCronConfig}`)
  schedule.scheduleJob(watchdogCronConfig, debounce(() => {
    const url = `${baseAPIUrl}/api/query_json_api.php`
    isDev && console.log('執行 watchdog 請求')
    axios.post(
      url,
      qs.stringify({ type: 'watchdog' })
    ).then(({ data }) => {
      isDev && console.log(data.message)
    }).catch((err) => {
      console.error(err)
    }).finally(() => {
      isDev && console.log('完成 watchdog 請求')
    })
  }, randomDelay(50, 500)))

  const schedulerCronConfig = '0 */5 7-22 * * 0-6'
  console.log(`啟動 scheduler 排程 ${schedulerCronConfig}`)
  schedule.scheduleJob(schedulerCronConfig, debounce(() => {
    const url = `${baseAPIUrl}/api/schedule_json_api.php`
    isDev && console.log('執行 scheduler 請求')
    axios.post(
      url,
      qs.stringify({ type: 'reqular' })
    ).then(({ data }) => {
      isDev && console.log(data.message)
    }).catch((err) => {
      console.error(err)
    }).finally(() => {
      isDev && console.log('完成 scheduler 請求')
    })
  }, randomDelay(50, 500)))

  console.log('LAH排程伺服器已啟動')
} catch (e) {
  console.error('LAH排程伺服器啟動失敗', e)
// eslint-disable-next-line no-empty
} finally {}
