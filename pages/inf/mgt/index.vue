<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100.my-auto
        .d-flex.align-items-center
          div 地政系統管理儀表板
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        .tool-search.ml-3
          b-input-group(size="lg")
            b-input-group-prepend
              b-input-group-text
                lah-fa-icon(icon="magnifying-glass")
            b-form-input(
              ref="searchInput"
              v-model="keyword"
              type="search"
              autocomplete="off"
              placeholder="搜尋功能（簡訊、作廢、匯出…）"
              aria-label="搜尋功能"
              role="combobox"
              aria-controls="tool-search-list"
              :aria-expanded="String(showSuggest)"
              @focus="searchFocus = true"
              @blur="onSearchBlur"
              @keydown.down.prevent="moveSel(1)"
              @keydown.up.prevent="moveSel(-1)"
              @keydown.enter.prevent="pickSel"
              @keydown.esc="keyword = ''"
            )
          ul#tool-search-list.tool-suggest.list-unstyled.mb-0(v-if="showSuggest" role="listbox")
            li(
              v-for="(t, i) in suggestions"
              :key="t.id"
              role="option"
              :aria-selected="String(i === sel)"
              :class="{ active: i === sel }"
              @mousedown.prevent="openTool(t.id)"
            )
              .font-weight-bold
                lah-fa-icon.mr-1(:icon="t.icon")
                | {{ t.name }}
              .small.text-muted {{ t.desc }}
            li.text-muted.small.px-2.py-1(v-if="!suggestions.length") 找不到符合的功能
    lah-help-modal(:modal-id="'help-modal'" size="lg")
      .font-weight-bold.text-primary.h5.mb-2
        lah-fa-icon(icon="circle-info", size="lg") 地政系統管理儀表板功能導覽
      p.text-muted 本管理儀表板彙編資訊管理師常用之地政核心維護工具，涵蓋登記案件追蹤、規費調整作廢、人員資料檢索、簡訊通知及資料庫匯出檢測等功能，協助快速排查與修正系統異常資料。
      hr.my-2

      .font-weight-bold.text-dark.mb-1
        lah-fa-icon(icon="star", variant="warning") 重點核心區 (最常用功能)
      ul.mb-2
        li
          strong 搜尋登記案件：
          | 依收件字號快速查詢案件之辦理情形、結案狀態與手機號碼，並可直接開啟案件狀態管理、修正暫存檔或檢視詳情。
        li
          strong 搜尋規費單據：
          | 依「電腦給號」或「憑證序號」檢索單據，支援單據狀態修正（已印/未印、作廢）、付款方式更換及收費項目調整。
        li
          strong 同步登記案件：
          | 針對跨所收辦或資料不一致之登記案件，執行資料庫雙向即時比對、檢測與資料同步。

      .font-weight-bold.text-dark.mb-1
        lah-fa-icon(icon="users", variant="secondary") 使用者相關查詢
      ul.mb-2
        li
          strong 發送簡訊：
          | 支援案件手機號碼之簡訊即時發送、重發作業與傳送歷程檢索，維護為民服務通知暢通。
        li
          strong 使用者查詢：
          | 以使用者代碼、姓名或關鍵字快速檢索同仁帳號、姓名、課室職稱、分機與個人卡片照片。
        li
          strong 查詢人民申請案件：
          | 依統一編號進行地籍總歸戶查詢，檢索申請人於轄區所有登記及測量案件之辦理歷程。

      .font-weight-bold.text-dark.mb-1
        lah-fa-icon(icon="file-invoice-dollar", variant="secondary") 進階規費作業
      ul.mb-2
        li
          strong 規費日期查詢：
          | 依指定結帳日期統計全日單據總數與實收總額，支援現金、悠遊卡、行動支付、信用卡等付款類別統計、單據檢索過濾、點選承辦人員檢視個人卡片及視覺化統計圖表。
        li
          strong 無電腦給號規費收據作廢：
          | 針對卡紙或跳號等異常單據，依自動編號規則（#[b.text-danger 9] + #[b.text-primary 年度] + #[b.text-success 流水號]）快速新增假資料以利執行系統作廢。

      .font-weight-bold.text-dark.mb-1
        lah-fa-icon(icon="screwdriver-wrench", variant="secondary") 系統工具
      ul.mb-2
        li
          strong 看門狗監控與修正：
          | 即時監控地政系統運行健康狀態，提供 CMC01 證號異常、排程作業及逾期未結等常見錯誤之一鍵快速檢測與修復。
        li
          strong 轄區段別資料查詢：
          | 即時統計土地標示部（RALID）各段小段之土地筆數、總面積與所屬行政區，並提供收費標準及申請書表下載。
        li
          strong 資料匯出：
          | 支援自訂轄區段代碼（具轄區代碼防呆保護與快速選取彈窗），批次產製土地標示部、所有權部等標準純文字匯出檔案。

      hr.my-2
      .d-flex.justify-content-between.align-items-center
        .d-flex.align-items-center.text-muted.small
          lah-fa-icon.mr-1(icon="lightbulb", variant="warning")
          span 如需使用舊版功能或歷史工具，可開啟舊版系統：
        b-button(
          :href="`${legacyUrl}/index.html`",
          target="_blank",
          rel="noreferrer noopener",
          variant="outline-primary",
          size="sm"
        )
          lah-fa-icon.mr-1(icon="clock-rotate-left")
          | 開啟舊版網站

  //- 功能快捷列：點擊後以浮動視窗開啟該功能
  .quick-nav.mb-3(role="navigation" aria-label="功能快捷列")
    .quick-group(v-for="g in toolGroups" :key="g.key" :class="'qg-' + g.key")
      .quick-group-title
        lah-fa-icon.mr-1(:icon="g.icon")
        | {{ g.title }}
      .quick-tiles
        button.quick-tile(
          v-for="t in g.tools"
          :key="t.id"
          type="button"
          :title="t.desc"
          @click="openTool(t.id)"
        )
          lah-fa-icon.quick-tile-icon(:icon="t.icon" size="lg")
          span.quick-tile-name {{ t.name }}
  .tool-backdrop(v-if="activeId" @click="closeTool")

  //- 重點核心區
  .dashboard-primary.mb-3
    .primary-card(v-for="t in primaryTools" :key="t.id" :id="t.id" :style="holderStyle(t.id)")
      .tool-body(
        :ref="'body-' + t.id"
        :class="{ 'is-floating': activeId === t.id }"
        :role="activeId === t.id ? 'dialog' : null"
        :aria-modal="activeId === t.id ? 'true' : null"
        :aria-label="t.name"
        @keydown.tab="trapTab"
      )
        .tool-float-bar(v-if="activeId === t.id")
          strong {{ t.name }}
          b-button(size="sm" variant="outline-secondary" aria-label="關閉" title="關閉 (Esc)" @click="closeTool") ✕ 關閉
        .tool-desc.small.text-muted.mb-1 {{ t.desc }}
        component(:is="t.comp")

  //- 工具區：響應式
  .tool-grid
    section.tool-section(v-for="g in toolGroups" :key="g.key")
      .section-title
        lah-fa-icon.mr-1(:icon="g.icon" variant="secondary")
        | {{ g.title }}
      .tool-item(v-for="t in g.tools" :key="t.id" :id="t.id" :class="{ 'is-open': isOpen(t.id), 'is-compact': t.compact }" :style="holderStyle(t.id)")
        .tool-body(
          :ref="'body-' + t.id"
          :class="{ 'is-floating': activeId === t.id }"
          :role="activeId === t.id ? 'dialog' : null"
          :aria-modal="activeId === t.id ? 'true' : null"
          :aria-label="t.name"
          @keydown.tab="trapTab"
        )
          .tool-float-bar(v-if="activeId === t.id")
            strong {{ t.name }}
            b-button(size="sm" variant="outline-secondary" aria-label="關閉" title="關閉 (Esc)" @click="closeTool") ✕ 關閉
          .tool-head
            .tool-desc.small.text-muted {{ t.desc }}
            b-button.tool-toggle(
              v-if="t.compact && activeId !== t.id"
              size="sm"
              variant="link"
              :aria-expanded="String(isOpen(t.id))"
              @click="toggle(t.id)"
            ) {{ isOpen(t.id) ? '收合 ▴' : '展開 ▾' }}
          component(:is="t.comp" :class="{ 'compact-board': t.compact }")
