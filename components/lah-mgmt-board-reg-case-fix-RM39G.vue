<template lang="pug">
b-card(
  border-variant="secondary",
  :no-body="embed",
  :class="embed ? ['border-0'] : []"
)
  template(
    #header,
    v-if="!embed"
  )
    .d-flex.align-items-center
      h6.mb-0.mt-1.mr-1
        lah-fa-icon(
          icon="hammer",
          size="lg",
          :action="dataReady ? 'breath' : ''"
        ) 登記案件異動有誤修正
      a.text-primary.font-weight-bold(
        href="#",
        @click="detail",
        title="顯示案件詳情"
      ) {{ $utils.caseId(ID) }}
      b-button-group.ml-auto(size="sm"): lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="登記案件狀態修正說明"
      )
    lah-help-modal(ref="help", modal-title="登記案件修正異動有誤說明")
      h5 基本說明
      ul.h5
        li: .d-flex.align-items-center
          div 本項功能協助修正案件「異動有誤」至「異動完成」狀態。
        li: .d-flex.align-items-center
          div ⭐修正前請#[strong.text-danger 先請審查確認資料都有寫進正式檔]後再進行正
      h5 將更動 {{ $utils.caseId(ID) }} 下列的表格中的案件資料
      ul.h5
        li
          div "MOICAS.CRSMS" 登記案管－登記收件資料
          ul
            li 清空RM38
            li RM39設為異動完成
        li
          div "MOICAT.RINDX" 登記暫存－案件索引表
          ul: li 該案件IP_CODE皆設定為異動完成

  lah-transition
    h5.center(v-if="!dataReady"): lah-fa-icon(icon="triangle-exclamation", variant="warning") 查無 {{ $utils.caseId(ID) }} 案件資料！
    div(v-else-if="detectedError")
      .my-1(v-if="dataReady && !embed")
        b-row
          b-col 登記原因：{{ caseData['登記原因'] }}
          b-col 作業人員：{{ caseData['作業人員'] }}
        b-row
          b-col 辦理情形：{{ caseData['辦理情形'] }}
          b-col
            span 結案與否：
            b(:class="caseData['結案與否'] === 'Y' ? ['text-success'] : ['text-danger']") {{ caseData['結案狀態'] }} ({{ caseData['結案與否'] }})
        b-row
          b-col 收件日期：{{ caseData['收件日期'] }}
          b-col 結案日期：{{ caseData['結案日期'].split(' ')[0] }} {{ caseData['結案狀態'] }} ({{ caseData['結案與否'] }})
      .lah-flex.justify-content-end
        lah-button(icon="hammer", @click="fix") 立即修正
      lah-fa-icon(icon="circle-exclamation", variant="danger") RM38 異動訊息
      .pl-2.small {{ $utils.empty(caseData.RM38) ? '[無資料]' : caseData.RM38 }}

      //- b-input-group.my-1(prepend="登記處理註記", title="RM39")
      //-   b-select.h-100(v-model="caseData['RM39']" :options="rm39Opts")
      //-     template(v-slot:first): b-select-option(value) -- 無狀態 --

      .my-2: lah-fa-icon(icon="database", :variant="caseData.RM39 !== 'F' ? 'danger' : 'success'")
        |RM39 處理註記 👉 {{ getRM39text(caseData.RM39) }}

      div(v-if="rindxRecords.length > 0")
        lah-fa-icon.font-weight-bold.h6(icon="list-ol") 異動索引暫存檔
        b-list-group(flush)
          .b-list-group-item(
            v-for="(record, idx) in rindxRecords",
            :key="`rindx_record_${idx}`"
            v-b-popover.hover.top="`副鍵：${record.II_DATA}`",
            :title="`主鍵：${record.IIKEY}`"
          ): .lah-flex
            .small \#{{ record.IISEQ }}
            .small {{ getIPTypetext(record.IP_TYPE) }}
            .small {{ getII00text(record.II00) }}
            .small(:class="getIPCodeCss(record.IP_CODE)") {{ getIPCodetext(record.IP_CODE) }}
    h5.center(v-else)
      lah-fa-icon(icon="square-check", variant="success", regular) 未偵測到案件錯誤

</template>

