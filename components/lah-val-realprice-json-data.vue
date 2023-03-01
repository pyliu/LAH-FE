<template lang="pug">
div
  .d-flex.justify-content-end.my-auto.align-items-center.text-nowrap
    lah-fa-icon.mr-1.my-auto(icon="palette") 醒目
    b-checkbox.mx-2(v-model="display.dark", switch)
    lah-fa-icon.mr-1.my-auto(icon="display") 篩選
    b-checkbox.mx-2(v-model="display.main") 主要
    b-checkbox(v-model="display.land") 土地
    b-checkbox.mx-2(v-model="display.build") 建物
    b-checkbox(v-model="display.car") 車位
  lah-transition: .my-2(v-if="!$utils.empty(mainData) && display.main")
    h5 主要資料
    .ml-3
      h6.my-2 - 基本資料
      lah-val-b-table(
        ref="basicData"
        :head-variant="headVariant",
        :busy="isBusy",
        :items="mainData",
        :fields="basicFields"
      )
      h6.my-2 - 不動產經紀業資料
      lah-val-b-table(
        ref="agentData"
        :head-variant="headVariant",
        :busy="isBusy",
        :items="mainData",
        :fields="agentFields"
      )
      h6.my-2 - 交易建物資料
      lah-val-b-table(
        ref="buildingData"
        :head-variant="headVariant",
        :busy="isBusy",
        :items="mainData",
        :fields="buildingFields"
      )
      h6.my-2 - 室內格局資料
      lah-val-b-table(
        ref="interiorData"
        :head-variant="headVariant",
        :busy="isBusy",
        :items="mainData",
        :fields="interiorFields"
      )
      h6.my-2 - 交易資料
      lah-val-b-table(
        ref="dealData"
        :head-variant="headVariant",
        :busy="isBusy",
        :items="mainData",
        :fields="dealFields"
      )
      h6.my-2 - 價格資料
      lah-val-b-table(
        ref="priceData"
        :head-variant="headVariant",
        :busy="isBusy",
        :items="mainData",
        :fields="priceFields"
      )

  lah-transition: .my-2(v-if="!$utils.empty(landData) && display.land")
    h5 土地資料
    lah-val-b-table(
      ref="landData"
      :head-variant="headVariant",
      :busy="isBusy",
      :items="landData",
      :fields="landFields"
    )

  lah-transition: .my-2(v-if="!$utils.empty(buildData) && display.build")
    h5 建物資料
    lah-val-b-table(
      ref="buildData"
      :head-variant="headVariant",
      :busy="isBusy",
      :items="buildData",
      :fields="buildFields"
    )

  lah-transition: div(v-if="!$utils.empty(carData) && display.car")
    h5 停車位資料
    lah-val-b-table(
      ref="carData"
      :head-variant="headVariant",
      :busy="isBusy",
      :items="carData",
      :fields="carFields"
    )
</template>