</template>
<script>
const PRIMARY = [
  { id: 'tool-search-reg-case', name: '搜尋登記案件', icon: 'magnifying-glass', comp: 'lah-mgmt-board-search-reg-case', desc: '依收件字號查案件辦理情形、結案狀態，並可修正狀態與暫存檔。', kw: '案件 收件字號 結案 暫存' },
  { id: 'tool-search-fee-form', name: '搜尋規費單據', icon: 'file-invoice-dollar', comp: 'lah-mgmt-board-search-fee-form', desc: '依電腦給號或憑證序號查單據，修正狀態、付款方式與收費項目。', kw: '規費 單據 電腦給號 憑證 作廢' },
  { id: 'tool-sync-reg-case', name: '同步登記案件', icon: 'rotate', comp: 'lah-mgmt-board-sync-reg-case', desc: '跨所收辦或資料不一致時，比對並同步案件資料。', kw: '同步 跨所 比對' }
]
const GROUPS = [
  {
    key: 'user',
    title: '查人與通知',
    icon: 'users',
    tools: [
      { id: 'tool-sms', name: '發送簡訊', icon: 'comment-sms', comp: 'lah-mgmt-board-sms', compact: true, desc: '案件手機簡訊發送、重發與歷程檢索。', kw: '簡訊 手機 通知' },
      { id: 'tool-user-query', name: '使用者查詢', icon: 'user', comp: 'lah-mgmt-board-user-query', desc: '以代碼、姓名查同仁帳號、課室、分機與照片。', kw: '使用者 同仁 姓名 分機' },
      { id: 'tool-pid-query', name: '人民申請案件', icon: 'id-card', comp: 'lah-mgmt-board-pid-query', desc: '依統一編號查申請人所有登記與測量案件。', kw: '統編 統一編號 人民 申請人' }
    ]
  },
  {
    key: 'fee',
    title: '規費進階作業',
    icon: 'file-invoice-dollar',
    tools: [
      { id: 'tool-search-fee-date', name: '規費日期查詢', icon: 'calendar-days', comp: 'lah-mgmt-board-search-fee-date', desc: '依結帳日統計單據數與實收總額、付款類別與圖表。', kw: '規費 日期 結帳 統計' },
      { id: 'tool-fee-obsolete', name: '無給號收據作廢', icon: 'ban', comp: 'lah-mgmt-board-fee-form-obsolete', desc: '卡紙或跳號單據，依編號規則新增假資料後作廢。', kw: '作廢 卡紙 跳號 無給號' }
    ]
  },
  {
    key: 'sys',
    title: '系統工具',
    icon: 'screwdriver-wrench',
    tools: [
      { id: 'tool-sect-query', name: '轄區段別查詢', icon: 'map', comp: 'lah-mgmt-board-sect-query', desc: '各段小段土地筆數、面積與行政區，含收費標準下載。', kw: '段別 小段 土地 面積' },
      { id: 'tool-tax-export', name: '稅務資料匯出', icon: 'file-export', comp: 'lah-mgmt-board-tax-export', desc: '稅務相關資料匯出。', kw: '稅務 匯出' },
      { id: 'tool-export-data', name: '資料匯出', icon: 'download', comp: 'lah-mgmt-board-export-data', desc: '自訂段代碼，批次匯出土地標示部、所有權部純文字檔。', kw: '匯出 標示部 所有權部 段代碼' },
      { id: 'tool-watchdog', name: '看門狗監控', icon: 'dog', comp: 'lah-mgmt-board-watchdog', compact: true, desc: '檢測並修復 CMC01 證號異常、排程與逾期未結問題。', kw: '看門狗 監控 CMC01 修復 逾期' }
    ]
  }
]
const STORE_KEY = 'inf-mgt-open-tools'
const ALL_TOOLS = [...PRIMARY, ...GROUPS.flatMap(g => g.tools)]

