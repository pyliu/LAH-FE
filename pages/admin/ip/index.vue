<template lang="pug">
div(v-cloak)
  lah-header: lah-transition(appear): .d-flex.justify-content-between.align-items-center.w-100
    .d-flex.align-items-center.header-left-group
      h3.my-auto.font-weight-bold.mb-0 IP對應表管理
      lah-button(
        icon="info"
        action="bounce"
        variant="outline-success"
        size="lg"
        no-border
        no-icon-gutter
        @click="showModalById('help-modal')"
        title="說明"
        class="ml-1"
      )
      lah-help-modal(:modal-id="'help-modal'" size="lg" modal-title="IP對應表管理說明" scrollable)
        h6.font-weight-bold.text-dark
          lah-fa-icon.mr-1(icon="desktop" variant="success")
          span 頂部工具列與 Client IP 狀態卡
        ul.mb-3
          li #[b 自動偵測 Client IP]：即時顯示您目前連線的 IP 位址（游標停留可檢視是否已設為靜態或對應同仁）。若表格中有與目前 Client IP 相同的紀錄，該列會以綠色底色與 #[b-badge(variant="success" pill) 我的 IP] 醒目標示。
          li #[lah-fa-icon.text-primary.mr-1(icon="satellite-dish")]#[b Ping 測試 Client IP]：立即測試目前連線 IP 的網路回應狀態與延遲時間（ms）。
          li #[lah-fa-icon.text-info.mr-1(icon="filter")]#[b 在列表中篩選 Client IP]：一鍵於左右兩側表格同時過濾出目前連線之 IP，再次點擊即可清除篩選。
          li #[lah-fa-icon.text-success.mr-1(icon="plus")]#[b 設為靜態]：將目前連線的 Client IP 與登入者資訊直接帶入新增靜態 IP 視窗。
          li #[b-badge(variant="primary" pill) + 新增設定] / #[lah-fa-icon.text-secondary(icon="sync-alt")]：手動新增靜態 IP 設定，或立即重新整理資料（頁面每 60 秒亦會自動背景同步一次）。

        h6.font-weight-bold.text-primary
          lah-fa-icon.mr-1(icon="network-wired")
          span 左側：靜態 IP 設定（STATIC）
        ul.mb-3
          li 管理固定主機與終端設備之 IP 對應表，供系統主機識別、服務狀態監控及各項權限判定使用。
          li #[b 設備類別標籤]：
            ul.mt-1
              li #[b-badge(variant="danger" pill) 伺服器]（#[code SERVER]）：資料庫、Web AP、備份機等伺服器主機。
              li #[b-badge(variant="info" pill) 其他終端]（#[code OTHER_EP]）：工作站櫃台/審查電腦、公用印表機、閘道器、觸控查詢機等設備。
              li #[b-badge(variant="dark" pill) 系統主機]（#[code SYSTEM]）：系統級核心設備與控管主機。
              li #[b-badge(variant="primary" pill) 使用者]（#[code USER]）：固定配發給特定同仁使用之個人電腦。
          li #[b 搜尋與篩選]：支援輸入 IP、設定名稱或備註關鍵字即時過濾，並可透過下拉選單依「設備類別」篩選。
          li #[b 單筆操作與快捷功能]：
            ul.mt-1
              li 點擊 IP 位址文字或右側 #[lah-fa-icon.text-secondary(icon="copy")] 圖示，可一鍵複製該 IP 至剪貼簿。
              li #[lah-fa-icon.text-secondary.mr-1(icon="satellite-dish")]#[b Ping 測試連線]：測試該 IP 是否在線，回應結果（延遲 #[code ms] 或 #[code 逾時]）會直接標示於 IP 旁。
              li #[lah-fa-icon.text-primary.mr-1(icon="edit")]#[b 編輯設定] / #[lah-fa-icon.text-danger.mr-1(icon="times")]#[b 刪除設定]：修改或移除該筆靜態 IP 設定；新增與編輯視窗內支援常用名稱快捷帶入與即時 Ping 測試，輸入 IP 時若命中動態回報紀錄亦會自動帶入同仁名稱建議。

        h6.font-weight-bold.text-info
          lah-fa-icon.mr-1(icon="users")
          span 右側：使用者回報 IP 對應表（DYNAMIC）
        ul.mb-0
          li 顯示同仁電腦端透過 #[b 桃園即時通] 正常登入連線時自動回報之動態 IP 紀錄（電腦端需安裝並登入 #[b 桃園即時通] 才會產生回報紀錄）。
          li #[b 搜尋與時間範圍]：支援依 IP、登入帳號或同仁姓名即時搜尋，並可切換回報時間範圍（#[code 7 天內]、#[code 30 天內]、#[code 1 年內]）。
          li #[b 單筆操作]：
            ul.mt-1
              li #[lah-fa-icon.text-secondary.mr-1(icon="satellite-dish")]#[b Ping 測試連線]：檢測該同仁目前回報之電腦 IP 是否可正常連線。
              li #[lah-fa-icon.text-success.mr-1(icon="plus")]#[b 設為靜態設定]：將該筆動態回報紀錄一鍵升級轉入「新增靜態 IP 設定」視窗（自動預填 IP、使用者類別、同仁姓名與備註）。
              li #[lah-fa-icon.text-primary.mr-1(icon="upload")]#[b 更新至使用者資料]：將該筆回報之連線 IP 直接同步寫入該名同仁的使用者基本資料中。

    .d-flex.align-items-center.flex-nowrap.text-nowrap.header-right-group
      //- Client IP 狀態卡
      b-input-group.client-ip-widget.mr-2(size="lg")
        template(#prepend)
          b-input-group-text.bg-dark.text-white.font-weight-bold.px-2
            lah-fa-icon.text-success.mr-1(icon="desktop")
            span CLIENT IP
        b-form-input.font-weight-bold.text-center.bg-white.px-2(
          :value="clientIp || '偵測中...'"
          size="lg"
          readonly
          style="width: 160px;"
          :title="clientIpTooltip"
        )
        template(#append)
          b-button(
            variant="outline-primary"
            size="lg"
            title="Ping 測試 Client IP"
            :disabled="!isClientIpValid || isBusy"
            @click="ping(clientIp)"
          )
            lah-fa-icon(icon="satellite-dish")
          b-button(
            :variant="isFilterMyIpActive ? 'info' : 'outline-info'"
            size="lg"
            title="在列表中篩選 Client IP"
            :disabled="!isClientIpValid"
            @click="filterClientIp"
          )
            lah-fa-icon(icon="filter")
          b-button(
            variant="outline-success"
            size="lg"
            title="將 Client IP 設為靜態設定"
            :disabled="!isClientIpValid"
            @click="addClientIpToStatic"
          )
            lah-fa-icon(icon="plus")
            span.d-none.d-xl-inline.ml-1 設為靜態

      b-button-group(size="lg")
        lah-button.mr-1(
          icon="plus"
          variant="primary"
          size="lg"
          title="新增靜態 IP 設定"
          @click="openAddModal()"
          pill
        ) 新增設定
        lah-button(
          icon="sync-alt"
          variant="outline-secondary"
          size="lg"
          title="重新整理資料"
          :action="isBusy ? 'spin' : ''"
          :disabled="isBusy"
          @click="$fetch"
          pill
        )

  b-card-group(deck)
    //- 左側：靜態 IP 對應表
    b-card.fixed-vh.shadow-sm(no-body)
      b-card-header.bg-light.py-2
        .d-flex.justify-content-between.align-items-center.flex-wrap
          .d-flex.align-items-center.my-1
            h5.font-weight-bold.mb-0.text-primary
              lah-fa-icon.mr-1(icon="network-wired")
              span 靜態 IP 設定
            b-badge.ml-2(variant="primary" pill) {{ filteredStatic.length }} / {{ staticList.length }}
          .d-flex.align-items-center.my-1
            b-input-group(size="sm" class="mr-2" style="max-width: 170px;")
              b-form-input(v-model="staticKeyword" placeholder="搜尋 IP/名稱..." trim)
              template(#append)
                b-button(v-if="staticKeyword" variant="outline-secondary" @click="staticKeyword = ''" title="清除") &times;
            b-select(
              v-model="staticTypeFilter"
              size="sm"
              :options="staticTypeFilterOptions"
              class="mr-2"
              style="width: 110px;"
              title="類型篩選"
            )
            lah-button(
              icon="plus"
              variant="outline-primary"
              size="sm"
              title="新增靜態 IP 設定"
              no-icon-gutter
              pill
              @click="openAddModal()"
            )
      b-card-body.p-0.d-flex.flex-column.overflow-hidden
        b-table.b-table-max-height.mb-0(
          striped
          hover
          responsive
          bordered
          no-border-collapse
          small
          selectable
          sticky-header
          head-variant="dark"
          select-mode="single"
          selected-variant="warning"
          :items="filteredStatic"
          :fields="staticFields"
          :sort-compare="sortCompare"
          :tbody-tr-class="rowClass"
          show-empty
          empty-text="查無符合條件的靜態 IP 資料"
        )
          template(#cell(操作)="{ item }")
            b-button-group(size="sm")
              lah-button.mr-1(
                icon="satellite-dish"
                variant="outline-secondary"
                size="sm"
                no-icon-gutter
                title="Ping 測試連線"
                @click="ping(item.ip)"
                pill
              )
              lah-button.mr-1(
                icon="edit"
                variant="outline-primary"
                size="sm"
                no-icon-gutter
                title="編輯設定"
                @click="openEditModal(item)"
                pill
              )
              lah-button(
                icon="times"
                variant="outline-danger"
                size="sm"
                no-icon-gutter
                title="刪除設定"
                @click="remove(item)"
                pill
              )
          template(#cell(ip)="{ item }")
            .d-flex.align-items-center.justify-content-between
              .d-flex.align-items-center
                span.font-weight-bold.text-monospace.mr-1(
                  :class="item.ip === clientIp ? 'text-success' : ''"
                  v-b-tooltip.hover="`點擊複製 ${item.ip}`"
                  style="cursor: pointer;"
                  @click="copyToClipboard(item.ip)"
                ) {{ item.ip }}
                b-badge(
                  v-if="item.ip === clientIp"
                  variant="success"
                  pill
                  class="ml-1 animate__animated animate__pulse animate__infinite"
                  title="此 IP 為您目前的連線 Client IP"
                ) 我的 IP
                b-badge.ml-1(
                  v-if="pingMap[item.ip]"
                  :variant="pingMap[item.ip].isOk ? 'success' : 'danger'"
                  pill
                  :title="`回應: ${pingMap[item.ip].latency} ms`"
                ) {{ pingMap[item.ip].isOk ? `${pingMap[item.ip].latency} ms` : '逾時' }}
              lah-button.p-0(
                icon="copy"
                variant="outline-secondary"
                size="sm"
                no-border
                no-icon-gutter
                title="複製 IP"
                @click="copyToClipboard(item.ip)"
              )
          template(#cell(entry_type)="{ item }")
            b-badge(:variant="entryTypeVariant(item.entry_type)" pill) {{ entryTypeLabel(item.entry_type) }}
          template(#cell(entry_desc)="{ item }")
            span.font-weight-bold {{ item.entry_desc }}
          template(#cell(timestamp)="{ item }"): .text-nowrap {{ $utils.phpTsToAdDateStr(item.timestamp, false) }}
          template(#cell(note)="{ item }")
            span.text-muted.small {{ item.note || '-' }}

    //- 右側：使用者回報 IP 對應表
    b-card.fixed-vh.shadow-sm(no-body)
      b-card-header.bg-light.py-2
        .d-flex.justify-content-between.align-items-center.flex-wrap
          .d-flex.align-items-center.my-1
            h5.font-weight-bold.mb-0.text-info
              lah-fa-icon.mr-1(icon="users")
              span 使用者回報 IP 對應表
            b-badge.ml-2(variant="info" pill) {{ filteredDynamic.length }} / {{ dynamicList.length }}
          .d-flex.align-items-center.my-1
            b-input-group(size="sm" class="mr-2" style="max-width: 180px;")
              b-form-input(v-model="dynamicKeyword" placeholder="搜尋 IP/帳號/同仁..." trim)
              template(#append)
                b-button(v-if="dynamicKeyword" variant="outline-secondary" @click="dynamicKeyword = ''" title="清除") &times;
            b-select(
              v-model="dynamicOffset"
              size="sm"
              :options="dynamicOffsetOptions"
              style="width: 105px;"
              @change="$fetch"
              title="查詢回報時間範圍"
            )
      b-card-body.p-0.d-flex.flex-column.overflow-hidden
        b-table.b-table-max-height.mb-0(
          striped
          hover
          responsive
          bordered
          no-border-collapse
          small
          selectable
          sticky-header
          head-variant="dark"
          select-mode="single"
          selected-variant="warning"
          :items="filteredDynamic"
          :fields="dynamicFields"
          :sort-compare="sortCompare"
          :tbody-tr-class="rowClass"
          show-empty
          empty-text="查無符合條件的使用者回報 IP 資料"
        )
          template(#cell(序號)="{ index }") {{ index + 1 }}
          template(#cell(ip)="{ item }")
            .d-flex.align-items-center.justify-content-between
              .d-flex.align-items-center
                span.font-weight-bold.text-monospace.mr-1(
                  :class="item.ip === clientIp ? 'text-success' : ''"
                  v-b-tooltip.hover="`點擊複製 ${item.ip}`"
                  style="cursor: pointer;"
                  @click="copyToClipboard(item.ip)"
                ) {{ item.ip }}
                b-badge(
                  v-if="item.ip === clientIp"
                  variant="success"
                  pill
                  class="ml-1 animate__animated animate__pulse animate__infinite"
                  title="此 IP 為您目前的連線 Client IP"
                ) 我的 IP
                b-badge.ml-1(
                  v-if="pingMap[item.ip]"
                  :variant="pingMap[item.ip].isOk ? 'success' : 'danger'"
                  pill
                  :title="`回應: ${pingMap[item.ip].latency} ms`"
                ) {{ pingMap[item.ip].isOk ? `${pingMap[item.ip].latency} ms` : '逾時' }}
              lah-button.p-0(
                icon="copy"
                variant="outline-secondary"
                size="sm"
                no-border
                no-icon-gutter
                title="複製 IP"
                @click="copyToClipboard(item.ip)"
              )
          template(#cell(entry_id)="{ item }")
            span.badge.badge-light.text-dark {{ item.entry_id }}
          template(#cell(entry_desc)="{ item }"): .text-nowrap.font-weight-bold {{ (userNames && userNames[item.entry_id]) || item.entry_desc || item.entry_id }}
          template(#cell(timestamp)="{ item }"): .text-nowrap {{ time(item) }}
          template(#cell(操作)="{ item }")
            b-button-group(size="sm")
              lah-button.mr-1(
                icon="satellite-dish"
                variant="outline-secondary"
                size="sm"
                no-icon-gutter
                title="Ping 測試連線"
                @click="ping(item.ip)"
                pill
              )
              lah-button.mr-1(
                icon="plus"
                variant="outline-success"
                size="sm"
                no-icon-gutter
                title="將此 IP 設為靜態設定"
                @click="openAddModalFromDynamic(item)"
                pill
              )
              lah-button(
                icon="upload"
                variant="outline-primary"
                size="sm"
                no-icon-gutter
                pill
                title="將此 IP 更新至使用者資料"
                @click="updateUserIp(item)"
              )

  //- 整合型 IP 設定 Modal
  b-modal(
    id="ip-setting-modal"
    ref="ipSettingModal"
    hide-footer
    scrollable
    no-close-on-backdrop
    size="lg"
  )
    template(#modal-title)
      lah-fa-icon.mr-1(:icon="modalMode === 'add' ? 'plus-circle' : 'edit'" :variant="modalMode === 'add' ? 'success' : 'primary'")
      span {{ modalMode === 'add' ? '新增靜態 IP 設定' : '編輯靜態 IP 設定' }}

    b-form(@submit.prevent="saveIpForm")
      //- IP 位址輸入與帶入按鈕
      b-form-group(
        label="IP 位址"
        label-for="modal-ip-input"
        :state="isFormIPv4"
        :invalid-feedback="'請輸入正確的 IPv4 格式 (例如: 192.168.1.1)'"
      )
        b-input-group
          b-input(
            id="modal-ip-input"
            v-model="ipForm.ip"
            :state="isFormIPv4"
            placeholder="例如: 220.1.34.XX 或 192.168.XX.XX"
            trim
            @input="onIpInput"
          )
          template(#append)
            b-button(
              variant="outline-primary"
              size="sm"
              :disabled="!isClientIpValid"
              title="帶入目前連線端 Client IP"
              @click="ipForm.ip = clientIp"
            )
              lah-fa-icon.mr-1(icon="desktop")
              span 帶入 Client IP
            b-button(
              variant="outline-info"
              size="sm"
              :disabled="!isFormIPv4 || formPingTesting"
              title="測試此 IP 是否可連線"
              @click="testFormPing"
            )
              lah-fa-icon(:icon="formPingTesting ? 'spinner' : 'satellite-dish'" :action="formPingTesting ? 'spin' : ''")
              span.ml-1 Ping 測試

        //- Ping 測試結果提示
        .mt-1(v-if="formPingResult")
          b-badge(:variant="formPingResult.isOk ? 'success' : 'danger'" class="p-1")
            lah-fa-icon.mr-1(:icon="formPingResult.isOk ? 'check' : 'exclamation-triangle'")
            span {{ formPingResult.message || (formPingResult.isOk ? `連線正常 (${formPingResult.latency} ms)` : '連線逾時或無回應') }}

      //- 類別選擇
      b-form-group(label="設備類別" label-for="modal-type-select")
        b-select(
          id="modal-type-select"
          v-model="ipForm.entry_type"
          :options="entryTypeOptions"
          :state="isFormTypeValid"
        )

      //- 名稱輸入與快捷按鈕
      b-form-group(
        label="設定名稱"
        label-for="modal-desc-input"
        :state="isFormDescValid"
        invalid-feedback="名稱為必填欄位"
      )
        b-input(
          id="modal-desc-input"
          v-model="ipForm.entry_desc"
          :state="isFormDescValid"
          placeholder="請輸入主機或設備名稱，如：登記課公用印表機、WebAP 主機"
          trim
        )
        .d-flex.align-items-center.flex-wrap.mt-1
          span.small.text-muted.mr-1 常用名稱快捷：
          b-badge.mr-1.mb-1.p-1(
            v-for="preset in descPresets"
            :key="preset"
            variant="light"
            style="cursor: pointer; border: 1px dashed #6c757d;"
            @click="applyPreset(preset)"
          ) + {{ preset }}

      //- 備註說明
      b-form-group(label="備註說明" label-for="modal-note-input")
        b-input(
          id="modal-note-input"
          v-model="ipForm.note"
          placeholder="可選填位置、用途、負責人等備註資訊"
          trim
        )

      //- 操作按鈕
      .d-flex.justify-content-end.mt-3
        b-button.mr-2(variant="outline-secondary" @click="$bvModal.hide('ip-setting-modal')") 取消
        lah-button(
          icon="save"
          variant="primary"
          :disabled="isFormSaveDisabled"
          @click="saveIpForm"
        ) 儲存設定
</template>

<script>
export default {
  middleware: ['isAdmin'],
  asyncData ({ store, redirect, error }) { return {} },
  data: () => ({
    // Client IP
    clientIp: '',
    detectedClientIp: '',
    intervalId: null,

    // 搜尋與篩選
    staticKeyword: '',
    staticTypeFilter: '',
    staticTypeFilterOptions: [
      { value: '', text: '全部類型' },
      { value: 'SERVER', text: '伺服器' },
      { value: 'OTHER_EP', text: '其他終端' },
      { value: 'SYSTEM', text: '系統主機' },
      { value: 'USER', text: '使用者' }
    ],
    dynamicKeyword: '',
    dynamicOffset: 31556926,
    dynamicOffsetOptions: [
      { value: 604800, text: '7 天內' },
      { value: 2629743, text: '30 天內' },
      { value: 31556926, text: '1 年內' }
    ],

    // 表格資料
    entries: [],
    pingMap: {},

    // 整合型 IP 設定表單
    modalMode: 'add', // 'add' | 'edit'
    ipForm: {
      orig_ip: '',
      orig_added_type: 'STATIC',
      orig_entry_type: '',
      ip: '',
      entry_type: 'OTHER_EP',
      entry_desc: '',
      note: ''
    },
    formPingTesting: false,
    formPingResult: null,

    entryTypeOptions: [
      { value: 'SERVER', text: '伺服器 (SERVER)' },
      { value: 'OTHER_EP', text: '其他終端/設備 (OTHER_EP)' },
      { value: 'SYSTEM', text: '系統主機 (SYSTEM)' },
      { value: 'USER', text: '使用者電腦 (USER)' }
    ],
    descPresets: [
      'Web 伺服器',
      '資料庫主機 (DB)',
      '備份伺服器',
      '公用印表機',
      '閘道器 (Gateway)',
      '公用電腦',
      '觸控查詢機',
      '會議室設備'
    ],

    // 表格欄位設定
    staticFields: [
      { key: '操作', label: '操作', class: 'text-center text-nowrap' },
      { key: 'ip', label: '設定位址', sortable: true },
      { key: 'entry_type', label: '類型', sortable: true },
      { key: 'entry_desc', label: '設定名稱', sortable: true },
      { key: 'timestamp', label: '更新日期', sortable: true },
      { key: 'note', label: '備註', sortable: true }
    ],
    dynamicFields: [
      '序號',
      { key: 'ip', label: '連線位址', sortable: true },
      { key: 'entry_id', label: '登入帳號', sortable: true },
      { key: 'entry_desc', label: '登入名稱', sortable: true },
      { key: 'timestamp', label: '回報日期', sortable: true },
      { key: '操作', label: '操作', class: 'text-center text-nowrap' }
    ]
  }),
  fetchOnServer: false,
  fetch () {
    this.isBusy = true
    return this.$axios.post(this.$consts.API.JSON.IP, {
      type: 'ip_entries',
      offset: this.dynamicOffset
    }).then(({ data }) => {
      this.entries = Array.isArray(data.raw) ? [...data.raw] : []
      this.detectClientIp()
    }).catch((err) => {
      this.alert(err)
    }).finally(() => {
      this.isBusy = false
    })
  },
  head: {
    title: 'IP對應表管理'
  },
  computed: {
    isFormIPv4 () { return this.$utils.isIPv4(this.ipForm.ip) },
    isFormTypeValid () { return ['SERVER', 'OTHER_EP', 'SYSTEM', 'USER'].includes(this.ipForm.entry_type) },
    isFormDescValid () { return !this.$utils.empty(this.ipForm.entry_desc) },
    isFormSaveDisabled () {
      return !this.isFormIPv4 || !this.isFormTypeValid || !this.isFormDescValid || this.isBusy
    },
    isClientIpValid () {
      return this.$utils.isIPv4(this.clientIp)
    },
    isFilterMyIpActive () {
      return Boolean(this.clientIp && this.staticKeyword === this.clientIp && this.dynamicKeyword === this.clientIp)
    },
    clientIpTooltip () {
      if (!this.clientIp) { return '尚未偵測到 Client IP' }
      const staticFound = this.staticList.find(s => s.ip === this.clientIp)
      if (staticFound) {
        return `目前連線 Client IP (已設為靜態: ${staticFound.entry_desc})`
      }
      const dynamicFound = this.dynamicList.find(d => d.ip === this.clientIp)
      if (dynamicFound) {
        const name = (this.userNames && this.userNames[dynamicFound.entry_id]) || dynamicFound.entry_desc
        return `目前連線 Client IP (同仁: ${name})`
      }
      return '目前連線 Client IP (尚未加入靜態對應)'
    },
    staticList () {
      return this.entries.filter(entry => entry.added_type === 'STATIC')
    },
    dynamicList () {
      return this.entries.filter(entry => entry.added_type === 'DYNAMIC')
    },
    // 向下相容
    static () { return this.staticList },
    dynamic () { return this.dynamicList },

    filteredStatic () {
      let list = this.staticList
      if (this.staticTypeFilter) {
        list = list.filter(item => item.entry_type === this.staticTypeFilter)
      }
      if (this.staticKeyword) {
        const kw = this.staticKeyword.toLowerCase()
        list = list.filter(item =>
          (item.ip && item.ip.toLowerCase().includes(kw)) ||
          (item.entry_desc && item.entry_desc.toLowerCase().includes(kw)) ||
          (item.note && item.note.toLowerCase().includes(kw)) ||
          (item.entry_type && item.entry_type.toLowerCase().includes(kw))
        )
      }
      return list
    },
    filteredDynamic () {
      let list = this.dynamicList
      if (this.dynamicKeyword) {
        const kw = this.dynamicKeyword.toLowerCase()
        list = list.filter((item) => {
          const uName = (this.userNames && this.userNames[item.entry_id]) || item.entry_desc || ''
          return (
            (item.ip && item.ip.toLowerCase().includes(kw)) ||
            (item.entry_id && item.entry_id.toLowerCase().includes(kw)) ||
            (item.entry_desc && item.entry_desc.toLowerCase().includes(kw)) ||
            uName.toLowerCase().includes(kw)
          )
        })
      }
      return list
    }
  },
  mounted () {
    this.clientIp = this.ip || ''
    this.detectClientIp()
    this.intervalId = setInterval(this.$fetch, 60 * 1000)
  },
  beforeDestroy () {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  },
  methods: {
    // 偵測後端識別的真實 Client IP
    async detectClientIp () {
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'ip'
        })
        if (this.$utils.statusCheck(data.status) && data.ip) {
          this.detectedClientIp = data.ip
          this.clientIp = data.ip
          if (this.ip === '0.0.0.0' || this.ip === '127.0.0.1' || this.ip === '::1') {
            this.$store.commit('ip', data.ip)
          }
        }
      } catch (err) {
        this.$utils.warn('後端 Client IP 偵測失敗，使用 store.ip', err)
        if (!this.clientIp) {
          this.clientIp = this.ip || ''
        }
      }
    },
    // 一鍵在列表中篩選 Client IP
    filterClientIp () {
      if (!this.clientIp) { return }
      if (this.isFilterMyIpActive) {
        this.staticKeyword = ''
        this.dynamicKeyword = ''
        this.notify('已清除 Client IP 篩選', { type: 'info' })
      } else {
        this.staticKeyword = this.clientIp
        this.dynamicKeyword = this.clientIp
        this.notify(`已篩選 Client IP (${this.clientIp})`, { type: 'info' })
      }
    },
    // 一鍵將 Client IP 設為靜態設定
    addClientIpToStatic () {
      if (!this.isClientIpValid) {
        this.warning('尚未取得合法的 Client IP')
        return
      }
      const myName = this.user?.name || ''
      this.openAddModal({
        ip: this.clientIp,
        entry_type: this.authority?.isAdmin ? 'SERVER' : 'USER',
        entry_desc: myName ? `${myName} 電腦` : '管理者電腦',
        note: '連線端 Client IP 設定'
      })
    },
    // 開啟新增 Modal
    openAddModal (prefill = {}) {
      this.modalMode = 'add'
      this.formPingResult = null
      this.ipForm = {
        orig_ip: '',
        orig_added_type: 'STATIC',
        orig_entry_type: '',
        ip: prefill.ip || '',
        entry_type: prefill.entry_type || 'OTHER_EP',
        entry_desc: prefill.entry_desc || '',
        note: prefill.note || ''
      }
      this.$bvModal.show('ip-setting-modal')
    },
    // 開啟編輯 Modal
    openEditModal (record) {
      this.modalMode = 'edit'
      this.formPingResult = null
      this.ipForm = {
        orig_ip: record.ip,
        orig_added_type: record.added_type || 'STATIC',
        orig_entry_type: record.entry_type,
        ip: record.ip,
        entry_type: record.entry_type,
        entry_desc: record.entry_desc,
        note: record.note || ''
      }
      this.$bvModal.show('ip-setting-modal')
    },
    // 由動態列表一鍵設為靜態
    openAddModalFromDynamic (item) {
      const name = (this.userNames && this.userNames[item.entry_id]) || item.entry_desc || item.entry_id
      this.openAddModal({
        ip: item.ip,
        entry_type: 'USER',
        entry_desc: `${name} 電腦`,
        note: `同仁回報 (${item.entry_id})`
      })
    },
    // IP 變動時智慧建議
    onIpInput () {
      this.formPingResult = null
      if (this.modalMode === 'add' && !this.ipForm.entry_desc && this.$utils.isIPv4(this.ipForm.ip)) {
        const dyn = this.dynamicList.find(d => d.ip === this.ipForm.ip)
        if (dyn) {
          const name = (this.userNames && this.userNames[dyn.entry_id]) || dyn.entry_desc || dyn.entry_id
          this.ipForm.entry_desc = `${name} 電腦`
          this.ipForm.entry_type = 'USER'
          this.ipForm.note = `同仁回報 (${dyn.entry_id})`
        }
      }
    },
    // 套用常用快捷名稱
    applyPreset (preset) {
      this.ipForm.entry_desc = preset
      if (['Web 伺服器', '資料庫主機 (DB)', '備份伺服器'].includes(preset)) {
        this.ipForm.entry_type = 'SERVER'
      } else if (['公用印表機', '閘道器 (Gateway)', '觸控查詢機', '會議室設備'].includes(preset)) {
        this.ipForm.entry_type = 'OTHER_EP'
      }
    },
    // Modal 內的 Ping 測試
    testFormPing () {
      if (!this.isFormIPv4) { return }
      this.formPingTesting = true
      this.formPingResult = null
      this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'ping',
        ip: this.ipForm.ip
      }).then(({ data }) => {
        const latency = parseFloat(data.latency || 0)
        const isOk = this.$utils.statusCheck(data.status) && latency < 999 && latency > 0
        this.formPingResult = {
          isOk,
          latency: data.latency,
          message: data.message
        }
      }).catch((err) => {
        this.formPingResult = {
          isOk: false,
          message: err.message || '測試失敗'
        }
      }).finally(() => {
        this.formPingTesting = false
      })
    },
    // 儲存 IP 設定
    saveIpForm () {
      if (this.isFormSaveDisabled) { return }
      this.isBusy = true
      const isAdd = this.modalMode === 'add'
      const actionType = isAdd ? 'add_static_ip_entry' : 'edit_static_ip_entry'
      const payload = {
        type: actionType,
        ...this.ipForm
      }

      this.$axios.post(this.$consts.API.JSON.IP, payload).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.notify(data.message || (isAdd ? '新增 IP 設定成功' : '編輯 IP 設定成功'), { type: 'success' })
          this.$bvModal.hide('ip-setting-modal')
          this.$fetch()
        } else {
          this.alert(data.message || '儲存 IP 設定失敗')
        }
      }).catch((err) => {
        this.$utils.error('儲存 IP 設定失敗', err)
        this.alert(err.message || '儲存 IP 設定失敗')
      }).finally(() => {
        this.isBusy = false
      })
    },
    // 刪除靜態 IP 設定
    remove (record) {
      this.confirm(`確定要刪除「${record.ip}」(${record.entry_desc} / ${this.entryTypeLabel(record.entry_type)}) 靜態設定嗎？`).then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.IP, {
            type: 'remove_ip_entry',
            ip: record.ip,
            added_type: record.added_type,
            entry_type: record.entry_type
          }).then(({ data }) => {
            if (this.$utils.statusCheck(data.status)) {
              this.notify(data.message || '已成功刪除 IP 設定', { type: 'success' })
              this.$fetch()
            } else {
              this.alert(data.message || '刪除失敗')
            }
          }).catch((err) => {
            this.$utils.error('刪除 IP 設定失敗', err)
            this.alert(err.message || '刪除失敗')
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    // 單筆 Ping 測試
    ping (ip) {
      if (!this.$utils.isIPv4(ip)) {
        this.warning(`「${ip}」不是有效的 IPv4 位址`)
        return
      }
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'ping',
        ip
      }).then(({ data }) => {
        const latency = parseFloat(data.latency || 0)
        const isOk = this.$utils.statusCheck(data.status) && latency < 999 && latency > 0
        this.$set(this.pingMap, ip, {
          latency: data.latency,
          isOk,
          timestamp: Date.now()
        })
        if (isOk) {
          this.notify(`${ip} 回應正常，延遲時間：${data.latency} ms`, { type: 'success', title: 'Ping 連線測試' })
        } else {
          this.warning(`${ip} 連線無回應或逾時 (${data.message || 'Timeout'})`, { title: 'Ping 連線測試' })
        }
      }).catch((err) => {
        this.$utils.error('Ping 測試發生錯誤', err)
        this.alert(err.message || 'Ping 測試失敗')
      }).finally(() => {
        this.isBusy = false
      })
    },
    // 複製文字至剪貼簿
    copyToClipboard (text, label = 'IP') {
      if (!text) { return }
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.notify(`已複製 ${label}「${text}」到剪貼簿`, { type: 'info' })
        }).catch(() => {
          this.fallbackCopy(text, label)
        })
      } else {
        this.fallbackCopy(text, label)
      }
    },
    fallbackCopy (text, label) {
      try {
        const input = document.createElement('input')
        input.setAttribute('value', text)
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        this.notify(`已複製 ${label}「${text}」到剪貼簿`, { type: 'info' })
      } catch (e) {
        this.warning(`無法複製 ${label}，請手動選取複製`)
      }
    },
    // 數值化排序 IPv4 位址
    sortCompare (a, b, key) {
      if (key === 'ip') {
        const ipA = this.$utils.ipv4Int(a.ip) || 0
        const ipB = this.$utils.ipv4Int(b.ip) || 0
        return ipA - ipB
      }
      return null
    },
    // 當前 Client IP 行醒目提示樣式
    rowClass (item, type) {
      if (!item || type !== 'row') { return '' }
      if (item.ip === this.clientIp) {
        return 'table-success font-weight-bold'
      }
      return ''
    },
    // 設備類型顏色樣式
    entryTypeVariant (type) {
      switch (type) {
        case 'SERVER': return 'danger'
        case 'OTHER_EP': return 'info'
        case 'SYSTEM': return 'dark'
        case 'USER': return 'primary'
        default: return 'secondary'
      }
    },
    // 設備類型名稱標籤
    entryTypeLabel (type) {
      switch (type) {
        case 'SERVER': return '伺服器'
        case 'OTHER_EP': return '其他終端'
        case 'SYSTEM': return '系統主機'
        case 'USER': return '使用者'
        default: return type || '未定義'
      }
    },
    // 時間格式化
    time (item) {
      const full = this.$utils.phpTsToAdDateStr(item.timestamp, true)
      if (!full) { return '' }
      const date = full.split(' ')[0]
      const time = full.split(' ')[1]
      const now = this.$utils.now()
      return now.startsWith(date) ? time : date
    },
    // 更新使用者 IP 資訊 (upd_ip)
    updateUserIp (item) {
      if (this.isBusy) { return }
      const name = (this.userNames && this.userNames[item.entry_id]) || item.entry_desc || item.entry_id
      this.confirm(`確定要將同仁「${name}」(${item.entry_id}) 的電腦 IP 更新為 ${item.ip} 嗎？`).then((ans) => {
        if (ans) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.USER, {
            type: 'upd_ip',
            id: item.entry_id,
            ip: item.ip
          }).then(({ data }) => {
            if (this.$utils.statusCheck(data.status)) {
              this.notify(data.message || `已更新 ${name} 的 IP 為 ${item.ip}`, { type: 'success' })
            } else {
              this.warning(data.message || '更新使用者 IP 失敗')
            }
          }).catch((err) => {
            this.$utils.error(err)
            this.alert(err.message || '更新同仁 IP 失敗')
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">
.header-left-group {
  ::v-deep > .btn {
    height: 48px !important;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
.header-right-group {
  ::v-deep .input-group {
    height: 48px;
  }
  ::v-deep .input-group-text,
  ::v-deep input.form-control,
  ::v-deep .input-group .btn,
  ::v-deep .btn-group > .btn,
  ::v-deep > .btn {
    height: 48px !important;
    box-sizing: border-box;
  }
  ::v-deep .input-group-text,
  ::v-deep .input-group .btn,
  ::v-deep .btn-group > .btn,
  ::v-deep > .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
.fixed-vh {
  height: calc(100vh - 100px);
  overflow: hidden;
}
.b-table-max-height {
  flex: 1 1 auto;
  max-height: 100%;
  height: 100%;
}
.client-ip-widget {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
