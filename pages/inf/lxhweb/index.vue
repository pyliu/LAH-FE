<template lang="pug">
div(v-cloak :class="{'dark-noc-mode': isDarkMode, 'fullscreen-active': isFullscreen}")
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100.my-auto
        .d-flex.align-items-center
          .my-auto.font-weight-bold.text-nowrap
            | 同步異動資料庫監控
          b-badge.ml-2.header-item-48.d-flex.align-items-center(:variant="globalHealthVariant" pill)
            lah-fa-icon(:icon="globalHealthIcon")
            span.ml-1 {{ globalHealthText }}
          b-badge.ml-2.header-item-48.d-none.d-xl-flex.align-items-center(
            v-if="worstLagInfo"
            :variant="worstLagVariant"
            pill
            :title="`全域最慢同步：${worstLagInfo.desc}`"
          )
            lah-fa-icon(icon="clock")
            span.ml-1 最慢：{{ worstLagInfo.desc }}
        .d-flex.align-items-center
          b-badge.header-item-48.d-flex.align-items-center.mr-1(
            variant="light"
            title="自動重新整理倒數計時"
          )
            lah-fa-icon(icon="stopwatch")
            span.ml-1 {{ countdownFormatted }}
          lah-button.header-item-48(
            :icon="enableVoice ? 'volume-up' : 'volume-mute'"
            :variant="enableVoice ? 'primary' : 'outline-secondary'"
            :title="enableVoice ? '智慧語音播報：已開啟 (點擊關閉)' : '智慧語音播報：已靜音 (點擊開啟)'"
            no-icon-gutter
            @click="toggleVoice"
          )
          lah-button.header-item-48.ml-1(
            :icon="isDarkMode ? 'sun' : 'moon'"
            :variant="isDarkMode ? 'warning' : 'outline-dark'"
            :title="isDarkMode ? '切換為明亮模式' : '切換為戰情深色模式'"
            no-icon-gutter
            @click="toggleDarkMode"
          )
          lah-button.header-item-48.ml-1(
            :icon="isFullscreen ? 'compress' : 'expand'"
            variant="outline-secondary"
            :title="isFullscreen ? '結束全螢幕' : '全螢幕看板模式'"
            no-icon-gutter
            @click="toggleFullscreen"
          )
          lah-button.header-item-48.ml-1(
            icon="sync-alt"
            action="ld-cycle"
            :disabled="isBusy"
            :busy="isBusy"
            title="全部重新讀取"
            variant="outline-secondary"
            no-icon-gutter
            @click="reload"
          )
          lah-button.header-item-48.ml-1(
            v-b-modal.help-modal
            icon="info"
            variant="outline-success"
            no-border
            no-icon-gutter
            title="說明"
          )
  lah-help-modal(:modal-id="'help-modal'" size="md" modal-title="同步異動資料庫監控說明")
    h6.my-2
      i.fa.fa-circle.text-danger.fa-lg.mr-2
      | 已超過半小時未更新（嚴重延遲）
    h6.my-2
      i.fa.fa-circle.text-warning.fa-lg.mr-2
      | 已超過15分鐘未更新（延遲警告）
    h6.my-2
      i.fa.fa-circle.text-success.fa-lg.mr-2
      | 15分鐘內更新（正常同步）
    hr
    h6.font-weight-bold 大螢幕戰情室特色功能：
    ul.pl-3
      li ⚡ <strong>Oracle Listener 延遲監控</strong>：每台主機卡片標題即時顯示連線 Ping 毫秒數。
      li 🔍 <strong>資料表下鑽查詢</strong>：點擊任一事務所方塊，可即時查看該所所有 Table 的同步快照時間。
      li 📢 <strong>智慧語音播報</strong>：若偵測到超過 30 分鐘延遲或資料表損毀，自動合成中文語音警報（可隨時靜音）。
      li 🌓 <strong>戰情深色模式</strong>：一鍵切換沉浸式高對比科技深黑風格，適合電視牆長時間投放不刺眼。
      li ⛶ <strong>全螢幕切換</strong>：一鍵隱藏網頁邊框以最大化空間投影。

  b-container(v-cloak fluid :class="{'fullscreen-mode': isFullscreen}")
    b-card-group.row(deck)
      lah-monitor-board-lxhweb(
        ref="lxhweb3"
        target-ip="L1HWEB_Alt"
        display-update-time
        display-update-time-to-now
        @board-update="handleBoardUpdate"
      )
      lah-monitor-board-lxhweb(
        ref="lxhweb4"
        target-ip="L3HWEB"
        display-update-time
        display-update-time-to-now
        @board-update="handleBoardUpdate"
      )
    b-card-group.row(deck)
      lah-monitor-board-lxhweb(
        ref="lxhweb1"
        target-ip="L1HWEB"
        display-update-time
        display-update-time-to-now
        @board-update="handleBoardUpdate"
      )
      lah-monitor-board-lxhweb(
        ref="lxhweb2"
        target-ip="L2HWEB"
        display-update-time
        display-update-time-to-now
        @board-update="handleBoardUpdate"
      )
