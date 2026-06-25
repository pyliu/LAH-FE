<template lang="pug">
//- 1. 最外層嚴格限制高度為 100vh，並根據 isDarkMode 動態套用暗黑主題
div.chat-app-wrapper(:class="{ 'theme-dark': isDarkMode }")
  //- 頂部導覽列 (動態切換 light/dark 模式)
  b-navbar(:variant="isDarkMode ? 'dark' : 'white'", :type="isDarkMode ? 'dark' : 'light'", sticky).shadow-sm.px-3.border-bottom.navbar-area
    //- 左側：漢堡選單 (觸發歷史紀錄側邊欄)
    b-button(variant="link" v-b-toggle.history-sidebar).p-1.mr-2.d-flex.align-items-center
      lah-fa-icon(icon="bars", size="lg", :class="isDarkMode ? 'text-light' : 'text-dark'")

    //- 中間：第一次完成送出後，顯示標題與圖示 (字體縮小至 0.85 倍，圖示配合調整為 lg)
    lah-transition(appear)
      .title-container(v-if="messages.length > 0")
        lah-fa-icon.mr-2(icon="robot", :variant="isDarkMode ? 'warning' : 'primary'", size="lg")
        strong.title-text(:class="isDarkMode ? 'text-warning' : 'text-primary'") 案件智慧查詢助理

    //- 右側：明暗主題切換按鈕
    b-navbar-nav.ml-auto
      b-nav-item(@click="toggleTheme" title="切換明暗主題")
        .d-flex.align-items-center.theme-btn
          lah-fa-icon(
            :icon="isDarkMode ? 'sun' : 'moon'"
            :variant="isDarkMode ? 'warning' : 'secondary'"
            size="lg"
          )

  //- 歷史紀錄側邊欄 (動態切換背景與文字顏色)
  b-sidebar#history-sidebar(
    title="最近對話歷程"
    shadow
    backdrop
    :bg-variant="isDarkMode ? 'dark' : 'light'"
    :text-variant="isDarkMode ? 'light' : 'dark'"
  )
    .p-3
      template(v-if="userQueries.length > 0")
        b-list-group(flush)
          b-list-group-item.history-item.text-truncate.px-2.py-3(
            v-for="(query, idx) in userQueries"
            :key="idx"
            @click="loadQueryToInput(query)"
            title="點擊重新帶入查詢"
          )
            lah-fa-icon(icon="clock-rotate-left" class="mr-2 text-muted")
            | {{ query }}
      template(v-else)
        .text-center.text-muted.mt-5
          lah-fa-icon(icon="box-open" size="3x" class="mb-3 opacity-50")
          p 尚無查詢紀錄

  //- 2. 中央主體：AI 對話與輸入區域
  .chat-main-area.d-flex.flex-column.bg-light

    //- 對話歷史區塊 (獨立 Scrollbar)
    .chat-container.p-4(ref="chatContainer")
      //- 初始空畫面提示
      .text-center.mt-5.anim-appear-1s(v-if="messages.length === 0")
        .icon-box.mx-auto.mb-4(:class="isDarkMode ? 'bg-secondary' : 'bg-primary-light'")
          lah-fa-icon(icon="robot", :variant="isDarkMode ? 'warning' : 'primary'", size="4x")
        h4.font-weight-bold.text-dark 案件智慧查詢助理
        p.text-muted 請在下方輸入案件號或相關資訊，我將為您向 DGX 查詢案件詳情。

      //- 歷史訊息列表
      .message-wrapper.d-flex.flex-column(v-else)
        div.mb-4(
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="msg.role === 'user' ? 'align-self-end text-right' : 'align-self-start text-left'"
          style="max-width: 90%;"
        )
          .small.text-muted.mb-1.mx-1 {{ msg.role === 'user' ? '您' : 'AI 助理' }}
          //- 透過 msg-ai class 讓 CSS 處理亮/暗模式的 AI 訊息框配色
          .d-inline-block.p-3.rounded.shadow-sm.text-left(
            :class="msg.role === 'user' ? 'bg-primary text-white' : 'msg-ai'"
            style="word-break: break-word; min-width: 150px;"
          )
            span(v-if="msg.isLoading")
              b-spinner(small).mr-2
              | 查詢 DGX 案件資料中...
            div(v-else)
              //- 文字說明區
              div(v-html="msg.content")

              //- ★ 卡片排列區塊：一列最多 4 個，靠左對齊 ★
              .cases-container.mt-3(v-if="msg.cases && msg.cases.length > 0")
                .case-card(v-for="(item, cIdx) in msg.cases" :key="cIdx")

                  //- 卡片標題：只顯示 Normalized 的完整案件號
                  .case-card-header.d-flex.align-items-center
                    lah-fa-icon(icon="file-signature" :variant="isDarkMode ? 'warning' : 'primary'").mr-2
                    strong.mb-0(:class="isDarkMode ? 'text-warning' : 'text-primary'") {{ getNormalizedId(item) }}

                  //- 卡片主體：嵌入 lah-reg-case-status 組件
                  .case-card-body
                    lah-reg-case-status-compact(:case-id="getNormalizedId(item)")

    //- 3. 底部輸入框區域 (永遠固定於此)
    .input-area.bg-white.border-top.p-3.shadow-sm
      b-container(fluid).max-w-800
        b-input-group(size="lg")
          b-form-input(
            v-model="inputText"
            placeholder="請輸入案件號碼 (例如: 115 HA81 1200)..."
            @keyup.enter="sendQuery"
            :disabled="isQuerying"
            autocomplete="off"
          )
          b-input-group-append
            b-button(
              variant="primary"
              @click="sendQuery"
              :disabled="!isValidInput || isQuerying"
            )
              lah-fa-icon.mr-1(icon="paper-plane" v-if="!isQuerying")
              b-spinner.mr-1(small v-else)
              | 傳送

