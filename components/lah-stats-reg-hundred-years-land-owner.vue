<template lang="pug">
b-card(:class="classNames")
  b-card-title: .d-flex.align-items-center
    lah-transition
      lah-fa-icon(v-if="ready", icon="circle-check", variant="success", size="lg")
      lah-fa-icon(v-else-if="isBusy", icon="spinner", variant="muted", size="lg", action="spin")
      lah-fa-icon(v-else, icon="question", variant="muted", size="lg")
    .ml-1 土地所有權人統計
    lah-transition: b-badge.ml-1(pill, v-if="ready", variant="info", title="小計") {{ count }}
    lah-transition: lah-button-xlsx.ml-1(
      v-if="count > 0",
      regular,
      icon="file-excel",
      size="sm",
      :variant="'success'",
      :jsons="xlsxJsons",
      pill
    )
    lah-transition: lah-button.ml-1(
      v-if="ready && count > 0"
      icon="window-maximize",
      title="顯示詳細列表",
      :disabled="isBusy",
      pill,
      no-icon-gutter,
      @click="$refs.table.show()"
    )
    lah-button.ml-1(
      icon="magnifying-glass",
      title="重新查詢",
      :disabled="isBusy",
      @click="query",
      pill,
      no-icon-gutter
    )
  b-card-sub-title.font-weight-bold.d-flex.align-items-center.justify-content-end
    span 民國
    b-input.mx-1(
      v-model="birthYear",
      size="sm",
      style="width: 3em;",
      @keyup.enter="query"
    )
    span 年出生
  section.my-2(v-if="ready")
    .h4.center.my-2(v-if="count === 0") 查無資料
    div(v-else)
      b-link.d-flex.justify-content-between.align-items-center.h5(
        v-for="(payload, idx) in top3",
        :key="`hubdred_top_${idx}`",
        @click="popup(payload)"
      )
        .font-weight-bold {{ idx + 1 }}. {{ payload.key }}
        b-badge(pill, :variant="idx === 0 ? 'primary' : idx === 1 ? 'info' : 'secondary'") {{ payload.items.length }} 筆
      b-link.small.font-weight-bold.d-flex.justify-content-end.align-items-center(
        v-if="count > 3",
        @click="$refs.table.show()",
        title="查看所有資料"
      )
        lah-fa-icon(icon="ellipsis", action="wander-h") 更多
  .h4.center.my-2(v-else) ⚠ 請設定出生年後查詢

  b-modal(
    ref="table",
    title="土地所有權人資料",
    size="xl",
    hide-footer
  )
    lah-reg-hundred-years-land-owner-table(
      :raw="raw",
      table-size="xl"
    )
</template>

<script>
import LahRegHundredYearsLandOwnerTable from './lah-reg-hundred-years-land-owner-table.vue';

