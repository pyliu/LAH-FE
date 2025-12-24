<template lang="pug">
div
  //- 工具列佈局：分頁占用剩餘空間 (flex-grow-1)，篩選器靠右
  .d-flex.justify-content-between.align-items-end.mb-2
    .flex-grow-1
      lah-transition: lah-pagination(
        v-if="count > pagination.perPage"
        v-model="pagination",
        :total-rows="count"
        :caption="`找到 ${count} 筆資料`"
      )

    //- 所有權人篩選選單 (統編 + 姓名)
    .ml-auto.mb-1(style="min-width: 200px;")
      b-input-group(size="sm", prepend="所有權人")
        b-form-select(
          v-model="selectedOwner",
          :options="ownerOptions"
        )

  b-table.text-center.s-90(
    ref="tbl",
    striped,
    hover,
    responsive,
    bordered,
    caption-top,
    no-border-collapse,
    small,
    head-variant="dark",
    :items="rows",
    :fields="fieldsToUse",
    :per-page="pagination.perPage",
    :current-page="pagination.currentPage",
    :busy="isBusy"
  )
    template(#table-busy)
      .text-center.text-danger.my-2
        b-spinner.align-middle
        strong.ml-2 載入中...

    template(#cell(序號)="data")
      template(v-if="data.rowSelected")
        span(aria-hidden="true") &check;
        span(class="sr-only") Selected
      template(v-else)
        span(aria-hidden="true") &nbsp;
        span(class="sr-only") Not selected
      //- 序號計算邏輯
      span {{ (pagination.perPage * (pagination.currentPage - 1)) + data.index + 1 }}
</template>

<script>
import _ from 'lodash';

export default {
  name: 'LahRegOwnerTable',
  props: {
    raw: { type: Array, default: () => [] },
    tableSize: { type: String, default: 'xl' },
    tableType: { type: String, default: 'land' },
    isBusy: { type: Boolean, default: false }
  },
  data: () => ({
    keyword: '',
    selectedOwner: '', // 選中的所有權人識別碼 (統編|姓名)
    rows: [],
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
    ],
    pagination: {
      perPage: 6,
      currentPage: 1
    }
  }),
  computed: {
    count () { return this.rows?.length || 0 },
    landFields () {
      return this.fields.filter(f => f.key !== '建號')
    },
    buildingFields () {
      return this.fields.filter(f => f.key !== '地號' && f.key !== '住址')
    },
    fieldsToUse () {
      return this.tableType === 'land' ? this.landFields : this.buildingFields
    },
    /**
     * 生成排序過且不重複的所有權人選單 (統編 + 姓名)
     */
    ownerOptions () {
      // 1. 提取並建立複合物件
      const ownerList = _.chain(this.raw)
        .filter(item => item['所有權人姓名'] || item['所有權人統編'])
        .map((item) => {
          const id = item['所有權人統編'] || '無統編'
          const name = item['所有權人姓名'] || '無姓名'
          return {
            value: `${id}|${name}`, // 作為唯一的識別 value
            text: `[${id}] ${name}` // 顯示格式：[統編] 姓名
          }
        })
        .uniqBy('value')
        .value()

      // 2. 使用 localeCompare 進行排序
      const sorted = ownerList.sort((a, b) => a.text.localeCompare(b.text, 'zh-TW'))

      return [
        { value: '', text: '--- 全部所有權人 ---' },
        ...sorted
      ]
    }
  },
  watch: {
    raw: {
      handler (newVal) {
        this.applyFilter()
      },
      immediate: true
    },
    selectedOwner (newVal) {
      this.applyFilter()
    }
  },
  methods: {
    /**
     * 核心篩選邏輯
     */
    applyFilter () {
      if (!this.selectedOwner) {
        this.rows = [...this.raw]
      } else {
        // 解析複合 value 進行精確篩選
        const [targetId, targetName] = this.selectedOwner.split('|')
        this.rows = this.raw.filter((item) => {
          const id = item['所有權人統編'] || '無統編'
          const name = item['所有權人姓名'] || '無姓名'
          return id === targetId && name === targetName
        })
      }
      this.pagination.currentPage = 1
    },
    reset () {
      this.selectedOwner = ''
      this.rows = []
    }
  }
}
</script>

<style lang="scss" scoped>
.s-90 {
  font-size: 0.9rem;
}
.d-flex {
  gap: 1rem;
}
</style>
