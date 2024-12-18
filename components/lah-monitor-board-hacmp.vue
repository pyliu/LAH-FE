<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        icon="chart-simple",
        :href="grafanaUrl",
        target="_blank",
        no-border,
        title="開啟新視窗顯示詳細DB儀表板"
      ) 詳細資訊
      lah-button(
        v-if="!footer"
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="reload",
        :title="`上次更新時間 ${updated}`",
        :disabled="fetchingMonitorMail"
      )
      lah-button(
        icon="external-link-alt",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="popupMessages('subject', 'hacmp', 7)",
        title="讀取7天內訊息"
      )
      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="說明"
      )
    lah-help-modal(ref="help", :modal-title="`${header} 監控說明`")
      ul
        li 顯示資料庫 HACMP 狀態共7個掛載的資料夾
          ul: li /ARCH, /BACKUP, /oracle, /WEB/DB1, /WEB/DB2, /WEB/DB3, /WEB/DB4
        li 每天 08:00 ~ 17:00 每小時檢查一次
        li 儀表板約60分鐘重新更新一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示狀態未更新或是有掛載的資料夾使用量超過 {{ lightCruteria.warning }}%
      div 🔴 表示檢測有錯誤或是有掛載的資料夾使用量超過 {{ lightCruteria.danger }}%
      b-img.mt-2(src="~/assets/img/mb_hacmp.jpg", fluid, thumbnail)
  slot
  .center(v-if="$utils.empty(headMessage)") ⚠ {{ fetchDay }}日內無資料
  div(v-else)
    section
      .d-flex.justify-content-between.font-weight-bold.mb-1
        a.truncate(
          href="#",
          @click="popupLogContent(headMessage)",
          title="顯示詳細記錄"
        ) {{ hacmpFSMessage }}
        lah-badge-human-datetime(
          :variant="isToday(headMessage.timestamp) ? 'success' : 'muted'",
          :seconds="headMessage.timestamp"
        )
      lah-flex-item-group.small
        .col-4.text-nowrap.hover(
          v-for="(fs, idx) in hacmpFSResult",
          :key="`fs_${idx}`",
          v-b-popover.hover.html="dfPopover(fs)"
        ) {{ fs }}
    section.mt-1
      .d-flex.justify-content-between.font-weight-bold.mb-1
        a.truncate(
          href="#",
          @click="popupLogContent(headMessage)",
          title="顯示詳細記錄"
        ) ⚠ 最近錯誤訊息
        lah-badge-human-datetime(
          :variant="isToday(headMessage.timestamp) ? 'success' : 'muted'",
          :seconds="headMessage.timestamp"
        )
      b-table.small(
        :items="errpt",
        head-variant="dark",
        small,
        hover,
        striped
      )
  template(#footer, v-if="footer"): client-only: lah-monitor-board-footer(
    ref="footer"
    :reload-ms="reloadMs",
    :busy="isBusy",
    :fetch="$fetch",
    :reload="reload",
    :fetch-state="fetchingState",
    :update-time="updated"
  )
</template>

<script>
import lahMonitorBoardBase from '~/components/lah-monitor-board-base';
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue';

