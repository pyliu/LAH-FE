<template>
  <b-button
    :link="link"
    :variant="variant"
    :size="size"
    :pill="pill"
    :block="block"
    :pressed="pressed"
    :class="noBorder ? 'border-0 align-middle' : ' align-middle'"
    :href="href"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
    @blur="mouseleave"
    @focus="mouseenter"
    @click="emitClick($event)"
    style="display: flex; align-items: center; justify-content: center;"
  >
    <lah-fa-icon
      :id="iconId"
      :prefix="faIconPrefix"
      :icon="icon"
      :size="iconSize"
      :append="iconAppend"
    >
      <span v-show="busy" class="ld-txt">讀取中...</span>
      <span v-show="!busy">
        <slot></slot>
        <b-badge
          v-if="showBadge"
          :variant="badgeVariant"
          :pill="badgePill"
        >
          {{ badgeText }}
        </b-badge>
      </span>
    </lah-fa-icon>
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
    iconSize: { type: String, default: 'lg' },
    iconAppend: { type: Boolean, default: false },
    regular: { type: Boolean, default: false },
    brand: { type: Boolean, default: false },
    action: { type: String, default: undefined },
    click: { type: Function, default: () => { console.log("%c BUTTON Click", 'color: red; font-size: 2rem;') } },
    pill: { type: Boolean, default: false },
    block: { type: Boolean, default: false },
    pressed: { type: Boolean, default: false },
    link: { type: Boolean, default: false },
    badgeText: { type: String, default: '' },
    badgeVariant: { type: String, default: 'light' },
    badgePill: { type: Boolean, default: true },
    busy: { type: Boolean, default: false }
  },
  data: () => ({
    iconId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx'
  }),
  watch: {
    busy (flag) {

    }
  },
  computed: {
    faIconPrefix () {
      return this.brand ? 'fab' : this.regular ? 'far' : 'fas';
    },
    showBadge () { return !this.$utils.empty(this.badgeText) },
    showIcon () { return !this.$utils.empty(this.icon) }
  },
  methods: {
    emitClick (evt) {
      this.$emit('click', this.click);
      evt.stopPropagation();
    },
    mouseenter () {
      const movement = this.action ? `ld-${this.action.replace('ld-', '')}` : 'ld-breath';
      // movement is 'undefined' will be random effect
      this.$utils.addAnimation(`#${this.iconId}`, movement);
    },
    mouseleave () {
      this.$utils.clearAnimation(`#${this.iconId}`);
    }
  },
  created () {
    this.iconId = this.$utils.uuid();
  }
}
</script>
<style lang="scss" scoped>

</style>
