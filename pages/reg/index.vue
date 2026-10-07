<template lang="pug">
.reg-dashboard.min-vh-100.d-flex.flex-column
  lah-header
    .d-flex.align-items-center.justify-content-between.w-100.my-auto.header-brand-bar
      //- 左側紅框：Logo + 系統名稱與副標 (移至 Header 左側)
      .d-flex.align-items-center
        .header-logo-box.mr-3.flex-shrink-0
          .ambient-glow
          lah-logo.header-logo
        .header-info
          .d-flex.align-items-center.flex-wrap
            h2.header-title.font-weight-bold.text-dark.m-0.mr-2
              span.text-primary 桃園市地政
              span.text-dark.ml-1 智慧控管系統
            b-badge.py-1.px-2.d-none.d-sm-inline-flex.align-items-center.header-badge-text(pill variant="light" class="border text-success font-weight-bold")
              lah-fa-icon(icon="shield-halved" size="xs").mr-1
              span 登記智慧控管
          p.header-subtitle.text-muted.m-0
            | Smart Land Administration Control Center · 掌握時效 · 守護產權 · 精準便民

      //- 右側紅框：搜尋列 (移至 Header 右側)
      .header-search-wrapper.ml-3.d-none.d-md-block
        b-input-group.header-search-input-group.shadow-none.border
          b-input-group-prepend(is-text)
            lah-fa-icon(icon="search" variant="muted")
          b-form-input(
            ref="searchInput"
            v-model="searchKeyword"
            placeholder="搜尋功能、關鍵字（按 / 鍵直達）..."
            autocomplete="off"
            size="sm"
            @keydown.esc="searchKeyword = ''"
          )
          b-input-group-append(v-if="searchKeyword")
            b-button(variant="white" size="sm" @click="searchKeyword = ''" title="清除搜尋")
              lah-fa-icon(icon="times" size="xs" variant="muted")
          b-input-group-append
            b-button(variant="primary" size="sm" class="px-3 header-search-count-btn font-weight-bold" disabled)
              span 共 {{ filteredItems.length }} 項

  .flex-grow-1.py-3.px-3.px-md-4
    b-container.reg-hub-container(fluid="xl")

      //- 行動端搜尋列 (螢幕寬度較窄時在頂部展現)
      .d-block.d-md-none.mb-3
        b-input-group.header-search-input-group.shadow-sm.border.bg-white
          b-input-group-prepend(is-text)
            lah-fa-icon(icon="search" variant="muted")
          b-form-input(
            v-model="searchKeyword"
            placeholder="搜尋功能、業務關鍵字..."
            autocomplete="off"
            size="sm"
          )
          b-input-group-append(v-if="searchKeyword")
            b-button(variant="white" size="sm" @click="searchKeyword = ''")
              lah-fa-icon(icon="times" size="xs" variant="muted")
          b-input-group-append
            b-button(variant="primary" size="sm" class="px-2" disabled)
              span {{ filteredItems.length }} 項

      //- 1. 分類標籤過濾列與操作提示 (精巧單列橫幅)
      section.filter-banner.bg-white.rounded-xl.shadow-sm.p-3.mb-3.anim-appear-1s
        .d-flex.flex-wrap.align-items-center.justify-content-between
          .d-flex.flex-wrap.align-items-center
            b-button(
              v-for="cat in categories"
              :key="cat.id"
              :variant="currentCategory === cat.id ? cat.btnVariant : 'outline-secondary'"
              pill
              size="sm"
              class="mr-2 my-1 filter-pill"
              @click="selectCategory(cat.id)"
            )
              lah-fa-icon(:icon="cat.icon" size="sm").mr-1
              span {{ cat.name }}
              b-badge.ml-1.pill-count(
                pill
                :variant="currentCategory === cat.id ? 'light' : 'secondary'"
                :class="{ 'text-dark': currentCategory === cat.id }"
              ) {{ getCategoryCount(cat.id) }}

          .quick-stats-hint.text-muted.d-none.d-md-inline-flex.align-items-center.my-1
            lah-fa-icon(icon="lightbulb" variant="warning" size="sm").mr-1
            span 提示：卡片右上角 ⭐ 可釘選至常用快捷

      //- 2. ⭐ 常用功能釘選區 (若有收藏且未在搜尋狀態)
      section.favorites-section.mb-3.anim-appear-1s(v-if="favoriteItems.length > 0 && !searchKeyword")
        .d-flex.align-items-center.justify-content-between.mb-2.px-2
          .d-flex.align-items-center
            lah-fa-icon(icon="star" variant="warning" size="lg").mr-2
            h5.m-0.font-weight-bold.text-dark.section-title 我的常用快捷
            b-badge.ml-2.section-badge(variant="warning" pill) {{ favoriteItems.length }}
            span.text-muted.ml-2.d-none.d-sm-inline.section-subtitle 點擊星號可隨時自訂
          b-button(
            variant="link"
            size="sm"
            class="text-muted p-0 clear-fav-btn"
            @click="clearAllFavorites"
          ) 清空釘選

        b-row
          b-col(
            v-for="item in favoriteItems"
            :key="'fav-' + item.id"
            cols="12"
            sm="6"
            lg="4"
            xl="3"
            class="mb-3"
          )
            b-card.feature-card.h-100.border-0.shadow-sm.position-relative(no-body)
              .card-top-stripe(:class="'stripe-' + item.category")
              b-card-body.d-flex.flex-column.p-3
                .d-flex.align-items-center.justify-content-between.mb-2
                  .icon-box(:class="'icon-box-' + item.category")
                    lah-fa-icon(
                      :icon="item.icon[1]"
                      :regular="item.icon[0] === 'far'"
                      size="lg"
                      :class="'icon-' + item.category"
                    )
                  .d-flex.align-items-center
                    b-badge.mr-2.card-badge(
                      pill
                      :variant="item.badgeVariant"
                      class="px-2 py-1 font-weight-normal"
                    )
                      lah-fa-icon.mr-1(v-if="item.isExternal" icon="external-link-alt" size="xs")
                      span {{ item.badge }}
                    b-button.star-btn(
                      variant="link"
                      size="sm"
                      :class="{ 'is-favorite': isFavorite(item.id) }"
                      :title="isFavorite(item.id) ? '已釘選，點擊取消快捷' : '點擊加到常用快捷'"
                      @click.stop.prevent="toggleFavorite(item.id)"
                    )
                      lah-fa-icon(
                        icon="star"
                        :regular="!isFavorite(item.id)"
                        :variant="isFavorite(item.id) ? 'warning' : 'muted'"
                        no-gutter
                      )
                .card-title-text.font-weight-bold.text-dark.mb-1
                  span {{ item.title }}
                .card-desc-text.text-muted.flex-grow-1.mb-3
                  | {{ item.desc }}
                .card-footer-action.d-flex.align-items-center.justify-content-between.pt-2.border-top
                  span.action-text.font-weight-bold(:class="'text-' + getCategoryColor(item.category)")
                    | {{ item.isExternal ? '開啟外部系統' : '進入功能' }}
                  lah-fa-icon.action-arrow(icon="arrow-right" size="xs" :class="'text-' + getCategoryColor(item.category)")
              //- 點擊卡片跳轉
              a.stretched-link(
                v-if="item.isExternal"
                :href="getItemHref(item)"
                target="_blank"
                rel="noopener noreferrer"
              )
              nuxt-link.stretched-link(
                v-else
                :to="item.to"
              )

      //- 3. 業務功能卡片展示區 (儀表板主要區域)
      section.main-cards-section.anim-appear-1s
        .d-flex.align-items-center.justify-content-between.mb-2.px-2(v-if="favoriteItems.length > 0 && !searchKeyword")
          .d-flex.align-items-center
            lah-fa-icon(icon="layer-group" variant="primary" size="lg").mr-2
            h5.m-0.font-weight-bold.text-dark.section-title {{ getCurrentCategoryTitle }} ({{ filteredItems.length }})

        b-row
          //- 查無結果空狀態
          b-col(cols="12" v-if="filteredItems.length === 0")
            .empty-state.text-center.py-5.bg-white.rounded-lg.shadow-sm
              lah-fa-icon(icon="search-minus" size="3x" variant="muted").mb-3
              h5.text-muted 查無符合「{{ searchKeyword }}」的功能
              p.text-muted 試試簡化關鍵字或切換至其他分類標籤
              b-button(variant="outline-primary" size="sm" @click="resetSearch")
                lah-fa-icon(icon="redo-alt" size="sm").mr-1
                | 重置搜尋條件

          //- 功能卡片清單
          b-col(
            v-for="item in filteredItems"
            :key="item.id"
            cols="12"
            sm="6"
            lg="4"
            xl="3"
            class="mb-3"
          )
            b-card.feature-card.h-100.border-0.shadow-sm.position-relative(no-body)
              .card-top-stripe(:class="'stripe-' + item.category")
              b-card-body.d-flex.flex-column.p-3
                .d-flex.align-items-center.justify-content-between.mb-2
                  .icon-box(:class="'icon-box-' + item.category")
                    lah-fa-icon(
                      :icon="item.icon[1]"
                      :regular="item.icon[0] === 'far'"
                      size="lg"
                      :class="'icon-' + item.category"
                    )
                  .d-flex.align-items-center
                    b-badge.mr-2.card-badge(
                      pill
                      :variant="item.badgeVariant"
                      class="px-2 py-1 font-weight-normal"
                    )
                      lah-fa-icon.mr-1(v-if="item.isExternal" icon="external-link-alt" size="xs")
                      span {{ item.badge }}
                    b-button.star-btn(
                      variant="link"
                      size="sm"
                      :class="{ 'is-favorite': isFavorite(item.id) }"
                      :title="isFavorite(item.id) ? '已釘選，點擊取消快捷' : '點擊加到常用快捷'"
                      @click.stop.prevent="toggleFavorite(item.id)"
                    )
                      lah-fa-icon(
                        icon="star"
                        :regular="!isFavorite(item.id)"
                        :variant="isFavorite(item.id) ? 'warning' : 'muted'"
                        no-gutter
                      )
                .card-title-text.font-weight-bold.text-dark.mb-1
                  span {{ item.title }}
                .card-desc-text.text-muted.flex-grow-1.mb-3
                  | {{ item.desc }}
                .card-footer-action.d-flex.align-items-center.justify-content-between.pt-2.border-top
                  span.action-text.font-weight-bold(:class="'text-' + getCategoryColor(item.category)")
                    | {{ item.isExternal ? '開啟外部系統' : '進入功能' }}
                  lah-fa-icon.action-arrow(icon="arrow-right" size="xs" :class="'text-' + getCategoryColor(item.category)")
              //- 點擊卡片跳轉
              a.stretched-link(
                v-if="item.isExternal"
                :href="getItemHref(item)"
                target="_blank"
                rel="noopener noreferrer"
              )
              nuxt-link.stretched-link(
                v-else
                :to="item.to"
              )
