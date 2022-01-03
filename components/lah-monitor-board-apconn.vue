<template lang="pug">
b-card(no-body)
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(:icon="icon", :variant="light"): strong {{ header }} #[span.text-muted.s-75 (總數：{{ totalCount }})]
    b-button-group(size="sm")
      b-checkbox.my-auto(v-model="allSwitch", size="sm") 全部
      lah-button(
        icon="arrow-alt-circle-left",
        action="move-fade-rtl",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        regular,
        @click="navLeft",
        :title="`切換至 ${prevSvr}`"
      )
      lah-button(
        icon="arrow-alt-circle-right",
        action="move-fade-ltr",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        regular,
        @click="navRight",
        :title="`切換至 ${nextSvr}`"
      )
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
        li 可利用「全部」切換為系統連線顯示(包含使用者及其他伺服器連線)
        li 60秒更新資料一次
      hr
      lah-fa-icon(icon="palette") 顏色說明(若切換為全部顯示，臨界值會乘上3倍)
      div #[lah-fa-icon(icon="circle", style="color: rgb(214, 214, 214)")] 灰色 - 連線數 1 ~ 2
      div #[lah-fa-icon(icon="circle", style="color: rgb(164, 236, 119)")] 綠色 - 連線數 3 ~ 4
      div #[lah-fa-icon(icon="circle", style="color: rgb(255, 193, 7)")] 黃色 - 連線數 5 ~ 8
      div #[lah-fa-icon(icon="circle", style="color: rgb(220, 53, 29)")] 紅色 - 連線數 9 ~ 16
      div #[lah-fa-icon(icon="circle", style="color: rgb(204, 0, 204)")] 紫色 - 連線數 17 ~ 32
      div #[lah-fa-icon(icon="circle", style="color: rgb(51, 51, 51)")] 黑色 - 連線數大於32
  //- b-carousel(
  //- )
  .center.mt-5(v-if="loadItems.length === 0") ⚠ {{ apIp }} 無資料
  lah-chart(v-show="loadItems.length > 0" ref="chart" :type="type")
</template>

<script>
export default {
  name: 'LahMonitorBoardApconn',
  props: {
    maximized: { type: Boolean, default: false },
    line: { type: Boolean, default: false },
    all: { type: Boolean, default: false }
  },
  data: () => ({
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
    header () { return this.allSwitch ? 'AP系統連線狀態' : 'AP使用者連線狀態' },
    icon () { return this.allSwitch ? 'server' : 'users' },
    light () {
      return this.allSwitch ? 'info' : 'secondary'
    },
    totalCount () { return this.loadItems.reduce((acc, item) => acc + item[1], 0) },
    ipPrefix () {
      const ipParts = this.apIp.split('.')
      ipParts.pop()
      return ipParts.join('.')
    },
    currSvr () { return this.apIp.split('.')[3] },
    prevSvr () {
      let currIdx = -1
      this.carousel.find((item, idx, array) => {
        const found = item == this.currSvr
        currIdx = found ? idx : -1
        return found
      })
      const prevIdx = (currIdx - 1) === -1 ? this.carousel.length - 1 : currIdx - 1
      return `${this.ipPrefix}.${this.carousel[prevIdx]}`
    },
    nextSvr () {
      let currIdx = -1
      this.carousel.find((item, idx, array) => {
        const found = item == this.currSvr
        currIdx = found ? idx : -1
        return found
      })
      const nextIdx = (currIdx + 1) % this.carousel.length
      return `${this.ipPrefix}.${this.carousel[nextIdx]}`
    }
  },
  watch: {
    allSwitch (dontcare) { this.reload() },
    apIp (dontcare) { this.reload() }
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
    navLeft () { this.apIp = this.prevSvr },
    navRight () { this.apIp = this.nextSvr },
    popupMaximize () {
      this.modal(
        this.$createElement('LahMonitorBoardApconn', {
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
        // 起始顯示之AP
        this.apIp = this.systemConfigs.webap_ip || '220.1.34.161'
        // 全部AP的IP尾數
        let apPostfix = this.systemConfigs.webap_postfix
        if (!apPostfix) {
          let configs = await this.getCache('SYSYEM_CONFIGS')
          if (!configs) {
            const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, { type: 'configs' })
            configs = { ...data.raw }
            // cached for a day
            this.setCache('SYSYEM_CONFIGS', configs, 24 * 60 * 60 * 1000)
          }
          apPostfix = configs.WEBAP_POSTFIXES
        }
        if (apPostfix) {
          // expect ip postfix string => "205, 206, 207, 156, 118, 60, 161"
          const list = apPostfix.split(',')
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
          this.$utils.warn('找不到 WEBAP POSTFIX 設定，使用 HA 預設！')
        }
      } catch (e) {
        this.$utils.error('讀取系統設定失敗', e)
      }
    },
    backgroundColor (element) {
      const factor = this.allSwitch ? 3 : 1
      if (element[1] > 32 * factor) { return { R: 51, G: 51, B: 51 } } // black
      if (element[1] > 16 * factor) { return { R: 204, G: 0, B: 204 } } // purple
      if (element[1] > 8 * factor) { return { R: 220, G: 53, B: 29 } } // red
      if (element[1] > 4 * factor) { return { R: 255, G: 193, B: 7 } } // yellow
      if (element[1] > 2 * factor) { return { R: 164, G: 236, B: 119 } } // green
      // gray
      return { R: 214, G: 214, B: 214 }
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
              const item = { x: element[0], y: element[1], color: this.backgroundColor(element) }
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
          clearTimeout(this.reloadTimer)
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
