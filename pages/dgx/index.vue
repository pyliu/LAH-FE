<template lang="pug">
//- 1. 最外層嚴格限制高度，並根據 isDarkMode 動態套用暗黑主題
div.chat-app-wrapper(:class="{ 'theme-dark': isDarkMode }")
  //- 頂部導覽列 (動態切換 light/dark 模式)
  b-navbar(:variant="isDarkMode ? 'dark' : 'white'", :type="isDarkMode ? 'dark' : 'light'", sticky).shadow-sm.px-3.border-bottom.navbar-area
    //- 左側：漢堡選單 (觸發歷史紀錄側邊欄)
    b-button(variant="link" v-b-toggle.history-sidebar).p-1.mr-2.d-flex.align-items-center
      lah-fa-icon(icon="bars", size="lg", :class="isDarkMode ? 'text-light' : 'text-dark'")

    //- 中間：第一次完成送出後，顯示標題與圖示
    lah-transition(appear)
      .title-container.d-flex.align-items-center(v-if="messages.length > 0")
        lah-fa-icon.mr-2(icon="robot", :variant="isDarkMode ? 'warning' : 'primary'", size="lg")
        strong.title-text(:class="isDarkMode ? 'text-warning' : 'text-primary'") 案件智慧查詢助理
        //- 說明圖示按鈕
        b-button(variant="link" @click="$refs.instructionModal.show()" v-b-tooltip.hover title="查看輸入說明").p-0.ml-2
          lah-fa-icon(icon="info-circle", size="lg", :variant="isDarkMode ? 'info' : 'info'")

    //- 右側：操作按鈕區
    b-navbar-nav.ml-auto
      //- 清除對話按鈕 (當有訊息時才顯示)
      b-nav-item(@click="clearMessages" title="清除對話紀錄" v-if="messages.length > 0")
        .d-flex.align-items-center
          lah-fa-icon(icon="trash-alt", size="lg", variant="danger")

      //- 明暗主題切換按鈕
      b-nav-item(@click="toggleTheme" title="切換明暗主題")
        .d-flex.align-items-center
          lah-fa-icon(:icon="isDarkMode ? 'sun' : 'moon'", size="lg", :variant="isDarkMode ? 'warning' : 'secondary'")

  //- 歷史紀錄側邊欄 (示意)
  b-sidebar(id="history-sidebar" title="歷史查詢紀錄" shadow)
    .p-3
      p.text-muted 這裡將顯示過去的對話與查詢紀錄...

  //- 聊天主體區塊
  .chat-main-area.d-flex.flex-column
    //- 對話紀錄顯示區
    .messages-container.flex-grow-1.p-4.overflow-auto
      //- 歡迎畫面 (如果沒有訊息)
      .welcome-screen.d-flex.flex-column.align-items-center.justify-content-center.h-100(v-if="messages.length === 0")
        lah-fa-icon(icon="robot" size="4x" :variant="isDarkMode ? 'warning' : 'primary'").mb-3
        h3.font-weight-bold(:class="isDarkMode ? 'text-light' : 'text-dark'") 案件智慧查詢助理
        p.text-muted 您好！請輸入案件字號或相關資訊，我來幫您查詢。
        //- 歡迎畫面的說明引導按鈕
        b-button(variant="outline-info" pill @click="$refs.instructionModal.show()").mt-3.shadow-sm
          lah-fa-icon(icon="info-circle").mr-1
          | 查看支援的輸入格式與範例

      //- 訊息對話列表 (依實際邏輯渲染)
      .message-item.mb-4(
        v-for="(msg, idx) in messages" 
        :key="idx" 
        :class="{'text-right': msg.isUser, 'text-left': !msg.isUser}"
      )
        .d-inline-block.p-3.rounded(:class="msg.isUser ? 'bg-primary text-white shadow-sm text-left' : (isDarkMode ? 'bg-dark text-light border border-secondary text-left shadow-sm' : 'bg-white border shadow-sm text-left')")
          //- AI 訊息與可能包含的卡片 (依賴子元件渲染，此處為簡化邏輯)
          div {{ msg.text }}
          
    //- 底部輸入區塊
    .input-area.p-3.border-top(:class="isDarkMode ? 'bg-dark' : 'bg-light'")
      //- ✅ 修補：套用 size="lg" 強制 Bootstrap 同步內部 input 與 button 高度
      b-input-group(size="lg")
        b-form-input(
          v-model="inputText"
          placeholder="請輸入案件資訊... (例：113年桃園朴子 第190號)"
          @keyup.enter="sendMessage"
          :class="isDarkMode ? 'bg-dark text-light border-secondary' : 'bg-white'"
        )
        b-input-group-append
          //- ✅ 修補：加上 h-100 確保按鈕填滿附加區域
          b-button(variant="primary" @click="sendMessage" :disabled="!inputText.trim() || isBusy").theme-btn.h-100
            lah-fa-icon(icon="paper-plane" :action="isBusy ? 'spin' : ''")
            |  送出

  //- ==========================================
  //- 案件查詢語法說明 Modal
  //- ==========================================
  b-modal(
    ref="instructionModal"
    size="xl"
    title="🤖 案件智慧查詢助理 - 使用說明"
    ok-only
    ok-title="我瞭解了"
    ok-variant="primary"
    centered
    :header-bg-variant="isDarkMode ? 'dark' : 'white'"
    :header-text-variant="isDarkMode ? 'light' : 'dark'"
    :body-bg-variant="isDarkMode ? 'dark' : 'white'"
    :body-text-variant="isDarkMode ? 'light' : 'dark'"
    :footer-bg-variant="isDarkMode ? 'dark' : 'light'"
    :header-border-variant="isDarkMode ? 'secondary' : 'default'"
    :footer-border-variant="isDarkMode ? 'secondary' : 'default'"
  )
    b-container(fluid)
      p.mb-4(:class="isDarkMode ? 'text-light' : 'text-muted'") 您可以直接像跟同事講話一樣，輸入案件資訊。AI 引擎會自動幫您解析並找出對應的案件。

      b-row
        //- 格式說明
        b-col(md="6").mb-4
          h6.font-weight-bold.text-primary.mb-3 📌 支援的輸入格式
          b-card(no-body :bg-variant="isDarkMode ? 'dark' : 'light'" :class="isDarkMode ? 'border-secondary' : ''").instruction-card.h-100.shadow-sm.border-0
            b-card-body
              ul.mb-0(:class="isDarkMode ? 'text-light' : 'text-dark'")
                li.mb-2
                  strong 民國年：
                  | 2~3碼數字。若未指定，
                  b-badge(variant="info") 系統會自動帶入今年
                  | 。
                  br
                  small.text-secondary 例如：輸入 `112年` 或是直接輸入 `112` 皆可。
                li.mb-2
                  strong 案件字：
                  | 4碼英數組合，或口語化的中文。
                  br
                  small.text-secondary 例如：`HA81`、`HAA1`，或是輸入 `桃園朴子` 皆可識別。
                li.mb-0
                  strong 案件號：
                  | 輸入任意數字，
                  b-badge(variant="secondary") 系統會自動為您補齊 6 碼
                  | 。
                  br
                  small.text-secondary 例如：輸入 `190` 會被自動轉換為 `000190`。

        //- 容錯說明
        b-col(md="6").mb-4
          h6.font-weight-bold.text-success.mb-3 🪄 聰明的 AI 容錯功能
          b-card(no-body :bg-variant="isDarkMode ? 'dark' : 'light'" :class="isDarkMode ? 'border-secondary' : ''").instruction-card.border-success.h-100.shadow-sm.border-0
            b-card-body
              ul.mb-0(:class="isDarkMode ? 'text-light' : 'text-dark'")
                li.mb-2
                  strong 動態字號繼承：
                  | 想一次查多筆同字號案件？直接用空格分開即可！
                  br
                  small.text-secondary 輸入：`HA85 1200 1300` ➔ AI 會自動幫您查：`HA85-001200` 與 `HA85-001300`
                li.mb-2
                  strong 動態年份繼承：
                  | 跨字號查詢時，年份會自動延續。
                  br
                  small.text-secondary 輸入：`112年 HA81 1200 還有 HA82 700` ➔ AI 會自動補齊為 `112-HA81...` 與 `112-HA82...`
                li.mb-0
                  strong 全/半形及日期轉換：
                  br
                  small.text-secondary 全形 `ＨＡ８１` 或日期格式 `113/05/20` AI 都能看得懂並自動轉化。

      //- 實際對話範例
      h6.font-weight-bold.mt-2.mb-3(:class="isDarkMode ? 'text-light' : 'text-dark'") 💬 實際對話範例
      b-row
        b-col(md="12")
          .example-block.mb-3.border-left.border-primary(:class="isDarkMode ? 'bg-dark text-light border-secondary' : 'bg-light text-dark'")
            .font-weight-bold
              lah-fa-icon(icon="user-circle", variant="secondary").mr-2
              | 您輸入：
            div "幫我查113年 桃園朴子 第190號，還有 HA81 1200"
            hr.my-2(:class="isDarkMode ? 'border-secondary' : ''")
            .font-weight-bold
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | AI 會為您解析出 2 筆案件：
            .text-success ✔ 113-H1QB-000190
              span.small.ml-1(:class="isDarkMode ? 'text-light' : 'text-muted'") (桃園朴子)
            .text-success ✔ 113-HA81-001200
              span.small.ml-1(:class="isDarkMode ? 'text-light' : 'text-muted'") (自動沿用 113 年)
