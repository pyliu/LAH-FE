<template lang="pug">
div
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 實價登錄JSON資料解析
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'" size="lg")
          h5 請參照下列步驟操作
          ol
            li 至地政司實價登錄系統下載案件 JSON 檔案。
            li 點選「瀏覽」選擇檔案，或直接將檔案拖曳到上傳欄位，系統會自動解析並顯示處理後的表格資料。
            li 確認筆數與內容無誤後，利用 #[lah-fa-icon(icon="file-excel" regular variant="success" no-gutter)] 將顯示資料匯出為EXCEL檔案。
            li 欲更換檔案時，點選 #[lah-fa-icon(icon="trash" variant="secondary" no-gutter)] 清除後重新上傳。
          h5 支援的檔案格式
          ul
            li 副檔名為 .json，內容可為「單筆案件（物件）」或「多筆案件（陣列）」。
            li 每筆資料必須包含主要欄位 #[code ZWw1MDEw]，否則會顯示「不是支援的JSON格式檔案」。
            li 土地（#[code ZWw1MDEwMQ==]）、建物（#[code ZWw1MDEwMg==]）、車位（#[code ZWw1MDEwMw==]）為選填的附屬資料。
          h5 轉換規則
          ul
            li 同一案件有多筆土地、建物或車位時，會合併為一列：數量欄位為筆數，文字欄位以換行分隔，面積與車位價格另提供「總面積／總價格」加總欄位。
            li 土地持分會組合為「分子/分母」格式。
            li 「車位備註」代碼 0 轉為「車位單獨計價」，1 轉為「車位已含總額」。
            li 未列入對照表的原始欄位不會輸出。
          h5 常見問題
          ul
            li #[b 選擇檔案後沒有資料？] 請確認檔案為地政司下載的原始 JSON，且未經人工修改或另存為其他格式。
            li #[b 匯出的 EXCEL 是空的？] 格式錯誤或尚未上傳檔案時不會產生匯出資料。
            li #[b 檔案很大時畫面較慢？] 解析在瀏覽器端進行，建議分批上傳，資料不會傳送至伺服器。

      .d-flex
        lah-button-xlsx.ml-1(
          :jsons="xlsxData",
          header="實價登錄JSON檔案轉換"
        )
  b-card.json-upload-card.mb-3(no-body)
    b-card-body.py-3
      .d-flex.flex-wrap.align-items-center
        .upload-step.mr-3.mb-2
          b-badge.step-badge(:variant="file ? 'success' : 'primary'" pill) 1
          span.ml-2.font-weight-bold 上傳 JSON
        .upload-step.mr-3.mb-2
          b-badge.step-badge(:variant="hasData ? 'success' : 'secondary'" pill) 2
          span.ml-2.font-weight-bold 檢視資料
        .upload-step.mb-2
          b-badge.step-badge(:variant="hasData ? 'primary' : 'secondary'" pill) 3
          span.ml-2.font-weight-bold 匯出 EXCEL
      .d-flex.flex-nowrap.align-items-center
        b-file.flex-grow-1.mr-2(
          v-model="file",
          accept="application/json",
          placeholder="請選擇或拖曳地政司下載的 JSON 檔案至此",
          drop-placeholder="放開以上傳檔案",
          browse-text="瀏覽",
          :state="showError ? false : (hasData ? true : null)"
        )
          template(slot="file-name" slot-scope="{ names }")
            b-badge(variant="dark") {{ names[0] }}
            b-badge(v-if="names.length > 1" variant="dark" class="ml-1").
              + {{ names.length - 1 }} 更多檔案
        lah-button(
          v-if="file !== null"
          icon="trash",
          title="清除選擇",
          variant="outline-secondary",
          @click="clear",
          no-icon-gutter
        )
      lah-transition: .d-flex.flex-wrap.mt-2.text-muted.small(v-if="hasData")
        span.mr-3 檔案：{{ file ? file.name : '' }}（{{ fileSizeText }}）
        span 案件筆數：#[b.text-success {{ recordCount }}]
      lah-transition: b-alert.mt-2.mb-0(v-if="showError" show variant="danger")
        | ⚠️ 不是支援的JSON格式檔案(資料需有 "ZWw1MDEw" 欄位)。
  lah-transition: .empty-state.text-center.text-muted.py-5(v-if="!file && !hasData")
    lah-fa-icon.mb-2(icon="file-upload" size="3x" variant="secondary")
    .h5 尚未選擇檔案
    .small 上傳後將自動解析並顯示案件資料，可匯出為 EXCEL
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
    hasData () {
      return !this.showError && !!(this.validJsons || this.validJson)
    },
    recordCount () {
      if (this.validJson) { return 1 }
      return this.validJsons ? this.jsons.length : 0
    },
    fileSizeText () {
      const size = this.file?.size || 0
      return size >= 1048576 ? `${(size / 1048576).toFixed(2)} MB` : `${(size / 1024).toFixed(1)} KB`
    },
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
.json-upload-card {
  border-left: 4px solid #28a745;
}
.step-badge {
  min-width: 1.6rem;
}
.empty-state {
  border: 2px dashed #ced4da;
  border-radius: 0.5rem;
}
</style>
