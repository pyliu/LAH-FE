<template lang="pug">
div
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 謄本調閱紀錄檢索
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 請參照下列步驟搜尋
          ol
            li 可切換日期或是統編查詢
            li 日期區間查詢預設今日
            li 點擊 #[lah-fa-icon(icon="search" variant="primary" no-gutter)] 搜尋

      .d-flex
        b-form-radio-group.d-flex.text-nowrap.my-auto.small(
          v-model="searchType"
          :options="searchTypeOpts"
        )
        lah-datepicker(
          v-model="dateRange",
          @input="handleDateChanged"
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
          :disabled="!committed || paginationCount === 0",
          no-icon-gutter
        )
        lah-button-xlsx.mx-1(
          :jsons="xlsxData",
          header="謄本調閱紀錄"
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
      aria-controls="cusmm-table"
      class="my-auto mr-2"
    )
    b-checkbox.my-auto.ml-auto(v-model="hidePersonals", switch) 遮蔽個資
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
        v-if="searchType === 'reg'"
      )
      lah-reg-b-table(
        v-else
        :busy="isBusy"
        :baked-data="filterSurBakedData"
        :fields="surFields"
        :per-page="perPage"
        :current-page="currentPage"
        :caption-append="captionRange"
        :max-height-offset="160"
      )
    h3(v-else class="text-center"): lah-fa-icon(icon="search" action="breath" variant="primary") 請點擊查詢按鈕

  b-modal(
    ref="searchPlus",
    title="進階搜尋",
    hide-footer
  )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="統編"): b-select(
        v-model="advOpts.id",
        :options="advOpts.idOpts",
        title="非專代統編"
      )
      b-input-group(prepend="名稱"): b-select(
        v-model="advOpts.name",
        :options="advOpts.nameOpts",
        title="非專代名稱"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="電話"): b-select(
        v-model="advOpts.tel",
        :options="advOpts.telOpts",
        title="非專代電話"
      )
      b-input-group(prepend="日期"): b-select(
        v-model="advOpts.date",
        :options="advOpts.dateOpts",
        title="收件日期"
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
      startDate: `${firstDayofMonth.getFullYear() - 1911}${('0' + (firstDayofMonth.getMonth() + 1)).slice(-2)}${('0' + firstDayofMonth.getDate()).slice(-2)}`,
      endDate: `${lastDayofMonth.getFullYear() - 1911}${('0' + (lastDayofMonth.getMonth() + 1)).slice(-2)}${('0' + lastDayofMonth.getDate()).slice(-2)}`,
      firstDayofMonth,
      lastDayofMonth,
      today,
      yesterday
    }
  },
  data: () => ({
    clickedId: undefined,
    forceReload: false,
    committed: false,
    hidePersonals: true,
    dateRange: {
      begin: '',
      end: '',
      days: 0
    },
    regBakedData: [],
    regFields: [
      {
        key: '收件字號',
        sortable: true
      },
      {
        key: '收件日期',
        sortable: true
      },
      {
        key: '登記原因',
        sortable: true
      },
      {
        key: 'AB01',
        label: '非專代統編',
        sortable: true
      },
      {
        key: 'AB02',
        label: '非專代名稱',
        sortable: true
      },
      {
        key: 'AB03',
        label: '非專代住址',
        sortable: true
      },
      {
        key: 'AB04_NON_SCRIVENER_TEL',
        label: '非專代電話',
        sortable: true
      },
      {
        key: 'AB13',
        label: '當年案件量',
        sortable: true
      },
      {
        key: 'AB23',
        label: '本所案件量',
        sortable: true
      },
      {
        key: '權利人姓名',
        sortable: true
      },
      {
        key: '權利人住址',
        sortable: true
      },
      {
        key: '義務人姓名',
        sortable: true
      },
      {
        key: '義務人住址',
        sortable: true
      },
      {
        key: '區名稱',
        sortable: true
      },
      {
        key: '段小段',
        sortable: true
      },
      {
        key: 'RM12_C',
        label: '地號',
        sortable: true
      },
      {
        key: 'RM15_C',
        label: '建號',
        sortable: true
      }
    ],
    currentPage: 1,
    perPage: 20,
    searchType: 'date',
    searchTypeOpts: [
      { text: '日期', value: 'date' },
      { text: '統編', value: 'id' }
    ],
    surBakedData: [],
    surFields: [
      {
        key: 'MM123',
        label: '收件字號',
        sortable: true
      },
      {
        key: '收件日期',
        sortable: true
      },
      {
        key: '申請事由',
        sortable: true
      },
      {
        key: 'AB01',
        label: '非專代統編',
        sortable: true
      },
      {
        key: 'AB02',
        label: '非專代名稱',
        sortable: true
      },
      {
        key: 'AB03',
        label: '非專代住址',
        sortable: true
      },
      {
        key: 'AB04_NON_SCRIVENER_TEL',
        label: '非專代電話',
        sortable: true
      },
      {
        key: 'AB13',
        label: '當年案件量',
        sortable: true
      },
      {
        key: 'AB23',
        label: '本所案件量',
        sortable: true
      },
      {
        key: 'MM13',
        label: '申請人統編',
        sortable: true
      },
      {
        key: 'MM14',
        label: '申請人姓名',
        sortable: true
      },
      {
        key: 'MM15',
        label: '申請人電話',
        sortable: true
      },
      {
        key: 'MM16',
        label: '申請人住址',
        sortable: true
      },
      {
        key: 'RM10_C_KCNT',
        label: '區名稱',
        sortable: true
      },
      {
        key: 'RM11_C_KCNT',
        label: '段小段',
        sortable: true
      },
      {
        key: 'RM12_C',
        label: '地號',
        sortable: true
      },
      {
        key: 'RM15_C',
        label: '建號',
        sortable: true
      }
    ],
    advOpts: {
      id: '',
      idOpts: [],
      name: '',
      nameOpts: [],
      tel: '',
      telOpts: [],
      date: '',
      dateOpts: []
    }
  }),
  fetch () {
    this.resetCommitted()
    this.searchType === 'reg' ? this.loadReg() : this.loadSur()
  },
  head: {
    title: '非專業代理人案件-桃園市地政局'
  },
  computed: {
    md5Hash () {
      return this.$utils.md5(`${this.startDate}_${this.endDate}_${this.hidePersonals}`)
    },
    cacheKey () {
      const key = this.searchType === 'reg' ? `non_scrivener_reg_case_${this.md5Hash}` : `non_scrivener_sur_case_${this.md5Hash}`
      return key
    },
    captionRange () {
      return `【${this.startDate.substring(0, 3)}-${this.startDate.substring(3, 5)}-${this.startDate.substring(5)} ~ ${this.endDate.substring(0, 3)}-${this.endDate.substring(3, 5)}-${this.endDate.substring(5)}】`
    },
    fetchType () { return this.searchType === 'reg' ? 'reg_non_scrivener_reg_case' : 'reg_non_scrivener_sur_case' },
    showPagination () {
      if (this.searchType === 'reg') {
        return !this.$utils.empty(this.filterRegBakedData) && this.filterRegBakedData.length > this.perPage
      }
      return !this.$utils.empty(this.filterSurBakedData) && this.filterSurBakedData.length > this.perPage
    },
    paginationCount () {
      if (this.searchType === 'reg') {
        return this.filterRegBakedData.length
      }
      return this.filterSurBakedData.length
    },
    advTags () {
      const tags = []
      if (!this.$utils.empty(this.advOpts.id)) {
        tags.push(`統編：${this.advOpts.id}`)
      }
      if (!this.$utils.empty(this.advOpts.name)) {
        tags.push(`名稱：${this.advOpts.name}`)
      }
      if (!this.$utils.empty(this.advOpts.tel)) {
        tags.push(`非專代電話：${this.advOpts.tel}`)
      }
      if (!this.$utils.empty(this.advOpts.date)) {
        tags.push(`收件日期：${this.advOpts.date}`)
      }
      return tags
    },
    filterRegBakedData () {
      return this.filterBakedData(this.regBakedData)
    },
    filterSurBakedData () {
      return this.filterBakedData(this.surBakedData)
    },
    filterDataCount () {
      return this.searchType === 'reg' ? this.filterRegBakedData.length : this.filterSurBakedData.length
    },
    xlsxData () {
      return this.searchType === 'reg' ? this.prepareRegJsons() : this.prepareSurJsons()
    }
  },
  watch: {
    searchType (val) {
      this.$fetch()
    },
    regBakedData (val) {
      this.refreshAdvOptsSelect(val)
    },
    surBakedData (val) {
      this.refreshAdvOptsSelect(val)
    },
    hidePersonals (flag) {
      this.reload()
    },
    filterRegBakedData (dontcare) {
      this.currentPage = 1
    },
    filterSurBakedData (dontcare) {
      this.currentPage = 1
    }
  },
  methods: {
    handleDateChanged (data) {
      this.startDate = data.begin
      this.endDate = data.end
    },
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    resetCommitted () {
      this.committed = false
      this.regBakedData = []
      this.surBakedData = []
      this.currentPage = 1
    },
    doneCommitted () {
      this.isBusy = false
      this.forceReload = false
      this.committed = true
    },
    loadReg () {
      // restore cached data if found
      this.getCache(this.cacheKey).then((json) => {
        if (this.forceReload || json === false) {
          if (this.isBusy) {
            this.notify('讀取中 ... 請稍後再試', { type: 'warning' })
          } else {
            this.isBusy = true
            this.$axios.post(this.$consts.API.JSON.PREFETCH, {
              type: 'reg_non_scrivener_reg_case',
              start_date: this.startDate,
              end_date: this.endDate,
              reload: this.forceReload,
              ignore: this.hidePersonals
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
              this.doneCommitted()
            })
          }
        } else {
          this.regBakedData = json.baked
          this.doneCommitted()
          this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
            this.notify(`查詢成功，找到 ${this.regBakedData.length} 筆非專業代理人登記案件。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
            if (this.$refs.countdown) {
              this.$refs.countdown.setCountdown(remaining)
              this.$refs.countdown.startCountdown()
            }
          })
        }
      })
    },
    loadSur () {
      // restore cached data if found
      this.getCache(this.cacheKey).then((json) => {
        if (this.forceReload || json === false) {
          if (this.isBusy) {
            this.notify('讀取中 ... 請稍後再試', { type: 'warning' })
          } else {
            this.isBusy = true
            this.$axios.post(this.$consts.API.JSON.PREFETCH, {
              type: 'reg_non_scrivener_sur_case',
              start_date: this.startDate,
              end_date: this.endDate,
              reload: this.forceReload,
              ignore: this.hidePersonals
            }).then(({ data }) => {
              this.surBakedData = data.baked || []
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
              this.doneCommitted()
            })
          }
        } else {
          this.surBakedData = json.baked
          this.doneCommitted()
          this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
            this.notify(`查詢成功，找到 ${this.surBakedData.length} 筆非專業代理人測量案件。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
            if (this.$refs.countdown) {
              this.$refs.countdown.setCountdown(remaining)
              this.$refs.countdown.startCountdown()
            }
          })
        }
      })
    },
    prepareRegJsons () {
      const fieldKeys = this.regFields.map((field, idx, array) => field.key)
      return this.filterRegBakedData.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (fieldKeys.includes(key)) {
            switch (key) {
              case 'AB01':
                obj['非專代統編'] = value
                break
              case 'AB02':
                obj['非專代名稱'] = value
                break
              case 'AB03':
                obj['非專代住址'] = value
                break
              case 'AB04_NON_SCRIVENER_TEL':
                obj['非專代電話'] = value
                break
              case 'AB13':
                obj['當年案件量'] = value
                break
              case 'AB23':
                obj['本所案件量'] = value
                break
              case 'RM12_C':
                obj['地號'] = value
                break
              case 'RM15_C':
                obj['建號'] = value
                break
              default:
                obj[key] = value
            }
          }
        }
        return obj
      })
    },
    prepareSurJsons () {
      const fieldKeys = this.surFields.map((field, idx, array) => field.key)
      return this.filterSurBakedData.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (fieldKeys.includes(key)) {
            switch (key) {
              case 'AB01':
                obj['非專代統編'] = value
                break
              case 'AB02':
                obj['非專代名稱'] = value
                break
              case 'AB03':
                obj['非專代住址'] = value
                break
              case 'AB04_NON_SCRIVENER_TEL':
                obj['非專代電話'] = value
                break
              case 'MM123':
                obj['收件字號'] = value
                break
              case 'AB13':
                obj['當年案件量'] = value
                break
              case 'AB23':
                obj['本所案件量'] = value
                break
              case 'RM11_C_KCNT':
                obj['段小段'] = value
                break
              case 'RM10_C_KCNT':
                obj['區名稱'] = value
                break
              case 'MM16':
                obj['申請人住址'] = value
                break
              case 'MM15':
                obj['申請人電話'] = value
                break
              case 'MM14':
                obj['申請人姓名'] = value
                break
              case 'MM13':
                obj['申請人統編'] = value
                break
              case 'RM12_C':
                obj['地號'] = value
                break
              case 'RM15_C':
                obj['建號'] = value
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
          id: '',
          name: '',
          tel: '',
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
          tel: '',
          telOpts: [],
          date: '',
          dateOpts: []
        }
      }
      if (val) {
        this.advOpts.idOpts = [...new Set(val.map(item => item.AB01))].sort()
        this.advOpts.nameOpts = [...new Set(val.map(item => item.AB02))].sort()
        this.advOpts.telOpts = [...new Set(val.map(item => item.AB04_NON_SCRIVENER_TEL))].sort()
        this.advOpts.dateOpts = [...new Set(val.map(item => item.收件日期))].sort()
        this.advOpts.idOpts.unshift('')
        this.advOpts.nameOpts.unshift('')
        this.advOpts.telOpts.unshift('')
        this.advOpts.dateOpts.unshift('')
      }
    },
    filterBakedData (source) {
      if (this.advTags.length > 0) {
        let pipelineItems = source
        const checkId = !this.$utils.empty(this.advOpts.id)
        if (checkId) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.AB01.match(this.advOpts.id) !== null
          })
        }
        const checkName = !this.$utils.empty(this.advOpts.name)
        if (checkName) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.AB02 === this.advOpts.name
          })
        }
        const checkTel = !this.$utils.empty(this.advOpts.tel)
        if (checkTel) {
          pipelineItems = pipelineItems.filter((item) => {
            if (item.AB04_NON_SCRIVENER_TEL) {
              return item.AB04_NON_SCRIVENER_TEL.match(this.advOpts.tel) !== null
            }
            return false
          })
        }
        const checkDate = !this.$utils.empty(this.advOpts.date)
        if (checkDate) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件日期.match(this.advOpts.date) !== null
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
