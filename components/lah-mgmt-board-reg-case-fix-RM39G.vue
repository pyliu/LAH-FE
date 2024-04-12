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
    lah-help-modal(ref="help", modal-title="登記案件修正異動有誤說明")
      h5 ✨ 基本說明
      ul.h5
        li: .d-flex.align-items-center
          div 本項功能協助修正案件「校對有誤」至「異動完成」狀態。
        li: .d-flex.align-items-center
          div 如欲修正請先點選備份按鈕後，才能進行更新。
      h5 ✨ 修正後將會更動 {{ $utils.caseId(caseId) }} 下列的表格中的案件資料
      ul.h5
        li "MOICAS.CRSMS" 登記案管－登記收件資料
        li "MOICAT.RINDX" 登記暫存－案件索引表

  lah-transition
    h5.center(v-if="!dataReady"): lah-fa-icon(icon="triangle-exclamation", variant="warning") 請先搜尋案件！
    div(v-else)
      b-select.h-100(v-model="crsmsData['RM39']" :options="rm39Opts")
        template(v-slot:first): b-select-option(value) -- 無狀態 --
</template>

<script>
import lahRegCaseDetailVue from './lah-reg-case-detail.vue';
export default {
  components: { lahRegCaseDetailVue },
  props: {
    embed: { type: Boolean, default: false }
  },
  data: () => ({
    filtered: null,
    cleanAllBackupFlag: false,
    backupFlags: [],
    rm39Opts: [
      { value: 'B', text: 'B: 登錄開始' },
      { value: 'R', text: 'R: 登錄完成' },
      { value: 'C', text: 'C: 校對結束' },
      { value: 'E', text: 'D: 校對有誤' },
      { value: 'S', text: 'S: 異動開始' },
      { value: 'F', text: 'F: 異動完成' },
      { value: 'G', text: 'G: 異動有誤' },
      { value: 'P', text: 'P: 競合暫停' }
    ]
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
    this.query()
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
        this.alert(`請先備份 ${table} ！`, {
          title: `清除 ${table} 暫存檔`,
          subtitle: `${this.year}-${this.code}-${this.number}`
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
            this.$axios.post(this.$consts.API.JSON.QUERY, {
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
