<template lang="pug">
b-modal(
  ref="setupModal"
  :hide-footer="hideFooter"
  :centered="centered"
  :size="size"
  :scrollable="scrollable"
  :no-close-on-backdrop="noCloseOnBackdrop"
)
  template(#modal-title): div(v-html="modalTitle")
  b-input-group(prepend="郵件主機", size="lg")
    b-input(v-model="host", title="主機IP", :state="hostOK", placeholder="220.1.3x.xxx", trim)
  b-input-group.my-1(prepend="登入帳號", size="lg")
    b-input(v-model="account", title="登入帳號", placeholder="...取得監控郵件的帳號...",trim)
  b-input-group(prepend="登入密碼", size="lg")
    b-input(v-model="password", type="password", title="登入帳號", placeholder="...取得監控郵件的密碼...", trim)
  .center.my-2: lah-button(
    icon="pen-square",
    variant="outline-primary",
    title="更新",
    size="lg",
    :disabled="isBusy",
    @click="update"
  ) 確定修改
  lah-fa-icon(icon="list-alt", variant="secondary") 連線測試
  b-list-group(flush): b-list-group-item(v-for="(msg, idx) in messages" :key="`${idx}_msg`")
    lah-fa-icon(
      v-if="idx === 0"
      icon="angle-double-right",
      variant="danger",
      action="move-fade-ltr"
    )
    span.ml-1 {{ msg }}
</template>

<script>
export default {
  props: {
    modalTitle: { type: String, default: '智慧監控儀表板設定' },
    size: { type: String, default: 'md' },
    scrollable: { type: Boolean, default: false },
    centered: { type: Boolean, default: false },
    hideFooter: { type: Boolean, default: true },
    noCloseOnBackdrop: { type: Boolean, default: true }
  },
  data: () => ({
    host: '',
    hostOK: false,
    account: '',
    password: '',
    messages: [],
    imapOK: false,
    imapTesting: false
  }),
  computed: {
    payload () {
      return {
        MONITOR_MAIL_HOST: this.host,
        MONITOR_MAIL_ACCOUNT: this.account,
        MONITOR_MAIL_PASSWORD: this.password
      }
    },
    connectionText () {
      return `${this.account}@{${this.host}/novalidate-cert}INBOX`
    }
  },
  watch: {
    systemConfigs (val) {
      this.host = val.monitor?.host
      this.account = val.monitor?.account
      this.password = val.monitor?.password
    },
    host (val) {
      this.addTestHostMessage()
    },
    account (val) {
      this.addTestImapMessage()
    },
    password (val) {
      this.addTestImapMessage()
    }
  },
  created () {
    this.host = this.systemConfigs.monitor?.host
    this.account = this.systemConfigs.monitor?.account
    this.password = this.systemConfigs.monitor?.password
    this.addTestHostMessage = this.$utils.debounce(() => {
      this.ping(this.host).then((msg) => {
        this.addMessage(msg)
      }).catch((err) => {
        this.addMessage(err)
      })
    }, 1000)
    this.addTestImapMessage = this.$utils.debounce(() => {
      this.imapTest().then((msg) => {
        this.addMessage(msg)
      }).catch((err) => {
        this.addMessage(err)
      })
    }, 3000)
    this.addTestHostMessage()
  },
  methods: {
    show () {
      this.$refs.setupModal?.show()
    },
    hide () {
      this.$refs.setupModal?.hide()
    },
    addMessage (msg) {
      this.messages.unshift(`${this.$utils.time()} ${msg}`)
    },
    async imapTest () {
      if (this.hostOK && !this.imapTesting) {
        try {
          this.imapOK = false
          this.imapTesting = true
          this.addMessage(`👉 測試 ${this.connectionText} 連線中 ... `)
          const { data } = await this.$axios.post(this.$consts.API.JSON.MONITOR, {
            type: 'imap_open',
            host: this.host,
            account: this.account,
            password: this.password
          })
          this.imapOK = this.$utils.statusCheck(data.status)
          return `${this.imapOK ? '✅' : '⚠️'} ${data.message}`
        } catch (e) {
          this.$utils.error(e)
          return `❌ IMAP測試失敗(${e.message})`
        } finally {
          this.imapTesting = false
        }
      }
      if (!this.hostOK) {
        return `${this.host} 無法連線 ... ❗`
      }
      if (this.imapTesting) {
        return `測試 ${this.account} IMAP連線 ${this.host} 中 ... 🚧`
      }
      return '未知的錯誤'
    },
    async ping (ip) {
      this.hostOK = false
      if (!this.$utils.isIPv4(ip)) {
        return '🚩郵件主機必須為正確的IPv4位址'
      }
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.IP, {
          type: 'ping',
          ip,
          port: 143
        })
        this.hostOK = this.$utils.statusCheck(data.status)
        return `${this.hostOK ? '✅' : '⚠️'} ${data.message} (埠號143)`
      } catch (e) {
        this.$utils.error(e)
        return `❌ ${ip}:143 測試失敗(${e.message})`
      }
    },
    update () {
      this.quickUpdateConfig(this.payload, () => {
        // also update the store cached data
        this.$store.commit('systemConfigs', this.payload)
        this.hide()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
