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

      .d-flex.align-items-center
        b-link.mr-1.text-muted.s-85(
          v-if="advTags.length > 0",
          @click="reset"
        ) 重設
        lah-button(
          icon="search-plus",
          size="lg",
          title="開啟進階篩選視窗",
          @click="$refs.searchPlus.show()",
          :disabled="!dataReady"
        ) 進階篩選
        lah-button-xlsx.mx-1(
          :jsons="xlsxData",
          header="公告案件"
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

  // MODIFIED: 替換 b-tags 為 b-form-tag 的 v-for 迴圈
  lah-transition
    .d-flex.flex-wrap.align-items-center.border-0.mt-n3.p-0.my-2(v-if="advTags.length > 0")
      b-form-tag(
        v-for="(tag, idx) in advTags"
        :key="`tag-${idx}`"
        @remove="removeAdvTag(tag)"
        :title="`移除篩選：${tag.text}`"
        :variant="tag.variant"
        pill
        class="mr-1 mb-1 b-tag-size"
      ) {{ tag.text }}

  lah-transition(appear): lah-reg-b-table(
    :busy="isBusy || filtering"
    :baked-data="filterBakedData"
    :fields="fields"
    :alt-max-height-offset="80"
  )
  lah-transition.center.h3: lah-fa-icon(
    v-cloak
    v-if="queryCount === 0 && !isBusy"
    icon="exclamation-circle"
    prefix="fas"
  ) 無資料

  b-modal(
    ref="searchPlus",
    title="進階篩選 - 按住 Ctrl 鍵可多選",
    hide-footer
  )
    b-form-row.mb-1
      b-col
        b-form-group(label="收件號")
          b-input(v-model="advOpts.caseNum", trim, placeholder="... 可輸入部分或完整數字 ...")
    b-form-row.my-1
      b-col(md="6")
        b-form-group(label="收件字")
          b-form-select(
            v-model="advOpts.caseWords",
            :options="advOpts.caseWordOpts",
            multiple,
            :select-size="4"
          )
      b-col(md="6")
        b-form-group(label="登記原因")
          b-form-select(
            v-model="advOpts.caseReasons",
            :options="advOpts.caseReasonOpts",
            multiple,
            :select-size="4"
          )
    b-form-row
      b-col(md="6")
        b-form-group(label="辦理情形")
          b-form-select(
            v-model="advOpts.caseStates",
            :options="advOpts.caseStateOpts",
            multiple,
            :select-size="4"
          )
      b-col(md="6")
        b-form-group(label="初審人員")
          b-form-select(
            v-model="advOpts.casePreliminators",
            :options="advOpts.casePreliminatorOpts",
            multiple,
            :select-size="4"
          )
    b-form-row.my-1
      b-col(md="6")
        b-form-group(label="公告日期")
          b-form-select(
            v-model="advOpts.caseAnnouncementDates",
            :options="advOpts.caseAnnouncementDateOpts",
            multiple,
            :select-size="4"
          )
      b-col(md="6")
        b-form-group(label="期滿日期")
          b-form-select(
            v-model="advOpts.caseAnnouncementDeadlines",
            :options="advOpts.caseAnnouncementDeadlineOpts",
            multiple,
            :select-size="4"
          )
    b-form-row
      b-col(md="6")
        b-form-group(label="狀態燈號")
          b-form-select(
            v-model="advOpts.caseLights",
            :options="advOpts.caseLightOpts",
            multiple,
            :select-size="4"
          )

    hr
    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="reset",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ filterBakedData.length }} 筆
      lah-fa-icon.ml-1(v-if="filtering", icon="sync-alt", action="spin", variant="danger",title="篩選中 ... ")
</template>

