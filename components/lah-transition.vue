<template>
  <transition
    :enter-active-class="animated_in"
    :leave-active-class="animated_out"
    :mode="mode"
    :appear="appear"
    @enter="enter($event)"
    @leave="leave($event)"
    @after-enter="afterEnter($event)"
    @after-leave="afterLeave($event)"
  >
    <slot>轉場內容會顯示在這邊</slot>
  </transition>
</template>

<script>
export default {
  props: {
    appear: { type: Boolean, default: false },
    fade: { type: Boolean, default: false },
    slide: { type: Boolean, default: false },
    slideDown: { type: Boolean, default: false },
    slideUp: { type: Boolean, default: false },
    zoom: { type: Boolean, default: false },
    bounce: { type: Boolean, default: false },
    rotate: { type: Boolean, default: false },
    speed: { type: String, default: 'quick' }
  },
  data: () => ({
    animated_in: "animated fadeIn once-anim-cfg-quick",
    animated_out: "animated fadeOut once-anim-cfg-quick",
    mode: "out-in", // out-in, in-out
    cfg_css: "once-anim-cfg-quick",
  }),
  created() {
    switch (this.speed) {
      case 'normal':
      case 'slow':
        this.cfg_css = `once-anim-cfg-${this.speed}`
        break
      default:
        this.cfg_css = 'once-anim-cfg-quick'
    }
    if (this.rotate) {
      this.animated_in = `animated rotateIn ${this.cfg_css}`;
      this.animated_out = `animated rotateOut ${this.cfg_css}`;
    } else if (this.bounce) {
      this.animated_in = `animated bounceIn ${this.cfg_css}`;
      this.animated_out = `animated bounceOut ${this.cfg_css}`;
    } else if (this.zoom) {
      this.animated_in = `animated zoomIn ${this.cfg_css}`;
      this.animated_out = `animated zoomOut ${this.cfg_css}`;
    } else if (this.fade) {
      this.animated_in = `animated fadeIn ${this.cfg_css}`;
      this.animated_out = `animated fadeOut ${this.cfg_css}`;
    } else if (this.slideDown || this.slide) {
      this.animated_in = `animated slideInDown ${this.cfg_css}`;
      this.animated_out = `animated slideOutUp ${this.cfg_css}`;
    } else if (this.slideUp) {
      this.animated_in = `animated slideInUp ${this.cfg_css}`;
      this.animated_out = `animated slideOutDown ${this.cfg_css}`;
    } else {
      this.randAnimation();
    }
  },
  methods: {
    enter (e) {
      this.$emit("enter", e);
    },
    leave (e) {
      this.$emit("leave", e);
    },
    afterEnter (e) {
      this.$emit("after-enter", e);
    },
    afterLeave (e) {
      this.$emit("after-leave", e);
    },
    randAnimation () {
      if (this.ANIMATED_TRANSITIONS) {
        let count = this.ANIMATED_TRANSITIONS.length;
        let this_time = this.ANIMATED_TRANSITIONS[this.rand(count)];
        this.animated_in = `${this_time.in} ${this.cfg_css}`;
        this.animated_out = `${this_time.out} ${this.cfg_css}`;
      }
    }
  }
};
</script>

<style lang="scss">
@mixin anim-cfg($ad, $aic) {
	animation-duration: $ad;
	animation-iteration-count: $aic;
}

.once-anim-cfg-quick {
  @include anim-cfg(0.4s, 1);
}

.once-anim-cfg-normal {
	@include anim-cfg(0.8s, 1);
}

.once-anim-cfg-slow {
	@include anim-cfg(1.6s, 1);
}
</style>
