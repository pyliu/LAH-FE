<template lang="pug">
transition-group.d-flex.justify-content-between.flex-wrap.lah(name="list")
  b-card.lah-shadow(
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
      ) {{ $utils.addTimeDivider(latestTime(row)) }}
    .serial \#{{ serialStart + idx }}
</template>

<script>
import lahRegCaseDetailVue from '~/components/lah-reg-case-detail.vue'
export default {
  emit: [],
  component: { lahRegCaseDetailVue },
  props: {
    rows: { type: Array, default: () => ([]) },
    serialStart: { type: Number, default: 1 },
    queryDay: { type: String, default: '' }
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
        return 'XXXX'
      }
      return name[0] + 'Ｏ' + name.slice(2)
    },
    latestTime (row) {
      // const today = this.$utils.today('TW').replaceAll('-', '')
      let ok = false
      // 異動時間
      !ok && this.queryDay === row.RM105_1 && (ok = row.RM105_2)
      // 秘書
      !ok && this.queryDay === row.RM107_1 && (ok = row.RM107_2)
      // 課長
      !ok && this.queryDay === row.RM106_1 && (ok = row.RM106_2)
      // 撤回
      !ok && this.queryDay === row.RM93_1 && (ok = row.RM93_2)
      // 歸檔
      // !ok && this.queryDay === row.RM91_1 && (ok = row.RM91_2)
      // 展期
      !ok && this.queryDay === row.RM86 && (ok = row.RM87)
      // 補正
      !ok && this.queryDay === row.RM53_1 && (ok = row.RM53_2)
      // 駁回
      !ok && this.queryDay === row.RM48_1 && (ok = row.RM48_2)
      // 取消請示
      !ok && this.queryDay === row.RM83 && (ok = row.RM84)
      // 請示
      !ok && this.queryDay === row.RM80 && (ok = row.RM81)
      // 結案
      !ok && this.queryDay === row.RM58_1 && (ok = row.RM58_2)
      // 校對
      !ok && this.queryDay === row.RM56_1 && (ok = row.RM56_2)
      // 登錄
      !ok && this.queryDay === row.RM54_1 && (ok = row.RM54_2)
      // 複審
      !ok && this.queryDay === row.RM46_1 && (ok = row.RM46_2)
      // 准登
      !ok && this.queryDay === row.RM62_1 && (ok = row.RM62_2)
      // 初審
      !ok && this.queryDay === row.RM44_1 && (ok = row.RM44_2)
      // 收件
      !ok && this.queryDay === row.RM07_1 && (ok = row.RM07_2)
      return ok
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
