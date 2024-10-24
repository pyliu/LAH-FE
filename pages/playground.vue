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
  lah-flex-item-group
    //- lah-mgmt-board-reg-case-fix-RM39G(case-id="113-HBA1-018240")
    //- lah-monitor-board-srmas-weather
    .col-md-4(key="mb-testdb"): lah-monitor-board-sms-notify(footer)
    //- .col-md-4(key="mb-sms"): lah-monitor-board-sms(footer)
    //- .col-md-4(key="office-down"): lah-office-down-timeline.card-body-fixed-height-3
    //- .col-md-4(key="mb-srmas"): lah-monitor-board-srmas.card-body-fixed-height-3
    //- .col-md-4(key="site-tw"): b-card.border-0.card-body-fixed-height-3(no-body)
    //-   lah-monitor-board-site-tw
    .col-md-4(key="lah-clock"): b-card.card-body-fixed-height-3.center-h100
      lah-clock

    //- b-card
    //-   lah-period-stats-chart
    //- b-card
    //-   lah-message.mr-1.mb-1(
    //-     ref="gm",
    //-     message="NUXT.js是一個基於Vue.js的開源JavaScript框架，用於構建現代化的單頁應用程序（SPA）和通用應用程序（Universal App）。它提供了一個簡單而強大的開發環境，使開發人員能夠快速構建出具有高性能和良好用戶體驗的應用程序。NUXT.js支持服務器端渲染（SSR），具有路由管理、自動代碼分割、熱模塊替換（HMR）等功能，並提供結構清晰的文件夾結構和靈活的配置文件。總結來說，NUXT.js是一個功能豐富且易於使用的框架，適合開發各種類型的應用程序。",
    //-     border,
    //-     size="h5",
    //-     variant="dark",
    //-     border-variant="secondary",
    //-     close-variant="danger",
    //-     shadow,
    //-     pos="br",
    //-     auto-hide,
    //-     auto-hide-time="3000",
    //-     @close="$refs.gm.open()"
    //-   )
    //-   lah-badge-latest-certno(size="lg")
    //-   lah-badge-ip(ip="220.1.34.17", port="8082", period="15000", size="lg")
    //-   lah-badge-ip.ml-1(ip="220.1.34.233", :badge="false", size="lg")
    //-   lah-badge-site-status.ml-1(watch-site="HB", period="60000")
    //-   lah-badge-site-status.ml-1(watch-site="HI", period="60000")
    //- b-card
    //-   template(#header) 設定檔測試
    //-   div {{ openNewsData }}
    //-   p {{ $config.baseURL }}
    //-   b-table(striped, hover, :items="configs")
    //- b-card.p-2(no-body)
    //-   template(#header) WEBSOCKET測試
    //-   b-input-group.mb-2
    //-     b-input(v-model="text", @keyup.enter="send")
    //-     lah-button(@click="send", brand) 傳送
    //-   .msg(ref="box", v-if="websocket !== undefined")
    //-     .msg-item.d-flex.my-2(v-for="item in list", :class="msgClass(item)")
    //-       p(v-if="item.type === 'remote'") {{ item.text }}
    //-       .time.s-50.mx-1.text-muted {{ item.time }}
    //-       p(v-if="item.type === 'mine'") {{ item.text }}
    //-   h5.center(v-else): lah-fa-icon(
    //-     icon="exclamation-circle",
    //-     variant="primary"
    //-   ).
    //-     請確認 {{ $config.websocketHost }}:{{ $config.websocketPort }} 可連線
    //- b-card
    //-   template(#header) 儲存BLOB影像測試
    //-   .d-flex
    //-     b-file(
    //-       v-model="image",
    //-       placeholder="*.jpg",
    //-       drop-placeholder="放開以設定上傳檔案",
    //-       accept="image/*"
    //-     ): template(
    //-       slot="file-name",
    //-       slot-scope="{ names }"
    //-     ): b-badge(
    //-       variant="primary"
    //-     ) {{ names[0] }}
    //-     lah-button.ml-1(
    //-       icon="upload",
    //-       variant="outline-primary",
    //-       title="上傳",
    //-       @click="upload",
    //-       :disabled="$utils.empty(image)",
    //-       no-icon-gutter
    //-     )
    //- b-card
    //-   template(#header) BASE64影像上傳測試
    //-   .d-flex
    //-     b-file(
    //-       v-model="image",
    //-       placeholder="*.jpg",
    //-       drop-placeholder="放開以設定上傳檔案",
    //-       accept="image/*"
    //-     ): template(
    //-       slot="file-name",
    //-       slot-scope="{ names }"
    //-     ): b-badge(
    //-       variant="primary"
    //-     ) {{ names[0] }}
    //-     lah-button.ml-1(
    //-       icon="upload",
    //-       variant="outline-dark",
    //-       title="上傳",
    //-       @click="uploadBase64",
    //-       :disabled="$utils.empty(image)",
    //-       no-icon-gutter
    //-     )
    //-   b-img.my-1(:src="this.base64image", thumbnail, fluid)
    //- b-card
    //-   template(#header) lah-image-upload 測試
    //-   lah-button.ml-1(
    //-     icon="image",
    //-     variant="outline-success",
    //-     title="打開上傳介面",
    //-     @click="openUpload",
    //-     no-icon-gutter
    //-   )
    //- b-card
    //-   template(#header): .d-flex
    //-    .text-nowrap.my-auto.mr-1 lah-chart 測試
    //-    b-select.ml-auto(v-model="chartType", :options="chartOpts")
    //-   lah-chart(
    //-     ref="chart",
    //-     label="連線數"
    //-     :type="chartType"
    //-   )
    .col-md-4(key="date-fns"): b-card
      template(#header): .d-flex: .text-nowrap.my-auto date-fns 測試
      ul
        li 西元：{{ $utils.now() }} / {{ $utils.phpTsToAdDateStr(+new Date() / 1000) }}
        li 民國：{{ $utils.now('tw') }} / {{ $utils.twDateStr(new Date()) }}
        li {{ formatDate(+new Date()) }} - {{ formatDate(new Date(2015, 8, 1)) }}: 離開 Y! {{ dateDistance }}
        li this.$utils.formatDistanceToNow() 👉 {{ $utils.formatDistanceToNow() }}

    .col-md-4(key="content-test"): b-card
      template(#header): .d-flex: .text-nowrap.my-auto $content 測試
      nuxt-content(:document="testContent")
    .col-md-4(key="timeline-test"): b-card
      template(#header): .d-flex: .text-nowrap.my-auto b-timeline 測試
      lah-notification-timeline(
        :items="timelineItems",
        :loading="isBusy"
      )

    .col-md-4(key="rare-word"): b-card
      template(#header): .d-flex: .text-nowrap.my-auto 罕用字測試
      span       

</template>

<script>
import { format, formatDistance, formatDistanceToNow } from 'date-fns';
// Require Esperanto locale
import { zhTW } from 'date-fns/locale';

export default {
  // middleware: ['isAdmin'],
  async asyncData ({ $axios, $content }) {
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
    const testContent = await $content('test').fetch()
    return {
      testContent,
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
    chartType: 'line',
    chartOpts: [
      'line',
      'bar',
      'pie',
      'polarArea',
      'doughnut',
      'radar'
    ],
    timelineItems: [],
    queryData: [],
    queryMessage: ''
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
    },
    dateDistance () {
      const result = formatDistance(
        new Date(),
        new Date(2016, 8, 1),
        { locale: zhTW } // Pass the locale as an option
      )
      return result
    },
    dateDistanceToNow () {
      return formatDistanceToNow(+new Date() - 1000, {
        addSuffix: true,
        includeSeconds: true,
        locale: zhTW
      })
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
    // this.chartLoadData()
  },
  mounted () {
    this.loadAnnouncements()
    console.warn('testContent', this.testContent)
  },
  methods: {
    formatDate (d) {
      return format(d, 'yyyy-LL-dd HH:mm:ss', {
        locale: zhTW
      })
    },
    chartLoadData () {
      this.chartItems.length = 0
      this.$refs.chart?.reset()
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_latest_ap_conn',
          ap_ip: '220.1.34.161',
          all: true
        })
        .then(({ data }) => {
          // console.warn(data)
          if (data.data_count && data.data_count > 0) {
            const plus10 = []
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
                // const value = item.count
                let found = this.chartItems.find((item) => {
                  return item.x === text
                })
                if (found) {
                  found.y += this.$utils.rand(255)
                } else {
                  this.chartItems.push({ x: text, y: this.$utils.rand(255) })
                }

                found = plus10.find((item) => {
                  return item.x === text
                })
                if (found) {
                  found.y += this.$utils.rand(255)
                } else {
                  plus10.push({ x: text, y: this.$utils.rand(255), color: { R: this.$utils.rand(255), G: this.$utils.rand(255), B: this.$utils.rand(255) } })
                }
              } else {
                this.$utils.warn('item.est_ip 不在 ipMap 內無法新增至 chartItems 裡', item)
              }
            })
            this.$refs.chart?.addDataset(this.chartItems, 'LINE', 'line')
            this.$refs.chart?.addDataset(this.chartItems, 'BAR', 'bar')
            this.$refs.chart?.addDataset(plus10, 'LINE2', 'line')
            this.$refs.chart?.rebuild()
            this.timeout(() => {
              this.$refs.chart?.addData({ x: 'NEW', y: this.$utils.rand(255) }, 'LINE2', 'line')
              this.$refs.chart?.removeDataset('BAR')
            }, 5 * 1000)
          }
        })
        .catch((err) => {
          this.error = err
        })
        .finally(() => {
          // this.isBusy = false;
          // reload every 15s
          this.timeout(this.chartLoadData, 15 * 60 * 1000).then((handler) => { this.reload_timer = handler })
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
    },
    ping () {
      this.isBusy = true
      this.$axios
        .post(this.$consts.API.JSON.IP, {
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
    loadAnnouncements () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
        type: 'get_notification',
        channel: 'announcement',
        limit: 3
      }).then(({ data }) => {
        console.warn(data)
        if (this.$utils.statusCheck(data.status)) {
          this.timelineItems = [...this.timelineItems, ...data.raw]
        } else {
          this.$utils.warn(data.message)
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  }
}
</script>

<style scoped lang="scss">
.col-md-4 {
  margin-bottom: 1.25rem;
}
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
