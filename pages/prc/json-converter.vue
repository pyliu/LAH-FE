<template lang="pug">
div
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 實價登錄JSON資料解析
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 請參照下列步驟操作
          ol
            li 上傳地政司端下載的JSON檔案後自動顯示處理後的表格資料
            li 利用 #[lah-fa-icon(icon="file-excel" regular variant="success" no-gutter)] 將顯示資料匯出為EXCEL檔案

      .d-flex
        lah-button-xlsx.ml-1(
          :jsons="xlsxData",
          header="實價登錄JSON檔案轉換"
        )
  .d-flex.mb-1
    .d-flex.flex-nowrap.mr-auto
      b-file.fixed-width.mr-1(
        v-model="file",
        accept="application/json",
        placeholder="請選擇JSON檔案",
        browse-text="瀏覽"
      )
        template(slot="file-name" slot-scope="{ names }")
          b-badge(variant="dark") {{ names[0] }}
          b-badge(v-if="names.length > 1" variant="dark" class="ml-1").
            + {{ names.length - 1 }} 更多檔案
      lah-button(
        v-if="file !== null"
        icon="trash",
        title="清除選擇",
        variant="outline-success",
        @click="file = null",
        no-icon-gutter
      )
      .d-flex.my-auto.text-nowrap
        b-checkbox.mx-2(v-model="display.main") 主要
        b-checkbox(v-model="display.land") 土地
        b-checkbox.mx-2(v-model="display.build") 建物
        b-checkbox(v-model="display.car") 車位

  lah-transition: .my-2(v-if="!$utils.empty(mainData) && display.main")
    h5 主要資料
    //- lah-val-b-table(
    //-   :ref-id="carData",
    //-   :busy="isBusy",
    //-   :items="mainData",
    //-   :fields="mainFields"
    //- )
    h6.my-2 基本資料
    lah-val-b-table(
      :busy="isBusy",
      :items="mainData",
      ref-id="basicData",
      :fields="basicFields"
    )
    h6.my-2 不動產經紀業資料
    lah-val-b-table(
      :busy="isBusy",
      :items="mainData",
      ref-id="agentData",
      :fields="agentFields"
    )
    h6.my-2 交易建物資料
    lah-val-b-table(
      :busy="isBusy",
      :items="mainData",
      ref-id="buildingData",
      :fields="buildingFields"
    )
    h6.my-2 室內格局資料
    lah-val-b-table(
      :busy="isBusy",
      :items="mainData",
      ref-id="interiorData",
      :fields="interiorFields"
    )
    h6.my-2 交易資料
    lah-val-b-table(
      :busy="isBusy",
      :items="mainData",
      ref-id="dealData",
      :fields="dealFields"
    )
    h6.my-2 價格資料
    lah-val-b-table(
      :busy="isBusy",
      :items="mainData",
      ref-id="priceData",
      :fields="priceFields"
    )

  lah-transition: .my-2(v-if="!$utils.empty(landData) && display.land")
    h5 土地資料
    lah-val-b-table(
      :ref-id="carData",
      :busy="isBusy",
      :items="landData",
      :fields="landFields"
    )

  lah-transition: .my-2(v-if="!$utils.empty(buildData) && display.build")
    h5 建物資料
    lah-val-b-table(
      :ref-id="carData",
      :busy="isBusy",
      :items="buildData",
      :fields="buildFields"
    )

  lah-transition: div(v-if="!$utils.empty(carData) && display.car")
    h5 停車位資料
    lah-val-b-table(
      :ref-id="carData",
      :busy="isBusy",
      :items="carData",
      :fields="carFields"
    )
</template>

