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
        :state="isValidIssueDate",
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
        :state="isValidNumber"
      )

  .d-flex.w-100.my-1
    b-input-group(
      :size="size",
      prepend="申請日期",
      title="7碼民國日期"
    )
      b-input.h-100(
        v-model="applyDate",
        :state="isValidApplyDate"
      )
    b-input-group.ml-1(
      :size="size",
      prepend="　　地段"
    )
      b-select.h-100(
        v-model="sectionCode",
        :options="sectionOpts",
        :state="isValidSectionCode"
      )

  .d-flex.w-100
    b-input-group(
      :size="size",
      prepend="　　地號",
      title="8碼地號"
    )
      b-input.h-100(
        v-model="landNumber",
        :state="isValidLandNumber",
        v-b-popover.hover.focus.top="displayLandNumber"
      )
    b-input-group.ml-1(
      :size="size",
      prepend="　　建號"
    )
      b-input.h-100(
        v-model="buildingNumber",
        :state="isValidBuildingNumber",
        v-b-popover.hover.focus.top="displayBuildingNumber"
      )

  .d-flex.w-100.my-1
    b-input-group(
      :size="size",
      prepend="使用執照"
    )
      b-input.h-100(
        v-model="occupancyPermit",
        :state="isValidOccupancyPermit"
      )
    b-input-group.ml-1(
      :size="size",
      prepend="建築執照"
    )
      b-input.h-100(
        v-model="constructionPermit",
        :state="isValidConstructionPermit"
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
      :state="isValidAddress"
    )
  //- hr
  //- b-input-group.my-1(
  //-   prepend="　　備註",
  //-   :size="size"
  //- )
  //-   b-textarea(
  //-     v-model="note",
  //-     rows="4",
  //-     :state="isValidNote"
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
      const tmp = this.isValidNumber &&
             this.isValidSectionCode &&
             this.isValidLandNumber &&
             this.isValidAddress &&
             this.isValidUploadFile &&
             this.isValidIssueDate &&
             this.isValidApplyDate
      // building number is not necessary
      if (this.isValidBuildingNumber === null) {
        return tmp
      }
      return tmp && this.isValidBuildingNumber
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
      return this.isValidUploadFile
    },
    uploadFilePlaceholderText () {
      if (this.editMode) {
        return '... 可選擇PDF更新(非必要) ...'
      }
      return '... 請選擇預約檔案PDF ...'
    },
    isValidNumber () {
      if (this.number?.length !== 10) {
        return false
      }
      if (this.editMode) {
        return true
      }
      return false
    },
    isValidSectionCode () {
      return !this.$utils.empty(this.sectionCode)
    },
    formattedLandNumber () {
      return this.$utils.formatTo8Digits(this.landNumber, 'land')
    },
    displayLandNumber () {
      return this.$utils.formatLandNumber(this.formattedLandNumber)
    },
    isValidLandNumber () {
      if (this.landNumber.length > 4 && !this.landNumber.includes('-')) {
        return false
      }
      const tmp = parseInt(this.formattedLandNumber)
      return tmp < 99999999 &&
             tmp > 9999 &&
             this.formattedLandNumber.length === 8
    },
    formattedBuildingNumber () {
      return this.$utils.formatTo8Digits(this.buildingNumber, 'building')
    },
    displayBuildingNumber () {
      return this.$utils.formatBuildNumber(this.formattedBuildingNumber)
    },
    isValidBuildingNumber () {
      if (this.$utils.empty(this.buildingNumber)) {
        return null
      }
      if (this.buildingNumber.length > 5 && !this.buildingNumber.includes('-')) {
        return false
      }
      const tmp = parseInt(this.formattedBuildingNumber)
      return tmp < 99999999 &&
             tmp > 999 &&
             this.formattedBuildingNumber.length === 8
    },
    isValidAddress () {
      return !this.$utils.empty(this.address)
    },
    isValidNote () {
      return null
    },
    isValidOccupancyPermit () {
      return null// !this.$utils.empty(this.occupancyPermit)
    },
    isValidConstructionPermit () {
      return null// !this.$utils.empty(this.constructionPermit)
    },
    isValidUploadFile () {
      return !this.$utils.empty(this.uploadFile)
    },
    formattedIssueDate () {
      return this.issueDate?.replaceAll(/[:\-\s]/ig, '') || ''
    },
    isValidIssueDate () {
      return this.$utils.isValidTWDate(this.formattedIssueDate)
    },
    formattedApplyDate () {
      return this.applyDate?.replaceAll(/[:\-\s]/ig, '') || ''
    },
    isValidApplyDate () {
      return this.$utils.isValidTWDate(this.formattedApplyDate)
    },
    keyData () {
      return {
        ...Object.fromEntries(this.prepareFormData().entries()),
        file: this.uploadFile
      }
    }
  },
  watch: {
    uploadFile (val) {
      // console.warn(val)
    },
    origData (val) {
      this.restoreOrigData()
    },
    keyData (val) {
      this.$utils.warn(val)
    }
  },
  created () {
    this.restoreOrigData()
    // add debounce timer for input event
    this.emitInput = this.$utils.debounce(() => {
      this.$emit('input', this.keyData)
    }, 400)
    // prepare section opts
    this.loadSections()
  },
  mounted () {},
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
    restoreOrigData () {
      if (!this.$utils.empty(this.origData)) {
        this.number = this.origData.number
        this.issueDate = this.origData.issueDate
        this.applyDate = this.origData.applyDate
        this.sectionCode = this.origData.sectionCode
        this.landNumber = this.origData.landNumber
        this.buildingNumber = this.origData.buildingNumber
        this.address = this.origData.address
        this.occupancyPermit = this.origData.occupancyPermit
        this.constructionPermit = this.origData.constructionPermit
        this.done = this.origData.done
        this.note = this.origData.note
      }
    },
    emitInput () { /** placeholder */ },
    ok () {
      if (this.editMode) {
        this.confirm('請確認要編輯追蹤資料？').then((YN) => {
          if (YN) {
            this.edit()
          }
        })
      } else {
        this.confirm('請確認要新增追蹤資料？').then((YN) => {
          if (YN) {
            this.add()
          }
        })
      }
    },
    cancel () {
      this.$emit('close')
    },
    prepareFormData () {
      const formData = new FormData()
      formData.append('number', this.number)
      formData.append('issue_date', this.formattedIssueDate)
      formData.append('apply_date', this.formattedApplyDate)
      formData.append('section_code', this.sectionCode)
      formData.append('land_number', this.landNumber)
      formData.append('building_number', this.buildingNumber)
      formData.append('address', this.address)
      formData.append('occupancy_permit', this.occupancyPermit)
      formData.append('construction_permit', this.constructionPermit)
      formData.append('note', this.note)
      formData.append('done', this.done)
      return formData
    },
    add () {
      if (this.uploadFile?.type === 'application/pdf') {
        this.isBusy = true
        const formData = this.prepareFormData()
        formData.append('type', 'add_destruction_tracking')
        formData.append('file', this.uploadFile)
        // this.$upload.post(this.$consts.API.FILE.ADD_REG_FOREIGNER_PDF, formData).then(({ data }) => {
        this.$upload.post(this.$consts.API.JSON.SUR, formData).then(({ data }) => {
          const title = this.$utils.empty(data.payload) ? '新增追蹤資料結果' : `${data.payload.number}-${data.payload.pid}`
          const message = `${data.payload.pname} - ${data.message}`
          this.timeout(() => this.notify(message, { title, type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' }), 400)
          if (this.$utils.statusCheck(data.status)) {
            this.$emit('add', {
              id: data.payload.id,
              number: data.payload.number
              // pid: data.payload.pid,
              // pname: data.payload.pname,
              // note: data.payload.note,
              // createtime: data.payload.createtime,
              // endtime: data.payload.endtime
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
      const formData = this.prepareFormData()
      formData.append('type', 'edit_destruction_tracking')
      formData.append('id', this.editId)
      if (this.uploadFile?.type === 'application/pdf') {
        formData.append('file', this.uploadFile)
      }
      this.$upload.post(this.$consts.API.JSON.SUR, formData).then(({ data }) => {
        const title = this.$utils.empty(data.payload) ? '編輯追蹤資料結果' : `${data.payload.number}-${data.payload.pid}`
        const message = `${data.payload?.pname} - ${data.message}`
        this.timeout(() => this.notify(message, { title, type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' }), 400)
        if (this.$utils.statusCheck(data.status)) {
          this.$emit('edit', {
            id: this.editId,
            number: this.number
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
