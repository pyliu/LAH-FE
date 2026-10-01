<template lang="pug">
div(v-cloak)
  lah-header: lah-transition(appear): .d-flex.justify-content-between.align-items-center.w-100.my-auto
    .d-flex.align-items-center.ml-2
      lah-fa-icon(:icon="statusIcon" :variant="statusColorVariant" size="lg" regular)
      span.mx-2.font-weight-bold(:class="'text-' + statusColorVariant") {{ statusTitle }}
      b-badge(:variant="statusColorVariant" pill) HTTP {{ resolvedStatusCode }}
    .d-flex.align-items-center.mr-2
      b-badge(variant="light" class="text-muted border d-none d-md-inline-block")
        lah-fa-icon(icon="clock" regular).mr-1
        span {{ errorTime || '載入中...' }}

  .lah-error-container.container.py-4
    lah-transition(appear)
      b-card.error-card.shadow-sm.border-0.mx-auto
        //- 頂部錯誤橫幅區 (Hero / Header Banner)
        .error-hero.d-flex.flex-column.flex-md-row.align-items-center.p-3.p-md-4.border-bottom(
          :class="'hero-' + statusColorVariant"
        )
          .hero-icon-box.mr-md-4.mb-3.mb-md-0.d-flex.align-items-center.justify-content-center(
            :class="'bg-' + statusColorVariant + '-subtle text-' + statusColorVariant"
          )
            lah-fa-icon(:icon="statusIcon" size="3x")
          .hero-text.text-center.text-md-left.flex-grow-1
            .d-flex.align-items-center.justify-content-center.justify-content-md-start.flex-wrap.mb-1
              h2.font-weight-bold.mb-0.mr-2(:class="'text-' + statusColorVariant") {{ resolvedStatusCode }}
              span.h4.mb-0.text-dark {{ statusTitle }}
            .text-muted.small.mt-1 {{ statusDescription }}

        //- 核心錯誤訊息區
        .error-body.p-3.p-md-4
          .error-quote-box.p-3.rounded.mb-4.position-relative
            .d-flex.align-items-start.justify-content-between
              .d-flex.align-items-start.flex-grow-1
                lah-fa-icon.text-danger.mr-2.mt-1(icon="circle-exclamation")
                div
                  .font-weight-bold.text-dark.mb-1 錯誤內容描述
                  .message-content.h5.mb-0.text-danger.font-weight-bold {{ message }}
              lah-button(
                icon="copy"
                variant="outline-secondary"
                size="sm"
                no-border
                title="複製訊息文字"
                @click="copyMessage"
                class="ml-2 flex-shrink-0"
              )

          //- 即時環境與連線資訊快覽 (診斷標籤列)
          .diagnostics-panel.mb-4
            .text-muted.small.font-weight-bold.mb-2
              lah-fa-icon(icon="chart-simple" regular).mr-1
              span 即時連線與身分資訊快覽
            b-row(no-gutters class="diagnostics-grid")
              b-col(cols="12" sm="6" lg="4" class="p-1")
                .diag-item.p-2.rounded.border.bg-light.h-100.d-flex.align-items-center
                  lah-fa-icon.text-primary.mr-2(icon="user" size="lg")
                  .diag-text.small.text-truncate
                    .text-muted 使用者帳號
                    .font-weight-bold.text-dark.text-truncate(:title="userDisplayName") {{ userDisplayName }}
              b-col(cols="12" sm="6" lg="4" class="p-1")
                .diag-item.p-2.rounded.border.bg-light.h-100.d-flex.align-items-center
                  lah-fa-icon.text-info.mr-2(icon="desktop" size="lg")
                  .diag-text.small.text-truncate.w-100
                    .text-muted 用戶端 IP
                    .font-weight-bold.text-dark.d-flex.align-items-center.justify-content-between
                      span {{ clientIp }}
                      b-link.text-muted.ml-1(@click="copyIp" title="複製 IP")
                        lah-fa-icon(icon="copy" size="xs")
              b-col(cols="12" sm="6" lg="4" class="p-1")
                .diag-item.p-2.rounded.border.bg-light.h-100.d-flex.align-items-center
                  lah-fa-icon.text-success.mr-2(icon="building" size="lg")
                  .diag-text.small.text-truncate
                    .text-muted 所別單位
                    .font-weight-bold.text-dark {{ siteName }} ({{ site }})
              b-col(cols="12" sm="6" lg="4" class="p-1")
                .diag-item.p-2.rounded.border.bg-light.h-100.d-flex.align-items-center
                  lah-fa-icon.text-warning.mr-2(icon="id-badge" size="lg")
                  .diag-text.small.text-truncate
                    .text-muted 所屬課室 / 角色
                    .font-weight-bold.text-dark.text-truncate(:title="userUnitRole") {{ userUnitRole }}
              b-col(cols="12" sm="6" lg="4" class="p-1")
                .diag-item.p-2.rounded.border.bg-light.h-100.d-flex.align-items-center
                  lah-fa-icon.text-secondary.mr-2(icon="clock" regular size="lg")
                  .diag-text.small.text-truncate
                    .text-muted 紀錄時間
                    .font-weight-bold.text-dark {{ errorTime || '記錄中...' }}
              b-col(cols="12" sm="6" lg="4" class="p-1")
                .diag-item.p-2.rounded.border.bg-light.h-100.d-flex.align-items-center
                  lah-fa-icon.text-danger.mr-2(icon="compass" size="lg")
                  .diag-text.small.text-truncate
                    .text-muted 來源/請求頁面
                    .font-weight-bold.text-dark.text-truncate(:title="displayPath") {{ displayPath }}

          //- 智慧排除指引區塊
          .troubleshooting-guide.mb-4
            //- 情境 1: IP 或帳號未綁定提示
            b-alert(
              v-if="isIpRelatedError"
              show
              variant="warning"
              class="border-warning mb-3 shadow-none"
            )
              .d-flex.align-items-start
                lah-fa-icon.text-warning.mr-2.mt-1(icon="triangle-exclamation" size="lg")
                div.flex-grow-1
                  strong.d-block.mb-1 IP 位址與使用者帳號綁定提示
                  ul.mb-1.pl-3.small
                    li 本系統多項業務功能需要驗證電腦端 IP 與帳號權限。
                    li 若您更換座位或剛啟動電腦，請確認桌面端 #[strong 桃園即時通] 已正常登入連線（即時通會自動登記您的連線 IP）。
                    li 若您為新進同仁或 IP 已變更，請洽資訊課管理員協助於系統建立 IP 對應。
                  .mt-2(v-if="authority.isAdmin")
                    b-button(to="/admin/ip" variant="outline-dark" size="sm")
                      lah-fa-icon(icon="sliders" class="mr-1")
                      span 前往 IP 對應表管理

            //- 情境 2: 快取與連線排除提示
            .tip-card.p-3.rounded.bg-light.border.d-flex.align-items-center.justify-content-between.flex-wrap
              .d-flex.align-items-center.my-1
                lah-fa-icon.text-warning.mr-2(icon="lightbulb" regular size="lg")
                span.small.text-muted 仍然有問題！？系統更新或更換身分後，可嘗試清除本機快取資料以重整畫面。
              b-button(
                variant="outline-primary"
                size="sm"
                @click="clearFECache"
                class="my-1"
              )
                lah-fa-icon(icon="hand-sparkles" class="mr-1")
                span 清除系統快取並重整

          //- 快捷操作按鈕列 (Action Toolbar)
          .action-toolbar.d-flex.align-items-center.justify-content-center.flex-wrap.p-2.rounded.bg-light.mb-4
            lah-button.m-1(
              icon="arrow-left"
              variant="outline-secondary"
              @click="goBack"
            ) 回上一頁
            lah-button.m-1(
              icon="house-chimney"
              variant="primary"
              to="/"
            ) 回入口網首頁
            lah-button.m-1(
              icon="rotate-right"
              variant="outline-primary"
              @click="reloadPage"
            ) 重新整理
            lah-button.m-1(
              icon="copy"
              variant="outline-success"
              @click="copyDiagnosticInfo"
            ) 複製診斷報告
            lah-button.m-1(
              icon="comment-dots"
              variant="outline-info"
              to="/notification/message"
            ) 桃園即時通

          //- 詳細技術診斷折疊區塊 (供資訊同仁排查)
          .tech-details-section.pt-2.border-top
            .d-flex.align-items-center.justify-content-between
              b-button(
                v-b-toggle.tech-collapse
                variant="link"
                class="text-muted small p-0 text-decoration-none"
              )
                lah-fa-icon(:icon="isTechOpen ? 'chevron-up' : 'chevron-down'" size="xs").mr-1
                span {{ isTechOpen ? '收合' : '展開' }} 詳細診斷報告 (供資訊人員排查使用)
              lah-button(
                v-if="isTechOpen"
                icon="copy"
                size="sm"
                variant="outline-secondary"
                no-border
                @click="copyDiagnosticInfo"
              ) 複製完整純文字報告

            b-collapse#tech-collapse.mt-3(v-model="isTechOpen")
              .tech-details-box.p-3.rounded.border.bg-dark.text-light
                .small
                  .row.mb-1
                    .col-sm-3.text-secondary HTTP Status:
                    .col-sm-9.text-warning {{ resolvedStatusCode }} ({{ statusTitle }})
                  .row.mb-1
                    .col-sm-3.text-secondary Error Message:
                    .col-sm-9.text-white {{ message }}
                  .row.mb-1
                    .col-sm-3.text-secondary Request URL:
                    .col-sm-9.text-info {{ fullUrl || '-' }}
                  .row.mb-1
                    .col-sm-3.text-secondary Client IP:
                    .col-sm-9.text-white {{ clientIp }}
                  .row.mb-1
                    .col-sm-3.text-secondary User Account:
                    .col-sm-9.text-white {{ myid || 'None' }} ({{ myname || '訪客' }})
                  .row.mb-1
                    .col-sm-3.text-secondary Department:
                    .col-sm-9.text-white {{ userUnitRole }}
                  .row.mb-1
                    .col-sm-3.text-secondary Office / Site:
                    .col-sm-9.text-white {{ siteName }} ({{ site }})
                  .row.mb-1
                    .col-sm-3.text-secondary API Endpoint:
                    .col-sm-9.text-white {{ apiQueryUrl }}
                  .row.mb-1
                    .col-sm-3.text-secondary Timestamp:
                    .col-sm-9.text-white {{ errorTime }}
                  .row.mb-1
                    .col-sm-3.text-secondary User Agent:
                    .col-sm-9.text-white.text-break {{ userAgent }}
