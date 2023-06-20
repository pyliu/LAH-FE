<template lang="pug">
lah-transition: span(v-if="!hide")
  span {{ message }}
  lah-fa-icon.ml-1(
    v-if="closeMark && !$utils.empty(message)",
    icon="circle-xmark",
    size="sm",
    role="button",
    title="關閉訊息",
    :variant="closeVariant",
    @click="close"
  )
</template>

<script>
export default {
  emit: ['hide', 'changed'],
  component: {},
  props: {
    message: { type: String, default: '' },
    autoHide: { type: Boolean, default: false },
    autoHideTime: { type: String, default: '10000' },
    closeMark: { type: Boolean, default: true },
    closeVariant: { type: String, default: 'secondary' }
  },
  data: () => ({
    hide: false
  }),
  computed: {
    autoHideTimeInt () {
      return parseInt(this.autoHideTime)
    }
  },
  watch: {
    message (val) {
      this.hide = false
      this.$emit('changed', val)
      if (this.autoHide) {
        this.debounceHide()
      }
    }
  },
  created () {
    this.debounceHide = this.$utils.debounce(() => { this.hide = true }, this.autoHideTime)
  },
  mounted () {},
  methods: {
    close () {
      this.hide = true
      this.$emit('hide', this.message)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
