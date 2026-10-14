<template lang="pug">
b-card(:border-variant="borderVariant", :class="[attentionCss]")
  template(#header)
    .d-flex.w-100.justify-content-between.align-items-center
      h6.my-auto.font-weight-bolder.d-flex.align-items-center
        lah-fa-icon(icon="circle" :variant="headerLight")
          | {{ header }}
        b-badge.ml-2.font-weight-bold(
          v-if="alive && pingLatency > 0"
          :variant="pingBadgeVariant"
          pill
          :title="'DB Listener 連線延遲: ' + pingLatency + ' ms'"
        ) ⚡ {{ pingLatency }} ms
      b-button-group
        lah-button(
          v-if="link",
          to="/inf/lxhweb",
          icon="arrow-up-right-from-square",
          no-border,
          title="檢視全部"
        )
        lah-button(v-if="showBrokenBtn" icon="unlink" variant="danger" no-border action="damage" title="檢視損毀資料表" :badge-text="String(brokenTableCount)" @click="showBrokenTable")
        lah-button(
          v-if="alive"
          icon="sync"
          variant="outline-secondary"
          action="cycle"
          title="重新讀取"
          @click="ping"
          no-border
        ) {{ isBusy ? '讀取中...' : updatedTime }}
        lah-button(
          icon="question",
          action="breath",
          variant="outline-success",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="說明"
        )
    lah-help-modal(ref="help", :modal-title="`各所同步異動監控說明`")
      ul
        li 顯示桃園市各所地政系統WEB版資料庫同步異動狀態
        li 預設每5分鐘重新更新一次
        li 點擊各事務所方塊可查詢該所所有 Table 之詳細同步快照時間
      hr
      div 🟢 表示更新時間正常區間（15分鐘內）
      div 🟡 表示更新時間大於15分鐘
      div 🔴 表示超過30分鐘未更新
  .h-100(v-if="alive")
    .offices
      .office.center(
        v-for="entry in offices"
        :key="entry.SITE"
        v-b-tooltip="getTooltipConfig(entry)"
        @click="openTableDetailModal(entry)"
        :class="getOfficeCardClass(entry)"
      )
        lah-fa-icon(size="lg" icon="circle" :variant="light(entry)" :action="action(entry)")
        .d-flex.flex-column.ml-1.text-left
          span.office-name {{ name(entry) }}
          span.time-passed(:class="getTimePassedClass(entry)" v-if="displayUpdateTime") {{ displayUpdateTimeToNow ? getTimeToNow(entry) : getTime(entry) }}
  .center.h-100(v-else)
    h5.font-weight-bold
      lah-fa-icon(icon="exclamation-triangle" szie="lg" variant="danger" action="breath")
        | {{ ip }} 目前無法連線

  b-modal(
    ref="tableModal"
    :title="`${header} - ${selectedOfficeName} (${selectedOfficeCode}) 同步資料表細項`"
    size="lg"
    hide-footer
    scrollable
    centered
  )
    .d-flex.justify-content-between.align-items-center.mb-2
      b-input-group(size="sm" style="max-width: 320px;")
        template(#prepend)
          b-input-group-text: lah-fa-icon(icon="search")
        b-form-input(
          v-model="tableKeyword"
          placeholder="搜尋表格名稱..."
          trim
        )
      .d-flex.align-items-center
        b-badge.mr-2(variant="info") 共 {{ filteredTableDetails.length }} 個表格
        lah-button(
          icon="sync"
          size="sm"
          variant="outline-primary"
          :disabled="loadingTableDetail"
          :busy="loadingTableDetail"
          @click="fetchTableDetails(selectedOfficeCode)"
        ) 重新查詢
    b-table(
      striped
      hover
      responsive
      bordered
      small
      head-variant="dark"
      :items="filteredTableDetails"
      :fields="tableFields"
      :busy="loadingTableDetail"
      :current-page="tableCurrentPage"
      :per-page="tablePerPage"
      show-empty
      empty-text="查無資料表更新紀錄"
    )
      template(#table-busy)
        .text-center.my-3
          b-spinner.align-middle.mr-2
          strong 讀取表格中...
      template(#cell(狀態)="row")
        b-badge(:variant="tableStatusVariant(row.item['更新時間'])" pill)
          lah-fa-icon(icon="circle")
          |  {{ tableStatusText(row.item['更新時間']) }}
      template(#cell(距今時間)="row")
        span(:class="tableLagClass(row.item['更新時間'])")
          | {{ calcLagToNow(row.item['更新時間']) }}
    b-pagination.justify-content-center(
      v-if="filteredTableDetails.length > tablePerPage"
      v-model="tableCurrentPage"
      :total-rows="filteredTableDetails.length"
      :per-page="tablePerPage"
      size="sm"
    )
</template>

<script>
export default {
  name: 'LahMonitorBoardLxhweb',
  emit: ['light-update', 'board-update'],
  props: {
    targetIp: { type: String, require: true, default: 'L3HWEB' },
    link: { type: Boolean, default: false },
    displayUpdateTime: { type: Boolean, default: true },
    displayUpdateTimeToNow: { type: Boolean, default: true }
  },
  fetchOnServer: true,
  data: () => ({
    configs: {},
    pingLatency: 0,
    pingMessage: '',
    offices: [],
    pingTimer: null,
    brokenTableRaw: [],
    updatedTime: '',
    selectedOfficeCode: '',
    selectedOfficeName: '',
    loadingTableDetail: false,
    tableDetailData: [],
    tableKeyword: '',
    tableCurrentPage: 1,
    tablePerPage: 10,
    tableFields: [
      { key: '表格', label: '表格名稱', sortable: true },
      { key: '更新時間', label: '最後更新時間', sortable: true },
      { key: '距今時間', label: '距今時間', sortable: false },
      { key: '狀態', label: '狀態', sortable: false }
    ],
    // 新增：所別顏色對應 (用於 tooltip)
    areaColorMap: {
      HA: 'primary',
      HB: 'success',
      HC: 'danger',
      HD: 'warning',
      HE: 'info',
      HF: 'dark',
      HG: 'secondary',
      HH: 'light'
    }
  }),
  fetch () {
    this.$axios.post(this.$consts.API.JSON.LXHWEB, {
      type: 'lxhweb_config'
    }).then(({ data }) => {
      if (this.$utils.statusCheck(data.status)) {
        this.configs = Object.assign(this.configs, data.raw)
        this.updatedTime = this.$utils.time()
      } else {
        this.$utils.error(data.message)
      }
    }).catch((err) => {
      this.$utils.error(err)
    }).finally(() => {
    })
    // mock data
    this.offices = [
      { SITE: 'HA', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HB', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HC', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HD', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HE', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HF', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HG', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HH', UPDATE_DATETIME: this.randDate() }
    ]
  },
  computed: {
    ip () {
      return this.hwebMap.get(this.targetIp).ip
    },
    header () {
      if (this.hwebMap.has(this.targetIp)) {
        const entry = this.hwebMap.get(this.targetIp)
        return `${entry.name} ${entry.ip}`
      }
      return `未支援 ${this.targetIp} 監控`
    },
    alive () {
      const latency = parseFloat(this.pingLatency)
      return latency > 0 && latency < 3000
    },
    pingBadgeVariant () {
      const lat = parseFloat(this.pingLatency)
      if (lat < 50) { return 'success' }
      if (lat < 150) { return 'info' }
      if (lat < 500) { return 'warning' }
      return 'danger'
    },
    filteredTableDetails () {
      if (this.$utils.empty(this.tableDetailData)) { return [] }
      if (!this.tableKeyword) { return this.tableDetailData }
      const kw = this.tableKeyword.toUpperCase()
      return this.tableDetailData.filter((row) => {
        return (row['表格'] || '').toUpperCase().includes(kw)
      })
    },
    headerLight () {
      if (this.alive) {
        let siteLight = 'success'
        for (let i = 0; i < this.offices.length; i++) {
          const thisLight = this.light(this.offices[i])
          if (thisLight === 'warning') { siteLight = 'warning' }
          if (thisLight === 'danger') { return 'danger' }
        }
        return siteLight
      }
      return 'secondary'
    },
    borderVariant () {
      switch (this.headerLight) {
        case 'danger':
          return 'danger'
        case 'warning':
          return 'warning'
        default:
          return 'muted'
      }
    },
    attentionCss () {
      if (this.headerLight === 'danger') {
        return 'scale-danger'
      }
      if (this.headerLight === 'warning') {
        return 'scale-warning'
      }
      return ''
    },
    brokenTableCount () {
      return this.$utils.empty(this.brokenTableRaw) ? 0 : this.brokenTableRaw.length
    },
    showBrokenBtn () {
      return this.brokenTableCount > 0
    },
    hwebMap () {
      return new Map([
        ['L1HWEB', { name: 'L1同步異動', code: 'L1HWEB', ip: this.l1hwebIp }],
        ['L1HWEB_Alt', { name: 'L1同步異動(備)', code: 'L1HWEB_Alt', ip: this.l1hwebAltIp }],
        ['L2HWEB', { name: 'L2同步異動', code: 'L2HWEB', ip: this.l2hwebIp }],
        ['L3HWEB', { name: 'L3同步異動', code: 'L3HWEB', ip: this.l3hwebIp }]
      ])
    },
    l1hwebIp () {
      return this.$utils.empty(this.configs) ? '220.1.33.2' : this.configs.ORA_DB_L1HWEB_IP
    },
    l1hwebAltIp () {
      return this.l3hwebIp
    },
    l2hwebIp () {
      return this.$utils.empty(this.configs) ? '220.1.33.3' : this.configs.ORA_DB_L2HWEB_IP
    },
    l3hwebIp () {
      return this.$utils.empty(this.configs) ? '220.1.33.5' : this.configs.ORA_DB_L3HWEB_IP
    },
    pingInterval () {
      return this.$utils.empty(this.configs) ? 5 * 60 * 1000 : parseInt(this.configs.PING_INTERVAL_SECONDS) * 1000
    }
  },
  watch: {
    tableKeyword () {
      this.tableCurrentPage = 1
    },
    headerLight (nlight, olight) {
      this.$emit('light-update', {
        name: this.componentName,
        new: nlight,
        old: olight
      })
      this.emitBoardUpdate()
    }
  },
  mounted () {
    this.ping()
  },
  beforeDestroy () {
    this.stopPing()
  },
  methods: {
    randDate () {
      const randDate = new Date(+new Date() - this.$utils.rand(45 * 60 * 1000))
      return (
        randDate.getFullYear() +
        '-' +
        ('0' + (randDate.getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + randDate.getDate()).slice(-2) +
        ' ' +
        ('0' + randDate.getHours()).slice(-2) +
        ':' +
        ('0' + randDate.getMinutes()).slice(-2) +
        ':' +
        ('0' + randDate.getSeconds()).slice(-2)
      )
    },
    action (entry) {
      const light = this.light(entry)
      switch (light) {
        case 'danger':
          return 'tremble'
        case 'warning':
          return 'beat'
        default:
          return ''
      }
    },
    light (entry) {
      if (this.alive) {
        const now = +new Date() // in ms
        const lastUpdate = +new Date(entry.UPDATE_DATETIME.replace(' ', 'T'))
        const offset = now - lastUpdate
        if (offset > 30 * 60 * 1000) { return 'danger' } else if (offset > 15 * 60 * 1000) { return 'warning' }
        return 'success'
      }
      return 'secondary'
    },
    name (entry) {
      for (const value of this.xapMap.values()) {
        if (value.code === entry.SITE) {
          return value.name?.replace('所', '') || entry.SITE
        }
      }
    },
    ping () {
      this.stopPing()
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'ping',
        ip: this.ip,
        port: 1521 // db port
      }).then(({ data }) => {
        this.pingLatency = data.latency
        this.pingMessage = data.message
        if (this.$utils.statusCheck(data.status)) {
          // array of {SITE: 'HB', UPDATE_DATETIME: '2020-10-08 21:47:00'}
          this.reload()
        } else {
          this.$utils.warn('PING回應值', data.message)
        }
      }).catch((err) => {
        this.error = err
      }).finally(() => {
        this.isBusy = false
        this.emitBoardUpdate()
        this.pingNextTime()
      })
    },
    pingNextTime () {
      this.timeout(() => this.ping(), this.pingInterval).then((handler) => { this.pingTimer = handler })
    },
    stopPing () {
      clearTimeout(this.pingTimer)
    },
    reload () {
      if (this.alive) {
        this.$axios.post(this.$consts.API.JSON.LXHWEB, {
          type: 'lxhweb_site_update_time',
          site: this.targetIp
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            // array of {SITE: 'HB', UPDATE_DATETIME: '2020-10-08 21:47:00'}
            this.offices = data.raw
            this.updatedTime = this.$utils.time()
            this.emitBoardUpdate()
          } else {
            this.$utils.warn('同步異動主機狀態檢視', data.message)
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
          this.checkBrokenTable()
        })
      }
    },
    checkBrokenTable () {
      if (this.alive) {
        this.$axios.post(this.$consts.API.JSON.LXHWEB, {
          type: 'lxhweb_broken_table',
          site: this.targetIp
        }).then(({ data }) => {
          if (data.data_count) {
            // found
            this.alert(`<i class="fa fa-exclamation-triangle fa-lg ld ld-beat"></i> 找到 ${data.data_count} 筆損毀表格`, {
              subtitle: this.targetIp,
              title: '同步異動表格檢測',
              delay: 15 * 1000
            })
            this.brokenTableRaw = data.raw
          } else {
            this.brokenTableRaw = []
          }
          this.emitBoardUpdate()
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      }
    },
    showBrokenTable () {
      if (!this.$utils.empty(this.brokenTableRaw)) {
        this.modal(this.$createElement('b-table', {
          props: {
            striped: true,
            hover: true,
            headVariant: 'dark',
            bordered: true,
            captionTop: true,
            caption: `找到 ${this.brokenTableCount} 件`,
            items: this.brokenTableRaw
          }
        }), {
          title: '同步異動損毀表格'
        })
      }
    },
    openTableDetailModal (entry) {
      this.selectedOfficeCode = entry.SITE
      this.selectedOfficeName = this.name(entry)
      this.tableKeyword = ''
      this.tableCurrentPage = 1
      this.$refs.tableModal.show()
      this.fetchTableDetails(entry.SITE)
    },
    fetchTableDetails (officeCode) {
      this.loadingTableDetail = true
      this.tableDetailData = []
      this.$axios.post(this.$consts.API.JSON.LXHWEB, {
        type: 'lxhweb_tbl_update_time',
        site: this.targetIp,
        office: officeCode
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.tableDetailData = (data.raw || []).filter(item => !item['所別'] || item['所別'] === officeCode)
        } else {
          this.$utils.warn('查詢同步異動表格更新時間失敗', data.message)
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.loadingTableDetail = false
      })
    },
    tableStatusVariant (datetimeStr) {
      if (!datetimeStr) { return 'secondary' }
      const offset = +new Date() - (+new Date(datetimeStr.replace(' ', 'T')))
      if (offset > 30 * 60 * 1000) { return 'danger' }
      if (offset > 15 * 60 * 1000) { return 'warning' }
      return 'success'
    },
    tableStatusText (datetimeStr) {
      const variant = this.tableStatusVariant(datetimeStr)
      if (variant === 'danger') { return '嚴重延遲' }
      if (variant === 'warning') { return '延遲警告' }
      return '正常同步'
    },
    calcLagToNow (datetimeStr) {
      if (!datetimeStr) { return '' }
      return this.$utils.formatDistanceToNow(+new Date(datetimeStr.replace(' ', 'T')))
    },
    tableLagClass (datetimeStr) {
      const variant = this.tableStatusVariant(datetimeStr)
      if (variant === 'danger') { return 'text-danger font-weight-bold' }
      if (variant === 'warning') { return 'text-warning font-weight-bold' }
      return 'text-muted'
    },
    getOfficeCardClass (entry) {
      const light = this.light(entry)
      return {
        'office-clickable': true,
        'border-danger-glow': light === 'danger',
        'border-warning-glow': light === 'warning'
      }
    },
    getTimePassedClass (entry) {
      const light = this.light(entry)
      if (light === 'danger') { return 'danger' }
      if (light === 'warning') { return 'warning' }
      return ''
    },
    emitBoardUpdate () {
      this.$emit('board-update', {
        targetIp: this.targetIp,
        header: this.header,
        alive: this.alive,
        latency: parseFloat(this.pingLatency) || 0,
        offices: this.offices || [],
        brokenCount: this.brokenTableCount,
        brokenRaw: this.brokenTableRaw,
        headerLight: this.headerLight
      })
    },
    getTime (entry) {
      if (this.$utils.empty(entry)) { return '' }
      return entry.UPDATE_DATETIME?.split(' ')[1]
    },
    getTimeToNow (entry) {
      if (this.$utils.empty(entry)) { return '' }
      return this.$utils.formatDistanceToNow(+new Date(entry.UPDATE_DATETIME))
    },
    // 取得 Tooltip 設定
    getTooltipConfig (entry) {
      const site = entry.SITE
      const variant = this.areaColorMap[site] || 'secondary' // 預設 secondary
      const title = this.displayUpdateTimeToNow ? this.getTime(entry) : this.getTimeToNow(entry)
      return {
        title: `${this.name(entry)} 最後更新時間: ${title} (點擊查看明細)`,
        variant
      }
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
    border: 1px solid #ced4da;
    border-radius: 12px;
    margin: 0 calc(1.5%) calc(1.5%) 0;
    padding: 6px 10px;
    transition: all 0.2s ease-in-out;

    &.office-clickable {
      cursor: pointer;
      user-select: none;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        border-color: #007bff;
      }
    }

    &.border-danger-glow {
      border: 2px solid #dc3545 !important;
      box-shadow: 0 0 10px rgba(220, 53, 69, 0.45);
    }
    &.border-warning-glow {
      border: 2px solid #ffc107 !important;
      box-shadow: 0 0 8px rgba(255, 193, 7, 0.4);
    }

    /* 所名稱字型 */
    .office-name {
      text-align: left;
      font-size: 1.15rem;
      font-weight: 700;
      color: inherit;
      line-height: 1.25;
    }
    /* 經過時間樣式 */
    .time-passed {
      font-size: 0.85rem;
      color: #6c757d;
      line-height: 1.2;
      margin-top: 2px;
      &.danger {
        color: #dc3545 !important;
        font-weight: 700;
      }
      &.warning {
        color: #d39e00 !important;
        font-weight: 700;
      }
    }
  }
}
</style>
