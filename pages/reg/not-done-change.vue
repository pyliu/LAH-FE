<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 未辦繼承土地及建物異動
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 資料庫搜尋說明
          ul
            li 搜尋未辦繼承土地及建物有異動情形的資料
            li 請勿搜尋#[strong.text-danger 過大區間]，可能造成讀取時間過長而失敗
          hr
          h5 請參照下列步驟搜尋
          ol
            li 選擇查詢區間
            li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]

      .d-flex.small
        lah-datepicker.mr-1(v-model="dateRange")

        lah-button(
          ref="search"
          icon="search"
          size="lg"
          title="搜尋"
          :disabled="isBusy || isWrongDaysPeriod"
          @click="$fetch"
          no-icon-gutter
        )
        lah-button.mx-1(
          icon="search-plus",
          size="lg",
          title="開啟進階搜尋視窗",
          @click="$refs.searchPlus.show()",
          :disabled="!dataReady",
          no-icon-gutter
        )
        lah-button-xlsx.mr-1(
          :jsons="xlsxData"
          header="未辦繼承土地及建物異動"
        )
        lah-countdown-button(
          ref="countdown"
          title="立即重新讀取"
          variant="outline-secondary"
          badge-variant="secondary"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          :milliseconds="cachedMs"
          :disabled="isBusy || isWrongDaysPeriod"
          :busy="isBusy"
          @end="reload"
          @click="reload"
          auto-start
          end-attention
          no-badge
        )

  lah-transition: b-tags.border-0.mt-n4(
    v-if="advTags.length > 0",
    v-model="advTags",
    placeholder="",
    tag-variant="info",
    tag-pills,
    no-outer-focus,
    no-add-on-enter,
    no-tag-remove,
    add-button-variant="white"
    add-button-text=""
  )

  lah-pagination(
    v-model="pagination"
    :total-rows="queryCount"
    :caption="foundText"
  )

  lah-transition: b-table.text-center(
    v-if="committed"
    id="not-done-table"
    ref="table"
    caption-top
    selectable
    select-mode="single"
    selected-variant="success"
    :sticky-header="`${maxHeight}px`"
    :busy="isBusy"
    :items="filteredData"
    :responsive="'lg'"
    :striped="true"
    :hover="true"
    :bordered="true"
    :borderless="false"
    :outlined="false"
    :small="true"
    :dark="false"
    :fixed="false"
    :foot-clone="false"
    :no-border-collapse="true"
    :head-variant="'dark'"
    :fields="fields"
    :per-page="pagination.perPage"
    :current-page="pagination.currentPage"
  )
    template(#table-busy): span.ld-txt 讀取中...
    template(v-slot:cell(#)="{ item, index, rowSelected }")
      template(v-if="rowSelected")
        span(aria-hidden="true") &check;
        span.sr-only 勾選
      template(v-else)
        span(aria-hidden="true") &nbsp;
        span.sr-only 無勾選
      span {{ index + 1 + (pagination.currentPage - 1) * pagination.perPage }}
    template(#cell(GS03)="{ item }"): div: b-link(@click="popup(item)").
      {{ item.GS03 }}-{{ item.GS04_1 }}-{{ item.GS04_2 }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
    template(#cell(RM56_1)="{ item: { RM56_1 } }"): .text-nowrap {{ humanTWDate(RM56_1) }}
    template(#cell(GG48)="{ item }"): .text-nowrap {{ item.GG48 }}
    template(#cell(GG49)="{ item }"): .text-nowrap {{ landBuildNumber(item) }}
    template(#cell(RM09)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.RM09_CHT }}
    template(#cell(GS_TYPE)="{ item }"): .text-nowrap {{ item.GS_TYPE }}:{{ item.GS_TYPE_CHT }}
    template(#cell(GG00)="{ item }"): .text-nowrap {{ item.GG00 }}:{{ item.GG00_CHT }}
    template(#cell(GG01)="{ item }"): .text-nowrap {{ item.GG01 }}
    template(#cell(IS09)="{ item }"): .text-nowrap {{ item.IS09 }}
    template(#cell(ISNAME)="{ item }"): div {{ item.ISNAME }}
    template(#cell(GG30_2)="{ item }"): .text-left.content-max-width 【{{ item.GG30_1 }}】{{ item.GG30_2 }}

  b-modal(
    ref="caseDetail"
    size="xl"
    hide-footer
    centered
    no-close-on-backdrop
    scrollable
  )
    template(#modal-title) 登記案件詳情 {{ $utils.caseId(clickedId) }}
    h4.text-center.text-info.my-5(v-if="modalLoading")
      b-spinner.my-auto(small type="grow")
      strong.ld-txt 查詢中...
    lah-reg-case-detail(:case-id="clickedId" @ready="modalLoading = !$event.detail")

  b-modal(
    ref="searchPlus",
    title="進階搜尋",
    hide-footer
  )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="部別"): b-select(
        v-model="advOpts.gg00",
        :options="advOpts.gg00Opts",
        title="土地或是建物"
      )
      b-input-group(prepend="原因"): b-select(
        v-model="advOpts.reason",
        :options="advOpts.reasonOpts",
        title="登記原因"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="日期"): b-select(
        v-model="advOpts.date",
        :options="advOpts.dateOpts",
        title="校對日期"
      )
      b-input-group(prepend="異動"): b-select(
        v-model="advOpts.type",
        :options="advOpts.typeOpts",
        title="異動別"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="代碼"): b-select(
        v-model="advOpts.gg301",
        :options="advOpts.gg301Opts",
        title="其他登記事項代碼"
      )
      b-input-group(prepend="統編"): b-select(
        v-model="advOpts.id",
        :options="advOpts.idOpts",
        title="統編"
      )
    .center.d-flex.my-1
      b-input-group(prepend="權利人"): b-select(
        v-model="advOpts.name",
        :options="advOpts.nameOpts",
        title="權利人"
      )
      b-input-group

    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="resetAdvOpts",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ filterDataCount }} 筆
</template>

<script>
import dynamicHeight from '~/plugins/dynamic-height-mixin'
export default {
  mixins: [dynamicHeight],
  // only worked at page level component
  async asyncData (nuxt) {},
  data: () => ({
    cachedMs: 24 * 60 * 60 * 1000,
    modalLoading: true,
    clickedId: undefined,
    rows: [],
    dateRange: {
      begin: '',
      end: '',
      days: 0
    },
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    forceReload: false,
    committed: false,
    fields: [
      '#',
      {
        key: 'GG00',
        label: '部別',
        sortable: true
      },
      {
        key: 'GS03',
        label: '收件年字號',
        sortable: true
      },
      {
        key: 'RM09',
        label: '登記原因',
        sortable: true
      },
      {
        key: 'RM56_1',
        label: '校對日期',
        sortable: true
      },
      {
        key: 'GS_TYPE',
        label: '異動別',
        sortable: true
      },
      {
        key: 'GG48',
        label: '段代碼',
        sortable: true
      },
      {
        key: 'GG49',
        label: '地/建號',
        sortable: true
      },
      {
        key: 'GG01',
        label: '登序',
        sortable: true
      },
      {
        key: 'IS09',
        label: '統編',
        sortable: true
      },
      {
        key: 'ISNAME',
        label: '權利人',
        sortable: true
      },
      {
        key: 'GG30_2',
        label: '其他登記事項內容',
        sortable: true
      }
    ],
    warnDays: 180,
    advOpts: {
      id: '',
      idOpts: [],
      name: '',
      nameOpts: [],
      gg00: '',
      gg00Opts: [],
      gg301: '',
      gg301Opts: [],
      reason: '',
      reasonOpts: [],
      type: '',
      typeOpts: [],
      date: '',
      dateOpts: []
    }
  }),
  async fetch () {
    if (this.isBusy) {
      this.notify('讀取中 ... 請稍後', { type: 'warning' })
    } else {
      if (this.daysPeriod > this.warnDays) {
        const ans = await this.confirm(`搜尋區間大於${this.warnDays}天(過大區間，可能造成讀取時間過長而失敗)，請確認要執行？`)
        if (!ans) {
          return
        }
      } else if (this.$utils.empty(this.dateRange.begin) || this.$utils.empty(this.dateRange.end)) {
        this.$utils.warn('dateRange is not ready ... postpone $fetch')
        this.timeout(this.$fetch, 250)
        return
      }

      this.getCache(this.cacheKey).then((json) => {
        this.reset()
        if (this.forceReload !== true && json) {
          this.rows = json.raw
          this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
            if (this.$refs.countdown) {
              this.$refs.countdown.setCountdown(remaining)
              this.$refs.countdown.startCountdown()
            }
            this.notify(`查詢成功，找到 ${this.rows.length} 筆未辦繼承土地及建物異動情形資料。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
          })
          this.committed = true
        } else {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'not_done_change',
            start: this.dateRange.begin,
            end: this.dateRange.end,
            reload: this.forceReload
          }).then(({ data }) => {
            this.rows = data.raw || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
            const remainS = data.cache_remaining_time
            const remainMs = remainS * 1000
            if (remainMs && remainMs > 0) {
              this.setCache(this.cacheKey, data, remainMs)
              if (this.$refs.countdown) {
                this.$refs.countdown.setCountdown(remainMs)
                this.$refs.countdown.startCountdown()
              }
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.forceReload = false
            this.committed = true
          })
        }
      })
    }
  },
  head: {
    title: '未辦繼承土地及建物異動情形查詢-桃園市地政局'
  },
  fetchOnServer: false,
  computed: {
    dataReady () { return this.rows.length > 0 },
    queryCount () { return this.filterDataCount },
    cacheKey () { return `query_not_done_change_${this.dateRange.begin}_${this.dateRange.end}` },
    foundText () { return `找到 ${this.queryCount} 筆「未辦繼承土地及建物」異動資料` },
    daysPeriod () { return this.dateRange.days || 0 },
    isWrongDaysPeriod () { return this.daysPeriod < 1 },
    advTags () {
      const tags = []
      if (!this.$utils.empty(this.advOpts.gg00)) {
        tags.push(`部別：${this.advOpts.gg00}`)
      }
      if (!this.$utils.empty(this.advOpts.gg301)) {
        tags.push(`其他登記事項代碼：${this.advOpts.gg301}`)
      }
      if (!this.$utils.empty(this.advOpts.reason)) {
        tags.push(`登記原因：${this.advOpts.reason}`)
      }
      if (!this.$utils.empty(this.advOpts.type)) {
        tags.push(`異動別：${this.advOpts.type}`)
      }
      if (!this.$utils.empty(this.advOpts.date)) {
        tags.push(`校對日期：${this.advOpts.date}`)
      }
      if (!this.$utils.empty(this.advOpts.id)) {
        tags.push(`統編：${this.advOpts.id}`)
      }
      if (!this.$utils.empty(this.advOpts.name)) {
        tags.push(`權利人：${this.advOpts.name}`)
      }
      return tags
    },
    filteredData () {
      if (this.advTags.length > 0) {
        let pipelineItems = this.rows
        if (!this.$utils.empty(this.advOpts.gg00)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.GG00 === this.advOpts.gg00
          })
        }
        if (!this.$utils.empty(this.advOpts.reason)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.RM09 === this.advOpts.reason
          })
        }
        if (!this.$utils.empty(this.advOpts.gg301)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.GG30_1 === this.advOpts.gg301
          })
        }
        if (!this.$utils.empty(this.advOpts.type)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.GS_TYPE === this.advOpts.type
          })
        }
        if (!this.$utils.empty(this.advOpts.date)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.RM56_1.split(' ')[0] === this.advOpts.date
          })
        }
        if (!this.$utils.empty(this.advOpts.id)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.IS09 === this.advOpts.id
          })
        }
        if (!this.$utils.empty(this.advOpts.name)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.ISNAME === this.advOpts.name
          })
        }
        return pipelineItems
      }
      return this.rows
    },
    filterDataCount () {
      return this.filteredData.length
    },
    xlsxData () {
      const fieldKeys = this.fields.map((field, idx, array) => field.key)
      const jsons = this.filteredData.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (fieldKeys.includes(key)) {
            obj[this.getLabel(key)] = value
          }
        }
        return obj
      })
      return jsons
    }
  },
  watch: {
    rows (val) {
      this.refreshAdvOptsSelect(val)
    },
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期', { pos: 'tr' })
      } else if (val > this.warnDays) {
        this.notify(`搜尋區間過大將造成伺服器回應緩慢(目前:${val}天)`, { title: '警告', type: 'warning', pos: 'tr' })
      }
    }
  },
  created () {
    this.maxHeightOffset = 145
  },
  methods: {
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    reset () {
      this.committed = false
      this.rows = []
      this.currentPage = 1
    },
    popup (data) {
      this.modalLoading = true
      this.clickedId = `${data.GS03}${data.GS04_1}${data.GS04_2}`
      this.$refs.caseDetail.show()
    },
    landBuildNumber (item) {
      const val = item.GG49
      const mainNumber = (item.GG00 === 'B' ? val.substring(0, 4) : val.substring(0, 5)).replace(/^[\s0]+/g, '')
      const subNumber = (item.GG00 === 'B' ? val.substring(4) : val.substring(5)).replace(/^[\s0]+/g, '')
      return this.$utils.empty(subNumber) ? mainNumber : `${mainNumber}-${subNumber}`
    },
    humanTWDate (str) {
      return `${str.substring(0, 3)}-${str.substring(3, 5)}-${str.substring(5)}`
    },
    BB15_1Text (item) {
      if (item.BB15_1 === 'A') {
        return 'A: 全部'
      } else if (item.BB15_1 === 'B') {
        return 'B: 共同共有'
      } else if (item.BB15_1 === 'Z') {
        return 'Z: 見其他登記事項'
      }
      return item.BB15_1
    },
    getLabel (key) {
      const found = this.fields.find((item, idx, array) => {
        return this.$utils.equal(item.key, key)
      })
      if (found && found.label) {
        return found.label
      }
      return key
    },
    resetAdvOpts () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          id: '',
          name: '',
          gg00: '',
          gg301: '',
          type: '',
          reason: '',
          date: ''
        }
      }
    },
    refreshAdvOptsSelect (val) {
      this.advOpts = {
        ...{
          id: '',
          idOpts: [],
          name: '',
          nameOpts: [],
          gg00: '',
          gg00Opts: [],
          gg301: '',
          gg301Opts: [],
          reason: '',
          reasonOpts: [],
          date: '',
          dateOpts: [],
          type: '',
          typeOpts: []
        }
      }
      if (val) {
        this.advOpts.idOpts = [...new Set(val.map(item => item.IS09))].sort()
        this.advOpts.nameOpts = [...new Set(val.map(item => item.ISNAME))].sort()
        this.advOpts.gg00Opts = [...new Set(val.map(item => item.GG00))].sort()
        this.advOpts.gg301Opts = [...new Set(val.map(item => item.GG30_1))].sort()
        this.advOpts.typeOpts = [...new Set(val.map(item => item.GS_TYPE))].sort()
        this.advOpts.reasonOpts = [
          ...this.$utils.orderBy(
            this.$utils.uniqBy(val.map((item) => {
              return { value: item.RM09, text: `${item.RM09}：${item.RM09_CHT}` }
            }), 'value'),
            'value'
          )
        ]
        this.advOpts.dateOpts = [...new Set(val.map(item => item.RM56_1?.split(' ')[0]))].sort()
        this.advOpts.idOpts.unshift('')
        this.advOpts.nameOpts.unshift('')
        this.advOpts.gg00Opts.unshift('')
        this.advOpts.gg301Opts.unshift('')
        this.advOpts.typeOpts.unshift('')
        this.advOpts.reasonOpts.unshift('')
        this.advOpts.dateOpts.unshift('')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.content-max-width {
  max-width: 300px;
}
</style>
