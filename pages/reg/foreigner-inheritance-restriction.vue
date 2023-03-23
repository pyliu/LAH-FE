<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 外國人繼承限制
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          .h5 查詢系統內其他登記事項註記符合下列情況案件。
          ul
            li 註記內含「 ... 移轉與 ... 」(範例：本筆土地應於０００年０月０日前移轉與本國人，逾期辦理公開標售)
            li 註記內不含「 ... 移請 ... 」(範例：．．．移請財政部國有財產數公開標售。)
            li 狀態說明
              ul
                li 🔴 - 已逾期，須盡速辦理
                li 🟡 - 需進行通知快逾期(半年)
                li 🟢 - 正常
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
    select-mode="single",
    selected-variant="success",
    :busy="isBusy",
    :items="filteredData",
    :fields="fields",
    :borderless="false",
    :outlined="false",
    caption-top,
    selectable,
    hover,
    striped,
    bordered,
    small,
    no-border-collapse
  )
    template(v-slot:cell(light)="{ item, index, rowSelected }")
      .div {{ light(item) }}
    template(v-slot:cell(deadline)="{ item, index, rowSelected }")
      .text-nowrap {{ deadline(item) }}
    template(v-slot:cell(BA48)="{ item, index, rowSelected }")
      div {{ item.BA48 }} {{ item.BA48_CHT }}
    template(v-slot:cell(BA48)="{ item, index, rowSelected }")
      div {{ item.BA48 }} {{ item.BA48_CHT }}
    template(v-slot:cell(BA49)="{ item, index, rowSelected }")
      div {{ $utils.formatLandNumber(item.BA49) }}
    template(v-slot:cell(BB06)="{ item, index, rowSelected }")
      div(:title="item.BB06") {{ item.BB06_CHT }}
    template(v-slot:cell(BB09)="{ item, index, rowSelected }")
      div(:title="item.BB09") {{ item.BB09_CHT }}
    template(v-slot:cell(BB15_1)="{ item, index, rowSelected }")
      div(:title="item.BB15_1") {{ item.BB15_1_CHT }}

</template>

<script>
import lahButton from '~/components/lah-button.vue'
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
      {
        key: 'BB21',
        label: '申報地價',
        sortable: true
      },
      {
        key: 'GG30_2',
        label: '其他登記事項',
        sortable: false,
        thStyle: 'min-width: 500px'
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
  mounted () {
    const test = '本筆土地應於１１０年９月３日前移轉與本國人，逾期辦理公開標售'
    const d = this.extractDueDate(test)

    console.warn(d, this.$utils.twDateStr(d))
  },
  methods: {
    reload () {
      this.forceReload = true
      this.$fetch()
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
    }
  }
}
</script>

<style lang="scss" scoped>
.vw-50 {
  width: 33vw;
}
</style>
