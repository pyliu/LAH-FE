<template lang="pug">
b-card.border-0(no-body): lah-reg-b-table(:bakedData="baked")
</template>

<script>
export default {
  name: 'LahPeriodStatsChartClick',
  emit: ['fetched'],
  props: {
    st: { type: String, default: '' },
    ed: { type: String, default: '' },
    clock: { type: String, default: '' }
  },
  data: () => ({
    baked: []
  }),
  fetch () {
    if (!this.isBusy) {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.MOICAS, {
        type: 'crsms_records_by_clock',
        st: this.st,
        ed: this.ed,
        clock: this.clock
      }).then(({ data }) => {
        this.$emit('fetched', data)
        this.baked = [...data.baked]
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  },
  methods: {}
}
</script>

<style lang="scss" scoped>
</style>