</template>

<script>
const MAX_MESSAGES = 200 

export default {
  name: 'AiQueryAssistantIndex',
  data: () => ({
    isDarkMode: false,
    isBusy: false,
    inputText: '',
    messages: [],
    apiTimer: null
  }),
  mounted () {
    const savedTheme = localStorage.getItem('lah-theme-dark')
    if (savedTheme !== null) {
      this.isDarkMode = savedTheme === 'true'
    }
  },
  beforeDestroy () {
    if (this.apiTimer) {
      clearTimeout(this.apiTimer)
    }
  },
  methods: {
    toggleTheme () {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('lah-theme-dark', this.isDarkMode)
    },
    clearMessages () {
      this.$bvModal.msgBoxConfirm('確定要清除目前的對話紀錄嗎？', {
        title: '🗑️ 清除確認',
        size: 'sm',
        buttonSize: 'sm',
        okVariant: 'danger',
        okTitle: '確定清除',
        cancelTitle: '取消',
        footerClass: 'p-2',
        hideHeaderClose: false,
        centered: true
      }).then(value => {
        if (value) {
          this.messages = []
        }
      }).catch(err => {
        this.$utils.error(err)
      })
    },
    sendMessage () {
      if (!this.inputText.trim()) return
      
      this.messages.push({
        text: this.inputText.trim(),
        isUser: true
      })
      
      const userInput = this.inputText.trim()
      this.inputText = ''
      this.isBusy = true

      if (this.messages.length > MAX_MESSAGES) {
        this.messages = this.messages.slice(-MAX_MESSAGES)
      }
      
      this.apiTimer = setTimeout(() => {
        this.messages.push({
          text: `我收到您的查詢：「${userInput}」，正在幫您解析案件並搜尋資料...`,
          isUser: false,
          cases: []
        })
        this.isBusy = false
        
        if (this.messages.length > MAX_MESSAGES) {
          this.messages = this.messages.slice(-MAX_MESSAGES)
        }
        
        this.$nextTick(() => {
          const container = this.$el.querySelector('.messages-container')
          if (container) container.scrollTop = container.scrollHeight
        })
      }, 800)
    }
  }
}
</script>

<style lang="scss" scoped>
/* =========================================
   佈局與動畫
   ========================================= */
.chat-app-wrapper {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background-color 0.3s ease;
}

.chat-main-area {
  flex: 1;
  overflow: hidden;
}

.theme-btn {
  transition: transform 0.2s ease;
  &:active {
    transform: scale(0.95);
  }
}

/* =========================================
   說明 Modal 樣式
   ========================================= */
.instruction-card {
  border-left: 4px solid #17a2b8 !important;
}

.instruction-card.border-success {
  border-left-color: #28a745 !important;
}

.example-block {
  border-radius: 6px;
  padding: 16px;
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

/* =========================================
   🌙 暗黑模式 (Dark Mode)
   ========================================= */
.theme-dark {
  background-color: #212529;

  .bg-light { background-color: #212529 !important; }
  .bg-white { background-color: #343a40 !important; }
  .text-dark { color: #f8f9fa !important; }
  
  .instruction-card {
    background-color: #2b3035 !important;
  }
}
</style>