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
        請輸入主密碼登入為管理者
      </lah-help-modal>
    </lah-header>
    <b-container fluid v-cloak>
      <div class="vp-100 center">
        <b-form-group class="center-50">
            <b-form-input v-model="password" type="password" size="lg" class="text-center" trim></b-form-input>
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
    password: undefined,
    hashedSecret: '4535972a186590f9fe2a470e02c9f22e'
  }),
  method: {
    check () {
      if (this.$utils.equal(this.$utils.md5(this.password), this.hashedSecret)) {
        // ok
      } else {
        // not ok
      }
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
