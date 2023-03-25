<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 外國人繼承限制
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          ul
            li 查詢系統內其他登記事項註記符合下列情況案件。
              ul
                li 註記內含「 ... 移轉與 ... 」(範例：本筆土地應於０００年０月０日前移轉與本國人，逾期辦理公開標售)
                li 註記內不含「 ... 移請 ... 」(範例：．．．移請財政部國有財產署公開標售。)
            li 狀態說明
              ul
                li 🔴 - 已逾期，須盡速辦理
                li 🟡 - 請進行通知作業
                li 🟢 - 正常，未到期
            li 通知接收功能僅限有安裝桃園即時通的使用者
      .d-flex
        lah-button-xlsx.mr-1(
          :jsons="xlsxData"
          header="外國人繼承限制資料"
        )
        lah-countdown-button(
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          title="立即重新讀取"
          variant="outline-secondary"
          badge-variant="secondary"
          :disabled="isBusy"
          :busy="isBusy"
          :milliseconds="cachedMs"
          @end="reload"
          @click="reload"
          auto-start
          end-attention
          no-badge
        )

  lah-transition: b-table(
    v-if="committed",
    head-variant="dark",
    select-mode="multi",
    selected-variant="success",
    :busy="isBusy",
    :items="filteredData",
    :fields="fields",
    :borderless="false",
    :outlined="false",
    caption-top,
    hover,
    striped,
    bordered,
    small,
    no-border-collapse,
    selectable,
    responsive="md"
  )
    template(#cell(light)="row")
      div {{ light(row.item) }}
    template(#cell(deadline)="{ item, index, rowSelected }")
      .text-nowrap {{ deadline(item) }}
    template(#cell(BA48)="{ item }")
      .text-nowrap(:title="item.BA48") {{ item.BA48_CHT }}
    template(#cell(BA49)="{ item }")
      .text-nowrap {{ $utils.formatLandNumber(item.BA49) }}
    template(#cell(BB05)="{ item }")
      .text-nowrap {{ $utils.addDateDivider(item.BB05) }}
    template(#cell(BB06)="{ item }")
      div(:title="item.BB06") {{ item.BB06_CHT }}
    template(#cell(BB07)="{ item }")
      .text-nowrap {{ $utils.addDateDivider(item.BB07) }}
    template(#cell(BB09)="{ item }")
      div(:title="item.BB09") {{ item.BB09_CHT }}
    template(#cell(BB15_1)="{ item }")
      div(:title="item.BB15_1") {{ item.BB15_1_CHT }}
    template(#cell(LBIR_2)="{ item }")
      .text-nowrap {{ $utils.addDateDivider(item.LBIR_2) }}
    template(#cell(LADR)="row")
      .d-flex
        .truncate-mvw {{ row.item.LADR }}
        lah-button.border-0.ml-1(
          :icon="row.detailsShowing ? 'caret-down' : 'caret-right'",
          :variant="row.detailsShowing ? 'dark' : 'outline-primary'",
          size="sm",
          title="顯示詳情",
          @click="toggle(row)",
          no-icon-gutter
        )
    template(#cell(GG30_2)="row")
      .d-flex
        .truncate-mvw {{ row.item.GG30_2 }}
        lah-button.border-0.ml-1(
          :icon="row.detailsShowing ? 'caret-down' : 'caret-right'",
          :variant="row.detailsShowing ? 'dark' : 'outline-primary'",
          size="sm",
          title="顯示詳情",
          @click="toggle(row)",
          no-icon-gutter
        )

    template(#row-details="row")
      lah-transition(appear): b-card
        b-card-title
          .d-flex.justify-content-between
            div {{ `${light(row.item)} ${row.item.BA48} ${row.item.BA48_CHT} ${$utils.formatLandNumber(row.item.BA49)} 地號` }}
            .text-primary.font-weight-bold 最後期限：{{ deadline(row.item) }}
            b-link.card-link(
              v-if="!$utils.empty(row.item.ID)",
              href="#",
              @click="popupCase(row.item)"
            ) {{ row.item.收件字號 }}
        b-card-text: b-list-group(flush)
          b-list-group-item: .d-flex
            .w-3rd 登記日期：{{ $utils.addDateDivider(row.item.BB05) }}
            .w-3rd.text-center 登記原因：{{ row.item.BB06 }} {{ row.item.BB06_CHT }}
            .w-3rd.text-right 發生日期：{{ $utils.addDateDivider(row.item.BB07) }}
          b-list-group-item: .d-flex
            .w-3rd 所有權人：{{ row.item.BB09 }}
            .w-3rd.text-center 生日：{{ $utils.addDateDivider(row.item.LBIR_2) }}
            .w-3rd.text-right 地址：{{ row.item.LADR }}
          b-list-group-item: .d-flex
            .w-3rd 權狀字號：{{ row.item.BB16 }}
            .w-3rd.text-center 權利範圍：{{ row.item.BB15_1 }} {{ row.item.BB15_1_CHT }}
            .w-3rd.text-right 申報地價：{{ row.item.BB21 }}
          b-list-group-item: .d-flex.justify-content-between
            .highlight-yellow {{ row.item.GG30_2 }}
</template>

<script>
import lahButton from '~/components/lah-button.vue'
import lahRegCaseDetailVue from '~/components/lah-reg-case-detail.vue'
export default {
  components: { lahButton },
  data: () => ({
    forceReload: false,
    committed: false,
    cachedMs: 24 * 60 * 60 * 1000,
    bakedData: [],
    fields: [
      {
        key: 'light',
        label: '狀態',
        sortable: true
      },
      {
        key: 'deadline',
        label: '最後期限',
        sortable: true
      },
      {
        key: 'BA48',
        label: '地段',
        sortable: true
      },
      {
        key: 'BA49',
        label: '地號',
        sortable: true
      },
      {
        key: 'BB01',
        label: '登記次序',
        sortable: true
      },
      {
        key: 'BB05',
        label: '登記日期',
        sortable: true
      },
      {
        key: 'BB06',
        label: '登記原因',
        sortable: true
      },
      {
        key: 'BB07',
        label: '發生日期',
        sortable: true
      },
      {
        key: 'BB09',
        label: '所有權人',
        sortable: true
      },
      {
        key: 'LBIR_2',
        label: '出生日期',
        sortable: true
      },
      {
        key: 'LADR',
        label: '住址',
        sortable: true
      },
      {
        key: 'BB15_1',
        label: '權利範圍',
        sortable: true
      },
      {
        key: 'BB16',
        label: '權狀字號',
        sortable: true
      },
      // {
      //   key: 'BB21',
      //   label: '申報地價',
      //   sortable: true
      // },
      {
        key: 'GG30_2',
        label: '其他登記事項',
        sortable: false
      }
    ],
    regex: /本筆土地應於([０１２３４５６７８９]{2,3})年([０１２３４５６７８９]{1,2})月([０１２３４５６７８９]{1,2})日前移轉與本國人/gm
  }),
  fetch () {
    // restore cached data if found
    this.getCache(this.cacheKey).then((json) => {
      if (json === false || this.forceReload) {
        if (this.isBusy) {
          this.warning('讀取中 ... 請稍後')
        } else {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'reg_inheritance_restriction',
            reload: this.forceReload
          }).then(({ data }) => {
            this.bakedData = data.baked || []
            // console.warn(this.bakedData)
            this.notify(data.message, {
              type: this.$utils.statusCheck(data.status) ? 'info' : 'warning',
              subtitle: '外人繼承限制查詢'
            })
            const remainS = data.cache_remaining_time // in seconds
            const remainMs = remainS * 1000
            if (remainMs && remainMs > 0) {
              this.setCache(this.cacheKey, data, remainMs)
              if (this.$refs.countdown) {
                this.$refs.countdown.setCountdown(remainMs)
                this.$refs.countdown.startCountdown()
              }
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.forceReload = false
            this.committed = true
          })
        }
      } else {
        this.bakedData = json.baked
        this.committed = true
        this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
          if (this.$refs.countdown) {
            this.$refs.countdown.setCountdown(remaining)
            this.$refs.countdown.startCountdown()
          }
          this.notify(`查詢成功，找到 ${this.bakedData.length} 筆外國人地權案件。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
        })
      }
    })
  },
  head: {
    title: '外國人繼承限制-桃園市地政局'
  },
  fetchOnServer: false,
  computed: {
    dataReady () { return this.bakedData.length > 0 },
    cacheKey () { return 'foreigner-inheritance-restriction' },
    filteredData () {
      return this.bakedData
    },
    filterDataCount () {
      return this.filteredData.length
    },
    keyLabelMap () {
      const keyLabelMap = new Map()
      this.fields.forEach((field, idx, array) => {
        keyLabelMap.set(field.key, field.label || field.key)
      })
      return keyLabelMap
    },
    xlsxData () {
      const fieldKeys = this.fields.map((field, idx, array) => field.key)
      const jsons = this.filteredData.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          const label = this.keyLabelMap.get(key)
          if (label) {
            obj[label] = value
          } else if (fieldKeys.includes(key)) {
            obj[key] = value
          }
        }
        return obj
      })
      return jsons
    }
  },
  watch: {
    bakedData (val) {
      // this.refreshAdvOptsSelect(val)
    }
  },
  methods: {
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    toggle (row) {
      row.toggleDetails?.call()
      row.detailsShowing ? row.unselectRow?.call() : row.selectRow?.call()
    },
    extractDueDate (str) {
      const matched = Array.from(str?.matchAll(this.regex))
      /** expect array result
       * 0: 本筆土地應於１１０年９月３日前移轉與本國人"
       * 1: "１１０"
       * 2: "９"
       * 3: "３"
       * groups: undefined
       * index: 0
       * input: "本筆土地應於１１０年９月３日前移轉與本國人，逾期辦理公開標售"
       */
      if (Array.isArray(matched[0])) {
        const year = 1911 + parseInt(this.$utils.convertDBytesNumber(matched[0][1]))
        const month = this.$utils.convertDBytesNumber(matched[0][2]) - 1
        const day = this.$utils.convertDBytesNumber(matched[0][3])
        return new Date(year, month, day)
      }
      return false
    },
    deadline (item) {
      const d = this.extractDueDate(item.GG30_2)
      if (d) {
        return this.$utils.addDateDivider(this.$utils.twDateStr(d))
      }
      return '無期限'
    },
    light (item) {
      const dueDate = this.extractDueDate(item.GG30_2)
      if (dueDate) {
        const ts = dueDate.getTime()
        const now = this.$utils.nowTs()
        if (now > ts) {
          return '🔴'
        }
        const offset = ts - now
        if (offset < 6 * 30 * 24 * 60 * 60 * 1000) {
          return '🟡'
        }
      }
      return '🟢'
    },
    popupCase (item) {
      this.modal(this.$createElement(lahRegCaseDetailVue, {
        props: {
          caseId: item.ID,
          parentData: item
        },
        on: {
          'not-found': () => {
            this.hideModal()
            this.warning(`⚠ 無法找到 ${this.$utils.caseId(item.ID)} 登記案件資料。`)
          }
        }
      }), {
        title: `案件詳情 ${this.$utils.caseId(item.ID)}`,
        size: 'xl'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.vw-50 {
  width: 33vw;
}
.w-3rd {
  width: 33.33%;
}
.truncate-mvw {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(15vw - 0px);
}
</style>
