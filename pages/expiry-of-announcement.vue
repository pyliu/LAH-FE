<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex.mr-auto
        .my-auto 公告案件
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          .h5 公告中案件狀態說明：
          .mx-2 #[lah-fa-icon(icon="circle" variant="danger") 已到期案件]
          .mx-2 #[lah-fa-icon(icon="circle" variant="warning") 今日到期案件]
          .mx-2 #[lah-fa-icon(icon="circle" variant="success") 公告中案件]
          .mx-2 #[lah-fa-icon(icon="circle" variant="info") 公告初核中案件]

      lah-button(
        icon="search-plus",
        size="lg",
        title="開啟進階搜尋視窗",
        @click="$refs.searchPlus.show()",
        :disabled="!dataReady"
      ) 進階搜尋
      lah-button.mx-1(
        icon="file-excel",
        size="lg",
        title="匯出EXCEL",
        variant="outline-success",
        action="move-fade-ltr",
        regular,
        no-icon-gutter,
        :disabled="!dataReady",
        @click="xlsx"
      )
      lah-countdown-button(
        ref="countdown"
        icon="sync-alt"
        action="ld-cycle"
        size="lg"
        title="立即重新讀取"
        variant="outline-secondary"
        badge-variant="secondary"
        :milliseconds="cachedMs"
        :disabled="isBusy"
        :busy="isBusy"
        @end="reload"
        @click="reload"
        auto-start
        no-badge
      )

  lah-transition: b-tags.border-0.mt-n4(
    v-if="advTags.length > 0",
    v-model="advTags",
    placeholder="",
    tag-variant="primary",
    tag-pills,
    no-outer-focus,
    no-add-on-enter,
    no-tag-remove,
    add-button-variant="white"
    add-button-text=""
  )
  lah-transition(appear): lah-reg-b-table(:busy="isBusy || filtering" :baked-data="filterBakedData" :fields="fields")
  lah-transition.center.h3: lah-fa-icon(
    v-cloak
    v-if="queryCount === 0 && !isBusy"
    icon="exclamation-circle"
    prefix="fas"
  ) 無資料

  b-modal(
    ref="searchPlus",
    title="進階搜尋",
    hide-footer
  )
    .center.d-flex
      b-input-group(prepend="年")
        b-select(
          v-model="advOpts.caseYear",
          :options="advOpts.caseYearOpts",
          title="收件年"
        )
      b-input-group.mx-1(prepend="字")
        //- b-input.mx-1(v-model="advOpts.caseYear", placeholder="... 收件年 ...", trim)
        b-select(
          v-model="advOpts.caseWord",
          :options="advOpts.caseWordOpts",
          title="收件字"
        )
      b-input-group(prepend="號")
        //- b-input.mr-1(v-model="advOpts.caseWord", placeholder="... 收件字 ...", trim)
        b-input(v-model="advOpts.caseNum", placeholder="... 收件號 ...", trim)

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="登記原因"): b-select(
        v-model="advOpts.caseReason",
        :options="advOpts.caseReasonOpts",
        title="登記原因"
      )
      b-input-group(prepend="辦理情形"): b-select(
        v-model="advOpts.caseState",
        :options="advOpts.caseStateOpts",
        title="辦理情形"
      )

    .center.d-flex
      b-input-group.mr-1(prepend="初審人員"): b-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員"
      )
      b-input-group(prepend="狀態燈號"): b-select(
        v-model="advOpts.caseLight",
        :options="advOpts.caseLightOpts",
        title="狀態燈號"
      )

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="公告日期"): b-select(
        v-model="advOpts.caseAnnouncementDate",
        :options="advOpts.caseAnnouncementDateOpts",
        title="公告日期"
      )
      b-input-group(prepend="期滿日期"): b-select(
        v-model="advOpts.caseAnnouncementDeadline",
        :options="advOpts.caseAnnouncementDeadlineOpts",
        title="期滿日期"
      )

    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="reset",
        variant="outline-success"
      ) 重設
      lah-fa-icon.ml-1(v-if="filtering", icon="sync-alt", action="spin", variant="danger",title="篩選中 ... ")
</template>

