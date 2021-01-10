<template>
  <span class="align-middle my-auto">
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
    align: { type: String, default: "" },
  },
  data: () => ({
    iconId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx'
  }),
  computed: {
    className () {
      let prefix = this.prefix || "fas";
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
      return `${this.textVariant} ${prefix} fa-${icon} ${size} ${this.ldMovement}`;
    },
    textVariant () { return this.$utils.empty(this.variant) ? '' : `text-${this.variant}` },
    ldMovement () { return this.$utils.empty(this.action) ? '' : `ld ld-${this.action.replace('ld-', '')}` }
  },
  methods: {
    emitClick (evt) {
      this.$emit('click')
    }
  },
  mounted () {
    this.iconId = this.$utils.uuid()
  }
}
</script>

<style lang="scss" scoped>
</style>
