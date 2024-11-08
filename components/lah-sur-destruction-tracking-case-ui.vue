<template lang="pug">
div
  .d-flex.w-100
    b-input-group.text-nowrap(
      prepend="發文日期",
      :size="size",
      title="7碼民國日期"
    )
      b-input.h-100(
        ref="issueDate",
        v-model="issueDate",
        :state="validIssueDate",
        :readonly="editMode"
      )
    b-input-group.text-nowrap.ml-1(
      prepend="發文字號",
      :size="size",
      title="10碼數字"
    )
      b-input(
        ref="number",
        v-model="number",
        :state="validNumber"
      )

  .d-flex.w-100.my-1
    b-input-group(
      :size="size",
      prepend="申請日期",
      title="7碼民國日期"
    )
      b-input.h-100(
        v-model="applyDate",
        :state="validApplyDate"
      )
    b-input-group.ml-1(
      :size="size",
      prepend="　　地段"
    )
      b-select.h-100(
        v-model="sectionCode",
        :options="sectionOpts",
        :state="validSectionCode"
      )

  .d-flex.w-100
    b-input-group(
      :size="size",
      prepend="　　地號",
      title="8碼地號"
    )
      b-input.h-100(
        v-model="landNumber",
        :state="validLandNumber"
      )
    b-input-group.ml-1(
      :size="size",
      prepend="　　建號"
    )
      b-input.h-100(
        v-model="buildingNumber",
        :state="validBuildingNumber"
      )

  .d-flex.w-100.my-1
    b-input-group(
      :size="size",
      prepend="使用執照"
    )
      b-input.h-100(
        v-model="occupancyPermit",
        :state="validOccupancyPermit"
      )
    b-input-group.ml-1(
      :size="size",
      prepend="建築執照"
    )
      b-input.h-100(
        v-model="constructionPermit",
        :state="validConstructionPermit"
      )
  hr
  b-input-group.my-1(
    prepend="拆除地址",
    :size="size"
  )
    b-textarea(
      v-model="address",
      placeholder="... 請輸入地址 ...",
      rows="2",
      :state="validAddress"
    )
  //- hr
  //- b-input-group.my-1(
  //-   prepend="　　備註",
  //-   :size="size"
  //- )
  //-   b-textarea(
  //-     v-model="note",
  //-     rows="4",
  //-     :state="validNote"
  //-   )
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
    pId: '',
    pName: '',
    enddate: '',
    dbLatestNumber: '',

    uploadFile: null,
    number: '',
    issueDate: '',
    applyDate: '',
    sectionCode: '',
    landNumber: '',
    buildingNumber: '',
    address: '',
    occupancyPermit: '',
    constructionPermit: '',
    note: '',
    done: false,
    sectionOpts: []
  }),
  computed: {
    ready () {
      if (this.editMode) {
        return this.validNumber &&
               this.validIssueDate &&
               this.validApplyDate
      }
      return this.validNumber &&
             this.validUploadFile &&
             this.validIssueDate &&
             this.validApplyDate &&
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
    validSectionCode () {
      return !this.$utils.empty(this.sectionCode)
    },
    validLandNumber () {
      return !this.$utils.empty(this.landNumber)
    },
    validBuildingNumber () {
      return !this.$utils.empty(this.buildingNumber)
    },
    validAddress () {
      return !this.$utils.empty(this.address)
    },
    validNote () {
      return null
    },
    validOccupancyPermit () {
      return !this.$utils.empty(this.occupancyPermit)
    },
    validConstructionPermit () {
      return !this.$utils.empty(this.constructionPermit)
    },
    validUploadFile () {
      return !this.$utils.empty(this.uploadFile)
    },
    validIssueDate () {
      if (this.issueDate) {
        const tmp = this.issueDate.replaceAll(/[:\-\s]/ig, '')
        return tmp.length === 7
      }
      return false
    },
    validApplyDate () {
      if (this.applyDate) {
        const tmp = this.applyDate.replaceAll(/[:\-\s]/ig, '')
        return tmp.length === 7
      }
      return false
    },
    validEnddate () {
      if (this.enddate) {
        const ed = this.enddate.replaceAll(/[:\-\s]/ig, '')
        if (ed.length === 7 && this.validIssueDate) {
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
      if (this.validIssueDate) {
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
    // prepare section opts
    this.loadSections()
  },
  mounted () {
    if (!this.editMode) {
      this.createdate = this.$utils.today('tw').replaceAll(/[:\-\s]/ig, '')
    }
  },
  methods: {
    loadSections () {
      // get current latest case number from DB
      this.$axios.post(this.$consts.API.JSON.MOIADM, {
        type: 'host_sections'
      }).then(({ data }) => {
        // this.$utils.warn(data)
        if (this.$utils.statusCheck(data.status)) {
          data.raw.forEach((element) => {
            this.sectionOpts.push({
              text: `${element.code} ${element.name}`,
              value: element.code
            })
          })
        } else {
          this.warning(data.message)
        }
      }).catch((e) => {
        this.$utils.error(e)
      }).finally(() => {
      })
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
        formData.append('type', 'add_destruction_tracking')
        formData.append('number', this.number)
        formData.append('note', this.note)
        formData.append('file', this.uploadFile)
        // this.$upload.post(this.$consts.API.FILE.ADD_REG_FOREIGNER_PDF, formData).then(({ data }) => {
        this.$upload.post(this.$consts.API.JSON.SUR, formData).then(({ data }) => {
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
      formData.append('type', 'edit_destruction_tracking')
      formData.append('id', this.editId)
      formData.append('number', this.number)
      formData.append('note', this.note)
      if (this.uploadFile?.type === 'application/pdf') {
        formData.append('file', this.uploadFile)
      }
      this.$upload.post(this.$consts.API.JSON.SUR, formData).then(({ data }) => {
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
