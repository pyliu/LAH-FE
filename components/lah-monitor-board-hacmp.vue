<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    b-button-group.ml-auto(size="sm")
      //- lah-button(
      //-   icon="chart-simple",
      //-   :href="grafanaUrl",
      //-   target="_blank",
      //-   no-border,
      //-   title="開啟新視窗顯示詳細DB儀表板"
      //- ) 詳細資訊
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
    lah-help-modal(ref="help", :modal-title="`${header} 監控說明`", size="lg")
      ul
        li 顯示資料庫主節點(51)HACMP狀態
          ul
            li 請於 crontab 安裝「#[b-link.text-danger.font-weight-bold(:href="checkHacmpSh" target="_blank" title="下載腳本") check-hacmp-fs.sh]」以利完成後送出通知電子郵件。(⭐請依各實際環境修正腳本內路徑及收件者資訊⭐)
            li e.g. 在 root 的 crontab 新增「0 8-17 * * 1-6 /scripts/check-hacmp-fs.sh > /dev/null」於辦公時間每小時執行一次(請自行依擺放腳本位置修正路徑)。
        li 分析電子郵件內文以顯示是否掛載7個資料夾。
          ul: li /ARCH, /BACKUP, /oracle, /WEB/DB1, /WEB/DB2, /WEB/DB3, /WEB/DB4
        li 依上述 crontab 設定時間檢查(桃園所 👉 每天 08:00 ~ 17:00 每小時檢查一次)。
        li 儀表板約60分鐘重新更新一次。
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示狀態未更新或是主機有錯誤訊息或是有掛載的資料夾使用量超過 {{ lightCruteria.warning }}%
      div 🔴 表示檢測有錯誤或是有掛載的資料夾使用量超過 {{ lightCruteria.danger }}%
      b-img.mt-2.shadow.w-100(src="~/assets/img/mb_hacmp.jpg", fluid, thumbnail)
  slot
  .center(v-if="$utils.empty(headMessage)") ⚠ {{ fetchDay }}日內無資料
  div(v-else)
    section
      lah-message.font-weight-bold.mb-1(
        v-if="isTodayErrpt",
        :message="firstErrptDesc",
        close-variant="danger",
        size="sm",
        :close-mark="false"
      )
      .d-flex.justify-content-between.font-weight-bold.mb-1
        a.truncate(
          href="#",
          @click="popupLogContent(headMessage)",
          title="顯示詳細記錄",
          v-html="hacmpFSMessage"
        )
        lah-badge-human-datetime(
          :variant="isToday(headMessage.timestamp) ? 'success' : 'muted'",
          :seconds="headMessage.timestamp"
        )
      lah-flex-item-group.small
        .col-4.hover(
          v-for="(fs, idx) in requireFS",
          :key="`fs_${idx}`",
          v-b-popover.hover.html="dfPopover(fs)"
        )
          .d-flex.justify-content-between.align-items-center
            strong {{ fs }}
            span {{ isFSOK(fs) ? `${progress(fs)}%` : '🔴' }}
          b-progress(
            v-if="isFSOK(fs)"
            :variant="progressLight(fs)",
            :value="progress(fs)",
            max="100",
            animated,
            striped
          )
    hr(v-if="errpt.length > 0")
    div(v-if="errpt.length > 0")
      .d-flex.justify-content-between.font-weight-bold.mb-1
        a.truncate(
          href="#",
          @click="popupLogContent(headMessage)",
          title="顯示詳細記錄"
        ): lah-fa-icon(
          icon="triangle-exclamation",
          variant="danger"
        ) 伺服器錯誤訊息({{ errpt.length }})
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
import lahMonitorBoardBase from '~/mixins/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'