<script>
import lahFaIcon from '~/components/lah-fa-icon.vue'
import LahHeader from '~/components/lah-header.vue'
import lahXlsxDownload from '~/components/lah-xlsx-download.vue'
export default {
  components: { lahFaIcon, LahHeader, lahXlsxDownload },
  fetchOnServer: false,
  data: () => ({
    bakedData: [],
    committed: false,
    cachedMs: 12 * 60 * 60 * 1000,
    forceReload: false,
    fields: [
      {
        key: '序號',
        sortable: false
      },
      {
        key: '公告燈號',
        label: '狀態',
        sortable: true
      },
      {
        key: '收件字號',
        sortable: true
      },
      {
        key: '登記原因',
        sortable: true
      },
      {
        key: '辦理情形',
        sortable: true
      },
      {
        key: '初審人員',
        sortable: true
      },
      {
        key: '公告日期',
        sortable: true
      },
      {
        key: '公告期滿日期',
        label: '期滿日期',
        sortable: true
      }
    ],
    filtering: false,
    advOpts: {
      caseYear: '',
      caseWord: '',
      caseNum: '',
      caseReason: '',
      caseReasonOpts: [],
      caseState: '',
      caseStateOpts: [],
      caseLight: '',
      caseLightOpts: [],
      casePreliminator: '',
      casePreliminatorOpts: [],
      caseAnnouncementDate: '',
      caseAnnouncementDateOpts: [],
      caseAnnouncementDeadline: '',
      caseAnnouncementDeadlineOpts: []
    }
  }),
  fetch () {
    this.getCache(this.cacheKey).then((json) => {
      if (this.forceReload || json === false) {
        if (!this.isBusy) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'reg_rm30_H_case',
            reload: this.forceReload
          }).then(({ data }) => {
            this.bakedData = data.baked || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
            const remainS = data.cache_remaining_time
            const remainMs = remainS * 1000
            if (remainMs && remainMs > 0) {
              this.setCache(this.cacheKey, data, remainMs)
              // use server side cache remaining time
              this.$refs.countdown && this.$refs.countdown.setCountdown(remainMs)
            } else {
              this.$refs.countdown && this.$refs.countdown.setCountdown(this.cachedMs)
            }
            this.getCacheExpireRemainingTime(this.cacheKey).then((trueRemainMs) => {
              this.$utils.log(`${this.cacheKey} 快取資料將在 ${(trueRemainMs / 1000).toFixed(1)} 秒後到期。`)
            })
            this.$refs.countdown && this.$refs.countdown.startCountdown()
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.forceReload = false
          })
        } else {
          this.notify('讀取中 ... 請稍後', { type: 'warning' })
        }
      } else {
        this.bakedData = json.baked
        this.resetCountdown()
        this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
          this.notify(`查詢成功，找到 ${this.bakedData.length} 筆公告中資料。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
        })
      }
    })
  },
  head: {
    title: '公告案件-桃園市地政局'
  },
  computed: {
    dataReady () { return this.bakedData?.length > 0 },
    queryCount () { return this.bakedData.length },
    cacheKey () { return `reg_rm30_H_case` },
    advTags () {
      const tags = []
      if (!this.$utils.empty(this.advOpts.caseLight)) {
        tags.push(`狀態：${this.advOpts.caseLight}`)
      }
      if (!this.$utils.empty(this.advOpts.caseYear)) {
        tags.push(`年：${this.advOpts.caseYear}`)
      }
      if (!this.$utils.empty(this.advOpts.caseWord)) {
        tags.push(`字：${this.advOpts.caseWord}`)
      }
      if (!this.$utils.empty(this.advOpts.caseNum)) {
        tags.push(`號：${this.advOpts.caseNum}`)
      }
      if (!this.$utils.empty(this.advOpts.caseReason)) {
        tags.push(`登記原因：${this.advOpts.caseReason}`)
      }
      if (!this.$utils.empty(this.advOpts.caseState)) {
        tags.push(`辦理情形：${this.advOpts.caseState}`)
      }
      if (!this.$utils.empty(this.advOpts.casePreliminator)) {
        tags.push(`初審人員：${this.advOpts.casePreliminator}`)
      }
      if (!this.$utils.empty(this.advOpts.caseAnnouncementDate)) {
        tags.push(`公告日期：${this.advOpts.caseAnnouncementDate}`)
      }
      if (!this.$utils.empty(this.advOpts.caseAnnouncementDeadline)) {
        tags.push(`到期日期：${this.advOpts.caseAnnouncementDeadline}`)
      }
      return tags
    },
    filterBakedData () {
      if (this.advTags.length > 0) {
        let pipelineItems = this.bakedData
        const checkNum = !this.$utils.empty(this.advOpts.caseNum)
        if (checkNum) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(this.advOpts.caseNum) !== null
          })
        }
        const checkWord = !this.$utils.empty(this.advOpts.caseWord)
        if (checkWord) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(this.advOpts.caseWord) !== null
          })
        }
        const checkYear = !this.$utils.empty(this.advOpts.caseYear)
        if (checkYear) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(`${this.advOpts.caseYear}年`) !== null
          })
        }
        const checkLight = !this.$utils.empty(this.advOpts.caseLight)
        if (checkLight) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.公告燈號 === this.advOpts.caseLight
          })
        }
        const checkReason = !this.$utils.empty(this.advOpts.caseReason)
        if (checkReason) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.登記原因 === this.advOpts.caseReason
          })
        }
        const checkState = !this.$utils.empty(this.advOpts.caseState)
        if (checkState) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.辦理情形 === this.advOpts.caseState
          })
        }
        const checkPreliminator = !this.$utils.empty(this.advOpts.casePreliminator)
        if (checkPreliminator) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.初審人員 === this.advOpts.casePreliminator
          })
        }
        const checkAnnouncementDate = !this.$utils.empty(this.advOpts.caseAnnouncementDate)
        if (checkAnnouncementDate) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.公告日期 === this.advOpts.caseAnnouncementDate
          })
        }
        const checkAnnouncementDeadline = !this.$utils.empty(this.advOpts.caseAnnouncementDeadline)
        if (checkAnnouncementDeadline) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.公告期滿日期 === this.advOpts.caseAnnouncementDeadline
          })
        }
        return pipelineItems
      }
      return this.bakedData
    },
    fieldKeys () {
      return this.fields.map((field, idx, array) => field.key)
    }
  },
  watch: {
    bakedData (val) {
      this.advOpts = {
        ...{
          caseYear: '',
          caseYearOpts: [],
          caseWord: '',
          caseWordOpts: [],
          caseNum: '',
          caseReason: '',
          caseReasonOpts: [],
          caseState: '',
          caseStateOpts: [],
          casePreliminator: '',
          casePreliminatorOpts: [],
          caseAnnouncementDate: '',
          caseAnnouncementDateOpts: [],
          caseAnnouncementDeadline: '',
          caseAnnouncementDeadlineOpts: [],
          caseLight: '',
          caseLightOpts: [
            { text: '🔵 審核中', value: 'info' },
            { text: '🟢 公告中', value: 'success' },
            { text: '🟡 快到期', value: 'warning' },
            { text: '🔴 已到期', value: 'danger' }
          ]
        }
      }
      if (val) {
        this.advOpts.caseReasonOpts = [...new Set(val.map(item => item.登記原因))].sort()
        this.advOpts.caseStateOpts = [...new Set(val.map(item => item.辦理情形))].sort()
        this.advOpts.casePreliminatorOpts = [...new Set(val.map(item => item.初審人員))].sort()
        this.advOpts.caseYearOpts = [...new Set(val.map(item => item.RM01))].sort()
        this.advOpts.caseWordOpts = [...new Set(val.map(item => item.RM02))].sort()
        this.advOpts.caseAnnouncementDateOpts = [...new Set(val.map(item => item.公告日期))].sort()
        this.advOpts.caseAnnouncementDeadlineOpts = [...new Set(val.map(item => item.公告期滿日期))].sort()

        this.advOpts.caseReasonOpts.unshift('')
        this.advOpts.caseStateOpts.unshift('')
        this.advOpts.casePreliminatorOpts.unshift('')
        this.advOpts.caseYearOpts.unshift('')
        this.advOpts.caseWordOpts.unshift('')
        this.advOpts.caseAnnouncementDateOpts.unshift('')
        this.advOpts.caseAnnouncementDeadlineOpts.unshift('')
        this.advOpts.caseLightOpts.unshift('')

        // this.$store.commit('expiry/list', this.queriedJson.items || [])
        // this.$store.commit('expiry/list_by_id', this.queriedJson.items_by_id || {})
      }
    }
  },
  methods: {
    resetCountdown () {
      if (this.$refs.countdown) {
        this.getCacheExpireRemainingTime(this.cacheKey).then(
          (remainMs) => {
            this.$refs.countdown.setCountdown(remainMs)
            this.$refs.countdown.startCountdown()
            this.$utils.log(`${this.cacheKey} 快取資料將在 ${(remainMs / 1000).toFixed(1)} 秒後到期。`)
          }
        )
      }
    },
    reload () {
      this.removeCache(this.cacheKey).then(() => {
        this.forceReload = true
        this.$fetch()
      })
    },
    reset () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          caseYear: '',
          caseWord: '',
          caseNum: '',
          caseReason: '',
          caseState: '',
          casePreliminator: '',
          caseOperator: '',
          caseAnnouncementDate: '',
          caseAnnouncementDeadline: '',
          caseLight: ''
        }
      }
      // this.$store.commit('expiry/list', this.queriedJson.items || [])
    },
    xlsx () {
      // prepare json objects for xlsx exporting
      const jsons = this.filterBakedData.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (key !== '公告燈號' && this.fieldKeys.includes(key)) {
            obj[key] = value
          }
        }
        return obj
      })
      this.downloadXlsx('公告案件', jsons)
    }
  }
}
</script>

<style lang="scss" scoped>
.move-table-up {
  margin-top: -25px;
}
.fixed-height-table {
  height: calc(100% - 20px);
}
</style>
