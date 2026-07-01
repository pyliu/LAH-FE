<template lang="pug">
//- 1. 最外層嚴格限制高度與寬度，阻絕任何水平捲軸溢出
div.chat-app-wrapper.w-100(:class="{ 'theme-dark': isDarkMode }" style="max-width: 100vw; overflow-x: hidden;")
  //- 頂部導覽列 (強制不換行 flex-nowrap)
  b-navbar(:variant="isDarkMode ? 'dark' : 'white'", :type="isDarkMode ? 'dark' : 'light'", sticky).shadow-sm.px-2.px-md-3.border-bottom.navbar-area.d-flex.flex-nowrap
    //- 左側：漢堡選單 (觸發歷史紀錄側邊欄)
    b-button(variant="link" v-b-toggle.history-sidebar v-b-tooltip.hover title="查看歷史紀錄").p-1.mr-2.d-flex.align-items-center.flex-shrink-0
      lah-fa-icon(icon="history", size="lg", :class="isDarkMode ? 'text-light' : 'text-dark'")

    //- 中間：第一次完成送出後，顯示標題與圖示
    lah-transition(appear)
      //- 加入 flex-grow-1 與 min-width: 0 確保標題過長時可以順利截斷 (.text-truncate)
      .title-container.d-flex.align-items-center.flex-grow-1(v-if="messages.length > 0" style="min-width: 0;")
        lah-fa-icon.mr-1.mr-md-2(icon="robot", :variant="isDarkMode ? 'warning' : 'primary'", size="2x").flex-shrink-0
        strong.title-text.mb-0.font-weight-bold.mt-1.text-truncate(:class="isDarkMode ? 'text-warning' : 'text-primary'") 案件查詢AI助理
        //- 說明圖示按鈕
        b-button(variant="link" @click="$refs.instructionModal.show()" v-b-tooltip.hover title="查看輸入說明").p-0.ml-1.mt-1.flex-shrink-0
          lah-fa-icon(icon="info-circle", size="lg", :variant="isDarkMode ? 'info' : 'info'")

    //- 右側：操作按鈕區 (強制水平排列 flex-row，避免手機版折疊推擠)
    b-navbar-nav.ml-auto.flex-row.align-items-center.flex-shrink-0
      //- 字體大小切換按鈕
      b-nav-item(@click="cycleTextSize" title="切換對話文字大小")
        .d-flex.align-items-center.px-1
          lah-fa-icon(icon="font", size="lg", :variant="isDarkMode ? 'info' : 'secondary'")
          span.ml-1.font-weight-bold.small(:class="isDarkMode ? 'text-info' : 'text-secondary'") {{ textSizeLabel }}

      //- 清除對話按鈕 (當有訊息時才顯示)
      b-nav-item(@click="clearMessages" title="清除畫面紀錄" v-if="messages.length > 0")
        .d-flex.align-items-center.px-1
          lah-fa-icon(icon="trash-alt", size="lg", variant="danger")

      //- 明暗主題切換按鈕
      b-nav-item(@click="toggleTheme" title="切換明暗主題")
        .d-flex.align-items-center.px-1
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
  .chat-main-area.d-flex.flex-column.position-relative

    //- 💡 閒置 5 分鐘顯示的跑馬燈 (螢幕保護程式效果)
    transition(name="fade")
      .idle-marquee-overlay(v-if="showMarquee" :class="{ 'theme-dark': isDarkMode }")
        .marquee-text-container {{ fullMarqueeText }}

    //- 對話紀錄顯示區 (縮小手機版 padding，限制橫向捲動)
    .messages-container.flex-grow-1.p-2.p-md-4.overflow-auto(ref="msgContainer" style="overflow-x: hidden;")

      //- 歡迎畫面
      .welcome-screen.d-flex.flex-column.align-items-center.justify-content-center.h-100(v-if="messages.length === 0")
        .greeting-container.d-flex.flex-column.align-items-center.px-3
          lah-fa-icon(icon="robot" size="7x" :variant="isDarkMode ? 'warning' : 'primary'").mb-2

          .text-center.mt-1(:class="isDarkMode ? 'text-light' : 'text-dark'")
            h2.font-weight-bold.mb-3.welcome-title 案件查詢AI助理
            h6.mb-4(:class="isDarkMode ? 'text-secondary' : 'text-muted'") 您好！請輸入案件字號或相關資訊，我來幫您查詢。

            b-button(variant="primary" pill size="lg" @click="$refs.instructionModal.show()").shadow-sm.px-4.py-2.mt-2
              lah-fa-icon(icon="info-circle").mr-2
              | 查看輸入格式與範例

      //- 訊息對話列表
      .message-item.mb-4(
        v-for="(msg, msgIdx) in messages"
        :key="'msg_' + msgIdx"
        :class="[{'text-right': msg.isUser, 'text-left': !msg.isUser}, 'text-size-' + textSize]"
      )
        //- 使用者訊息泡泡
        .d-inline-block.p-3.rounded(
          v-if="msg.isUser"
          class="bg-primary text-white shadow-sm text-left"
        ) {{ msg.text }}

        //- AI 回覆訊息泡泡
        .d-inline-block.p-3.rounded.text-left.shadow-sm(
          v-else
          :style="{ maxWidth: '98%', width: (msg.caseIds && msg.caseIds.length > 0) ? '100%' : 'auto' }"
          :class="isDarkMode ? 'bg-dark text-light border border-secondary' : 'bg-white border'"
        )
          .mb-2.font-weight-bold
            lah-fa-icon(icon="robot" :variant="isDarkMode ? 'warning' : 'primary'").mr-2
            | {{ msg.text }}

          //- 渲染真實的地政案件微型卡片
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
                lah-reg-case-status-compact(:case-id="cId")

      //- 超過一秒才顯示的 AI 思考中指示器
      lah-transition
        .message-item.mb-4.text-left(
          v-if="showLongLoadingText"
          :class="'text-size-' + textSize"
        )
          .d-inline-block.p-3.rounded.text-left.shadow-sm(
            :class="isDarkMode ? 'bg-dark text-light border border-secondary' : 'bg-light text-dark border'"
          )
            .mb-0.font-weight-bold.text-secondary
              lah-fa-icon(icon="circle-notch" action="spin" :variant="isDarkMode ? 'warning' : 'primary'").mr-2
              | 詢問AI中 ... 請稍帶片刻

    //- 底部輸入區塊
    .input-area.p-2.p-md-3.border-top(:class="isDarkMode ? 'bg-dark border-secondary' : 'bg-light'")
      //- 💡 移除 max-width 限制，讓三欄版面在大螢幕可充分利用空間
      .input-wrapper.mx-auto.w-100(ref="inputWrapper")

        //- 💡 三欄響應式容器
        //-    大螢幕 (md+) flex-row：[說明提示(left,order-1)] [輸入框(middle,order-2)] [歷史快捷(right,order-3)]
        //-    小螢幕 flex-column：   [歷史快捷(order-1,上)] [輸入框(order-2,中)] [說明提示(order-3,下)]
        .input-layout.d-flex.flex-column.flex-md-row.align-items-stretch.align-items-md-center

          //- ── 說明提示面板 ──────────────────────────────────
          //- 大螢幕：最左側(order-md-1)，高度撐滿輸入框
          //- 小螢幕：最下方(order-3)，全寬
          .tip-panel.order-3.order-md-1.mt-2.mt-md-0(
            :class="isDarkMode ? 'tip-panel--dark' : 'tip-panel--light'"
          )
            //- 💡 :key="tipIndex" 觸發 lah-transition 的淡入淡出，每 10 秒換一則
            lah-transition
              .d-flex.align-items-start(:key="tipIndex")
                lah-fa-icon(icon="lightbulb" :class="isDarkMode ? 'text-warning' : 'text-warning'").mr-2.flex-shrink-0.mt-1
                span.tip-text.small(:class="isDarkMode ? 'text-light' : 'text-secondary'") {{ currentTip }}

          //- ── 輸入框 (固定 order-2，大小螢幕皆在中間) ──────
          .order-2.flex-grow-1.px-md-3
            b-input-group(size="lg")
              b-form-input(
                ref="chatInput"
                v-model="inputText"
                placeholder="請輸入案件資訊..."
                @keyup.enter="sendMessage"
                :class="[isDarkMode ? 'bg-dark text-light border-secondary' : 'bg-white']"
                :disabled="isBusy"
              )
              b-input-group-append
                b-button(variant="primary" @click="sendMessage" :disabled="!inputText.trim() || isBusy").theme-btn.h-100.px-2.px-md-3
                  lah-fa-icon(icon="paper-plane" :action="isBusy ? 'spin' : ''")
                  span.d-none.d-sm-inline.ml-1 送出

          //- ── 歷史快捷列表 ──────────────────────────────────
          //- 大螢幕：最右側(order-md-3)，垂直置中
          //- 小螢幕：輸入框上方(order-1)，全寬橫向捲動
          .quick-examples.order-1.order-md-3.mb-2.mb-md-0.d-flex.align-items-center.overflow-hidden(
            ref="quickExamples"
            :style="{ opacity: isCalculating ? 0 : 1, pointerEvents: isCalculating ? 'none' : 'auto' }"
          )
            b-button(
              v-for="(item, idx) in displayExamples"
              :key="'ex_' + idx"
              variant="outline-secondary"
              size="sm"
              pill
              class="mr-2 flex-shrink-0 quick-btn d-inline-flex align-items-center"
              :class="isDarkMode ? 'text-light border-secondary' : 'text-secondary'"
              @click="useExample(item.text)"
              :title="item.text"
            )
              //- 若為歷史紀錄，加上時鐘小圖示
              lah-fa-icon.mr-1(v-if="item.type === 'history'" icon="history" size="sm" :variant="isDarkMode ? 'info' : 'primary'")
              //- 限制文字長度，避免單一按鈕過度佔用
              span.text-truncate.d-inline-block(style="max-width: 140px;") {{ item.text }}

  //- ==========================================
  //- 案件查詢語法說明 Modal
  //- ==========================================
  b-modal(
    ref="instructionModal"
    size="xl"
    title="🤖 案件查詢AI助理 - 完整使用說明"
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
    :content-class="isDarkMode ? 'bg-dark text-light border-secondary' : ''"
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
                      strong 年份智慧辨識：
                      br
                      small.text-secondary 100~130 的數字若出現在其他號碼之前，系統自動辨識為民國年（不需加「年」字）。例如 #[code 113 12500] 解析為民國 113 年、案件號 012500；後方多個號碼則各自獨立輸出。
                    li.mb-0
                      strong 案件字查無對應自動補正：
                      br
                      small.text-secondary 完全未輸入案件字，或輸入的案件字查無對應時，系統一律預設使用 #[code HA81]（桃資登），並於結果中標記警示訊息。

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
              | "幫我查113年 桃園朴子 第10號"
            hr.my-2(:class="isDarkMode ? 'border-secondary' : ''")
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ 解析為：#[code 113-H1QB-000010]

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
              | ➔ #[code 115-HA85-001200] (自動預設今年)
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ #[code 115-HA85-001300] (繼承 HA85)

        //- 範例 3
        b-col(lg="6")
          .example-block.bg-light(:class="isDarkMode ? 'bg-dark text-light border-secondary' : 'text-dark'")
            .mb-1.text-secondary.small 情境 3：純數字輸入 (多筆，自動預設 HA81)
            .font-weight-bold
              lah-fa-icon(icon="user-circle", variant="secondary").mr-2
              | "19500 13500"
            hr.my-2(:class="isDarkMode ? 'border-secondary' : ''")
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ #[code 115-HA81-019500]
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ #[code 115-HA81-013500]
              br
              span.small.text-muted.ml-4 (無案件字時預設 HA81、今年)

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

        //- 範例 5
        b-col(lg="6")
          .example-block.bg-light(:class="isDarkMode ? 'bg-dark text-light border-secondary' : 'text-dark'")
            .mb-1.text-secondary.small 情境 5：年份 + 純數字 (無案件字)
            .font-weight-bold
              lah-fa-icon(icon="user-circle", variant="secondary").mr-2
              | "113 12500"
            hr.my-2(:class="isDarkMode ? 'border-secondary' : ''")
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ #[code 113-HA81-012500]
              br
              span.small.text-muted.ml-4 (113 辨識為民國年，案件字預設 HA81)

        //- 範例 6
        b-col(lg="6")
          .example-block.bg-light(:class="isDarkMode ? 'bg-dark text-light border-secondary' : 'text-dark'")
            .mb-1.text-secondary.small 情境 6：年份 + 多個純數字 (各自獨立輸出)
            .font-weight-bold
              lah-fa-icon(icon="user-circle", variant="secondary").mr-2
              | "114 15000 1600"
            hr.my-2(:class="isDarkMode ? 'border-secondary' : ''")
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ #[code 114-HA81-015000]
            .text-success
              lah-fa-icon(icon="robot", variant="primary").mr-2
              | ➔ #[code 114-HA81-001600]
              br
              span.small.text-muted.ml-4 (兩筆共同繼承年份 114)
</template>

<script>
import _ from 'lodash';
import lahRegCaseStatusCompact from '~/components/lah-reg-case-status-compact.vue';

const MAX_MESSAGES = 100
const MAX_HISTORY = 50

export default {
  name: 'AiQueryAssistantIndex',
  components: { lahRegCaseStatusCompact },
  data () {
    // 動態計算當前民國年
    const twYear = new Date().getFullYear() - 1911

    return {
      isDarkMode: false,
      isBusy: false,
      inputText: '',
      messages: [],
      historyRecords: [],
      defaultExamples: [
        `${twYear}年 桃園古亭 10號`,
        `${twYear}年 桃壢 10號`,
        '溪桃 10號',
        'HA85 1200 1300',
        '19500 13500',
        `${twYear} 12500`
      ],
      resizeObserver: null,
      inputResizeObserver: null,

      maxVisibleExamples: 6,
      isCalculating: false,
      textSize: 'lg',
      loadingTimer: null,
      showLongLoadingText: false,

      // 💡 說明提示輪播狀態
      tipIndex: 0,
      tipTimer: null,

      // 💡 閒置跑馬燈與密技相關狀態
      showMarquee: false,
      idleTimeoutId: null,
      konamiCodeAlt: ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'b'],
      currentKonamiInput: [],
      marqueeTips: [
        '💡 提示：若未指定民國年，系統會自動預設為今年。',
        '💡 提示：支援口語化輸入，如輸入「桃園朴子」，會自動轉譯為「H1QB」。',
        '💡 提示：案件號輸入任意數字，系統會自動幫您補齊 6 碼。',
        '💡 提示：想查多筆同字號案件？直接用空白分隔號碼即可自動繼承。',
        '💡 提示：100~130 的數字若出現在其他號碼之前，系統會自動辨識為民國年。',
        `💡 範例：「${twYear}年 桃園朴子 第10號」 ➔ ${twYear}-H1QB-000010`,
        '💡 範例：「HA85 1200 1300」 ➔ 自動幫您查兩筆 HA85 的案件'
      ]
    }
  },
  computed: {
    textSizeLabel () {
      const map = { md: '中', lg: '大', xl: '特大' }
      return map[this.textSize] || '大'
    },
    // 💡 依 tipIndex 取出當前輪播提示，每 10 秒在 mounted 的 interval 中切換
    currentTip () {
      return this.marqueeTips[this.tipIndex] || ''
    },
    allExamples () {
      const list = []
      const seen = new Set()
      const MAX_ITEMS = 6

      const recentHistory = this.historyRecords.slice(0, 3)
      for (const record of recentHistory) {
        if (!seen.has(record.text) && list.length < MAX_ITEMS) {
          list.push({ text: record.text, type: 'history' })
          seen.add(record.text)
        }
      }

      if (list.length < MAX_ITEMS && this.historyRecords.length > 3) {
        const remainingHistory = this.historyRecords.slice(3)
          .map(r => r.text)
          .filter(text => !seen.has(text))

        const randomHistory = _.sampleSize(remainingHistory, MAX_ITEMS - list.length)
        for (const text of randomHistory) {
          list.push({ text, type: 'history' })
          seen.add(text)
        }
      }

      if (list.length < MAX_ITEMS) {
        const availableDefaults = this.defaultExamples.filter(text => !seen.has(text))
        const randomDefaults = _.sampleSize(availableDefaults, MAX_ITEMS - list.length)
        for (const text of randomDefaults) {
          list.push({ text, type: 'default' })
          seen.add(text)
        }
      }

      return list
    },
    displayExamples () {
      return this.allExamples.slice(0, this.maxVisibleExamples)
    },
    // 💡 將提示陣列串接成單一的長字串供跑馬燈輪播
    fullMarqueeText () {
      return this.marqueeTips.join('　　✦　　')
    }
  },
  watch: {
    historyRecords: {
      deep: true,
      handler () {
        this.calculateVisibleExamples()
      }
    }
  },
  mounted () {
    const savedTheme = localStorage.getItem('lah-theme-dark')
    if (savedTheme !== null) {
      this.isDarkMode = savedTheme === 'true'
    }

    const savedTextSize = localStorage.getItem('lah-dgx-text-size')
    if (savedTextSize && ['md', 'lg', 'xl'].includes(savedTextSize)) {
      this.textSize = savedTextSize
    } else {
      localStorage.setItem('lah-dgx-text-size', 'lg')
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
      const msgContainer = this.$refs.msgContainer
      if (msgContainer && window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          const isNearBottom = msgContainer.scrollHeight - msgContainer.scrollTop - msgContainer.clientHeight < 200
          if (isNearBottom) {
            msgContainer.scrollTop = msgContainer.scrollHeight
          }
        })
        this.resizeObserver.observe(msgContainer)
      }

      const inputWrapper = this.$refs.inputWrapper
      if (inputWrapper && window.ResizeObserver) {
        this.inputResizeObserver = new ResizeObserver(_.debounce(() => {
          this.calculateVisibleExamples()
        }, 150))
        this.inputResizeObserver.observe(inputWrapper)
      } else {
        this.calculateVisibleExamples()
      }
    })

    // 💡 掛載全域事件，用於偵測閒置與 KONAMI 密技
    window.addEventListener('mousemove', this.handleGlobalInteraction)
    window.addEventListener('keydown', this.handleGlobalInteraction)
    window.addEventListener('click', this.handleGlobalInteraction)
    window.addEventListener('touchstart', this.handleGlobalInteraction)
    window.addEventListener('scroll', this.handleGlobalInteraction)

    // 初始化閒置計時器
    this.resetIdleTimer()

    // 💡 每 10 秒輪播一則說明提示 (輸入框旁的 tip-panel)
    this.tipTimer = setInterval(() => {
      this.tipIndex = (this.tipIndex + 1) % this.marqueeTips.length
    }, 10000)
  },
  beforeDestroy () {
    if (this.resizeObserver) { this.resizeObserver.disconnect() }
    if (this.inputResizeObserver) { this.inputResizeObserver.disconnect() }
    if (this.loadingTimer) { clearTimeout(this.loadingTimer) }
    // 💡 清除說明提示輪播計時器
    if (this.tipTimer) { clearInterval(this.tipTimer) }

    // 💡 移除全域事件與計時器
    window.removeEventListener('mousemove', this.handleGlobalInteraction)
    window.removeEventListener('keydown', this.handleGlobalInteraction)
    window.removeEventListener('click', this.handleGlobalInteraction)
    window.removeEventListener('touchstart', this.handleGlobalInteraction)
    window.removeEventListener('scroll', this.handleGlobalInteraction)
    if (this.idleTimeoutId) { clearTimeout(this.idleTimeoutId) }
  },
  methods: {
    // 💡 全域互動與 KONAMI 密技偵測
    handleGlobalInteraction (e) {
      // 處理鍵盤輸入偵測 (KONAMI 密技)
      if (e.type === 'keydown') {
        const key = e.key.toLowerCase()
        this.currentKonamiInput.push(key)

        // 保持陣列長度與密技長度一致
        if (this.currentKonamiInput.length > this.konamiCodeAlt.length) {
          this.currentKonamiInput.shift()
        }

        // 檢查是否完全吻合
        if (this.currentKonamiInput.join(',') === this.konamiCodeAlt.join(',')) {
          this.currentKonamiInput = [] // 重置密技輸入
          this.$bvToast.toast('解鎖隱藏密技：顯示跑馬燈提示！', {
            title: '🎮 Konami Code',
            variant: 'success',
            solid: true,
            autoHideDelay: 3000
          })

          // 觸發密技時，強制顯示跑馬燈，並取消一般互動的隱藏效果(直到下次再移動)
          if (this.idleTimeoutId) { clearTimeout(this.idleTimeoutId) }
          this.showMarquee = true
          return // 提早結束，避免被下方的 resetIdleTimer 給隱藏
        }
      }

      // 只要有任何非密技的操作，就重置閒置計時器並隱藏跑馬燈
      this.resetIdleTimer()
    },
    // 💡 閒置計時器重置邏輯
    resetIdleTimer () {
      if (this.idleTimeoutId) { clearTimeout(this.idleTimeoutId) }
      this.showMarquee = false
      // 5分鐘 = 5 * 60 * 1000 = 300000 毫秒
      this.idleTimeoutId = setTimeout(() => {
        this.showMarquee = true
      }, 300000)
    },
    async calculateVisibleExamples () {
      if (this.isCalculating) { return }
      this.isCalculating = true

      try {
        if (this.$refs.quickExamples) {
          this.$refs.quickExamples.style.transition = 'none'
        }

        this.maxVisibleExamples = 6
        await this.$nextTick()

        await new Promise(resolve => setTimeout(resolve, 50))

        const container = this.$refs.quickExamples
        if (!container) { return }

        const availableWidth = container.clientWidth
        const children = container.children

        let currentTotalWidth = 0
        let fitCount = 0

        for (let i = 0; i < children.length; i++) {
          const child = children[i]
          const style = window.getComputedStyle(child)
          const childWidth = child.offsetWidth + parseFloat(style.marginLeft || 0) + parseFloat(style.marginRight || 0)

          currentTotalWidth += childWidth

          if (i === 0) { continue }

          if (currentTotalWidth <= availableWidth + 5) {
            fitCount++
          } else {
            break
          }
        }

        this.maxVisibleExamples = Math.max(1, fitCount)
      } finally {
        if (this.$refs.quickExamples) {
          this.$refs.quickExamples.style.transition = 'opacity 0.15s ease'
        }
        this.isCalculating = false
      }
    },
    toggleTheme () {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('lah-theme-dark', this.isDarkMode)
    },
    cycleTextSize () {
      const sizes = ['md', 'lg', 'xl']
      const currentIndex = sizes.indexOf(this.textSize)
      const nextIndex = (currentIndex + 1) % sizes.length
      this.textSize = sizes[nextIndex]
      localStorage.setItem('lah-dgx-text-size', this.textSize)
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
    useExample (text) {
      this.inputText = text
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

      // 啟動智能 Loading 計時器：超過 1000 毫秒才顯示提示框
      this.showLongLoadingText = false
      if (this.loadingTimer) { clearTimeout(this.loadingTimer) }
      this.loadingTimer = setTimeout(() => {
        this.showLongLoadingText = true
        this.scrollToBottom()
      }, 1000)

      if (this.messages.length > MAX_MESSAGES) {
        this.messages = this.messages.slice(-MAX_MESSAGES)
      }
      this.scrollToBottom()

      try {
        const apiUrl = this.$consts?.API?.JSON?.DGX || '/api/dgx_json_api.php'

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
            const rawIds = []
            parsedCases.forEach((c) => {
              if (c.year_miguo && c.case_word && c.case_no) {
                const y = String(c.year_miguo).trim()
                const w = String(c.case_word).trim()
                const n = String(c.case_no).trim().padStart(6, '0')
                rawIds.push(`${y}${w}${n}`)
              }
            })

            const uniqueCaseIds = [...new Set(rawIds)].filter(id => id.length >= 10)

            if (uniqueCaseIds.length === 0) {
              this.messages.push({
                text: '解析結果格式異常，無法產生標準字號，請檢查您的輸入內容。',
                isUser: false,
                caseIds: []
              })
              return
            }

            const aiMsg = {
              text: `已為您找到與「${userInput}」相關的 ${uniqueCaseIds.length} 筆案件資料：`,
              isUser: false,
              caseIds: []
            }
            this.messages.push(aiMsg)

            uniqueCaseIds.forEach((cId, index) => {
              setTimeout(() => {
                aiMsg.caseIds.push(cId)
                this.scrollToBottom()
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
        if (this.loadingTimer) { clearTimeout(this.loadingTimer) }
        this.showLongLoadingText = false
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
   💡 閒置跑馬燈 (Idle Marquee) 樣式
   ========================================= */
.idle-marquee-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 123, 255, 0.85); /* Bootstrap Primary */
  color: white;
  padding: 12px 0;
  z-index: 100;
  pointer-events: none; /* 允許點擊穿透，不會妨礙使用者點擊背後的卡片 */
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);

  &.theme-dark {
    background: rgba(255, 193, 7, 0.85); /* Warning for dark mode */
    color: #212529;
  }

  .marquee-text-container {
    display: inline-block;
    white-space: nowrap;
    /* CSS 硬體加速輪播，設定 45s 平滑捲動 */
    animation: marquee-scroll 45s linear infinite;
    font-size: 1.15rem;
    font-weight: bold;
    letter-spacing: 1px;
  }
}

/* 跑馬燈捲動動畫 */
@keyframes marquee-scroll {
  0% { transform: translateX(100vw); }
  100% { transform: translateX(-100%); }
}

/* 簡單的 Vue 淡入淡出過渡 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* =========================================
   歡迎畫面與動態字體
   ========================================= */
.greeting-container {
  max-width: 500px;
  width: 100%;
}

.welcome-title {
  font-size: 2rem;
  letter-spacing: 1px;
  @media (min-width: 768px) {
    font-size: 3rem;
  }
}

.title-text {
  font-size: 1.1rem;
  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
}

/* 動態字體層級 (套用於 .message-item) */
.message-item.text-size-md {
  font-size: 1rem;
  ::v-deep {
    .small, small { font-size: 0.875rem; }
    .badge { font-size: 0.75rem; padding: 0.25em 0.4em; }
  }
  .case-card { width: calc((100% - 48px) / 4); min-width: 220px; }
}

.message-item.text-size-lg {
  font-size: 1.2rem;
  ::v-deep {
    .small, small { font-size: 0.95rem; }
    .h6, h6 { font-size: 1.2rem; }
    .badge { font-size: 0.9rem; padding: 0.35em 0.5em; }
  }
  .case-card { width: calc((100% - 32px) / 3); min-width: 280px; }
}

.message-item.text-size-xl {
  font-size: 1.4rem;
  ::v-deep {
    .small, small { font-size: 1.1rem; }
    .h6, h6 { font-size: 1.4rem; }
    .badge { font-size: 1rem; padding: 0.4em 0.6em; }
  }
  .case-card { width: calc((100% - 16px) / 2); min-width: 360px; }
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
  flex: 0 0 auto;
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
  .message-item {
    .case-card {
      width: 100% !important;
      min-width: 0 !important;
    }
  }
}

.case-card-header {
  padding: 0.5em 0.75em;
  border-bottom: 1px solid #e9ecef;
}

.case-card-body {
  padding: 0.75em;
  height: 100%;
}

/* =========================================
   快捷輸入區塊 (Quick Examples) 樣式
   ========================================= */

/* 💡 三欄響應式輸入版面
   小螢幕：flex-column；大螢幕：flex-row
   各欄的 order 控制排列順序切換 */
.input-layout {
  gap: 8px;

  @media (min-width: 768px) {
    gap: 12px;
    align-items: stretch;
  }
}

/* 💡 說明提示面板
   大螢幕：固定寬度 200px，垂直置中，右側有分隔線
   小螢幕：全寬，上下有淡色邊框 */
.tip-panel {
  font-size: 0.85rem;
  line-height: 1.4;
  padding: 6px 10px;
  border-radius: 6px;

  // 小螢幕：全寬橫條，上下有細框
  border: 1px solid rgba(0, 123, 255, 0.15);
  background-color: rgba(0, 123, 255, 0.04);

  @media (min-width: 768px) {
    // 大螢幕：固定左欄寬度，改用右側分隔線
    width: 200px;
    flex-shrink: 0;
    border: none;
    border-right: 2px solid rgba(0, 123, 255, 0.18);
    border-radius: 0;
    background-color: transparent;
    padding: 4px 12px 4px 4px;
    display: flex;
    align-items: center;
  }

  .tip-text {
    // 多行文字不換行截斷，保持面板高度穩定
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  &.tip-panel--dark {
    border-color: rgba(255, 193, 7, 0.2);
    background-color: rgba(255, 193, 7, 0.04);

    @media (min-width: 768px) {
      border-color: rgba(255, 193, 7, 0.2);
      background-color: transparent;
    }
  }
}

.quick-examples {
  .quick-btn:last-child {
    margin-right: 0 !important;
  }

  .quick-btn {
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      background-color: #007bff;
      color: #fff !important;
      border-color: #007bff !important;
    }
  }
}

/* =========================================
   歷史側邊欄與說明區
   ========================================= */
.history-item {
  transition: background-color 0.2s ease;
  &:hover {
    background-color: rgba(0, 123, 255, 0.05);
  }
}

.instruction-card { border-left: 4px solid #17a2b8 !important; }
.instruction-card.border-success { border-left-color: #28a745 !important; }

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

  .form-control {
    background-color: #2b3035 !important;
    color: #f8f9fa !important;
    border-color: #495057 !important;
    &:disabled, &[readonly] {
      background-color: #212529 !important;
      opacity: 0.7;
    }
  }

  .case-card {
    border-color: #495057;
    background-color: #343a40;
  }
  .case-card-header { border-bottom-color: #495057; }

  .history-item:hover {
    background-color: rgba(255, 255, 255, 0.05) !important;
  }

  .instruction-card { background-color: #2b3035 !important; }

  .example-block {
    background-color: #2b3035 !important;
    border-color: #495057;
    border-left-color: #0d6efd;

    code {
      background-color: rgba(255, 255, 255, 0.1);
      color: #ff87c3;
    }
  }
}
</style>
