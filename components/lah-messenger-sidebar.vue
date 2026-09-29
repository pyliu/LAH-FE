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
              class="text-white p-1 mr-2 text-decoration-none"
              title="前往即時通完整管理頁面"
              to="/notification/message"
            )
              b-icon(icon="box-arrow-up-right")
            b-button(
              variant="link"
              class="text-white p-1 text-decoration-none"
              title="收合側邊欄"
              @click="closeSidebar()"
            )
              b-icon(icon="chevron-right" font-scale="1.2")

        //- 側邊欄主體：嵌入 lah-messenger-main
        .sidebar-body.flex-grow-1.overflow-hidden
          lah-messenger-main(
            ref="messengerMain"
            embedded
            height="100%"
            @new-message="onNewMessage"
          )

    //- 3. 右下角新訊息提示浮標 (半透明卡片，點選後帶出主視窗)
    transition(name="slide-up")
      .floating-message-chip(
        v-if="showFloatingToast && latestNotification"
        @click="onFloatingToastClick"
        @mouseenter="pauseToastTimer"
        @mouseleave="resumeToastTimer"
        title="點選查看訊息"
      )
        .chip-header.d-flex.justify-content-between.align-items-center.mb-1
          .d-flex.align-items-center
            b-badge.mr-1(variant="warning") 💬 新訊息
            span.chip-channel.text-info \#{{ latestNotification.channelName }}
          b-button.close-btn(
            variant="link"
            size="sm"
            @click.stop="dismissFloatingToast"
            title="關閉提示"
          )
            b-icon(icon="x")
        .chip-body
          .chip-sender.font-weight-bold.text-light {{ latestNotification.senderName }}：
          .chip-text.text-white-50 {{ latestNotification.summary }}
        .chip-footer.mt-1.text-right
          span.s-75.text-primary 點選立即查看 →
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerMain from '~/components/lah-messenger-main.vue'

export default {
  name: 'LahMessengerSidebar',
  components: {
    LahMessengerMain
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
      return (
        this.$route.path === '/notification/message' ||
        this.$route.path.startsWith('/notification/message/') ||
        this.$route.path === '/message' ||
        this.$route.path.startsWith('/message/')
      )
    },
    showHandle () {
      return !this.visible
    },
    displayTotalUnread () {
      return this.totalUnread > 99 ? '99+' : this.totalUnread
    }
  },
  watch: {
    visible (newVal) {
      if (newVal) {
        // 開啟 sidebar 時關閉右下角提示浮標
        this.dismissFloatingToast()
        this.$nextTick(() => {
          if (this.$refs.messengerMain?.updateChannelLastReadId) {
            this.$refs.messengerMain.updateChannelLastReadId(this.currentChannel)
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
        if (this.$refs.messengerMain?.updateChannelLastReadId) {
          this.$refs.messengerMain.updateChannelLastReadId(targetChannel)
        }
      })
    },
    closeSidebar () {
      this.visible = false
    },
    onNewMessage (payload) {
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

      this.latestNotification = {
        sender: payload.sender,
        senderName: payload.senderName || payload.sender,
        channel: payload.channel,
        channelName: payload.channelName || payload.channel,
        summary
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

  /* 平常狀態：半透明、緊貼右側邊界 */
  opacity: 0.45;
  background: rgba(33, 37, 41, 0.85);
  backdrop-filter: blur(8px);
  color: #ffffff;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-right: none;
  box-shadow: -2px 4px 16px rgba(0, 0, 0, 0.25);
  padding: 10px 6px 10px 10px;
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);

  .handle-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .handle-icon-arrow {
    display: none;
    font-size: 1.1rem;
    color: #5bc0de;
    animation: bounceLeft 1.2s infinite ease-in-out;
  }

  .handle-icon-chat {
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

  /* 滑鼠 Hover 狀態：高亮、向左微幅展開、顯示向左拉開箭頭 */
  &:hover {
    opacity: 1;
    transform: translateY(-50%) translateX(-4px);
    background: rgba(20, 25, 34, 0.95);
    box-shadow: -4px 6px 20px rgba(0, 0, 0, 0.4);
    padding-left: 12px;

    .handle-icon-arrow {
      display: inline-block;
    }

    .handle-icon-chat {
      color: #5bc0de;
    }
  }

  /* 當有新未讀訊息時的呼吸燈效果 */
  &.has-unread {
    opacity: 0.85;
    background: rgba(40, 20, 25, 0.9);
    border-color: rgba(220, 53, 69, 0.5);

    &:hover {
      opacity: 1;
    }
  }
}

@keyframes bounceLeft {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-3px);
  }
}

/* ========================================================================= */
/* 2. 側邊欄本體與 Header                                                    */
/* ========================================================================= */
.sidebar-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

.sidebar-body {
  position: relative;
  background-color: #f8f9fa;

  ::v-deep img {
    max-width: 100% !important;
    height: auto !important;
  }
}

/* ========================================================================= */
/* 3. 右下角新訊息提示浮標 (Floating Message Chip)                           */
/* ========================================================================= */
.floating-message-chip {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1055;
  width: 320px;
  max-width: calc(100vw - 48px);
  cursor: pointer;

  /* 半透明玻璃擬態風格 */
  background: rgba(24, 30, 42, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
  padding: 12px 14px;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
    background: rgba(18, 24, 36, 0.96);
    border-color: rgba(91, 192, 222, 0.5);
  }

  .chip-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 4px;
  }

  .chip-channel {
    font-size: 0.8rem;
    font-weight: 600;
  }

  .close-btn {
    color: rgba(255, 255, 255, 0.6);
    padding: 0;
    line-height: 1;

    &:hover {
      color: #fff;
    }
  }

  .chip-body {
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .chip-sender {
    color: #e2e8f0;
  }

  .chip-text {
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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
  .floating-message-chip {
    right: 12px;
    bottom: 12px;
    width: calc(100vw - 24px);
  }
}
</style>
