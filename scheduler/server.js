const fs = require('fs')
const path = require('path')
// https://www.npmjs.com/package/node-schedule
const schedule = require('node-schedule')
const qs = require('qs')
const axios = require('axios')
// to PHP API
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'

function now () {
  const dateOb = new Date()
  // current date
  // adjust 0 before single digit date
  const date = ('0' + dateOb.getDate()).slice(-2)
  // current month
  const month = ('0' + (dateOb.getMonth() + 1)).slice(-2)
  // current year
  const year = dateOb.getFullYear()
  // current hours
  const hours = ('0' + dateOb.getHours()).slice(-2)
  // current minutes
  const minutes = ('0' + dateOb.getMinutes()).slice(-2)
  // current seconds
  const seconds = ('0' + dateOb.getSeconds()).slice(-2)
  // prints date & time in YYYY-MM-DD HH:MM:SS format
  return (year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds)
}

try {
  const isDev = process.env.NODE_ENV !== 'production'
  require('dotenv').config()
  isDev && console.log(process.env)

  const dbDir = path.join(__dirname, 'db')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir)
  }

  const cronSetting = '0 */15 8-18 * * 0-6'
  schedule.scheduleJob(cronSetting, function () {
    const url = `http://${process.env.API_HOST}:${process.env.API_PORT}/api/query_json_api.php`
    console.log(`啟動排程 ${cronSetting}`)
    console.log(`啟動 ${url}}`, 'type: "watchdog"')
    axios.post(
      url,
      qs.stringify({ type: 'watchdog' })
    ).then(({ data }) => {
      console.log(data.message)
    }).catch((err) => {
      console.error(err)
    }).finally(() => {})
  })

  console.log('LAH排程伺服器已啟動')
} catch (e) {
  console.error('LAH排程伺服器啟動失敗', e)
// eslint-disable-next-line no-empty
} finally {}
