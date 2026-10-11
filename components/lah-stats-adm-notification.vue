<template lang="pug">
b-card(:class="classNames")
  b-card-title: .d-flex.align-items-center
    lah-transition
      lah-fa-icon(v-if="ready", icon="circle-check", variant="success", size="lg")
      lah-fa-icon(v-else-if="isBusy", icon="spinner", variant="muted", size="lg", action="spin")
      lah-fa-icon(v-else, icon="question", variant="muted", size="lg")
    .ml-1 即時通紀錄統計
    lah-transition: b-badge.ml-1(pill, v-if="ready", variant="info", title="推播訊息總數") {{ count }} 則
    lah-transition: lah-button-xlsx.ml-1(
      v-if="count > 0",
      regular,
      icon="file-excel",
      size="sm",
      :variant="'success'",
      :jsons="xlsxJsons",
      pill
    )
    lah-transition: lah-button.ml-1(
      v-if="ready && raw.length > 0"
      icon="window-maximize",
      title="顯示詳細列表",
      :disabled="isBusy",
      pill,
      no-icon-gutter,
      @click="popup"
    )
    lah-button.ml-1(
      icon="magnifying-glass",
      title="重新查詢",
      :disabled="isBusy",
      :spin="isBusy",
      @click="query",
      pill,
      no-icon-gutter
    )
  b-card-sub-title.font-weight-bold.text-right 查詢區間：{{ period  }}
  section.my-2(v-if="ready")
    .h4.center.my-2(v-if="count === 0") 查無資料
    div(v-else)
      b-link.d-flex.justify-content-between.align-items-center.h5(
        v-for="(item, idx) in top3Channels",
        :key="`channel_${idx}`",
        @click="popup(item.channel)"
      )
        .font-weight-bold {{ idx + 1 }}. {{ item.name }} {{ item.channel }}
        b-badge(pill, :variant="idx === 0 ? 'primary' : idx === 1 ? 'info' : 'secondary'") {{ item.count }}
      .d-flex.justify-content-end: b-link.small.font-weight-bold(
        @click="popup",
        title="查看所有資料"
      )
        lah-fa-icon(icon="ellipsis", action="wander-h") 更多
  .h4.center.my-2(v-else) ⚠ 請設定區間後查詢
</template>

<script>
import lahStatsAdmNotificationTable from './lah-stats-adm-notification-table.vue'

export default {
  emit: ['ready'],
  components: { lahStatsAdmNotificationTable },
  props: {
    noBorder: { type: Boolean, default: false },
    begin: { type: String, default: '' },
    end: { type: String, default: '' }
  },
  data: () => ({
    ready: false,
    raw: [],
    message: '',
    /** raw data example 👉 {
        channel: "reg",
        content: "##### 🟢 02/17  10:15 地政系統跨域服務皆已回復。",
        create_datetime: "2025-02-17 10:15:00",
        expire_datetime: "",
        flag: 0,
        from_ip: "220.1.34.75",
        id: 3,
        priority: 3,
        sender: "系統排程",
        title: "地政系統跨域服務監測"
      }
     */
    fields: [
      '序號',
      { key: 'create_datetime', label: '建立時間', sortable: true },
      { key: 'channel', label: '接收頻道', sortable: true },
      { key: 'title', label: '標題', sortable: true },
      { key: 'content', label: '內容', sortable: true }
    ],
    channelMap: new Map([
      ['reg', '登記課'],
      ['sur', '測量課'],
      ['val', '地價課'],
      ['adm', '行政課'],
      ['inf', '資訊課'],
      ['lds', '全所']
    ])
  }),
  computed: {
    period () {
      if (this.$utils.empty(this.begin) || this.$utils.empty(this.end)) {
        return ''
      }
      return `${this.$utils.addDateDivider(this.begin)} ~ ${this.$utils.addDateDivider(this.end)}`
    },
    classNames () {
      const list = []
      if (this.noBorder) {
        list.push('border-0')
      }
      return list
    },
    count () {
      return Array.isArray(this.raw) ? this.raw.length : 0
    },
    xlsxJsons () {
      const fieldKeys = this.fields.map((field, idx, array) => field.key)
      const jsons = Array.isArray(this.raw)
        ? this.raw.map((data, idx, array) => {
          const obj = {}
          for (const [key, value] of Object.entries(data)) {
            if (fieldKeys.includes(key)) {
              obj[this.getLabel(key)] = value
            }
          }
          return obj
        })
        : []
      return jsons
    },
    top3Channels () {
      const channelCounts = {}

      for (const item of this.raw) {
        const channel = item.channel

        if (channelCounts[channel]) {
          channelCounts[channel].count++ // 增加計數
        } else {
          channelCounts[channel] = { // 初始化 channel 資訊
            count: 1,
            name: this.channelName(item)
            // 在這裡加入其他你需要的資訊，例如：
            // description: item.channelDescription
          }
        }
      }
      // 將 channelCounts 物件轉換為陣列，方便排序
      const sortedChannels = Object.entries(channelCounts).sort(([, a], [, b]) => b.count - a.count)
      // 取出前三名
      const top3 = sortedChannels.slice(0, 3)
      // 將結果轉換為你想要的格式 (包含 channel 和其他資訊)
      const formattedTop3 = top3.map(([channel, info]) => ({
        channel,
        name: info.name,
        count: info.count
        // 在這裡加入其他你需要的資訊
        // description: info.description
      }))
      return formattedTop3
    }
  },
  watch: {
    raw (val) {
      // this.$utils.warn(val)
    },
    begin (dontcare) {
      this.reset()
    },
    end (dontcare) {
      this.reset()
    }
  },
  async created () {},
  mounted () {},
  methods: {
    getLabel (key) {
      const found = this.fields.find((item, idx, array) => {
        return this.$utils.equal(item.key, key)
      })
      if (found && found.label) {
        return found.label
      }
      return key
    },
    reset () {
      this.ready = false
      this.message = ''
      this.raw = []
    },
    query () {
      this.isBusy = true
      this.reset()
      this.$axios
        .post(this.$consts.API.JSON.NOTIFICATION, {
          type: 'get_log',
          st: this.begin,
          ed: this.end
        }).then(({ data }) => {
          const status = this.$utils.statusCheck(data.status) ? '🟢' : '⚠'
          this.message = `${status} ${data.message}`
          this.raw = Array.isArray(data.raw) ? [...data.raw] : []
          this.$emit('ready', data)
          this.ready = true
        }).catch((err) => {
          this.error = err
          this.$emit('ready', null)
        }).finally(() => {
          this.isBusy = false
        })
    },
    handlePaginationInput (payload) {
      // remember user changed number
      this.setCache('reg-initial-review-table-perPage', payload.perPage)
    },
    channelName (row) {
      let name = this.channelMap.get(row.channel)
      if (!name) {
        name = this.userNames[row.channel]
      }
      return name || row.channel
    },
    popup (channel) {
      this.modal(this.$createElement(lahStatsAdmNotificationTable, {
        props: {
          items: this.raw,
          fields: this.fields,
          inChannel: typeof channel === 'string' ? channel : ''
        }
      }), {
        title: '系統發送即時通知詳情',
        size: 'xl'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
