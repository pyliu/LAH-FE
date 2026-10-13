<template lang="pug">
.tracking-cards-grid
  b-card.tracking-card.lah-shadow(
    v-for="(row, idx) in rows",
    :key="`tracking_card_${idx}`",
    no-body,
    :class="[statusInfo(row).themeClass, { 'is-latest-item': idx === 0 && serialStart === 1 }]",
    @click="popup(row)"
  )
    //- 卡片頂部資訊列：序號、最新標籤、案件類別標籤、詳情小按鈕
    .card-top-bar.d-flex.align-items-center.justify-content-between
      .d-flex.align-items-center
        span.serial-badge \#{{ formatSerial(serialStart + idx) }}
        span.new-pulse-badge.ml-1(v-if="idx === 0 && serialStart === 1")
          span.pulse-dot
          span.pulse-text 最新
      .d-flex.align-items-center
        b-badge.category-pill.mr-1(pill, :variant="caseTypeBadge(row).variant") {{ caseTypeBadge(row).text }}
        b-button.detail-btn(
          size="sm",
          variant="link",
          title="檢視案件詳情",
          @click.stop="popup(row)"
        )
          lah-fa-icon(icon="arrow-up-right-from-square", size="xs", variant="secondary")

    //- 核心案號：收件字與 6 碼流水號
    .case-identity.text-center.my-1
      span.case-prefix {{ row['收件字'] || row.RM02 }}
      span.case-number.ml-1 {{ row.RM03 }}

    //- 登記原因與地段資訊
    .case-reason-line.text-center.mb-2
      span.case-reason-title {{ row['登記原因'] }}
      span.case-section-chip.ml-1(v-if="row['段小段'] || row['區名稱']") {{ row['段小段'] || row['區名稱'] }}

    //- 辦理情形狀態膠囊
    .status-pill-wrapper.text-center.mb-2
      b-badge.status-pill(
        pill,
        :variant="statusInfo(row).variant"
      )
        lah-fa-icon(:icon="statusInfo(row).icon", size="sm").mr-1
        span.status-text {{ row['辦理情形'] }}

    //- 四階段微型進度管線
    .mini-stepper.px-2.mb-2
      .stepper-container
        .step-node(:class="getStepClass(row, 1)")
          .step-dot
            lah-fa-icon(v-if="statusInfo(row).stage > 1", icon="check", size="xs")
            span.step-num(v-else) 1
          .step-title 收件
        .step-connector(:class="{ active: statusInfo(row).stage >= 2 }")
        .step-node(:class="getStepClass(row, 2)")
          .step-dot
            lah-fa-icon(v-if="statusInfo(row).isAlert", icon="triangle-exclamation", size="xs")
            lah-fa-icon(v-else-if="statusInfo(row).stage > 2", icon="check", size="xs")
            span.step-num(v-else) 2
          .step-title 審查
        .step-connector(:class="{ active: statusInfo(row).stage >= 3 }")
        .step-node(:class="getStepClass(row, 3)")
          .step-dot
            lah-fa-icon(v-if="statusInfo(row).stage > 3", icon="check", size="xs")
            span.step-num(v-else) 3
          .step-title 登校
        .step-connector(:class="{ active: statusInfo(row).stage >= 4 }")
        .step-node(:class="getStepClass(row, 4)")
          .step-dot
            lah-fa-icon(v-if="statusInfo(row).stage >= 4", icon="check", size="xs")
            span.step-num(v-else) 4
          .step-title 結案

    //- 底部資訊列：作業人員與最後更新時間
    .card-footer-bar.d-flex.justify-content-between.align-items-center.pt-2.mt-auto
      .operator-box.text-truncate
        lah-fa-icon(icon="user-tie", variant="secondary", size="sm").mr-1
        span.operator-name {{ hideName(row['作業人員']) }}
      .time-box.d-flex.align-items-center
        lah-fa-icon(
          icon="clock",
          title="更新時間",
          :action="idx === 0 && serialStart === 1 ? 'clock' : ''",
          :variant="idx === 0 && serialStart === 1 ? 'success' : 'muted'",
          size="sm",
          regular
        ).mr-1
        span.time-text(:class="{ 'text-success font-weight-bold': idx === 0 && serialStart === 1 }") {{ $utils.addTimeDivider(latestTime(row)) }}
