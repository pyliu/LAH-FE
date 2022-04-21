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
      li: hr

      li: nuxt-link(to="/").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'home']", pull="left", size="lg")]
        首頁

      li: hr

      li: lah-sidebar-announcement

      li(v-if="authority.isAdmin || authority.isUserMgtStaff"): hr

      li(v-if="authority.isAdmin"): nuxt-link(to="/admin").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'cogs']", size="lg")]
        系統管理選單

      //- li(v-if="isAuthorized"): nuxt-link(to="/stats").
      //-   #[font-awesome-icon.fixed-width(:icon="['fas', 'calculator']" size="lg")]
      //-   統計看板
      //- li(v-if="isAuthorized"): nuxt-link(to="/playground").
      //-   #[font-awesome-icon.fixed-width(:icon="['fab', 'playstation']" size="lg")]
      //-   測試

      li: hr

      li: nuxt-link(to="/expire").
        #[font-awesome-icon.fixed-width(:icon="['far', 'calendar-check']", size="lg")]
        登記逾期案件
      li: nuxt-link(to="/expire/sur").
        #[font-awesome-icon.fixed-width(:icon="['far', 'calendar-alt']", size="lg")]
        測量逾期案件
      li: nuxt-link(to="/expiry-of-announcement").
        #[font-awesome-icon.fixed-width(:icon="['fa', 'sticky-note']", size="lg")]
        公告案件
      li: nuxt-link(to="/ask-for-instructions").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'user-tie']", size="lg")]
        取消請示案件
      li: nuxt-link(to="/trust").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'money-check-alt']", size="lg")]
        信託相關案件
      li: nuxt-link(to="/non-scrivener-case").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'user-tag']", size="lg")]
        非專業代理人案件
      li: NuxtLink(to="/foreigner-case").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'user-astronaut']", size="lg")]
        外人地權案件
      li: nuxt-link(to="/agriculture-375-change").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'border-all']", size="lg")]
        375租約異動
      li: nuxt-link(to="/not-done-change").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'monument']", size="lg")]
        未辦標的註記異動
      li: nuxt-link(to="/land-ref-change").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'landmark']", size="lg")]
        土地參考資訊檔異動
      li: nuxt-link(to="/reg-fix-case").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'pager']", size="lg")]
        補正期滿案件查詢
      li: nuxt-link(to="/reg-not-done-case").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'bullhorn']", size="lg")]
        辦畢通知案件查詢
      li: nuxt-link(to="/reg-untaken-case").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'stamp']", size="lg")]
        領件管控查詢

      li(v-if="authority.isAdmin || authority.isUserMgtStaff"): hr
      li(v-if="authority.isAdmin"): a(
        :href="`${this.legacyUrl}/dashboard.html`",
        target="_blank",
        rel="noreferrer noopener"
      ).
        #[font-awesome-icon.fixed-width(:icon="['fas', 'chalkboard-teacher']", size="lg")]
        地政系統管理面板
      li: nuxt-link(to="/monitor").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'chart-bar']", size="lg")]
        {{site}} 跨域伺服器監控
      //- li(v-if="authority.isAdmin"): a(
      //-   :href="`${this.legacyUrl}/monitor.html`",
      //-   target="_blank",
      //-   rel="noreferrer noopener"
      //- ).
      //-   #[font-awesome-icon.fixed-width(:icon="['fas', 'columns']", size="lg")]
      //-   跨所伺服器監控面板
      li(v-if="authority.isAdmin"): nuxt-link(to="/admin/mgt").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'diagnoses']", size="lg")]
        {{site}} 智慧監控儀錶板
      li(v-if="authority.isAdmin"): nuxt-link(to="/admin/lxhweb").
        #[font-awesome-icon.fixed-width(:icon="['fab', 'watchman-monitoring']", size="lg")]
        {{site}} 同步異動監控
      li(v-if="authority.isAdmin"): nuxt-link(to="/admin/ip").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'network-wired']", size="lg")]
        IP對應表管理
      li(v-if="authority.isUserMgtStaff || authority.isAdmin"): nuxt-link(
        to="/admin/users"
      ).
        #[font-awesome-icon.fixed-width(:icon="['fas', 'users-cog']", size="lg")]
        員工管理
      li(v-if="authority.isAdmin"): nuxt-link(to="/admin/configs").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'tasks']", size="lg")]
        系統參數設定

      li: hr

      li(v-if="authority.isNotifyMgtStaff || authority.isAdmin"): nuxt-link(
        to="/notification"
      ).
        #[font-awesome-icon.fixed-width(:icon="['far', 'comment-dots']", size="lg")]
        發布即時通公告
      li: nuxt-link(to="/message").
        #[font-awesome-icon.fixed-width(:icon="['far', 'comments']", size="lg")]
        傳送即時通訊息
      li: a(
        :href="`${this.legacyUrl}/shortcuts.html`",
        target="_blank",
        rel="noreferrer noopener"
      ).
        #[font-awesome-icon.fixed-width(:icon="['far', 'bookmark']", size="lg")]
        書籤
      li: nuxt-link(to="/users").
        #[font-awesome-icon.fixed-width(:icon="['far', 'user-circle']", size="lg")]
        員工名錄
      li: a(
        :href="`${this.legacyUrl}/carousel.html`",
        target="_blank",
        rel="noreferrer noopener"
      ).
        #[font-awesome-icon.fixed-width(:icon="['far', 'newspaper']", size="lg")]
        海報輪撥
      li: a(
        :href="`${this.legacyUrl}/stats.html`",
        target="_blank",
        rel="noreferrer noopener"
      ).
        #[font-awesome-icon.fixed-width(:icon="['fas', 'calculator']", size="lg")]
        統計看板
      li: a(
        :href="`${this.legacyUrl}/helper.html`",
        target="_blank",
        rel="noreferrer noopener"
      ).
        #[font-awesome-icon.fixed-width(:icon="['fas', 'hands-helping']", size="lg")]
        業務小幫手
      li: a(
        :href="`${this.legacyUrl}/index.html`",
        target="_blank",
        rel="noreferrer noopener"
      ).
        #[font-awesome-icon.fixed-width(:icon="['fas', 'calendar-day']", size="lg")]
        今日案件追蹤

      li(v-if="authority.isAdmin"): hr

      li(v-if="!authority.isAdmin"): nuxt-link(to="/login").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'sign-in-alt']", size="lg")]
        管理者登入

      li(v-if="!authority.isAdmin"): hr

      li: a(
        href="https://github.com/pyliu/LAH-NUXTJS",
        target="_blank",
        rel="noopener noreferrer"
      ).
        #[font-awesome-icon.fixed-width(:icon="['fab', 'github']", pull="left", size="lg")]
        原始碼
      li: b-link(@click="triggerClear").
        #[font-awesome-icon.fixed-width(:icon="['fas', 'hand-sparkles']", size="lg")]
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
.fixed-width {
  width: 24px;
}
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
