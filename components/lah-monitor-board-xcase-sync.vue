<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    .font-weight-bold.truncate(:title="header") {{ header }}
    b-button-group.ml-auto(size="sm")
      //- 點擊按鈕開啟 history modal
      lah-button-count-badge.cursor-pointer(
        @click="$refs.history.show()",
        :count="publicationHistory.length",
        :variant="publicationHistoryLight",
        :action="publicationHistoryLight !== 'success' ? 'breath' : ''",
        :title="`${publicationHistoryReloadMs / 1000 / 60} 分鐘內本所待處理的 PUBLICATION_HISTORY 資料 (點擊查看詳情)`"
      )
        b-badge(variant="light", pill) {{ publicationHistory.length }}
      lah-button(
        icon="arrow-up-right-from-square",
        title="顯示有問題案件列表",
        :variant="light === 'danger' ? 'danger' : light === 'warning' ? 'warning' : 'outline-secondary'",
        :disabled="caseIds.length === 0",
        @click="$refs.found.show()",
        no-border
      ) 未回寫案件 ({{ caseIds.length }})
      lah-button(
        v-if="!footer"
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        @click="checkXCaseSyncStatus",
        :title="`上次更新時間 ${updated}`",
        :spin="isBusy",
        no-border
      ) {{ isBusy ? '讀取中...' : updated }}
      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="說明"
      )
    lah-help-modal(ref="help", :modal-title="`${header} 監控說明`")
      ul
        li 顯示今日({{ today }})跨所非子號案件回寫狀態監控資訊
        li 儀表板每{{ reloadMs / 1000 / 60 }}分鐘重新檢查一次
      hr
      div
        strong 標題燈號 (整體狀態)：
      div 🟢 表示一切正常 (未回寫案件數 = 0 且 待處理歷程 < 30)
      div 🟡 表示有案件回寫異常 (未回寫案件數 = 1 或 待處理歷程 >= 30)
      div 🔴 表示有多個案件回寫異常 (未回寫案件數 > 1 或 待處理歷程 >= 100)
      hr
      div
        strong 儀表板所別方塊：
      div 🟢 (預設邊框) - 該管轄所無未回寫案件 / 本所待處理極少
      div 🟡 (黃色邊框) - 該管轄所有 1 筆未回寫案件 / 本所待處理量偏多
      div 🔴 (紅色邊框) - 該管轄所有 2 筆 (含) 以上未回寫案件 / 本所待處理量過多
  slot
  lah-transition
    .center(v-if="isBusy"): lah-fa-icon(
      icon="spinner",
      action="spin"
    ) 讀取中...
    .h-100(v-else)
      .offices
        //- 修改：加入點擊事件 handleCardClick，並動態加入 cursor-pointer
        .office.center(
          v-for="(code, idx) in formattedInfo" :key="`${code.id}_card`"
          :class="[getCardBorderClass(code), {'cursor-pointer': code.isLocal}]"
          v-b-tooltip="getTooltipConfig(code)"
          @click="handleCardClick(code)"
        )
          .status-dot.mr-1(
            :class="getStatusClass(code)"
          )
            //- 僅在 count > 0 時顯示數量
            span(v-if="code.details.foundIds.length > 0") {{ code.details.foundIds.length }}
          //- 文字區塊 (垂直堆疊)
          .text-area.d-flex.flex-column
            //- 地區名稱
            span.area-name {{ getAreaName(code.id) }}
            //- 最大案件號 / 待處理狀態 (本所不顯示 '號')
            span.local-max {{ code.details.localMax }} {{ code.isLocal ? '' : '號' }}

  b-modal(
    ref="found",
    hide-footer,
    centered,
    scrollable
  )
    template(#modal-title) 跨所未回寫案件列表 ({{ caseIds.length }})
    b-list-group(flush)
      b-list-group-item(v-for="(caseId, idx) in caseIds" :key="caseId")
        .d-flex.justify-content-between.align-items-center
          div
            b-badge.mr-1.badge-lg(
              :variant="getAreaVariant(caseId)"
            ) {{ getAreaNameFromCaseId(caseId) }}
            span {{ caseId }}
          lah-button(
            icon="bug-slash",
            variant="outline-danger",
            @click="fix(caseId)"
          ) 修正

  //- Publication History Modal
  b-modal(
    ref="history",
    hide-footer,
    size="xl",
    scrollable
  )
    template(#modal-title) 待處理 Publication History ({{ publicationHistory.length }})
    b-table(
      :items="publicationHistory",
      :fields="historyFields",
      striped,
      hover,
      small,
      responsive,
      show-empty
    )
      template(#empty)
        .text-center.text-muted 目前無待處理資料
      //- 序號
      template(#cell(index)="data") {{ data.index + 1 }}
      //- 時間 (截斷毫秒)
      template(#cell(DATE_TIME)="data")
        span.text-nowrap {{ data.item.DATE_TIME ? data.item.DATE_TIME.split('.')[0] : '' }}
      //- 流向 (From -> To)
      template(#cell(org)="data")
        .text-nowrap
          b-badge.mr-1(variant="secondary") {{ getAreaName(data.item.FROM_ORG_ID) }}
          lah-fa-icon(icon="arrow-right", variant="secondary", size="xs")
          b-badge.ml-1(variant="primary") {{ getAreaName(data.item.TO_ORG_ID) }}
      //- SQL 內容 (自動換行)
      template(#cell(SQL)="data")
        .text-muted.small.text-wrap.text-break(style="max-width: 500px") {{ data.item.SQL }}

  template(#footer, v-if="footer"): client-only: lah-monitor-board-footer(
    ref="footer"
    :reload-ms="reloadMs",
    :busy="isBusy",
    :fetch="$fetch",
    :reload="checkXCaseSyncStatus",
    :update-time="updated"
  )
</template>

<script>
import dynamicHeight from '~/mixins/dynamic-height-mixin';
export default {
  name: 'LahMonitorBoardXcaseSync',
  emit: ['light-update'],
  mixins: [dynamicHeight],
  props: {
    footer: { type: Boolean, default: false },
    enableAttention: { type: Boolean, default: false }
  },
  data: () => ({
    header: '跨所案件回寫狀態',
    today: '',
    updated: '',
    infoRaw: null,
    caseIds: [],
    publicationHistory: [],
    historyFields: [
      { key: 'index', label: '#' },
      { key: 'DATE_TIME', label: '時間', sortable: true, thClass: 'text-nowrap' },
      { key: 'PUBLICATION_NAME', label: '名稱', sortable: true, thClass: 'text-nowrap' },
      { key: 'org', label: '流向', thClass: 'text-nowrap' },
      { key: 'TABLE_DESCRIPTION', label: '資料表', sortable: true, thClass: 'text-nowrap' },
      { key: 'SQL', label: '內容' }
    ],
    message: '讀取中',
    // ID 到名稱的映射表
    areaNameMap: {
      LOCALHOST: '本所', // 新增本所對應
      HA: '桃園',
      HB: '中壢',
      HC: '大溪',
      HD: '楊梅',
      HE: '蘆竹',
      HF: '八德',
      HG: '平鎮',
      HH: '龜山'
    },
    // ID 到顏色的映射表
    areaColorMap: {
      LOCALHOST: 'primary',
      HA: 'primary', // 桃園
      HB: 'success', // 中壢
      HC: 'danger', // 大溪
      HD: 'warning', // 楊梅
      HE: 'info', // 蘆竹
      HF: 'dark', // 八德
      HG: 'secondary', // 平鎮
      HH: 'light' // 龜山
    },
    reloadMs: 15 * 60 * 1000,
    reloadTimer: null,
    publicationHistoryReloadMs: 1 * 60 * 1000,
    publicationHistoryReloadTimer: null
  }),
  fetch () {
    this.today = this.$utils.today('TW')
    this.checkXCaseSyncStatus()
  },
  computed: {
    formattedInfo () {
      // 1. 處理本所節點 (Local Node)
      const localNode = {
        id: 'LOCALHOST',
        isLocal: true, // 標記為本所
        details: {
          // 將 foundIds 指向 publicationHistory 陣列，這樣 length 屬性就會正確反映數量
          foundIds: this.publicationHistory,
          // 用於第二行顯示文字
          localMax: `待處理 ${this.publicationHistory.length} 筆`
        }
      }

      if (this.$utils.empty(this.infoRaw)) {
        // 如果沒有遠端資料，至少回傳本所
        return [localNode]
      }

      // 2. 將物件轉換為容易處理的陣列結構 (遠端所別)
      const dataArray = Object.entries(this.infoRaw).map(([key, value]) => {
        return {
          id: key,
          details: value,
          isLocal: false
        }
      })

      // 3. 進行雙重條件排序
      dataArray.sort((a, b) => {
        const countA = a.details.foundIds.length
        const countB = b.details.foundIds.length
        if (countB !== countA) {
          return countB - countA
        }
        return a.id.localeCompare(b.id)
      })

      // 4. 將本所資料插在最前面
      return [localNode, ...dataArray]
    },
    border () {
      if (this.light !== 'success') {
        return this.light
      }
      return ''
    },
    light () {
      if (this.caseIds?.length > 1 || this.publicationHistoryLight === 'danger') {
        return 'danger'
      }
      if (this.caseIds?.length === 1 || this.publicationHistoryLight === 'warning') {
        return 'warning'
      }
      return 'success'
    },
    publicationHistoryLight () {
      if (this.publicationHistory.length < 3) {
        return 'success'
      }
      if (this.publicationHistory.length < 5) {
        return 'warning'
      }
      return 'danger'
    },
    attentionCss () {
      if (this.enableAttention) {
        if (this.light === 'danger') {
          return 'scale-danger'
        }
        if (this.light === 'warning') {
          return 'scale-warning'
        }
      }
      return ''
    }
  },
  watch: {
    caseIds (n, o) {},
    formattedInfo (val) {},
    publicationHistory (val) {},
    light (nlight, olight) {
      this.emitLightUpdate(nlight, olight)
    }
  },
  created () {},
  mounted () {
    this.emitLightUpdate(this.light, '')
    if (!this.footer) {
      this.reloadTimer = setInterval(() => {
        this.checkXCaseSyncStatus()
      }, this.reloadMs)
    }
    this.publicationHistoryReloadTimer = setInterval(() => {
      this.loadPublicationHistory()
    }, this.publicationHistoryReloadMs)
  },
  beforeDestroy () {
    this.emitLightUpdate('', this.light)
    clearInterval(this.reloadTimer)
    clearInterval(this.publicationHistoryReloadTimer)
  },
  methods: {
    emitLightUpdate (n, o) {
      this.$emit('light-update', {
        name: 'LahMonitorBoardXcaseSync',
        new: n,
        old: o
      })
    },
    /**
     * 處理卡片點擊事件
     * @param {object} code
     */
    handleCardClick (code) {
      // 如果是本所，顯示 publicationHistory Modal
      if (code.isLocal) {
        this.$refs.history.show()
      }
    },
    checkXCaseSyncStatus () {
      if (!this.isBusy) {
        this.isBusy = true
        this.caseIds = []
        this.$axios
          .post(this.$consts.API.JSON.XCASE, {
            type: 'find_xcase_writeback_failures'
          }).then(({ data }) => {
            const status = data?.found?.length === 0 ? '🟢' : '⚠'
            this.message = `${status} ${data.message}`
            this.caseIds = [...data.found]
            this.infoRaw = data.raw
            this.$emit('reload', { caseIds: this.caseIds })
          }).catch((err) => {
            this.error = err
          }).finally(() => {
            this.isBusy = false
            this.updated = this.$utils.now('TW').replace(this.today, '')
          })
      }
    },
    fix (id) {
      this.confirm('確定要將同步異動資料新增於本所資料庫(CRSMS)？').then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.XCASE, {
            type: 'inst_xcase',
            id
          }).then((res) => {
            if (this.$utils.statusCheck(res.data.status)) {
              this.success('新增成功', { title: '新增遠端案件資料', subtitle: id })
              const index = this.caseIds.indexOf(id)
              if (index > -1) {
                this.caseIds.splice(index, 1)
              }
              if (this.infoRaw) {
                Object.values(this.infoRaw).forEach((officeData) => {
                  if (officeData && Array.isArray(officeData.foundIds)) {
                    const foundIdx = officeData.foundIds.indexOf(id)
                    if (foundIdx > -1) {
                      officeData.foundIds.splice(foundIdx, 1)
                    }
                  }
                })
              }
              this.sendFixedNotificationToInf(id)
            } else {
              this.warning(res.data.message, { title: '新增遠端案件資料', subtitle: id })
            }
          }).catch((err) => {
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    sendFixedNotificationToInf (id) {
      this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
        type: 'add_notification',
        title: '跨所案件未回寫已修正通知',
        content: `✔ 案件 ${id} 已由所端修正跨所未回寫問題。`,
        from_ip: this.ip,
        priority: 3,
        channels: ['inf'],
        sender: this.myid || this.ip || 'system',
        create_datetime: this.$utils.now()
      }).then((res) => {
        if (!this.$utils.statusCheck(res.data.status)) {
          this.warning(res.data.message, { title: '通知資訊課已修正跨所案件失敗', subtitle: id })
        }
      }).catch((err) => {
        this.$utils.error(err)
      })
    },
    loadPublicationHistory () {
      const d = new Date()
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      this.$axios.post(this.$consts.API.JSON.MOIADM, {
        type: 'moiadm_publication_history',
        date: `${year}/${month}/${day}`,
        status: 'rdy'
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.publicationHistory = [...data.raw]
        } else {
          this.warning(data.message)
        }
      }).catch((e) => {
        this.$utils.error(e)
      })
    },
    getTooltipConfig (code) {
      // 本所特殊 Tooltip
      if (code.isLocal) {
        return {
          title: `本所待處理：${this.publicationHistory.length} 筆`,
          variant: this.publicationHistoryLight // success/warning/danger 對應 bootstrap tooltip
        }
      }
      const site = code.id ? code.id.substring(0, 2) : ''
      const variant = this.areaColorMap[site] || 'secondary'
      const title = `收件字：${code.id} 所端最新：${code.details.localMax}`
      return {
        title,
        variant
      }
    },
    getAreaName (id) {
      if (id === 'LOCALHOST') { return '本所' }
      const prefix = id ? id.substring(0, 2) : ''
      return this.areaNameMap[prefix] || id
    },
    getAreaNameFromCaseId (caseId) {
      if (typeof caseId !== 'string' || caseId.length < 6) { return '' }
      const prefix = caseId.substring(4, 6)
      return this.areaNameMap[prefix] || ''
    },
    getAreaVariant (caseId) {
      if (typeof caseId !== 'string' || caseId.length < 6) { return 'secondary' }
      const prefix = caseId.substring(4, 6)
      return this.areaColorMap[prefix] || 'secondary'
    },
    /**
     * 根據 foundIds 決定燈號顏色
     * 修改：針對 本所 (isLocal) 使用 publicationHistoryLight 判斷
     */
    getStatusClass (code) {
      if (code.isLocal) {
        // publicationHistoryLight 回傳: 'success', 'warning', 'danger'
        // 需要對應到 CSS: 'dot-green', 'dot-yellow', 'dot-red'
        switch (this.publicationHistoryLight) {
          case 'danger': return 'dot-red'
          case 'warning': return 'dot-yellow'
          default: return 'dot-green'
        }
      }
      // 其他所別的原本邏輯
      if (code && code.details && code.details.foundIds.length > 1) {
        return 'dot-red'
      } else if (code && code.details && code.details.foundIds.length === 1) {
        return 'dot-yellow'
      }
      return 'dot-green'
    },
    /**
     * 根據 foundIds 決定卡片邊框顏色
     * 修改：針對 本所 (isLocal) 使用 publicationHistoryLight 判斷
     */
    getCardBorderClass (code) {
      if (code.isLocal) {
        if (this.publicationHistoryLight === 'danger') { return 'border-danger' }
        if (this.publicationHistoryLight === 'warning') { return 'border-warning' }
        return ''
      }
      // 其他所別的原本邏輯
      const count = code?.details?.foundIds?.length || 0
      if (count > 1) {
        return 'border-danger'
      }
      if (count === 1) {
        return 'border-warning'
      }
      return ''
    }
  }
}
</script>

<style lang="scss" scoped>
.offices {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: 100%;
  align-content: flex-start;
  .office {
    width: 23.5%;
    height: 50%;
    border: 1px solid gray;
    border-radius: 15px;
    margin: 0 calc(1.5%) calc(1.5%) 0;
    /* 修改：新增的邊框樣式 */
    &.border-warning {
      border: 2px solid #ffc107; /* Bootstrap warning yellow */
    }
    &.border-danger {
      border: 2px solid #dc3545; /* Bootstrap danger red */
    }
  }
  .office:hover {
    transform: translateY(-2px); /* 滑鼠懸停時輕微上浮 */
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
}
/* 燈號共用樣式 */
.status-dot {
  width: 20px; /* 舊 */
  height: 20px; /* 舊 */
  border-radius: 50%; /* 圓形 */
  flex-shrink: 0; /* 防止燈號在 flex 佈局中被壓縮 */
  border: 1px solid rgba(0,0,0,0.1);
  /* 修改：新增用於置中數字 */
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
  user-select: none;
}

/* 綠燈 */
.dot-green {
  background-color: #28a745; /* Bootstrap success green */
}

/* 黃燈 */
.dot-yellow {
  background-color: #ffc107; /* Bootstrap warning yellow */
}

/* 紅燈 */
.dot-red {
  background-color: #dc3545; /* Bootstrap danger red */
}

/* 新增：文字區塊 (讓文字在區塊內靠左) */
.text-area {
  text-align: left;
}

/* 地區名稱字型 */
.area-name {
  // font-size: 1.1rem;
  font-weight: 500;
  color: #333;
  line-height: 1.3; /* 調整行高 */
}

/* 新增：最大號樣式 */
.local-max {
  font-size: 0.85rem; /* 縮小字體 */
  color: #6c757d;   /* 輔助文字顏色 (Bootstrap secondary) */
  line-height: 1.2;
}

/* 新增：加大 badge 樣式 */
.badge-lg {
  font-size: 0.9rem;  /* 稍大字體 */
  padding: 0.4em 0.6em; /* 增加內距 */
}

/* 新增：可點擊的滑鼠樣式 */
.cursor-pointer {
  cursor: pointer;
}
</style>
