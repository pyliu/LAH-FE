<template lang="pug">
b-card(no-body)
  b-card-header(v-if="!noTitle" class="font-weight-bold")
    span 辦理情形

  b-card-body(v-if="ready")
    //- ==========================================
    //- 1. 辦理歷程 (Horizontal Stepper 橫向流程圖) - 移至最上方
    //- ==========================================
    .d-flex.justify-content-between.align-items-center.mb-3
      h6.font-weight-bold.text-info.mb-0 ⏳ 辦理歷程
      b-button(v-b-toggle.timeline-collapse size="sm" variant="outline-info" pill)
        | 展開 / 收合

    b-collapse#timeline-collapse(visible)
      //- 移除 justify-content-center 讓版面恢復預設靠左對齊，align-items-start 讓頭像頂部對齊
      .d-flex.flex-wrap.align-items-start.p-3.bg-light.rounded.shadow-sm.mt-3
        template(v-for="(event, idx) in timelineEvents")
          //- 單一流程節點
          .timeline-node.d-flex.flex-column.align-items-center.text-center.mx-1(:key="'node-'+idx" class="my-2")
            //- 狀態大圓標 (整合動態背景色與字體顏色)
            b-avatar(
              :variant="event.variant"
              :style="event.bgStyle ? `background-color: ${event.bgStyle} !important;` : ''"
              size="3.5rem"
              class="shadow-sm font-weight-bold border-white border"
              :class="event.textClass"
            )
              span(style="font-size: 0.9rem;") {{ event.title.substring(0, 2) }}

            //- 文字與資訊容器：獨立出來使其向下延伸，不影響圓標對齊
            .node-content.mt-2.d-flex.flex-column.align-items-center
              .font-weight-bold.text-dark.small.mb-1 {{ maskName(event.user) || '系統' }}
              .text-muted(style="font-size: 0.75rem;") {{ event.date }}
              .text-muted(style="font-size: 0.7rem;" v-if="event.time") {{ event.time }}

              //- 額外資訊提示
              .text-info.mt-1(style="font-size: 0.7rem;" v-if="event.extra") {{ event.extra }}

              //- 補正通知專用按鈕
              b-button.mt-1(
                v-if="event.title === '通知補正' && hasFixData"
                size="sm"
                variant="danger"
                pill
                @click="showFixDataText"
              ) 內容

          //- 連接線/箭頭 (非最後一筆時顯示)
          //- 設定高度與頭像一致(3.5rem)並垂直置中，完美對齊圓標中心點
          .timeline-arrow.d-flex.align-items-center.mx-1.text-muted(:key="'arrow-'+idx" v-if="idx < timelineEvents.length - 1" style="height: 3.5rem;")
            | ➔

        //- 查無歷程的防呆
        .w-100.text-center.text-muted.my-3(v-if="timelineEvents.length === 0")
          | 尚無辦理歷程紀錄

    hr.my-4

    //- ==========================================
    //- 2. 案件摘要區塊 (Overview)
    //- ==========================================
    b-alert.d-flex.align-items-center.justify-content-between.mb-3(
      :variant="ongoing ? 'warning' : 'success'"
      show
    )
      div
        strong 狀態：
        span.ml-1 {{ ongoing ? '尚未結案' : '已結案' }}
        //- 新增：若有登記處理註記(如:異動完成)則額外標示
        b-badge.ml-2(v-if="bakedData.登記處理註記" variant="info" pill class="shadow-sm")
          | {{ bakedData.登記處理註記 }}
      div
        b-badge(pill :variant="ongoing ? 'danger' : 'success'" class="shadow-sm")
          | {{ bakedData.辦理情形 }}

    //- 升級案件基本資訊面板，整合收件字號、件數與限辦時間
    b-card.bg-light.border-0.mb-4(body-class="p-3 shadow-sm rounded")
      b-row.align-items-center
        b-col(cols="12" md="4").mb-3.mb-md-0
          .text-muted.small.font-weight-bold.mb-1 📄 收件字號
          .h6.mb-0.text-dark {{ bakedData.收件字號 || '無資料' }}
        b-col(cols="12" md="4").mb-3.mb-md-0
          .text-muted.small.font-weight-bold.mb-1 📝 登記原因
          .h5.mb-0.text-primary
            | {{ bakedData.登記原因 }}
            b-badge.ml-2.align-text-top(v-if="bakedData.件數" variant="secondary" pill style="font-size: 0.75rem;")
              | 共 {{ bakedData.件數 }} 件
        b-col(cols="12" md="4")
          .text-muted.small.font-weight-bold.mb-1 ⏰ 預定結案
          .h6.mb-0.text-dark
            span(v-html="bakedData.限辦期限")
            b-badge.ml-2(v-if="bakedData.限辦時間" variant="danger")
              | {{ bakedData.限辦時間 }}

    hr.mb-4

    //- ==========================================
    //- 3. 關係人區塊 (Parties)
    //- ==========================================
    h6.font-weight-bold.text-secondary.mb-3 👥 關係人資訊
    //- 補上 align-items-start 讓卡片依照自身內容高度對齊，不要強制等高撐大
    b-row.mb-2.align-items-start
      //- 代理人
      b-col(cols="12" md="4" v-if="!$utils.empty(bakedData.代理人統編)").mb-3
        b-card(bg-variant="light" border-variant="light" body-class="p-3 shadow-sm rounded")
          .text-muted.small.mb-1 代理人
          .font-weight-bold.h6.mb-1 {{ maskName(bakedData.代理人姓名, bakedData.代理人統編) }}
          .small.text-secondary {{ maskId(bakedData.代理人統編) }}
      //- 權利人
      b-col(cols="12" md="4" v-if="!$utils.empty(bakedData.權利人統編)").mb-3
        b-card(bg-variant="light" border-variant="light" body-class="p-3 shadow-sm rounded")
          .text-muted.small.mb-1 權利人
          .font-weight-bold.h6.mb-1 {{ maskName(bakedData.權利人姓名, bakedData.權利人統編) }}
          .small.text-secondary {{ maskId(bakedData.權利人統編) }}
      //- 義務人
      b-col(cols="12" md="4" v-if="!$utils.empty(bakedData.義務人統編)").mb-3
        b-card(bg-variant="light" border-variant="light" body-class="p-3 shadow-sm rounded")
          .text-muted.small.mb-1 義務人
          .font-weight-bold.h6.mb-1 {{ maskName(bakedData.義務人姓名, bakedData.義務人統編) }}
          .small.text-secondary {{ maskId(bakedData.義務人統編) }}

    hr.mb-4

    //- ==========================================
    //- 4. 標的資訊與案件進階屬性 (Target info & Details)
    //- ==========================================
    b-row.align-items-start.mb-2
      //- 左半部：標的資訊 (放大為 1/3 版面 lg="4")
      b-col(cols="12" lg="4").mb-4
        .d-flex.justify-content-between.align-items-center.mb-3
          h6.font-weight-bold.text-success.mb-0 📌 標的資訊
          b-badge(variant="success" pill) 共 {{ totalTargets }} 筆

        //- 移除 collapse 收合設計，改為常駐顯示
        b-card.border-success.shadow-sm(body-class="p-0")
          b-list-group(flush)
            //- 土地標的清單
            b-list-group-item.target-list-item(
              v-for="(land, idx) in landTargets"
              :key="'L'+idx"
            )
              .d-flex.w-100.justify-content-between.align-items-center
                div
                  b-badge.mr-2(variant="success") 土地
                  span.font-weight-bold {{ land.地段 }}
                  span.text-secondary.ml-1 {{ land.地號 }}
                small.text-muted.d-block.mt-1 面積: {{ land.面積 || '無資料' }}

            //- 建物標的清單
            b-list-group-item.target-list-item.building(
              v-for="(building, idx) in buildTargets"
              :key="'B'+idx"
            )
              .d-flex.w-100.align-items-center
                b-badge.mr-2.text-white(variant="warning") 建物
                span.font-weight-bold {{ building.地段 }}
                span.text-secondary.ml-1 {{ building.建號 }}

            //- 無標的防呆
            b-list-group-item.text-center.text-muted(v-if="totalTargets === 0")
              | 本案尚無標的資訊

      //- 右半部：進階屬性與各課耗時區塊 (佔據剩餘 2/3 版面 lg="8")
      b-col(cols="12" lg="8").mb-4
        h6.font-weight-bold.text-primary.mb-3 📊 案件細節與耗時
        b-row.align-items-start
          //- 屬性卡片 (若無耗時資料則動態佔滿整寬 md="12"，否則與耗時平分 md="6")
          b-col(cols="12" :md="hasElapsedTime ? 6 : 12").mb-3
            b-card(bg-variant="light" border-variant="light" body-class="p-3 shadow-sm rounded")
              h6.font-weight-bold.text-dark.mb-3.border-bottom.pb-2 🏷️ 屬性資訊
              //- 使用 2x2 Grid 進行內部排列
              b-row
                b-col(cols="6").mb-2
                  .small.text-muted 管轄區域
                  .font-weight-bold.text-dark {{ bakedData.區名稱 || '無資料' }}
                b-col(cols="6").mb-2
                  .small.text-muted 目前作業人員
                  .font-weight-bold.text-dark {{ bakedData.作業人員 ? maskName(bakedData.作業人員) : '無資料' }}
                b-col(cols="6").mb-2
                  .small.text-muted 結案狀態
                  .font-weight-bold.text-dark
                    | {{ bakedData.結案狀態 || '尚未結案' }}
                    b-badge.ml-1(v-if="bakedData.結案代碼" variant="secondary" pill) {{ bakedData.結案代碼 }}
                b-col(cols="6").mb-2
                  .small.text-muted 測量案件
                  .font-weight-bold.text-dark {{ bakedData.測量案件 || '--' }}

          //- 耗時卡片 (無資料則隱藏)
          b-col(cols="12" md="6").mb-3(v-if="hasElapsedTime")
            b-card(bg-variant="light" border-variant="light" body-class="p-3 shadow-sm rounded")
              h6.font-weight-bold.text-dark.mb-3.border-bottom.pb-2 ⏱️ 階段辦理耗時
              //- 內部改用 3 欄 Grid (2x3) 進行排列
              b-row
                b-col(cols="4").mb-2(
                  v-for="(val, key) in bakedData.ELAPSED_TIME"
                  :key="key"
                )
                  .small.text-muted {{ key }}
                  .font-weight-bold.mt-1
                    b-badge(
                      :variant="val > 0 ? 'info' : 'light'"
                      :class="val > 0 ? '' : 'text-muted'"
                      pill
                    ) {{ formatElapsed(val) }}

