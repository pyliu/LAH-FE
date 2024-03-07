<template lang="pug">
b-card(:no-body="noBody")
  template(
    v-if="!hideHeader",
    #header
  ): .d-flex.justify-content-between.align-items-center
    lah-fa-icon(icon="link-slash") {{ header }} (#[strong {{ itemsCount }}]筆)
    b-button-group.ml-auto(size="sm")
      b-select(v-model="filter", :options="filterOpts")
      lah-button(
        v-if="hideFooter"
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="load",
        :title="`上次更新時間 ${updated}`",
        :disabled="fetchingMonitorMail"
      )
      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="說明"
      )
    lah-help-modal(ref="help", :modal-title="`${header} 顯示說明`")
      ul
        li 顯示跨域伺服器離線統計
        li 預設讀取前10筆歷史資料

  .center.h4.mt-3(v-if="itemsCount === 0")
    lah-fa-icon(
      icon="triangle-exclamation",
      variant="warning"
    ) 無伺服器離線資料
  b-list-group(v-else)
    transition-group(name="list"): b-list-group-item.flex-column.align-items-start(
      v-for="(item, index) in officesData",
      :key="`${item.timestamp}-${item.id}-${index}`"
    )
      .item-head(
        :title="`${shorten(item.name)}`",
        :class="[circleBGColor(item)]"
      )
      .item-tail(v-if="index !== itemsCount - 1")
      b-spinner.ml-4(v-if="item.spinner" :variant="bootstrapVariant", small)
      .item-content(v-if="!item.spinner")
        .d-flex.w-100.justify-content-between.font-weight-bold
          a.mb-1.truncate(
            :title="item.id",
            v-b-toggle="[`content-${index}`, `content-${index}-preview`]",
            href="javascript:void(0)"
          ) {{ `${item.id} ${item.name}` }}
          lah-badge-human-datetime(:seconds="item.timestamp")

        b-collapse(
          :id="`content-${index}-preview`",
          :visible="index !== 0"
        ): .small.mb-1.text-muted.w-100.truncate
          |{{ cleanTags(item.response) }}

        b-collapse(:id="`content-${index}`", :visible="index === 0")
          .rounded.border.border-dark.mt-1.mb-1.p-2
            .item-description.timeline-img(
              v-html="formatText(item)"
            )

  template(#footer, v-if="!hideFooter"): client-only: lah-monitor-board-footer(
    ref="footer"
    :reload-ms="reloadMs",
    :busy="isBusy",
    :reload="load",
    :update-time="updated"
  )

</template>

<script>
export default {
  name: 'LahOfficeDownTimeline',
  components: {},
  props: {
    dateFormat: { type: String, default: 'yyyy-MM-dd HH:mm:ss' },
    variant: { type: String, default: 'primary' },
    count: { type: String, default: '100' },
    noBody: { type: Boolean, default: false },
    hideHeader: { type: Boolean, default: false },
    hideFooter: { type: Boolean, default: false }
  },
  data: () => ({
    header: '跨域伺服器斷線紀錄',
    officesData: [],
    updated: '',
    reloadMs: 5 * 60 * 1000,
    timer: null,
    filter: 'latest',
    filterOpts: [
      { text: '最新10筆', value: 'latest' },
      { text: '最近1天', value: 'day' },
      { text: '最近1週', value: 'week' },
      { text: '最近1月', value: 'month' },
      { text: '最近1年', value: 'year' }
    ]
  }),
  fetch () {
    this.load()
  },
  computed: {
    bootstrapVariant () {
      return this.variant || 'primary'
    },
    itemsCount () {
      return this.officesData.length
    }
  },
  watch: {
    filter (val) {
      this.load()
    }
  },
  created () {},
  mounted () {
    this.timeout(() => {
      if (this.officesData.length === 0) {
        this.load()
      }
    }, 1000)
  },
  beforeDestroy () {
    clearTimeout(this.timer)
  },
  methods: {
    load () {
      clearTimeout(this.timer)
      this.isBusy = true
      this.officesData = []
      this.$axios.post(this.$consts.API.JSON.STATS, {
        type: 'stats_xap_stats_down',
        opt: this.filter
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.officesData = [...data.raw]
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        this.timeout(this.load, this.reloadMs).then((handle) => { this.timer = handle })
        this.updated = this.$utils.formatTime(new Date())
      })
    },
    shorten (name) {
      return name?.replace(/(地政事務)/g, '')
    },
    formatText (item) {
      return `
        網站回應：${item.response}<br/>
        離線時間：${this.$utils.phpTsToAdDateStr(item.timestamp, true)}
      `
    },
    cleanTags (message) {
      return this.cleanText(message).replace(/(<([^>]+)>)/gi, '')
    },
    cleanText (text) {
      if (text) {
        const highlighted = this.$utils?.highlightPipeline(text)
        const domsafe = this.$utils?.convertMarkd(highlighted)
        if (/!\[.+\]\(data:image\/.+\)/gm.test(domsafe) && domsafe.repaceAll) {
          // convert for images ...
          return this.$utils.convertInlineMarkd(domsafe?.repaceAll('\n', ''))
        }
        return domsafe
      }
      return ''
    },
    circleBGColor (item) {
      // php timestamp is in seconds
      const now = this.$utils.nowTs() / 1000
      const offset = now - item.timestamp
      // in 2 hrs
      if (offset < 7200) {
        return 'bg-danger'
      }
      // in 4 hrs
      if (offset < 14400) {
        return 'bg-warning'
      }
      return 'bg-secondary'
    }
  }
}
</script>

<style lang="scss" scoped>
.list-group-item {
  position: relative;
  border: none;
  margin: 0;
  padding: 0 0 20px;
  box-sizing: border-box;
  padding-bottom: 0;
}
.item-head {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 2px solid transparent;
  border-radius: 100px;
}
.item-tail {
  position: absolute;
  top: 10px;
  left: 4px;
  height: calc(100% - 10px);
  border-left: 2px solid #e8e8e8;
}
.item-content {
  position: relative;
  top: -6px;
  margin: 0 0 0 18px;
  word-break: break-word;
}
.item-description {
  display: block;
  text-align: left;
}
</style>
