<template lang="pug">
div
  b-input-group.text-nowrap(
    prepend="收件字號",
    :size="size"
  )
    b-input(
      ref="num",
      v-model="number",
      title="最多10碼",
      :state="validNumber",
      @input="emitInput",
      @keyup.enter="$emit('enter', $event)",
      placeholder="... 1130009096 ....",
      readonly
    )
  .d-flex.w-100.my-1
    b-input-group.text-nowrap(
      prepend="收件日期",
      :size="size",
      title="7碼民國日期"
    )
      b-input.h-100(
        ref="createdate",
        v-model="createdate",
        :state="validCreatedate",
        :readonly="editMode"
      )
    b-input-group.text-nowrap.ml-1(
      prepend="截止日期",
      :size="size",
      title="7碼民國日期"
    )
      b-input(
        ref="enddate",
        v-model="enddate",
        :state="validEnddate"
      )
  .d-flex.w-100
    b-input-group(
      :size="size",
      prepend="　　統編"
    )
      b-input.h-100(
        v-model="pId",
        :state="validPId"
      )
    b-input-group.ml-1(
      :size="size",
      prepend="　　姓名"
    )
      b-input.h-100(
        v-model="pName",
        :state="validPName"
      )

  b-input-group.my-1(
    prepend="　　備註",
    :size="size"
  )
    b-textarea(
      v-model="note",
      placeholder="... 請輸入額外的描述 ...",
      rows="8",
      :state="validNote"
    )
  hr
  b-input-group.text-nowrap(
    prepend="　掃描檔",
    :size="size"
  )
    b-file(
      v-model="uploadFile",
      accept="application/pdf",
      browse-text="瀏覽",
      :placeholder="uploadFilePlaceholderText",
      :state="uploadFileState",
      :size="size"
    )
    template(slot="file-name" slot-scope="{ names }")
      b-badge(variant="dark") {{ names[0] }}
      b-badge(v-if="names.length > 1" variant="dark" class="ml-1") + {{ names.length - 1 }} 個檔案
  hr
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
  fetchOnServer: false, // component don't fetch on server side to prevent wierd undefined error!!
  data: () => ({
    createdate: '',
    number: '',
    pId: '',
    pName: '',
    note: '',
    enddate: '',
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
      // convert date string to ms
      const ad = this.$utils.twToAdDateObj(this.createdate)
      if (ad) {
        // to php timestamp
        return ad.getTime() / 1000
      }
      return 0
    },
    endtime () {
      // if (this.editMode) {
      //   return this.origData?.endtime
      // }
      // convert date string to ms
      const ad = this.$utils.twToAdDateObj(this.enddate)
      if (ad) {
        // to php timestamp
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
    uploadFileState () {
      if (this.editMode) {
        return null
      }
      return this.validUploadFile
    },
    uploadFilePlaceholderText () {
      if (this.editMode) {
        return '... 可選擇PDF更新(非必要) ...'
      }
      return '... 請選擇預約檔案PDF ...'
    },
    validNumber () {
      if (this.number?.length !== 10) {
        return false
      }
      if (this.editMode) {
        return true
      }
      const number = parseInt(this.number)
      if (number) {
        const now = new Date()
        const year = now.getFullYear() - 1911 // TW
        const criteria = this.$utils.empty(this.dbLatestNumber) ? parseInt(`${year}0000000`) : parseInt(this.dbLatestNumber)
        return number > criteria
      }
      return false
    },
    validPId () {
      return this.$utils.twIDCheck(this.pId)
    },
    validPName () {
      return this.$utils.length(this.pName) > 2
    },
    validNote () {
      return null
    },
    validUploadFile () {
      return !this.$utils.empty(this.uploadFile)
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
    uploadFile (val) {
      // console.warn(val)
    },
    origData (val) {
      this.restoreOrigData()
    },
    createdate (val) {
      if (this.validCreatedate) {
        const ad = this.$utils.twToAdDateObj(val)
        if (ad) {
          // auto setting enddate a year later
          ad.setFullYear(ad.getFullYear() + 1)
          this.enddate = this.$utils.twDateStr(ad)
        }
      } else {
        this.enddate = ''
      }
    },
    dbLatestNumber (val) {
      if (!this.editMode) {
        const int = parseInt(val)
        // set default case number
        const now = new Date()
        const year = now.getFullYear() - 1911 // TW
        this.number = int > 0 ? `${int + 1}` : `${year}0000001`
      }
    }
    // enddate (val) {},
    // createtime (val) { console.warn('create', val, this.$utils.toADDate(val * 1000)) },
    // endtime (val) { console.warn('end', val, this.$utils.toADDate(val * 1000)) }
  },
  created () {
    this.restoreOrigData()
    // add debounce timer for input event
    this.emitInput = this.$utils.debounce(() => {
      this.$emit('input', {
        number: this.number,
        pid: this.pId,
        pname: this.pName,
        note: this.note,
        file: this.uploadFile,
        // NOTE: ms => not date string
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
    }).finally(() => {
    })
  },
  mounted () {
    if (!this.editMode) {
      this.createdate = this.$utils.today('tw').replaceAll(/[:\-\s]/ig, '')
    }
  },
  methods: {
    msToTWDate (ms) {
      const int = parseInt(ms)
      if (int > 0) {
        return this.$utils.twDateStr(new Date(int * 1000))
      }
      return ''
    },
    restoreOrigData () {
      if (!this.$utils.empty(this.origData)) {
        this.createdate = this.msToTWDate(this.origData.createtime)
        this.enddate = this.msToTWDate(this.origData.endtime)
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
        // this.$upload.post(this.$consts.API.FILE.ADD_REG_FOREIGNER_PDF, formData).then(({ data }) => {
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
        this.warning('選擇的檔案不是PDF')
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
