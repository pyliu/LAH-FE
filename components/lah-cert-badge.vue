<template lang="pug">
b-button(
  :variant="variant",
  :pill="pill",
  :size="size",
  :disabled="isBusy",
  @click="query",
  title="重新讀取",
  v-b-tooltip="message"
): .d-flex.align-items-center
  span {{ certNo }}
  b-badge.ml-1(:variant="badgeVariant") {{ caseNo }}
  lah-transition: lah-fa-icon.ml-1(
    v-if="isBusy",
    icon="arrow-rotate-right",
    action="spin"
  )
</template>

<script>
export default {
  emit: ['fetched'],
  component: {},
  props: {
    pill: { type: Boolean, default: true },
    badge: { type: Boolean, default: true },
    size: { type: String, default: 'md' },
    badgeVariant: { type: String, default: 'light' }
  },
  data: () => ({
    message: '',
    record: []
  }),
  computed: {
    caseNo () {
      if (this.$utils.empty(this.record)) {
        return this.isBusy ? '讀取中' : '無案件資料'
      }
      return `${this.record.XS03}-${this.record.XS04_1}-${this.record.XS04_2}`
    },
    certNo () {
      if (this.$utils.empty(this.record)) {
        return this.isBusy ? '讀取中' : '無權狀資料'
      }
      return this.record.XS16
    },
    variant () {
      if (this.isBusy) {
        return 'warning'
      }
      return 'primary'
    }
  },
  watch: {},
  created () {},
  mounted () {
    this.query()
  },
  methods: {
    query () {
      this.isBusy = true
      this.message = '讀取中 ...'
      this.record = null
      this.$axios
        .post(this.$consts.API.JSON.MOICAT, {
          // type: 'moicat_rxseq',
          type: 'moicat_rxseq_latest'
        }).then(({ data }) => {
          this.message = data.message
          this.record = data.raw
          this.$emit('fetched', data)
        }).catch((err) => {
          this.error = err
        }).finally(() => {
          this.isBusy = false
        })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
