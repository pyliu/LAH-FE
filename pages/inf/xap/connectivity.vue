<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto: lah-fa-icon(icon="wave-square", action="squeeze") 即時全國地所跨域主機監控
          lah-button(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            title="說明"
          )
        .d-flex.align-items-center
          b-checkbox.mr-1(v-model="displayShortName", size="lg") 顯示別名
          b-checkbox(v-model="displayDanger", size="lg") 連線狀態錯誤
          lah-button(
            icon="link-slash",
            no-border,
            title="顯示離線紀錄",
            variant="outline-danger",
            size="lg",
            @click="showOfflineRecords"
          ) 顯示離線紀錄
  lah-help-modal(:modal-id="'help-modal'", size="md")
      ul
        li 提供顯示全國各所跨域主機服務狀態。
        li 每1分鐘左右重新更新一次
      hr
      div 🟢 表示一切正常
      div 🟡 表示狀態更新中
      div 🔴 表示狀態錯誤
  lah-transition: h3.center(v-if="displayDanger && red.length === 0")
    lah-fa-icon.mr-1(icon="circle-check", variant="success")
    span 目前各地所皆可正常連線
  client-only
    transition-group(name="list", mode="out-in"): component.mr-2.mb-2(
      v-for="(data, idx) in officesData",
      v-show="isOn(data)",
      :ref="data.ID",
      :key="`${data.ID}-${idx}`",
      is="lahBadgeSiteStatus",
      :watch-site="data.ID",
      :fill="false",
      :short="displayShortName",
      pill,
      @updated="handleUpdated"
    )
</template>

<script>
import lahOfficeDownTimeline from '~/components/lah-office-down-timeline.vue'
export default {
  components: { lahOfficeDownTimeline },
  middleware: ['isInf'],
  data: () => ({
    displayDanger: false,
    displayShortName: true,
    officesData: [],
    officeStateMap: new Map(),
    red: [],
    green: [],
    yellow: []
  }),
  head: {
    title: '全國地所跨域主機監控-桃園市地政局'
  },
  computed: {},
  watch: {
    displayDanger (val) {
      this.setCache('/inf/xap/connectivity/displayDanger', val, 7 * 24 * 60 * 60 * 1000)
    },
    displayShortName (val) {
      this.setCache('/inf/xap/connectivity/displayShortName', val, 7 * 24 * 60 * 60 * 1000)
    }
  },
  created () {
    this.getCache('/inf/xap/connectivity/displayDanger').then((flag) => {
      this.displayDanger = flag
    })
    this.getCache('/inf/xap/connectivity/displayShortName').then((flag) => {
      this.displayShortName = flag
    })
    this.filterByLight = this.$utils.debounce(() => {
      this.red.length = 0
      this.yellow.length = 0
      this.green.length = 0
      this.officeStateMap.forEach((value, key, map) => {
        if (value.status > 0) {
          this.green.push(key)
        } else {
          this.red.push(key)
        }
      })
    }, 500)
    this.prepareOfficesData()
  },
  mounted () {},
  methods: {
    isOn (data) {
      if (this.displayDanger) {
        return this.red.includes(data.ID)
      }
      return true
    },
    prepareOfficesData () {
      this.getCache(this.officeCacheKey).then((json) => {
        if (json === false) {
          this.$axios.post(this.$consts.API.JSON.SYSTEM, {
            type: 'all_offices'
          }).then(({ data }) => {
            if (Array.isArray(data.raw)) {
              this.officesData = [...data.raw.filter(item => !['CB', 'CC'].includes(item.ID))]
              // a day ms
              const cacheMs = 24 * 60 * 60 * 1000
              this.setCache(this.useZoneCacheKey, data, cacheMs)
            } else {
              this.$utils.error('無法取得各地政事務所資料。', data)
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
          })
        } else if (Array.isArray(json.raw)) {
          this.officesData = [...json.raw.filter(item => !['CB', 'CC'].includes(item.ID))]
          this.$utils.log('已從快取回復各地政事務所資料。')
        } else {
          this.$utils.error('無法從快取回復各地政事務所資料。')
        }
      })
    },
    handleUpdated (data) {
      this.officeStateMap.set(data.site, data)
      // debounced method with 500ms
      this.filterByLight()
    },
    showOfflineRecords () {
      this.modal(this.$createElement(lahOfficeDownTimeline, {
        props: {
          maxHeight: false
        }
      }), {
        title: '離線伺服器歷史資訊'
      })
    }
  }
}
</script>

<style lang="scss">
</style>
