<template lang="pug">
div: client-only
  .d-flex.justify-content-end.my-auto.align-items-center.text-nowrap.mb-2
    lah-fa-icon.mr-1.my-auto(icon="palette") 醒目
    b-checkbox.mx-2(v-model="display.dark", switch)
    lah-fa-icon.mr-1.my-auto(icon="display") 篩選
    b-checkbox.mx-2(v-model="display.main") 主要
    b-checkbox(v-model="display.land") 土地
    b-checkbox.mx-2(v-model="display.build") 建物
    b-checkbox(v-model="display.car") 車位

  //- 頂部核心交易摘要看板
  lah-transition: .summary-dashboard.mb-3(v-if="summary && summary.totalPrice")
    b-row.no-gutters
      //- KPI 1: 交易總價
      b-col.p-1(cols="12" md="3")
        .kpi-card.kpi-price.h-100.p-2.rounded.border
          .d-flex.align-items-center.justify-content-between.text-muted.small.mb-1
            span 交易總價
            lah-fa-icon(icon="coins" variant="warning")
          .h4.font-weight-bold.text-danger.mb-1 {{ summary.totalPrice }} #[small.text-muted 元]
          .small.text-muted.text-truncate(title="車位資訊")
            span 車位：{{ summary.carPrice }} 元
            b-badge.ml-1(variant="light") {{ summary.carFlagText }}

      //- KPI 2: 標的建案與座落
      b-col.p-1(cols="12" md="3")
        .kpi-card.kpi-target.h-100.p-2.rounded.border
          .d-flex.align-items-center.justify-content-between.text-muted.small.mb-1
            span 標的建案與座落
            lah-fa-icon(icon="building" variant="primary")
          .h5.font-weight-bold.text-primary.text-truncate.mb-1(title="建案名稱") {{ summary.projectName || '未填寫建案' }}
          .small.text-dark.text-truncate(title="座落地址")
            | {{ summary.address }}
            span.font-weight-bold.text-info.ml-1(v-if="summary.unit") ({{ summary.unit }})

      //- KPI 3: 樓層與格局
      b-col.p-1(cols="12" md="3")
        .kpi-card.kpi-layout.h-100.p-2.rounded.border
          .d-flex.align-items-center.justify-content-between.text-muted.small.mb-1
            span 樓層與室內格局
            lah-fa-icon(icon="door-open" variant="success")
          .h5.font-weight-bold.text-dark.mb-1
            span.text-success.mr-2 {{ summary.floorDisplay }}
            span {{ summary.layoutDisplay }}
          .small.text-muted.text-truncate(title="建物類別") {{ summary.buildCategory }}

      //- KPI 4: 交易日期與概況
      b-col.p-1(cols="12" md="3")
        .kpi-card.kpi-meta.h-100.p-2.rounded.border
          .d-flex.align-items-center.justify-content-between.text-muted.small.mb-1
            span 交易日期與概況
            lah-fa-icon(icon="calendar-alt" variant="info")
          .h5.font-weight-bold.text-info.mb-1 {{ summary.formattedDate }}
          .small.text-muted.text-truncate
            span.badge.badge-secondary.mr-1 土 {{ summary.landCount }}
            span.badge.badge-secondary.mr-1 建 {{ summary.buildCount }}
            span.badge.badge-secondary 車 {{ summary.carCount }}
            span.ml-1(title="備查序號") {{ summary.applyNo }}

  //- 主要資料：3 大結構化卡片
  lah-transition: .my-2(v-if="main && display.main")
    //- 卡片 1: 建物標的與格局規劃
    b-card.mb-3(header-tag="header" no-body)
      template(#header)
        .d-flex.justify-content-between.align-items-center
          span.font-weight-bold
            lah-fa-icon.mr-1(icon="home" variant="primary")
            | 建物標的與格局規劃
          b-badge(variant="primary" pill) {{ main.p1ma_build7c || '住家用' }}
      b-card-body.p-3
        b-row
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 建案名稱：
              span.value.text-primary.font-weight-bold {{ main.p1ma_typeB_1 || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 交易標的地址：
              span.value {{ main.p1ma_dd09 || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 棟別 / 號：
              span.value {{ [main.p1ma_typeB_5 ? main.p1ma_typeB_5 + '棟' : '', main.p1ma_typeB_6].filter(Boolean).join(' ') || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 交易樓層 / 總樓層：
              span.value {{ summary.floorDisplay }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 室內格局：
              span.value {{ summary.layoutDisplay }} (隔間：{{ formatPartition(main.p1ma_build4) }})
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 建物別 / 建築構造：
              span.value {{ (main.p1ma_build5c || '-') + ' / ' + (main.p1ma_build8c || '-') }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 使用分區 / 使用別：
              span.value {{ (main.land_usec ? main.land_usec + ' / ' : '') + (main.p1ma_build7c || '-') }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 起造人：
              span.value {{ main.p1ma_typeB_2 || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 建照字號：
              span.value {{ main.p1ma_typeB_3 || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 建照核發日：
              span.value {{ formatTaiwanDate(main.p1ma_typeB_4) }}

    //- 卡片 2: 價格拆分與特殊約定
    b-card.mb-3(header-tag="header" no-body)
      template(#header)
        .d-flex.justify-content-between.align-items-center
          span.font-weight-bold
            lah-fa-icon.mr-1(icon="receipt" variant="success")
            | 價格拆分與特殊約定
          span.text-danger.font-weight-bold.small 總額：{{ main.p1ma_totprice }} 元
      b-card-body.p-3
        b-row
          b-col(cols="12" md="6" lg="3").mb-2
            .detail-item
              span.label 土地總價：
              span.value.text-success.font-weight-bold {{ main.p1ma_alidprice ? main.p1ma_alidprice + ' 元' : '-' }}
            b-col(cols="12" md="6" lg="3").mb-2
            .detail-item
              span.label 建物總價：
              span.value.text-success.font-weight-bold {{ main.p1ma_dbidprice ? main.p1ma_dbidprice + ' 元' : '-' }}
          b-col(cols="12" md="6" lg="3").mb-2
            .detail-item
              span.label 車位總價：
              span.value.text-success.font-weight-bold {{ main.p1ma_parkprice ? main.p1ma_parkprice + ' 元' : '-' }}
          b-col(cols="12" md="6" lg="3").mb-2
            .detail-item
              span.label 車位備註：
              span.value {{ summary.carFlagText }}
          b-col(cols="12").mt-1
            .detail-item
              span.label 其他備註：
              span.value {{ main.p1ma_note || '無其他備註' }}
        hr.my-2
        .mt-2
          .text-muted.small.font-weight-bold.mb-1 特殊交易條件與費用：
          .d-flex.flex-wrap.align-items-center(v-if="specialBadges.length > 0")
            b-badge.mr-2.mb-1.p-2(
              v-for="(badge, bIdx) in specialBadges"
              :key="bIdx"
              :variant="badge.variant"
            )
              | {{ badge.label }}
              span.ml-1.font-weight-bold(v-if="badge.value"): | {{ badge.value }}
          .text-muted.small.py-1(v-else)
            lah-fa-icon.text-success.mr-1(icon="check-circle")
            | 本案無特殊交易條件約定（無親友交易、裝潢費、家具費、合建、債務等特殊備註）。

    //- 卡片 3: 案件申報與相關人員
    b-card.mb-3(header-tag="header" no-body)
      template(#header)
        .d-flex.justify-content-between.align-items-center
          span.font-weight-bold
            lah-fa-icon.mr-1(icon="user-tie" variant="info")
            | 案件申報與相關人員
          b-badge(variant="secondary") {{ formatCaseKind(main.case_kind) }}
      b-card-body.p-3
        b-row
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 備查序號：
              span.value.font-weight-bold {{ main.apply_no || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 申報序號：
              span.value {{ main.case_no || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 交易日期：
              span.value {{ summary.formattedDate }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 經紀業名稱：
              span.value {{ main.apply_name || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 經紀業統編/ID：
              span.value {{ main.apply_idNo || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 經紀業電話：
              span.value {{ main.apply_tel || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 經紀代理人：
              span.value {{ main.agents_name || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 代理人ID：
              span.value {{ main.agents_idNo || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 代理人電話：
              span.value {{ main.agents_tel || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 買受人：
              span.value.font-weight-bold {{ main.right_name || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2
            .detail-item
              span.label 買受人統編/ID：
              span.value {{ main.right_idNo || '-' }}
          b-col(cols="12" md="6" lg="4").mb-2(v-if="main.p1sp_desc1401")
            .detail-item
              span.label 其他買受人：
              span.value.text-primary {{ main.p1sp_desc1401 }}

  //- 土地清單
  lah-transition: .my-3(v-if="!isEmpty(landData) && display.land")
    .d-flex.justify-content-between.align-items-center.mb-2
      h5.mb-0
        lah-fa-icon.mr-1(icon="map-marked-alt" variant="success")
        | 土地資料
        b-badge.ml-2(variant="success" pill) {{ landData.length }} 筆
      span.text-muted.small 土地總面積：#[b.text-success {{ landAreaSum }}] ㎡
    lah-val-b-table(
      ref="landData"
      :head-variant="headVariant",
      :busy="isBusy",
      :items="landData",
      :fields="landFields"
    )

  //- 建物清單
  lah-transition: .my-3(v-if="!isEmpty(buildData) && display.build")
    .d-flex.justify-content-between.align-items-center.mb-2
      h5.mb-0
        lah-fa-icon.mr-1(icon="city" variant="info")
        | 建物資料
        b-badge.ml-2(variant="info" pill) {{ buildData.length }} 棟
      span.text-muted.small
        span.mr-2 主建物總面積：#[b.text-info {{ buildAreaMSum }}] ㎡
        span 共有總面積：#[b.text-info {{ buildAreaPSum }}] ㎡
    lah-val-b-table(
      ref="buildData"
      :head-variant="headVariant",
      :busy="isBusy",
      :items="buildData",
      :fields="buildFields"
    )

  //- 停車位清單
  lah-transition: .my-3(v-if="!isEmpty(carData) && display.car")
    .d-flex.justify-content-between.align-items-center.mb-2
      h5.mb-0
        lah-fa-icon.mr-1(icon="car" variant="warning")
        | 停車位資料
        b-badge.ml-2(variant="warning" pill) {{ carData.length }} 個
      span.text-muted.small 車位總金額：#[b.text-danger {{ carPriceSum }}] 元
    lah-val-b-table(
      ref="carData"
      :head-variant="headVariant",
      :busy="isBusy",
      :items="carData",
      :fields="carFields"
    )
</template>

<script>
import isEmpty from 'lodash/isEmpty'
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
    main () {
      return this.jsonData ? this.jsonData[this.prefix] : null
    },
    mainData () {
      return this.main ? [this.main] : undefined
    },
    summary () {
      if (!this.main) { return {} }
      const m = this.main
      const totalPrice = m.p1ma_totprice || '-'
      const carPrice = m.p1ma_parkprice || '0'
      const carFlagText = this.p1ma_parkflagText(m.p1ma_parkflag)
      const projectName = m.p1ma_typeB_1 || ''
      const address = `${m.case_x46c || ''}${m.p1ma_dd09 || ''}`
      const unit = [m.p1ma_typeB_5 ? `${m.p1ma_typeB_5}棟` : '', m.p1ma_typeB_6].filter(Boolean).join(' ')
      const currentFloor = (m.p1ma_build10_1 || '').replace(/^0+/, '')
      const totalFloor = m.p1ma_build9 || ''
      const floorDisplay = currentFloor && totalFloor ? `${currentFloor}F / ${totalFloor}F` : (currentFloor ? `${currentFloor}F` : '-')
      const layoutParts = []
      if (m.p1ma_build1) { layoutParts.push(`${m.p1ma_build1}房`) }
      if (m.p1ma_build2) { layoutParts.push(`${m.p1ma_build2}廳`) }
      if (m.p1ma_build3) { layoutParts.push(`${m.p1ma_build3}衛`) }
      const layoutDisplay = layoutParts.length > 0 ? layoutParts.join(' ') : '未提供格局'
      const buildCategory = m.p1ma_build5c || '-'
      const formattedDate = this.formatP1MADate(m.p1ma_date)
      const landCount = m.p1ma_cntalid || (this.landData?.length || 0)
      const buildCount = m.p1ma_cntdbid || (this.buildData?.length || 0)
      const carCount = m.p1ma_cntpark || (this.carData?.length || 0)
      const applyNo = m.apply_no || '-'
      const caseNo = m.case_no || '-'

      return {
        totalPrice,
        carPrice,
        carFlagText,
        projectName,
        address,
        unit,
        floorDisplay,
        layoutDisplay,
        buildCategory,
        formattedDate,
        landCount,
        buildCount,
        carCount,
        applyNo,
        caseNo
      }
    },
    specialBadges () {
      if (!this.main) { return [] }
      const badges = []
      const m = this.main
      if (m.p1sp_price0101 && m.p1sp_price0101.trim() !== '') {
        badges.push({ label: '裝潢費', value: `${m.p1sp_price0101} 元`, variant: 'info' })
      }
      if (m.p1sp_price0102 && m.p1sp_price0102.trim() !== '') {
        badges.push({ label: '家俱費', value: `${m.p1sp_price0102} 元`, variant: 'info' })
      }
      if (m.p1sp_price0106 && m.p1sp_price0106.trim() !== '') {
        badges.push({ label: '其他費', value: `${m.p1sp_desc0106 ? m.p1sp_desc0106 + ' ' : ''}${m.p1sp_price0106} 元`, variant: 'info' })
      }
      const codeMap = [
        { key: 'p1sp_code0201', label: '親友關係交易', variant: 'warning' },
        { key: 'p1sp_code0202', label: '合建案', variant: 'warning' },
        { key: 'p1sp_code0501', label: '急買急賣', variant: 'warning' },
        { key: 'p1sp_code0502', label: '民情風俗', variant: 'warning' },
        { key: 'p1sp_code0512', label: '期待因素', variant: 'warning' },
        { key: 'p1sp_code0509', label: '受債務影響', variant: 'danger' },
        { key: 'p1sp_code0602', label: '地上權交易', variant: 'warning' },
        { key: 'p1sp_code0505', label: '毛胚屋', variant: 'secondary' }
      ]
      codeMap.forEach((item) => {
        if (m[item.key] && m[item.key].trim() !== '' && m[item.key] !== '0') {
          badges.push({ label: item.label, value: '', variant: item.variant })
        }
      })
      if (m.p1sp_desc1301 && m.p1sp_desc1301.trim() !== '') {
        badges.push({ label: '解約原序號', value: m.p1sp_desc1301, variant: 'danger' })
      }
      if (m.p1sp_desc1401 && m.p1sp_desc1401.trim() !== '') {
        badges.push({ label: '其他買受人', value: m.p1sp_desc1401.trim(), variant: 'primary' })
      }
      return badges
    },
    landData () {
      return this.jsonData ? this.jsonData[`${this.prefix}${this.landPostfix}`] : undefined
    },
    landAreaSum () {
      if (!Array.isArray(this.landData)) { return '0' }
      const sum = this.landData.reduce((acc, cur) => acc + (parseFloat(cur.land_area) || 0), 0)
      return sum.toFixed(2)
    },
    landFields () {
      return [
        { key: 'land_x48c', label: '地段', sortable: true },
        { key: 'land_no', label: '地號', sortable: true },
        { key: 'land_area', label: '土地面積(㎡)', sortable: true },
        { key: 'land_rightc', label: '權利範圍', sortable: true },
        { key: 'land_rightDeno', label: '持分分子', sortable: true },
        { key: 'land_rightNume', label: '持分分母', sortable: true },
        { key: 'land_usec', label: '分區', sortable: true },
        { key: 'land_useText', label: '次類別', sortable: true }
      ]
    },
    buildData () {
      return this.jsonData ? this.jsonData[`${this.prefix}${this.buildingPostfix}`] : undefined
    },
    buildAreaMSum () {
      if (!Array.isArray(this.buildData)) { return '0' }
      const sum = this.buildData.reduce((acc, cur) => acc + (parseFloat(cur.build_areaM) || 0), 0)
      return sum.toFixed(2)
    },
    buildAreaPSum () {
      if (!Array.isArray(this.buildData)) { return '0' }
      const sum = this.buildData.reduce((acc, cur) => acc + (parseFloat(cur.build_areaP) || 0), 0)
      return sum.toFixed(2)
    },
    buildFields () {
      return [
        { key: 'build_areaM', label: '主建物面積(㎡)', sortable: true },
        { key: 'build_areaB', label: '陽台面積(㎡)', sortable: true },
        { key: 'build_areaE', label: '屋簷面積(㎡)', sortable: true },
        { key: 'build_areaU', label: '雨遮面積(㎡)', sortable: true },
        { key: 'build_areaP', label: '共有面積(㎡)', sortable: true }
      ]
    },
    carData () {
      return this.jsonData ? this.jsonData[`${this.prefix}${this.parkingPostfix}`] : undefined
    },
    carPriceSum () {
      if (!Array.isArray(this.carData)) { return '0' }
      const sum = this.carData.reduce((acc, cur) => {
        const p = parseFloat((cur.car_price || '0').replace(/,/g, '')) || 0
        return acc + p
      }, 0)
      return sum.toLocaleString()
    },
    carFields () {
      return [
        { key: 'car_typec', label: '車位類別', sortable: true },
        { key: 'car_price', label: '車位價格(元)', sortable: true },
        { key: 'car_area', label: '車位面積(㎡)', sortable: true },
        { key: 'car_floorc', label: '所在樓層', sortable: true }
      ]
    }
  },
  watch: {
    'display.dark' (val) {
      this.setCache('val.realprice.json.data.display.dark', val)
    }
  },
  mounted () {
    this.$refs.landData?.selectAllRows()
    this.$refs.buildData?.selectAllRows()
    this.$refs.carData?.selectAllRows()
    this.getCache('val.realprice.json.data.display.dark').then((flag) => {
      this.display.dark = flag
    })
  },
  methods: {
    isEmpty (val) {
      return isEmpty(val)
    },
    p1ma_parkflagText (val) {
      switch (val) {
        case '0': return '車位單獨計價'
        case '1': return '車位已含總額'
        default: return val || '-'
      }
    },
    formatTaiwanDate (val) {
      if (!val || typeof val !== 'string') { return val || '-' }
      const clean = val.trim()
      if (clean.length === 7) {
        return `${clean.substring(0, 3)}-${clean.substring(3, 5)}-${clean.substring(5, 7)}`
      }
      if (clean.length === 6) {
        return `${clean.substring(0, 2)}-${clean.substring(2, 4)}-${clean.substring(4, 6)}`
      }
      return clean
    },
    formatP1MADate (val) {
      return this.formatTaiwanDate(val)
    },
    formatCaseKind (val) {
      switch (val) {
        case '01': return '買賣案件 (01)'
        case '12': return '預售屋買賣 (12)'
        default: return val ? `案件種類 (${val})` : '一般買賣'
      }
    },
    formatPartition (val) {
      if (val === '1' || val === 'Y' || val === 'true') { return '有' }
      if (val === '0' || val === 'N' || val === 'false') { return '無' }
      return val || '-'
    }
  }
}
</script>

<style lang="scss" scoped>
.kpi-card {
  background-color: #f8f9fa;
  transition: all 0.2s ease-in-out;
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }
}
.kpi-price {
  border-left: 4px solid #dc3545 !important;
}
.kpi-target {
  border-left: 4px solid #007bff !important;
}
.kpi-layout {
  border-left: 4px solid #28a745 !important;
}
.kpi-meta {
  border-left: 4px solid #17a2b8 !important;
}
.detail-item {
  display: flex;
  font-size: 0.95rem;
  .label {
    color: #6c757d;
    min-width: 8rem;
    flex-shrink: 0;
  }
  .value {
    word-break: break-word;
  }
}
</style>
