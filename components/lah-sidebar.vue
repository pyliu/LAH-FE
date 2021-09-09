<template lang="pug">
  b-sidebar(
    id="lah-sidebar"
    title="選單"
    bg-variant="dark"
    text-variant="light"
    backdrop
    shadow
  )
    template(#title)
      lah-avatar.mt-n1.mr-1(:user-data="myinfo" size="1.6")
      span.s-95.greeting(@click="popup").
        {{myinfo.id}}
        {{myinfo.name}}
        {{greeting}}
    client-only
      ul.mt-n3

        li: hr

        li: nuxt-link(to="/").
          #[font-awesome-icon(:icon="['fas', 'home']" pull="left" size="lg")]
          首頁

        li: hr

        li: nuxt-link(to="/expire").
          #[font-awesome-icon(:icon="['far', 'calendar-check']" size="lg")]
          即將逾期案件
        li: nuxt-link(to="/expiry-of-announcement").
          #[font-awesome-icon(:icon="['fa', 'sticky-note']" size="lg")]
          公告期滿案件
        li: nuxt-link(to="/ask-for-instructions").
          #[font-awesome-icon(:icon="['fas', 'user-tie']" size="lg")]
          取消請示案件
        li: nuxt-link(to="/trust").
          #[font-awesome-icon(:icon="['fas', 'money-check-alt']" size="lg")]
          信託相關案件
        li: nuxt-link(to="/non-scrivener-case").
          #[font-awesome-icon(:icon="['fas', 'user-tag']" size="lg")]
          非專業代理人案件
        li: NuxtLink(to="/foreigner-case").
          #[font-awesome-icon(:icon="['fas', 'user-astronaut']" size="lg")]
          外人地權案件
        li: nuxt-link(to="/agriculture-375-change").
          #[font-awesome-icon(:icon="['fas', 'border-all']" size="lg")]
          375租約異動
        li: nuxt-link(to="/not-done-change").
          #[font-awesome-icon(:icon="['fas', 'monument']" size="lg")]
          未辦標的註記異動
        li: nuxt-link(to="/land-ref-change").
          #[font-awesome-icon(:icon="['fas', 'landmark']" size="lg")]
          土地參考資訊檔異動
        li: nuxt-link(to="/reg-fix-case").
          #[font-awesome-icon(:icon="['fas', 'pager']" size="lg")]
          補正期滿案件查詢
        li: nuxt-link(to="/reg-not-done-case").
          #[font-awesome-icon(:icon="['fas', 'bullhorn']" size="lg")]
          辦畢通知案件查詢
        li: nuxt-link(to="/reg-untaken-case").
          #[font-awesome-icon(:icon="['fas', 'stamp']" size="lg")]
          案件領狀管控

        li: hr
        li(v-if="authority.isNotifyMgtStaff || authority.isAdmin"): nuxt-link(to="/notification").
          #[font-awesome-icon(:icon="['far', 'comment-dots']" size="lg")]
          發布信差公告訊息
        li: nuxt-link(to="/message").
          #[font-awesome-icon(:icon="['far', 'comments']" size="lg")]
          傳送所內信差訊息

        li(v-if="authority.isAdmin"): hr
        li(v-if="authority.isAdmin"): nuxt-link(to="/admin").
          #[font-awesome-icon(:icon="['fas', 'cogs']" size="lg")]
          系統管理

        //- li(v-if="isAuthorized"): nuxt-link(to="/stats").
        //-   #[font-awesome-icon(:icon="['fas', 'calculator']" size="lg")]
        //-   統計看板
        //- li(v-if="isAuthorized"): nuxt-link(to="/playground").
        //-   #[font-awesome-icon(:icon="['fab', 'playstation']" size="lg")]
        //-   測試

        li(v-if="authority.isAdmin"): hr

        li(v-if="!authority.isAdmin"): nuxt-link(to="/login").
          #[font-awesome-icon(:icon="['fas', 'sign-in-alt']" size="lg")]
          管理者登入
        li: a(href="https://github.com/pyliu/LAH-NUXTJS" target="_blank" rel="noopener noreferrer").
          #[font-awesome-icon(:icon="['fab', 'github']" pull="left" size="lg")]
          原始碼
        li(v-if="$utils.empty(user)"): b-link(@click="logout").
          #[font-awesome-icon(:icon="['fas', 'hand-sparkles']" size="lg")]
          清除本系統快取資料
        li(v-else): b-link(@click="logout" title="清除瀏覽器端快取資料").
          #[font-awesome-icon(:icon="['fas', 'sign-out-alt']" size="lg")]
          登出

        li: hr
    template(#footer)
      div.d-flex.bg-dark.text-light.justify-content-between.px-3.py-2.align-middle
        span.s-75.text-muted.my-auto {{ip}}
        b-link(href="mailto:pangyu.liu@gmail.com")
          lah-fa-icon.s-75.text-muted.my-auto(icon="copyright" title="寄信給 LIU, PANG-YU") LIU, PANG-YU
</template>

<script>
import lahAvatar from '~/components/lah-avatar.vue'
import lahUserCard from '~/components/lah-user-card.vue'
export default {
  components: { lahAvatar, lahUserCard },
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
    logout () {
      const message = this.$utils.empty(this.user) ? '請確認要清除快取資料？' : '請確認要登出並清除快取資料？'
      this.confirm(message).then((ans) => {
        ans && this.clearCache() && this.notify('登出完成，3秒後自動整理頁面。') && this.timeout(() => location.reload(), 3000)
      })
    },
    popup () {
      this.modal(this.$createElement('lah-user-card', {
        props: {
          raw: [this.myinfo]
        }
      }), {
        title: `${this.myinfo.id} ${this.myinfo.name} 資訊`,
        size: 'md'
      })
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
      margin-right: .4rem;
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
