<template lang="pug">
b-card.h-100.flex-column.shadow-sm.timeline-main-card(
  :no-body="noBody",
  :class="['d-flex', { 'border-0': noBody }]"
)
  //- 頂部導航與過濾列
  template(
    v-if="!hideHeader",
    #header
  )
    .d-flex.flex-wrap.justify-content-between.align-items-center.header-toolbar
      .d-flex.align-items-center.my-1.mr-2.header-title-box
        lah-fa-icon.text-nowrap.font-weight-bold.text-primary.mr-2(icon="link-slash")
          span.h6.font-weight-bold.mb-0 {{ header }}
        b-badge.mr-2(variant="danger", pill, v-if="past24hCount > 0", title="過去 24 小時內發生的斷線次數")
          | 24h 內 {{ past24hCount }} 筆
        b-badge(variant="secondary", pill)
          | 共 {{ itemsCount }} 筆

      .d-flex.align-items-center.flex-nowrap.text-nowrap.ml-auto.my-1.header-actions
        //- 一鍵展開/收合全部
        b-button.mr-1(
          size="sm",
          variant="outline-secondary",
          :title="isAllExpanded ? '全部收合' : '全部展開'",
          @click="toggleExpandAll"
        )
          lah-fa-icon(:icon="isAllExpanded ? 'compress-arrows-alt' : 'expand-arrows-alt'")
          span.ml-1 {{ isAllExpanded ? '收合' : '展開' }}

        b-select.mr-1(
          v-model="filter",
          :options="filterOpts",
          size="sm",
          style="width: 88px;",
          title="篩選歷史時間範圍"
        )

        b-button-group(size="sm")
          lah-button(
            v-if="hideFooter",
            icon="sync-alt",
            action="ld-cycle",
            variant="outline-secondary",
            size="sm",
            no-icon-gutter,
            @click="load",
            :title="`上次更新時間 ${updated}`",
            :disabled="isBusy"
          )
          lah-button(
            icon="question",
            action="breath",
            variant="outline-success",
            size="sm",
            no-icon-gutter,
            @click="$refs.help.show()",
            title="說明"
          )

    //- NOC 智慧統計摘要列 (KPI Strip)
    .timeline-kpi-strip.mt-2.pt-2.border-top.d-flex.flex-wrap.justify-content-between.align-items-center(v-if="itemsCount > 0")
      .d-flex.align-items-center.flex-wrap
        .kpi-chip.mr-2.mb-1(title="統計期間內發生斷線的總次數")
          span.text-muted.small 總事件：
          strong.text-danger.ml-1 {{ itemsCount }}
          span.small.text-muted.ml-1 次
        .kpi-chip.mr-2.mb-1(title="去重後受影響的地政事務所總所數")
          span.text-muted.small 波及地所：
          strong.text-primary.ml-1 {{ uniqueOfficesCount }}
          span.small.text-muted.ml-1 所
        .kpi-chip.mr-2.mb-1(v-if="topOffice", title="點擊快速搜尋此地所", @click="keyword = topOffice.name")
          span.text-muted.small 斷線最多：
          strong.text-warning-dark.pointer.ml-1 {{ topOffice.name }} ({{ topOffice.count }}次)
        .kpi-chip.mr-2.mb-1(v-if="mainErrorCode")
          span.text-muted.small 主因：
          b-badge.ml-1(variant="danger", pill) {{ mainErrorCode }}

    //- 搜尋與快速標籤列 (Search & Tag Filters)
    .timeline-filter-bar.mt-2.d-flex.flex-wrap.align-items-center(v-if="itemsCount > 0")
      b-input-group.mr-2.mb-1(size="sm", style="max-width: 210px;")
        template(#prepend)
          b-input-group-text
            lah-fa-icon(icon="search", variant="secondary")
        b-form-input(
          v-model.trim="keyword",
          placeholder="搜尋代碼、所名、錯誤...",
          debounce="200"
        )
        template(#append, v-if="keyword")
          b-button(size="sm", variant="outline-secondary", @click="keyword = ''")
            lah-fa-icon(icon="times")

      //- 快捷標籤過濾
      .quick-tags.d-flex.flex-wrap.align-items-center.mb-1
        b-button.mr-1(
          size="sm",
          :variant="activeTag === '' ? 'primary' : 'outline-secondary'",
          class="px-2 py-0",
          @click="activeTag = ''"
        ) 全部 ({{ itemsCount }})
        b-button.mr-1(
          v-if="taoyuanCount > 0",
          size="sm",
          :variant="activeTag === 'taoyuan' ? 'info' : 'outline-info'",
          class="px-2 py-0",
          @click="activeTag = activeTag === 'taoyuan' ? '' : 'taoyuan'"
        ) ⚡ 桃園 ({{ taoyuanCount }})
        b-button.mr-1(
          v-if="past24hCount > 0",
          size="sm",
          :variant="activeTag === '24h' ? 'danger' : 'outline-danger'",
          class="px-2 py-0",
          @click="activeTag = activeTag === '24h' ? '' : '24h'"
        ) 24h 內 ({{ past24hCount }})
        b-button.mr-1(
          v-if="http502Count > 0",
          size="sm",
          :variant="activeTag === '502' ? 'dark' : 'outline-dark'",
          class="px-2 py-0",
          @click="activeTag = activeTag === '502' ? '' : '502'"
        ) 502 ({{ http502Count }})

    //- 說明 Modal
    lah-help-modal(ref="help", :modal-title="`${header} 顯示說明`")
      ul
        li 本區塊顯示各縣市地政事務所主機回應異常之歷史紀錄。
        li 預設顯示最新 10 筆，可透過下拉選單篩選特定時間範圍（如：最近 1 天、1 週等）。
        li.mt-2 時間軸燈號顏色意義：
          ul
            li.text-danger 🔴 2 小時內發生之異常（具備即時發光警示）
            li.text-warning 🟡 2 ~ 24 小時內發生之異常
            li.text-secondary ⚪ 24 小時以前之歷史異常
        li.mt-2 點擊個別卡片可展開查看詳細 HTTP 回應訊息、端點與診斷紀錄，並支援一鍵複製與外連檢測。

  //- 列表內容主捲動容器
  .flex-grow-1.overflow-auto.timeline-scroll-container(style="min-height: 0")
    //- 載入中骨架/旋轉提示
    .center.py-5(v-if="isBusy")
      lah-fa-icon(icon="spinner", action="spin", size="2x", variant="primary")
      .mt-2.text-muted.small 正在載入伺服器離線紀錄...

    //- 無資料提示 (綠燈全正常)
    .center.py-5(v-else-if="itemsCount === 0")
      .shield-icon-wrapper.mb-2
        lah-fa-icon(icon="shield-halved", variant="success", size="3x", action="squeeze")
      .h5.font-weight-bold.text-success.mb-1 全國伺服器狀態良好
      .text-muted.small 目前查無伺服器離線紀錄，連線全數正常。

    //- 搜尋後無相符結果
    .center.py-4(v-else-if="filteredList.length === 0")
      lah-fa-icon(icon="filter-circle-xmark", variant="secondary", size="2x")
      .mt-2.text-muted 無符合篩選條件的斷線紀錄
      b-button.mt-2(size="sm", variant="outline-primary", @click="resetFilters") 清除篩選條件

    //- 時間軸卡片清單
    .timeline-container.p-2(v-else)
      transition-group(name="timeline-list", tag="div")
        .timeline-item(
          v-for="(item, index) in filteredList",
          :key="`${item.timestamp}-${item.id}-${index}`",
          :class="[getSeverityClass(item)]"
        )
          //- 時間軸左側連線與節點
          .timeline-node-track
            .timeline-dot(:class="[circleBGColor(item), { 'pulse-ring': isRecent2h(item) }]")
            .timeline-line(v-if="index !== filteredList.length - 1")

          //- 時間軸右側互動式卡片主體
          .timeline-card.p-2.rounded.shadow-sm.mb-3(
            :class="{ 'card-expanded': isExpanded(index) }",
            @click="toggleCard(index)"
          )
            //- 卡片主要摘要行
            .d-flex.justify-content-between.align-items-center.w-100
              .d-flex.align-items-center.flex-wrap.min-w-0.mr-2
                //- 地所代碼標籤
                b-badge.mr-1.font-weight-bold(
                  :variant="item.id.startsWith('H') ? 'info' : 'secondary'",
                  pill
                ) {{ item.id }}
                //- 地所名稱
                span.office-title.font-weight-bold.text-dark.mr-2 {{ item.name }}
                //- 桃園市特有標籤
                b-badge.mr-2(variant="info", pill, v-if="item.id.startsWith('H')") ⚡ 桃園
                //- 錯誤代碼膠囊
                b-badge(:variant="getErrorBadgeVariant(item)", pill)
                  | {{ parseErrorCode(item.response) }}

              //- 右側時間與展開箭頭
              .d-flex.align-items-center.flex-shrink-0.ml-auto
                lah-badge-human-datetime.mr-2(:seconds="item.timestamp")
                lah-fa-icon.expand-chevron.text-muted(
                  icon="chevron-down",
                  :class="{ 'rotate-180': isExpanded(index) }"
                )

            //- 卡片次要預覽行 (收合時顯示單行預覽)
            .text-muted.small.mt-1.text-truncate(v-if="!isExpanded(index)")
              | {{ cleanTags(item.response) }}

            //- 展開後：高質感 NOC 診斷面板 (Dark Diagnostic Drawer)
            b-collapse(:visible="isExpanded(index)")
              .diagnostic-drawer.mt-2.p-2.rounded.border
                .d-flex.justify-content-between.align-items-center.flex-wrap.mb-1
                  span.small.font-weight-bold.text-muted.my-1.mr-2 🖥️ 端點診斷明細
                  .d-flex.align-items-center.flex-nowrap.my-1.ml-auto
                    b-button.mr-1.px-2.py-0.text-nowrap(
                      size="sm",
                      variant="outline-secondary",
                      title="複製診斷資訊",
                      @click.stop="copyDiagnostic(item, $event)"
                    )
                      lah-fa-icon.mr-1(icon="copy")
                      span 複製
                    b-button.px-2.py-0.text-nowrap(
                      size="sm",
                      variant="outline-primary",
                      title="直接開啟 AP 端點測試",
                      @click.stop="openApLink(item.id)"
                    )
                      lah-fa-icon.mr-1(icon="external-link-alt")
                      span 測試端點

                .diagnostic-info-grid.small
                  .info-row.mb-1
                    span.info-label 🌐 端點 URL：
                    code.info-value http://{{ apHost }}/Land{{ item.id }}/
                  .info-row.mb-1
                    span.info-label 🕒 離線時間：
                    span.info-value.font-weight-bold {{ formatExactTime(item.timestamp) }}
                  .info-row.mb-1
                    span.info-label 📡 網站回應：
                    pre.response-code-box.p-2.rounded.mb-0 {{ item.response }}

  template(#footer, v-if="!hideFooter"): client-only: lah-monitor-board-footer(
    ref="footer"
    :reload-ms="reloadMs",
    :busy="isBusy",
    :reload="load",
    :update-time="updated"
  )
</template>

<script>
export default {
  name: 'LahOfficeDownTimeline',
  components: {},
  props: {
    dateFormat: { type: String, default: 'yyyy-MM-dd HH:mm:ss' },
    variant: { type: String, default: 'primary' },
    count: { type: String, default: '100' },
    noBody: { type: Boolean, default: false },
    hideHeader: { type: Boolean, default: false },
    hideFooter: { type: Boolean, default: false },
    maxHeight: { type: [Boolean, String], default: false }
  },
  data: () => ({
    header: '伺服器斷線紀錄',
    officesData: [],
    updated: '',
    reloadMs: 5 * 60 * 1000,
    timer: null,
    filter: 'latest',
    filterOpts: [
      { text: '最新10筆', value: 'latest' },
      { text: '最近1天', value: 'day' },
      { text: '最近1週', value: 'week' },
      { text: '最近1月', value: 'month' },
      { text: '-- 以下需耐心等候 --', value: '', disabled: true },
      { text: '最近1季', value: 'quater' },
      { text: '最近半年', value: 'half-year' },
      { text: '最近1年', value: 'year' }
    ],
    // 智慧過濾與擴展狀態
    keyword: '',
    activeTag: '', // '' | 'taoyuan' | '24h' | '502'
    expandedSet: new Set([0]), // 預設展開第 1 筆
    isAllExpanded: false
  }),
  fetch () {
    this.load()
  },
  computed: {
    bootstrapVariant () {
      return this.variant || 'primary'
    },
    itemsCount () {
      return this.officesData.length
    },
    apHost () {
      return this.systemConfigs?.webapIp || this.webapIp || '220.1.34.161'
    },
    // 統計指標
    uniqueOfficesCount () {
      const ids = new Set(this.officesData.map(o => o.id))
      return ids.size
    },
    past24hCount () {
      const now = (this.$utils?.nowTs?.() || Date.now()) / 1000
      return this.officesData.filter(o => (now - o.timestamp) < 86400).length
    },
    taoyuanCount () {
      return this.officesData.filter(o => o.id?.startsWith('H')).length
    },
    http502Count () {
      return this.officesData.filter(o => /502/i.test(o.response)).length
    },
    topOffice () {
      if (this.officesData.length === 0) { return null }
      const counts = {}
      this.officesData.forEach((o) => {
        const key = `${o.id} ${this.shorten(o.name)}`
        counts[key] = (counts[key] || 0) + 1
      })
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
      if (sorted.length > 0 && sorted[0][1] > 1) {
        return { name: sorted[0][0], count: sorted[0][1] }
      }
      return null
    },
    mainErrorCode () {
      if (this.officesData.length === 0) { return '' }
      if (this.http502Count >= this.officesData.length / 2) { return 'HTTP 502' }
      const codes = {}
      this.officesData.forEach((o) => {
        const c = this.parseErrorCode(o.response)
        codes[c] = (codes[c] || 0) + 1
      })
      const sorted = Object.entries(codes).sort((a, b) => b[1] - a[1])
      return sorted[0] ? sorted[0][0] : ''
    },
    // 過濾後的清單
    filteredList () {
      let list = this.officesData
      if (this.activeTag === 'taoyuan') {
        list = list.filter(o => o.id?.startsWith('H'))
      } else if (this.activeTag === '24h') {
        const now = (this.$utils?.nowTs?.() || Date.now()) / 1000
        list = list.filter(o => (now - o.timestamp) < 86400)
      } else if (this.activeTag === '502') {
        list = list.filter(o => /502/i.test(o.response))
      }
      if (this.keyword) {
        const kw = this.keyword.toLowerCase()
        list = list.filter(o =>
          o.id?.toLowerCase().includes(kw) ||
          o.name?.toLowerCase().includes(kw) ||
          o.response?.toLowerCase().includes(kw)
        )
      }
      return list
    }
  },
  watch: {
    filter () {
      this.load()
    },
    officesData () {
      // 載入新資料時預設展開第 1 筆
      this.expandedSet = new Set([0])
      this.isAllExpanded = false
    }
  },
  created () {},
  mounted () {
    this.timeout(() => {
      if (this.officesData.length === 0) {
        this.load()
      }
    }, 1000)
  },
  beforeDestroy () {
    clearTimeout(this.timer)
  },
  methods: {
    // 保留向下相容方法
    load () {
      clearTimeout(this.timer)
      this.isBusy = true
      this.officesData = []
      this.$axios.post(this.$consts.API.JSON.STATS, {
        type: 'stats_xap_stats_down',
        opt: this.filter
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.officesData = [...data.raw]
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        this.timeout(this.load, this.reloadMs).then((handle) => { this.timer = handle })
        this.updated = this.$utils.formatTime(new Date())
      })
    },
    shorten (name) {
      return name?.replace(/(地政事務)/g, '') || ''
    },
    formatText (item) {
      return `
        網站回應：${item.response}<br/>
        離線時間：${this.$utils.phpTsToAdDateStr(item.timestamp, true)}
      `
    },
    cleanTags (message) {
      return this.cleanText(message).replace(/(<([^>]+)>)/gi, '')
    },
    cleanText (text) {
      if (text) {
        const highlighted = this.$utils?.highlightPipeline(text)
        const domsafe = this.$utils?.convertMarkd(highlighted)
        if (/!\[.+\]\(data:image\/.+\)/gm.test(domsafe) && domsafe.repaceAll) {
          return this.$utils.convertInlineMarkd(domsafe?.repaceAll('\n', ''))
        }
        return domsafe
      }
      return ''
    },
    circleBGColor (item) {
      const now = (this.$utils?.nowTs?.() || Date.now()) / 1000
      const offset = now - item.timestamp
      if (offset < 7200) { return 'bg-danger' }
      if (offset < 86400) { return 'bg-warning' }
      return 'bg-secondary'
    },
    // 新增進階診斷輔助方法
    isRecent2h (item) {
      const now = (this.$utils?.nowTs?.() || Date.now()) / 1000
      return (now - item.timestamp) < 7200
    },
    getSeverityClass (item) {
      const now = (this.$utils?.nowTs?.() || Date.now()) / 1000
      const offset = now - item.timestamp
      if (offset < 7200) { return 'severity-critical' }
      if (offset < 86400) { return 'severity-warning' }
      return 'severity-normal'
    },
    parseErrorCode (res) {
      if (!res) { return '未知狀態' }
      if (/502/i.test(res)) { return '502 Bad Gateway' }
      if (/504/i.test(res)) { return '504 Timeout' }
      if (/500/i.test(res)) { return '500 Error' }
      if (/timeout/i.test(res)) { return '連線逾時' }
      const match = res.match(/HTTP\/[\d.]+\s+(\d+)/i)
      if (match) { return `HTTP ${match[1]}` }
      return res.length > 25 ? res.substring(0, 25) + '...' : res
    },
    getErrorBadgeVariant (item) {
      const res = item.response || ''
      if (/502|500/i.test(res)) { return 'danger' }
      if (/504|timeout/i.test(res)) { return 'warning' }
      return 'secondary'
    },
    formatExactTime (ts) {
      return this.$utils?.phpTsToAdDateStr ? this.$utils.phpTsToAdDateStr(ts, true) : new Date(ts * 1000).toLocaleString()
    },
    isExpanded (index) {
      return this.expandedSet.has(index)
    },
    toggleCard (index) {
      const next = new Set(this.expandedSet)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      this.expandedSet = next
      this.isAllExpanded = this.expandedSet.size === this.filteredList.length
    },
    toggleExpandAll () {
      if (this.isAllExpanded) {
        this.expandedSet = new Set()
        this.isAllExpanded = false
      } else {
        this.expandedSet = new Set(this.filteredList.map((_, i) => i))
        this.isAllExpanded = true
      }
    },
    resetFilters () {
      this.keyword = ''
      this.activeTag = ''
    },
    copyDiagnostic (item, evt) {
      const text = [
        `【地政跨域主機伺服器離線紀錄】`,
        `地所代碼：${item.id}`,
        `地所名稱：${item.name}`,
        `網站回應：${item.response}`,
        `離線時間：${this.formatExactTime(item.timestamp)}`,
        `端點位址：http://${this.apHost}/Land${item.id}/`
      ].join('\n')
      if (this.$utils?.copyToClipboard) {
        this.$utils.copyToClipboard(text, `已複製 ${item.id} ${item.name} 診斷資訊`, evt?.currentTarget)
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
        this.notify?.(`已複製 ${item.id} 診斷資訊`, { type: 'success' })
      }
    },
    openApLink (id) {
      window.open(`http://${this.apHost}/Land${id}/`, '_blank')
    }
  }
}
</script>

<style lang="scss" scoped>
.timeline-main-card {
  border-radius: 8px;
  background-color: #ffffff;
}

.header-toolbar {
  row-gap: 0.35rem;
}

.header-title-box {
  min-width: 0;
}

.header-actions {
  flex-shrink: 0;
  white-space: nowrap;
}

.kpi-chip {
  background: #f8fafc;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  display: inline-flex;
  align-items: center;
  font-size: 0.8rem;
}

.text-warning-dark {
  color: #b45309 !important;
}

.pointer {
  cursor: pointer;
}

.timeline-container {
  position: relative;
  padding-left: 1.25rem !important;
}

.timeline-item {
  position: relative;
  display: flex;
  margin-bottom: 0.5rem;

  &.severity-critical {
    .timeline-card {
      border-left: 3px solid #dc3545 !important;
      background: #fffafa;
    }
  }
  &.severity-warning {
    .timeline-card {
      border-left: 3px solid #f59e0b !important;
      background: #fffdf5;
    }
  }
  &.severity-normal {
    .timeline-card {
      border-left: 3px solid #64748b !important;
      background: #ffffff;
    }
  }
}

.timeline-node-track {
  position: absolute;
  left: -1.25rem;
  top: 0;
  bottom: 0;
  width: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 10px;
  z-index: 2;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.timeline-line {
  width: 2px;
  flex-grow: 1;
  background: #e2e8f0;
  margin-top: 2px;
  z-index: 1;
}

.pulse-ring {
  box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(220, 53, 69, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
  }
}

.timeline-card {
  flex: 1 1 auto;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
  }

  &.card-expanded {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  }
}

.expand-chevron {
  transition: transform 0.2s ease;
  font-size: 0.85rem;
  &.rotate-180 {
    transform: rotate(180deg);
  }
}

.diagnostic-drawer {
  background-color: #f8fafc;
  border-color: #e2e8f0;
}

.response-code-box {
  background-color: #0f172a;
  color: #f87171;
  font-family: monospace;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow-y: auto;
}

.info-label {
  color: #64748b;
  min-width: 85px;
  display: inline-block;
}

// 深色模式支援
.dark-mode {
  .timeline-main-card {
    background-color: #1a1a1a !important;
    border-color: #333333 !important;
  }
  .kpi-chip {
    background: #262626 !important;
    border-color: #404040 !important;
  }
  .timeline-card {
    background-color: #222222 !important;
    border-color: #383838 !important;
    color: #e2e8f0 !important;
    .office-title {
      color: #f1f5f9 !important;
    }
  }
  .diagnostic-drawer {
    background-color: #181818 !important;
    border-color: #333333 !important;
  }
  .timeline-line {
    background: #383838 !important;
  }
}
</style>
