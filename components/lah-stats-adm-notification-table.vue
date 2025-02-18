<!-- eslint-disable vue/no-v-html -->
<template lang="pug">
  div
    lah-transition(appear): .d-flex.align-items-center.justify-content-end.mb-1(v-if="enableKeywordFilter")
      b-input.col-2(
        v-model="keyword",
        size="sm",
        placeholder="... 輸入關鍵字篩選案件 ..."
      )
    lah-transition: lah-pagination(
      v-if="count > pagination.perPage"
      v-model="pagination"
      :total-rows="count"
      :caption="`找到 ${count} 筆資料`"
    )
    b-table(
      ref="bTable"
      :items="filtered"
      :fields="tblFields"
      :busy="isBusy || busy"
      :responsive="'lg'"
      :table-variant="tableVariant"
      :tbody-transition-props="transProps"
      :small="small"
      :per-page="pagination.perPage"
      :current-page="pagination.currentPage"

      head-variant="dark"
      primary-key="序號"
      class="text-center"
      select-mode="single"
      selected-variant="success"

      :borderless="false"
      :outlined="false"
      :dark="false"
      :fixed="false"
      :foot-clone="false"
      striped
      hover
      bordered
      no-border-collapse
      caption-top
      selectable

      @row-selected="handleRowSelected"
    )
      template(#cell(#)="row")
        template(v-if="row.rowSelected")
          span(aria-hidden="true") &check;
          span(class="sr-only") Selected
        template(v-else)
          span(aria-hidden="true") &nbsp;
          span(class="sr-only") Not selected
        span.mx-auto {{ (pagination.perPage * (pagination.currentPage - 1)) + row.index + 1 }}

      template(#table-busy)
        .mx-auto.ld-txt 讀取中...

      template(#cell(create_datetime)="{ item }")
        .mx-auto(v-html="highlight(item.create_datetime)")
      template(#cell(channel)="{ item }")
        b-link.mx-auto(
          @click="userinfo('', item.channel)",
          v-html="highlight(channelName(item))"
        )
      template(#cell(title)="{ item }")
        .mx-auto(v-html="highlight(item.title)")
      template(#cell(content)="{ item }")
        .text-left(v-html="highlight(item.content)")
</template>

<script>
export default {
  emit: ['count-changed'],
  name: 'LahStatsAdmNotificationTable',
  props: {
    items: { type: Array, default: () => ([]) },
    fields: { type: Array, default: undefined },
    mute: { type: Boolean, default: false },
    noCaption: { type: Boolean, default: false },
    color: { type: Boolean, default: false },
    icon: { type: String, default: '' },
    iconVariant: { type: String, default: '' },
    busy: { type: Boolean, default: false },
    tableVariant: { type: String, default: '' },
    captionAppend: { type: String, default: '' },
    small: { type: Boolean, default: true },
    enableKeywordFilter: { type: Boolean, default: true },
    inKeyword: { type: String, default: '' }
  },
  data: () => ({
    transProps: {
      name: 'rollIn'
    },
    keyword: '',
    pagination: {
      perPage: 5,
      currentPage: 1
    },
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
    filtered () {
      if (this.$utils.length(this.keyword) > 1) {
        const regex = new RegExp(`${this.keyword}`, 'u')
        const tmp = this.items?.filter((item) => {
          return this.tblKeys.some((key) => {
            if (Object.prototype.hasOwnProperty.call(item, key)) {
              const value = item[key] || '' // 針對空值做處理
              this.$utils.warn('checking ', key)
              return key === 'channel' ? regex.test(this.channelName(value)) : regex.test(value)
            }
            return false
          })
        })
        this.$emit('count-changed', tmp?.length)
        return tmp
      }
      this.$emit('count-changed', this.items?.length)
      return this.items
    },
    tblKeys () {
      // 使用 map() 方法提取 key 欄位的值
      return this.tblFields.map(column => column.key)
    },
    tblFields () {
      if (!this.$utils.empty(this.fields)) { return this.fields }
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
      return [
        '#',
        { key: 'create_datetime', label: '建立時間', sortable: this.sort },
        { key: 'channel', label: '接收頻道', sortable: this.sort },
        { key: 'title', label: '標題', sortable: this.sort },
        { key: 'content', label: '內容', sortable: this.sort }
      ]
    },
    count () {
      return this.filtered?.length || 0
    },
    caption () {
      if (this.mute || this.noCaption) { return '' }
      return this.busy ? '讀取中' : `找到 ${this.count} 筆資料 ${this.captionAppend}`
    },
    sort () {
      return this.$utils.empty(this.mute)
    }
  },
  watch: {
    count (val) {
      this.pagination.currentPage = 1
    },
    'pagination.perPage' (val) {
      this.setCache('lah-stats-adm-notification-table-perPage', val)
    }
  },
  mounted () {
    if (!this.$isServer && window) {
      this.getCache('lah-stats-adm-notification-table-perPage').then((val) => {
        this.pagination.perPage = parseInt(val) || 5
      })
      if (!this.$utils.empty(this.inKeyword)) {
        this.keyword = this.inKeyword
      }
    }
  },
  methods: {
    channelName (item) {
      let name = this.channelMap.get(item.channel)
      if (!name) {
        name = this.userNames[item.channel]
      }
      if (name) {
        return `${item.channel} ${name}`
      }
      return item.channel
    },
    highlight (text, css = 'highlight-yellow') {
      if (this.$utils.length(this.keyword) > 1) {
        return this.$utils.highlight(
          text,
          this.keyword,
          css
        )
      }
      return text
    },
    reset () {
      this.pagination.currentPage = 1
    },
    handleRowSelected (payload) {
      if (payload?.length > 0) {
        // this.$utils.warn('row selected', payload)
        // this.popup(payload[0])
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
