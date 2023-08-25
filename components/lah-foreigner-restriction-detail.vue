<template lang="pug">
b-card
  b-card-title
    .d-flex.justify-content-between
      div {{ `${origData.BA48} ${origData.BA48_CHT} ${$utils.formatLandNumber(origData.BA49)} 地號` }}
      div
        lah-fa-icon(
          v-if="isControlled(origData)",
          icon="triangle-exclamation",
          variant="warning"
        ) 依土地法第17條第1項各款以外規定管制
        lah-fa-icon.ml-1(
          v-if="isLogout(origData)",
          icon="circle-xmark",
          variant="danger"
        ) 已註銷
      .font-weight-bold(
        :class="deadlineCss(origData)"
      ) {{ light(origData) }} 最後期限：{{ deadline(origData) }}
      b-link.card-link(
        v-if="!$utils.empty(origData.ID)",
        href="#",
        @click="popupCase(origData)"
      ) {{ origData.收件字號 }}

  b-card-text: b-list-group(flush)
    b-list-group-item: .d-flex
      .w-3rd 登記日期：{{ $utils.addDateDivider(origData.BB05) }}
      //- .w-3rd
      //-   b-button(variant="primary", pill, size="lg"): .d-flex.align-items-center
      //-     .mr-1 登記日期
      //-     b-badge(variant="light") {{ $utils.addDateDivider(origData.BB05) }}
      .w-3rd.text-center 登記原因：{{ origData.BB06 }} {{ origData.BB06_CHT }}
      .w-3rd.text-right 發生日期：{{ $utils.addDateDivider(origData.BB07) }}
    b-list-group-item: .d-flex
      .w-3rd 權狀字號：{{ origData.BB16 }}
      .w-3rd.text-center 權利範圍：{{ origData.BB15_1 }} {{ origData.BB15_1_CHT }} ({{ equityRatio }})
      .w-3rd.text-right(v-if="$utils.empty(origData.AA11)") 申報地價：{{ origData.BB21 }}
      .w-3rd.text-right(v-else) 使用分區：{{ origData.AA11_CHT }}
    b-list-group-item: .d-flex
      .w-3rd 統編：{{ ownerId }}
      .w-3rd.text-center 姓名：{{ ownerName }}
      .w-3rd.text-right 生日：{{ $utils.addDateDivider(origData.LBIR_2) }}
    b-list-group-item: .d-flex
      .w-3rd.font-weight-bolder 國籍：{{ nation }}
      .w-3rd.text-center 使用分區：{{ usePartition }}
      .w-3rd.text-right 地址：{{ origData.LADR }}
    b-list-group-item: .d-flex
      .w-3rd.font-weight-bolder 繼承登記日期：{{ $utils.addDateDivider(regDate) }}
      .w-3rd.text-center
      .w-3rd.text-right.font-weight-bolder 收件字號：{{ regCaseno }}
    b-list-group-item: .d-flex
      .w-3rd.font-weight-bolder 移國產署標售日期：{{ $utils.addDateDivider(transferDate) }}
      .w-3rd.text-center
      .w-3rd.text-right.font-weight-bolder 移國產署標售文號：{{ transferCaseno }}
    b-list-group-item: .d-flex
      .w-3rd.font-weight-bolder 移轉本國人登記日期：{{ $utils.addDateDivider(transferLocalDate) }}
      .w-3rd.text-center.font-weight-bolder 移轉本國人登記原則：{{ transferLocalPrinciple }}
      .w-3rd.text-right.font-weight-bolder 回復或歸化本國籍日期：{{ $utils.addDateDivider(restoreLocalDate) }}
    b-list-group-item: b-card
      h5 - 其他登記事項
      .ml-3(v-html="formatGG30_2(origData.GG30_2)")
      h5.mt-2.font-weight-bolder - 備註
      .ml-3.font-weight-bolder(v-html="note")
</template>

