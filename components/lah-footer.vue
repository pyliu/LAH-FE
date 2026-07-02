<template lang="pug">
lah-transition(slide-up appear)
  .d-flex.align-items-center.justify-content-center.flex-wrap(
    v-if="show"
    :class="classes"
  )
    a.mx-1(
      href="https://github.com/pyliu/LAH-NUXTJS"
      target="_blank"
      title="View project on Github!"
    ): lah-fa-icon.text-dark(icon="github", brand, size="lg")

    strong.d-inline-flex.align-items-center.mx-1.text-center
      lah-fa-icon.mr-1(icon="copyright", regular)
      a.mr-1(href="mailto:pangyu.liu@gmail.com") LIU, PANG-YU
      | ALL RIGHTS RESERVED.

    a.mx-1(href="https://vuejs.org/" target="_blank" title="Learn Vue JS!")
      i.text-success.fab.fa-vuejs.fa-lg

    .version.ml-2.my-1 v{{ $config.pkgVersion }}
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
  min-width: 320px; /* 微調以適應一般小尺寸手機 */
  max-width: 90vw;  /* 新增：避免在極端狹窄螢幕撐破畫面 */
  z-index: 1050;
}

.version {
  font-weight: bold;
  font-size: 0.75rem;
  color: #6c757d;
  background-color: #f1f3f5;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  border: 1px solid #e9ecef;
  white-space: nowrap; /* 確保版本號本身絕對不會被斷行 */
}
</style>
