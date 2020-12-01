export default {
  name: 'regCaseBase',
  props: {
    parentData: {
      type: Object,
      default: undefined
    },
    // the id format should be '109HB04001234'
    caseId: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    bakedData: undefined,
    apServer: "220.1.35.123",
    site: 'HB'
  }),
  computed: {
    year () {
      return this.caseId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3)
    },
    code () {
      return this.caseId.replace(/[^a-zA-Z0-9]/g, '').substring(3, 7)
    },
    number () {
      return this.caseId.replace(/[^a-zA-Z0-9]/g, '').substring(7)
    },
    ID () {
      return `${this.year}-${this.code}-${this.number.padStart(6, '0')}`
    },
    validID () {
      return this.year.length === 3 && this.code.length === 4 && parseInt(this.number) < 1000000 && parseInt(this.number) > 0
    },
    ready () {
      return !this.$utils.empty(this.bakedData)
    },
    queryDataUrl () {
      return `http://${this.apServer}:9080/Land${this.site}/CAS/CCD01/CCD0103.jsp?rm01=${this.bakedData['RM01']}&rm02=${this.bakedData['RM02']}&rm03=${this.bakedData['RM03']}`
    },
    queryStatusUrl () {
      return `http://${this.apServer}:9080/Land${this.site}/CAS/CCD02/CCD0202.jsp?year=${this.bakedData['RM01']}&word=${this.bakedData['RM02']}&code=${this.bakedData['RM03']}&sdlyn=N&RM90=`
    }
  },
  watch: {
    parentData(val) {
      this.bakedData = val
    }
  },
  methods: {
    fetch() {
      if (this.validID) {
        const thisID = `${this.year}${this.code}${this.number.padStart(6, '0')}`
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'reg_case',
          id: thisID
        }).then(res => {
          if (this.$utils.statusCheck(res.data.status)) {
            this.bakedData = res.data.baked
          } else {
            this.alert(res.data.message, {
              title: '讀取登記案件',
              type: 'warning'
            })
          }
        }).catch(err => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      }
    }
  },
  created () { 
    this.bakedData = this.parentData
    this.fetch()
  }
}
