<template lang="pug">
b-card
  template(#header)
    .d-flex.align-items-center
      h6.mb-0.mt-1.mr-1 #[lah-fa-icon(icon="2", size="lg") 登記案件狀態修正]
      a.text-primary.font-weight-bold(href="#", @click="detail", title="顯示案件詳情") {{ $utils.caseId(caseId) }}
      b-button-group.ml-auto(size="sm"): lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="登記案件狀態修正說明"
      )
    lah-help-modal(ref="help", modal-title="登記案件狀態修正說明")
      ul
        li: .d-flex.align-items-center
          div
            div 本項功能僅調整部分 CRSMS 資料表格欄位(如下)，請謹慎使用。
            ul
              li RM30 - 案件辦理情形
              li RM31 - 結案狀態
              li RM39 - 登記處理註記
              li RM42 - 地價處理註記
              li 自行輸入欄位
        li: .d-flex.align-items-center
          div 使用方式請依各項目欄位選擇後更新修正。

  h5.center(v-if="!dataReady"): lah-fa-icon(icon="triangle-exclamation", variant="warning") 請先搜尋案件！
  div(v-else)
    h6.center(v-if="!wip"): lah-fa-icon(icon="circle-exclamation", variant="danger") 案件已結案，修改前請確認是否需要變更！
    .form-row
      b-input-group.col(size="sm")
        b-input-group-prepend(is-text) 辦理情形
        b-select.h-100(v-model="crsmsData['RM30']" :options="rm30_map")
          template(v-slot:first): b-select-option(:value="null" disabled) -- 請選擇狀態 --
      b-input-group.col-3(v-if="wip && rm30 !== rm30_orig" size="sm")
        b-checkbox.my-auto(v-model="sync_rm30_1" name="reg_case_RM30_1_checkbox" switch)
          small 同步作業人員
      .filter-btn-group.col-auto(v-if="rm30 !== rm30_orig")
        lah-button(icon="edit" @click="updateRM30" size="sm" variant="outline-primary") 更新
    .form-row.my-1
      b-input-group.col(size="sm")
        b-input-group-prepend(is-text) 結案狀態
        b-select.h-100(v-model="crsmsData['RM31']" :options="rm31_map")
          template(v-slot:first): b-select-option(value) -- 無狀態 --
      .filter-btn-group.col-auto(v-if="rm31 !== rm31_orig")
        lah-button(icon="edit" @click="updateRM31" size="sm" variant="outline-primary") 更新
    .form-row
      b-input-group.col(size="sm")
        b-input-group-prepend(is-text) 登記註記
        b-select.h-100(v-model="crsmsData['RM39']" :options="rm39_map")
          template(v-slot:first): b-select-option(value) -- 無狀態 --
      .filter-btn-group.col-auto(v-if="rm39 !== rm39_orig")
        lah-button(icon="edit" @click="updateRM39" size="sm" variant="outline-primary") 更新
    .form-row.my-1
      b-input-group.col(size="sm")
        b-input-group-prepend(is-text) 地價註記
        b-select.h-100(v-model="crsmsData['RM42']" :options="rm42_map")
          template(v-slot:first): b-select-option(value) -- 無狀態 --
      .filter-btn-group.col-auto(v-if="rm42 !== rm42_orig")
        lah-button(icon="edit" @click="updateRM42" size="sm" variant="outline-primary") 更新
    hr
    .form-row
      b-input-group.col(size="sm")
        b-input-group-prepend(is-text) 其他欄位
        b-input.h-100(v-model="rmXX", @input="restoreRMXXValue")
      b-input-group.col.text-nowrap(size="sm")
        b-input-group-prepend(is-text) 修改內容
        b-form-input.h-100(v-model="rmXXValue")
      .filter-btn-group.col-auto(v-if="validRMXX")
        lah-button(icon="edit" @click="updateRMXX(upperCaseRmXX, rmXXValue)" size="sm" variant="outline-primary") 更新
    .form-row.mt-1.ml-1(v-if="validRMXX")
      lah-fa-icon(icon="eye", variant="success") 即將修正「{{ upperCaseRmXX }}」為「{{ rmXXValue }}」。
    .form-row.mt-1.ml-1(v-else-if="!$utils.empty(rmXX)")
      lah-fa-icon(icon="triangle-exclamation", variant="warning") {{ upperCaseRmXX }}不存在！
</template>

