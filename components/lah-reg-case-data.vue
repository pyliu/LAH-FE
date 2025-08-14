<template lang="pug">
b-card
  b-card-title(v-if="!noTitle")
    | 收件資料
    b-link(:href="queryDataUrl" target="_blank" title="開啟新視窗")
      lah-fa-icon(icon="share-square" no-gutter)
  b-list-group(v-if="ready" flush compact)
    b-list-group-item(v-if="bakedData.跨所 == 'Y'")
      span.bg-info.text-white.rounded.p-1
        | 跨所案件 ({{ bakedData.資料收件所 }} =>
        | {{ bakedData.資料管轄所 }})
    b-list-group-item: .d-flex.align-items-center
      span 手機號碼：
      lah-fa-icon.mr-1(v-if="!$utils.isMobileValid(bakedData.手機號碼)", icon="ban", variant="danger", title="非有效之手機號碼")
      lah-fa-icon(
        icon="mobile-screen",
        append,
        :variant="haveCellNumber ? 'success' : 'danger'"
      )
        b-link(
          v-if="haveCellNumber",
          @click="popupSMSLog(bakedData.手機號碼)",
          :title="`根據${bakedData.手機號碼}搜尋簡訊紀錄`"
        ) {{ bakedData.手機號碼 }}
        span(v-else) [未建檔，無法傳送辦理情形簡訊]
    //- b-list-group-item(v-else)
    //-   .text-danger 手機號碼：[未輸入]
    b-list-group-item
      | 收件字號：
      a(:title="'收件資料 on ' + webapIp" href="javascript:void(0)" @click="$utils.openNewWindow(queryDataUrl, $event)")
        | {{ bakedData.收件字號 }}
    b-list-group-item
      | 收件時間：{{ bakedData.收件時間 }}
    b-list-group-item
      | 測量案件：{{ bakedData.測量案件 }}
    b-list-group-item
      | 限辦期限：
      span(v-html="bakedData.限辦期限")
    b-list-group-item
      | 作業人員：
      b-button(pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.作業人員, bakedData.RM30_1)")
        lah-avatar(:id="bakedData.RM30_1" :name="bakedData.作業人員")
          | {{ bakedData.作業人員 }}
    b-list-group-item
      | 辦理情形：{{ bakedData.辦理情形 }}
    b-list-group-item
      | 登記原因：{{ bakedData.登記原因 }}
    b-list-group-item
      | 區域：{{ bakedData.區名稱 }}【{{ bakedData.RM10 }}】
    b-list-group-item
      | 段小段：{{ bakedData.段小段 }}【{{ bakedData.段代碼 }}】
    b-list-group-item.d-flex.justify-content-between.align-items-center
      div 地號：{{ bakedData.地號 }}
      div 土地面積：{{ bakedData.土地面積 || '未輸入' }}
    b-list-group-item.d-flex.justify-content-between.align-items-center
      div 建號：{{ bakedData.建號 }}
      div 建物面積：{{ bakedData.建物面積 || '未輸入' }}
    b-list-group-item  件數：{{ bakedData.件數 }}
    b-list-group-item
      | 登記處理註記：{{ bakedData.登記處理註記 }}
    b-list-group-item
      | 地價處理註記：{{ bakedData.地價處理註記 }}
</template>

<script>
import lahAdmSmslogTableVue from '~/components/lah-adm-smslog-table.vue';
import lahAvatar from '~/components/lah-avatar.vue';
import regCaseBase from '~/mixins/lah-reg-case-base.js';
import lahUserCard from '~/components/lah-user-card.vue';
export default {
  name: 'LahRegCaseData',
  components: { lahUserCard, lahAvatar, lahAdmSmslogTableVue },
  mixins: [regCaseBase],
  props: {
    noTitle: { type: Boolean, default: false }
  },
  computed: {
    haveCellNumber () {
      return !this.$utils.empty(this.bakedData.手機號碼)
    }
  },
  watch: {},
  methods: {
    popupSMSLog (keyword) {
      this.modal(this.$createElement(lahAdmSmslogTableVue, {
        props: {
          inKeyword: keyword
        }
      }), {
        title: '簡訊記錄檔查詢',
        size: 'xl',
        noCloseOnBackdrop: true,
        centered: false,
        scrollable: false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