</template>

<script>
import lahAvatar from '~/components/lah-avatar.vue';
import lahUserCard from '~/components/lah-user-card.vue';
import regCaseBase from '~/mixins/lah-reg-case-base.js';

export default {
  name: 'LahRegCaseStatusMasked',
  components: { lahUserCard, lahAvatar },
  mixins: [regCaseBase],
  props: {
    noTitle: { type: Boolean, default: false }
  },
  data: () => ({
    localCRCRDData: false
  }),
  computed: {
    ongoing () {
      return this.ready && this.bakedData.結案與否 === 'N'
    },
    hasFixData () {
      return !this.$utils.empty(this.id) && !this.$utils.empty(this.bakedData?.通知補正日期)
    },
    fixDataText () {
      return this.localCRCRDData?.RC05 || '⚠ 本地資料庫無資料，若為跨所案件請先確認該案件有同步過來❗'
    },
    // 動態判斷是否有辦理耗時資料
    hasElapsedTime () {
      return this.bakedData?.ELAPSED_TIME && Object.keys(this.bakedData.ELAPSED_TIME).length > 0
    },
    // =====================================
    // 標的資訊解析 (相容單筆扁平化與多筆陣列)
    // =====================================
    landTargets () {
      const d = this.bakedData
      if (!d) { return [] }
      // 若後端有正常給予陣列
      if (Array.isArray(d.土地標的) && d.土地標的.length > 0) { return d.土地標的 }
      // Fallback: 從扁平欄位中榨取單筆資料
      if (!this.$utils.empty(d.地號) && d.地號 !== '0000-0000') {
        return [{ 地段: d.段小段 || d.RM11_CHT, 地號: d.地號, 面積: d.土地面積 }]
      }
      return []
    },
    buildTargets () {
      const d = this.bakedData
      if (!d) { return [] }
      // 若後端有正常給予陣列
      if (Array.isArray(d.建物標的) && d.建物標的.length > 0) { return d.建物標的 }
      // Fallback: 從扁平欄位中榨取單筆資料
      if (!this.$utils.empty(d.建號) && d.建號 !== '00000-000') {
        return [{ 地段: d.段小段 || d.RM11_CHT, 建號: d.建號, 門牌: d.門牌 }]
      }
      return []
    },
    totalTargets () {
      return this.landTargets.length + this.buildTargets.length
    },
    // 將扁平的 API 欄位轉換為時間軸陣列 (依標準地政辦理順序)
    timelineEvents () {
      const events = []
      const d = this.bakedData
      if (!d) { return events }

      const addEvent = (title, user, userId, date, time = '', extra = '') => {
        // 過濾 API 的不合法字元 (如 " ")
        const dStr = String(date || '').trim()
        const tStr = String(time || '').trim()

        // 嚴格把關：必須要「有填寫正常的日期或時間」才加入歷程顯示
        if (dStr.length > 0 || tStr.length > 0) {
          events.push({
            title,
            user,
            userId,
            date: dStr,
            time: tStr,
            extra
          })
        }
      }

      addEvent('收件', d.收件人員, d.RM07_ID, d.收件時間)
      addEvent('移轉課長', d.移轉課長, d.RM106, d.移轉課長時間)
      addEvent('移轉秘書', d.移轉秘書, d.RM107, d.移轉秘書時間)
      addEvent('初審', d.初審人員, d.RM45, d.初審時間)

      addEvent('請示', d.請示人員, d.RM82, d.請示日期, d.請示時間)
      addEvent('取消請示', d.取消請示人員, d.RM85, d.取消請示日期, d.取消請示時間)
      addEvent('展期', d.展期人員, d.RM88, d.展期日期, '', d.展期天數 ? `天數：${d.展期天數}` : '')
      addEvent('通知補正', '', '', d.通知補正日期, '', d.補正期滿日期 ? `期滿：${d.補正期滿日期}` : '')
      addEvent('補正完成', '', '', d.補正日期)
      addEvent('公告', '', '', d.公告日期, '', d.公告期滿日期 ? `期滿：${d.公告期滿日期}` : '')

      addEvent('複審', d.複審人員, d.RM47, d.複審時間)
      addEvent('駁回', '', '', d.駁回日期)
      addEvent('准登', d.准登人員, d.RM63, d.准登日期)
      addEvent('登錄', d.登錄人員, d.RM55, d.登錄日期)
      addEvent('校對', d.校對人員, d.RM57, d.校對日期)
      addEvent('結案', d.結案人員, d.RM59, d.結案日期)

      // =====================================
      // 歷程色彩與漸層計算邏輯
      // =====================================
      const errorStates = ['通知補正', '駁回']
      const startStates = ['收件']
      const endStates = ['結案', '補正完成']

      // 先統計「中間過程」的總數量，作為漸層深度的分母
      let intermediateCount = 0
      events.forEach((e) => {
        if (!errorStates.includes(e.title) && !startStates.includes(e.title) && !endStates.includes(e.title)) {
          intermediateCount++
        }
      })

      // 第二次迴圈：分配具體顏色屬性
      let currentIntermediateIndex = 0
      events.forEach((e) => {
        if (startStates.includes(e.title)) {
          // 起始：灰色
          e.variant = 'secondary'
          e.textClass = 'text-white'
        } else if (endStates.includes(e.title)) {
          // 終點：綠色
          e.variant = 'success'
          e.textClass = 'text-white'
        } else if (errorStates.includes(e.title)) {
          // 異常：紅色
          e.variant = 'danger'
          e.textClass = 'text-white'
        } else {
          // 中間處理過程：動態黃色漸層 (越靠近結案顏色越深)
          // 透過 HSL 色彩模型調整亮度 (Lightness)
          // 最淺 90% (極淡黃) -> 最深 50% (飽和金黃)
          const L = intermediateCount > 1
            ? 90 - (currentIntermediateIndex * (40 / (intermediateCount - 1)))
            : 70

          e.variant = 'light' // 設為 light 使字體不被 bootstrap 覆蓋
          e.bgStyle = `hsl(45, 100%, ${L}%)` // 覆寫背景色
          e.textClass = 'text-dark' // 強制黑字確保閱讀性
          currentIntermediateIndex++
        }
      })

      return events
    }
  },
  watch: {
    hasFixData (flag) {
      flag && this.getLocalFixData()
    }
  },
  methods: {
    // 判斷是否為自然人 (首碼英文 + 9碼數字)
    isNaturalPerson (id) {
      if (this.$utils.empty(id)) { return false }
      return /^[a-zA-Z][a-zA-Z0-9]\d{8}$/.test(String(id))
    },
    // 統編遮蔽 (僅針對自然人遮蔽中間三碼)
    maskId (id) {
      if (!this.isNaturalPerson(id)) { return id }
      const str = String(id)
      return `${str.substring(0, 4)}ＯＯＯ${str.substring(7)}`
    },
    // 姓名遮蔽 (若附帶統編且非自然人則不遮蔽)
    maskName (name, id = null) {
      if (this.$utils.empty(name)) { return '' }
      if (id && !this.isNaturalPerson(id)) { return name }

      const str = String(name)
      if (str.length <= 2) {
        return `${str.substring(0, 1)}Ｏ`
      }
      return `${str.substring(0, 1)}${'Ｏ'.repeat(str.length - 2)}${str.substring(str.length - 1)}`
    },
    // 轉換秒數為易讀格式 (天、時、分)
    formatElapsed (seconds) {
      if (!seconds || seconds <= 0) { return '--' }
      const d = Math.floor(seconds / 86400)
      const h = Math.floor((seconds % 86400) / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const res = []
      if (d > 0) { res.push(`${d}天`) }
      if (h > 0) { res.push(`${h}時`) }
      // 若超過一天或一小時但沒有分鐘，為了精確性仍保留。若全空則預設顯示分鐘
      if (m > 0 || res.length === 0) { res.push(`${m}分`) }
      return res.join(' ')
    },
    getLocalFixData () {
      this.isBusy = true
      this.localCRCRDData = false
      this.$axios.post(this.$consts.API.JSON.XCASE, {
        type: 'get_local_fix_data',
        id: this.id
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.localCRCRDData = { ...data.raw }
        } else {
          this.warning(data.message)
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    showFixDataText () {
      this.modal(this.fixDataText, {
        title: `${this.bakedData.RM01}-${this.bakedData.RM02}-${this.bakedData.RM03} 補正通知內容`
      })
    }
  }
}
</script>

<style lang="scss" scoped>
/* 橫向流程圖樣式微調 */
.timeline-node {
  width: 110px; /* 改為固定節點寬度，確保所有圓圈與箭頭水平間距完美均勻對齊 */
}
.timeline-arrow {
  font-size: 1.2rem;
  opacity: 0.4;
}

/* 標的清單的邊線微調 */
.target-list-item {
  background-color: #f8f9fa;
  border-left: 4px solid #28a745;
}
.target-list-item.building {
  border-left-color: #fd7e14;
}
</style>
