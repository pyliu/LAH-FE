<template lang="pug">
  lah-transition(slide-up appear): .p-2(v-show="show" :class="classes"): span
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
</template>

<script>
export default {
  data: () => ({
    show: false,
    leave_time: 10000,
    classes: [
      "text-muted",
      "fixed-bottom",
      "my-2",
      "mx-3",
      "bg-white",
      "border",
      "rounded",
      "text-center",
      "p-2",
      "small",
      "shadow-xl",
    ],
  }),
  mounted() {
    this.show = true
    this.timeout(() => (this.show = false), this.leave_time).then((handle) => {
      // save the handle here if you want to control timeout func
    }).catch((err) => this.$utils.error(err))
    this.systemConfigs.mock && this.notify('目前系統處於模擬模式，僅會回應快取的資料', { type: 'dark', pos: 'br', delay: 7500 })
  },
};
</script>

<style>
</style>
