export default {
  emit: ['light-update'],
  name: 'lahMonitorBoardBase',
  fetchOnServer: false,
  data: () => ({
    header: '等著被覆寫的資料',
    messages: [],
    updated: '',
    reloadMs: 15 * 60 * 1000
  }),
  computed: {
    today () {
      // e.g. 2021-12-29
      const now = new Date()
      return (
        now.getFullYear() +
        '-' +
        ('0' + (now.getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + now.getDate()).slice(-2)
      )
    },
    isMonday () {
      const now = new Date()
      return now.getDay() === 1
    }
  },
  watch: {
    light (nVal, oVal) {
      this.$emit('light-update', {
        name: this.componentName,
        new: nVal,
        old: oVal
      })
    }
  },
  created () {
    this.$emit('light-update', {
      name: this.componentName,
      new: 'warning',
      old: ''
    })
  },
  methods: {
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
    }
  }
}
