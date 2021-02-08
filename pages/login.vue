<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">管理者登入</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明"/>
          </div>
          <div></div>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'">
        <lah-fa-icon icon="exclamation-circle" variant="primary" >請輸入密碼登入為管理者，以存取系統管理功能。</lah-fa-icon>
      </lah-help-modal>
    </lah-header>
    <b-container fluid v-cloak>
      <div class="vp-100 center">
        <b-form-group class="center-50">
            <b-form-input @keyup.enter="check" ref="password" v-model="password" type="password" size="lg" class="text-center" trim/>
            <lah-button @click="check" icon="sign-in-alt" size="lg" action="move-fade-ltr" class="mx-auto my-2">登入</lah-button>
        </b-form-group>
      </div>
    </b-container>
  </div>
</template>

<script>
export default {
  head: {
    title: '管理者登入-桃園市地政局'
  },
  data: () => ({
    password: ''
  }),
  computed: {
    hashed () {
      return this.$utils.md5(this.password)
    },
    secret () {
      return this.systemConfigs ? this.systemConfigs.master_password : '1f7744350d3dd3dc563421582f37f99e'
    },
    hasHistory () { return window.history.length > 2 }
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
          // this.$router.push('/admin')
          this.$router.go(-1)
        })
      } else {
        // not ok
        this.alert('密碼不相符，請重試！')
      }
    }
  },
  fetch () {
  },
  mounted () {
    if (this.loggedIn) {
      if (this.hasHistory) {
        this.$router.go(-1)
      } else {
        this.$router.push('/admin')
      }
    } else {
      this.isBusy = false
      this.$refs.password.$el.focus()
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
