<template lang="pug">
b-card(no-body)
  b-card-header(v-if="!noTitle" class="font-weight-bold d-flex justify-content-between align-items-center")
    span 辦理情形
    b-badge(pill variant="secondary") 去識別化模式

  b-card-body(v-if="ready")
    //- ==========================================
    //- 1. 案件摘要區塊 (Overview)
    //- ==========================================
    b-alert.d-flex.align-items-center.justify-content-between.mb-4(
      :variant="ongoing ? 'warning' : 'success'"
      show
    )
      div
        strong 狀態：
        span.ml-1 {{ ongoing ? '尚未結案' : '已結案' }}
      div
        b-badge(pill :variant="ongoing ? 'danger' : 'success'" class="shadow-sm")
          | {{ bakedData.辦理情形 }}

    b-row.mb-2
      b-col(cols="12" md="6").mb-3
        .text-muted.small.font-weight-bold 登記原因
        .h5.mb-0.text-primary {{ bakedData.登記原因 }}
      b-col(cols="12" md="6").mb-3
        .text-muted.small.font-weight-bold 預定結案日期
        .h5.mb-0(v-html="bakedData.限辦期限")

    hr.mb-4

    //- ==========================================
    //- 2. 關係人區塊 (Parties) - RWD 卡片設計
    //- ==========================================
    h6.font-weight-bold.text-secondary.mb-3 👥 關係人資訊
    b-row.mb-2
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
    //- 3. 標的資訊區塊 (Target info) - 預設收合
    //- ==========================================
    .d-flex.justify-content-between.align-items-center.mb-3
      h6.font-weight-bold.text-success.mb-0 📌 標的資訊
      b-button(v-b-toggle.target-collapse size="sm" variant="outline-success" pill)
        | 查看標的
        b-badge.ml-1(variant="success") {{ totalTargets }} 筆

    b-collapse#target-collapse
      b-card.mb-4.border-success.shadow-sm(body-class="p-0")
        b-list-group(flush)
          //- 土地標的清單
          b-list-group-item.target-list-item(
            v-for="(land, idx) in bakedData.土地標的"
            :key="'L'+idx"
          )
            .d-flex.w-100.justify-content-between.align-items-center
              div
                b-badge.mr-2(variant="success") 土地
                span.font-weight-bold {{ land.地段 }}
                span.text-secondary.ml-1 {{ land.地號 }}
              small.text-muted 面積: {{ land.面積 }}

          //- 建物標的清單
          b-list-group-item.target-list-item.building(
            v-for="(building, idx) in bakedData.建物標的"
            :key="'B'+idx"
          )
            .d-flex.w-100.justify-content-between.align-items-center
              div
                b-badge.mr-2.text-white(variant="warning") 建物
                span.font-weight-bold {{ building.地段 }}
                span.text-secondary.ml-1 {{ building.建號 }}
              small.text-muted 門牌: {{ building.門牌 }}

          //- 無標的防呆
          b-list-group-item.text-center.text-muted(v-if="totalTargets === 0")
            | 本案尚無標的資訊

    hr.mb-4

    //- ==========================================
    //- 4. 辦理歷程時間軸 (Timeline)
    //- ==========================================
    .d-flex.justify-content-between.align-items-center.mb-3
      h6.font-weight-bold.text-info.mb-0 ⏳ 辦理歷程
      b-button(v-b-toggle.timeline-collapse size="sm" variant="outline-info" pill) 
        | 展開 / 收合

    b-collapse#timeline-collapse(visible)
      .lah-timeline.mt-4.mb-2
        //- 動態渲染歷程節點
        .timeline-item(v-for="(event, idx) in timelineEvents" :key="idx")
          .d-flex.justify-content-between.align-items-start
            div
              .font-weight-bold.text-dark {{ event.title }}
              
              //- 額外資訊 (如天數、期滿日)
              .text-muted.small.mt-1(v-if="event.extra") {{ event.extra }}
              
              //- 承辦人員 Badge
              div.mt-2(v-if="event.user")
                b-button(pill variant="outline-secondary" size="sm" @click="userinfo(event.user, event.userId)" class="shadow-sm")
                  lah-avatar(:id="event.userId" :name="event.user")
                    | {{ maskName(event.user) }}
                    
              //- 補正通知專用按鈕
              div.mt-2(v-if="event.title === '通知補正' && hasFixData")
                lah-button(pill size="sm" variant="outline-danger" @click="showFixDataText" icon="exclamation-circle") 查看通知內容

            //- 時間標籤
            .text-right
              b-badge(variant="light" class="text-secondary border") {{ event.date }} {{ event.time }}

        //- 查無歷程的防呆
        .text-center.text-muted.my-3(v-if="timelineEvents.length === 0")
          | 尚無辦理歷程紀錄
