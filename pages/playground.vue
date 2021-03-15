<template lang="pug">
  div: client-only
    lah-header: .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 測試頁面
        lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'"): ul
          li.text-danger(v-if="ws === undefined") 請確認 {{ $config.websocketHost }}:{{ $config.websocketPort }} 可連線
          li WEBSOCKET_HOST：伺服器IP
          li WEBSOCKET_PORT：伺服器PORT
          li 修改前端伺服器之「.env」檔案已變更上開設定值
      .d-flex
    b-card-group(deck)
      b-card
        div {{ openNewsData }}
        p {{ $config.baseURL }}
        b-table( striped hover :items="configs" )
      b-card.p-2(no-body)
        b-input-group.mb-2
          b-input(v-model="text" @keyup.enter="sendText")
          lah-button(@click="sendText" icon="telegram-plane" brand) 傳送
        .msg(ref="box" v-if="ws !== undefined")
          .msg-item.d-flex.my-2(v-for="item in list", :class="msgClass(item)")
            p(v-if="item.type === 'remote'") {{ item.text }}
            .time.s-50.mx-1.text-muted {{ item.time }}
            p(v-if="item.type === 'mine'") {{ item.text }}
        h5.center(v-else): lah-fa-icon(icon="exclamation-circle" variant="primary").
          請確認 {{ $config.websocketHost }}:{{ $config.websocketPort }} 可連線
</template>

<script>
export default {
  head: {
    title: "測試-桃園市地政局",
  },
  data: () => ({
    pid: 'A123456789',
    json: undefined,
    openNewsData: undefined,
    text: '',
    available: false,
    ws: undefined
  }),
  async asyncData({ $axios }) {
    // SSR: returned object will replace the data inside "data" before rendering
    // http://220.1.35.123/LandY0/open_news/queryNews?newsCategory=01
    // return await $axios.get('http://220.1.35.123/LandY0/open_news/queryNews?newsCategory=01', { timeout: 400 })
    // return await $axios.get('http://220.1.35.123/LandY0/open_news/queryNews?newsCategory=01', { timeout: 400 }).then(({ data }) => {
    //   return {openNewsData: data.openNewsData}
    // })
    const now = new Date()
    const time = ('0' + now.getHours()).slice(-2) + ':' +
                 ('0' + now.getMinutes()).slice(-2) + ':' +
                 ('0' + now.getSeconds()).slice(-2)
    return {
      list: [
        { type: 'remote', text: '您可以輸入訊息了~我會重複您輸入的字串。', time: time }
      ]
    }
  },
  computed: {
    // isTableReady () { return this.json && this.json.baked && this.json.baked.length > 0 ? true : false }
    configs () {
      return Object.keys(this.$config).map((key) => [key, this.$config[key]])
    },
    envs () {
      // return Object.keys(this.env).map((key) => [key, this.env[key]]) || []
    },
    // all () {
    //   return Object.keys(this).map((key) => [key, this[key]])
    // },
  },
  watch: {
    list () {
      // watch list to display the latest message
      // Vue VDOME workaround ... to display the last message
      this.$nextTick(() => {
        this.$refs.box.scrollTop = this.$refs.box.scrollHeight
      })
    },
  },
  methods: {
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
    sendText() {
      const now = new Date()
      const time = ('0' + now.getHours()).slice(-2) + ':' +
                   ('0' + now.getMinutes()).slice(-2) + ':' +
                   ('0' + now.getSeconds()).slice(-2)
      this.list = [...this.list, { type: "mine", text: this.text, time: time }]
      this.backText(() => {
        // received remote text clear mine
        this.text = ''
      })
    },
    backText (callback) {
      if (this.ws) {
        this.ws.send(this.text)
        callback()
        // const ws = new WebSocket(`ws://${this.$config.websocketHost}:${this.$config.websocketPort}`)
        // ws.onopen = (e) => {
        //   console.log(`連結伺服器成功(ws://${this.$config.websocketHost}:${this.$config.websocketPort})`)
        //   ws.send(this.text)
        //   callback()
        // }
        // ws.onclose = function (e) {
        //   console.log("伺服器關閉")
        // }
        // ws.onerror = function () {
        //   console.log("伺服器出錯")
        // }
      }
    },
  },
  fetch () {
  },
  mounted () {
    this.isBusy = true
    this.$axios.post(this.$consts.API.JSON.QUERY, {
      type: "ping",
      ip: this.$config.websocketHost,
      port: this.$config.websocketPort,
    }).then(({ data }) => {
      this.pingLatency = data.latency
      this.pingMessage = data.message
      if (this.$utils.statusCheck(data.status)) {
        this.available = true
        this.ws = new WebSocket(`ws://${this.$config.websocketHost}:${this.$config.websocketPort}`)
        this.ws.onopen = (e) => {
          console.log(`連結伺服器成功(ws://${this.$config.websocketHost}:${this.$config.websocketPort})`)
        }
        this.ws.onclose = function (e) {
          console.log("伺服器關閉")
        }
        this.ws.onerror = function () {
          console.log("伺服器出錯")
        }
        this.ws.onmessage = (e) => {
          this.list = [...this.list, { type: "remote", ...JSON.parse(e.data) }]
        }
      } else {
        this.notify(data.message, { type: "warning" })
      }
    }).catch((err) => {
      this.error = err
    }).finally(() => {
      this.isBusy = false
    })
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
