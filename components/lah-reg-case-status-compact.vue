<template lang="pug">
//- 最外層容器：加入 v-loading 處理讀取狀態
div.lah-compact-case-status(
  v-loading="isBusy"
  @click="$refs.detailModal.show()"
  title="點擊查看詳細辦理情形"
)

  template(v-if="ready")
    //- 1. 核心狀態區塊 (結案狀態 + 小按鈕)
    .status-header.d-flex.align-items-center.mb-3.pb-2.border-bottom

      //- 結案狀態標記
      lah-fa-icon(
        :icon="ongoing ? 'clock' : 'check-circle'"
        :variant="ongoing ? 'danger' : 'success'"
        size="lg"
      ).mr-2
      span.font-weight-bold.h6.mb-0(:class="ongoing ? 'text-danger' : 'text-success'")
        | {{ ongoing ? '未結案' : '已結案' }}

      //- 彈出詳細情形的小按鈕
      //- b-button.detail-btn.ml-2.py-0.px-2(
      //-   size="sm"
      //-   variant="outline-primary"
      //-   @click="$refs.detailModal.show()"
      //-   title="點擊查看詳細辦理情形"
      //-   pill
      //-   style="font-size: 0.8rem; line-height: 1.5;"
      //- )
      //-   lah-fa-icon(icon="search").mr-1
      //-   | 詳細

      //- 期限提示放右側
      span.text-muted.small.ml-auto.d-flex.align-items-center(title="預定結案日期")
        lah-fa-icon(icon="calendar-alt" regular).mr-1
        span(v-html="bakedData.限辦期限")

    //- 2. 人員與日期資訊清單 (垂直堆疊，自動換行)
    .info-list.small

      //- 登記原因
      .info-item(v-if="!$utils.empty(bakedData.登記原因)")
        strong.text-muted.mr-2 登記原因:
        span.text-dark {{ bakedData.登記原因 }}

      //- 代理人 (透過 displayName 判斷是否為非自然人)
      .info-item(v-if="!$utils.empty(bakedData.代理人統編)")
        strong.text-muted.mr-2 代理人:
        span.text-dark {{ displayName(bakedData.代理人姓名, bakedData.代理人統編) }}
        span.text-muted.ml-1 ({{ maskId(bakedData.代理人統編) }})

      //- 權利人 (透過 displayName 判斷是否為非自然人)
      .info-item(v-if="!$utils.empty(bakedData.權利人統編)")
        strong.text-muted.mr-2 權利人:
        span.text-dark {{ displayName(bakedData.權利人姓名, bakedData.權利人統編) }}
        span.text-muted.ml-1 ({{ maskId(bakedData.權利人統編) }})

      //- 承辦人員 (依序顯示：初審、複審、准登、登錄、登簿、校對、結案)
      .personnel-group.mt-2.p-2.rounded.bg-light(v-if="hasPersonnel")
        .d-inline-block.mr-3.mb-1(v-if="!$utils.empty(bakedData.初審人員)")
          span.text-muted.mr-1 初審:
          strong.text-dark {{ displayName(bakedData.初審人員) }}
        .d-inline-block.mr-3.mb-1(v-if="!$utils.empty(bakedData.複審人員)")
          span.text-muted.mr-1 複審:
          strong.text-dark {{ displayName(bakedData.複審人員) }}
        .d-inline-block.mr-3.mb-1(v-if="!$utils.empty(bakedData.准登人員)")
          span.text-muted.mr-1 准登:
          strong.text-dark {{ displayName(bakedData.准登人員) }}
        .d-inline-block.mr-3.mb-1(v-if="!$utils.empty(bakedData.登錄人員)")
          span.text-muted.mr-1 登錄:
          strong.text-dark {{ displayName(bakedData.登錄人員) }}
        .d-inline-block.mr-3.mb-1(v-if="!$utils.empty(bakedData.登簿人員)")
          span.text-muted.mr-1 登簿:
          strong.text-dark {{ displayName(bakedData.登簿人員) }}
        .d-inline-block.mr-3.mb-1(v-if="!$utils.empty(bakedData.校對人員)")
          span.text-muted.mr-1 校對:
          strong.text-dark {{ displayName(bakedData.校對人員) }}
        .d-inline-block.mb-1(v-if="!$utils.empty(bakedData.結案人員)")
          span.text-muted.mr-1 結案:
          strong.text-dark {{ displayName(bakedData.結案人員) }}

      //- 公告日期
      .info-item.mt-1(v-if="!$utils.empty(bakedData.公告日期)")
        strong.text-muted.mr-2 公告日期:
        span.text-dark {{ bakedData.公告日期 }}

      //- 補正期滿日 (高亮警告)
      .info-item(v-if="!$utils.empty(bakedData.補正期滿日)")
        strong.text-muted.mr-2 補期滿日:
        span.text-danger.font-weight-bold {{ bakedData.補正期滿日 }}

      //- 3. 補正通知詳細資訊 (獨立區塊強調顯示)
      .fix-data-box.mt-2.p-2.rounded(v-if="hasFixData")
        strong.text-danger.d-block.mb-1
          lah-fa-icon(icon="exclamation-triangle").mr-1
          | 補正通知內容
        div.fix-text(v-html="fixDataText")

    //- 4. 彈出詳細視窗 (加大為 xl 以利閱讀，搭配 lazy 屬性提升效能)
    b-modal(
      ref="detailModal"
      :title="`詳細辦理情形 - ${caseId || id}`"
      size="xl"
      hide-footer
      centered
      lazy
    )
      //- 引入原本雙欄排版的大組件
      lah-reg-case-status(:case-id="caseId || id")

  //- 無資料或查詢失敗時的空狀態顯示
  template(v-else-if="!isBusy")
    .empty-state.text-center.text-muted.py-4
      lah-fa-icon(icon="folder-open" size="2x").mb-2.opacity-50
      div 查無詳細辦理情形資料