</template>

<script>
export default {
  data: () => ({
    searchKeyword: '',
    currentCategory: 'all',
    favorites: [],
    categories: [
      { id: 'all', name: '全部項目', icon: ['fas', 'th-large'], btnVariant: 'dark' },
      { id: 'timeline', name: '時效流程控管', icon: ['fas', 'clock'], btnVariant: 'primary' },
      { id: 'foreigner', name: '涉外特定管制', icon: ['fas', 'passport'], btnVariant: 'purple' },
      { id: 'registry', name: '異動標的檢核', icon: ['fas', 'file-contract'], btnVariant: 'info' },
      { id: 'service', name: '統計便民服務', icon: ['fas', 'hand-holding-heart'], btnVariant: 'success' }
    ],
    items: [
      // 1. 即將逾期案件
      {
        id: 'expire',
        title: '即將逾期案件',
        to: '/reg/expire',
        icon: ['far', 'calendar-check'],
        category: 'timeline',
        badge: '時效預警',
        badgeVariant: 'primary',
        desc: '掌握即將屆期案件，倒數警示防逾期',
        keywords: '即將逾期 逾期 時效 期限 倒數 警示'
      },
      // 2. 請示(取消)案件
      {
        id: 'ask-for-instructions',
        title: '請示(取消)案件',
        to: '/reg/ask-for-instructions',
        icon: ['fas', 'user-tie'],
        category: 'timeline',
        badge: '審查核定',
        badgeVariant: 'warning',
        desc: '陳判與請示准駁進度追蹤，確保審查效率',
        keywords: '請示 取消 陳判 准駁 審查'
      },
      // 3. 補正期滿案件
      {
        id: 'reg-fix-case',
        title: '補正期滿案件',
        to: '/reg/reg-fix-case',
        icon: ['fas', 'pager'],
        category: 'timeline',
        badge: '期限管理',
        badgeVariant: 'primary',
        desc: '通知補正逾期未補正案件管制與查處',
        keywords: '補正 期滿 駁回 限期 補正期滿'
      },
      // 4. 公告案件控管
      {
        id: 'expiry-of-announcement',
        title: '公告案件控管',
        to: '/reg/expiry-of-announcement',
        icon: ['far', 'sticky-note'],
        category: 'timeline',
        badge: '公告追蹤',
        badgeVariant: 'info',
        desc: '法定公告期間列管，即時追蹤公告期滿',
        keywords: '公告 案件 控管 期滿 異議'
      },
      // 5. 領件控管
      {
        id: 'reg-untaken-case',
        title: '領件控管',
        to: '/reg/reg-untaken-case',
        icon: ['fas', 'stamp'],
        category: 'timeline',
        badge: '結案領件',
        badgeVariant: 'primary',
        desc: '辦畢權狀書狀逾期未領控管與通知',
        keywords: '領件 待領 權狀 書狀 未領'
      },
      // 6. 辦畢通知控管
      {
        id: 'reg-not-done-case',
        title: '辦畢通知控管',
        to: '/reg/reg-not-done-case',
        icon: ['fas', 'bullhorn'],
        category: 'timeline',
        badge: '通知作業',
        badgeVariant: 'primary',
        desc: '登記辦畢送達、郵寄與電子通知進度控管',
        keywords: '辦畢 通知 送達 郵寄 結案通知'
      },
      // 7. 外人繼承管制清冊
      {
        id: 'foreigner-inheritance',
        title: '外人繼承管制清冊',
        to: '/reg/foreigner-inheritance-restriction',
        icon: ['fas', 'earth-asia'],
        category: 'foreigner',
        badge: '地權限制',
        badgeVariant: 'purple',
        desc: '外籍人士繼承不動產列管與移轉時限追蹤',
        keywords: '外人 外國人 繼承 管制 清冊 土地法17條'
      },
      // 8. 非專業代理人案件
      {
        id: 'non-scrivener-case',
        title: '非專業代理人案件',
        to: '/reg/non-scrivener-case',
        icon: ['fas', 'user-tag'],
        category: 'foreigner',
        badge: '代理管制',
        badgeVariant: 'purple',
        desc: '非地政士申辦案件件數控管與異常監測',
        keywords: '非專業 代理人 地政士 代書 異常代理'
      },
      // 9. 外國人地權案件
      {
        id: 'foreigner-case',
        title: '外國人地權案件',
        to: '/reg/foreigner-case',
        icon: ['fas', 'user-astronaut'],
        category: 'foreigner',
        badge: '涉外審查',
        badgeVariant: 'purple',
        desc: '外國人取得、移轉、設定土地權利案件管理',
        keywords: '外國人 地權 涉外 國籍 平等互惠'
      },
      // 10. 外國人掃描資料
      {
        id: 'foreigner-scan',
        title: '外國人掃描資料',
        to: '/reg/foreigner',
        icon: ['far', 'file-pdf'],
        category: 'foreigner',
        badge: '數位檔案',
        badgeVariant: 'secondary',
        desc: '涉外登記申辦書件及國籍證明掃描影像調閱',
        keywords: '外國人 掃描 資料 影像 證明 pdf'
      },
      // 11. 私法人購置住宅
      {
        id: 'private-corporate',
        title: '私法人購置住宅',
        href: 'http://220.1.33.80/PcQ.aspx',
        target: '_blank',
        isExternal: true,
        icon: ['fas', 'house-circle-check'],
        category: 'foreigner',
        badge: '內政部',
        badgeVariant: 'dark',
        desc: '內政部私法人買受住宅許可與免經許可查詢',
        keywords: '私法人 購置住宅 平均地權 許可 外部'
      },
      // 12. 信託相關案件
      {
        id: 'trust',
        title: '信託相關案件',
        to: '/reg/trust',
        icon: ['fas', 'money-check-alt'],
        category: 'registry',
        badge: '信託管理',
        badgeVariant: 'info',
        desc: '信託登記、塗銷信託與受託人變更案件檢索',
        keywords: '信託 受託人 委託人 塗銷信託 財產'
      },
      // 13. 未辦標的註記異動
      {
        id: 'not-done-change',
        title: '未辦標的註記異動',
        to: '/reg/not-done-change',
        icon: ['fas', 'monument'],
        category: 'registry',
        badge: '產權註記',
        badgeVariant: 'info',
        desc: '標示部未辦繼承、查封等註記歷史異動追蹤',
        keywords: '未辦 標的 註記 異動 未辦繼承 限制登記'
      },
      // 14. 土地參考資訊檔異動
      {
        id: 'land-ref-change',
        title: '土地參考資訊檔異動',
        to: '/reg/land-ref-change',
        icon: ['fas', 'landmark'],
        category: 'registry',
        badge: '參考資訊',
        badgeVariant: 'info',
        desc: '土地參考資訊檔異動比對、修正與維護',
        keywords: '土地 參考 資訊 異動 產權參考 標的'
      },
      // 15. 375租約異動
      {
        id: 'agriculture-375',
        title: '375租約異動',
        to: '/reg/agriculture-375-change',
        icon: ['fas', 'border-all'],
        category: 'registry',
        badge: '農地租約',
        badgeVariant: 'info',
        desc: '耕地三七五租約註記、變更及終止控管',
        keywords: '375 三七五 租約 耕地 農地 佃農'
      },
      // 16. 繼承應繼分試算
      {
        id: 'heir-share',
        title: '繼承應繼分試算',
        target: '_blank',
        isExternal: true,
        icon: ['fas', 'chart-pie'],
        category: 'service',
        badge: '試算工具',
        badgeVariant: 'success',
        desc: '法定繼承人應繼分與特留分快速試算系統',
        keywords: '繼承 應繼分 特留分 試算 遺產 民法'
      },
      // 17. 簡訊紀錄查詢
      {
        id: 'sms',
        title: '簡訊紀錄查詢',
        to: '/reg/sms',
        icon: ['fas', 'comment-sms'],
        category: 'service',
        badge: '簡訊推播',
        badgeVariant: 'success',
        desc: '登記案件申辦簡訊發送紀錄與發送狀態檢視',
        keywords: '簡訊 sms 通知 紀錄 發送 查詢'
      },
      // 18. 統計資料案件查詢
      {
        id: 'stats-rega',
        title: '統計資料案件查詢',
        to: '/reg/stats/rega',
        icon: ['fas', 'calculator'],
        category: 'service',
        badge: '案件統計',
        badgeVariant: 'success',
        desc: '登記案件各項業務量細部查詢與資料調閱',
        keywords: '統計 資料 案件 查詢 rega 收件'
      },
      // 19. 月份統計報表看板
      {
        id: 'stats-reg',
        title: '月份統計報表看板',
        to: '/reg/stats/reg',
        icon: ['fas', 'chart-line'],
        category: 'service',
        badge: '報表看板',
        badgeVariant: 'success',
        desc: '月度登記案件統計數據、趨勢圖表與績效分析',
        keywords: '月份 統計 報表 看板 趨勢 績效 reg'
      },
      // 20. 住址隱匿收件管理
      {
        id: 'undisclosed',
        title: '住址隱匿收件管理',
        to: '/reg/undisclosed',
        icon: ['fas', 'house-lock'],
        category: 'service',
        badge: '隱私保護',
        badgeVariant: 'primary',
        desc: '第二類謄本住址隱匿申請收件與審核控管',
        keywords: '住址 隱匿 二類謄本 個資 隱私 保護'
      },
      // 21. 地籍異動即時通收件管理
      {
        id: 'propertyalert',
        title: '地籍異動即時通',
        to: '/reg/propertyalert',
        icon: ['fas', 'bell'],
        category: 'service',
        badge: '防詐守護',
        badgeVariant: 'warning',
        desc: '地籍異動即時通便民服務申請收件與辦理管理',
        keywords: '地籍 異動 即時通 警示 防詐 權狀 守護'
      }
    ]
  }),
  head: {
    title: '桃園市地政智慧控管系統'
  },
  computed: {
    isSur () { return this.myinfo.unit === '測量課' },
    isVal () { return this.myinfo.unit === '地價課' },
    getCurrentCategoryTitle () {
      const found = this.categories.find(c => c.id === this.currentCategory)
      return found ? found.name : '全部功能'
    },
    filteredItems () {
      const kw = this.searchKeyword.trim().toLowerCase()
      return this.items.filter((item) => {
        const matchCategory = this.currentCategory === 'all' || item.category === this.currentCategory
        if (!matchCategory) { return false }
        if (!kw) { return true }
        return (
          item.title.toLowerCase().includes(kw) ||
          item.desc.toLowerCase().includes(kw) ||
          item.badge.toLowerCase().includes(kw) ||
          item.keywords.toLowerCase().includes(kw)
        )
      })
    },
    favoriteItems () {
      return this.items.filter(item => this.favorites.includes(item.id))
    }
  },
  mounted () {
    this.loadFavorites()
    window.addEventListener('keydown', this.handleKeydown)
  },
  beforeDestroy () {
    window.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    selectCategory (catId) {
      this.currentCategory = catId
    },
    getCategoryCount (catId) {
      if (catId === 'all') {
        return this.items.length
      }
      return this.items.filter(i => i.category === catId).length
    },
    getItemHref (item) {
      if (item.id === 'heir-share') {
        return `${this.legacyUrl}/heir_share.html`
      }
      return item.href || '#'
    },
    getCategoryColor (cat) {
      switch (cat) {
        case 'timeline': return 'primary'
        case 'foreigner': return 'purple'
        case 'registry': return 'info'
        case 'service': return 'success'
        default: return 'primary'
      }
    },
    isFavorite (id) {
      return this.favorites.includes(id)
    },
    toggleFavorite (id) {
      const idx = this.favorites.indexOf(id)
      if (idx > -1) {
        this.favorites.splice(idx, 1)
      } else {
        this.favorites.push(id)
      }
      this.saveFavorites()
    },
    loadFavorites () {
      try {
        const saved = localStorage.getItem('lah_reg_fav_tools')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            this.favorites = parsed
          }
        }
      } catch (e) {
        // ignore localStorage error
      }
    },
    saveFavorites () {
      try {
        localStorage.setItem('lah_reg_fav_tools', JSON.stringify(this.favorites))
      } catch (e) {
        // ignore localStorage error
      }
    },
    clearAllFavorites () {
      this.favorites = []
      this.saveFavorites()
    },
    resetSearch () {
      this.searchKeyword = ''
      this.currentCategory = 'all'
    },
    handleKeydown (e) {
      if (e.key === '/' && document.activeElement && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault()
        if (this.$refs.searchInput) {
          this.$refs.searchInput.focus()
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.reg-dashboard {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 100vh;
}

.reg-hub-container {
  max-width: 1440px;
}

// Header brand & search bar
.header-brand-bar {
  min-height: 52px;
}

.header-logo-box {
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;

  .ambient-glow {
    position: absolute;
    width: 72px;
    height: 72px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, rgba(14, 165, 233, 0.3) 45%, rgba(99, 102, 241, 0.15) 70%, transparent 80%);
    border-radius: 50%;
    filter: blur(10px);
    z-index: 0;
    pointer-events: none;
    animation: pulse-glow 4s ease-in-out infinite alternate;
  }

  .header-logo {
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.12));
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      transform: scale(1.08);
    }
  }

  ::v-deep img {
    width: 52px !important;
    height: 52px !important;
    max-height: 52px !important;
    margin-bottom: 0 !important;
  }
}