<script>
export default {
  data: () => ({
    prefix: 'ZWw1MDEw',
    landPostfix: 'MQ==',
    buildingPostfix: 'Mg==',
    parkingPostfix: 'Mw==',
    display: {
      main: true,
      land: true,
      build: true,
      car: true
    },
    file: null,
    jsonData: null
  }),
  fetch () {},
  head: {
    title: '實價登錄案件資料轉換-桃園市地政局'
  },
  computed: {
    md5Hash () {
      return this.$utils.md5(`${this.startDate}_${this.endDate}`)
    },
    cacheKey () {
      return `realprice_json_convert_${this.md5Hash}`
    },
    xlsxData () {
      return this.prepareFormattedJson()
    },
    basicFields () {
      return [
        {
          key: 'case_no',
          label: '申報序號',
          sort: true
        },
        {
          key: 'apply_no',
          label: '備查序號',
          sort: true
        },
        {
          key: 'case_kind',
          label: '案件種類',
          sort: true
        },
        {
          key: 'p1ma_date',
          label: '交易日期',
          sort: true
        },
        {
          key: 'p1ma_note',
          label: '其他備註',
          sort: true
        }
      ]
    },
    dealFields () {
      return [
        {
          key: 'p1ma_cntalid',
          label: '土地筆數',
          sort: true
        },
        {
          key: 'p1ma_cntdbid',
          label: '建物棟數',
          sort: true
        },
        {
          key: 'p1ma_cntpark',
          label: '車位個數',
          sort: true
        },
        {
          key: 'p1ma_topprice',
          label: '總價',
          sort: true
        },
        {
          key: 'p1ma_alidprice',
          label: '土地價格',
          sort: true
        },
        {
          key: 'p1ma_dbidprice',
          label: '建物價格',
          sort: true
        },
        {
          key: 'p1ma_parkprice',
          label: '車位價格',
          sort: true
        },
        {
          key: 'p1ma_parkflad',
          label: '車位單獨計價',
          sort: true
        }
      ]
    },
    priceFields () {
      return [
        {
          key: 'p1sp_price0101',
          label: '裝潢費',
          sort: true
        },
        {
          key: 'p1sp_price0102',
          label: '家俱費',
          sort: true
        },
        {
          key: 'p1sp_price0106',
          label: '其他費',
          sort: true
        },
        {
          key: 'p1sp_code0201',
          label: '親友交易',
          sort: true
        },
        {
          key: 'p1sp_code0202',
          label: '合建',
          sort: true
        },
        {
          key: 'p1sp_code0501',
          label: '急買急賣',
          sort: true
        },
        {
          key: 'p1sp_code0502',
          label: '民情風俗',
          sort: true
        },
        {
          key: 'p1sp_code0512',
          label: '期待因素',
          sort: true
        },
        {
          key: 'p1sp_code0509',
          label: '債務',
          sort: true
        },
        {
          key: 'p1sp_code0602',
          label: '地上權',
          sort: true
        },
        {
          key: 'p1sp_code0505',
          label: '毛胚屋',
          sort: true
        },
        {
          key: 'p1sp_desc1301',
          label: '解約原序號',
          sort: true
        },
        {
          key: 'p1sp_desc1401',
          label: '其他買受人',
          sort: true
        }
      ]
    },
    interiorFields () {
      return [
        {
          key: 'p1ma_build7c',
          label: '使用別',
          sort: true
        },
        {
          key: 'p1ma_build5c',
          label: '建物別',
          sort: true
        },
        {
          key: 'p1ma_build8c',
          label: '建築別',
          sort: true
        },
        {
          key: 'p1ma_build1',
          label: '房間',
          sort: true
        },
        {
          key: 'p1ma_build2',
          label: '廳室',
          sort: true
        },
        {
          key: 'p1ma_build3',
          label: '衛浴',
          sort: true
        },
        {
          key: 'p1ma_build4',
          label: '隔間',
          sort: true
        }
      ]
    },
    buildingFields () {
      return [
        {
          key: 'p1ma_dd09',
          label: '交易標的興建位置',
          sort: true
        },
        {
          key: 'p1ma_typeB_1',
          label: '建案名稱',
          sort: true
        },
        {
          key: 'p1ma_typeB_2',
          label: '起造人',
          sort: true
        },
        {
          key: 'p1ma_typeB_3',
          label: '建照字號',
          sort: true
        },
        {
          key: 'p1ma_typeB_4',
          label: '建照核發日',
          sort: true
        },
        {
          key: 'p1ma_typeB_5',
          label: '棟別',
          sort: true
        },
        {
          key: 'p1ma_typeB_6',
          label: '號',
          sort: true
        },
        {
          key: 'p1ma_build9',
          label: '總樓層',
          sort: true
        },
        {
          key: 'p1ma_build10_1',
          label: '交易樓層',
          sort: true
        }
      ]
    },
    agentFields () {
      return [
        {
          key: 'apply_name',
          label: '不動產經紀業名稱',
          sort: true
        },
        {
          key: 'apply_idNo',
          label: '不動產經紀業ID',
          sort: true
        },
        {
          key: 'apply_tel',
          label: '不動產經紀業電話',
          sort: true
        },
        {
          key: 'agents_name',
          label: '不動產經紀業代理人',
          sort: true
        },
        {
          key: 'agents_idNo',
          label: '不動產經紀業代理人ID',
          sort: true
        },
        {
          key: 'agents_tel',
          label: '不動產經紀業代理人電話',
          sort: true
        },
        {
          key: 'right_name',
          label: '買受人',
          sort: true
        },
        {
          key: 'right_idNo',
          label: '買受人ID',
          sort: true
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
          sort: true
        },
        {
          key: 'apply_no',
          label: '備查序號',
          sort: true
        },
        {
          key: 'case_kind',
          label: '案件種類',
          sort: true
        },
        {
          key: 'apply_name',
          label: '不動產經紀業名稱',
          sort: true
        },
        {
          key: 'apply_idNo',
          label: '不動產經紀業ID',
          sort: true
        },
        {
          key: 'apply_tel',
          label: '不動產經紀業電話',
          sort: true
        },
        {
          key: 'agents_name',
          label: '不動產經紀業代理人',
          sort: true
        },
        {
          key: 'agents_idNo',
          label: '不動產經紀業代理人ID',
          sort: true
        },
        {
          key: 'agents_tel',
          label: '不動產經紀業代理人電話',
          sort: true
        },
        {
          key: 'right_name',
          label: '買受人',
          sort: true
        },
        {
          key: 'right_idNo',
          label: '買受人ID',
          sort: true
        },
        {
          key: 'p1ma_dd09',
          label: '交易標的興建位置',
          sort: true
        },
        {
          key: 'p1ma_typeB_1',
          label: '建案名稱',
          sort: true
        },
        {
          key: 'p1ma_typeB_2',
          label: '起造人',
          sort: true
        },
        {
          key: 'p1ma_typeB_3',
          label: '建照字號',
          sort: true
        },
        {
          key: 'p1ma_typeB_4',
          label: '建照核發日',
          sort: true
        },
        {
          key: 'p1ma_typeB_5',
          label: '棟別',
          sort: true
        },
        {
          key: 'p1ma_typeB_6',
          label: '號',
          sort: true
        },
        {
          key: 'p1ma_build10_1',
          label: '交易樓層',
          sort: true
        },
        {
          key: 'p1ma_build9',
          label: '總樓層',
          sort: true
        },
        {
          key: 'p1ma_build7c',
          label: '使用別',
          sort: true
        },
        {
          key: 'p1ma_build5c',
          label: '建物別',
          sort: true
        },
        {
          key: 'p1ma_build8c',
          label: '建築別',
          sort: true
        },
        {
          key: 'p1ma_build1',
          label: '房間',
          sort: true
        },
        {
          key: 'p1ma_build2',
          label: '廳室',
          sort: true
        },
        {
          key: 'p1ma_build3',
          label: '衛浴',
          sort: true
        },
        {
          key: 'p1ma_build4',
          label: '隔間',
          sort: true
        },
        {
          key: 'p1ma_date',
          label: '交易日期',
          sort: true
        },
        {
          key: 'p1ma_cntalid',
          label: '土地筆數',
          sort: true
        },
        {
          key: 'p1ma_cntdbid',
          label: '建物棟數',
          sort: true
        },
        {
          key: 'p1ma_cntpark',
          label: '車位個數',
          sort: true
        },
        {
          key: 'p1ma_topprice',
          label: '總價',
          sort: true
        },
        {
          key: 'p1ma_alidprice',
          label: '土地價格',
          sort: true
        },
        {
          key: 'p1ma_dbidprice',
          label: '建物價格',
          sort: true
        },
        {
          key: 'p1ma_parkprice',
          label: '車位價格',
          sort: true
        },
        {
          key: 'p1ma_parkflad',
          label: '車位單獨計價',
          sort: true
        },
        {
          key: 'p1ma_note',
          label: '其他備註',
          sort: true
        },
        {
          key: 'p1sp_price0101',
          label: '裝潢費',
          sort: true
        },
        {
          key: 'p1sp_price0102',
          label: '家俱費',
          sort: true
        },
        {
          key: 'p1sp_price0106',
          label: '其他費',
          sort: true
        },
        {
          key: 'p1sp_code0201',
          label: '親友交易',
          sort: true
        },
        {
          key: 'p1sp_code0202',
          label: '合建',
          sort: true
        },
        {
          key: 'p1sp_code0501',
          label: '急買急賣',
          sort: true
        },
        {
          key: 'p1sp_code0502',
          label: '民情風俗',
          sort: true
        },
        {
          key: 'p1sp_code0512',
          label: '期待因素',
          sort: true
        },
        {
          key: 'p1sp_code0509',
          label: '債務',
          sort: true
        },
        {
          key: 'p1sp_code0602',
          label: '地上權',
          sort: true
        },
        {
          key: 'p1sp_code0505',
          label: '毛胚屋',
          sort: true
        },
        {
          key: 'p1sp_desc1301',
          label: '解約原序號',
          sort: true
        },
        {
          key: 'p1sp_desc1401',
          label: '其他買受人',
          sort: true
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
          sort: true
        },
        {
          key: 'land_no',
          label: '地號',
          sort: true
        },
        {
          key: 'land_area',
          label: '土地面積',
          sort: true
        },
        {
          key: 'land_rightc',
          label: '權利範圍',
          sort: true
        },
        {
          key: 'land_rightDeno',
          label: '分子',
          sort: true
        },
        {
          key: 'land_rightNume',
          label: '分母',
          sort: true
        },
        {
          key: 'land_usec',
          label: '分區',
          sort: true
        },
        {
          key: 'land_useText',
          label: '次類別',
          sort: true
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
          sort: true
        },
        {
          key: 'build_areaB',
          label: '陽台面積',
          sort: true
        },
        {
          key: 'build_areaE',
          label: '屋簷面積',
          sort: true
        },
        {
          key: 'build_areaU',
          label: '雨遮面積',
          sort: true
        },
        {
          key: 'build_areaP',
          label: '共有面積',
          sort: true
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
          sort: true
        },
        {
          key: 'car_price',
          label: '車位價格',
          sort: true
        },
        {
          key: 'car_area',
          label: '車位面積',
          sort: true
        },
        {
          key: 'car_floorc',
          label: '所在樓層',
          sort: true
        }
      ]
    }
  },
  watch: {
    async file (val) {
      try {
        if (val) {
          const text = await val.text()
          this.jsonData = { ...JSON.parse(text) }
        } else {
          this.clear()
        }
      } catch (e) {
        this.alert(e.message)
        this.$utils.error(e)
      }
    },
    jsonData (val) {
      console.warn(val)
    }
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 145)
  },
  methods: {
    show () {},
    clear () {
      this.file = null
      this.jsonData = null
    },
    clearCache () {
      this.removeCache(this.cacheKey)
    },
    loaded () {
      this.isBusy = false
    },
    prepareFormattedJson () {
      return []
    }
  }
}
</script>

<style lang="scss" scoped>
.fixed-width {
  max-width: 25vw;
}
</style>