</template>

<script>
export default {
  middleware: ['isInf'],
  fetchOnServer: true,
  data: () => ({
    isDarkMode: false,
    isFullscreen: false,
    enableVoice: true,
    countdown: 300,
    countdownTimer: null,
    boardsData: {},
    alertedItems: {}
  }),
  head: {
    title: '同步異動資料庫監控-桃園市地政局'
  },
  computed: {
    countdownFormatted () {
      const m = Math.floor(this.countdown / 60)
      const s = this.countdown % 60
      return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
    },
    globalHealth () {
      const boards = Object.values(this.boardsData)
      if (boards.length === 0) { return 'normal' }
      let hasWarning = false
      for (const b of boards) {
        if (b.brokenCount > 0 || b.headerLight === 'danger') {
          return 'danger'
        }
        if (b.headerLight === 'warning') {
          hasWarning = true
        }
      }
      return hasWarning ? 'warning' : 'success'
    },
    globalHealthVariant () {
      switch (this.globalHealth) {
        case 'danger': return 'danger'
        case 'warning': return 'warning'
        default: return 'success'
      }
    },
    globalHealthIcon () {
      switch (this.globalHealth) {
        case 'danger': return 'exclamation-circle'
        case 'warning': return 'exclamation-triangle'
        default: return 'check-circle'
      }
    },
    globalHealthText () {
      switch (this.globalHealth) {
        case 'danger': return '嚴重延遲'
        case 'warning': return '延遲警告'
        default: return '全部正常'
      }
    },
    worstLagInfo () {
      let maxOffset = 0
      let worst = null
      const now = +new Date()
      for (const b of Object.values(this.boardsData)) {
        if (!b.offices) { continue }
        for (const office of b.offices) {
          if (!office.UPDATE_DATETIME) { continue }
          const time = +new Date(office.UPDATE_DATETIME.replace(' ', 'T'))
          const offset = now - time
          if (offset > maxOffset) {
            maxOffset = offset
            worst = {
              site: office.SITE,
              name: this.getOfficeName(office.SITE),
              targetIp: b.targetIp,
              offset,
              mins: Math.round(offset / 60000),
              desc: `${b.targetIp} ${this.getOfficeName(office.SITE)} (${Math.round(offset / 60000)}分前)`
            }
          }
        }
      }
      return worst
    },
    worstLagVariant () {
      if (!this.worstLagInfo) { return 'secondary' }
      if (this.worstLagInfo.mins >= 30) { return 'danger' }
      if (this.worstLagInfo.mins >= 15) { return 'warning' }
      return 'success'
    }
  },
  mounted () {
    const darkPref = localStorage.getItem('lxhweb_dark_mode')
    if (darkPref !== null) {
      this.isDarkMode = darkPref === 'true'
    }
    const voicePref = localStorage.getItem('lxhweb_voice')
    if (voicePref !== null) {
      this.enableVoice = voicePref === 'true'
    }
    this.onFullscreenChange = () => {
      this.isFullscreen = !!document.fullscreenElement
    }
    document.addEventListener('fullscreenchange', this.onFullscreenChange)
    this.startCountdown()
  },
  beforeDestroy () {
    clearInterval(this.countdownTimer)
    if (this.onFullscreenChange) {
      document.removeEventListener('fullscreenchange', this.onFullscreenChange)
    }
  },
  methods: {
    handleBoardUpdate (payload) {
      this.$set(this.boardsData, payload.targetIp, payload)
      if (this.enableVoice) {
        this.checkAndSpeakAlerts(payload)
      }
    },
    checkAndSpeakAlerts (board) {
      const now = +new Date()
      // 損毀表格告警
      if (board.brokenCount > 0) {
        const brokenKey = `${board.targetIp}_broken`
        if (!this.alertedItems[brokenKey] || (now - this.alertedItems[brokenKey] > 10 * 60 * 1000)) {
          this.speak(`警告，${board.header} 偵測到 ${board.brokenCount} 個損毀資料表`)
          this.alertedItems[brokenKey] = now
        }
      }
      // 延遲超過 30 分鐘告警
      if (board.offices && board.offices.length) {
        board.offices.forEach((entry) => {
          if (!entry.UPDATE_DATETIME) { return }
          const updateTime = +new Date(entry.UPDATE_DATETIME.replace(' ', 'T'))
          const diffMins = Math.round((now - updateTime) / (60 * 1000))
          if (diffMins >= 30) {
            const key = `${board.targetIp}_${entry.SITE}_danger`
            if (!this.alertedItems[key] || (now - this.alertedItems[key] > 15 * 60 * 1000)) {
              const siteName = this.getOfficeName(entry.SITE)
              this.speak(`注意，${board.targetIp} ${siteName} 同步延遲超過 ${diffMins} 分鐘`)
              this.alertedItems[key] = now
            }
          }
        })
      }
    },
    speak (text) {
      if (!this.enableVoice || !process.client || !('speechSynthesis' in window)) { return }
      try {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'zh-TW'
        utterance.rate = 1.0
        utterance.pitch = 1.0
        window.speechSynthesis.speak(utterance)
      } catch (e) {
        console.warn('語音合成錯誤:', e)
      }
    },
    toggleVoice () {
      this.enableVoice = !this.enableVoice
      if (process.client) {
        localStorage.setItem('lxhweb_voice', String(this.enableVoice))
        if (this.enableVoice) {
          this.speak('語音播報已開啟')
        }
      }
    },
    toggleDarkMode () {
      this.isDarkMode = !this.isDarkMode
      if (process.client) {
        localStorage.setItem('lxhweb_dark_mode', String(this.isDarkMode))
      }
    },
    toggleFullscreen () {
      if (!process.client) { return }
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          this.isFullscreen = true
        }).catch((err) => {
          this.$utils.warn('無法進入全螢幕模式', err)
        })
      } else if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          this.isFullscreen = false
        })
      }
    },
    startCountdown () {
      this.countdown = 300
      clearInterval(this.countdownTimer)
      this.countdownTimer = setInterval(() => {
        if (this.countdown > 1) {
          this.countdown--
        } else {
          this.reload()
        }
      }, 1000)
    },
    reload () {
      this.countdown = 300
      if (this.$refs.lxhweb1?.ping) { this.$refs.lxhweb1.ping() }
      if (this.$refs.lxhweb2?.ping) { this.$refs.lxhweb2.ping() }
      if (this.$refs.lxhweb3?.ping) { this.$refs.lxhweb3.ping() }
      if (this.$refs.lxhweb4?.ping) { this.$refs.lxhweb4.ping() }
    },
    getOfficeName (code) {
      const officeMap = {
        HA: '桃園',
        HB: '中壢',
        HC: '大溪',
        HD: '楊梅',
        HE: '蘆竹',
        HF: '八德',
        HG: '平鎮',
        HH: '龜山'
      }
      return officeMap[code] || code
    }
  }
}
</script>

