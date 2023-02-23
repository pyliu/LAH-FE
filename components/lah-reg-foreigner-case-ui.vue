<template lang="pug">
div
  .d-flex.w-100
    b-input-group.text-nowrap(
      :size="size",
      prepend="　年"
    )
      b-select.h-100(
        ref="year",
        v-model="year",
        :options="years",
        :disabled="editMode",
        @change="emitInput"
      )
        template(v-slot:first): b-form-select-option(:value="null" disabled) -- 年份 --
    b-input-group.text-nowrap.ml-1(
      prepend="　號",
      :size="size"
    )
      b-input.h-100(
        ref="num",
        v-model="number",
        type="number",
        title="最多6個數字",
        @input="emitInput",
        @keyup.enter="$emit('enter', $event)",
        :step="step",
        :min="min",
        :max="max",
        :state="validNumber"
      )
  .d-flex.w-100.my-1
    b-input-group(
      :size="size",
      prepend="統編"
    )
      b-input.h-100(
        v-model="foreignerId",
        :state="validForeignerId"
      )
    b-input-group.ml-1(
      :size="size",
      prepend="姓名"
    )
      b-input.h-100(
        v-model="foreignerName",
        :state="validForeignerName"
      )
  b-input-group(
    prepend="備註",
    :size="size"
  )
    b-textarea(
      v-model="foreignerNote",
      placeholder="... 請輸入額外的描述 ...",
      rows="8",
      :state="validForeignerNote"
    )
  hr
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
    origData: { type: Object, default: () => ({}) }
  },
  data: () => ({
    foreignerId: '',
    foreignerName: '',
    foreignerNote: '',
    uploadFile: null,
    yearCachedKey: 'lah-reg-foreigner-case-addition-year',
    years: [],
    year: '112',
    number: '',
    step: 10,
    min: 10,
    max: 999999
  }),
  computed: {
    ready () {
      if (this.editMode) {
        return this.validYear &&
               this.validNumber &&
               this.validForeignerId &&
               this.validForeignerName
      }
      return this.validYear &&
             this.validNumber &&
             this.validForeignerId &&
             this.validForeignerName &&
             this.validUploadFile
    },
    createtime () {
      return this.editMode ? this.origData?.createtime : ''
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
      return '... 請選擇PDF ...'
    },
    validYear () {
      return String(this.year).length === 3
    },
    validNumber () {
      const number = parseInt(this.number)
      return !this.$utils.empty(this.number) &&
             number > 9 &&
             number < 1000000
    },
    validForeignerId () {
      return !this.$utils.empty(this.foreignerId)
    },
    validForeignerName () {
      return !this.$utils.empty(this.foreignerName)
    },
    validForeignerNote () {
      return null
    },
    validUploadFile () {
      return !this.$utils.empty(this.uploadFile)
    }
  },
  watch: {
    uploadFile (val) {
      // console.warn(val)
    },
    origData (val) {
      this.restoreOrigData()
    }
  },
  created () {
    // set year select options
    const d = new Date()
    this.year = (d.getFullYear() - 1911)
    this.restoreOrigData()
  },
  mounted () {
    this.reloadYear()
  },
  methods: {
    restoreOrigData () {
      if (!this.$utils.empty(this.origData)) {
        this.year = this.origData.year
        this.number = this.origData.number
        this.foreignerId = this.origData.fid
        this.foreignerName = this.origData.fname
        this.foreignerNote = this.origData.note
      }
    },
    emitInput (e) {
      this.$emit('input', {
        year: this.year,
        number: this.number,
        fid: this.foreignerId,
        fname: this.foreignerName,
        note: this.foreignerNote,
        file: this.uploadFile,
        createtime: this.createtime
      })
    },
    ok () {
      if (this.editMode) {
        this.confirm('請確認要編輯外國人資料？').then((YN) => {
          if (YN) {
            this.edit()
          }
        })
      } else {
        this.confirm('請確認要新增外國人資料？').then((YN) => {
          if (YN) {
            this.add()
          }
        })
      }
    },
    cancel () {
      this.$emit('close')
    },
    reloadYear () {
      this.getCache(this.yearCachedKey).then((years) => {
        if (years !== false) {
          this.years = [...years]
        } else {
          // set year select options
          const len = this.year - 87
          for (let i = 0; i <= len; i++) {
            this.years.push({ value: 87 + i, text: 87 + i })
          }
          this.setCache(this.yearCachedKey, this.years, 24 * 60 * 60 * 1000) // cache for a day
        }
      }).finally(() => {
        if (this.$utils.empty(this.years)) {
          this.timeout(() => this.reloadYear(), 1000)
        }
      })
    },
    add () {
      if (this.uploadFile?.type === 'application/pdf') {
        this.isBusy = true
        const formData = new FormData()
        formData.append('year', this.year)
        formData.append('number', this.number)
        formData.append('fid', this.foreignerId)
        formData.append('fname', this.foreignerName)
        formData.append('note', this.foreignerNote)
        formData.append('file', this.uploadFile)
        this.$upload.post(this.$consts.API.FILE.ADD_REG_FOREIGNER_PDF, formData).then(({ data }) => {
          const title = this.$utils.empty(data.payload) ? '新增外國人資料結果' : `${data.payload.year}-${data.payload.number}-${data.payload.fid}`
          const message = `${data.payload.fname} - ${data.message}`
          this.timeout(() => this.notify(message, { title, type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' }), 400)
          if (this.$utils.statusCheck(data.status)) {
            this.$emit('add', {
              year: this.year,
              number: this.number,
              fid: this.foreignerId,
              fname: this.foreignerName,
              note: this.foreignerNote
            })
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
          this.$emit('close')
        })
      } else {
        this.warning('檔案不是PDF')
      }
    },
    edit () {
      this.isBusy = true
      const formData = new FormData()
      formData.append('id', this.editId)
      formData.append('year', this.year)
      formData.append('number', this.number)
      formData.append('fid', this.foreignerId)
      formData.append('fname', this.foreignerName)
      formData.append('note', this.foreignerNote)
      if (this.uploadFile?.type === 'application/pdf') {
        formData.append('file', this.uploadFile)
      }
      this.$upload.post(this.$consts.API.FILE.EDIT_REG_FOREIGNER_PDF, formData).then(({ data }) => {
        const title = this.$utils.empty(data.payload) ? '編輯外國人資料結果' : `${data.payload.year}-${data.payload.number}-${data.payload.fid}`
        const message = `${data.payload.fname} - ${data.message}`
        this.timeout(() => this.notify(message, { title, type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' }), 400)
        if (this.$utils.statusCheck(data.status)) {
          this.$emit('edit', {
            id: this.editId,
            year: this.year,
            number: this.number,
            fid: this.foreignerId,
            fname: this.foreignerName,
            note: this.foreignerNote,
            modifytime: Math.floor(+new Date() / 1000)
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
