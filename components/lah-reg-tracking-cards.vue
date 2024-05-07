<template lang="pug">
transition-group.d-flex.justify-content-between.flex-wrap.lah(name="list")
  b-card(
    v-for="(row, idx) in rows",
    :key="`tracking_card_${idx}`",
    :border-variant="border(row)"
  )
    .center.h1.text-primary.font-weight-bold(@click="popup(row)") {{ row['收件字'] }} {{ row.RM03 }}
    .center.h2.my-2.font-weight-bold {{ row['登記原因'] }}
    .center
      b-button(
        size="lg",
        :variant="light(row)"
      ): .d-flex.align-items-center.h1
        span 狀態
        b-badge.ml-1(variant="light", pill) {{ row['辦理情形'] }}
    .d-flex.justify-content-between.center.h4.mt-3
      span 異動人員：{{ hideName(row['異動人員']) }}
      lah-fa-icon(icon="clock", regular) {{ $utils.addTimeDivider(row.RM105_2) }}
</template>

<script>
import lahRegCaseDetailVue from '~/components/lah-reg-case-detail.vue';
export default {
  emit: [],
  component: { lahRegCaseDetailVue },
  props: {
    rows: { type: Array, default: () => ([]) }
  },
  data: () => ({
    greenState: ['結案', '異動完成', '歸檔'],
    yellowState: ['登錄', '校對'],
    redState: ['撤回', '駁回', '請示', '展期']
  }),
  computed: {},
  watch: {},
  created () {},
  mounted () {},
  methods: {
    light (row) {
      if (this.greenState.includes(row['辦理情形'])) {
        return 'success'
      }
      if (this.yellowState.includes(row['辦理情形'])) {
        return 'warning'
      }
      if (this.redState.includes(row['辦理情形'])) {
        return 'danger'
      }
      return 'info'
    },
    border (row) {
      const light = this.light(row)
      return light === 'info' ? '' : light
    },
    hideName (name) {
      return name[0] + 'Ｏ' + name.slice(2)
    },
    popup (row) {
      this.modal(this.$createElement(lahRegCaseDetailVue, {
        props: {
          caseId: row.ID
        }
      }), {
        title: `案件詳情 ${this.$utils.caseId(row.ID)}`,
        size: 'xl'
      })
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
