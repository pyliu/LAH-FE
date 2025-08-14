
export default {
  emit: ['light-update', 'mail-checked'],
  name: 'lahMonitorBoardBase',
  fetchOnServer: false,
  props: {
    enableAttention: { type: Boolean, default: false }
  },
  data: () => ({
    header: '監控儀表板BASE',
    messages: [],
    updated: '',
    reloadMs: 10 * 60 * 1000,
    reloadTimer: null,
    resetTimer: null,
    lastFetchTimestamp: 0,
    fetchingState: '',
    isDestroyed: false
  }),
  fetch () {
    const nowTs = this.$utils.nowTs()
    if (this.needRefetch) {
      this.load(this.fetchType, this.fetchKeyword, this.fetchDay, this.fetchConvert)
        .then((data) => {
          // successful loaded
          this.lastFetchTimestamp = nowTs
          this.fetchingState = '✔ 已更新'
        })
        .catch((e) => {
          this.$utils.warn(e)
        }).finally(() => {
          // set auto reloading timeout
          this.resetCountdownCounter(this.reloadMs)
        })
    } else {
      if (this.lastFetchTimestamp === 0) {
        this.lastFetchTimestamp = nowTs
      }
      const offset = this.reloadMs - nowTs + this.lastFetchTimestamp
      const restartTimerMs = offset > 0 ? offset : this.reloadMs
      this.fetchingState = `🕓 ${+(Math.round((restartTimerMs / 1000 / 60) + 'e+1') + 'e-1')}分後更新`
      // set auto reloading timeout
      this.resetCountdownCounter(restartTimerMs)
    }
  },
  computed: {
    needRefetch () {
      // none of this criteria fits, no needs to fetch
      if (
        this.$utils.empty(this.fetchType) ||
        this.$utils.empty(this.fetchKeyword) ||
        isNaN(this.fetchDay)
      ) {
        this.$utils.warn(`${this.header} fetch 參數為空值，無法進行資料讀取!`)
        this.$utils.warn('fetchType', this.fetchType)
        this.$utils.warn('fetchKeyword', this.fetchKeyword)
        this.$utils.warn('fetchDay', this.fetchDay)
      }
      const passed = +new Date() - this.lastFetchTimestamp
      return passed > this.reloadMs * 0.8 || this.fetchedMonitorMailCount > 0
    },
    today () {
      // e.g. 2022-01-26
      return this.$utils.toADDate(new Date(), 'yyyy-LL-dd')
    },
    isMonday () {
      const now = new Date()
      return now.getDay() === 1
    },
    isSaturday () {
      const now = new Date()
      return now.getDay() === 6
    },
    border () {
      if (this.light !== 'success') {
        return this.light
      }
      return ''
    },
    attentionCss () {
      if (this.enableAttention) {
        if (this.light === 'danger') {
          return 'scale-danger'
        }
        if (this.light === 'warning') {
          return 'scale-warning'
        }
      }
      return ''
    },
    grafanaUrl () {
      return `http://${this.$config.monitor.host.Grafana.ip}:${this.$config.monitor.host.Grafana.port}`
    }
  },
  watch: {
    light (nVal, oVal) {
      this.lightChanged(nVal, oVal, this.componentName)
    },
    fetchedMonitorMailCount (nVal, oVal) {
      this.$utils.warn('fetchedMonitorMailCount', nVal, oVal)
      this.$fetch()
    },
    fetchingState (dontcare) {
      this.clearFetchingState()
    }
  },
  created () {
    // provides time span for various comp reloading
    this.reloadMs = 10 * 60 * 1000 + this.$utils.rand(30) * 1000
    this.lightChanged('warning', '', this.componentName)
    this.clearFetchingState = this.$utils.debounce(() => { this.fetchingState = '' }, 5000)
    // debounced Promise method
    this.load = this.$utils.debouncePromise(this.load, 250)
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
    clearTimeout(this.resetTimer)
    this.$refs.footer?.stop()
    this.isDestroyed = true
  },
  methods: {
    resetCountdownCounter (restartTimerMs) {
      // set auto reloading timeout
      if (this.$refs.footer) {
        this.$refs.footer.reset(restartTimerMs)
      } else {
        // this.$utils.warn('找不到監控儀表板 footer 組件，無法重新設定倒數按鍵！')
        !this.isDestroyed && this.timeout(() => this.$fetch(), restartTimerMs).then((handler) => { this.resetTimer = handler })
      }
    },
    truncate (content) {
      return content?.substring(0, 100).replaceAll('\n', '<br/>') + ' ...'
    },
    isToday (ts) {
      const fullDt = this.$utils.phpTsToAdDateStr(ts, true)
      return this.today === fullDt.split(' ')[0]
    },
    displayDatetime (ts) {
      const fullDt = this.$utils.phpTsToAdDateStr(ts, true)
      return fullDt.replace(this.today, '')
    },
    popupLogContent (item) {
      this.modal(item.message?.replaceAll('\n', '<br/>'), {
        title: `詳細記錄 - ${item.subject}`,
        size: 'lg',
        html: true
      })
    },
    popupMessages (type, keyword, days = 7, title = '顯示區間內訊息') {
      this.modal(this.$createElement('lah-monitor-board-raw', {
        props: {
          queryType: type,
          keyword,
          days
        }
      }), {
        title: `${this.header} - ${title}`,
        size: 'lg',
        html: true
      })
    },
    checkMail () {
      if (this.isDestroyed) {
        this.$utils.warn(`${this.$options.name} destroyed. Stop checking mail.`)
        return
      }
      return new Promise((resolve, reject) => {
        this.$store.commit('fetchedMonitorMailCount', 0)
        this.$store.commit('fetchingMonitorMail', true)
        this.$axios
          .post(this.$consts.API.JSON.MONITOR, {
            type: 'check_mail'
          })
          .then(({ data }) => {
            if (this.$utils.statusCheck(data.status)) {
              this.notify(data.message)
              this.$store.commit('fetchedMonitorMailCount', data.data_count)
            } else {
              this.warning(data.message)
            }
            // reload message array
            if (!this.$utils.empty(this.fetchType) && !this.$utils.empty(this.fetchKeyword)) {
              this.load(this.fetchType, this.fetchKeyword, this.fetchDay || 1)
            }
            resolve(data)
          })
          .catch((err) => {
            this.$utils.error(err)
            reject(new Error(err.message))
          })
          .finally(() => {
            this.$store.commit('fetchingMonitorMail', false)
            this.$emit('mail-checked')
          })
      })
    },
    load (type, keyword, days = 1, convert = false) {
      if (this.isDestroyed) {
        this.$utils.warn(`${this.$options.name} destroyed. Stop loading action.`)
        return
      }
      // loaded this comp owned message by type/keyword
      return new Promise((resolve, reject) => {
        this.messages = []
        this.isBusy = true
        this.$nextTick(() => {
          this.$axios
            .post(this.$consts.API.JSON.MONITOR, {
              type,
              keyword,
              days,
              convert
            })
            .then(({ data }) => {
              if (this.$utils.statusCheck(data.status)) {
                // sort by timestamp descending
                this.messages = [...data.raw?.sort((a, b) => b.timestamp - a.timestamp)]
              } else {
                this.$utils.warn(data.message)
              }
              // SRMAS tolerance
              if (this.$utils.empty(this.messages) && keyword === 'SRMAS') {
                // default name of the systex SRMAS
                this.load(type, 'LibreNMS', days, convert)
              }
              resolve(data)
            })
            .catch((err) => {
              reject(new Error(err.message))
              this.$utils.error(err)
            })
            .finally(() => {
              this.updated = this.$utils.now().replace(this.today, '')
              this.isBusy = false
            })
        })
      })
    },
    async reload () {
      try {
        this.isBusy = true
        const data = await this.checkMail()
        // new mail! doing $fetch next time forcely
        if (data.data_count > 0) {
          this.lastFetchTimestamp = 0
        }
      } catch (err) {
        this.alert(err.message)
      } finally {
        this.isBusy = false
      }
    },
    lightChanged (nlight, olight, name) {
      this.$emit('light-update', {
        name,
        new: nlight,
        old: olight
      })
    }
  }
}
