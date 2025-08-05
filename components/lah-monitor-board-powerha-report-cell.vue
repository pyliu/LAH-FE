<template lang="pug">
div
  //- 檔案系統
  template(v-if="item.item === '檔案系統' || item.item === '檔案系統超過 80%'")
    div(v-if="!cellData || cellData.length === 0") 無
    .d-flex.justify-content-between.flex-wrap(v-else)
      b-button.m-1.d-flex.align-items-center(
        v-for="(fs, idx) in cellData",
        :key="`fs_btn_${idx}`",
        size="sm",
        variant="outline-secondary",
        pill
      )
        .mr-1 {{ fs.mountedOn }}
        b-badge(pill, :variant="fsVariant(fs.usedPercent)") {{ fs.usedPercent }}%

  //- 節點狀態
  template(v-else-if="item.item === '節點狀態'")
    h4: b-badge(:variant="cellData === 'ONLINE' ? 'success' : 'danger'", pill) {{ cellData }}

  //- 叢集狀態
  template(v-else-if="item.item === '叢集狀態'")
    h5
      b-badge(
        :variant="clusterVariant(cellData.type)",
        :title="`${cellData.code} - ${cellData.description}`",
        pill
      ) {{ cellData.name }}
      span.mx-2.s-85 {{ cellData.description }}

  //- AIX 錯誤
  template(v-else-if="item.item === 'AIX 錯誤'")
    lah-button(
      v-if="cellData > 0",
      variant="outline-danger",
      pill,
      @click="$emit('show-errpt', nodeData.errpts, nodeKey.toUpperCase())"
    ) {{ cellData }} 個錯誤
    div(v-else) 無

  //- Oracle 錯誤
  template(v-else-if="item.item === 'Oracle 錯誤'")
    div {{ cellData > 0 ? `${cellData} 個錯誤` : '無' }}

  //- 預設渲染方式 (處理 PID, NDP, 記憶體等)
  template(v-else)
    div(v-html="formattedCellData")

</template>

<script>
export default {
  name: 'LahPowerhaReportCell',
  props: {
    item: { type: Object, required: true },
    nodeData: { type: Object, required: true },
    nodeKey: { type: String, required: true }
  },
  computed: {
    cellData () {
      return this.item[this.nodeKey]
    },
    formattedCellData () {
      switch (this.item.item) {
        case '子系統 PID':
          return this.formatPIDsHtmlDisplay(this.cellData)
        case 'NDP 數值':
          return this.formatNDPHtmlDisplay(this.cellData)
        case '記憶體':
          return this.formatMemoryStatsHtmlDisplay(this.cellData)
        case 'I/O 統計':
          return this.formatIOStatsHtmlDisplay(this.cellData)
        default:
          return this.cellData
      }
    }
  },
  methods: {
    fsVariant (usedPercent) {
      const value = parseInt(usedPercent, 10)
      if (value > 80) { return 'danger' }
      if (value > 60) { return 'warning' }
      if (value > 40) { return 'info' }
      return 'success'
    },
    clusterVariant (type) {
      if (type === 'normal') { return 'success' }
      if (['processing', 'warning'].includes(type)) { return 'warning' }
      return 'danger'
    },
    formatPIDsHtmlDisplay (data) {
      if (!data || (!data.rsct?.length && !data.powerha?.length && !data.caa?.length)) { return '無' }
      const outputLines = []
      const formatSection = (title, subsystems) => {
        if (subsystems && subsystems.length > 0) {
          outputLines.push(`<strong>${title}:</strong>`)
          subsystems.forEach((s) => {
            outputLines.push(`&nbsp;&nbsp;- ${s.subsystem} (PID: ${s.pid}) ${s.status}`)
          })
        }
      }
      formatSection('RSCT', data.rsct)
      formatSection('PowerHA', data.powerha)
      formatSection('CAA', data.caa)
      return outputLines.join('<br>')
    },
    formatNDPHtmlDisplay (data) {
      if (!data || data.length < 2) { return '無' }
      const ORAHAHA1 = data[0]
      const first = `pgSpFree: ${ORAHAHA1.pgSpFree}, pctTotalTimeIdle: ${ORAHAHA1.pctTotalTimeIdle}`
      const ORAHAHA2 = data[1]
      const second = `pgSpFree: ${ORAHAHA2.pgSpFree}, pctTotalTimeIdle: ${ORAHAHA2.pctTotalTimeIdle}`
      return `<strong>ORAHAHA1</strong><br/>&nbsp;&nbsp;- ${first}<br/><strong>ORAHAHA2</strong><br/>&nbsp;&nbsp;- ${second}`
    },
    formatMemoryStatsHtmlDisplay (data) {
      if (!data) { return '無' }
      return `總容量: <b>${data.totalMemory}</b><br>活躍數: ${(data.activeVirtualMemory / 1024).toFixed(2)}MB`
    },
    formatIOStatsHtmlDisplay (ioStats) {
      if (!ioStats || !ioStats.systemConfig || !ioStats.disks) { return '無 I/O 統計資料' }
      let html = ''
      if (ioStats.systemConfig) {
        html += '<strong>System Configuration:</strong><br>'
        const configDetails = Object.entries(ioStats.systemConfig).map(([key, value]) => `&nbsp;&nbsp;${key}: ${value}`).join(', ')
        html += `${configDetails}<br><br>`
      }
      if (ioStats.cpu) {
        html += '<strong>CPU Statistics:</strong><br>'
        const cpuDetails = Object.entries(ioStats.cpu).map(([key, value]) => `&nbsp;&nbsp;% ${key}: ${value}`).join(', ')
        html += `${cpuDetails}<br><br>`
      }
      if (ioStats.disks && ioStats.disks.length > 0) {
        html += '<strong>Disk I/O:</strong>'
        html += '<style>.io-disk-table { font-size: 0.9em; border-collapse: collapse; margin-top: 5px; width: 100%; } .io-disk-table th, .io-disk-table td { border: 1px solid #ccc; padding: 6px; text-align: right; } .io-disk-table th { background-color: #f8f8f8; } .io-disk-table td:first-child { text-align: left; }</style><table class="io-disk-table"><thead><tr><th>Disk</th><th>% tm_act</th><th>Kbps</th><th>tps</th><th>Kb_read</th><th>Kb_wrtn</th></tr></thead><tbody>'
        ioStats.disks.forEach((disk) => {
          html += `<tr><td>${disk.disk}</td><td>${disk.tm_act_percent}</td><td>${disk.kbps}</td><td>${disk.tps}</td><td>${disk.kb_read}</td><td>${disk.kb_wrtn}</td></tr>`
        })
        html += '</tbody></table>'
      }
      return html
    }
  }
}
</script>
