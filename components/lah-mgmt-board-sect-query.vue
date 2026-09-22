<template lang="pug">
b-card(:class="{ 'board-expanded': filteredSections.length > 0 }")
  template(#header)
    .d-flex.w-100.justify-content-between.align-items-center.mb-0
      h6.my-auto.font-weight-bolder
        lah-fa-icon(icon="map", size="lg") 轄區段別資料
      b-button-group.align-middle.my-auto(size="sm")
        lah-button(
          to="/reg/ralid",
          variant="outline-primary",
          icon="table",
          no-border,
          no-icon-gutter,
          title="土地標示部綜合查詢頁面"
        )
        lah-button(
          variant="outline-success",
          icon="question",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="查詢說明"
        )

  lah-help-modal(ref="help", modal-title="轄區段別資料查詢說明", size="lg")
    h5.font-weight-bold 土地標示部筆數＆面積查詢
    p 透過查詢地政系統土地標示部資料庫，即時統整轄區各段小段之土地筆數與總面積。
    hr
    h6.font-weight-bold SQL 查詢邏輯參考：
    pre.bg-light.p-2.border.rounded.small
      code.
        -- 段小段筆數＆面積計算 (RALID 登記－土地標示部)
        SELECT m.KCDE_2 as "段代碼",
               m.KCNT as "段名稱",
               SUM(t.AA10) as "面積",
               COUNT(t.AA10) as "土地標示部筆數",
               t.AA46 as "區代碼",
               q.KNAME as "區名稱"
        FROM MOIADM.RKEYN m
        LEFT JOIN MOICAD.RALID t
            ON m.KCDE_2 = t.AA48
        LEFT JOIN MOIADM.RKEYN_ALL q
            ON q.KCDE_1 = '46'
           AND q.KCDE_2 = 'H'
           AND t.AA46 = q.KCDE_3
        WHERE m.KCDE_1 = '48'
          AND m.KCDE_2 NOT LIKE '/*%'
          AND t.AA46 IS NOT NULL
        GROUP BY m.KCDE_2, m.KCNT, t.AA46, q.KNAME

  //- 相關規章與表單連結
  .d-flex.justify-content-between.align-items-center.mb-2.small
    span.text-muted 相關規章與表單：
    .d-flex
      a.mr-2(
        :href="`${legacyUrl}/assets/files/桃園市土地基本資料庫電子資料收費標準.pdf`",
        target="_blank",
        rel="noreferrer noopener"
      )
        lah-fa-icon(icon="file-pdf", regular) 收費標準
      a(
        :href="`${legacyUrl}/assets/files/%E5%9C%9F%E5%9C%B0%E5%9F%BA%E6%9C%AC%E8%B3%87%E6%96%99%E5%BA%AB%E9%9B%BB%E5%AD%90%E8%B3%87%E6%96%99%E6%B5%81%E9%80%9A%E7%94%B3%E8%AB%8B%E8%A1%A8.doc`",
        target="_blank",
        rel="noreferrer noopener"
      )
        lah-fa-icon(icon="file-word", regular) 申請書

  //- 關鍵字輸入區
  b-input-group(size="sm", prepend="關鍵字/段代碼")
    b-form-input.no-cache(
      ref="input",
      v-model="input",
      placeholder="🔍 '0200' 或 '忠福段' (留空查全部)",
      @keyup.enter="query",
      :state="validateState",
      title="輸入段代碼或段名稱，留空可查詢全轄區段別"
    )
    template(#append)
      lah-button(
        v-if="input",
        icon="xmark",
        variant="outline-secondary",
        @click="input = ''",
        title="清除"
      )
      lah-button(
        icon="magnifying-glass",
        variant="outline-primary",
        @click="query",
        title="搜尋段小段 (留空查詢全部)",
        :disabled="!validate",
        :busy="isBusy"
      ) 搜尋

  //- 匹配結果標籤清單
  .mt-2(v-if="filteredSections.length > 0")
    .d-flex.justify-content-between.align-items-center.mb-1.text-muted.small.border-bottom.pb-1
      span
        lah-fa-icon(icon="list-check")
        span.ml-1 符合轄區段別 (共 {{ filteredSections.length }} 個)
      span.text-muted 點擊檢視詳細資料
    .secttag-container.overflow-auto
      .d-flex.flex-wrap.align-items-center
        .m-1.px-2.py-1.rounded.border.d-inline-flex.align-items-center.sectcard.bg-light.text-dark(
          v-for="sect in filteredSections",
          :key="'secttag_' + sect.段代碼",
          @click.stop="openModal(sect)",
          v-b-popover.hover.html="popover(sect)"
        )
          lah-fa-icon.mr-1(icon="map-pin", variant="primary")
          span.font-weight-bold {{ sect.段代碼 }}
          span.mx-1 {{ sect.段名稱 }}
          small.text-muted ({{ sect.區名稱 }})
          b-badge.ml-1(variant="info", pill) {{ format(sect.土地標示部筆數) }} 筆

  .mt-2.text-muted.small.text-center(v-else-if="input && !isBusy")
    span 查無符合「{{ input }}」之段小段資料

  //- 詳細資料彈出視窗
  b-modal#sect-query-detail-modal(
    ref="detailModal",
    :title="modalTitle",
    size="lg",
    hide-footer,
    scrollable
  )
    .d-flex.justify-content-between.align-items-center.mb-2(v-if="modalSections.length > 0")
      b-input-group(size="sm", prepend="篩選", style="max-width: 320px;")
        b-form-input(
          v-model="modalFilter",
          placeholder="段代碼 (如 0200) 或段名稱...",
          title="篩選段代碼或段名稱"
        )
        template(#append, v-if="modalFilter")
          lah-button(
            icon="xmark",
            variant="outline-secondary",
            @click="modalFilter = ''",
            title="清除篩選"
          )
      lah-button(
        icon="file-csv",
        variant="outline-success",
        size="sm",
        @click="exportCsv",
        title="匯出 CSV",
        :disabled="filteredModalSections.length === 0"
      ) 匯出 CSV

    .d-flex.justify-content-between.align-items-center.mb-2.small.text-muted(v-if="modalSections.length > 1")
      span
        lah-fa-icon(icon="chart-simple")
        span.ml-1 統計：共 {{ filteredModalSections.length }} 個段別，{{ totalCount }} 筆，總面積 {{ totalAreaM2 }} ({{ totalAreaPing }})
      span(v-if="modalFilter") (篩選符合 {{ filteredModalSections.length }} / {{ modalSections.length }} 筆)

    b-table.text-center(
      :items="filteredModalSections",
      :fields="fields",
      responsive="sm",
      striped,
      hover,
      bordered,
      small,
      no-border-collapse,
      head-variant="dark",
      show-empty,
      empty-text="查無符合篩選條件之段小段資料"
    )
      template(v-slot:cell(面積)="{ item }")
        span(v-b-tooltip.hover="areaPing(item.面積)") {{ areaM2(item.面積) }}
      template(v-slot:cell(土地標示部筆數)="{ item }")
        span.font-weight-bold {{ format(item.土地標示部筆數) }} 筆
</template>

<script>
export default {
  name: 'LahMgmtBoardSectQuery',
  data: () => ({
    input: '',
    modalFilter: '',
    sections: [],
    modalSections: [],
    modalTitle: '段小段查詢結果',
    isBusy: false,
    fields: [
      { key: '區代碼', sortable: true },
      { key: '區名稱', sortable: true },
      { key: '段代碼', sortable: true },
      { key: '段名稱', sortable: true },
      { key: '面積', sortable: true },
      { key: '土地標示部筆數', sortable: true }
    ]
  }),
  computed: {
    validate () {
      if (!this.input || !this.input.trim()) {
        return true
      }
      return isNaN(parseInt(this.input, 10)) ? true : (parseInt(this.input, 10) <= 9999 && parseInt(this.input, 10) >= 1)
    },
    validateState () {
      if (!this.input || !this.input.trim()) { return null }
      return Boolean(this.validate)
    },
    filteredSections () {
      const kw = (this.input || '').trim().toLowerCase()
      if (!kw) {
        return []
      }
      return this.sections.filter((s) => {
        return (
          (s.段代碼 && s.段代碼.toLowerCase().includes(kw)) ||
          (s.段名稱 && s.段名稱.toLowerCase().includes(kw)) ||
          (s.區名稱 && s.區名稱.toLowerCase().includes(kw)) ||
          (s.區代碼 && s.區代碼.toLowerCase().includes(kw))
        )
      })
    },
    filteredModalSections () {
      const kw = (this.modalFilter || '').trim().toLowerCase()
      if (!kw) {
        return this.modalSections
      }
      return this.modalSections.filter((s) => {
        return (
          (s.段代碼 && s.段代碼.toLowerCase().includes(kw)) ||
          (s.段名稱 && s.段名稱.toLowerCase().includes(kw)) ||
          (s.區名稱 && s.區名稱.toLowerCase().includes(kw)) ||
          (s.區代碼 && s.區代碼.toLowerCase().includes(kw))
        )
      })
    },
    totalCount () {
      const sum = this.filteredModalSections.reduce((acc, cur) => acc + (parseInt(cur.土地標示部筆數, 10) || 0), 0)
      return this.format(sum)
    },
    totalAreaM2 () {
      const sum = this.filteredModalSections.reduce((acc, cur) => acc + (parseFloat(cur.面積) || 0), 0)
      return this.areaM2(sum)
    },
    totalAreaPing () {
      const sum = this.filteredModalSections.reduce((acc, cur) => acc + (parseFloat(cur.面積) || 0), 0)
      return this.areaPing(sum)
    }
  },
  mounted () {
    this.loadSections()
  },
  methods: {
    format (val) {
      return val ? String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0'
    },
    areaPing (val) {
      return val ? this.format((Number(val) * 3025 / 10000).toFixed(2)) + ' 坪' : '0 坪'
    },
    areaM2 (val) {
      return val ? this.format(Number(val).toFixed(2)) + ' ㎡' : '0 ㎡'
    },
    popover (sect) {
      const html = `<div class="small">
        <div>轄區：${sect.區代碼 || ''} ${sect.區名稱 || ''}</div>
        <div>代碼：${sect.段代碼 || ''}</div>
        <div>名稱：${sect.段名稱 || ''}</div>
        <div>面積：${this.areaM2(sect.面積)} (${this.areaPing(sect.面積)})</div>
        <div>土地標示部筆數：${this.format(sect.土地標示部筆數)} 筆</div>
      </div>`
      return {
        title: `${sect.段代碼} ${sect.段名稱}`,
        content: html,
        html: true,
        trigger: 'hover',
        delay: { show: 300, hide: 100 }
      }
    },
    async loadSections () {
      this.isBusy = true
      try {
        const cached = await this.getCache('ralid_sections')
        if (cached && Array.isArray(cached) && cached.length > 0) {
          this.sections = cached
          return
        }
        const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'ralid'
        })
        if (this.$utils.statusCheck(data.status)) {
          this.sections = data.raw || []
          // 緩存 24 小時
          await this.setCache('ralid_sections', this.sections, 24 * 60 * 60 * 1000)
        } else {
          this.warning(data.message || '無法取得轄區段別資料')
        }
      } catch (err) {
        this.$utils.error(err)
      } finally {
        this.isBusy = false
      }
    },
    openModal (sect) {
      this.modalFilter = ''
      this.modalSections = [sect]
      this.modalTitle = `段小段資料：【${sect.段代碼}】${sect.段名稱} (${sect.區名稱})`
      this.$refs.detailModal.show()
    },
    query () {
      this.modalFilter = ''
      const kw = (this.input || '').trim()
      // 空資料查詢：彈出顯示全轄區段小段統計資料
      if (this.$utils.empty(kw)) {
        if (this.sections.length > 0) {
          this.modalSections = this.sections
          this.modalTitle = `全轄區段小段資料 (共 ${this.sections.length} 筆)`
          this.$refs.detailModal.show()
          return
        }
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'ralid'
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status) && Array.isArray(data.raw)) {
            this.sections = data.raw
            this.modalSections = data.raw
            this.modalTitle = `全轄區段小段資料 (共 ${data.raw.length} 筆)`
            this.$refs.detailModal.show()
          } else {
            this.warning(data.message || '查無轄區段別資料。')
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
        return
      }

      if (this.filteredSections.length > 0) {
        this.modalSections = this.filteredSections
        this.modalTitle = `段小段查詢結果【${kw}】(共 ${this.filteredSections.length} 筆)`
        this.$refs.detailModal.show()
        return
      }
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'ralid',
        text: kw
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          if (Array.isArray(data.raw) && data.raw.length > 0) {
            this.modalSections = data.raw
            this.modalTitle = `段小段查詢結果【${kw}】(共 ${data.raw.length} 筆)`
            this.$refs.detailModal.show()
          } else {
            this.warning(`查無 ${kw} 段小段資料。`)
          }
        } else {
          this.warning(data.message || `查無 ${kw} 段小段資料。`)
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    exportCsv () {
      if (this.filteredModalSections.length === 0) { return }
      const headers = ['區代碼', '區名稱', '段代碼', '段名稱', '面積(㎡)', '土地標示部筆數']
      const rows = this.filteredModalSections.map(s => [
        s.區代碼,
        s.區名稱,
        s.段代碼,
        s.段名稱,
        s.面積,
        s.土地標示部筆數
      ])
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      const keyword = this.modalFilter || this.input || '清單'
      link.setAttribute('download', `轄區段別資料_${keyword}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}
</script>

<style lang="scss" scoped>
.secttag-container {
  max-height: 260px;
}

.sectcard {
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  font-size: 0.8rem;
  border-color: #ced4da !important;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
    border-color: #007bff !important;
  }
}
</style>
