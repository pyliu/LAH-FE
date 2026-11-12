<template>
  <b-card class="tax-export-board">
    <template #header>
      <div class="d-flex justify-content-between align-items-center">
        <h6 class="mb-0 font-weight-bolder">
          地方稅務局資料產製
        </h6>
        <div class="d-flex align-items-center">
          <b-button
            v-if="!working && !batch"
            variant="primary"
            size="sm"
            class="py-0 px-2 s-85 mr-1"
            :disabled="conditionsLocked || !validDates"
            title="開始產製地方稅務局資料"
            @click="start"
          >
            <lah-fa-icon icon="play" class="mr-1" />
            開始產製
          </b-button>
          <b-button
            v-else-if="working"
            variant="primary"
            size="sm"
            class="py-0 px-2 s-85 mr-1"
            title="產製進行中，點擊開啟詳細視窗"
            @click="openModal"
          >
            <lah-fa-icon icon="spinner" spin class="mr-1" />
            產製中 (檢視)
          </b-button>
          <template v-else>
            <b-button
              variant="outline-primary"
              size="sm"
              class="py-0 px-2 s-85 mr-1"
              title="檢視產製進度與下載檔案"
              @click="openModal"
            >
              <lah-fa-icon icon="window-maximize" class="mr-1" />
              檢視進度
            </b-button>
            <lah-button
              icon="rotate"
              variant="outline-secondary"
              no-border
              no-icon-gutter
              size="sm"
              class="mr-1"
              :disabled="busy"
              title="查詢最新狀態"
              @click="refreshStatus"
            />
            <lah-button
              icon="arrow-rotate-left"
              variant="outline-danger"
              no-border
              no-icon-gutter
              size="sm"
              class="mr-1"
              :disabled="busy || uncertainStart"
              title="重設新批次"
              @click="reset"
            />
          </template>

          <lah-button
            icon="question"
            action="breath"
            variant="outline-success"
            no-border
            no-icon-gutter
            size="sm"
            title="地方稅務局資料產製說明"
            @click="$refs.help.show()"
          />
        </div>
      </div>
    </template>

    <!-- 說明彈跳視窗 -->
    <lah-help-modal ref="help" modal-title="地方稅務局資料產製說明" size="lg">
      <div class="font-weight-bold text-primary h5 mb-2">
        <lah-fa-icon icon="circle-info" size="lg" /> 地方稅務局資料產製功能導覽
      </div>
      <p class="text-muted">
        本功能彙編地方稅務局所需之地籍及建物異動資料與通知書，共包含 7 項檔案產製作業。請自行填寫日期，範圍包含起日與迄日。
      </p>
      <hr class="my-2">
      <div class="font-weight-bold text-dark mb-1">
        <lah-fa-icon icon="file-pdf" variant="danger" /> 異動通知書 (共 4 份 PDF)
      </div>
      <ul class="mb-2">
        <li><strong>地籍異動通知書 (本所)</strong>：本所承辦案件。</li>
        <li><strong>地籍異動通知書 (他所)</strong>：他所承辦本所案件。</li>
        <li><strong>建物異動通知書 (本所)</strong>：本所承辦案件。</li>
        <li><strong>建物異動通知書 (他所)</strong>：他所承辦本所案件。</li>
      </ul>
      <div class="font-weight-bold text-dark mb-1">
        <lah-fa-icon icon="file-lines" variant="primary" /> 異動資料 (共 3 份 TXT)
      </div>
      <ul class="mb-2">
        <li><strong>地籍異動資料</strong>：地籍異動文字檔。</li>
        <li><strong>地價異動資料</strong>：地價異動文字檔。</li>
        <li><strong>建物異動資料</strong>：建物異動文字檔。</li>
      </ul>
      <hr class="my-2">
      <div class="small text-muted">
        ※ 點擊右上角「開始產製」按鈕後將自動開啟進度視窗並依序處理各項檔案，產製完畢後可於視窗內直接打包下載 ZIP 或單檔下載。
      </div>
    </lah-help-modal>

    <b-form @submit.prevent="start">
      <b-form-row>
        <b-col cols="6">
          <b-form-group label="起日" :label-for="`${inputId}-begin`" class="mb-0" label-size="sm">
            <b-form-input
              :id="`${inputId}-begin`"
              v-model="begin"
              type="date"
              size="sm"
              required
              :disabled="conditionsLocked"
              :max="end || null"
            />
          </b-form-group>
        </b-col>
        <b-col cols="6">
          <b-form-group label="迄日" :label-for="`${inputId}-end`" class="mb-0" label-size="sm">
            <b-form-input
              :id="`${inputId}-end`"
              v-model="end"
              type="date"
              size="sm"
              required
              :disabled="conditionsLocked"
              :min="begin || null"
            />
          </b-form-group>
        </b-col>
      </b-form-row>
    </b-form>

    <!-- 地方稅務局資料產製進度彈跳視窗 (所有進度條、統計、7項明細、下載及提示全部收納於此) -->
    <b-modal
      :id="modalId"
      ref="progressModal"
      size="lg"
      scrollable
      no-close-on-backdrop
    >
      <template #modal-title>
        <div class="d-flex align-items-center">
          <lah-fa-icon :icon="working ? 'spinner' : (hasUnfinished ? 'triangle-exclamation' : 'circle-check')" :spin="working" :variant="working ? 'primary' : (hasUnfinished ? 'warning' : 'success')" size="lg" />
          <span class="ml-2 font-weight-bold">地方稅務局資料產製進度</span>
          <b-badge v-if="batchBegin && batchEnd" variant="secondary" pill class="ml-2">
            {{ batchBegin }} ～ {{ batchEnd }}
          </b-badge>
        </div>
      </template>

      <div>
        <b-alert v-if="mock" show variant="warning" class="py-2 px-3 mb-2 small">
          <strong>MOCK 模擬資料</strong>：下載檔案僅供測試，不可作為正式交付資料。
        </b-alert>
        <b-alert v-if="notice" show :variant="noticeVariant" class="py-2 px-3 mb-3 small" aria-live="polite">
          <lah-fa-icon :icon="working ? 'spinner' : 'circle-info'" :spin="working" class="mr-1" />
          {{ notice }}
        </b-alert>

        <div class="d-flex justify-content-between align-items-center mb-1">
          <div class="small font-weight-bold text-secondary">
            已結束 {{ settledCount }} / {{ items.length }} 項（成功 {{ successCount }}、無資料 {{ emptyCount }}、失敗 {{ failedCount }}）
          </div>
          <div class="small text-muted font-weight-bold">
            {{ ((settledCount / (items.length || 1)) * 100).toFixed(0) }}%
          </div>
        </div>
        <b-progress :value="settledCount" :max="items.length || 1" :animated="working" class="mb-3" />

        <div class="border rounded bg-white">
          <div
            v-for="item in items"
            :key="'modal_' + item.code"
            class="d-flex justify-content-between align-items-center p-2 border-bottom"
            :class="{ 'bg-light': item.state === 'pending' }"
          >
            <div class="mr-2 text-truncate">
              <div class="d-flex align-items-center">
                <lah-fa-icon
                  :icon="getItemIcon(item.state)"
                  :spin="item.state === 'pending'"
                  :variant="stateVariant(item.state)"
                  class="mr-2"
                />
                <span class="font-weight-bold s-90">{{ item.name }}</span>
                <span class="text-muted ml-2 s-75">({{ item.source }} · {{ item.extension.toUpperCase() }})</span>
              </div>
              <div v-if="item.message" class="small text-muted mt-1 ml-4 tax-export-text">
                {{ item.message }}
              </div>
            </div>

            <div class="d-flex align-items-center flex-shrink-0">
              <b-badge :variant="stateVariant(item.state)" class="mr-2">
                {{ stateLabel(item.state) }}
              </b-badge>
              <b-button
                v-if="canDownload(item)"
                title="下載檔案"
                variant="outline-primary"
                size="sm"
                :disabled="busy"
                @click="download(item)"
              >
                <lah-fa-icon icon="download" class="mr-1" />
                {{ downloading === item.code ? '下載中' : '下載' }}
              </b-button>
              <b-button
                v-if="item.state === 'failed'"
                title="重新產製此項"
                variant="outline-danger"
                size="sm"
                :disabled="busy"
                @click="retry(item)"
              >
                <lah-fa-icon icon="rotate-right" class="mr-1" />
                重試
              </b-button>
            </div>
          </div>
        </div>
      </div>

      <template #modal-footer="{ cancel }">
        <div class="d-flex w-100 justify-content-between align-items-center">
          <div class="small text-muted">
            <span v-if="cancelling" class="text-danger font-weight-bold">
              <lah-fa-icon icon="spinner" spin class="mr-1" />
              正在中斷產製作業…
            </span>
            <span v-else-if="working">
              <lah-fa-icon icon="spinner" spin class="mr-1" />
              產製進行中，關閉視窗不影響背景處理
            </span>
            <span v-else-if="batch && !hasUnfinished" class="text-success font-weight-bold">
              <lah-fa-icon icon="check" class="mr-1" />
              本批次產製已全部完成
            </span>
            <span v-else-if="batch && hasUnfinished" class="text-warning font-weight-bold">
              <lah-fa-icon icon="triangle-exclamation" class="mr-1" />
              尚有未完成項目，可按「繼續產製」
            </span>
          </div>
          <div class="d-flex align-items-center">
            <b-button
              v-if="working"
              variant="outline-danger"
              size="sm"
              class="mr-2"
              :disabled="cancelling"
              title="中斷產製流程並停止後續項目"
              @click="cancelJob"
            >
              <lah-fa-icon :icon="cancelling ? 'spinner' : 'ban'" :spin="cancelling" class="mr-1" />
              {{ cancelling ? '正在取消…' : '取消作業' }}
            </b-button>
            <b-button
              v-if="batch && hasUnfinished && !working"
              variant="primary"
              size="sm"
              class="mr-2"
              :disabled="busy"
              @click="resume"
            >
              <lah-fa-icon icon="play" class="mr-1" />
              繼續產製
            </b-button>
            <b-button
              v-if="batch && !hasUnfinished"
              variant="success"
              size="sm"
              class="mr-2"
              :disabled="busy"
              @click="downloadZip"
            >
              <lah-fa-icon icon="file-zipper" class="mr-1" />
              {{ downloading === 'zip' ? '下載中' : '下載 ZIP' }}
            </b-button>
            <b-button
              variant="secondary"
              size="sm"
              :disabled="cancelling"
              @click="cancel"
            >
              關閉
            </b-button>
          </div>
        </div>
      </template>
    </b-modal>
  </b-card>
