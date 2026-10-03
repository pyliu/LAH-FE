<template lang="pug">
span.d-inline-flex.align-items-center.my-auto(
  @mouseover="emitEvent('mouseover', $event)",
  @mouseleave="emitEvent('mouseleave', $event)",
  @click="emitEvent('click', $event)"
)
  font-awesome-icon(
    v-if="!append && !empty(icon)",
    :id="iconId",
    :icon="iconArray",
    :size="size",
    :variant="variant",
    :class="className",
    :spin="spin",
    :fixed-width="fixedWidth",
    :flip="flipVar",
    :border="border",
    :transform="transform"
  )
  slot
  font-awesome-icon(
    v-if="append && !empty(icon)",
    :id="iconId",
    :icon="iconArray",
    :size="size",
    :variant="variant",
    :class="className",
    :spin="spin",
    :fixed-width="fixedWidth",
    :flip="flipVar",
    :border="border",
    :transform="transform"
  )
</template>

<script>
import isEmpty from 'lodash/isEmpty'
import without from 'lodash/without'

export default {
  emit: ['click', 'mouseover', 'mouseleave', 'icon'],
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
      const withoutFn = this.$utils?.without || without
      return withoutFn(
        [this.textVariant, this.ldMovement, 'my-auto', gutter],
        '', undefined, null
      )
    },
    textVariant () { return this.empty(this.variant) ? '' : `text-${this.variant}` },
    ldMovement () { return this.empty(this.action) ? '' : `ld ld-${this.action.replace('ld-', '')}` },
    hasSlot () { return !this.empty(this.$slots.default) },
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
  watch: {
    iconId (val) {
      // emit icon-id out
      this.$emit('icon', val)
    }
  },
  mounted () {
    this.iconId = this.$utils?.uuid?.() || this.generateUuid()
  },
  methods: {
    empty (val) {
      return this.$utils?.empty ? this.$utils.empty(val) : isEmpty(val)
    },
    generateUuid () {
      let d = Date.now()
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now()
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
      })
    },
    emitEvent (evtType, evt, stopPropagation = false) {
      this.$emit(evtType)
      stopPropagation && evt?.stopPropagation()
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
