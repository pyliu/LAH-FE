<template lang="pug">
span(:class="alignClassName")
  i(v-if="!append" :id="iconId" :class="className" @click="emitClick($event)")
  slot
  i(v-if="append" :id="iconId" :class="className" @click="emitClick($event)")
</template>

<script>
export default {
  props: {
    size: { type: String, default: '' },
    prefix: { type: String, default: 'fas' },
    icon: { type: String, default: 'exclamation-circle' },
    variant: { type: String, default: '' },
    action: { type: String, default: '' },
    append: { type: Boolean, default: false },
    alignMiddle: { type: Boolean, default: true },
    regular: { type: Boolean, default: false },
    brand: { type: Boolean, default: false },
    noGutter: { type: Boolean, default: false }
  },
  data: () => ({
    iconId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx'
  }),
  computed: {
    className () {
      let prefix = this.prefix || 'fas'
      this.regular && (prefix = 'far')
      this.brand && (prefix = 'fab')
      const icon = this.icon || 'exclamation-circle'
      let size = ''
      switch (this.size) {
        case 'xs':
          size = 'fa-xs'
          break
        case 'sm':
          size = 'fa-sm'
          break
        case 'lg':
          size = 'fa-lg'
          break
        default:
          if (this.size && this.size[this.size.length - 1] === 'x') {
            size = `fa-${this.size}`
          }
          break
      }
      const gutter = this.noGutter ? '' : (this.append ? ' ml-1' : ' mr-1')
      // remove empty val from array
      return this.$utils.without(
        [this.textVariant, prefix, `fa-${icon}`, size, this.ldMovement, 'my-auto', gutter],
        '', undefined, null
      )
    },
    textVariant () { return this.$utils.empty(this.variant) ? '' : `text-${this.variant}` },
    ldMovement () { return this.$utils.empty(this.action) ? '' : `ld ld-${this.action.replace('ld-', '')}` },
    alignClassName () { this.alignMiddle ? 'align-middle my-auto' : '' },
    hasSlot () { return !this.$utils.empty(this.$slots.default) }
  },
  mounted () {
    this.iconId = this.$utils.uuid()
  },
  methods: {
    emitClick (evt, stopPropagation = false) {
      this.$emit('click')
      stopPropagation && evt && evt.stopPropagation()
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
