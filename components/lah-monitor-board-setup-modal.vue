<template lang="pug">
b-modal(
  ref="setupModal"
  :hide-footer="hideFooter"
  :centered="centered"
  :size="size"
  :scrollable="scrollable"
  :no-close-on-backdrop="noCloseOnBackdrop"
)
  template(#modal-title): div(v-html="modalTitle")
  b-input-group(prepend="郵件主機")
    b-input(v-model="host", title="主機IP", trim)
  b-input-group.my-1(prepend="登入帳號")
    b-input(v-model="account", title="登入帳號", trim)
  b-input-group(prepend="登入密碼")
    b-input(v-model="password", type="password", title="登入帳號", trim)
  .center.my-2: lah-button(
    icon="pen-square",
    variant="outline-primary",
    title="更新",
    :disabled="isBusy",
    @click="update"
  ) 確定修改
  lah-fa-icon(icon="list-alt", variant="secondary") 測試訊息
  b-list-group(flush): b-list-group-item(v-for="(msg, idx) in messages" :key="`${idx}_msg`")
    lah-fa-icon(
      v-if="idx === 0"
      icon="angle-double-right",
      variant="danger",
      action="move-fade-ltr"
    )
    span.ml-1 {{ msg }}
</template>

<script>
export default {
  props: {
    modalTitle: { type: String, default: '智慧監控儀表板設定' },
    size: { type: String, default: 'md' },
    scrollable: { type: Boolean, default: false },
    centered: { type: Boolean, default: false },
    hideFooter: { type: Boolean, default: true },
    noCloseOnBackdrop: { type: Boolean, default: true }
  },
  data: () => ({
    host: '',
    account: '',
    password: '',
    messages: []
  }),
  watch: {
    systemConfigs (val) {
      this.host = val.monitor.host
      this.account = val.monitor.account
      this.password = val.monitor.password
    }
  },
  created () {
    this.host = this.systemConfigs.monitor.host
    this.account = this.systemConfigs.monitor.account
    this.password = this.systemConfigs.monitor.password
  },
  methods: {
    show () {
      this.$refs.setupModal?.show()
    },
    hide () {
      this.$refs.setupModal?.hide()
    },
    update () {
      this.quickUpdateConfig({
        MONITOR_MAIL_HOST: this.host,
        MONITOR_MAIL_ACCOUNT: this.account,
        MONITOR_MAIL_PASSWORD: this.password
      }, this.hide)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
