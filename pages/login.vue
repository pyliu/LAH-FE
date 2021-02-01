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
      return this.config ? this.config.master_password : '1f7744350d3dd3dc563421582f37f99e'
    }
  },
  methods: {
    check () {
      if (this.$utils.equal(this.hashed, this.secret)) {
        // ok
        this.notify(
          '已登入，將引導至管理者首頁 ... ',
          { type: 'success' }
        ).then((config) => {
          // this.$utils.log(config)
          this.$store.commit('admin', true)
          this.$router.push('/admin')
        })
      } else {
        // not ok
        this.alert('密碼不相符，請重試！')
      }
    }
  },
  fetch () {
  },
  created () {
    if (!this.authority.isAdmin && !this.authority.isSuper) {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'svr',
        client_ip: this.ip
      }).then(({ data }) => {
        this.$store.commit('svr', data)
        this.setCache('server-info', data, 86400000) // cache for a day
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        if (this.authority.isAdmin || this.authority.isSuper) {
          this.$router.push('/admin')
        } else {
          this.isBusy = false
        }
      })
    }
  },
  mounted () {
    if (this.authority.isAdmin || this.authority.isSuper) {
      this.$router.push('/admin')
    } else {
      this.isBusy = false
      this.$refs.password.$el.focus()
    }
    // 0162703054122aa13eba16f4c81b8f39
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
