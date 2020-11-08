<template>
  <b-button
    :link="link"
    :variant="variant"
    :size="size"
    :pill="pill"
    :block="block"
    :pressed="pressed"
    :class="noBorder ? 'border-0' : ''"
    :href="href"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
    @blur="mouseleave"
    @click="emitClick($event)"
  >
    <font-awesome-icon
      v-if="showIcon"
      :id="iconId"
      :icon="[faIconPrefix, icon]"
      :size="iconSize"
      :pull="pull"
    />
    <slot></slot>
    <b-badge
      v-if="showBadge"
      :variant="badgeVariant"
      :pill="badgePill"
    >
      {{ badgeText }}
    </b-badge>
  </b-button>
</template>

<script>
export default {
  props: {
    href: { type: String, default: '' },
    noBorder: { type: Boolean, default: false },
    variant: { type: String, default: 'outline-primary' },
    size: { type: String, default: 'sm' },
    icon: { type: String, default: '' },
    iconSize: { type: String, default: '' },
    regular: { type: Boolean, default: false },
    brand: { type: Boolean, default: false },
    action: { type: String, default: undefined },
    click: { type: Function, default: console.log.bind(console) },
    pill: { type: Boolean, default: false },
    pull: { type: String, default: 'left' },
    block: { type: Boolean, default: false },
    pressed: { type: Boolean, default: false },
    link: { type: Boolean, default: false },
    badgeText: { type: String, default: '' },
    badgeVariant: { type: String, default: 'light' },
    badgePill: { type: Boolean, default: true }
  },
  data: () => ({
    iconId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx'
  }),
  watch: {},
  computed: {
    faIconPrefix () {
      return this.brand ? 'fab' : this.regular ? 'far' : 'fas';
    },
    showBadge () { return !this.empty(this.badgeText) },
    showIcon () { return !this.empty(this.icon) }
  },
  methods: {
    emitClick (evt) {
      this.$emit('click', this.click);
      evt.stopPropagation();
    },
    addAnimation (selector, which) {
      let el = this.clearAnimation(selector);
      if (el.length) {
        el.addClass('ld');
        if (!which) {
          el.each((idx, el) => {
            if (!this.$(el).is('body')) {
              const randAnimPattern = this.LOADING_PATTERNS[
                this.rand(this.LOADING_PATTERNS.length)
              ];
              this.$(el).addClass(randAnimPattern);
            }
          });
        } else {
          el.addClass(which);
        }
      }
      return el;
    },
    clearAnimation (selector) {
      return this.$(selector || '*')
        .removeClass('ld')
        .attr('class', function(i, c) {
          return c ? c.replace(/(^|\s+)ld-\S+/g, '') : '';
        });
    },
    mouseenter () {
      /**
       *  "ld-heartbeat", "ld-beat", "ld-blink", "ld-bounce", "ld-bounceAlt", "ld-breath", "ld-wrench", "ld-surprise",
          "ld-clock", "ld-jump", "ld-hit", "ld-fade", "ld-flip", "ld-float", "ld-move-ltr", "ld-tremble", "ld-tick",
          "ld-move-rtl", "ld-move-ttb", "ld-move-btt", "ld-move-fade-ltr", "ld-move-fade-rtl", "ld-move-fade-ttb",
          "ld-move-fade-btt", "ld-dim", "ld-swing", "ld-wander", "ld-pulse", "ld-cycle", "ld-cycle-alt", "ld-damage",
          "ld-fade", "ld-flip", "ld-flip-h", "ld-flip-v", "ld-float", "ld-jelly", "ld-jelly-alt", "ld-jingle",
          "ld-measure", "ld-metronome", "ld-orbit", "ld-rubber-h", "ld-rubber-v", "ld-rush-btt", "ld-rush-ttb",
          "ld-rush-ltr", "ld-rush-rtl", "ld-shake-h", "ld-shake-v", "ld-shiver", "ld-skew", "ld-skew-alt", "ld-slide-btt",
          "ld-slide-ltr", "ld-slide-rtl", "ld-slide-ttb", "ld-smash", "ld-spin", "ld-spin-fast", "ld-squeeze",
          "ld-swim", "ld-swing", "ld-tick-alt", "ld-vortex", "ld-vortex-alt", "ld-wander-h", "ld-wander-v"
        */
      const movement = this.action ? `ld-${this.action}` : 'ld-jump';
      // movement is 'undefined' will be random effect
      this.addAnimation(`#${this.iconId}`, movement);
    },
    mouseleave () {
      this.clearAnimation(`#${this.iconId}`);
    }
  },
  created () {
    this.iconId = this.uuid();
  }
};
</script>
<style>
.LAHButton {
  animation: 1s appear;
  margin: auto;
}

@keyframes appear {
  0% {
    opacity: 0;
  }
}
</style>
