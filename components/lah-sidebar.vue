<template lang="pug">
b-sidebar#lah-sidebar(
  title="選單",
  bg-variant="dark",
  text-variant="light",
  backdrop,
  shadow
)
  template(#title)
    .d-flex.align-items.center(@click="popup")
      lah-avatar.mt-n1.mr-1(:user-data="user", size="1.0")
      span.s-95.greeting.
        {{myinfo.id}}
        {{myinfo.name}}
        {{greeting}}
  client-only
    ul.mt-n3
      li: hr(v-if="displayAnnouncement")

      li: lah-timeline-announcement(
        v-if="displayAnnouncement",
        load-button,
        :load-count="3",
        @announcement-count="handleAnnouncementEvent($event)"
      )

      li: hr

      li: nuxt-link(v-if="isH0 || isInf", to="/bureau").
        #[font-awesome-icon(:icon="['fas', 'tv']", fixed-width, pull="left", size="lg")]
        {{ site }}監控輪播
      li: nuxt-link(to="/reg").
        #[font-awesome-icon(:icon="['fas', 'home']", fixed-width, pull="left", size="lg")]
        智慧控管首頁
      li: nuxt-link(to="/prc").
        #[font-awesome-icon(:icon="['fas', 'money-bill-wave']", fixed-width, pull="left", size="lg")]
        地價小幫手首頁
      li: nuxt-link(to="/sur").
        #[font-awesome-icon(:icon="['fas', 'map-location']", fixed-width, pull="left", size="lg")]
        測量小幫手首頁
      li: nuxt-link(v-if="isInf", to="/inf").
        #[font-awesome-icon(:icon="['fas', 'house-laptop']", fixed-width, pull="left", size="lg")]
        智慧監控首頁
      li: nuxt-link(to="/lab").
        #[font-awesome-icon(:icon="['fas', 'flask-vial']", fixed-width, pull="left", size="lg")]
        地政資訊實驗室首頁

      li: hr

      li(v-if="isVal"): nuxt-link(to="/prc").
        #[font-awesome-icon(:icon="['fas', 'hotel']", fixed-width, size="lg")]
        地價小幫手首頁
      li(v-if="isVal"): nuxt-link(to="/prc/realprice").
        #[font-awesome-icon(:icon="['fas', 'receipt']", fixed-width, size="lg")]
        實價登錄案件控管
      li(v-if="isVal"): nuxt-link(to="/prc/json-converter").
        #[font-awesome-icon(:icon="['fas', 'file-import']", fixed-width, size="lg")]
        實價登錄JSON資料解析
      li(v-if="isVal"): hr

      li(v-if="isSur"): nuxt-link(to="/sur/expire").
        #[font-awesome-icon(:icon="['far', 'calendar-alt']", fixed-width, size="lg")]
        測量逾期案件
      li(v-if="isSur"): hr

      li(v-if="isReg || isInf"): nuxt-link(to="/reg/expire").
        #[font-awesome-icon(:icon="['far', 'calendar-check']", fixed-width, size="lg")]
        即將逾期案件(登記)
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/ask-for-instructions").
        #[font-awesome-icon(:icon="['fas', 'user-tie']", fixed-width, size="lg")]
        取消請示案件
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/reg-fix-case").
        #[font-awesome-icon(:icon="['fas', 'pager']", fixed-width, size="lg")]
        補正期滿案件
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/expiry-of-announcement").
        #[font-awesome-icon(:icon="['fa', 'sticky-note']", fixed-width, size="lg")]
        公告案件控管
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/reg-untaken-case").
        #[font-awesome-icon(:icon="['fas', 'stamp']", fixed-width, size="lg")]
        領件控管
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/reg-not-done-case").
        #[font-awesome-icon(:icon="['fas', 'bullhorn']", fixed-width, size="lg")]
        辦畢通知案件
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/foreigner-inheritance-restriction").
        #[font-awesome-icon(:icon="['fas', 'earth-asia']", fixed-width, size="lg")]
        外國人繼承限制繼承管制
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/trust").
        #[font-awesome-icon(:icon="['fas', 'money-check-alt']", fixed-width, size="lg")]
        信託相關案件
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/not-done-change").
        #[font-awesome-icon(:icon="['fas', 'monument']", fixed-width, size="lg")]
        未辦繼承標的註記異動
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/land-ref-change").
        #[font-awesome-icon(:icon="['fas', 'landmark']", fixed-width, size="lg")]
        土地參考資訊檔異動
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/agriculture-375-change").
        #[font-awesome-icon(:icon="['fas', 'border-all']", fixed-width, size="lg")]
        375租約異動
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/non-scrivener-case").
        #[font-awesome-icon(:icon="['fas', 'user-tag']", fixed-width, size="lg")]
        非專業代理人案件
      li(v-if="isReg || isInf"): NuxtLink(to="/reg/foreigner-case").
        #[font-awesome-icon(:icon="['fas', 'user-astronaut']", fixed-width, size="lg")]
        外國人地權案件
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/foreigner").
        #[font-awesome-icon(:icon="['far', 'file-pdf']", fixed-width, size="lg")]
        外國人掃描資料
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/stats").
        #[font-awesome-icon(:icon="['fas', 'chart-line']", fixed-width, size="lg")]
        分時案件統計
      li(v-if="isReg || isInf"): nuxt-link(to="/reg/stats/monthly").
        #[font-awesome-icon(:icon="['fas', 'calculator']", fixed-width, size="lg")]
        案件統計資訊

      li: hr

      li(v-if="authority.isNotifyMgtStaff || authority.isAdmin"): nuxt-link(
        to="/notification"
      ).
        #[font-awesome-icon(:icon="['far', 'comment-dots']", fixed-width, size="lg")]
        發布即時通公告
      li: nuxt-link(to="/message").
        #[font-awesome-icon(:icon="['far', 'comments']", fixed-width, size="lg")]
        傳送即時通訊息
      li: a(
        :href="`${this.legacyUrl}/shortcuts.html`",
        target="_blank",
        rel="noreferrer noopener"
      ).
        #[font-awesome-icon(:icon="['far', 'bookmark']", fixed-width, size="lg")]
        書籤
      li: nuxt-link(to="/users").
        #[font-awesome-icon(:icon="['far', 'user-circle']", fixed-width, size="lg")]
        員工名錄
      li: a(
        :href="`${this.legacyUrl}/carousel.html`",
        target="_blank",
        rel="noreferrer noopener"
      ).
        #[font-awesome-icon(:icon="['far', 'newspaper']", fixed-width, size="lg")]
        海報輪撥
      li: a(
        :href="`${this.legacyUrl}/stats.html`",
        target="_blank",
        rel="noreferrer noopener"
      ).
        #[font-awesome-icon(:icon="['fas', 'calculator']", fixed-width, size="lg")]
        統計看板
      li: a(
        :href="`${this.legacyUrl}/helper.html`",
        target="_blank",
        rel="noreferrer noopener"
      ).
        #[font-awesome-icon(:icon="['fas', 'hands-helping']", fixed-width, size="lg")]
        業務小幫手
      li: a(
        :href="`${this.legacyUrl}/index.html`",
        target="_blank",
        rel="noreferrer noopener"
      ).
        #[font-awesome-icon(:icon="['fas', 'calendar-day']", fixed-width, size="lg")]
        今日案件追蹤

      li(v-if="authority.isAdmin"): hr

      li(v-if="!authority.isAdmin"): nuxt-link(to="/login").
        #[font-awesome-icon(:icon="['fas', 'sign-in-alt']", fixed-width, size="lg")]
        管理者登入

      li(v-if="!authority.isAdmin"): hr

      li: a(
        href="https://github.com/pyliu/LAH-NUXTJS",
        target="_blank",
        rel="noopener noreferrer"
      ).
        #[font-awesome-icon(:icon="['fab', 'github']", fixed-width, pull="left", size="lg")]
        原始碼
      li: b-link(@click="triggerClear").
        #[font-awesome-icon(:icon="['fas', 'hand-sparkles']", fixed-width, size="lg")]
        清除本系統快取資料

      li: hr
  template(#footer)
    .d-flex.bg-dark.text-light.justify-content-between.px-3.py-2.align-middle
      span.s-75.text-muted.my-auto {{ ip }}
      b-link(href="mailto:pangyu.liu@gmail.com")
        lah-fa-icon.s-75.text-muted.my-auto(
          icon="copyright",
          title="寄信給 LIU, PANG-YU"
        ) LIU, PANG-YU
</template>

<script>
import lahAvatar from '~/components/lah-avatar.vue'
import LahUserCard from '~/components/lah-user-card.vue'
export default {
  components: { lahAvatar, LahUserCard },
  fetchOnServer: false,
  data: () => ({
    displayAnnouncement: true
  }),
  computed: {
    isAuthorized () {
      return this.authority.isAdmin
    },
    greeting () {
      const hours = new Date().getHours()
      return hours > 11 ? (hours > 17 ? '晚安' : '午安') : '早安'
    }
  },
  methods: {
    handleAnnouncementEvent (payload) {
      if (payload.count && payload.count > 0) {
        this.displayAnnouncement = true
      } else {
        this.displayAnnouncement = false
      }
    },
    triggerClear () {
      this.confirm('請確認要清除快取資料？').then((ans) => {
        if (ans) {
          this.clearCache()
          this.notify('清除快取資料完成，3秒後自動整理頁面。')
          this.timeout(() => location.reload(), 3000)
        }
      })
    },
    popup () {
      this.modal(
        this.$createElement('lah-user-card', {
          props: {
            id: this.myinfo.id,
            name: this.myinfo.name,
            from: this.ip
          }
        }),
        {
          title: `${this.myinfo.id} ${this.myinfo.name} 資訊`,
          size: 'md'
        }
      )
    }
  }
}
</script>

<style lang="scss" scoped>
#lah-sidebar {
  a {
    font-size: 1rem;
    display: flex;
    text-decoration: none;
    &:hover {
      font-weight: bold;
      font-size: 1.1rem;
    }
    &:active {
      font-weight: bold;
      font-size: 1.2rem;
    }
    &.nuxt-link-exact-active {
      @extend :active;
      color: rgb(255, 255, 255) !important;
    }
    svg {
      margin-right: 0.4rem;
    }
  }
  ul {
    list-style-type: none;
    padding: 0;
    li {
      margin: 8px 16px;
      a {
        color: rgb(187, 184, 184);
      }
    }
  }
  hr {
    border: 1px solid rgb(138, 135, 135);
    border-radius: 2px;
  }
  .greeting {
    cursor: pointer;
  }
}
</style>
