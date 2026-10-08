<template lang="pug">
.lah-reg-case-detail(v-if="!$utils.empty(bakedData)")
  //- 1. 頂部案件核心概要橫幅
  .case-header-banner.p-3.mb-3.rounded.border.bg-white.shadow-sm
    .d-flex.flex-wrap.justify-content-between.align-items-center
      .d-flex.flex-wrap.align-items-center.mb-2.mb-md-0
        .h5.mb-0.font-weight-bold {{ displayCaseId }}
        lah-button.ml-2.p-1.border-0(
          icon="copy"
          variant="outline-secondary"
          size="sm"
          @click="copyToClipboard(displayCaseId, '已複製收件字號')"
          title="複製收件字號"
          no-gutter
          pill
        )
        lah-button.mx-1.p-1.border-0(
          icon="file-lines"
          variant="outline-info"
          size="sm"
          @click="quickCopyCaseText"
          title="一鍵複製全案 TXT 文字檔"
          no-gutter
          pill
        )
        //- 狀態徽章列
        .badges-wrap.d-flex.flex-wrap.align-items-center
          b-badge.mr-1.mb-1(v-if="hasValue(bakedData.登記原因)" variant="primary" pill) {{ bakedData.登記原因 }}
          b-badge.mr-1.mb-1(v-if="!isClosed && hasValue(bakedData.辦理情形)" :variant="statusBadgeVariant" pill) {{ bakedData.辦理情形 }}
          b-badge.mr-1.mb-1(:variant="isClosed ? 'success' : 'secondary'" pill) {{ isClosed ? '已結案' : '辦理中' }}
          b-badge.mr-1.mb-1(v-if="!isClosed" :variant="dueStatusVariant" pill :title="`限辦期限：${bakedData.限辦期限}`")
            lah-fa-icon(:icon="dueStatusIcon" class="mr-1")
            | {{ dueStatusText }}
          b-badge.mr-1.mb-1(v-if="bakedData.跨所 === 'Y'" variant="dark" pill)
            | 跨所 ({{ bakedData.資料收件所 }} ➔ {{ bakedData.資料管轄所 }})

      //- 快捷動作按鈕列
      b-button-group
        lah-button.mr-1.mb-1(
          icon="external-link-alt"
          variant="outline-primary"
          size="sm"
          :href="queryDataUrl"
          target="_blank"
          title="開啟 WebAP 收件資料 (CCD0103)"
        ) 收件資料
        lah-button.mr-1.mb-1(
          icon="external-link-alt"
          variant="outline-info"
          size="sm"
          :href="queryStatusUrl"
          target="_blank"
          title="開啟 WebAP 辦理情形 (CCD0202)"
        ) 辦理情形
        lah-button.mr-1.mb-1(
          icon="paper-plane"
          v-if="haveCellNumber"
          variant="outline-success"
          size="sm"
          @click="openQuickSmsModal"
          title="發送案件簡訊通知"
        ) 發送簡訊
        lah-button.mr-1.mb-1(
          icon="comments"
          v-if="haveCellNumber"
          variant="outline-secondary"
          size="sm"
          @click="popupSMSLog(bakedData.手機號碼)"
          title="查詢此號碼歷史簡訊紀錄"
        ) 簡訊紀錄
        lah-button.mr-1.mb-1(
          icon="file-lines"
          variant="outline-dark"
          size="sm"
          @click="openCaseTextModal"
          title="案件資料文字檔預覽與匯出"
        ) 文字匯出
        lah-button.mb-1(
          icon="sync-alt"
          size="sm"
          variant="outline-secondary"
          :busy="isBusy"
          @click="refreshData"
          title="重新整理案件資料"
        )

  //- 2. 案件流程進度步進條 (Workflow Stepper)
  .case-stepper-card.card.border-0.shadow-sm.mb-3
    .card-body.p-3
      .stepper-container
        .stepper-steps
          .stepper-step(
            v-for="(st, idx) in workflowSteps"
            :key="idx"
            :class="{ 'step-done': st.isDone, 'step-active': st.isCurrent, 'step-pending': !st.isDone && !st.isCurrent }"
          )
            .step-connector(v-if="idx > 0" :class="{ 'connector-done': st.isDone || st.isCurrent }")
            .step-node-wrapper
              .step-node
                lah-fa-icon(v-if="st.isDone" icon="check")
                span(v-else) {{ idx + 1 }}
              .step-content
                .step-title.font-weight-bold {{ st.title }}
                .step-operator(v-if="st.operator")
                  b-button.btn-operator(
                    variant="link"
                    size="sm"
                    @click="userinfo(st.operator, st.operatorId)"
                    :title="`檢視同仁資訊：${st.operator}`"
                  )
                    lah-avatar(:id="st.operatorId" :name="st.operator" size="1.2")
                    span.operator-name.ml-1 {{ st.operator }}
                .step-time.small.text-muted(v-if="st.time") {{ formatStepTime(st.time) }}

      //- 條件/特殊分支警示橫列 (補正、駁回、請示、展期、公告)
      .branch-alerts.mt-3(v-if="hasBranchStatus")
        b-alert.mb-2.py-2.px-3.d-flex.justify-content-between.align-items-center(
          v-if="hasFixAlert"
          variant="warning"
          show
        )
          .d-flex.align-items-center
            lah-fa-icon(icon="triangle-exclamation" class="mr-2 text-warning")
            span
              strong 補正通知：
              | 通知日期 {{ bakedData.通知補正日期 }} (補正期限 {{ bakedData.補正期限 || '0' }} 天，期滿 {{ bakedData.補正期滿日期 || '無' }})
              span.ml-2(v-if="hasValue(bakedData.補正日期)") | 補正完成：{{ bakedData.補正日期 }}
          lah-button(
            v-if="hasFixData"
            size="sm"
            variant="warning"
            @click="showFixDataText"
          ) 查看補正內容

        b-alert.mb-2.py-2.px-3(v-if="hasValue(bakedData.駁回日期)" variant="danger" show)
          lah-fa-icon(icon="ban" class="mr-2 text-danger")
          strong 案件駁回：
          | 駁回日期 {{ bakedData.駁回日期 }}

        b-alert.mb-2.py-2.px-3(v-if="hasValue(bakedData.請示人員)" variant="info" show)
          lah-fa-icon(icon="circle-question" class="mr-2 text-info")
          strong 請示紀錄：
          | 請示人員 #[b-link(@click="userinfo(bakedData.請示人員, bakedData.RM82)") {{ bakedData.請示人員 }}] (日期 {{ bakedData.請示日期 }} {{ bakedData.請示時間 }})
          span.ml-2(v-if="hasValue(bakedData.取消請示人員)") | 取消請示：{{ bakedData.取消請示人員 }} ({{ bakedData.取消請示日期 }})

        b-alert.mb-2.py-2.px-3(v-if="hasValue(bakedData.展期人員)" variant="secondary" show)
          lah-fa-icon(icon="calendar-plus" class="mr-2")
          strong 案件展期：
          | 展期人員 #[b-link(@click="userinfo(bakedData.展期人員, bakedData.RM88)") {{ bakedData.展期人員 }}] (展期日期 {{ bakedData.展期日期 }}，天數 {{ bakedData.展期天數 }} 天)

        b-alert.mb-0.py-2.px-3(v-if="hasValue(bakedData.公告日期)" variant="primary" show)
          lah-fa-icon(icon="bullhorn" class="mr-2")
          strong 公告紀錄：
          | 公告日期 {{ bakedData.公告日期 }} (公告天數 {{ bakedData.公告天數 }} 天，期滿 {{ bakedData.公告期滿日期 }})

  //- 3. 標的物與當事人並排等高雙卡片 (Equal Height Row)
  b-row.mb-3
    //- 卡片 A：標的物與地籍明細
    b-col(cols="12" md="6")
      b-card.border-0.shadow-sm.h-100(no-body)
        b-card-header.bg-white.border-bottom.d-flex.align-items-center.py-2
          lah-fa-icon(icon="map-location-dot" variant="primary" class="mr-2")
          h6.mb-0.font-weight-bold 標的物與地籍明細
        b-card-body.p-0.d-flex.flex-column
          b-list-group(flush class="flex-grow-1")
            b-list-group-item.py-2
              b-row.align-items-center
                b-col(cols="4" class="text-muted small") 轄區 / 段小段
                b-col(cols="8" class="font-weight-bold text-dark")
                  | {{ bakedData.區名稱 }}【{{ bakedData.RM10 }}】
                  span.mx-1 ·
                  | {{ bakedData.段小段 }}【{{ bakedData.段代碼 }}】
            b-list-group-item.py-2
              b-row.align-items-center
                b-col(cols="4" class="text-muted small") 地號 / 土地面積
                b-col(cols="8")
                  .d-flex.align-items-center.justify-content-between
                    span.font-weight-bold
                      | {{ bakedData.地號 || '無' }}
                      b-button.ml-1.p-0(
                        v-if="hasValue(bakedData.地號)"
                        variant="link"
                        size="sm"
                        @click="copyToClipboard(bakedData.地號, '已複製地號')"
                        title="複製地號"
                      )
                        lah-fa-icon(icon="copy" no-gutter)
                    span.badge.badge-light.text-secondary 面積：{{ bakedData.土地面積 || '未輸入' }}
            b-list-group-item.py-2
              b-row.align-items-center
                b-col(cols="4" class="text-muted small") 建號 / 建物面積
                b-col(cols="8")
                  .d-flex.align-items-center.justify-content-between
                    span.font-weight-bold
                      | {{ bakedData.建號 || '無' }}
                      b-button.ml-1.p-0(
                        v-if="hasValue(bakedData.建號)"
                        variant="link"
                        size="sm"
                        @click="copyToClipboard(bakedData.建號, '已複製建號')"
                        title="複製建號"
                      )
                        lah-fa-icon(icon="copy" no-gutter)
                    span.badge.badge-light.text-secondary 面積：{{ bakedData.建物面積 || '未輸入' }}
            b-list-group-item.py-2
              b-row.align-items-center
                b-col(cols="4" class="text-muted small") 件數 / 測量案件
                b-col(cols="8" class="text-dark")
                  span.font-weight-bold {{ bakedData.件數 || '1' }} 件
                  span.mx-2 ·
                  span 測量案號：{{ bakedData.測量案件 || '--' }}
            b-list-group-item.py-2
              b-row.align-items-center
                b-col(cols="4" class="text-muted small") 登記 / 地價註記
                b-col(cols="8" class="small")
                  span 登記註記：{{ bakedData.登記處理註記 || '無' }}
                  span.mx-2 ·
                  span 地價註記：{{ bakedData.地價處理註記 || '無' }}

    //- 卡片 B：當事人與聯絡通訊
    b-col(cols="12" md="6" class="mt-3 mt-md-0")
      b-card.border-0.shadow-sm.h-100(no-body)
        b-card-header.bg-white.border-bottom.d-flex.align-items-center.py-2
          lah-fa-icon(icon="users" variant="success" class="mr-2")
          h6.mb-0.font-weight-bold 當事人與通訊資料
        b-card-body.p-0.d-flex.flex-column
          b-list-group(flush class="flex-grow-1")
            b-list-group-item.py-2
              b-row.align-items-center
                b-col(cols="4" class="text-muted small") 權利人
                b-col(cols="8")
                  .d-flex.align-items-center.justify-content-between
                    span.font-weight-bold {{ bakedData.權利人姓名 || '未建檔' }}
                    span(v-if="hasValue(bakedData.權利人統編)")
                      code.text-dark {{ bakedData.權利人統編 }}
                      b-button.ml-1.p-0(
                        variant="link"
                        size="sm"
                        @click="copyToClipboard(bakedData.權利人統編, '已複製權利人統編')"
                        title="複製統編"
                      )
                        lah-fa-icon(icon="copy" no-gutter)
                  .text-muted.small.mt-1(v-if="hasValue(bakedData.權利人住址)") 住址：{{ bakedData.權利人住址 }}

            b-list-group-item.py-2
              b-row.align-items-center
                b-col(cols="4" class="text-muted small") 義務人
                b-col(cols="8")
                  .d-flex.align-items-center.justify-content-between
                    span.font-weight-bold
                      | {{ bakedData.義務人姓名 || '未建檔' }}
                      span.badge.badge-light.ml-1(v-if="hasValue(bakedData.義務人人數)") {{ bakedData.義務人人數 }}人
                    span(v-if="hasValue(bakedData.義務人統編)")
                      code.text-dark {{ bakedData.義務人統編 }}
                      b-button.ml-1.p-0(
                        variant="link"
                        size="sm"
                        @click="copyToClipboard(bakedData.義務人統編, '已複製義務人統編')"
                        title="複製統編"
                      )
                        lah-fa-icon(icon="copy" no-gutter)
                  .text-muted.small.mt-1(v-if="hasValue(bakedData.義務人住址)") 住址：{{ bakedData.義務人住址 }}

            b-list-group-item.py-2(v-if="hasValue(bakedData.代理人姓名) || hasValue(bakedData.代理人統編)")
              b-row.align-items-center
                b-col(cols="4" class="text-muted small") 代理人
                b-col(cols="8")
                  .d-flex.align-items-center.justify-content-between
                    span.font-weight-bold {{ bakedData.代理人姓名 || '未具名' }}
                    span(v-if="hasValue(bakedData.代理人統編)")
                      code.text-dark {{ bakedData.代理人統編 }}
                      b-button.ml-1.p-0(
                        variant="link"
                        size="sm"
                        @click="copyToClipboard(bakedData.代理人統編, '已複製代理人統編')"
                        title="複製統編"
                      )
                        lah-fa-icon(icon="copy" no-gutter)
                  .text-muted.small.mt-1(v-if="hasValue(bakedData.代理人電話)") 電話：{{ bakedData.代理人電話 }}

            b-list-group-item.py-2
              b-row.align-items-center
                b-col(cols="4" class="text-muted small") 聯絡手機
                b-col(cols="8")
                  .d-flex.align-items-center.flex-wrap
                    template(v-if="haveCellNumber")
                      b-badge.p-1.mr-2(variant="success")
                        lah-fa-icon(icon="mobile-screen" class="mr-1")
                        | {{ bakedData.手機號碼 }}
                      b-button.py-0.px-1.mr-1(
                        variant="outline-secondary"
                        size="sm"
                        @click="copyToClipboard(bakedData.手機號碼, '已複製手機號碼')"
                        title="複製手機號碼"
                      )
                        lah-fa-icon(icon="copy" no-gutter)
                      b-button.py-0.px-2.mr-1(
                        variant="outline-primary"
                        size="sm"
                        @click="openQuickSmsModal"
                      ) 發送
                      b-button.py-0.px-2(
                        variant="outline-info"
                        size="sm"
                        @click="popupSMSLog(bakedData.手機號碼)"
                      ) 紀錄
                    template(v-else)
                      span.text-danger.small
                        lah-fa-icon(icon="ban" class="mr-1")
                        | [未建檔，無法傳送簡訊]

            b-list-group-item.py-2(v-if="hasValue(bakedData.異動人員) || hasValue(bakedData.異動日期)")
              b-row.align-items-center
                b-col(cols="4" class="text-muted small") 最後異動
                b-col(cols="8" class="small")
                  span.text-dark {{ bakedData.異動日期 }} {{ bakedData.異動時間 }}
                  span.mx-2(v-if="hasValue(bakedData.異動人員)") ·
                  b-button.p-0.align-baseline(
                    v-if="hasValue(bakedData.異動人員)"
                    variant="link"
                    size="sm"
                    @click="userinfo(bakedData.異動人員, bakedData.RM103)"
                  )
                    | {{ bakedData.異動人員 }}
                    span.text-muted(v-if="hasValue(bakedData.RM103)") ({{ bakedData.RM103 }})

  //- 4. 下方全寬展開：審查與處理歷程 (Full-Width Timeline Grid Cards)
  b-card.border-0.shadow-sm.mb-3(no-body)
    b-card-header.bg-white.border-bottom.d-flex.align-items-center.justify-content-between.py-2
      .d-flex.align-items-center
        lah-fa-icon(icon="timeline" variant="info" class="mr-2")
        h6.mb-0.font-weight-bold 審查與處理歷程
      span.badge.badge-light.text-muted 共 {{ timelineEvents.length }} 個處理記錄
    b-card-body.p-3
      b-row
        b-col(
          v-for="(ev, idx) in timelineEvents"
          :key="idx"
          cols="12"
          sm="6"
          lg="4"
          class="mb-3"
        )
          .timeline-grid-card.h-100(:class="`timeline-card-${ev.variant}`")
            .card-header-bar.d-flex.justify-content-between.align-items-center.mb-2
              .d-flex.align-items-center
                .event-icon-circle(:class="`bg-${ev.variant} text-white`")
                  lah-fa-icon(:icon="ev.icon")
                span.event-title.font-weight-bold.ml-2 {{ ev.title }}
              b-badge(:variant="ev.badgeVariant" pill) {{ ev.badgeText }}
            .card-content-body.small
              .event-time.text-muted.mb-1
                lah-fa-icon(icon="clock" class="mr-1")
                span {{ ev.time }}
              .event-operator.d-flex.align-items-center.flex-wrap.mb-1(v-if="ev.operator")
                span.text-muted.mr-1 經辦：
                b-button.p-0.align-baseline(
                  variant="link"
                  size="sm"
                  @click="userinfo(ev.operator, ev.operatorId)"
                )
                  lah-avatar(:id="ev.operatorId" :name="ev.operator" size="1.1")
                  span.ml-1.font-weight-bold {{ ev.operator }}
                span.text-muted.small.ml-1(v-if="hasValue(ev.operatorId)") [{{ ev.operatorId }}]
              .event-elapsed.mb-1(v-if="hasValue(ev.elapsed)")
                span.badge.badge-light.text-info
                  lah-fa-icon(icon="stopwatch" class="mr-1")
                  | 耗時：{{ ev.elapsed }}
              .event-desc.text-secondary.mt-1(v-if="hasValue(ev.description)") {{ ev.description }}
              .event-actions.mt-2(v-if="ev.actionBtn")
                lah-button(
                  size="sm"
                  :variant="ev.actionBtn.variant"
                  @click="ev.actionBtn.handler"
                ) {{ ev.actionBtn.text }}

  //- 快速發送簡訊 Modal
  b-modal(
    ref="quickSmsModal"
    title="📱 發送案件簡訊通知"
    hide-footer
    centered
  )
    b-form(@submit.prevent="sendQuickSms")
      b-form-group(label="手機號碼:" label-for="sms-cell-input")
        b-form-input#sms-cell-input(
          v-model="smsForm.cell"
          type="tel"
          maxlength="10"
          placeholder="09xxxxxxxx"
          :state="isSmsCellValid"
          required
        )
        b-form-invalid-feedback 手機號碼格式錯誤（需為 09 開頭之 10 碼數字）
      b-form-group(label="常用訊息範本:" label-for="sms-template-select")
        b-form-select#sms-template-select(
          v-model="smsTemplateSelected"
          :options="smsTemplateOptions"
          @change="applySmsTemplate"
        )
      b-form-group(label="簡訊內容:" label-for="sms-content-input")
        b-form-textarea#sms-content-input(
          v-model="smsForm.message"
          rows="4"
          maxlength="200"
          placeholder="請輸入簡訊內容..."
          required
        )
        .d-flex.justify-content-between.small.text-muted.mt-1
          span 字數統計：{{ smsForm.message.length }} / 200 字
          span(v-if="smsForm.message.length > 70") ⚠️ 超過 70 字將依多則計費
      .d-flex.justify-content-end.mt-3
        b-button.mr-2(variant="secondary" size="sm" @click="$refs.quickSmsModal.hide()") 取消
        lah-button(
          icon="paper-plane"
          variant="primary"
          size="sm"
          type="submit"
          :busy="isSmsSending"
          :disabled="!isSmsCellValid || !smsForm.message"
        ) 確認發送

  //- 案件資料文字檔 (TXT) 預覽 Modal
  b-modal(
    ref="caseTextModal"
    :title="`📄 案件資料文字檔 (TXT) - ${displayCaseId}`"
    size="lg"
    hide-footer
    centered
  )
    .d-flex.justify-content-between.align-items-center.mb-2
      small.text-muted 💡 格式化純文字資料，適用於公文簽呈、查核紀錄、便條與系統記事：
      .text-actions
        b-button.mr-2(
          variant="outline-primary"
          size="sm"
          @click="copyCaseTextFromModal"
        )
          lah-fa-icon(icon="copy" class="mr-1")
          | 複製文字
        b-button(
          variant="outline-success"
          size="sm"
          @click="downloadCaseTextFile"
        )
          lah-fa-icon(icon="download" class="mr-1")
          | 下載 TXT 檔
    pre.case-text-pre.p-3.rounded.bg-dark.text-light.small(ref="caseTextPre") {{ caseTextContent }}
    .d-flex.justify-content-end.mt-3
      b-button(variant="secondary" size="sm" @click="$refs.caseTextModal.hide()") 關閉

