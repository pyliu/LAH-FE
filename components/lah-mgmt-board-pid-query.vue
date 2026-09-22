<template lang="pug">
b-card(:class="{ 'board-expanded': hasResults }")
  template(#header)
    .d-flex.w-100.justify-content-between.align-items-center.mb-0
      h6.my-auto.font-weight-bolder
        lah-fa-icon(icon="id-card", size="lg") 查詢人民申請案件
      lah-button.my-auto(
        variant="outline-success",
        icon="question",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="查詢說明",
        size="sm"
      )

  lah-help-modal(ref="help", modal-title="查詢人民申請案件說明", size="lg")
    h5.font-weight-bold 查詢登記與測量之人民申請案件
    p 輸入身分證號或居留證號，即時向地政資料庫查找登記案件與測量案件。
    hr
    h6.font-weight-bold SQL 查詢邏輯參考：
    pre.bg-light.p-2.border.rounded.small
      code.
        -- 【登記案件】MOICAS.CRSMS 土地登記案件查詢 (權利人+義務人+代理人+複代)
        SELECT t.*
        FROM MOICAS.CRSMS t
        WHERE t.RM18 = :id
           OR t.RM21 = :id
           OR t.RM24 = :id
           OR t.RM25 = :id
        ORDER BY RM07_1 DESC;

        -- 【測量案件】MOICAS.CMSMS 測量案件資料查詢 (申請人+代理人+複代)
        SELECT t.*, w.KCNT AS "MM06_CHT"
        FROM MOICAS.CMSMS t
        LEFT JOIN MOIADM.RKEYN w ON t.MM06 = w.KCDE_2 AND w.KCDE_1 = 'M3'
        WHERE t.MM13 = :id
           OR t.MM17_1 = :id
           OR t.MM17_2 = :id
        ORDER BY MM04_1 DESC;

  //- 統一編號輸入區
  b-input-group.input-group-height-hack(size="sm", prepend="身分證號")
    b-form-input.no-cache(
      ref="input",
      v-model="pid",
      placeholder="🔍 如：H221350201",
      @keyup.enter="query",
      @input="handleInput",
      :state="validateState",
      maxlength="10",
      title="請輸入10碼身分證號或居留證號",
      style="height: 33px;"
    )
    template(#append)
      lah-button(
        v-if="pid",
        icon="xmark",
        variant="outline-secondary",
        @click="clean",
        title="清除"
      )
      lah-button(
        icon="magnifying-glass",
        variant="outline-primary",
        @click="query",
        title="搜尋案件",
        :disabled="!validate",
        :busy="isBusy"
      ) 搜尋

  //- 查詢結果摘要標籤
  .mt-2(v-if="hasResults")
    .d-flex.justify-content-between.align-items-center.mb-1.text-muted.small.border-bottom.pb-1
      span
        lah-fa-icon(icon="list-check")
        span.ml-1 查詢結果【{{ searchedPid }}】
      span.text-muted 點擊檢視案件清單
    .d-flex.flex-wrap.align-items-center
      .m-1.px-2.py-1.rounded.border.d-inline-flex.align-items-center.result-badge.bg-light.text-dark(
        @click="openModal(0)",
        title="點擊查看登記案件清單"
      )
        lah-fa-icon.mr-1(icon="folder", variant="primary")
        span 登記案件
        b-badge.ml-1(variant="primary", pill) {{ crsmsCount }} 件
      .m-1.px-2.py-1.rounded.border.d-inline-flex.align-items-center.result-badge.bg-light.text-dark(
        @click="openModal(1)",
        title="點擊查看測量案件清單"
      )
        lah-fa-icon.mr-1(icon="compass-drafting", variant="success")
        span 測量案件
        b-badge.ml-1(variant="success", pill) {{ cmsmsCount }} 件

  .mt-2.text-muted.small.text-center(v-else-if="searched && !isBusy")
    span 查無「{{ searchedPid }}」之人民申請案件資料

  //- 詳細資料彈出視窗
  b-modal#pid-query-modal(
    ref="detailModal",
    :title="`查詢人民申請案件【${searchedPid}】`",
    size="xl",
    hide-footer,
    scrollable
  )
    .d-flex.justify-content-between.align-items-center.mb-2
      .d-flex.align-items-center
        b-badge.mr-2(variant="primary", pill) 登記案件 {{ crsmsCount }} 件
        b-badge(variant="success", pill) 測量案件 {{ cmsmsCount }} 件
      lah-button(
        icon="file-csv",
        variant="outline-success",
        size="sm",
        @click="exportCsv",
        title="匯出案件資料為 CSV",
        :disabled="currentCount === 0"
      ) 匯出 CSV

    b-tabs(v-model="tabIndex", pills, card)
      b-tab
        template(#title)
          lah-fa-icon(icon="folder")
          span.ml-1 登記案件
          b-badge.ml-1(variant="light", pill) {{ crsmsCount }}
        lah-reg-b-table(
          v-if="crsmsCount > 0",
          :baked-data="crsmsData",
          :max-height="450",
          :small="true"
        )
        .text-center.my-5.text-muted(v-else)
          lah-fa-icon(icon="folder-open", size="2x", class="mb-2")
          div 查無「{{ searchedPid }}」之登記案件資料

      b-tab
        template(#title)
          lah-fa-icon(icon="compass-drafting")
          span.ml-1 測量案件
          b-badge.ml-1(variant="light", pill) {{ cmsmsCount }}
        b-table.text-center(
          v-if="cmsmsCount > 0",
          :items="cmsmsData",
          :fields="cmsmsFields",
          responsive="sm",
          striped,
          hover,
          bordered,
          small,
          no-border-collapse,
          head-variant="dark"
        )
          template(#cell(序號)="data")
            | {{ data.index + 1 }}
          template(#cell(收件字號)="{ item }")
            a(
              v-if="webapIp",
              :href="caseQueryUrl(item.MM01, item.MM02, item.MM03)",
              target="_blank",
              rel="noreferrer noopener",
              title="開啟 WebAP 測量案件詳情"
            )
              | {{ item.MM01 }}-{{ item.MM02 }}-{{ item.MM03 }}
              lah-fa-icon.ml-1(icon="arrow-up-right-from-square", size="sm")
            span(v-else) {{ item.MM01 }}-{{ item.MM02 }}-{{ item.MM03 }}
          template(#cell(收件日期)="{ item }")
            | {{ item.MM04_1 }}
          template(#cell(申請事由)="{ item }")
            span(v-if="item.MM06_CHT") {{ item.MM06 }}：{{ item.MM06_CHT }}
            span(v-else) {{ item.MM06 }}
          template(#cell(辦理情形)="{ item }")
            span {{ item.MM22 }} {{ item.MM23 }}
        .text-center.my-5.text-muted(v-else)
          lah-fa-icon(icon="folder-open", size="2x", class="mb-2")
          div 查無「{{ searchedPid }}」之測量案件資料
</template>

<script>
export default {
  name: 'LahMgmtBoardPidQuery',
  data: () => ({
    pid: '',
    searchedPid: '',
    searched: false,
    isBusy: false,
    tabIndex: 0,
    crsmsData: [],
    cmsmsData: [],
    cmsmsFields: [
      { key: '序號', label: '#' },
      { key: '收件字號', label: '收件字號', sortable: true },
      { key: '收件日期', label: '收件日期', sortable: true },
      { key: '申請事由', label: '申請事由', sortable: true },
      { key: '辦理情形', label: '辦理情形', sortable: true },
      { key: 'MM13', label: '申請人統編', sortable: true },
      { key: 'MM17_1', label: '代理人統編', sortable: true }
    ]
  }),
  computed: {
    crsmsCount () {
      return this.crsmsData?.length || 0
    },
    cmsmsCount () {
      return this.cmsmsData?.length || 0
    },
    totalCount () {
      return this.crsmsCount + this.cmsmsCount
    },
    currentCount () {
      return this.tabIndex === 0 ? this.crsmsCount : this.cmsmsCount
    },
    hasResults () {
      return this.searched && this.totalCount > 0
    },
    validate () {
      if (!this.pid || !this.pid.trim()) { return false }
      return this.checkID(this.pid)
    },
    validateState () {
      if (!this.pid || !this.pid.trim()) { return null }
      return Boolean(this.validate)
    }
  },
  methods: {
    handleInput (val) {
      this.pid = (val || '').trim().toUpperCase()
    },
    clean () {
      this.pid = ''
      this.searched = false
      this.crsmsData = []
      this.cmsmsData = []
    },
    checkID (id) {
      if (!id) { return false }
      const cleanId = String(id).trim().toUpperCase()
      // 10 碼且第一碼英文字母、第二碼 1/2/8/9/A/B/C/D
      if (!/^[A-Z][1289ABCD]\d{8}$/.test(cleanId)) {
        return false
      }
      const tab = 'ABCDEFGHJKLMNPQRSTUVXYWZIO'
      const a1 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3]
      const a2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5]
      const mx = [9, 8, 7, 6, 5, 4, 3, 2, 1, 1]

      const i = tab.indexOf(cleanId.charAt(0))
      if (i === -1) { return false }
      let sum = a1[i] + a2[i] * 9

      for (let j = 1; j < 10; j++) {
        const c = cleanId.charAt(j)
        let v = parseInt(c, 10)
        if (isNaN(v)) {
          // 舊版外僑居留證第二碼為英文字母時處理
          v = (tab.indexOf(c) % 10)
        }
        sum += v * mx[j]
      }
      return sum % 10 === 0
    },
    caseQueryUrl (MM01, MM02, MM03) {
      return `http://${this.webapIp}:9080/Land${this.site}/CAS/CMC01/CMC0102.jsp?reciveYear=${MM01}&reciveId=${MM02}&reciveNumber=${MM03}`
    },
    openModal (tab = 0) {
      this.tabIndex = tab
      this.$refs.detailModal.show()
    },
    async query () {
      const targetId = this.pid.trim().toUpperCase()
      if (!this.checkID(targetId)) {
        this.warning(`「${targetId}」身分證號格式錯誤`)
        return
      }

      this.isBusy = true
      this.searched = true
      this.searchedPid = targetId
      const cacheKey = `case-query-by-pid-${targetId}`

      try {
        const cached = await this.getCache(cacheKey)
        if (cached && typeof cached === 'object') {
          this.crsmsData = cached.crsms || []
          this.cmsmsData = cached.cmsms || []
          this.openModal(this.crsmsCount > 0 ? 0 : 1)
          return
        }

        // 同步向後端發送登記與測量案件查詢請求
        const [crsmsRes, cmsmsRes] = await Promise.all([
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'crsms',
            id: targetId
          }),
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'cmsms',
            id: targetId
          })
        ])

        const crsmsRaw = this.$utils.statusCheck(crsmsRes.data?.status)
          ? (crsmsRes.data.baked || [])
          : []
        const cmsmsRaw = this.$utils.statusCheck(cmsmsRes.data?.status)
          ? (cmsmsRes.data.raw || [])
          : []

        this.crsmsData = crsmsRaw
        this.cmsmsData = cmsmsRaw

        // 緩存 15 分鐘
        await this.setCache(cacheKey, {
          crsms: this.crsmsData,
          cmsms: this.cmsmsData
        }, 15 * 60 * 1000)

        if (this.totalCount > 0) {
          this.openModal(this.crsmsCount > 0 ? 0 : 1)
        } else {
          this.warning(`「${targetId}」查無任何登記或測量案件資料。`)
        }
      } catch (err) {
        this.$utils.error(err)
      } finally {
        this.isBusy = false
      }
    },
    exportCsv () {
      if (this.tabIndex === 0) {
        // 匯出登記案件
        if (this.crsmsCount === 0) { return }
        const headers = ['收件年', '收件字', '收件號', '收件字號', '登記原因', '收件日期', '結案日期', '辦理情形']
        const rows = this.crsmsData.map(r => [
          r.RM01 || '',
          r.RM02 || '',
          r.RM03 || '',
          r.收件字號 || '',
          r.登記原因 || '',
          r.收件日期 || '',
          r.結案日期 || '',
          r.辦理情形 || ''
        ])
        this.downloadCsv(headers, rows, `登記案件_${this.searchedPid}.csv`)
      } else {
        // 匯出測量案件
        if (this.cmsmsCount === 0) { return }
        const headers = ['收件年', '收件字', '收件號', '收件日期', '申請事由', '辦理情形', '申請人統編', '代理人統編']
        const rows = this.cmsmsData.map(r => [
          r.MM01 || '',
          r.MM02 || '',
          r.MM03 || '',
          r.MM04_1 || '',
          (r.MM06_CHT ? `${r.MM06}:${r.MM06_CHT}` : r.MM06) || '',
          `${r.MM22 || ''} ${r.MM23 || ''}`.trim(),
          r.MM13 || '',
          r.MM17_1 || ''
        ])
        this.downloadCsv(headers, rows, `測量案件_${this.searchedPid}.csv`)
      }
    },
    downloadCsv (headers, rows, filename) {
      const formattedRows = rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...formattedRows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}
</script>

<style lang="scss" scoped>
.input-group-height-hack,
.input-group {
  align-items: stretch;

  &::v-deep .input-group-text,
  &::v-deep .form-control,
  &::v-deep .btn {
    height: 33px !important;
  }
}

.result-badge {
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  font-size: 0.85rem;
  border-color: #ced4da !important;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
    border-color: #007bff !important;
  }
}
</style>
