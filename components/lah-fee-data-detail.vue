<template lang="pug">
b-card.border-0(no-body)
  lah-fee-state-mgmt(:expaa-data="expaaData")
  b-list-group(flush, size="sm")
    b-list-group-item(
      v-for="(item, key) in fallbackData"
      v-if="!['列印註記', '繳費方式代碼', '單據狀況', 'AA100_CHT'].includes(key)"
    )
      span {{key}}：{{item}}
</template>

<script>
export default {
  props: {
    expaaData: { type: Object, default: () => ({}) },
    bakedExpaaData: { type: Object, default: () => ({}) }
  },
  data: () => ({
  }),
  computed: {
    fallbackData () {
      if (!this.$utils.empty(this.bakedExpaaData)) {
        return this.bakedExpaaData
      }
      if (!this.$utils.empty(this.$store.getters['inf/bakedExpaaData'])) {
        return this.$store.getters['inf/bakedExpaaData']
      }
      if (!this.$utils.empty(this.expaaData)) {
        return this.expaaData
      }
      return this.$store.getters['inf/expaaData'] || {}
    },
    day () {
      return this.expaaData?.AA01 || '' // 收據日期 e.g. '1110915'
    },
    pcNumber () {
      return this.expaaData?.AA04 || '' // 電腦給號 e.g. '0123456'
    },
    aaNumber () {
      return this.expaaData?.AA05 || '' // 收據編號 e.g. 'AA12345678'
    },
    operator () {
      const name = this.userNames[this.expaaData?.AA39]
      return name || this.expaaData?.AA39
    },
    validData () {
      return this.day !== '' && this.pcNumber !== '' && this.aaNumber !== ''
    }
  },
  watch: {},
  created () {},
  methods: {}
}
</script>

<style lang="scss" scoped>
</style>
