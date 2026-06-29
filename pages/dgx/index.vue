<template lang="pug">
//- 1. 最外層嚴格限制高度，並根據 isDarkMode 動態套用暗黑主題
div.chat-app-wrapper(:class="{ 'theme-dark': isDarkMode }")
  //- 頂部導覽列 (動態切換 light/dark 模式)
  b-navbar(:variant="isDarkMode ? 'dark' : 'white'", :type="isDarkMode ? 'dark' : 'light'", sticky).shadow-sm.px-3.border-bottom.navbar-area
    //- 左側：漢堡選單 (觸發歷史紀錄側邊欄)
    b-button(variant="link" v-b-toggle.history-sidebar v-b-tooltip.hover title="查看歷史紀錄").p-1.mr-2.d-flex.align-items-center
      lah-fa-icon(icon="history", size="lg", :class="isDarkMode ? 'text-light' : 'text-dark'")

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
      b-nav-item(@click="clearMessages" title="清除畫面紀錄" v-if="messages.length > 0")
        .d-flex.align-items-center
          lah-fa-icon(icon="trash-alt", size="lg", variant="danger")

      //- 明暗主題切換按鈕
      b-nav-item(@click="toggleTheme" title="切換明暗主題")
        .d-flex.align-items-center
          lah-fa-icon(:icon="isDarkMode ? 'sun' : 'moon'", size="lg", :variant="isDarkMode ? 'warning' : 'secondary'")

  //- ==========================================
  //- 歷史紀錄側邊欄
  //- ==========================================
  b-sidebar(
    id="history-sidebar"
    title="歷史查詢紀錄"
    shadow
    :bg-variant="isDarkMode ? 'dark' : 'light'"
    :text-variant="isDarkMode ? 'light' : 'dark'"
  )
    .p-3
      //- 有紀錄時顯示列表
      template(v-if="historyRecords.length > 0")
        .d-flex.justify-content-between.align-items-center.mb-3
          span.text-muted.small 共 {{ historyRecords.length }} 筆紀錄
          b-button(size="sm" variant="outline-danger" pill @click="clearHistory") 清除全部

        b-list-group(flush)
          b-list-group-item.history-item.px-2.py-3(
            v-for="(record, idx) in historyRecords"
            :key="idx"
            href="#"
            @click.prevent="useHistory(record.text)"
            :class="isDarkMode ? 'bg-dark text-light border-secondary' : ''"
            title="點擊代入查詢"
          )
            .d-flex.w-100.justify-content-between.align-items-center
              span.text-truncate.mr-2 {{ record.text }}
              small.text-muted {{ record.time }}

      //- 沒紀錄時的空狀態
      .text-center.mt-5(v-else :class="isDarkMode ? 'text-secondary' : 'text-muted'")
        lah-fa-icon(icon="history" size="3x").mb-3.opacity-50
        p 尚無查詢紀錄

  //- ==========================================
  //- 聊天主體區塊
  //- ==========================================
  .chat-main-area.d-flex.flex-column
    //- 對話紀錄顯示區
    .messages-container.flex-grow-1.p-4.overflow-auto(ref="msgContainer")
      //- 歡迎畫面 (如果沒有訊息)
      .welcome-screen.d-flex.flex-column.align-items-center.justify-content-center.h-100(v-if="messages.length === 0")
        lah-fa-icon(icon="robot" size="4x" :variant="isDarkMode ? 'warning' : 'primary'").mb-3
        h3.font-weight-bold(:class="isDarkMode ? 'text-light' : 'text-dark'") 案件智慧查詢助理
        p.text-muted 您好！請輸入案件字號或相關資訊，我來幫您查詢。
        b-button(variant="outline-info" pill @click="$refs.instructionModal.show()").mt-3.shadow-sm
          lah-fa-icon(icon="info-circle").mr-1
          | 查看支援的輸入格式與範例

      //- 訊息對話列表
      .message-item.mb-4(
        v-for="(msg, msgIdx) in messages"
        :key="'msg_' + msgIdx"
        :class="{'text-right': msg.isUser, 'text-left': !msg.isUser}"
      )
        //- 使用者訊息泡泡
        .d-inline-block.p-3.rounded(
          v-if="msg.isUser"
          class="bg-primary text-white shadow-sm text-left"
        ) {{ msg.text }}

        //- AI 回覆訊息泡泡
        .d-inline-block.p-3.rounded.text-left.shadow-sm(
          v-else
          style="max-width: 95%;"
          :class="isDarkMode ? 'bg-dark text-light border border-secondary' : 'bg-white border'"
        )
          .mb-2.font-weight-bold
            lah-fa-icon(icon="robot" :variant="isDarkMode ? 'warning' : 'primary'").mr-2
            | {{ msg.text }}

          //- 直接渲染真實的地政案件微型卡片
          .cases-container.mt-3(v-if="msg.caseIds && msg.caseIds.length > 0")
            .case-card(
              v-for="(cId, cIdx) in msg.caseIds"
              :key="'case_' + msgIdx + '_' + cIdx + '_' + cId"
              :class="isDarkMode ? 'border-secondary' : ''"
            )
              .case-card-header.d-flex.align-items-center(:class="isDarkMode ? 'bg-secondary text-light border-secondary' : 'bg-light text-dark'")
                lah-fa-icon(icon="file-signature" :class="isDarkMode ? 'text-light' : 'text-secondary'").mr-2
                strong.mb-0 {{ $utils.caseId(cId) }}
              .case-card-body(:class="isDarkMode ? 'bg-dark text-light' : 'bg-white'")
                //- ✅ 確保 compact.vue 能正確呼叫內部 API (保留您的 case-id 綁定)
                lah-reg-case-status-compact(:case-id="cId")

    //- 底部輸入區塊
    .input-area.p-3.border-top(:class="isDarkMode ? 'bg-dark' : 'bg-light'")
      b-input-group(size="lg")
        b-form-input(
          ref="chatInput"
          v-model="inputText"
          placeholder="請輸入案件資訊... (例：113年桃園朴子 第190號)"
          @keyup.enter="sendMessage"
          :class="isDarkMode ? 'bg-dark text-light border-secondary' : 'bg-white'"
          :disabled="isBusy"
        )
        b-input-group-append
          b-button(variant="primary" @click="sendMessage" :disabled="!inputText.trim() || isBusy").theme-btn.h-100
            lah-fa-icon(icon="paper-plane" :action="isBusy ? 'spin' : ''")
            |  送出

  //- ==========================================
  //- 案件查詢語法說明 Modal
  //- ==========================================
  b-modal(
    ref="instructionModal"
    size="xl"
    title="🤖 案件智慧查詢助理 - 完整使用說明"
    ok-only
    ok-title="我瞭解了"
    ok-variant="primary"
    centered
    scrollable
    :header-bg-variant="isDarkMode ? 'dark' : 'white'"
    :header-text-variant="isDarkMode ? 'light' : 'dark'"
    :body-bg-variant="isDarkMode ? 'dark' : 'white'"
    :body-text-variant="isDarkMode ? 'light' : 'dark'"
    :footer-bg-variant="isDarkMode ? 'dark' : 'light'"
    :header-border-variant="isDarkMode ? 'secondary' : 'default'"
    :footer-border-variant="isDarkMode ? 'secondary' : 'default'"
  )
    b-container(fluid)
      p.mb-4.font-weight-bold(:class="isDarkMode ? 'text-light' : 'text-primary'") 您可以直接像跟同事講話一樣輸入案件資訊！AI 引擎已搭載強大的地政業務容錯規則，會自動為您解析出精準的案件編號。

      b-row
        //- 格式說明
        b-col(md="4").mb-4
          h6.font-weight-bold.text-primary.mb-3 📌 基本格式解析
          b-card(no-body :bg-variant="isDarkMode ? 'dark' : 'light'" :class="isDarkMode ? 'border-secondary' : ''").instruction-card.h-100.shadow-sm.border-0
            b-card-body.p-3
              ul.mb-0.pl-3(:class="isDarkMode ? 'text-light' : 'text-dark'")
                li.mb-3
                  strong 民國年：
                  | 2~3 碼數字。
                  br
                  small.text-secondary 💡 若未指定，系統會
                    b-badge.mx-1(variant="info") 自動預設為今年
                    | 。
                li.mb-3
                  strong 案件字：
                  | 4 碼英數組合 (如 #[code HA81])。
                  br
                  small.text-secondary 💡 也支援口語化輸入，如輸入「桃園朴子」，會自動轉譯為 #[code H1QB]。
                li.mb-0
                  strong 案件號：
                  | 輸入任意數字。
                  br
                  small.text-secondary 💡 系統會
                    b-badge.mx-1(variant="secondary") 自動幫您補齊 6 碼
                    | (輸入 #[code 190] = #[code 000190])。

        //- 容錯說明
        b-col(md="8").mb-4
          h6.font-weight-bold.text-success.mb-3 🪄 進階 AI 容錯與繼承規則
          b-card(no-body :bg-variant="isDarkMode ? 'dark' : 'light'" :class="isDarkMode ? 'border-secondary' : ''").instruction-card.border-success.h-100.shadow-sm.border-0
            b-card-body.p-3
              b-row
                b-col(sm="6")
                  ul.mb-0.pl-3(:class="isDarkMode ? 'text-light' : 'text-dark'")
                    li.mb-3
                      strong 連續字號繼承：
                      br
                      small.text-secondary 想查多筆同字號案件？直接用空白分隔號碼即可。AI 會自動將它們獨立成多筆並沿用前一個案件字。
                    li.mb-3
                      strong 動態年份延續：
                      br
                      small.text-secondary 同一句話中跨字號查詢時，指定的年份會自動往後延續套用。
                b-col(sm="6")
                  ul.mb-0.pl-3(:class="isDarkMode ? 'text-light' : 'text-dark'")
                    li.mb-3
                      strong 自動過濾無效數字 (防呆)：
                      br
                      small.text-secondary 1~130 的數字常被誤認為鄉鎮代碼或日期，系統會自動忽略。若真的是案件號，請加上「號」字 (例如：#[code 120號])。
                    li.mb-0
                      strong 全形與日期符號轉換：
                      br
                      small.text-secondary 輸入全形 #[code ＨＡ８１] 或含有日期的 #[code 113/05/20]，AI 皆能自動排除斜線並提取正確年份。

      hr(:class="isDarkMode ? 'border-secondary' : ''")

      //- 實際對話範例
      h6.font-weight-bold.mt-3.mb-3(:class="isDarkMode ? 'text-light' : 'text-dark'") 💬 實戰情境範例

      b-row
        //- 範例 1
        b-col(lg="6")
          .example-block.bg-light(:class="isDarkMode ? 'bg-dark text-light border-secondary' : 'text-dark'")
            .mb-1.text-secondary.small 情境 1：最基本的查詢 (含口語化)
            .font-weight-bold
              lah-fa-icon(icon="user-circle", variant="secondary").mr-2
              | "幫我查113年 桃園朴子 第190號"
            hr.my-2(:class="isDarkMode ? 'border-secondary' : ''")
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ 解析為：#[code 113-H1QB-000190]

        //- 範例 2
        b-col(lg="6")
          .example-block.bg-light(:class="isDarkMode ? 'bg-dark text-light border-secondary' : 'text-dark'")
            .mb-1.text-secondary.small 情境 2：連續輸入多個案件號 (字號繼承)
            .font-weight-bold
              lah-fa-icon(icon="user-circle", variant="secondary").mr-2
              | "HA85 1200 1300"
            hr.my-2(:class="isDarkMode ? 'border-secondary' : ''")
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ #[code 113-HA85-001200] (自動預設今年)
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ #[code 113-HA85-001300] (繼承 HA85)

        //- 範例 3
        b-col(lg="6")
          .example-block.bg-light(:class="isDarkMode ? 'bg-dark text-light border-secondary' : 'text-dark'")
            .mb-1.text-secondary.small 情境 3：破解數字 130 以下的過濾機制
            .font-weight-bold
              lah-fa-icon(icon="user-circle", variant="secondary").mr-2
              | "幫我查HA81 120號"
            hr.my-2(:class="isDarkMode ? 'border-secondary' : ''")
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ 解析為：#[code 113-HA81-000120]
              br
              span.small.text-muted.ml-4 (加「號」不過濾)

        //- 範例 4
        b-col(lg="6")
          .example-block.bg-light(:class="isDarkMode ? 'bg-dark text-light border-secondary' : 'text-dark'")
            .mb-1.text-secondary.small 情境 4：跨字號查詢 + 年份延續
            .font-weight-bold
              lah-fa-icon(icon="user-circle", variant="secondary").mr-2
              | "112年 HA81 1200 還有 HA82 700"
            hr.my-2(:class="isDarkMode ? 'border-secondary' : ''")
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ #[code 112-HA81-001200]
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ #[code 112-HA82-000700]
              span.small.text-muted (自動沿用 112 年)
</template>

<script>
import lahRegCaseStatusCompact from '~/components/lah-reg-case-status-compact.vue';

const MAX_MESSAGES = 200
const MAX_HISTORY = 50

export default {
  name: 'AiQueryAssistantIndex',
  components: { lahRegCaseStatusCompact },
  data: () => ({
    isDarkMode: false,
    isBusy: false,
    inputText: '',
    messages: [],
    historyRecords: [],
    resizeObserver: null
  }),
  mounted () {
    const savedTheme = localStorage.getItem('lah-theme-dark')
    if (savedTheme !== null) {
      this.isDarkMode = savedTheme === 'true'
    }

    const savedHistory = localStorage.getItem('lah-dgx-history')
    if (savedHistory) {
      try {
        this.historyRecords = JSON.parse(savedHistory)
      } catch (e) {
        console.error('解析歷史紀錄失敗', e)
      }
    }

    this.$nextTick(() => {
      const container = this.$refs.msgContainer
      if (container && window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200
          if (isNearBottom) {
            container.scrollTop = container.scrollHeight
          }
        })
        this.resizeObserver.observe(container)
      }
    })
  },
  beforeDestroy () {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
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
      }).then((value) => {
        if (value) {
          this.messages = []
        }
      }).catch((err) => {
        this.$utils.error(err)
      })
    },
    clearHistory () {
      this.historyRecords = []
      localStorage.removeItem('lah-dgx-history')
      this.$bvToast.toast('歷史查詢紀錄已清空', {
        title: '提示',
        variant: 'success',
        solid: true,
        autoHideDelay: 2000
      })
    },
    useHistory (text) {
      this.inputText = text
      this.$root.$emit('bv::toggle::collapse', 'history-sidebar')
      this.$nextTick(() => {
        if (this.$refs.chatInput) {
          this.$refs.chatInput.focus()
        }
      })
    },
    saveToHistory (text) {
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      if (this.historyRecords.length > 0 && this.historyRecords[0].text === text) {
        return
      }

      this.historyRecords.unshift({ time: timeStr, text })

      if (this.historyRecords.length > MAX_HISTORY) {
        this.historyRecords.pop()
      }

      localStorage.setItem('lah-dgx-history', JSON.stringify(this.historyRecords))
    },
    scrollToBottom () {
      this.$nextTick(() => {
        const container = this.$refs.msgContainer
        if (container) { container.scrollTop = container.scrollHeight }
      })
    },
    async sendMessage () {
      if (!this.inputText.trim() || this.isBusy) { return }

      const userInput = this.inputText.trim()

      this.messages.push({
        text: userInput,
        isUser: true
      })

      this.saveToHistory(userInput)
      this.inputText = ''
      this.isBusy = true

      if (this.messages.length > MAX_MESSAGES) {
        this.messages = this.messages.slice(-MAX_MESSAGES)
      }
      this.scrollToBottom()

      try {
        const apiUrl = this.$consts?.API?.JSON?.DGX || '/api/dgx_json_api.php'

        // 發送真實 API 請求
        const { data } = await this.$axios.post(apiUrl, {
          type: 'case_ids',
          text: userInput
        })

        if (data && this.$utils.statusCheck(data.status)) {
          const parsedCases = data.raw || []

          if (parsedCases.length === 0) {
            this.messages.push({
              text: `抱歉，我無法從您的輸入「${userInput}」中解析出任何有效的案件字號，請重新確認格式。`,
              isUser: false,
              caseIds: []
            })
          } else {
            // ✅ 防呆解析：強制過濾空值，並確保 case_no 正確補齊 6 碼
            const rawIds = []
            parsedCases.forEach((c) => {
              if (c.year_miguo && c.case_word && c.case_no) {
                const y = String(c.year_miguo).trim()
                const w = String(c.case_word).trim()
                const n = String(c.case_no).trim().padStart(6, '0')
                rawIds.push(`${y}${w}${n}`)
              }
            })

            // ✅ 剔除重複字號 (防呆)
            const uniqueCaseIds = [...new Set(rawIds)].filter(id => id.length >= 10)

            if (uniqueCaseIds.length === 0) {
              this.messages.push({
                text: '解析結果格式異常，無法產生標準字號，請檢查您的輸入內容。',
                isUser: false,
                caseIds: []
              })
              return
            }

            // 先產生包含空陣列的訊息外殼
            const aiMsg = {
              text: `已為您找到與「${userInput}」相關的 ${uniqueCaseIds.length} 筆案件資料：`,
              isUser: false,
              caseIds: []
            }
            this.messages.push(aiMsg)

            // ✅ 終極修復：交錯延遲載入 (Staggered Loading)
            // 將陣列內的 ID 每隔 400 毫秒才放入畫面渲染，避免 3 張以上的卡片瞬間發出 API 請求
            // 導致瀏覽器連線數達到上限或是後端連線池逾時 (Connection Timeout)。
            uniqueCaseIds.forEach((cId, index) => {
              setTimeout(() => {
                aiMsg.caseIds.push(cId)
                this.scrollToBottom() // 搭配 ResizeObserver 自動跟隨向下捲動
              }, index * 400)
            })
          }
        } else {
          this.messages.push({
            text: `解析過程發生錯誤：${data.message || '未知錯誤'}`,
            isUser: false,
            caseIds: []
          })
        }
      } catch (err) {
        this.$utils.error(err)
        this.messages.push({
          text: '連線至 AI 伺服器失敗，請確認網路狀態或稍後再試。',
          isUser: false,
          caseIds: []
        })
      } finally {
        this.isBusy = false
        if (this.messages.length > MAX_MESSAGES) {
          this.messages = this.messages.slice(-MAX_MESSAGES)
        }
        this.scrollToBottom()
      }
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
   卡片與排版
   ========================================= */
.cases-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: flex-start;
}

