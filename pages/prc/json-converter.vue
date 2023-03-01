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
  lah-val-realprice-json-list(
    v-if="validJsons",
    :jsons="jsons"
  )
  lah-val-realprice-json-data(
    v-if="validJson",
    :json-data="jsonData"
  )
</template>

<script>
export default {
  data: () => ({
    file: null,
    jsons: [],
    jsonData: null,
    mainKey: 'ZWw1MDEw', // the key in the raw data
    landPostfix: 'MQ==',
    buildingPostfix: 'Mg==',
    parkingPostfix: 'Mw==',
    fields: [
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
      },
      // ZWw1MDEw Mg== 👉 建物
      {
        key: 'build_count',
        label: '建物數量',
        sortable: true
      },
      {
        key: 'build_areaM',
        label: '主建物總面積',
        sortable: true
      },
      {
        key: 'build_areaB',
        label: '陽台總面積',
        sortable: true
      },
      {
        key: 'build_areaE',
        label: '屋簷總面積',
        sortable: true
      },
      {
        key: 'build_areaU',
        label: '雨遮總面積',
        sortable: true
      },
      {
        key: 'build_areaP',
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
        label: '車位總價格',
        sortable: true
      },
      {
        key: 'car_area',
        label: '車位總面積',
        sortable: true
      },
      {
        key: 'car_floorc',
        label: '所在樓層',
        sortable: true
      }
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
      this.fields.forEach((field, idx, array) => {
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
    this.maxHeight = parseInt(window.innerHeight - 145)
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
      // the land/build/parking data will be array
      if (Array.isArray(data)) {
        if (arrayFilter === 'build') {
          data = data.reduce((acc, item, index, arr) => {
            acc.build_count++
            acc.build_areaB += parseFloat(item.build_areaB || 0.0)
            acc.build_areaE += parseFloat(item.build_areaE || 0.0)
            acc.build_areaM += parseFloat(item.build_areaM || 0.0)
            acc.build_areaP += parseFloat(item.build_areaP || 0.0)
            acc.build_areaU += parseFloat(item.build_areaU || 0.0)
            return acc
          }, {
            build_count: 0.0,
            build_areaB: 0.0,
            build_areaE: 0.0,
            build_areaM: 0.0,
            build_areaP: 0.0,
            build_areaU: 0.0
          })
        } else if (arrayFilter === 'car') {
          data = data.reduce((acc, item, index, arr) => {
            acc.car_count++
            acc.car_price += parseFloat(item.car_price?.replaceAll(',', '') || 0.0)
            acc.car_area += parseFloat(item.car_area || 0.0)
            return acc
          }, {
            car_count: 0.0,
            car_price: 0.0,
            car_area: 0.0
          })
        }
      }
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
      return obj
    },
    prepareTranslatedObj (json) {
      const mainData = json[this.mainKey]
      const buildData = json[`${this.mainKey}${this.buildingPostfix}`]
      const carData = json[`${this.mainKey}${this.parkingPostfix}`]
      const obj = {
        ...this.mapFieldData(mainData),
        ...this.mapFieldData(buildData, 'build'),
        ...this.mapFieldData(carData, 'car')
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
        return this.jsons.map(raw => this.prepareTranslatedObj(raw))
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
