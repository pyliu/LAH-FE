<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    b-button-group.ml-auto(size="sm")
      //- lah-button(
      //-   v-if="!footer"
      //-   icon="sync-alt",
      //-   action="ld-cycle",
      //-   variant="outline-secondary",
      //-   no-border,
      //-   no-icon-gutter,
      //-   @click="reload",
      //-   :title="`上次更新時間 ${updated}`",
      //-   :disabled="fetchingMonitorMail"
      //- )
      //- lah-button(
      //-   icon="external-link-alt",
      //-   variant="outline-primary",
      //-   no-border,
      //-   no-icon-gutter,
      //-   @click="popupMessages('subject', 'Daily Email from NMC', 7)",
      //-   title="讀取7天內訊息"
      //- )
      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="說明"
      )
    lah-help-modal(ref="help", :modal-title="`${header} 監控說明`")
      ul
        li 測試 WEBSOCKET 用
      hr
  slot
  .d-flex
    b-input(v-model="file")
    lah-button.ml-1(@click="getFile") GET
  lah-fa-icon.mt-2(icon="message", regular) {{ message }}
  //- template(#footer, v-if="footer"): client-only: lah-monitor-board-footer(
  //-   ref="footer"
  //-   :reload-ms="reloadMs",
  //-   :busy="isBusy",
  //-   :fetch="$fetch",
  //-   :reload="reload",
  //-   :fetch-state="fetchingState",
  //-   :update-time="updated"
  //- )
</template>

<script>
import FileSaver from 'file-saver';
export default {
  name: 'LahMonitorBoardWsTest',
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'WebSocket 測試',
    websocket: null,
    message: '',
    file: 'r:\\exchange\\BALABALA.pdf'
  }),
  computed: {
    light () {
      return 'gray'
    },
    border () { return '' },
    attentionCss () { return [] },
    connected () {
      return this.websocket !== null && this.websocket.readyState === WebSocket.OPEN
    }
  },
  watch: {
    file (val) {
      console.warn(val)
    }
  },
  mounted () {},
  methods: {
    connect () {
      return new Promise((resolve, reject) => {
        try {
          this.websocket && this.websocket.close()
          this.websocket = new WebSocket('ws://127.0.0.1:8082')
          this.websocket.onopen = (e) => {
            console.log('websocket opened!')
            resolve('Connection Opened')
          }
          this.websocket.onclose = () => {
            console.log('websocket closed!')
          }
          this.websocket.onerror = (e) => {
            console.log(e)
          }
          this.websocket.onmessage = (e) => {
            const response = JSON.parse(e.data)
            if (
              response.command === '@read_file_ack' &&
              response.success &&
              response.payload.binary
            ) {
              // Binary data received
              console.log('Binary data received!')
              this.message = response.payload.message
              // Decode the Base64 data into a Blob
              const binaryString = atob(response.payload.data)
              const arrayBuffer = new Uint8Array(binaryString.split('').map(char => char.charCodeAt(0)))
              const blob = new Blob([arrayBuffer], { type: 'application/pdf' }) // Adjust the MIME type as needed
              // Process the binary data using FileSaver.js
              FileSaver.saveAs(blob, response.payload.filename, { type: response.payload.mime })
            } else {
              // Text data received
              console.log('Text data received:', response)
              console.log(response.payload)
              this.message = response.payload.message
            }
          }
          this.websocket.onping = (e) => {
            this.message = `PING: ${this.$utils.now()}`
          }
          this.websocket.onpong = (e) => {
            this.message = `PONG: ${this.$utils.now()}`
          }
        } catch (e) {
          reject(e)
        }
      })
    },
    send () {
      const jsonString = JSON.stringify({
        command: '@read_file',
        timestamp: +new Date(),
        payload: {
          path: this.file,
          channel: 'system'
        }
      })
      this.websocket.send(jsonString)
    },
    getFile () {
      if (this.connected) {
        this.send()
      } else {
        this.connect().then(() => {
          this.send()
        }).catch((e) => {
          console.warn(e)
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