.case-card {
  /* 修正：改用 0 0 auto 防止卡片換行時被無限拉伸變形 */
  flex: 0 0 auto;
  width: calc(33.333% - 12px);
  min-width: 280px;
  max-width: 100%;
  border-left: 4px solid #007bff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  border-top: 1px solid rgba(0,0,0,0.05);
  border-right: 1px solid rgba(0,0,0,0.05);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

@media (max-width: 768px) {
  .case-card {
    width: 100%;
  }
}

.case-card-header {
  padding: 8px 12px;
  border-bottom: 1px solid #e9ecef;
  font-size: 1rem;
}

.case-card-body {
  padding: 12px;
  height: 100%;
}

/* =========================================
   歷史側邊欄樣式
   ========================================= */
.history-item {
  transition: background-color 0.2s ease;
  &:hover {
    background-color: rgba(0, 123, 255, 0.05);
  }
}

.theme-dark .history-item:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
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
  border-left: 4px solid #007bff;
  margin-bottom: 1rem;
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

  code {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 2px 4px;
    border-radius: 4px;
    color: #d63384;
  }
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

  .example-block {
    background-color: #2b3035 !important;
    border-color: #495057;
    border-left-color: #0d6efd;

    code {
      background-color: rgba(255, 255, 255, 0.1);
      color: #ff87c3;
    }
  }

  .case-card { border-color: #495057; }
  .case-card-header { border-bottom-color: #495057; }
}
</style>