</template>

<script>
import lahAvatar from '~/components/lah-avatar.vue';
import lahRegCaseStatus from '~/components/lah-reg-case-status.vue';
import lahUserCard from '~/components/lah-user-card.vue';
import regCaseBase from '~/mixins/lah-reg-case-base.js';

export default {
  name: 'LahRegCaseStatusCompact',
  components: { lahUserCard, lahAvatar, lahRegCaseStatus },
  mixins: [regCaseBase],
  data: () => ({
    localCRCRDData: false
  }),
  computed: {
    ongoing () {
      // 'E' => 請示
      return this.ready && this.bakedData && this.bakedData.結案與否 === 'N'
    },
    hasPersonnel () {
      // 判斷是否擁有任何處理人員資料
      if (!this.bakedData) { return false }
      const roles = [
        '初審人員', '複審人員', '准登人員',
        '登錄人員', '登簿人員', '校對人員', '結案人員'
      ]
      return roles.some(role => !this.$utils.empty(this.bakedData[role]))
    },
    hasFixData () {
      return !this.$utils.empty(this.id) && this.bakedData && !this.$utils.empty(this.bakedData.通知補正日期)
    },
    fixDataText () {
      return (this.localCRCRDData && this.localCRCRDData.RC05) ? this.localCRCRDData.RC05 : '⚠ 本地資料庫無資料，若為跨所案件請先確認該案件有同步過來❗'
    }
  },
  watch: {
    hasFixData (flag) {
      if (flag) {
        this.getLocalFixData()
      }
    }
  },
  methods: {
    // 💡 判定是否為自然人 (身分證字號或居留證：10碼，且首碼為英文)
    isNaturalPerson (id) {
      if (this.$utils.empty(id)) { return false }
      const str = String(id).trim()
      // 涵蓋身分證 (A123456789) 與新舊版居留證 (AC12345678, A812345678)
      return /^[a-zA-Z][a-zA-Z0-9]\d{8}$/.test(str)
    },

    // 💡 智慧顯示名稱 (判定為非自然人則顯示全名，否則遮蔽)
    displayName (name, id = null) {
      // 若有傳入統編且判定為非自然人 (如公司行號) -> 不遮蔽
      if (!this.$utils.empty(id) && !this.isNaturalPerson(id)) {
        return name
      }
      // 否則 (自然人，或內部無傳入統編的承辦人員) -> 遮蔽處理
      return this.maskName(name)
    },

    // 💡 統編去識別化 (G201312099 -> G201ＯＯＯ099)
    maskId (id) {
      // 若為非自然人 (如 8 碼統一編號)，直接回傳不遮蔽
      if (!this.isNaturalPerson(id)) { return id }

      const str = String(id).trim()
      if (str.length === 10) {
        // 保留前 4 碼、替換中間 3 碼、保留後 3 碼
        return str.substring(0, 4) + 'ＯＯＯ' + str.substring(7)
      }
      return id
    },

    // 💡 人名去識別化功能 (首尾保留，中間一律改為全形 Ｏ)
    maskName (name) {
      if (this.$utils.empty(name)) { return '' }
      const str = String(name).trim()
      const len = str.length
      if (len <= 1) { return str }
      if (len === 2) { return str[0] + 'Ｏ' }
      if (len === 3) { return str[0] + 'Ｏ' + str[2] }
      // 4 個字以上的名字 (例如：歐陽Ｏ華)
      return str[0] + 'Ｏ'.repeat(len - 2) + str[len - 1]
    },

    getLocalFixData () {
      this.isBusy = true
      this.localCRCRDData = false
      this.$axios.post(this.$consts.API.JSON.XCASE, {
        type: 'get_local_fix_data',
        id: this.id
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.localCRCRDData = data.raw
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-compact-case-status {
  font-size: 0.95rem;

  .status-header {
    border-color: rgba(0, 0, 0, 0.05) !important;
  }

  /* ★ 彈出詳細內容的小按鈕樣式 ★ */
  .detail-btn {
    transition: all 0.2s ease;
    border-width: 1px;
    background-color: transparent;
    box-shadow: none;

    &:hover {
      transform: scale(1.05);
    }
  }

  /* 垂直資料清單排版 */
  .info-list {
    display: flex;
    flex-direction: column;
    gap: 8px; /* 條目之間的留白 */
  }

  .info-item {
    line-height: 1.4;
    word-break: break-all; /* 防止過長的名字或統編撐破卡片 */
  }

  /* 承辦人員資訊群組的底色與排版 */
  .personnel-group {
    border: 1px solid rgba(0, 0, 0, 0.05);
    font-size: 0.9em;
  }

  /* 補正通知區塊專屬樣式 */
  .fix-data-box {
    background-color: rgba(220, 53, 69, 0.05); /* 微弱的紅色背景 */
    border: 1px solid rgba(220, 53, 69, 0.2);

    .fix-text {
      color: #495057;
      font-size: 0.9rem;
    }
  }

  .opacity-50 {
    opacity: 0.5;
  }
}

/* =========================================
   🌙 支援暗黑模式 (Dark Mode)
   使用 @at-root 讓選擇器能捕捉到外層的 .theme-dark
   ========================================= */
@at-root .theme-dark .lah-compact-case-status {
  .status-header {
    border-color: rgba(255, 255, 255, 0.1) !important;
  }

  .text-dark {
    color: #f8f9fa !important;
  }

  .text-muted {
    color: #adb5bd !important;
  }

  .personnel-group {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .fix-data-box {
    background-color: rgba(220, 53, 69, 0.15);
    border-color: rgba(220, 53, 69, 0.4);

    .fix-text {
      color: #e9ecef;
    }
  }

  /* ★ 優化暗主題下的小按鈕顏色：高亮度藍色以增加辨識度 ★ */
  .detail-btn {
    color: #66b2ff !important;
    border-color: #66b2ff !important;
    &:hover {
      background-color: #66b2ff !important;
      color: #212529 !important; /* 反白顯現黑色文字 */
    }
  }
}
</style>
