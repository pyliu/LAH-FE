<template lang="pug">
div(v-cloak)
  b-carousel(
    ref="carousel",
    v-model="slideIdx",
    :interval="effectiveInterval",
    no-hover-pause
  )
    b-carousel-slide: template(#img): .p-3
      //- 標題區塊
      .d-flex.flex-column.align-items-center.w-100.my-auto
        .d-flex.mt-4.mb-2.cursor-pointer(@click="switchSlide(1)", title="點擊切換版面")
          .h1.lah-shadow.font-weight-bold.mb-0 跨縣市#[span.text-success ONLINE]即時通，服務無礙一點通
        //- 控制工具列
        .display-toolbar.d-flex.flex-wrap.justify-content-center.align-items-center.px-3.py-1.rounded-pill.border.bg-white.lah-shadow.my-2
          b-button-group.mr-2(size="sm")
            b-button(
              :variant="slideIdx === 0 ? 'primary' : 'outline-primary'",
              @click="switchSlide(0)"
            )
              lah-fa-icon.mr-1(icon="network-wired")
              | 跨縣市連線
              b-badge.ml-1(:variant="downOffices.length === 0 ? 'success' : 'danger'") {{ downOffices.length === 0 ? '正常' : `異常 ${downOffices.length}` }}
            b-button(
              :variant="slideIdx === 1 ? 'info' : 'outline-info'",
              @click="switchSlide(1)"
            )
              lah-fa-icon.mr-1(icon="bolt")
              | 簡易案件
              b-badge.ml-1(variant="light") {{ easyCases.length }}
          b-button.mr-1(
            size="sm",
            :variant="isPaused ? 'warning' : 'outline-secondary'",
            :title="isPaused ? '恢復自動輪播' : '暫停自動輪播'",
            @click="isPaused = !isPaused"
          )
            lah-fa-icon.mr-1(:icon="isPaused ? 'play' : 'pause'")
            | {{ isPaused ? '已暫停' : '輪播中' }}
          b-button.mr-1(
            size="sm",
            variant="outline-primary",
            :disabled="isReloading",
            title="立即重新檢測全國與本市地所狀態",
            @click="manualReload"
          )
            lah-fa-icon.mr-1(icon="arrows-rotate", :action="isReloading ? 'spin' : ''")
            | 立即更新
          b-button.mr-1(
            size="sm",
            variant="outline-danger",
            title="檢視離線伺服器歷史紀錄",
            @click="showOfflineRecords"
          )
            lah-fa-icon.mr-1(icon="link-slash")
            | 離線紀錄
          b-button.mr-1(
            size="sm",
            variant="outline-dark",
            title="切換全螢幕顯示",
            @click="toggleFullscreen"
          )
            lah-fa-icon(:icon="isFullscreen ? 'compress' : 'expand'")
          b-button(
            v-b-modal.help-modal,
            size="sm",
            variant="outline-success",
            title="頁面說明"
          )
            lah-fa-icon(icon="question")

      .my-2

      //- 桃園市地所狀態標題
      .d-flex.justify-content-between.align-items-center.flex-wrap
        .d-flex.align-items-center
          lah-fa-icon.h2.mb-0(icon="wave-square", action="squeeze") 桃園市所屬地所服務狀態
          b-badge.ml-2.p-2(
            :variant="tyAbnormalCount === 0 ? 'success' : 'danger'",
            pill
          ) {{ tyAbnormalCount === 0 ? `全數正常 (${offices.length} 所)` : `異常 ${tyAbnormalCount} / ${offices.length} 所` }}
          small.text-muted.ml-2 (點擊地所可立即重測)
        lah-fa-icon.h4.mb-0(
          icon="clock",
          variant="primary",
          action="clock"
        ) 上次更新：{{ TYUpdatedTime || '檢測中...' }}
      hr.my-3

      //- 桃園市地所區塊
      client-only: .ty-offices-row.d-flex.flex-nowrap.justify-content-between.w-100
        lah-badge-site-status.office.mb-4.lah-shadow(
          v-for="office in offices",
          :ref="office",
          :key="office",
          :watch-site="office",
          :period="hxTimer",
          :fill="false",
          :badge="false",
          text-variant="",
          text-bold,
          short-alt,
          @updated="handleTYSitesUpdated"
        )

      .my-2

      //- 無法提供服務的地所標題
      .d-flex.justify-content-between.align-items-center.flex-wrap
        .d-flex.align-items-center
          lah-fa-icon.h2.mb-0(
            icon="heart-pulse",
            action="heartbeat",
            :variant="downOffices.length === 0 ? 'success' : 'danger'"
          )
            span 無法提供服務的地所
            span.ml-1 ({{ downOffices.length }})
          b-badge.ml-2.p-2(
            v-if="validOfficesData.length > 0",
            :variant="downOffices.length === 0 ? 'success' : 'warning'",
            pill
          ) 全國正常 {{ validOfficesData.length - downOffices.length }} / {{ validOfficesData.length }} 所
          small.text-muted.ml-2(v-if="downOffices.length > 0") (點擊異常地所可檢視原因)
        .d-flex.align-items-center
          lah-fa-icon.mr-2(
            v-if="isReloading",
            icon="spinner",
            variant="primary",
            action="spin"
          ) 更新中...
          lah-fa-icon.h4.mb-0(
            icon="clock",
            variant="muted"
          ) 上次更新：{{ updatedTime || '讀取中...' }}
      hr.my-3

      //- 無法提供服務地所清單
      .h1.center.py-4.text-muted(
        v-if="isReloading && validOfficesData.length === 0"
      )
        lah-fa-icon.mr-2(icon="spinner", action="spin")
        span 正在檢測全國各地所連線狀態...
      .h1.center.py-3(
        v-else-if="downOffices.length === 0"
      ) 🟢 全國各地所皆可正常提供服務
      .d-flex.flex-wrap.justify-content-start(
        v-else
      )
        lah-badge-site-status.other-office.mr-4.mb-4.lah-shadow(
          v-for="office in downOffices",
          :ref="office.id",
          :key="office.id",
          :static-data="office",
          :fill="false",
          :badge="false",
          short-alt,
          @click="showOfficeDetail(office)"
        )

    //- 簡易案件辦理情形幻燈片
    b-carousel-slide: template(#img): .p-3
      .d-flex.flex-column.align-items-center.w-100.my-2
        .center.h1.mt-3.mb-2.cursor-pointer(@click="switchSlide(0)", title="點擊切換回跨縣市連線狀態")
          lah-fa-icon(icon="gear", :variant="reloadEasyCase ? 'warning' : ''", :action="reloadEasyCase ? 'cycle' : 'clock'")
            span.ld-txt(v-if="reloadEasyCase") 讀取中 ...
            span(v-else) 最新#[span.text-info 簡易案件]辦理情形
          lah-fa-icon.ml-1(icon="gear", :variant="reloadEasyCase ? 'warning' : ''", :action="reloadEasyCase ? 'cycle' : 'clock'")
        .display-toolbar.d-flex.flex-wrap.justify-content-center.align-items-center.px-3.py-1.rounded-pill.border.bg-white.lah-shadow.mb-2
          b-button-group.mr-2(size="sm")
            b-button(
              :variant="slideIdx === 0 ? 'primary' : 'outline-primary'",
              @click="switchSlide(0)"
            )
              lah-fa-icon.mr-1(icon="network-wired")
              | 跨縣市連線
              b-badge.ml-1(:variant="downOffices.length === 0 ? 'success' : 'danger'") {{ downOffices.length === 0 ? '正常' : `異常 ${downOffices.length}` }}
            b-button(
              :variant="slideIdx === 1 ? 'info' : 'outline-info'",
              @click="switchSlide(1)"
            )
              lah-fa-icon.mr-1(icon="bolt")
              | 簡易案件
              b-badge.ml-1(variant="light") {{ easyCases.length }}
          span.small.text-muted.mr-2 查詢日期：{{ $utils.addDateDivider(easyCaseQueryDay) }}｜更新：{{ easyCaseUpdatedTime || '讀取中...' }}
          b-button.mr-1(
            size="sm",
            :variant="isPaused ? 'warning' : 'outline-secondary'",
            @click="isPaused = !isPaused"
          )
            lah-fa-icon.mr-1(:icon="isPaused ? 'play' : 'pause'")
            | {{ isPaused ? '已暫停' : '輪播中' }}
          b-button.mr-1(
            size="sm",
            variant="outline-primary",
            :disabled="reloadEasyCase",
            @click="loadEasyCaseState"
          )
            lah-fa-icon.mr-1(icon="arrows-rotate", :action="reloadEasyCase ? 'spin' : ''")
            | 重新整理
          b-button(
            v-b-modal.help-modal,
            size="sm",
            variant="outline-success",
            title="頁面說明"
          )
            lah-fa-icon(icon="question")

      .h2.center.py-5.text-muted(v-if="easyCases.length === 0")
        lah-fa-icon.mr-2(icon="clipboard-check", variant="secondary")
        span 今日（{{ $utils.addDateDivider(easyCaseQueryDay) }}）目前尚無簡易案件辦理紀錄
      lah-reg-tracking-cards(
        v-else,
        :rows="easyCases",
        :query-day="easyCaseQueryDay",
        :serial-start="1"
      )

  //- 固定顯示元件
  lah-clock.fix-clock
  .fix-logo
  .fix-taogirl-L.lah-shadow
  .fix-taogirl-R.lah-shadow

  //- 頁面說明視窗
  lah-help-modal(:modal-id="'help-modal'", size="lg")
    h5 跨縣市 ONLINE 即時通 ＆ 最新簡易案件看板說明
    ul
      li 本頁為#[strong 民眾端公播看板]與#[strong 跨縣市跨域服務即時監控]展示頁面，支援自動輪播「跨縣市連線狀態」與「今日最新簡易案件辦理情形」兩大版面。
      li 預設每 #[strong 30 秒]自動切換版面（若當日尚無簡易案件，自動輪播會維持於跨縣市連線版面；您仍可點擊上方按鈕手動切換）。
    h6.mt-3 版面一：跨縣市 ONLINE 即時通
    ol
      li #[strong 桃園市所屬地所服務狀態（HA～HH 共 8 所）]：前端每 1～5 分鐘主動檢測本市各地所連線狀態（正常時 3～5 分鐘、異常時每 1 分鐘重測）。#[strong 點擊任一桃園地所方塊]可立即手動重新測試該所連線。
      li #[strong 無法提供服務的地所（全國跨域主機）]：每 5 分鐘同步全國各縣市地政事務所跨域 AP 狀態。當有地所異常離線時會列於此區，#[strong 點擊異常地所方塊]可彈窗檢視錯誤回應訊息與最後檢測時間。
      li #[strong 狀態燈號意義]：
        div.mt-1
          span.mr-3 🟢 #[strong 綠燈]：服務連線正常
          span.mr-3 🟡 #[strong 黃燈]：連線逾時或重試檢測中
          span 🔴 #[strong 紅燈]：連線異常，暫時無法提供跨縣市／跨所服務
    h6.mt-3 版面二：最新簡易案件辦理情形
    ol
      li 每 #[strong 1 分鐘]自動查詢當日收件屬「簡易案件（代碼 #[code RM08 = '9']）」之案件，依最新異動時間排序顯示前 #[strong 12 件]。
      li 卡片顏色對應辦理進度：#[b-badge(variant="success") 綠框] 結案／異動完成／歸檔／公告、#[b-badge(variant="warning") 黃框] 登錄／校對、#[b-badge(variant="info") 藍框] 初審／複審／准登、#[b-badge(variant="danger") 紅框] 補正／請示／展期／駁回／撤回。
      li 點擊卡片中央「狀態」按鈕可開啟該案件詳細辦理情形。
    h6.mt-3 頂部控制工具列操作
    ul
      li #[strong 跨縣市連線 ／ 簡易案件]：立即切換指定版面，並顯示目前異常所數與今日簡易案件數。
      li #[strong 輪播中 ／ 已暫停]：可暫停自動輪播以固定停留於目前畫面，或恢復自動輪播。
      li #[strong 立即更新]：強制略過快取，重新檢測桃園市 8 所、全國跨域主機與簡易案件狀態。
      li #[strong 離線紀錄]：開啟全國各所近期離線／恢復之歷史時間軸紀錄。
      li #[strong 全螢幕按鈕]：一鍵進入或退出瀏覽器全螢幕模式，適合公播電視牆展示。
</template>

<script>
import lahOfficeDownTimeline from '~/components/lah-office-down-timeline.vue'
export default {
  components: { lahOfficeDownTimeline },
  data: () => ({
    offices: ['HA', 'HB', 'HC', 'HD', 'HE', 'HF', 'HG', 'HH'],
    tySiteStates: {},
    hxTimer: '60000', // 1 min
    cachedTimer: 300000, // 5 mins
    cachedOfficesData: [],
    cachedHandler: null,
    easyCaseHandler: null,
    girlLHandler: null,
    girlRHandler: null,
    updatedTime: '',
    TYUpdatedTime: '',
    easyCaseUpdatedTime: '',
    animatedTimerBase: 5000,
    slideInterval: 30000,
    slideIdx: 0,
    isPaused: false,
    isReloading: false,
    isFullscreen: false,
    isDestroyed: false,
    maxQueueSize: 12,
    easyCaseQueryDay: '',
    easyCases: [],
    reloadEasyCase: false
  }),
  head: {
    title: '跨縣市ONLINE即時通-桃園市地政局'
  },
  computed: {
    validOfficesData () {
      return this.cachedOfficesData.filter(siteData => !['CB', 'CC'].includes(siteData.id))
    },
    downOffices () {
      return this.validOfficesData.filter(siteData => siteData.state === 'DOWN')
    },
    tyAbnormalCount () {
      return Object.values(this.tySiteStates).filter(st => st <= 0).length
    },
    effectiveInterval () {
      if (this.isPaused) { return 0 }
      if (this.easyCases.length === 0 && this.slideIdx === 0) { return 0 }
      return this.slideInterval
    }
  },
  created () {
    this.easyCaseQueryDay = this.$utils.today('TW').replaceAll('-', '')
  },
  mounted () {
    this.reload(false)
    this.loadEasyCaseState()
    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', this.syncFullscreenState)
    }
    this.$nextTick(() => {
      this.animateGirlL()
      this.animateGirlR()
    })
  },
  beforeDestroy () {
    this.isDestroyed = true
    clearTimeout(this.cachedHandler)
    clearTimeout(this.easyCaseHandler)
    clearTimeout(this.girlLHandler)
    clearTimeout(this.girlRHandler)
    if (typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', this.syncFullscreenState)
    }
  },
  methods: {
    switchSlide (idx) {
      this.slideIdx = idx
    },
    handleTYSitesUpdated (payload) {
      if (payload && payload.site) {
        this.$set(this.tySiteStates, payload.site, payload.status)
      }
      this.TYUpdatedTime = this.$utils.formatTime(new Date())
    },
    manualReload () {
      this.reload(true)
      this.loadEasyCaseState()
      this.offices.forEach((code) => {
        const refItem = this.$refs[code]
        const comp = Array.isArray(refItem) ? refItem[0] : refItem
        if (comp && typeof comp.check === 'function') {
          comp.check(true)
        }
      })
    },
    reload (force = false) {
      clearTimeout(this.cachedHandler)
      this.isReloading = true
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_xap_stats',
          force
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status) && Array.isArray(data.raw)) {
            this.cachedOfficesData = [...data.raw]
          }
          this.updatedTime = this.$utils.formatTime(new Date())
        })
        .catch((err) => {
          this.$utils.error(err)
        })
        .finally(() => {
          this.isReloading = false
          if (!this.isDestroyed) {
            this.timeout(() => this.reload(false), this.cachedTimer).then((handle) => {
              this.cachedHandler = handle
            })
          }
        })
    },
    showOfficeDetail (office) {
      if (!office) { return }
      const updated = office.timestamp
        ? this.$utils.formatTime(new Date(office.timestamp * 1000))
        : (this.updatedTime || '未知')
      this.modal(
        `<div class="h5 mb-0">
          <div class="mb-2"><strong>地所代碼：</strong>${office.id}</div>
          <div class="mb-2"><strong>地所名稱：</strong>${office.name}</div>
          <div class="mb-2"><strong>連線狀態：</strong><span class="text-danger font-weight-bold">${office.state} (無法提供服務)</span></div>
          <div class="mb-2"><strong>回應訊息：</strong><span class="text-danger">${office.response || '無回應'}</span></div>
          <div><strong>檢測時間：</strong>${updated}</div>
        </div>`,
        {
          title: `${office.id} ${office.name} 連線異常詳情`,
          html: true
        }
      )
    },
    showOfflineRecords () {
      this.modal(this.$createElement(lahOfficeDownTimeline, {
        props: {
          maxHeight: false,
          hideFooter: true
        }
      }), {
        title: '離線伺服器歷史資訊',
        size: 'lg'
      })
    },
    toggleFullscreen () {
      if (typeof document === 'undefined') { return }
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen && document.documentElement.requestFullscreen()
      } else {
        document.exitFullscreen && document.exitFullscreen()
      }
    },
    syncFullscreenState () {
      if (typeof document !== 'undefined') {
        this.isFullscreen = Boolean(document.fullscreenElement)
      }
    },
    animateGirlL () {
      if (this.isDestroyed) { return }
      return this.$utils.animated('.fix-taogirl-L', { speed: 'slow' }).then(() => {
        if (this.isDestroyed) { return }
        const timer = this.animatedTimerBase + this.$utils.rand(this.animatedTimerBase)
        this.timeout(this.animateGirlL, timer).then((h) => { this.girlLHandler = h })
      })
    },
    animateGirlR () {
      if (this.isDestroyed) { return }
      return this.$utils.animated('.fix-taogirl-R', { speed: 'slow' }).then(() => {
        if (this.isDestroyed) { return }
        const timer = this.animatedTimerBase + this.$utils.rand(this.animatedTimerBase)
        this.timeout(this.animateGirlR, timer).then((h) => { this.girlRHandler = h })
      })
    },
    loadEasyCaseState () {
      clearTimeout(this.easyCaseHandler)
      this.easyCaseQueryDay = this.$utils.today('TW').replaceAll('-', '')
      this.reloadEasyCase = true
      this.$axios.post(this.$consts.API.JSON.MOICAS, {
        type: 'crsms_update_by_date',
        qday: this.easyCaseQueryDay
      }).then(({ data }) => {
        const baked = Array.isArray(data.baked) ? data.baked : []
        this.easyCases = [...this.$utils.orderBy(baked, [(row) => {
          return this.latestUpdateTime(row)
        }], ['desc'])].filter((row) => {
          return row.RM08 === '9'
        }).slice(0, this.maxQueueSize)
        this.easyCaseUpdatedTime = this.$utils.formatTime(new Date())
      }).catch((err) => {
        console.warn(err)
      }).finally(() => {
        this.reloadEasyCase = false
        if (!this.isDestroyed) {
          this.timeout(this.loadEasyCaseState, 60 * 1000).then((handle) => {
            this.easyCaseHandler = handle
          })
        }
      })
    },
    latestUpdateTime (row) {
      const targetDate = this.easyCaseQueryDay
      let ok = false
      !ok && targetDate === row.RM105_1 && (ok = row.RM105_2)
      !ok && targetDate === row.RM107_1 && (ok = row.RM107_2)
      !ok && targetDate === row.RM106_1 && (ok = row.RM106_2)
      !ok && targetDate === row.RM93_1 && (ok = row.RM93_2)
      !ok && targetDate === row.RM86 && (ok = row.RM87)
      !ok && targetDate === row.RM53_1 && (ok = row.RM53_2)
      !ok && targetDate === row.RM48_1 && (ok = row.RM48_2)
      !ok && targetDate === row.RM83 && (ok = row.RM84)
      !ok && targetDate === row.RM80 && (ok = row.RM81)
      !ok && targetDate === row.RM58_1 && (ok = row.RM58_2)
      !ok && targetDate === row.RM56_1 && (ok = row.RM56_2)
      !ok && targetDate === row.RM54_1 && (ok = row.RM54_2)
      !ok && targetDate === row.RM46_1 && (ok = row.RM46_2)
      !ok && targetDate === row.RM62_1 && (ok = row.RM62_2)
      !ok && targetDate === row.RM44_1 && (ok = row.RM44_2)
      return ok
    }
  }
}
</script>

