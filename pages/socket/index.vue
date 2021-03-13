<template lang="pug">
.test3
  client-only
    .msg(ref="box")
      p(v-for="item in list", :class="[item.type, 'msg-item']")
        p {{ item.content }}
    .input-group
      input(type="text", v-model="contentText")
      button(@click="sendText") 傳送
</template>

<script>
export default {
  name: "index3",
  data() {
    return {
      list: [
        { type: '', content: 'test1'}
      ], //聊天記錄的陣列
      contentText: "", //input輸入的值
    }
  },
  methods: {
    //傳送聊天資訊
    sendText() {
      this.list = [...this.list, { type: "mine", content: this.contentText }] //通過type欄位進行區分是自己（mine）發的還是系統（robot）返回的
      this.backText(() => {
        this.contentText = "" //加回撥在得到返回資料的時候清除輸入框的內容
      })
    },
    backText (callback) {
      if (window.WebSocket) {
        const that = this
        const ws = new WebSocket("ws://127.0.0.1:8001")
        ws.onopen = function (e) {
          console.log("連結伺服器成功")
          console.log("that.contentText is", that.contentText)
          ws.send(that.contentText)
          callback()
        }
        ws.onclose = function (e) {
          console.log("伺服器關閉")
        }
        ws.onerror = function () {
          console.log("伺服器出錯")
        }
        ws.onmessage = function (e) {
          that.list = [...that.list, { type: "robot", content: e.data }]
        }
      }
    },
  },
  watch: {
    //監聽list,當有修改的時候進行p的螢幕捲動，確保能看到最新的聊天
    list () {
      setTimeout(() => {
        this.$refs.box.scrollTop = this.$refs.box.scrollHeight
      }, 0)
      //加setTimeout的原因：由於vue採用虛擬dom，我每次生成新的訊息時獲取到的p的scrollHeight的值是生成新訊息之前的值，所以造成每次都是最新的那條訊息被隱藏掉了
    },
  },
  mounted() {},
}
</script>

<style scoped lang="scss">
.test3 {
  text-align: center;
}

.msg {
  width: 100px;
  height: 100px;
  overflow: auto;
  padding-top: 5px;
  border: 1px solid red;
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
        background: aquamarine;
        color: white;
      }
    }
  }
}
</style>