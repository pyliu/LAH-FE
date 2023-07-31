<template lang="pug">
b-card
  //- b-card-sub-title ⚠ 輸入完成請按儲存按鈕以更新資料
    //- .d-flex.align-items-center
    //-   .mr-2 {{ ownerId }}
    //-   div {{ ownerName }}
  .d-flex.mt-2
    b-input-group.mr-2(title="請選取土地使用分區")
      b-input-group-prepend(is-text) 土地使用分區
      b-select(
        v-model="use_partition",
        :options="useZoneOpts"
      )
    b-input-group(title="請輸入外國人的國籍")
      b-input-group-prepend(is-text) 外國人的國籍
      b-input(
        v-model="nation",
        placeholder="e.g. 美國",
        :state="isNationValid",
        trim
      )
  .d-flex.mt-2
    b-input-group.mr-2(title="請輸入繼承登記日期")
      b-input-group-prepend(is-text) 繼承登記日期
      b-input(
        v-model="reg_date",
        placeholder="e.g. 1070930",
        :state="isRegDateValid",
        trim
      )
    b-input-group(title="請輸入登記收件字號")
      b-input-group-prepend(is-text) 登記收件字號
      b-input(
        v-model="reg_caseno",
        placeholder="e.g. 107桃資登字第146320號",
        :state="isRegCasenoValid",
        trim
      )
  .d-flex.mt-2
    b-input-group.mr-2(title="請輸入移請國產署標售日期")
      b-input-group-prepend(is-text) 轉國產署日期
      b-input(
        v-model="transfer_date",
        placeholder="e.g. 1100917",
        :state="isTransferDateValid",
        trim
      )
    b-input-group(title="請輸入移請國產署標售文號")
      b-input-group-prepend(is-text) 轉國產署文號
      b-input(
        v-model="transfer_caseno",
        placeholder="e.g. 110桃地籍字第1100050865號",
        :state="isTransferCasenoValid",
        trim
      )
  .d-flex.mt-2
    b-input-group.mr-2(title="移轉本國人之登記日期")
      b-input-group-prepend(is-text) 轉本國人日期
      b-input(
        v-model="transfer_local_date",
        placeholder="... 移轉本國人之登記日期 ...",
        :state="isTransferLocalDateValid"
        trim
      )
    b-input-group(title="移轉本國人之登記原則")
      b-input-group-prepend(is-text) 轉本國人原則
      b-input(
        v-model="transfer_local_principle",
        placeholder="... 移轉本國人之登記原則 ...",
        trim
      )
  .d-flex.mt-2
    b-input-group.mr-2(title="回復或歸化本國籍日期")
      b-input-group-prepend(is-text) 回復或歸化日
      b-input.h-100(
        v-model="restore_local_date",
        placeholder="... 回復或歸化本國籍日期 ...",
        :state="isRestoreLocalDateValid"
        trim
      )
    b-input-group
      b-input-group-prepend(is-text) 備註
      b-textarea(
        v-model="note",
        placeholder="... 其他註記事項 ..."
      )
  .d-flex.justify-content-between.mt-2
    b-checkbox(v-model="control") 依土地法第17條第1項各款或各款以外規定管制
    b-checkbox(v-model="logout") 註銷
  .d-flex.justify-content-center.mt-2
    lah-button(
      icon="floppy-disk",
      size="lg",
      @click="save"
    ) 儲存
    //- lah-button(
    //-   size="lg",
    //-   variant="outline-muted"
    //- ) 取消
</template>

