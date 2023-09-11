<template lang="pug">
b-card(:border-variant="border")
  template(#header): .d-flex.justify-content-between.align-items-center
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        v-if="warnings.length > 0",
        variant="warning",
        :title="`${monitorHrs}小時內告警訊息`"
        @click="showMails({ title: '異常告警', icon: 'exclamation-circle', variant: 'warning', items: warnings })",
        pill,
        no-icon,
        v-b-tooltip.v-warning
      )
        //- span.mr-1 告警
        b-badge(variant="light", pill) {{ warnings.length }}
      lah-button.mx-1(
        v-if="restores.length > 0",
        variant="success",
        :title="`${monitorHrs}小時內回復訊息`"
        @click="showMails({ title: '回復通知', icon: 'check-circle', variant: 'success', items: restores })",
        pill,
        no-icon,
        v-b-tooltip.v-success
      )
        //- span.mr-1 回復
        b-badge(variant="light", pill) {{ restores.length }}
      //- b-input-group.mx-1(size="sm", append="小時", style="max-width: 95px"): b-input(
      //-   v-model="monitorHrs",
      //-   type="number",
      //-   min=1,
      //-   max=24
      //- )
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
        @click="popupMessages('sender', 'SRMAS', 3)",
        title="讀取3天內訊息"
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
        li 顯示 SRMAS 系統回報訊息分析統計
        li 儀錶板每15分鐘重新檢查一次
      hr
      .d-flex.align-items-center
        span 👉 顯示最近
        b-input.mx-1(v-model="monitorHrs", type="number", min=1, max=24, size="sm", style="width: 50px")
        span 小時內的資訊
      hr
      div ⭐ 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示找不到任何郵件訊息
      div 🔴 表示有「告警通知」但無「回復通知」之項目
  slot
  .center(v-if="headMessages.length === 0") ⚠  {{ fetchDay }}日內無資料
  .center.mt-4.h3(v-else-if="problems.length === 0 && fixed.length === 0")
    .mr-1 {{ monitorHrs }}小時內一切正常
    lah-fa-icon(icon="seedling", variant="success")
  div(v-else)
    lah-monitor-board-srmas-list.mb-2(
      v-if="problems.length > 0"
      title-text="無告警回復項目",
      title-icon="exclamation-triangle",
      variant="danger",
      :items="problems"
    )
    lah-monitor-board-srmas-fixed(
      v-if="fixed.length > 0"
      title-text="已正常回復項目",
      title-icon="check-double",
      variant="success",
      :items="fixed"
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
import lahMonitorBoardBase from '~/components/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'
import lahMonitorBoardSrmasFixed from '~/components/lah-monitor-board-srmas-fixed.vue'
import lahMonitorBoardSrmasList from '~/components/lah-monitor-board-srmas-list.vue'

export default {
  name: 'LahMonitorBoardSrmas',
  components: { lahMonitorBoardRaw, lahMonitorBoardSrmasList, lahMonitorBoardSrmasFixed },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'SRMAS分析',
    fetchType: 'sender',
    fetchKeyword: 'SRMAS',
    fetchDay: 1,
    monitorHrs: 12,
    duration: 0,
    threadhold: 0,
    regex: /主機：(\d+\.\d+\.\d+\.\d+)/gm
  }),
  computed: {
    messagesAfterThreadhold () {
      const tmp = this.messages.filter((item, idx, arr) => {
        return item.timestamp > this.threadhold
      })
      // .map((item) => {
      //   return {
      //     id: item.id
      //   }
      // })
      return this.$utils.uniqBy(this.$utils.orderBy(tmp, 'timestamp').reverse(), 'subject')
    },
    headMessages () {
      return this.messages.filter((item, idx, arr) => idx < 3)
    },
    firstMessage () {
      return this.headMessages[0]
    },
    light () {
      if (!this.firstMessage) {
        return 'warning'
      }
      // return this.problems.length > 0 ? 'danger' : 'success'
      if (this.problems.length > 0) {
        const everyTrue = this.problems.every(item => item.message?.includes('🟢'))
        return everyTrue ? 'success' : 'danger'
      }
      return 'success'
    },
    warnings () {
      // return this.messagesAfterThreadhold.filter((item, idx, arr) => item.subject?.includes('異常', '告警', '警告')).reverse()
      return this.$utils.difference(this.messagesAfterThreadhold, this.restores)
    },
    restores () {
      return this.messagesAfterThreadhold.filter((item, idx, arr) => item.subject?.includes('回復', '復原', '恢復'))
    },
    fixed () {
      const bad = [...this.warnings]
      const fixed = []
      // find warning without restore message
      const goodLen = this.restores.length
      for (let i = goodLen - 1; i >= 0; i--) {
        const trimGoodHead = this.restores[i]?.subject?.replace('回復通知-', '')
        let found = -1
        bad.find((item, idx) => {
          // found the restore notification that timestamp is after the warning one
          if (
            item.subject?.includes(trimGoodHead) &&
            this.restores[i].timestamp > item.timestamp
          ) {
            found = idx
            return true
          }
          return false
        })
        if (found !== -1) {
          fixed.push({
            bad: bad.splice(found, 1)[0],
            good: this.restores[i]
          })
        }
      }
      // fixed.reverse()
      return this.$utils.sortBy(fixed, item => item.bad.timestamp).reverse()
      // return fixed
    },
    problems () {
      let bad = [...this.warnings]
      // find warning without restore message
      const goodLen = this.restores.length
      for (let i = goodLen - 1; i >= 0; i--) {
        const trimGoodHead = this.restores[i]?.subject?.replace('回復通知-', '')
        const clearIdx = []
        bad.forEach((item, idx) => {
          if (
            item.subject?.includes(trimGoodHead) &&
            this.restores[i].timestamp > item.timestamp
          ) {
            clearIdx.push(idx)
          }
        })
        // remove clear warning
        clearIdx.forEach(deletedIdx => bad.splice(deletedIdx, 1))
        // clear previoius same warning
        bad = [...bad.filter(item => !item.subject?.includes(trimGoodHead))]
      }
      // active test the connectivity and elimitates the '裝置未回應' item
      const activeClearIdx = []
      bad.forEach((item, idx) => {
        // console.warn(item)
        if (item.message?.includes('裝置未回應')) {
          // find ip to ping
          const result = Array.from(item.message?.matchAll(this.regex) || [])
          if (result.length > 0) {
            // exact matched ip in the Parentheses => (\d+\.\d+\.\d+\.\d+)
            const ip = result[0][1]
            if (this.ping(ip)) {
              activeClearIdx.push(idx)
              const succeedMessage = '🟢 目前 ping 值正常，可忽略此訊息！'
              if (!item.message?.includes(succeedMessage)) {
                item.message = `${succeedMessage}\n\n${item.message}`
              }
            }
          }
        }
      })
      // remove items that ping successfully
      // activeClearIdx.forEach(idx => bad.splice(idx, 1))
      bad.reverse()
      return bad
    }
  },
  watch: {
    monitorHrs (val) {
      this.calcTime()
      this.setCache('monitorHrs', val)
    },
    messages (val) {
      console.warn(val)
    }
  },
  async created () {
    // debounce the input event
    this.calcTime = this.$utils.debounce(() => {
      this.duration = this.monitorHrs * 60 * 60 * 1000
      this.threadhold = (+new Date() - this.duration) / 1000
    }, 500)
    this.monitorHrs = await this.getCache('monitorHrs') || 12
    this.calcTime()
  },
  mounted () {},
  methods: {
    showMails (payload) {
      // destruvting obj entries to vars
      const { title, icon, variant, items } = payload
      this.modal(this.$createElement(lahMonitorBoardSrmasList, {
        props: {
          titleText: title,
          titleIcon: icon,
          variant,
          items
        }
      }), {
        title,
        size: 'lg'
      })
    },
    async ping (ip) {
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.IP, {
          type: 'ping',
          ip
        })
        // this.$utils.log(ip, data)
        return this.$utils.statusCheck(data.status)
      } catch (e) {
        this.$utils.error(e)
      }
      return false
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
