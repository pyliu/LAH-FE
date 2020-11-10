<template>
  <lah-transition slide-up appear>
    <p v-if="show" :class="classes">
      <span>
        <a
          href="https://github.com/pyliu/LAH-NUXTJS"
          target="_blank"
          title="View project on Github!"
        >
          <i class="fab fa-github fa-lg text-dark"></i>
        </a>
        <strong>
          <i class="far fa-copyright"></i>
          <a href="mailto:pangyu.liu@gmail.com">LIU, PANG-YU</a> ALL RIGHTS RESERVED.
        </strong>
        <a href="https://vuejs.org/" target="_blank" title="Learn Vue JS!">
          <i class="text-success fab fa-vuejs fa-lg"></i>
        </a>
      </span>
    </p>
  </lah-transition>
</template>

<script>
export default {
  data: () => ({
    show: true,
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
    this.timeout(() => (this.show = false), this.leave_time);
  },
};
</script>

<style>
</style>
