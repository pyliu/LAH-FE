<template lang="pug">
  //- 使用 b-card 包裝，保持與 lah-user-edit-card 風格一致
  b-card(body-border-variant="primary")
    template(#header)
      .d-flex.justify-content-between.align-items-center
        h6.mb-0.font-weight-bold
          lah-fa-icon(icon="network-wired").mr-1
          | AD 連線設定
        //- 操作按鈕群組
        b-button-group.my-auto(size="sm")
          //- 左側：測試連線按鈕
          lah-button.mr-1(
            icon="plug"
            variant="outline-success"
            @click="testConnection"
            :disabled="isBusy"
            v-b-tooltip.hover
            title="測試目前設定是否可連線 AD"
          ) 測試連線

          //- 中間：同步 AD 使用者按鈕 (需先通過連線測試)
          span(
            v-b-tooltip.hover
            :title="adConnectionVerified ? '立即從 AD 同步使用者資料至系統' : '請先通過「測試連線」驗證設定'"
          )
            lah-button(
              icon="users-cog"
              :variant="adConnectionVerified ? 'info' : 'outline-info'"
              @click="syncAdUsers"
              :disabled="isBusy || !adConnectionVerified"
            ) 同步 AD 使用者

          //- 右側：儲存按鈕
          lah-button.mx-1(
            icon="save"
            :variant="isModified ? 'primary' : 'outline-primary'"
            :disabled="!isModified || isBusy"
            :loading="isBusy"
            @click="save"
            title="儲存目前的 AD 連線設定"
            no-icon-gutter
          )
          lah-button(
            icon="sync-alt"
            action="cycle"
            variant="outline-secondary"
            @click="$emit('reload')"
            title="重新載入設定"
            no-icon-gutter
          )

    //- ==========================================
    //- 1. 主機與Base DN設定
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

    //- ==========================================
    //- 2. 查詢帳號 與 查詢密碼設定 (含顯示切換)
    //- ==========================================
    b-card-group(deck)
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

    //- ==========================================
    //- 3. 連接埠設定
    //- ==========================================
    //- b-card-group(deck)
    //-   b-card.border-0(no-body)
    //-     b-form-group(
    //-       label="連接埠 (Port)"
    //-       label-for="ad-port"
    //-       label-cols-sm="3"
    //-       label-size="md"
    //-     ): b-input(
    //-       id="ad-port"
    //-       v-model="config.AD_PORT"
    //-       :state="!$utils.empty(config.AD_PORT)"
    //-       type="number"
    //-       trim
    //-       placeholder="例如：389"
    //-     )

      //- 佔位用，保持排版平衡
      b-card.border-0(no-body)
    hr
    //- ==========================================
    //- 4. AD Agent 設定 (進階設定)
    //- ==========================================

    .d-flex.justify-content-between.align-items-center.mb-2
      h6.mb-0.font-weight-bold.text-muted
        lah-fa-icon(icon="cogs").mr-1
        | AD Agent 設定 (變動密碼功能須設定此處)
      b-button(
        variant="outline-primary"
        size="sm"
        title="下載 AD_Password_Agent.ps1 PowerShell 腳本"
        @click="downloadPs1"
      )
        lah-fa-icon(icon="download").mr-1
        | 下載 AD_Password_Agent.ps1

    .p-4.optional-border.mb-3
      b-form-group(
        label="Agent URL"
        label-for="agent-url"
        label-cols-sm="2"
        label-size="md"
      )
        b-input(
          id="agent-url"
          v-model="config.AD_AGENT_URL"
          trim
          placeholder="http://220.1.XX.XX:8888/reset-password"
        )
        template(#description)
          span ⭐ 用於執行重設密碼等進階操作的代理程式 API 服務網址 [需於 AD 伺服器執行
          b-link.mx-1.font-weight-bold(
            href="javascript:void(0)"
            @click="downloadPs1"
          )
            lah-fa-icon(icon="download").mr-1
            | AD_Password_Agent.ps1
          span 以提供 API 服務]

      b-form-group(
        label="Agent Key"
        label-for="agent-key"
        label-cols-sm="2"
        label-size="md"
      )
        b-input(
          id="agent-key"
          v-model="config.AD_AGENT_KEY"
          trim
          placeholder="API Key"
        )
        template(#description)
          span 👉 Agent API 的金鑰 [必須與
          b-link.mx-1(
            href="javascript:void(0)"
            @click="downloadPs1"
          ) AD_Password_Agent.ps1
          span 裡設定相符]

    //- ==========================================
    //- 5. 詳細資訊 Modal (用於顯示同步結果)
    //- ==========================================
    b-modal(
      ref="sync-detail-modal"
      title="AD 同步作業結果"
      size="lg"
      scrollable
      hide-footer
    )
      //- 顯示主要訊息通知 (API 回傳的 message)
      .alert.alert-info.shadow-sm.mb-3(v-if="syncResultMessage")
        lah-fa-icon(icon="info-circle").mr-2
        span {{ syncResultMessage }}

      //- 顯示詳細訊息 (API 回傳的 raw.detail 訊息陣列)
      section(v-if="syncDetails")
        h6.font-weight-bold.mb-2
          lah-fa-icon(icon="list-ul").mr-1
          | 詳細同步紀錄：

        //- 若為陣列，以清單方式呈現
        ul.list-unstyled.pl-3(v-if="Array.isArray(syncDetails)")
          li.mb-2.border-bottom.pb-1(v-for="(msg, idx) in syncDetails" :key="idx")
            lah-fa-icon(icon="caret-right" variant="secondary").mr-2
            span.small {{ msg }}

        //- 備援：若非陣列，以 pre 方式呈現
        pre.p-3.bg-light.rounded.border(v-else) {{ syncDetails }}

      //- 若兩者皆無
      .text-center.py-5.text-muted(v-if="!syncResultMessage && !syncDetails")
        lah-fa-icon(icon="exclamation-triangle" size="2x").mb-2
        div 無法取得同步回傳內容

</template>

<script>
import FileSaver from 'file-saver'

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
    adConnectionVerified: false,
    syncResultMessage: '', // 儲存同步結果主要訊息 (message)
    syncDetails: null // 儲存同步詳細內容 (raw.detail)
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
    },
    adAgentScriptUrl () {
      const base = this.apiQueryUrl || (this.apiSvrIp ? `http://${this.apiSvrIp}:${this.apiSvrPort}` : '') || (process.client ? `http://${location.hostname}` : 'http://220.1.34.75')
      return `${base}/assets/sh/AD_Password_Agent.ps1`
    }
  },
  watch: {
    initData: {
      handler (val) {
        this.config = { ...val }
        this.origConfig = { ...val }
      },
      deep: true,
      immediate: true
    },
    config: {
      handler () {
        this.adConnectionVerified = false
      },
      deep: true
    }
  },
  created () {
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
      this.adConnectionVerified = false

      try {
        const res = await this.$axios.post(this.apiUrl, {
          type: 'ad_test_connection',
          config: this.config
        })

        if (!this.$utils.statusCheck(res.data.status)) {
          throw new Error(res.data.message || '連線測試未通過')
        }

        this.adConnectionVerified = true
        this.notify('AD 連線測試成功', { type: 'success' })
      } catch (err) {
        this.$utils.error(err)
        this.notify('AD 連線測試失敗', { type: 'danger' })
      } finally {
        this.isBusy = false
      }
    },

    // 同步 AD 使用者
    async syncAdUsers () {
      if (!this.adConnectionVerified) {
        this.notify('請先執行測試連線', { type: 'warning' })
        return
      }

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
          // [修改] 將訊息與 detail 一併存入並開啟 Modal 顯示
          this.syncResultMessage = res.data.message
          // 根據要求：detail 在 raw 裡面，是一個訊息陣列
          this.syncDetails = res.data.raw?.detail || null

          this.$refs['sync-detail-modal']?.show()

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
        const res = await this.$axios.post(this.apiUrl, {
          type: 'ad_update_config',
          config: this.config
        })

        if (!this.$utils.statusCheck(res.data.status)) {
          throw new Error(res.data.message || '儲存失敗')
        }

        this.origConfig = { ...this.config }
        this.notify('設定已儲存', { type: 'success' })
        this.$emit('saved', this.config)
      } catch (err) {
        this.$utils.error(err)
        this.notify('儲存失敗', { type: 'danger' })
      } finally {
        this.isBusy = false
      }
    },

    // 下載 AD_Password_Agent.ps1 腳本
    async downloadPs1 () {
      this.isBusy = true
      try {
        const response = await fetch(this.adAgentScriptUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const blob = await response.blob()
        FileSaver.saveAs(blob, 'AD_Password_Agent.ps1')
        this.notify('下載 AD_Password_Agent.ps1 成功', { type: 'success' })
      } catch (err) {
        this.$utils.error(err)
        this.notify('下載 AD_Password_Agent.ps1 失敗', { type: 'danger' })
      } finally {
        this.isBusy = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.optional-border {
  border-style: dashed;
  border-width: 2px;
  border-radius: .75rem;
  border-color: #adb5bd;
  background-color: #f8f9fa;
}

// 確保詳細資訊 Modal 內的 pre 內容不會超出寬度
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 450px;
  overflow-y: auto;
}
</style>
