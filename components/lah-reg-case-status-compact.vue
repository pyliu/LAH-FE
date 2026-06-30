<template lang="pug">
b-overlay.lah-compact-case-status(
  :show="isBusy"
  rounded="sm"
  opacity="0.6"
  spinner-variant="primary"
)
  //- 1. 有資料時顯示
  template(v-if="ready")
    //- 彈性垂直容器：將整個區塊設定為可點擊 (clickable-wrapper)
    .d-flex.flex-column.h-100.clickable-wrapper(
      tabindex="0"
      @click="$refs.detailModal.show()"
      @keyup.enter="$refs.detailModal.show()"
      title="點擊查看詳細辦理情形"
    )

      //- 核心狀態區塊 (燈號 + 辦理情形)
      .status-header.d-flex.align-items-center.mb-3.pb-2.border-bottom
        lah-fa-icon.status-light(
          icon="circle"
          :variant="statusVariant"
          size="lg"
        ).mr-2
        span.font-weight-bold.h6.mb-0(:class="`text-${statusVariant}`")
          | {{ caseStatusText }}
        span.text-muted.small.ml-auto.d-flex.align-items-center(title="預定結案日期")
          lah-fa-icon(icon="calendar-alt" regular).mr-1
          span(v-html="bakedData.限辦期限")

      //- 資訊清單
      .info-list.small

        //- 登記原因/作業人員/代理人/手機/權利人/義務人 統一以 v-for 渲染
        //- 💡 visibleInfoItems 已過濾掉空值欄位（手機固定保留），
        //-    固定 3 欄排列（每列最多 3 筆資訊），超過則自動換行；
        //-    並為每個欄位加上淺色卡片邊界，避免文字換行時與相鄰欄位混淆不易分辨
        .info-row-3col
          .info-item(v-for="item in visibleInfoItems" :key="item.key")
            //- 手機欄位需要顯示「無資料」警示，邏輯較特殊故獨立處理
            template(v-if="item.type === 'cellphone'")
              strong.text-muted.mr-1 手機:
              span.text-dark(v-if="hasCellphone") {{ cellphoneStr }}
              span.text-danger.font-weight-bold.d-inline-flex.align-items-start(
                v-else
                title="缺少手機資訊將無法發送案件狀態簡訊"
              )
                lah-fa-icon(icon="exclamation-circle").mr-1.mt-1.flex-shrink-0
                | 無資料
            //- 一般欄位（含代理人/權利人/義務人這類附帶統編 suffix 的欄位）
            template(v-else)
              strong.text-muted.mr-1 {{ item.label }}:
              span.text-dark {{ item.value }}
              span.text-muted.ml-1(v-if="item.suffix") ({{ item.suffix }})

        //- 承辦人員 (緊湊標籤排列)
        .personnel-group.mt-2.p-2.rounded.bg-light(v-if="hasPersonnel")
          .d-inline-block.mr-3.mb-1(v-if="!$utils.empty(bakedData.初審人員)")
            span.text-muted.mr-1 初審:
            strong.text-dark {{ maskName(bakedData.初審人員) }}
          .d-inline-block.mr-3.mb-1(v-if="!$utils.empty(bakedData.複審人員)")
            span.text-muted.mr-1 複審:
            strong.text-dark {{ maskName(bakedData.複審人員) }}
          .d-inline-block.mr-3.mb-1(v-if="!$utils.empty(bakedData.准登人員)")
            span.text-muted.mr-1 准登:
            strong.text-dark {{ maskName(bakedData.准登人員) }}
          .d-inline-block.mr-3.mb-1(v-if="!$utils.empty(bakedData.登錄人員)")
            span.text-muted.mr-1 登錄:
            strong.text-dark {{ maskName(bakedData.登錄人員) }}
          .d-inline-block.mr-3.mb-1(v-if="!$utils.empty(bakedData.校對人員)")
            span.text-muted.mr-1 校對:
            strong.text-dark {{ maskName(bakedData.校對人員) }}
          .d-inline-block.mr-3.mb-1(v-if="!$utils.empty(bakedData.歸檔人員)")
            span.text-muted.mr-1 歸檔:
            strong.text-dark {{ maskName(bakedData.歸檔人員) }}
          .d-inline-block.mb-1(v-if="!$utils.empty(bakedData.結案人員)")
            span.text-muted.mr-1 結案:
            strong.text-dark {{ maskName(bakedData.結案人員) }}

        //- 公告日期
        .info-item.mt-1(v-if="!$utils.empty(bakedData.公告日期)")
          strong.text-muted.mr-2 公告日期:
          span.text-dark {{ bakedData.公告日期 }}

        //- 補正期滿日 (高亮警告)
        .info-item(v-if="!$utils.empty(bakedData.補正期滿日)")
          strong.text-muted.mr-2 補期滿日:
          span.text-danger.font-weight-bold {{ bakedData.補正期滿日 }}

        //- 補正通知詳細資訊
        .fix-data-box.mt-2.p-2.rounded(v-if="hasFixData")
          strong.text-danger.d-block.mb-1
            lah-fa-icon(icon="exclamation-triangle").mr-1
            | 補正通知內容
          div.fix-text(v-html="fixDataText")

    //- 彈出詳細視窗 (遮蔽版詳細視窗)
    b-modal(
      ref="detailModal"
      :title="`詳細辦理情形 - ${caseId || id}`"
      size="xl"
      hide-footer
      centered
      lazy
    )
      lah-reg-case-status-masked(:parent-data="bakedData")

  //- 2. 查無資料或 API 異常顯示
  template(v-else-if="!isBusy")
    .empty-state.text-center.text-muted.py-4
      lah-fa-icon(icon="folder-open" size="2x").mb-2.opacity-50
      div 查無詳細辦理情形資料

  //- 3. 正在讀取時的佔位區塊 (防塌陷)
  template(v-else)
    .loading-placeholder.d-flex.flex-column.align-items-center.justify-content-center.text-muted(style="min-height: 150px;")
      span.small.opacity-50 正在查詢詳細資料...

