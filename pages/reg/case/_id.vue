<template lang="pug">
  div
    lah-header: lah-transition(appear slide): h3.text-center.w-100: lah-fa-icon(icon="briefcase" variant="secondary") 登記案件 {{ ID }}
    lah-reg-case-detail(:case-id="id" @ready="readyHandler")
</template>

<script>
export default {
  head: {
    title: '登記案件詳細內容-桃園市地政局'
  },
  computed: {
    caseId () { return this.$route.params.id || '' },
    year () { return this.trim(this.caseId).substring(0, 3) },
    code () { return this.trim(this.caseId).substring(3, 7) },
    number () { return this.trim(this.caseId).substring(7) },
    ID () { return `${this.year}-${this.code}-${this.number.padStart(6, '0')}` },
    id () { return this.ID.replace('-', '') }
  },
  methods: {
    trim (val) { return val.replace(/[^a-zA-Z0-9]/g, '') },
    readyHandler (evt) { this.isBusy = !evt.detail }
  }
}
</script>

<style>
</style>
