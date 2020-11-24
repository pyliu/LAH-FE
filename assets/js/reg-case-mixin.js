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
    }
  },
  data: () => ({
    bakedData: undefined
  }),
  computed: {
    year () {
      return this.bakedData ? this.bakedData['RM01'] : this.id.substring(0, 3)
    },
    code () {
      return this.bakedData ? this.bakedData['RM02'] : this.id.substring(3, 7)
    },
    number () {
      return this.bakedData ? this.bakedData['RM03'] : this.id.substring(7)
    },
    ready () {
      return !this.empty(this.bakedData)
    },
    storeBakedData () {
      return this.$store.getters['regcase/bakedData']
    }
  },
  watch: {
    bakedData (json) {
      !this.$utils.equal(json, this.storeBakedData) && this.$store.dispatch('regcase/update', json)
      .then((baked) => {
        this.$utils.log(baked)
      })
    }
  },
  created () {
    if (this.bakedData === undefined) {
      if (this.storeBakedData) {
        this.bakedData = this.storeBakedData
      } else {
        this.isBusy = true
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
          this.isBusy = false
        })
      }
    }
  }
}
