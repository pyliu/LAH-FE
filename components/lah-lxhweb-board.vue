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
            @click="pingDebounced"
          />
        </b-button-group>
      </div>
    </template>
    <div v-if="alive" class="h-100">
      <!-- <div v-if="type == 'light'" :id="container_id" class="grids">
        <div v-for="entry in offices" class="grid-4col-2row">
          <lah-fa-icon
            size="lg"
            icon="circle"
            :variant="light(entry)"
            :action="action(entry)"
            v-b-popover.hover.focus.top="
              '最後更新時間: ' + entry.UPDATE_DATETIME
            "
            >{{ name(entry) }}</lah-fa-icon
          >
        </div>
      </div>
      <div v-else :id="container_id">
        <div
          v-if="showHeadLight"
          class="d-flex justify-content-between mx-auto"
        >
          <lah-fa-icon
            v-for="entry in offices"
            icon="circle"
            :variant="light(entry)"
            :action="action(entry)"
            v-b-popover.hover.focus.top="
              '最後更新時間: ' + entry.UPDATE_DATETIME
            "
            >{{ name(entry) }}</lah-fa-icon
          >
        </div>
      </div> -->
    </div>
    <h5 v-else class="font-weight-bold not-reachable">
      <lah-fa-icon
        icon="exclamation-triangle"
        szie="lg"
        variant="danger"
        action="breath"
      >
        {{ ip }} 目前無法連線
      </lah-fa-icon>
    </h5>
  </b-card>
</template>

<script>
export default {
  props: {
    server: { type: String, require: true },
    bypassPing: { type: Boolean, default: false }
  },
  fetchOnServer: true,
  data: () => ({
    configs: {},
    pingLatency: 0,
    pingMessage: '',
    offices: [],
    pingTimer: null,
    brokenTableRaw: null
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
  watch: {
    offices (val) {
      this.$utils.log(val)
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
      if (!this.bypassPing) {
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
            this.checkBrokenTable()
          } else {
            this.notify({
              title: "PING回應值",
              message: `${data.message}`,
              type: "warning",
            })
          }
        })
        .catch((err) => {
          this.error = err
        }).finally(() => {
          this.isBusy = false
          this.pingNextTime()
        })
      }
    },
    pingDebounced () {},  // placeholder for debounced ping
    pingNextTime () {
      clearTimeout(this.pingTimer)
      this.pingTimer = this.timeout(() => this.pingDebounced(), this.pingInterval)
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
            this.notify(`${data.message}`, {
              title: '同步異動主機狀態檢視',
              subtitle: this.server,
              type: 'warning'
            })
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      }
    },
    checkBrokenTable() {
      this.brokenTableRaw = []
      if (this.alive) {
        this.$axios.post(this.$consts.API.JSON.LXHWEB, {
          type: "lxhweb_broken_table",
          site: this.server,
        }).then(({ data }) => {
          if (data.status != this.$consts.XHR_STATUS_CODE.SUCCESS_WITH_NO_RECORD) {
            // found
            this.alert(`<i class="fa fa-exclamation-triangle fa-lg ld ld-beat"></i> 找到 ${data.data_count} 筆損毀表格`, {
              subtitle: this.server,
              title: "同步異動表格檢測",
              delay: 15 * 1000
            })
            this.brokenTableRaw = data.raw
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
      this.ping()
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
  created() {
    this.pingDebounced = this.$utils.debounce(this.ping, 250)
  }
}
</script>

<style lang="scss" scoped>
.not-reachable {
  left: 30%;
  top: 50%;
  position: absolute;
}
</style>
