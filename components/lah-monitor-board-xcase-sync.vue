<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    .font-weight-bold {{ header }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        v-if="light === 'danger'"
        icon="link-slash",
        variant="outline-danger",
        no-border,
        no-icon-gutter,
        @click="$refs.found.show()",
        title="顯示問題案件"
      )
      lah-button(
        v-if="!footer"
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="checkXCaseSyncStatus",
        :title="`上次更新時間 ${updated}`"
      )
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
        li 顯示今日({{ today }})跨所案件回寫狀態監控資訊
        li 儀表板每{{ reloadMs / 1000 / 60 }}分鐘重新檢查一次
      hr
      div 🟢 表示一切正常
      div 🟡 表示連線伺服器異常
      div 🔴 表示有案件回寫異常的狀況
  slot
  lah-transition
    .center(v-if="isBusy"): lah-fa-icon(
      icon="spinner",
      action="spin"
    ) 讀取中...
    .h-100(v-else)
      .offices
        .office.center(
          v-for="(code, idx) in formattedInfo" :key="`${code.id}_card`"
          :class="getCardBorderClass(code)"
          v-b-tooltip="`收件字：${code.id} 所端最新：${code.details.localMax}`"
        )
          .status-dot.mr-2(
            :class="getStatusClass(code)"
          )
            //- 修改：僅在 count > 0 時顯示數量
            span(v-if="code.details.foundIds.length > 0") {{ code.details.foundIds.length }}
          //- 文字區塊 (垂直堆疊)
          .text-area.d-flex.flex-column
            //- 地區名稱
            span.area-name {{ getAreaName(code.id) }}

  b-modal(
    ref="found",
    hide-footer,
    centered,
    scrollable
  )
    template(#modal-title) 跨所未回寫案件列表 ({{ caseIds.length }})
    b-list-group(flush)
      b-list-group-item(v-for="(caseId, idx) in caseIds" :key="caseId")
        .d-flex.justify-content-between
          div {{ caseId }}
          lah-button(
            icon="bug-slash"
            variant="danger"
            @click="fix(caseId)"
          ) 修正

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
    message: '讀取中',
    reloadMs: 15 * 60 * 1000,
    // ID 到名稱的映射表
    areaNameMap: {
      HA: '桃園', // 假設 '桃園' 的 ID 開頭為 HA
      HB: '中壢',
      HC: '大溪',
      HD: '楊梅',
      HE: '蘆竹',
      HF: '八德',
      HG: '平鎮',
      HH: '龜山'
    }
  }),
  fetch () {
    this.today = this.$utils.today('TW')
    this.checkXCaseSyncStatus()
  },
  computed: {
    formattedInfo () {
      if (this.$utils.empty(this.infoRaw)) {
        return []
      }
      // 1. 將物件轉換為容易處理的陣列結構
      const dataArray = Object.entries(this.infoRaw).map(([key, value]) => {
        return {
          id: key,
          details: value
        }
      })
      // 2. 進行雙重條件排序
      dataArray.sort((a, b) => {
        const countA = a.details.foundIds.length
        const countB = b.details.foundIds.length
        // 主要排序條件：比較 foundIds 數量 (降序: B - A)
        if (countB !== countA) {
          return countB - countA // 如果數量不同，直接根據數量排序
        }
        // 次要排序條件：如果數量相同，則依 id 字母順序排序 (升序: A.localeCompare(B))
        return a.id.localeCompare(b.id)
      })
      return dataArray
    },
    border () {
      if (this.light !== 'success') {
        return this.light
      }
      return ''
    },
    light () {
      if (this.caseIds?.length !== 0) {
        return 'danger'
      }
      return 'success'
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
    caseIds (val) {
      // console.warn(val)
    },
    formattedInfo (val) {
      // console.table(val)
    },
    light (nlight, olight) {
      this.emitLightUpdate(nlight, olight)
    }
  },
  created () {},
  mounted () {
    this.emitLightUpdate(this.light, '')
  },
  beforeDestroy () {
    this.emitLightUpdate('', this.light)
  },
  methods: {
    emitLightUpdate (n, o) {
      this.$emit('light-update', {
        name: 'LahMonitorBoardXcaseSync',
        new: n,
        old: o
      })
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
            // if (this.$utils.empty(this.caseIds)) {
            //   // prepare mock data
            //   this.caseIds = ['114-HBA1-080010', '114-HGA1-012090']
            // }
            this.$emit('reload', { caseIds: this.caseIds })
          }).catch((err) => {
            this.error = err
          }).finally(() => {
            this.isBusy = false
            this.updated = this.$utils.now('TW').replace(this.today, '')
          })
      }
    },
    /**
     * 根據 id 修正問題案件
     * @param {string} id - 案件 ID (例如 '114-HDA1-014530')
     */
    fix (id) {
      this.confirm('確定要將同步異動資料新增於本所資料庫(CRSMS)？').then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.XCASE, {
            type: 'inst_xcase',
            id
          }).then((res) => {
            if (this.$utils.statusCheck(res.data.status)) {
              this.success('新增成功', {
                title: '新增遠端案件資料',
                subtitle: id
              })
              // 修改：從 caseIds 陣列中移除已修正的 id
              const index = this.caseIds.indexOf(id)
              if (index > -1) {
                this.caseIds.splice(index, 1)
              }
            } else {
              this.warning(res.data.message, {
                title: '新增遠端案件資料',
                subtitle: id
              })
            }
          }).catch((err) => {
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    /**
     * 根據 ID 前兩碼獲取地區名稱
     * @param {string} id - 項目 ID (例如 'HB-01')
     */
    getAreaName (id) {
      // 取得 ID 的前兩個字元 (例如 'HB')
      const prefix = id ? id.substring(0, 2) : ''
      // 從 areaNameMap 中尋找對應名稱，如果找不到就顯示原 id
      return this.areaNameMap[prefix] || id
    },
    /**
     * 根據 foundIds 決定燈號顏色
     * @param {object} code - 完整的項目物件
     */
    getStatusClass (code) {
      // 檢查 code.details.foundIds 是否存在且長度大於 0
      if (code && code.details && code.details.foundIds.length > 0) {
        return 'dot-red' // 紅燈
      }
      return 'dot-green' // 綠燈
    },
    /**
     * 新增：根據 foundIds 決定卡片邊框顏色
     * @param {object} code - 完整的項目物件
     */
    getCardBorderClass (code) {
      const count = code?.details?.foundIds?.length || 0
      if (count > 1) {
        return 'border-danger' // 數量 > 1
      }
      if (count === 1) {
        return 'border-warning' // 數量 == 1
      }
      return '' // 數量 == 0，使用預設
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

</style>
