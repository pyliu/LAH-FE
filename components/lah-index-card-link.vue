<template lang="pug">
b-card.anim-appear-1s.shadow.lah-index-card-link(
  @mouseenter="mouseenter"
  @mouseleave="mouseleave"
  @blur="mouseleave"
  :no-body="noBody"
)
  nuxt-link(:to="to")
    .mb-2.center(style="max-width: 56px; margin: auto;")
      font-awesome-icon(ref="icon" :icon="icon" :size="size" :class="variant" :spin="spin")
    b-card-title.center(:title-tag="titleTag"): slot
</template>

<script>
export default {
  props: {
    to: { type: String, default: '/' },
    icon: { type: Array, default: () => ['far', 'times-circle'] },
    size: { type: String, default: '3x' },
    action: { type: String, default: undefined },
    spin: { type: Boolean, default: false },
    iconVariant: { type: String, default: '' },
    noBody: { type: Boolean, default: false }
  },
  computed: {
    titleTag () {
      const size = parseInt(this.size.replace('x', '')) || 3
      if (size < 3) {
        return 'span'
      } else if (size <= 7) {
        return `h${8 - size}`
      }
      return 'h1'
    },
    variant () {
      switch (this.iconVariant) {
        case 'primary':
          return ['text-primary']
        case 'secondary':
          return ['text-secondary']
        case 'info':
          return ['text-info']
        case 'light':
        case 'white':
          return ['text-light']
        case 'dark':
        case 'black':
          return ['text-dark']
        case 'red':
        case 'danger':
          return ['text-danger']
        case 'yellow':
        case 'warning':
          return ['text-warning']
        case 'success':
        case 'green':
          return ['text-success']
        case 'muted':
        case 'silent':
        case 'fade':
          return ['text-muted']
        default:
          return ['']
      }
    }
  },
  methods: {
    mouseenter () {
      const movement = this.action ? `ld-${this.action.replace('ld-', '')}` : 'ld-jump'
      // movement is 'undefined' will be random effect
      this.$utils.addAnimation(this.$refs.icon, movement)
    },
    mouseleave () {
      this.$utils.clearAnimation(this.$refs.icon)
    }
  }
}
</script>

<style lang="scss">
.lah-index-card-link {
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: auto;
  border-radius: 10px;
  border: 1px solid gray;
  height: 100%;
}
.card {
  border-width: 2px;
}
</style>
