const isDev = process.env.NODE_ENV !== 'production'
// Cron-style Scheduling
// The cron format consists of:
// *    *    *    *    *    *
// ┬    ┬    ┬    ┬    ┬    ┬
// │    │    │    │    │    │
// │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
// │    │    │    │    └───── month (1 - 12)
// │    │    │    └────────── day of month (1 - 31)
// │    │    └─────────────── hour (0 - 23)
// │    └──────────────────── minute (0 - 59)
// └───────────────────────── second (0 - 59, OPTIONAL)
try {
  require('dotenv').config()
  isDev && console.log(process.env)

  const fs = require('fs')
  const path = require('path')
  const dbDir = path.join(__dirname, 'db')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir)
  }

  const schedule = require('node-schedule')

  const job = schedule.scheduleJob('*/5 * * * * *', function () {
    console.log('5s reached!')
  })

  isDev && console.log('LAH排程伺服器已啟動')
} catch (e) {
  console.error('LAH排程伺服器啟動失敗', e)
// eslint-disable-next-line no-empty
} finally {}
