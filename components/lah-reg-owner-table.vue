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

    //- 所有權人篩選選單 (統編 + 姓名) - 當選項超過一人時才顯示
    .ml-auto.mb-1(
      v-if="showFilter",
      style="min-width: 200px;"
    )
      b-input-group(size="sm")
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
     * 生成篩選選單
     * 排序邏輯：1. 筆數 (降序) 2. 統編+姓名 (升序)
     */
    ownerOptions () {
      // 1. 根據 統編|姓名 進行分組統計筆數
      const grouped = _.groupBy(this.raw, (item) => {
        const id = item['所有權人統編'] || '無統編'
        const name = item['所有權人姓名'] || '無姓名'
        return `${id}|${name}`
      })

      // 2. 轉換為選項格式並包含計數
      const ownerList = _.map(grouped, (items, key) => {
        const [id, name] = key.split('|')
        return {
          value: key,
          text: `[${id}] ${name}`,
          count: items.length
        }
      })

      // 3. 多重排序
      const sorted = ownerList.sort((a, b) => {
        // 第一優先：筆數由大到小
        if (b.count !== a.count) {
          return b.count - a.count
        }
        // 第二優先：中文語系排序 (統編與姓名)
        return a.text.localeCompare(b.text, 'zh-TW')
      })

      return [
        { value: '', text: '--- 全部所有權人 ---' },
        ...sorted.map(opt => ({
          value: opt.value,
          text: `${opt.text} (${opt.count} 筆)`
        }))
      ]
    },
    /**
     * 判斷是否顯示篩選 UI
     */
    showFilter () {
      // 扣除「全部」選項後，若唯一所有權人數量 > 1 則顯示
      return this.ownerOptions.length > 2
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