<style lang="scss" scoped>
.header-item-48 {
  height: 48px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 1rem;
  padding-left: 14px !important;
  padding-right: 14px !important;
}

.row {
  height: 42.5vh !important;
}

.fullscreen-mode .row {
  height: calc(49vh - 45px) !important;
}

.card-deck .card {
  margin: 5px;
}

/* 戰情深色模式 (Dark NOC Mode) */
.dark-noc-mode {
  background-color: #0b0f19 !important;
  color: #e2e8f0 !important;
  min-height: 100vh;
  transition: background-color 0.3s ease;

  ::v-deep .card {
    background-color: #151b2b !important;
    border-color: #2a3449 !important;
    color: #e2e8f0 !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);

    .card-header {
      background-color: #1e2638 !important;
      border-bottom-color: #2a3449 !important;
      color: #ffffff !important;
    }
  }

  ::v-deep .office {
    background-color: #1b2336 !important;
    border-color: #2e3a52 !important;
    color: #e2e8f0 !important;

    .office-name {
      color: #ffffff !important;
    }

    &:hover {
      background-color: #222d44 !important;
      box-shadow: 0 4px 15px rgba(0, 150, 255, 0.25) !important;
    }

    &.border-danger-glow {
      border-color: #ff4d4f !important;
      box-shadow: 0 0 15px rgba(255, 77, 79, 0.6) !important;
      background-color: rgba(255, 77, 79, 0.12) !important;
    }

    &.border-warning-glow {
      border-color: #faad14 !important;
      box-shadow: 0 0 12px rgba(250, 173, 20, 0.5) !important;
      background-color: rgba(250, 173, 20, 0.12) !important;
    }
  }
}
</style>
