<!-- eslint-disable vue/no-v-html -->
<template lang="pug">
  div
    lah-transition(appear): .d-flex.align-items-center.justify-content-between.mb-1(v-if="enableKeywordFilter")
      b-input-group(prepend="關鍵字", size="sm"): b-input(
        ref="keyword",
        v-model="keyword",
        size="sm",
        placeholder=""
      )
      b-input-group.mx-1(prepend="日期", size="sm"): b-select(v-model="selectedDate", :options="dateOpts")
      b-input-group(prepend="標題", size="sm"): b-select(v-model="selectedTitle", :options="titleOpts")
      b-input-group.mx-1(prepend="頻道", size="sm"): b-select(v-model="selectedChannel", :options="channelOpts")
      lah-button(@click="reset") 重設
    lah-transition: lah-pagination(
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
          v-html="highlight(channelName(item.channel))"
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
    inChannel: { type: String, default: '' }
  },
  data: () => ({
    transProps: {
      name: 'rollIn'
    },
    keyword: '',
    selectedChannel: '',
    selectedTitle: '',
    selectedDate: '',
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
      let tmp = this.items
      try {
        // filter by keyword
        if (this.$utils.length(this.keyword) > 1) {
          const regex = new RegExp(`${this.keyword}`, 'u')
          tmp = tmp.filter((item) => {
            return this.tblKeys.some((key) => {
              if (Object.prototype.hasOwnProperty.call(item, key)) {
                const value = item[key] || '' // 針對空值做處理
                return key === 'channel' ? regex.test(this.channelName(value)) : regex.test(value)
              }
              return false
            })
          })
        }
        // filter by title
        if (!this.$utils.empty(this.selectedTitle)) {
          tmp = tmp.filter((item) => {
            return item.title === this.selectedTitle
          })
        }
        // filter by channel
        if (!this.$utils.empty(this.selectedChannel)) {
          tmp = tmp.filter((item) => {
            return item.channel === this.selectedChannel
          })
        }
        // filter by date
        if (!this.$utils.empty(this.selectedDate)) {
          tmp = tmp.filter((item) => {
            return item.create_datetime.startsWith(this.selectedDate)
          })
        }
      } catch (ex) {
        this.$utils.warn(ex)
      } finally {
        this.$emit('count-changed', tmp?.length)
      }
      return tmp
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
    },
    channelOpts () {
      const tmp = this.$utils.orderBy(
        this.$utils.uniqBy(
          this.filtered.map((item) => {
            return {
              value: item.channel,
              text: this.channelName(item.channel)
            }
          }),
          'value'
        ),
        ['value'],
        'asc'
      )
      // add empty value at head
      tmp.unshift({ value: '', text: '' })
      return tmp
    },
    titleOpts () {
      const tmp = this.$utils.orderBy(
        this.$utils.uniqBy(
          this.filtered.map((item) => {
            return item.title
          })
        ),
        [],
        'asc'
      )
      // add empty value at head
      tmp.unshift('')
      return tmp
    },
    dateOpts () {
      const tmp = this.$utils.orderBy(
        this.$utils.uniqBy(
          this.filtered.map((item) => {
            return item.create_datetime.match(/^\d{4}-\d{2}-\d{2}/)[0]
          })
        ),
        [],
        'asc'
      )
      // add empty value at head
      tmp.unshift('')
      return tmp
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
      if (!this.$utils.empty(this.inChannel)) {
        this.selectedChannel = this.inChannel
      }
    }
  },
  methods: {
    channelName (channel) {
      let name = this.channelMap.get(channel)
      if (!name) {
        name = this.userNames[channel]
      }
      if (name) {
        return `${channel} ${name}`
      }
      return channel
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
      this.selectedChannel = ''
      this.selectedDate = ''
      this.keyword = ''
      this.selectedTitle = ''
      this.$refs.keyword?.focus()
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
