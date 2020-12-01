<template>
    <b-card
      v-if="ready"
      :no-body="compact"
      :title="`案件流程 ${ID}`"
      class="border-0"
    >
      <b-table
        ref="bTable"
        :responsive="'lg'"
        :striped="true"
        :hover="true"
        :bordered="true"
        :borderless="false"
        :outlined="false"
        :small="true"
        :dark="false"
        :fixed="false"
        :foot-clone="false"
        :no-border-collapse="true"
        :head-variant="'dark'"
        :items="[bakedData]"
        :fields="fields"
        class="text-center"
      >
        <template v-slot:table-busy>
          <span class="ld-txt">讀取中...</span>
        </template>
        <template v-slot:cell(辦理情形)="{ item }">
          <b-button variant="link">{{ item['辦理情形'] }}</b-button>
        </template>
        <template v-slot:cell(收件人員)="{ item }">
          <b-button variant="link" @click="userinfo(item['收件人員'], item['RM96'])">{{ item['收件人員'] }}</b-button>
        </template>
        <template v-slot:cell(作業人員)="{ item }">
          <b-button variant="link" @click="userinfo(item['作業人員'], item['RM30_1'])">{{ item['作業人員'] }}</b-button>
        </template>
        <template v-slot:cell(初審人員)="{ item }">
          <b-button variant="link" @click="userinfo(item['初審人員'], item['RM45'])" v-b-popover.top.hover.focus.html="(item, item.ELAPSED_TIME['初審'])">{{ item['初審人員'] }}</b-button>
        </template>
        <template v-slot:cell(複審人員)="{ item }">
          <b-button variant="link" @click="userinfo(item['複審人員'], item['RM47'])" v-b-popover.top.hover.focus.html="(item, item.ELAPSED_TIME['複審'])">{{ item['複審人員'] }}</b-button>
        </template>
        <template v-slot:cell(准登人員)="{ item }">
          <b-button variant="link" @click="userinfo(item['准登人員'], item['RM63'])" v-b-popover.top.hover.focus.html="(item, item.ELAPSED_TIME['准登'])">{{ item['准登人員'] }}</b-button>
        </template>
        <template v-slot:cell(登錄人員)="{ item }">
          <b-button variant="link" @click="userinfo(item['登錄人員'], item['RM55'])" v-b-popover.top.hover.focus.html="(item, item.ELAPSED_TIME['登錄'])">{{ item['登錄人員'] }}</b-button>
        </template>
        <template v-slot:cell(校對人員)="{ item }">
          <b-button variant="link" @click="userinfo(item['校對人員'], item['RM57'])" v-b-popover.top.hover.focus.html="(item, item.ELAPSED_TIME['校對'])">{{ item['校對人員'] }}</b-button>
        </template>
        <template v-slot:cell(結案人員)="{ item }">
          <b-button variant="link" @click="userinfo(item['結案人員'], item['RM59'])" v-b-popover.top.hover.focus.html="(item, item.ELAPSED_TIME['結案'])">{{ item['結案人員'] }}</b-button>
        </template>
      </b-table>
    </b-card>
</template>

<script>
import regCaseBase from "~/assets/js/reg-case-mixin.js";

export default {
  name: "lah-reg-case-flow",
  mixins: [regCaseBase],
  data: () => ({
    fields: [
      {
        key: "辦理情形",
        sortable: false
      },
      {
        key: "收件人員",
        label: "收件",
        sortable: false
      },
      {
        key: "作業人員",
        label: "作業",
        sortable: false
      },
      {
        key: "初審人員",
        label: "初審",
        sortable: false
      },
      {
        key: "複審人員",
        label: "複審",
        sortable: false
      },
      {
        key: "准登人員",
        label: "准登",
        sortable: false
      },
      {
        key: "登錄人員",
        label: "登簿",
        sortable: false
      },
      {
        key: "校對人員",
        label: "校對",
        sortable: false
      },
      {
        key: "結案人員",
        label: "結案",
        sortable: false
      },
    ]
  }),
  props: {
    compact: { type: Boolean, default: false }
  },
  methods: {
    userinfo (name, id) {
      this.$utils.log(name, id)
    }
  }
};
</script>

<style lang="scss" scoped>
</style>
