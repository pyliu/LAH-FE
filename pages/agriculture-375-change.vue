<template lang="pug">
  div
    lah-header: lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 375租約異動
          lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
          lah-help-modal(:modal-id="'help-modal'")
            h5 資料庫搜尋說明
            ol
              li 搜尋土標部之其他登記事項標註為「A6」資料
            h5 請參照下列步驟搜尋
            ol
              li 選擇查詢區間
              li 選擇查詢類別
              li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]
            hr
            h5 支援以下兩種查詢類別
            ol
              li 土地標示部
              li 土地所有權部

        .d-flex.small
          b-pagination.my-auto.mr-1(
            v-if="!$utils.empty(rows)"
            v-model="currentPage"
            :total-rows="rows.length"
            :per-page="perPage"
            last-number
            first-number
            aria-controls="a375-table"
          )
          
          client-only
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
              value-as-date
              hide-header
              dark
            )

          b-input-group.text-nowrap.mr-1: b-form-select.h-100(
            ref="type"
            v-model="qryType"
            :options="qryTypes"
            @change="cached"
          ): template(v-slot:first): b-form-select-option(:value="null" disabled) -- 請選擇查詢類型 --
          lah-button.mr-1(
            ref="search"
            icon="search"
            size="lg"
            title="搜尋"
            :disabled="isBusy || $utils.empty(qryType)"
            @click="$fetch"
            no-icon-gutter
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
            :disabled="isBusy"
            :busy="isBusy"
            @end="reload"
            @click="reload"
            auto-start
            end-attention
            no-badge
          )
    
    lah-transition(appear)
      b-table(
        id="a375-table"
        ref="table"
        caption-top
        sticky-header
        :busy="isBusy"
        :items="rows"
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
        :caption="caption"
        :fields="fields"
        :per-page="perPage"
        :current-page="currentPage"
        :style="maxHeightStyle"
      )
        template(#table-busy): span.ld-txt 讀取中...
        template(v-slot:cell(序號)="data") {{ data.index + 1 }}
        template(#cell(收件字號)="{ item }"): .text-nowrap: b-link(@click="popup(item)").
          {{ item.收件字號 }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
        template(#cell(GG48)="{ item }"): .text-nowrap {{ item.GG48 }}:{{ item.GG48_CHT }}
        template(#cell(GG49)="{ item }"): .text-nowrap {{ landBuildNumber(item) }}
        template(#cell(BA48)="{ item }"): .text-nowrap {{ item.BA48 }}:{{ item.BA48_CHT }}
        template(#cell(BA49)="{ item }"): .text-nowrap {{ landBuildNumber(item) }}
        template(#cell(RM09)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.RM09_CHT }}
        template(#cell(GS_TYPE)="{ item }"): .text-nowrap {{ item.GS_TYPE }}:{{ item.GS_TYPE_CHT }}
        template(#cell(BS_TYPE)="{ item }"): .text-nowrap {{ item.BS_TYPE }}:{{ item.BS_TYPE_CHT }}
    b-modal(
      :id="modalId"
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
</template>

<script>
export default {
  head: {
    title: '375租約異動查詢-桃園市地政局'
  },
  data: () => ({
    cachedMs: 24 * 60 * 60 * 1000,
    modalId: 'this should be an uuid',
    modalLoading: true,
    clickedId: undefined,
    startDate: '1100301',
    endDate: '1100331',
    rows: [],
    perPage: 25,
    currentPage: 1,
    forceReload: false,
    committed: false,
    qryType: 'land',
    qryTypes: [
      { value: 'land', text: '土地標示部' },
      { value: 'owner', text: '土地所有權部' }
    ],
    landFields: [
      {
        key: "收件字號",
        sortable: true,
      },
      {
        key: "RM09",
        label: '登記原因',
        sortable: true,
      },
      {
        key: "RM56_1",
        label: '校對日期',
        sortable: true,
      },
      {
        key: "GS_TYPE",
        label: '異動別',
        sortable: true,
      },
      {
        key: "GG48",
        label: '段別',
        sortable: true,
      },
      {
        key: "GG49",
        label: '地號',
        sortable: true,
      }
    ],
    ownerFields:[
      {
        key: "收件字號",
        sortable: true,
      },
      {
        key: "RM09",
        label: '登記原因',
        sortable: true,
      },
      {
        key: "RM56_1",
        label: '校對日期',
        sortable: true,
      },
      {
        key: "BA48",
        label: '段別',
        sortable: true,
      },
      {
        key: "BA49",
        label: '地號',
        sortable: true,
      },
      {
        key: "BB01",
        label: '登序',
        sortable: true,
      },
      {
        key: "BS_TYPE",
        label: '異動別',
        sortable: true,
      },
      {
        key: "BB09",
        label: '統編',
        sortable: true,
      },
      {
        key: "BB09_NAME",
        label: '權利人',
        sortable: true,
      },
      {
        key: "BB09_ADDR",
        label: '住址',
        sortable: true,
      },
      {
        key: "BB15_1",
        label: '權利類別',
        sortable: true,
      },
      {
        key: "BB15_2",
        label: '分母',
        sortable: true,
      },
      {
        key: "BB15_3",
        label: '分子',
        sortable: true,
      }
    ],
    maxHeight: 600
  }),
  asyncData () {
    const today = new Date()
    return {
      startDateObj: new Date(today.getFullYear(), today.getMonth(), 1), // firstDayofMonth
      endDateObj: new Date(today.getFullYear(), today.getMonth() + 1, 0),  // lastDayofMonth
      yesterday: new Date(new Date().setDate(today.getDate()-1)),
      today: today
    }
  },
  computed: {
    fields () { return this.qryType === 'land' ? this.landFields : this.ownerFields },
    axiosType () { return this.qryType === 'land' ? '375_land_change' : '375_owner_change' },
    queryCount () { return this.rows.length },
    qryTypeText () {
      switch (this.qryType) {
        case 'land':
          return '土地標示部'
        case 'owner':
          return '土地所有權部'
        default:
          return `不支援的型別【${this.qryType}】`
      }
    },
    cacheKey () { return `query_375_${this.qryType}_${this.startDate}_${this.endDate}` },
    maxHeightStyle () { return `max-height: ${this.maxHeight}px` },
    caption () { return `找到 ${this.queryCount} 筆「${this.qryTypeText}」異動資料` },
  },
  watch: {
    startDateObj (val) {
      val && (this.startDate = `${val.getFullYear() - 1911}${("0" + (val.getMonth()+1)).slice(-2)}${("0" + val.getDate()).slice(-2)}`)
    },
    endDateObj (val) {
      val && (this.endDate = `${val.getFullYear() - 1911}${("0" + (val.getMonth()+1)).slice(-2)}${("0" + val.getDate()).slice(-2)}`)
    }
  },
  async fetch () {
      if(this.isBusy) {
        process.client && this.notify('讀取中 ... 請稍後', { type: 'warning' })
      } else {
        this.reset()
        this.isBusy = true
        this.committed = false
        this.$axios.post(this.$consts.API.JSON.PREFETCH, {
          type: this.axiosType,
          query: this.qryType,
          start: this.startDate,
          end: this.endDate,
          reload: this.forceReload
        }).then(({ data }) => {
          this.rows = data.raw || []
          process.client && this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
          const remain_ms = data.cache_remaining_time
          if (remain_ms && remain_ms > 0 && process.client) {
            this.setCache(this.cacheKey, data, remain_ms)
          }
        }).catch(err => {
          process.client && this.alert(err.message)
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
          this.forceReload = false
          this.committed = true
        })
      }
  },
  methods: {
    cached () {
      this.reset()
      this.getCache(this.cacheKey).then(json => {
        if (json === false) {
          this.$fetch()
        } else {
          this.rows = json.raw
          this.committed = true
          this.notify(`查詢成功，找到 ${this.rows.length} 筆375租約異動資料。`, { subtitle: `${this.qryType}(快取)` })
        }
      })
    },
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    reset () {
      this.committed = false
      this.rows = []
      this.currentPage = 1
      this.forceReload = false
    },
    popup (data) {
      this.modalLoading = true
      this.clickedId = data['ID']
      this.showModalById(this.modalId)
    },
    landBuildNumber (item) {
      const val = item.GG49 || item.BA49
      const mainNumber = val.substring(0, 4).replace(/^[\s0]+/g, '')
      const subNumber = val.substring(4).replace(/^[\s0]+/g, '')
      return this.$utils.empty(subNumber) ? mainNumber : `${mainNumber}-${subNumber}`
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 105)
  }
}
</script>

<style lang="scss" scoped>
</style>
