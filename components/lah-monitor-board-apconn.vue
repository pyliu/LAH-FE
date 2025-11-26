<template lang="pug">
b-card(ref="card", no-body, :border-variant="borderVariant")
  template(#header): .d-flex.justify-content-between.align-items-center
    lah-fa-icon(icon="circle", :variant="light")
    strong.truncate(:title="header") {{ header }}
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
        li 顯示AP連線數統計狀態 (⭐ AP需安裝#[a(href="/send_netstats.sh") 回報腳本] ⭐)
        li 可利用 #[lah-fa-icon(:icon="type === 'bar' ? 'chart-line' : 'chart-bar'", variant="primary")] 切換圖形
        li 可利用「全部」切換為系統連線顯示(包含使用者及其他伺服器連線)
        li 60秒更新資料一次
      hr
      h5 #[lah-fa-icon(icon="palette") 顏色說明(切換系統顯示，臨界值會乘上3倍)]
      div #[lah-fa-icon(icon="circle", style="color: rgb(214, 214, 214)")] 灰色 - 連線數 1 ~ 2
      div #[lah-fa-icon(icon="circle", style="color: rgb(40, 167, 69)")] 綠色 - 連線數 3 ~ 4
      div #[lah-fa-icon(icon="circle", style="color: rgb(255, 193, 7)")] 黃色 - 連線數 5 ~ 8
      div #[lah-fa-icon(icon="circle", style="color: rgb(220, 53, 29)")] 紅色 - 連線數 9 ~ 16
      div #[lah-fa-icon(icon="circle", style="color: rgb(204, 0, 204)")] 紫色 - 連線數 17 ~ 32
      div #[lah-fa-icon(icon="circle", style="color: rgb(51, 51, 51)")] 黑色 - 連線數大於32

  .center.h-100.my-5(v-if="loadItems.length === 0") ⚠ {{ apIp }} 無資料
  lah-chart(
    v-show="loadItems.length > 0",
    ref="chart",
    :type="type",
    @click="popupUser"
  )

  template(#footer): .d-flex.justify-content-between.align-items-center.small
    lah-fa-icon(
      v-if="allSwitch",
      :variant="dbStyles[0]",
      :action="dbStyles[1]",
      :size="dbStyles[2]",
      :icon="dbStyles[3]"
    ) #[span.mr-1 資料庫] #[b-badge(:variant="dbStyles[0]", pill) {{ dbTotal }}]
    lah-fa-icon(
      v-if="allSwitch"
      :variant="cpuStyles[0]",
      :action="cpuStyles[1]",
      :size="cpuStyles[2]",
      :icon="cpuStyles[3]"
    ) #[span.mr-1 CPU] #[b-badge(:variant="cpuStyles[0]", pill) {{ jbossCpuUtilization }} %]
    lah-fa-icon(
      icon="wave-square",
      :variant="light"
      :title="`${word}連線數`"
    ) #[span.mr-1 連線] #[b-badge(:variant="light", pill) {{ totalCount }}]
    b-select.m-n2(v-model="apIp", :options="apIpList", size="sm", style="max-width: 115px")
    lah-fa-icon.text-muted(icon="clock", reqular, title="更新時間") {{ updatedTime }}

</template>

<script>
import LahUserCard from '~/components/lah-user-card.vue';
export default {
  name: 'LahMonitorBoardApconn',
  emit: ['light-update'],
  components: { LahUserCard },
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
    updatedTime: '',
    allSwitch: false,
    loadItems: [],
    skipNames: ['資料庫', '系統管理者', 'JBOSS_CPU_USAGE'],
    dbTotal: 0,
    jbossCpuUtilization: 0,
    lightCriteria: {
      blalck: 160,
      purple: 80,
      red: 40,
      yellow: 30,
      green: 4,
      gray: 0
    },
    reloadTimer: null
  }),
  computed: {
    word () { return this.allSwitch ? '系統' : '使用者' },
    header () { return `AP ${this.word} 連線狀態` },
    icon () { return this.allSwitch ? 'server' : 'users' },
    factor () { return this.allSwitch ? 5 : 1 },
    light () {
      if (this.loadItems.find(item => item[1] > this.lightCriteria.black * this.factor)) { return 'danger' }
      if (this.loadItems.find(item => item[1] > this.lightCriteria.purple * this.factor)) { return 'danger' }
      if (this.loadItems.find(item => item[1] > this.lightCriteria.red * this.factor)) { return 'danger' }
      if (this.loadItems.find(item => item[1] > this.lightCriteria.yellow * this.factor)) { return 'warning' }
      return 'success'
    },
    borderVariant () {
      if (this.light !== 'success') {
        return this.light
      }
      return ''
    },
    totalCount () { return this.loadItems.reduce((acc, item) => acc + item[1], 0) },
    dbStyles () {
      // return [color, action, size, icon]
      if (this.dbTotal > 2800) { return ['danger', 'tremble', '2x', 'bomb'] }
      if (this.dbTotal > 2200) { return ['danger', 'shiver', 'lg', 'database'] }
      if (this.dbTotal > 1800) { return ['warning', 'beat', '1x', 'database'] }
      return ['success', 'breath', 'sm', 'database']
    },
    cpuStyles () {
      // return [color, action, size, icon]
      if (this.jbossCpuUtilization > 90) { return ['danger', 'tremble', '2x', 'microchip'] }
      if (this.jbossCpuUtilization > 70) { return ['danger', 'shiver', 'lg', 'microchip'] }
      if (this.jbossCpuUtilization > 40) { return ['warning', 'beat', '1x', 'microchip'] }
      return ['success', 'breath', 'sm', 'microchip']
    },
    ipPrefix () {
      const ipParts = this.apIp.split('.')
      ipParts.pop()
      return ipParts.join('.')
    },
    currSvr () { return this.apIp.split('.')[3] },
    prevSvr () {
      let currIdx = -1
      this.carousel.find((item, idx, array) => {
        // eslint-disable-next-line eqeqeq
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
        // eslint-disable-next-line eqeqeq
        const found = item == this.currSvr
        currIdx = found ? idx : -1
        return found
      })
      const nextIdx = (currIdx + 1) % this.carousel.length
      return `${this.ipPrefix}.${this.carousel[nextIdx]}`
    },
    apIpList () { return this.carousel.map(postfix => `${this.ipPrefix}.${postfix}`) }
  },
  watch: {
    allSwitch (dontcare) { this.reloadConn() },
    apIp (dontcare) { this.reloadConn() },
    light (nlight, olight) {
      this.emitLightUpdate(nlight, olight)
    }
  },
  created () {
    this.modalId = this.$utils?.uuid()
    this.reloadConn = this.$utils.debounce(this.loadAPConnectionCount, 500)
    this.allSwitch = this.all
    this.type = this.line ? 'line' : 'bar'
    this.loadConfig()
  },
  mounted () {
    this.loadAPConnectionCount()
    this.emitLightUpdate(this.light, '')
  },
  beforeDestroy () {
    this.emitLightUpdate('', this.light)
    clearTimeout(this.reloadTimer)
  },
  methods: {
    reloadConn () { /* placeholder for loadAPConnectionCount  */ },
    navLeft () { this.apIp = this.prevSvr },
    navRight () { this.apIp = this.nextSvr },
    popupUser ({ detail }) {
      this.modal(this.$createElement(LahUserCard, {
        props: {
          id: detail.label,
          name: detail.label,
          from: detail.label
        }
      }), {
        title: `${detail.label} - 已連線數：${detail.value}`
      })
    },
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
          title: 'AP伺服器連線狀態',
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
          this.setCache('SYSYEM_CONFIGS', configs, 7 * 24 * 60 * 60 * 1000)
        }
        // 起始顯示之AP
        this.apIp = configs.WEBAP_IP || '220.1.34.161'
        // 全部AP的IP尾數
        const apPostfix = configs.WEBAP_POSTFIXES
        if (apPostfix) {
          // expect ip postfix string likes => "205, 206, 207, 156, 118, 60, 161"
          const list = apPostfix.split(',')
            .sort((a, b) => {
              if (parseInt(a) < parseInt(b)) {
                return -1
              }
              if (parseInt(a) > parseInt(b)) {
                return 1
              }
              // a 必須等於 b
              return 0
            })
            .map((postfix) => {
              const integer = parseInt(postfix.trim())
              if (integer && integer < 255 && integer > 0) {
                return integer
              }
              this.$utils.warn(
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
      if (element[1] > this.lightCriteria.blalck * this.factor) { return { R: 51, G: 51, B: 51 } }
      if (element[1] > this.lightCriteria.purple * this.factor) { return { R: 204, G: 0, B: 204 } }
      if (element[1] > this.lightCriteria.red * this.factor) { return { R: 220, G: 53, B: 29 } }
      if (element[1] > this.lightCriteria.yellow * this.factor) { return { R: 255, G: 193, B: 7 } }
      if (element[1] > this.lightCriteria.green * this.factor) { return { R: 40, G: 167, B: 69 } }
      return { R: 214, G: 214, B: 214 } // gray
    },
    loadAPConnectionCount () {
      this.jbossCpuUtilization = 0
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_latest_ap_conn',
          ap_ip: this.apIp,
          all: this.allSwitch // IP that is marked by "SERVER" in IPResolver.db will be filtered when the switch is false
        })
        .then(({ data }) => {
          if (data.data_count && data.data_count > 0) {
            this.$refs.chart?.reset()
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
              if (item.name.includes('資料庫')) { this.dbTotal = item.count }
              if (item.name.includes('JBOSS_CPU_USAGE')) { this.jbossCpuUtilization = item.count }
              // skip 資料庫/系統管理者
              if (!this.skipNames.some(name => item.name.includes(name))) {
                const current = processing.get(item.name)
                const tobeUpdated = current === undefined ? item.count : current + item.count
                processing.set(item.name, tobeUpdated)
              }
            })
            this.loadItems = [...processing]
            this.loadItems.forEach((element) => {
              const item = { x: this.userNames[element[0]] || element[0], y: element[1], color: this.backgroundColor(element) }
              this.$refs.chart?.addData(item, this.apIp, this.type, 0)
            })
            // make chart build a bit later
            this.timeout(() => this.$refs.chart?.build(), 50)
          }
        })
        .catch((err) => {
          this.error = err
        })
        .finally(() => {
          this.updatedTime = this.$utils.now().split(' ')[1]
          clearTimeout(this.reloadTimer)
          // reload every 60s
          this.timeout(
            this.loadAPConnectionCount,
            60 * 1000
          ).then((handler) => {
            this.reloadTimer = handler
          })
        })
    },
    emitLightUpdate (n, o) {
      this.$emit('light-update', {
        name: this.componentName,
        new: n,
        old: o
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
