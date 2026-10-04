<template lang="pug">
div.message-admin-page
  lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
    .d-flex.align-items-center
      .my-auto.font-weight-bold.h3.mb-0 即時通訊息 💬
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
      lah-button.ml-2(
        icon="inbox"
        variant="outline-primary"
        size="sm"
        pill
        @click="openSidebarInbox()"
        title="直接開啟即時通側邊欄私訊"
      )
        span.font-weight-bold 個人收件箱
    .d-flex.align-items-center
      b-badge.mr-2(variant="success" pill)
        lah-fa-icon(icon="users").mr-1
        span 近一周活躍 {{ allCandidates.length }} 人

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
            b-dropdown.mx-1(
              variant="outline-info"
              size="sm"
              right
              no-caret
              title="快速套用常用訊息範本"
            )
              template(#button-content)
                lah-fa-icon(icon="magic").mr-1
                span 範本
              b-dropdown-item(@click="applyTemplate('duty-closing')") 🚪 每日值勤關全所大門公告
              b-dropdown-item(@click="applyTemplate('dept-notice')") 📢 課室即時公務注意事項
              b-dropdown-item(@click="applyTemplate('case-coordination')") 📑 跨課業務會辦／案件協調
              b-dropdown-item(@click="applyTemplate('counter-support')") 💁 櫃檯輪值代理／支援通知
              b-dropdown-item(@click="applyTemplate('dept-meeting')") 👥 課室會議／業務研討通知
              b-dropdown-item(@click="applyTemplate('sys-maintenance')") 🛠️ 整合系統維護／存檔提醒
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
            lah-button.ml-1(
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
                ) 🏢 全所同仁
                b-button.mx-1(
                  v-if="userdept"
                  :variant="isMyDeptSelected ? myDeptVariant : `outline-${myDeptVariant}`"
                  size="sm"
                  :pressed="isMyDeptSelected"
                  @click="toggleMyDept"
                  pill
                  :title="`發送至所屬課室 (${myDeptName})`"
                )
                  lah-fa-icon(:icon="myDeptIcon").mr-1
                  span {{ myDeptName }}
                  b-badge.ml-1(
                    v-if="deptCandidatesCount[userdept]"
                    :variant="isMyDeptSelected ? 'light' : myDeptVariant"
                    pill
                  ) {{ deptCandidatesCount[userdept] }}
                b-button.mr-1(
                  variant="outline-primary"
                  size="sm"
                  :pressed="isMyselfOnly"
                  @click="selectMyself"
                  pill
                  title="僅發送給自己做測試"
                ) 🙋 我自己
                b-button(
                  variant="outline-secondary"
                  size="sm"
                  @click="resetTargets"
                  title="清空所有已選目標"
                  pill
                ) 清空目標

            //- 課室專屬頻道快捷按鈕群 (僅管理者顯示)
            .dept-channels-panel(v-if="isNotifyMgtStaff")
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

          //- 3. 內容編輯與 Markdown 工具列
          .mb-2
            .d-flex.justify-content-between.align-items-center.mb-1
              .d-flex.align-items-center
                lah-fa-icon.mr-1(icon="edit" variant="primary")
                strong 訊息內容 #[span.text-danger *]
                span.text-muted.small.ml-2 (支援 Markdown 與 HTML 顏色標籤)
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
              b-button-group(size="sm").mr-2.mb-1
                b-button(variant="white" size="sm" @click="insertFormat('**', '**', '粗體文字')" title="粗體")
                  strong B
                b-button(variant="white" size="sm" @click="insertFormat('*', '*', '斜體文字')" title="斜體")
                  em I
                b-button(variant="white" size="sm" @click="insertBlueText" title="深藍重點 (同即時通截圖樣式)")
                  span(style="color: #0056b3; font-weight: bold;") 藍字
                b-button(variant="white" size="sm" @click="insertRedText" title="紅色警示")
                  span(style="color: #dc3545; font-weight: bold;") 紅字
                b-button(variant="white" size="sm" @click="insertGreenText" :title="'綠色重點 (支援 HTML 或 {{g語法g}})'")
                  span(style="color: #28a745; font-weight: bold;") 綠字
                b-button(variant="white" size="sm" @click="insertOrangeText" :title="'橘色提醒 (支援 HTML 或 {{o語法o}})'")
                  span(style="color: #e67e22; font-weight: bold;") 橘字

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
                b-button(variant="white" size="sm" @click="pickAttachment" title="附加檔案")
                  lah-fa-icon(icon="paperclip")
                input(
                  ref="fileInput"
                  type="file"
                  multiple
                  style="display: none"
                  @change="handleFileChange"
                )

            //- 常用 Emoji 快捷盤
            .emoji-palette.d-flex.align-items-center.flex-wrap.p-1.bg-white.border-left.border-right
              span.small.text-muted.mr-1.ml-1 常用表情：
              span.emoji-item(
                v-for="emoji in commonEmojis"
                :key="emoji"
                @click="insertEmoji(emoji)"
                :title="`插入 ${emoji}`"
              ) {{ emoji }}

            //- 編輯 Textarea
            b-textarea.overflow-auto.content-textarea(
              ref="contentTextarea"
              v-model="dataJson.content"
              rows="8"
              max-rows="20"
              :state="validContent"
              placeholder="支援 Markdown 與顏色標籤，可直接按 Ctrl + V 貼上截圖，例如：\n各位同仁好 😎\n明日為【第四梯次】環境教育訓練...\n請參加同仁於 <font color=\"#0056b3\"><b>7時45分</b></font> 準時集合！"
              @paste="pasteImage($event, addImage)"
              @focus="lastFocusedField = 'content'"
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

          //- 5. 附加檔案展示區
          .mb-3(v-if="uploadFiles.length > 0")
            .d-flex.align-items-center.mb-1
              lah-fa-icon(icon="paperclip" variant="info").mr-1
              strong 附加檔案 ({{ uploadFiles.length }} 個)
              span.text-muted.small.ml-2 (點擊 X 可移除)
            .d-flex.flex-wrap.align-items-center
              b-badge.mr-1.mb-1.p-2(
                v-for="(f, fIdx) in uploadFiles"
                :key="`msg_file_${fIdx}`"
                variant="info"
              )
                lah-fa-icon(icon="paperclip").mr-1
                span {{ f.name }} ({{ formatFileSize(f.size) }})
                b-icon.ml-2(icon="x-circle" style="cursor: pointer;" @click="removeUploadFile(fIdx)")

          //- 6. 大號送出按鈕
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
              span.font-weight-bold 送出訊息至 {{ effectiveTargetSummary }}

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
              //- 內文預覽 (解析 {{b}}、{{r}}、時間醒目、Markdown 與附加截圖)
              client-only
                .bubble-content(v-html="renderedPreview")
              //- 附加檔案預覽
              .bubble-attachments.mt-2.pt-1.border-top(v-if="uploadFiles.length > 0")
                .small.font-weight-bold.text-muted.mb-1
                  lah-fa-icon(icon="paperclip").mr-1
                  span 附加檔案 ({{ uploadFiles.length }})
                .d-flex.flex-wrap
                  b-badge.mr-1.mb-1.p-1(
                    v-for="(att, aIdx) in uploadFiles"
                    :key="`bubble_att_${aIdx}`"
                    variant="light"
                    class="border text-dark"
                  )
                    lah-fa-icon(icon="file").mr-1
                    span {{ att.name }} ({{ formatFileSize(att.size) }})
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
              //- 附加檔案預覽
              .small.text-muted.mt-2.pt-1.border-top(v-if="snapshot.attachments && snapshot.attachments.length > 0")
                lah-fa-icon(icon="paperclip").mr-1
                span 附加檔案 ({{ snapshot.attachments.length }})
                .d-flex.flex-wrap.mt-1
                  b-badge.mr-1.mb-1.p-1(
                    v-for="(att, aIdx) in snapshot.attachments"
                    :key="`hist_att_${aIdx}`"
                    variant="light"
                    class="border text-dark"
                  ) {{ att.name }} ({{ formatFileSize(att.size) }})

  //- 側欄：Markdown 簡易說明
  b-sidebar#md-desc(
    v-model="helpSidebarFlag"
    title="即時通與排版語法說明"
    right
    shadow
  )
    .p-3
      b-card.mb-3(no-body)
        b-card-header.font-weight-bold.bg-light 1. 桃園即時通專用醒目色彩 (使用雙大括號或 HTML 標籤)
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
          hr.my-2
          div.mb-1
            code &lt;font color="#0056b3"&gt;&lt;b&gt;藍色重點&lt;/b&gt;&lt;/font&gt;
            span.ml-2 ☞ #[span(style="color: #0056b3; font-weight: bold;") 藍色重點]
          div.mb-1
            code &lt;font color="#dc3545"&gt;&lt;b&gt;紅色警示&lt;/b&gt;&lt;/font&gt;
            span.ml-2 ☞ #[span(style="color: #dc3545; font-weight: bold;") 紅色警示]
          div.mb-1
            code &lt;font color="#28a745"&gt;&lt;b&gt;綠色重點&lt;/b&gt;&lt;/font&gt;
            span.ml-2 ☞ #[span(style="color: #28a745; font-weight: bold;") 綠色重點]
          div.mb-1
            code &lt;font color="#e67e22"&gt;&lt;b&gt;橘色提醒&lt;/b&gt;&lt;/font&gt;
            span.ml-2 ☞ #[span(style="color: #e67e22; font-weight: bold;") 橘色提醒]

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
          div.mb-1
            code - [ ] 待辦事項
            span.ml-2 ☞ 待辦清單
          div.mb-1
            code &gt; 引用說明
            span.ml-2 ☞ 引用區塊
          div.mb-1
            code [文字描述](網址)
            span.ml-2 ☞ 超連結

      b-card(no-body)
        b-card-header.font-weight-bold.bg-light 4. 課室頻道代碼對應表
        b-card-body.p-2.small
          table.table.table-sm.table-bordered.mb-0
            thead
              tr
                th 課室名稱
                th 頻道代碼
            tbody
              tr(v-for="dept in allDeptList" :key="`tbl-${dept.code}`")
                td {{ dept.name }}
                td: code {{ dept.code }}
              tr
                td 全所同仁
                td: code lds
              tr
                td 我自己 (測試)
                td: code {{ userid || '個人 ID' }}
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'

const DEPT_CHANNELS = [
  { code: 'inf', name: '資訊課', icon: 'laptop-code', variant: 'primary', desc: '資訊課專屬推播頻道' },
  { code: 'adm', name: '行政課', icon: 'file-signature', variant: 'info', desc: '行政課專屬推播頻道' },
  { code: 'reg', name: '登記課', icon: 'stamp', variant: 'success', desc: '登記課專屬推播頻道' },
  { code: 'sur', name: '測量課', icon: 'ruler-combined', variant: 'warning', desc: '測量課專屬推播頻道' },
  { code: 'hr', name: '人事室', icon: 'id-card', variant: 'secondary', desc: '人事室專屬推播頻道' },
  { code: 'val', name: '地價課', icon: 'chart-line', variant: 'danger', desc: '地價課專屬推播頻道' },
  { code: 'supervisor', name: '主任祕書室', icon: 'user-tie', variant: 'dark', desc: '主任祕書室專屬推播頻道' },
  { code: 'acc', name: '會計室', icon: 'calculator', variant: 'secondary', desc: '會計室專屬推播頻道' },
  { code: 'lds', name: '全所同仁', icon: 'building', variant: 'danger', desc: '全所同仁專屬推播頻道' }
]

export default {
  mixins: [lahMessengerBase],
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
    selectedChannels: [],
    selectedUsers: [],
    searchKeyword: '',
    userFilterDept: 'all',
    candidatesEntries: [],
    images: [],
    uploadFiles: [],
    memento: [],
    mementoCapacity: 30,
    mementoCount: 3,
    cacheKey: 'message_postMementoCache',
    lastFocusedField: 'content',
    commonEmojis: [
      '🐻', '❄️', '⚡', '😎', '🌂', '💙', '📢', '📌', '⚠️', '🚨',
      '💡', '⏰', '📅', '🍱', '☕', '🚌', '👍', '👏', '🎉', '✅',
      '❌', '👉', '🔹', '⭐'
    ],
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
    title: '即時通訊息'
  },
  computed: {
    userid () {
      return (this.myid || this.user?.id || '').toUpperCase()
    },
    isNotifyMgtStaff () {
      return !!(this.authority?.isNotifyMgtStaff || this.authority?.isAdmin)
    },
    userdept () {
      const unit = this.myinfo?.unit || this.user?.unit || ''
      return this.normalizeDeptCode(unit)
    },
    myDeptObj () {
      return DEPT_CHANNELS.find(d => d.code === this.userdept) || null
    },
    myDeptName () {
      return this.myDeptObj?.name || (this.user?.unit || this.myinfo?.unit || '我的課室')
    },
    myDeptVariant () {
      return this.myDeptObj?.variant || 'info'
    },
    myDeptIcon () {
      return this.myDeptObj?.icon || 'building'
    },
    isMyDeptSelected () {
      return Boolean(this.userdept && this.selectedChannels.includes(this.userdept))
    },
    deptList () {
      return DEPT_CHANNELS.filter(dept => this.isChannelAllowed(dept.code))
    },
    allDeptList () {
      return DEPT_CHANNELS.filter(d => d.code !== 'lds')
    },
    allCandidates () {
      return this.candidatesEntries
    },
    deptCandidatesCount () {
      const counts = {}
      DEPT_CHANNELS.forEach((dept) => {
        if (dept.code === 'lds') {
          counts[dept.code] = this.candidatesEntries.length
        } else {
          counts[dept.code] = this.candidatesEntries.filter(e => e.dept === dept.code).length
        }
      })
      return counts
    },
    isAllSelected () {
      return this.selectedChannels.includes('lds') || this.selectedChannels.includes('all')
    },
    isMyselfOnly () {
      if (this.selectedChannels.length === 0 && this.selectedUsers.length === 1 && this.selectedUsers[0] === this.userid) {
        return true
      }
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
      return !this.$utils.empty(this.dataJson.content) || this.images.length > 0 || this.uploadFiles.length > 0
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
      if (this.isMyselfOnly) { return [this.userid] }
      const list = [...this.selectedChannels, ...this.selectedUsers]
      if (list.length === 0) {
        return [this.userid]
      }
      return list.map(c => (c === 'myself' ? this.userid : c)).filter(Boolean)
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
      if (this.isMyselfOnly) { return `我自己 (${this.userid || '個人私訊測試'})` }
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
      if (this.isMyselfOnly) { return this.userid }
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
      if (this.isMyselfOnly) {
        const found = this.allCandidates.find(e => e.id === this.userid)
        return found ? [found] : [{ id: this.userid, name: this.myname || this.userid, dept: this.userdept || 'inf' }]
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
    mergedContent () {
      let content = this.dataJson.content || ''
      if (this.images.length > 0) {
        const notIncluded = this.images.filter(img => !content.includes(img))
        if (notIncluded.length > 0) {
          const imgMd = notIncluded.map((img, idx) => `![附加截圖-${idx + 1}](${img})`).join('\n\n')
          content = content ? `${content}\n\n${imgMd}` : imgMd
        }
      }
      return content
    },
    renderedPreview () {
      if (!this.dataJson.content && this.images.length === 0) {
        return '<span class="text-muted font-italic">（尚未輸入訊息內文，請於左側輸入內容或套用範本...）</span>'
      }
      if (process.server) { return '' }
      const formatted = this.formatCustomTags(this.mergedContent)
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
    if (!this.isNotifyMgtStaff) {
      this.selectedChannels = [this.userdept || 'lds']
    } else if (this.userdept) {
      this.selectedChannels = [this.userdept]
    } else {
      this.selectedChannels = ['inf']
    }
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {
    refreshInbox () {
      this.$refs.inboxChat?.$fetch && this.$refs.inboxChat.$fetch()
    },
    openSidebarInbox (closeModal) {
      if (typeof closeModal === 'function') {
        closeModal()
      } else {
        this.hideModalById('message-inbox-modal')
      }
      this.$store.commit('currentChannel', this.userid)
      this.$store.commit('resetUnread', this.userid)
      this.$root.$emit('open-messenger-sidebar', this.userid)
      this.$root.$emit('bv::show::sidebar', 'lah-messenger-sidebar')
    },
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
        case '秘書室':
        case '主任室':
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
      const base = this.apiQueryUrl || (process.client ? `http://${location.hostname}` : 'http://220.1.34.75')
      return `${base}/get_user_img.php?id=${id}_avatar&name=${id}_avatar`
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
    isChannelAllowed (code) {
      if (!code) { return false }
      if (this.isNotifyMgtStaff) {
        return true
      }
      if (code === 'lds' || code === 'all') {
        return true
      }
      return Boolean(this.userdept && code === this.userdept)
    },
    toggleMyDept () {
      if (!this.userdept) {
        this.warning && this.warning('無法判斷您所屬的課室')
        return
      }
      this.toggleDeptChannel(this.userdept)
    },
    toggleDeptChannel (code) {
      if (!this.isChannelAllowed(code)) {
        this.warning && this.warning(`您沒有權限傳送至「${this.getDeptName(code)}」課室頻道`)
        return
      }
      if (code === 'lds' || code === 'all') {
        return this.toggleAllOffice()
      }
      if (this.isMyselfOnly) {
        this.selectedUsers = []
      }
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
      if (this.isMyselfOnly) {
        this.selectedUsers = []
        this.selectedChannels = []
      } else {
        this.selectedChannels = []
        this.selectedUsers = [this.userid]
      }
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
      this.uploadFiles = []
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
    insertFormat (prefix, suffix = '', defaultText = '') {
      const textarea = this.$refs.contentTextarea?.$el || this.$refs.contentTextarea
      if (!textarea) {
        this.dataJson.content = `${this.dataJson.content || ''}${prefix}${defaultText}${suffix}`
        return
      }
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const oldText = this.dataJson.content || ''
      const selected = oldText.substring(start, end)
      const replaceText = selected ? `${prefix}${selected}${suffix}` : `${prefix}${defaultText}${suffix}`
      this.dataJson.content = oldText.substring(0, start) + replaceText + oldText.substring(end)
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
    insertGreenText () {
      this.insertFormat('<font color="#28a745"><b>', '</b></font>', '綠色重點')
    },
    insertOrangeText () {
      this.insertFormat('<font color="#e67e22"><b>', '</b></font>', '橘色提醒')
    },
    insertDivider () {
      this.insertFormat('\n---\n', '', '')
    },
    insertLink () {
      this.insertFormat('[連結名稱](', ')', 'https://')
    },
    insertEmoji (emoji) {
      if (this.lastFocusedField === 'title') {
        this.dataJson.title = (this.dataJson.title || '') + emoji
      } else {
        this.insertFormat(emoji, '', '')
      }
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
    insertText (text) {
      this.insertFormat(text, '', '')
    },
    insertTimeRange () {
      this.insertFormat('08:00~09:00', '', '')
    },
    insertTitlePrefix (prefix) {
      if (!this.dataJson.title) {
        this.dataJson.title = prefix
      } else if (!this.dataJson.title.startsWith(prefix)) {
        this.dataJson.title = prefix + this.dataJson.title
      }
    },
    applyTemplate (tpl) {
      if (tpl !== 'empty') {
        this.selectedChannels = []
        this.selectedUsers = [this.userid]
      }
      switch (tpl) {
        case 'duty-closing': {
          const dept = this.user?.unit || this.myinfo?.unit || '值勤課室'
          const name = this.user?.name || this.myname || '值勤同仁'
          const ext = this.user?.ext ? `分機${this.user.ext}` : '分機'
          this.dataJson.title = '【值勤公告】今日關閉全所大門'
          this.dataJson.content = `今日六點關全所如需借鑰匙請洽${dept}${name}${ext} 謝謝`
          break
        }
        case 'dept-notice':
          this.dataJson.title = '【公務通知】課室即時公務注意事項'
          this.dataJson.content = '【{{b課室公務即時通知b}}】\n各位同仁好：\n請於今日 {{o17:00 前o}} 完成相關作業。\n若有任何操作問題，請聯繫分機 {{b分機號碼b}}。\n感謝各位同仁配合！'
          break
        case 'case-coordination':
          this.dataJson.title = '【業務協調】案件會辦／會審通知'
          this.dataJson.content = '各位同仁好：\n本課有案件需跨課會辦／協調，案號：【{{b請輸入收件年字號b}}】。\n相關卷宗資料已送交，麻煩請協助處理，謝謝！'
          break
        case 'counter-support':
          this.dataJson.title = '【櫃檯業務】櫃檯輪值代理／支援通知'
          this.dataJson.content = '各位同仁好：\n今日【{{o12:00~13:30o}}】午休時段櫃檯業務由【{{b代理同仁姓名b}}】支援代理。\n若有急件或臨櫃民眾洽詢，請撥分機【{{b請填分機b}}】，感謝配合！'
          break
        case 'dept-meeting':
          this.dataJson.title = '【會議通知】課務會議／業務研討'
          this.dataJson.content = '各位同仁好：\n預計於今日【{{b15:30b}}】在【{{b第二會議室b}}】召開課務會議。\n請相關同仁準時出席，謝謝！'
          break
        case 'sys-maintenance':
          this.dataJson.title = '【系統維護】主機／整合系統維護作業'
          this.dataJson.content = '各位同仁請注意：\n預計於【{{o今日 17:30o}}】進行主機及地政整合系統維護作業。\n屆時將暫停系統連線服務，請同仁提前存檔並登出系統，謝謝！'
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
    pickAttachment () {
      this.$refs.fileInput && this.$refs.fileInput.click()
    },
    handleFileChange (e) {
      const files = Array.from(e.target?.files || [])
      if (!files.length) { return }
      files.forEach((file) => {
        if (!this.uploadFiles.some(f => f.name === file.name && f.size === file.size)) {
          this.uploadFiles.push(file)
        }
      })
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
    },
    removeUploadFile (index) {
      if (index >= 0 && index < this.uploadFiles.length) {
        this.uploadFiles.splice(index, 1)
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
          if (DEPT_CHANNELS.some(d => d.code === ch) || ch === 'all') {
            if (this.isChannelAllowed(ch)) {
              this.selectedChannels.push(ch)
            }
          } else if (ch === 'myself') {
            this.selectedUsers.push(this.userid)
          } else {
            this.selectedUsers.push(ch)
          }
        })
      }
      if (this.selectedChannels.length === 0 && this.selectedUsers.length === 0) {
        this.selectedChannels = [this.userdept || 'lds']
      }
      this.dataJson.title = snapshot.title || ''
      this.dataJson.content = snapshot.content || ''
      this.dataJson.priority = snapshot.priority || 3
      this.uploadFiles = []
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
      if (!this.isNotifyMgtStaff) {
        const disallowed = this.selectedChannels.find(ch => !this.isChannelAllowed(ch))
        if (disallowed) {
          this.warning && this.warning(`您沒有權限傳送訊息至「${this.getDeptName(disallowed)}」課室頻道`)
          return
        }
      }
      this.confirm(`確定要發送訊息至「${this.effectiveTargetSummary}」?`).then(async (flag) => {
        if (flag) {
          this.isBusy = true
          const finalContent = this.mergedContent
          const snapshot = {
            channels: this.effectiveChannels,
            from_ip: this.ip,
            title: this.dataJson.title || '即時通訊息',
            content: finalContent,
            priority: this.dataJson.priority,
            sender: this.myid || this.ip,
            attachments: this.uploadFiles.map(f => ({ name: f.name, size: f.size })),
            create_datetime: this.$utils.now()
          }
          try {
            const { data } = await this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
              type: 'add_notification',
              ...snapshot
            })
            this.notify(data.message, { type: data.status > 0 ? 'success' : 'warning' })
            if (data.status > 0) {
              snapshot.added_to = data.added
              if (this.uploadFiles && this.uploadFiles.length > 0 && Array.isArray(data.added)) {
                let uploadCount = 0
                for (const added of data.added) {
                  if (!added.channel || !added.addedId) {
                    this.$utils.warn && this.$utils.warn('新增頻道回傳之 ID 無效，略過上傳附件:', added)
                    continue
                  }
                  for (const file of this.uploadFiles) {
                    try {
                      await this.uploadAttachment(added.channel, added.addedId, file)
                      uploadCount++
                    } catch (e) {
                      this.$utils.error('上傳附件失敗:', e)
                      this.notify(`上傳附件 ${file.name} 至頻道 ${added.channel} 失敗: ${e.message}`, { type: 'danger' })
                    }
                  }
                }
                if (uploadCount > 0) {
                  this.notify(`已完成 ${uploadCount} 個附件上傳`, { type: 'success' })
                }
              }
            }
          } catch (err) {
            this.alert(err.message)
            this.$utils.error(err)
          } finally {
            this.isBusy = false
            this.addMemento(snapshot)
            this.resetAll()
          }
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
  overflow-x: hidden;
  background-color: #f1f3f6;

  ::v-deep img {
    max-width: 100% !important;
    height: auto !important;
    object-fit: contain;
  }

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
    overflow: hidden;

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
      ::v-deep img {
        max-width: 100% !important;
        height: auto !important;
        border-radius: 6px;
        display: block;
        margin: 6px auto;
        object-fit: contain;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
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
