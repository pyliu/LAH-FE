<template lang="pug">
b-card
  template(#header)
    .d-flex
      h6.mb-0.mr-auto 登記案件狀態修正 {{ $utils.caseId(caseId) }}

  //- template(#footer, v-if="ui")
  //-   lah-reg-case-input-group.my-1(v-model="inputCaseId")
  //-   .d-flex.justify-content-between
  //-     lah-button(v-if="dataReady", icon="scroll", variant="outline-success", @click="detail") 詳情
  //-     lah-button(v-else, icon="search", @click="search") 查詢
  //-     lah-button(icon="broom", variant="outline-secondary", @click="clearSearchData") 清除

</template>

<script>
export default {
  props: {
    // ui: { type: Boolean, default: false }
  },
  data: () => ({
    inputCaseId: ''
  }),
  computed: {
    caseId () {
      if (this.dataReady) {
        return this.crsmsData.ID
      }
      return ''
    },
    dataReady () {
      return !this.$utils.empty(this.crsmsData)
    },
    crsmsData () {
      return this.$store.getters['inf/crsmsData']
    }
  },
  watch: {},
  methods: {}
}
</script>

<style lang="scss" scoped>
</style>
