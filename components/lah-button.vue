<template lang="pug">
b-button.text-nowrap(
  :link="link"
  :variant="variant"
  :size="size"
  :pill="pill"
  :block="block"
  :pressed="pressed"
  :class="noBorder ? 'border-0 align-middle' : ' align-middle'"
  :href="href"
  :disabled="disabled"
  @mouseenter="mouseenter"
  @mouseleave="mouseleave"
  @blur="mouseleave"
  @click="emitClick($event)"
  style="display: flex; align-items: center; justify-content: center;"
)
  lah-fa-icon(
    ref="icon"
    v-if="!noIcon && !iconAppend"
    :prefix="faIconPrefix"
    :icon="iconByBusy"
    :size="iconSize"
    :append="iconAppend"
    :no-gutter="noIconGutter || $utils.empty($refs.slot?.textContent) "
    :variant="iconVariant"
    :flip="flip"
    :rotate="rotate"
    :spin="spin"
    :mirror="mirror",
    @icon="handleIconId"
  )
  span.ld-txt(v-if="busy") 讀取中...
  span(
    ref="slot",
    v-show="!busy"
  )
    slot
    b-badge.ml-1(
      v-if="showBadge"
      :variant="badgeVariant"
      :pill="badgePill"
    ) {{ badgeText }}
  lah-fa-icon.ml-1(
    ref="icon"
    v-if="!noIcon && iconAppend"
    :prefix="faIconPrefix"
    :icon="iconByBusy"
    :size="iconSize"
    :no-gutter="noIconGutter || $utils.empty($refs.slot?.textContent) "
    :variant="iconVariant"
    :flip="flip"
    :rotate="rotate"
    :spin="spin"
    :mirror="mirror",
    @icon="handleIconId"
  )
</template>

<script>
export default {
  props: {
    to: { type: String, default: undefined },
    href: { type: String, default: undefined },
    noBorder: { type: Boolean, default: false },
    variant: { type: String, default: 'outline-primary' },
    size: { type: String, default: 'sm' },
    icon: { type: String, default: '' },
    iconSize: { type: String, default: 'lg' },
    iconAppend: { type: Boolean, default: false },
    iconVariant: { type: String, default: '' },
    regular: { type: Boolean, default: false },
    brand: { type: Boolean, default: false },
    action: { type: String, default: undefined },
    pill: { type: Boolean, default: false },
    block: { type: Boolean, default: false },
    pressed: { type: Boolean, default: false },
    link: { type: Boolean, default: false },
    badgeText: { type: String, default: '' },
    badgeVariant: { type: String, default: 'light' },
    badgePill: { type: Boolean, default: true },
    busy: { type: Boolean, default: false },
    noIconGutter: { type: Boolean, default: false },
    noIcon: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    flip: { type: Boolean, default: false },
    spin: { type: Boolean, default: false },
    rotate: { type: String, default: '0' },
    mirror: { type: Boolean, default: false }
  },
  data: () => ({
    iconId: ''
  }),
  computed: {
    faIconPrefix () {
      return this.brand ? 'fab' : this.regular ? 'far' : 'fas'
    },
    showBadge () { return !this.$utils.empty(this.badgeText) },
    showIcon () { return !this.$utils.empty(this.icon) },
    iconByBusy () { return this.busy ? 'arrows-rotate' : this.icon },
    actionByBusy () { return this.busy ? 'cycle' : this.action }
  },
  watch: {
    iconId (val) {
      this.$emit('icon', val)
    },
    busy (flag) {
      flag ? this.mouseenter() : this.mouseleave()
    }
  },
  created () {
    // multiple events will holds for 50ms
    this.mouseenter = this.$utils.debounce(() => {
      if (!this.noIcon) {
        const movement = this.actionByBusy ? `ld-${this.actionByBusy.replace('ld-', '')}` : 'ld-breath'
        // movement is 'undefined' will be random effect
        this.$utils.addAnimation(`#${this.iconId}`, movement)
      }
    }, 50)
    this.mouseleave = this.$utils.debounce(() => {
      if (!this.noIcon && !this.busy) {
        this.$utils.clearAnimation(`#${this.iconId}`)
      }
    }, 50)
  },
  methods: {
    mouseenter () { /** placeholder */ },
    mouseleave () { /** placeholder */ },
    emitClick (evt) {
      if (this.$utils.empty(this.to)) {
        this.$emit('click', evt)
      } else {
        this.$router.push(this.to)
      }
      evt.stopPropagation()
    },
    handleIconId (id) {
      this.iconId = id
    }
  }
}
</script>
<style lang="scss" scoped>

</style>
