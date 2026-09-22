<template lang="pug">
b-card(:class="{ 'board-expanded': hasFoundCases }")
  template(#header)
    .d-flex.align-items-center
      lah-fa-icon(icon="screwdriver-wrench", size="lg", variant="info") 快速檢測＆修正
      b-button-group.ml-auto(size="sm"): lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="快速檢測及修正說明"
      )
    lah-help-modal(ref="help", modal-title="快速檢測及修正說明", size="lg")
      h5 本項功能提供下列6項檢測/查詢功能。
      ul
        li 測量案件通知書暫存檔查詢
          ol
            li 測量課常有通知書無法產製出問題，經查狀況為 CMCRD 表格中存有#[strong.text-primary 空白內容]或是#[strong.text-primary 沒有案件連結]的暫存檔影響流水號申請。
            li 本功能提供查詢後列出系統目前暫存檔以供管理師查看及管理。
        li 本月簡訊查詢
          ul
            li 查詢本月所有簡訊紀錄
        li 登記案件跨所註記問題檢測 (CRSMS)
          ol
            li RM99 = 'Y'
            li RM100 = '資料管轄所代碼'
            li RM100_1 = '資料管轄所縣市代碼'
            li RM101 = '收件所代碼'
            li RM101_1 = '收件所縣市代碼'
        li 地價案件跨所註記問題檢測 (PSCRN)
          ol
            li SS99 = 'Y'
            li SS100 = '資料管轄所代碼'
            li SS100_1 = '資料管轄所縣市代碼'
            li SS101 = '收件所代碼'
            li SS101_1 = '收件所縣市代碼'
        li 悠遊卡付款問題檢測
          ol
            li 櫃台來電通知悠遊卡扣款成功但地政系統卻顯示扣款失敗，需跟櫃台要【電腦給號】
            li 管理師處理方法：AA106為'2' OR '8'將AA106更正為'1'即可【AA01:事發日期、AA04:電腦給號】。
            li 語法參考：UPDATE MOIEXP.EXPAA SET AA106 = '1' WHERE AA01='1070720' AND AA04='0043405'
        li 測量案件連件問題檢測
          ol
            li ※注意：本功能會清除問題欄位資料並將案件辦理情形改為【核定】，請確認後再執行。
            li 原因是 CMB0301 延期複丈功能，針對於有連件案件在做處理時，會自動根據MM24案件數，將後面的案件自動做延期複丈的更新。導致後續已結案的案件會被改成延期複丈的狀態 MM22='C' 就是 100、200、300、400為四連件，所以100的案件 MM24='4'，200、300、400 的 MM24='0' 延期複丈的問題再將100號做延期複丈的時候，會將200、300、400也做延期複丈的更新，所以如果400已經結案，100做延期複丈，那400號就會變成 MM22='C' MM23='A' MM24='4' 的異常狀態。

  .check-row
    lah-mgmt-board-cmcrd-check-badge
  hr
  //- .d-flex.align-items-center.justify-content-between.check-row
  //-   lah-fa-icon.mr-1(icon="file") 最新權狀序號
  //-   lah-badge-latest-certno(@fetched="handledUpdated")
  //- hr
  .d-flex.align-items-center.justify-content-between.check-row(title="輸入手機或EMAIL查詢")
    lah-fa-icon.text-nowrap(
      icon="comment-sms"
    ) 簡訊查詢
    b-input.mx-1(
      v-model="smsKeyword",
      size="sm",
      placeholder="... 手機或EMAIL ...",
      @keyup.enter="querySMS"
    )
    lah-button(
      icon="magnifying-glass",
      title="依條件查詢SMS紀錄",
      @click="querySMS",
      :disabled="!validSMSKeyword"
    ) 查詢
  hr
  .d-flex.align-items-center.justify-content-between.check-row
    lah-fa-icon.mr-1(icon="magnifying-glass") 「登記案件」跨所註記
    lah-button(
      title="檢測登記案件跨所註記遺失問題",
      @click="checkRegXcase",
      no-icon-gutter
    ) 檢測
  hr
  .d-flex.align-items-center.justify-content-between.check-row
    lah-fa-icon.mr-1(icon="dollar-sign") 「地價案件」跨所註記
    lah-button(
      title="檢測地價案件跨所註記遺失問題",
      @click="checkValXcase",
      no-icon-gutter
    ) 檢測
  hr
  .d-flex.align-items-center.justify-content-between.check-row
    lah-fa-icon.mr-1(icon="credit-card") 規費悠遊卡付款問題
    lah-button(
      title="檢測悠遊卡付款失敗問題(一周內)",
      @click="checkEzPayment"
    ) 檢測
  hr
  .d-flex.align-items-center.justify-content-between.check-row
    lah-fa-icon.mr-1(icon="location-dot") 測量連件問題案件
    lah-button(
      title="測量問題案件檢測",
      @click="checkSurCase"
    ) 檢測
  hr
  //- .d-flex.align-items-center.justify-content-between.check-row
  //-   lah-fa-icon.mr-1(icon="file-circle-exclamation") 測量複丈通知書暫存檔
  //-   lah-button(
  //-     :title="`查詢所有 ${year} 年通知書暫存資料`",
  //-     @click="showSurCmcrdTmpModal"
  //-   ) 查詢
  //- hr

  lah-message(:message="message", auto-hide, close-variant="danger")

  lah-transition(appear): b-card(v-if="foundRegCases")
    h5: lah-fa-icon(icon="triangle-exclamation", variant="warning") 找到下列跨所註記遺失案件(登記)
    b-list-group(flush)
      b-list-group-item(
        v-for="(item, index) in regCases",
        :key="`reg_case_${index}`",
        href="#",
        @click="detail(item)"
      )
        .d-flex.align-items-center.justify-content-between
          lah-fa-icon(icon="circle-exclamation", variant="danger") {{ $utils.caseId(item) }}
          lah-button(icon="hammer", action="tick", variant="outline-primary", @click="fixRegCase(item)") 修正

  lah-transition(appear): b-card(v-if="foundValCases")
    h5: lah-fa-icon(icon="triangle-exclamation", variant="warning") 找到下列跨所註記遺失案件(地價)
    b-list-group(flush)
      b-list-group-item(
        v-for="(item, index) in valCases",
        :key="`val_case_${index}`",
        href="#",
        @click="detail(item)"
      )
        .d-flex.align-items-center.justify-content-between
          lah-fa-icon(icon="circle-exclamation", variant="danger") {{ $utils.caseId(item) }}
          lah-button(icon="hammer", action="tick", variant="outline-info", @click="fixValCase(item)") 修正

  lah-transition(appear): b-card(v-if="foundPaymentData")
    h5: lah-fa-icon(icon="triangle-exclamation", variant="warning") 找到下列悠遊卡付款失敗問題
    b-list-group(flush)
      b-list-group-item(
        v-for="(item, index) in paymentData"
        :key="`payment_${index}`"
      )
        | 日期: {{ item["AA01"] }}, 電腦給號: {{ item["AA04"] }}, 實收金額: {{ item["AA28"] }}
        b-badge(v-if="!$utils.empty(item['AA104'])", variant="danger") , 作廢原因: {{ item["AA104"] }}
        | , 目前狀態: {{paymentStatus(item["AA106"]) }}
        lah-button(v-if="$utils.empty(item['AA104'])", @click="paymentFix(item)", variant="outline-dark") 修正

  lah-transition(appear): b-card(v-if="foundSurCases")
    h5: lah-fa-icon(icon="triangle-exclamation", variant="warning") 找到下列有問題之測量案件
    b-list-group(flush)
      b-list-group-item(
        v-for="(id, index) in surCases",
        :key="`val_case_${id}`"
      )
        .d-flex.align-items-center.justify-content-between
          lah-fa-icon(icon="circle-exclamation", variant="danger") {{ $utils.caseId(id) }}
          lah-button(icon="hammer", action="tick", variant="outline-secondary", @click="fixSurCase(id)") 修正

  //- template(#footer)
  //-   .d-flex.justify-content-between
  //-     lah-fa-icon(icon="dog", size="lg", variant="secondary")
  //-     lah-fa-icon(icon="paw", size="lg", variant="secondary")
