<template>
  <div>
    <lah-transition appear slide>
      <h3 class="text-center page-header">
        登記案件 {{ID}}
      </h3>
    </lah-transition>
    <lah-reg-case-detail :case-id="id" @ready="ready"/>
  </div>
</template>

<script>
export default {
  head: {
    title: `登記案件詳細內容-桃園市地政局`
  },
  computed: {
    caseId () { return this.$route.params.id || '' },
    year () {
      return this.trim(this.caseId).substring(0, 3)
    },
    code () {
      return this.trim(this.caseId).substring(3, 7)
    },
    number () {
      return this.trim(this.caseId).substring(7)
    },
    ID () {
      return `${this.year}-${this.code}-${this.number.padStart(6, '0')}`
    },
    id () {
      return this.trim(this.ID)
    }
  },
  methods: {
    trim (val) {
      return val.replace(/[^a-zA-Z0-9]/g, '')
    },
    ready (evt) {
      this.isBusy = !evt.detail
    }
  },
  created () {
    this.isBusy = true
  }
}
</script>

<style>
</style>
