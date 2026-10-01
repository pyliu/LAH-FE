<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.align-items-center.w-100
      .d-flex.align-items-center
        lah-fa-icon(icon="user-shield" variant="primary" size="lg").mr-2
        span.h4.mb-0.font-weight-bold 管理者身分驗證
        lah-button.ml-2(
          icon="question"
          variant="outline-success"
          no-border
          no-icon-gutter
          v-b-modal.help-modal
          title="說明"
        )
      div
    lah-help-modal(:modal-id="'help-modal'")
      .p-2
        lah-fa-icon(icon="circle-info" variant="primary" size="lg").mr-2
        span 請輸入管理主控密碼登入為系統管理者，以存取進階系統管理與維護功能。

  b-container.login-container.py-5(fluid v-cloak)
    lah-transition(appear)
      b-card.login-card.shadow-lg.border-0.mx-auto.text-center(no-body)
        .card-accent-bar.bg-primary

        b-card-body.p-4.p-md-5
          //- 頂部圖示與標題
          .avatar-circle.bg-primary-subtle.text-primary.mx-auto.mb-3.d-flex.align-items-center.justify-content-center
            lah-fa-icon(icon="shield-halved" size="2x")

          h3.font-weight-bold.text-dark.mb-1 系統管理者登入
          p.text-muted.small.mb-4 請輸入管理者密碼以解鎖管理與維運功能

          //- 即時連線狀態標籤
          .d-flex.justify-content-center.align-items-center.flex-wrap.mb-4
            b-badge.m-1.px-2.py-1(variant="light" class="border text-muted")
              lah-fa-icon(icon="desktop" class="text-info mr-1")
              span {{ clientIp }}
            b-badge.m-1.px-2.py-1(variant="light" class="border text-muted")
              lah-fa-icon(icon="building" class="text-success mr-1")
              span {{ siteName }} ({{ site }})

          //- 密碼輸入區
          b-form-group.text-left.mb-3
            label.small.font-weight-bold.text-secondary.mb-1
              lah-fa-icon(icon="key" class="mr-1 text-primary")
              span 管理者密碼
            b-input-group(size="lg")
              template(#prepend)
                b-input-group-text.bg-light.text-muted.border-right-0
                  lah-fa-icon(icon="lock")
              b-form-input.border-left-0.border-right-0(
                ref="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                size="lg"
                placeholder="請輸入管理者密碼"
                @keyup.enter="check"
                @keydown="handleKeyDown"
                autocomplete="current-password"
                trim
              )
              template(#append)
                b-button(
                  variant="outline-secondary"
                  class="bg-light text-muted border-left-0"
                  @click="toggleShowPassword"
                  :title="showPassword ? '隱藏密碼' : '顯示密碼'"
                )
                  lah-fa-icon(:icon="showPassword ? 'eye-slash' : 'eye'")

            //- 大寫鎖定提醒
            small.text-warning.d-block.mt-1(v-if="isCapsLock")
              lah-fa-icon(icon="arrow-up-from-bracket" class="mr-1")
              span 大寫鎖定 (Caps Lock) 已開啟

          //- 登入按鈕
          lah-button.btn-block.my-3(
            @click="check"
            icon="arrow-right-to-bracket"
            size="lg"
            variant="primary"
            action="ld-move-fade-ltr"
            :disabled="!password"
          ) 驗證並登入

          //- 回首頁連結
          .text-center.mt-4
            nuxt-link(to="/").text-muted.small.d-inline-flex.align-items-center.text-decoration-none
              lah-fa-icon(icon="house-chimney" class="mr-1 text-secondary")
              span 回地政事務所入口網

          //- 底部安全警語
          b-alert.mt-4.mb-0.p-2.text-left.small(show variant="light" class="border text-muted")
            lah-fa-icon(icon="circle-exclamation" class="text-warning mr-1")
            span 安全提示：此介面專供地政資訊人員使用，操作皆會受系統稽核留存。
</template>

<script>
export default {
  data: () => ({
    password: '',
    showPassword: false,
    isCapsLock: false
  }),
  head: {
    title: '管理者登入-桃園市地政局'
  },
  computed: {
    clientIp () {
      return this.ip || (process.client && location.hostname !== 'localhost' ? location.hostname : '') || '127.0.0.1'
    },
    hashed () {
      return this.$utils.md5(this.password)
    },
    secret () {
      if (this.systemConfigs && !this.$utils.empty(this.systemConfigs.master_password)) {
        return this.systemConfigs.master_password
      }
      return '1f7744350d3dd3dc563421582f37f99e'
    },
    hasHistory () { return window.history.length > 1 }
  },
  watch: {
    loggedIn (flag) {
      if (flag) {
        this.refirect()
      }
    }
  },
  created () {
    this.isBusy = true
    if (this.loggedIn) {
      this.refirect()
    }
  },
  mounted () {
    this.isBusy = false
    this.$nextTick(() => {
      this.$refs.password?.$el?.focus?.() || this.$refs.password?.focus?.()
    })
  },
  methods: {
    toggleShowPassword () {
      this.showPassword = !this.showPassword
      this.$nextTick(() => {
        this.$refs.password?.$el?.focus?.() || this.$refs.password?.focus?.()
      })
    },
    handleKeyDown (e) {
      if (e && e.getModifierState) {
        this.isCapsLock = e.getModifierState('CapsLock')
      }
    },
    check () {
      if (this.$utils.equal(this.hashed, this.secret)) {
        // ok
        this.notify(
          '已登入，將引導至管理者首頁 ... ',
          { type: 'success' }
        ).then((opts) => {
          this.$store.commit('admin', true)
          this.refirect()
        })
      } else {
        // not ok
        this.alert('密碼不相符，請重試！')
      }
    },
    refirect () {
      this.$router.push('/inf')
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  max-width: 460px;
  width: 100%;
  border-radius: 16px !important;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175) !important;
  }
}

.card-accent-bar {
  height: 5px;
  width: 100%;
}

.avatar-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
}

.bg-primary-subtle {
  background-color: rgba(13, 110, 253, 0.12);
}
</style>
