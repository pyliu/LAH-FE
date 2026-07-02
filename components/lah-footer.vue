<template lang="pug">
lah-transition(slide-up appear): .d-flex.align-items-center.justify-content-center(v-if="show" :class="classes"): span
  a(
    href="https://github.com/pyliu/LAH-NUXTJS"
    target="_blank"
    title="View project on Github!"
  ): lah-fa-icon.text-dark.mr-1(icon="github", brand, size="lg")
  strong.d-inline-flex.align-items-center.
    #[lah-fa-icon(icon="copyright", regular)]
    #[a.mr-1(href="mailto:pangyu.liu@gmail.com") LIU, PANG-YU]
    ALL RIGHTS RESERVED.
  a(href="https://vuejs.org/" target="_blank" title="Learn Vue JS!"): i.text-success.fab.fa-vuejs.fa-lg
  .version v{{ $config.pkgVersion }}
</template>

<script>
export default {
  data: () => ({
    show: false,
    leave_time: 10000,
    classes: [
      'text-muted',
      'position-fixed',
      'footer-bottom-right',
      'bg-white',
      'border',
      'rounded',
      'text-center',
      'p-2',
      'small',
      'lah-shadow'
    ]
  }),
  mounted () {
    this.show = true
    this.timeout(() => (this.show = false), this.leave_time).then((handle) => {
      // save the handle here if you want to control timeout func
    }).catch(err => this.$utils.error(err))
    this.systemConfigs.mock && this.notify('目前系統處於模擬模式，僅會回應快取的資料', { type: 'dark', pos: 'br', delay: 7500 })
  }
}
</script>

<style lang="scss" scoped>
.footer-bottom-right {
  bottom: 20px;
  right: 20px;
  width: 25vw;
  min-width: 350px; /* 避免在小螢幕上因 25vw 過小而擠壓破版 */
  z-index: 1050; /* 確保浮層高於大部分畫面內容 */
}

.version {
  font-weight: 900;
  position: absolute;
  right: 10px;
  bottom: 25%;
}
</style>