<script>
export default {
  props: {
    jsonData: { type: Object, default: null, require: true }
  },
  data: () => ({
    prefix: 'ZWw1MDEw',
    landPostfix: 'MQ==',
    buildingPostfix: 'Mg==',
    parkingPostfix: 'Mw==',
    display: {
      main: true,
      land: true,
      build: true,
      car: true,
      dark: false
    },
    file: null
  }),
  computed: {
    headVariant () {
      return this.display.dark ? 'light' : 'dark'
    },
    basicFields () {
      return [
        {
          key: 'case_no',
          label: '申報序號',
          sortable: true
        },
        {
          key: 'apply_no',
          label: '備查序號',
          sortable: true
        },
        {
          key: 'case_kind',
          label: '案件種類',
          sortable: true
        },
        {
          key: 'p1ma_date',
          label: '交易日期',
          sortable: true
        },
        {
          key: 'p1ma_note',
          label: '其他備註',
          sortable: true
        }
      ]
    },
    dealFields () {
      return [
        {
          key: 'p1ma_cntalid',
          label: '土地筆數',
          sortable: true
        },
        {
          key: 'p1ma_cntdbid',
          label: '建物棟數',
          sortable: true
        },
        {
          key: 'p1ma_cntpark',
          label: '車位個數',
          sortable: true
        },
        {
          key: 'p1ma_topprice',
          label: '總價',
          sortable: true
        },
        {
          key: 'p1ma_alidprice',
          label: '土地價格',
          sortable: true
        },
        {
          key: 'p1ma_dbidprice',
          label: '建物價格',
          sortable: true
        },
        {
          key: 'p1ma_parkprice',
          label: '車位價格',
          sortable: true
        },
        {
          key: 'p1ma_parkflag',
          label: '車位備註',
          sortable: true
        }
      ]
    },
    priceFields () {
      return [
        {
          key: 'p1sp_price0101',
          label: '裝潢費',
          sortable: true
        },
        {
          key: 'p1sp_price0102',
          label: '家俱費',
          sortable: true
        },
        {
          key: 'p1sp_price0106',
          label: '其他費',
          sortable: true
        },
        {
          key: 'p1sp_code0201',
          label: '親友交易',
          sortable: true
        },
        {
          key: 'p1sp_code0202',
          label: '合建',
          sortable: true
        },
        {
          key: 'p1sp_code0501',
          label: '急買急賣',
          sortable: true
        },
        {
          key: 'p1sp_code0502',
          label: '民情風俗',
          sortable: true
        },
        {
          key: 'p1sp_code0512',
          label: '期待因素',
          sortable: true
        },
        {
          key: 'p1sp_code0509',
          label: '債務',
          sortable: true
        },
        {
          key: 'p1sp_code0602',
          label: '地上權',
          sortable: true
        },
        {
          key: 'p1sp_code0505',
          label: '毛胚屋',
          sortable: true
        },
        {
          key: 'p1sp_desc1301',
          label: '解約原序號',
          sortable: true
        },
        {
          key: 'p1sp_desc1401',
          label: '其他買受人',
          sortable: true
        }
      ]
    },
    interiorFields () {
      return [
        {
          key: 'p1ma_build7c',
          label: '使用別',
          sortable: true
        },
        {
          key: 'p1ma_build5c',
          label: '建物別',
          sortable: true
        },
        {
          key: 'p1ma_build8c',
          label: '建築別',
          sortable: true
        },
        {
          key: 'p1ma_build1',
          label: '房間',
          sortable: true
        },
        {
          key: 'p1ma_build2',
          label: '廳室',
          sortable: true
        },
        {
          key: 'p1ma_build3',
          label: '衛浴',
          sortable: true
        },
        {
          key: 'p1ma_build4',
          label: '隔間',
          sortable: true
        }
      ]
    },
    buildingFields () {
      return [
        {
          key: 'p1ma_dd09',
          label: '交易標的興建位置',
          sortable: true
        },
        {
          key: 'p1ma_typeB_1',
          label: '建案名稱',
          sortable: true
        },
        {
          key: 'p1ma_typeB_2',
          label: '起造人',
          sortable: true
        },
        {
          key: 'p1ma_typeB_3',
          label: '建照字號',
          sortable: true
        },
        {
          key: 'p1ma_typeB_4',
          label: '建照核發日',
          sortable: true
        },
        {
          key: 'p1ma_typeB_5',
          label: '棟別',
          sortable: true
        },
        {
          key: 'p1ma_typeB_6',
          label: '號',
          sortable: true
        },
        {
          key: 'p1ma_build9',
          label: '總樓層',
          sortable: true
        },
        {
          key: 'p1ma_build10_1',
          label: '交易樓層',
          sortable: true
        }
      ]
    },
    agentFields () {
      return [
        {
          key: 'apply_name',
          label: '不動產經紀業名稱',
          sortable: true
        },
        {
          key: 'apply_idNo',
          label: '不動產經紀業ID',
          sortable: true
        },
        {
          key: 'apply_tel',
          label: '不動產經紀業電話',
          sortable: true
        },
        {
          key: 'agents_name',
          label: '不動產經紀業代理人',
          sortable: true
        },
        {
          key: 'agents_idNo',
          label: '不動產經紀業代理人ID',
          sortable: true
        },
        {
          key: 'agents_tel',
          label: '不動產經紀業代理人電話',
          sortable: true
        },
        {
          key: 'right_name',
          label: '買受人',
          sortable: true
        },
        {
          key: 'right_idNo',
          label: '買受人ID',
          sortable: true
        }
      ]
    },
    mainData () {
      return this.jsonData ? [this.jsonData[this.prefix]] : undefined
    },
    mainFields () {
      return [
        {
          key: 'case_no',
          label: '申報序號',
          sortable: true
        },
        {
          key: 'apply_no',
          label: '備查序號',
          sortable: true
        },
        {
          key: 'case_kind',
          label: '案件種類',
          sortable: true
        },
        {
          key: 'apply_name',
          label: '不動產經紀業名稱',
          sortable: true
        },
        {
          key: 'apply_idNo',
          label: '不動產經紀業ID',
          sortable: true
        },
        {
          key: 'apply_tel',
          label: '不動產經紀業電話',
          sortable: true
        },
        {
          key: 'agents_name',
          label: '不動產經紀業代理人',
          sortable: true
        },
        {
          key: 'agents_idNo',
          label: '不動產經紀業代理人ID',
          sortable: true
        },
        {
          key: 'agents_tel',
          label: '不動產經紀業代理人電話',
          sortable: true
        },
        {
          key: 'right_name',
          label: '買受人',
          sortable: true
        },
        {
          key: 'right_idNo',
          label: '買受人ID',
          sortable: true
        },
        {
          key: 'p1ma_dd09',
          label: '交易標的興建位置',
          sortable: true
        },
        {
          key: 'p1ma_typeB_1',
          label: '建案名稱',
          sortable: true
        },
        {
          key: 'p1ma_typeB_2',
          label: '起造人',
          sortable: true
        },
        {
          key: 'p1ma_typeB_3',
          label: '建照字號',
          sortable: true
        },
        {
          key: 'p1ma_typeB_4',
          label: '建照核發日',
          sortable: true
        },
        {
          key: 'p1ma_typeB_5',
          label: '棟別',
          sortable: true
        },
        {
          key: 'p1ma_typeB_6',
          label: '號',
          sortable: true
        },
        {
          key: 'p1ma_build10_1',
          label: '交易樓層',
          sortable: true
        },
        {
          key: 'p1ma_build9',
          label: '總樓層',
          sortable: true
        },
        {
          key: 'p1ma_build7c',
          label: '使用別',
          sortable: true
        },
        {
          key: 'p1ma_build5c',
          label: '建物別',
          sortable: true
        },
        {
          key: 'p1ma_build8c',
          label: '建築別',
          sortable: true
        },
        {
          key: 'p1ma_build1',
          label: '房間',
          sortable: true
        },
        {
          key: 'p1ma_build2',
          label: '廳室',
          sortable: true
        },
        {
          key: 'p1ma_build3',
          label: '衛浴',
          sortable: true
        },
        {
          key: 'p1ma_build4',
          label: '隔間',
          sortable: true
        },
        {
          key: 'p1ma_date',
          label: '交易日期',
          sortable: true
        },
        {
          key: 'p1ma_cntalid',
          label: '土地筆數',
          sortable: true
        },
        {
          key: 'p1ma_cntdbid',
          label: '建物棟數',
          sortable: true
        },
        {
          key: 'p1ma_cntpark',
          label: '車位個數',
          sortable: true
        },
        {
          key: 'p1ma_topprice',
          label: '總價',
          sortable: true
        },
        {
          key: 'p1ma_alidprice',
          label: '土地價格',
          sortable: true
        },
        {
          key: 'p1ma_dbidprice',
          label: '建物價格',
          sortable: true
        },
        {
          key: 'p1ma_parkprice',
          label: '車位價格',
          sortable: true
        },
        {
          key: 'p1ma_parkflag',
          label: '車位單獨計價',
          sortable: true
        },
        {
          key: 'p1ma_note',
          label: '其他備註',
          sortable: true
        },
        {
          key: 'p1sp_price0101',
          label: '裝潢費',
          sortable: true
        },
        {
          key: 'p1sp_price0102',
          label: '家俱費',
          sortable: true
        },
        {
          key: 'p1sp_price0106',
          label: '其他費',
          sortable: true
        },
        {
          key: 'p1sp_code0201',
          label: '親友交易',
          sortable: true
        },
        {
          key: 'p1sp_code0202',
          label: '合建',
          sortable: true
        },
        {
          key: 'p1sp_code0501',
          label: '急買急賣',
          sortable: true
        },
        {
          key: 'p1sp_code0502',
          label: '民情風俗',
          sortable: true
        },
        {
          key: 'p1sp_code0512',
          label: '期待因素',
          sortable: true
        },
        {
          key: 'p1sp_code0509',
          label: '債務',
          sortable: true
        },
        {
          key: 'p1sp_code0602',
          label: '地上權',
          sortable: true
        },
        {
          key: 'p1sp_code0505',
          label: '毛胚屋',
          sortable: true
        },
        {
          key: 'p1sp_desc1301',
          label: '解約原序號',
          sortable: true
        },
        {
          key: 'p1sp_desc1401',
          label: '其他買受人',
          sortable: true
        }
      ]
    },
    landData () {
      return this.jsonData ? this.jsonData[`${this.prefix}${this.landPostfix}`] : undefined
    },
    landFields () {
      return [
        {
          key: 'land_x48c',
          label: '地段',
          sortable: true
        },
        {
          key: 'land_no',
          label: '地號',
          sortable: true
        },
        {
          key: 'land_area',
          label: '土地面積',
          sortable: true
        },
        {
          key: 'land_rightc',
          label: '權利範圍',
          sortable: true
        },
        {
          key: 'land_rightDeno',
          label: '分子',
          sortable: true
        },
        {
          key: 'land_rightNume',
          label: '分母',
          sortable: true
        },
        {
          key: 'land_usec',
          label: '分區',
          sortable: true
        },
        {
          key: 'land_useText',
          label: '次類別',
          sortable: true
        }
      ]
    },
    buildData () {
      return this.jsonData ? this.jsonData[`${this.prefix}${this.buildingPostfix}`] : undefined
    },
    buildFields () {
      return [
        {
          key: 'build_areaM',
          label: '主建物面積',
          sortable: true
        },
        {
          key: 'build_areaB',
          label: '陽台面積',
          sortable: true
        },
        {
          key: 'build_areaE',
          label: '屋簷面積',
          sortable: true
        },
        {
          key: 'build_areaU',
          label: '雨遮面積',
          sortable: true
        },
        {
          key: 'build_areaP',
          label: '共有面積',
          sortable: true
        }
      ]
    },
    carData () {
      return this.jsonData ? this.jsonData[`${this.prefix}${this.parkingPostfix}`] : undefined
    },
    carFields () {
      return [
        {
          key: 'car_typec',
          label: '車位類別',
          sortable: true
        },
        {
          key: 'car_price',
          label: '車位價格',
          sortable: true
        },
        {
          key: 'car_area',
          label: '車位面積',
          sortable: true
        },
        {
          key: 'car_floorc',
          label: '所在樓層',
          sortable: true
        }
      ]
    }
  },
  watch: {
    'display.dark' (val) {
      this.setCache('val.realprice.json.data.display.dark', val)
    }
  },
  mounted () {
    this.$refs.basicData?.selectAllRows()
    this.$refs.agentData?.selectAllRows()
    this.$refs.buildingData?.selectAllRows()
    this.$refs.interiorData?.selectAllRows()
    this.$refs.dealData?.selectAllRows()
    this.$refs.priceData?.selectAllRows()
    this.$refs.landData?.selectAllRows()
    this.$refs.buildData?.selectAllRows()
    this.$refs.carData?.selectAllRows()
    this.getCache('val.realprice.json.data.display.dark').then((flag) => {
      this.display.dark = flag
    })
  },
  methods: {}
}
</script>

<style lang="scss" scoped>
</style>
