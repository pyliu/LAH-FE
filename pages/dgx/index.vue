<template lang="pug">
//- 1. 最外層嚴格限制高度為 100vh，並根據 isDarkMode 動態套用暗黑主題
div.chat-app-wrapper(:class="{ 'theme-dark': isDarkMode }")
  //- 頂部導覽列 (動態切換 light/dark 模式)
  b-navbar(:variant="isDarkMode ? 'dark' : 'white'", :type="isDarkMode ? 'dark' : 'light'", sticky).shadow-sm.px-3.border-bottom.navbar-area
    //- 左側：漢堡選單 (觸發歷史紀錄側邊欄)
    b-button(variant="link" v-b-toggle.history-sidebar).p-1.mr-2.d-flex.align-items-center
      lah-fa-icon(icon="bars", size="lg", :class="isDarkMode ? 'text-light' : 'text-dark'")

    //- 中間：第一次完成送出後，顯示標題與圖示
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

  //- 歷史紀錄側邊欄
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
          :style="hasCaseCards(msg) ? '' : 'max-width: 90%;'"
        )
          .small.text-muted.mb-1.mx-1 {{ msg.role === 'user' ? '您' : 'AI 助理' }}
          //- ✅ #2 修補：有案件卡片時改用 d-block 並取消寬度限制，避免 flex grid 被 inline-block 壓縮破版
          .p-3.rounded.shadow-sm.text-left(
            :class="[msg.role === 'user' ? 'bg-primary text-white' : 'msg-ai', hasCaseCards(msg) ? 'd-block' : 'd-inline-block']"
            style="word-break: break-word; min-width: 150px;"
          )
            span(v-if="msg.isLoading")
              b-spinner(small).mr-2
              | 查詢 DGX 案件資料中...
            div(v-else)
              //- ✅ #1 修補：使用者訊息改用純文字插值防止 XSS，只有 AI 回傳內容才走 v-html
              span(v-if="msg.role === 'user'") {{ msg.content }}
              div(v-else v-html="msg.content")

              //- 卡片排列區塊：一列最多 4 個，靠左對齊
              .cases-container.mt-3(v-if="hasCaseCards(msg)")
                .case-card(v-for="(item, cIdx) in msg.cases" :key="cIdx")
                  .case-card-header.d-flex.align-items-center
                    lah-fa-icon(icon="file-signature" :variant="isDarkMode ? 'warning' : 'primary'").mr-2
                    strong.mb-0(:class="isDarkMode ? 'text-warning' : 'text-primary'") {{ getNormalizedId(item) }}
                  .case-card-body
                    lah-reg-case-status-compact(:case-id="getNormalizedId(item)")

    //- 3. 底部輸入框區域 (永遠固定於此)
    .input-area.bg-white.border-top.p-3.shadow-sm
      b-container(fluid).max-w-800
        b-input-group(size="lg")
          b-form-input(
            v-model="inputText"
            placeholder="請輸入案件號碼 (例如: 115 HA81 1200)..."
            @keyup.enter="sendQuery($event)"
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
      isDarkMode: false
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
      const seen = new Set()
      return this.messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .reverse()
        .filter(q => seen.has(q) ? false : seen.add(q))
    }
  },
  watch: {
    messages: {
      deep: true,
      handler () {
        this.scrollToBottom()
      }
    }
  },
  mounted () {
    // 從 localStorage 讀取主題偏好
    const savedTheme = localStorage.getItem('lah-chat-theme')
    if (savedTheme === 'dark') {
      this.isDarkMode = true
    }

    // ✅ #8 修補：改用 MutationObserver 監聽對話容器 DOM 變化
    // 解決 compact 卡片非同步載入資料後高度撐高，setTimeout(50) 來不及捲動的競態問題
    this.$nextTick(() => {
      const container = this.$refs.chatContainer
      if (container) {
        this._scrollObserver = new MutationObserver(() => {
          // 僅在使用者視野已接近底部時才自動跟隨捲動
          // 避免使用者手動捲回查看歷史時被強制拉回底部
          const threshold = 150
          const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
          if (distanceFromBottom < threshold) {
            container.scrollTop = container.scrollHeight
          }
        })
        this._scrollObserver.observe(container, { childList: true, subtree: true })
      }
    })
  },
  beforeDestroy () {
    // ✅ #8 修補：元件銷毀時清理 MutationObserver，避免記憶體洩漏
    if (this._scrollObserver) {
      this._scrollObserver.disconnect()
      this._scrollObserver = null
    }
  },
  methods: {
    // 切換主題並儲存偏好
    toggleTheme () {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('lah-chat-theme', this.isDarkMode ? 'dark' : 'light')
    },

    // ✅ #2 修補：判斷訊息是否含有案件卡片，供 template 控制佈局模式
    hasCaseCards (msg) {
      return msg.cases && msg.cases.length > 0
    },

    // 取得 Normalized 案件號，優先使用 LLM 輸出的 normalized 欄位
    getNormalizedId (item) {
      if (item.normalized) { return item.normalized }
      return item.id || '未知案件號'
    },

    async sendQuery (event) {
      // 中文 IME 選字確認也會觸發 Enter，需過濾避免送出半成品字串
      if (event && event.isComposing) { return }
      if (!this.isValidInput || this.isQuerying) { return }

      const queryText = this.inputText.trim()

      this.messages.push({ role: 'user', content: queryText })
      this.inputText = ''

      this.isQuerying = true
      const aiMsgIndex = this.messages.push({ role: 'ai', content: '', cases: [], isLoading: true }) - 1

      try {
        const payload = {
          type: 'case_ids',
          input_string: queryText
        }

        const { data } = await this.$axios.post(this.$consts.API.JSON.DGX, payload)

        let responseContent = ''
        let casesData = []

        // ✅ #9 修補：改用 $utils.statusCheck() 與其他 API 呼叫保持一致
        if (data && this.$utils.statusCheck(data.status)) {
          // ✅ #3 修補：移除硬編碼測試資料 fallback，查無資料時回傳空陣列
          casesData = data.raw || []
          responseContent = casesData.length > 0
            ? '已為您找到以下案件，詳細資料如下：'
            : '查無相關案件資料，請確認案件號是否正確。'
        } else {
          responseContent = data.message || '查無相關案件資料，請確認案件號是否正確。'
        }

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

    // ✅ #8 修補：scrollToBottom 由 MutationObserver 主動補足非同步高度變化
    // 此方法保留用於 messages watcher 觸發的初次捲動（新訊息加入時立即捲動）
    scrollToBottom () {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer
        if (container) {
          container.scrollTop = container.scrollHeight
        }
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

.chat-main-area {
  flex: 1 1 auto;
  overflow: hidden;
}

.chat-container {
  flex: 1 1 0;
  min-height: 0; // 防止 flex child 被內容撐高，確保 overflow-y: auto 正確作用
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

.msg-ai {
  background-color: #ffffff;
  color: #343a40;
}

.cases-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: flex-start;
}

.case-card {
  width: calc(25% - 12px);
  flex: 0 0 auto;
  min-width: 280px;

  background-color: #f8f9fa;
  border-left: 4px solid #007bff;
  border-radius: 8px;
  overflow: hidden;
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

.theme-btn {
  transition: transform 0.2s;
  &:active {
    transform: scale(0.9);
  }
}

/* =========================================
   🌙 支援暗黑模式 (Dark Mode)
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
