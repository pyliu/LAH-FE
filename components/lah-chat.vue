<template lang="pug">
client-only.lah-chat(ref="chatContainer")
  //- 頂部載入更早歷史訊息按鈕
  .text-center.py-2(v-if="hasMore")
    b-button(
      size="sm"
      variant="outline-secondary"
      pill
      :disabled="loadingMore"
      @click="loadBefore"
    )
      b-spinner(small v-if="loadingMore").mr-1
      b-icon(icon="arrow-up-circle" v-else).mr-1
      span {{ loadingMore ? '讀取歷史訊息中...' : '載入更早訊息 (+20)' }}

  //- 載入中狀態
  .center.my-5(v-if="isBusy")
    b-spinner(variant="primary" label="載入中...")
    span.ml-2.text-muted 正在載入收件箱訊息...

  //- 空訊息狀態
  h5.center.my-5(v-else-if="noMessage")
    b-icon.mr-1(icon="shield-fill-exclamation" variant="warning")
    span 目前未收到任何訊息

  //- 訊息列表 (時間由舊到新呈現)
  transition-group(v-else name="list" tag="div")
    lah-chat-message(
      v-for="(item, idx) in list",
      :key="`chat-msg-${item.id || idx}`",
      :json="item",
      :prev="list[idx - 1]",
      :ref="`msg-${idx}`"
    )
</template>

<script>
export default {
  name: 'LahChat',
  props: {
    channel: { type: String, default: '' },
    limit: { type: Number, default: 30 }
  },
  data: () => ({
    list: [],
    isBusy: false,
    loadingMore: false,
    hasMore: false,
    currentLimit: 30
  }),
  fetch () {
    if (!this.$utils.empty(this.targetChannel)) {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
        type: 'get_notification',
        channel: this.targetChannel,
        limit: this.currentLimit
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          const rawItems = Array.isArray(data.raw) ? data.raw : []
          this.hasMore = rawItems.length >= this.currentLimit
          // 後端回傳 DESC (最新在前)，反轉為由舊至新時間順序展示
          this.list = [...rawItems].reverse()
          this.$nextTick(() => {
            this.scrollToBottom()
          })
        } else {
          this.list = []
          this.$utils.warn(data.message)
        }
      }).catch((err) => {
        this.alert && this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  },
  computed: {
    targetChannel () { return this.channel || this.myid },
    noMessage () { return !this.isBusy && this.$utils.empty(this.list) }
  },
  watch: {
    targetChannel () {
      this.currentLimit = this.limit || 30
      this.$fetch()
    },
    limit (nVal) {
      this.currentLimit = nVal || 30
      this.$fetch()
    }
  },
  created () {
    this.currentLimit = this.limit || 30
  },
  methods: {
    loadBefore () {
      if (this.loadingMore || this.list.length === 0) { return }
      const oldestId = this.list[0]?.id
      if (!oldestId) { return }
      this.loadingMore = true
      this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
        type: 'get_notification_before',
        channel: this.targetChannel,
        before: oldestId,
        limit: 20
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          const olderItems = Array.isArray(data.raw) ? data.raw : []
          if (olderItems.length === 0) {
            this.hasMore = false
            this.notify && this.notify('已無更早的歷史訊息', { variant: 'info' })
          } else {
            if (olderItems.length < 20) {
              this.hasMore = false
            }
            const container = this.$el
            const oldScrollHeight = container ? container.scrollHeight : 0
            const oldScrollTop = container ? container.scrollTop : 0

            this.list = [...olderItems.reverse(), ...this.list]

            this.$nextTick(() => {
              if (container) {
                container.scrollTop = oldScrollTop + (container.scrollHeight - oldScrollHeight)
              }
            })
          }
        } else {
          this.hasMore = false
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.loadingMore = false
      })
    },
    scrollToBottom () {
      const el = this.$el
      if (el) {
        el.scrollTop = el.scrollHeight
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-chat {
  max-height: calc(100vh - 220px);
  min-height: 280px;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: 8px;
}
</style>
