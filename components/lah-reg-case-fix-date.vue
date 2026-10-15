<template lang="pug">
.text-left
  div(v-if="ready && editable")
    .d-flex
      small.my-auto.text-nowrap.mr-1 補正期滿
      b-datepicker(
        size="sm"
        v-model="parentData.REG_FIX_CASE_RECORD.fix_deadline_date"
        placeholder="補正期滿日期"
        boundary="viewport"
        :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
        label-help="使用方向鍵操作移動日期"
        hide-header
        dropleft
        close-button
        label-close-button="關閉"
        v-b-tooltip.hover.left.v-warning
      )
      lah-button.ml-1(
        v-if="deadlineDateChanged",
        icon="undo",
        action="cycle-alt",
        variant="outline-secondary",
        size="sm",
        :title="`補正期滿日期重設為 ${defaultDeadlineDate}`",
        @click="resetDeadline"
        no-icon-gutter
      )
    .d-flex.my-1.align-items-center
      small.my-auto.text-nowrap.mr-1 通知送達
      b-datepicker(
        size="sm"
        v-model="parentData.REG_FIX_CASE_RECORD.notify_delivered_date"
        placeholder="通知書送達日期"
        boundary="viewport"
        label-help="使用方向鍵操作移動日期"
        hide-header
        dropleft
        today-button
        label-today-button="今天"
        reset-button
        label-reset-button="重設"
        close-button
        label-close-button="關閉"
        v-b-tooltip.hover.left.v-warning
        :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
        :max="maxDate"
        :state="settleDeliveredDate"
      )
      b-button-group.ml-1(size="sm")
        b-button(
          variant="outline-info"
          size="sm"
          title="快速填入今天"
          @click="setToday"
        ) 今
        b-button(
          variant="outline-secondary"
          size="sm"
          title="快速填入昨天"
          @click="setYesterday"
        ) 昨
    .d-flex.my-1
      small.my-auto.text-nowrap.mr-1 補正字號
      b-input(
        size="sm"
        v-model="parentData.REG_FIX_CASE_RECORD.note"
        placeholder="... 請填入補正字號 ..."
        :maxlength="20"
      )
      lah-button.ml-1(
        icon="edit",
        size="sm",
        title="更新以儲存變更資訊",
        @click="update"
        :variant="dataChanged ? 'primary' : 'outline-primary'",
        :disabled="!dataChanged"
        no-icon-gutter
      )

  div(v-else)
    .my-auto.text-nowrap.mr-1 補正期滿：{{ parentData.REG_FIX_CASE_RECORD.fix_deadline_date }}
    .my-auto.text-nowrap.mr-1 通知送達：{{ parentData.REG_FIX_CASE_RECORD.notify_delivered_date }}

  lah-transition: .d-flex.flex-wrap.justify-content-end.align-items-center.p-1.mt-1(v-if="!$utils.empty(deliveredDate)")
    b-badge.p-2.mr-1.mb-1(
      v-if="isRolledOver"
      pill
      variant="warning"
      v-b-tooltip.hover.top="rolloverTooltip"
      style="cursor: help;"
    )
      lah-fa-icon(icon="balance-scale" class="mr-1")
      | ⚡ 順延至 {{ legalCalc.dueDateMinguo }}
    b-badge.p-2.mr-1.mb-1(pill, :class="overduedBadgeClass") 調整到期：{{ dueDate }}
    b-badge.p-2.mb-1(pill, :class="allowRejectBadgeClass") 可駁回：{{ rejectDate }}
</template>

<script>
import regCaseBase from '~/mixins/lah-reg-case-base.js'
import { calculateLegalFixDeadline, formatDateISO } from '~/mixins/lah-fix-case-holiday.js'