<script>
export default {
  fetchOnServer: false,
  data: () => ({
    bakedData: [],
    committed: false,
    cachedMs: 12 * 60 * 60 * 1000,
    forceReload: false,
    fields: [
      { key: '序號', sortable: false },
      { key: '公告燈號', label: '狀態', sortable: true },
      { key: '收件字號', sortable: true },
      { key: '登記原因', sortable: true },
      { key: '辦理情形', sortable: true },
      { key: '初審人員', sortable: true },
      { key: '公告日期', sortable: true },
      { key: '公告期滿日期', label: '期滿日期', sortable: true }
    ],
    filtering: false,
    advOpts: {
      caseWords: [],
      caseWordOpts: [],
      caseNum: '',
      caseReasons: [],
      caseReasonOpts: [],
      caseStates: [],
      caseStateOpts: [],
      caseLights: [],
      caseLightOpts: [],
      casePreliminators: [],
      casePreliminatorOpts: [],
      caseAnnouncementDates: [],
      caseAnnouncementDateOpts: [],
      caseAnnouncementDeadlines: [],
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
              this.$refs.countdown?.setCountdown(remainMs)
            } else {
              this.$refs.countdown?.setCountdown(this.cachedMs)
            }
            this.getCacheExpireRemainingTime(this.cacheKey).then((trueRemainMs) => {
              this.$utils.log(`${this.cacheKey} 快取資料將在 ${(trueRemainMs / 1000).toFixed(1)} 秒後到期。`)
            })
            this.$refs.countdown?.startCountdown()
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
    cacheKey () { return 'reg_rm30_H_case' },
    // MODIFIED: advTags 現在回傳物件陣列，包含 variant, type, value 等資訊
    advTags () {
      const tags = []
      // 為不同篩選類型定義樣式與前綴
      const config = [
        { type: 'caseNum', prefix: '號', variant: 'secondary' },
        { type: 'caseWords', prefix: '字', variant: 'primary' },
        { type: 'caseReasons', prefix: '原因', variant: 'success' },
        { type: 'caseStates', prefix: '情形', variant: 'danger' },
        { type: 'casePreliminators', prefix: '初審', variant: 'warning' },
        { type: 'caseLights', prefix: '狀態', variant: 'info' },
        { type: 'caseAnnouncementDates', prefix: '公告日', variant: 'dark' },
        { type: 'caseAnnouncementDeadlines', prefix: '期滿日', variant: 'light' }
      ]

      config.forEach(({ type, prefix, variant }) => {
        const value = this.advOpts[type]
        // 處理陣列類型的篩選 (例如：收件字、登記原因)
        if (Array.isArray(value)) {
          value.forEach((val) => {
            let text = val
            // 特殊處理：狀態燈號顯示文字而非原始值
            if (type === 'caseLights') {
              const found = this.advOpts.caseLightOpts.find(opt => opt.value === val)
              text = found ? found.text : val
            }
            tags.push({ type, value: val, text: `${prefix}：${text}`, variant })
          })
        // 處理字串類型的篩選 (例如：收件號)
        } else if (!this.$utils.empty(value)) {
          tags.push({ type, value, text: `${prefix}：${value}`, variant })
        }
      })

      return tags
    },
    filterBakedData () {
      if (this.advTags.length === 0) {
        return this.bakedData
      }
      this.filtering = true
      const filtered = this.bakedData.filter((item) => {
        const numMatch = this.$utils.empty(this.advOpts.caseNum) || item.收件字號.includes(this.advOpts.caseNum)
        const wordMatch = this.advOpts.caseWords.length === 0 || this.advOpts.caseWords.includes(item.RM02)
        const reasonMatch = this.advOpts.caseReasons.length === 0 || this.advOpts.caseReasons.includes(item.登記原因)
        const stateMatch = this.advOpts.caseStates.length === 0 || this.advOpts.caseStates.includes(item.辦理情形)
        const preliminatorMatch = this.advOpts.casePreliminators.length === 0 || this.advOpts.casePreliminators.includes(item.初審人員)
        const lightMatch = this.advOpts.caseLights.length === 0 || this.advOpts.caseLights.includes(item.公告燈號)
        const announcementMatch = this.advOpts.caseAnnouncementDates.length === 0 || this.advOpts.caseAnnouncementDates.includes(item.公告日期)
        const deadlineMatch = this.advOpts.caseAnnouncementDeadlines.length === 0 || this.advOpts.caseAnnouncementDeadlines.includes(item.公告期滿日期)
        return numMatch && wordMatch && reasonMatch && stateMatch && preliminatorMatch && lightMatch && announcementMatch && deadlineMatch
      })
      // NOTE: 使用 $nextTick 延遲更新狀態，避免 computed property 的潛在問題
      this.$nextTick(() => {
        this.filtering = false
      })
      return filtered
    },
    xlsxData () {
      const jsons = this.filterBakedData.map((data) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (key !== '公告燈號' && this.fieldKeys.includes(key)) {
            obj[key] = value
          }
        }
        return obj
      })
      return jsons
    },
    fieldKeys () {
      return this.fields.map(field => field.key)
    }
  },
  watch: {
    bakedData (val) {
      this.reset()
      if (val) {
        const caseWordOptions = [...new Set(val.map(item => item.RM02))].sort()
        this.advOpts.caseWordOpts = caseWordOptions
        // MODIFIED: 增加 H[1-8] 開頭的預選條件
        const regex = /^H[A-H]|^H[1-8]|[A-H]1$/
        this.advOpts.caseWords = caseWordOptions.filter(opt => regex.test(opt))

        this.advOpts.caseReasonOpts = [...new Set(val.map(item => item.登記原因))].sort()
        this.advOpts.caseStateOpts = [...new Set(val.map(item => item.辦理情形))].sort()
        this.advOpts.casePreliminatorOpts = [...new Set(val.map(item => item.初審人員))].sort()
        this.advOpts.caseAnnouncementDateOpts = [...new Set(val.map(item => item.公告日期))].sort()
        this.advOpts.caseAnnouncementDeadlineOpts = [...new Set(val.map(item => item.公告期滿日期))].sort()
        this.advOpts.caseLightOpts = [
          { text: '🔵 審核中', value: 'info' },
          { text: '🟢 公告中', value: 'success' },
          { text: '🟡 快到期', value: 'warning' },
          { text: '🔴 已到期', value: 'danger' }
        ]
      }
    }
  },
  methods: {
    // ADDED: 處理 b-form-tag 移除事件的方法
    removeAdvTag (tagToRemove) {
      const { type, value } = tagToRemove
      // 如果是收件號(字串)，直接清空
      if (type === 'caseNum') {
        this.advOpts.caseNum = ''
      // 如果是其他(陣列)，從陣列中移除該項目
      } else if (Array.isArray(this.advOpts[type])) {
        const index = this.advOpts[type].indexOf(value)
        if (index > -1) {
          this.advOpts[type].splice(index, 1)
        }
      }
    },
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
      this.advOpts.caseNum = ''
      this.advOpts.caseWords = []
      this.advOpts.caseReasons = []
      this.advOpts.caseStates = []
      this.advOpts.casePreliminators = []
      this.advOpts.caseLights = []
      this.advOpts.caseAnnouncementDates = []
      this.advOpts.caseAnnouncementDeadlines = []
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
.b-tag-size {
  font-size: .95rem;
}
</style>