</template>

<script>
import lahRegCaseDetailVue from '~/components/lah-reg-case-detail.vue'

export default {
  emit: [],
  components: { lahRegCaseDetailVue },
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
  methods: {
    formatSerial (val) {
      return String(val).padStart(2, '0')
    },
    statusInfo (row) {
      const status = row['辦理情形'] || ''
      if (this.greenState.includes(status)) {
        return {
          variant: 'success',
          icon: 'circle-check',
          stage: 4,
          stageText: '結案完成',
          themeClass: 'theme-success'
        }
      }
      if (this.yellowState.includes(status)) {
        return {
          variant: 'warning',
          icon: 'pen-to-square',
          stage: 3,
          stageText: '登簿校對',
          themeClass: 'theme-warning'
        }
      }
      if (this.redState.includes(status)) {
        return {
          variant: 'danger',
          icon: 'triangle-exclamation',
          stage: 2,
          stageText: '暫緩處置',
          themeClass: 'theme-danger',
          isAlert: true
        }
      }
      if (['初審', '複審', '准登'].includes(status) || status.includes('初核')) {
        return {
          variant: 'info',
          icon: 'file-circle-check',
          stage: 2,
          stageText: '審查核定',
          themeClass: 'theme-info'
        }
      }
      return {
        variant: 'primary',
        icon: 'inbox',
        stage: 1,
        stageText: '收件審理',
        themeClass: 'theme-primary'
      }
    },
    getStepClass (row, stepNum) {
      const info = this.statusInfo(row)
      if (info.isAlert && stepNum === info.stage) {
        return 'step-alert'
      }
      if (stepNum < info.stage) {
        return 'step-done'
      }
      if (stepNum === info.stage) {
        return 'step-current'
      }
      return 'step-pending'
    },
    caseTypeBadge (row) {
      if (row.RM08 === '9') {
        return { text: '簡易', variant: 'primary' }
      }
      if (row.RM08 === '2') {
        return { text: '專辦', variant: 'warning' }
      }
      if (row.RM08 === '3') {
        return { text: '急速', variant: 'danger' }
      }
      if (row.RM08 === 'X') {
        return { text: '跨縣市', variant: 'info' }
      }
      if (row.RM99) {
        return { text: '跨所', variant: 'info' }
      }
      if (row.RM08 === 'Q') {
        return { text: '逕為', variant: 'dark' }
      }
      if (row.RM08 === 'R') {
        return { text: '囑託', variant: 'secondary' }
      }
      return { text: '一般', variant: 'light' }
    },
    light (row) {
      return this.statusInfo(row).variant
    },
    border (row) {
      const l = this.light(row)
      return l === 'info' ? '' : l
    },
    hideName (name) {
      if (!name || name === 'XXXXXXXX') {
        return 'XXXX'
      }
      return name[0] + 'Ｏ' + name.slice(2)
    },
    latestTime (row) {
      const qday = this.$utils.empty(this.queryDay) ? this.$utils.today('TW').replaceAll('-', '') : this.queryDay
      let ok = false
      !ok && qday === row.RM105_1 && (ok = row.RM105_2)
      !ok && qday === row.RM107_1 && (ok = row.RM107_2)
      !ok && qday === row.RM106_1 && (ok = row.RM106_2)
      !ok && qday === row.RM93_1 && (ok = row.RM93_2)
      !ok && qday === row.RM86 && (ok = row.RM87)
      !ok && qday === row.RM53_1 && (ok = row.RM53_2)
      !ok && qday === row.RM48_1 && (ok = row.RM48_2)
      !ok && qday === row.RM83 && (ok = row.RM84)
      !ok && qday === row.RM80 && (ok = row.RM81)
      !ok && qday === row.RM58_1 && (ok = row.RM58_2)
      !ok && qday === row.RM56_1 && (ok = row.RM56_2)
      !ok && qday === row.RM54_1 && (ok = row.RM54_2)
      !ok && qday === row.RM46_1 && (ok = row.RM46_2)
      !ok && qday === row.RM62_1 && (ok = row.RM62_2)
      !ok && qday === row.RM44_1 && (ok = row.RM44_2)
      !ok && qday === row.RM07_1 && (ok = row.RM07_2)
      return ok || ''
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
.tracking-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  width: 100%;
  padding: 6px;
  box-sizing: border-box;

  @media (max-width: 1399.98px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 991.98px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 575.98px) {
    grid-template-columns: 1fr;
  }
}

.tracking-card {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px 14px 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  user-select: none;
  min-height: 220px;
  display: flex;
  flex-direction: column;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #6c757d;
    transition: background 0.2s ease;
  }

  &.theme-success::before {
    background: linear-gradient(90deg, #28a745, #20c997);
  }
  &.theme-warning::before {
    background: linear-gradient(90deg, #fd7e14, #ffc107);
  }
  &.theme-danger::before {
    background: linear-gradient(90deg, #dc3545, #e83e8c);
  }
  &.theme-info::before {
    background: linear-gradient(90deg, #17a2b8, #007bff);
  }

  &.is-latest-item {
    border-color: rgba(40, 167, 69, 0.4);
    box-shadow: 0 4px 16px rgba(40, 167, 69, 0.15);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
    border-color: rgba(0, 123, 255, 0.35);

    .detail-btn {
      opacity: 1;
    }
  }
}

.serial-badge {
  font-family: var(--font-family-monospace, monospace);
  font-size: 0.85rem;
  font-weight: 700;
  color: #6c757d;
  background: #f1f3f5;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.new-pulse-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(40, 167, 69, 0.12);
  color: #28a745;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #28a745;
    margin-right: 4px;
    box-shadow: 0 0 0 rgba(40, 167, 69, 0.4);
    animation: beaconPulse 1.8s infinite;
  }
}

@keyframes beaconPulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(40, 167, 69, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
}

.category-pill {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 8px;
}

.detail-btn {
  padding: 0 4px;
  line-height: 1;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.case-identity {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.case-prefix {
  font-size: 1.05rem;
  font-weight: 700;
  color: #495057;
  background: #edf2f7;
  padding: 2px 7px;
  border-radius: 6px;
}

.case-number {
  font-family: var(--font-family-monospace, monospace);
  font-size: 1.55rem;
  font-weight: 800;
  color: #1e3a8a;
  letter-spacing: 1px;
}

.case-reason-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.case-reason-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #212529;
}

.case-section-chip {
  font-size: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  color: #6c757d;
  padding: 1px 6px;
  border-radius: 4px;
}

.status-pill {
  font-size: 0.95rem;
  font-weight: 700;
  padding: 5px 14px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.mini-stepper {
  width: 100%;
}

.stepper-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;

  .step-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #e9ecef;
    color: #6c757d;
    font-size: 0.65rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #dee2e6;
    transition: all 0.2s ease;
  }

  .step-title {
    font-size: 0.7rem;
    color: #868e96;
    margin-top: 3px;
    font-weight: 500;
  }

  &.step-done {
    .step-dot {
      background: #28a745;
      border-color: #28a745;
      color: #ffffff;
    }
    .step-title {
      color: #28a745;
      font-weight: 600;
    }
  }

  &.step-current {
    .step-dot {
      background: #007bff;
      border-color: #007bff;
      color: #ffffff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
    }
    .step-title {
      color: #007bff;
      font-weight: 700;
    }
  }

  &.step-alert {
    .step-dot {
      background: #dc3545;
      border-color: #dc3545;
      color: #ffffff;
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25);
      animation: alertPulse 1.5s infinite;
    }
    .step-title {
      color: #dc3545;
      font-weight: 700;
    }
  }
}

@keyframes alertPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.step-connector {
  flex-grow: 1;
  height: 2px;
  background: #e9ecef;
  margin: 0 4px 14px;
  transition: background 0.2s ease;

  &.active {
    background: #28a745;
  }
}

.card-footer-bar {
  border-top: 1px dashed #e9ecef;
  font-size: 0.85rem;
  color: #6c757d;
}

.operator-name {
  font-weight: 600;
}

.time-text {
  font-family: var(--font-family-monospace, monospace);
  font-size: 0.85rem;
}
</style>
