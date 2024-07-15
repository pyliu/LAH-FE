<template lang="pug">
.w-100(:class="vertical ? ['d-flex-column'] : ['d-flex']")
  b-input-group.text-nowrap(
    :size="size",
    prepend="年",
    :class="vertical ? [] : ['fixed-width']"
  )
    b-form-select.h-100(
      ref="year",
      v-model="year",
      :options="years",
      @change="emitInput"
    )
      template(v-slot:first): b-form-select-option(:value="null" disabled) -- 年份 --
  b-input-group(
    :size="size",
    prepend="字",
    :class="vertical ? ['my-1'] : ['mx-1']"
  )
    b-form-select.h-100(
      ref="code",
      v-model="code",
      @change="emitInput"
    )
      template(v-slot:first): b-form-select-option(:value="null" disabled) -- 案件字 --
      optgroup(
        v-if="obj.options.length > 0",
        v-for="obj in codeData",
        :label="obj.label",
        :class="codeBg(obj.label)"
      )
        option(
          v-for="item in obj.options",
          :value="item.replace(/[^A-Za-z0-9]/g, '')"
        ) {{item}}
  b-input-group.text-nowrap(
    :size="size",
    prepend="號",
    :class="vertical ? [] : ['fixed-width']"
  )
    b-form-input.h-100(
      ref="num",
      v-model="number",
      title="最多6個數字",
      @input="emitInput",
      @keyup.enter="$emit('enter', $event)",
      type="number",
      :step="step",
      :min="min",
      :max="max"
    )
</template>