export default {
  emit: ['ready'],
  component: { LahRegHundredYearsLandOwnerTable },
  props: {
    noBorder: { type: Boolean, default: false },
    begin: { type: String, default: '' },
    end: { type: String, default: '' }
  },
  data: () => ({
    ready: false,
    queryOK: false,
    raw: [],
    message: '',
    birthYear: '115',
    fields: [
      { key: '資料集代號', sortable: true },
      { key: '段名', sortable: true },
      { key: '地號', sortable: true },
      { key: '登次', sortable: true },
      { key: '權利範圍類別', sortable: true },
      { key: '分母', sortable: true },
      { key: '分子', sortable: true },
      { key: '所有權人統編', sortable: true },
      { key: '所有權人姓名', sortable: true },
      { key: '登記日期', sortable: true },
      { key: '登記原因發生日期', sortable: true },
      { key: '住址', sortable: true },
      { key: '其他登記事項代碼', sortable: true },
      { key: '其他登記事項內容', sortable: true },
      { key: '出生日期', sortable: true }
    ]
  }),
  computed: {
    top3 () {
      const allGroups = this.groupDataByTaxId(this.raw)
      // 直接利用 slice 取出索引 0, 1, 2 的資料
      return allGroups.slice(0, 3)
    },
    period () {
      return this.getBirthYearForCentenarian(this.begin)
    },
    classNames () {
      const list = []
      if (this.noBorder) {
        list.push('border-0')
      }
      return list
    },
    count () {
      return this.raw?.length || 0
    },
    xlsxJsons () {
      const fieldKeys = this.fields.map((field, idx, array) => field.key)
      const jsons = this.raw?.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (fieldKeys.includes(key)) {
            obj[this.getLabel(key)] = value
          }
        }
        return obj
      }) || []
      return jsons
    }
  },
  watch: {},
  created () {
    this.birthYear = this.getBirthYearForCentenarian(this.begin)
  },
  mounted () {},
  methods: {
    getLabel (key) {
      const found = this.fields.find((item, idx, array) => {
        return this.$utils.equal(item.key, key)
      })
      if (found && found.label) {
        return found.label
      }
      return key
    },
    reset () {
      this.ready = false
      this.queryOK = false
      this.message = ''
      this.raw = []
    },
    query () {
      this.isBusy = true
      this.reset()
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_reg_hundred_years_owner_data',
          owner_type: 'land',
          birth_year: this.birthYear
        }).then(({ data }) => {
          const status = this.$utils.statusCheck(data.status) ? '🟢' : '⚠'
          this.message = `${status} ${data.message}`
          this.raw = [...data.raw]
          this.$emit('ready', data)
          this.ready = true
        }).catch((err) => {
          this.error = err
        }).finally(() => {
          this.isBusy = false
        })
    },
    popup (payload) {
      this.modal(this.$createElement(LahRegHundredYearsLandOwnerTable, {
        props: {
          raw: payload.items,
          tableSize: 'xl'
        }
      }), {
        title: `${payload.key}`,
        size: 'xl'
      })
    },
    /**
     * 根據民國年月日字串推算 100 歲的出生民國年
     * 範例輸入: "1130101" -> 輸出: "013"
     * * @param {string} rocDateString - 民國年月日字串 (如 1130101)
     * @returns {string} - 補足三位數的民國出生年份
     */
    getBirthYearForCentenarian (rocDateString) {
      if (!rocDateString || rocDateString.length < 5) {
        return ''
      }
      // 1. 取得年份部分
      // 因為日期格式固定為 MMDD (4碼)，所以從索引 0 開始擷取到倒數第 4 位之前
      const yearStr = rocDateString.substring(0, rocDateString.length - 4)
      const currentRocYear = parseInt(yearStr, 10)
      // 2. 計算 100 歲的出生年
      const birthRocYear = currentRocYear - 100
      // 3. 格式化回傳
      // 使用 padStart 補零，確保結果如 "013" (若小於 0 則代表民國前，可依需求調整邏輯)
      if (birthRocYear < 0) {
        // 處理民國前的情況（選擇性實作）
        return `民國前 ${Math.abs(birthRocYear)} 年`
      }
      return birthRocYear.toString().padStart(3, '0')
    },
    /**
     * 依據「所有權人統編 + 姓名」進行分類，並按數量由大到小排序
     * @param {Array} data - 地籍資料陣列
     * @returns {Array} - 排序後的分類陣列 [{ key: "統編 姓名", items: [...] }, ...]
     */
    groupDataByTaxId (data) {
      // 1. 先進行分組 (使用 Object 暫存)
      const groups = data.reduce((acc, item) => {
        const taxId = item['所有權人統編'] || '未知統編'
        const name = item['所有權人姓名'] || '未知姓名'
        const groupKey = `${taxId} ${name}` // Key 值用 "統編 + 姓名"
        if (!acc[groupKey]) {
          acc[groupKey] = []
        }
        acc[groupKey].push(item)
        return acc
      }, {})
      // 2. 轉換為陣列格式並依據數量進行排序 (大到小)
      return Object.keys(groups)
        .map(key => ({
          key,
          items: groups[key]
        }))
        .sort((a, b) => b.items.length - a.items.length)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
