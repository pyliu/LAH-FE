<template lang="pug">
b-card(:border-variant="borderVariant", :class="[attentionCss]")
  template(#header)
    .d-flex.w-100.justify-content-between
      h6.my-auto.font-weight-bolder
        lah-fa-icon(icon="circle" :variant="headerLight")
          | {{ header }}
      b-button-group
        lah-button(
          v-if="link",
          to="/inf/lxhweb",
          icon="arrow-up-right-from-square",
          no-border,
          title="檢視全部"
        )
        lah-button(v-if="showBrokenBtn" icon="unlink" variant="danger" no-border action="damage" title="檢視損毀資料表" :badge-text="String(brokenTableCount)" @click="showBrokenTable")
        lah-button(v-if="alive" icon="sync" variant="outline-secondary" no-border action="cycle" title="重新讀取" @click="ping")
        lah-button(
          icon="question",
          action="breath",
          variant="outline-success",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="說明"
        )
    lah-help-modal(ref="help", :modal-title="`各所同步異動監控說明`")
      ul
        li 顯示桃園市各所地政系統WEB版資料庫同步異動狀態
        li 預設每5分鐘重新更新一次
      hr
      div 🟢 表示更新時間正常區間
      div 🟡 表示更新時間大於15分鐘
      div 🔴 表示超過30分鐘未更新
  .h-100(v-if="alive")
    .offices
      .office.center(v-for="entry in offices" :key="entry.SITE")
        lah-fa-icon(v-b-popover.hover.focus.top="'最後更新時間: ' + $utils.formatDistanceToNow(+new Date(entry.UPDATE_DATETIME))" size="lg" icon="circle" :variant="light(entry)" :action="action(entry)")
          | {{ name(entry) }}
  .center.h-100(v-else)
    h5.font-weight-bold
      lah-fa-icon(icon="exclamation-triangle" szie="lg" variant="danger" action="breath")
        | {{ ip }} 目前無法連線
</template>

<script>
export default {
  name: 'LahMonitorBoardLxhweb',
  emit: ['light-update'],
  props: {
    targetIp: { type: String, require: true, default: 'L3HWEB' },
    link: { type: Boolean, default: false }
  },
  fetchOnServer: true,
  data: () => ({
    configs: {},
    pingLatency: 0,
    pingMessage: '',
    offices: [],
    pingTimer: null,
    brokenTableRaw: []
  }),
  fetch () {
    this.$axios.post(this.$consts.API.JSON.LXHWEB, {
      type: 'lxhweb_config'
    }).then(({ data }) => {
      if (this.$utils.statusCheck(data.status)) {
        this.configs = Object.assign(this.configs, data.raw)
      } else {
        this.$utils.error(data.message)
      }
    }).catch((err) => {
      this.$utils.error(err)
    }).finally(() => {
    })
    // mock data
    this.offices = [
      { SITE: 'HA', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HB', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HC', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HD', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HE', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HF', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HG', UPDATE_DATETIME: this.randDate() },
      { SITE: 'HH', UPDATE_DATETIME: this.randDate() }
    ]
  },
  computed: {
    ip () {
      return this.hwebMap.get(this.targetIp).ip
    },
    header () {
      if (this.hwebMap.has(this.targetIp)) {
        const entry = this.hwebMap.get(this.targetIp)
        return `${entry.name} ${entry.ip}`
      }
      return `未支援 ${this.targetIp} 監控`
    },
    alive () {
      const latency = parseFloat(this.pingLatency)
      return latency > 0 && latency < 3000
    },
    headerLight () {
      if (this.alive) {
        let siteLight = 'success'
        for (let i = 0; i < this.offices.length; i++) {
          const thisLight = this.light(this.offices[i])
          if (thisLight === 'warning') { siteLight = 'warning' }
          if (thisLight === 'danger') { return 'danger' }
        }
        return siteLight
      }
      return 'secondary'
    },
    borderVariant () {
      switch (this.headerLight) {
        case 'danger':
          return 'danger'
        case 'warning':
          return 'warning'
        default:
          return 'muted'
      }
    },
    attentionCss () {
      if (this.headerLight === 'danger') {
        return 'scale-danger'
      }
      if (this.headerLight === 'warning') {
        return 'scale-warning'
      }
      return ''
    },
    brokenTableCount () {
      return this.$utils.empty(this.brokenTableRaw) ? 0 : this.brokenTableRaw.length
    },
    showBrokenBtn () {
      return this.brokenTableCount > 0
    },
    hwebMap () {
      return new Map([
        ['L1HWEB', { name: 'L1同步異動', code: 'L1HWEB', ip: this.l1hwebIp }],
        ['L1HWEB_Alt', { name: 'L1同步異動(備)', code: 'L1HWEB_Alt', ip: this.l1hwebAltIp }],
        ['L2HWEB', { name: 'L2同步異動', code: 'L2HWEB', ip: this.l2hwebIp }],
        ['L3HWEB', { name: 'L3同步異動', code: 'L3HWEB', ip: this.l3hwebIp }]
      ])
    },
    l1hwebIp () {
      return this.$utils.empty(this.configs) ? '220.1.33.2' : this.configs.ORA_DB_L1HWEB_IP
    },
    l1hwebAltIp () {
      return this.l3hwebIp
    },
    l2hwebIp () {
      return this.$utils.empty(this.configs) ? '220.1.33.3' : this.configs.ORA_DB_L2HWEB_IP
    },
    l3hwebIp () {
      return this.$utils.empty(this.configs) ? '220.1.33.5' : this.configs.ORA_DB_L3HWEB_IP
    },
    pingInterval () {
      return this.$utils.empty(this.configs) ? 5 * 60 * 1000 : parseInt(this.configs.PING_INTERVAL_SECONDS) * 1000
    }
  },
  watch: {
    headerLight (nlight, olight) {
      this.$emit('light-update', {
        name: this.componentName,
        new: nlight,
        old: olight
      })
    }
  },
  mounted () {
    this.ping()
  },
  beforeDestroy () {
    this.stopPing()
  },
  methods: {
    randDate () {
      const randDate = new Date(+new Date() - this.$utils.rand(45 * 60 * 1000))
      return (
        randDate.getFullYear() +
        '-' +
        ('0' + (randDate.getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + randDate.getDate()).slice(-2) +
        ' ' +
        ('0' + randDate.getHours()).slice(-2) +
        ':' +
        ('0' + randDate.getMinutes()).slice(-2) +
        ':' +
        ('0' + randDate.getSeconds()).slice(-2)
      )
    },
    action (entry) {
      const light = this.light(entry)
      switch (light) {
        case 'danger':
          return 'tremble'
        case 'warning':
          return 'beat'
        default:
          return ''
      }
    },
    light (entry) {
      if (this.alive) {
        const now = +new Date() // in ms
        const lastUpdate = +new Date(entry.UPDATE_DATETIME.replace(' ', 'T'))
        const offset = now - lastUpdate
        if (offset > 30 * 60 * 1000) { return 'danger' } else if (offset > 15 * 60 * 1000) { return 'warning' }
        return 'success'
      }
      return 'secondary'
    },
    name (entry) {
      for (const value of this.xapMap.values()) {
        if (value.code === entry.SITE) {
          return value.name
        }
      }
    },
    ping () {
      this.stopPing()
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'ping',
        ip: this.ip,
        port: 1521 // db port
      }).then(({ data }) => {
        this.pingLatency = data.latency
        this.pingMessage = data.message
        if (this.$utils.statusCheck(data.status)) {
          // array of {SITE: 'HB', UPDATE_DATETIME: '2020-10-08 21:47:00'}
          this.reload()
        } else {
          this.$utils.warn('PING回應值', data.message)
        }
      }).catch((err) => {
        this.error = err
      }).finally(() => {
        this.isBusy = false
        this.pingNextTime()
      })
    },
    pingNextTime () {
      this.timeout(() => this.ping(), this.pingInterval).then((handler) => { this.pingTimer = handler })
    },
    stopPing () {
      clearTimeout(this.pingTimer)
    },
    reload () {
      if (this.alive) {
        this.$axios.post(this.$consts.API.JSON.LXHWEB, {
          type: 'lxhweb_site_update_time',
          site: this.targetIp
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            // array of {SITE: 'HB', UPDATE_DATETIME: '2020-10-08 21:47:00'}
            this.offices = data.raw
          } else {
            // this.notify(`${data.message}`, {
            //   title: '同步異動主機狀態檢視',
            //   subtitle: this.targetIp,
            //   type: 'warning'
            // })
            this.$utils.warn('同步異動主機狀態檢視', data.message)
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
          this.checkBrokenTable()
        })
      }
    },
    checkBrokenTable () {
      if (this.alive) {
        this.$axios.post(this.$consts.API.JSON.LXHWEB, {
          type: 'lxhweb_broken_table',
          site: this.targetIp
        }).then(({ data }) => {
          if (data.data_count) {
            // found
            this.alert(`<i class="fa fa-exclamation-triangle fa-lg ld ld-beat"></i> 找到 ${data.data_count} 筆損毀表格`, {
              subtitle: this.targetIp,
              title: '同步異動表格檢測',
              delay: 15 * 1000
            })
            this.brokenTableRaw = data.raw
          } else {
            this.brokenTableRaw = []
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      }
    },
    showBrokenTable () {
      if (!this.$utils.empty(this.brokenTableRaw)) {
        this.modal(this.$createElement('b-table', {
          props: {
            striped: true,
            hover: true,
            headVariant: 'dark',
            bordered: true,
            captionTop: true,
            caption: `找到 ${this.brokenTableCount} 件`,
            items: this.brokenTableRaw
          }
        }), {
          title: '同步異動損毀表格'
        })
      }
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
    width: 23.5%;
    height: 50%;
    border: 1px solid gray;
    border-radius: 15px;
    margin: 0 calc(1.5%) calc(1.5%) 0;
  }
}
</style>
