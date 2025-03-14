export default {
  emit: ['ready', 'not-found'],
  name: 'regCaseBase',
  props: {
    parentData: { type: Object, default: undefined },
    // the id format should be '109HB04001234'
    caseId: { type: String, default: '' },
    reload: { type: Boolean, default: false }
  },
  data: () => ({
    bakedData: undefined
  }),
  computed: {
    year () {
      if (!this.$utils.empty(this.bakedData)) {
        return this.bakedData.RM01
      }
      return this.caseId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3)
    },
    code () {
      if (!this.$utils.empty(this.bakedData)) {
        return this.bakedData.RM02
      }
      return this.caseId.replace(/[^a-zA-Z0-9]/g, '').substring(3, 7)
    },
    number () {
      if (!this.$utils.empty(this.bakedData)) {
        return this.bakedData.RM03
      }
      return this.caseId.replace(/[^a-zA-Z0-9]/g, '').substring(7)
    },
    id () { return this.ID.replaceAll('-', '') },
    ID () { return `${this.year}-${this.code}-${this.number.padStart(6, '0')}` },
    validID () { return this.year.length === 3 && this.code.length === 4 && parseInt(this.number) < 1000000 && parseInt(this.number) > 0 },
    ready () { return !this.$utils.empty(this.bakedData) },
    queryDataUrl () { return `http://${this.webapIp}:9080/Land${this.site}/CAS/CCD01/CCD0103.jsp?rm01=${this.bakedData.RM01}&rm02=${this.bakedData.RM02}&rm03=${this.bakedData.RM03}` },
    queryStatusUrl () { return `http://${this.webapIp}:9080/Land${this.site}/CAS/CCD02/CCD0202.jsp?year=${this.bakedData.RM01}&word=${this.bakedData.RM02}&code=${this.bakedData.RM03}&sdlyn=N&RM90=` }
  },
  watch: {
    parentData (val) { this.bakedData = val },
    bakedData (val) {
      // emit the data out
      this.trigger('dataReady', val)
      !val && this.trigger('not-found')
    }
  },
  created () { this.bakedData = this.parentData },
  fetch () {
    if (this.isBusy) {
      this.$utils.warn(`${this.ID}案件讀取中 ... `)
      return false
    }
    // case-id prop-in is valid then uses it for fetching data
    if (this.validID && (this.reload || !this.bakedData)) {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_case',
        id: this.id
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.bakedData = data.baked
        } else {
          this.alert(data.message, {
            title: '讀取登記案件',
            type: 'warning'
          })
          this.trigger('not-found')
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  }
}
