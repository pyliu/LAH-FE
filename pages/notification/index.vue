<template lang="pug">
div.notification-admin-page
  lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
    .d-flex.align-items-center
      .my-auto.font-weight-bold.h5.mb-0 📢 公告訊息發布管理
      lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
      lah-help-modal(:modal-id="'help-modal'"): ol
        li 可先利用送給 #[b-badge.s-105(variant="primary" pill) 我自己] 來做傳送測試
          ul: li 電腦端需安裝 #[b 桃園即時通程式] 並正常連線才能顯示
        li 歷史資料儲存於瀏覽器端，最少顯示 #[b.text-info 3] 筆，最多顯示 #[b.text-info 30] 筆 ({{ memento.length }} / {{ mementoCapacity }})
        li 標題限制最大長度為 #[b.text-info 84] 個英文字元 (中文 #[b.text-info 42] 個字)
        li 內容支援 Markdown 語法，請參考 #[a(href="https://markdown.tw/" target="_blank" rel="noopener noreferrer") #[b https://markdown.tw/]] 教學
    .d-flex.align-items-center
      b-badge(variant="info" pill).mr-2: lah-fa-icon(icon="desktop") 即時通擬真預覽模式

  .row.mt-2
    //- 左欄：發布公告工作台
    .col-xl-7.col-lg-6.col-12.mb-4
      b-card(ref="addCard" border-variant="secondary" no-body).shadow-sm.studio-card
        b-card-header.bg-white.border-bottom.d-flex.justify-content-between.align-items-center.py-2
          .d-flex.align-items-center
            lah-fa-icon(icon="bullhorn" variant="primary").mr-2
            span.font-weight-bold.h5.mb-0 發布新公告
          b-button-group(size="sm")
            lah-button(
              icon="paper-plane"
              :variant="sendButtonDisabled ? 'outline-primary' : 'primary'"
              :disabled="sendButtonDisabled"
              @click="add"
              pill
            ) 送出公告
            b-dropdown(
              variant="outline-info"
              size="sm"
              right
              no-caret
              title="快速套用常用公告範本"
            )
              template(#button-content)
                lah-fa-icon(icon="magic").mr-1
                span 範本
              b-dropdown-item(@click="applyTemplate('training')") 🎓 活動/教育訓練（截圖實例）
              b-dropdown-item(@click="applyTemplate('maintenance')") 💻 系統維護/停機公告
              b-dropdown-item(@click="applyTemplate('meeting')") 📌 行政/會議通知
              b-dropdown-divider
              b-dropdown-item(@click="applyTemplate('empty')") 🧹 清空內文
            lah-button(
              icon="undo-alt"
              variant="outline-secondary"
              title="清除欄位及已選擇對象"
              @click="reset"
              action="cycle-alt"
              pill
            ) 清除
            lah-button(
              icon="question"
              variant="outline-success"
              title="內容 Markdown 語法說明"
              v-b-toggle.md-desc
              :pressed="helpSidebarFlag"
              pill
            ) 語法

        b-card-body.p-3
          //- 1. 發布對象與緊急程度區塊
          .bg-light.p-2.rounded.mb-3.border
            .row.align-items-center
              .col-md-7.col-12.mb-md-0.mb-2
                .d-flex.align-items-center.mb-1
                  lah-fa-icon.mr-1(icon="users" variant="primary")
                  strong.small 發布對象：
                  lah-fa-icon.ml-1(
                    :icon="validSendto ? 'check-circle' : 'exclamation-circle'"
                    :variant="validSendto ? 'success' : 'danger'"
                  )
                  span.small.text-danger.ml-1(v-if="!validSendto") (至少需選擇一個對象)
                .d-flex.align-items-center.flex-wrap
                  b-button(
                    :variant="isMyselfOnly ? 'primary' : 'outline-primary'"
                    size="sm"
                    pill
                    @click="selectTarget('myself')"
                  ) 🙋 我自己 (測試)
                  b-button.mx-1(
                    :variant="isAllSelected ? 'danger' : 'outline-danger'"
                    size="sm"
                    pill
                    @click="selectTarget('all')"
                  ) 🏢 全所同仁
                  b-button(
                    variant="outline-secondary"
                    size="sm"
                    pill
                    v-b-toggle.collapse-targets
                  )
                    lah-fa-icon(icon="caret-down").mr-1
                    | 細部課室...
                b-collapse#collapse-targets.mt-2
                  .bg-white.p-2.rounded.border
                    b-form-checkbox-group(
                      v-model="announcementSendto"
                      :options="announcementSendtoOpts"
                    )

              .col-md-5.col-12
                .d-flex.align-items-center.mb-1
                  lah-fa-icon.mr-1(icon="tachometer-alt" variant="info")
                  strong.small 緊急程度：
                b-button-group(size="sm").w-100
                  b-button(
                    v-for="p in priorityButtons"
                    :key="p.value"
                    :variant="announcementDataJson.priority === p.value ? p.activeVariant : 'outline-secondary'"
                    @click="announcementDataJson.priority = p.value"
                    size="sm"
                  ) {{ p.text }}

          //- 2. 標題輸入區塊
          .mb-3
            .d-flex.justify-content-between.align-items-center.mb-1
              .d-flex.align-items-center
                lah-fa-icon.mr-1(icon="tag" variant="primary")
                strong 公告標題 #[span.text-danger *]
              b-badge(:variant="titleCharVariant" pill) {{ titleCharCount }} / 84 字元 (約 {{ titleChineseCount }} / 42 中文字)
            b-input-group(size="sm")
              b-input(
                v-model="announcementDataJson.title"
                :state="validTitle"
                placeholder="例如：🐻❄️⚡【第四梯次】環境教育訓練 ⚡"
                @focus="lastFocusedField = 'title'"
              )
            .d-flex.align-items-center.flex-wrap.mt-1.small
              span.text-muted.mr-1 常用標籤：
              b-badge.cursor-pointer.mr-1.mb-1(
                v-for="tag in titlePrefixes"
                :key="tag"
                variant="light"
                @click="insertTitlePrefix(tag)"
              ) {{ tag }}

          //- 3. 內容編輯與 Markdown 工具列
          .mb-2
            .d-flex.justify-content-between.align-items-center.mb-1
              .d-flex.align-items-center
                lah-fa-icon.mr-1(icon="edit" variant="primary")
                strong 公告內容 #[span.text-danger *]
                span.text-muted.small.ml-2 (支援 Markdown 與 HTML 顏色標籤)
              lah-button(
                v-if="announcementDataJson.content"
                icon="times"
                variant="outline-secondary"
                size="sm"
                no-border
                @click="announcementDataJson.content = ''"
                title="清空內容"
              ) 清空

            //- 編輯工具列 (Toolbar)
            .editor-toolbar.d-flex.flex-wrap.align-items-center.p-1.bg-light.rounded-top.border
              b-button-group(size="sm").mr-2.mb-1
                b-button(variant="white" size="sm" @click="insertFormat('**', '**', '粗體文字')" title="粗體")
                  strong B
                b-button(variant="white" size="sm" @click="insertFormat('*', '*', '斜體文字')" title="斜體")
                  em I
                b-button(variant="white" size="sm" @click="insertBlueText" title="深藍重點 (同即時通截圖樣式)")
                  span(style="color: #0056b3; font-weight: bold;") 藍字
                b-button(variant="white" size="sm" @click="insertRedText" title="紅色警示")
                  span(style="color: #dc3545; font-weight: bold;") 紅字

              b-button-group(size="sm").mr-2.mb-1
                b-button(variant="white" size="sm" @click="insertFormat('### ', '', '標題')" title="標題 H3") H3
                b-button(variant="white" size="sm" @click="insertFormat('- ', '', '清單項目')" title="項目清單")
                  lah-fa-icon(icon="list-ul")
                b-button(variant="white" size="sm" @click="insertFormat('1. ', '', '編號項目')" title="編號清單")
                  lah-fa-icon(icon="list-ol")
                b-button(variant="white" size="sm" @click="insertFormat('- [ ] ', '', '待辦事項')" title="待辦清單")
                  lah-fa-icon(icon="check-square")
                b-button(variant="white" size="sm" @click="insertFormat('> ', '', '引用說明')" title="引用區塊")
                  lah-fa-icon(icon="quote-left")
                b-button(variant="white" size="sm" @click="insertDivider" title="分隔線") ―
                b-button(variant="white" size="sm" @click="insertLink" title="超連結")
                  lah-fa-icon(icon="link")

            //- 常用 Emoji 快捷盤
            .emoji-palette.d-flex.align-items-center.flex-wrap.p-1.bg-white.border-left.border-right
              span.small.text-muted.mr-1.ml-1 常用表情：
              span.emoji-item(
                v-for="emoji in commonEmojis"
                :key="emoji"
                @click="insertEmoji(emoji)"
                :title="`插入 ${emoji}`"
              ) {{ emoji }}

            //- 輸入框
            b-textarea.overflow-auto.content-textarea(
              ref="contentInput"
              v-model="announcementDataJson.content"
              rows="9"
              max-rows="18"
              placeholder="支援 Markdown 與顏色標籤，例如：\n各位同仁好 😎\n明日為【第四梯次】環境教育訓練...\n請參加同仁於 <font color=\"#0056b3\"><b>7時45分</b></font> 準時集合！"
              :state="validContent"
              @focus="lastFocusedField = 'content'"
            )

    //- 右欄：桃園即時通 Client 端擬真即時預覽
    .col-xl-5.col-lg-6.col-12.mb-4
      .sticky-preview
        .d-flex.justify-content-between.align-items-center.mb-2
          .font-weight-bold
            lah-fa-icon(icon="desktop" variant="success").mr-1
            span 桃園即時通 Client 接收畫面預覽
          b-badge(variant="secondary" pill) 490 × 796 擬真預覽

        //- 桌面即時通視窗模擬框
        .client-window-mockup
          //- 視窗頂部標題列
          .client-titlebar
            .titlebar-info.text-truncate
              span.online-dot 🟢
              span.window-title-text {{ clientTitleInfo }}
            .window-controls
              span.win-btn ─
              span.win-btn □
              span.win-btn ✕

          //- 功能頁籤欄 (模擬公告、通知、私訊)
          .client-tabs
            .client-tab.active
              span 📢
              span.font-weight-bold 公告
            .client-tab
              span 💬
              span 通知
            .client-tab
              span ✉️
              span 私訊
            .client-tab.client-tab-menu.ml-auto
              span ☰

          //- 視窗工作底色畫布 (模擬灰色底色與訊息流)
          .client-workspace
            //- 懸浮聊天泡泡
            .client-floating-chat(title="即時通浮動對話鈕")
              lah-fa-icon(icon="comment-dots")

            //- 日期分隔膠囊
            .client-date-pill
              span 📅 {{ previewDate }}

            //- 發布者標籤 (系統推播)
            .client-post-header
              .land-avatar 地政
              .post-channel-title 系統推播
              lah-fa-icon(icon="comment-alt" regular).text-secondary.small

            //- 公告卡片 (升級版卡片樣式)
            lah-notification-announcement-card(
              :data-json="announcementDataJson"
              :show-actions="true"
            )

          //- 視窗底部狀態列
          .client-statusbar
            .statusbar-left
              lah-fa-icon(icon="info-circle").text-muted
            .statusbar-right
              span.version-text v1.4.6
              lah-fa-icon(icon="question-circle" variant="success").ml-1

        //- 發布範圍指示
        .mt-2.d-flex.align-items-center.justify-content-center.flex-wrap
          span.small.text-muted.mr-1 預計發布頻道：
          b-badge.mx-1(
            v-for="(to, idx) in sendto"
            :key="`b-badge-${idx}`"
            :variant="sendtoVariant(to)"
            pill
          ) {{ to }}

  //- 下方：歷史資料管理
  hr.my-4
  .d-flex.justify-content-between.align-items-center.mb-3
    .h5.font-weight-bold.mb-0
      lah-fa-icon(icon="history" variant="info").mr-2
      | 歷史公告發布紀錄
      b-badge(variant="light" pill).ml-2.border {{ memento.length }} 筆
    .d-flex.align-items-center
      b-input-group(size="sm" prepend="顯示筆數"): b-input(
        type="number"
        min="3"
        max="30"
        v-model="mementoCount"
        style="width: 70px;"
      )

  .row(v-if="memento.length === 0")
    .col-12.text-center.py-5.text-muted
      lah-fa-icon(icon="inbox" size="2x").mb-2
      div 暫無本機發布歷史紀錄

  .row(v-else)
    .col-xl-4.col-md-6.col-12.mb-3(
      v-for="(snapshot, idx) in reverseMemento"
      :key="`hist_${idx}`"
    )
      lah-notification-announcement-memento(
        :memento="snapshot"
        @copy="copy(snapshot)"
        @remove="remove(snapshot)"
        @badge="removeMementoAddedChannel($event.detail, snapshot)"
      )

  //- 側邊欄 Markdown 說明
  b-sidebar#md-desc(
    v-model="helpSidebarFlag"
    title="簡易排版語法說明"
    right
    shadow
  )
    b-card.border-0
      h6.font-weight-bold.text-primary 標題
      div # 第一標題
      div ## 第二標題
      div ### 第三標題
      hr
      h6.font-weight-bold.text-primary 粗體與斜體
      div 粗體：#[b.text-dark **我是粗體**]
      div 斜體：#[i.text-dark *我是斜體*]
      hr
      h6.font-weight-bold.text-primary 文字顏色 (即時通特色)
      div 深藍字：#[code &lt;font color="#0056b3"&gt;&lt;b&gt;藍色重點&lt;/b&gt;&lt;/font&gt;]
      div 紅色字：#[code &lt;font color="#dc3545"&gt;&lt;b&gt;紅色警示&lt;/b&gt;&lt;/font&gt;]
      hr
      h6.font-weight-bold.text-primary 清單與待辦
      div - 項目符號
      div 1. 編號項目
      div - [ ] 待辦事項
      hr
      h6.font-weight-bold.text-primary 超連結
      div [文字描述](http://連結網址)
      hr
      h6.font-weight-bold.text-primary 分隔線
      div ---
</template>

<script>
export default {
  middleware: ['isNotifyMgtStaff'],
  asyncData ({ store, redirect, error }) { return {} },
  data: () => ({
    announcementDataJson: {
      title: '🐻❄️⚡【第四梯次】環境教育訓練 ⚡',
      content: '各位同仁好 😎\n明日為【第四梯次】環境教育訓練，地點為基隆海科館，且本次活動有提供早餐(包子饅頭)。\n\n請參加同仁於<font color="#0056b3"><b>7時45分</b></font>準時於國強一街車道口集合(<font color="#0056b3"><b>8:00準時出發</b></font>)，並請自行攜帶個人用品及雨具🌂\n\n💙另提醒尚未請公假的同仁，記得請公假喔~',
      priority: 3,
      sender: '',
      id: '?',
      create_datetime: ''
    },
    announcementPriorityOpts: [
      { text: '最高', value: 0 },
      { text: '高', value: 1 },
      { text: '中', value: 2 },
      { text: '正常', value: 3 }
    ],
    priorityButtons: [
      { text: '🟢 正常', value: 3, activeVariant: 'success' },
      { text: '🔵 中等', value: 2, activeVariant: 'info' },
      { text: '🟠 高度', value: 1, activeVariant: 'warning' },
      { text: '🔴 最高', value: 0, activeVariant: 'danger' }
    ],
    commonEmojis: [
      '🐻', '❄️', '⚡', '😎', '🌂', '💙', '📢', '📌', '⚠️', '🚨',
      '💡', '⏰', '📅', '🍱', '☕', '🚌', '👍', '👏', '🎉', '✅',
      '❌', '👉', '🔹', '⭐'
    ],
    titlePrefixes: [
      '【重要公告】', '【活動通知】', '【教育訓練】', '【系統維護】', '【會議通知】'
    ],
    announcementSendto: ['myself'],
    announcementSendtoOpts: [
      { value: 'all', text: '全所' },
      { value: 'myself', text: '我自己' }
    ],
    lastFocusedField: 'content',
    helpSidebarFlag: false,
    cacheKey: 'postMementoCache',
    memento: [],
    mementoCapacity: 30,
    mementoCount: 3
  }),
  head: {
    title: '公告訊息發布管理'
  },
  computed: {
    titleCharCount () {
      return this.$utils.length(this.announcementDataJson.title || '')
    },
    titleChineseCount () {
      return Math.ceil(this.titleCharCount / 2)
    },
    titleCharVariant () {
      if (this.titleCharCount > 84) { return 'danger' }
      if (this.titleCharCount >= 70) { return 'warning' }
      return 'secondary'
    },
    validTitle () {
      return !this.$utils.empty(this.announcementDataJson.title) && this.titleCharCount <= 84
    },
    validContent () {
      return !this.$utils.empty(this.announcementDataJson.content)
    },
    validSendto () {
      return this.announcementSendto.length > 0
    },
    sendButtonDisabled () {
      return !this.validContent || !this.validTitle || !this.validSendto
    },
    isMyselfOnly () {
      return this.announcementSendto.length === 1 && this.announcementSendto[0] === 'myself'
    },
    isAllSelected () {
      return this.announcementSendto.includes('all')
    },
    sendto () {
      const sendto = []
      this.announcementSendto.forEach((selected) => {
        const found = this.announcementSendtoOpts.find((item) => {
          return item.value === selected
        })
        found && sendto.push(found.text)
      })
      return sendto
    },
    clientTitleInfo () {
      const parts = []
      parts.push(this.ip || '192.168.13.96')
      parts.push(this.myname || '劉邦渝')
      if (this.myinfo?.unit) {
        parts.push(this.myinfo.unit)
      } else {
        parts.push('資訊課')
      }
      return parts.join(' / ')
    },
    previewDate () {
      const d = new Date()
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    },
    mementoCountCacheKey () {
      return `${this.cacheKey} count`
    },
    reverseMemento () {
      return this.memento.slice().reverse().slice(0, this.mementoCount)
    },
    myLabelText () { return `${this.myname} (${this.myid})` }
  },
  watch: {
    mementoCount (val) {
      this.setCache(this.mementoCountCacheKey, val)
      this.restoreCachedMemento()
    },
    myid (id) {
      this.announcementDataJson.sender = id
    },
    myname (dontcare) {
      const myself = this.announcementSendtoOpts.find((item) => {
        return item.value === 'myself'
      })
      if (myself) {
        myself.text = this.myLabelText
      }
    }
  },
  async mounted () {
    this.mementoCount = await this.getCache(this.mementoCountCacheKey) || 3
    this.restoreCachedMemento()
    this.announcementDataJson.create_datetime = this.currentDatetime()
    // init my info to relative fields
    this.announcementDataJson.sender = this.myid
    const myself = this.announcementSendtoOpts.find((item) => {
      return item.value === 'myself'
    })
    if (myself) {
      myself.text = this.$utils.empty(this.myname) ? '我自己' : this.myLabelText
    }
  },
  methods: {
    selectTarget (target) {
      if (target === 'myself') {
        this.announcementSendto = ['myself']
      } else if (target === 'all') {
        this.announcementSendto = ['all']
      }
    },
    insertTitlePrefix (prefix) {
      if (!this.announcementDataJson.title) {
        this.announcementDataJson.title = prefix
      } else if (!this.announcementDataJson.title.startsWith(prefix)) {
        this.announcementDataJson.title = `${prefix} ${this.announcementDataJson.title.replace(/^【.*?】\s*/, '')}`
      }
    },
    insertFormat (prefix, suffix = '', defaultText = '') {
      const textarea = this.$refs.contentInput?.$el || this.$refs.contentInput
      if (!textarea) {
        this.announcementDataJson.content += `${prefix}${defaultText}${suffix}`
        return
      }
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const oldText = this.announcementDataJson.content || ''
      const selected = oldText.substring(start, end)
      const replaceText = selected ? `${prefix}${selected}${suffix}` : `${prefix}${defaultText}${suffix}`
      this.announcementDataJson.content = oldText.substring(0, start) + replaceText + oldText.substring(end)
      this.$nextTick(() => {
        textarea.focus()
        const newCursor = selected ? start + replaceText.length : start + prefix.length
        textarea.setSelectionRange(newCursor, newCursor + (selected ? 0 : defaultText.length))
      })
    },
    insertBlueText () {
      this.insertFormat('<font color="#0056b3"><b>', '</b></font>', '深藍色重點')
    },
    insertRedText () {
      this.insertFormat('<font color="#dc3545"><b>', '</b></font>', '紅色警示')
    },
    insertDivider () {
      this.insertFormat('\n---\n', '', '')
    },
    insertLink () {
      this.insertFormat('[連結名稱](', ')', 'https://')
    },
    insertEmoji (emoji) {
      if (this.lastFocusedField === 'title') {
        this.announcementDataJson.title = (this.announcementDataJson.title || '') + emoji
      } else {
        this.insertFormat(emoji, '', '')
      }
    },
    applyTemplate (type) {
      switch (type) {
        case 'training':
          this.announcementDataJson.title = '🐻❄️⚡【第四梯次】環境教育訓練 ⚡'
          this.announcementDataJson.content = '各位同仁好 😎\n明日為【第四梯次】環境教育訓練，地點為基隆海科館，且本次活動有提供早餐(包子饅頭)。\n\n請參加同仁於<font color="#0056b3"><b>7時45分</b></font>準時於國強一街車道口集合(<font color="#0056b3"><b>8:00準時出發</b></font>)，並請自行攜帶個人用品及雨具🌂\n\n💙另提醒尚未請公假的同仁，記得請公假喔~'
          this.announcementDataJson.priority = 3
          break
        case 'maintenance':
          this.announcementDataJson.title = '⚠️【系統維護】伺服器例行維護停機公告'
          this.announcementDataJson.content = '各位同仁好 📢\n為進行伺服器系統維護作業，預計於下列時段暫停服務：\n- **停機時段**：<font color="#dc3545"><b>本週五 18:00 ～ 21:00</b></font>\n- **影響範圍**：地政便民服務系統、相關查詢作業\n- **注意事項**：請各同仁提早存檔並關閉系統。\n造成不便，敬請見諒！如有問題請洽資訊課。'
          this.announcementDataJson.priority = 1
          break
        case 'meeting':
          this.announcementDataJson.title = '📌【會議通知】行政業務研討會議'
          this.announcementDataJson.content = `各位同仁好 📌\n訂於下列時間召開行政業務研討會議，請準時出席：\n- **時間**：<font color="#0056b3"><b>${this.previewDate} (五) 09:30</b></font>\n- **地點**：4樓第一會議室\n- **主席**：主任\n- **出列席**：各課室主管及業務承辦同仁\n- **備註**：請攜帶業務報告資料，謝謝配合！`
          this.announcementDataJson.priority = 2
          break
        case 'empty':
          this.announcementDataJson.content = ''
          break
      }
    },
    async restoreCachedMemento () {
      const cached = await this.getCache(this.cacheKey)
      cached && (this.memento = [...cached])
      if (this.memento.length > this.mementoCount) {
        this.memento.splice(0, this.memento.length - this.mementoCount)
      }
    },
    addMemento (snapshot) {
      this.memento.push(snapshot)
      if (this.memento.length > this.mementoCapacity) {
        this.memento.splice(0, 1)
      }
      this.setCache(this.cacheKey, this.memento)
    },
    currentDatetime () {
      const m = new Date()
      return m.getFullYear() + '-' + (m.getMonth() + 1).toString().padStart(2, '0') + '-' + m.getDate().toString().padStart(2, '0') + ' ' + m.getHours().toString().padStart(2, '0') + ':' + m.getMinutes().toString().padStart(2, '0') + ':' + m.getSeconds().toString().padStart(2, '0')
    },
    copy (snapshot) {
      this.announcementSendto = [...snapshot.channels]
      this.announcementDataJson = { ...this.announcementDataJson, ...snapshot }
      delete this.announcementDataJson.channels
      const el = this.$refs.addCard?.$el || this.$refs.addCard
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        setTimeout(() => this.attention(el), 400)
      }
    },
    remove (snapshot) {
      this.confirm(`移除「${snapshot.title}」這筆歷史紀錄?`).then((YN) => {
        if (YN) {
          if (Array.isArray(snapshot.added_to)) {
            const channelData = snapshot.added_to.map((added) => {
              return {
                channel: added.channel,
                id: added.addedId
              }
            })
            this.requestDBRemove(channelData, () => {
              for (let i = 0; i < this.memento.length; i++) {
                if (this.$utils.equal(this.memento[i], snapshot)) {
                  this.copy(this.memento[i])
                  this.memento.splice(i, 1)
                  this.setCache(this.cacheKey, this.memento)
                  return
                }
              }
            })
          } else {
            this.warning('這個 snapshot 裡沒有 added_to 屬性資料。')
          }
        }
      })
    },
    removeMementoAddedChannel (added, snapshot) {
      this.requestDBRemove([{
        channel: added.channel,
        id: added.addedId
      }], () => {
        for (let i = 0; i < snapshot.added_to.length; i++) {
          if (this.$utils.equal(snapshot.added_to[i], added)) {
            snapshot.added_to.splice(i, 1)
            this.setCache(this.cacheKey, this.memento)
            break
          }
        }
      })
    },
    requestDBRemove (array, cb = undefined) {
      if (Array.isArray(array)) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
          type: 'remove_notification',
          message_type: 'announcement',
          channels: array
        }).then(({ data }) => {
          this.notify(data.message, { type: data.status > 0 ? 'success' : 'warning' })
          data.status > 0 && cb && cb()
        }).catch((err) => {
          this.alert(err.message)
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      } else {
        this.alert('欲刪除之頻道資訊不是陣列')
        this.$utils.warn(array)
      }
    },
    add () {
      this.confirm('確定要新增公告?').then((flag) => {
        if (flag) {
          this.isBusy = true
          const snapshot = {
            channels: this.announcementSendto,
            from_ip: this.ip,
            title: this.announcementDataJson.title,
            content: this.announcementDataJson.content,
            priority: this.announcementDataJson.priority,
            sender: this.user.id || this.ip,
            create_datetime: this.currentDatetime()
          }
          this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
            type: 'add_notification',
            ...snapshot
          }).then(({ data }) => {
            this.notify(data.message, { type: data.status > 0 ? 'success' : 'warning', title: data.title })
            if (data.status > 0) {
              snapshot.added_to = data.added
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.addMemento(snapshot)
            this.reset()
          })
        }
      })
    },
    reset () {
      this.announcementDataJson = {
        title: '',
        content: '',
        priority: 3,
        sender: this.myid || '',
        id: '?',
        create_datetime: this.currentDatetime()
      }
      this.announcementSendto = []
    },
    flipSendto () {
      if (this.$utils.empty(this.announcementSendto)) {
        this.announcementSendto = ['myself']
      } else {
        this.announcementSendto = []
      }
    },
    sendtoVariant (to) {
      switch (to) {
        case '全所':
          return 'danger'
        case '我自己':
        case this.myLabelText:
          return 'primary'
        default:
          return 'success'
      }
    }
  }
}
</script>

