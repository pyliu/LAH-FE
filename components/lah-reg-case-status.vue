<template>
  <b-card title="辦理情形">
    <b-list-group flush compact v-if="ready">
      <b-list-group-item>
        <b-form-row>
          <b-col :title="bakedData.預定結案日期"
            >預定結案：<span v-html="bakedData.限辦期限"></span
          ></b-col>
          <b-col :title="bakedData.結案與否">
            結案與否：
            <span v-if="ongoing" class="text-danger"
              ><strong>尚未結案！</strong></span
            >
            <span v-else class="text-success"><strong>已結案</strong></span>
          </b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.代理人統編)">
        <b-form-row>
          <b-col>代理人統編：{{ bakedData.代理人統編 }}</b-col>
          <b-col>代理人姓名：{{ bakedData.代理人姓名 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.權利人統編)">
        <b-form-row>
          <b-col>權利人統編：{{ bakedData.權利人統編 }}</b-col>
          <b-col>權利人姓名：{{ bakedData.權利人姓名 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.義務人統編)">
        <b-form-row>
          <b-col>義務人統編：{{ bakedData.義務人統編 }}</b-col>
          <b-col>義務人姓名：{{ bakedData.義務人姓名 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item>
        <b-form-row>
          <b-col>登記原因：{{ bakedData.登記原因 }}</b-col>
          <b-col
            >辦理情形：<span :class="bakedData.紅綠燈背景CSS">{{
              bakedData.辦理情形
            }}</span></b-col
          >
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item>
        <b-form-row>
          <b-col
            >收件人員：<span
              class="user_tag"
              :data-id="bakedData.收件人員ID"
              :data-name="bakedData.收件人員"
              >{{ bakedData.收件人員 }}</span
            ></b-col
          >
          <b-col>收件時間：{{ bakedData.收件時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.移轉課長)">
        <b-form-row>
          <b-col
            >移轉課長：<span class="user_tag">{{
              bakedData.移轉課長
            }}</span></b-col
          >
          <b-col>移轉課長時間：{{ bakedData.移轉課長時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.移轉秘書)">
        <b-form-row>
          <b-col
            >移轉秘書：<span class="user_tag">{{
              bakedData.移轉秘書
            }}</span></b-col
          >
          <b-col>移轉秘書時間：{{ bakedData.移轉秘書時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.初審人員)">
        <b-form-row>
          <b-col
            >初審人員：<span class="user_tag">{{
              bakedData.初審人員
            }}</span></b-col
          >
          <b-col>初審時間：{{ bakedData.初審時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.複審人員)">
        <b-form-row>
          <b-col
            >複審人員：<span class="user_tag">{{
              bakedData.複審人員
            }}</span></b-col
          >
          <b-col>複審時間：{{ bakedData.複審時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.駁回日期)">
        <b-form-row>
          <b-col>駁回日期：{{ bakedData.駁回日期 }}</b-col>
          <b-col></b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.公告日期)">
        <b-form-row>
          <b-col>公告日期：{{ bakedData.公告日期 }}</b-col>
          <b-col
            >公告到期：{{ bakedData.公告期滿日期 }} 天數：{{
              bakedData.公告天數
            }}</b-col
          >
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.通知補正日期)">
        <b-form-row>
          <b-col>通知補正：{{ bakedData.通知補正日期 }}</b-col>
          <b-col
            >補正期滿：{{ bakedData.補正期滿日期 }} 天數：{{
              bakedData.補正期限
            }}</b-col
          >
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.補正日期)">
        <b-form-row>
          <b-col>補正日期：{{ bakedData.補正日期 }}</b-col>
          <b-col></b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.請示人員)">
        <b-form-row>
          <b-col
            >請示人員：<span class="user_tag">{{
              bakedData.請示人員
            }}</span></b-col
          >
          <b-col>請示時間：{{ bakedData.請示時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.展期人員)">
        <b-form-row>
          <b-col
            >展期人員：<span class="user_tag">{{
              bakedData.展期人員
            }}</span></b-col
          >
          <b-col
            >展期日期：{{ bakedData.展期日期 }} 天數：{{
              bakedData.展期天數
            }}</b-col
          >
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.准登人員)">
        <b-form-row>
          <b-col
            >准登人員：<span class="user_tag">{{
              bakedData.准登人員
            }}</span></b-col
          >
          <b-col>准登日期：{{ bakedData.准登日期 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.登錄人員)">
        <b-form-row>
          <b-col
            >登錄人員：<span class="user_tag">{{
              bakedData.登錄人員
            }}</span></b-col
          >
          <b-col>登錄日期：{{ bakedData.登錄日期 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.校對人員)">
        <b-form-row>
          <b-col
            >校對人員：<span class="user_tag">{{
              bakedData.校對人員
            }}</span></b-col
          >
          <b-col>校對日期：{{ bakedData.校對日期 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.結案人員)">
        <b-form-row>
          <b-col
            >結案人員：<span class="user_tag">{{
              bakedData.結案人員
            }}</span></b-col
          >
          <b-col>結案日期：{{ bakedData.結案日期 }}</b-col>
        </b-form-row>
      </b-list-group-item>
    </b-list-group>
  </b-card>
</template>

<script>
import regCaseBase from "~/assets/js/reg-case-base.js";
export default {
  name: 'lah-reg-case-status',
  mixins: [regCaseBase],
  computed: {
    ongoing() {
      return this.ready && this.$utils.empty(this.bakedData.結案代碼);
    },
  },
};
</script>

<style lang="scss" scoped>
</style>
