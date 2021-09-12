<template lang="pug">
  div: client-only
    lah-header: .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 測試頁面
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'"): ul
          li.text-danger(v-if="websocket === undefined") 請確認 {{ $config.websocketHost }}:{{ $config.websocketPort }} 可連線
          li WEBSOCKET_HOST：伺服器IP
          li WEBSOCKET_PORT：伺服器PORT
          li 修改前端伺服器之「.env」檔案已變更上開設定值
      .d-flex
    b-card-group(columns)
      b-card
        div {{ openNewsData }}
        p {{ $config.baseURL }}
        b-table( striped hover :items="configs" )
      b-card.p-2(no-body)
        b-input-group.mb-2
          b-input(v-model="text" @keyup.enter="send")
          lah-button(@click="send" icon="telegram-plane" brand) 傳送
        .msg(ref="box" v-if="websocket !== undefined")
          .msg-item.d-flex.my-2(v-for="item in list", :class="msgClass(item)")
            p(v-if="item.type === 'remote'") {{ item.text }}
            .time.s-50.mx-1.text-muted {{ item.time }}
            p(v-if="item.type === 'mine'") {{ item.text }}
        h5.center(v-else): lah-fa-icon(icon="exclamation-circle" variant="primary").
          請確認 {{ $config.websocketHost }}:{{ $config.websocketPort }} 可連線
      b-card
        b-file(
          v-model="image"
          placeholder="*.jpg"
          drop-placeholder="放開以設定上傳檔案"
          accept="image/*"
        ): template(slot="file-name" slot-scope="{ names }"): b-badge(variant="primary") {{ names[0] }}
        lah-button(
          icon="upload"
          variant="outline-primary"
          title="上傳"
          @click="upload"
          :disabled="$utils.empty(image)"
          no-icon-gutter
        )
</template>

<script>
export default {
  async asyncData ({ $axios }) {
    // SSR: returned object will replace the data inside "data" before rendering
    // http://220.1.34.161/LandY0/open_news/queryNews?newsCategory=01
    // return await $axios.get('http://220.1.34.161/LandY0/open_news/queryNews?newsCategory=01', { timeout: 400 })
    // return await $axios.get('http://220.1.34.161/LandY0/open_news/queryNews?newsCategory=01', { timeout: 400 }).then(({ data }) => {
    //   return {openNewsData: data.openNewsData}
    // })
    const now = new Date()
    const time = ('0' + now.getHours()).slice(-2) + ':' +
                 ('0' + now.getMinutes()).slice(-2) + ':' +
                 ('0' + now.getSeconds()).slice(-2)
    return {
      list: [
        { type: 'remote', text: '準備中 ... ', time }
      ]
    }
  },
  data: () => ({
    pid: 'A123456789',
    json: undefined,
    openNewsData: undefined,
    text: '',
    websocket: undefined,
    image: undefined
  }),
  fetch () {
  },
  head: {
    title: '測試-桃園市地政局'
  },
  computed: {
    // isTableReady () { return this.json && this.json.baked && this.json.baked.length > 0 ? true : false }
    configs () {
      return Object.keys(this.$config).map(key => [key, this.$config[key]])
    },
    uploadUrl () { return `${this.apiSvrHttpUrl}${this.$consts.API.FILE.IMAGE}` }
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
  mounted () {
    this.isBusy = true
    this.$axios.post(this.$consts.API.JSON.QUERY, {
      type: 'ping',
      ip: this.$config.websocketHost,
      port: this.$config.websocketPort
    }).then(({ data }) => {
      this.pingLatency = data.latency
      this.pingMessage = data.message
      if (this.$utils.statusCheck(data.status)) {
        this.connect()
      } else {
        this.notify(data.message, { type: 'warning' })
      }
    }).catch((err) => {
      this.error = err
    }).finally(() => {
      this.isBusy = false
    })
  },
  methods: {
    upload () {
      // image
      this.isBusy = true
      const formData = new FormData()
      formData.append('file', this.image)
      formData.append('note', '測試')
      formData.append('width', 960)
      formData.append('height', 540)
      formData.append('quality', 75)
      this.$upload.post(this.uploadUrl, formData).then(({ data }) => {
        const opts = { type: 'warning', title: '上傳圖檔結果通知' }
        if (this.$utils.statusCheck(data.status)) {
          opts.type = 'success'
        }
        this.notify(data.message, opts)
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
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
      return [item.type === 'mine' ? 'justify-content-end' : 'justify-content-start', item.type]
    },
    time () {
      const now = new Date()
      const time = ('0' + now.getHours()).slice(-2) + ':' +
                   ('0' + now.getMinutes()).slice(-2) + ':' +
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
        this.list = [...this.list, { type: 'remote', text: `伺服器連線${this.status(this.websocket.readyState)} ...`, time: this.time() }]
        this.websocket.readyState === 3 && this.connect()
      }

      if (this.websocket && this.websocket.readyState === 1) {
        this.list = [...this.list, { type: 'mine', text: this.text, time: this.time() }]
        this.websocket.send(this.text)
        // received remote text clear mine
        this.text = ''
      }
    },
    connect () {
      this.websocket = new WebSocket(`ws://${this.$config.websocketHost}:${this.$config.websocketPort}`)
      this.websocket.onopen = (e) => {
        this.list = [...this.list, { type: 'remote', text: `連結 WebSocket 伺服器成功(ws://${this.$config.websocketHost}:${this.$config.websocketPort})`, time: this.time() }]
      }
      this.websocket.onclose = (e) => {
        this.list = [...this.list, { type: 'remote', text: 'WebSocket 伺服器連線已關閉', time: this.time() }]
      }
      this.websocket.onerror = () => {
        this.list = [...this.list, { type: 'remote', text: 'WebSocket 伺服器連線出錯', time: this.time() }]
      }
      this.websocket.onmessage = (e) => {
        this.list = [...this.list, { type: 'remote', ...JSON.parse(e.data) }]
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
