<template lang="pug">
lah-fa-icon.small.my-auto.text-nowrap(
  icon="clock",
  regular,
  :variant="variant",
  :title="adDatetime()"
) {{ humanText() }}
</template>

<script>
export default {
  emit: [],
  component: {},
  props: {
    variant: { type: String, default: 'muted' },
    seconds: { type: Number, default: 0 }
  },
  data: () => ({}),
  computed: {},
  watch: {},
  created () {},
  mounted () {},
  methods: {
    humanText (ts) {
      return this.$utils.formatDistanceToNow((ts || this.seconds) * 1000)
    },
    adDatetime (ts) {
      return this.$utils.phpTsToAdDateStr(ts || this.seconds, true)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