</template>

<script>
import lahRegCaseDetailVue from './lah-reg-case-detail.vue'
import lahAdmSmslogTableVue from '~/components/lah-adm-smslog-table.vue'
import lahMgmtBoardCmcrdCheckVue from '~/components/lah-mgmt-board-cmcrd-check.vue'
export default {
  components: { lahRegCaseDetailVue, lahAdmSmslogTableVue, lahMgmtBoardCmcrdCheckVue },
  data: () => ({
    // regCases: ['105HAB1016151', '105HAB1016150'],
    // valCases: ['105HAB1016130', '105HAB1016090'],
    // surCases: ['105HA52035400']
    regCases: [],
    valCases: [],
    surCases: [],
    paymentData: [],
    smsLogs: [],
    message: '',
    clearTimer: null,
    year: '',
    smsKeyword: ''
  }),
  computed: {
    foundRegCases () {
      return this.regCases?.length > 0
    },
    foundValCases () {
      return this.valCases?.length > 0
    },
    foundPaymentData () {
      return this.paymentData?.length > 0
    },
    foundSurCases () {
      return this.surCases?.length > 0
    },
    validSMSKeyword () {
      return this.smsKeyword?.length > 1
    },
    hasFoundCases () {
      return this.foundRegCases || this.foundValCases || this.foundPaymentData || this.foundSurCases
    }
  },
  watch: {},
  created () {
    // default is this TW year
    const now = new Date()
    this.year = now.getFullYear() - 1911
    const firstDayofMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayofMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const st = this.$utils.twDateStr(firstDayofMonth)
    const ed = this.$utils.twDateStr(lastDayofMonth)
    this.smsKeyword = `${st} ~ ${ed}`
  },
  mounted () {},
  methods: {
    beforeFetch () {
      this.isBusy = true
      this.message = `${this.$utils.time()} 查詢中 ...`
      this.regCases = []
      this.valCases = []
      this.surCases = []
      this.paymentData = []
    },
    detail (caseId) {
      this.modal(this.$createElement(lahRegCaseDetailVue, {
        props: { caseId }
      }), {
        title: `登記案件詳情 ${this.$utils.caseId(caseId)}`,
        size: 'xl'
      })
    },
    checkXcase (type) {
      this.beforeFetch()
      this.$axios.post(this.$consts.API.JSON.XCASE, { type }).then((res) => {
        const caseType = type.startsWith('val') ? '地價' : '登記'
        const prefix = `檢測「${caseType}案件」跨所註記問題`
        if (this.$utils.statusCheck(res.data.status)) {
          if (type === 'xcase-check') {
            this.regCases = res.data.case_ids
          } else if (type === 'val-xcase-check') {
            this.valCases = res.data.case_ids
          }
        } else if (res.data.status === this.$consts.XHR_STATUS_CODE.DEFAULT_FAIL) {
          this.message = `${this.$utils.time()} 🟢 ${prefix}，目前一切正常`
          // this.success('🟢 目前一切正常', {
          //   title: '檢測案件跨所註記問題'
          // })
        } else {
          this.message = `${this.$utils.time()} 🔴${prefix}，${res.data.messag}`
          // this.alert(res.data.message, { title: '檢測案件跨所註記問題' })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    checkValXcase () {
      this.checkXcase('val-xcase-check')
    },
    checkRegXcase () {
      this.checkXcase('xcase-check')
    },
    fixCase (type, id, callback) {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.XCASE, {
        type,
        id
      }).then((res) => {
        const caseType = type.endsWith('val') ? '地價' : '登記'
        const prefix = `修正「${caseType}案件」跨所註記`
        if (this.$utils.statusCheck(res.data.status)) {
          this.message = `${this.$utils.time()} 🟢 ${prefix} ${this.$utils.caseId(id)} 成功`
          // this.success(`${this.$utils.caseId(id)} 已修正跨所註記。`, {
          //   title: '跨所註記遺失案件修正狀態',
          //   subtitle: this.$utils.caseId(id)
          // })
          callback && callback()
        } else {
          this.message = `${this.$utils.time()} 🟡 ${prefix} ${this.$utils.caseId(id)} 失敗`
          // this.warning(`${this.$utils.caseId(id)} 跨所註記修正失敗！(${res.data.status})`, {
          //   title: '跨所註記遺失案件修正狀態',
          //   subtitle: this.$utils.caseId(id)
          // })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    fixRegCase (caseId) {
      this.fixCase('fix_xcase', caseId, () => {
        this.regCases = this.regCases.filter(item => item !== caseId)
      })
    },
    fixValCase (caseId) {
      this.fixCase('fix_xcase_val', caseId, () => {
        this.valCases = this.valCases.filter(item => item !== caseId)
      })
    },
    checkEzPayment () {
      this.beforeFetch()
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'ez-payment-check',
        qday: ''
      }).then((res) => {
        if (this.$utils.statusCheck(res.data.status)) {
          this.paymentData = res.data.raw
        } else {
          this.message = `${this.$utils.time()} 🟢 檢測悠遊卡付款問題：${res.data.message}`
          // this.success(res.data.message, { title: '檢測悠遊卡付款問題' })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    paymentStatus (AA106) {
      let status = '未知的狀態碼【' + AA106 + '】'
      /*
          1：扣款成功
          2：扣款失敗
          3：取消扣款
          8：扣款異常交易
          9：取消扣款異常交易
      */
      switch (AA106) {
        case '1':
          status = '扣款成功'
          break
        case '2':
          status = '扣款失敗'
          break
        case '3':
          status = '取消扣款'
          break
        case '8':
          status = '扣款異常交易'
          break
        case '9':
          status = '取消扣款異常交易'
          break
        default:
          break
      }
      return status
    },
    paymentFix (item) {
      const qday = item.AA01
      const pcNumber = item.AA04
      const amount = item.AA28
      const message = '確定要修正 日期: ' + qday + ', 電腦給號: ' + pcNumber + ', 金額: ' + amount + ' 悠遊卡付款資料?'
      this.confirm(message).then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'fix_easycard',
            qday,
            pc_num: pcNumber
          }).then((res) => {
            if (this.$utils.statusCheck(res.data.status)) {
              this.message = `${this.$utils.time()} 🟢 修正：日期: ${qday}, 電腦給號: ${pcNumber} 成功`
              // this.success('修正 日期: ' + qday + ', 電腦給號: ' + pcNumber + ' 成功', { title: '悠遊卡付款失敗修正' })
              this.paymentData = this.paymentData.filter(item => !(item.AA01 === qday && item.AA04 === pcNumber))
            } else {
              this.message = `${this.$utils.time()} 🔴 修正失敗：${res.data.message}`
              // this.alert(res.data.message, { title: '悠遊卡付款失敗修正' })
            }
          }).catch((err) => {
            this.error = err
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    checkSurCase () {
      this.beforeFetch()
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'sur-problem-check'
      }).then((res) => {
        if (this.$utils.statusCheck(res.data.status)) {
          this.surCases = res.data.ids
        } else {
          this.message = `${this.$utils.time()} 🟢 ${res.data.message}`
          // this.success(res.data.message, { title: '檢測測量問題案件' })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    fixSurCase (id) {
      const message = `確定要修正本案件 ${this.$utils.caseId(id)} ?<p class="pt-3"><i class="fa fa-exclamation-circle text-danger"></i> 將修正下列欄位：</p>1.辦理情形改為核定<br/>2.清除延期時間<br/>3.連件數設為1<br/><br/>請確認再行修正。`
      this.confirm(message, { html: true }).then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'fix_sur_delay_case',
            id,
            UPD_MM22: true,
            CLR_DELAY: true,
            FIX_COUNT: true
          }).then((res) => {
            if (this.$utils.statusCheck(res.data.status)) {
              this.message = `${this.$utils.time()} 🟢 ${this.$utils.caseId(id)} 案件修正成功！`
              // this.success(`${this.$utils.caseId(id)} 案件修正成功！`, {
              //   title: '修正複丈案件',
              //   subtitle: id
              // })
              this.surCases = this.surCases.filter(item => item !== id)
            } else {
              const msg = '回傳狀態碼不正確!【' + res.data.message + '】'
              this.message = `${this.$utils.time()} 🟡 修正複丈案件失敗：${msg} (${id})`
              // this.alert(msg, {
              //   title: '修正複丈案件失敗',
              //   subtitle: id
              // })
            }
          }).catch((err) => {
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    showSurCmcrdTmpModal () {
      this.modal(this.$createElement(lahMgmtBoardCmcrdCheckVue, {
        props: {
          embedMode: false
        }
      }), {
        title: '複丈通知書暫存檔列表',
        size: 'lg'
      })
    },
    querySMS () {
      this.modal(this.$createElement(lahAdmSmslogTableVue, {
        props: {
          inKeyword: this.smsKeyword
        }
      }), {
        title: '地政系統簡訊綜合記錄檔查詢',
        size: 'xl',
        noCloseOnBackdrop: true,
        centered: false,
        scrollable: false
      })
    },
    handledUpdated (response) {
      this.message = `${this.$utils.time()} ${response.message}`
    }
  }
}
</script>

<style lang="scss" scoped>
.check-row {
  &:hover {
    background-color: rgb(226, 248, 225);
    // padding: 5px;
    border-radius: 10px;
  }
}
</style>
