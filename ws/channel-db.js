const fs = require("fs")
const path = require("path")
const utils = require("./utils.js")
const sqlite3 = require("sqlite3").verbose()

class ChannelDB {
  static insertIntoChannelSQL = `
    INSERT INTO channel(name, host, password, type)
    VALUES ($name, $host, $password, $type)
  `
  constructor () {
    this.dbDir = path.join(__dirname, 'dimension')
    if (!fs.existsSync(this.dbDir)){
      fs.mkdirSync(this.dbDir)
    }
    this.filepath = path.join(this.dbDir, 'channel') + '.db'
    this.createTable()
    this.db = new sqlite3.Database(this.filepath)
  }

  close () {
    this.db.close()
  }

  async createTable () {
    if (!fs.existsSync(this.filepath)) {
      const db = new sqlite3.Database(this.filepath)
      db.run(`
        CREATE TABLE IF NOT EXISTS "channel" (
          "id"	INTEGER,
          "name"	TEXT NOT NULL,
          "host"	TEXT,
          "password"	TEXT,
          "type"	INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY("id" AUTOINCREMENT)
        )
      `, {}, function (err) {
        err && console.error(err)
      })
      db.run(`
        CREATE TABLE IF NOT EXISTS "participant" (
          "id"	INTEGER,
          "channel_id"	INTEGER NOT NULL,
          "user_id"	TEXT NOT NULL,
          PRIMARY KEY("id" AUTOINCREMENT)
        )
      `, {}, function (err) {
        err && console.error(err)
      })
      await utils.sleep(400)
      db.close()
    }
  }

  timestamp (date = 'full') {
    const now = new Date()
    const full = now.getFullYear() + '-' +
      ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
      ('0' + now.getDate()).slice(-2) + ' ' +
      ('0' + now.getHours()).slice(-2) + ':' +
      ('0' + now.getMinutes()).slice(-2) + ':' +
      ('0' + now.getSeconds()).slice(-2)
    if (date === 'full') {
      // e.g. 2021-03-14 16:03:00
      return full
    } else if (date === 'date') {
      return full.split(' ')[0]
    } else {
      // e.g. 16:03:00
      return full.split(' ')[1]
    }
  }

  insertChannel (params) {
    this.db.run(this.insertIntoChannelSQL, {
      ...{
        $name: '',
        $host: '',
        $password: '',
        $type: 0  // 0 -> 1 on 1, 1 -> group, 2 -> broadcast channel
      },
      ...params
    }, {}, (err) => {
      if (err) {
        if (this.retry < 3) {
          const timeout = parseInt(Math.random() * 1000)
          console.warn(err, `${timeout}ms 後重試新增頻道 ... `)
          setTimeout(this.insertMessage.bind(this, params), timeout)
          this.retry++
        } else {
          console.error(err, `插入新頻道失敗 "${params.$name}"`)
        }
      } else {
        this.retry = 0
      }
    })
  }

  getBroadcastChannel (callback) {
    this.db.each("SELECT * FROM channel WHERE type = '2' ORDER BY name, id", callback)
  }

  getChannelByHost (userId, callback) {
    this.db.each(`SELECT * FROM channel WHERE host = '${userId}' ORDER BY name, id`, callback)
  }

  getChannelByParticipant (userId, callback) {
    this.db.each(`
      SELECT * FROM channel WHERE id IN (SELECT DISTINCT channel_id FROM participant WHERE user_id ='${userId}')
      ORDER BY name, id
    `, callback)
  }

  getParticipantByChannel (channelId, callback) {
    this.db.each(`
      SELECT * FROM participant WHERE channel_id = '${channelId}'
      ORDER BY user_id
    `, callback)
  }
}
module.exports = ChannelDB