<script>
export default {
  emit: ['update', 'saved'],
  component: {},
  props: {
    origData: { type: Object, default: () => ({}) }
  },
  data: () => ({
    useZoneCacheKey: 'foreigner-inheritance-restriction-use-zone',
    useZoneData: [],
    nation: '',
    reg_date: '',
    reg_caseno: '',
    transfer_date: '',
    transfer_caseno: '',
    transfer_local_date: '',
    transfer_local_principle: '',
    restore_local_date: '',
    use_partition: '',
    logout: '',
    control: '',
    note: ''
  }),
  computed: {
    useZoneOpts () {
      // return this.useZoneData.filter(element => element.KRMK === '1').map((element, idx, arr) => {
      return this.useZoneData.map((element, idx, arr) => {
        return {
          text: element.KCNT,
          value: element.KCNT
        }
      })
    },
    certNo () {
      return this.origData.RESTRICTION_DATA.cert_no || this.origData.BB16
    },
    ownerId () {
      return this.origData.BB09
    },
    ownerName () {
      return this.origData.BB09_CHT
    },
    isNationValid () {
      if (this.$utils.empty(this.nation)) {
        return null
      }
      return !this.$utils.empty(this.nation)
    },
    isRegDateValid () {
      if (this.$utils.empty(this.reg_date)) {
        return null
      }
      return !isNaN(this.reg_date) &&
             this.reg_date?.length === 7
    },
    isRegCasenoValid () {
      if (this.$utils.empty(this.reg_caseno)) {
        return null
      }
      return !this.$utils.empty(this.reg_caseno)
    },
    isTransferDateValid () {
      if (this.$utils.empty(this.transfer_date)) {
        return null
      }
      return !isNaN(this.transfer_date) &&
             this.transfer_date?.length === 7
    },
    isTransferCasenoValid () {
      if (this.$utils.empty(this.transfer_caseno)) {
        return null
      }
      return !this.$utils.empty(this.transfer_caseno)
    },
    isTransferLocalDateValid () {
      if (this.$utils.empty(this.transfer_local_date)) {
        return null
      }
      return !isNaN(this.transfer_local_date) &&
             this.transfer_local_date?.length === 7
    },
    isRestoreLocalDateValid () {
      if (this.$utils.empty(this.restore_local_date)) {
        return null
      }
      return !isNaN(this.restore_local_date) &&
             this.restore_local_date?.length === 7
    },
    updateData () {
      return {
        cert_no: this.certNo,
        nation: this.nation,
        reg_date: this.reg_date,
        reg_caseno: this.reg_caseno,
        transfer_date: this.transfer_date,
        transfer_caseno: this.transfer_caseno,
        transfer_local_date: this.transfer_local_date,
        transfer_local_principle: this.transfer_local_principle,
        restore_local_date: this.restore_local_date,
        use_partition: this.use_partition,
        logout: this.logout,
        control: this.control,
        note: this.note
      }
    }
  },
  watch: {
    nation (dontcare) {
      this.$emit('update', this.updateData)
    },
    reg_date (dontcare) {
      this.$emit('update', this.updateData)
    },
    reg_caseno (dontcare) {
      this.$emit('update', this.updateData)
    },
    transfer_date (dontcare) {
      this.$emit('update', this.updateData)
    },
    transfer_caseno (dontcare) {
      this.$emit('update', this.updateData)
    },
    transfer_local_date (dontcare) {
      this.$emit('update', this.updateData)
    },
    transfer_local_principle (dontcare) {
      this.$emit('update', this.updateData)
    },
    restore_local_date (dontcare) {
      this.$emit('update', this.updateData)
    },
    use_partition (dontcare) {
      this.$emit('update', this.updateData)
    },
    logout (dontcare) {
      this.$emit('update', this.updateData)
    },
    control (dontcare) {
      this.$emit('update', this.updateData)
    },
    note (dontcare) {
      this.$emit('update', this.updateData)
    }
    // useZoneData (val) {
    //   console.warn(val)
    // }
  },
  created () {
    this.prepareUseZoneCodeData()
    this.nation = this.origData.RESTRICTION_DATA.nation
    this.reg_date = this.origData.RESTRICTION_DATA.reg_date
    this.reg_caseno = this.origData.RESTRICTION_DATA.reg_caseno
    this.transfer_date = this.origData.RESTRICTION_DATA.transfer_date
    this.transfer_caseno = this.origData.RESTRICTION_DATA.transfer_caseno
    this.transfer_local_date = this.origData.RESTRICTION_DATA.transfer_local_date
    this.transfer_local_principle = this.origData.RESTRICTION_DATA.transfer_local_principle
    this.restore_local_date = this.origData.RESTRICTION_DATA.restore_local_date
    this.use_partition = this.origData.RESTRICTION_DATA.use_partition
    this.logout = this.origData.RESTRICTION_DATA.logout
    this.control = this.origData.RESTRICTION_DATA.control
    this.note = this.origData.RESTRICTION_DATA.note
  },
  mounted () {},
  methods: {
    prepareUseZoneCodeData () {
      this.getCache(this.useZoneCacheKey).then((json) => {
        if (json === false) {
          this.$axios.post(this.$consts.API.JSON.SYSTEM, {
            type: 'rkeyn_use_zone'
          }).then(({ data }) => {
            if (Array.isArray(data.raw)) {
              this.useZoneData = [...data.raw]
              // a day ms
              const cacheMs = 24 * 60 * 60 * 1000
              this.setCache(this.useZoneCacheKey, data, cacheMs)
            } else {
              this.$utils.error('無法取得使用分區代碼資料。', data)
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
          })
        } else if (Array.isArray(json.raw)) {
          this.useZoneData = [...json.raw]
          this.$utils.log('已從快取回復使用分區代碼資料。')
        } else {
          this.$utils.error('無法從快取回復使用分區代碼資料。')
        }
      })
    },
    save () {
      this.confirm('確認更新管制資料?').then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.REG, {
            type: 'edit_foreigner_data',
            data: this.updateData
          }).then(({ data }) => {
            if (this.$utils.statusCheck(data.status)) {
              this.success(data.message)
              this.$emit('saved', this.updateData)
            } else {
              this.warning(data.message)
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
