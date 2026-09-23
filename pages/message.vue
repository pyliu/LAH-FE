<template lang="pug">
div.message-admin-page
  lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
    .d-flex.align-items-center
      .my-auto.font-weight-bold.h5.mb-0 💬 即時通訊息與課室推播管理
      lah-button(
        icon="info"
        action="bounce"
        variant="outline-success"
        no-border
        no-icon-gutter
        @click="showModalById('help-modal')"
        title="功能說明"
      )
      lah-help-modal(:modal-id="'help-modal'"): ol
        li 接收端電腦需安裝 #[b.text-primary 桃園即時通程式] 並正常連線才能接收推播訊息。
        li 支援直接發送到 #[b.text-primary 課室頻道] (如 #[b.text-info 資訊課 inf]、#[b.text-info 行政課 adm]、#[b.text-info 登記課 reg]、#[b.text-info 測量課 sur]、#[b.text-info 人事室 hr]、#[b.text-info 地價課 val]、#[b.text-info 主任祕書室 supervisor]、#[b.text-danger 全所 lds])。
        li 亦可點選個別同仁頭像發送 #[b.text-success 個人私訊] (僅可送訊息給一周內有使用桃園即時通程式之同仁)。
        li 內容支援即時通自訂醒目色彩語法 (如 #[code(v-pre) {{b藍色粗體b}}]、#[code(v-pre) {{r紅色粗體r}}]、#[code(v-pre) {{g綠色粗體g}}]、#[code(v-pre) {{o橘色粗體o}}]) 及標準 Markdown 語法。
        li 歷史資料儲存於瀏覽器端，最少顯示 #[b.text-info 3] 筆，最多顯示 #[b.text-info 30] 筆 ({{ memento.length }} / {{ mementoCapacity }})。
      lah-button.ml-2(
        icon="history"
        variant="outline-primary"
        size="sm"
        pill
        @click="showModalById('message-history-modal')"
        title="開啟歷史發送紀錄視窗"
      )
        span.font-weight-bold 歷史紀錄
        b-badge.ml-1(variant="primary" pill) {{ memento.length }}
    .d-flex.align-items-center
      b-badge.mr-2(variant="success" pill)
        lah-fa-icon(icon="users").mr-1
        span 線上活躍同仁 {{ allCandidates.length }} 人
      b-badge(variant="info" pill)
        lah-fa-icon(icon="desktop").mr-1
        span 即時通擬真預覽模式

  .row.mt-2
    //- 左欄：發送訊息工作台
    .col-xl-7.col-lg-6.col-12.mb-4
      b-card(ref="addCard" border-variant="secondary" no-body).shadow-sm.studio-card
        b-card-header.bg-white.border-bottom.d-flex.justify-content-between.align-items-center.py-2
          .d-flex.align-items-center
            lah-fa-icon(icon="paper-plane" variant="primary").mr-2
            span.font-weight-bold.h5.mb-0 訊息發送工作台
          b-button-group(size="sm")
            lah-button(
              icon="paper-plane"
              :variant="sendButtonDisabled ? 'outline-primary' : 'primary'"
              :disabled="sendButtonDisabled"
              @click="add"
              pill
            ) 送出訊息
            b-dropdown(
              variant="outline-info"
              size="sm"
              right
              no-caret
              title="快速套用常用訊息範本"
            )
              template(#button-content)
                lah-fa-icon(icon="magic").mr-1
                span 範本
              b-dropdown-item(@click="applyTemplate('cron-spooler')") 🖥️ 排程維護報告 (Spooler/暫存清理)
              b-dropdown-item(@click="applyTemplate('ad-sync')") 🔄 AD 使用者同步完成報告
              b-dropdown-item(@click="applyTemplate('servlet-config')") ⚙️ 系統設定/轉送異動報告
              b-dropdown-item(@click="applyTemplate('server-reboot')") 💻 伺服器定時重啟快取清理
              b-dropdown-item(@click="applyTemplate('dept-notice')") 📢 課室即時公務通知
              b-dropdown-divider
              b-dropdown-item(@click="applyTemplate('empty')") 🧹 清空內文
            lah-button(
              icon="undo-alt"
              variant="outline-secondary"
              title="重設所有欄位及已選對象"
              @click="resetAll"
              action="cycle-alt"
              pill
            ) 清除
            lah-button(
              icon="question"
              variant="outline-success"
              title="即時通與 Markdown 語法說明"
              v-b-toggle.md-desc
              :pressed="helpSidebarFlag"
              pill
            ) 語法

        b-card-body.p-3
          //- 1. 發送目標選擇區塊 (課室頻道與同仁私訊)
          .bg-light.p-3.rounded.mb-3.border
            .d-flex.justify-content-between.align-items-center.mb-2
              .d-flex.align-items-center
                lah-fa-icon.mr-1(icon="bullseye" variant="primary")
                strong 發送目標 (課室頻道 / 同仁私訊)
                lah-fa-icon.ml-2(
                  :icon="validSendto ? 'check-circle' : 'exclamation-circle'"
                  :variant="validSendto ? 'success' : 'danger'"
                )
                span.small.text-danger.ml-1(v-if="!validSendto") (至少需選擇一個課室頻道或同仁)
              b-button-group(size="sm")
                b-button(
                  variant="outline-danger"
                  size="sm"
                  :pressed="isAllSelected"
                  @click="toggleAllOffice"
                  pill
                  title="廣播至全所同仁"
                ) 🏢 全所同仁 (lds)
                b-button(
                  variant="outline-primary"
                  size="sm"
                  :pressed="isMyselfOnly"
                  @click="selectMyself"
                  pill
                  title="僅發送給自己做測試"
                ) 🙋 我自己 (測試)
                b-button(
                  variant="outline-secondary"
                  size="sm"
                  @click="resetTargets"
                  title="清空所有已選目標"
                  pill
                ) 清空目標

            //- 課室專屬頻道快捷按鈕群
            .small.text-muted.mb-1 🏢 課室推播頻道 (點擊切換/多選，右側標籤為本週活躍同仁數)：
            .d-flex.flex-wrap.align-items-center.mb-2
              b-button.m-1(
                v-for="dept in deptList"
                :key="dept.code"
                :variant="isChannelSelected(dept.code) ? dept.variant : `outline-${dept.variant}`"
                size="sm"
                pill
                @click="toggleDeptChannel(dept.code)"
                :title="`${dept.name} 專屬推播頻道 (${dept.code})`"
              )
                lah-fa-icon(:icon="dept.icon").mr-1
                span {{ dept.name }}
                b-badge.ml-1(
                  :variant="isChannelSelected(dept.code) ? 'light' : dept.variant"
                  pill
                ) {{ deptCandidatesCount[dept.code] || 0 }}

            //- 同仁個別私訊快速展開
            .d-flex.justify-content-between.align-items-center.mt-2.pt-2.border-top
              .d-flex.align-items-center
                lah-fa-icon.mr-1(icon="user-friends" variant="info")
                span.small.font-weight-bold 個別同仁私訊 (已選 {{ selectedUsers.length }} 人)：
              b-button(
                variant="outline-info"
                size="sm"
                pill
                v-b-toggle.collapse-users-panel
              )
                lah-fa-icon(icon="address-book").mr-1
                | {{ userPanelOpen ? '收合名冊' : '展開同仁名冊選擇...' }}

            b-collapse#collapse-users-panel.mt-2(v-model="userPanelOpen")
              .bg-white.p-2.rounded.border
                .row.no-gutters.align-items-center.mb-2
                  .col-md-7.col-12.mb-1.mb-md-0
                    b-input-group(size="sm")
                      b-input-group-prepend(is-text): lah-fa-icon(icon="search")
                      b-input(
                        v-model="searchKeyword"
                        placeholder="... 姓名 / 員編 / 課室關鍵字篩選 ..."
                        trim
                      )
                      b-input-group-append(v-if="searchKeyword"): b-button(size="sm" variant="outline-secondary" @click="searchKeyword = ''") ✕
                  .col-md-5.col-12.pl-md-2
                    b-form-select(
                      v-model="userFilterDept"
                      size="sm"
                      :options="userFilterDeptOpts"
                    )

                .users-roster-scroll.overflow-auto.p-1(style="max-height: 220px;")
                  .mb-2(v-for="dept in visibleDepts" :key="`roster-dept-${dept.code}`")
                    .d-flex.align-items-center.mb-1.border-bottom.pb-1
                      strong.small.mr-1 {{ dept.name }}
                      b-badge(variant="secondary" pill) {{ (deptUsersMap[dept.code] || []).length }}
                      b-button.ml-auto(
                        variant="link"
                        size="sm"
                        class="p-0 text-muted s-80"
                        @click="toggleAllDeptUsers(dept.code)"
                      ) {{ isAllDeptUsersSelected(dept.code) ? '全消' : '全選該課' }}
                    .d-flex.flex-wrap
                      b-button.user-pill-btn.m-1(
                        v-for="user in (deptUsersMap[dept.code] || [])"
                        :key="user.id"
                        :variant="isUserSelected(user.id) ? 'success' : 'outline-secondary'"
                        size="sm"
                        pill
                        @click="toggleUser(user.id)"
                        :title="`${user.id} - ${user.name} (${user.ip})`"
                      )
                        lah-avatar(:id="user.id" size="1.1rem" ignore-system-config).mr-1
                        span.s-90 {{ (userNames && userNames[user.id]) || user.name || user.id }}

            //- 已選目標標籤匯總
            .d-flex.flex-wrap.align-items-center.mt-2.pt-2.border-top(v-if="totalSelectedCount > 0")
              span.small.font-weight-bold.text-muted.mr-1 已選擇傳送目標：
              b-badge.m-1.cursor-pointer(
                v-if="isAllSelected"
                variant="danger"
                pill
                @click="toggleAllOffice"
                title="點擊移除全所廣播"
              )
                lah-fa-icon(icon="broadcast-tower").mr-1
                | 全所同仁 (lds) ✕
              b-badge.m-1.cursor-pointer(
                v-for="code in selectedChannelsWithoutAll"
                :key="`sel-ch-${code}`"
                :variant="getDeptVariant(code)"
                pill
                @click="toggleDeptChannel(code)"
                :title="`點擊移除 ${getDeptName(code)} 頻道`"
              )
                | 🏢 {{ getDeptName(code) }} ({{ code }}) ✕
              b-badge.m-1.cursor-pointer(
                v-for="uid in selectedUsers"
                :key="`sel-usr-${uid}`"
                variant="success"
                pill
                @click="toggleUser(uid)"
                :title="`點擊移除 ${(userNames && userNames[uid]) || uid} 私訊`"
              )
                | 👤 {{ (userNames && userNames[uid]) || uid }} ✕

          //- 2. 標題/主旨輸入 (選填)
          .mb-3
            .d-flex.justify-content-between.align-items-center.mb-1
              .d-flex.align-items-center
                lah-fa-icon.mr-1(icon="heading" variant="primary")
                strong 訊息主旨 / 標題
                span.text-muted.small.ml-2 (選填，若填寫將作為訊息首行標題)
              b-badge(variant="light" pill) {{ (dataJson.title || '').length }} 字
            b-input-group(size="sm")
              b-input(
                v-model="dataJson.title"
                placeholder="例如：【排程維護】伺服器定時維護通知"
                trim
                @focus="lastFocusedField = 'title'"
              )
            .d-flex.align-items-center.flex-wrap.mt-1.small
              span.text-muted.mr-1 常用主旨標籤：
              b-badge.cursor-pointer.mr-1.mb-1(
                v-for="tag in titlePrefixes"
                :key="tag"
                variant="light"
                @click="insertTitlePrefix(tag)"
              ) {{ tag }}

          //- 3. 訊息內文編輯與即時通工具列
          .mb-2
            .d-flex.justify-content-between.align-items-center.mb-1
              .d-flex.align-items-center
                lah-fa-icon.mr-1(icon="comment-dots" variant="primary")
                strong 訊息內容 #[span.text-danger *]
                span.text-muted.small.ml-2 (支援即時通色彩標籤及 Markdown 語法)
              lah-button(
                v-if="dataJson.content"
                icon="times"
                variant="outline-secondary"
                size="sm"
                no-border
                @click="dataJson.content = ''"
                title="清空內容"
              ) 清空

            //- 編輯工具列 (Toolbar)
            .editor-toolbar.d-flex.flex-wrap.align-items-center.p-1.bg-light.rounded-top.border
              //- 即時通專用醒目色標籤
              b-button-group(size="sm").mr-2.mb-1
                b-button(variant="white" size="sm" @click="insertColorTag('b')" title="即時通醒目語法：藍色粗體")
                  span(v-pre style="color: #0056b3; font-weight: bold;") {{b 藍字 b}}
                b-button(variant="white" size="sm" @click="insertColorTag('r')" title="即時通醒目語法：紅色粗體")
                  span(v-pre style="color: #dc3545; font-weight: bold;") {{r 紅字 r}}
                b-button(variant="white" size="sm" @click="insertColorTag('g')" title="即時通醒目語法：綠色粗體")
                  span(v-pre style="color: #28a745; font-weight: bold;") {{g 綠字 g}}
                b-button(variant="white" size="sm" @click="insertColorTag('o')" title="即時通醒目語法：橘色粗體")
                  span(v-pre style="color: #e67e22; font-weight: bold;") {{o 橘字 o}}

              //- Markdown 標題與樣式
              b-button-group(size="sm").mr-2.mb-1
                b-button(variant="white" size="sm" @click="insertFormat('**', '**', '粗體文字')" title="粗體")
                  strong B
                b-button(variant="white" size="sm" @click="insertFormat('*', '*', '斜體文字')" title="斜體")
                  em I
                b-button(variant="white" size="sm" @click="insertFormat('# ', '', '最大文字')" title="第一標題") H1
                b-button(variant="white" size="sm" @click="insertFormat('## ', '', '次大文字')" title="第二標題") H2
                b-button(variant="white" size="sm" @click="insertFormat('- ', '', '清單項目')" title="項目符號")
                  lah-fa-icon(icon="list-ul")
                b-button(variant="white" size="sm" @click="insertFormat('• ', '', '圓點項目')" title="圓點符號") •
                b-button(variant="white" size="sm" @click="insertDivider" title="分隔線") ―

              //- 狀態與 Emoji 快捷盤
              b-button-group(size="sm").mb-1
                b-button(variant="white" size="sm" @click="insertText('✅ ')" title="成功打勾") ✅
                b-button(variant="white" size="sm" @click="insertText('❌ ')" title="失敗打叉") ❌
                b-button(variant="white" size="sm" @click="insertText('🧹 ')" title="清理暫存") 🧹
                b-button(variant="white" size="sm" @click="insertText('🖥️ ')" title="伺服器") 🖥️
                b-button(variant="white" size="sm" @click="insertText('🔄 ')" title="同步") 🔄
                b-button(variant="white" size="sm" @click="insertText('👤 ')" title="人員") 👤
                b-button(variant="white" size="sm" @click="insertText('📅 ')" title="日期") 📅
                b-button(variant="white" size="sm" @click="insertText('⚡ ')" title="閃電") ⚡
                b-button(variant="white" size="sm" @click="insertText('⚠️ ')" title="警示") ⚠️
                b-button(variant="white" size="sm" @click="insertText('📢 ')" title="廣播通知") 📢
                b-button(variant="white" size="sm" @click="insertTimeRange" title="時間區間範例 (自動醒目)") 08:00~09:00

            //- 編輯 Textarea
            b-textarea(
              ref="contentTextarea"
              v-model="dataJson.content"
              rows="6"
              max-rows="20"
              :state="validContent"
              placeholder="... 支援即時通醒目色彩、Markdown 語法與剪貼簿截圖 (Ctrl + V) ..."
              @paste="pasteImage($event, addImage)"
              @focus="lastFocusedField = 'content'"
              style="border-top-left-radius: 0; border-top-right-radius: 0;"
            )

            .d-flex.justify-content-between.align-items-center.mt-1.small
              span.text-muted 提示：可直接於文字框按下 #[kbd Ctrl + V] 貼上剪貼簿圖片
              span.text-muted 內文字數：{{ (dataJson.content || '').length }} 字

          //- 4. 附加圖片展示區
          .mb-3(v-if="images.length > 0")
            .d-flex.align-items-center.mb-1
              lah-fa-icon(icon="paperclip" variant="primary").mr-1
              strong 附加截圖 ({{ images.length }} 張)
              span.text-muted.small.ml-2 (點擊圖片可刪除)
            .d-flex.flex-wrap.align-items-center
              transition-group(name="listY" mode="out-in")
                b-img.memento.m-1(
                  v-for="(base64data, idx) in images"
                  :key="`imgAttached_${idx}`"
                  :src="base64data"
                  @click="removeImage(base64data)"
                  thumbnail
                  fluid
                  v-b-tooltip="'點擊刪除這張圖片'"
                  style="width: 120px; height: 80px; object-fit: cover;"
                )

          //- 5. 大號送出按鈕
          .text-center.mt-3
            lah-button(
              icon="paper-plane"
              action="move-fade-ltr"
              size="lg"
              :variant="sendButtonDisabled ? 'outline-primary' : 'primary'"
              :disabled="sendButtonDisabled"
              @click="add"
              pill
            )
              span.font-weight-bold 送出即時訊息至 {{ effectiveTargetSummary }}

    //- 右欄：「桃園即時通」擬真視窗預覽
    .col-xl-5.col-lg-6.col-12.mb-4
      .d-flex.justify-content-between.align-items-center.mb-2(style="max-width: 490px; margin: 0 auto;")
        .font-weight-bold
          lah-fa-icon(icon="desktop" variant="success").mr-1
          span 桃園即時通 Client 接收畫面預覽
        b-badge(variant="secondary" pill) 490 × 796 擬真預覽
      .messenger-window-container.shadow-sm.rounded.overflow-hidden.border
        //- 擬真視窗標題列
        .messenger-titlebar.d-flex.justify-content-between.align-items-center.px-3.py-2.bg-white.border-bottom
          .d-flex.align-items-center
            span.status-dot.online.mr-2
            span.font-weight-bold.small {{ ip }} / {{ myinfo.name || '劉邦渝' }} / {{ myinfo.unit || '資訊課' }}
          .window-controls.d-flex.align-items-center
            span.win-ctrl-btn ―
            span.win-ctrl-btn.mx-2 □
            span.win-ctrl-btn.close-btn ✕

        //- 擬真頁籤列 (公告 / 通知 / 私訊 / 選單)
        .messenger-tabs.d-flex.align-items-center.border-bottom.bg-white
          .messenger-tab.d-flex.align-items-center.justify-content-center
            span.mr-1 📢
            span 公告
          .messenger-tab.d-flex.align-items-center.justify-content-center(:class="{ active: isChannelMode }")
            span.mr-1 💬
            span 通知
          .messenger-tab.d-flex.align-items-center.justify-content-center(:class="{ active: isPrivateMode }")
            span.mr-1 ✉️
            span 私訊
          .messenger-tab.menu-tab.ml-auto.d-flex.align-items-center.justify-content-center
            lah-fa-icon(icon="bars")

        //- 擬真頻道標題列 (返回鍵 + 課室名稱 + 成員頭像群)
        .messenger-channel-header.d-flex.justify-content-between.align-items-center.px-3.py-2.bg-white.border-bottom
          .d-flex.align-items-center
            b-button.back-circle-btn.p-0.mr-2(variant="secondary" size="sm" pill)
              lah-fa-icon(icon="arrow-left")
            span.font-weight-bold {{ targetChannelDisplayName }}
          //- 該課室成員頭像群
          .channel-member-avatars.d-flex.align-items-center
            b-avatar.member-stack-avatar(
              v-for="(member, idx) in targetActiveAvatars.slice(0, 7)"
              :key="`top-avatar-${member.id}-${idx}`"
              :src="getAvatarSrc(member.id)"
              size="1.6rem"
              :title="`${(userNames && userNames[member.id]) || member.name} (${member.id})`"
            )
            span.small.text-muted.ml-1(v-if="targetActiveAvatars.length > 7") +{{ targetActiveAvatars.length - 7 }}

        //- 擬真對話訊息視窗主體
        .messenger-chat-body.p-3
          //- 擬真日期膠囊
          .text-center.mb-3
            span.date-pill 📅 {{ currentDateStr }}

          //- 發送者本人對話氣泡 (綠色卡片，靠右對齊)
          .d-flex.justify-content-end.mb-2
            .outgoing-chat-bubble.shadow-sm
              //- 標題 (若有輸入)
              .bubble-title.font-weight-bold.mb-1(v-if="dataJson.title")
                | {{ dataJson.title }}
              //- 內文預覽 (解析 {{b}}、{{r}}、時間醒目與 Markdown)
              client-only
                .bubble-content(v-html="renderedPreview")
              //- 附加截圖縮圖
              .bubble-images.d-flex.flex-wrap.mt-2(v-if="images.length > 0")
                b-img.m-1.rounded(
                  v-for="(img, idx) in images"
                  :key="`preview-img-${idx}`"
                  :src="img"
                  style="max-width: 140px; max-height: 100px; object-fit: cover;"
                )
              //- 右下角操作圖示與時間
              .bubble-meta.d-flex.align-items-center.justify-content-end.mt-1
                span.bubble-action.text-danger.mr-1(title="移除") ❌
                span.bubble-action.text-primary.mr-2(title="編輯") ✏️
                span.bubble-time [今日] {{ currentTimeStr }}

        //- 擬真底部輸入列
        .messenger-input-sim.p-2.bg-white.border-top
          .d-flex.align-items-center.sim-input-box.p-2.rounded.border
            span.sim-placeholder.text-muted.small.mr-auto |... Ctrl + V 可貼上剪貼簿的截圖 ...
            lah-fa-icon(icon="paper-plane" variant="primary").sim-icon.mr-2
            span.sim-icon.mr-2 😃
            lah-fa-icon(icon="image" variant="success").sim-icon

        //- 擬真底部狀態列
        .messenger-statusbar.d-flex.justify-content-between.align-items-center.px-3.py-1.bg-light.border-top.small.text-muted
          .d-flex.align-items-center.overflow-hidden.text-truncate
            lah-fa-icon(icon="info-circle" variant="info").mr-1
            span.text-truncate 已更新 {{ myid || 'HA10013859' }} 目前 channel 到 {{ targetChannelCode }} ...
          .d-flex.align-items-center.text-nowrap.ml-2
            span.mr-1 v1.4.6
            lah-fa-icon(icon="question-circle" variant="success")

      //- 折疊卡片：我的收件歷史 (lah-chat)
      b-card.mt-3.shadow-sm(no-body)
        b-card-header.bg-white.py-2.d-flex.justify-content-between.align-items-center(
          v-b-toggle.collapse-my-chat
          role="button"
        )
          .d-flex.align-items-center
            lah-fa-icon(icon="inbox" variant="primary").mr-2
            strong 我的個人收件箱訊息 ({{ myid }})
          lah-fa-icon(icon="chevron-down")
        b-collapse#collapse-my-chat
          b-card-body.p-2
            client-only
              lah-chat.m-1(:channel="myid" :limit="10")

  //- 歷史發送紀錄彈出視窗
  b-modal#message-history-modal(
    size="xl"
    scrollable
    hide-footer
    header-class="py-2 px-3 border-bottom"
    body-class="p-3 bg-light"
  )
    template(#modal-header="{ close }")
      .d-flex.justify-content-between.align-items-center.w-100
        .d-flex.align-items-center
          lah-fa-icon(icon="history" variant="primary").mr-2
          span.h5.font-weight-bold.mb-0 歷史發送紀錄
          b-badge.ml-2(variant="primary" pill) {{ memento.length }} 筆
        .d-flex.align-items-center
          b-input-group.mr-3(size="sm" prepend="顯示筆數"): b-input(
            type="number"
            min="3"
            max="30"
            v-model.number="mementoCount"
            style="width: 70px;"
          )
          b-btn-close(@click="close()")
    .p-1
      .text-center.py-5.text-muted.bg-white.rounded.border(v-if="memento.length === 0")
        lah-fa-icon(icon="inbox" size="2x").mb-2.d-block
        div 目前尚無歷史發送紀錄
      .row(v-else)
        .col-xl-4.col-md-6.col-12.mb-3(v-for="(snapshot, idx) in mementoList" :key="`hist_${idx}`")
          b-card.h-100.shadow-sm.hist-card(no-body)
            b-card-header.bg-white.py-2.d-flex.justify-content-between.align-items-center
              .d-flex.align-items-center.overflow-hidden.text-truncate
                b-badge.mr-2(:variant="getPriorityBadgeVariant(snapshot.priority)" pill)
                  | P{{ snapshot.priority || 3 }}
                lah-fa-icon(icon="clock").mr-1.text-muted
                span.small.text-muted {{ snapshot.create_datetime || '歷史訊息' }}
              b-button-group(size="sm")
                b-button(
                  variant="primary"
                  size="sm"
                  @click="copy(snapshot)"
                  title="載入此歷史內容至工作台"
                )
                  lah-fa-icon(icon="copy").mr-1
                  | 載入
                b-button(
                  variant="outline-danger"
                  size="sm"
                  @click="remove(snapshot)"
                  title="自頻道撤回/刪除此篇內容"
                )
                  lah-fa-icon(icon="trash-alt").mr-1
                  | 撤回
            b-card-body.p-3
              //- 目標標籤
              .mb-2.d-flex.flex-wrap
                b-badge.mr-1.mb-1(
                  v-for="ch in (snapshot.channels || [])"
                  :key="`hist-ch-${ch}`"
                  :variant="getDeptVariant(ch)"
                  pill
                ) {{ getChannelDisplayName(ch) }}
              //- 主旨
              .font-weight-bold.mb-1(v-if="snapshot.title")
                | {{ snapshot.title }}
              //- 內文預覽
              client-only
                .hist-content-preview(v-html="renderHistoryHtml(snapshot.content)")

  //- 側欄：Markdown 簡易說明
  b-sidebar#md-desc(
    v-model="helpSidebarFlag"
    title="即時通與排版語法說明"
    right
    shadow
  )
    .p-3
      b-card.mb-3(no-body)
        b-card-header.font-weight-bold.bg-light 1. 桃園即時通專用醒目色彩 (使用雙大括號標籤)
        b-card-body.p-2.small
          div.mb-1
            code(v-pre) {{b藍色粗體顯示b}}
            span.ml-2 ☞ #[span(style="color: #0056b3; font-weight: bold;") 藍色粗體顯示]
          div.mb-1
            code(v-pre) {{r紅色粗體顯示r}}
            span.ml-2 ☞ #[span(style="color: #dc3545; font-weight: bold;") 紅色粗體顯示]
          div.mb-1
            code(v-pre) {{g綠色粗體顯示g}}
            span.ml-2 ☞ #[span(style="color: #28a745; font-weight: bold;") 綠色粗體顯示]
          div.mb-1
            code(v-pre) {{o橘色粗體顯示o}}
            span.ml-2 ☞ #[span(style="color: #e67e22; font-weight: bold;") 橘色粗體顯示]

      b-card.mb-3(no-body)
        b-card-header.font-weight-bold.bg-light 2. 日期/時間區間自動醒目
        b-card-body.p-2.small
          div.mb-1
            code 08:00~09:00
            span.ml-2 ☞ #[strong(style="color: #0056b3;") 08:00~09:00]
          div.mb-1
            code 6/30~7/1
            span.ml-2 ☞ #[strong(style="color: #0056b3; text-decoration: underline;") 6/30~7/1]

      b-card.mb-3(no-body)
        b-card-header.font-weight-bold.bg-light 3. 標題與樣式 (需於行首輸入)
        b-card-body.p-2.small
          div.mb-1
            code # 第一標題
            span.ml-2 (最大文字)
          div.mb-1
            code ## 第二標題
            span.ml-2 (次大文字)
          div.mb-1
            code ### 第三標題
          hr.my-2
          div.mb-1
            code **我是粗體**
            span.ml-2 ☞ #[strong 我是粗體]
          div.mb-1
            code *我是斜體*
            span.ml-2 ☞ #[em 我是斜體]
          div.mb-1
            code ---
            span.ml-2 ☞ 分隔水平線
          div.mb-1
            code - 清單項目
            span.ml-2 ☞ 項目符號清單
          div.mb-1
            code 1. 第一項
            span.ml-2 ☞ 編號清單

      b-card(no-body)
        b-card-header.font-weight-bold.bg-light 4. 課室頻道代碼對應表
        b-card-body.p-2.small
          table.table.table-sm.table-bordered.mb-0
            thead
              tr
                th 課室名稱
                th 頻道代碼
            tbody
              tr(v-for="dept in deptList" :key="`tbl-${dept.code}`")
                td {{ dept.name }}
                td: code {{ dept.code }}
              tr
                td 全所同仁
                td: code lds
              tr
                td 我自己 (測試)
                td: code myself
</template>

<script>
const DEPT_CHANNELS = [
  { code: 'inf', name: '資訊課', icon: 'laptop-code', variant: 'primary', desc: '資訊課專屬推播頻道' },
  { code: 'adm', name: '行政課', icon: 'file-signature', variant: 'info', desc: '行政課專屬推播頻道' },
  { code: 'reg', name: '登記課', icon: 'stamp', variant: 'success', desc: '登記課專屬推播頻道' },
  { code: 'sur', name: '測量課', icon: 'ruler-combined', variant: 'warning', desc: '測量課專屬推播頻道' },
  { code: 'hr', name: '人事室', icon: 'id-card', variant: 'secondary', desc: '人事室專屬推播頻道' },
  { code: 'val', name: '地價課', icon: 'chart-line', variant: 'danger', desc: '地價課專屬推播頻道' },
  { code: 'supervisor', name: '主任祕書室', icon: 'user-tie', variant: 'dark', desc: '主任祕書室專屬推播頻道' },
  { code: 'acc', name: '會計室', icon: 'calculator', variant: 'secondary', desc: '會計室專屬推播頻道' }
]

export default {
  data: () => ({
    dataJson: {
      title: '',
      content: '',
      priority: 3,
      sender: '',
      id: '?',
      create_datetime: ''
    },
    helpSidebarFlag: false,
    userPanelOpen: false,
    selectedChannels: ['inf'],
    selectedUsers: [],
    searchKeyword: '',
    userFilterDept: 'all',
    candidatesEntries: [],
    images: [],
    memento: [],
    mementoCapacity: 30,
    mementoCount: 3,
    cacheKey: 'message_postMementoCache',
    lastFocusedField: 'content',
    titlePrefixes: [
      '【排程維護】',
      '【系統通知】',
      '【公務提醒】',
      '【重要通知】',
      '【教育訓練】',
      '【停機公告】'
    ],
    currentTimeTick: ''
  }),
  fetchOnServer: false,
  fetch () {
    this.$axios.post(this.$consts.API.JSON.IP, {
      type: 'dynamic_ip_entries',
      offset: 604800
    }).then(({ data }) => {
      if (this.$utils.statusCheck(data.status)) {
        const list = []
        data.raw.sort((a, b) => {
          if (a.timestamp < b.timestamp) { return 1 }
          if (a.timestamp > b.timestamp) { return -1 }
          return 0
        }).forEach((entry) => {
          if (!list.find(item => item.id === entry.entry_id)) {
            list.push(this.packEntryData(entry))
          }
        })
        this.candidatesEntries = list
      } else {
        this.$utils.warn(data.message)
      }
    }).catch((err) => {
      this.$utils.error(err)
    })
  },
  head: {
    title: '即時通訊息與課室推播管理'
  },
  computed: {
    deptList () {
      return DEPT_CHANNELS
    },
    allCandidates () {
      return this.candidatesEntries
    },
    deptCandidatesCount () {
      const counts = {}
      DEPT_CHANNELS.forEach((dept) => {
        counts[dept.code] = this.candidatesEntries.filter(e => e.dept === dept.code).length
      })
      return counts
    },
    isAllSelected () {
      return this.selectedChannels.includes('lds') || this.selectedChannels.includes('all')
    },
    isMyselfOnly () {
      return this.selectedChannels.length === 1 && this.selectedChannels[0] === 'myself' && this.selectedUsers.length === 0
    },
    selectedChannelsWithoutAll () {
      return this.selectedChannels.filter(c => c !== 'lds' && c !== 'all')
    },
    totalSelectedCount () {
      return (this.isAllSelected ? 1 : this.selectedChannels.length) + this.selectedUsers.length
    },
    validSendto () {
      return this.totalSelectedCount > 0
    },
    validContent () {
      return !this.$utils.empty(this.dataJson.content) || this.images.length > 0
    },
    sendButtonDisabled () {
      return !this.validContent || !this.validSendto || this.isBusy
    },
    mementoCountCacheKey () {
      return `${this.cacheKey}_count`
    },
    mementoList () {
      return this.memento.slice(0, this.mementoCount)
    },
    isChannelMode () {
      return this.isAllSelected || this.selectedChannels.some(c => c !== 'myself')
    },
    isPrivateMode () {
      return !this.isChannelMode
    },
    effectiveChannels () {
      if (this.isAllSelected) { return ['lds'] }
      const list = [...this.selectedChannels, ...this.selectedUsers]
      if (list.length === 0) {
        return [this.myid || 'myself']
      }
      return list
    },
    effectiveTargetSummary () {
      if (this.isAllSelected) { return '全所同仁' }
      if (this.isMyselfOnly) { return '我自己 (測試)' }
      const labels = []
      this.selectedChannels.forEach((code) => {
        labels.push(this.getDeptName(code))
      })
      if (this.selectedUsers.length > 0) {
        labels.push(`${this.selectedUsers.length} 位同仁`)
      }
      return labels.join('、') || '選定對象'
    },
    targetChannelDisplayName () {
      if (this.isAllSelected) { return '全事務所 (全所頻道)' }
      if (this.isMyselfOnly) { return '我自己 (個人私訊測試)' }
      if (this.selectedChannels.length === 1 && this.selectedUsers.length === 0) {
        return this.getDeptName(this.selectedChannels[0])
      }
      if (this.selectedChannels.length === 0 && this.selectedUsers.length === 1) {
        const uid = this.selectedUsers[0]
        return `${(this.userNames && this.userNames[uid]) || uid} (個人私訊)`
      }
      return `多重目標 (${this.totalSelectedCount} 個頻道/同仁)`
    },
    targetChannelCode () {
      if (this.isAllSelected) { return 'lds' }
      if (this.isMyselfOnly) { return this.myid || 'myself' }
      if (this.selectedChannels.length > 0) {
        return this.selectedChannels.join(', ')
      }
      if (this.selectedUsers.length > 0) {
        return this.selectedUsers.join(', ')
      }
      return 'inf'
    },
    targetActiveAvatars () {
      if (this.isAllSelected) {
        return this.allCandidates
      }
      if (this.selectedChannels.length === 1 && this.selectedUsers.length === 0) {
        const code = this.selectedChannels[0]
        return this.allCandidates.filter(e => e.dept === code)
      }
      if (this.selectedUsers.length > 0) {
        return this.allCandidates.filter(e => this.selectedUsers.includes(e.id))
      }
      return this.allCandidates.filter(e => e.dept === 'inf')
    },
    userFilterDeptOpts () {
      return [
        { value: 'all', text: '全部課室' },
        ...DEPT_CHANNELS.map(d => ({ value: d.code, text: d.name }))
      ]
    },
    deptUsersMap () {
      const map = {}
      const kw = (this.searchKeyword || '').trim().toLowerCase()
      DEPT_CHANNELS.forEach((dept) => {
        map[dept.code] = this.candidatesEntries.filter((e) => {
          if (e.dept !== dept.code) { return false }
          if (!kw) { return true }
          const userName = (this.userNames && this.userNames[e.id]) || e.name || ''
          return e.id.toLowerCase().includes(kw) || userName.toLowerCase().includes(kw) || (e.ip || '').includes(kw)
        })
      })
      return map
    },
    visibleDepts () {
      if (this.userFilterDept === 'all') {
        return DEPT_CHANNELS
      }
      return DEPT_CHANNELS.filter(d => d.code === this.userFilterDept)
    },
    currentDateStr () {
      return this.$utils?.today ? this.$utils.today() : '2026-09-23'
    },
    currentTimeStr () {
      return this.currentTimeTick || (this.$utils?.time ? this.$utils.time() : '16:58:00')
    },
    renderedPreview () {
      if (!this.dataJson.content) {
        return '<span class="text-muted font-italic">（尚未輸入訊息內文，請於左側輸入內容或套用範本...）</span>'
      }
      if (process.server) { return '' }
      const formatted = this.formatCustomTags(this.dataJson.content)
      return this.$utils?.convertMarkd ? this.$utils.convertMarkd(formatted) : formatted
    }
  },
  watch: {
    mementoCount (val) {
      this.setCache(this.mementoCountCacheKey, val)
      this.restoreCachedMemento()
    }
  },
  async created () {
    this.dataJson.create_datetime = this.$utils.now()
    this.currentTimeTick = this.$utils.time()
    this.mementoCount = await this.getCache(this.mementoCountCacheKey) || 3
    this.restoreCachedMemento()
  },
  mounted () {
    this.timer = setInterval(() => {
      this.currentTimeTick = this.$utils.time()
    }, 1000)
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {
    normalizeDeptCode (deptStr) {
      if (!deptStr) { return 'other' }
      const s = deptStr.trim()
      switch (s) {
        case 'inf':
        case '資訊課':
          return 'inf'
        case 'adm':
        case '行政課':
          return 'adm'
        case 'reg':
        case '登記課':
          return 'reg'
        case 'sur':
        case '測量課':
          return 'sur'
        case 'hr':
        case '人事室':
          return 'hr'
        case 'val':
        case '地價課':
          return 'val'
        case 'supervisor':
        case '主任秘書室':
        case '主任祕書室':
          return 'supervisor'
        case 'acc':
        case '會計室':
          return 'acc'
        default:
          return s
      }
    },
    packEntryData (entry) {
      const parts = (entry.note || '').trim().split(' ')
      const rawDept = parts.length > 1 ? parts[1] : (parts[0] || '')
      return {
        ip: entry.ip,
        id: entry.entry_id,
        name: entry.entry_desc,
        rawDept,
        dept: this.normalizeDeptCode(rawDept)
      }
    },
    getDeptName (code) {
      switch (code) {
        case 'inf': return '資訊課'
        case 'adm': return '行政課'
        case 'reg': return '登記課'
        case 'sur': return '測量課'
        case 'hr': return '人事室'
        case 'val': return '地價課'
        case 'supervisor': return '主任祕書室'
        case 'acc': return '會計室'
        case 'lds':
        case 'all': return '全所同仁'
        case 'myself': return '我自己'
        default: return (this.userNames && this.userNames[code]) || code
      }
    },
    getDeptVariant (code) {
      const found = DEPT_CHANNELS.find(d => d.code === code)
      if (found) { return found.variant }
      if (code === 'lds' || code === 'all') { return 'danger' }
      if (code === 'myself') { return 'primary' }
      return 'secondary'
    },
    getPriorityBadgeVariant (priority) {
      const p = parseInt(priority)
      switch (p) {
        case 0: return 'danger'
        case 1: return 'warning'
        case 2: return 'info'
        case 3:
        default: return 'secondary'
      }
    },
    getChannelDisplayName (ch) {
      return this.getDeptName(ch)
    },
    getAvatarSrc (id) {
      return `${this.apiQueryUrl}/get_user_img.php?id=${id}_avatar&name=${id}_avatar`
    },
    isChannelSelected (code) {
      return this.selectedChannels.includes(code)
    },
    isUserSelected (id) {
      return this.selectedUsers.includes(id)
    },
    isAllDeptUsersSelected (deptCode) {
      const users = this.deptUsersMap[deptCode] || []
      if (users.length === 0) { return false }
      return users.every(u => this.selectedUsers.includes(u.id))
    },
    toggleAllDeptUsers (deptCode) {
      const users = this.deptUsersMap[deptCode] || []
      if (this.isAllDeptUsersSelected(deptCode)) {
        const uids = users.map(u => u.id)
        this.selectedUsers = this.selectedUsers.filter(id => !uids.includes(id))
      } else {
        users.forEach((u) => {
          if (!this.selectedUsers.includes(u.id)) {
            this.selectedUsers.push(u.id)
          }
        })
        this.selectedChannels = this.selectedChannels.filter(c => c !== 'lds' && c !== 'all' && c !== 'myself')
      }
    },
    toggleDeptChannel (code) {
      this.selectedChannels = this.selectedChannels.filter(c => c !== 'lds' && c !== 'all' && c !== 'myself')
      const idx = this.selectedChannels.indexOf(code)
      if (idx > -1) {
        this.selectedChannels.splice(idx, 1)
      } else {
        this.selectedChannels.push(code)
      }
    },
    toggleAllOffice () {
      if (this.isAllSelected) {
        this.selectedChannels = []
      } else {
        this.selectedChannels = ['lds']
        this.selectedUsers = []
      }
    },
    selectMyself () {
      this.selectedChannels = ['myself']
      this.selectedUsers = []
    },
    toggleUser (id) {
      this.selectedChannels = this.selectedChannels.filter(c => c !== 'lds' && c !== 'all' && c !== 'myself')
      const idx = this.selectedUsers.indexOf(id)
      if (idx > -1) {
        this.selectedUsers.splice(idx, 1)
      } else {
        this.selectedUsers.push(id)
      }
    },
    resetTargets () {
      this.selectedChannels = []
      this.selectedUsers = []
    },
    resetAll () {
      this.resetTargets()
      this.dataJson.title = ''
      this.dataJson.content = ''
      this.images = []
    },
    formatCustomTags (content) {
      if (!content) { return '' }
      let text = content
      // 自訂醒目顏色：{{b...b}}, {{r...r}}, {{g...g}}, {{o...o}}
      text = text.replace(/\{\{b([\s\S]*?)b\}\}/g, '<span style="color: #0056b3; font-weight: bold;">$1</span>')
      text = text.replace(/\{\{r([\s\S]*?)r\}\}/g, '<span style="color: #dc3545; font-weight: bold;">$1</span>')
      text = text.replace(/\{\{g([\s\S]*?)g\}\}/g, '<span style="color: #28a745; font-weight: bold;">$1</span>')
      text = text.replace(/\{\{o([\s\S]*?)o\}\}/g, '<span style="color: #e67e22; font-weight: bold;">$1</span>')
      // 日期與時間區間自動醒目
      text = text.replace(/\b(\d{1,2}:\d{2}(?:~\d{1,2}:\d{2})?)\b/g, '<span style="color: #0056b3; font-weight: bold;">$1</span>')
      text = text.replace(/\b(\d{1,4}[-/]\d{1,2}[-/]\d{1,2}(?:~\d{1,4}[-/]\d{1,2}[-/]\d{1,2})?)\b/g, '<span style="color: #0056b3; font-weight: bold;">$1</span>')
      return text
    },
    renderHistoryHtml (content) {
      if (!content || process.server) { return '' }
      const formatted = this.formatCustomTags(content)
      return this.$utils?.convertMarkd ? this.$utils.convertMarkd(formatted) : formatted
    },
    insertColorTag (type) {
      const map = {
        b: { before: '{{b', after: 'b}}', text: '藍色粗體' },
        r: { before: '{{r', after: 'r}}', text: '紅色粗體' },
        g: { before: '{{g', after: 'g}}', text: '綠色粗體' },
        o: { before: '{{o', after: 'o}}', text: '橘色粗體' }
      }
      const item = map[type] || map.b
      this.insertFormat(item.before, item.after, item.text)
    },
    insertFormat (before, after, placeholder = '') {
      const textarea = this.$refs.contentTextarea?.$el || this.$refs.contentTextarea
      const content = this.dataJson.content || ''
      if (!textarea) {
        this.dataJson.content = content + before + placeholder + after
        return
      }
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const selected = content.substring(start, end) || placeholder
      const replacement = before + selected + after
      this.dataJson.content = content.substring(0, start) + replacement + content.substring(end)
      this.$nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
      })
    },
    insertText (text) {
      const textarea = this.$refs.contentTextarea?.$el || this.$refs.contentTextarea
      const content = this.dataJson.content || ''
      if (!textarea) {
        this.dataJson.content = content + text
        return
      }
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      this.dataJson.content = content.substring(0, start) + text + content.substring(end)
      this.$nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + text.length, start + text.length)
      })
    },
    insertDivider () {
      this.insertText('\n---\n')
    },
    insertTimeRange () {
      this.insertText('08:00~09:00')
    },
    insertTitlePrefix (prefix) {
      if (!this.dataJson.title) {
        this.dataJson.title = prefix
      } else if (!this.dataJson.title.startsWith(prefix)) {
        this.dataJson.title = prefix + this.dataJson.title
      }
    },
    applyTemplate (tpl) {
      switch (tpl) {
        case 'cron-spooler':
          this.dataJson.title = '【系統排程】伺服器排程維護報告'
          this.dataJson.content = '系統已順利執行排程維護 (Cron 排程)。\n✅ Spooler 服務已安全重置\n🧹 共清理了 2 個過期暫存檔'
          break
        case 'ad-sync':
          this.dataJson.title = '【系統排程】AD 使用者同步完成報告'
          this.dataJson.content = `智慧控管系統 👤 AD 使用者同步完成報告：\n• 新增人員: 0\n• 姓名更新: 0\n• 設為離職: 0\n• 跳過(無異動): 138\n• 處理失敗: 0\n\n同步時間: {{b${this.$utils.now()}b}}`
          break
        case 'servlet-config':
          this.dataJson.title = '【系統維護】WEB 版整合系統轉送修改'
          this.dataJson.content = 'WEB 版整合系統「測量」\nSERVLET 轉送 SYSTEM.CFG 修改\n• 205、206、208、161 ✅\n• 118、60、207、62、162 ❌'
          break
        case 'server-reboot':
          this.dataJson.title = '【每日維護】土地參考資訊檔伺服器維護完成'
          this.dataJson.content = '土地參考資訊檔伺服器已完成每日定時重啟與快取清理作業。'
          break
        case 'dept-notice':
          this.dataJson.title = '【公務通知】課室即時公務注意事項'
          this.dataJson.content = '【{{b課室公務即時通知b}}】\n各位同仁好：\n請於今日 {{o17:00 前o}} 完成相關系統作業。\n若有任何操作問題，請聯繫資訊課分機 {{b112b}}。\n感謝各位同仁配合！'
          break
        case 'empty':
          this.dataJson.title = ''
          this.dataJson.content = ''
          this.images = []
          break
      }
    },
    addImage (base64) {
      if (!this.images.includes(base64)) {
        this.images.push(base64)
      }
    },
    removeImage (base64data) {
      const index = this.images.indexOf(base64data)
      if (index > -1) {
        this.images.splice(index, 1)
      }
    },
    async restoreCachedMemento () {
      const cached = await this.getCache(this.cacheKey)
      if (cached) {
        this.memento = [...cached]
      }
      if (this.memento.length > this.mementoCount) {
        this.memento.splice(0, this.memento.length - this.mementoCount)
      }
    },
    addMemento (snapshot) {
      this.memento.unshift(snapshot)
      if (this.memento.length > this.mementoCapacity) {
        this.memento.splice(this.mementoCapacity)
      }
      this.setCache(this.cacheKey, this.memento)
    },
    copy (snapshot) {
      this.selectedChannels = []
      this.selectedUsers = []
      if (Array.isArray(snapshot.channels)) {
        snapshot.channels.forEach((ch) => {
          if (DEPT_CHANNELS.some(d => d.code === ch) || ch === 'all' || ch === 'myself') {
            this.selectedChannels.push(ch)
          } else {
            this.selectedUsers.push(ch)
          }
        })
      }
      this.dataJson.title = snapshot.title || ''
      this.dataJson.content = snapshot.content || ''
      this.dataJson.priority = snapshot.priority || 3
      this.hideModalById('message-history-modal')
      const el = this.$refs.addCard?.$el || this.$refs.addCard
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        setTimeout(() => this.attention(el), 400)
      }
    },
    remove (snapshot) {
      if (Array.isArray(snapshot.added_to)) {
        const channelData = snapshot.added_to.map(added => ({
          channel: added.channel,
          id: added.addedId
        }))
        this.requestDBRemove(channelData, () => this.removeMemento(snapshot))
      } else {
        this.$utils.warn('這個 snapshot 裡沒有 added_to 屬性資料。', snapshot)
        this.removeMemento(snapshot)
      }
    },
    removeMemento (snapshot) {
      const idx = this.memento.findIndex(item => this.$utils.equal(item, snapshot))
      if (idx > -1) {
        this.memento.splice(idx, 1)
        this.setCache(this.cacheKey, this.memento)
      }
    },
    requestDBRemove (array, cb = undefined) {
      if (Array.isArray(array)) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
          type: 'remove_notification',
          message_type: 'message',
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
      this.confirm(`確定要發送訊息至「${this.effectiveTargetSummary}」?`).then((flag) => {
        if (flag) {
          this.isBusy = true
          let finalContent = this.dataJson.content || ''
          this.images.forEach((img) => {
            if (!finalContent.includes(img)) {
              finalContent += `\n\n![圖片](${img})`
            }
          })
          const snapshot = {
            channels: this.effectiveChannels,
            from_ip: this.ip,
            title: this.dataJson.title || '即時通訊息',
            content: finalContent,
            priority: this.dataJson.priority,
            sender: this.myid || this.ip,
            create_datetime: this.$utils.now()
          }
          this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
            type: 'add_notification',
            ...snapshot
          }).then(({ data }) => {
            this.notify(data.message, { type: data.status > 0 ? 'success' : 'warning' })
            if (data.status > 0) {
              snapshot.added_to = data.added
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.addMemento(snapshot)
            this.resetAll()
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.message-admin-page {
  .studio-card {
    border-radius: 8px;
  }
}

.editor-toolbar {
  gap: 4px;
  border-bottom: none;
}

.user-pill-btn {
  font-size: 0.85rem;
  padding: 0.15rem 0.5rem;
}

/* 桃園即時通擬真視窗樣式 (實際 Client 規格 490px * 796px) */
.messenger-window-container {
  width: 490px;
  max-width: 100%;
  height: 796px;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #c9d2db;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.messenger-titlebar {
  background: #fbfbfb;
  user-select: none;
  .status-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    &.online {
      background-color: #28a745;
      box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
    }
  }
  .win-ctrl-btn {
    font-size: 0.8rem;
    color: #6c757d;
    cursor: default;
    &:hover {
      color: #343a40;
    }
    &.close-btn:hover {
      color: #dc3545;
    }
  }
}

.messenger-tabs {
  background: #ffffff;
  .messenger-tab {
    flex: 1;
    padding: 8px 12px;
    font-size: 0.9rem;
    color: #495057;
    cursor: default;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    &.active {
      color: #007bff;
      font-weight: bold;
      border-bottom: 2px solid #007bff;
      background: #f8faff;
    }
    &.menu-tab {
      flex: 0 0 45px;
      color: #6c757d;
    }
  }
}

.messenger-channel-header {
  background: #ffffff;
  .back-circle-btn {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }
  .member-stack-avatar {
    margin-left: -6px;
    border: 2px solid #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
}

.messenger-chat-body {
  flex: 1;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
  background-color: #f1f3f6;

  .date-pill {
    display: inline-block;
    padding: 3px 14px;
    background: #e4e7eb;
    color: #495057;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .outgoing-chat-bubble {
    background-color: #e2f7cb;
    color: #1f2937;
    border-radius: 14px 14px 2px 14px;
    padding: 10px 14px;
    max-width: 90%;
    word-break: break-word;
    border: 1px solid #d0ecc0;

    .bubble-title {
      font-size: 0.95rem;
      color: #1b4332;
      border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
      padding-bottom: 4px;
    }

    .bubble-content {
      font-size: 0.92rem;
      line-height: 1.5;
      ::v-deep p {
        margin-bottom: 0.35rem;
        &:last-child {
          margin-bottom: 0;
        }
      }
      ::v-deep ul, ::v-deep ol {
        padding-left: 1.2rem;
        margin-bottom: 0.35rem;
      }
    }

    .bubble-meta {
      font-size: 0.75rem;
      color: #6c757d;
      user-select: none;
      .bubble-action {
        cursor: pointer;
        opacity: 0.8;
        &:hover {
          opacity: 1;
        }
      }
    }
  }
}

.messenger-input-sim {
  .sim-input-box {
    background: #fdfdfd;
    cursor: text;
  }
  .sim-icon {
    font-size: 1rem;
    cursor: pointer;
    opacity: 0.75;
    &:hover {
      opacity: 1;
    }
  }
}

.messenger-statusbar {
  user-select: none;
  font-size: 0.75rem;
}

.memento:hover {
  border: 2px dashed #dc3545;
  cursor: pointer;
}

.memento-count-input {
  max-width: 140px;
}

.hist-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.08) !important;
  }
  .hist-content-preview {
    font-size: 0.88rem;
    max-height: 100px;
    overflow: hidden;
    color: #495057;
  }
}
</style>
