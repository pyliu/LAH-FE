<template>
  <div class="exp-tbl">
    <b-table
      ref="tbl"

      striped
      hover
      responsive
      bordered
      caption-top
      no-border-collapse
      small
      head-variant="dark"
      class="text-center s-90"
      selectable
      select-mode="single"
      selected-variant="success"

      :items="tableItems"
      :fields="displayFields"
      :busy="isBusy || busy"
      :sticky-header="`${maxHeight}px`"
      :tbody-tr-class="rowClass"
    >
      <template #cell(時限)="data">
        <b-badge :variant="remainVariant(data.item)" class="exp-remain">
          {{ remainText(data.item) }}
        </b-badge>
      </template>
      <template #table-busy>
        <div class="text-center text-danger my-5">
          <strong class="ld-txt">查詢中...</strong>
        </div>
      </template>
      <template #cell(序號)="data">
        <template v-if="data.rowSelected">
          <span aria-hidden="true">&check;</span>
          <span class="sr-only">Selected</span>
        </template>
        <template v-else>
          <span aria-hidden="true">&nbsp;</span>
          <span class="sr-only">Not selected</span>
        </template>
        {{ data.index + 1 }}
      </template>
      <template #cell(收件字號)="data">
        <span v-if="onlyPopupDetail">
          <b-link @click="popup(data)">{{ data.value }} <lah-fa-icon icon="window-restore" regular /></b-link>
        </span>
        <span v-else>
          <NuxtLink :to="`/reg/case/${data.value}`">{{ data.value }}</NuxtLink>
          <b-link @click="popup(data)"><lah-fa-icon icon="window-restore" regular /></b-link>
        </span>
        <!-- <NuxtLink :to="`/regcase/${data.value}`">
          {{ data.value }}
        </NuxtLink>
        <b-link @click="popup(data)">
          <lah-fa-icon icon="window-restore" regular />
        </b-link> -->
      </template>
      <template #cell(初審人員)="data">
        <b-button
          v-if="allCaseMode"
          :variant="buttoVariant"
          size="sm"
          :title="buttonReviewerTitle(data.value)"
          pill
          @click="$router.push(`/reg/expire/${data.value}`)"
        >
          <lah-avatar :id="data.value.split(' ')[0]" :name="data.value.split(' ')[1]">
            {{ data.value.split(' ')[0] }}
          </lah-avatar>
        </b-button>
        <b-button
          v-else
          variant="outline-secondary"
          size="sm"
          :title="`查詢 ${data.value} 的使用者訊息`"
          pill
          @click="searchUser(data.value.split(' ')[0], data.value.split(' ')[1])"
        >
          <lah-avatar :id="data.value.split(' ')[0]" :name="data.value.split(' ')[1]">
            {{ data.value.split(' ')[0] }}
          </lah-avatar>
        </b-button>
      </template>
      <template #cell(作業人員)="data">
        <b-button
          :data-name="data.value"
          :data-id="data.value"
          variant="outline-secondary"
          size="sm"
          :title="`查詢 ${data.value} 的使用者訊息`"
          pill
          @click="searchUser(data.value)"
        >
          <lah-avatar :name="data.value">
            {{ data.value }}
          </lah-avatar>
        </b-button>
      </template>
      <template #cell(收件時間)="data">
        <span v-b-tooltip="distanceFromNow(data.value)">{{ data.value }}</span>
      </template>
      <template #cell(限辦期限)="data">
        <span v-b-tooltip="distanceFromNow(data.value)">{{ data.value }}</span>
      </template>
    </b-table>
    <b-modal
      ref="detail"
      hide-footer
      centered
      no-close-on-backdrop
      size="xl"
      scrollable
    >
      <template #modal-title>
        登記案件詳情 {{ clickedId }}
      </template>
      <h4 v-if="modalLoading" class="text-center text-info my-5">
        <b-spinner small type="grow" />
        <strong class="ld-txt">查詢中...</strong>
      </h4>
      <lah-reg-case-detail v-show="!modalLoading" :case-id="clickedId" @ready="modalLoading = !$event.detail" />
    </b-modal>
  </div>
</template>

