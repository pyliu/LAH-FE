<template lang="pug">
b-card.border-0(
  v-if="ready"
  :no-body="compact"
  :title="`案件流程 ${ID}`"
): b-table(
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
)
  template(v-slot:table-busy): span.ld-txt 讀取中...
  template(v-slot:cell(辦理情形)="{ item }"): b-button(variant="link") {{ item['辦理情形'] }}
  template(v-slot:cell(收件人員)="{ item }"): b-button(variant="link" @click="userinfo(item['收件人員'], item['RM96'])") {{ item['收件人員'] }}
  template(v-slot:cell(作業人員)="{ item }"): b-button(pill variant="outline-secondary" @click="userinfo(item['作業人員'], item['RM30_1'])"): lah-avatar(:id="item['RM30_1']" :name="item['作業人員']") {{ item['作業人員'] }}
  template(v-slot:cell(初審人員)="{ item }"): b-button(variant="link" @click="userinfo(item['初審人員'], item['RM45'])") {{ item['初審人員'] }}
  template(v-slot:cell(複審人員)="{ item }"): b-button(variant="link" @click="userinfo(item['複審人員'], item['RM47'])") {{ item['複審人員'] }}
  template(v-slot:cell(准登人員)="{ item }"): b-button(variant="link" @click="userinfo(item['准登人員'], item['RM63'])") {{ item['准登人員'] }}
  template(v-slot:cell(登錄人員)="{ item }"): b-button(variant="link" @click="userinfo(item['登錄人員'], item['RM55'])") {{ item['登錄人員'] }}
  template(v-slot:cell(校對人員)="{ item }"): b-button(variant="link" @click="userinfo(item['校對人員'], item['RM57'])") {{ item['校對人員'] }}
  template(v-slot:cell(結案人員)="{ item }"): b-button(variant="link" @click="userinfo(item['結案人員'], item['RM59'])") {{ item['結案人員'] }}
</template>

<script>
import regCaseBase from '~/mixins/lah-reg-case-base.js';
import lahUserCard from '~/components/lah-user-card.vue';
export default {
  name: 'LahRegCaseFlow',
  components: { lahUserCard },
  mixins: [regCaseBase],
  props: {
    compact: { type: Boolean, default: false }
  },
  data: () => ({
    fields: [
      {
        key: '辦理情形',
        sortable: false
      },
      {
        key: '收件人員',
        label: '收件',
        sortable: false
      },
      {
        key: '作業人員',
        label: '作業',
        sortable: false
      },
      {
        key: '初審人員',
        label: '初審',
        sortable: false
      },
      {
        key: '複審人員',
        label: '複審',
        sortable: false
      },
      {
        key: '准登人員',
        label: '准登',
        sortable: false
      },
      {
        key: '登錄人員',
        label: '登簿',
        sortable: false
      },
      {
        key: '校對人員',
        label: '校對',
        sortable: false
      },
      {
        key: '結案人員',
        label: '結案',
        sortable: false
      }
    ]
  }),
  methods: {}
}
</script>

<style lang="scss" scoped>
</style>
