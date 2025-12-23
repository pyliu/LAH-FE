<template lang="pug">
b-card(:class="classNames")
  b-card-title: .d-flex.align-items-center
    lah-transition
      lah-fa-icon(v-if="ready", icon="circle-check", variant="success", size="lg")
      lah-fa-icon(v-else-if="isBusy", icon="spinner", variant="muted", size="lg", action="spin")
      lah-fa-icon(v-else, icon="question", variant="muted", size="lg")
    .ml-1 {{ ownerType === 'land' ? '土地所有權人' : '建物所有權人' }}統計
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
  b-card-sub-title.font-weight-bold.d-flex.align-items-center.justify-content-between
    .d-flex.align-items-center.flex-nowrap
      span 類型：
      b-select(
        v-model="ownerType",
        size="sm",
        :disabled="isBusy",
        @change="reset",
        style="width: 5em;"
      )
        option(value="land") 土地
        option(value="building") 建物
    .d-flex.align-items-center.flex-nowrap
      span 民國
      b-input.mx-1(
        ref="birthYearInput",
        v-model="birthYear",
        size="sm",
        style="width: 5em;",
        list="birth-years",
        @keyup.enter="query",
        :disabled="isBusy",
        no-wheel
      )
      datalist#birth-years
        option(
          v-for="opt in ageRangeOptions"
          :key="opt.year"
          :value="opt.year"
        ) {{ opt.label }}
      span 年出生({{ displayAge }}歲)
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
  .h4.center.my-3(v-else) ⚠ 請設定「類型」、「出生年」後查詢。

  b-modal(
    ref="table",
    :title="`${ownerType === 'land' ? '土地' : '建物'}所有權人資料`",
    size="xl",
    hide-footer
  )
    lah-reg-owner-table(
      :raw="raw",
      table-size="xl",
      :table-type="ownerType"
    )
</template>

<script>
import LahRegOwnerTable from './lah-reg-owner-table.vue';

export default {
  emit: ['ready'],
  component: { LahRegOwnerTable },
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
    ownerType: 'land',
    fields: [
      { key: '資料集代號', sortable: true },
      { key: '段號', sortable: true },
      { key: '段名', sortable: true },
      { key: '地號', sortable: true },
      { key: '建號', sortable: true },
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
    },
    ageRangeOptions () {
      const currentTaiwanYear = new Date().getFullYear() - 1911
      const options = []
      for (let age = 99; age <= 105; age++) {
        const year = (currentTaiwanYear - age).toString().padStart(3, '0')
        options.push({
          year,
          label: `${year} - ${age}歲`
        })
      }
      return options
    },
    // 新增：根據輸入的 birthYear 計算顯示歲數
    displayAge () {
      if (!this.birthYear) { return '' }
      const currentTaiwanYear = new Date().getFullYear() - 1911
      // 將輸入的值轉為數字進行計算
      const age = currentTaiwanYear - parseInt(this.birthYear, 10)
      return age
    }
  },
  watch: {},
  created () {},
  mounted () {
    this.birthYear = this.ageRangeOptions[1].year
  },
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
          type: 'stats_reg_owner_data',
          owner_type: this.ownerType,
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
      this.modal(this.$createElement(LahRegOwnerTable, {
        props: {
          raw: payload.items,
          tableSize: 'xl',
          tableType: this.ownerType
        }
      }), {
        title: `${payload.key}`,
        size: 'xl'
      })
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