<script>
import lahRegCaseDetailVue from './lah-reg-case-detail.vue'
export default {
  emit: ['update'],
  components: { lahRegCaseDetailVue },
  props: {
    embed: { type: Boolean, default: false },
    caseId: { type: String, default: '' }
  },
  data: () => ({
    caseData: null,
    rindxRecords: [],
    rm39Opts: [
      { value: 'B', text: 'B: 登錄開始' },
      { value: 'R', text: 'R: 登錄完成' },
      { value: 'C', text: 'C: 校對結束' },
      { value: 'E', text: 'E: 校對有誤' },
      { value: 'S', text: 'S: 異動開始' },
      { value: 'F', text: 'F: 異動完成' },
      { value: 'G', text: 'G: 異動有誤' },
      { value: 'P', text: 'P: 競合暫停' }
    ],
    ipcodeOpts: [
      { value: 'R', text: 'R: 登錄完成' },
      { value: 'C', text: 'C: 校對正確' },
      { value: 'E', text: 'E: 校對有誤' },
      { value: 'F', text: 'F: 異動完成' }
    ],
    iptypeOpts: [
      { value: 'A', text: 'A: 新增' },
      { value: 'M', text: 'M: 修改' },
      { value: 'D', text: 'D: 刪除' },
      { value: 'L', text: 'L: 相關異動' },
      { value: 'l', text: 'l: 相關異動' }
    ],
    ii00Opts: [
      { value: 'A', text: 'A: 土地標示部' },
      { value: 'B', text: 'B: 土地所有權部' },
      { value: 'C', text: 'C: 他項權利部' },
      { value: 'D', text: 'D: 建物標示部' },
      { value: 'E', text: 'E: 建物所有權部' },
      { value: 'M', text: 'M: 管理者' },
      { value: 'L', text: 'L: 人檔' },
      { value: 'R', text: 'R: 標的次序' },
      { value: 'r', text: 'r: 所有權之設定他項登記次序' },
      { value: 'h', text: 'h: 地上建物' },
      { value: 'H', text: 'H: 基地坐落' },
      { value: 'P', text: 'P: 前次移轉現值' },
      { value: 'J', text: 'J: 建物分層' },
      { value: 'j', text: 'j: 附屬建物' },
      { value: 'o', text: 'o: 共用部分' },
      { value: 'O', text: 'O: 主建物附表' },
      { value: 'T', text: 'T: 擔保檔' },
      { value: 'V', text: 'V: 重測重劃新舊地建號' },
      { value: 'K', text: 'K: 共同使用之停車位' },
      { value: 'k', text: 'k: 主建物之停車位' }
    ]
  }),
  computed: {
    ID () {
      if (this.dataReady) {
        return this.caseData?.ID
      }
      return this.caseId
    },
    sanitizedID () {
      return this.ID?.replace(/^[a-zA-Z0-9-]$/g, '')
    },
    dataReady () {
      return !this.$utils.empty(this.caseData)
    },
    detectedError () {
      return !this.$utils.empty(this.caseData.RM38)
    },
    moicatData () {
      return this.rindxData
    },
    year () {
      return this.caseData?.RM01 || ''
    },
    code () {
      return this.caseData?.RM02 || ''
    },
    number () {
      return this.caseData?.RM03 || ''
    },
    prefix () {
      return `${this.year}-${this.code}-${this.number}`
    }
  },
  watch: {
    caseData (val) {
      console.warn('caseData', val)
    },
    rindxRecords (val) {
      console.warn('rindxRecords', val)
    },
    sanitizedID (val) {
      console.warn('sanitized ID', val)
    }
  },
  created () {
    this.query()
  },
  mounted () {},
  methods: {
    query () {
      if (!this.$utils.empty(this.caseId)) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'reg_case',
          id: this.sanitizedID
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.caseData = { ...data.baked }
            // query moicat.rindx
            this.queryTmp()
          } else {
            console.warn('crsms data query failed', this.sanitizedID, data)
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      }
    },
    queryTmp () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.MOICAT, {
        type: 'moicat_rindx',
        year: this.year,
        code: this.code,
        num: this.number
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.rindxRecords = [...data.raw]
        } else {
          console.warn('rindx data query failed', data)
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    getRM39text (code) {
      const found = this.rm39Opts.find((opt) => {
        return opt.value === code
      })
      return found?.text || ''
    },
    getIPCodetext (code) {
      const found = this.ipcodeOpts.find((opt) => {
        return opt.value === code
      })
      return found?.text || ''
    },
    getIPTypetext (code) {
      const found = this.iptypeOpts.find((opt) => {
        return opt.value === code
      })
      return found?.text || ''
    },
    getII00text (code) {
      const found = this.ii00Opts.find((opt) => {
        return opt.value === code
      })
      return found?.text || ''
    },
    getIPCodeCss (code) {
      if (code === 'E') { return ['text-danger'] }
      if (code === 'F') { return ['text-success'] }
      return []
    },
    fix () {
      this.confirm(
        '確定要修正登記處理註記異常狀態？',
        { title: '請確認修正處理註記' }
      ).then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.MOICAS, {
            type: 'fix_rm38_rm39_problem',
            year: this.year,
            code: this.code,
            number: this.number
          }).then(({ data }) => {
            if (this.$utils.statusCheck(data.status)) {
              this.success(data.message)
              this.$utils.log(data.message)
              // fix moicat.rindx as well
              this.fixRINDX()
            } else {
              this.warning(data.message)
              this.$utils.warn(data.message)
            }
          }).catch((err) => {
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    fixRINDX () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.MOICAT, {
        type: 'fix_moicat_rindx',
        year: this.year,
        code: this.code,
        number: this.number
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.success(data.message)
          this.$utils.log(data.message)
          // moicat.rindx updated
          this.trigger('update', data)
        } else {
          this.warning(data.message)
          this.$utils.warn(data.message)
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    detail () {
      this.modal(this.$createElement(lahRegCaseDetailVue, {
        props: {
          caseId: this.ID
        }
      }), {
        title: `登記案件詳情 ${this.$utils.caseId(this.ID)}`,
        size: 'xl'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
