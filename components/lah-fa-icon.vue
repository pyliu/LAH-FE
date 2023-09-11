<template lang="pug">
span.d-inline-flex.align-items-center.my-auto
  font-awesome-icon(
    v-if="!append && !$utils.empty(icon)",
    :id="iconId",
    :icon="iconArray",
    :size="size",
    :variant="variant",
    :class="className",
    :spin="spin",
    :fixed-width="fixedWidth",
    :flip="flipVar",
    :border="border",
    :transform="transform",
    @click="emitClick($event)"
  )
  slot
  font-awesome-icon(
    v-if="append && !$utils.empty(icon)",
    :id="iconId",
    :icon="iconArray",
    :size="size",
    :variant="variant",
    :class="className",
    :spin="spin",
    :fixed-width="fixedWidth",
    :flip="flipVar",
    :border="border",
    :transform="transform",
    @click="emitClick($event)"
  )
</template>

<script>
export default {
  props: {
    size: { type: String, default: '1x' },
    prefix: { type: String, default: 'fas' },
    icon: { type: String, default: 'exclamation-circle' },
    variant: { type: String, default: '' },
    action: { type: String, default: '' },
    append: { type: Boolean, default: false },
    regular: { type: Boolean, default: false },
    brand: { type: Boolean, default: false },
    noGutter: { type: Boolean, default: false },
    // new added for font-awesome-icon
    spin: { type: Boolean, default: false },
    flip: { type: Boolean, default: false },
    fixedWidth: { type: Boolean, default: false },
    rotate: { type: String, default: '0' },
    mirror: { type: Boolean, default: false },
    border: { type: Boolean, default: false },
    pull: { type: String, default: 'left' }, // left or right
    transform: { type: String, default: '' }
  },
  data: () => ({
    iconId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx'
  }),
  computed: {
    className () {
      const gutter = this.noGutter ? '' : (this.append ? ' ml-1' : ' mr-1')
      // remove empty val from array
      return this.$utils.without(
        [this.textVariant, this.ldMovement, 'my-auto', gutter],
        '', undefined, null
      )
    },
    textVariant () { return this.$utils.empty(this.variant) ? '' : `text-${this.variant}` },
    ldMovement () { return this.$utils.empty(this.action) ? '' : `ld ld-${this.action.replace('ld-', '')}` },
    hasSlot () { return !this.$utils.empty(this.$slots.default) },
    iconArray () {
      const pre = this.regular ? 'far' : (this.brand ? 'fab' : 'fas')
      return [pre, this.icon]
    },
    flipVar () {
      if (this.flip === true) {
        return true
      }
      if (this.mirror) {
        return 'horizontal'
      }
      return false
    }
  },
  mounted () {
    this.iconId = this.$utils?.uuid()
  },
  methods: {
    emitClick (evt, stopPropagation = false) {
      this.$emit('click')
      stopPropagation && evt?.stopPropagation()
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
