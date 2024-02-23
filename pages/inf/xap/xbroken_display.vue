<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-center.w-100.my-auto
        .d-flex
          .h1 跨域ONLINE即時通，服務無礙一點通
          //- lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        div
    lah-help-modal(:modal-id="'help-modal'" size="xl"): lah-button(icon="exclamation-circle" variant="danger")
  //- below is the customize area
  //- b-card-group(deck)
  lah-fa-icon.h1(icon="wave-square", action="squeeze") 桃園市各所狀態
  hr.my-3
  client-only: .offices.justify-content-between
    lah-badge-site-status.office(
      v-for="office in offices",
      :ref="office",
      :key="office"
      :watch-site="office",
      :period="hxTimer",
      :fill="false",
      :badge="false",
      text-variant="",
      text-bold,
      short-alt
    )
  .my-3
  lah-fa-icon.h1(
    icon="heart-pulse",
    action="heartbeat",
    :variant="downOffices.length === 0 ? 'success' : 'danger'"
  ) 無法提供服務的地所 (更新時間：#[div {{ updatedTime }}])
  hr.my-3
  .h1.center(
    v-if="downOffices.length === 0"
  ) 🟢 全國各地所皆可正常提供服務
  .d-flex.flex-wrap(
    v-else
  )
    lah-badge-site-status.other-office.m-1(
      v-for="office in downOffices",
      :ref="office.id",
      :key="office.id",
      :static-data="office",
      :fill="false",
      :badge="false",
      short-alt
    )

</template>

<script>
export default {
  data: () => ({
    offices: ['HA', 'HB', 'HC', 'HD', 'HE', 'HF', 'HG', 'HH'],
    hxTimer: '60000', // 1 min
    cachedTimer: 300000, // 5 mins
    cachedOfficesData: [],
    cachedHandler: null,
    updatedTime: ''
  }),
  fetch () {},
  head: {
    title: '跨域ONLINE即時通-桃園市地政局'
  },
  computed: {
    downOffices () {
      return [...this.cachedOfficesData.filter(siteData => siteData.state === 'DOWN')]
    }
  },
  watch: {},
  created () {
    this.reload()
  },
  mounted () {},
  methods: {
    reload (force = false) {
      clearTimeout(this.cachedHandler)
      this.cachedOfficesData = []
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_xap_stats',
          force
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.cachedOfficesData = [...data.raw]
          }
          this.updatedTime = this.$utils.formatTime(new Date())
        })
        .catch((err) => {
          this.$utils.error(err)
        })
        .finally(() => {
          this.timeout(this.reload, this.cachedTimer).then((handle) => {
            this.cachedHandler = handle
          })
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.offices {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: 100%;
  align-content: flex-start;
  .office {
    width: 11%;
    height: 15vh;
    border: 1px solid gray;
    border-radius: 15px;
    font-size: xx-large;
  }
}
.other-office {
  width: 11%;
  height: 15vh;
  border: 1px solid gray;
  border-radius: 15px;
  font-size: xx-large;
}
</style>
