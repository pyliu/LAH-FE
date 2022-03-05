export default {
  emit: ['light-update'],
  name: 'lahMonitorBoardBase',
  fetchOnServer: false,
  data: () => ({
    header: '等著被覆寫的資料',
    messages: [],
    updated: '',
    reloadMs: 15 * 60 * 1000,
    lastFetchTimestamp: 0,
    fetchingState: ''
  }),
  fetch () {
    if (this.needRefetch) {
      this.load(this.fetchType, this.fetchKeyword, this.fetchDay).then((data) => {
        // successful loaded
        this.lastFetchTimestamp = +new Date()
        this.fetchingState = '✔ 已更新'
      }).catch((err) => {
        this.$utils.warn(err)
      }).finally(() => {
        // set auto reloading timeout
        this.resetCountdownCounter(this.reloadMs)
      })
    } else {
      const offset = this.reloadMs - +new Date() + this.lastFetchTimestamp
      const restartTimerMs = offset > 0 ? offset : this.reloadMs
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
        return false
      }
      const passed = +new Date() - this.lastFetchTimestamp
      return passed > this.reloadMs * 0.8
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
    }
  },
  watch: {
    light (nVal, oVal) {
      this.$emit('light-update', {
        name: this.componentName,
        new: nVal,
        old: oVal
      })
    },
    fetchedMonitorMailCount (nVal, oVal) {
      if (nVal > 0) {
        this.$fetch && this.$fetch()
      }
    },
    fetchingState (dontcare) {
      this.clearFetchingState()
    }
  },
  created () {
    this.$emit('light-update', {
      name: this.componentName,
      new: 'warning',
      old: ''
    })
    this.clearFetchingState = this.$utils.debounce(() => { this.fetchingState = '' }, 5000)
  },
  methods: {
    resetCountdownCounter (restartTimerMs) {
      // set auto reloading timeout
      if (this.$refs.footer) {
        this.$refs.footer.reset(restartTimerMs)
      } else {
        this.$utils.warn('No footer ref found')
        this.timeout(() => this.$fetch(), restartTimerMs)
      }
    },
    truncate (content) {
      return content?.substring(0, 100).replaceAll('\n', '<br/>') + ' ...'
    },
    isToday (ts) {
      const fullDt = this.$utils.tsToAdDateStr(ts, true)
      return this.today === fullDt.split(' ')[0]
    },
    displayDatetime (ts) {
      const fullDt = this.$utils.tsToAdDateStr(ts, true)
      return fullDt.replace(this.today, '')
    },
    popupLogContent (item) {
      this.modal(item.message?.replaceAll('\n', '<br/>'), {
        title: `${this.header} - ${item.subject}`,
        size: 'lg',
        html: true
      })
    },
    popupMessages (type, keyword, days = 7) {
      this.modal(this.$createElement('lah-monitor-board-raw', {
        props: {
          queryType: type,
          keyword,
          days
        }
      }), {
        title: `${this.header} - 顯示區間內訊息`,
        size: 'lg',
        html: true
      })
    },
    checkMail () {
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
            resolve(data)
          })
          .catch((err) => {
            this.$utils.error(err)
            reject(new Error(err.message))
          })
          .finally(() => {
            this.$store.commit('fetchingMonitorMail', false)
          })
      })
    },
    load (type, keyword, days = 1) {
      return new Promise((resolve, reject) => {
        this.messages.length = 0
        this.isBusy = true
        this.$axios
          .post(this.$consts.API.JSON.MONITOR, {
            type,
            keyword,
            days
          })
          .then(({ data }) => {
            if (this.$utils.statusCheck(data.status)) {
              this.messages = [...data.raw]
            } else {
              this.$utils.warn(data.message)
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
    },
    async reload () {
      try {
        this.isBusy = true
        const data = await this.checkMail()
        // doing $fetch next time forcely
        if (data.data_count > 0) {
          this.lastFetchTimestamp = 0
        }
      } catch (err) {
        this.alert(err.message)
      } finally {
        this.isBusy = false
      }
    }
  }
}
