<template lang="pug">
div
  //- lah-message.my-auto(
  //-   :message="numberErrorMessage",
  //-   variant="danger"
  //- )
  .d-flex.w-100
    b-input-group.text-nowrap(
      prepend="發文日期",
      :size="size",
      title="7碼民國日期"
    )
      b-input.h-100(
        ref="issueDate",
        v-model="issueDate",
        :state="isValidIssueDate"
      )
    b-input-group.text-nowrap.ml-1(
      prepend="發文字號",
      :size="size",
      title="10碼數字"
    )
      b-input(
        ref="number",
        v-model="number",
        :state="isValidNumber",
        v-b-popover.hover.focus.left="numberErrorMessage",
        @input="checkNumber"
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
    sectionOpts: [],
    exists: false
  }),
  computed: {
    ready () {
      let tmp = this.isValidNumber &&
                this.isValidIssueDate &&
                this.isValidSectionCode &&
                this.isValidLandNumber &&
                this.isValidAddress &&
                this.isValidApplyDate
      if (tmp && !this.editMode) {
        tmp = tmp && this.isValidUploadFile
      }
      // building number is not necessary
      if (this.isValidBuildingNumber !== null) {
        tmp = tmp && this.isValidBuildingNumber
      }
      return tmp
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
      return '... 請選擇電子檔PDF ...'
    },
    isValidNumber () {
      if (this.number?.length !== 10) {
        this.$utils.warn(`公文字號長度應該要10碼 (${this.number?.length})`)
        return false
      }
      if (!this.editMode && this.exists) {
        return false
      }
      return true
    },
    numberErrorMessage () {
      if (this.exists && this.number?.length === 10) {
        return `已有發文字號為「${this.number}」的追蹤資料，請查明 ⚠`
      }
      return ''
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
      if (this.landNumber?.length > 4 && !this.landNumber?.includes('-')) {
        this.$utils.warn(`沒有 "-" 的狀況下地號最多4碼 (${this.landNumber?.length})`)
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
        this.$utils.warn(`沒有 "-" 的狀況下建號號最多5碼 (${this.buildingNumber?.length})`)
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
        file: this.uploadFile,
        id: this.editId
      }
    },
    /**
     * Not restricted for now
     */
    isValidNote () {
      return null
    },
    isValidOccupancyPermit () {
      return null
    },
    isValidConstructionPermit () {
      return null
    }
  },
  watch: {
    origData (val) {
      this.restoreOrigData()
    }
  },
  created () {
    this.restoreOrigData()
    // add debounce timer for input event
    this.emitInput = this.$utils.debounce(() => {
      this.$emit('input', this.keyData)
    }, 400)
    // for checking existence of the number
    this.checkNumber = this.$utils.debounce(() => {
      if (!this.editMode && this.number?.length === 10) {
        this.exists = false
        this.$axios.post(this.$consts.API.JSON.SUR, {
          type: 'destruction_tracking_number_exist',
          number: this.number
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            // no record will return null
            this.exists = data.raw !== null
            this.$utils.warn(`已檢查 ${this.number} 是否已建立。(${this.exists})`)
          } else {
            this.warning(data.message)
          }
        }).catch((e) => {
          this.$utils.error(e)
        }).finally(() => {
        })
      }
    }, 400)
    // prepare section opts
    this.loadSections()
  },
  mounted () {
  },
  methods: {
    checkNumber () { /** placeholder */ },
    loadSections () {
      // prepare sections options
      this.$axios.post(this.$consts.API.JSON.MOIADM, {
        type: 'host_sections'
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          data.raw.forEach((element) => {
            this.sectionOpts.push({
              text: `${element.code} ${element.name}`,
              value: element.code
            })
          })
          this.$utils.warn('已重新讀取段代碼資料')
        } else {
          this.warning(data.message)
        }
      }).catch((e) => {
        this.$utils.error(e)
      }).finally(() => {
      })
    },
    loadCreatedNumbers () {
      // prepare sections options
      this.$axios.post(this.$consts.API.JSON.SUR, {
        type: 'destruction_tracking_number_list'
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.createdNumbers = [...data.raw]
          this.$utils.warn(`已重新讀 ${data.data_count} 筆追蹤資料`)
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
        this.issueDate = this.origData.issue_date
        this.applyDate = this.origData.apply_date
        this.sectionCode = this.origData.section_code
        this.landNumber = this.$utils.formatLandNumber(this.origData.land_number)
        this.buildingNumber = this.$utils.formatBuildNumber(this.origData.building_number)
        this.address = this.origData.address
        this.occupancyPermit = this.origData.occupancy_permit
        this.constructionPermit = this.origData.construction_permit
        this.done = Boolean(this.origData.done)
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
      formData.append('land_number', this.formattedLandNumber)
      formData.append('building_number', this.formattedBuildingNumber)
      formData.append('address', this.address)
      formData.append('occupancy_permit', this.occupancyPermit)
      formData.append('construction_permit', this.constructionPermit)
      formData.append('note', this.note)
      formData.append('done', this.done)
      formData.append('updatetime', Math.floor(+new Date() / 1000))
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
          // this.$utils.warn(data.payload)
          const title = this.$utils.empty(data.payload) ? '新增追蹤資料結果' : `${data.payload.number}-${data.payload.id}`
          const message = `${data.message}`
          this.timeout(() => this.notify(message, { title, type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' }), 400)
          if (this.$utils.statusCheck(data.status)) {
            this.$utils.warn(data.payload)
            this.$emit('add', data.payload)
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
        const message = `${data.message}`
        this.timeout(() => this.notify(message, { title, type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' }), 400)
        if (this.$utils.statusCheck(data.status)) {
          this.$emit('edit', {
            ...this.keyData,
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
