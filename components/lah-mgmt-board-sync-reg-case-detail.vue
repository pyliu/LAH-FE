<template lang="pug">
b-card.border-0(no-body)
  lah-transition
    .center.h5(v-if="updated"): lah-fa-icon(icon="check", variant="success") 全部更新完成。
    div(v-else)
      .d-flex.align-items-center.h5
        lah-fa-icon(icon="triangle-exclamation", size="lg")
        .mx-1 找到 #[b-badge(variant="warning", pill) {{ dataCount }}] 筆欄位不相符。
        lah-button(icon="cloud-arrow-down", variant="outline-success", @click="syncAll($event)") 同步全部
      b-table.text-center(
        :fields="fields"
        :items="columns",
        hover,
        responsive="lg",
        striped,
        bordered,
        small,
        fixed
      )
        template(#cell(REMOTE)="{ item }"): div {{ $utils.empty(item.REMOTE) ? '(空值)' : item.REMOTE }}
        template(#cell(LOCAL)="{ item }"): div {{ $utils.empty(item.LOCAL) ? '(空值)' : item.LOCAL }}
        template(#cell(OP)="{ item }"): lah-button.mx-auto(icon="cloud-arrow-down", variant="outline-primary", @click="syncColumn($event, item.COLUMN)") 同步 {{ item.COLUMN }}
</template>

<script>
import lahRegCaseDetailVue from './lah-reg-case-detail.vue'

export default {
  emit: ['synced', 'all-synced'],
  components: { lahRegCaseDetailVue },
  props: {
    caseId: { type: String, default: '' },
    items: { type: Array, default: () => [] }
  },
  data: () => ({
    columns: [],
    updated: false,
    fields: [
      {
        key: 'COLUMN',
        label: '資料欄位',
        sortable: true
      },
      {
        key: 'TEXT',
        label: '欄位名稱',
        sortable: true
      },
      {
        key: 'REMOTE',
        label: '同步異動資料',
        sortable: true,
        variant: 'danger' // Variant applies to the whole column, including the header and footer
      },
      {
        key: 'LOCAL',
        label: '本所端資料',
        sortable: true,
        variant: 'secondary'
      },
      {
        key: 'OP',
        label: '操作',
        // Variant applies to the whole column, including the header and footer
        variant: ''
      }
    ]
  }),
  computed: {
    formattedID () {
      return this.$utils.caseId(this.caseId)
    },
    dataReady () {
      return !this.$utils.empty(this.columns)
    },
    dataCount () {
      return this.columns?.length || 0
    },
    validCaseId () {
      if (this.$utils.empty(this.caseId)) {
        return false
      }
      if (this.caseId.length !== 13) {
        return false
      }
      const number = this.caseId.substring(7)
      if (parseInt(number) < 1) {
        return false
      }
      return true
    }
  },
  watch: {},
  created () {
    this.columns = [...this.items]
  },
  methods: {
    detail () {
      if (this.validCaseId) {
        this.modal(this.$createElement(lahRegCaseDetailVue, {
          props: { caseId: this.caseId }
        }), {
          title: `登記案件詳情 ${this.$utils.caseId(this.caseId)}`,
          size: 'xl'
        })
      }
    },
    syncColumn (e, column) {
      this.confirm(`確定要同步 ${column} 欄位？`).then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'sync_xcase_column',
            id: this.caseId,
            column
          }).then((res) => {
            if (this.$utils.statusCheck(res.data.status)) {
              this.success(`${column} 欄位同步成功！`, {
                title: '同步局端資料',
                subtitle: this.caseId
              })
              this.trigger('synced', column)
              // this.$(e.target).closest('button').remove()
              this.columns = this.columns.filter((item, idx, arr) => item.COLUMN !== column)
            } else {
              this.warning(res.data.message, {
                title: '同步局端資料',
                subtitle: this.caseId
              })
            }
          }).catch((err) => {
            this.$utils.error(err)
            this.alert(err.message, {
              title: '同步局端資料',
              subtitle: this.caseId
            })
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    syncAll (e) {
      this.confirm(`同步局端資料至本所資料庫【${this.caseId}】？`).then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'sync_xcase',
            id: this.caseId
          }).then((res) => {
            if (this.$utils.statusCheck(res.data.status)) {
              this.success('案件全部同步成功！', {
                title: '同步局端資料',
                subtitle: this.caseId
              })
              this.trigger('all-synced')
              this.columns.length = 0
              this.updated = true
            } else {
              this.warning(res.data.message, {
                title: '同步局端資料',
                subtitle: this.caseId
              })
            }
          }).catch((err) => {
            this.$utils.error(err)
            this.alert(err.message, {
              title: '同步局端資料',
              subtitle: this.caseId
            })
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.row {
  margin-top: 2px;
  margin-bottom: 2px;
  &::hover {
    background-color: antiquewhite;
  }
}
</style>