<style scoped lang="scss">
.notification-admin-page {
  .studio-card {
    border-radius: 8px;
  }

  .content-textarea {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    font-size: 15px;
    line-height: 1.6;
    font-family: inherit;
  }

  .editor-toolbar {
    border-bottom: 0;
    button {
      padding: 2px 8px;
    }
  }

  .emoji-palette {
    border-bottom: 1px solid #e2e8f0;
    padding: 4px 8px;
    max-height: 72px;
    overflow-y: auto;

    .emoji-item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      padding: 2px 5px;
      cursor: pointer;
      border-radius: 4px;
      user-select: none;
      transition: transform 0.15s ease, background-color 0.15s ease;

      &:hover {
        transform: scale(1.25);
        background-color: #e9ecef;
      }
    }
  }

  // Sticky 預覽視窗
  .sticky-preview {
    position: sticky;
    top: 75px;
    z-index: 10;
  }

  // 桃園即時通 Client 端擬真視窗 (實際 Client 規格 490px * 796px)
  .client-window-mockup {
    width: 490px;
    max-width: 100%;
    height: 796px;
    display: flex;
    flex-direction: column;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #c9d2db;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
    overflow: hidden;

    .client-titlebar {
      background: #ffffff;
      border-bottom: 1px solid #e5e9ec;
      padding: 6px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #333333;
      user-select: none;

      .titlebar-info {
        display: flex;
        align-items: center;
        gap: 6px;
        max-width: 80%;

        .online-dot {
          font-size: 11px;
        }

        .window-title-text {
          font-weight: 500;
          letter-spacing: 0.2px;
        }
      }

      .window-controls {
        display: flex;
        gap: 10px;
        color: #666666;
        font-size: 12px;

        .win-btn {
          cursor: default;
          opacity: 0.7;
          &:hover {
            opacity: 1;
          }
        }
      }
    }

    .client-tabs {
      background: #ffffff;
      border-bottom: 1px solid #e1e6eb;
      display: flex;
      align-items: center;
      padding: 0 4px;
      user-select: none;

      .client-tab {
        padding: 8px 14px;
        font-size: 14px;
        color: #555555;
        cursor: default;
        display: flex;
        align-items: center;
        gap: 4px;
        position: relative;

        &.active {
          color: #1396a8;
          font-weight: 700;
          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 8px;
            right: 8px;
            height: 3px;
            background-color: #1396a8;
            border-radius: 2px 2px 0 0;
          }
        }

        &.client-tab-menu {
          font-size: 16px;
          color: #666666;
          padding: 8px 12px;
        }
      }
    }

    .client-workspace {
      flex: 1;
      min-height: 0;
      max-height: none;
      overflow-y: auto;
      background-color: #f0f2f5;
      padding: 16px 12px 20px;
      position: relative;

      .client-floating-chat {
        position: absolute;
        left: 0;
        top: 14px;
        background-color: #007bff;
        color: #ffffff;
        border-radius: 0 6px 6px 0;
        padding: 5px 8px;
        font-size: 13px;
        box-shadow: 2px 2px 6px rgba(0, 123, 255, 0.25);
        z-index: 2;
      }

      .client-date-pill {
        margin: 0 auto 12px;
        background-color: #e4e7eb;
        color: #495057;
        border-radius: 20px;
        padding: 2px 14px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        width: fit-content;
      }

      .client-post-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
        padding-left: 4px;

        .land-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1396a8, #0e7280);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .post-channel-title {
          font-weight: 700;
          font-size: 13.5px;
          color: #212529;
        }
      }
    }

    .client-statusbar {
      background: #ffffff;
      border-top: 1px solid #e5e9ec;
      padding: 4px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
      color: #888888;
      user-select: none;

      .version-text {
        font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
    }
  }
}
</style>