<script>
import lahRegCaseDetailVue from './lah-reg-case-detail.vue'
export default {
  components: { lahRegCaseDetailVue },
  data: () => ({
    // inputCaseId: ''
    rm30_orig: '',
    rm31_orig: '',
    rm39_orig: '',
    rm42_orig: '',
    sync_rm30_1: true,
    rm30_map: [{
      value: 'A',
      text: 'A: 初審'
    },
    {
      value: 'B',
      text: 'B: 複審'
    },
    {
      value: 'H',
      text: 'H: 公告'
    },
    {
      value: 'I',
      text: 'I: 補正'
    },
    {
      value: 'R',
      text: 'R: 登錄'
    },
    {
      value: 'C',
      text: 'C: 校對'
    },
    {
      value: 'U',
      text: 'U: 異動完成'
    },
    {
      value: 'F',
      text: 'F: 結案'
    },
    {
      value: 'X',
      text: 'X: 補正初核'
    },
    {
      value: 'Y',
      text: 'Y: 駁回初核'
    },
    {
      value: 'J',
      text: 'J: 撤回初核'
    },
    {
      value: 'K',
      text: 'K: 撤回'
    },
    {
      value: 'Z',
      text: 'Z: 歸檔'
    },
    {
      value: 'N',
      text: 'N: 駁回'
    },
    {
      value: 'L',
      text: 'L: 公告初核'
    },
    {
      value: 'E',
      text: 'E: 請示'
    },
    {
      value: 'D',
      text: 'D: 展期'
    }
    ],
    rm31_map: [{
      value: 'A',
      text: 'A: 結案'
    },
    {
      value: 'B',
      text: 'B: 撤回'
    },
    {
      value: 'C',
      text: 'C: 併案'
    },
    {
      value: 'D',
      text: 'D: 駁回'
    },
    {
      value: 'E',
      text: 'E: 請示'
    }
    ],
    rm39_map: [{
      value: 'B',
      text: 'B: 登錄開始'
    },
    {
      value: 'R',
      text: 'R: 登錄完成'
    },
    {
      value: 'C',
      text: 'C: 校對結束'
    },
    {
      value: 'E',
      text: 'D: 校對有誤'
    },
    {
      value: 'S',
      text: 'S: 異動開始'
    },
    {
      value: 'F',
      text: 'F: 異動完成'
    },
    {
      value: 'G',
      text: 'G: 異動有誤'
    },
    {
      value: 'P',
      text: 'P: 競合暫停'
    }
    ],
    rm42_map: [{
      value: '0',
      text: '0: 登記移案'
    },
    {
      value: 'B',
      text: 'B: 登錄中'
    },
    {
      value: 'R',
      text: 'R: 登錄完成'
    },
    {
      value: 'C',
      text: 'C: 校對中'
    },
    {
      value: 'D',
      text: 'D: 校對完成'
    },
    {
      value: 'E',
      text: 'E: 登錄有誤'
    },
    {
      value: 'S',
      text: 'S: 異動開始'
    },
    {
      value: 'F',
      text: 'F: 異動完成'
    },
    {
      value: 'G',
      text: 'G: 異動有誤'
    }
    ],
    fields: [{
      key: '收件字號',
      sortable: true
    },
    {
      key: '登記原因',
      sortable: true
    },
    {
      key: '辦理情形',
      sortable: true
    },
    {
      key: '作業人員',
      sortable: true
    },
    {
      key: '登記處理註記',
      label: '登記註記',
      sortable: true
    },
    {
      key: '地價處理註記',
      label: '地價註記',
      sortable: true
    },
    {
      key: '預定結案日期',
      label: '期限',
      sortable: true
    }
    ],
    rmXX: '',
    rmXXValue: ''
  }),
  computed: {
    caseId () {
      if (this.dataReady) {
        return this.crsmsData?.ID
      }
      return ''
    },
    dataReady () {
      return !this.$utils.empty(this.crsmsData)
    },
    crsmsData () {
      return this.$store.getters['inf/crsmsData']
    },
    showProgress () {
      return this.progress !== false
    },
    attachEvent () {
      return this.showProgress
    },
    wip () {
      return this.$utils.empty(this.rm31_orig)
    },
    rm30 () {
      return this.crsmsData?.RM30 || ''
    },
    rm31 () {
      return this.crsmsData?.RM31 || ''
    },
    rm39 () {
      return this.crsmsData?.RM39 || ''
    },
    rm42 () {
      return this.crsmsData?.RM42 || ''
    },
    year () {
      return this.crsmsData?.RM01 || ''
    },
    code () {
      return this.crsmsData?.RM02 || ''
    },
    number () {
      return this.crsmsData?.RM03 || ''
    },
    upperCaseRmXX () {
      return `RM${this.rmXX}`.toUpperCase().replace('RMRM', 'RM')
    },
    validRMXX () {
      return this.upperCaseRmXX in this.crsmsData
    }
  },
  watch: {
    crsmsData (dontcare) {
      this.rm30_orig = this.crsmsData?.RM30 || ''
      this.rm31_orig = this.crsmsData?.RM31 || ''
      this.rm39_orig = this.crsmsData?.RM39 || ''
      this.rm42_orig = this.crsmsData?.RM42 || ''
      this.rmXX = ''
    }
  },
  created () {},
  mounted () {},
  methods: {
    detail () {
      this.modal(this.$createElement(lahRegCaseDetailVue, {
        props: {
          caseId: this.caseId,
          parentData: this.crsmsData
        }
      }), {
        title: `登記案件詳情 ${this.$utils.caseId(this.caseId)}`,
        size: 'xl'
      })
    },
    updateCRSMSCol (config) {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_upd_col',
        rm01: config.rm01,
        rm02: config.rm02,
        rm03: config.rm03,
        col: config.col,
        val: config.val
      }).then(({ data }) => {
        console.assert(data.status === this.$consts.XHR_STATUS_CODE.SUCCESS_NORMAL, `更新案件「${config.col}」欄位回傳狀態碼有問題【${data.status}】`)
        if (this.$utils.statusCheck(data.status)) {
          this.success(`「${config.col}」更新完成`, {
            title: '更新案件欄位'
          })
        } else {
          this.warning(`「${config.col}」更新失敗【${data.status}】`, {
            title: '更新案件欄位'
          })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    updateRM30 (e) {
      this.updateRMXX(
        'RM30',
        this.rm30,
        `確定要更新辦理情形為「${this.rm30}」?`,
        () => {
          this.rm30_orig = this.rm30
          if (this.sync_rm30_1) {
            /**
             * RM45 - 初審 A
             * RM47 - 複審 B
             * RM55 - 登錄 R
             * RM57 - 校對 C
             * RM59 - 結案 F
             * RM82 - 請示 E
             * RM88 - 展期 D
             * RM93 - 撤回 K
             * RM91_4 - 歸檔 Z
             */
            let RM30_1 = ''
            switch (this.rm30) {
              case 'A':
                RM30_1 = this.crsmsData?.RM45
                break
              case 'B':
                RM30_1 = this.crsmsData?.RM47
                break
              case 'R':
                RM30_1 = this.crsmsData?.RM55
                break
              case 'C':
                RM30_1 = this.crsmsData?.RM57
                break
              case 'F':
                RM30_1 = this.crsmsData?.RM59
                break
              case 'E':
                RM30_1 = this.crsmsData?.RM82
                break
              case 'D':
                RM30_1 = this.crsmsData?.RM88
                break
              case 'K':
                RM30_1 = this.crsmsData?.RM93
                break
              case 'Z':
                RM30_1 = this.crsmsData?.RM91_4
                break
              default:
                RM30_1 = 'XXXXXXXX'
                break
            }
            // update RM30_1
            this.updateCRSMSCol({
              rm01: this.year,
              rm02: this.code,
              rm03: this.number,
              col: 'RM30_1',
              val: this.$utils.empty(RM30_1) ? 'XXXXXXXX' : RM30_1
            })
          }
        }
      )
    },
    updateRM31 (e) {
      this.updateRMXX(
        'RM31',
        this.rm31,
        `您確定要更新結案狀態為「${this.rm31}」?`,
        () => { this.rm31_orig = this.rm31 }
      )
    },
    updateRM39 (e) {
      this.updateRMXX(
        'RM39',
        this.rm39,
        `您確定要更新登記處理註記為「${this.rm39}」`,
        () => { this.rm39_orig = this.rm39 }
      )
    },
    updateRM42 (e) {
      this.updateRMXX(
        'RM42',
        this.rm42,
        `您確定要更新地價處理註記為「${this.rm42}」?`,
        () => { this.rm42_orig = this.rm42 }
      )
    },
    updateRMXX (col, val, msg, callback) {
      msg = msg || `您確定要更新 ${col} 為「${val}」?`
      this.confirm(
        msg,
        { title: '請確認更新欄位狀態' }
      ).then((YN) => {
        if (YN) {
          this.updateCRSMSCol({
            rm01: this.year,
            rm02: this.code,
            rm03: this.number,
            col,
            val
          })
          this.crsmsData[col] = val
          callback && callback()
        }
      })
    },
    restoreRMXXValue () {
      if (this.validRMXX) {
        this.rmXXValue = this.crsmsData[this.upperCaseRmXX]
      } else {
        this.rmXXValue = ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
