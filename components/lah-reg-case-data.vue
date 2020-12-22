<template>
  <b-card>
    <b-card-title v-if="!noTitle">
      <b-link :href="queryDataUrl" target="_blank" title="開啟新視窗"><lah-fa-icon append icon="share-square">收件資料</lah-fa-icon></b-link>
    </b-card-title>
    <b-list-group flush compact v-if="ready">
      <b-list-group-item v-if="bakedData.跨所 == 'Y'">
        <span class="bg-info text-white rounded p-1"
          >跨所案件 ({{ bakedData.資料收件所 }} =>
          {{ bakedData.資料管轄所 }})</span
        >
      </b-list-group-item>
      <b-list-group-item>
        收件字號：
        <a
          :title="'收件資料 on ' + $consts.AP"
          href="javascript:void(0)"
          @click="$utils.openNewWindow(queryDataUrl, $event)"
        >
          {{ bakedData.收件字號 }}
        </a>
      </b-list-group-item>
      <b-list-group-item>
        收件時間：{{ bakedData.收件時間 }}
      </b-list-group-item>
      <b-list-group-item>
        測量案件：{{ bakedData.測量案件 }}
      </b-list-group-item>
      <b-list-group-item>
        限辦期限：<span v-html="bakedData.限辦期限"></span>
      </b-list-group-item>
      <b-list-group-item>
        作業人員：<span>{{ bakedData.作業人員 }}</span>
      </b-list-group-item>
      <b-list-group-item>
        辦理情形：{{ bakedData.辦理情形 }}
      </b-list-group-item>
      <b-list-group-item>
        登記原因：{{ bakedData.登記原因 }}
      </b-list-group-item>
      <b-list-group-item>
        區域：{{ area }}【{{ bakedData.RM10 }}】
      </b-list-group-item>
      <b-list-group-item>
        段小段：{{ bakedData.段小段 }}【{{ bakedData.段代碼 }}】
      </b-list-group-item>
      <b-list-group-item> 地號：{{ bakedData.地號 }} </b-list-group-item>
      <b-list-group-item> 建號：{{ bakedData.建號 }} </b-list-group-item>
      <b-list-group-item> 件數：{{ bakedData.件數 }} </b-list-group-item>
      <b-list-group-item>
        登記處理註記：{{ bakedData.登記處理註記 }}
      </b-list-group-item>
      <b-list-group-item>
        地價處理註記：{{ bakedData.地價處理註記 }}
      </b-list-group-item>
      <b-list-group-item>
        手機號碼：{{ bakedData.手機號碼 }}
      </b-list-group-item>
    </b-list-group>
  </b-card>
</template>

<script>
import regCaseBase from "~/assets/js/reg-case-base.js";
export default {
  name: 'lah-reg-case-data',
  mixins: [regCaseBase],
  props: {
    noTitle: { type: Boolean, default: false }
  },
  computed: {
    area () {
      if (this.ready) {
        switch (this.bakedData.RM10) {
          case "03":
            return "中壢區";
          case "08":
            return "八德區";
          case "12":
            return "觀音區";
        }
      }
      return this.ready ? `其他(${this.bakedData.資料管轄所}區)` : "";
    }
  }
};
</script>

<style lang="scss" scoped>
</style>