</template>

<script>
import lahAvatar from '~/components/lah-avatar.vue';
import regCaseBase from '~/mixins/lah-reg-case-base.js';
import lahUserCard from '~/components/lah-user-card.vue';

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
      // 'E' => 請示
      return this.ready && this.bakedData.結案與否 === 'N'
    },
    hasFixData () {
      return !this.$utils.empty(this.id) && !this.$utils.empty(this.bakedData?.通知補正日期)
    },
    fixDataText () {
      return this.localCRCRDData?.RC05 || '⚠ 本地資料庫無資料，若為跨所案件請先確認該案件有同步過來❗'
    },
    // 計算標的總筆數 (防呆處理)
    totalTargets () {
      const landCount = this.bakedData?.土地標的?.length || 0;
      const buildCount = this.bakedData?.建物標的?.length || 0;
      return landCount + buildCount;
    },
    // 將扁平的 API 欄位轉換為時間軸陣列 (依標準地政辦理順序)
    timelineEvents () {
      const events = []
      const d = this.bakedData
      if (!d) return events

      const addEvent = (title, user, userId, date, time = '', extra = '') => {
        if (!this.$utils.empty(user) || !this.$utils.empty(date)) {
          events.push({ title, user, userId, date, time, extra })
        }
      }

      // 依序加入歷程 (若無資料，addEvent 內部會自動忽略)
      addEvent('收件', d.收件人員, d.RM07_ID, d.收件時間)
      addEvent('移轉課長', d.移轉課長, d.RM106, d.移轉課長時間)
      addEvent('移轉秘書', d.移轉秘書, d.RM107, d.移轉秘書時間)
      addEvent('初審', d.初審人員, d.RM45, d.初審時間)
      
      // 中間可能發生的特殊狀態
      addEvent('請示', d.請示人員, d.RM82, d.請示日期, d.請示時間)
      addEvent('取消請示', d.取消請示人員, d.RM85, d.取消請示日期, d.取消請示時間)
      addEvent('展期', d.展期人員, d.RM88, d.展期日期, '', `展期天數：${d.展期天數} 天`)
      addEvent('通知補正', '', '', d.通知補正日期, '', `補正期滿：${d.補正期滿日期} (期限：${d.補正期限} 天)`)
      addEvent('補正完成', '', '', d.補正日期)
      addEvent('公告', '', '', d.公告日期, '', `公告期滿：${d.公告期滿日期} (天數：${d.公告天數} 天)`)
      
      addEvent('複審', d.複審人員, d.RM47, d.複審時間)
      addEvent('駁回', '', '', d.駁回日期) // 駁回通常在審查階段
      addEvent('准登', d.准登人員, d.RM63, d.准登日期)
      addEvent('登錄', d.登錄人員, d.RM55, d.登錄日期)
      addEvent('校對', d.校對人員, d.RM57, d.校對日期)
      addEvent('結案', d.結案人員, d.RM59, d.結案日期)

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
      if (this.$utils.empty(id)) return false
      return /^[a-zA-Z][a-zA-Z0-9]\d{8}$/.test(String(id))
    },
    // 統編遮蔽 (僅針對自然人遮蔽中間三碼)
    maskId (id) {
      if (!this.isNaturalPerson(id)) return id
      const str = String(id)
      return `${str.substring(0, 4)}ＯＯＯ${str.substring(7)}`
    },
    // 姓名遮蔽 (若附帶統編且非自然人則不遮蔽)
    maskName (name, id = null) {
      if (this.$utils.empty(name)) return ''
      if (id && !this.isNaturalPerson(id)) return name

      const str = String(name)
      if (str.length <= 2) {
        return `${str.substring(0, 1)}Ｏ`
      }
      return `${str.substring(0, 1)}${'Ｏ'.repeat(str.length - 2)}${str.substring(str.length - 1)}`
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
/* 自訂垂直時間軸樣式 */
.lah-timeline {
  border-left: 3px solid #e9ecef;
  padding-left: 1.5rem;
  margin-left: 0.5rem;
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;

  /* 取刺最後一個節點的底部間距 */
  &:last-child {
    margin-bottom: 0;
  }

  /* 時間軸節點圓點 */
  &::before {
    content: '';
    position: absolute;
    left: -1.9rem; /* 配合 border 與 padding 調整圓點位置 */
    top: 0.2rem;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: #17a2b8; /* Bootstrap Info 色 */
    border: 3px solid #fff;
    box-shadow: 0 0 0 1px #17a2b8;
  }
}

/* 標的清單的微調 */
.target-list-item {
  background-color: #f8f9fa;
  border-left: 4px solid #28a745;
}
.target-list-item.building {
  border-left-color: #fd7e14;
}
</style>
