<template lang="pug">
.bottom.d-flex.justify-content-between.text-muted.s-85
  .d-flex.justify-content-start.truncate.status-clickable.flex-grow-1(
    style="min-width: 0;"
    @click="showHistory = true"
    title="點擊查看歷史狀態訊息"
  )
    b-icon.mr-1.my-auto.flex-shrink-0(
      icon="info-circle-fill"
      :animation="empty(displayText) ? '' : 'fade'"
      :variant="empty(displayText) ? 'secondary' : 'info'"
      font-scale="1.1"
    )
    transition(name="list" mode="out-in")
      .my-auto.mr-2.text-truncate(v-if="!empty(displayText)") 
        span {{ displayText }} 
        b-icon.ml-1(icon="three-dots" animation="cylon")
      .my-auto.mr-2.text-truncate(v-else)
        span.text-muted 即時通就緒
  
  .text-right.text-nowrap.flex-shrink-0.ml-2
    span {{ appVer }}
    b-icon.ml-1.help(icon="question-circle-fill", variant="success", @click="showHelp", title="簡易說明")

  b-modal(
    v-model="showHistory"
    scrollable
    hide-footer
    size="lg"
    body-class="p-0"
    dialog-class="history-modal"
  )
    template(#modal-title)
      .d-flex.align-items-center
        b-icon.mr-2(icon="clock-history")
        span 狀態列歷史紀錄
        b-badge.ml-2(variant="secondary" pill) {{ history.length }}
        b-button.ml-3(
          v-if="history.length > 0"
          size="sm" 
          variant="outline-danger" 
          pill 
          @click="history = []"
        ) 清空
    
    .text-center.text-muted.my-4(v-if="history.length === 0") 尚無紀錄
    transition-group.list-group.list-group-flush(v-else name="history-list" tag="div")
      b-list-group-item.py-2.px-3(v-for="item in history" :key="item.id")
        .d-flex.w-100.justify-content-between.align-items-start
          .flex-grow-1(style="min-width: 0;")
            .d-flex.align-items-center
              span.text-dark.text-truncate.history-text(
                :ref="'text_' + item.id"
                style="min-width: 0;"
              ) {{ item.text }}
              b-button.ml-1.flex-shrink-0(
                v-if="item.truncated"
                size="sm"
                variant="link"
                class="p-0 toggle-btn"
                @click.stop="item.expanded = !item.expanded"
                :title="item.expanded ? '收合' : '展開完整訊息'"
              )
                b-icon(:icon="item.expanded ? 'chevron-up' : 'chevron-down'" font-scale="0.85")
            b-collapse(:visible="item.expanded && item.truncated")
              .history-full-text.mt-1.text-dark {{ item.text }}
          small.text-muted.text-nowrap.ml-3.flex-shrink-0 {{ item.time }}
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerHelp from '~/components/lah-messenger-help.vue'

export default {
  name: 'LahMessengerStatus',
  components: { LahMessengerHelp },
  mixins: [lahMessengerBase],
  props: {
    statusText: { type: String, default: '' },
    version: { type: String, default: 'v2.0' }
  },
  data: () => ({
    clearTimer: null,
    displayText: '',
    appVer: 'v2.0',
    history: [],
    showHistory: false
  }),
  watch: {
    statusText (val) {
      clearTimeout(this.clearTimer)
      const text = this.empty(this.userid) ? '等待使用者資訊' : val
      this.displayText = text
      
      if (!this.empty(text)) {
        this.history.unshift({
          id: this.$utils.uuid ? this.$utils.uuid() : `${+new Date()}_${Math.random()}`,
          time: this.time(),
          text,
          expanded: false,
          truncated: false
        })
        if (this.history.length > 100) {
          this.history.pop()
        }
        this.$nextTick(() => this.detectTruncation())
      }

      this.clearTimer = setTimeout(() => { this.displayText = '' }, 5000)
    },
    showHistory (val) {
      if (val) {
        this.$nextTick(() => this.detectTruncation())
      }
    }
  },
  created () {
    this.appVer = this.version
  },
  methods: {
    showHelp () {
      this.modal(this.$createElement(LahMessengerHelp), {
        size: 'xl',
        title: `即時通說明 - ${this.appVer}`
      })
    },
    detectTruncation () {
      this.history.forEach(item => {
        const ref = this.$refs[`text_${item.id}`]
        const el = Array.isArray(ref) ? ref[0] : ref
        if (el) {
          this.$set(item, 'truncated', el.scrollWidth > el.offsetWidth)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.bottom {
  width: 100%;
  padding: 0.25rem 0.5rem;
  border-top: 1px solid #e9ecef;
  background-color: #fafafa;
}
.help {
  cursor: pointer;
}
.status-clickable {
  cursor: pointer;
  border-radius: 4px;
  padding: 1px 4px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}
.history-list-enter-active, .history-list-leave-active {
  transition: all 0.4s ease;
}
.history-list-enter, .history-list-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}
.history-full-text {
  font-size: 0.9em;
  background-color: rgba(0, 0, 0, 0.03);
  border-left: 3px solid #dee2e6;
  padding: 4px 8px;
  border-radius: 0 4px 4px 0;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
