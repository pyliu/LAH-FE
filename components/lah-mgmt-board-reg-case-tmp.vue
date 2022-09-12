<template lang="pug">
b-card
  template(#header)
    .d-flex
      h6.mb-0.mr-auto #[lah-fa-icon(icon="3", size="lg")] 登記案件暫存檔  #[a.text-primary.font-weight-bold(href="#", @click="detail", title="顯示案件詳情") {{ $utils.caseId(caseId) }}]
      b-button-group(size="sm")
        lah-button(
          icon="question",
          action="breath",
          variant="outline-success",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="登記案件狀態修正說明"
        )
    lah-help-modal(ref="help", modal-title="登記案件暫存檔說明")
      ul.h5
        li: .d-flex.align-items-center
          div 本項功能協助顯示案件暫存檔狀態。
        li: .d-flex.align-items-center
          div 如欲清除暫存檔請先點選備份按鈕後，再進行刪除。
      h6 👉 檢查下列的表格
      ul
        li "MOICAT.RALID" => "A"   // 土地標示部
        li "MOICAT.RBLOW" => "B"   // 土地所有權部
        li "MOICAT.RCLOR" => "C"   // 他項權利部
        li "MOICAT.RDBID" => "D"   // 建物標示部
        li "MOICAT.REBOW" => "E"   // 建物所有權部
        li "MOICAT.RLNID" => "L"   // 人檔
        li "MOICAT.RRLSQ" => "R"   // 權利標的
        li "MOICAT.RGALL" => "G"   // 其他登記事項
        li "MOICAT.RMNGR" => "M"   // 管理者
        li "MOICAT.RTOGH" => "T"   // 他項權利檔
        li "MOICAT.RHD10" => "H"   // 基地坐落／地上建物
        li.text-danger "MOICAT.RINDX" => "II"  // 案件異動索引【不會清除】
        li "MOICAT.RINXD" => "ID"
        li "MOICAT.RINXR" => "IR"
        li "MOICAT.RINXR_EN" => "IRE"
        li "MOICAT.RJD14" => "J"
        li "MOICAT.ROD31" => "O"
        li "MOICAT.RPARK" => "P"
        li "MOICAT.RPRCE" => "PB"
        li "MOICAT.RSCNR" => "SR"
        li "MOICAT.RSCNR_EN" => "SRE"
        li "MOICAT.RVBLOW" => "VB"
        li "MOICAT.RVCLOR" => "VC"
        li "MOICAT.RVGALL" => "VG"
        li "MOICAT.RVMNGR" => "VM"
        li "MOICAT.RVPON" => "VP"  // 重測/重劃暫存
        li "MOICAT.RVRLSQ" => "VR"
        li "MOICAT.RXIDD04" => "ID"
        li "MOICAT.RXLND" => "XL"
        li "MOICAT.RXPRI" => "XP"
        li "MOICAT.RXSEQ" => "XS"
        li "MOICAT.B2104" => "BR"
        li "MOICAT.B2118" => "BR"
        li "MOICAT.BGALL" => "G"
        li "MOICAT.BHD10" => "H"
        li "MOICAT.BJD14" => "J"
        li "MOICAT.BMNGR" => "M"
        li "MOICAT.BOD31" => "O"
        li "MOICAT.BPARK" => "P"
        li "MOICAT.BRA26" => "C"
        li "MOICAT.BRLSQ" => "R"
        li "MOICAT.BXPRI" => "XP"
        li "MOICAT.DGALL" => "G"
        //- 地價
        li "MOIPRT.PPRCE" => "MA"
        li "MOIPRT.PGALL" => "GG"
        li "MOIPRT.PBLOW" => "LA"
        li "MOIPRT.PALID" => "KA"
        li "MOIPRT.PNLPO" => "NA"
        li "MOIPRT.PBLNV" => "BA"
        li "MOIPRT.PCLPR" => "CA"
        li "MOIPRT.PFOLP" => "FA"
        li "MOIPRT.PGOBP" => "GA"
        li "MOIPRT.PAPRC" => "AA"
        li "MOIPRT.PEOPR" => "EA"
        li "MOIPRT.POA11" => "OA"
        li "MOIPRT.PGOBPN" => "GA"
        // <li>"MOIPRC.PKCLS" => "KK"</li>
        li "MOIPRT.PPRCE" => "MA"
        li "MOIPRT.P76SCRN" => "SS"
        li "MOIPRT.P21T01" => "TA"
        li "MOIPRT.P76ALID" => "AS"
        li "MOIPRT.P76BLOW" => "BS"
        li "MOIPRT.P76CRED" => "BS"
        li "MOIPRT.P76INDX" => "II"
        li "MOIPRT.P76PRCE" => "UP"
        li "MOIPRT.P76SCRN" => "SS"
        li "MOIPRT.PAE0301" => "MA"
        li "MOIPRT.PB010" => "TP"
        li "MOIPRT.PB014" => "TB"
        li "MOIPRT.PB015" => "TB"
        li "MOIPRT.PB016" => "TB"
        li.text-danger "MOIPRT.PHIND" => "II"  // 案件異動索引【不會清除】
        li "MOIPRT.PNLPO" => "NA"
        li "MOIPRT.POA11" => "OA"

  h5.center(v-if="!dataReady"): lah-fa-icon(icon="triangle-exclamation", variant="warning") 請先搜尋案件！
  div(v-else)
    div(v-if="found")
      div(v-for="(item, idx) in filtered")
        h6.font-weight-bold.text-center(v-if="idx == 0")
          lah-fa-icon(icon="triangle-exclamation", variant="warning") 請檢查下列暫存檔資訊，必要時請刪除。
        b-button(@click="showSQL(item)" size="sm" variant="warning")
          | {{ item[0] }}表格
          span.badge.badge-light.ml-1
            | {{ item[1].length }}
            span.sr-only 暫存檔數量
        small.ml-1
          b-button(:id="'backup_temp_btn_' + idx" size="sm" variant="outline-primary" @click="backup(item, idx, $event)") 備份
          b-button.ml-1(v-if="item[0] != 'MOICAT.RINDX' && item[0] != 'MOIPRT.PHIND'" :title="title(item)" size="sm" variant="outline-danger" @click="clean(item, idx, $event)") 清除
        .small.my-2 － {{ item[2] }}
      hr
      .text-center
        b-button#backup_temp_btn_all(@click="backupAll" variant="outline-primary" size="sm") 全部備份
        b-button.ml-1(@click="cleanAll" variant="danger" size="sm") 全部清除
    lah-fa-icon(v-if="notFound" icon="exclamation-circle" variant="success" size="lg") 無暫存檔。
    lah-fa-icon(v-if="loading" action="spin" icon="spinner" size="lg") 讀取中
</template>

<script>
import lahRegCaseDetailVue from './lah-reg-case-detail.vue'
export default {
  components: { lahRegCaseDetailVue },
  data: () => ({
    filtered: null,
    cleanAllBackupFlag: false,
    backupFlags: []
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
    year () {
      return this.crsmsData?.RM01 || ''
    },
    code () {
      return this.crsmsData?.RM02 || ''
    },
    number () {
      return this.crsmsData?.RM03 || ''
    },
    found () {
      return !this.$utils.empty(this.filtered)
    },
    notFound () {
      return Array.isArray(this.filtered) && this.$utils.empty(this.filtered)
    },
    loading () {
      return this.filtered === null
    },
    prefix () {
      return `${this.year}-${this.code}-${this.number}`
    }
  },
  watch: {
    crsmsData (dontcare) {
      this.filtered = null
      this.query()
    }
  },
  created () {
    this.busyIconSize = '1x'
    this.query = this.$utils.debounce(() => {
      if (
        !this.$utils.empty(this.year) &&
        !this.$utils.empty(this.code) &&
        !this.$utils.empty(this.number)
      ) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'query_temp_data',
          year: this.year,
          code: this.code,
          number: this.number
        }).then((res) => {
          console.assert(res.data.status === this.$consts.XHR_STATUS_CODE.SUCCESS_NORMAL, `查詢暫存資料回傳狀態碼有問題【${res.data.status}】`)

          this.filtered = []
          // res.data.raw structure: 0 - Table, 1 - all raw data, 2 - SQL
          this.filtered = res.data.raw?.filter((item, index, array) => {
            return item[1]?.length > 0
          })
          // initialize backup flag array for backup detection
          this.backupFlags = Array(this.filtered?.length).fill(false)
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      }
    }, 1000)
  },
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
    title (item) {
      return item[0] === 'MOICAT.RINDX' || item[0] === 'MOIPRT.PHIND' ? '重要案件索引，無法刪除！' : ''
    },
    download (content, filename) {
      const url = window.URL.createObjectURL(new Blob([content]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      // afterwards we remove the element again
      link.remove()
      // release object in memory
      window.URL.revokeObjectURL(url)
    },
    backupAll (e) {
      this.isBusy = true
      const filename = this.year + '-' + this.code + '-' + this.number + '-TEMP-DATA.sql'
      let allContent = ''
      this.filtered.forEach((item, idx) => {
        allContent += this.getInsSQL(item)
      })
      this.download(allContent, filename)
      this.cleanAllBackupFlag = true
      this.isBusy = false
    },
    cleanAll (e) {
      if (this.cleanAllBackupFlag !== true) {
        this.alert('請先備份！', {
          title: '清除全部暫存資料',
          subtitle: `${this.year}-${this.code}-${this.number}`
        })
        this.attention('#backup_temp_btn_all', { name: 'tada' })
      } else {
        const msg = "<h6><strong class='text-danger'>★警告★</strong>：無法復原請先備份!!</h6>清除案件 " + this.year + '-' + this.code + '-' + this.number + ' 全部暫存檔?'
        this.confirm(
          msg,
          { title: '警告，請先備份' }
        ).then((YN) => {
          if (YN) {
            this.isBusy = true
            this.$axios.post(this.$consts.API.JSON.QUERY, {
              type: 'clear_temp_data',
              year: this.year,
              code: this.code,
              number: this.number,
              table: ''
            }).then((res) => {
              console.assert(res.data.status === this.$consts.XHR_STATUS_CODE.SUCCESS_NORMAL, '清除暫存資料回傳狀態碼有問題【' + res.data.status + '】')
              this.success('已清除完成。<p>' + this.year + '-' + this.code + '-' + this.number + '</p>', {
                title: '清除暫存檔'
              })
              this.$(e.target).remove()
            }).catch((err) => {
              this.$utils.error(err)
            }).finally(() => {
              this.isBusy = false
            })
          }
        })
      }
    },
    backup (item, idx, e) {
      this.isBusy = true
      const filename = `${this.prefix}-${item[0]}-TEMP-DATA.sql`
      this.download(this.getInsSQL(item), filename)
      this.backupFlags[idx] = true
      this.$(e.target).attr('disabled', this.backupFlags[idx])
      this.isBusy = false
    },
    clean (item, idx, e) {
      const table = item[0]
      if (this.backupFlags[idx] !== true) {
        this.alert({
          title: `清除 ${table} 暫存檔`,
          subtitle: `${this.year}-${this.code}-${this.number}`,
          message: `請先備份 ${table} ！`
        })
        this.attention(`#backup_temp_btn_${idx}`, { name: 'tada' })
      } else {
        const msg = "<h6><strong class='text-danger'>★警告★</strong>：無法復原請先備份!!</h6>清除案件 " + this.year + '-' + this.code + '-' + this.number + ' ' + table + ' 暫存檔?'
        this.confirm(
          msg,
          { title: '警告，請先備份！' }
        ).then((YN) => {
          if (YN) {
            this.isBusy = true
            this.$http.post(this.$consts.API.JSON.QUERY, {
              type: 'clear_temp_data',
              year: this.year,
              code: this.code,
              number: this.number,
              table
            }).then((res) => {
              console.assert(res.data.status === this.$consts.XHR_STATUS_CODE.SUCCESS_NORMAL, '清除暫存資料回傳狀態碼有問題【' + res.data.status + '】')
              this.success('已清除完成。', {
                title: `清除 ${table} 暫存檔`,
                subtitle: this.year + '-' + this.code + '-' + this.number
              })
              this.$(e.target).remove()
            }).catch((err) => {
              this.$utils.error(err)
            }).finally(() => {
              this.isBusy = false
            })
          }
        })
      }
    },
    showSQL (item) {
      this.modal(this.getInsSQL(item).replace(/\n/g, '<br /><br />'), {
        title: `INSERT SQL of ${item[0]}`,
        html: true,
        size: 'xl'
      })
    },
    getInsSQL (item) {
      let INS_SQL = ''
      for (let y = 0; y < item[1]?.length; y++) {
        const thisRow = item[1][y]
        const fields = []
        const values = []
        for (const key in thisRow) {
          fields.push(key)
          values.push(this.$utils.empty(thisRow[key]) ? 'null' : `'${thisRow[key]}'`)
        }
        INS_SQL += `insert into ${item[0]} (${fields.join(',')})`
        INS_SQL += ` values (${values.join(',')});\n`
      }
      return INS_SQL
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
