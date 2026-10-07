<template lang="pug">
div
  //- 既有 PDF 提示 (編輯模式)
  b-alert.p-2.mb-2(
    v-if="editMode && origData && origData.number"
    show
    variant="light"
    class="border border-info shadow-sm"
  )
    .d-flex.align-items-center.justify-content-between
      .d-flex.align-items-center
        lah-fa-icon(icon="file-pdf" size="2x" variant="danger")
        .ml-2
          div
            strong 既有預約掃描檔
            b-badge.ml-2(variant="info") 案號：{{ origData.number }}.pdf
          .small.text-muted 若需替換，請於下方「掃描檔」選取新 PDF 檔；若不變更請留空。
      lah-button(
        :href="origPdfUrl"
        target="_blank"
        icon="arrow-up-right-from-square"
        size="sm"
        variant="outline-primary"
        title="於新視窗預覽目前 PDF"
      ) 開啟預覽

  b-input-group.text-nowrap(
    prepend="收件字號",
    :size="size"
  )
    b-input(
      ref="num",
      v-model="number",
      title="10碼收件字號",
      :state="validNumber",
      @input="emitInput",
      @keyup.enter="$emit('enter', $event)",
      placeholder="例：1130009096",
      :readonly="editMode || isNumberLocked"
    )
    b-input-group-append(v-if="!editMode")
      b-button(
        :variant="isNumberLocked ? 'outline-secondary' : 'warning'",
        :title="isNumberLocked ? '案號預設為自動編號，點擊可解鎖手動輸入' : '案號已解鎖，可自訂輸入'",
        size="sm",
        @click="toggleNumberLock"
      )
        lah-fa-icon(:icon="isNumberLocked ? 'lock' : 'lock-open'")
        span.ml-1 {{ isNumberLocked ? '自動' : '手動' }}

  .d-flex.w-100.my-1
    b-input-group.text-nowrap(
      prepend="收件日期",
      :size="size",
      title="7碼民國日期 (YYYMMDD)"
    )
      b-input.h-100(
        ref="createdate",
        v-model="createdate",
        :state="validCreatedate",
        :readonly="editMode",
        placeholder="例：1130520"
      )
      b-input-group-append(v-if="!editMode")
        b-button(
          variant="outline-secondary",
          size="sm",
          title="設為今日",
          @click="setToday"
        ) 今日
        client-only
          b-datepicker(
            v-model="createDateObj",
            value-as-date,
            button-only,
            button-variant="outline-primary",
            size="sm",
            title="點擊月曆選取收件日期",
            boundary="viewport",
            @input="syncCreateDateFromPicker"
          )

    b-input-group.text-nowrap.ml-1(
      prepend="截止日期",
      :size="size",
      title="7碼民國日期 (預設收件後1年)"
    )
      b-input(
        ref="enddate",
        v-model="enddate",
        :state="validEnddate",
        placeholder="例：1140520"
      )
      b-input-group-append
        client-only
          b-datepicker(
            v-model="endDateObj",
            value-as-date,
            button-only,
            button-variant="outline-primary",
            size="sm",
            title="點擊月曆選取截止日期",
            boundary="viewport",
            @input="syncEndDateFromPicker"
          )

  .d-flex.w-100
    b-input-group(
      :size="size",
      prepend="統編"
    )
      b-input.h-100(
        v-model="pId",
        :state="validPId",
        placeholder="身分證號或統一編號"
      )
    b-input-group.ml-1(
      :size="size",
      prepend="姓名"
    )
      b-input.h-100(
        v-model="pName",
        :state="validPName",
        placeholder="申請人姓名"
      )

  b-input-group.my-1(
    prepend="備註",
    :size="size"
  )
    b-textarea(
      v-model="note",
      placeholder="... 請輸入申請相關備註、案由或調閱標的描述 ...",
      rows="4",
      :state="validNote"
    )

  hr.my-2
  b-input-group.text-nowrap(
    prepend="掃描檔",
    :size="size"
  )
    b-file(
      v-model="uploadFile",
      accept="application/pdf",
      browse-text="瀏覽",
      :placeholder="uploadFilePlaceholderText",
      :state="uploadFileState",
      :size="size",
      drop-placeholder="拖曳 PDF 檔案至此..."
    )
    template(slot="file-name" slot-scope="{ names }")
      b-badge(variant="dark") {{ names[0] }}
      b-badge(v-if="names.length > 1" variant="dark" class="ml-1") + {{ names.length - 1 }} 個檔案

  .small.text-muted.mt-1
    span.text-danger *
    span 僅支援 PDF 格式文件。{{ editMode ? '（編輯時若不更換檔案請留空）' : '（新建時為必填項目）' }}

  hr.my-2
  .d-flex.justify-content-center
    b-button-group
      lah-button.mr-1(
        :icon="editMode ? 'circle-check' : 'arrow-up-from-bracket'",
        :action="editMode ? 'breath' : 'move-fade-btt'",
        :variant="ready ? 'primary' : 'outline-primary'"
        :disabled="isBusy || !ready",
        @click="ok"
      ) 確認
      lah-button(
        variant="outline-secondary",
        @click="cancel",
        :disabled="isBusy"
      ) 取消
