<template lang="pug">
b-modal#lah-api-track-switcher-modal(
  ref="modal"
  v-model="visible"
  size="lg"
  scrollable
  no-close-on-backdrop
  hide-footer
  body-class="p-3 lah-track-modal-body"
  @shown="handleModalShown"
)
  template(#modal-title)
    .d-flex.align-items-center
      lah-fa-icon.mr-2(
        icon="server"
        :action="isChecking ? 'ld-spin' : ''"
        :variant="isPhp85Active ? 'success' : 'secondary'"
      )
      span.font-weight-bold API 雙軌切換與健康狀態控制台
      b-badge.ml-2(:variant="isPhp85Active ? 'success' : 'secondary'" pill)
        | {{ isPhp85Active ? 'PHP 8.5 現代化新軌' : 'PHP 7.4 穩定舊軌' }}

  //- 1. 全局 API 軌道主切換區塊
  .card.mb-3.border-0.shadow-sm.bg-light
    .card-body.p-3
      .d-flex.justify-content-between.align-items-center.flex-wrap
        div.mb-2.mb-md-0
          h6.font-weight-bold.mb-1
            lah-fa-icon.mr-1(icon="route" variant="primary")
            | 全局 API 運行軌道
          small.text-muted 決定全站未特例指定的 API 請求預設轉發端點

        b-button-group(size="sm")
          b-button(
            :variant="globalTrack === 'php7' ? 'primary' : 'outline-primary'"
            @click="switchGlobalTrack('php7')"
          )
            lah-fa-icon.mr-1(icon="cube")
            | PHP 7.4 舊軌 (Port 80)
          b-button(
            :variant="globalTrack === 'php85' ? 'success' : 'outline-success'"
            @click="switchGlobalTrack('php85')"
          )
            lah-fa-icon.mr-1(icon="rocket")
            | PHP 8.5 新軌 (FastCGI :8085)

      hr.my-2
      .small.d-flex.justify-content-between.align-items-center.text-muted
        span
          | 當前目標路由前綴：
          code.px-1.bg-white.rounded.border {{ globalTrack === 'php85' ? '/LAH-API/api/*.php' : '/api/*.php' }}
        span
          b-badge(v-if="overrideCount > 0" variant="info") 已個別微調 {{ overrideCount }} 個模組

  //- 2. PHP 8.5 FastCGI 即時健康檢測面板
  .card.mb-3.border-0.shadow-sm
    .card-header.bg-white.py-2.d-flex.justify-content-between.align-items-center
      .font-weight-bold.small
        lah-fa-icon.mr-1(icon="heart-pulse" :variant="healthVariant")
        | PHP 8.5 FastCGI 服務健康狀態
        b-badge.ml-2(:variant="healthVariant") {{ healthStatusText }}
      b-button(
        size="sm"
        variant="outline-secondary"
        :disabled="isChecking"
        @click="checkHealth"
        title="重新向 /LAH-API/ver.php 發送 Ping 測試"
      )
        lah-fa-icon.mr-1(icon="sync" :action="isChecking ? 'ld-spin' : ''")
        | {{ isChecking ? '檢測中...' : '重新檢測' }}

    .card-body.p-3
      //- 若檢測異常且當前已啟用 PHP 8.5，給出強烈警示與一鍵回退
      b-alert.mb-3(
        v-if="health.status === 'unhealthy' && isPhp85Active"
        variant="danger"
        show
      )
        .d-flex.justify-content-between.align-items-center
          div
            strong
              lah-fa-icon.mr-1(icon="triangle-exclamation")
              | 警告：PHP 8.5 服務未啟動或連線失敗！
            div.small.mt-1 錯誤訊息：{{ health.error || '無法連線至 FastCGI 服務' }}
          b-button(
            size="sm"
            variant="danger"
            @click="fallbackToPhp7"
          )
            lah-fa-icon.mr-1(icon="rotate-left")
            | 立即回退至 PHP 7.4

      .row.no-gutters.text-center.border.rounded.py-2.bg-light.small
        .col-4.border-right
          .text-muted PHP 版本
          .font-weight-bold.text-dark {{ health.phpVersion || '未取得' }}
        .col-4.border-right
          .text-muted SAPI 模式
          .font-weight-bold.text-dark {{ health.sapi || '未取得' }}
        .col-4
          .text-muted 回應延遲
          .font-weight-bold(:class="latencyClass") {{ health.latency ? `${health.latency} ms` : '未量測' }}

      //- 擴充套件載入狀態
      .mt-2.pt-2.border-top.small(v-if="hasExtensions")
        span.text-muted.mr-2 核心擴充：
        span.mr-2(
          v-for="(loaded, ext) in health.extensions"
          :key="ext"
        )
          b-badge(:variant="loaded ? 'success' : 'secondary'")
            lah-fa-icon.mr-1(:icon="loaded ? 'check' : 'xmark'")
            | {{ ext }}

  //- 3. 個別 API 模組微調清單 (折疊區)
  .card.mb-3.border-0.shadow-sm
    .card-header.bg-white.py-2.d-flex.justify-content-between.align-items-center
      .font-weight-bold.small(role="button" @click="toggleModulesCollapse")
        lah-fa-icon.mr-1(:icon="modulesCollapsed ? 'chevron-right' : 'chevron-down'")
        | 個別 API 模組覆寫微調
        span.text-muted.ml-1 (共 {{ moduleList.length }} 個端點，{{ overrideCount }} 個已自訂)
      b-button(
        v-if="overrideCount > 0"
        size="sm"
        variant="outline-danger"
        @click="resetAllOverrides"
      )
        lah-fa-icon.mr-1(icon="arrow-rotate-left")
        | 清除所有微調

    b-collapse(v-model="modulesVisible")
      .p-2.border-bottom.bg-light
        b-input-group(size="sm")
          template(#prepend)
            b-input-group-text: lah-fa-icon(icon="magnifying-glass")
          b-form-input(
            v-model="searchKeyword"
            placeholder="搜尋 API 檔名或功能說明 (例如 query, user, monitor)..."
          )
          template(#append v-if="searchKeyword")
            b-button(variant="outline-secondary" @click="searchKeyword = ''") 清除

      .list-group.list-group-flush.module-list-group
        .list-group-item.py-2.px-3(
          v-for="item in filteredModuleList"
          :key="item.name"
        )
          .d-flex.justify-content-between.align-items-center.flex-wrap
            div.mr-2
              .font-weight-bold.small
                | {{ item.name }}
                b-badge.ml-1(
                  v-if="moduleOverrides[item.name]"
                  :variant="moduleOverrides[item.name] === 'php85' ? 'success' : 'primary'"
                )
                  | 強制 {{ moduleOverrides[item.name] === 'php85' ? 'PHP 8.5' : 'PHP 7.4' }}
              small.text-muted {{ item.desc }}

            b-form-radio-group(
              size="sm"
              buttons
              button-variant="outline-secondary"
              :value="moduleOverrides[item.name] || 'default'"
              @change="setModuleTrack(item.name, $event)"
            )
              b-form-radio(value="default") 跟隨全局
              b-form-radio(value="php7") PHP 7.4
              b-form-radio(value="php85") PHP 8.5

  //- 4. 底部動作工具列 (重新載入、快取清理與關閉)
  .d-flex.justify-content-between.align-items-center.flex-wrap.mt-3.pt-2.border-top
    div.mb-2.mb-md-0
      b-button.mr-2(
        size="sm"
        variant="outline-dark"
        @click="reloadPage"
        title="重新整理瀏覽器頁面，乾淨重新觸發所有元件的 initial mounted 請求"
      )
        lah-fa-icon.mr-1(icon="rotate-right")
        | 重新整理頁面

      b-button(
        size="sm"
        variant="outline-warning"
        @click="clearLocalCache"
        title="清除瀏覽器 localForage 本機暫存資料"
      )
        lah-fa-icon.mr-1(icon="trash-can")
        | 清除本機快取

    div
      b-button(
        size="sm"
        variant="secondary"
        @click="hide"
      ) 關閉面板
</template>

<script>
export default {
  name: 'LahApiTrackSwitcherModal',
  data () {
    return {
      visible: false,
      modulesVisible: false,
      searchKeyword: '',
      isChecking: false,
      moduleList: [
        { name: 'query_json_api.php', desc: '地政核心綜合查詢 (HXWEB 業務、權利人、地號地籍等)' },
        { name: 'user_json_api.php', desc: '使用者資料、組織結構與人員對照映射' },
        { name: 'auth_json_api.php', desc: '登入身份驗證、權限判定與環境參數傳遞' },
        { name: 'system_json_api.php', desc: '系統常態設定、伺服器資訊與跨所連線' },
        { name: 'stats_json_api.php', desc: '統計分析、案件數量與各課作業報表' },
        { name: 'monitor_json_api.php', desc: '伺服器主機、磁碟、信件與即時監控數據' },
        { name: 'reg_json_api.php', desc: '登記課作業專屬處理 API' },
        { name: 'adm_json_api.php', desc: '行政課差勤、公文與管考專屬 API' },
        { name: 'sur_json_api.php', desc: '測量課作業與圖資相關 API' },
        { name: 'notification_json_api.php', desc: '即時通公告與系統廣播訊息發布' },
        { name: 'prefetch_json_api.php', desc: '系統預先載入快取與首頁快取加速' },
        { name: 'mssql_json_api.php', desc: '舊公文 MS SQL 資料庫代理查詢' },
        { name: 'lxhweb_json_api.php', desc: '跨所同步庫 (L1HWEB/L2HWEB/L3HWEB) 資料查詢' },
        { name: 'ip_json_api.php', desc: '本機端點 IP 解析與地所網段判定' },
        { name: 'moiexp_json_api.php', desc: '地政規費、收據與匯出專屬 API' },
        { name: 'moiprc_json_api.php', desc: '地價作業專屬 API' },
        { name: 'moicad_json_api.php', desc: '地籍圖資與空間資料 API' },
        { name: 'moicas_json_api.php', desc: '案件查詢與收件登記專用 API' },
        { name: 'moicat_json_api.php', desc: '編目與分類系統 API' },
        { name: 'moiadm_json_api.php', desc: '行政公文聯調 API' },
        { name: 'moisms_json_api.php', desc: '簡訊推播紀錄與通知 API' },
        { name: 'xcase_json_api.php', desc: '跨所跨機關申辦案件狀態 API' },
        { name: 'dgx_json_api.php', desc: 'nVidia DGX Spark 運算中繼 API' },
        { name: 'load_file_api.php', desc: '伺服器端報表與靜態歷史檔案讀取' },
        { name: 'export_file_api.php', desc: '各式檔案與備份資料匯出' },
        { name: 'export_xlsx_api.php', desc: 'Excel 試算表格式產出' },
        { name: 'export_txt_data.php', desc: '文字與地籍清冊資料匯出' },
        { name: 'export_tmp_csv.php', desc: '暫存 CSV 格式報表產出' },
        { name: 'export_tmp_txt.php', desc: '暫存純文字清單產出' },
        { name: 'import_user_xlsx.php', desc: '人員名冊 Excel 匯入' },
        { name: 'upload_image.php', desc: '圖片上傳處理' },
        { name: 'upload_user_photo.php', desc: '使用者大頭照照片上傳' },
        { name: 'base64_image_convert.php', desc: 'Base64 圖片編碼與轉換' },
        { name: 'carousel_json_api.php', desc: '首頁輪播圖面與資訊維護' },
        { name: 'schedule_json_api.php', desc: '後台定期任務與排程查詢' },
        { name: 'myquery_json_api.php', desc: '自訂查詢清單與常用篩選 API' }
      ]
    }
  },
  computed: {
    apiTrack () {
      return this.$store.getters.apiTrack || {}
    },
    globalTrack () {
      return this.apiTrack.globalTrack || 'php7'
    },
    moduleOverrides () {
      return this.apiTrack.moduleOverrides || {}
    },
    health () {
      return this.apiTrack.health || {}
    },
    isPhp85Active () {
      return this.$store.getters.isPhp85Active
    },
    overrideCount () {
      return Object.keys(this.moduleOverrides).length
    },
    modulesCollapsed () {
      return !this.modulesVisible
    },
    filteredModuleList () {
      if (!this.searchKeyword) {
        return this.moduleList
      }
      const kw = this.searchKeyword.toLowerCase().trim()
      return this.moduleList.filter(m =>
        m.name.toLowerCase().includes(kw) ||
        m.desc.toLowerCase().includes(kw)
      )
    },
    healthVariant () {
      if (this.health.status === 'healthy') {
        return 'success'
      }
      if (this.health.status === 'unhealthy') {
        return 'danger'
      }
      if (this.health.status === 'checking') {
        return 'warning'
      }
      return 'secondary'
    },
    healthStatusText () {
      if (this.health.status === 'healthy') {
        return '正常連線中'
      }
      if (this.health.status === 'unhealthy') {
        return '服務異常 / 未啟動'
      }
      if (this.health.status === 'checking') {
        return '正在連線測試...'
      }
      return '尚未檢測'
    },
    latencyClass () {
      if (!this.health.latency) { return 'text-muted' }
      if (this.health.latency < 50) { return 'text-success' }
      if (this.health.latency < 200) { return 'text-primary' }
      return 'text-warning'
    },
    hasExtensions () {
      return this.health.extensions && Object.keys(this.health.extensions).length > 0
    }
  },
  created () {
    this.$root.$on('open-api-track-switcher-modal', this.show)
  },
  beforeDestroy () {
    this.$root.$off('open-api-track-switcher-modal', this.show)
  },
  methods: {
    show () {
      this.visible = true
    },
    hide () {
      this.visible = false
    },
    handleModalShown () {
      // 每次開啟 Modal 自動進行一次即時健康檢查
      this.checkHealth()
    },
    toggleModulesCollapse () {
      this.modulesVisible = !this.modulesVisible
    },
    async switchGlobalTrack (track) {
      if (track === this.globalTrack) {
        return
      }
      this.$store.commit('setApiGlobalTrack', track)
      const label = track === 'php85' ? 'PHP 8.5 (FastCGI :8085)' : 'PHP 7.4 (Port 80)'
      this.notify(`已將全局 API 軌道切換為：${label}`, {
        type: track === 'php85' ? 'success' : 'info',
        pos: 'br',
        delay: 4000
      })

      // 切換至 PHP 8.5 時自動重新觸發健康檢查
      if (track === 'php85') {
        await this.checkHealth()
      }
    },
    setModuleTrack (moduleName, track) {
      this.$store.commit('setApiModuleOverride', { moduleName, track })
      const text = track === 'default'
        ? `[${moduleName}] 已還原為跟隨全局`
        : `[${moduleName}] 已強制指定為 ${track === 'php85' ? 'PHP 8.5' : 'PHP 7.4'}`
      this.notify(text, {
        type: 'dark',
        pos: 'br',
        delay: 2500
      })
    },
    resetAllOverrides () {
      Object.keys(this.moduleOverrides).forEach((mod) => {
        this.$store.commit('setApiModuleOverride', { moduleName: mod, track: 'default' })
      })
      this.notify('已清除所有個別模組微調設定，全數回歸全局設定', {
        type: 'info',
        pos: 'br',
        delay: 3000
      })
    },
    fallbackToPhp7 () {
      this.switchGlobalTrack('php7')
      this.resetAllOverrides()
      this.notify('已自動緊急回退至 PHP 7.4 穩定舊軌', {
        type: 'warning',
        pos: 'br',
        delay: 4500
      })
    },
    async checkHealth () {
      this.isChecking = true
      try {
        await this.$store.dispatch('checkApi85Health')
      } finally {
        this.isChecking = false
      }
    },
    reloadPage () {
      if (process.client) {
        window.location.reload()
      }
    },
    async clearLocalCache () {
      try {
        if (this.$localForage) {
          await this.$localForage.clear()
        }
        if (typeof window !== 'undefined') {
          sessionStorage.clear()
        }
        this.notify('已成功清空前端本機暫存快取！', {
          type: 'success',
          pos: 'br',
          delay: 3500
        })
      } catch (e) {
        this.$utils.error('清空快取失敗', e)
        this.notify(`清空快取失敗：${e.message}`, {
          type: 'danger',
          pos: 'br',
          delay: 5000
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-track-modal-body {
  max-height: 80vh;
}

.module-list-group {
  max-height: 320px;
  overflow-y: auto;
}
</style>