@keyframes pulse-glow {
  0% { transform: scale(0.92); opacity: 0.7; }
  100% { transform: scale(1.15); opacity: 1; }
}

.header-title {
  font-size: 1.5rem;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.88rem;
  letter-spacing: 0.1px;
}

.header-badge-text {
  font-size: 0.82rem;
}

// Search inside header
.header-search-wrapper {
  max-width: 440px;
  min-width: 260px;
}

.header-search-input-group {
  border-radius: 26px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #ffffff;
  transition: all 0.25s ease;

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
  }

  ::v-deep .input-group-text {
    background: transparent;
    border: none;
    padding-left: 1rem;
    padding-right: 0.5rem;
    font-size: 1.05rem;
  }

  input {
    border: none;
    box-shadow: none !important;
    padding: 0.45rem 0.5rem;
    font-size: 1.02rem;
  }

  .header-search-count-btn {
    border-radius: 0 26px 26px 0;
    font-size: 0.92rem;
    font-weight: 600;
  }
}

// Filter Banner
.filter-banner {
  background-color: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

// Filter pills
.filter-pill {
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 1.05rem;
  padding: 0.35rem 1rem !important;

  &:hover {
    transform: translateY(-1px);
  }

  .pill-count {
    font-size: 0.9rem;
  }
}

.quick-stats-hint {
  font-size: 1rem !important;
}

// Section titles
.section-title {
  font-size: 1.56rem;
}

.section-badge {
  font-size: 0.95rem;
}

.section-subtitle {
  font-size: 1rem;
}

.clear-fav-btn {
  font-size: 0.95rem;
}

// Feature Card
.feature-card {
  position: relative;
  border-radius: 14px;
  background-color: #ffffff;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08) !important;
    border-color: rgba(0, 0, 0, 0.12) !important;

    .action-arrow {
      transform: translateX(3px);
    }
    .icon-box {
      transform: scale(1.06);
    }
  }

  .card-top-stripe {
    height: 3.5px;
    width: 100%;

    &.stripe-timeline {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
    }
    &.stripe-foreigner {
      background: linear-gradient(90deg, #7c3aed, #a78bfa);
    }
    &.stripe-registry {
      background: linear-gradient(90deg, #0284c7, #38bdf8);
    }
    &.stripe-service {
      background: linear-gradient(90deg, #10b981, #34d399);
    }
  }

  .card-badge {
    font-size: 0.94rem;
  }

  .star-btn {
    position: relative;
    z-index: 2;
    padding: 0.25rem 0.45rem;
    font-size: 1.15rem;
    line-height: 1;
    border-radius: 6px;
    color: #94a3b8;
    background-color: rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(245, 158, 11, 0.18);
      color: #f59e0b !important;
      transform: scale(1.15);
    }

    &.is-favorite {
      color: #f59e0b !important;
      background-color: rgba(245, 158, 11, 0.14);
    }
  }

  .icon-box {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s ease;

    &.icon-box-timeline {
      background-color: rgba(59, 130, 246, 0.12);
      .icon-timeline { color: #2563eb; }
    }
    &.icon-box-foreigner {
      background-color: rgba(124, 58, 237, 0.12);
      .icon-foreigner { color: #7c3aed; }
    }
    &.icon-box-registry {
      background-color: rgba(2, 132, 199, 0.12);
      .icon-registry { color: #0284c7; }
    }
    &.icon-box-service {
      background-color: rgba(16, 185, 129, 0.12);
      .icon-service { color: #059669; }
    }
  }

  .card-title-text {
    font-size: 1.23rem;
    line-height: 1.35;
  }

  .card-desc-text {
    font-size: 1.03rem;
    line-height: 1.45;
    min-height: 3rem;
  }

  .action-text {
    font-size: 1rem;
  }

  .action-arrow {
    font-size: 0.95rem;
    transition: transform 0.2s ease;
  }
}

// Empty state
.empty-state {
  h5 { font-size: 1.35rem; }
  p { font-size: 1.05rem; }
  button { font-size: 0.95rem; }
}

// Colors helper
.badge-purple {
  background-color: #7c3aed;
  color: #ffffff;
}
.text-purple {
  color: #7c3aed !important;
}
.btn-purple {
  background-color: #7c3aed;
  border-color: #7c3aed;
  color: #ffffff;
  &:hover, &:focus, &:active {
    background-color: #6d28d9;
    border-color: #6d28d9;
    color: #ffffff;
  }
}
</style>