<script>
export default {
  props: {
    type: { type: String, default: 'reg' },
    value: { type: String, default: '' },
    vertical: { type: Boolean, default: false },
    size: { type: String, default: '' }
  },
  data: () => ({
    codes: {},
    codeData: [],
    years: [],
    year: '113',
    code: '',
    number: '',
    step: 10,
    min: 10,
    max: 999999,
    retry: 3,
    codeCacheKey: 'lah-reg-case-input-group-code',
    codeCacheKeyPermanent: 'lah-reg-case-input-group-code-permanent'
  }),
  computed: {
    caseId () {
      return `${this.year}${this.code}${String(this.number).padStart(6, '0')}`
    },
    validYear () {
      return String(this.year).length === 3
    },
    validCode () {
      return this.code.length === 4
    },
    validNumber () {
      const number = parseInt(this.number)
      return !this.$utils.empty(this.number) &&
             number > 9 &&
             number < 1000000
    },
    validCaseId () {
      return this.validYear && this.validCode && this.validNumber
    }
  },
  watch: {
    // caseId (val) {
    //   this.$utils.warn(val)
    // },
    year (dontcare) {
      this.getMaxNumber()
    },
    code (val) {
      this.getMaxNumber()
    }
  },
  created () {
    // set year select options
    const d = new Date()
    this.year = (d.getFullYear() - 1911)
    this.getMaxNumber = this.$utils.debounce(() => {
      if (this.validYear && this.validCode) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'max',
          year: this.year,
          code: this.code
        }).then((res) => {
          if (res.data.status === this.$consts.XHR_STATUS_CODE.SUCCESS_NORMAL) {
            // update UI
            this.number = res.data.max
            this.emitInput()
          } else {
            this.$warn(`無法取得最大號 ${this.year}-${this.code}`)
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      }
    }, 400)
    this.reloadYear()
    this.reloadCode()
  },
  mounted () {},
  methods: {
    emitInput (e) {
      this.$emit('input', this.caseId)
    },
    getMaxNumber: () => { /* placeholder for debounced method */ },
    newCustomEvent: (name, val, target) => {
      const evt = new CustomEvent(name, {
        detail: val,
        bubbles: true
      })
      Object.defineProperty(evt, 'target', { writable: false, value: target })
      return evt
    },
    reloadYear () {
      this.getCache('lah-case-input-group-year').then((years) => {
        if (Array.isArray(years) && years.includes(this.year)) {
          this.years = [...years]
        } else {
          // set year select options
          const len = this.year - 103
          for (let i = 0; i <= len; i++) {
            this.years.push({ value: 103 + i, text: 103 + i })
          }
          this.setCache('lah-case-input-group-year', this.years, 24 * 60 * 60 * 1000) // cache for a day
        }
      }).finally(() => {
        if (this.$utils.empty(this.years)) {
          this.timeout(() => this.reloadYear(), 1000)
        }
      })
    },
    reloadCode () {
      this.getCache(this.codeCacheKey).then((items) => {
        if (!Array.isArray(items) || this.$utils.empty(items)) {
          this.getDBCodeData()
        } else {
          this.restoreCodeData(items)
        }
      }).finally(() => {
        if (this.$utils.empty(this.codes)) {
          this.timeout(() => this.reloadCode(), 1000)
        }
      })
    },
    getDBCodeData () {
      if (this.isBusy) { return }
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'code_data',
        year: this.year
      }).then((res) => {
        this.setCache(this.codeCacheKey, res.data.raw, 12 * 60 * 60 * 1000) // cache for half day
        if (!this.$utils.empty(res.data.raw)) {
          // no expire time
          this.setCache(this.codeCacheKeyPermanent, res.data.raw, 0)
        }
        this.restoreCodeData(res.data.raw)
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    resetCodes () {
      this.codes = Object.assign({}, {
        reg: {
          HB: {
            label: '本所案件',
            options: []
          },
          HXB1: {
            label: '跨所案件-本所收件',
            options: []
          },
          HBX1: {
            label: '跨所案件-他所收件',
            options: []
          },
          H2XX: {
            label: '跨縣市案件-本所收件',
            options: []
          },
          XXHB: {
            label: '跨縣市案件-他所收件',
            options: []
          }
        },
        sur: {
          HB: {
            label: '測量案件',
            options: []
          }
        },
        prc: {
          HB: {
            label: '地價案件',
            options: ['HB31 地價更正']
          }
        }
      })
    },
    async restoreCodeData (items) {
      // ITEM欄位：YEAR, CODE, CODE_NAME, COUNT, CODE_TYPE
      // [109, HCB1, 壢溪登跨, 1213, reg.HXB1]

      if (!Array.isArray(items)) {
        items = await this.getCache(this.codeCacheKeyPermanent)
      }

      if (Array.isArray(items)) {
        this.resetCodes()
        items.forEach((item) => {
          // type => ['reg', 'HXB1']
          const type = item.CODE_TYPE.split('.')

          // temp fix for reg.H2XX issue
          if (type.length < 2) {
            type[0] = 'reg'
            type[1] = 'H2XX'
          }
          // console.warn(item, type)

          if (this.$utils.empty(item.CODE_NAME)) { return false }
          if (this.$utils.empty(this.codes[type[0]])) { return false }
          if (this.$utils.empty(this.codes[type[0]][type[1]])) { return false }

          const combined = item.CODE + ` ${item.CODE_NAME}` // 'HCB1 壢溪登跨'
          const found = this.codes[type[0]][type[1]].options.find((i, idx, array) => { return i === combined })
          if (!found) {
            this.codes[type[0]][type[1]].options.push(combined)
          }
        })
        // this.codes = Object.assign({}, this.codes);
        this.arrangeCodeList()

        // console.warn(this.codes)
      } else if (--this.retry > 0) {
        this.timeout(() => this.reloadCode(), 200)
      } else {
        this.notify({
          title: '案件字還原',
          subtitle: this.codeCacheKey,
          message: '無法讀取案件「字」資料',
          type: 'warning'
        })
        this.timeout(window.location.reload, 1000)
      }
    },
    arrangeCodeList () {
      this.codeData = []
      switch (this.type) {
        case 'reg':
          this.codeData.push(this.codes.reg.HB)
          this.codeData.push(this.codes.reg.HXB1)
          this.codeData.push(this.codes.reg.HBX1)
          this.codeData.push(this.codes.reg.H2XX)
          this.codeData.push(this.codes.reg.XXHB)
          this.step = this.min = 10
          break
        case 'sur':
          this.codeData.push(this.codes.sur.HB)
          this.step = this.min = 100
          this.num = '000100'
          break
        case 'sync':
          this.codeData.push(this.codes.reg.HXB1)
          break
        case 'tmp':
          this.codeData.push(this.codes.reg.HB)
          this.codeData.push(this.codes.prc.HB)
          this.codeData.push(this.codes.reg.HXB1)
          this.codeData.push(this.codes.reg.HBX1)
          this.codeData.push(this.codes.reg.H2XX)
          this.codeData.push(this.codes.reg.XXHB)
          this.step = this.min = 1
          break
        default:
          this.codeData.push(this.codes.reg.HB)
          this.codeData.push(this.codes.reg.HXB1)
          this.codeData.push(this.codes.reg.HBX1)
          this.codeData.push(this.codes.prc.HB)
          this.codeData.push(this.codes.sur.HB)
          this.codeData.push(this.codes.reg.H2XX)
          this.codeData.push(this.codes.reg.XXHB)
          break
      }
    },
    codeBg (label) {
      let bgCss = ''
      switch (label) {
        case '跨所案件-本所收件':
          bgCss = 'bg-primary text-white'
          break
        case '跨所案件-他所收件':
          bgCss = 'bg-info text-white'
          break
        case '跨縣市案件-本所收件':
          bgCss = 'bg-success text-white'
          break
        case '跨縣市案件-他所收件':
          bgCss = 'bg-warning'
          break
        case '測量案件':
          bgCss = 'bg-dark text-white'
          break
        case '地價案件':
          bgCss = 'bg-secondary text-white'
          break
        default:
          break
      }
      return bgCss
    }
  }
}
</script>

<style lang="scss" scoped>
.fixed-width {
  width: 285px;
}
</style>
