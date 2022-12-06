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

      li: nuxt-link(to="/inf").
        #[font-awesome-icon(:icon="['fas', 'house-laptop']", fixed-width, pull="left", size="lg")]
        智慧監控首頁
      li: nuxt-link(to="/").
        #[font-awesome-icon(:icon="['fas', 'house']", fixed-width, pull="left", size="lg")]
        智慧控管首頁
      //- li: nuxt-link(to="/prc/realprice").
      //-   #[font-awesome-icon(:icon="['fas', 'receipt']", fixed-width, size="lg")]
      //-   實價登錄案件控管

      li: hr(v-if="displayAnnouncement")

      li: lah-timeline-announcement(
        v-if="displayAnnouncement",
        load-button,
        :load-count="3",
        @announcement-count="handleAnnouncementEvent($event)"
      )

      li: hr

      li: nuxt-link(to="/inf/mgt").
        #[font-awesome-icon(:icon="['fas', 'person-chalkboard']", fixed-width, size="lg")]
        地政系統管理面板
      li: nuxt-link(to="/inf/dashboard").
        #[font-awesome-icon(:icon="['fas', 'desktop']", fixed-width, size="lg")]
        {{site}} 監控儀錶板
      li: nuxt-link(to="/inf/dashboard/carousel").
        #[font-awesome-icon(:icon="['fas', 'arrows-spin']", fixed-width, size="lg")]
        {{site}} 輪播儀錶板
      li: nuxt-link(to="/inf/xap").
        #[font-awesome-icon(:icon="['fas', 'server']", fixed-width, size="lg")]
        {{site}} 跨域伺服器監控
      li: nuxt-link(to="/inf/lxhweb").
        #[font-awesome-icon(:icon="['fas', 'database']", fixed-width, size="lg")]
        {{site}} 同步異動監控

      li: hr

      li: nuxt-link(to="/admin/ip").
        #[font-awesome-icon(:icon="['fas', 'network-wired']", fixed-width, size="lg")]
        IP對應表管理
      li: nuxt-link(
        to="/admin/users"
      ).
        #[font-awesome-icon(:icon="['fas', 'people-roof']", fixed-width, size="lg")]
        員工管理
      li: nuxt-link(to="/admin/configs").
        #[font-awesome-icon(:icon="['fas', 'tasks']", fixed-width, size="lg")]
        系統參數設定
      //- li(v-if="authority.isAdmin"): a(
      //-   :href="`${this.legacyUrl}/monitor.html`",
      //-   target="_blank",
      //-   rel="noreferrer noopener"
      //- ).
      //-   #[font-awesome-icon(:icon="['fas', 'columns']", fixed-width, size="lg")]
      //-   跨所伺服器監控面板

      //- li(v-if="isAuthorized"): nuxt-link(to="/stats").
      //-   #[font-awesome-icon(:icon="['fas', 'calculator']" size="lg")]
      //-   統計看板
      //- li(v-if="isAuthorized"): nuxt-link(to="/playground").
      //-   #[font-awesome-icon(:icon="['fab', 'playstation']" size="lg")]
      //-   測試
      li: nuxt-link(to="/admin").
        #[font-awesome-icon(:icon="['fas', 'cogs']", fixed-width, size="lg")]
        系統管理選單

      li: hr

      li: nuxt-link(
        to="/notification"
      ).
        #[font-awesome-icon(:icon="['far', 'comment-dots']", fixed-width, size="lg")]
        發布即時通公告
      li: nuxt-link(to="/message").
        #[font-awesome-icon(:icon="['far', 'comments']", fixed-width, size="lg")]
        傳送即時通訊息
      li: hr
      li: nuxt-link(to="/expire/sur").
        #[font-awesome-icon(:icon="['far', 'calendar-alt']", fixed-width, size="lg")]
        測量逾期案件
      li: nuxt-link(to="/prc/realprice").
        #[font-awesome-icon(:icon="['fas', 'receipt']", fixed-width, size="lg")]
        實價登錄案件控管

      li: hr

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
