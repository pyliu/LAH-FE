<template lang="pug">
client-only
  .lah-messenger-sidebar-wrapper
    //- 1. 平常置於 Viewport 右側邊角的觸發按鈕 (半透明、Hover 展開箭頭)
    transition(name="fade")
      .sidebar-edge-handle(
        v-if="showHandle"
        @click="openSidebar()"
        title="點選展開即時通"
        :class="{ 'has-unread': totalUnread > 0 }"
      )
        .handle-content
          .handle-icon-slot
            b-icon.handle-icon-arrow(icon="chevron-left")
            b-icon.handle-icon-chat(icon="chat-dots-fill")
          span.handle-text 即時通
          b-badge.handle-badge(
            v-if="totalUnread > 0"
            variant="danger"
            pill
          ) {{ displayTotalUnread }}

    //- 2. 側邊欄主視窗 (從畫面右側往左展開)
    b-sidebar(
      id="lah-messenger-sidebar"
      v-model="visible"
      right
      shadow="lg"
      backdrop
      no-header
      no-close-on-route-change
      width="480px"
      sidebar-class="lah-messenger-sidebar-custom"
      body-class="p-0 d-flex flex-column h-100 overflow-hidden"
    )
      template(#default)
        //- 自訂側邊欄頂部列
        .sidebar-header.d-flex.justify-content-between.align-items-center.px-3.py-2.bg-primary.text-white.shadow-sm
          .d-flex.align-items-center
            b-icon.mr-2(icon="chat-square-dots-fill")
            span.font-weight-bold.h6.mb-0 即時通訊
            b-badge.ml-2(
              v-if="totalUnread > 0"
              variant="danger"
              pill
            ) {{ displayTotalUnread }} 未讀
          .d-flex.align-items-center
            b-button(
              variant="link"
              class="text-white p-1 mr-2 text-decoration-none header-action-btn"
              title="前往即時通儀表板"
              to="/websocket"
              @click="closeSidebar()"
            )
              font-awesome-icon(:icon="['fas', 'tachometer-alt']" size="lg")
            b-button(
              variant="link"
              class="text-white p-1 text-decoration-none header-action-btn"
              title="收合側邊欄"
              @click="closeSidebar()"
            )
              b-icon(icon="chevron-right" font-scale="1.2")

        //- 側邊欄主體：嵌入 lah-messenger-home
        .sidebar-body.flex-grow-1.overflow-hidden
          lah-messenger-home(
            ref="messengerHome"
            embedded
            height="100%"
            @new-message="onNewMessage"
          )

    //- 3. 右下角新訊息提示 (還原系統 Toast 樣式，點選後帶出主視窗)
    transition(name="slide-up")
      .toast.fade.show.floating-message-toast(
        v-if="!hideSidebarVisuals && showFloatingToast && latestNotification"
        :class="latestNotification.isAnnouncement ? 'toast-variant-warning' : 'toast-variant-primary'"
        @click="onFloatingToastClick"
        @mouseenter="pauseToastTimer"
        @mouseleave="resumeToastTimer"
        title="點選查看訊息"
      )
        .toast-header.py-1.px-2.d-flex.align-items-center
          b-badge.mr-1.px-1.py-1(
            :variant="latestNotification.isAnnouncement ? 'warning' : 'primary'"
          ) {{ latestNotification.isAnnouncement ? '📢 公告' : '💬 即時通' }}
          strong.mr-auto.text-truncate.text-dark(
            style="max-width: 140px;"
            :title="latestNotification.channelName"
          ) \#{{ latestNotification.channelName }}
          small.text-muted.text-nowrap.mr-2 {{ latestNotification.timeText }}
          b-button.close-btn(
            variant="link"
            size="sm"
            @click.stop="dismissFloatingToast"
            title="關閉提示"
          )
            b-icon(icon="x")
        .toast-body.py-2.px-2
          .toast-sender.font-weight-bold.text-dark.mb-1 {{ latestNotification.senderName }}：
          .toast-text.text-secondary.text-break {{ latestNotification.summary }}
        .toast-footer.px-2.pb-2.pt-1.text-right
          span.s-75.text-primary 點選立即查看 →
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerHome from '~/components/lah-messenger-home.vue'

export default {
  name: 'LahMessengerSidebar',
  components: {
    LahMessengerHome
  },
  mixins: [lahMessengerBase],
  data () {
    return {
      visible: false,
      showFloatingToast: false,
      latestNotification: null,
      toastTimer: null,
      remainingSeconds: 8
    }
  },
  computed: {
    isMessagePage () {
      const path = this.$route?.path || ''
      return (
        path === '/notification/message' ||
        path.startsWith('/notification/message/') ||
        path === '/message' ||
        path.startsWith('/message/')
      )
    },
    isWebsocketPage () {
      const path = (this.$route?.path || '').toLowerCase()
      return (
        path === '/websocket' ||
        path.startsWith('/websocket/') ||
        path === '/pages/websocket' ||
        path.startsWith('/pages/websocket/') ||
        path.includes('websocket')
      )
    },
    hideSidebarVisuals () {
      return Boolean(this.isWebsocketPage || this.isDashboardActive)
    },
    showHandle () {
      return !this.visible && !this.hideSidebarVisuals
    },
    displayTotalUnread () {
      return this.totalUnread > 99 ? '99+' : this.totalUnread
    }
  },
  watch: {
    $route: {
      immediate: true,
      handler () {
        if (this.hideSidebarVisuals) {
          this.visible = false
          this.dismissFloatingToast()
        }
      }
    },
    hideSidebarVisuals (val) {
      if (val) {
        this.visible = false
        this.dismissFloatingToast()
      }
    },
    visible (newVal) {
      if (newVal && this.hideSidebarVisuals) {
        this.$nextTick(() => {
          this.visible = false
        })
        return
      }
      if (newVal) {
        // 開啟 sidebar 時關閉右下角提示浮標
        this.dismissFloatingToast()
        this.$nextTick(() => {
          if (this.$refs.messengerHome?.updateChannelLastReadId) {
            this.$refs.messengerHome.updateChannelLastReadId(this.currentChannel)
          }
        })
      }
    }
  },
  mounted () {
    this.$root.$on('open-messenger-sidebar', this.openSidebar)
  },
  beforeDestroy () {
    this.$root.$off('open-messenger-sidebar', this.openSidebar)
    this.clearToastTimer()
  },
  methods: {
    openSidebar (channel) {
      if (this.hideSidebarVisuals) {
        return
      }
      const targetChannel = channel || this.currentChannel
      if (targetChannel) {
        this.$store.commit('currentChannel', targetChannel)
        this.$store.commit('resetUnread', targetChannel)
        if (targetChannel === 'announcement' && this.userdept) {
          this.$store.commit('resetUnread', `announcement_${this.userdept}`)
        }
      }
      this.visible = true
      this.$nextTick(() => {
        if (this.$refs.messengerHome?.switchChannel) {
          this.$refs.messengerHome.switchChannel(targetChannel)
        }
        if (this.$refs.messengerHome?.updateChannelLastReadId) {
          this.$refs.messengerHome.updateChannelLastReadId(targetChannel)
        }
      })
    },
    closeSidebar () {
      this.visible = false
    },
    onNewMessage (payload) {
      if (!payload || !this.isChannelAllowed(payload.channel)) {
        return
      }
      const now = this.$utils ? this.$utils.now() : ''
      const timeText = now ? now.split(' ')[1] : new Date().toTimeString().split(' ')[0]
      const dateText = now ? now.split(' ')[0] : new Date().toISOString().split('T')[0]

      if (payload && this.$store) {
        try {
          const channelName = payload.channelName || payload.channel || '即時通'
          const senderName = payload.senderName || payload.sender || '系統'
          this.$store.commit('addMessageMemento', {
            id: `msg_${payload.id || (+new Date() + '_' + Math.random().toString(36).substring(2, 7))}`,
            timestamp: +new Date(),
            timeText,
            dateText,
            category: 'messenger',
            variant: payload.channel === 'announcement' ? 'warning' : 'primary',
            title: `💬 [${channelName}] ${senderName}`,
            sender: payload.sender,
            senderName,
            channel: payload.channel,
            channelName,
            message: payload.fullText || '[圖片或多媒體訊息]',
            read: false
          })
        } catch (e) {
          console.warn('紀錄即時通訊息失敗', e)
        }
      }

      // 若處於隱藏側邊欄視覺效果之頁面 (如 websocket 儀表板)，不彈出右下角提示
      if (this.hideSidebarVisuals) {
        return
      }
      // 若 sidebar 已經打開中，不需要額外彈出右下角浮標
      if (this.visible) {
        return
      }

      // 截斷摘要文字避免過長，若無純文字（例如純圖片）則提供預設摘要
      let summary = payload.fullText || ''
      if (!summary) {
        summary = '[圖片或多媒體訊息]'
      } else if (summary.length > 50) {
        summary = summary.substring(0, 50) + '...'
      }

      const isAnnouncement = payload.channel === 'announcement' || (typeof payload.channel === 'string' && payload.channel.startsWith('announcement_'))

      this.latestNotification = {
        sender: payload.sender,
        senderName: payload.senderName || payload.sender,
        channel: payload.channel,
        channelName: payload.channelName || payload.channel,
        summary,
        timeText,
        isAnnouncement
      }
      this.showFloatingToast = true
      this.startToastTimer()
    },
    onFloatingToastClick () {
      if (this.latestNotification) {
        this.openSidebar(this.latestNotification.channel)
      } else {
        this.openSidebar()
      }
      this.dismissFloatingToast()
    },
    dismissFloatingToast () {
      this.showFloatingToast = false
      this.clearToastTimer()
    },
    startToastTimer () {
      this.clearToastTimer()
      this.toastTimer = setTimeout(() => {
        this.showFloatingToast = false
      }, 9000)
    },
    pauseToastTimer () {
      this.clearToastTimer()
    },
    resumeToastTimer () {
      this.startToastTimer()
    },
    clearToastTimer () {
      if (this.toastTimer) {
        clearTimeout(this.toastTimer)
        this.toastTimer = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
/* ========================================================================= */
/* 1. Viewport 右側邊緣觸發手把 (Side Edge Handle)                           */
/* ========================================================================= */
.sidebar-edge-handle {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1040;
  cursor: pointer;
  user-select: none;

  /* 防抖關鍵 1: 外層定位與熱區穩定，預留向左與上下的隱形感應緩衝區 */
  padding: 14px 0 14px 16px;
  margin: 0;
  border: none;
  background: transparent;

  .handle-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    position: relative;

    /* 平常狀態：半透明、緊貼右側邊界 */
    opacity: 0.5;
    background: rgba(33, 37, 41, 0.88);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #ffffff;
    border-top-left-radius: 20px;
    border-bottom-left-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-right: none;
    box-shadow: -2px 4px 14px rgba(0, 0, 0, 0.25);
    padding: 10px 6px 10px 10px;
    box-sizing: border-box;

    /* 防抖關鍵 2: 尺寸完全固定，僅對 transform 與外觀樣式做平滑過渡，不引發 Layout 重排 */
    transition: transform 0.24s cubic-bezier(0.2, 0, 0.2, 1),
                opacity 0.24s ease,
                background 0.24s ease,
                box-shadow 0.24s ease;
    will-change: transform, opacity;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;

    /* 防抖關鍵 3: 確保內層微幅左移時，右邊緣完全覆蓋至視窗邊界，無滑鼠死角縫隙 */
    &::after {
      content: '';
      position: absolute;
      right: -8px;
      top: -1px;
      bottom: -1px;
      width: 10px;
      background: inherit;
      pointer-events: none;
    }
  }

  /* 防抖關鍵 4: 圖示容器固定尺寸，兩圖示原地平滑交替，零高度跳動、零文字位移 */
  .handle-icon-slot {
    position: relative;
    width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .handle-icon-arrow,
  .handle-icon-chat {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .handle-icon-arrow {
    opacity: 0;
    transform: scale(0.6) translateX(4px);
    font-size: 1.15rem;
    color: #5bc0de;
    pointer-events: none;
  }

  .handle-icon-chat {
    opacity: 1;
    transform: scale(1);
    font-size: 1.2rem;
    color: #f8f9fa;
  }

  .handle-text {
    writing-mode: vertical-lr;
    letter-spacing: 2px;
    font-size: 0.78rem;
    font-weight: 500;
  }

  .handle-badge {
    font-size: 0.7rem;
    padding: 0.25em 0.5em;
    box-shadow: 0 0 6px rgba(220, 53, 69, 0.8);
  }

  /* 滑鼠 Hover 狀態：高亮、微幅向左展開、圖示平滑過渡為指向箭頭 */
  &:hover {
    .handle-content {
      opacity: 1;
      transform: translateX(-4px);
      background: rgba(20, 25, 34, 0.96);
      box-shadow: -4px 6px 20px rgba(0, 0, 0, 0.45);
    }

    .handle-icon-arrow {
      opacity: 1;
      transform: scale(1) translateX(0);
      animation: bounceLeft 1.2s infinite ease-in-out;
    }

    .handle-icon-chat {
      opacity: 0;
      transform: scale(0.6) translateX(-4px);
    }
  }

  /* 當有新未讀訊息時的呼吸燈效果 */
  &.has-unread {
    .handle-content {
      opacity: 0.88;
      background: rgba(45, 20, 26, 0.92);
      border-color: rgba(220, 53, 69, 0.5);
    }

    &:hover .handle-content {
      opacity: 1;
      background: rgba(55, 18, 25, 0.98);
    }
  }
}

@keyframes bounceLeft {
  0%, 100% {
    transform: scale(1) translateX(0);
  }
  50% {
    transform: scale(1) translateX(-3px);
  }
}

/* ========================================================================= */
/* 2. 側邊欄本體與 Header                                                    */
/* ========================================================================= */
.sidebar-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;

  .header-action-btn {
    opacity: 0.88;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:hover {
      opacity: 1;
      transform: scale(1.15);
      color: #ffffff !important;
    }
  }
}

.sidebar-body {
  position: relative;
  background-color: #f8f9fa;

  ::v-deep img {
    max-width: 100% !important;
    height: auto !important;
  }
}

::v-deep .b-sidebar-backdrop {
  /* 移除昂貴的全螢幕高斯模糊濾鏡 (backdrop-filter)，改採輕量高效純色半透明遮罩避免 GPU 掉幀 */
  background-color: rgba(15, 23, 42, 0.45) !important;
}

/* ========================================================================= */
/* 3. 右下角新訊息提示 (標準 Toast 風格浮動卡片)                             */
/* ========================================================================= */
.floating-message-toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1055;
  width: 320px;
  max-width: calc(100vw - 48px);
  cursor: pointer;

  /* 系統原生 Toast 質感：白底、邊框、4px 左側強調色條、細緻陰影 */
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-left-width: 4px;
  border-radius: 0.35rem;
  box-shadow: 0 0.35rem 1rem rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 0.5rem 1.25rem rgba(0, 0, 0, 0.2);

    .toast-footer span {
      text-decoration: underline;
    }
  }

  &.toast-variant-warning {
    border-left-color: #ffc107 !important;
  }

  &.toast-variant-primary {
    border-left-color: #007bff !important;
  }

  .toast-header {
    background-color: rgba(248, 249, 250, 0.95);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    font-size: 0.85rem;
  }

  .close-btn {
    color: #6c757d;
    padding: 0;
    line-height: 1;

    &:hover {
      color: #343a40;
    }
  }

  .toast-body {
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .toast-sender {
    color: #212529;
  }

  .toast-text {
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: #495057;
  }

  .toast-footer {
    border-top: 1px dashed rgba(0, 0, 0, 0.05);
    background-color: #fafbfc;
  }
}

/* ========================================================================= */
/* 4. 動畫效果                                                               */
/* ========================================================================= */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.slide-up-leave-active {
  transition: all 0.25s ease;
}
.slide-up-enter {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

@media (max-width: 576px) {
  .floating-message-toast {
    right: 12px;
    bottom: 12px;
    width: calc(100vw - 24px);
  }
}
</style>
