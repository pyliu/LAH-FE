<template lang="pug">
div
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 實價登錄案件控管 ({{ filterDataCount }})
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 請參照下列步驟搜尋
          ol
            li 選擇日期區間(預設為目前月份)
            li 點擊 #[lah-fa-icon(icon="search" variant="primary" no-gutter)] 搜尋

      .d-flex
        b-datepicker(
          v-model="startDateObj"
          placeholder="開始日期"
          boundary="viewport"
          size="sm"
          :date-format-options="{ weekday: 'narrow' }"
          :max="yesterday"
          value-as-date
          hide-header
          dropleft
        )
        .my-auto ～
        b-datepicker.mr-1(
          v-model="endDateObj"
          placeholder="截止日期"
          boundary="viewport"
          size="sm"
          :date-format-options="{ weekday: 'narrow' }"
          :max="today"
          :min="startDateObj"
          hide-header
          dark
          value-as-date
        )
        lah-button.mx-1(
          icon="search"
          size="lg"
          title="搜尋"
          @click="$fetch"
          :disabled="isBusy"
          :busy="isBusy"
          no-icon-gutter
        )
        lah-button(
          icon="search-plus",
          size="lg",
          title="開啟進階搜尋視窗",
          @click="$refs.searchPlus.show()",
          :disabled="!committed",
          no-icon-gutter
        )
        lah-button-xlsx.mx-1(
          :jsons="xlsxData",
          header="實價登錄檢核案件"
        )
        lah-countdown-button(
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          variant="outline-secondary"
          badge-variant="secondary"
          title="強制重新搜尋"
          :milliseconds="0"
          :disabled="isBusy"
          :busy="isBusy"
          @end="reload"
          @click="reload"
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
  .d-flex.mb-1
    b-pagination(
      v-if="showPagination"
      v-model="currentPage"
      :total-rows="paginationCount"
      :per-page="perPage"
      last-number
      first-number
      aria-controls="scrivener-table"
      class="my-auto mr-2"
    )
  lah-transition
    div(v-if="committed")
      lah-reg-b-table(
        :busy="isBusy"
        :baked-data="filterRegBakedData"
        :fields="regFields"
        :per-page="perPage"
        :current-page="currentPage"
        :caption-append="captionRange"
        :max-height-offset="160"
        no-caption
      )
    h3(v-else class="text-center"): lah-fa-icon(icon="search" action="breath" variant="primary") 請點擊查詢按鈕

  b-modal(
    ref="searchPlus",
    title="進階搜尋",
    hide-footer
  )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="段小段"): b-select(
        v-model="advOpts.sectId",
        :options="advOpts.sectIdOpts",
        title="段小段"
      )
      b-input-group(prepend="申報書"): b-select(
        v-model="advOpts.caseNo",
        :options="advOpts.caseNoOpts",
        title="申報書序號"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="地號"): b-select(
        v-model="advOpts.landNum",
        :options="advOpts.landNumOpts",
        title="地號"
      )
      b-input-group(prepend="建號"): b-select(
        v-model="advOpts.buildingNum",
        :options="advOpts.buildingNumOpts",
        title="建號"
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
export default {
  fetchOnServer: false,
  asyncData (nuxt) {
    const today = new Date()
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    const firstDayofMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayofMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return {
      startDateObj: firstDayofMonth,
      endDateObj: lastDayofMonth,
      startDate: `${firstDayofMonth.getFullYear() - 1911}${('0' + (firstDayofMonth.getMonth() + 1)).slice(-2)}${('0' + firstDayofMonth.getDate()).slice(-2)}`,
      endDate: `${lastDayofMonth.getFullYear() - 1911}${('0' + (lastDayofMonth.getMonth() + 1)).slice(-2)}${('0' + lastDayofMonth.getDate()).slice(-2)}`,
      firstDayofMonth,
      lastDayofMonth,
      today,
      yesterday
    }
  },
  data: () => ({
    forceReload: false,
    committed: false,
    regBakedData: [],
    regFields: [
      {
        key: '收件字號',
        sortable: true
      },
      {
        key: 'RM11',
        label: '段代碼',
        sortable: true
      },
      {
        key: '段小段',
        label: '段名',
        sortable: true
      },
      {
        key: 'RM12',
        label: '地號',
        sortable: true
      },
      {
        key: 'RM15',
        label: '建號',
        sortable: true
      },
      {
        key: 'P1MP_CASENO',
        label: '申報書序號',
        sortable: true
      }
      // {
      //   key: 'P1MP_CASETYPE',
      //   label: '申報類別',
      //   sortable: true
      // },
      // {
      //   key: 'P1MP_INSDATE',
      //   label: '輸入日期',
      //   sortable: true
      // },
      // {
      //   key: 'P1MP_INSTIME',
      //   label: '輸入時間',
      //   sortable: true
      // },
      // {
      //   key: 'P1MP_INSUSER',
      //   label: '輸入人員',
      //   sortable: true
      // }
    ],
    currentPage: 1,
    perPage: 20,
    advOpts: {
      sectId: '',
      sectIdOpts: [],
      landNum: '',
      landNumOpts: [],
      caseNo: '',
      caseNoOpts: [],
      buildingNum: '',
      buildingNumOpts: []
    }
  }),
  fetch () {
    // reset cached data
    this.reset()
    // restore cached data if found
    this.getCache(this.cacheKey).then((json) => {
      if (this.forceReload || json === false) {
        if (this.isBusy) {
          this.notify('讀取中 ... 請稍後再試', { type: 'warning' })
        } else {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'val_realprice_map',
            start_date: this.startDate,
            end_date: this.endDate,
            reload: this.forceReload
          }).then(({ data }) => {
            this.regBakedData = data.baked || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
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
            this.loaded()
          })
        }
      } else {
        this.regBakedData = json.baked
        this.loaded()
        this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
          this.notify(`查詢成功，找到 ${this.regBakedData.length} 筆實價登錄控管案件。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
          if (this.$refs.countdown) {
            this.$refs.countdown.setCountdown(remaining)
            this.$refs.countdown.startCountdown()
          }
        })
      }
    })
  },
  head: {
    title: '實價登錄案件控管-桃園市地政局'
  },
  computed: {
    md5Hash () {
      return this.$utils.md5(`${this.startDate}_${this.endDate}`)
    },
    cacheKey () {
      return `realprice_mgmt_${this.md5Hash}`
    },
    captionRange () {
      return `【${this.startDate.substring(0, 3)}-${this.startDate.substring(3, 5)}-${this.startDate.substring(5)} ~ ${this.endDate.substring(0, 3)}-${this.endDate.substring(3, 5)}-${this.endDate.substring(5)}】`
    },
    showPagination () {
      return !this.$utils.empty(this.filterRegBakedData) && this.filterRegBakedData.length > this.perPage
    },
    paginationCount () {
      return this.filterRegBakedData.length
    },
    advTags () {
      const tags = []
      if (!this.$utils.empty(this.advOpts.sectId)) {
        tags.push(`段小段：${this.advOpts.sectId}`)
      }
      if (!this.$utils.empty(this.advOpts.landNum)) {
        tags.push(`地號：${this.advOpts.landNum}`)
      }
      if (!this.$utils.empty(this.advOpts.buildingNum)) {
        tags.push(`建號：${this.advOpts.buildingNum}`)
      }
      if (!this.$utils.empty(this.advOpts.caseNo)) {
        tags.push(`申報書序號：${this.advOpts.caseNo}`)
      }
      return tags
    },
    filterRegBakedData () {
      return this.filterBakedData(this.regBakedData)
    },
    filterDataCount () {
      return this.filterRegBakedData.length
    },
    xlsxData () {
      return this.prepareRegJsons()
    }
  },
  watch: {
    startDateObj (val) {
      this.startDate = `${val.getFullYear() - 1911}${('0' + (val.getMonth() + 1)).slice(-2)}${('0' + val.getDate()).slice(-2)}`
    },
    endDateObj (val) {
      this.endDate = `${val.getFullYear() - 1911}${('0' + (val.getMonth() + 1)).slice(-2)}${('0' + val.getDate()).slice(-2)}`
    },
    regBakedData (val) {
      this.refreshAdvOptsSelect(val)
    },
    filterRegBakedData (dontcare) {
      this.currentPage = 1
    }
  },
  methods: {
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    reset () {
      this.committed = false
      this.regBakedData = []
      this.currentPage = 1
    },
    loaded () {
      this.isBusy = false
      this.forceReload = false
      this.committed = true
    },
    prepareRegJsons () {
      const fieldKeys = this.regFields.map((field, idx, array) => field.key)
      return this.filterRegBakedData.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (fieldKeys.includes(key)) {
            switch (key) {
              case 'RM11':
                obj['段小段'] = value
                break
              case 'RM12':
                obj['地號'] = value
                break
              case 'RM15':
                obj['建號'] = value
                break
              case 'P1MP_CASENO':
                obj['申報書序號'] = value
                break
              default:
                obj[key] = value
            }
          }
        }
        return obj
      })
    },
    resetAdvOpts () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          sectId: '',
          landNum: '',
          buildingNum: '',
          caseNo: ''
        }
      }
    },
    refreshAdvOptsSelect (val) {
      this.advOpts = {
        ...{
          sectId: '',
          sectIdOpts: [],
          landNum: '',
          landNumOpts: [],
          buildingNum: '',
          buildingNumOpts: [],
          caseNo: '',
          caseNoOpts: []
        }
      }
      if (val) {
        const tmp = [...new Map(val.map((item) => {
          return [
            // 段代碼
            item.RM11,
            {
              value: item.RM11,
              text: `${item.RM11} - ${item.RM11_CHT}`
            }
          ]
        }))].sort()
        this.advOpts.sectIdOpts = [...tmp.map(arr => arr[1])]
        this.advOpts.landNumOpts = [...new Set(val.map(item => item.RM12))].sort().filter(val => val !== null)
        this.advOpts.buildingNumOpts = [...new Set(val.map(item => item.RM15))].sort().filter(val => val !== null)
        this.advOpts.caseNoOpts = [...new Set(val.map(item => item.P1MP_CASENO))].sort().filter(val => val !== null)
        this.advOpts.sectIdOpts.unshift('')
        this.advOpts.landNumOpts.unshift('無地號')
        this.advOpts.landNumOpts.unshift('')
        this.advOpts.buildingNumOpts.unshift('無建號')
        this.advOpts.buildingNumOpts.unshift('')
        this.advOpts.caseNoOpts.unshift('未輸入')
        this.advOpts.caseNoOpts.unshift('')
      }
    },
    filterBakedData (source) {
      if (this.advTags.length > 0) {
        let pipelineItems = source
        const checkId = !this.$utils.empty(this.advOpts.sectId)
        if (checkId) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.RM11.match(this.advOpts.sectId) !== null
          })
        }
        const checkLandNum = !this.$utils.empty(this.advOpts.landNum)
        if (checkLandNum) {
          pipelineItems = pipelineItems.filter((item) => {
            if (this.advOpts.buildingNum === '無地號') {
              return this.$utils.empty(item.RM12)
            }
            return item.RM12 === this.advOpts.landNum
          })
        }
        const checkBuildingNum = !this.$utils.empty(this.advOpts.buildingNum)
        if (checkBuildingNum) {
          pipelineItems = pipelineItems.filter((item) => {
            if (this.advOpts.buildingNum === '無建號') {
              return this.$utils.empty(item.RM15)
            }
            return item.RM15 === this.advOpts.buildingNum
          })
        }
        const checkCaseNo = !this.$utils.empty(this.advOpts.caseNo)
        if (checkCaseNo) {
          pipelineItems = pipelineItems.filter((item) => {
            if (this.advOpts.caseNo === '未輸入') {
              return this.$utils.empty(item.P1MP_CASENO)
            }
            return item.P1MP_CASENO === this.advOpts.caseNo
          })
        }
        return pipelineItems
      }
      return source
    }
  }
}
</script>

<style lang="scss" scoped>
.move-table-up {
  margin-top: -25px;
}
.fixed-height-table {
  max-height: calc(100% - 135px);
}
.tags-input {
  width: 100vw;
}
</style>