<script>
import lahUserCard from '~/components/lah-user-card.vue'
import dynamicHeight from '~/mixins/dynamic-height-mixin'
import { parseRocDateTime, humanizeDuration, urgencyLevel } from '~/mixins/expiry-time-mixin'
export default {
  name: 'LahExpiryBTable',
  mixins: [dynamicHeight],
  props: {
    reviewerId: { type: String, default: '' },
    busy: { type: Boolean, default: false },
    onlyPopupDetail: { type: Boolean, default: false },
    // 啟用「剩餘/逾期時間」欄位與依緊急度標示列（預設關閉，不影響其他頁面）
    urgency: { type: Boolean, default: false }
  },
  data: () => ({
    fields: [
      '序號',
      { key: '收件字號', sortable: true },
      { key: '登記原因', sortable: true },
      { key: '辦理情形', sortable: true },
      { key: '初審人員', sortable: true },
      { key: '作業人員', sortable: true },
      { key: '收件時間', sortable: true },
      { key: '限辦期限', sortable: true }
    ],
    clickedId: undefined,
    modalLoading: true,
    now: Date.now(),
    timer: undefined
  }),
  computed: {
    totalCase () {
      return this.$store.getters['expiry/list_count']
    },
    totalPeople () {
      return this.$store.getters['expiry/list_by_id_count']
    },
    caseList () {
      return this.$store.getters['expiry/list'] || []
    },
    caseListByID () {
      return this.$store.getters['expiry/list_by_id']
    },
    reviewerCaseList () {
      return this.caseListByID ? this.caseListByID[this.reviewerId] : []
    },
    isOverdueMode () {
      return this.$store.getters['expiry/is_overdue_mode']
    },
    tableItems () {
      return this.allCaseMode ? this.caseList : this.caseListByID[this.reviewerId]
    },
    count () { return this.tableItems ? this.tableItems.length : 0 },
    buttoVariant () { return this.isOverdueMode ? 'outline-danger' : 'warning' },
    allCaseMode () { return this.$utils.empty(this.reviewerId) },
    displayFields () {
      return this.urgency ? [...this.fields, { key: '時限', label: '剩餘/逾期' }] : this.fields
    }
  },
  watch: {},
  mounted () {
    if (this.urgency) {
      this.timer = setInterval(() => { this.now = Date.now() }, 60 * 1000)
    }
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {
    popup (data) {
      this.modalLoading = true
      this.clickedId = data.value.replace(/^[a-zA-Z0-9]$/g, '')
      this.$refs.detail?.show()
    },
    buttonReviewerTitle (id) { return `查詢 ${id} 的${this.isOverdueMode ? '逾期' : '即將逾期'}案件` },
    searchByReviewer (id) {},
    remainMs (item) { return parseRocDateTime(item?.限辦期限) - this.now },
    rowClass (item, type) {
      if (!this.urgency || type !== 'row' || !item) { return '' }
      const lv = urgencyLevel(this.remainMs(item))
      return lv === 'unknown' ? '' : `exp-${lv}`
    },
    remainVariant (item) {
      return { crit: 'danger', warn: 'warning', over: 'warning', ok: 'success' }[urgencyLevel(this.remainMs(item))] || 'secondary'
    },
    remainText (item) {
      const r = this.remainMs(item)
      if (isNaN(r)) { return '-' }
      return r > 0 ? `剩 ${humanizeDuration(r)}` : `逾 ${humanizeDuration(r)}`
    },
    searchUser (name, id = '') {
      this.modal(this.$createElement(lahUserCard, {
        props: { name, id }
      }), {
        title: `${id} ${name} 資訊`
      })
    },
    distanceFromNow (val) {
      try {
        const head = val.substring(0, 3)
        const adHead = 1911 + parseInt(val)
        const adDate = val.replace(head, adHead)
        return this.$utils.formatDistanceToNow(+new Date(adDate))
      } catch (ex) {
        console.warn(`不是正常的日期時間，期望字串範例 👉 "113-06-26 15:58:00"，實際值 👉 "${val}"`)
        return '無法解析日期時間'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.exp-tbl ::v-deep tr.exp-crit > td:first-child { box-shadow: inset 5px 0 0 #dc3545; }
.exp-tbl ::v-deep tr.exp-warn > td:first-child { box-shadow: inset 5px 0 0 #fd7e14; }
.exp-tbl ::v-deep tr.exp-over > td:first-child { box-shadow: inset 5px 0 0 #ffc107; }
.exp-tbl ::v-deep tr.exp-ok > td:first-child { box-shadow: inset 5px 0 0 #28a745; }
.exp-tbl ::v-deep tr.exp-crit > td { background-color: rgba(220, 53, 69, .07); }
.exp-remain { font-variant-numeric: tabular-nums; min-width: 5.5rem; }
</style>
