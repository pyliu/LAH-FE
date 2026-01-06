<template lang="pug">
  //- 使用 b-card 包裝，保持與 lah-user-edit-card 風格一致
  b-card(body-border-variant="primary")
    template(#header)
      .d-flex.justify-content-between.align-items-center
        h6.mb-0.font-weight-bold
          lah-fa-icon(icon="network-wired").mr-1
          | AD 連線設定
        lah-button(
          icon="sync-alt"
          action="spin"
          variant="outline-primary"
          size="sm"
          @click="$emit('reload')"
          title="重新載入設定"
        )

    //- ==========================================
    //- 1. 主機與連接埠設定
    //- ==========================================
    b-card-group(deck)
      b-card.border-0(no-body)
        b-form-group(
          label="主機 (Host)"
          label-for="ad-host"
          label-cols-sm="3"
          label-size="md"
        ): b-input(
          id="ad-host"
          v-model="config.AD_HOST"
          :state="!$utils.empty(config.AD_HOST)"
          trim
          placeholder="例如：220.1.34.204"
        )
      b-card.border-0(no-body)
        b-form-group(
          label="連接埠 (Port)"
          label-for="ad-port"
          label-cols-sm="3"
          label-size="md"
        ): b-input(
          id="ad-port"
          v-model="config.AD_PORT"
          :state="!$utils.empty(config.AD_PORT)"
          type="number"
          trim
          placeholder="例如：389"
        )

    //- ==========================================
    //- 2. Base DN 與 查詢帳號
    //- ==========================================
    b-card-group(deck)
      b-card.border-0(no-body)
        b-form-group(
          label="Base DN"
          label-for="base-dn"
          label-cols-sm="3"
          label-size="md"
        ): b-input(
          id="base-dn"
          v-model="config.BASE_DN"
          :state="!$utils.empty(config.BASE_DN)"
          trim
          placeholder="例如：DC=HA,DC=LAND,DC=MOI"
        )
      b-card.border-0(no-body)
        b-form-group(
          label="查詢帳號"
          label-for="query-user"
          label-cols-sm="3"
          label-size="md"
        ): b-input(
          id="query-user"
          v-model="config.QUERY_USER"
          :state="!$utils.empty(config.QUERY_USER)"
          trim
          placeholder="AD 查詢專用帳號"
        )

    //- ==========================================
    //- 3. 密碼設定 (含顯示切換)
    //- ==========================================
    b-card-group(deck)
      b-card.border-0(no-body)
        b-form-group(
          label="查詢密碼"
          label-for="query-password"
          label-cols-sm="3"
          label-size="md"
        )
          b-input-group
            b-input(
              id="query-password"
              v-model="config.QUERY_PASSWORD"
              :type="showPassword ? 'text' : 'password'"
              :state="!$utils.empty(config.QUERY_PASSWORD)"
              trim
              placeholder="AD 查詢專用密碼"
            )
            template(#append)
              b-button(
                variant="outline-secondary"
                @click="showPassword = !showPassword"
                title="顯示/隱藏密碼"
              )
                lah-fa-icon(:icon="showPassword ? 'eye-slash' : 'eye'")

      //- 佔位用，保持排版平衡
      b-card.border-0(no-body)

    hr

    //- ==========================================
    //- 4. AD Agent 設定 (進階設定) - 已移除收合/展開功能
    //- ==========================================

    //- 直接顯示標題，說明功能用途
    h6.mb-3.font-weight-bold.text-muted
      lah-fa-icon(icon="cogs").mr-1
      | AD Agent 設定 (變動密碼功能須設定此處)

    .p-4.optional-border.mb-3
      b-form-group(
        label="Agent URL"
        label-for="agent-url"
        label-cols-sm="2"
        label-size="md"
        description="用於執行重設密碼等進階操作的代理程式 API 位址"
      ): b-input(
        id="agent-url"
        v-model="config.AD_AGENT_URL"
        trim
        placeholder="http://..."
      )

      b-form-group(
        label="Agent Key"
        label-for="agent-key"
        label-cols-sm="2"
        label-size="md"
        description="Agent API 的驗證金鑰"
      ): b-input(
        id="agent-key"
        v-model="config.AD_AGENT_KEY"
        trim
        placeholder="API Key"
      )

    //- ==========================================
    //- 5. 底部操作區
    //- ==========================================
    .d-flex.justify-content-between.align-items-center
      //- 左側：測試連線按鈕
      lah-button(
        icon="plug"
        variant="outline-info"
        @click="testConnection"
        :disabled="isBusy"
        v-b-tooltip.hover
        title="測試目前設定是否可連線 AD"
      ) 測試連線

      //- 中間：同步 AD 使用者按鈕 (需先通過連線測試)
      //- 使用 span 包裹以在 disabled 狀態下也能顯示 tooltip
      span(
        v-b-tooltip.hover
        :title="adConnectionVerified ? '立即從 AD 同步使用者資料至系統' : '請先通過「測試連線」驗證設定'"
      )
        lah-button(
          icon="users-cog"
          variant="outline-primary"
          @click="syncAdUsers"
          :disabled="isBusy || !adConnectionVerified"
        ) 同步 AD 使用者

      //- 右側：儲存按鈕
      lah-button(
        icon="save"
        variant="primary"
        @click="save"
        :disabled="!isModified || isBusy"
        :loading="isBusy"
      ) 儲存設定

</template>

<script>
export default {
  name: 'LahAdConfigCard',
  props: {
    // 接收外部傳入的設定物件
    initData: {
      type: Object,
      default: () => ({
        AD_HOST: '',
        AD_PORT: '389',
        BASE_DN: '',
        QUERY_USER: '',
        QUERY_PASSWORD: '',
        AD_AGENT_URL: '',
        AD_AGENT_KEY: ''
      })
    }
  },
  data: () => ({
    apiUrl: '',
    config: {},
    origConfig: {},
    showPassword: false,
    isBusy: false,
    adConnectionVerified: false // 新增：是否已通過連線測試
  }),
  computed: {
    // 檢查是否有變更
    isModified () {
      return !this.$utils.equal(this.config, this.origConfig)
    },
    // 檢查必填欄位
    isValid () {
      return !this.$utils.empty(this.config.AD_HOST) &&
             !this.$utils.empty(this.config.AD_PORT) &&
             !this.$utils.empty(this.config.BASE_DN) &&
             !this.$utils.empty(this.config.QUERY_USER) &&
             !this.$utils.empty(this.config.QUERY_PASSWORD)
    }
  },
  watch: {
    initData: {
      handler (val) {
        // 深拷貝以避免直接修改 props
        this.config = { ...val }
        this.origConfig = { ...val }
      },
      deep: true,
      immediate: true
    },
    // 監聽 config 變更，若有變更則重置驗證狀態
    config: {
      handler () {
        this.adConnectionVerified = false
      },
      deep: true
    }
  },
  created () {
    // 初始化設定
    this.config = { ...this.initData }
    this.origConfig = { ...this.initData }
    this.apiUrl = this.$consts.API.JSON.USER
  },
  methods: {
    // 測試連線
    async testConnection () {
      if (!this.isValid) {
        this.notify('請填寫所有必要欄位', { type: 'warning' })
        return
      }

      this.isBusy = true
      // 重置驗證狀態
      this.adConnectionVerified = false

      try {
        const res = await this.$axios.post(this.apiUrl, {
          type: 'ad_test_connection',
          config: this.config
        })

        if (!this.$utils.statusCheck(res.data.status)) {
          throw new Error(res.data.message || '連線測試未通過')
        }

        // 標記驗證通過
        this.adConnectionVerified = true
        this.notify('AD 連線測試成功', { type: 'success' })
      } catch (err) {
        this.$utils.error(err)
        this.notify('AD 連線測試失敗', { type: 'danger' })
      } finally {
        this.isBusy = false
      }
    },

    // 同步 AD 使用者 (新增功能)
    async syncAdUsers () {
      if (!this.adConnectionVerified) {
        this.notify('請先執行測試連線', { type: 'warning' })
        return
      }

      // 再次確認
      const confirm = await this.$bvModal.msgBoxConfirm('同步操作可能會花費一些時間，且會更新系統內的使用者資料。確定要執行嗎？', {
        title: '同步 AD 使用者確認',
        okVariant: 'warning',
        okTitle: '確定同步',
        cancelTitle: '取消',
        centered: true
      })

      if (!confirm) { return }

      this.isBusy = true
      try {
        const res = await this.$axios.post(this.apiUrl, {
          type: 'ad_sync_users',
          config: this.config
        })

        if (this.$utils.statusCheck(res.data.status)) {
          // 顯示後端回傳的詳細統計訊息
          this.notify(res.data.message, {
            title: '同步作業完成',
            type: 'success',
            autoHideDelay: 10000 // 延長顯示時間讓使用者閱讀統計
          })
          // [新增] 同步成功後發送事件，通知父元件重新整理
          this.$emit('synced')
        } else {
          throw new Error(res.data.message || '同步作業失敗')
        }
      } catch (err) {
        this.$utils.error(err)
        this.notify('同步 AD 使用者失敗', { type: 'danger' })
      } finally {
        this.isBusy = false
      }
    },

    // 儲存設定
    async save () {
      if (!this.isValid) {
        this.notify('請填寫所有必要欄位', { type: 'warning' })
        return
      }

      // 確認視窗
      const confirm = await this.$bvModal.msgBoxConfirm('確定要儲存目前的 AD 連線設定嗎？', {
        title: '儲存確認',
        okVariant: 'primary',
        okTitle: '確定儲存',
        cancelTitle: '取消',
        centered: true
      })

      if (!confirm) { return }

      this.isBusy = true
      try {
        // 呼叫實際儲存 API
        const res = await this.$axios.post(this.apiUrl, {
          type: 'ad_update_config', // 請確認後端接收的 type
          config: this.config
        })

        if (!this.$utils.statusCheck(res.data.status)) {
          throw new Error(res.data.message || '儲存失敗')
        }

        // 更新原始資料快照
        this.origConfig = { ...this.config }

        this.notify('設定已儲存', { type: 'success' })
        this.$emit('saved', this.config)
      } catch (err) {
        this.$utils.error(err)
        this.notify('儲存失敗', { type: 'danger' })
      } finally {
        this.isBusy = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.user-badge {
  width: 240px;
  justify-content: flex-start !important;
  transition: transform 0.25s ease; // 平滑的放大效果
  position: relative; // 確保 z-index 生效，避免 hover 時被遮擋

  &:hover {
    transform: scale(1.25); // 使用 transform 放大，不會影響文檔流 (不會推擠旁邊的元素)
    z-index: 10; // 確保放大時覆蓋在其他元素之上
  }

  // 修正 outline 樣式在 hover 時，背景變深導致深色文字看不清的問題
  // 針對 outline-dark 和 outline-info，hover 時將 ip-text-dark 轉為 ip-text-light 的樣式
  &.btn-outline-dark:hover,
  &.btn-outline-info:hover {
    .ip-text-dark {
      color: #FFEB3B !important;
      text-shadow: 1px 1px 1px rgba(0,0,0,0.4);
    }
  }
}

/* 深色背景上的高亮顯示：亮黃色 + 粗體 + 微陰影 */
.ip-text-light {
  color: #FFEB3B !important;
  font-weight: 900;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.4);
}

/* 淺色背景上的高亮顯示：深藍色 + 粗體 */
.ip-text-dark {
  color: #0033cc !important;
  font-weight: 900;
}

.optional-border {
  border-style: dashed;
  border-width: 2px;
  border-radius: .75rem;
  border-color: #adb5bd; // Bootstrap gray-500
  background-color: #f8f9fa; // Bootstrap light
}
</style>
