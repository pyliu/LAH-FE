<template lang="pug">
b-card.border-0(no-body)
  lah-fee-state-mgmt(
    v-if="modification",
    :expaa-data="expaaData",
    :brief="modification"
  )
  .d-flex.mb-2(
    v-for="(arr, key) in dataPairs",
    :key="`data_pairs_${key}`"
  )
    b-col.hover(v-if="!ignoreFields.includes(arr[0][0])", cols="6") {{ arr[0][0] }}：{{ arr[0][1] }}
    b-col.hover(v-if="arr[1] && !ignoreFields.includes(arr[1][0])") {{ arr[1][0] }}：{{ arr[1][1] }}

</template>

<script>
import _chunk from 'lodash/chunk'
export default {
  props: {
    expaaData: { type: Object, default: () => ({}) },
    bakedExpaaData: { type: Object, default: () => ({}) },
    modification: { type: Boolean, default: false }
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
    dataPairs () {
      /**
       * array e.g.
         [0] => ['開單日期', '1110919']
         [1] => ['電腦給號', '0066253']
       */
      const chunks = _chunk(Object.entries(this.fallbackData), 2)
      return chunks
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
    },
    ignoreFields () {
      if (this.modification) {
        return ['AA100_CHT', 'AA01', 'AA04', 'AA05', 'AA39', 'AA100', 'AA28']
      }
      return ['AA100_CHT']
    }
  },
  watch: {},
  created () {},
  mounted () {},
  methods: {}
}
</script>

<style lang="scss" scoped>
.hover:hover {
  background-color: rgb(187, 189, 189);
}
</style>
