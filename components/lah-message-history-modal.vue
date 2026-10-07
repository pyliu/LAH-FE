<template lang="pug">
b-modal#lah-message-history-modal(
  ref="modal"
  v-model="visible"
  title="系統訊息紀錄"
  size="lg"
  scrollable
  no-close-on-backdrop
  hide-footer
  body-class="p-0 lah-message-history-modal-body"
  @shown="handleModalShown"
)
  template(#modal-title)
    .d-flex.align-items-center
      font-awesome-icon(:icon="['fas', 'clock-rotate-left']" class="mr-2 text-primary")
      span.font-weight-bold 系統訊息紀錄
      b-badge.ml-2(variant="secondary" pill) 共 {{ messageMemento.length }} 筆
      b-badge.ml-1(v-if="unreadCount > 0" variant="danger" pill) {{ unreadCount }} 未讀

  //- 頂部工具列 (分類篩選、關鍵字搜尋與一鍵清空)
  .history-toolbar.p-3.border-bottom.bg-light
    .d-flex.flex-wrap.justify-content-between.align-items-center.gap-2.mb-2
      //- 分類切換按鈕群
      b-button-group(size="sm")
        b-button(
          :variant="activeTab === 'all' ? 'primary' : 'outline-primary'"
          @click="activeTab = 'all'"
        ) 全部 ({{ messageMemento.length }})
        b-button(
          :variant="activeTab === 'messenger' ? 'info' : 'outline-info'"
          @click="activeTab = 'messenger'"
        ) 即時通 ({{ countMessenger }})
        b-button(
          :variant="activeTab === 'warning_danger' ? 'danger' : 'outline-danger'"
          @click="activeTab = 'warning_danger'"
        ) 警示與錯誤 ({{ countWarningDanger }})
        b-button(
          :variant="activeTab === 'toast' ? 'success' : 'outline-success'"
          @click="activeTab = 'toast'"
        ) 一般通知 ({{ countNormalToast }})

      //- 一鍵清空紀錄
      b-button(
        variant="outline-danger"
        size="sm"
        :disabled="messageMemento.length === 0"
        @click="triggerClearAll"
        title="清空所有歷史紀錄"
      )
        font-awesome-icon(:icon="['fas', 'trash-can']" class="mr-1")
        | 清空紀錄

    //- 關鍵字搜尋輸入框
    b-input-group(size="sm")
      template(#prepend)
        b-input-group-text
          font-awesome-icon(:icon="['fas', 'magnifying-glass']")
      b-form-input(
        v-model="keyword"
        placeholder="搜尋標題、發送者、頻道或訊息內文..."
        clearable
        debounce="150"
      )
      template(#append v-if="keyword")
        b-button(variant="secondary" @click="keyword = ''" title="清除搜尋") 清除

  //- 歷史紀錄內容清單 (雙欄網格排列)
  .history-content-container.p-3
    //- 空狀態
    .empty-state.text-center.py-5.text-muted(v-if="filteredMessages.length === 0")
      font-awesome-icon(:icon="['far', 'folder-open']" size="3x" class="mb-3 text-secondary opacity-50")
      .h5 {{ keyword ? '查無符合條件的訊息紀錄' : '目前尚無任何系統訊息紀錄' }}
      small(v-if="keyword") 請嘗試更換搜尋關鍵字或分類頁籤

    //- 雙欄網格訊息清單 (時間由新至舊排列)
    .history-grid(v-else)
      template(v-for="item in filteredMessages")
        //- 1. 快顯通知 (還原 Bootstrap 原生 Toast 樣式)
        .toast.fade.show.lah-history-toast(
          v-if="item.category === 'toast'"
          :key="item.id || item.timestamp"
          :class="getToastClass(item)"
        )
          .toast-header.py-1.px-2.d-flex.align-items-center
            b-badge.mr-1.px-1.py-1(:variant="getBadgeVariant(item)") {{ getBadgeText(item) }}
            strong.mr-auto.text-truncate.text-dark(style="max-width: 135px;" :title="item.title") {{ item.title }}
            small.text-muted.text-nowrap.mr-2 {{ item.timeText }}
            b-button.copy-icon-btn.p-0.text-secondary.border-0.bg-transparent(
              @click.stop="copyMessage(item.message)"
              title="複製內容"
            )
              font-awesome-icon(:icon="['far', 'copy']" size="sm")
          .toast-body.py-2.px-2.text-break
            | {{ item.message }}

        //- 2. 即時通推播 (還原深色浮動卡片樣式)
        .lah-history-messenger-chip.card(
          v-else
          :key="item.id || item.timestamp"
          @click="openMessenger(item.channel)"
          title="點擊前往此即時通頻道"
        )
          .chip-header.d-flex.justify-content-between.align-items-center.px-2.pt-2.pb-1
            .d-flex.align-items-center.text-truncate.mr-1
              b-badge.mr-1(variant="warning") 💬 新訊息
              span.chip-channel.text-info.font-weight-bold \#{{ item.channelName || item.channel }}
            .d-flex.align-items-center.text-nowrap
              small.text-white-50.mr-2 {{ item.timeText }}
              b-button.copy-icon-btn.p-0.text-white-50.border-0.bg-transparent(
                @click.stop="copyMessage(item.message)"
                title="複製內容"
              )
                font-awesome-icon(:icon="['far', 'copy']" size="sm")
          .chip-body.px-2.py-1
            .chip-sender.font-weight-bold.text-light {{ item.senderName || item.sender }}：
            .chip-text.text-white-50.text-break {{ item.message }}
          .chip-footer.px-2.pb-2.pt-1.text-right
            span.s-75.text-primary 點選立即查看 →
</template>

<script>
export default {
  data: () => ({
    visible: false,
    activeTab: 'all',
    keyword: ''
  }),
  computed: {
    messageMemento () {
      return this.$store.getters.messageMemento || []
    },
    unreadCount () {
      return this.$store.getters.unreadSystemMessageCount || 0
    },
    countMessenger () {
      return this.messageMemento.filter(m => m.category === 'messenger').length
    },
    countWarningDanger () {
      return this.messageMemento.filter(m => m.variant === 'warning' || m.variant === 'danger').length
    },
    countNormalToast () {
      return this.messageMemento.filter(m => m.category === 'toast' && m.variant !== 'warning' && m.variant !== 'danger').length
    },
    filteredMessages () {
      // 複製一份由新至舊 (倒序) 排列
      let list = [...this.messageMemento].reverse()

      // 依分類標籤篩選
      if (this.activeTab === 'messenger') {
        list = list.filter(m => m.category === 'messenger')
      } else if (this.activeTab === 'warning_danger') {
        list = list.filter(m => m.variant === 'warning' || m.variant === 'danger')
      } else if (this.activeTab === 'toast') {
        list = list.filter(m => m.category === 'toast' && m.variant !== 'warning' && m.variant !== 'danger')
      }

      // 依關鍵字搜尋過濾
      const kw = (this.keyword || '').trim().toLowerCase()
      if (kw) {
        list = list.filter((m) => {
          const title = (m.title || '').toLowerCase()
          const msg = (m.message || '').toLowerCase()
          const sender = (m.senderName || m.sender || '').toLowerCase()
          const channel = (m.channelName || m.channel || '').toLowerCase()
          return title.includes(kw) || msg.includes(kw) || sender.includes(kw) || channel.includes(kw)
        })
      }

      return list
    }
  },
  methods: {
    show () {
      this.visible = true
    },
    hide () {
      this.visible = false
    },
    handleModalShown () {
      // 開啟檢視時自動將未讀訊息標記為已讀
      if (this.$store && typeof this.$store.commit === 'function') {
        this.$store.commit('markAllMessagesRead')
      }
    },
    getToastClass (item) {
      if (item.variant === 'danger') { return 'toast-variant-danger' }
      if (item.variant === 'warning') { return 'toast-variant-warning' }
      if (item.variant === 'success') { return 'toast-variant-success' }
      return 'toast-variant-info'
    },
    getBadgeVariant (item) {
      if (item.variant === 'danger') { return 'danger' }
      if (item.variant === 'warning') { return 'warning' }
      if (item.variant === 'success') { return 'success' }
      return 'info'
    },
    getBadgeText (item) {
      if (item.variant === 'danger') { return '錯誤' }
      if (item.variant === 'warning') { return '警示' }
      if (item.variant === 'success') { return '成功' }
      return '通知'
    },
    copyMessage (text) {
      if (!text) { return }
      this.copyToClipboard(text, '已複製訊息內容')
    },
    openMessenger (channel) {
      this.hide()
      this.$nextTick(() => {
        this.$root.$emit('open-messenger-sidebar', channel)
      })
    },
    triggerClearAll () {
      this.confirm('確定要清空所有的系統訊息紀錄嗎？此動作無法復原。', {
        title: '⚠️ 清空訊息紀錄'
      }).then((ok) => {
        if (ok) {
          this.$store.commit('clearMessageMemento')
          this.notify('已清空所有系統訊息紀錄', { variant: 'info' })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-message-history-modal-body {
  background-color: #f4f6f9;
}

.history-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.history-content-container {
  max-height: 65vh;
  overflow-y: auto;
}

/* 雙欄網格排列：自適應 340px 最小寬度，桌機下精確雙欄 */
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 0.75rem;
  align-items: start;
}

/* 1. 原生 Toast 樣式 (淺色質感小卡片) */
.lah-history-toast {
  width: 100%;
  max-width: 100%;
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-left-width: 4px;
  border-radius: 0.35rem;
  box-shadow: 0 0.15rem 0.5rem rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.35rem 0.85rem rgba(0, 0, 0, 0.1);
  }

  .toast-header {
    background-color: rgba(248, 249, 250, 0.95);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    font-size: 0.85rem;
  }

  .toast-body {
    font-size: 0.9rem;
    line-height: 1.45;
    color: #2c3e50;
    white-space: pre-wrap;
  }

  &.toast-variant-danger {
    border-left-color: #dc3545 !important;
  }
  &.toast-variant-warning {
    border-left-color: #ffc107 !important;
  }
  &.toast-variant-success {
    border-left-color: #28a745 !important;
  }
  &.toast-variant-info {
    border-left-color: #17a2b8 !important;
  }
}

/* 2. 即時通浮動卡片樣式 (深色質感小卡片) */
.lah-history-messenger-chip {
  width: 100%;
  max-width: 100%;
  background: linear-gradient(145deg, #2c3036 0%, #1c1f24 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.45rem;
  box-shadow: 0 0.2rem 0.6rem rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.4rem 1.1rem rgba(0, 0, 0, 0.35);
    border-color: rgba(0, 123, 255, 0.6);

    .chip-footer span {
      color: #66b0ff !important;
      text-decoration: underline;
    }
  }

  .chip-header {
    font-size: 0.85rem;
  }

  .chip-channel {
    font-size: 0.8rem;
  }

  .chip-sender {
    font-size: 0.85rem;
  }

  .chip-text {
    font-size: 0.88rem;
    line-height: 1.4;
    white-space: pre-wrap;
  }
}

.copy-icon-btn {
  opacity: 0.6;
  transition: opacity 0.15s ease, transform 0.15s ease;
  line-height: 1;

  &:hover {
    opacity: 1;
    transform: scale(1.15);
  }
}

.opacity-50 {
  opacity: 0.5;
}

.gap-2 {
  gap: 0.5rem;
}
</style>
