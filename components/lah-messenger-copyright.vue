<template lang="pug">
transition(
  enter-active-class="animate__flipInX"
  leave-active-class="animate__flipOutX"
): .p-2.s-80.animate__animated(v-show="show" :class="classes"): span
  a.mr-1(
    href="https://github.com/pyliu/LAH-NUXTJS"
    target="_blank"
    rel="noopener noreferrer"
    title="View project on Github!"
  ): b-icon.my-auto(icon="github" font-scale="1.25")
  strong.my-auto 2021-2026 #[a(href="mailto:pangyu.liu@gmail.com") LIU, PANG-YU] ALL RIGHTS RESERVED. 
</template>

<script>
export default {
  name: 'LahMessengerCopyright',
  data: () => ({
    show: false,
    leaveTime: 10000,
    classes: [
      'text-muted',
      'fixed-bottom',
      'm-2',
      'bg-white',
      'border',
      'rounded',
      'text-center',
      'shadow'
    ]
  }),
  mounted () {
    this.show = true
    this.timeout(() => { this.show = false }, this.leaveTime).catch(err => console.error(err))
  }
}
</script>

<style lang="scss" scoped>
</style>