export default {
  /* from lah-reg-case-base.js
  props: {
    parentData: { type: Object, default: undefined },
    // the id format should be '109HB04001234'
    caseId: { type: String, default: '' }
  },
  */
  name: 'LahRegCaseFixDate',
  mixins: [regCaseBase],
  props: {
    days: { type: String, default: '15' }
  },
  data: () => ({
    minDate: new Date(),
    maxDate: new Date(),
    retried: 0,
    origDataset: {
      id: '',
      delivered: '',
      deadline: '',
      note: ''
    }
  }),
  computed: {
    updateDataset () {
      return {
        id: this.caseId,
        delivered: this.deliveredDate || '',
        deadline: this.deadlineDate || '',
        note: this.note || ''
      }
    },
    deliveredDate () {
      return this.parentData.REG_FIX_CASE_RECORD.notify_delivered_date
    },
    settleDeliveredDate () {
      return !this.$utils.empty(this.deliveredDate)
    },
    defaultDeadlineDate () {
      // RM52: 補正期滿日期
      return this.$utils.phpTsToAdDateStr(+this.$utils.twToAdDateObj(this.parentData.RM52) / 1000)
    },
    deadlineDate () {
      return this.parentData.REG_FIX_CASE_RECORD.fix_deadline_date
    },
    deadlineDateChanged () {
      return !this.$utils.empty(this.deadlineDate) && this.defaultDeadlineDate !== this.deadlineDate
    },
    note () {
      return this.parentData.REG_FIX_CASE_RECORD.note
    },
    noteChanged () {
      return !this.$utils.empty(this.note) && this.defaultDeadlineDate !== this.note
    },
    legalCalc () {
      if (this.$utils.empty(this.deliveredDate)) {
        return null
      }
      const factor = this.parentData?.RM52_TYPE === '1' ? 30 : 1
      const days = factor * (parseInt(this.days, 10) || 15)
      return calculateLegalFixDeadline(this.deliveredDate, days)
    },
    dueDate () {
      return this.legalCalc ? this.legalCalc.dueDate : ''
    },
    rejectDate () {
      return this.legalCalc ? this.legalCalc.rejectDate : ''
    },
    isRolledOver () {
      return this.legalCalc ? this.legalCalc.isRolledOver : false
    },
    rolloverTooltip () {
      return this.legalCalc ? this.legalCalc.tooltipText : ''
    },
    today () {
      return formatDateISO(new Date())
    },
    light () {
      if (!this.legalCalc) { return 'green' }
      switch (this.legalCalc.status) {
        case 'REJECTABLE': return 'red'
        case 'DUE_SOON': return 'yellow'
        case 'IN_PROGRESS': return 'green'
        default: return 'green'
      }
    },
    overduedBadgeClass () {
      return [`badge-${this.light}`]
    },
    allowRejectBadgeClass () {
      switch (this.light) {
        case 'red': return ['badge-green']
        case 'yellow': return ['badge-info']
        default:
          return ['badge-muted']
      }
    },
    editable () {
      // 1111226 #102 asked to allow everyone who can edit this information
      return true
      // return this.parentData.RM45 === this.myid || this.authority.isAdmin || this.authority.isChief
    },
    dataChanged () {
      const res = this.$utils.equal(this.origDataset, this.updateDataset)
      if (!res) {
        this.$utils.warn('orig: ', this.origDataset)
        this.$utils.warn('updt: ', this.updateDataset)
      }
      return !res
    }
  },
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    },
    caseId (dontcare) {
      // to let the component refresh in b-table
      this.load()
    },
    deliveredDate (val, oldVal) {
      if (val && val !== oldVal) {
        this.syncDeadlineDate()
      }
    }
  },
  created () {
    !this.parentData && !this.caseId && this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
    this.updateDebounced = this.$utils.debounce(this.update, 1000)
    // fix not reactively bug
    if (Array.isArray(this.parentData.REG_FIX_CASE_RECORD)) {
      this.parentData.REG_FIX_CASE_RECORD = {
        ...{
          case_no: this.caseId,
          fix_deadline_date: this.deadlineDate || '',
          note: '',
          notify_delivered_date: this.deliveredDate || ''
        }
      }
    }
  },
  mounted () {
    // RM51: 通知補正日, plus one day
    this.minDate = new Date(+this.$utils.twToAdDateObj(this.parentData.RM51) + 24 * 60 * 60 * 1000)
    // fill default value from RM52
    this.$utils.empty(this.deadlineDate) && this.resetDeadline()
    this.trigger('ready', this.ready)
    // keep init value
    this.origDataset.id = this.caseId
    this.origDataset.delivered = this.deliveredDate || ''
    this.origDataset.deadline = this.deadlineDate || ''
    this.origDataset.note = this.note || ''
  },
  methods: {
    setToday () {
      const today = formatDateISO(new Date())
      this.parentData.REG_FIX_CASE_RECORD.notify_delivered_date = today
      this.syncDeadlineDate()
    },
    setYesterday () {
      const y = new Date()
      y.setDate(y.getDate() - 1)
      const yesterday = formatDateISO(y)
      this.parentData.REG_FIX_CASE_RECORD.notify_delivered_date = yesterday
      this.syncDeadlineDate()
    },
    syncDeadlineDate () {
      this.$nextTick(() => {
        if (this.legalCalc && this.legalCalc.dueDate) {
          this.parentData.REG_FIX_CASE_RECORD.fix_deadline_date = this.legalCalc.dueDate
        }
      })
    },
    resetDeadline () {
      this.parentData.REG_FIX_CASE_RECORD.fix_deadline_date = this.defaultDeadlineDate
    },
    load () {
      // get the date string from sqlite db
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_fix_case_delivered_date',
        id: this.caseId
      }).then(({ data }) => {
        /** expected raw json data format e.g.
         * case_no: "110HHA1017620"
         * note: "測試"
         * notify_delivered_date: "2021/07/20"
         * fix_deadline_date: "2022/03/17"
         */
        if (data.raw) {
          this.parentData.REG_FIX_CASE_RECORD.notify_delivered_date = data.raw.notify_delivered_date
          this.parentData.REG_FIX_CASE_RECORD.fix_deadline_date = data.raw.fix_deadline_date
          this.origDataset.id = this.caseId
          this.origDataset.delivered = this.deliveredDate
          this.origDataset.deadline = this.deadlineDate
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        this.fetched = true
      })
    },
    update () {
      if (this.dataChanged) {
        const updateData = { ...this.updateDataset }
        // to update delivered date in sqlite db
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'upd_reg_fix_case_data',
          ...updateData
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.origDataset = updateData
            this.success(`期滿：${updateData.deadline}<br/>送達：${updateData.delivered}<br/>🟢 更新完成。`, {
              title: '補正案件日期更新',
              subtitle: updateData.id,
              html: true
            })
          } else if (this.retried < 5) {
            this.timeout(this.update, this.$utils.rand(800))
            this.retried++
          } else {
            this.$utils.warn(data.message, updateData)
          }
        }).catch((err) => {
          this.alert(err.message)
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      } else {
        this.$utils.warn('data is the same ... dont update', this.origDataset, this.updateDataset)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.badge-red {
  background-color: var(--danger);
  color: white;
  font-weight: bold;
}
.badge-yellow {
  background-color: var(--warning);
}
.badge-green {
  background-color: var(--success);
  color: white;
}
.badge-info {
  background-color: var(--info);
  color: white;
}
.badge-muted {
  background-color: var(--secondary);
  color: white;
}
</style>
