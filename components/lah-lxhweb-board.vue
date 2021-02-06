<template>
  <b-card border-variant="secondary" class="shadow">
    <template v-slot:header>
      <div class="d-flex w-100 justify-content-between">
        <h6 class="my-auto font-weight-bolder">
          <lah-fa-icon icon="traffic-light" size="lg" :variant="headerLight">
            {{ header }}
          </lah-fa-icon>
        </h6>
        <b-button-group>
          <lah-button
            v-if="showBrokenBtn"
            icon="unlink"
            variant="danger"
            no-border
            action="damage"
            title="檢視損毀資料表"
            :badge-text="String(brokenTableCount)"
            @click="showBrokenTable"
          />
          <lah-button
            v-if="alive"
            icon="sync"
            variant="outline-secondary"
            no-border
            action="cycle"
            title="重新讀取"
            @click="ping"
          />
        </b-button-group>
      </div>
    </template>
    <div v-if="alive" class="h-100">
      <div class="offices">
        <div v-for="entry in offices" :key="entry.SITE" class="office center">
          <lah-fa-icon
            size="lg"
            icon="circle"
            :variant="light(entry)"
            :action="action(entry)"
            v-b-popover.hover.focus.top="'最後更新時間: ' + entry.UPDATE_DATETIME"
          >
            {{ name(entry) }}
          </lah-fa-icon>
        </div>
      </div>
    </div>
    <div v-else class="center h-100">
      <h5 class="font-weight-bold">
        <lah-fa-icon
          icon="exclamation-triangle"
          szie="lg"
          variant="danger"
          action="breath"
        >
          {{ ip }} 目前無法連線
        </lah-fa-icon>
      </h5>
    </div>
  </b-card>
</template>

