<template lang="pug">
b-card
  b-card-sub-title ⚠ 輸入完成請按儲存按鈕以更新資料
    //- .d-flex.align-items-center
    //-   .mr-2 {{ ownerId }}
    //-   div {{ ownerName }}
  .d-flex.mt-2
    b-input-group.mr-1(title="請輸入外國人的國籍")
      b-input-group-prepend(is-text) 外國人的國籍
      b-input(
        v-model="nation",
        placeholder="e.g. 美國",
        :state="isNationValid",
        trim
      )
    b-input-group(title="回復或歸化本國籍日期")
      b-input-group-prepend(is-text) 回復或歸化日
      b-input(
        v-model="restore_local_date",
        placeholder="... 回復或歸化本國籍日期 ...",
        :state="isRestoreLocalDateValid"
        trim
      )
  .d-flex.mt-2
    b-input-group.mr-1(title="請輸入繼承登記日期")
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
    b-input-group.mr-1(title="請輸入移請國產署標售日期")
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
    b-input-group.mr-1(title="移轉本國人之登記日期")
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
    b-input-group
      b-input-group-prepend(is-text) &emsp;&emsp;&emsp;&emsp;備註
      b-textarea(
        v-model="note",
        placeholder="... 其他註記事項 ..."
      )
  .d-flex.justify-content-center.mt-2
    lah-button.mr-1(
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
    nation: '',
    reg_date: '',
    reg_caseno: '',
    transfer_date: '',
    transfer_caseno: '',
    transfer_local_date: '',
    transfer_local_principle: '',
    restore_local_date: '',
    use_partition: '',
    note: ''
  }),
  computed: {
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
    note (dontcare) {
      this.$emit('update', this.updateData)
    }
  },
  created () {
    this.nation = this.origData.RESTRICTION_DATA.nation
    this.reg_date = this.origData.RESTRICTION_DATA.reg_date
    this.reg_caseno = this.origData.RESTRICTION_DATA.reg_caseno
    this.transfer_date = this.origData.RESTRICTION_DATA.transfer_date
    this.transfer_caseno = this.origData.RESTRICTION_DATA.transfer_caseno
    this.transfer_local_date = this.origData.RESTRICTION_DATA.transfer_local_date
    this.transfer_local_principle = this.origData.RESTRICTION_DATA.transfer_local_principle
    this.restore_local_date = this.origData.RESTRICTION_DATA.restore_local_date
    this.use_partition = this.origData.RESTRICTION_DATA.use_partition
    this.note = this.origData.RESTRICTION_DATA.note
  },
  mounted () {},
  methods: {
    save () {
      this.confirm('確認更新資料?').then((YN) => {
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
