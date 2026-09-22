<template lang="pug">
b-card.border-secondary
  template(#header)
    .d-flex.w-100.justify-content-between.align-items-center.mb-0
      h6.my-auto.font-weight-bolder
        lah-fa-icon(icon="road" size="lg") 輸出地籍資料
      b-button-group.align-middle(size="sm" v-if="!working")
        lah-button(
          icon="layer-group",
          variant="outline-primary",
          @click="setPreset(['0182', '0184', '0142'])",
          v-b-popover.top.hover.focus="'中平市地重劃'",
          title="中平市地重劃"
        )
        lah-button(
          icon="arrow-rotate-left",
          action="cycle-alt",
          variant="outline-secondary",
          @click="clean",
          title="重設",
          :disabled="tags.length === 0 && links.length === 0"
        )
        lah-button(
          icon="question",
          variant="outline-success",
          v-b-modal.export-data-help-modal,
          title="說明"
        )

  //- 說明彈出視窗
  b-modal#export-data-help-modal(
    title="地籍資料匯出功能提示",
    size="lg",
    hide-footer,
    scrollable
  )
    .modal-help-content
      h5.font-weight-bold.text-primary 地政局索取地籍資料備註
      p.mt-2.mb-1
        span.text-danger.font-weight-bold ※
        strong 系統管理子系統 / 資料轉入轉出
        span.text-muted  (共 14 個 txt 檔案，地/建號範圍從 00000000 ~ 99999999)
      .alert.alert-light.border.py-1.px-2.my-2
        small.text-muted 除標示為黃色部分須至地政系統 WEB 版作業，其餘皆由本功能產出下載。

      .pl-3.mb-3
        .font-weight-bold.text-secondary AI001-10
        ul.mb-2
          li AI00301 - 土地標示部
          li AI00401 - 土地所有權部
          li AI00601 - 管理者資料【土地、建物各做一次】
          li AI00701 - 建物標示部
          li AI00801 - 基地坐落
          li AI00901 - 建物分層及附屬
          li AI01001 - 主建物與共同使用部分
        .font-weight-bold.text-secondary AI011-20
        ul.mb-2
          li AI01101 - 建物所有權部
          li: span.bg-warning.px-1.rounded AI01901 - 土地各部別 (須至地政系統WEB版)
        .font-weight-bold.text-secondary AI021-40
        ul.mb-2
          li: span.bg-warning.px-1.rounded AI02101 - 土地他項權利部 (須至地政系統WEB版)
          li: span.bg-warning.px-1.rounded AI02201 - 建物他項權利部 (須至地政系統WEB版)
          li AI02901 - 各部別之其他登記事項【土地、建物各做一次】

      hr

      p.mb-1
        span.text-danger.font-weight-bold ※
        strong 測量子系統 / 測量資料管理 / 資料輸出入
      ul.pl-4.mb-3
        li 地籍圖轉出 (數值地籍)：輸出 DXF 圖檔【含控制點】及 NEC 重測輸出檔
        li 地籍圖轉出 (圖解數化)：同上兩種類皆輸出，並將【分幅管理者先接合】下選項皆勾選
        li 如無法產出 DXF 資料請選擇【整段輸出】(例如 0210 忠福段)
        li 請至地政系統WEB版產出
      hr

      p.mb-0
        span.text-danger.font-weight-bold ※
        span 登記子系統/列印/清冊報表/土地建物地籍整理清冊
        ul.pl-4.mb-3
          li 土地、建物各產一次存PDF
          li 請至地政系統WEB版產出

  //- 產製進度條
  .my-2(v-if="working")
    .d-flex.justify-content-between.align-items-center.mb-1
      small.text-muted: lah-fa-icon(icon="spinner" spin) 產製中...
      small.font-weight-bold.text-primary {{ currentTask }}
    b-progress(:max="max" show-progress animated)
      b-progress-bar(:value="iteration" :label="progressPercent")

  //- 段代碼輸入區
  b-input-group(size="sm" prepend="段代碼" v-if="!working")
    b-form-tags(
      input-id="tags-section"
      v-model="tags"
      separator=" ,;"
      class="no-cache"
      remove-on-delete
      tag-variant="primary"
      tag-pills
      :tag-validator="validator"
      placeholder="輸入段代碼後 Enter 新增 (例: 0200)"
    )
    template(#append)
      lah-button(
        icon="file-export",
        action="move-fade-ltr",
        variant="outline-primary",
        @click="go",
        title="執行產製",
        :disabled="disabled"
      ) 執行

  //- 產製結果下載清單
  .mt-3(v-if="links.length > 0")
    .d-flex.justify-content-between.align-items-center.mb-1.border-bottom.pb-1
      small.font-weight-bold.text-secondary
        lah-fa-icon(icon="file-lines")
        span.ml-1 產製檔案清單 (共 {{ links.length }} 個)
      lah-button(
        icon="cloud-arrow-down",
        variant="outline-success",
        size="sm",
        no-border,
        @click="downloadAll",
        :disabled="downloading",
        title="全部下載"
      )
        span(v-if="!downloading") 全部下載
        span(v-else)
          lah-fa-icon(icon="spinner" spin)
          span.ml-1 下載中...

    .text-left.download-links-container
      .d-flex.align-items-center.py-1.border-bottom.border-light(
        v-for="(link, idx) in links"
        :key="idx"
      )
        lah-button(
          icon="download",
          action="move-fade-ttb",
          class="s-75 text-truncate text-secondary p-0 text-left",
          variant="link",
          @click="download(link)",
          :title="'下載 ' + link.filename"
        ) {{ link.filename }}
</template>

<script>
import FileSaver from 'file-saver'

const EXPORT_CODES = [
  { code: 'AI00301', name: '土地標示部' },
  { code: 'AI00401', name: '土地所有權部' },
  { code: 'AI00601_B', name: '土地管理者資料' },
  { code: 'AI00601_E', name: '建物管理者資料' },
  { code: 'AI00701', name: '建物標示部' },
  { code: 'AI00801', name: '基地座落資料' },
  { code: 'AI00901', name: '建物分層及附屬資料' },
  { code: 'AI01001', name: '主建物及共同使用部分資料' },
  { code: 'AI01101', name: '建物所有權部' },
  { code: 'AI02901_B', name: '土地各部別之其他登記事項' },
  { code: 'AI02901_E', name: '建物各部別之其他登記事項' }
]

export default {
  name: 'LahMgmtBoardExportData',
  data: () => ({
    tags: [],
    links: [],
    max: EXPORT_CODES.length,
    iteration: 0,
    working: false,
    currentTask: '',
    downloading: false
  }),
  computed: {
    disabled () {
      return this.tags.length === 0 || this.working
    },
    progressPercent () {
      if (this.max === 0) { return '0%' }
      return ((this.iteration / this.max) * 100).toFixed(1) + '%'
    }
  },
  methods: {
    validator (tag) {
      return (/^\d{3,4}$/i).test(tag?.trim())
    },
    setPreset (presetTags) {
      this.tags = [...presetTags]
    },
    clean () {
      this.tags = []
      this.links = []
      this.iteration = 0
      this.currentTask = ''
    },
    async go () {
      if (this.working) {
        this.warning('資料產製中，請稍候...')
        return
      }
      if (this.tags.length === 0) {
        this.warning('請先輸入或選擇段代碼！')
        return
      }

      const confirmed = await this.confirm(`請確認以段代碼【${this.tags.join(', ')}】產生地籍資料？`)
      if (!confirmed) { return }

      this.links = []
      this.working = true
      this.iteration = 0

      try {
        for (let i = 0; i < EXPORT_CODES.length; i++) {
          const item = EXPORT_CODES[i]
          this.currentTask = `正在產製 ${item.name} (${item.code})...`
          await this.query(item.code)
          this.iteration = i + 1
        }
        this.notify('地籍資料產製完成！', { type: 'success', title: '產製完成' })
      } catch (err) {
        this.$utils.error(err)
        this.warning(`產製過程中斷: ${err.message || err}`)
      } finally {
        this.working = false
        this.currentTask = ''
      }
    },
    async query (code) {
      try {
        const res = await this.$axios.post(this.$consts.API.FILE.EXPORT, {
          type: 'file_data_export',
          code,
          section: this.tags
        })
        let data = res.data
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data.trim())
          } catch (e) {
            this.$utils.error('無法解析回應的 JSON 字串:', data)
          }
        }
        if (this.$utils.statusCheck(data.status)) {
          const filename = data.filename || data.data?.filename
          if (filename) {
            this.links.push({ code, filename })
          }
        } else {
          this.warning(data.message || `產製 ${code} 失敗`)
        }
      } catch (err) {
        this.$utils.error(err)
        this.warning(`產製 ${code} 發生錯誤: ${err.message || err}`)
      }
    },
    async download (link) {
      const url = `${this.$consts.API.FILE.DATA}?code=${encodeURIComponent(link.code)}&filename=${encodeURIComponent(link.filename)}`
      try {
        const res = await this.$axios.get(url, {
          responseType: 'blob'
        })
        FileSaver.saveAs(res.data, link.filename)
        this.notify(`${link.filename} 下載完成`, { type: 'success', title: '下載產製資料' })
      } catch (err) {
        this.$utils.error(err)
        // 備援下載方案：若 blob 請求異常則透過原生 a 標籤點擊下載
        const a = document.createElement('a')
        a.href = url
        a.download = link.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    },
    async downloadAll () {
      if (this.downloading || this.links.length === 0) { return }
      this.downloading = true
      try {
        for (const link of this.links) {
          await this.download(link)
          await this.timeout(() => {}, 600)
        }
      } finally {
        this.downloading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.download-links-container {
  max-height: 240px;
  overflow-y: auto;
}
</style>