</template>

<script>
import lahRegCaseStatusMasked from '~/components/lah-reg-case-status-masked.vue';
import regCaseBase from '~/mixins/lah-reg-case-base.js';

export default {
  name: 'LahRegCaseStatusCompact',
  components: { lahRegCaseStatusMasked },
  mixins: [regCaseBase],
  data: () => ({
    localCRCRDData: false,
    localLoadFailed: false
  }),
  computed: {
    ongoing () {
      return this.ready && this.bakedData && this.bakedData.結案與否 === 'N'
    },
    caseStatusText () {
      if (!this.ready || !this.bakedData) { return '讀取中...' }
      return this.bakedData.辦理情形 || (this.ongoing ? '處理中' : '已結案')
    },
    statusVariant () {
      if (!this.ready || !this.bakedData) { return 'secondary' }
      if (!this.ongoing) { return 'success' }
      const status = this.caseStatusText
      if (status.includes('補正') || status.includes('駁回')) {
        return 'danger'
      }
      return 'warning'
    },
    hasCellphone () {
      if (!this.bakedData) { return false }
      return !this.$utils.empty(this.bakedData.手機號碼) || !this.$utils.empty(this.bakedData.RM102)
    },
    cellphoneStr () {
      if (!this.bakedData) { return '' }
      return this.bakedData.手機號碼 || this.bakedData.RM102 || ''
    },
    hasPersonnel () {
      if (!this.bakedData) { return false }
      const roles = [
        '初審人員', '複審人員', '准登人員',
        '登錄人員', '校對人員', '歸檔人員', '結案人員'
      ]
      return roles.some(role => !this.$utils.empty(this.bakedData[role]))
    },
    hasFixData () {
      return !this.$utils.empty(this.id) && this.bakedData && !this.$utils.empty(this.bakedData.通知補正日期)
    },
    fixDataText () {
      if (this.localLoadFailed) {
        return '❌ 補正資料載入失敗，請稍後再試或聯繫系統管理員'
      }
      if (this.localCRCRDData && this.localCRCRDData.RC05) {
        return this.localCRCRDData.RC05
      }
      return '⚠ 本地資料庫無資料，若為跨所案件請先確認該案件有同步過來❗'
    },
    // 💡 將「登記原因/作業人員/代理人/手機/權利人/義務人」依序組裝成單一清單，
    //    並濾除空值欄位（手機固定保留，缺資料要顯示警示），交給 .info-row-3col 固定3欄 grid 渲染。
    //    當某欄位無資料時，後續欄位會自動往前補位遞補；超過3筆則自動換到下一列。
    visibleInfoItems () {
      if (!this.bakedData) { return [] }
      const d = this.bakedData
      const items = []

      if (!this.$utils.empty(d.登記原因)) {
        items.push({ key: 'reg_reason', type: 'simple', label: '登記原因', value: d.登記原因 })
      }
      if (!this.$utils.empty(d.作業人員)) {
        items.push({ key: 'staff', type: 'simple', label: '作業人員', value: this.maskName(d.作業人員) })
      }
      if (!this.$utils.empty(d.代理人統編)) {
        items.push({
          key: 'agent',
          type: 'person',
          label: '代理人',
          value: this.displayName(d.代理人姓名, d.代理人統編),
          suffix: this.maskId(d.代理人統編)
        })
      }
      // 手機固定顯示，即使無資料也要顯示警示，因此不受 empty 過濾限制
      items.push({ key: 'cellphone', type: 'cellphone', label: '手機' })

      if (!this.$utils.empty(d.權利人統編)) {
        items.push({
          key: 'right_holder',
          type: 'person',
          label: '權利人',
          value: this.displayName(d.權利人姓名, d.權利人統編),
          suffix: this.maskId(d.權利人統編)
        })
      }
      if (!this.$utils.empty(d.義務人統編)) {
        items.push({
          key: 'duty_holder',
          type: 'person',
          label: '義務人',
          value: this.displayName(d.義務人姓名, d.義務人統編),
          suffix: this.maskId(d.義務人統編)
        })
      }
      return items
    }
  },
  watch: {
    hasFixData: {
      immediate: true,
      handler (flag) {
        if (flag) {
          this.getLocalFixData()
        }
      }
    }
  },
  methods: {
    isNaturalPerson (id) {
      if (this.$utils.empty(id)) { return false }
      const str = String(id).trim()
      return /^[a-zA-Z][a-zA-Z0-9]\d{8}$/.test(str)
    },
    displayName (name, id = null) {
      if (!this.$utils.empty(id) && !this.isNaturalPerson(id)) {
        return name
      }
      return this.maskName(name)
    },
    maskId (id) {
      if (!this.isNaturalPerson(id)) { return id }
      const str = String(id).trim()
      if (str.length === 10) {
        return str.substring(0, 4) + 'ＯＯＯ' + str.substring(7)
      }
      return id
    },
    maskName (name) {
      if (this.$utils.empty(name)) { return '' }
      const str = String(name).trim()
      const len = str.length
      if (len <= 1) { return str }

      // ★ 針對尾部：移除所有數字、空白與常見標點符號 (包含全半形括號)
      // 藉此精準取得最後一個「非數字且非符號」的字元作為尾字
      const cleanStr = str.replace(/[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?（）「」【】《》、，。]+$/, '')

      // 如果過濾後完全為空（代表原本全是數字或符號），則 fallback 用原本的字串
      const targetStr = cleanStr.length > 0 ? cleanStr : str
      const targetLen = targetStr.length

      if (targetLen === 1) {
        // 如果過濾後只剩一個字（例如原本是 "王 1"）
        return targetStr[0] + 'Ｏ'
      }
      if (targetLen === 2) {
        // 兩個字的情況
        return targetStr[0] + 'Ｏ'
      }
      // 3個字以上，取頭尾字元，中間統一塞單一個「Ｏ」
      return targetStr[0] + 'Ｏ' + targetStr[targetLen - 1]
    },
    getLocalFixData () {
      if (this.isBusy) { return }
      this.isBusy = true
      this.localCRCRDData = false
      this.localLoadFailed = false
      this.$axios.post(this.$consts.API.JSON.XCASE, {
        type: 'get_local_fix_data',
        id: this.id
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.localCRCRDData = data.raw
        }
      }).catch((err) => {
        this.$utils.error(err)
        this.localLoadFailed = true
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
  height: 100%;

  .clickable-wrapper {
    cursor: pointer;
    user-select: none;
    transition: opacity 0.15s ease, transform 0.15s ease;

    &:active {
      opacity: 0.75;
      transform: scale(0.99);
    }

    &:focus, &:focus-visible {
      outline: none !important;
      box-shadow: none !important;
    }
  }

  .status-header {
    border-color: rgba(0, 0, 0, 0.05) !important;
  }

  .status-light {
    text-shadow: 0 0 6px currentColor;
  }

  .info-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .info-item {
    line-height: 1.4;
    word-break: break-all;
  }

  .info-row-3col {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px 10px;
    // 改為 stretch（grid 預設值），讓同一列格子高度自動拉齊到該列最高的格子，
    // 避免文字長度不同（換行與否）造成格子參差不齊
    align-items: stretch;

    .info-item {
      min-width: 0;
      // 加上淺色背景與細邊框，讓每個資訊欄位的邊界清楚可辨，避免換行文字與相鄰欄位混淆
      padding: 5px 8px;
      background-color: rgba(0, 0, 0, 0.025);
      border: 1px solid rgba(0, 0, 0, 0.07);
      border-radius: 4px;
    }
  }

  // 窄版面時降為 2 欄 / 1 欄，避免擠壓導致文字過度換行
  @media (max-width: 480px) {
    .info-row-3col {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 320px) {
    .info-row-3col {
      grid-template-columns: 1fr;
    }
  }

  .personnel-group {
    border: 1px solid rgba(0, 0, 0, 0.05);
    font-size: 0.9em;
  }

  .fix-data-box {
    background-color: rgba(220, 53, 69, 0.05);
    border: 1px solid rgba(220, 53, 69, 0.2);

    .fix-text {
      color: #495057;
      font-size: 0.9rem;
    }
  }

  .loading-placeholder {
    width: 100%;
  }

  .opacity-50 {
    opacity: 0.5;
  }
}

/* =========================================
   🌙 支援暗黑模式 (Dark Mode)
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

  .text-warning {
    color: #ffda6a !important;
  }

  .personnel-group {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .info-row-3col .info-item {
    background-color: rgba(255, 255, 255, 0.04) !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }

  .fix-data-box {
    background-color: rgba(220, 53, 69, 0.15);
    border-color: rgba(220, 53, 69, 0.4);

    .fix-text {
      color: #e9ecef;
    }
  }

  .text-danger {
    color: #ff6b6b !important;
  }
}
</style>
