<template lang="pug">
b-modal(
  ref="modal"
  title="列印伺服器監控設定"
  size="lg"
  centered
  hide-footer
  no-close-on-backdrop
)
  .d-flex.flex-column
    //- 新增區塊
    b-card.mb-3(bg-variant="light")
      h6.card-title.d-flex.align-items-center
        lah-fa-icon(icon="plus-circle", variant="primary")
        span.ml-2 新增監控節點
      b-row
        b-col(md="5")
          b-form-group(label="伺服器 IP", label-for="input-ip")
            b-form-input#input-ip(v-model="newPrinter.ip", placeholder="例如: 192.168.1.100", trim)
        b-col(md="3")
          b-form-group(label="連接埠 (Port)", label-for="input-port")
            b-form-input#input-port(v-model="newPrinter.port", type="number", placeholder="預設 8888")
        b-col(md="4")
          b-form-group(label="API Key", label-for="input-key")
            b-form-input#input-key(v-model="newPrinter.key", type="password", placeholder="預設 YourSecretApiKey123")
      .text-right
        lah-button(
          @click="addPrinter",
          icon="plus",
          variant="outline-primary",
          :disabled="!isValidNewPrinter"
        ) 新增

    hr

    //- 列表區塊
    h6.d-flex.align-items-center.mb-3
      lah-fa-icon(icon="list-ul", variant="secondary")
      span.ml-2 已監控列表 ({{ printers.length }})

    .printer-list(v-if="printers.length > 0")
      transition-group(name="list")
        .d-flex.align-items-center.justify-content-between.border-bottom.py-2(
          v-for="(printer, idx) in printers",
          :key="`${printer.ip}:${printer.port}`"
        )
          .d-flex.align-items-center
            lah-fa-icon.mr-3(icon="server", variant="secondary")
            div
              .font-weight-bold {{ printer.ip }}:{{ printer.port }}
              small.text-muted Key: {{ maskKey(printer.key) }}

          lah-button(
            @click="removePrinter(idx)",
            icon="trash-alt",
            variant="outline-danger",
            size="sm",
            no-border,
            title="移除"
          )

    .text-center.text-muted.py-4(v-else)
      span 目前沒有設定任何監控節點

    //- 底部操作
    .d-flex.justify-content-end.mt-4
      lah-button(
        @click="saveConfig",
        icon="save",
        variant="primary",
        size="lg",
        :disabled="!isDirty"
      ) 儲存設定

</template>

<script>
export default {
  data: () => ({
    printers: [],
    newPrinter: {
      ip: '',
      port: 8888,
      key: 'YourSecretApiKey123'
    },
    originalConfig: '[]'
  }),
  computed: {
    isValidNewPrinter () {
      return this.$utils.isIPv4(this.newPrinter.ip) && this.newPrinter.port > 0 && this.newPrinter.key
    },
    isDirty () {
      return JSON.stringify(this.printers) !== this.originalConfig
    },
    systemPrinters () {
      // 嘗試從系統設定解析 JSON，如果沒有則回傳空陣列
      try {
        const config = this.systemConfigs?.monitor_printers
        return config ? JSON.parse(config) : []
      } catch (e) {
        return []
      }
    }
  },
  watch: {
    systemPrinters: {
      handler (val) {
        // 使用 JSON.parse(JSON.stringify(val)) 來進行深拷貝，替代 this.$utils.clone
        this.printers = val ? JSON.parse(JSON.stringify(val)) : []
        this.originalConfig = JSON.stringify(this.printers)
      },
      immediate: true
    }
  },
  methods: {
    show () {
      this.$refs.modal.show()
    },
    hide () {
      this.$refs.modal.hide()
    },
    maskKey (key) {
      if (!key) { return '' }
      if (key.length <= 4) { return '****' }
      return key.substring(0, 2) + '****' + key.substring(key.length - 2)
    },
    addPrinter () {
      if (this.isValidNewPrinter) {
        // 檢查是否重複
        const exists = this.printers.some(
          p => p.ip === this.newPrinter.ip && parseInt(p.port) === parseInt(this.newPrinter.port)
        )

        if (exists) {
          this.notify('該 IP 與 Port 已存在於列表中', { type: 'warning' })
          return
        }

        this.printers.push({ ...this.newPrinter })
        // 重置輸入框
        this.newPrinter = {
          ip: '',
          port: 8888,
          key: 'YourSecretApiKey123'
        }
      }
    },
    removePrinter (index) {
      this.printers.splice(index, 1)
    },
    saveConfig () {
      const configString = JSON.stringify(this.printers)
      const configs = {
        MONITOR_PRINTERS: configString
      }

      this.post(this.$consts.API.JSON.QUERY, {
        type: 'update_configs',
        configs
      }).then((data) => {
        if (this.$utils.statusCheck(data.status)) {
          this.notify('設定已更新', { type: 'success' })

          // 更新本地 store
          const currentConfigs = { ...this.systemConfigs }
          currentConfigs.monitor_printers = configString
          this.$store.commit('systemConfigs', currentConfigs)

          this.originalConfig = configString
          this.hide()
        } else {
          this.notify(data.message, { type: 'warning' })
        }
      }).catch((error) => {
        this.$utils.error(error)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.printer-list {
  max-height: 300px;
  overflow-y: auto;
}
.list-enter-active, .list-leave-active {
  transition: all 0.5s;
}
.list-enter, .list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