<style hide-scroll lang="scss" scoped>
.cursor-pointer {
  cursor: pointer;
}

.display-toolbar {
  z-index: 20;
  opacity: 0.85;
  transition: opacity 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    opacity: 1;
  }
}

// 統一區塊樣式設定
.ty-offices-row {
  gap: 1rem;
}

.office, .other-office {
  height: 15vh;
  border: 1px solid gray;
  border-radius: 15px;
  font-size: xx-large;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
    z-index: 10;
  }
}

.office {
  flex: 1 1 0;
  min-width: 0;
  background-color: white;
}

.other-office {
  width: 11%;
  min-width: 135px;
  background-color: #fff5f5;
  border-color: #dc3545;
  color: black;
  z-index: 2;
}

// 固定的裝飾元件樣式
.fix-logo {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 329px;
  height: 97px;
  background-image: url(~/assets/img/taoyuan_logo.png);
  background-repeat: no-repeat;
  background-size: cover;
  pointer-events: none;
}
.fix-clock {
  position: fixed;
  bottom: 0px;
  right: 10px;
  z-index: 1;
}
.fix-taogirl-R {
  position: fixed;
  top: 10px;
  right: 100px;
  width: 147.5px;
  height: 172.5px;
  background-image: url(~/assets/img/taogirl_L.png);
  background-repeat: no-repeat;
  background-size: cover;
  pointer-events: none;
}
.fix-taogirl-L {
  position: fixed;
  top: 10px;
  left: 100px;
  width: 147.5px;
  height: 172.5px;
  background-image: url(~/assets/img/taogirl_morning_R.png);
  background-repeat: no-repeat;
  background-size: cover;
  pointer-events: none;
}
</style>
