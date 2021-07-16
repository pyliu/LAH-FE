<template lang="pug">
  div
    lah-header: lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 登記案件列表
          lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
          lah-help-modal(:modal-id="'help-modal'")
            h5 說明
            ul
              li ...
              li ...
        .d-flex.small
          client-only
            b-datepicker.h-100.mr-1(
              value-as-date
              v-model="pickedDate"
              placeholder="請選擇日期"
              :date-disabled-fn="dateDisabled"
              :max="new Date()"
            )
          lah-button.mr-1(
            ref="search"
            icon="search"
            size="lg"
            title="搜尋"
            variant="outline-primary"
            @click="reload()"
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
    
    .d-flex.justify-content-between.mb-2(v-if="!$utils.empty(bakedData)")
      b-pagination.my-auto(
        v-model="currentPage"
        :total-rows="bakedData.length"
        :per-page="perPage"
        last-number
        first-number
        aria-controls="regcase-table"
      )
      .my-auto.text-muted {{ foundText }}
      b-input-group.my-auto.fixed-width(prepend="每頁筆數"): b-input(
        ref="perPage"
        v-model="perPage"
        type="number"
        min="10"
        number
      )
    
    lah-transition(appear): lah-reg-b-table(:busy="isBusy" :baked-data="bakedData" :fields="fields")

    b-modal(
      :id="modalId"
      hide-footer
      centered
      no-close-on-backdrop
      size="xl"
    )
      template(#modal-title) 登記案件詳情 {{ modalCaseId }}
      span.ld-txt(v-if="modalLoading") 讀取中...
      lah-reg-case-detail(v-show="!modalLoading" @ready="modalLoading = false" :case-id="modalCaseId")
</template>

<script>
export default {
  head: {
    title: '登記案件詳情目錄-桃園市地政局'
  },
  data: () => ({
    modalLoading: true,
    modalCaseId: undefined,
    bakedData: [],
    fields: [],
    perPage: 20,
    currentPage: 1
  }),
  asyncData (ctx) {
    // console.log(ctx)
    return {
      modalId: ctx.$utils.uuid(),
      pickedDate: new Date(),
      cachedMs: 5 * 60 * 1000
    }
  },
  computed: {
    foundText () { return `` }
  },
  methods: {
    reload () {},
    dateDisabled (ymd, date) {
      const weekday = date.getDay();
      // Disable weekends (Sunday = `0`, Saturday = `6`)
      // Return `true` if the date should be disabled
      return weekday === 0// || weekday === 6;
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
