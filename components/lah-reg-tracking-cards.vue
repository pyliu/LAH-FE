<template lang="pug">
transition-group.d-flex.justify-content-between.flex-wrap.lah(name="list")
  b-card(
    v-for="(row, idx) in rows",
    :key="`tracking_card_${idx}`",
    :border-variant="border(row)"
  )
    .center.h1.text-primary.font-weight-bold {{ row['收件字'] }} {{ row.RM03 }}
    .center.h2.my-2.font-weight-bold {{ row['登記原因'] }}
    .center
      b-button(
        size="lg",
        :variant="light(row)",
        @click="popup(row)"
      ): .d-flex.align-items-center.h1.my-auto
        span 狀態
        b-badge.ml-1(variant="light", pill) {{ row['辦理情形'] }}
    .d-flex.justify-content-between.center.h4.mt-3
      span 作業人員：{{ hideName(row['作業人員']) }}
      lah-fa-icon(
        icon="clock",
        :action="idx === 0 ? 'clock' : ''",
        :variant="idx === 0 ? 'success' : 'muted'",
        :size="idx === 0 ? 'lg' : '1x'"
        regular
      ) {{ $utils.addTimeDivider(lastTime(row)) }}
    .serial \#{{ serialStart + idx }}
</template>

<script>
import lahRegCaseDetailVue from '~/components/lah-reg-case-detail.vue'
export default {
  emit: [],
  component: { lahRegCaseDetailVue },
  props: {
    rows: { type: Array, default: () => ([]) },
    serialStart: { type: Number, default: 1 }
  },
  data: () => ({
    greenState: ['結案', '異動完成', '歸檔', '公告'],
    yellowState: ['登錄', '校對'],
    redState: ['撤回', '駁回', '請示', '展期', '補正']
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
      if (row['辦理情形'].includes('初核')) {
        return 'secondary'
      }
      return 'info'
    },
    border (row) {
      const light = this.light(row)
      return light === 'info' ? '' : light
    },
    hideName (name) {
      if (name === 'XXXXXXXX') {
        return '尚未排定'
      }
      return name[0] + 'Ｏ' + name.slice(2)
    },
    lastTime (row) {
      return row.RM105_2 || // 異動時間
             row.RM107_2 ||
             row.RM106_2 ||
             row.RM93_2 ||
             row.RM91_2 ||
             row.RM87 ||
             row.RM84 ||
             row.RM81 ||
             row.RM62_2 ||
             row.RM58_2 ||
             row.RM56_2 ||
             row.RM54_2 ||
             row.RM53_2 ||
             row.RM48_2 ||
             row.RM46_2 ||
             row.RM44_2 ||
             row.RM07_2
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
.serial {
  position: absolute;
  top: 5px;
  left: 5px;
}
</style>
