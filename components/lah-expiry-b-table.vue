<template>
  <div>
    <b-table
      ref="tbl"
      striped
      hover
      responsive
      bordered
      head-variant="dark"
      caption-top
      no-border-collapse
      small
      :items="tableItems"
      :fields="fields"
      :busy="isBusy"
      class="text-center s-90"
    >
      <template v-slot:table-busy>
        <div class="text-center text-danger my-5">
          <strong>查詢中 ...</strong>
        </div>
      </template>
      <template v-slot:cell(序號)="data">
        {{ data.index + 1 }}
      </template>
      <template v-slot:cell(收件字號)="data">
        <b-link @click="popup(data)">{{ data.value }}</b-link>
        <NuxtLink :to="`/regcase/${data.value}`"><lah-fa-icon icon="share-square" /></NuxtLink>
      </template>
      <template v-slot:cell(初審人員)="data">
        <b-button
          :variant="buttoVariant"
          size="sm"
          @click="searchByReviewer(data.value)"
          :title="buttonReviewerTitle(data.value)"
        >
          {{ data.value.split(" ")[0] }}
        </b-button>
      </template>
      <template v-slot:cell(作業人員)="data">
        <b-button
          :data-name="data.value"
          :data-id="data.value"
          variant="outline-secondary"
          @click="searchUser(data.value)"
          size="sm"
          :title="`查詢 ${data.value} 的使用者訊息`"
          >{{ data.value }}</b-button
        >
      </template>
    </b-table>
    <b-modal
      :id="modalId"
      hide-footer
      centered
      size="xl"
    >
      <template #modal-title>
        登記案件詳情 {{clickedId}}
      </template>
      <span v-if="modalLoading" class="ld-txt">讀取中...</span>
      <lah-reg-case-detail v-show="!modalLoading" @ready="modalLoading = false" :case-id="clickedId"/>
    </b-modal>
  </div>
</template>

<script>
export default {
  name: 'lah-expiry-b-table',
  props: {
    id: { type: String, default: "" }
  },
  data: () => ({
    fields: [
      "序號",
      { key: "收件字號", sortable: true },
      { key: "登記原因", sortable: true },
      { key: "辦理情形", sortable: true },
      { key: "初審人員", sortable: true },
      { key: "作業人員", sortable: true },
      { key: "收件時間", sortable: true },
      { key: "限辦期限", sortable: true }
    ],
    modalId: 'this should be an uuid',
    clickedId: undefined,
    modalLoading: true
  }),
  computed: {
    totalCase () {
      return this.$store.getters["expiry/list_count"]
    },
    totalPeople () {
      return this.$store.getters["expiry/list_by_id_count"]
    },
    caseList () {
      return this.$store.getters["expiry/list"]
    },
    caseListByID () {
      return this.$store.getters["expiry/list_by_id"]
    },
    isOverdueMode () {
      return this.$store.getters["expiry/is_overdue_mode"]
    },
    tableItems () {
      return this.$utils.empty(this.id) ? this.caseList : this.caseListByID[this.id]
    },
    buttoVariant () { return this.isOverdueMode ? 'outline-danger' : 'warning' }
  },
  watch: {
    totalPeople (val) {
      this.notify({
        title: this.isOverdueMode ? '已逾期案件' : '快逾期案件',
        message: `查詢到 ${val} 位相關人員案件`,
        type: "info"
      })
    },
    totalCase (val) {
      this.notify({
        title:  this.isOverdueMode ? '已逾期案件' : '快逾期案件',
        message: `共有 ${val} 件案件`,
        type: "info"
      })
    }
  },
  methods: {
    popup (data) {
      this.modalLoading = true
      this.clickedId = data.value.replace(/^[a-zA-Z0-9]$/g, '')
      this.$bvModal.show(this.modalId)
    },
    buttonReviewerTitle (id) { return `查詢 ${id} 的${this.isOverdueMode ? '逾期' : '即將逾期'}案件` },
    searchByReviewer (id) {},
    searchUser (id) {}
  },
  created () { this.modalId = this.$utils.uuid() },
  mounted () {}
}
</script>

<style lang="scss"></style>
