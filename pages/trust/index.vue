<template lang="pug">
  div
    lah-header: lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 信託案件檢索
          lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
          lah-help-modal(:modal-id="'help-modal'")
            h5 請參照下列步驟搜尋
            ol
              li 選擇查詢區間
              li 選擇查詢類別
              li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]
            hr
            h5 支援以下三種查詢類別
            ol
              li 信託登記－土地註記塗銷
              li 信託登記－建物註記塗銷
              li 登記收件原因為 CU, CW, CV, CX, CY 之案件
            hr
            //- lah-fa-icon(icon="lightbulb" regular variant="warning") 點擊「收件年字號」開啟案件詳情視窗
            lah-fa-icon(icon="caret-square-right" regular variant="primary"): b-link(to="/trust/HF") 切換為八德版本
        .d-flex.small
          b-pagination.my-auto.mr-1(
            v-if="!$utils.empty(rows)"
            v-model="currentPage"
            :total-rows="rows.length"
            :per-page="perPage"
            last-number
            first-number
            aria-controls="trust-table"
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
          ): template(v-slot:first): b-form-select-option(:value="null" disabled) -- 請選擇案件類型 --
          lah-button.mr-1(
            ref="search"
            icon="search"
            size="lg"
            title="搜尋"
            :disabled="isBusy || $utils.empty(qryType)"
            @click="search"
            no-icon-gutter
          )
          lah-countdown-button(
            ref="countdown"
            icon="sync-alt"
            action="ld-cycle"
            size="lg"
            variant="outline-secondary"
            badge-variant="secondary"
            title="強制重新搜尋"
            no-badge
            :milliseconds="0"
            :disabled="isBusy || $utils.empty(qryType)"
            :busy="isBusy"
            @end="reload"
            @click="reload"
          )
    lah-transition(appear)
      lah-reg-b-table(
        v-if="qryType === 'reg_reason' && committed"

        type="lg"
        :baked-data="rows"
        :per-page="perPage"
        :current-page="currentPage"
        :style="maxHeightStyle"
      )
      b-table(
        v-else-if="committed"

        id="trust-table"
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
        :fields="obliterateFields"
        :per-page="perPage"
        :current-page="currentPage"
        :style="maxHeightStyle"
      )
        template(#table-busy): span.ld-txt 讀取中...
        template(v-slot:cell(序號)="data") {{ data.index + 1 }}
        template(#cell(GG48)="{ item }"): .text-nowrap {{ item.GG48 }}:{{ item.GG48_CHT }}
        template(#cell(RM09)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.RM09_CHT }}
        template(#cell(GG49)="{ item }"): .text-nowrap {{ landBuildNumber(item) }}
        template(#cell(RM123)="{ item }"): .text-nowrap: b-link(@click="popup(item)").
          {{ item.RM123 }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
        template(#cell(GG30_1)="{ item }"): div.
          【{{ item.GG30_1 }}】{{ item.GG30_1_CHT }}{{ item.GG30_2 }}
      h3.text-center(
        v-else
      ): lah-fa-icon(action="breath" variant="primary") 請點選查詢按鈕
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
    title: "信託案件檢索-桃園市地政局",
  },
  fetchOnServer: false,
  data: () => ({
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
    qryType: 'reg_reason',
    qryTypes: [
      { value: 'land', text: '土地註記塗銷' },
      { value: 'building', text: '建物註記塗銷' },
      { value: 'reg_reason', text: '登記收件查詢' }
    ],
    obliterateFields: [
      {
        key: "RM123",
        label: '收件字號',
        sortable: true,
      },
      {
        key: "GG48",
        label: '段名稱',
        sortable: true,
      },
      {
        key: "GG49",
        label: '地/建號',
        sortable: true,
      },
      {
        key: "GG01",
        label: '登記次序',
        sortable: true,
      },
      {
        key: "BB09",
        label: '統編',
        sortable: true,
      },
      {
        key: "LNAM",
        label: '姓名',
        sortable: true,
      },
      {
        key: "GS_TYPE",
        label: '異動類別',
        sortable: true,
      },
      {
        key: "RM09",
        label: '登記原因',
        sortable: true,
      },
      {
        key: "RM33",
        label: '登記日期',
        sortable: true,
      },
      {
        key: "GG30_1",
        label: '代碼內容',
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
    queryCount () { return this.rows.length },
    qryTypeText () {
      switch (this.qryType) {
        case 'land':
          return '土地註記塗銷'
        case 'building':
          return '建物註記塗銷'
        case 'reg_reason':
          return '登記收件查詢'
        default:
          return `不支援的型別【${this.qryType}】`
      }
    },
    caption () { return `找到 ${this.queryCount} 筆「${this.qryTypeText}」資料` },
    cacheKey () { return `reg_trust_case_${this.qryType}_${this.startDate}_${this.endDate}` },
    maxHeightStyle () {
       return `max-height: ${this.maxHeight}px`
    }
  },
  watch: {
    startDateObj (val) {
      val && (this.startDate = `${val.getFullYear() - 1911}${("0" + (val.getMonth()+1)).slice(-2)}${("0" + val.getDate()).slice(-2)}`)
    },
    endDateObj (val) {
      val && (this.endDate = `${val.getFullYear() - 1911}${("0" + (val.getMonth()+1)).slice(-2)}${("0" + val.getDate()).slice(-2)}`)
    }
  },
  methods: {
    cached () {
      this.reset()
      this.getCache(this.cacheKey).then(json => {
        if (json !== false) {
          this.rows = json.raw
          this.committed = true
          this.notify(`查詢成功，找到 ${this.rows.length} 筆信託案件。`, { subtitle: `${this.qryType}(快取)` })
        }
      })
    },
    reload () {
      this.forceReload = true
      this.search()
    },
    search () {
      if(!this.isBusy) {
        this.isBusy = true
        this.committed = false
        this.$axios.post(this.$consts.API.JSON.PREFETCH, {
          type: `trust_query`,
          query: this.qryType,
          start: this.startDate,
          end: this.endDate,
          reload: this.forceReload
        }).then(({ data }) => {
          this.rows = data.raw || []
          this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
          const remain_ms = data.cache_remaining_time
          if (remain_ms && remain_ms > 0) {
            this.setCache(this.cacheKey, data, remain_ms)
          }
        }).catch(err => {
          this.alert(err.message)
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
          this.forceReload = false
          this.committed = true
        })
      } else {
        this.notify('讀取中 ... 請稍後', { type: 'warning' })
      }
    },
    reset () {
      this.committed = false
      this.rows = []
      this.currentPage = 1
      this.forceReload = false
    },
    popup (data) {
      this.modalLoading = true
      this.clickedId = `${data['RM123'].replaceAll('-', '')}`
      this.showModalById(this.modalId)
    },
    landBuildNumber (item) {
      const val = item.GG49
      if (this.qryType === 'land') {
        const mainNumber = val.substring(0, 4).replace(/^[\s0]+/g, '')
        const subNumber = val.substring(4).replace(/^[\s0]+/g, '')
        return this.$utils.empty(subNumber) ? mainNumber : `${mainNumber}-${subNumber}`
      }
      const mainNumber = val.substring(0, 5).replace(/^[\s0]+/g, '')
      const subNumber = val.substring(5).replace(/^[\s0]+/g, '')
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