<script>
export default {
  props: {
    server: { type: String, require: true }
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
  computed: {
    ip() {
      return this.hwebMap.get(this.server).ip
    },
    header() {
      if (this.hwebMap.has(this.server)) {
        let entry = this.hwebMap.get(this.server)
        return `${entry.name} ${entry.ip}`
      }
      return `未支援 ${this.server} 監控`
    },
    alive() {
      return this.pingLatency > 0 && this.pingLatency < 1000
    },
    headerLight() {
      if (this.alive) {
        let site_light = "success"
        for (let i = 0; i < this.offices.length; i++) {
          let this_light = this.light(this.offices[i])
          if (this_light == "warning") site_light = "warning"
          if (this_light == "danger") return "danger"
        }
        return site_light
      }
      return "secondary"
    },
    brokenTableCount() {
      return this.$utils.empty(this.brokenTableRaw) ? 0 : this.brokenTableRaw.length
    },
    showBrokenBtn() {
      return this.brokenTableCount > 0
    },
    hwebMap () {
      return new Map([
        ["L1HWEB", { name: "L1同步異動", code: "L1HWEB", ip: this.l1hwebIp }],
        ["L1HWEB_Alt", { name: "L1同步異動(備)", code: "L1HWEB_Alt", ip: this.l1hwebAltIp }],
        ["L2HWEB", { name: "L2同步異動", code: "L2HWEB", ip: this.l2hwebIp }],
        ["L3HWEB", { name: "L3同步異動", code: "L3HWEB", ip: this.l3hwebIp }]
      ])
    },
    l1hwebIp () {
      return this.$utils.empty(this.configs) ? '220.1.33.2' : this.configs['ORA_DB_L1HWEB_IP']
    },
    l1hwebAltIp () {
      return this.l3hwebIp
    },
    l2hwebIp () {
      return this.$utils.empty(this.configs) ? '220.1.33.3' : this.configs['ORA_DB_L2HWEB_IP']
    },
    l3hwebIp () {
      return this.$utils.empty(this.configs) ?  '220.1.33.5' : this.configs['ORA_DB_L3HWEB_IP']
    },
    pingInterval () {
      return this.$utils.empty(this.configs) ? 5 * 60 * 1000 : parseInt(this.configs['PING_INTERVAL_SECONDS']) * 1000
    }
  },
  methods: {
    randDate() {
      let rand_date = new Date(+new Date() - this.$utils.rand(45 * 60 * 1000))
      return (
        rand_date.getFullYear() +
        "-" +
        ("0" + (rand_date.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + rand_date.getDate()).slice(-2) +
        " " +
        ("0" + rand_date.getHours()).slice(-2) +
        ":" +
        ("0" + rand_date.getMinutes()).slice(-2) +
        ":" +
        ("0" + rand_date.getSeconds()).slice(-2)
      )
    },
    action(entry) {
      let light = this.light(entry)
      switch (light) {
        case "danger":
          return "tremble"
        case "warning":
          return "beat"
        default:
          return ""
      }
    },
    light(entry) {
      if (this.alive) {
        const now = +new Date() // in ms
        const last_update = +new Date(entry.UPDATE_DATETIME.replace(" ", "T"))
        let offset = now - last_update
        if (offset > 30 * 60 * 1000) return "danger"
        else if (offset > 15 * 60 * 1000) return "warning"
        return "success"
      }
      return "secondary"
    },
    name(entry) {
      for (var value of this.xapMap.values()) {
        if (value.code == entry.SITE) {
          return value.name
        }
      }
    },
    ping() {
      this.isBusy = true
      clearTimeout(this.pingTimer)
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: "ping",
        ip: this.ip,
        port: 1521, // db port
      }).then(({ data }) => {
        this.pingLatency = data.latency
        this.pingMessage = data.message
        if (this.$utils.statusCheck(data.status)) {
          // array of {SITE: 'HB', UPDATE_DATETIME: '2020-10-08 21:47:00'}
          this.reload()
        } else {
          // this.notify({
          //   title: "PING回應值",
          //   message: `${data.message}`,
          //   type: "warning",
          // })
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
      this.pingTimer = this.timeout(() => this.ping(), this.pingInterval)
    },
    reload() {
      if (this.alive) {
        this.$axios.post(this.$consts.API.JSON.LXHWEB, {
          type: "lxhweb_site_update_time",
          site: this.server,
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            // array of {SITE: 'HB', UPDATE_DATETIME: '2020-10-08 21:47:00'}
            this.offices = data.raw
          } else {
            // this.notify(`${data.message}`, {
            //   title: '同步異動主機狀態檢視',
            //   subtitle: this.server,
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
    checkBrokenTable() {
      if (this.alive) {
        this.$axios.post(this.$consts.API.JSON.LXHWEB, {
          type: "lxhweb_broken_table",
          site: this.server,
        }).then(({ data }) => {
          if (data.data_count) {
            // found
            this.alert(`<i class="fa fa-exclamation-triangle fa-lg ld ld-beat"></i> 找到 ${data.data_count} 筆損毀表格`, {
              subtitle: this.server,
              title: "同步異動表格檢測",
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
    showBrokenTable() {
      if (!this.$utils.empty(this.brokenTableRaw)) {
        this.modal(this.$createElement("b-table", {
            props: {
              striped: true,
              hover: true,
              headVariant: "dark",
              bordered: true,
              captionTop: true,
              caption: `找到 ${this.brokenTableCount} 件`,
              items: this.brokenTableRaw,
            },
          }), {
          title: "同步異動損毀表格"
        })
      }
    },
  },
  fetch () {
    this.$axios.post(this.$consts.API.JSON.LXHWEB, {
      type: "lxhweb_config",
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
      { SITE: "HA", UPDATE_DATETIME: this.randDate() },
      { SITE: "HB", UPDATE_DATETIME: this.randDate() },
      { SITE: "HC", UPDATE_DATETIME: this.randDate() },
      { SITE: "HD", UPDATE_DATETIME: this.randDate() },
      { SITE: "HE", UPDATE_DATETIME: this.randDate() },
      { SITE: "HF", UPDATE_DATETIME: this.randDate() },
      { SITE: "HG", UPDATE_DATETIME: this.randDate() },
      { SITE: "HH", UPDATE_DATETIME: this.randDate() }
    ]
  },
  mounted () {
    this.ping()
  },
  beforeDestroy () {
    clearTimeout(this.pingTimer)
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
    width: 24%;
    height: 50%;
    border: 1px solid gray;
    border-radius: 15px;
    margin: 0 calc(0.5%) calc(0.5%) 0;
  }
}
</style>
