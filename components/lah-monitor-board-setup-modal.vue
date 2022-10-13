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
  .d-flex.justify-content-end(title="啟用SSL連線至郵件伺服器")
    .mr-1 SSL
    b-checkbox.my-auto(v-model="ssl", switch)
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
  b-list-group(flush): transition-group(name="list"): b-list-group-item(v-for="(msg, idx) in messages" :key="`${idx}_msg`")
    .d-flex.align-items-center
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
    ssl: false,
    messages: [],
    imapOK: false,
    imapTesting: false
  }),
  computed: {
    payload () {
      return {
        MONITOR_MAIL_HOST: this.host,
        MONITOR_MAIL_ACCOUNT: this.account,
        MONITOR_MAIL_PASSWORD: this.password,
        MONITOR_MAIL_SSL: this.ssl
      }
    },
    imapPort () {
      return this.ssl ? 993 : 143
    },
    monitorConfigs () {
      return this.systemConfigs?.monitor
    },
    configsReady () {
      return !this.$utils.empty(this.monitorConfigs)
    }
  },
  watch: {
    host (dontcare) {
      this.addTestHostMessage()
    },
    account (dontcare) {
      this.addTestImapMessage()
    },
    password (dontcare) {
      this.addTestImapMessage()
    },
    ssl (dontcare) {
      this.addTestImapMessage()
    },
    monitorConfigs (dontcare) {
      this.loadConfig()
    },
    configsReady (val) {
      this.isBusy = !val
    }
  },
  created () {
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
    }, 1500)
    this.addTestHostMessage()
  },
  mounted () {
    this.loadConfig()
  },
  methods: {
    show () {
      this.$refs.setupModal?.show()
    },
    hide () {
      this.$refs.setupModal?.hide()
    },
    loadConfig () {
      this.host = this.systemConfigs.monitor?.host
      this.account = this.systemConfigs.monitor?.account
      this.password = this.systemConfigs.monitor?.password
      this.ssl = this.systemConfigs.monitor?.ssl
    },
    addMessage (msg) {
      this.messages.unshift(`${this.$utils.time()} ${msg}`)
    },
    async imapTest () {
      if (this.hostOK && !this.imapTesting) {
        try {
          this.imapOK = false
          this.imapTesting = true
          this.addMessage(`⚙ 測試${this.ssl ? 'SSL' : ''} IMAP 伺服器連線中 ... `)
          const data = await this.post(this.$consts.API.JSON.MONITOR, {
            type: 'imap_open',
            host: this.host,
            account: this.account,
            password: this.password,
            ssl: this.ssl
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
        return `⚠ ${this.host} 無法連線`
      }
      if (this.imapTesting) {
        return `⚠ 測試 ${this.account} IMAP連線 ${this.host} 中 ... `
      }
      return '❌ 未知的錯誤'
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
          port: this.imapPort
        })
        this.hostOK = this.$utils.statusCheck(data.status)
        return `${this.hostOK ? '✅' : '⚠️'} ${data.message} (埠號${this.imapPort})`
      } catch (e) {
        this.$utils.error(e)
        return `❌ ${ip}:${this.imapPort} 測試失敗(${e.message})`
      }
    },
    update () {
      this.quickUpdateConfig(this.payload, () => {
        // also update the store cached data
        /**
         * MONITOR_MAIL_HOST: this.host,
        MONITOR_MAIL_ACCOUNT: this.account,
        MONITOR_MAIL_PASSWORD: this.password,
        MONITOR_MAIL_SSL: this.ssl
         */
        this.$store.commit('systemConfigs', {
          monitor: {
            account: this.payload.MONITOR_MAIL_ACCOUNT,
            host: this.payload.MONITOR_MAIL_HOST,
            password: this.payload.MONITOR_MAIL_PASSWORD,
            ssl: this.payload.MONITOR_MAIL_SSL
          }
        })
        this.hide()
      })
    },
    quickUpdateConfig (configs, callback = undefined, notify = true) {
      this.post(this.$consts.API.JSON.QUERY, {
        type: 'update_configs',
        configs
      }).then((data) => {
        const notifyOpts = { type: 'warning', subtitle: `${Object.keys(configs).length} 筆設定更新` }
        if (this.$utils.statusCheck(data.status)) {
          notifyOpts.type = 'success'
        }
        notify && this.notify(data.message, notifyOpts)
        callback && callback.apply(this)
      }).catch((error) => {
        this.$utils.error(error)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