export default {
  name: 'LahMonitorBoardHacmp',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '資料庫 HACMP',
    fetchType: 'subject',
    fetchKeyword: 'hacmp',
    fetchDay: 1,
    requireFS: ['/ARCH', '/BACKUP', '/oracle', '/WEB/DB1', '/WEB/DB2', '/WEB/DB3', '/WEB/DB4'],
    lightCruteria: {
      danger: 80,
      warning: 75
    }
  }),
  computed: {
    headMessage () {
      return this.messages[0]
    },
    messageChunks () {
      if (this.headMessage) {
        // Split the text into chunks using both separators
        return this.headMessage.message?.split(/\*{7,}/)
      }
      return []
    },
    hacmpFSCapacity () {
      if (this.messageChunks.length > 0) {
        const lines = this.messageChunks[2].trim().split('\r\n')
        /**
         * remove the first and last line
         * first always 👉 Filesystem    GB blocks      Free %Used    Iused %Iused Mounted on
         * last always 👉 errpt
         */
        return lines.slice(1, -1).map((item) => {
          const tokens = item.trim().split(/\s+/)
          return {
            file_system: tokens[0], // e.g. /dev/hd4
            gb_blocks: tokens[1], // e.g. 2.00
            free: tokens[2], // e.g. 1.64
            used: tokens[3], // e.g. 18%
            Iused: tokens[4], // e.g. 25002
            Iused_percent: tokens[5], // e.g. 7%
            mounted_on: tokens[6] // e.g. /
          }
        })
      }
      return []
    },
    hacmpFS () {
      if (this.messageChunks.length > 0) {
        const lines = this.messageChunks[1].trim().split('\r\n')
        /**
         * remove the first and last line
         * first always 👉 #File System    Volume Group      Resource Group                      Node List
         * last always 👉 df -g
         */
        return lines.slice(1, -1).map((item) => {
          const tokens = item.trim().split(/\s+/)
          return {
            file_system: tokens[0], // e.g. /oracle
            volume_group: tokens[1], // e.g. datavg
            resource_group: tokens[2], // e.g. reg_ctl
            node_list: tokens[3], // e.g. ORAHAHA1,ORAHAHA2
            used: this.hacmpFSCapacity.find(item => item.mounted_on === tokens[0])?.used || ''
          }
        })
      }
      return []
    },
    hacmpFSResult () {
      return this.requireFS.map((fs) => {
        const df = this.hacmpFS.find(item => item.file_system === fs)
        const percent = parseInt(df?.used?.replace(/^[%]+|[%]+$/g, ''))
        let light = '🟢'
        if (percent > this.lightCruteria.danger) {
          light = '🔴'
        }
        if (percent > this.lightCruteria.warning) {
          light = '🟡'
        }
        return `
          ${light}
          ${fs}
          ${df ? '已用' : ''}
          ${df?.used || ''}
        `
      })
    },
    hacmpFSMessage () {
      return this.hacmpFS.length === this.requireFS.length
        ? 'HACMP的掛載資料夾檢查通過✅'
        : 'HACMP的掛載資料夾數量有誤❌ ... 請檢查'
    },
    errpt () {
      if (this.messageChunks.length > 0) {
        const lines = this.messageChunks[3].trim().split('\r\n')
        /**
         * remove the first and last line
         * first always 👉 IDENTIFIER TIMESTAMP  T C RESOURCE_NAME  DESCRIPTION
         * last always 👉 e.g. Tue Dec 17 14:00:06 CST 2024
         */
        return lines.slice(1, -1).map((item) => {
          const tokens = item.trim().split(/\s+/)
          return {
            IDENTIFIER: tokens[0], // e.g. DCB47997
            TIMESTAMP: tokens[1], // e.g. 1112221224
            T: tokens[2], // e.g. T
            C: tokens[3], // e.g. H
            RESOURCE_NAME: tokens[4], // e.g. hdisk3
            DESCRIPTION: tokens.splice(5).join(' ') // e.g. DISK OPERATION ERROR
          }
        })
      }
      return []
    },
    light () {
      const now = +new Date()
      if (
        this.$utils.empty(this.headMessage) ||
        now - this.headMessage.timestamp * 1000 > 6 * 60 * 60 * 1000
      ) {
        return 'warning'
      }
      if (this.hacmpFS.length !== this.requireFS.length) {
        return 'danger'
      }
      const lightArr = []
      this.requireFS.forEach((fs) => {
        const df = this.hacmpFS.find(item => item.file_system === fs)
        const percent = parseInt(df?.used?.replace(/^[%]+|[%]+$/g, ''))
        let light = '🟢'
        if (percent > this.lightCruteria.danger) {
          light = '🔴'
        }
        if (percent > this.lightCruteria.warning) {
          light = '🟡'
        }
        lightArr.push(light)
      })
      if (lightArr.includes('🔴')) {
        return 'danger'
      }
      if (lightArr.includes('🟡')) {
        return 'warning'
      }
      return 'success'
    }
  },
  watch: {
    // hacmpFSCapacity (val) { this.$utils.warn(val) }
  },
  mounted () {
    // update the reload timer to 1hrs
    this.reloadMs = (1 * 60 * 60 + this.$utils.rand(60)) * 1000
  },
  methods: {
    dfLight (fsResult) {
      const percent = parseInt(fsResult.trim().split(/\s+/)[3]?.replace(/^[%]+|[%]+$/g, ''))
      if (percent > 80) {
        return 'danger'
      }
      if (percent > 70) {
        return 'warning'
      }
      return 'success'
    },
    dfPopover (fsResult) {
      const fs = fsResult.trim().split(/\s+/)[1]
      const capacity = this.hacmpFSCapacity.find(item => item.mounted_on === fs)
      return `
        裝置：${capacity?.file_system}<br/>
        掛載：${capacity?.mounted_on}<br/>
        容量：${capacity?.gb_blocks} GB<br/>
        剩餘：${capacity?.free} GB<br/>
        使用率：${capacity?.used}
      `
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
.hover:hover {
  background-color: lightcoral;
  color: white;
  font-weight: bolder;
}
</style>