</template>

<script>
import isEmpty from 'lodash/isEmpty'

export default {
  asyncData ({ store, redirect, error, query, from }) {
    const lastMsg = store.getters.lastMessage
    const errMessage = (error && typeof error === 'object' && error.message) || ''
    const qMsg = (query && (query.message || query.msg)) || ''
    const qCode = (query && (query.code || query.statusCode || query.status)) || ''

    if (isEmpty(lastMsg) && isEmpty(errMessage) && isEmpty(qMsg) && isEmpty(qCode)) {
      return redirect('/')
    }

    const statusCode = parseInt(qCode) || (error && error.statusCode) || 499
    const errObj = {
      statusCode,
      message: qMsg || errMessage || lastMsg || '發生未預期的系統問題'
    }
    const fromPath = (query && query.from) || (from ? from.fullPath : '') || ''

    return {
      error: errObj,
      fromPath
    }
  },
  data: () => ({
    errorTime: '',
    userAgent: '',
    fullUrl: '',
    targetPath: '',
    isTechOpen: false
  }),
  head () {
    return {
      title: `${this.resolvedStatusCode} 錯誤訊息 - 桃園市地政局`
    }
  },
  computed: {
    message () {
      return this.lastMessage || this.error?.message || (this.$route?.query && (this.$route.query.message || this.$route.query.msg)) || '發生未預期的系統問題'
    },
    resolvedStatusCode () {
      return parseInt(this.error?.statusCode) || 499
    },
    statusColorVariant () {
      const code = this.resolvedStatusCode
      if (code >= 500) { return 'danger' }
      if (code === 403 || code === 401) { return 'warning' }
      if (code === 404) { return 'info' }
      return 'danger'
    },
    statusIcon () {
      const code = this.resolvedStatusCode
      if (code >= 500) { return 'server' }
      if (code === 403 || code === 401) { return 'lock' }
      if (code === 404) { return 'compass' }
      return 'triangle-exclamation'
    },
    statusTitle () {
      const code = this.resolvedStatusCode
      switch (code) {
        case 400: return '錯誤的請求 (Bad Request)'
        case 401: return '身分未授權 (Unauthorized)'
        case 403: return '存取權限受限 (Forbidden)'
        case 404: return '找不到指定頁面 (Not Found)'
        case 408: return '請求作業逾時 (Request Timeout)'
        case 499: return '系統檢核限制 (Restriction)'
        case 500: return '伺服器內部錯誤 (Internal Error)'
        case 502: return '伺服器閘道異常 (Bad Gateway)'
        case 503: return '系統服務暫停 (Service Unavailable)'
        case 504: return '閘道逾時連線失敗 (Gateway Timeout)'
        default: return '系統作業警示 (Warning)'
      }
    },
    statusDescription () {
      const code = this.resolvedStatusCode
      switch (code) {
        case 401:
        case 403:
          return '系統尚未授權此項存取操作，可能因連線 IP 尚未綁定帳號、未登入或未具備該功能權限。'
        case 404:
          return '您所要求的頁面路徑不存在或已被搬移，請確認網址或回首頁重新操作。'
        case 499:
          return '未通過系統業務前置檢核條件（如 IP 帳號對應、指定審查身分或逾期管制）。'
        case 500:
        case 502:
        case 503:
        case 504:
          return '伺服器或資料庫服務目前無法完成請求，請確認網路連線或稍候重試。'
        default:
          return '系統在處理請求時發生異常，請參考下方錯誤描述與建議排除步驟。'
      }
    },
    clientIp () {
      return this.ip || (process.client && location.hostname !== 'localhost' ? location.hostname : '') || '127.0.0.1'
    },
    userDisplayName () {
      if (this.myid && this.myname) {
        return `${this.myname} (${this.myid})`
      }
      if (this.myname) {
        return this.myname
      }
      if (this.myid) {
        return this.myid
      }
      return '未登入 / 訪客'
    },
    userUnitRole () {
      const unit = this.myinfo?.unit || '未設定課室'
      const roles = []
      if (this.authority?.isAdmin) {
        roles.push('管理者')
      }
      if (this.authority?.isChief) {
        roles.push('主管')
      }
      return roles.length > 0 ? `${unit} [${roles.join(', ')}]` : unit
    },
    displayPath () {
      return this.targetPath || this.fromPath || (this.$route?.query && this.$route.query.from) || '未提供特定路徑'
    },
    isIpRelatedError () {
      const msg = (this.message || '').toLowerCase()
      return msg.includes('ip') || msg.includes('帳號對應') || msg.includes('使用者身分') || this.resolvedStatusCode === 403
    }
  },
  mounted () {
    this.errorTime = this.$utils.now()
    this.userAgent = navigator.userAgent
    this.fullUrl = window.location.href
    if (!this.targetPath) {
      if (this.fromPath) {
        this.targetPath = this.fromPath
      } else if (document.referrer) {
        try {
          const refUrl = new URL(document.referrer)
          this.targetPath = refUrl.pathname + refUrl.search
        } catch (e) {
          this.targetPath = document.referrer
        }
      }
    }
  },
  methods: {
    clearFECache () {
      this.confirm('請確認要清除快取資料？').then((ans) => {
        ans && this.clearCache() && this.notify('清除完成，3秒後自動整理頁面。') && this.timeout(() => location.reload(), 3000)
      })
    },
    goBack () {
      if (process.client) {
        if (window.history.length > 1) {
          this.$router.go(-1)
        } else {
          this.$router.push('/')
        }
      }
    },
    reloadPage () {
      if (process.client) {
        location.reload()
      }
    },
    copyIp () {
      this.copyToClipboard(this.clientIp, '已複製用戶端 IP 至剪貼簿')
    },
    copyMessage () {
      this.copyToClipboard(this.message, '已複製錯誤訊息至剪貼簿')
    },
    copyDiagnosticInfo () {
      const lines = [
        '【地政入口網 系統錯誤診斷報告】',
        `■ 狀態代碼：${this.resolvedStatusCode} (${this.statusTitle})`,
        `■ 錯誤訊息：${this.message}`,
        `■ 發生時間：${this.errorTime || this.$utils.now()}`,
        `■ 用戶端 IP：${this.clientIp}`,
        `■ 使用者帳號：${this.userDisplayName}`,
        `■ 所屬課室/角色：${this.userUnitRole}`,
        `■ 所別代碼：${this.siteName} (${this.site})`,
        `■ 來源/目標路徑：${this.displayPath}`,
        `■ 後端 API 端點：${this.apiQueryUrl}`,
        `■ 瀏覽器環境：${this.userAgent || (process.client ? navigator.userAgent : '')}`
      ]
      this.copyToClipboard(lines.join('\n'), '已複製完整診斷報告至剪貼簿，可直接貼給資訊人員！')
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-error-container {
  max-width: 960px;
}

.error-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.hero-icon-box {
  width: 72px;
  height: 72px;
  min-width: 72px;
  border-radius: 50%;
}

.bg-danger-subtle {
  background-color: rgba(220, 53, 69, 0.12);
}

.bg-warning-subtle {
  background-color: rgba(255, 193, 7, 0.16);
}

.bg-info-subtle {
  background-color: rgba(23, 162, 184, 0.14);
}

.error-quote-box {
  background-color: #fff8f8;
  border-left: 4px solid #dc3545;
  box-shadow: inset 0 0 0 1px rgba(220, 53, 69, 0.08);

  .message-content {
    word-break: break-word;
    line-height: 1.6;
  }
}

.diagnostics-grid {
  .diag-item {
    transition: background-color 0.2s, box-shadow 0.2s;
    &:hover {
      background-color: #f1f3f5 !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
  }
}

.tech-details-box {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  background-color: #212529;
}
</style>
