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
        :init-count="1",
        @announcement-count="handleAnnouncementEvent($event)"
      )

      li: hr

      li: nuxt-link(to="/inf").
        #[font-awesome-icon(:icon="['fas', 'house-laptop']", fixed-width, pull="left", size="lg")]
        智慧監控首頁
      li: nuxt-link(to="/reg").
        #[font-awesome-icon(:icon="['fas', 'house']", fixed-width, pull="left", size="lg")]
        智慧控管首頁
      li: nuxt-link(to="/prc").
        #[font-awesome-icon(:icon="['fas', 'money-bill-wave']", fixed-width, pull="left", size="lg")]
        地價小幫手首頁
      li: nuxt-link(to="/sur").
        #[font-awesome-icon(:icon="['fas', 'map-location']", fixed-width, pull="left", size="lg")]
        測量小幫手首頁
      li: nuxt-link(to="/lab").
        #[font-awesome-icon(:icon="['fas', 'flask-vial']", fixed-width, pull="left", size="lg")]
        地政資訊實驗室首頁

      li: hr

      li: nuxt-link(to="/bureau").
        #[font-awesome-icon(:icon="['fas', 'tv']", fixed-width, pull="left", size="lg")]
        {{ site }}監控輪播
      li: nuxt-link(to="/inf/mgt").
        #[font-awesome-icon(:icon="['fas', 'person-chalkboard']", fixed-width, size="lg")]
        地政系統管理面板

      //- 智慧監控儀表板 (含摺疊子選單)
      li.dashboard-menu-item
        .d-flex.align-items-center
          nuxt-link(:to="isDevOffice ? '/inf/dashboard/' : '/inf/dashboard/mode=HX'")
            font-awesome-icon(:icon="['fas', 'desktop']" fixed-width size="lg" class="mr-1")
            | {{site}} 智慧監控儀表板
          .toggle-btn.ml-2(
            @click="isDashboardOpen = !isDashboardOpen",
            :class="{ 'collapsed': !isDashboardOpen }"
          )
            font-awesome-icon(:icon="['fas', 'angle-down']", size="sm")

        b-collapse#dashboard-collapse(v-model="isDashboardOpen")
          ul.submenu
            li(v-for="board in dashboardList" :key="board.id")
              nuxt-link(:to="`/inf/dashboard/${board.id}`")
                lah-fa-icon(:icon="board.icon || 'briefcase'" class="mr-1 text-secondary")
                | {{ board.header }}

      li: nuxt-link(to="/inf/xap/broken_cached").
        #[font-awesome-icon(:icon="['fas', 'heart-pulse']", fixed-width, size="lg")]
        全國跨域主機監控
      li: nuxt-link(to="/inf/xap/connectivity").
        #[font-awesome-icon(:icon="['fas', 'wave-square']", fixed-width, size="lg")]
        全國跨域主機監控(即時)
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
      li: nuxt-link(to="/admin/users").
        #[font-awesome-icon(:icon="['fas', 'people-roof']", fixed-width, size="lg")]
        員工管理
      li: nuxt-link(to="/admin/configs").
        #[font-awesome-icon(:icon="['fas', 'tasks']", fixed-width, size="lg")]
        系統參數設定
      li: nuxt-link(to="/admin").
        #[font-awesome-icon(:icon="['fas', 'cogs']", fixed-width, size="lg")]
        系統管理選單

      li: hr

      li: nuxt-link(to="/notification").
        #[font-awesome-icon(:icon="['far', 'comment-dots']", fixed-width, size="lg")]
        發布即時通公告
      li: nuxt-link(to="/message").
        #[font-awesome-icon(:icon="['far', 'comments']", fixed-width, size="lg")]
        傳送即時通訊息
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
import some from 'lodash/some';
import lahAvatar from '~/components/lah-avatar.vue';
import LahUserCard from '~/components/lah-user-card.vue';

export default {
  components: { lahAvatar, LahUserCard },
  fetchOnServer: false,
  data: () => ({
    displayAnnouncement: true,
    isDashboardOpen: false
  }),
  computed: {
    isAuthorized () {
      return this.authority.isAdmin
    },
    greeting () {
      const hours = new Date().getHours()
      return hours > 11 ? (hours > 17 ? '晚安' : '午安') : '早安'
    },
    // [修改] 動態依據 isDevOffice 過濾選單項目
    dashboardList () {
      const allDashboards = this.$consts.DEFAULT_DASHBOARDS || []

      if (this.isDevOffice) {
        return allDashboards
      }

      // 如果不是開發單位，過濾掉需要隱藏的項目。
      // 注意：請依據你在 $consts.DEFAULT_DASHBOARDS 的實際欄位做修改
      // 假設你在常數裡有設 `devOnly: true` 或是你想直接隱藏特定 ID
      return allDashboards.filter(board => !board.devOnly)
    }
  },
  watch: {
    '$route.path': {
      handler (newPath) {
        if (!newPath || !this.dashboardList) { return }

        const hasMatch = some(this.dashboardList, board => newPath.includes(`/inf/dashboard/${board.id}`))
        if (hasMatch) {
          this.isDashboardOpen = true
        }
      },
      immediate: true
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

      &.dashboard-menu-item {
        margin-top: 2px;
        margin-bottom: 2px;
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
  .toggle-btn {
    color: rgb(187, 184, 184);
    cursor: pointer;
    padding: 0.2rem 0.5rem;
    transition: transform 0.3s ease, color 0.3s ease;
    &:hover {
      color: white;
    }
    &.collapsed {
      transform: rotate(-90deg);
    }
  }
  .submenu {
    border-left: 1px dashed rgba(255, 255, 255, 0.2);
    margin-left: 1rem;
    padding-left: 0.5rem;
    li {
      margin: 6px 0;
      a {
        font-size: 0.95rem;
        &:hover {
          font-size: 1.05rem;
        }
      }
    }
  }
}
</style>
