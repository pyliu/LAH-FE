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

  //- 歷史紀錄內容清單
  .history-content-container.p-3
    //- 空狀態
    .empty-state.text-center.py-5.text-muted(v-if="filteredMessages.length === 0")
      font-awesome-icon(:icon="['far', 'folder-open']" size="3x" class="mb-3 text-secondary opacity-50")
      .h5 {{ keyword ? '查無符合條件的訊息紀錄' : '目前尚無任何系統訊息紀錄' }}
      small(v-if="keyword") 請嘗試更換搜尋關鍵字或分類頁籤

    //- 訊息卡片清單 (時間由新至舊排列)
    transition-group(name="list" tag="div" class="message-list")
      .message-card.card.mb-3.shadow-sm(
        v-for="item in filteredMessages"
        :key="item.id || item.timestamp"
        :class="getCardBorderClass(item)"
      )
        .card-header.bg-transparent.py-2.px-3.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center.flex-wrap.gap-2
            b-badge(:variant="getBadgeVariant(item)" class="px-2 py-1")
              | {{ getBadgeText(item) }}
            span.font-weight-bold.text-dark.ml-1 {{ item.title }}
          .text-muted.s-85.text-nowrap.ml-2
            font-awesome-icon(:icon="['far', 'clock']" class="mr-1")
            | {{ item.dateText }} {{ item.timeText }}

        .card-body.py-2.px-3
          .message-body-text.text-break {{ item.message }}

        .card-footer.bg-transparent.py-1.px-3.d-flex.justify-content-end.align-items-center.gap-2
          b-button(
            size="sm"
            variant="outline-secondary"
            class="px-2 py-1 action-btn"
            @click="copyMessage(item.message)"
            title="複製內容到剪貼簿"
          )
            font-awesome-icon(:icon="['far', 'copy']" class="mr-1")
            | 複製

          b-button(
            v-if="item.category === 'messenger' && item.channel"
            size="sm"
            variant="outline-primary"
            class="px-2 py-1 action-btn ml-2"
            @click="openMessenger(item.channel)"
            title="前往即時通頻道"
          )
            font-awesome-icon(:icon="['far', 'comment-dots']" class="mr-1")
            | 前往即時通
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
    getBadgeVariant (item) {
      if (item.category === 'messenger') {
        return item.variant || 'primary'
      }
      if (item.variant === 'danger') { return 'danger' }
      if (item.variant === 'warning') { return 'warning' }
      if (item.variant === 'success') { return 'success' }
      return 'info'
    },
    getBadgeText (item) {
      if (item.category === 'messenger') {
        return `即時通 #${item.channelName || item.channel || '一般'}`
      }
      if (item.variant === 'danger') { return '錯誤' }
      if (item.variant === 'warning') { return '警示' }
      if (item.variant === 'success') { return '成功' }
      return '通知'
    },
    getCardBorderClass (item) {
      if (item.variant === 'danger') { return 'border-left-danger' }
      if (item.variant === 'warning') { return 'border-left-warning' }
      if (item.variant === 'success') { return 'border-left-success' }
      if (item.category === 'messenger') { return 'border-left-primary' }
      return 'border-left-info'
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
  background-color: #f8f9fa;
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

.message-card {
  border: 1px solid #dee2e6;
  border-left-width: 4px;
  background-color: #ffffff;
  transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08) !important;
    transform: translateY(-1px);
  }

  &.border-left-danger {
    border-left-color: #dc3545 !important;
  }
  &.border-left-warning {
    border-left-color: #ffc107 !important;
  }
  &.border-left-success {
    border-left-color: #28a745 !important;
  }
  &.border-left-primary {
    border-left-color: #007bff !important;
  }
  &.border-left-info {
    border-left-color: #17a2b8 !important;
  }
}

.message-body-text {
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-wrap;
  color: #333333;
}

.action-btn {
  font-size: 0.8rem;
}

.opacity-50 {
  opacity: 0.5;
}

.gap-2 {
  gap: 0.5rem;
}
</style>
