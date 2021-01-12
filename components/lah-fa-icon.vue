<template>
  <span :class="alignClassName">
    <i v-if="!append" :id="iconId" :class="className" @click="emitClick($event)"></i>
    <slot></slot>
    <i v-if="append" :id="iconId" :class="className" @click="emitClick($event)"></i>
  </span>
</template>

<script>
export default {
  props: {
    size: { type: String, default: "" },
    prefix: { type: String, default: "fas" },
    icon: { type: String, default: "exclamation-circle" },
    variant: { type: String, default: "" },
    action: { type: String, default: "" },
    append: { type: Boolean, default: false },
    alignMiddle: { type: Boolean, default: true },
    regular: { type: Boolean, default: false },
    brand: { type: Boolean, default: false },
    noGutter: { type: Boolean, default: false}
  },
  data: () => ({
    iconId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx'
  }),
  computed: {
    className () {
      let prefix = this.prefix || "fas";
      this.regular && (prefix = 'far')
      this.brand && (prefix = 'fab')
      let icon = this.icon || "exclamation-circle";
      let size = "";
      switch (this.size) {
        case "xs":
          size = "fa-xs";
          break;
        case "sm":
          size = "fa-sm";
          break;
        case "lg":
          size = "fa-lg";
          break;
        default:
          if (this.size && this.size[this.size.length - 1] === "x") {
            size = `fa-${this.size}`;
          }
          break;
      }
      return `${this.textVariant} ${prefix} fa-${icon} ${size} ${this.ldMovement} my-auto ${this.noGutter ? '' : (this.append ? ' ml-1' : ' mr-1')}`;
    },
    textVariant () { return this.$utils.empty(this.variant) ? '' : `text-${this.variant}` },
    ldMovement () { return this.$utils.empty(this.action) ? '' : `ld ld-${this.action.replace('ld-', '')}` },
    alignClassName () { this.alignMiddle ? 'align-middle my-auto' : '' },
    hasSlot () { return !this.$utils.empty(this.$slots['default']) }
  },
  methods: {
    emitClick (evt, stopPropagation = false) {
      this.$emit('click')
      stopPropagation && evt && evt.stopPropagation()
    }
  },
  mounted () {
    this.iconId = this.$utils.uuid()
  }
}
</script>

<style lang="scss" scoped>
</style>
