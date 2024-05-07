<template lang="pug">
transition-group.d-flex.justify-content-between.flex-wrap.lah(name="list")
  b-card(v-for="(row, idx) in rows", :key="`tracking_card_${idx}`")
    .center.h1.text-primary.font-weight-bold {{ row['收件字'] }} {{ row.RM03 }}
    .center.h2.my-2.font-weight-bold {{ row['登記原因'] }}
    .center
      b-button(
        size="lg",
        :variant="row['燈號']"
      ): .d-flex.align-items-center.h1
        span 狀態
        b-badge.ml-1(variant="light", pill) {{ row['辦理情形'] }}
    .d-flex.justify-content-between.center.h3.mt-3
      span 異動人員：{{ hideName(row['異動人員']) }}
      lah-fa-icon(icon="clock", regular) {{ $utils.addTimeDivider(row.RM105_2) }}
</template>

<script>
export default {
  emit: [],
  component: {},
  props: {
    rows: { type: Array, default: () => ([]) }
  },
  data: () => ({}),
  computed: {},
  watch: {},
  created () {},
  mounted () {},
  methods: {
    hideName (name) {
      return name[0] + 'Ｏ' + name.slice(2)
    }
  }
}
</script>

<style lang="scss" scoped>
.lah {
  .card {
    width: 23vw;
    margin-bottom: 1.25rem;
    margin-right: 1.25rem;
  }
}
</style>
