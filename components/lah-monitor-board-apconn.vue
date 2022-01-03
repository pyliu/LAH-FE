<template lang="pug">
b-card(no-body)
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="users", :variant="light")
    strong {{ header }} #[span.text-muted.s-75 (連線總數：{{ totalCount }})]
    b-button-group.ml-auto(size="sm")
      b-checkbox.my-auto(v-model="allSwitch", size="sm") 全部
      lah-button(
        :icon="type === 'bar' ? 'chart-line' : 'chart-bar'",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="type = type === 'bar' ? 'line' : 'bar'",
        title="切換圖形"
      )
      lah-button(
        v-if="!maximized",
        icon="window-maximize",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        regular,
        @click="popupMaximize",
        title="放大顯示"
      )
      lah-button(
        v-if="!maximized",
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="showModalById(modalId)",
        title="說明"
      )
    lah-help-modal(:modal-id="modalId", :modal-title="`${header} 監控說明`")
      ul
        li 顯示AP連線數統計狀態(AP需安裝回報腳本才能正常顯示)
        li 可利用 #[lah-fa-icon(:icon="type === 'bar' ? 'chart-line' : 'chart-bar'", variant="primary")] 切換圖形
        li 可利用「全部」切換非人使用者顯示
        li 60秒更新資料一次
  lah-chart(ref="chart" :type="type")
</template>

<script>
export default {
  props: {
    maximized: { type: Boolean, default: false },
    line: { type: Boolean, default: false },
    all: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'AP使用者連線數',
    type: 'bar',
    apIp: '220.1.34.161',
    carousel: [
      '205',
      '206',
      '207',
      '62',
      '156',
      '118',
      '60',
      '161'
    ],
    reloadTimer: null,
    updatedTime: '',
    allSwitch: false,
    loadItems: [],
    skipNames: ['資料庫', '系統管理者']
  }),
  computed: {
    light () {
      return this.allSwitch ? 'info' : 'secondary'
    },
    totalCount () { return this.loadItems.reduce((acc, item) => acc + item[1], 0) }
  },
  watch: {
    allSwitch (dontcare) { this.reload() }
  },
  created () {
    this.modalId = this.$utils.uuid()
    this.reload = this.$utils.debounce(this.loadAPConnectionCount, 1000)
    this.type = this.line ? 'line' : 'bar'
    this.allSwitch = this.all
    this.loadConfig()
  },
  mounted () {
    this.loadAPConnectionCount()
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
  },
  methods: {
    reload () { /* placeholder for loadAPConnectionCount  */ },
    popupMaximize () {
      this.modal(
        this.$createElement('lah-monitor-board-apconn', {
          props: {
            maximized: true,
            all: this.all,
            line: this.line
          }
        }),
        {
          title: 'AP使用者連線數',
          size: 'xl'
        }
      )
    },
    async loadConfig () {
      try {
        let configs = await this.getCache('SYSYEM_CONFIGS')
        if (!configs) {
          const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, { type: 'configs' })
          configs = { ...data.raw }
          // cached for a day
          this.setCache('SYSYEM_CONFIGS', configs, 24 * 60 * 60 * 1000)
        }
        // 起始顯示之AP
        this.apIp = configs.WEBAP_IP || '220.1.34.161'
        if (configs.WEBAP_POSTFIXES) {
          // expect ip postfix string => "205, 206, 207, 156, 118, 60, 161"
          const list = configs.WEBAP_POSTFIXES.split(',')
            .sort((a, b) => {
              if (parseInt(a) < parseInt(b)) {
                return 1
              }
              if (parseInt(a) > parseInt(b)) {
                return -1
              }
              // a 必須等於 b
              return 0
            })
            .map((postfix) => {
              const integer = parseInt(postfix.trim())
              if (integer && integer < 255 && integer > 0) {
                return integer
              }
              console.warn(
                `The webap ip postfix from config(WEBAP_POSTFIXES) format is wrong => "${postfix}"`
              )
              return undefined
            })
            .filter((item) => {
              return item !== undefined
            })
          this.carousel = [...list]
        } else {
          this.$utils.warn('找不到 configs.WEBAP_POSTFIXES 使用 HA 預設！')
        }
      } catch (e) {
        this.$utils.error('讀取系統設定失敗', e)
      }
    },
    loadAPConnectionCount () {
      clearTimeout(this.reloadTimer)
      this.$refs.chart?.reset()
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_latest_ap_conn',
          ap_ip: this.apIp,
          all: this.allSwitch // IP that is marked by "SERVER" in IPResolver.db will be filtered when the switch is false
        })
        .then(({ data }) => {
          if (data.data_count && data.data_count > 0) {
            const processing = new Map()
            data.raw.forEach((item, idx, array) => {
              /*
                  item = {
                      log_time: '20201005181631',
                      ap_ip: '220.1.34.161',
                      est_ip: '220.1.35.36',
                      count: '2',
                      batch: '490',
                      name: '資訊主機'
                  }
              */
              // skip 資料庫/系統管理者
              if (!this.skipNames.includes(item.name)) {
                const current = processing.get(item.name)
                const tobeUpdated = current === undefined ? item.count : current + item.count
                processing.set(item.name, tobeUpdated)
              }
            })
            this.loadItems = [...processing]
            this.loadItems.forEach((element) => {
              const item = { x: element[0], y: element[1] }
              this.$refs.chart?.addData(item, this.apIp, 0)
            })
            this.$refs.chart?.build()
          }
        })
        .catch((err) => {
          this.error = err
        })
        .finally(() => {
          this.updatedTime = this.$utils.now().split(' ')[1]
          // reload every 60s
          this.reloadTimer = this.timeout(
            this.loadAPConnectionCount,
            60 * 1000
          )
        })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
