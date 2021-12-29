export default {
  name: 'lahMonitorBoardBase',
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
    }
  },
  methods: {
    truncate (content) {
      return content?.substring(0, 100).replaceAll('\n', '<br/>') + ' ...'
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
        title: `${this.header} - ${days}天內訊息`,
        html: true
      })
    }
  }
}
