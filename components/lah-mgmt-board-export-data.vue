<template lang="pug">
b-card.border-secondary
  template(#header)
    .d-flex.w-100.justify-content-between.align-items-center.mb-0
      h6.my-auto.font-weight-bolder
        lah-fa-icon(icon="road" size="lg") 輸出地籍資料
      b-button-group.align-middle(size="sm" v-if="!working")
        lah-button.mr-1(
          icon="layer-group",
          variant="outline-primary",
          @click="setPreset(['0182', '0184', '0142'])",
          v-b-popover.top.hover.focus="'中平市地重劃'",
          title="中平市地重劃"
        )
        lah-button.mr-1(
          icon="arrow-rotate-left",
          action="cycle-alt",
          variant="outline-secondary",
          @click="clean",
          title="重設",
          :disabled="tags.length === 0 && links.length === 0"
        )
        lah-button.mr-1(
          v-if="hasServerFiles",
          icon="trash-can",
          variant="outline-danger",
          @click="openCleanModal",
          v-b-popover.top.hover.focus="'清理後端已產出檔案'",
          title="清理後端已產出檔案",
          :disabled="working || clearing"
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

  //- 清理後端檔案彈出視窗
  b-modal#export-data-clean-modal(
    ref="cleanModal",
    size="lg",
    scrollable,
    no-close-on-backdrop
  )
    template(#modal-title)
      .d-flex.align-items-center
        lah-fa-icon(icon="broom" size="lg" variant="danger")
        span.ml-2 清理後端已產出檔案

    //- 載入狀態
    .text-center.my-4(v-if="loadingServerFiles")
      lah-fa-icon(icon="spinner" spin size="2x" variant="primary")
      .mt-2.text-muted 正在讀取後端 export 目錄檔案清單...

    //- 無檔案狀態
    .text-center.my-4(v-else-if="serverFiles.length === 0")
      lah-fa-icon(icon="folder-open" size="2x" variant="secondary")
      .mt-2.text-secondary 後端目前無任何地籍產出檔案（.txt 或 .zip）可供清理。

    //- 檔案清單
    div(v-else)
      .d-flex.justify-content-between.align-items-center.mb-2.pb-2.border-bottom
        .d-flex.align-items-center
          b-form-checkbox(
            :checked="allSelected",
            :indeterminate="isIndeterminate",
            @change="toggleSelectAll",
            class="my-auto"
          )
          span.ml-2.font-weight-bold.text-secondary
            | 共 {{ serverFiles.length }} 個檔案 (已選 {{ selectedFilenames.length }} 個，總計 {{ totalSelectedSize }})
        .d-flex.align-items-center
          lah-button(
            icon="rotate",
            size="sm",
            variant="outline-secondary",
            @click="fetchServerFiles",
            :disabled="loadingServerFiles || clearing",
            title="重新整理清單"
          ) 重新整理
          lah-button.ml-1(
            icon="file-zipper",
            size="sm",
            variant="outline-success",
            @click="downloadModalZip",
            :disabled="loadingServerFiles || clearing || selectedFilenames.length === 0",
            title="將所選檔案打包成 ZIP 下載"
          )
            span(v-if="!modalZipping") 打包下載 (ZIP)
            span(v-else)
              lah-fa-icon(icon="spinner" spin)
              span.ml-1 打包中...

      .clean-modal-files-list
        .d-flex.align-items-center.justify-content-between.p-2.border-bottom.border-light(
          v-for="file in serverFiles"
          :key="file.filename"
          :class="{'bg-light': isSelected(file)}"
        )
          .d-flex.align-items-center.text-truncate.mr-2
            b-form-checkbox(
              :checked="isSelected(file)",
              @change="toggleFileSelection(file)",
              class="my-auto"
            )
            lah-fa-icon(
              :icon="file.type === 'zip' ? 'file-zipper' : 'file-lines'",
              :variant="file.type === 'zip' ? 'warning' : 'primary'",
              class="mx-2"
            )
            .text-truncate
              div.text-truncate.font-weight-bold.s-90 {{ file.filename }}
              small.text-muted.s-75 {{ file.size_formatted }} ｜ {{ file.mtime }}
          .d-flex.align-items-center.flex-shrink-0
            lah-button(
              icon="download",
              size="sm",
              variant="outline-primary",
              @click="downloadSingleServerFile(file)",
              title="下載此檔案",
              :disabled="clearing"
            ) 下載

    template(#modal-footer="{ cancel }")
      .d-flex.w-100.justify-content-between.align-items-center
        small.text-muted(v-if="serverFiles.length > 0")
          lah-fa-icon(icon="triangle-exclamation" variant="warning")
          span.ml-1 清理後檔案將從伺服器永久刪除，建議清掃前先點擊「下載」或「打包下載」。
        small(v-else)
        .d-flex
          b-button(
            variant="secondary",
            size="sm",
            @click="cancel",
            :disabled="clearing"
          ) 取消
          b-button.ml-2(
            variant="danger",
            size="sm",
            @click="doCleanServerFiles",
            :disabled="clearing || loadingServerFiles || selectedFilenames.length === 0"
          )
            lah-fa-icon(icon="spinner" spin v-if="clearing")
            span.ml-1(v-if="clearing") 清掃中...
            span(v-else)
              lah-fa-icon(icon="broom")
              span.ml-1 確認清掃 ({{ selectedFilenames.length }})

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
      .d-flex.align-items-center
        lah-button(
          icon="file-zipper",
          variant="outline-success",
          size="sm",
          no-border,
          @click="downloadZip",
          :disabled="downloading || clearing",
          title="打包成 ZIP 下載"
        )
          span(v-if="!downloading") 全部下載 (ZIP)
          span(v-else)
            lah-fa-icon(icon="spinner" spin)
            span.ml-1 打包下載中...
        lah-button.ml-1(
          v-if="hasServerFiles",
          icon="trash-can",
          variant="outline-danger",
          size="sm",
          no-border,
          @click="openCleanModal",
          :disabled="downloading || clearing",
          title="清理後端已產出檔案"
        )
          lah-fa-icon(icon="spinner" spin v-if="clearing")
          span.ml-1(v-if="clearing") 清理中...
          span(v-else) 清理檔案

    .d-flex.flex-wrap.align-items-center.mt-1
      lah-button.m-1(
        v-for="(link, idx) in links"
        :key="idx"
        icon="download",
        action="move-fade-ttb",
        variant="outline-primary",
        size="sm",
        @click="download(link)",
        :title="'下載 ' + link.filename"
      ) {{ getDisplayName(link) }}
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
    downloading: false,
    clearing: false,
    hasServerFiles: false,
    serverFiles: [],
    selectedFilenames: [],
    loadingServerFiles: false,
    modalZipping: false
  }),
  computed: {
    disabled () {
      return this.tags.length === 0 || this.working
    },
    progressPercent () {
      if (this.max === 0) { return '0%' }
      return ((this.iteration / this.max) * 100).toFixed(1) + '%'
    },
    allSelected () {
      return this.serverFiles.length > 0 && this.selectedFilenames.length === this.serverFiles.length
    },
    isIndeterminate () {
      return this.selectedFilenames.length > 0 && this.selectedFilenames.length < this.serverFiles.length
    },
    totalSelectedSize () {
      if (this.selectedFilenames.length === 0) { return '0 B' }
      const selectedSet = new Set(this.selectedFilenames)
      const totalBytes = this.serverFiles
        .filter(f => selectedSet.has(f.filename))
        .reduce((sum, f) => sum + (f.size || 0), 0)
      return this.formatBytes(totalBytes)
    }
  },
  mounted () {
    this.checkServerFiles()
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
        if (this.links.length > 0) {
          this.hasServerFiles = true
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
    async downloadZip () {
      if (this.downloading || this.links.length === 0) { return }
      this.downloading = true
      const site = this.site || 'HA'
      const secStr = this.tags.join('_')
      const todayStr = this.$utils.today('tw') || this.$utils.today()
      const zipFilename = `${todayStr}_地籍資料_${site}${secStr ? '_' + secStr : ''}.zip`
      const filenames = this.links.map(item => item.filename)

      try {
        const res = await this.$axios.post(this.$consts.API.FILE.DATA, {
          type: 'zip',
          zip_filename: zipFilename,
          filenames
        }, {
          responseType: 'blob'
        })
        FileSaver.saveAs(res.data, zipFilename)
        this.notify(`${zipFilename} 下載完成`, { type: 'success', title: '全部下載 (ZIP)' })
      } catch (err) {
        this.$utils.error(err)
        // 備援下載方案：若 blob POST 請求異常則透過原生 a 標籤 GET 下載
        const params = new URLSearchParams()
        params.append('type', 'zip')
        params.append('zip_filename', zipFilename)
        params.append('filenames', filenames.join(','))
        const url = `${this.$consts.API.FILE.DATA}?${params.toString()}`
        const a = document.createElement('a')
        a.href = url
        a.download = zipFilename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } finally {
        this.downloading = false
      }
    },
    downloadAll () {
      return this.downloadZip()
    },
    formatBytes (bytes, precision = 1) {
      if (!bytes || bytes <= 0) { return '0 B' }
      const units = ['B', 'KB', 'MB', 'GB']
      const pow = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
      const value = bytes / Math.pow(1024, pow)
      return `${value.toFixed(precision)} ${units[pow]}`
    },
    openCleanModal () {
      if (this.working || this.clearing) { return }
      this.$bvModal.show('export-data-clean-modal')
      this.fetchServerFiles()
    },
    cleanServerFiles () {
      return this.openCleanModal()
    },
    cleanBackendFiles () {
      return this.openCleanModal()
    },
    async fetchServerFiles () {
      this.loadingServerFiles = true
      try {
        const res = await this.$axios.post(this.$consts.API.FILE.EXPORT, {
          type: 'file_data_list'
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
          this.serverFiles = data.data || []
          this.hasServerFiles = this.serverFiles.length > 0
          // 預設全選
          this.selectedFilenames = this.serverFiles.map(f => f.filename)
        } else {
          this.serverFiles = []
          this.hasServerFiles = false
          this.selectedFilenames = []
          this.warning(data.message || '無法取得後端檔案清單', { title: '查詢後端檔案' })
        }
      } catch (err) {
        this.$utils.error(err)
        this.serverFiles = []
        this.hasServerFiles = false
        this.selectedFilenames = []
        this.warning(`讀取後端檔案失敗: ${err.message || err}`, { title: '查詢後端檔案' })
      } finally {
        this.loadingServerFiles = false
      }
    },
    async checkServerFiles () {
      try {
        const res = await this.$axios.post(this.$consts.API.FILE.EXPORT, {
          type: 'file_data_list'
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
          const files = data.data || []
          this.hasServerFiles = files.length > 0
          this.serverFiles = files
        } else {
          this.hasServerFiles = false
        }
      } catch (err) {
        this.$utils.error(err)
        this.hasServerFiles = false
      }
    },
    getDisplayName (link) {
      if (link.code) {
        const found = EXPORT_CODES.find(item => item.code === link.code)
        if (found) { return found.name }
      }
      if (link.filename) {
        const pureName = link.filename.replace(/\.[^/.]+$/, '')
        const parts = pureName.split('_')
        const lastPart = parts[parts.length - 1]
        if (lastPart) { return lastPart }
      }
      return link.filename || link.code
    },
    isSelected (file) {
      return this.selectedFilenames.includes(file.filename)
    },
    toggleFileSelection (file) {
      const idx = this.selectedFilenames.indexOf(file.filename)
      if (idx > -1) {
        this.selectedFilenames.splice(idx, 1)
      } else {
        this.selectedFilenames.push(file.filename)
      }
    },
    toggleSelectAll (checked) {
      if (checked) {
        this.selectedFilenames = this.serverFiles.map(f => f.filename)
      } else {
        this.selectedFilenames = []
      }
    },
    async downloadSingleServerFile (file) {
      const url = `${this.$consts.API.FILE.DATA}?filename=${encodeURIComponent(file.filename)}`
      try {
        const res = await this.$axios.get(url, {
          responseType: 'blob'
        })
        FileSaver.saveAs(res.data, file.filename)
        this.notify(`${file.filename} 下載完成`, { type: 'success', title: '下載檔案' })
      } catch (err) {
        this.$utils.error(err)
        const a = document.createElement('a')
        a.href = url
        a.download = file.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    },
    async downloadModalZip () {
      if (this.modalZipping || this.selectedFilenames.length === 0) { return }
      this.modalZipping = true
      const site = this.site || 'HA'
      const todayStr = this.$utils.today('tw') || this.$utils.today()
      const zipFilename = `${todayStr}_地籍資料匯出_${site}.zip`
      const filenames = [...this.selectedFilenames]

      try {
        const res = await this.$axios.post(this.$consts.API.FILE.DATA, {
          type: 'zip',
          zip_filename: zipFilename,
          filenames
        }, {
          responseType: 'blob'
        })
        FileSaver.saveAs(res.data, zipFilename)
        this.notify(`${zipFilename} 下載完成`, { type: 'success', title: '全部下載 (ZIP)' })
      } catch (err) {
        this.$utils.error(err)
        const params = new URLSearchParams()
        params.append('type', 'zip')
        params.append('zip_filename', zipFilename)
        params.append('filenames', filenames.join(','))
        const url = `${this.$consts.API.FILE.DATA}?${params.toString()}`
        const a = document.createElement('a')
        a.href = url
        a.download = zipFilename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } finally {
        this.modalZipping = false
      }
    },
    async doCleanServerFiles () {
      if (this.clearing || this.selectedFilenames.length === 0) { return }
      const count = this.selectedFilenames.length

      const confirmed = await this.confirm(`確定要永久刪除後端 ${count} 個產出檔案嗎？此動作無法還原！`)
      if (!confirmed) { return }

      this.clearing = true
      try {
        const isAll = this.selectedFilenames.length === this.serverFiles.length
        const res = await this.$axios.post(this.$consts.API.FILE.EXPORT, {
          type: 'file_data_clean',
          filenames: isAll ? [] : this.selectedFilenames,
          all: isAll
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
          this.notify(data.message || `成功清理 ${count} 個後端檔案！`, { type: 'success', title: '清理檔案' })
          const deletedSet = new Set(data.deleted_files || this.selectedFilenames)
          this.links = this.links.filter(link => !deletedSet.has(link.filename))

          await this.fetchServerFiles()
          this.hasServerFiles = this.serverFiles.length > 0
          if (this.serverFiles.length === 0) {
            this.$bvModal.hide('export-data-clean-modal')
          }
        } else {
          this.warning(data.message || '清理失敗', { title: '清理檔案' })
        }
      } catch (err) {
        this.$utils.error(err)
        this.warning(`清理後端檔案發生錯誤: ${err.message || err}`, { title: '清理檔案' })
      } finally {
        this.clearing = false
      }
    },
    async deleteFile (link, idx) {
      if (this.clearing || this.working) { return }
      const confirmed = await this.confirm(`確定刪除後端檔案【${link.filename}】？`)
      if (!confirmed) { return }

      this.clearing = true
      try {
        const res = await this.$axios.post(this.$consts.API.FILE.EXPORT, {
          type: 'file_data_clean',
          filenames: [link.filename]
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
          this.notify(`已刪除 ${link.filename}`, { type: 'success', title: '刪除檔案' })
          this.links.splice(idx, 1)
        } else {
          this.warning(data.message || '刪除失敗', { title: '刪除檔案' })
        }
      } catch (err) {
        this.$utils.error(err)
        this.warning(`刪除檔案失敗: ${err.message || err}`)
      } finally {
        this.clearing = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.clean-modal-files-list {
  max-height: 380px;
  overflow-y: auto;
}
</style>
