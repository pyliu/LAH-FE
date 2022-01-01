<template lang="pug">
div: client-only
  lah-header: .d-flex.justify-content-between.w-100
    .d-flex
      .my-auto 測試頁面
      lah-button(
        icon="info",
        action="bounce",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="showModalById('help-modal')",
        title="說明"
      )
      lah-help-modal(:modal-id="'help-modal'"): ul
        li.text-danger(v-if="websocket === undefined") 請確認 {{ $config.websocketHost }}:{{ $config.websocketPort }} 可連線
        li WEBSOCKET_HOST：伺服器IP
        li WEBSOCKET_PORT：伺服器PORT
        li 修改前端伺服器之「.env」檔案已變更上開設定值
    .d-flex
  b-card-group(columns)
    b-card
      template(#header) 設定檔測試
      div {{ openNewsData }}
      p {{ $config.baseURL }}
      b-table(striped, hover, :items="configs")
    b-card.p-2(no-body)
      template(#header) WEBSOCKET測試
      b-input-group.mb-2
        b-input(v-model="text", @keyup.enter="send")
        lah-button(@click="send", icon="telegram-plane", brand) 傳送
      .msg(ref="box", v-if="websocket !== undefined")
        .msg-item.d-flex.my-2(v-for="item in list", :class="msgClass(item)")
          p(v-if="item.type === 'remote'") {{ item.text }}
          .time.s-50.mx-1.text-muted {{ item.time }}
          p(v-if="item.type === 'mine'") {{ item.text }}
      h5.center(v-else): lah-fa-icon(
        icon="exclamation-circle",
        variant="primary"
      ).
        請確認 {{ $config.websocketHost }}:{{ $config.websocketPort }} 可連線
    b-card
      template(#header) 儲存BLOB影像測試
      .d-flex
        b-file(
          v-model="image",
          placeholder="*.jpg",
          drop-placeholder="放開以設定上傳檔案",
          accept="image/*"
        ): template(
          slot="file-name",
          slot-scope="{ names }"
        ): b-badge(
          variant="primary"
        ) {{ names[0] }}
        lah-button.ml-1(
          icon="upload",
          variant="outline-primary",
          title="上傳",
          @click="upload",
          :disabled="$utils.empty(image)",
          no-icon-gutter
        )
    b-card
      template(#header) BASE64影像上傳測試
      .d-flex
        b-file(
          v-model="image",
          placeholder="*.jpg",
          drop-placeholder="放開以設定上傳檔案",
          accept="image/*"
        ): template(
          slot="file-name",
          slot-scope="{ names }"
        ): b-badge(
          variant="primary"
        ) {{ names[0] }}
        lah-button.ml-1(
          icon="upload",
          variant="outline-dark",
          title="上傳",
          @click="uploadBase64",
          :disabled="$utils.empty(image)",
          no-icon-gutter
        )
      b-img.my-1(:src="this.base64image", thumbnail, fluid)
    b-card
      template(#header) lah-image-upload 測試
      lah-button.ml-1(
        icon="image",
        variant="outline-success",
        title="打開上傳介面",
        @click="openUpload",
        no-icon-gutter
      )
    b-card
      template(#header) lah-chart 測試
      lah-chart(
        ref="chart",
        label="test",
        :items="chartItems",
        :type="chartType",
        :bg-color="chartBgColor"
      )
</template>

<script>
export default {
  // middleware: ['isAdmin'],
  async asyncData ({ $axios }) {
    // SSR: returned object will replace the data inside "data" before rendering
    // http://220.1.34.161/LandY0/open_news/queryNews?newsCategory=01
    // return await $axios.get('http://220.1.34.161/LandY0/open_news/queryNews?newsCategory=01', { timeout: 400 })
    // return await $axios.get('http://220.1.34.161/LandY0/open_news/queryNews?newsCategory=01', { timeout: 400 }).then(({ data }) => {
    //   return {openNewsData: data.openNewsData}
    // })
    const now = new Date()
    const time =
      ('0' + now.getHours()).slice(-2) +
      ':' +
      ('0' + now.getMinutes()).slice(-2) +
      ':' +
      ('0' + now.getSeconds()).slice(-2)
    return {
      list: [{ type: 'remote', text: '準備中 ... ', time }]
      // items: [
      //   ['桃園所', 40],
      //   ['中壢所', 16],
      //   ['大溪所', 0],
      //   ['楊梅所', 1],
      //   ['蘆竹所', 1],
      //   ['八德所', 6],
      //   ['平鎮所', 0],
      //   ['龜山所', 26],
      //   ['地政局', 0]
      // ],
    }
  },
  data: () => ({
    pid: 'A123456789',
    json: undefined,
    openNewsData: undefined,
    text: '',
    websocket: undefined,
    image: undefined,
    base64image: '',
    chartItems: [],
    chartType: 'line'
  }),
  head: {
    title: '測試-桃園市地政局'
  },
  computed: {
    // isTableReady () { return this.json && this.json.baked && this.json.baked.length > 0 ? true : false }
    configs () {
      return Object.keys(this.$config).map(key => [key, this.$config[key]])
    },
    uploadUrl () {
      return `/img${this.$consts.API.FILE.IMAGE}`
    },
    uploadBase64Url () {
      return `${this.$consts.API.FILE.BASE64}`
    }
  },
  watch: {
    list () {
      // watch list to display the latest message
      // Vue VDOME workaround ... to display the last message
      this.$nextTick(() => {
        this.$refs.box.scrollTop = this.$refs.box.scrollHeight
      })
    }
  },
  created () {
    this.chartLoadData()
  },
  mounted () {
    this.isBusy = true
    this.$axios
      .post(this.$consts.API.JSON.QUERY, {
        type: 'ping',
        ip: this.$config.websocketHost,
        port: this.$config.websocketPort
      })
      .then(({ data }) => {
        this.pingLatency = data.latency
        this.pingMessage = data.message
        if (this.$utils.statusCheck(data.status)) {
          this.connect()
        } else {
          this.notify(data.message, { type: 'warning' })
        }
      })
      .catch((err) => {
        this.error = err
      })
      .finally(() => {
        this.isBusy = false
      })
  },
  methods: {
    chartBgColor (item, opacity) {
      switch (item.x) {
        case '地政局':
          return `rgb(207, 207, 207, ${opacity})` // H0
        case '桃園所':
          return `rgb(254, 185, 180, ${opacity})` // HA
        case '中壢所':
          return `rgb(125, 199, 80, ${opacity})` // HB
        case '大溪所':
          return `rgb(255, 251, 185, ${opacity})` // HC
        case '楊梅所':
          return `rgb(0, 157, 122, ${opacity})` // HD
        case '蘆竹所':
          return `rgb(33, 137, 227, ${opacity})` // HE
        case '八德所':
          return `rgb(181, 92, 66, ${opacity})` // HF
        case '平鎮所':
          return `rgb(195, 42, 84, ${opacity})` // HG
        case '龜山所':
          return `rgb(136, 72, 152, ${opacity})` // HH
        default:
          return `rgb(${this.$utils.rand(255)}, ${this.$utils.rand(255)}, ${this.$utils.rand(255)}, ${opacity})`
      }
    },
    chartLoadData () {
      this.chartItems.length = 0
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_latest_ap_conn',
          ap_ip: '220.1.34.161',
          all: true
        })
        .then(({ data }) => {
          // console.warn(data)
          if (data.data_count && data.data_count > 0) {
            data.raw.forEach((item, idx, array) => {
              /*
                  item = {
                      log_time: '20201005181631',
                      ap_ip: '220.1.34.161',
                      est_ip: '220.1.35.36',
                      count: '2',
                      batch: '490',
                      name: '資訊主機'
                  }
              */
              const text = this.$consts.ipMap.get(item.est_ip)?.name
              if (text) {
                const value = item.count
                const found = this.chartItems.find((item) => {
                  return item.x === text
                })
                if (found) {
                  found.y += value
                } else {
                  this.chartItems.push({ x: text, y: value })
                }
              } else {
                this.$utils.warn('item.est_ip 不在 ipMap 內無法新增至 chartItems 裡', item)
              }
            })
            // this.chartItems = [...items]
            this.$refs.chart?.buildChart()
          }
        })
        .catch((err) => {
          this.error = err
        })
        .finally(() => {
          // this.isBusy = false;
          // reload every 15s
          this.reload_timer = this.timeout(this.chartLoadData, 15 * 60 * 1000)
          this.$nextTick(() => {
            this.$refs.chart?.update()
          })
        })
    },
    openUpload () {
      this.modal(
        this.$createElement('lah-image-upload', {
          on: {
            publish: (base64) => {
              this.$utils.log(base64)
              this.hideModalById('upload-image-modal')
            }
          }
        }),
        {
          id: 'upload-image-modal',
          size: 'md',
          title: '上傳圖片管理'
        }
      )
    },
    upload () {
      // image
      this.isBusy = true
      const formData = new FormData()
      formData.append('file', this.image)
      formData.append('note', '測試')
      formData.append('width', 960)
      formData.append('height', 540)
      formData.append('quality', 75)
      this.$upload
        .post(this.uploadUrl, formData)
        .then(({ data }) => {
          const opts = { type: 'warning', title: '上傳圖檔結果通知' }
          if (this.$utils.statusCheck(data.status)) {
            opts.type = 'success'
          }
          this.notify(data.message, opts)
        })
        .catch((err) => {
          this.$utils.error(err)
        })
        .finally(() => {
          this.isBusy = false
        })
    },
    uploadBase64 () {
      // image
      this.isBusy = true
      const formData = new FormData()
      formData.append('file', this.image)
      formData.append('width', 320)
      formData.append('height', 240)
      formData.append('quality', 75)

      console.log(this.image)

      this.$upload
        .post(this.uploadBase64Url, formData)
        .then(({ data }) => {
          this.base64image = data.uri + data.encoded
          console.log(this.base64image)
          const opts = { type: 'warning', title: '上傳圖檔結果通知' }
          if (this.$utils.statusCheck(data.status)) {
            opts.type = 'success'
          }
          this.notify(data.message, opts)
        })
        .catch((err) => {
          this.$utils.error(err)
        })
        .finally(() => {
          this.isBusy = false
        })
    },
    clickCountdownButton () {
      this.$utils.log(this.$el)
      this.notify('click countdown button!')
      this.endCountdownButton()
    },
    endCountdownButton () {
      this.$refs.countdown.resetCountdown()
      this.$refs.countdown.startCountdown()
    },
    msgClass (item) {
      return [
        item.type === 'mine' ? 'justify-content-end' : 'justify-content-start',
        item.type
      ]
    },
    time () {
      const now = new Date()
      const time =
        ('0' + now.getHours()).slice(-2) +
        ':' +
        ('0' + now.getMinutes()).slice(-2) +
        ':' +
        ('0' + now.getSeconds()).slice(-2)
      return time
    },
    status (code) {
      switch (code) {
        case 0:
          return '連線中'
        case 1:
          return '已連線'
        case 2:
          return '關閉中'
        case 3:
          return '已關閉'
        default:
          return `未定義的代碼(${code})`
      }
    },
    send () {
      /**
       * readyState attr
       * CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3
       */
      if (this.websocket && this.websocket.readyState !== 1) {
        this.list = [
          ...this.list,
          {
            type: 'remote',
            text: `伺服器連線${this.status(this.websocket.readyState)} ...`,
            time: this.time()
          }
        ]
        this.websocket.readyState === 3 && this.connect()
      }

      if (this.websocket && this.websocket.readyState === 1) {
        this.list = [
          ...this.list,
          { type: 'mine', text: this.text, time: this.time() }
        ]

        if (!this.$utils.empty(this.text)) {
          // DEV
          this.websocket.send(
            this.packMessage(this.text, { channel: '10013859' })
          )
          // REAL DEV
          this.websocket.send(
            this.packMessage(this.text, { channel: this.user.id })
          )
          // received remote text clear mine
          this.text = ''
        }
      }
    },
    packMessage (text, opts = {}) {
      const now = this.$utils.now().split(' ')
      return JSON.stringify({
        ...{
          type: 'mine',
          sender: this.user.id,
          date: now[0],
          time: now[1],
          title: 'dontcare',
          from: this.ip,
          message: text,
          channel: this.user.id
        },
        ...opts
      })
    },
    connect () {
      this.websocket = new WebSocket(
        `ws://${this.$config.websocketHost}:${this.$config.websocketPort}`
      )
      this.websocket.onopen = (e) => {
        this.list = [
          ...this.list,
          {
            type: 'remote',
            text: `連結 WebSocket 伺服器成功(ws://${this.$config.websocketHost}:${this.$config.websocketPort})`,
            time: this.time()
          }
        ]
        // to register in wss
        const now = this.$utils.now().split(' ')
        const jsonString = JSON.stringify({
          type: 'command',
          sender: this.user.id,
          date: now[0],
          time: now[1],
          message: JSON.stringify({
            command: 'register',
            ip: this.ip,
            domain: 'HA.CENWEB.LAND.MOI',
            userid: this.user.id,
            username: '測試者',
            dept: 'inf'
          }),
          channel: 'system'
        })
        this.websocket.send(jsonString)
      }
      this.websocket.onclose = (e) => {
        this.list = [
          ...this.list,
          {
            type: 'remote',
            text: 'WebSocket 伺服器連線已關閉',
            time: this.time()
          }
        ]
      }
      this.websocket.onerror = () => {
        this.list = [
          ...this.list,
          {
            type: 'remote',
            text: 'WebSocket 伺服器連線出錯',
            time: this.time()
          }
        ]
      }
      this.websocket.onmessage = (e) => {
        const response = JSON.parse(e.data)
        if (response.type === 'ack') {
          response.message = `ACK(${response.id}, ${response.channel})`
        }
        this.list = [...this.list, { type: 'remote', ...response }]
      }
    }
  }
}
</script>

<style scoped lang="scss">
.msg {
  width: 100%;
  height: 400px;
  overflow: auto;
  padding: 5px;
  border: 1px solid gray;
  display: inline-block;
  margin-bottom: 5px;

  .msg-item {
    position: relative;
    overflow: hidden;
    p {
      display: inline-block;
      border-radius: 10px;
      background: #3c3d5a;
      color: white;
      padding: 2px 12px;
      margin: 0 0 2px 0;
      max-width: 60%;
      text-align: left;
      box-sizing: border-box;
    }

    &.mine {
      p {
        background: rgb(2, 182, 32);
        color: white;
      }
    }
    .time {
      display: inline-block;
      align-self: flex-end;
    }
  }
}
</style>