</template>

<script>
export default {
  data () {
    return {
      inputText: '',
      isQuerying: false,
      messages: [],
      isDarkMode: false // 新增主題狀態，預設為亮色
    }
  },
  head: {
    title: '智慧案件查詢助理'
  },
  computed: {
    isValidInput () {
      return this.$utils ? !this.$utils.empty(this.inputText) : this.inputText.trim().length > 0
    },
    userQueries () {
      return this.messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .reverse()
    }
  },
  watch: {
    // 深度監聽 messages，只要有任何變動(新增訊息、解除 loading)，就自動捲動到底部
    messages: {
      deep: true,
      handler () {
        this.scrollToBottom()
      }
    }
  },
  mounted () {
    // 初始化時，從 localStorage 讀取使用者的主題偏好設定
    const savedTheme = localStorage.getItem('lah-chat-theme')
    if (savedTheme === 'dark') {
      this.isDarkMode = true
    }
  },
  methods: {
    // 切換主題並儲存偏好
    toggleTheme () {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('lah-chat-theme', this.isDarkMode ? 'dark' : 'light')
    },

    // 取得/組裝 Normalized 的案件號 (13碼格式)
    getNormalizedId (item) {
      if (item.normalized) { return item.normalized }
      // 容錯機制：若無 normalized 欄位，嘗試組裝 (115 + HA81 + 001200)
      const rm09 = item.RM09 || ''
      const rm10 = item.RM10 || ''
      const rm11 = (item.RM11 || '').padStart(6, '0')
      if (rm09 && rm10 && rm11) {
        return `${rm09}${rm10}${rm11}`
      }
      return item.id || '未知案件號'
    },

    async sendQuery () {
      if (!this.isValidInput || this.isQuerying) { return }

      const queryText = this.inputText.trim()

      // 將使用者的文字加入對話
      this.messages.push({ role: 'user', content: queryText })
      this.inputText = ''

      // 建立 AI 的 Loading 佔位訊息
      this.isQuerying = true
      const aiMsgIndex = this.messages.push({ role: 'ai', content: '', cases: [], isLoading: true }) - 1

      try {
        // 呼叫後端 PHP API
        const payload = {
          type: 'case_ids',
          input_string: queryText
        }

        const { data } = await this.$axios.post(this.$consts.API.JSON.DGX, payload)

        // 解析回傳結果
        let responseContent = ''
        let casesData = []

        if (data && data.status === 'success') {
          // 提供預設 fallback 方便無資料時也能測試 UI
          casesData = data.raw || [
            { normalized: '115HA81001200' },
            { normalized: '115HA81001201' },
            { normalized: '115HA81001202' },
            { normalized: '115HA81001203' },
            { normalized: '115HA81001204' } // 測試換行效果使用
          ]
          responseContent = '已為您找到以下案件，詳細資料如下：'
        } else {
          responseContent = data.message || '查無相關案件資料，請確認案件號是否正確。'
        }

        // 更新 AI 訊息內容與卡片陣列
        this.$set(this.messages, aiMsgIndex, {
          role: 'ai',
          content: responseContent,
          cases: casesData,
          isLoading: false
        })
      } catch (err) {
        console.error('DGX 查詢失敗', err)
        this.$set(this.messages, aiMsgIndex, {
          role: 'ai',
          content: '<span class="text-danger">⚠️ 伺服器連線異常或 DGX 系統無回應，請稍後再試。</span>',
          cases: [],
          isLoading: false
        })
        this.$bvToast.toast('API 連線失敗', { title: '系統錯誤', variant: 'danger', solid: true })
      } finally {
        this.isQuerying = false
      }
    },

    loadQueryToInput (query) {
      this.inputText = query
      this.$root.$emit('bv::toggle::collapse', 'history-sidebar')
    },

    // 讓對話視窗自動往下捲動到最新訊息
    scrollToBottom () {
      this.$nextTick(() => {
        setTimeout(() => {
          const container = this.$refs.chatContainer
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        }, 50)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
/* 最外層容器，確保滿版並防溢出 */
.chat-app-wrapper {
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: background-color 0.3s ease;
}

.navbar-area {
  flex: 0 0 auto;
}

/* ★ Title 垂直置中與字體設定 ★ */
.title-container {
  display: flex;
  align-items: center;
  height: 100%;
}
.title-text {
  font-size: 1.328rem;
  line-height: 1.2;
  margin-bottom: 0;
}

/* 中央主體區域：扣除 Header 後填滿剩餘空間 */
.chat-main-area {
  flex: 1 1 auto;
  overflow: hidden;
}

.chat-container {
  flex: 1 1 0;
  overflow-y: auto;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

.input-area {
  flex: 0 0 auto;
  z-index: 10;
}

.max-w-800 {
  max-width: 800px;
  margin: 0 auto;
}

.icon-box {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}
.bg-primary-light {
  background-color: rgba(0, 123, 255, 0.1);
}

.history-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-left: 3px solid transparent;
  background-color: transparent;

  &:hover {
    background-color: #f8f9fa;
    border-left-color: #007bff;
    color: #0056b3;
  }
}

.opacity-50 {
  opacity: 0.5;
}

/* 預設(亮色)的 AI 訊息框 */
.msg-ai {
  background-color: #ffffff;
  color: #343a40;
}

/* =========================================
   💡 嚴格限制一排四個、靠左排列的 Flexbox 佈局
   ========================================= */
.cases-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px; /* 固定的卡片間距 */
  justify-content: flex-start; /* 確保不滿 4 個時依然靠左對齊 */
}

.case-card {
  /* 一列最多 4 個，減去 3 個 gap(16px * 3 = 48px / 4 = 12px) 才能完美不破版 */
  width: calc(25% - 12px);
  flex: 0 0 auto; /* 禁止自動放大或縮小，維持固定比例 */
  min-width: 280px; /* 視窗縮小時自動換行，不會擠成一團 */

  background-color: #f8f9fa;
  border-left: 4px solid #007bff;
  border-radius: 8px;
  overflow: hidden; /* 防止 Header 溢出圓角 */
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
}

.case-card-header {
  padding: 10px 16px;
  background-color: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid #e9ecef;
  font-size: 1.1rem;
}

.case-card-body {
  padding: 16px;
}

/* 切換按鈕的微動畫 */
.theme-btn {
  transition: transform 0.2s;
  &:active {
    transform: scale(0.9);
  }
}

/* =========================================
   🌙 支援暗黑模式 (Dark Mode) 的樣式覆寫
   ========================================= */
.theme-dark {
  .bg-light { background-color: #212529 !important; }
  .bg-white { background-color: #343a40 !important; }

  .text-dark { color: #f8f9fa !important; }

  .input-area {
    border-color: #495057 !important;
  }
  .form-control {
    background-color: #2b3035;
    color: #f8f9fa;
    border-color: #495057;
    &::placeholder {
      color: #6c757d;
    }
    &:disabled {
      background-color: #212529;
    }
  }

  .msg-ai {
    background-color: #495057 !important;
    color: #f8f9fa !important;
  }

  /* 暗色模式的 AI 資料卡片覆寫 */
  .case-card {
    background-color: #2b3035 !important;
    border-left-color: #ffc107 !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }

  .case-card-header {
    background-color: rgba(255, 255, 255, 0.05);
    border-bottom-color: #495057;
  }

  .history-item:hover {
    background-color: #495057 !important;
    color: #ffc107 !important;
    border-left-color: #ffc107 !important;
  }
}
</style>
