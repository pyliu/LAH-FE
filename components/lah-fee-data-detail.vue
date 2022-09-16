<template lang="pug">
b-card.border-0(no-body)
  b-row
    b-col 電腦給號：{{ expaaData.AA04 }}
    b-col 收據編號：{{ expaaData.AA05 }}
  b-row.my-1
    b-col 結帳日期：{{ expaaData.AA01 }}
    b-col(v-b-tooltip="expaaData.AA39") 作業人員：{{ operator }}
</template>

<script>
export default {
  props: {
    expaaData: { type: Object, default: () => ({}) }
  },
  data: () => ({
  }),
  computed: {
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
