<template lang="pug">
b-table.text-center(
  :busy="isBusy",
  :items="alteredJsons",
  :fields="fields",
  caption-top,
  selectable,
  striped,
  hover,
  bordered,
  small,
  no-border-collapse,
  select-mode="single",
  selected-variant="success",
  @row-selected="handleRowSelected",
  :responsive="'lg'",
  :borderless="false",
  :outlined="false",
  :dark="false",
  :fixed="false",
  :foot-clone="false",
  :head-variant="'dark'"
)
  template(#table-busy): span.ld-txt 讀取中...
  template(#cell(apply_no)="{ item, index }")
    .d-flex.justify-content-center
      b-link(
        title="開啟詳細資料視窗",
        @click="popup(index)"
      ) {{ item.apply_no }}
      lah-button.border-0(
        title="開啟詳細資料視窗",
        icon="window-restore",
        @click="popup(index)",
        no-icon-gutter
      )
  template(#cell(p1ma_date)="{ item }"): span {{ formatP1MADate(item.p1ma_date) }}
  template(#cell(p1ma_build10_1)="{ item }"): span {{ formatP1MAFloor(item) }}
</template>

<script>
import lahValRealpriceJsonData from '~/components/lah-val-realprice-json-data.vue'
export default {
  components: { lahValRealpriceJsonData },
  props: {
    jsons: { type: Array, default: () => [], require: true }
  },
  data: () => ({
    key: 'ZWw1MDEw',
    fields: [
      {
        key: 'apply_no',
        label: '備查序號',
        sortable: true
      },
      {
        key: 'case_no',
        label: '申報序號',
        sortable: true
      },
      {
        key: 'p1ma_date',
        label: '交易日期',
        sortable: true
      },
      {
        key: 'p1ma_typeB_1',
        label: '建案',
        sortable: true
      },
      {
        key: 'land_x46c',
        label: '所在區',
        sortable: true
      },
      {
        key: 'p1ma_dd09',
        label: '街道',
        sortable: true
      },
      {
        key: 'p1ma_typeB_6',
        label: '號',
        sortable: true
      },
      {
        key: 'p1ma_typeB_5',
        label: '棟別'
      },
      {
        key: 'p1ma_build10_1',
        label: '樓層',
        sortable: true
      },
      {
        key: 'p1ma_build5c',
        label: '建物類別',
        sortable: true
      }
      // {
      //   key: 'case_kind',
      //   label: '案件種類',
      //   sortable: true
      // },
      // {
      //   key: 'p1ma_note',
      //   label: '其他備註',
      //   sortable: true
      // }
    ]
  }),
  computed: {
    alteredJsons () {
      return this.jsons?.map(json => json[this.key])
    }
  },
  methods: {
    formatP1MADate (str) {
      const Y = str.substring(0, 3)
      const M = str.substring(3, 5)
      const D = str.substring(5, 7)
      return `${Y}-${M}-${D}`
    },
    formatP1MAFloor (item) {
      return `${item.p1ma_build10_1.replace(/^0+/, '')}/${item.p1ma_build9}`
    },
    popup (index) {
      this.modal(this.$createElement(lahValRealpriceJsonData, {
        props: { jsonData: this.jsons[index] }
      }), {
        title: `詳細資料 - ${this.jsons[index][this.key].apply_no}`,
        size: 'xl'
      })
    },
    handleRowSelected (rowArray) {
      // console.warn(rowArray)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
