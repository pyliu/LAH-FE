// import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'
export default {
  name: 'lahMonitorBoardBase',
  // components: { lahMonitorBoardRaw },
  data: () => ({
    header: '等著被覆寫的資料'
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
        title: `${this.header} - 顯示區間內訊息`,
        size: 'lg',
        html: true
      })
    }
  }
}
