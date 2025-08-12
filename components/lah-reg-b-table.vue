<!-- eslint-disable vue/no-v-html -->
<template>
  <div>
    <lah-transition appear>
      <div v-if="enableKeywordFilter" class="d-flex align-items-center justify-content-end mb-1">
        <b-input
          v-model="keyword"
          size="sm"
          class="col-2"
          placeholder="... 輸入關鍵字篩選案件 ..."
        />
      </div>
    </lah-transition>
    <lah-transition>
      <lah-pagination
        v-model="pagination"
        :total-rows="pagination.count"
        :caption="`找到 ${pagination.count} 筆資料`"
      />
    </lah-transition>
    <b-table
      ref="bTable"
      :items="filtered"
      :fields="tblFields"
      :busy="isBusy || busy"
      :responsive="'lg'"
      :table-variant="tableVariant"
      :tbody-tr-class="trClass"
      :tbody-transition-props="transProps"
      :sticky-header="maxHeightPx"
      :small="small"
      :per-page="pagination.perPage"
      :current-page="pagination.currentPage"

      head-variant="dark"
      primary-key="序號"
      class="text-center"
      select-mode="single"
      selected-variant="success"

      :borderless="false"
      :outlined="false"
      :dark="false"
      :fixed="false"
      :foot-clone="false"
      striped
      hover
      bordered
      no-border-collapse
      caption-top
      selectable

      @row-selected="handleRowSelected"
    >
      <template #table-busy>
        <span class="ld-txt">讀取中...</span>
      </template>

      <template #cell(收件字號)="row">
        <div v-b-popover.hover.focus.d400="{ content: row.item['結案狀態'], variant: row.item['燈號'] }">
          <lah-fa-icon
            v-if="showIcon"
            prefix="fas"
            :icon="icon"
            :variant="iconVariant"
          />
          <span v-if="mute" v-html="highlightBakedContent(row)" />
          <span v-else-if="onlyPopupDetail">
            <b-link @click="popup(row.item)">
              <span v-html="highlightBakedContent(row)" />
            </b-link>
          </span>
          <span v-else>
            <NuxtLink :to="`/regcase/${bakedContent(row)}`">
              <span v-html="highlightBakedContent(row)" />
            </NuxtLink>
            <b-link @click="popup(row.item)"><lah-fa-icon icon="window-restore" regular /></b-link>
          </span>
        </div>
      </template>

      <template #cell(收件時間)="row">
        <div v-html="highlight(row.item.收件時間)" />
      </template>

      <template #cell(結案日期)="row">
        <div v-html="highlight(row.item.結案日期)" />
      </template>

      <template #cell(收件日期)="row">
        <div class="text-nowrap" v-html="highlight(row.item.收件日期)" />
      </template>

      <template #cell(登記原因)="row">
        <div v-html="highlight(reason(row))" />
      </template>
      <template #cell(RM09)="row">
        <div v-html="highlight(reason(row))" />
      </template>

      <template #cell(辦理情形)="row">
        <div v-html="highlight(row.item.辦理情形)" />
      </template>

      <template #cell(作業人員)="{ item }">
        <a
          href="javascript:void(0)"
          @click="userinfo(item.作業人員, item.RM30_1)"
          v-html="highlight(item.作業人員)"
        />
      </template>

      <template #cell(複審人員)="{ item }">
        <a
          href="javascript:void(0)"
          @click="userinfo(item.複審人員, item.RM47)"
          v-html="highlight(item.複審人員)"
        />
      </template>

      <template #cell(移轉課長)="{ item }">
        <a
          href="javascript:void(0)"
          @click="userinfo(item.移轉課長, item.RM106)"
          v-html="highlight(item.移轉課長)"
        />
      </template>

      <template #cell(序號)="row">
        {{ (pagination.currentPage - 1) * pagination.perPage + row.index + 1 }}
      </template>

      <template #cell(#)="row">
        {{ (pagination.currentPage - 1) * pagination.perPage + row.index + 1 }}
      </template>

      <template #cell(燈號)="row">
        <lah-fa-icon
          prefix="fas"
          icon="circle"
          :variant="row.item['燈號']"
        />
      </template>

      <template #cell(公告燈號)="{ item }">
        <lah-fa-icon
          prefix="fas"
          icon="circle"
          :variant="item['公告燈號']"
          :title="rm30HLightTitle(item)"
        />
      </template>

      <template #cell(請示燈號)="{ item }">
        <lah-fa-icon
          prefix="fas"
          icon="circle"
          :variant="item['請示燈號']"
          :title="askLightTitle(item)"
        />
      </template>

      <template #cell(限辦時間)="row">
        <lah-fa-icon
          v-b-popover.hover.focus.d400="{ content: row.item['預定結案日期'], variant: row.item['燈號'] }"
          prefix="fas"
          icon="circle"
          :variant="row.item['燈號']"
          class="text-nowrap"
        />
        {{ row.value }}
      </template>

      <template #cell(RM07_1)="row">
        <span v-b-popover.hover.focus.d400="row.item['收件時間']">{{ row.item["RM07_1"] }}</span>
      </template>

      <template #cell(初審人員)="{ item, rowSelected }">
        <template v-if="rowSelected">
          <span aria-hidden="true">&check;</span>
          <span class="sr-only">Selected</span>
        </template>
        <template v-else>
          <span aria-hidden="true">&nbsp;</span>
          <span class="sr-only">Not selected</span>
        </template>
        <b-link v-if="!$utils.empty(item['初審人員'])" @click="userinfo(item['初審人員'], item['RM45'])">
          <b-button variant="outline-primary" size="sm" pill>
            <lah-avatar :id="item['RM45']" :name="item['初審人員']">
              {{ item["初審人員"] }}
            </lah-avatar>
          </b-button>
        </b-link>
      </template>
      <template #cell(複審人員)="{ item }">
        <a
          v-b-popover.top.hover.focus.html="passedTime(item, item.ELAPSED_TIME['複審'])"
          href="javascript:void(0)"
          @click="userinfo(item['複審人員'], item['RM47'])"
        >{{ item["複審人員"] }}</a>
      </template>
      <template #cell(收件人員)="{ item }">
        <a
          href="javascript:void(0)"
          @click="userinfo(item['收件人員'], item['RM96'])"
        >{{ item["收件人員"] }}</a>
      </template>
      <template #cell(准登人員)="{ item }">
        <a
          v-b-popover.top.hover.focus.html="(item, item.ELAPSED_TIME['准登'])"
          href="javascript:void(0)"
          @click="userinfo(item['准登人員'], item['RM63'])"
        >{{ item["准登人員"] }}</a>
      </template>
      <template #cell(登錄人員)="{ item }">
        <a
          v-b-popover.top.hover.focus.html="passedTime(item, item.ELAPSED_TIME['登簿'])"
          href="javascript:void(0)"
          @click="userinfo(item['登錄人員'], item['RM55'])"
        >{{ item["登錄人員"] }}</a>
      </template>
      <template #cell(校對人員)="{ item }">
        <a
          v-b-popover.top.hover.focus.html="passedTime(item, item.ELAPSED_TIME['校對'])"
          href="javascript:void(0)"
          @click="userinfo(item['校對人員'], item['RM57'])"
        >{{ item["校對人員"] }}</a>
      </template>
      <template #cell(結案人員)="{ item }">
        <a
          v-b-popover.top.hover.focus.html="passedTime(item, item.ELAPSED_TIME['結案'])"
          href="javascript:void(0)"
          @click="userinfo(item['結案人員'], item['RM59'])"
        >{{ item["結案人員"] }}</a>
      </template>
      <template #cell(校對日期)="{ item }">
        <span class="text-nowrap">{{ item.校對日期.split(' ')[0] }}</span>
      </template>
    </b-table>
    <b-modal
      ref="detail"
      hide-footer
      centered
      no-close-on-backdrop
      size="xl"
      scrollable
    >
      <template #modal-title>
        登記案件詳情 {{ $utils.caseId(clickedId) }}
      </template>
      <h4 v-if="modalLoading" class="text-center text-info my-5">
        <b-spinner small type="grow" />
        <strong class="ld-txt">查詢中...</strong>
      </h4>
      <lah-reg-case-detail :reload="caseReload" :case-id="clickedId" :parent-data="clickedData" @ready="modalLoading = !$event.detail" />
    </b-modal>
  </div>
