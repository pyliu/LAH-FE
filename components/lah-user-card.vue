<template lang="pug">
  lah-transition(fade)
    .center.h1(v-if="$fetchState.pending")
      lah-fa-icon(icon="spinner" action="cycle")
    h4.center(v-else-if="!found")
        lah-button(v-if="isAuthorized" icon="user-plus" block size="lg" @click="add") 新增
        lah-fa-icon(v-else variant="danger") 找不到使用者資料
    b-card(v-else)
      b-row
        b-col(md="6")
          b-card-title.
            #[b-avatar.mt-n1(button variant="light" size="1.3em" :src="avatarSrc" @click="photoClick")]
            {{userData['name']}}

          b-card-sub-title.d-flex
            span.mr-auto {{userData['title']}}
            lah-fa-icon.my-auto(
              icon="ban"
              variant="danger"
              action="breath"
              v-if="isDisabled || !$utils.empty(userData.offboard_date)"
            ) 已停用

          b-card-text.d-flex.flex-column.small
            div ＩＤ：{{ userData.id }}
            div(v-if="isAuthorized && userData.ip") 電腦：{{ userData.ip }}
            div(v-if="userData.ext") 分機：{{ userData.ext }}
            div(v-if="isAuthorized && userData.birthday").
              生日：{{ userData.birthday }}
              #[b-badge(v-if="birthAge !== false" :variant="birthAgeVariant" pill) {{ birthAge }}歲]
            div(v-if="userData.unit") 單位：{{ userData.unit }}
            div(v-if="userData.work") 工作：{{ userData.work }}
            div(v-if="isAuthorized && userData.education") 學歷：{{ userData.education }}
            div(v-if="isAuthorized && userData.exam") 考試：{{ userData.exam }}
            div(v-if="isAuthorized && userData.cell") 手機：{{ userData.cell}}
            div(v-if="isAuthorized && userData.onboard_date").
              到職：{{ userData.onboard_date }}
              #[b-badge(v-if="workAge !== false" :variant="workAgeVariant" pill) {{ workAge }}年]

        b-col.d.flex.flex-column(md="6")
          lah-button.ml-auto.mb-1(v-if="isAuthorized && !noEditButton" icon="edit" @click="edit") 編輯
          b-link(@click="photoClick" title="放大顯示")
            b-img-lazy.shadow(
              :src="photoSrc"
              :alt="userData.name"
              fluid
              thumbnail
              rounded
            )
</template>

<script>
import userBase from '~/components/lah-user-base.js'

export default {
  name: 'LahUserCard',
  mixins: [userBase],
  props: {
    noEditButton: { type: Boolean, default: false }
  },
  computed: {
    isAuthorized () { return this.authority.isAdmin || this.authority.isUserMgtStaff },
    birthAgeVariant () {
      const badgeAge = this.birthAge
      if (badgeAge < 30) {
        return 'success'
      } else if (badgeAge < 40) {
        return 'primary'
      } else if (badgeAge < 50) {
        return 'warning'
      } else if (badgeAge < 60) {
        return 'danger'
      }
      return 'dark'
    },
    birthAge () {
      let birth = this.userData.birthday
      if (birth) {
        const now = new Date()
        birth = this.toADFormat(birth)
        const temp = Date.parse(birth)
        if (temp) {
          const born = new Date(temp)
          return ((now - born) / 31536000000).toFixed(1)
        }
      }
      return false
    },
    workAge () {
      let AP_ON_DATE = this.userData.onboard_date
      const AP_OFF_JOB = this.isDisabled ? 'Y' : 'N'
      let AP_OFF_DATE = this.userData.offboard_date

      if (AP_ON_DATE !== undefined && AP_ON_DATE !== null) {
        AP_ON_DATE = AP_ON_DATE.date
          ? AP_ON_DATE.date.split(' ')[0]
          : AP_ON_DATE
        AP_ON_DATE = this.toADFormat(AP_ON_DATE)
        let temp = Date.parse(AP_ON_DATE)
        if (temp) {
          const on = new Date(temp)
          let now = new Date()
          if (AP_OFF_JOB === 'Y') {
            AP_OFF_DATE = this.toADFormat(AP_OFF_DATE)
            temp = Date.parse(AP_OFF_DATE)
            if (temp) {
              // replace now Date to off board date
              now = new Date(temp)
            }
          }
          return ((now - on) / 31536000000).toFixed(1)
        }
      }
      return false
    },
    workAgeVariant () {
      const workAge = this.workAge
      if (workAge < 5) {
        return 'success'
      } else if (workAge < 10) {
        return 'primary'
      } else if (workAge < 20) {
        return 'warning'
      }
      return 'danger'
    },
    photoSrc () {
      return `/img/get_user_img.php?id=${this.userData.id}&name=${this.userData.name}&timestamp=${this.timestamp}`
    },
    avatarSrc () {
      return `/img/get_user_img.php?id=${this.userData.id}_avatar&name=${this.userData.name}_avatar&timestamp=${this.timestamp}`
    }
  },
  watch: {
    from (ip) {
      this.$fetch()
    }
  },
  beforeCreate () {
    // https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
    this.$options.components.LahUserAddCard = require('~/components/lah-user-add-card.vue').default
    this.$options.components.LahUserPhoto = require('~/components/lah-user-photo.vue').default
    this.$options.components.LahUserEditCard = require('~/components/lah-user-edit-card.vue').default
  },
  methods: {
    assignUserData (obj) {
      // Object.assign makes object data reactively
      if (!this.$utils.empty(obj)) {
        this.userData = { ...this.userData, ...obj }
      }
    },
    add () {
      if (this.isAuthorized) {
        this.modal(this.$createElement('lah-user-add-card', { props: { id: this.id, name: this.name } }), {
          title: `新增使用者 ${this.id} ${this.name}`,
          size: 'lg',
          noCloseOnBackdrop: true
        })
      }
    },
    edit () {
      this.modal(this.$createElement('lah-user-edit-card', {
        props: {
          raw: [this.userData],
          center: true
        },
        on: {
          saved: (event) => { this.trigger('saved', event.detail) }
        }
      }), {
        title: `編輯 ${this.userData.id} ${this.userData.name}`,
        size: 'lg'
      })
    },
    toTWFormat (adDate) {
      let twDate = adDate.replace('/-/g', '/')
      // detect if it is AD date
      if (twDate.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        // to TW date
        twDate = parseInt(twDate.substring(0, 4)) - 1911 + twDate.substring(4)
      }
      return twDate
    },
    toADFormat (twDate) {
      let adDate = twDate.replace('/-/g', '/')
      // detect if it is TW date
      if (adDate.match(/^\d{3}\/\d{2}\/\d{2}$/)) {
        // to AD date
        adDate = parseInt(adDate.substring(0, 3)) + 1911 + adDate.substring(3)
      }
      return adDate
    },
    photoClick () {
      this.modal(this.$createElement('lah-user-photo', {
        props: {
          userData: this.userData,
          center: true
        }
      }), {
        title: `${this.userData.id} ${this.userData.name} 照片`,
        size: 'lg'
      })
      // $emit to parent
      this.trigger('click', this.userData)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
