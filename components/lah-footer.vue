<template lang="pug">
lah-transition(slide-up appear): .d-flex.align-items-center.justify-content-center(v-if="show" :class="classes"): span
  a(
    href="https://github.com/pyliu/LAH-NUXTJS"
    target="_blank"
    title="View project on Github!"
  ): i.fab.fa-github.fa-lg.text-dark.mr-1
  strong.
    #[i.far.fa-copyright]
    #[a(href="mailto:pangyu.liu@gmail.com") LIU, PANG-YU]
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
      'fixed-bottom',
      'my-2',
      'mx-auto',
      'bg-white',
      'border',
      'rounded',
      'text-center',
      'p-2',
      'small',
      'lah-shadow',
      'w-75'
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
.version {
  position: absolute;
  right: 10px;
  bottom: 25%;
}
</style>
