<template lang="pug">
div
  lah-header
  .msg-container
    .msg(ref="box")
      .msg-item.d-flex.my-2(v-for="item in list", :class="msgClass(item)")
        p(v-if="item.type === 'remote'") {{ item.text }}
        .time.s-50.mx-1.text-muted {{ item.time }}
        p(v-if="item.type === 'mine'") {{ item.text }}
    b-input-group
      b-input(v-model="text" @keyup.enter="sendText")
      lah-button(@click="sendText" icon="telegram-plane" brand) 傳送
</template>

<script>
export default {
  head: {
    title: '測試訊息'
  },
  asyncData ({ store, redirect, error }) {
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
  data: () => ({
    text: ''
  }),
  methods: {
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
      if (window.WebSocket) {
        const ws = new WebSocket("ws://127.0.0.1:8001")
        ws.onopen = (e) => {
          console.log("連結伺服器成功")
          console.log("this.text is", this.text)
          ws.send(this.text)
          callback()
        }
        ws.onclose = function (e) {
          console.log("伺服器關閉")
        }
        ws.onerror = function () {
          console.log("伺服器出錯")
        }
        ws.onmessage = (e) => {
          this.list = [...this.list, { type: "remote", ...JSON.parse(e.data) }]
        }
      }
    },
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
  // mounted() {},
}
</script>

<style scoped lang="scss">
.msg-container {
  margin-top: -67px;
  margin-right: auto;
  margin-left: auto;
  max-width: 480px;
}

.msg {
  width: 100%;
  height: 85vh;
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
      max-width: 70%;
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