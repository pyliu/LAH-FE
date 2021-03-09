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
          lah-button.mr-1(icon="search" @click="reload()" variant="outline-primary" title="依據日期查詢")
          lah-countdown-button(icon="sync-alt" action="cycle" no-badge @click="reload" variant="outline-secondary")
    
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
    modalCaseId: undefined
  }),
  asyncData (ctx) {
    // console.log(ctx)
    return {
      modalId: ctx.$utils.uuid(),
      pickedDate: new Date()
    }
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