//- 讀取中
h4.text-center.text-info.my-5(v-else)
  b-spinner(small type="grow")
  strong.ld-txt.ml-2 讀取案件詳情中...
</template>

<script>
import regCaseBase from '~/mixins/lah-reg-case-base.js'
import lahAvatar from '~/components/lah-avatar.vue'
import lahUserCard from '~/components/lah-user-card.vue'
import lahAdmSmslogTableVue from '~/components/lah-adm-smslog-table.vue'

export default {
  name: 'LahRegCaseDetail',
  components: {
    lahAvatar,
    lahUserCard,
    lahAdmSmslogTableVue
  },
  mixins: [regCaseBase],
  data: () => ({
    localCRCRDData: false,
    isSmsSending: false,
    smsForm: {
      cell: '',
      message: ''
    },
    smsTemplateSelected: 'status',
    smsTemplateOptions: [
      { value: 'status', text: '1. 目前辦理情形通知' },
      { value: 'fix', text: '2. 補正通知提醒' },
      { value: 'finish', text: '3. 結案領件通知' }
    ]
  }),
  computed: {
    displayCaseId () {
      return this.hasValue(this.bakedData?.收件字號) ? this.bakedData.收件字號 : (this.ID || this.caseId)
    },
    isClosed () {
      return this.bakedData?.結案與否 === 'Y' || ['A', 'B', 'C', 'D'].includes(this.bakedData?.結案代碼)
    },
    haveCellNumber () {
      return this.hasValue(this.bakedData?.手機號碼)
    },
    statusBadgeVariant () {
      const st = this.bakedData?.辦理情形 || ''
      if (st.includes('駁回')) { return 'danger' }
      if (st.includes('補正')) { return 'warning' }
      if (st === '結案' || st === '歸檔') { return 'success' }
      return 'info'
    },
    dueStatusVariant () {
      if (this.isClosed) { return 'success' }
      if (this.bakedData?.燈號 === 'danger') { return 'danger' }
      if (this.bakedData?.燈號 === 'warning') { return 'warning' }
      return 'secondary'
    },
    dueStatusIcon () {
      if (this.isClosed) { return 'check-circle' }
      if (this.bakedData?.燈號 === 'danger') { return 'exclamation-triangle' }
      if (this.bakedData?.燈號 === 'warning') { return 'clock' }
      return 'clock'
    },
    dueStatusText () {
      if (this.isClosed) { return '已結案' }
      if (this.bakedData?.燈號 === 'danger') { return '⚠️ 逾期案件！' }
      if (this.bakedData?.燈號 === 'warning') { return '⏳ 即將到期' }
      return `限辦：${this.bakedData?.限辦期限 || '依規定'}`
    },
    hasBranchStatus () {
      return this.hasFixAlert ||
        this.hasValue(this.bakedData?.駁回日期) ||
        this.hasValue(this.bakedData?.請示人員) ||
        this.hasValue(this.bakedData?.展期人員) ||
        this.hasValue(this.bakedData?.公告日期)
    },
    hasFixAlert () {
      return this.hasValue(this.bakedData?.通知補正日期) || (this.bakedData?.辦理情形 || '').includes('補正')
    },
    hasFixData () {
      return this.hasValue(this.id) && this.hasValue(this.bakedData?.通知補正日期)
    },
    fixDataText () {
      return this.localCRCRDData?.RC05 || '⚠ 本地資料庫無資料，若為跨所案件請先確認該案件有同步過來❗'
    },
    isSmsCellValid () {
      if (!this.hasValue(this.smsForm.cell)) { return null }
      return /^09\d{8}$/.test(this.smsForm.cell)
    },
    caseTextContent () {
      return this.formatCaseTextReport()
    },
    workflowSteps () {
      if (!this.bakedData) { return [] }
      const b = this.bakedData
      const stNow = b.辦理情形 || ''

      const isReceptionDone = this.hasValue(b.收件時間)
      const isReviewDone = this.hasValue(b.初審時間)
      const isSecReviewDone = this.hasValue(b.複審時間)
      const isApprovalDone = this.hasValue(b.准登日期)
      const isRegisterDone = this.hasValue(b.登錄日期)
      const isCheckDone = this.hasValue(b.校對日期)
      const isCloseDone = this.isClosed || this.hasValue(b.結案日期)

      const steps = [
        {
          key: '收件',
          title: '收件',
          operator: b.收件人員,
          operatorId: b.RM07_ID,
          time: b.收件時間,
          isDone: isReceptionDone,
          isCurrent: stNow === '收件'
        },
        {
          key: '初審',
          title: '初審',
          operator: b.初審人員,
          operatorId: b.RM45,
          time: b.初審時間,
          isDone: isReviewDone || isSecReviewDone || isApprovalDone || isRegisterDone || isCheckDone || isCloseDone,
          isCurrent: stNow === '初審'
        }
      ]

      // 若有複審資料或現況在複審，插入複審關卡
      if (this.hasValue(b.複審人員) || this.hasValue(b.複審時間) || stNow === '複審') {
        steps.push({
          key: '複審',
          title: '複審',
          operator: b.複審人員,
          operatorId: b.RM47,
          time: b.複審時間,
          isDone: isSecReviewDone || isApprovalDone || isRegisterDone || isCheckDone || isCloseDone,
          isCurrent: stNow === '複審'
        })
      }

      steps.push(
        {
          key: '准登',
          title: '准登',
          operator: b.准登人員,
          operatorId: b.RM63,
          time: b.准登日期,
          isDone: isApprovalDone || isRegisterDone || isCheckDone || isCloseDone,
          isCurrent: stNow === '准登'
        },
        {
          key: '登簿',
          title: '登簿',
          operator: b.登錄人員,
          operatorId: b.RM55,
          time: b.登錄日期,
          isDone: isRegisterDone || isCheckDone || isCloseDone,
          isCurrent: stNow === '登錄' || stNow === '登簿'
        },
        {
          key: '校對',
          title: '校對',
          operator: b.校對人員 || (stNow === '校對' ? b.作業人員 : ''),
          operatorId: b.RM57 || (stNow === '校對' ? b.RM30_1 : ''),
          time: b.校對日期,
          isDone: isCheckDone || isCloseDone,
          isCurrent: stNow === '校對'
        },
        {
          key: '結案',
          title: '結案',
          operator: b.結案人員,
          operatorId: b.RM59,
          time: b.結案日期,
          isDone: isCloseDone,
          isCurrent: stNow === '結案' || stNow === '歸檔'
        }
      )

      return steps
    },
    timelineEvents () {
      if (!this.bakedData) { return [] }
      const b = this.bakedData
      const events = []
      const elapsed = b.ELAPSED_TIME || {}

      // 1. 收件
      if (this.hasValue(b.收件時間) || this.hasValue(b.收件人員)) {
        events.push({
          title: '收件作業',
          badgeText: '已收件',
          badgeVariant: 'success',
          variant: 'success',
          icon: 'inbox',
          time: b.收件時間 || b.收件日期,
          operator: b.收件人員,
          operatorId: b.RM07_ID
        })
      }

      // 2. 移轉課長 / 秘書
      if (this.hasValue(b.移轉課長)) {
        events.push({
          title: '移轉課長',
          badgeText: '移轉',
          badgeVariant: 'info',
          variant: 'info',
          icon: 'share-nodes',
          time: b.移轉課長時間,
          operator: b.移轉課長,
          operatorId: b.RM106
        })
      }
      if (this.hasValue(b.移轉秘書)) {
        events.push({
          title: '移轉秘書',
          badgeText: '移轉',
          badgeVariant: 'info',
          variant: 'info',
          icon: 'share-nodes',
          time: b.移轉秘書時間,
          operator: b.移轉秘書,
          operatorId: b.RM107
        })
      }

      // 3. 初審
      if (this.hasValue(b.初審時間) || this.hasValue(b.初審人員)) {
        events.push({
          title: '初審作業',
          badgeText: this.hasValue(b.初審時間) ? '初審通過' : '進行中',
          badgeVariant: this.hasValue(b.初審時間) ? 'success' : 'primary',
          variant: this.hasValue(b.初審時間) ? 'success' : 'primary',
          icon: 'clipboard-check',
          time: b.初審時間,
          operator: b.初審人員,
          operatorId: b.RM45,
          elapsed: elapsed.初審
        })
      }

      // 4. 複審 (嚴格確認有時間或人員)
      if (this.hasValue(b.複審時間) || this.hasValue(b.複審人員)) {
        events.push({
          title: '複審作業',
          badgeText: this.hasValue(b.複審時間) ? '複審通過' : '進行中',
          badgeVariant: this.hasValue(b.複審時間) ? 'success' : 'primary',
          variant: this.hasValue(b.複審時間) ? 'success' : 'primary',
          icon: 'user-check',
          time: b.複審時間,
          operator: b.複審人員,
          operatorId: b.RM47,
          elapsed: elapsed.複審
        })
      }

      // 5. 補正相關 (嚴格確認通知補正日期)
      if (this.hasValue(b.通知補正日期)) {
        events.push({
          title: '通知補正',
          badgeText: '補正中',
          badgeVariant: 'warning',
          variant: 'warning',
          icon: 'triangle-exclamation',
          time: b.通知補正日期,
          description: `期限：${b.補正期限 || 0}天 (期滿日：${b.補正期滿日期 || '無'})`,
          actionBtn: this.hasFixData
            ? {
                text: '查看補正內容',
                variant: 'outline-warning',
                handler: this.showFixDataText
              }
            : null
        })
      }
      if (this.hasValue(b.補正日期)) {
        events.push({
          title: '補正完成',
          badgeText: '補正齊備',
          badgeVariant: 'success',
          variant: 'success',
          icon: 'check',
          time: b.補正日期,
          description: '補正手續已完成'
        })
      }

      // 6. 請示相關
      if (this.hasValue(b.請示人員)) {
        events.push({
          title: '案件請示',
          badgeText: this.hasValue(b.取消請示日期) ? '已結案請示' : '請示中',
          badgeVariant: 'info',
          variant: 'info',
          icon: 'circle-question',
          time: `${b.請示日期 || ''} ${b.請示時間 || ''}`.trim(),
          operator: b.請示人員,
          operatorId: b.RM82,
          description: this.hasValue(b.取消請示日期) ? `於 ${b.取消請示日期} 由 ${b.取消請示人員 || ''} 取消請示` : ''
        })
      }

      // 7. 展期
      if (this.hasValue(b.展期人員)) {
        events.push({
          title: '案件展期',
          badgeText: '已展期',
          badgeVariant: 'secondary',
          variant: 'secondary',
          icon: 'calendar-plus',
          time: b.展期日期,
          operator: b.展期人員,
          operatorId: b.RM88,
          description: `展期天數：${b.展期天數} 天`
        })
      }

      // 8. 公告
      if (this.hasValue(b.公告日期)) {
        events.push({
          title: '案件公告',
          badgeText: '公告中',
          badgeVariant: 'primary',
          variant: 'primary',
          icon: 'bullhorn',
          time: b.公告日期,
          description: `天數：${b.公告天數} 天 (期滿日：${b.公告期滿日期})`
        })
      }

      // 9. 駁回 (嚴格確認有駁回日期)
      if (this.hasValue(b.駁回日期)) {
        events.push({
          title: '案件駁回',
          badgeText: '已駁回',
          badgeVariant: 'danger',
          variant: 'danger',
          icon: 'ban',
          time: b.駁回日期,
          description: '案件已依法駁回'
        })
      }

      // 10. 准登
      if (this.hasValue(b.准登日期) || this.hasValue(b.准登人員)) {
        events.push({
          title: '准登核定',
          badgeText: this.hasValue(b.准登日期) ? '已准登' : '准登中',
          badgeVariant: 'success',
          variant: 'success',
          icon: 'stamp',
          time: b.准登日期,
          operator: b.准登人員,
          operatorId: b.RM63,
          elapsed: elapsed.准登
        })
      }

      // 11. 登簿
      if (this.hasValue(b.登錄日期) || this.hasValue(b.登錄人員)) {
        events.push({
          title: '登記簿登錄',
          badgeText: this.hasValue(b.登錄日期) ? '登錄完成' : '登簿中',
          badgeVariant: 'success',
          variant: 'success',
          icon: 'book',
          time: b.登錄日期,
          operator: b.登錄人員,
          operatorId: b.RM55,
          elapsed: elapsed.登簿
        })
      }

      // 12. 校對
      if (this.hasValue(b.校對日期) || this.hasValue(b.校對人員) || b.辦理情形 === '校對') {
        const isChecking = !this.hasValue(b.校對日期)
        events.push({
          title: '校對作業',
          badgeText: isChecking ? '校對進行中' : '校對完成',
          badgeVariant: isChecking ? 'primary' : 'success',
          variant: isChecking ? 'primary' : 'success',
          icon: 'circle-check',
          time: b.校對日期,
          operator: b.校對人員 || (isChecking ? b.作業人員 : ''),
          operatorId: b.RM57 || (isChecking ? b.RM30_1 : ''),
          elapsed: elapsed.校對
        })
      }

      // 13. 結案 (只有在確定結案或有結案日期時才加入)
      if (this.isClosed || this.hasValue(b.結案日期)) {
        events.push({
          title: '結案歸檔',
          badgeText: '結案完成',
          badgeVariant: 'success',
          variant: 'success',
          icon: 'box-archive',
          time: b.結案日期,
          operator: b.結案人員,
          operatorId: b.RM59,
          elapsed: elapsed.結案,
          description: `結案狀態：${b.結案狀態 || '已結案'}`
        })
      }

      return events
    }
  },
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    },
    hasFixData: {
      immediate: true,
      handler (flag) {
        if (flag) {
          this.getLocalFixData()
        }
      }
    }
  },
  created () {
    this.$fetch()
  },
  methods: {
    hasValue (val) {
      if (val === null || val === undefined) { return false }
      if (typeof val === 'string') { return val.trim().length > 0 }
      return !this.$utils.empty(val)
    },
    getVisualWidth (str) {
      if (!str) { return 0 }
      let width = 0
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i)
        // 判定全形 / 中文字元（佔 2 個半形欄寬）
        if (
          (code >= 0x4E00 && code <= 0x9FFF) ||
          (code >= 0x3400 && code <= 0x4DBF) ||
          (code >= 0xF900 && code <= 0xFAFF) ||
          (code >= 0xFF01 && code <= 0xFF60) ||
          (code >= 0xFFE0 && code <= 0xFFE6) ||
          (code >= 0x3000 && code <= 0x303F)
        ) {
          width += 2
        } else {
          width += 1
        }
      }
      return width
    },
    padEndVisual (str, targetWidth) {
      const s = String(str || '')
      const currentWidth = this.getVisualWidth(s)
      if (currentWidth >= targetWidth) {
        return s
      }
      return s + ' '.repeat(targetWidth - currentWidth)
    },
    padToTab (str, targetTabCol, tabSize = 8) {
      const currentWidth = this.getVisualWidth(str)
      let col = currentWidth
      let tabs = ''
      while (col < targetTabCol) {
        col = Math.floor(col / tabSize) * tabSize + tabSize
        tabs += '\t'
      }
      if (tabs === '') {
        tabs = '\t'
      }
      return str + tabs
    },
    formatStepTime (val) {
      if (!this.hasValue(val)) { return '' }
      // 若為完整民國時間字串 "115-10-08 08:27:02" 取簡短形式 "10-08 08:27"
      const parts = val.trim().split(' ')
      if (parts.length === 2) {
        const datePart = parts[0].split('-').slice(1).join('/')
        const timePart = parts[1].substring(0, 5)
        return `${datePart} ${timePart}`
      }
      return val
    },
    formatCaseTextReport () {
      if (!this.bakedData) { return '' }
      const b = this.bakedData
      const divider = '-----------------------------------------------------------------------------------------------'
      const doubleDivider = '==========================================================='
      const lines = []

      lines.push(doubleDivider)
      lines.push(`【登記案件詳情】 ${this.displayCaseId}`)
      lines.push(doubleDivider)

      // 1. 基本資訊 (純 Tab 對齊，無欄位前置空格)
      const rDate = b.收件日期 ? `民國${b.收件日期.replace('-', '年').replace('-', '月')}日` : (b.收件時間 || '未載明')
      const rTime = b.收件時間 ? ` ${b.收件時間.split(' ')[1] || ''}` : ''

      lines.push(`收件字號: ${b.收件字號 || this.displayCaseId}\t收件日期: ${rDate}${rTime}`)
      lines.push(`登記原因: ${b.登記原因 || '未載明'}\t\t\t\t辦理情形: ${b.辦理情形 || '未載明'}`)
      lines.push(`限辦期限: ${b.限辦期限 || '依規定'}\t\t\t結案狀態: ${this.isClosed ? '已結案' : '尚未結案'}`)

      if (b.跨所 === 'Y') {
        lines.push(`跨所案件: 資料收件所【${b.資料收件所}】 ➔ 資料管轄所【${b.資料管轄所}】`)
      }
      lines.push(divider)

      // 2. 標的物與地籍資料 (純 Tab 對齊，無欄位前置空格)
      lines.push('標的物與地籍資料:')
      lines.push(`  轄區段小段: ${b.區名稱 || ''}【${b.RM10 || ''}】 · ${b.段小段 || ''}【${b.段代碼 || ''}】`)

      lines.push(`  地  號: ${b.地號 || '無'}\t\t\t\t土地面積: ${b.土地面積 || '未輸入'}`)
      lines.push(`  建  號: ${b.建號 || '無'}\t\t\t\t建物面積: ${b.建物面積 || '未輸入'}`)
      lines.push(`  件  數: 1 件\t\t\t\t測量案號: ${b.測量案件 || '--'}`)
      lines.push(`  登記註記: ${b.登記處理註記 || '無'}\t\t\t\t地價註記: ${b.地價處理註記 || '無'}`)

      lines.push(divider)

      // 3. 當事人與通訊資料 (純 Tab 對齊，無欄位前置空格)
      lines.push('當事人與通訊資料:')

      lines.push(`  權 利 人: ${b.權利人姓名 || '未建檔'}\t\t\t\t統一編號: ${b.權利人統編 || '無'}`)
      if (this.hasValue(b.權利人住址)) {
        lines.push(`  權利人住址: ${b.權利人住址}`)
      }

      const obligorName = b.義務人姓名 ? `${b.義務人姓名}${b.義務人人數 ? ` (${b.義務人人數}人)` : ''}` : '未建檔'
      const obligorTabs = obligorName.length >= 7 ? '\t\t' : '\t\t\t\t'
      lines.push(`  義 務 人: ${obligorName}${obligorTabs}統一編號: ${b.義務人統編 || '無'}`)
      if (this.hasValue(b.義務人住址)) {
        lines.push(`  義務人住址: ${b.義務人住址}`)
      }

      if (this.hasValue(b.代理人姓名) || this.hasValue(b.代理人統編)) {
        lines.push(`  代 理 人: ${b.代理人姓名 || '未具名'}\t\t\t\t統一編號: ${b.代理人統編 || '無'}`)
        if (this.hasValue(b.代理人電話)) {
          lines.push(`  代理人電話: ${b.代理人電話}`)
        }
      }
      lines.push(`  聯絡手機: ${b.手機號碼 || '[未建檔，無法傳送簡訊]'}`)
      if (this.hasValue(b.異動日期) || this.hasValue(b.異動人員)) {
        lines.push(`  最後異動: ${b.異動日期 || ''} ${b.異動時間 || ''} · ${b.異動人員 || ''} [${b.RM103 || ''}]`)
      }
      lines.push(divider)

      // 4. 審查與處理歷程 (純 Tab 對齊，無欄位前置空格)
      lines.push('審查與處理歷程:')
      this.timelineEvents.forEach((ev) => {
        const op = ev.operator ? `${ev.operator}${ev.operatorId ? ` [${ev.operatorId}]` : ''}` : '未載明'
        const el = ev.elapsed ? ` (耗時: ${ev.elapsed})` : ''
        const desc = ev.description ? ` (${ev.description})` : ''
        const isLongTitle = (ev.title || '').length >= 5
        const timeTabs = isLongTitle ? '\t\t' : '\t\t\t'
        if (this.hasValue(ev.time)) {
          lines.push(`  ${ev.title}  : ${ev.time}${timeTabs}經辦: ${op}${el}${desc}`)
        } else {
          lines.push(`  ${ev.title}  :\t\t\t\t\t經辦: ${op}${el}${desc}`)
        }
      })
      lines.push(divider)

      lines.push('=============================================================')

      // 5. 頁尾產製時間簽註
      const now = new Date()
      const rocYear = now.getFullYear() - 1911
      const padZero = n => String(n).padStart(2, '0')
      const exportTimeStr = `民國${rocYear}年${padZero(now.getMonth() + 1)}月${padZero(now.getDate())}日 ${padZero(now.getHours())}:${padZero(now.getMinutes())}:${padZero(now.getSeconds())}`
      lines.push(`產製時間: ${exportTimeStr}`)

      return lines.join('\n')
    },
    copyCaseTextFromModal () {
      const text = this.caseTextContent

      // 1. 若處於 Modal 內，直接選取 <pre ref="caseTextPre"> 節點執行 copy (在非安全 HTTP 來源與雙層 Modal 焦點下 100% 成功)
      const pre = this.$refs.caseTextPre
      if (pre && typeof window.getSelection === 'function' && document.createRange) {
        try {
          const range = document.createRange()
          range.selectNodeContents(pre)
          const selection = window.getSelection()
          selection.removeAllRanges()
          selection.addRange(range)
          const ok = document.execCommand('copy')
          selection.removeAllRanges()
          if (ok) {
            this.notify('已成功複製全案文字資料！', { title: '📋 剪貼簿', variant: 'success' })
            return
          }
        } catch (err) {
          this.$utils.warn('Pre selection copy failed, fallbacking...', err)
        }
      }

      // 2. 若為 SecureContext 則使用 navigator.clipboard
      if (process.client && window.isSecureContext && navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.notify('已成功複製全案文字資料！', { title: '📋 剪貼簿', variant: 'success' })
        }).catch(() => {
          this.robustFallbackCopy(text)
        })
        return
      }

      // 3. Fallback: 動態掛載 textarea 於最上層 Modal 內部以突破 Bootstrap focus trap
      this.robustFallbackCopy(text)
    },
    quickCopyCaseText () {
      const text = this.caseTextContent
      if (process.client && window.isSecureContext && navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.notify('已成功複製全案文字資料！', { title: '📋 剪貼簿', variant: 'success' })
        }).catch(() => {
          this.robustFallbackCopy(text)
        })
        return
      }
      this.robustFallbackCopy(text)
    },
    robustFallbackCopy (text) {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.top = '0'
        textarea.style.left = '0'
        textarea.style.opacity = '0.01'
        textarea.style.zIndex = '99999'

        // 取得最上層可視的 modal-content 容器
        const activeModals = document.querySelectorAll('.modal.show .modal-content')
        const container = (activeModals.length > 0 ? activeModals[activeModals.length - 1] : null) || document.body

        container.appendChild(textarea)
        textarea.focus()
        textarea.select()
        textarea.setSelectionRange(0, textarea.value.length)
        const success = document.execCommand('copy')
        container.removeChild(textarea)

        if (success) {
          this.notify('已成功複製全案文字資料！', { title: '📋 剪貼簿', variant: 'success' })
        } else {
          this.notify('瀏覽器限制剪貼簿存取，請直接選取畫面文字複製', { type: 'warning' })
        }
      } catch (err) {
        this.$utils.error('robustFallbackCopy error:', err)
        this.notify('複製失敗，請手動選取文字', { type: 'danger' })
      }
    },
    openCaseTextModal () {
      this.$refs.caseTextModal.show()
    },
    downloadCaseTextFile () {
      const text = this.formatCaseTextReport()
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const filename = `${this.displayCaseId.replace(/[^a-zA-Z0-9_\-\u4E00-\u9FFF]/g, '_')}_案件資料.txt`
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      this.notify(`已下載 ${filename}`, { type: 'success' })
    },
    refreshData () {
      this.reloadCase()
    },
    reloadCase () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_case',
        id: this.id
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.bakedData = data.baked
          this.notify('案件資料已更新', { type: 'success' })
        } else {
          this.notify(data.message, { type: 'warning' })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    getLocalFixData () {
      if (this.localCRCRDData) { return }
      this.$axios.post(this.$consts.API.JSON.XCASE, {
        type: 'get_local_fix_data',
        id: this.id
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.localCRCRDData = { ...data.raw }
        }
      }).catch((err) => {
        this.$utils.error(err)
      })
    },
    showFixDataText () {
      this.modal(this.fixDataText, {
        title: `${this.bakedData?.RM01}-${this.bakedData?.RM02}-${this.bakedData?.RM03} 補正通知內容`,
        size: 'lg'
      })
    },
    popupSMSLog (keyword) {
      this.modal(this.$createElement(lahAdmSmslogTableVue, {
        props: {
          inKeyword: keyword
        }
      }), {
        title: `簡訊紀錄查詢 (${keyword})`,
        size: 'xl',
        noCloseOnBackdrop: true,
        centered: false,
        scrollable: false
      })
    },
    openQuickSmsModal () {
      this.smsForm.cell = this.bakedData?.手機號碼 || ''
      this.smsTemplateSelected = 'status'
      this.applySmsTemplate('status')
      this.$refs.quickSmsModal.show()
    },
    applySmsTemplate (type) {
      const b = this.bakedData || {}
      const caseName = b.收件字號 || `${b.RM01}年${b.RM02}字第${b.RM03}號`
      if (type === 'status') {
        this.smsForm.message = `【地政登記案件通知】您的登記案件(${caseName})，目前辦理情形為：${b.辦理情形 || '處理中'}。如有疑問請洽本所。`
      } else if (type === 'fix') {
        this.smsForm.message = `【地政補正通知】您的登記案件(${caseName})已通知補正，請於補正期限內儘速補正，以免影響權益。`
      } else if (type === 'finish') {
        this.smsForm.message = `【地政領件通知】您的登記案件(${caseName})已辦畢結案，請攜帶身分證件與印章至本所領取相關書證。`
      }
    },
    async sendQuickSms () {
      if (!this.isSmsCellValid || !this.smsForm.message) {
        this.notify('請確認手機號碼與簡訊內容', { type: 'warning' })
        return
      }

      this.isSmsSending = true
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.MOISMS, {
          type: 'moicas_ma05_sms',
          cell: this.smsForm.cell,
          message: this.smsForm.message
        })

        const isSuccess = data.status === 1 || data.message?.includes('完成')
        if (isSuccess) {
          this.notify('簡訊已成功排入傳送佇列！', { type: 'success' })
          this.$refs.quickSmsModal.hide()
        } else {
          this.notify(data.message || '簡訊傳送失敗', { type: 'danger' })
        }
      } catch (err) {
        this.$utils.error(err)
        this.notify('傳送簡訊時發生異常', { type: 'danger' })
      } finally {
        this.isSmsSending = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-reg-case-detail {
  font-family: inherit;

  .case-header-banner {
    background: linear-gradient(180deg, #ffffff 0%, #fbfcfd 100%);
    border-color: #e2e8f0 !important;

    .case-title {
      letter-spacing: 0.5px;
    }
  }

  // 步進進度條 (Stepper) 容器與節點
  .stepper-container {
    padding: 10px 5px 5px;
    overflow-x: auto;
  }

  .stepper-steps {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    position: relative;
    min-width: 620px;
  }

  .stepper-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    text-align: center;

    .step-connector {
      position: absolute;
      top: 18px;
      right: 50%;
      width: 100%;
      height: 3px;
      background-color: #e2e8f0;
      z-index: 1;
      transition: background-color 0.3s ease;

      &.connector-done {
        background-color: #28a745;
      }
    }

    .step-node-wrapper {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }

    .step-node {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.95rem;
      transition: all 0.25s ease;
      background-color: #ffffff;
      border: 3px solid #cbd5e1;
      color: #64748b;
    }

    .step-content {
      margin-top: 8px;
      width: 100%;

      .step-title {
        font-size: 0.95rem;
        color: #334155;
      }

      .btn-operator {
        padding: 0;
        text-decoration: none;
        color: #1e293b;
        font-size: 0.85rem;

        &:hover {
          color: #0056b3;
        }

        .operator-name {
          font-weight: 500;
        }
      }

      .step-time {
        font-size: 0.75rem;
        line-height: 1.2;
      }
    }

    // 完成節點
    &.step-done {
      .step-node {
        background-color: #28a745;
        border-color: #28a745;
        color: #ffffff;
        box-shadow: 0 2px 6px rgba(40, 167, 69, 0.25);
      }
      .step-title {
        color: #198754;
      }
    }

    // 當前進行中節點
    &.step-active {
      .step-node {
        background-color: #007bff;
        border-color: #007bff;
        color: #ffffff;
        box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.25);
        animation: pulse-ring 2s infinite;
      }
      .step-title {
        color: #007bff;
      }
    }

    // 尚未到達
    &.step-pending {
      .step-node {
        background-color: #f8fafc;
        border-color: #e2e8f0;
        color: #94a3b8;
      }
    }
  }

  // 審查歷程網格時序卡 (Timeline Grid Cards)
  .timeline-grid-card {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 14px;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;

    &:hover {
      background-color: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      transform: translateY(-2px);
    }

    .event-icon-circle {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .event-title {
      font-size: 0.95rem;
      color: #1e293b;
    }

    &.timeline-card-success {
      border-left: 4px solid #28a745;
    }
    &.timeline-card-primary {
      border-left: 4px solid #007bff;
    }
    &.timeline-card-warning {
      border-left: 4px solid #ffc107;
    }
    &.timeline-card-danger {
      border-left: 4px solid #dc3545;
    }
    &.timeline-card-info {
      border-left: 4px solid #17a2b8;
    }
    &.timeline-card-secondary {
      border-left: 4px solid #6c757d;
    }
  }

  // 文字檔預覽框樣式 (與 Windows 記事本預設字型一致，消除顯示與匯出差距)
  .case-text-pre {
    font-family: 'Microsoft JhengHei', '微軟正黑體', 'Cascadia Code', 'Courier New', monospace;
    white-space: pre-wrap;
    word-break: break-all;
    tab-size: 8;
    -moz-tab-size: 8;
    max-height: 480px;
    overflow-y: auto;
    line-height: 1.5;
    user-select: text;
  }
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(0, 123, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
  }
}
</style>
