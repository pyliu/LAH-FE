<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    .font-weight-bold.truncate(:title="header") {{ header }}
    b-button-group.ml-auto(size="sm")
      //- 點擊按鈕開啟 history modal，僅在有資料時顯示
      lah-button-count-badge.cursor-pointer(
        v-if="publicationHistory.length > 0",
        @click="$refs.history.show()",
        :count="delegatePublicationHistory.length",
        :variant="publicationHistoryLight",
        :action="publicationHistoryLight !== 'success' ? 'breath' : ''",
        :title="`${publicationHistoryReloadMs / 1000 / 60} 分鐘內本所待處理的 PUBLICATION_HISTORY 資料 (監控標的: ${targetDelegateName})`"
      )
        b-badge(variant="light", pill) {{ delegatePublicationHistory.length }}

      //- 顯示有問題案件列表按鈕，僅在有案件時顯示
      lah-button(
        v-if="caseIds.length > 0",
        icon="arrow-up-right-from-square",
        title="顯示有問題案件列表",
        :variant="light === 'danger' ? 'danger' : light === 'warning' ? 'warning' : 'outline-secondary'",
        :disabled="caseIds.length === 0",
        @click="$refs.found.show()",
        no-border
      ) 他所未回寫案件 ({{ caseIds.length }})

      lah-button(
        v-if="!footer",
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
        li 本所回寫待處理計數每{{ publicationHistoryReloadMs / 1000 / 60 }}分鐘重新檢查一次
      hr
      div
        strong 標題燈號 (整體狀態)：
      div 🟢 表示一切正常 (未回寫案件數 = 0 且 {{ targetDelegateName }} 待處理歷程 &lt; {{ publicationHistoryLightCriteria.success }})
      div 🟡 表示有案件回寫異常 (未回寫案件數 = 1 或 {{ targetDelegateName }} 待處理歷程 &gt;= {{ publicationHistoryLightCriteria.success }})
      div 🔴 表示有多個案件回寫異常 (未回寫案件數 &gt; 1 或 {{ targetDelegateName }} 待處理歷程 &gt;= {{ publicationHistoryLightCriteria.warning }})
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
          //- 修改：當數量 > 99 時，加入 'large' class 放大燈號
          .status-dot.mr-1(
            :class="[getStatusClass(code), { 'large': code.details.foundIds.length > 99 }]"
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
    template(#modal-title) 待處理 Publication History ({{ filteredPublicationHistory.length }}/{{ publicationHistory.length }})
    //- 修改：篩選介面使用 b-select (除時間外)
    //- 新增：sticky-top bg-white 等樣式讓篩選區塊固定在上方
    .d-flex.flex-wrap.justify-content-end.sticky-top.bg-white.py-1(style="top: 0; z-index: 10")
      //- 修改：時間篩選改成下拉選單 (小時)
      b-input-group.mb-2.mr-2(size="sm", prepend="時間", style="width: 200px")
        b-form-select.h-100(v-model="filters.time", :options="hourOptions")
      b-input-group.mb-2.mr-2(size="sm", prepend="傳送分類", style="width: 200px")
        b-form-select.h-100(v-model="filters.name", :options="uniqueNames")
      //- 修改：移除 (TO) 字樣
      b-input-group.mb-2.mr-2(size="sm", prepend="流向", style="width: 200px")
        b-form-select.h-100(v-model="filters.org", :options="uniqueOrgs")
      b-input-group.mb-2.mr-2(size="sm", prepend="資料表", style="width: 200px")
        b-form-select.h-100(v-model="filters.table", :options="uniqueTables")
      b-button.mb-2(size="sm", variant="outline-secondary", @click="resetFilters", title="清除篩選")
        lah-fa-icon(icon="times") 清除

    b-table(
      :items="filteredPublicationHistory",
      :fields="historyFields",
      striped,
      hover,
      responsive,
      show-empty,
      small,
      head-variant="dark"
    )
      template(#empty)
        .text-center.text-muted 目前無待處理資料
      //- 序號
      template(#cell(index)="data") {{ data.index + 1 }}
      //- 時間 (截斷毫秒，僅顯示時間)
      template(#cell(DATE_TIME)="data")
        span.text-nowrap {{ data.item.DATE_TIME ? data.item.DATE_TIME.split(' ')[1].split('.')[0] : '' }}
      //- 流向 (From -> To)
      template(#cell(org)="data")
        .text-nowrap.s-120
          //- 修改：使用 getSiteVariant 動態取得顏色
          // b-badge.mr-1(:variant="getSiteVariant(data.item.FROM_ORG_ID)") {{ getAreaName(data.item.FROM_ORG_ID) }}
          // lah-fa-icon(icon="arrow-right", variant="secondary", size="xs")
          //- 修改：使用 getSiteVariant 動態取得顏色
          b-badge.ml-1(:variant="getSiteVariant(data.item.TO_ORG_ID)") {{ getAreaName(data.item.TO_ORG_ID) }}
      //- SQL 內容 (自動換行，平滑展開)
      template(#cell(SQL)="data")
        .sql-text.text-muted.small {{ data.item.SQL }}

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
    publicationHistoryReloadMs: 1 * 60 * 1000,
    publicationHistoryReloadTimer: null,
    // 修改：將閾值提取為變數，方便統一管理與顯示
    publicationHistoryLightCriteria: {
      success: 50,
      warning: 100
    },
    historyFields: [
      { key: 'index', label: '#' },
      { key: 'DATE_TIME', label: '時間', sortable: true, thClass: 'text-nowrap' },
      { key: 'PUBLICATION_NAME', label: '傳送分類', sortable: true, thClass: 'text-nowrap' },
      { key: 'org', label: '流向', thClass: 'text-nowrap' },
      { key: 'TABLE_DESCRIPTION', label: '資料表', sortable: true, thClass: 'text-nowrap' },
      { key: 'SQL', label: '內容' }
    ],
    // 新增：篩選欄位綁定變數
    filters: {
      time: '',
      // 修改：預設篩選包含 _delegate
      name: undefined,
      org: '',
      table: ''
    },
    message: '讀取中',
    // ID 到名稱的映射表
    areaNameMap: {
      LOCALHOST: '本所', // 新增本所對應 (Fallback)
      HA: '桃園',
      HB: '中壢',
      HC: '大溪',
      HD: '楊梅',
      HE: '蘆竹',
      HF: '八德',
      HG: '平鎮',
      HH: '龜山',
      H0: '地政局',
      // 新增其他縣市對應
      A0: '台北市',
      B0: '台中市',
      C0: '基隆市',
      D0: '台南市',
      E0: '高雄市',
      F0: '新北市',
      G0: '宜蘭縣',
      I0: '嘉義市',
      J0: '新竹縣',
      K0: '苗栗縣',
      M0: '南投縣',
      N0: '彰化縣',
      O0: '新竹市',
      P0: '雲林縣',
      Q0: '嘉義縣',
      T0: '屏東縣',
      U0: '花蓮縣',
      V0: '台東縣',
      W0: '金門縣',
      X0: '澎湖縣',
      Z0: '連江縣'
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
    reloadTimer: null
  }),
  fetch () {
    this.today = this.$utils.today('TW')
    this.checkXCaseSyncStatus()
    this.loadPublicationHistory()
  },
  computed: {
    // 修改：僅列出目前資料中出現過的小時
    hourOptions () {
      const hours = new Set()
      this.publicationHistory.forEach((item) => {
        // 假設 DATE_TIME 格式為 "YYYY-MM-DD HH:MM:SS.mmm"
        if (item.DATE_TIME) {
          const timePart = item.DATE_TIME.split(' ')[1]
          if (timePart) {
            const hour = timePart.split(':')[0]
            if (hour) {
              hours.add(hour)
            }
          }
        }
      })
      // 排序小時
      const sortedHours = [...hours].sort()
      // 組合選項
      return [
        { text: '全部', value: '' },
        ...sortedHours.map(h => ({ text: `${h} 時`, value: h }))
      ]
    },
    // 新增：安全取得站點代碼 (Fallback)
    mySite () {
      return this.site || 'LOCALHOST'
    },
    // 新增：計算目標監控名稱
    targetDelegateName () {
      return `${this.mySite}_delegate`
    },
    // 修改：使用 mySite 進行精確的 _delegate 監控
    delegatePublicationHistory () {
      return this.publicationHistory.filter(item =>
        item.PUBLICATION_NAME && item.PUBLICATION_NAME.includes(this.targetDelegateName)
      )
    },
    // 新增：計算不重複的名稱選項
    uniqueNames () {
      const list = this.publicationHistory.map(i => i.PUBLICATION_NAME).filter(n => n)
      const unique = [...new Set(list)].sort()
      // 新增：如果有 _delegate，把它放在前面或是讓下拉選單預設選中 (v-model 已經處理預設值)
      return [{ text: '全部', value: '' }, ...unique.map(x => ({ text: x, value: x }))]
    },
    // 修改：計算不重複的流向選項 (使用中文名稱，避免重複顯示)
    uniqueOrgs () {
      const nameSet = new Set()
      this.publicationHistory.forEach((i) => {
        if (i.TO_ORG_ID) {
          // 轉換成中文名稱後再存入 Set，確保不重複
          nameSet.add(this.getAreaName(i.TO_ORG_ID))
        }
      })

      // 使用 Set 轉回陣列
      const options = [...nameSet].map(name => ({ text: name, value: name }))

      // 依中文名稱排序
      options.sort((a, b) => a.text.localeCompare(b.text, 'zh-Hant'))
      return [{ text: '全部', value: '' }, ...options]
    },
    // 新增：計算不重複的資料表選項
    uniqueTables () {
      const list = this.publicationHistory.map(i => i.TABLE_DESCRIPTION).filter(n => n)
      const unique = [...new Set(list)].sort()
      return [{ text: '全部', value: '' }, ...unique.map(x => ({ text: x, value: x }))]
    },
    // 新增：過濾後的 Publication History
    filteredPublicationHistory () {
      // 如果沒有資料，直接回傳空陣列
      if (this.publicationHistory.length === 0) { return [] }

      const { time, name, org, table } = this.filters

      // 如果沒有設定任何篩選條件，回傳原始資料
      if (!time && !name && !org && !table) { return this.publicationHistory }

      return this.publicationHistory.filter((item) => {
        // 時間篩選 (比對時間起頭，精確匹配小時)
        // item.DATE_TIME 格式預期為 "YYYY-MM-DD HH:MM:SS.mmm"
        const matchTime = !time || (() => {
          const dt = item.DATE_TIME || ''
          const timePart = dt.split(' ')[1] || '' // 取得 "HH:MM:SS.mmm"
          return timePart.startsWith(time) // 檢查是否以 "08" (或其他選定的小時) 開頭
        })()

        // 名稱篩選 (模糊比對，為了支援 _delegate 這種包含式搜尋)
        const matchName = !name || (item.PUBLICATION_NAME || '').includes(name)

        // 資料表篩選 (精確比對)
        const matchTable = !table || item.TABLE_DESCRIPTION === table

        // 流向篩選 (只檢查 TO，並將 ID 轉為名稱比對)
        // 修改：比對轉換後的中文名稱，以支援合併後的選項
        const matchOrg = !org || this.getAreaName(item.TO_ORG_ID) === org

        return matchTime && matchName && matchTable && matchOrg
      })
    },
    formattedInfo () {
      // 1. 處理本所節點 (Local Node)
      const localNode = {
        id: this.mySite,
        isLocal: true, // 標記為本所
        details: {
          // 修改：將 foundIds 指向 delegatePublicationHistory，讓監控儀表板的數字只反映 _delegate 的數量
          foundIds: this.delegatePublicationHistory,
          // 用於第二行顯示文字
          localMax: `待處理 ${this.delegatePublicationHistory.length} 筆`
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
      // 修改：燈號判斷使用 delegatePublicationHistory 的數量
      if (this.delegatePublicationHistory.length < this.publicationHistoryLightCriteria.success) {
        return 'success'
      }
      if (this.delegatePublicationHistory.length < this.publicationHistoryLightCriteria.warning) {
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
    'delegatePublicationHistory.length' (val) {
      if (this.filters.name === undefined) {
        // 預設篩選使用 computed 的 targetDelegateName
        this.filters.name = val > 0 ? this.targetDelegateName : ''
      }
    },
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
    // 新增：重置篩選條件
    resetFilters () {
      this.filters.time = ''
      // 修改：重置時回到預設值
      this.filters.name = this.delegatePublicationHistory.length > 0 ? this.targetDelegateName : ''
      this.filters.org = ''
      this.filters.table = ''
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
        content: `✔ 案件 ${id} 已由系管操作修正未回寫問題。`,
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
          title: `${this.getAreaName(code.id)}待處理：${this.delegatePublicationHistory.length} 筆`,
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
      // 嘗試精確匹配，若無則嘗試使用首字母通用匹配 (例如 A1 -> A0)
      return this.areaNameMap[prefix] || this.areaNameMap[prefix.charAt(0) + '0'] || id
    },
    getAreaNameFromCaseId (caseId) {
      if (typeof caseId !== 'string' || caseId.length < 6) { return '' }
      const prefix = caseId.substring(4, 6)
      // 嘗試精確匹配，若無則嘗試使用首字母通用匹配
      return this.areaNameMap[prefix] || this.areaNameMap[prefix.charAt(0) + '0'] || ''
    },
    getAreaVariant (caseId) {
      if (typeof caseId !== 'string' || caseId.length < 6) { return 'secondary' }
      const prefix = caseId.substring(4, 6)
      return this.areaColorMap[prefix] || 'secondary'
    },
    /**
     * 根據所別代碼 (siteId) 取得對應顏色
     * @param {string} id - 所別代碼 (例如 'HA')
     */
    getSiteVariant (id) {
      return this.areaColorMap[id] || 'primary'
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
  /* 修改：加入動畫過渡，讓大小變化較平滑
    但主要目的是為了 .large 樣式
  */
  transition: all 0.3s ease;

  &.large {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
    /* 確保大圓圈不會破壞版面，微調 margin */
    margin-right: 0.25rem !important;
  }
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

/* 新增：SQL 文字平滑展開樣式 */
.sql-text {
  max-width: 600px;
  /* 初始狀態：單行截斷 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  word-break: break-all; /* 確保長字串換行 */

  /* 動畫設定 */
  max-height: 1.5em; /* 預設高度約一行 */
  transition: max-height 0.5s ease;

  cursor: help;

  &:hover {
    -webkit-line-clamp: unset; /* 解除行數限制 */
    max-height: 400px; /* 設定一個足夠大的高度以容納內容 */
    overflow-y: auto; /* 內容過多時顯示捲軸 */
    color: black !important;
    font-size: large;
    font-weight: bold;
  }
}
</style>
