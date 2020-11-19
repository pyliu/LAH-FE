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
    @click="emitClick($event)"
  >
    <font-awesome-icon
      v-if="showIcon"
      :id="iconId"
      :icon="[faIconPrefix, icon]"
      :size="iconSize"
      :pull="pull"
      class="mx-auto my-auto"
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
    iconSize: { type: String, default: 'lg' },
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
};
</script>
<style>
</style>