</template>

<script>
export default {
  emit: ['close', 'input', 'add', 'edit'],
  props: {
    size: { type: String, default: '' },
    origData: { type: Object, default: () => ({}) },
    latestId: { type: String, default: '' }
  },
  fetchOnServer: false, // component don't fetch on server side to prevent weird undefined error
  data: () => ({
    createdate: '',
    createDateObj: null,
    number: '',
    isNumberLocked: true,
    pId: '',
    pName: '',
    note: '',
    enddate: '',
    endDateObj: null,
    uploadFile: null,
    dbLatestNumber: ''
  }),
  computed: {
    ready () {
      if (this.editMode) {
        return this.validNumber &&
               this.validPId &&
               this.validPName
      }
      return this.validNumber &&
             this.validPId &&
             this.validPName &&
             this.validUploadFile &&
             this.validCreatedate &&
             this.validEnddate
    },
    createtime () {
      if (this.editMode) {
        return this.origData?.createtime
      }
      const ad = this.$utils.twToAdDateObj(this.createdate)
      if (ad) {
        return ad.getTime() / 1000
      }
      return 0
    },
    endtime () {
      const ad = this.$utils.twToAdDateObj(this.enddate)
      if (ad) {
        return ad.getTime() / 1000
      }
      return 0
    },
    editId () {
      return this.origData?.id
    },
    editMode () {
      return this.editId !== undefined
    },
    origPdfUrl () {
      if (this.origData?.number) {
        return `http://${this.apiHost}:${this.apiPort}/get_adm_reserve_pdf.php?number=${this.origData.number}`
      }
      return ''
    },
    uploadFileState () {
      if (this.editMode) {
        return null
      }
      return this.validUploadFile
    },
    uploadFilePlaceholderText () {
      if (this.editMode) {
        return '... 可選擇新 PDF 進行置換更新 (非必要) ...'
      }
      return '... 請選擇預約申請之掃描 PDF 檔案 ...'
    },
    validNumber () {
      if (!this.number || this.number.length !== 10) {
        return false
      }
      if (this.editMode) {
        return true
      }
      const number = parseInt(this.number)
      return !isNaN(number) && number > 0
    },
    validPId () {
      return this.$utils.twIDCheck(this.pId)
    },
    validPName () {
      return this.$utils.length(this.pName) >= 2
    },
    validNote () {
      return null
    },
    validUploadFile () {
      return !this.$utils.empty(this.uploadFile) && this.uploadFile?.type === 'application/pdf'
    },
    validCreatedate () {
      if (this.createdate) {
        const tmp = this.createdate.replaceAll(/[:\-\s]/ig, '')
        return tmp.length === 7
      }
      return false
    },
    validEnddate () {
      if (this.enddate) {
        const ed = this.enddate.replaceAll(/[:\-\s]/ig, '')
        if (ed.length === 7 && this.validCreatedate) {
          const cd = this.createdate.replaceAll(/[:\-\s]/ig, '')
          return parseInt(ed) >= parseInt(cd)
        }
      }
      return false
    }
  },
  watch: {
    origData (val) {
      this.restoreOrigData()
    },
    createdate (val) {
      if (this.validCreatedate) {
        const ad = this.$utils.twToAdDateObj(val)
        if (ad) {
          this.createDateObj = ad
          // auto setting enddate a year later if not in edit mode or enddate empty
          if (!this.editMode || this.$utils.empty(this.enddate)) {
            const endAd = new Date(ad.getTime())
            endAd.setFullYear(endAd.getFullYear() + 1)
            this.endDateObj = endAd
            this.enddate = this.$utils.twDateStr(endAd).replaceAll(/[:\-\s]/ig, '')
          }
        }
      } else if (!this.editMode) {
        this.enddate = ''
        this.endDateObj = null
      }
    },
    enddate (val) {
      if (val && val.replaceAll(/[:\-\s]/ig, '').length === 7) {
        const ad = this.$utils.twToAdDateObj(val)
        if (ad) {
          this.endDateObj = ad
        }
      }
    },
    dbLatestNumber (val) {
      if (!this.editMode && this.isNumberLocked) {
        const int = parseInt(val)
        const now = new Date()
        const year = now.getFullYear() - 1911
        this.number = int > 0 ? `${int + 1}` : `${year}0000001`
      }
    }
  },
  created () {
    this.restoreOrigData()
    this.emitInput = this.$utils.debounce(() => {
      this.$emit('input', {
        number: this.number,
        pid: this.pId,
        pname: this.pName,
        note: this.note,
        file: this.uploadFile,
        createtime: this.createtime,
        endtime: this.endtime
      })
    }, 400)

    // get current latest case number from DB
    this.$axios.post(this.$consts.API.JSON.ADM, {
      type: 'get_reserve_pdf_latest_number'
    }).then(({ data }) => {
      if (this.$utils.statusCheck(data.status)) {
        this.dbLatestNumber = data.number
      } else {
        this.warning(data.message)
      }
    }).catch((e) => {
      this.$utils.error(e)
    })
  },
  mounted () {
    if (!this.editMode) {
      this.setToday()
    }
  },
  methods: {
    toggleNumberLock () {
      this.isNumberLocked = !this.isNumberLocked
      if (!this.isNumberLocked) {
        this.$nextTick(() => {
          this.$refs.num?.$el?.focus?.()
        })
      } else if (this.dbLatestNumber) {
        // re-sync with latest number
        const int = parseInt(this.dbLatestNumber)
        const now = new Date()
        const year = now.getFullYear() - 1911
        this.number = int > 0 ? `${int + 1}` : `${year}0000001`
      }
    },
    setToday () {
      const today = new Date()
      this.createDateObj = today
      this.createdate = this.$utils.twDateStr(today).replaceAll(/[:\-\s]/ig, '')
    },
    syncCreateDateFromPicker (date) {
      if (date instanceof Date && !isNaN(date)) {
        this.createdate = this.$utils.twDateStr(date).replaceAll(/[:\-\s]/ig, '')
      }
    },
    syncEndDateFromPicker (date) {
      if (date instanceof Date && !isNaN(date)) {
        this.enddate = this.$utils.twDateStr(date).replaceAll(/[:\-\s]/ig, '')
      }
    },
    msToTWDate (ms) {
      const int = parseInt(ms)
      if (int > 0) {
        return this.$utils.twDateStr(new Date(int * 1000))
      }
      return ''
    },
    restoreOrigData () {
      if (!this.$utils.empty(this.origData)) {
        this.createdate = this.msToTWDate(this.origData.createtime).replaceAll(/[:\-\s]/ig, '')
        this.enddate = this.msToTWDate(this.origData.endtime).replaceAll(/[:\-\s]/ig, '')
        if (this.origData.createtime) {
          this.createDateObj = new Date(parseInt(this.origData.createtime) * 1000)
        }
        if (this.origData.endtime) {
          this.endDateObj = new Date(parseInt(this.origData.endtime) * 1000)
        }
        this.number = this.origData.number
        this.pId = this.origData.pid
        this.pName = this.origData.pname
        this.note = this.origData.note
      }
    },
    emitInput () { /** placeholder */ },
    ok () {
      if (this.editMode) {
        this.confirm('請確認要編輯預約資料？').then((YN) => {
          if (YN) {
            this.edit()
          }
        })
      } else {
        this.confirm('請確認要新增預約資料？').then((YN) => {
          if (YN) {
            this.add()
          }
        })
      }
    },
    cancel () {
      this.$emit('close')
    },
    add () {
      if (this.uploadFile?.type === 'application/pdf') {
        this.isBusy = true
        const formData = new FormData()
        formData.append('type', 'add_reserve_pdf')

        formData.append('number', this.number)
        formData.append('pid', this.pId)
        formData.append('pname', this.pName)
        formData.append('note', this.note)
        formData.append('createtime', this.createtime)
        formData.append('endtime', this.endtime)
        formData.append('file', this.uploadFile)

        this.$upload.post(this.$consts.API.JSON.ADM, formData).then(({ data }) => {
          const title = this.$utils.empty(data.payload) ? '新增預約資料結果' : `${data.payload.number}-${data.payload.pid}`
          const message = `${data.payload.pname} - ${data.message}`
          this.timeout(() => this.notify(message, { title, type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' }), 400)
          if (this.$utils.statusCheck(data.status)) {
            this.$emit('add', {
              id: data.payload.id,
              number: data.payload.number,
              pid: data.payload.pid,
              pname: data.payload.pname,
              note: data.payload.note,
              createtime: data.payload.createtime,
              endtime: data.payload.endtime
            })
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
          this.$emit('close')
        })
      } else {
        this.warning('選擇的檔案不是 PDF 格式')
      }
    },
    edit () {
      this.isBusy = true
      const formData = new FormData()
      formData.append('type', 'edit_reserve_pdf')
      formData.append('id', this.editId)
      formData.append('number', this.number)
      formData.append('pid', this.pId)
      formData.append('pname', this.pName)
      formData.append('note', this.note)
      formData.append('createtime', this.createtime)
      formData.append('endtime', this.endtime)
      if (this.uploadFile?.type === 'application/pdf') {
        formData.append('file', this.uploadFile)
      }
      this.$upload.post(this.$consts.API.JSON.ADM, formData).then(({ data }) => {
        const title = this.$utils.empty(data.payload) ? '編輯預約資料結果' : `${data.payload.number}-${data.payload.pid}`
        const message = `${data.payload?.pname} - ${data.message}`
        this.timeout(() => this.notify(message, { title, type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' }), 400)
        if (this.$utils.statusCheck(data.status)) {
          this.$emit('edit', {
            id: this.editId,
            number: this.number,
            pid: this.pId,
            pname: this.pName,
            note: this.note,
            createtime: this.createtime,
            endtime: this.endtime
          })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        this.$emit('close')
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
