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
  .d-flex.flex-nowrap.mr-auto.mb-2
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
    lah-button.mr-1(
        v-if="file !== null"
        icon="trash",
        title="清除選擇",
        variant="outline-success",
        @click="file = null",
        no-icon-gutter
      )
    lah-transition: .text-danger.my-auto.h5(v-if="showError") ⚠️ 不是支援的JSON格式檔案(資料需有 "ZWw1MDEw" 欄位)。
  lah-transition: lah-val-realprice-json-list(
    v-if="validJsons",
    :jsons="jsons"
  )
  lah-transition: lah-val-realprice-json-data(
    v-if="validJson",
    :json-data="jsonData"
  )
</template>

<script>
import omit from 'lodash/omit'
import pick from 'lodash/pick'

export default {
  data: () => ({
    file: null,
    jsons: [],
    jsonData: null,
    mainKey: 'ZWw1MDEw', // the key in the raw data
    landPostfix: 'MQ==',
    buildingPostfix: 'Mg==',
    parkingPostfix: 'Mw==',
    concernFields: [
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
        key: 'p1ma_totprice',
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
      },
      // ZWw1MDEw MQ== 👉 土地
      {
        key: 'land_count',
        label: '土地數量',
        sortable: true
      },
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
        key: 'land_area_sum',
        label: '土地總面積',
        sortable: true
      },
      {
        key: 'land_rightc',
        label: '權利範圍',
        sortable: true
      },
      {
        key: 'land_rightv',
        label: '土地持分',
        sortable: true
      },
      {
        key: 'land_rightDeno',
        label: '持分分子',
        sortable: true
      },
      {
        key: 'land_rightNume',
        label: '持分分母',
        sortable: true
      },
      {
        key: 'land_usec',
        label: '使用分區',
        sortable: true
      },
      {
        key: 'land_useText',
        label: '次類別名稱',
        sortable: true
      },
      // ZWw1MDEw Mg== 👉 建物
      {
        key: 'build_count',
        label: '建物數量',
        sortable: true
      },
      {
        key: 'build_areaM',
        label: '主建物面積',
        sortable: true
      },
      {
        key: 'build_areaM_sum',
        label: '主建物總面積',
        sortable: true
      },
      {
        key: 'build_areaB',
        label: '陽台面積',
        sortable: true
      },
      {
        key: 'build_areaB_sum',
        label: '陽台總面積',
        sortable: true
      },
      {
        key: 'build_areaE',
        label: '屋簷面積',
        sortable: true
      },
      {
        key: 'build_areaE_sum',
        label: '屋簷總面積',
        sortable: true
      },
      {
        key: 'build_areaU',
        label: '雨遮面積',
        sortable: true
      },
      {
        key: 'build_areaU_sum',
        label: '雨遮總面積',
        sortable: true
      },
      {
        key: 'build_areaP',
        label: '共有面積',
        sortable: true
      },
      {
        key: 'build_areaP_sum',
        label: '共有總面積',
        sortable: true
      },
      // ZWw1MDEw Mw== 👉 車位
      {
        key: 'car_count',
        label: '車位數量',
        sortable: true
      },
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
        key: 'car_price_sum',
        label: '車位總價格',
        sortable: true
      },
      {
        key: 'car_area',
        label: '車位面積',
        sortable: true
      },
      {
        key: 'car_area_sum',
        label: '車位總面積',
        sortable: true
      },
      {
        key: 'car_floorc',
        label: '車位所在樓層',
        sortable: true
      }
    ],
    p1spFields: [
      'p1sp_price0101',
      'p1sp_price0102',
      'p1sp_price0106',
      'p1sp_code0201',
      'p1sp_code0202',
      'p1sp_code0501',
      'p1sp_code0502',
      'p1sp_code0512',
      'p1sp_code0509',
      'p1sp_code0602',
      'p1sp_code0505',
      'p1sp_desc1301',
      'p1sp_desc1401'
    ]
  }),
  head: {
    title: '實價登錄案件資料轉換-桃園市地政局'
  },
  computed: {
    validJsons () {
      return Array.isArray(this.jsons) && this.jsons.length > 0 && this.jsons[0][this.mainKey]
    },
    validJson () {
      return this.jsonData && this.jsonData[this.mainKey]
    },
    showError () {
      if (this.file) {
        if (this.jsons && this.jsons?.length > 0 && !this.validJsons) {
          return true
        }
        if (this.jsonData && !this.validJson) {
          return true
        }
      }
      return false
    },
    keyLabelMap () {
      const keyLabelMap = new Map()
      this.concernFields.forEach((field, idx, array) => {
        keyLabelMap.set(field.key, field.label || field.key)
      })
      return keyLabelMap
    },
    xlsxData () {
      return this.prepareFormattedJson()
    }
  },
  watch: {
    async file (val) {
      try {
        if (val) {
          const text = await val.text()
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) {
            this.jsonData = null
            this.jsons = [...parsed]
          } else {
            this.jsonData = { ...parsed }
            this.jsons = []
          }
        } else {
          this.clear()
        }
      } catch (e) {
        this.alert(e.message)
        this.$utils.error(e)
      }
    }
  },
  mounted () {
    this.calcStickyHeaderMaxHeight(145)
  },
  methods: {
    show () {},
    clear () {
      this.file = null
      this.jsonData = null
      this.jsons = []
    },
    loaded () {
      this.isBusy = false
    },
    mapFieldData (data, arrayFilter = undefined) {
      const obj = {}
      const linebreak = String.fromCharCode(10)
      // the land/build/parking data will be array
      if (Array.isArray(data)) {
        if (arrayFilter === 'land') {
          data = data.reduce((acc, item, index, arr) => {
            acc.land_count++
            acc.land_x48c = this.$utils.empty(acc.land_x48c) ? item.land_x48c : `${acc.land_x48c}${linebreak}${item.land_x48c}`
            acc.land_no = this.$utils.empty(acc.land_no) ? item.land_no : `${acc.land_no}${linebreak}${item.land_no}`
            acc.land_area = this.$utils.empty(acc.land_area) ? item.land_area : `${acc.land_area}${linebreak}${item.land_area}`
            acc.land_area_sum += parseFloat(item.land_area || 0.0)
            acc.land_rightc = this.$utils.empty(acc.land_rightc) ? item.land_rightc : `${acc.land_rightc}${linebreak}${item.land_rightc}`
            acc.land_rightv = this.$utils.empty(acc.land_rightv) ? `${item.land_rightDeno}/${item.land_rightNume}` : `${acc.land_rightv}${linebreak}${item.land_rightDeno}/${item.land_rightNume}`
            acc.land_usec = this.$utils.empty(acc.land_usec) ? item.land_usec : `${acc.land_usec}${linebreak}${item.land_usec}`
            acc.land_useText = this.$utils.empty(acc.land_useText) ? item.land_useText : `${acc.land_useText}${linebreak}${item.land_useText}`
            return acc
          }, {
            land_count: 0.0,
            land_x48c: '',
            land_no: '',
            land_area: '',
            land_area_sum: 0.0,
            land_rightc: '',
            land_rightv: '',
            land_usec: '',
            land_useText: ''
          })
        } else if (arrayFilter === 'build') {
          data = data.reduce((acc, item, index, arr) => {
            acc.build_count++
            // acc.build_areaB = this.$utils.empty(acc.build_areaB) ? item.build_areaB : `${acc.build_areaB}${linebreak}${item.build_areaB}`
            acc.build_areaB_sum += parseFloat(item.build_areaB || 0.0)
            // acc.build_areaE = this.$utils.empty(acc.build_areaE) ? item.build_areaE : `${acc.build_areaE}${linebreak}${item.build_areaE}`
            acc.build_areaE_sum += parseFloat(item.build_areaE || 0.0)
            // acc.build_areaM = this.$utils.empty(acc.build_areaM) ? item.build_areaM : `${acc.build_areaM}${linebreak}${item.build_areaM}`
            acc.build_areaM_sum += parseFloat(item.build_areaM || 0.0)
            // acc.build_areaP = this.$utils.empty(acc.build_areaP) ? item.build_areaP : `${acc.build_areaP}${linebreak}${item.build_areaP}`
            acc.build_areaP_sum += parseFloat(item.build_areaP || 0.0)
            // acc.build_areaU = this.$utils.empty(acc.build_areaU) ? item.build_areaU : `${acc.build_areaU}${linebreak}${item.build_areaU}`
            acc.build_areaU_sum += parseFloat(item.build_areaU || 0.0)
            return acc
          }, {
            build_count: 0.0,
            // build_areaB: '',
            build_areaB_sum: 0.0,
            // build_areaE: '',
            build_areaE_sum: 0.0,
            // build_areaM: '',
            build_areaM_sum: 0.0,
            // build_areaP: '',
            build_areaP_sum: 0.0,
            // build_areaU: '',
            build_areaU_sum: 0.0
          })
        } else if (arrayFilter === 'car') {
          data = data.reduce((acc, item, index, arr) => {
            acc.car_count++
            acc.car_typec = this.$utils.empty(acc.car_typec) ? item.car_typec : `${acc.car_typec}${linebreak}${item.car_typec}`
            acc.car_price = this.$utils.empty(acc.car_price) ? item.car_price : `${acc.car_price}${linebreak}${item.car_price}`
            acc.car_price_sum += parseFloat(item.car_price?.replaceAll(',', '') || 0.0)
            acc.car_area = this.$utils.empty(acc.car_area) ? item.car_area : `${acc.car_area}${linebreak}${item.car_area}`
            acc.car_area_sum += parseFloat(item.car_area || 0.0)
            acc.car_floorc = this.$utils.empty(acc.car_floorc) ? item.car_floorc : `${acc.car_floorc}${linebreak}${item.car_floorc}`
            return acc
          }, {
            car_count: 0.0,
            car_typec: '',
            car_price: '',
            car_price_sum: 0.0,
            car_area: '',
            car_area_sum: 0.0,
            car_floorc: ''
          })
        }
      }
      if (data) {
        for (const [key, value] of Object.entries(data)) {
          const label = this.keyLabelMap.get(key)
          if (label) {
            // p1ma_parkflag: 車位備註轉換
            if (key === 'p1ma_parkflag') {
              obj[label] = this.p1ma_parkflagText(value)
            } else {
              obj[label] = value
            }
          } else {
            // obj[key] = value
          }
        }
      }
      return obj
    },
    prepareTranslatedObj (json) {
      const mainData = json[this.mainKey]
      // extract p1sp fields from main data
      const p1spData = pick(mainData, this.p1spFields)
      // keep fields except p1sp
      const restMainData = omit(mainData, this.p1spFields)

      const landData = json[`${this.mainKey}${this.landPostfix}`]
      const buildData = json[`${this.mainKey}${this.buildingPostfix}`]
      const carData = json[`${this.mainKey}${this.parkingPostfix}`]

      const obj = {
        ...this.mapFieldData(restMainData),
        ...this.mapFieldData(landData, 'land'),
        ...this.mapFieldData(buildData, 'build'),
        ...this.mapFieldData(carData, 'car'),
        ...this.mapFieldData(p1spData)
      }
      return obj
    },
    prepareFormattedJson () {
      if (this.showError) {
        return []
      }
      if (this.jsonData) {
        return [this.prepareTranslatedObj(this.jsonData)]
      } else {
        return this.jsons?.map(raw => this.prepareTranslatedObj(raw))
      }
    },
    p1ma_parkflagText (val) {
      switch (val) {
        case '0':
          return '車位單獨計價'
        case '1':
          return '車位已含總額'
        default:
          return val
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.fixed-width {
  max-width: 35vw;
}
</style>
