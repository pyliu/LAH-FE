<template lang="pug">
b-card
  template(#header)
    .d-flex
      h6.mb-0.mr-auto 登記案件快速修正
      b-checkbox(v-model="vertical", switch) 顯示切換

  .d-flex
    lah-reg-case-input-group(v-model="caseId", :vertical="vertical")
    .w-50.p-1(v-if="vertical")  {{ $utils.caseId(caseId) }}

  template(#footer)
    .d-flex.justify-content-between
      lah-button(icon="scroll", @click="showCaseDetail") 案件資料

  //- b-modal(
  //-   ref="detail",
  //-   hide-footer,
  //-   centered,
  //-   no-close-on-backdrop,
  //-   size="xl",
  //-   scrollable
  //- )
  //-   template(#modal-title) 登記案件詳情 {{ $utils.caseId(caseId) }}
  //-   h4.text-center.text-info.my-5(v-if="modalLoading")
  //-     b-spinner(small type="grow")
  //-       strong.ld-txt 查詢中...
  //-   lah-reg-case-detail(
  //-     :case-id="caseId",
  //-     @ready="modalLoading = !$event.detail"
  //-   )
</template>

<script>
export default {
  data: () => ({
    caseId: '',
    modalLoading: false,
    vertical: false
  }),
  computed: {
    crsmsData () {
      return this.$store.getters['inf/crsmsData']
    }
  },
  methods: {
    showCaseDetail () {
      this.modalLoading = true
      this.modal(this.$createElement('lah-reg-case-detail', {
        props: {
          caseId: this.caseId
        },
        on: {
          ready: (e) => {
            this.modalLoading = !e.detail
          },
          dataReady: (e) => {
            console.warn(e.detail)
          }
        }
      }), {
        title: `登記案件詳情 ${this.$utils.caseId(this.caseId)}`,
        size: 'xl'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
