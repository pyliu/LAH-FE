<template lang="pug">
b-card(
  :class="classNames"
)
  b-card-title: .d-flex.align-items-center
    lah-transition
      lah-fa-icon(v-if="ready", icon="circle-check", variant="success", size="lg")
      lah-fa-icon(v-else, icon="pause", variant="muted", size="lg")
    .ml-1 第一次登記
    lah-transition: b-badge.ml-1(:variant="badgeVar", pill, v-if="ready") {{ count }}
    lah-transition: lah-button.ml-1(
      v-if="ready"
      icon="window-maximize",
      title="顯示案件列表",
      :disabled="isBusy",
      pill,
      no-icon-gutter,
      @click="$refs.table.show()"
    )
    lah-button.ml-1(
      icon="arrow-rotate-right",
      action="spin",
      title="重新查詢",
      :disabled="isBusy",
      :spin="isBusy",
      pill,
      no-icon-gutter,
      @click="query"
    )
  b-card-sub-title(v-if="!$utils.empty(period)") {{ period }}
  b-modal(
    ref="table",
    size="lg",
    :title="`第一次登記案件列表 ${period}`",
    hide-footer
  )
    lah-reg-b-table(
      :baked-data="raw",
      :max-height-offset="135"
    )
</template>

<script>
export default {
  emit: ['ready'],
  component: {},
  props: {
    begin: { type: String, default: '' },
    end: { type: String, default: '' },
    noBorder: { type: Boolean, default: false }
  },
  data: () => ({
    ready: false,
    raw: []
  }),
  computed: {
    classNames () {
      const list = []
      if (this.noBorder) {
        list.push('border-0')
      }
      return list
    },
    count () {
      return this.raw?.length || 0
    },
    period () {
      if (this.$utils.empty(this.begin) || this.$utils.empty(this.end)) {
        return ''
      }
      return `${this.$utils.addDateDivider(this.begin)} ~ ${this.$utils.addDateDivider(this.end)}`
    },
    badgeVar () {
      if (this.count === 0) {
        return 'warning'
      }
      return 'info'
    }
  },
  watch: {
    begin (dontcare) {
      this.raw = []
      this.ready = false
    },
    end (dontcare) {
      this.raw = []
      this.ready = false
    }
  },
  created () {},
  mounted () {},
  methods: {
    query () {
      this.isBusy = true
      this.ready = false
      this.raw = []
      this.$axios.post(this.$consts.API.JSON.STATS, {
        type: 'stats_reg_first_count',
        st: this.begin,
        ed: this.end
      }).then(({ data }) => {
        this.raw = data.raw
        this.$emit('ready', data)
        this.ready = true
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