</template>

<script>
import lahUserCard from '~/components/lah-user-card.vue'
export default {
  emit: ['count-changed'],
  name: 'LahRegBTable',
  // eslint-disable-next-line vue/no-unused-components
  components: { lahUserCard },
  props: {
    bakedData: { type: Array, default: () => ([]) },
    type: { type: String, default: '' },
    fields: { type: Array, default: undefined },
    mute: { type: Boolean, default: false },
    noCaption: { type: Boolean, default: false },
    color: { type: Boolean, default: false },
    icon: { type: String, default: '' },
    iconVariant: { type: String, default: '' },
    busy: { type: Boolean, default: false },
    tableVariant: { type: String, default: '' },
    onlyPopupDetail: { type: Boolean, default: true },
    captionAppend: { type: String, default: '' },
    maxHeightOffset: { type: Number, default: 105 },
    caseReload: { type: Boolean, default: false },
    small: { type: Boolean, default: true },
    enableKeywordFilter: { type: Boolean, default: false }
  },
  data: () => ({
    transProps: {
      name: 'rollIn'
    },
    modalLoading: true,
    clickedId: undefined,
    clickedData: undefined,
    keyword: '',
    pagination: {
      perPage: 15,
      currentPage: 1,
      count: 0
    }
  }),
  computed: {
    filtered () {
      if (this.$utils.length(this.keyword) > 1) {
        const regex = new RegExp(this.keyword)
        const tmp = this.bakedData?.filter((row) => {
          // 使用 keys 陣列中的值，動態篩選欄位
          return this.tblKeys.some((key) => {
            // 檢查 row 物件是否具有當前 key 屬性，且值通過 regex 測試
            return Object.prototype.hasOwnProperty.call(row, key) && regex.test(row[key])
          })
        })
        this.$emit('count-changed', tmp?.length)
        return tmp
      }
      this.$emit('count-changed', this.bakedData?.length)
      return this.bakedData
    },
    tblKeys () {
      // 使用 map() 方法提取 key 欄位的值
      return this.tblFields.map(column => column.key)
    },
    tblFields () {
      if (!this.$utils.empty(this.fields)) { return this.fields }
      switch (this.type) {
        case 'md':
          return [
            {
              key: '收件字號',
              sortable: this.sort
            },
            {
              key: '登記原因',
              sortable: this.sort
            },
            {
              key: '辦理情形',
              sortable: this.sort
            },
            {
              key: '初審人員',
              sortable: this.sort
            },
            {
              key: '作業人員',
              sortable: this.sort
            },
            {
              key: '收件時間',
              sortable: this.sort
            },
            {
              key: '限辦時間',
              sortable: this.sort
            }
            // {key: "預定結案日期", label:"限辦期限", sortable: this.sort}
          ]
        case 'lg':
          return [
            {
              key: '收件字號',
              sortable: this.sort
            },
            {
              key: '收件日期',
              sortable: this.sort
            },
            {
              key: '登記原因',
              sortable: this.sort
            },
            {
              key: '辦理情形',
              sortable: this.sort
            },
            {
              key: '收件人員',
              label: '收件',
              sortable: this.sort
            },
            {
              key: '作業人員',
              label: '作業',
              sortable: this.sort
            },
            {
              key: '初審人員',
              label: '初審',
              sortable: this.sort
            },
            {
              key: '複審人員',
              label: '複審',
              sortable: this.sort
            },
            {
              key: '准登人員',
              label: '准登',
              sortable: this.sort
            },
            {
              key: '登錄人員',
              label: '登簿',
              sortable: this.sort
            },
            {
              key: '校對人員',
              label: '校對',
              sortable: this.sort
            },
            {
              key: '結案人員',
              label: '結案',
              sortable: this.sort
            }
          ]
        case 'xl':
          return [
            // {key: "燈號", sortable: this.sort},
            {
              key: '序號',
              sortable: !this.sort
            },
            {
              key: '收件字號',
              sortable: this.sort
            },
            {
              key: '收件時間',
              sortable: this.sort
            },
            {
              key: '限辦時間',
              label: '限辦',
              sortable: this.sort
            },
            {
              key: '登記原因',
              sortable: this.sort
            },
            {
              key: '辦理情形',
              sortable: this.sort
            },
            {
              key: '收件人員',
              label: '收件',
              sortable: this.sort
            },
            {
              key: '作業人員',
              label: '作業',
              sortable: this.sort
            },
            {
              key: '初審人員',
              label: '初審',
              sortable: this.sort
            },
            {
              key: '複審人員',
              label: '複審',
              sortable: this.sort
            },
            {
              key: '准登人員',
              label: '准登',
              sortable: this.sort
            },
            {
              key: '登錄人員',
              label: '登簿',
              sortable: this.sort
            },
            {
              key: '校對人員',
              label: '校對',
              sortable: this.sort
            },
            {
              key: '結案人員',
              label: '結案',
              sortable: this.sort
            }
            // {key: "結案狀態", label: "狀態", sortable: this.sort}
          ]
        case 'flow':
          return [
            {
              key: '辦理情形',
              sortable: this.sort
            },
            {
              key: '收件人員',
              label: '收件',
              sortable: this.sort
            },
            {
              key: '作業人員',
              label: '作業',
              sortable: this.sort
            },
            {
              key: '初審人員',
              label: '初審',
              sortable: this.sort
            },
            {
              key: '複審人員',
              label: '複審',
              sortable: this.sort
            },
            {
              key: '准登人員',
              label: '准登',
              sortable: this.sort
            },
            {
              key: '登錄人員',
              label: '登簿',
              sortable: this.sort
            },
            {
              key: '校對人員',
              label: '校對',
              sortable: this.sort
            },
            {
              key: '結案人員',
              label: '結案',
              sortable: this.sort
            }
          ]
        default:
          return [
            {
              key: 'RM01',
              label: '收件字號',
              sortable: this.sort
            },
            {
              key: 'RM07_1',
              label: '收件日期',
              sortable: this.sort
            },
            {
              key: 'RM09',
              label: '登記原因',
              sortable: this.sort
            },
            {
              key: '辦理情形',
              sortable: this.sort
            }
          ]
      }
    },
    count () {
      return this.filtered?.length || 0
    },
    caption () {
      if (this.mute || this.noCaption) { return '' }
      return this.busy ? '讀取中' : `找到 ${this.count} 件案件${this.captionAppend}`
    },
    showIcon () { return !this.$utils.empty(this.icon) },
    sort () {
      return this.$utils.empty(this.mute)
    },
    maxHeightPx () { return `${this.stickyHeaderMaxHeight}px` }
  },
  watch: {
    count (val) {
      this.pagination.count = val
      this.pagination.currentPage = 1
    },
    'pagination.perPage' (val) {
      this.setCache('lah-reg-b-table-perPage', val)
    }
  },
  mounted () {
    if (!this.$isServer && window) {
      this.calcStickyHeaderMaxHeight(this.maxHeightOffset)
      this.getCache('lah-reg-b-table-perPage').then((val) => {
        this.pagination.perPage = parseInt(val) || 15
      })
    }
  },
  methods: {
    popup (data) {
      this.modalLoading = true
      this.clickedId = `${data.RM01}${data.RM02}${data.RM03}`
      this.clickedData = data
      this.$refs.detail?.show()
    },
    bakedContent (row) {
      return row.item[row.field.label]
    },
    highlightBakedContent (row) {
      return this.highlight(row.item[row.field.label])
    },
    reason (row) {
      return (
        row.item.RM09 +
        ' : ' +
        (this.$utils.empty(row.item['登記原因'])
          ? row.item.RM09_CHT
          : row.item['登記原因'])
      )
    },
    trClass (item, type) {
      if (item && type === 'row') { return this.color ? item['紅綠燈背景CSS'] : `filter-${item['燈號']}` }
    },
    passedTime (item, timeDurationSecs) {
      if (isNaN(timeDurationSecs) || this.$utils.empty(timeDurationSecs)) { return false }
      if (timeDurationSecs === '0' && this.$utils.empty(item['結案代碼'])) {
        return '<i class="fa fa-tools ld ld-clock"></i> 作業中'
      }
      if (timeDurationSecs < 60) { return '耗時 ' + timeDurationSecs + ' 秒' }
      if (timeDurationSecs < 3600) {
        return (
          '耗時 ' +
          Number.parseFloat(timeDurationSecs / 60).toFixed(2) +
          ' 分鐘'
        )
      }
      return (
        '耗時 ' +
        Number.parseFloat(timeDurationSecs / 60 / 60).toFixed(2) +
        ' 小時'
      )
    },
    rm30HLightTitle (item) {
      if (item['公告燈號'] === 'danger') {
        return '已到期'
      }
      if (item['公告燈號'] === 'warning') {
        return '快到期'
      }
      if (item['公告燈號'] === 'success') {
        return '公告中'
      }
      return '審核中'
    },
    askLightTitle (item) {
      return item['請示燈號'] === 'danger' ? '逾期案件' : (item['公告燈號'] === 'warning' ? '快到期案件' : '正常案件')
    },
    highlight (text, css = 'highlight-yellow') {
      if (this.$utils.length(this.keyword) > 1) {
        return this.$utils.highlight(
          text,
          this.keyword,
          css
        )
      }
      return text
    },
    reset () {
      this.pagination.currentPage = 1
    },
    handleRowSelected (payload) {
      if (payload?.length > 0) {
        // this.$utils.warn('row selected', payload)
        this.popup(payload[0])
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
