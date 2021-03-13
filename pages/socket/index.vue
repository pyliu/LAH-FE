<template lang="pug">
div
  lah-header
  .msg-container
    .msg(ref="box")
      div(v-for="item in list", :class="[item.type, 'msg-item']")
        p {{ item.message }}
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
  },
  data: () => ({
    list: [
      { type: 'robot', message: '您可以輸入訊息了~我會重複您輸入的字串。' }
    ],
    text: ''
  }),
  methods: {
    sendText() {
      this.list = [...this.list, { type: "mine", message: this.text }]
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
          this.list = [...this.list, { type: "robot", message: e.data }]
        }
      }
    },
  },
  watch: {
    list () {
      // watch list to display the latest chat
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
  padding-top: 5px;
  border: 1px solid gray;
  display: inline-block;
  margin-bottom: 6px;

  .msg-item {
    position: relative;
    overflow: hidden;
    p {
      display: inline-block;
      border-radius: 40px;
      background: #3c3d5a;
      color: white;
      float: left;
      padding: 2px 12px;
      margin: 0 0 2px 0;
      max-width: 70%;
      text-align: left;
      box-sizing: border-box;
    }

    &.mine {
      p {
        float: right;
        background: rgb(2, 182, 32);
        color: white;
      }
    }
  }
}
</style>