<script>
import lahRegCaseDetailVue from '~/components/lah-reg-case-detail.vue'
export default {
  emit: [],
  component: {},
  props: {
    origData: { type: Object, default: () => ({}) }
  },
  data: () => ({
    regex: /本筆土地應於[中華民國]*([０１２３４５６７８９]{2,3})年([０１２３４５６７８９]{1,2})月([０１２３４５６７８９]{1,2})日前移轉[於與]本國人/gm,
    doneRegex: /移請財政部國有財產署公開標售/gm
  }),
  computed: {
    certNo () {
      return this.origData.RESTRICTION_DATA.cert_no || this.origData.BB16 || ''
    },
    ownerId () {
      return this.origData.BB09 || ''
    },
    ownerName () {
      return this.origData.BB09_CHT || ''
    },
    nation () {
      return this.origData.RESTRICTION_DATA.nation || ''
    },
    regDate () {
      return this.origData.RESTRICTION_DATA.reg_date || ''
    },
    regCaseno () {
      return this.origData.RESTRICTION_DATA.reg_caseno || ''
    },
    transferDate () {
      return this.origData.RESTRICTION_DATA.transfer_date || ''
    },
    transferCaseno () {
      return this.origData.RESTRICTION_DATA.transfer_caseno || ''
    },
    transferLocalDate () {
      return this.origData.RESTRICTION_DATA.transfer_local_date || ''
    },
    transferLocalPrinciple () {
      return this.origData.RESTRICTION_DATA.transfer_local_principle || ''
    },
    restoreLocalDate () {
      return this.origData.RESTRICTION_DATA.restore_local_date || ''
    },
    usePartition () {
      return this.origData.RESTRICTION_DATA.use_partition || ''
    },
    note () {
      return this.origData.RESTRICTION_DATA.note || ''
    },
    equityRatio () {
      return `${this.origData.BB15_3}/${this.origData.BB15_2}`
    }
  },
  watch: {},
  created () {},
  mounted () {},
  methods: {
    extractDueDate (str) {
      const matched = Array.from(str?.matchAll(this.regex))
      /** expect array result
       * 0: 本筆土地應於１１０年９月３日前移轉與本國人"
       * 1: "１１０"
       * 2: "９"
       * 3: "３"
       * groups: undefined
       * index: 0
       * input: "本筆土地應於１１０年９月３日前移轉與本國人，逾期辦理公開標售"
       */
      if (Array.isArray(matched[0])) {
        const year = 1911 + parseInt(this.$utils.convertDBytesNumber(matched[0][1]))
        const month = this.$utils.convertDBytesNumber(matched[0][2]) - 1
        const day = this.$utils.convertDBytesNumber(matched[0][3])
        return new Date(year, month, day)
      }
      return false
    },
    isDone (str) {
      const matched = Array.from(str?.matchAll(this.doneRegex))
      return matched.length > 0
    },
    formatGG30_2 (str) {
      const arr = str?.split('\n')
      let tmp = `一般註記事項：${arr[0]}`
      if (arr[1]) {
        tmp += `<br/>列冊管理期滿：${arr[1]}`
      }
      return tmp
    },
    deadline (item) {
      const d = this.extractDueDate(item.GG30_2)
      if (d) {
        return this.$utils.addDateDivider(this.$utils.twDateStr(d))
      }
      return '無期限'
    },
    light (item) {
      if (!this.isDone(item.GG30_2)) {
        const dueDate = this.extractDueDate(item.GG30_2)
        if (dueDate) {
          const ts = dueDate.getTime()
          const now = this.$utils.nowTs()
          if (now > ts) {
            return '🔴'
          }
          const offset = ts - now
          if (offset < 6 * 30 * 24 * 60 * 60 * 1000) {
            return '🟡'
          }
        }
      }
      return '🟢'
    },
    deadlineCss (item) {
      const light = this.light(item)
      if (light === '🔴') {
        return ['text-danger']
      } else if (light === '🟡') {
        return ['text-warning']
      }
      return ['text-primary']
    },
    popupCase (item) {
      this.modal(this.$createElement(lahRegCaseDetailVue, {
        props: {
          caseId: item.ID,
          parentData: item
        },
        on: {
          'not-found': () => {
            this.hideModal()
            this.warning(`⚠ 無法找到 ${this.$utils.caseId(item.ID)} 登記案件資料。`)
          }
        }
      }), {
        title: `案件詳情 ${this.$utils.caseId(item.ID)}`,
        size: 'xl'
      })
    },
    isLogout (item) {
      const val = item.RESTRICTION_DATA?.logout
      return val === true || val === 'true'
    },
    isControlled (item) {
      const val = item.RESTRICTION_DATA?.control
      return val === true || val === 'true'
    }
  }
}
</script>

<style lang="scss" scoped>
.w-3rd {
  width: 33.33%;
}
.w-4th {
  width: 25%;
}
</style>
