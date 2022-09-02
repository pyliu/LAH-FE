<template lang="pug">
  div(v-cloak)
    lah-header
      lah-transition(appear): .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 管理者登入
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        div
      lah-help-modal(:modal-id="'help-modal'"): lah-fa-icon(icon="exclamation-circle" variant="primary").
        請輸入密碼登入為管理者，以存取系統管理功能。
    b-container(fluid v-cloak): .vp-100.center: b-form-group.center-50
      b-input.text-center(@keyup.enter="check" ref="password" v-model="password" type="password" size="lg" trim)
      lah-button.mx-auto.my-2(@click="check" icon="sign-in-alt" size="lg" action="move-fade-ltr") 登入
</template>

<script>
export default {
  data: () => ({
    password: ''
  }),
  head: {
    title: '管理者登入-桃園市地政局'
  },
  computed: {
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
    this.$refs.password.$el.focus()
  },
  methods: {
    check () {
      if (this.$utils.equal(this.hashed, this.secret)) {
        // ok
        this.notify(
          '已登入，將引導至管理者首頁 ... ',
          { type: 'success' }
        ).then((opts) => {
          // this.$utils.log(opts)
          this.$store.commit('admin', true)
          // if (this.hasHistory) {
          //   this.$router.go(-1)
          // } else {
          //   this.refirect()
          // }
          this.refirect()
        })
      } else {
        // not ok
        this.alert('密碼不相符，請重試！')
      }
    },
    refirect () {
      // if (this.hasHistory) {
      //   this.$router.go(-1)
      // } else {
      // }
      this.$router.push('/inf')
    }
  }
}
</script>

<style lang="scss" scoped>
.vp-100 {
    width: 100%;
    height: 65vh;
}
.center-50 {
    width: 50%;
    text-align: center;
}
</style>
