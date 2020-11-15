<template>
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
    :caption="caption"
    :items="table_items"
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
    <template v-slot:cell(初審人員)="data">
      <b-button
        :variant="is_overdue_mode ? 'outline-danger' : 'warning'"
        size="sm"
        @click="searchByReviewer(data.value)"
        :title="
          '查詢 ' +
            data.value +
            ' 的' +
            (is_overdue_mode ? '逾期' : '即將逾期') +
            '案件'
        "
        >{{ data.value.split(" ")[0] }}</b-button
      >
      <span>{{ data.value.split(" ")[0] }}</span>
    </template>
    <template v-slot:cell(作業人員)="data">
      <b-button
        :data-name="data.value"
        :data-id="data.value"
        variant="outline-secondary"
        size="sm"
        :title="'查詢 ' + data.value + ' 的使用者訊息'"
        >{{ data.value }}</b-button
      >
    </template>
  </b-table>
</template>

<script>
export default {
  props: {
    id: { type: String, default: "" },
    json: { type: Object, required: true }
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
    caption: "查詢中 ... ",
    mode: "逾期模式"
  }),
  computed: {
    total_case() {
      return this.$store.getters["expiry/list_count"];
    },
    total_people() {
      return this.$store.getters["expiry/list_by_id_count"];
    },
    caseList() {
      return this.$store.getters["expiry/list"];
    },
    case_list_by_id() {
      return this.$store.getters["expiry/list_by_id"];
    },
    is_overdue_mode() {
      return this.$store.getters["expiry/is_overdue_mode"];
    },
    table_items() {
      return this.is_in_modal_mode
        ? this.case_list_by_id[this.inSearchID]
        : this.caseList;
    }
  },
  watch: {
    json (obj) { this.load() }
  },
  methods: {
    load() {
      this.isBusy = true;
      // NOTE: the payload must be valid or it will not update UI correctly
      this.$store.commit("expiry/list", this.json.items);
      this.$store.commit("expiry/list_by_id", this.json.items_by_id);
      this.caption = `${this.json.data_count} 件，更新時間: ${this.datetimeNow()}`;
      // release busy ...
      this.isBusy = false;
      // send notification
      this.notify({
        title: this.mode,
        message: `查詢到 ${this.json.data_count} 件案件`,
        type: "info"
      });
    }
  },
  created() {},
  mounted() {}
};
</script>

<style lang="scss"></style>
