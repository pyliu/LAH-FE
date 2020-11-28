export default {
  props: {
    // the id format should be '109HB04001234'
    id: {
      type: String,
      default: ''
    },
    apServer: {
      type: String,
      default: '220.1.35.123'
    },
    standalone: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    bakedData: undefined,
    site: 'HB'
  }),
  computed: {
    year() {
      return this.bakedData ? this.bakedData['RM01'] : this.id.substring(0, 3)
    },
    code() {
      return this.bakedData ? this.bakedData['RM02'] : this.id.substring(3, 7)
    },
    number() {
      return this.bakedData ? this.bakedData['RM03'] : this.id.substring(7)
    },
    ready() {
      return !this.$utils.empty(this.bakedData)
    },
    storeBakedData() {
      return this.$store.getters['regcase/bakedData']
    }
  },
  watch: {
    storeBakedData(json) {
      !this.standalone && (this.bakedData = json)
    },
    bakedData(json) {
      !this.standalone && !this.$utils.equal(json, this.storeBakedData) &&
        this.$store.dispatch('regcase/update', json).then((baked) => {
          // this.$utils.log(baked)
        })
    }
  },
  methods: {
    fetch() {
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_case',
        id: `${this.year}${this.code}${this.number}`
      }).then(res => {
        if (!this.$utils.statusCheck(res.data.status)) {
          this.alert({
            title: '讀取登記案件',
            message: res.data.message,
            type: 'warning'
          })
        } else {
          this.bakedData = res.data.baked
        }
      }).catch(err => {
        this.$utils.error(err)
      }).finally(() => {
      })
    }
  },
  created() {
    if (this.standalone) {
      this.fetch()
    } else if (this.bakedData === undefined) {
      if (this.storeBakedData) {
        this.bakedData = this.storeBakedData
      } else if (!this.$utils.empty(`${this.year}${this.code}${this.number}`)) {
        this.fetch()
      }
    }
  }
}
