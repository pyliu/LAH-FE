export default {
  emit: ['light-update', 'mail-checked'],
  name: 'lahMonitorBoardBase',
  fetchOnServer: false,
  props: {
    enableAttention: { type: Boolean, default: false },
    // 新增：決定這個組件是否要負責發送全域的 mail check
    isMailChecker: { type: Boolean, default: false }
  },
  data: () => ({
    header: '監控儀表板BASE',
    messages: [],
    updated: '',
    reloadMs: 10 * 60 * 1000,
    reloadTimer: null,
    resetTimer: null,
    reloadIntervalTimer: null, // 新增：用於信件檢查的計時器
    lastFetchTimestamp: 0,
    fetchingState: '',
    isBusy: false, // 確保 isBusy 具備 Vue 響應式 (原本 methods 內有使用)
    isDestroyed: false
  }),
  fetch () {
    // 統一使用毫秒，避免 $utils.nowTs() 可能回傳秒單位的問題
    const nowMs = Date.now()

    if (this.needRefetch) {
      this.load(this.fetchType, this.fetchKeyword, this.fetchDay, this.fetchConvert)
        .then((data) => {
          // successful loaded
          // 只有在成功載入後才更新 timestamp
          this.lastFetchTimestamp = Date.now()
          this.fetchingState = '✔ 已更新'
        })
        .catch((e) => {
          this.$utils.warn(e)
          // 失敗時不更新 timestamp，讓下一次檢查能再次觸發
        }).finally(() => {
          // set auto reloading timeout
          this.resetCountdownCounter(this.reloadMs)
        })
    } else {
      if (this.lastFetchTimestamp === 0) {
        this.lastFetchTimestamp = nowMs
      }
      // 計算剩餘時間：(上次更新時間 + 間隔) - 現在時間
      const offset = (this.lastFetchTimestamp + this.reloadMs) - nowMs
      // 確保至少有 1秒 的延遲，避免負數或零導致立即迴圈
      const restartTimerMs = offset > 1000 ? offset : this.reloadMs

      this.fetchingState = `🕓 ${+(Math.round((restartTimerMs / 1000 / 60) + 'e+1') + 'e-1')}分後更新`
      // set auto reloading timeout
      this.resetCountdownCounter(restartTimerMs)
    }
  },
  computed: {
    needRefetch () {
      // 1. Validation check
      // 如果參數無效，必須回傳 false 阻斷請求
      if (
        this.$utils.empty(this.fetchType) ||
        this.$utils.empty(this.fetchKeyword) ||
        isNaN(this.fetchDay)
      ) {
        this.$utils.warn(`${this.header} fetch 參數為空值，無法進行資料讀取!`)
        this.$utils.warn('fetchType', this.fetchType)
        this.$utils.warn('fetchKeyword', this.fetchKeyword)
        this.$utils.warn('fetchDay', this.fetchDay)
        return false
      }

      // 2. Time passed calculation
      // 統一使用 Date.now() 確保單位為毫秒
      const passed = Date.now() - this.lastFetchTimestamp

      // 3. Condition
      // 0.8 係數是為了容錯，確保當 setTimeout 在 reloadMs 醒來時，passed 一定會大於門檻
      // 避免因為 CPU 排程導致 setTimeout 提早 1ms 醒來而判定不需要更新
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
      // 當偵測到新郵件時，觸發 fetch 檢查是否需要更新
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
  mounted () {
    // 新增：只有被指定為 Checker 的組件，才啟用靜態 Interval 發送信件檢查
    if (this.isMailChecker) {
      this.$utils.info(`${this.$utils.time()} 設定 ${this.header} [isMailChecker] 為定期信件檢查主要管理者`)
      // 預設 5 分鐘檢查一次，加上亂數延遲，避免啟動時與組件初始的 $fetch 衝撞
      const intervalMs = 5 * 60 * 1000 + this.$utils.rand(30) * 1000
      this.$utils.info(`${this.$utils.time()} 設定 ${this.header} [isMailChecker] 更新間隔為 ${Math.round(intervalMs / 1000)} 秒`)
      this.reloadIntervalTimer = setInterval(() => {
        if (!this.isDestroyed && !this.isBusy) {
          this.$utils.info(`${this.$utils.time()} ${this.header} [isMailChecker] 觸發定期信件檢查`)
          this.reload()
        }
      }, intervalMs)
    }
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
    clearTimeout(this.resetTimer)
    // 清除信件檢查計時器
    if (this.reloadIntervalTimer) {
      clearInterval(this.reloadIntervalTimer)
    }
    this.$refs.footer?.stop()
    this.isDestroyed = true
  },
  methods: {
    resetCountdownCounter (restartTimerMs) {
      // set auto reloading timeout
      if (this.$refs.footer) {
        this.$refs.footer.reset(restartTimerMs)
      } else {
        // Fallback if footer component is missing
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
              this.$utils.info(data.message)
              this.$store.commit('fetchedMonitorMailCount', data.data_count)
            } else {
              this.$utils.warn(data.message)
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
