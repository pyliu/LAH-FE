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
      :state="valiUploadFile",
      :size="size"
    )
    template(slot="file-name" slot-scope="{ names }")
      b-badge(variant="dark") {{ names[0] }}
      b-badge(v-if="names.length > 1" variant="dark" class="ml-1") + {{ names.length - 1 }} 個檔案
  hr
  .d-flex.justify-content-center
    b-button-group
      lah-button.mr-1(
        icon="arrow-up-from-bracket",
        action="move-fade-btt",
        @click="upload"
      ) 確認並上傳
      lah-button(
        variant="outline-secondary",
        @click="cancel"
      ) 取消
</template>

<script>
export default {
  emit: ['close', 'input'],
  props: {
    type: { type: String, default: 'reg' },
    value: { type: String, default: '' },
    size: { type: String, default: '' }
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
    max: 999999,
    codeCacheKey: 'lah-reg-case-input-group-code',
    codeCacheKeyPermanent: 'lah-reg-case-input-group-code-permanent'
  }),
  computed: {
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
    valiUploadFile () {
      return !this.$utils.empty(this.uploadFile)
    }
  },
  watch: {
    uploadFile (val) {
      // console.warn(val)
    }
  },
  created () {
    // set year select options
    const d = new Date()
    this.year = (d.getFullYear() - 1911)
  },
  mounted () {
    this.reloadYear()
  },
  methods: {
    emitInput (e) {
      this.$emit('input', {
        year: this.year,
        number: this.number,
        foreignerId: this.foreignerId,
        foreignerName: this.foreignerName,
        foreignerNote: this.foreignerNote,
        file: this.uploadFile
      })
    },
    upload () {
      this.$emit('close')
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
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
