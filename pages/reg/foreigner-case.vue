<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 外國人地權案件
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          .h5 請利用日期區間搜尋，搜尋條件如下。
          ul
            li 案件權利人及義務人為外國人
            li 結合 REGF 登記主檔－外國人地權登記統計檔資料
      .d-flex
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
          header="外國人地權案件"
        )
        lah-countdown-button(
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          title="立即重新讀取"
          variant="outline-secondary"
          badge-variant="secondary"
          :disabled="isBusy"
          :busy="isBusy"
          :milliseconds="cachedMs"
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

  lah-transition: lah-reg-b-table(
    only-popup-detail,
    case-reload,
    :busy="isBusy",
    :baked-data="filteredData",
    :fields="fields"
  )

  b-modal(
    ref="searchPlus",
    title="進階搜尋",
    hide-footer
  )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="　字"): b-select(
        v-model="advOpts.code",
        :options="advOpts.codeOpts",
        title="收件字"
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
      b-input-group(prepend="狀態"): b-select(
        v-model="advOpts.op",
        :options="advOpts.opOpts",
        title="辦理情形"
      )
    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="resetAdvOpts",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ filterDataCount }} 筆
</template>

<script>
import lahButton from '~/components/lah-button.vue'
export default {
  components: { lahButton },
  data: () => ({
    forceReload: false,
    committed: false,
    dateRange: {
      beigh: '',
      end: '',
      days: 0
    },
    cachedMs: 24 * 60 * 60 * 1000,
    bakedData: [],
    fields: [
      {
        key: '收件字號',
        sortable: true
      },
      {
        key: '登記原因',
        sortable: true
      },
      // {
      //   key: '辦理情形',
      //   sortable: true
      // },
      {
        key: '校對日期',
        sortable: true
      },
      {
        key: '權利人統一編號',
        sortable: true
      },
      {
        key: '權利人姓名',
        sortable: true
      },
      {
        key: '義務人統一編號',
        sortable: true
      },
      {
        key: '義務人姓名',
        sortable: true
      },
      {
        key: '土地筆數',
        sortable: true
      },
      {
        key: '土地面積',
        sortable: true
      },
      {
        key: '建物筆數',
        sortable: true
      },
      {
        key: '建物面積',
        sortable: true
      },
      {
        key: '外國人類別',
        sortable: true
      }
      // {
      //   key: '結案與否',
      //   label: '結案',
      //   sortable: true
      // }
    ],
    advOpts: {
      code: '',
      codeOpts: [],
      reason: '',
      reasonOpts: [],
      op: '',
      opOpts: [],
      date: '',
      dateOpts: []
    }
  }),
  fetch () {
    if (this.$utils.empty(this.dateRange.begin) || this.$utils.empty(this.dateRange.end)) {
      this.$utils.warn('dateRange is not ready ... postpone $fetch')
      this.timeout(this.$fetch, 250)
    } else {
      // restore cached data if found
      this.getCache(this.cacheKey).then((json) => {
        if (json === false || this.forceReload) {
          if (this.isBusy) {
            this.warning('讀取中 ... 請稍後')
          } else {
            this.isBusy = true
            this.committed = false
            this.$axios.post(this.$consts.API.JSON.PREFETCH, {
              type: 'reg_foreigner_case',
              begin: this.dateRange.begin,
              end: this.dateRange.end,
              reload: this.forceReload
            }).then(({ data }) => {
              this.bakedData = data.baked || []
              this.notify(data.message, {
                type: this.$utils.statusCheck(data.status) ? 'info' : 'warning',
                subtitle: `${this.dateRange.begin}-${this.dateRange.end}`
              })
              const remainS = data.cache_remaining_time // in seconds
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
        } else {
          this.bakedData = json.baked
          this.committed = true
          this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
            if (this.$refs.countdown) {
              this.$refs.countdown.setCountdown(remaining)
              this.$refs.countdown.startCountdown()
            }
            this.notify(`查詢成功，找到 ${this.bakedData.length} 筆外國人地權案件。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
          })
        }
      })
    }
  },
  head: {
    title: '外國人地權案件-桃園市地政局'
  },
  fetchOnServer: false,
  computed: {
    dataReady () { return this.bakedData.length > 0 },
    cacheKey () { return `foreigner-case-${this.dateRange.begin}-${this.dateRange.end}` },
    isWrongDaysPeriod () { return this.dateRange.days < 1 },
    advTags () {
      const tags = []
      if (!this.$utils.empty(this.advOpts.code)) {
        tags.push(`收件字：${this.advOpts.code}`)
      }
      if (!this.$utils.empty(this.advOpts.reason)) {
        tags.push(`登記原因：${this.advOpts.reason}`)
      }
      if (!this.$utils.empty(this.advOpts.op)) {
        tags.push(`辦理情形：${this.advOpts.op}`)
      }
      if (!this.$utils.empty(this.advOpts.date)) {
        tags.push(`校對日期：${this.advOpts.date}`)
      }
      return tags
    },
    filteredData () {
      if (this.advTags.length > 0) {
        let pipelineItems = this.bakedData
        if (!this.$utils.empty(this.advOpts.code)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字 === this.advOpts.code
          })
        }
        if (!this.$utils.empty(this.advOpts.reason)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.RM09 === this.advOpts.reason
          })
        }
        if (!this.$utils.empty(this.advOpts.op)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.辦理情形 === this.advOpts.op
          })
        }
        if (!this.$utils.empty(this.advOpts.date)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.校對日期.split(' ')[0] === this.advOpts.date
          })
        }
        return pipelineItems
      }
      return this.bakedData
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
            obj[key] = value
          }
        }
        return obj
      })
      return jsons
    }
  },
  watch: {
    bakedData (val) {
      this.refreshAdvOptsSelect(val)
    }
  },
  methods: {
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    resetAdvOpts () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          code: '',
          op: '',
          reason: '',
          date: ''
        }
      }
    },
    refreshAdvOptsSelect (val) {
      this.advOpts = {
        ...{
          code: '',
          codeOpts: [],
          op: '',
          opOpts: [],
          reason: '',
          reasonOpts: [],
          date: '',
          dateOpts: []
        }
      }
      if (val) {
        this.advOpts.codeOpts = [...new Set(val.map(item => item.收件字))].sort()
        this.advOpts.opOpts = [...new Set(val.map(item => item.辦理情形))].sort()
        this.advOpts.opOpts = [
          ...this.$utils.orderBy(
            this.$utils.uniqBy(val.map((item) => {
              return { value: item.辦理情形, text: `${item.RM30}：${item.辦理情形}` }
            }), 'value'),
            'value'
          )
        ]
        this.advOpts.reasonOpts = [
          ...this.$utils.orderBy(
            this.$utils.uniqBy(val.map((item) => {
              return { value: item.RM09, text: `${item.RM09}：${item.RM09_CHT}` }
            }), 'value'),
            'value'
          )
        ]
        this.advOpts.dateOpts = [...new Set(val.map(item => item.校對日期?.split(' ')[0]))].sort()
        this.advOpts.codeOpts.unshift('')
        this.advOpts.opOpts.unshift('')
        this.advOpts.reasonOpts.unshift('')
        this.advOpts.dateOpts.unshift('')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.vw-50 {
  width: 33vw;
}
</style>