export default {
  middleware: ['isInf'],
  data: () => ({
    keyword: '',
    searchFocus: false,
    sel: 0,
    primaryTools: PRIMARY,
    toolGroups: GROUPS,
    openIds: [],
    activeId: '',
    holderHeight: 0,
    pushed: false,
    lastTrigger: null
  }),
  head: {
    title: '地政系統管理面板-桃園市地政局'
  },
  fetchOnServer: false,
  computed: {
    crsmsData () { return this.$store.getters['inf/crsmsData'] },
    expaaData () { return this.$store.getters['inf/expaaData'] },
    crsmsDataReady () {
      return Boolean(this.crsmsData?.ID)
    },
    paymentDataReady () {
      return Boolean(this.expaaData?.AA05)
    },
    allGroups () {
      return [{ key: 'core', title: '常用', primary: true, tools: PRIMARY }, ...GROUPS]
    },
    suggestions () {
      const k = this.keyword.trim().toLowerCase()
      if (!k) { return [] }
      return ALL_TOOLS.filter(t => `${t.name} ${t.desc} ${t.kw}`.toLowerCase().includes(k))
    },
    showSuggest () { return this.searchFocus && Boolean(this.keyword.trim()) }
  },
  watch: {
    keyword () { this.sel = 0 },
    '$route.query.tool' (id) {
      if (id && ALL_TOOLS.some(t => t.id === id)) {
        this.show(id)
      } else {
        this.hide()
      }
    },
    activeId (id) {
      document.body.style.overflow = id ? 'hidden' : ''
    }
  },
  mounted () {
    try { this.openIds = JSON.parse(localStorage.getItem(STORE_KEY) || '[]') } catch (e) { this.openIds = [] }
    const id = this.$route.query.tool
    if (id && ALL_TOOLS.some(t => t.id === id)) { this.$nextTick(() => this.show(id)) }
    window.addEventListener('keydown', this.onKey)
  },
  beforeDestroy () {
    window.removeEventListener('keydown', this.onKey)
    document.body.style.overflow = ''
  },
  methods: {
    isOpen (id) { return this.openIds.includes(id) },
    toggle (id) {
      this.openIds = this.isOpen(id) ? this.openIds.filter(i => i !== id) : [...this.openIds, id]
      try { localStorage.setItem(STORE_KEY, JSON.stringify(this.openIds)) } catch (e) { /* 忽略儲存失敗 */ }
    },
    holderStyle (id) {
      return this.activeId === id && this.holderHeight ? { minHeight: `${this.holderHeight}px` } : null
    },
    bodyEl (id) {
      const r = this.$refs[`body-${id}`]
      return Array.isArray(r) ? r[0] : r
    },
    openTool (id) {
      this.keyword = ''
      this.searchFocus = false
      this.lastTrigger = document.activeElement
      if (this.$route.query.tool === id) { return }
      this.pushed = true
      this.$router.push({ query: { ...this.$route.query, tool: id } })
    },
    closeTool () {
      if (this.pushed) {
        this.pushed = false
        this.$router.back()
      } else {
        const q = { ...this.$route.query }
        delete q.tool
        this.$router.replace({ query: q })
      }
    },
    show (id) {
      const el = this.bodyEl(id)
      this.holderHeight = el ? el.offsetHeight : 0
      this.activeId = id
      this.$nextTick(() => {
        const bar = this.bodyEl(id)?.querySelector('.tool-float-bar button')
        if (bar) { bar.focus() }
      })
    },
    hide () {
      if (!this.activeId) { return }
      this.activeId = ''
      this.holderHeight = 0
      const t = this.lastTrigger
      this.lastTrigger = null
      this.$nextTick(() => { if (t && t.focus && document.body.contains(t)) { t.focus() } })
    },
    onKey (e) {
      if (e.key !== 'Escape' || !this.activeId) { return }
      // 內部子視窗開啟時，Esc 交給子視窗處理
      if (document.querySelector('.modal.show')) { return }
      this.closeTool()
    },
    trapTab (e) {
      if (!this.activeId) { return }
      const root = this.bodyEl(this.activeId)
      if (!root) { return }
      const f = [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(n => n.offsetParent !== null)
      if (!f.length) { return }
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    },
    moveSel (d) {
      const n = this.suggestions.length
      if (n) { this.sel = (this.sel + d + n) % n }
    },
    pickSel () {
      const t = this.suggestions[this.sel]
      if (t) { this.openTool(t.id) }
    },
    onSearchBlur () {
      setTimeout(() => { this.searchFocus = false }, 120)
    }
  }
}
</script>

<style lang="scss" scoped>
.tool-search {
  ::v-deep .form-control,
  ::v-deep .input-group-text {
    height: 3rem;
    font-size: 1rem;
  }
  position: relative;
  width: 20rem;
  max-width: 40vw;
  font-size: 1rem;
  font-weight: normal;
}
.tool-suggest {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  z-index: 1060;
  max-height: 60vh;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  li { padding: 0.35rem 0.6rem; cursor: pointer; }
  li.active, li:hover { background: #e7f1ff; }
}

.quick-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1rem;

  .quick-group {
    --qg: #6c757d;
    min-width: 0;
    padding: 0.5rem 0.75rem 0.25rem;
    border: 1px solid #dee2e6;
    border-top: 3px solid var(--qg);
    border-radius: 0.5rem;
    background: #fff;
  }
  .qg-user { --qg: #6c757d; }
  .qg-fee { --qg: #28a745; }
  .qg-sys { --qg: #e8590c; }

  .quick-group-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #343a40;
    margin-bottom: 0.4rem;
  }
  .quick-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .quick-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    min-height: 64px;
    padding: 0.4rem 0.25rem;
    font-size: 0.85rem;
    line-height: 1.2;
    text-align: center;
    color: #212529;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.4rem;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s, transform 0.15s;

    .quick-tile-icon { color: var(--qg); }
    &:hover { background: #fff; border-color: var(--qg); transform: translateY(-1px); }
    &:focus-visible { outline: 3px solid rgba(0, 123, 255, 0.5); outline-offset: 2px; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .quick-tile { transition: none !important; transform: none !important; }
}
.dashboard-primary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
  .primary-card { min-width: 0; }
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1rem;
  align-items: start;
}
.tool-section { min-width: 0; }
.tool-item { margin-bottom: 1rem; }

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #495057;
  padding-bottom: 0.4rem;
  margin-bottom: 0.75rem;
  border-bottom: 2px solid #dee2e6;
}
.tool-head { display: flex; justify-content: space-between; align-items: center; min-height: 1.5rem; }
.tool-toggle { padding: 0 0.25rem; min-height: 24px; }

// 浮動視窗：同一個元件實例，以 fixed 置中顯示（不產生第二份）
.tool-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1035;
  background: rgba(0, 0, 0, 0.5);
}
.tool-body.is-floating {
  position: fixed;
  top: 5vh;
  left: 50%;
  transform: translateX(-50%);
  width: min(960px, 96vw);
  max-height: 90vh;
  overflow-y: auto;
  z-index: 1040;
  background: #fff;
  border-radius: 0.5rem;
  padding: 0 1rem 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
}
@media (max-width: 575.98px) {
  .tool-body.is-floating { top: 0; width: 100vw; max-height: 100vh; border-radius: 0; }
}
.tool-float-bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 -1rem 0.5rem;
  padding: 0.6rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

// 收合式卡片
.compact-board {
  position: relative;
  max-height: 180px;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
}
.tool-item.is-open .compact-board,
.compact-board.board-expanded,
.is-floating .compact-board {
  max-height: 800px;
  overflow-y: auto;
}
.is-floating .compact-board { max-height: none; }

@media (prefers-reduced-motion: reduce) {
  .compact-board { transition: none; }
}
</style>