export default {
  name: 'LahMonitorBoardHacmp',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '資料庫主節點(51) HACMP',
    fetchType: 'subject',
    fetchKeyword: 'hacmp',
    fetchDay: 1,
    requireFS: ['/ARCH', '/WEB/DB1', '/WEB/DB2', '/WEB/DB3', '/WEB/DB4', '/BACKUP', '/oracle'],
    lightCruteria: {
      danger: 85,
      warning: 80
    },
    errorLines: []
  }),
  computed: {
    checkHacmpSh () {
      return '/assets/sh/check-hacmp-fs.sh'
    },
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
    hacmpFSOK () {
      if (this.hacmpFS.length !== this.requireFS.length) {
        this.$utils.error(this.hacmpFS, this.requireFS)
        return false
      }
      return this.hacmpFS.every(fs => !this.$utils.empty(fs.used))
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
        /**
         * expect [1] will be below
         *
         * #File System Volume Group Resource Group Node List
         * /oracle datavg reg_ctl ORAHAHA1,ORAHAHA2
         * /ARCH datavg reg_ctl ORAHAHA1,ORAHAHA2
         * /WEB/DB1 datavg reg_ctl ORAHAHA1,ORAHAHA2
         * /WEB/DB2 datavg reg_ctl ORAHAHA1,ORAHAHA2
         * /WEB/DB3 datavg reg_ctl ORAHAHA1,ORAHAHA2
         * /WEB/DB4 datavg reg_ctl ORAHAHA1,ORAHAHA2
         * /BACKUP datavg reg_ctl ORAHAHA1,ORAHAHA2
         *  df -g
         *
         * ERROR got below
         *
         * clhaver[211]: cannot connect to node ORAHAHA2 rc=-1 errno=0
         * cl_showfs2: The command will not be run because the following nodes are unreachable: ORAHAHA2
         * df -g
         *
         */
        const lines = this.messageChunks[1].trim().split('\r\n')
        if (lines.length === 9) {
          this.$nextTick(() => {
            // clean error lines
            this.errorLines = []
          })
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
        // add error lines
        this.$nextTick(() => {
          this.$utils.error('HACMP檢查檢查錯誤', lines)
          // remove last line 👉 "df -g"
          this.errorLines = lines.slice(0, -1)
        })
        return []
      }
      return []
    },
    hacmpFSMessage () {
      if (this.hacmpFSOK) {
        return '✅ 掛載資料夾正常'
      }
      if (this.errorLines.length > 0) {
        return `❌ 有錯誤訊息 ... 請檢查<br/>${this.errorLines.join('<br/>')}`
      }
      return ''
    },
    isTodayErrpt () {
      if (this.headErrpt === false) {
        return false
      }
      const days = this.daysAgo(this.headErrpt)
      return parseInt(days) === 0
    },
    firstErrptDesc () {
      return `🟡 24小時內有錯誤訊息 「${this.headErrpt?.DESCRIPTION}」`
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
            TIMESTAMP: this.formatErrptTimestamp(tokens[1]), // e.g. 1112221224
            T: tokens[2], // e.g. T
            C: tokens[3], // e.g. H
            RESOURCE_NAME: tokens[4], // e.g. hdisk3
            DESCRIPTION: tokens.splice(5).join(' ') // e.g. DISK OPERATION ERROR
          }
        })
      }
      return []
    },
    headErrpt () {
      if (this.errpt.length > 0) {
        return this.errpt[0]
      }
      return false
    },
    light () {
      const now = +new Date()
      if (
        this.$utils.empty(this.headMessage) ||
        now - this.headMessage.timestamp * 1000 > 6 * 60 * 60 * 1000
      ) {
        return 'warning'
      }

      if (!this.hacmpFSOK) {
        return 'danger'
      }
      const lightArr = []
      this.requireFS.forEach((fs) => {
        const df = this.hacmpFS.find(item => item.file_system === fs)
        const percent = parseInt(df?.used?.replace(/^[%]+|[%]+$/g, ''))
        let light = '🟢'
        if (percent > this.lightCruteria.warning) {
          light = '🟡'
        }
        if (percent > this.lightCruteria.danger) {
          light = '🔴'
        }
        lightArr.push(light)
      })
      if (lightArr.includes('🔴')) {
        return 'danger'
      }
      if (lightArr.includes('🟡')) {
        return 'warning'
      }

      if (this.isTodayErrpt) {
        return 'warning'
      }

      return 'success'
    }
  },
  watch: {
    // hacmpFS (val) { this.$utils.warn(val) }
  },
  mounted () {
    // update the reload timer to 1hrs
    this.reloadMs = (1 * 60 * 60 + this.$utils.rand(60)) * 1000
    this.lightCruteria.danger = this.$config.monitor.capacity.threshold.danger
    this.lightCruteria.warning = this.$config.monitor.capacity.threshold.warning
  },
  methods: {
    daysAgo (message) {
      // 1. 檢查輸入的訊息是否為物件，且包含 TIMESTAMP 屬性
      if (!message.TIMESTAMP) {
        return false
      }
      const dateTimeStr = message.TIMESTAMP
      // 2. 將 TIMESTAMP 字串轉換為 Date 物件
      const [datePart, timePart] = dateTimeStr.split(' ') // 分割日期和時間
      // eslint-disable-next-line prefer-const
      let [month, day, year] = datePart.split('-') // 分割日期
      const [hour, minute, second] = timePart.split(':') // 分割時間

      // 如果年份不存在，則預設為今年
      if (!year) {
        year = new Date().getFullYear()
      }

      // 注意：月份從 0 開始，所以需要減 1
      const messageDate = new Date(year, month - 1, day, hour, minute, second)
      // 3. 取得現在的日期
      const now = new Date()
      // 4. 計算時間差 (毫秒)
      const timeDiff = now.getTime() - messageDate.getTime()
      // 5. 將毫秒轉換為天數
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      return days // 回傳天數
    },
    formatErrptTimestamp (timestamp) {
      if (!/^\d{10}$/.test(timestamp)) {
        return '時間戳記格式不符' // Handle invalid input
      }
      const month = timestamp.slice(0, 2)
      const day = timestamp.slice(2, 4)
      const hour = timestamp.slice(4, 6)
      const minute = timestamp.slice(6, 8)
      const second = timestamp.slice(8, 10)
      return `${month}-${day} ${hour}:${minute}:${second}`
    },
    dfLight (fsResult) {
      const percent = parseInt(fsResult.trim().split(/\s+/)[3]?.replace(/^[%]+|[%]+$/g, ''))
      if (percent > this.lightCruteria.danger) {
        return 'danger'
      }
      if (percent > this.lightCruteria.warning) {
        return 'warning'
      }
      return 'success'
    },
    dfPopover (fs) {
      const capacity = this.hacmpFSCapacity.find(item => item.mounted_on === fs)
      if (capacity) {
        return `
          裝置：${capacity.file_system}<br/>
          掛載：${capacity.mounted_on}<br/>
          容量：${capacity.gb_blocks} GB<br/>
          剩餘：${capacity.free} GB<br/>
          使用率：${capacity.used}
        `
      }
      return '⚠異常，無使用容量資訊'
    },
    progress (fs) {
      const df = this.hacmpFSCapacity.find(item => item.mounted_on === fs)
      return parseInt(df?.used?.replace(/^[%]+|[%]+$/g, ''))
    },
    isFSOK (fs) {
      return !isNaN(this.progress(fs))
    },
    progressLight (fs) {
      const percent = this.progress(fs)
      if (isNaN(percent) || percent > this.lightCruteria.danger) {
        return 'danger'
      }
      if (percent > this.lightCruteria.warning) {
        return 'warning'
      }
      return 'success'
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