</template>

<script>
import FileSaver from 'file-saver'

const STATES = ['queued', 'pending', 'success', 'empty', 'failed']
const TERMINAL = ['success', 'empty', 'failed']
const ITEM_DEADLINE = 15 * 60 * 1000

export default {
  name: 'LahMgmtBoardTaxExport',
  data: () => ({
    begin: '',
    end: '',
    batch: '',
    batchBegin: '',
    batchEnd: '',
    mock: false,
    items: [],
    working: false,
    cancelling: false,
    checking: false,
    downloading: '',
    uncertainStart: false,
    interrupted: false,
    disposed: false,
    notice: '',
    noticeVariant: 'info',
    cancelSource: null
  }),
  computed: {
    inputId () {
      return `tax-export-${this._uid}`
    },
    modalId () {
      return `tax-export-modal-${this._uid}`
    },
    validDates () {
      return this.isDate(this.begin) && this.isDate(this.end) && this.begin <= this.end
    },
    conditionsLocked () {
      return this.busy || this.uncertainStart || !!this.batch
    },
    busy () {
      return this.working || this.cancelling || this.checking || !!this.downloading
    },
    hasUnfinished () {
      return this.items.some(item => item.supported && !TERMINAL.includes(item.state))
    },
    settledCount () {
      return this.items.filter(item => TERMINAL.includes(item.state)).length
    },
    successCount () {
      return this.items.filter(item => item.state === 'success').length
    },
    emptyCount () {
      return this.items.filter(item => item.state === 'empty').length
    },
    failedCount () {
      return this.items.filter(item => item.state === 'failed').length
    }
  },
  beforeDestroy () {
    this.disposed = true
    if (this.cancelSource) {
      try {
        this.cancelSource.cancel('COMPONENT_DISPOSED')
      } catch (_) {}
    }
  },
  methods: {
    openModal () {
      this.$bvModal.show(this.modalId)
    },
    closeModal () {
      this.$bvModal.hide(this.modalId)
    },
    isDate (value) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) { return false }
      const date = new Date(`${value}T00:00:00Z`)
      return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= '1912-01-01'
    },
    stateLabel (state) {
      return { queued: '等待產製', pending: '產製中', success: '成功', empty: '無資料', failed: '失敗' }[state]
    },
    stateVariant (state) {
      return { queued: 'secondary', pending: 'primary', success: 'success', empty: 'info', failed: 'danger' }[state]
    },
    getItemIcon (state) {
      switch (state) {
        case 'pending': return 'spinner'
        case 'success': return 'circle-check'
        case 'empty': return 'circle-info'
        case 'failed': return 'circle-xmark'
        default: return 'clock'
      }
    },
    async request (action, params = {}, timeout = 660000) {
      const config = { timeout }
      if (this.cancelSource) {
        config.cancelToken = this.cancelSource.token
      }
      const response = await this.$axios.post(this.$consts.API.FILE.EXPORT, {
        type: 'file_tax_export', action, ...params
      }, config)
      const body = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
      if (!body || body.status !== 1) {
        throw new Error((body && body.message) || '系統未接受此操作。')
      }
      return body.data
    },
    applySnapshot (snapshot) {
      if (!snapshot || typeof snapshot.batch !== 'string' || !snapshot.batch ||
          !this.isDate(snapshot.begin) || !this.isDate(snapshot.end) || snapshot.begin > snapshot.end ||
          typeof snapshot.mock !== 'boolean' || !Array.isArray(snapshot.items) || !snapshot.items.length ||
          (this.batch && (snapshot.batch !== this.batch || snapshot.begin !== this.batchBegin || snapshot.end !== this.batchEnd))) {
        throw new Error('批次回應格式或日期不符，請查詢進度。')
      }
      const codes = new Set()
      for (const item of snapshot.items) {
        if (!item || typeof item.code !== 'string' || !item.code || codes.has(item.code) ||
            typeof item.name !== 'string' || typeof item.source !== 'string' ||
            typeof item.extension !== 'string' || !STATES.includes(item.state) ||
            (item.state === 'success' && (typeof item.filename !== 'string' || !item.filename))) {
          throw new Error('產製項目回應不完整，請查詢進度。')
        }
        codes.add(item.code)
      }
      if (this.batch && (snapshot.items.length !== this.items.length || this.items.some(item => !codes.has(item.code)))) {
        throw new Error('批次項目清單不符，請查詢進度。')
      }
      this.batch = snapshot.batch
      this.batchBegin = snapshot.begin
      this.batchEnd = snapshot.end
      this.mock = snapshot.mock
      this.items = snapshot.items
    },
    start () {
      if (this.working) {
        this.openModal()
        return
      }
      if (this.conditionsLocked) { return }
      if (!this.validDates) {
        this.notice = '請填寫有效的起訖日期，起日不可晚於迄日。'
        this.noticeVariant = 'warning'
        this.openModal()
        return
      }
      this.openModal()
      return this.run({ create: true })
    },
    resume () {
      if (this.working) {
        this.openModal()
        return
      }
      if (this.busy || !this.batch || !this.hasUnfinished) { return }
      this.openModal()
      return this.run()
    },
    retry (item) {
      if (this.busy || !this.batch || item.state !== 'failed') { return }
      this.openModal()
      return this.run({ retryCode: item.code })
    },
    reset () {
      if (this.busy || this.uncertainStart) { return }
      this.begin = ''
      this.end = ''
      this.batch = ''
      this.batchBegin = ''
      this.batchEnd = ''
      this.items = []
      this.mock = false
      this.interrupted = false
      this.cancelling = false
      this.notice = ''
      this.noticeVariant = 'info'
    },
    cancelJob () {
      if (!this.working || this.cancelling) { return }
      this.cancelling = true
      this.notice = '正在取消產製作業…'
      this.noticeVariant = 'warning'
      if (this.cancelSource) {
        try {
          this.cancelSource.cancel('USER_CANCELLED')
        } catch (_) {}
      }
    },
    async run ({ create = false, retryCode = '' } = {}) {
      if (this.busy || this.disposed) { return }
      if (this.$axios && this.$axios.CancelToken) {
        this.cancelSource = this.$axios.CancelToken.source()
      } else {
        this.cancelSource = null
      }
      this.working = true
      this.cancelling = false
      this.interrupted = false
      this.notice = create ? '正在建立產製批次…' : '正在確認最新進度…'
      this.noticeVariant = 'info'
      try {
        if (create) { this.uncertainStart = true }
        const snapshot = create
          ? await this.request('start', { begin: this.begin, end: this.end })
          : await this.request('status', { batch: this.batch })
        if (this.disposed || this.cancelling) { return }
        this.applySnapshot(snapshot)
        this.uncertainStart = false
        const codes = retryCode ? [retryCode] : this.items.map(item => item.code)
        for (const code of codes) {
          if (this.cancelling || this.disposed) { break }
          const deadline = Date.now() + ITEM_DEADLINE
          let retry = retryCode === code && this.items.find(item => item.code === code).state === 'failed'
          while (!this.disposed && !this.cancelling) {
            const item = this.items.find(item => item.code === code)
            if (!item || !item.supported) { break }
            if (!retry && TERMINAL.includes(item.state)) { break }
            if (Date.now() >= deadline) { throw new Error('此項產製已等待超過 15 分鐘。') }
            this.notice = `${retry ? '正在重試' : '正在產製'}：${item.name}`
            const params = { batch: this.batch, item: code }
            if (retry) { params.retry = '1' }
            const next = await this.request('advance', params, Math.min(660000, deadline - Date.now()))
            if (this.disposed || this.cancelling) { break }
            this.applySnapshot(next)
            retry = false
            if (Date.now() >= deadline) { throw new Error('此項產製已等待超過 15 分鐘。') }
            if (!TERMINAL.includes(this.items.find(item => item.code === code).state)) {
              await new Promise(resolve => setTimeout(resolve, 1500))
            }
          }
          if (this.disposed || this.cancelling) { break }
        }
        if (this.cancelling) {
          this.interrupted = true
          if (this.batch) {
            try {
              this.cancelSource = null
              const snapshot = await this.request('status', { batch: this.batch }, 10000)
              if (!this.disposed) { this.applySnapshot(snapshot) }
            } catch (_) {}
          }
          this.noticeVariant = 'warning'
          this.notice = '已由使用者中途取消產製作業。已產製完成之項目已妥善保存，可下載或隨時點擊「繼續產製」接續處理。'
          return
        }
        this.showResult()
      } catch (error) {
        if (this.disposed) { return }
        const isUserCancel = this.cancelling || (this.$axios && this.$axios.isCancel && this.$axios.isCancel(error))
        this.interrupted = true
        let checked = false
        if (this.batch) {
          try {
            this.cancelSource = null
            const snapshot = await this.request('status', { batch: this.batch }, 10000)
            if (this.disposed) { return }
            this.applySnapshot(snapshot)
            checked = true
          } catch (_) {}
        }
        this.noticeVariant = 'warning'
        if (isUserCancel) {
          this.notice = '已由使用者中途取消產製作業。已產製完成之項目已妥善保存，可下載或隨時點擊「繼續產製」接續處理。'
        } else {
          this.notice = `自動產製流程仍未完成，已停止。${error.message || '連線中斷。'} ${checked ? '已查詢最新進度，請核對各項結果。' : '目前無法確認最新進度。'}${this.batch ? ' 可查詢進度或按「繼續產製」接續未完成項目。' : ' 請勿重複提交產製申請。'}`
        }
      } finally {
        this.cancelSource = null
        if (!this.disposed) {
          this.working = false
          this.cancelling = false
        }
      }
    },
    showResult () {
      const complete = this.items.length > 0 && this.settledCount === this.items.length
      this.noticeVariant = complete && !this.failedCount ? 'success' : 'warning'
      this.notice = `${complete ? '本批項目已處理完畢' : '本批仍有未完成項目'}：成功 ${this.successCount} 份、無資料 ${this.emptyCount} 項、失敗 ${this.failedCount} 項，共 ${this.items.length} 項。${this.failedCount ? ' 失敗項目可單獨重試，其餘成果會保留。' : ''}`
    },
    async refreshStatus () {
      if (!this.batch || this.busy) { return }
      this.checking = true
      try {
        const snapshot = await this.request('status', { batch: this.batch })
        if (this.disposed) { return }
        this.applySnapshot(snapshot)
        if (this.interrupted) {
          this.noticeVariant = 'warning'
          this.notice = `已更新進度：成功 ${this.successCount} 份、無資料 ${this.emptyCount} 項、失敗 ${this.failedCount} 項。自動產製流程仍處於停止狀態，請核對各項結果。${this.hasUnfinished ? ' 可按「繼續產製」接續未完成項目。' : ''}`
        } else {
          this.showResult()
        }
      } catch (error) {
        this.noticeVariant = 'warning'
        this.notice = `無法查詢進度：${error.message || '連線異常'}。請稍後再試。`
      } finally {
        this.checking = false
      }
    },
    canDownload (item) {
      return ['success', 'empty'].includes(item.state) && typeof item.filename === 'string' && !!item.filename
    },
    download (item) {
      if (!this.canDownload(item)) { return }
      return this.downloadFile(item.code, item.filename)
    },
    downloadZip () {
      if (this.hasUnfinished) { return }
      return this.downloadFile('zip', `${this.batchBegin}_${this.batchEnd}_地方稅務局資料.zip`)
    },
    downloadFilename (headers, fallback) {
      const disposition = (headers && (headers['content-disposition'] || headers['Content-Disposition'])) || ''
      const encoded = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
      const plain = disposition.match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i)
      let filename = fallback
      if (encoded) {
        try { filename = decodeURIComponent(encoded[1].trim()) } catch (_) {}
      } else if (plain) {
        filename = (plain[1] || plain[2]).trim()
      }
      const basename = filename.split(/[\\/]/).pop()
      return Array.from(basename).filter(char => char.charCodeAt(0) > 31 && char.charCodeAt(0) !== 127).join('') || fallback
    },
    async downloadFile (code, filename) {
      if (this.busy || !this.batch) { return }
      this.downloading = code
      try {
        const response = await this.$axios.get(this.$consts.API.FILE.DATA, {
          params: { type: 'tax', batch: this.batch, item: code },
          responseType: 'blob',
          timeout: 660000
        })
        const blob = response.data
        if (!blob || !blob.size || /json|html/i.test(blob.type || '')) {
          throw new Error('系統未回傳可下載的檔案。')
        }
        if (this.disposed) { return }
        FileSaver.saveAs(blob, this.downloadFilename(response.headers, filename))
      } catch (error) {
        this.noticeVariant = 'warning'
        this.notice = `下載失敗：${error.message || '連線異常'}。`
      } finally {
        this.downloading = ''
      }
    }
  }
}
</script>

<style scoped>
.tax-export-board {
  min-width: 0;
}
.tax-export-board .card-body {
  padding: 0.85rem;
}
.tax-export-text {
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
