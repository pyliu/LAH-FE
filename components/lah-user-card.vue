<template lang="pug">
  lah-transition(fade)
    .user-card-state.user-card-loading.text-center.p-4(v-if="$fetchState.pending")
      lah-fa-icon(icon="circle-notch" action="spin" size="2x" variant="primary")
      .text-muted.small.mt-2 讀取同仁資訊中...

    .user-card-state.user-card-empty.text-center.p-4.border.rounded.bg-light(v-else-if="!found")
      lah-fa-icon.mb-2(icon="user-slash" variant="secondary" size="2x")
      .font-weight-bold.text-muted.mb-3 查無此使用者資料
      lah-button(
        v-if="isAuthorized"
        icon="user-plus"
        variant="primary"
        block
        @click="add"
      ) 新增同仁資料

    b-card.lah-user-card.border-0.shadow-sm.overflow-hidden(v-else no-body)
      //- 1. 頂部飾條與身份識別區 (Header Banner)
      .user-card-banner.px-3.py-2.d-flex.align-items-center.justify-content-between(:class="departmentInfo.themeClass")
        .d-flex.align-items-center.flex-wrap.mr-2
          //- 課室標籤
          b-badge.mr-1.badge-dept(:variant="departmentInfo.variant" pill)
            lah-fa-icon.mr-1(:icon="departmentInfo.icon")
            | {{ userData.unit || '本所同仁' }}
          //- 職稱標籤
          b-badge.mr-1(v-if="userData.title" variant="light" class="text-dark border-0 shadow-sm" pill)
            | {{ userData.title }}
          //- 在職 / 離職動態狀態徽章
          b-badge(v-if="isDisabled || !$utils.empty(userData.offboard_date)" variant="danger" pill)
            lah-fa-icon.mr-1(icon="ban" action="breath")
            | 已離職 {{ userData.offboard_date ? `(${userData.offboard_date})` : '' }}
          b-badge(v-else variant="success" pill class="d-inline-flex align-items-center")
            span.status-pulse-dot.mr-1
            | 在職

        //- 右上角快捷編輯按鈕 (若有權限)
        .d-flex.align-items-center
          lah-button(
            v-if="isAuthorized && !noEditButton"
            icon="user-pen"
            variant="light"
            size="sm"
            class="shadow-sm border-0 font-weight-bold"
            title="編輯同仁資料與照片"
            @click="edit"
          ) 編輯

      b-card-body.p-3
        //- 2. 個人核心名牌區 (相片框 + 姓名/帳號/職掌)
        .d-flex.flex-column.flex-sm-row.align-items-center.align-items-sm-start.mb-3
          //- 相片框 (精緻相片相框 + 懸浮放大效果)
          .photo-wrapper.position-relative.mr-sm-3.mb-3.mb-sm-0.flex-shrink-0
            .photo-frame.rounded.overflow-hidden.shadow-sm(
              @click="photoClick"
              title="點擊放大檢視照片"
            )
              b-img-lazy.user-portrait(
                :key="photoSrc"
                :src="photoSrc"
                :alt="userData.name"
                blank-color="#e9ecef"
              )
              .photo-overlay
                lah-fa-icon(icon="magnifying-glass-plus" variant="light")
                span.photo-overlay-tip 放大照片

          //- 核心個人名牌區 (姓名、帳號、性別、職掌、年資)
          .user-main-meta.flex-grow-1.text-center.text-sm-left
            .d-flex.align-items-center.justify-content-center.justify-content-sm-start.flex-wrap.mb-1
              h4.user-name.font-weight-bold.mb-0.mr-2 {{ userData.name || '未填姓名' }}
              //- 性別圖示
              span.gender-icon.mr-2(v-if="userData.sex === 1 || userData.sex === '1'" title="生理男" class="text-primary")
                lah-fa-icon(icon="mars")
              span.gender-icon.mr-2(v-else-if="userData.sex === 0 || userData.sex === '0'" title="生理女" class="text-danger")
                lah-fa-icon(icon="venus")

            //- 帳號 ID + 一鍵複製按鈕
            .d-flex.align-items-center.justify-content-center.justify-content-sm-start.mb-2
              code.user-id-code.px-2.py-0.rounded.text-monospace.font-weight-bold {{ userData.id }}
              b-button.btn-copy-id.p-0.ml-1.text-muted(
                variant="link"
                size="sm"
                title="複製帳號代碼"
                @click="copyText(userData.id, '帳號代碼')"
              )
                lah-fa-icon(icon="copy" size="xs")

            //- 工作職掌徽章 / 標籤
            .user-work-tag.mb-2(v-if="userData.work")
              lah-fa-icon.text-muted.mr-1(icon="briefcase" size="xs")
              span.text-muted 職掌：
              span.text-dark.font-weight-bold {{ userData.work }}

            //- 年資與年齡膠囊 (若有權限)
            .d-flex.flex-wrap.justify-content-center.justify-content-sm-start(v-if="isAuthorized")
              b-badge.mr-1.mb-1(
                v-if="workAge !== false"
                :variant="workAgeVariant"
                pill
              )
                lah-fa-icon.mr-1(icon="business-time" size="xs")
                | 年資 {{ workAge }} 年
              b-badge.mr-1.mb-1(
                v-if="birthAge !== false"
                :variant="birthAgeVariant"
                pill
              )
                lah-fa-icon.mr-1(icon="cake-candles" size="xs")
                | {{ birthAge }} 歲

        //- 3. 辦公通訊快捷資訊磚 (分機、電腦 IP、手機)
        .contact-grid.mb-3
          //- 分機號碼
          .contact-item.rounded.p-2(v-if="userData.ext")
            .contact-icon-box.bg-primary-soft.text-primary
              lah-fa-icon(icon="phone-volume")
            .contact-details.min-w-0
              .contact-label 分機號碼
              .contact-value.font-weight-bold.text-monospace {{ userData.ext }}
            b-button.btn-contact-action(
              variant="outline-primary"
              size="sm"
              title="複製分機"
              @click="copyText(userData.ext, '分機號碼')"
            )
              lah-fa-icon(icon="copy" size="xs")

          //- 電腦 IP (若有授權且存在)
          .contact-item.rounded.p-2(v-if="isAuthorized && userData.ip")
            .contact-icon-box.bg-info-soft.text-info
              lah-fa-icon(icon="desktop")
            .contact-details.min-w-0
              .contact-label 電腦 IP
              .contact-value.font-weight-bold.text-monospace {{ userData.ip }}
            b-button.btn-contact-action(
              variant="outline-info"
              size="sm"
              title="複製電腦 IP"
              @click="copyText(userData.ip, '電腦 IP')"
            )
              lah-fa-icon(icon="copy" size="xs")

          //- 手機號碼 (若有授權且存在)
          .contact-item.rounded.p-2(v-if="isAuthorized && userData.cell")
            .contact-icon-box.bg-success-soft.text-success
              lah-fa-icon(icon="mobile-screen-button")
            .contact-details.min-w-0
              .contact-label 手機號碼
              .contact-value.font-weight-bold.text-monospace {{ userData.cell }}
            b-button.btn-contact-action(
              variant="outline-success"
              size="sm"
              title="複製手機號碼"
              @click="copyText(userData.cell, '手機號碼')"
            )
              lah-fa-icon(icon="copy" size="xs")

        //- 4. 人事進階資訊 (授權人員可見)
        .hr-info-card.rounded.border.p-2.bg-light.mb-3(v-if="isAuthorized && hasHrDetails")
          .d-flex.align-items-center.justify-content-between.mb-2.pb-1.border-bottom
            span.small.font-weight-bold.text-muted
              lah-fa-icon.mr-1(icon="id-card-clip")
              | 人事與學歷經歷
            b-badge(variant="secondary" pill) 內部人事
          .row.no-gutters.small
            .col-12.col-sm-6.mb-1.pr-sm-2(v-if="userData.onboard_date")
              span.text-muted 到職日期：
              span.font-weight-bold.text-dark {{ userData.onboard_date }}
            .col-12.col-sm-6.mb-1.pr-sm-2(v-if="userData.birthday")
              span.text-muted 出生日期：
              span.font-weight-bold.text-dark {{ userData.birthday }}
            .col-12.col-sm-6.mb-1.pr-sm-2(v-if="userData.education")
              span.text-muted 最高學歷：
              span.text-dark {{ userData.education }}
            .col-12.col-sm-6.mb-1.pr-sm-2(v-if="userData.exam")
              span.text-muted 考試資格：
              span.text-dark {{ userData.exam }}

        //- 5. 底部快捷動作工具列
        .card-action-bar.d-flex.align-items-center.justify-content-between.flex-wrap.pt-2.border-top
          //- 複製完整聯絡卡片
          lah-button(
            icon="clipboard-user"
            variant="outline-secondary"
            size="sm"
            title="複製同仁完整聯絡名片至剪貼簿"
            @click="copyFullContactCard"
          ) 複製名片

          .d-flex.align-items-center
            //- 傳送私訊
            lah-button.mr-1(
              v-if="canSendMessage && !isDisabled"
              icon="paper-plane"
              variant="outline-primary"
              size="sm"
              :title="isSelf ? '傳送備忘給自己' : `傳送訊息給 ${userData.name}`"
              @click="sendMessage"
            ) {{ isSelf ? '備忘' : '私訊' }}

            //- 放大照片
            lah-button(
              icon="image"
              variant="outline-info"
              size="sm"
              title="檢視完整個人相片"
              @click="photoClick"
            ) 照片
</template>

<script>
import userBase from '~/mixins/lah-user-base.js'

export default {
  name: 'LahUserCard',
  mixins: [userBase],
  props: {
    noEditButton: { type: Boolean, default: false }
  },
  computed: {
    isAuthorized () {
      return Boolean(this.authority?.isAdmin || this.authority?.isUserMgtStaff)
    },
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
    },
    departmentInfo () {
      const unit = this.userData.unit || ''
      if (unit.includes('登記')) {
        return {
          variant: 'primary',
          icon: 'file-signature',
          themeClass: 'dept-theme-reg'
        }
      }
      if (unit.includes('測量')) {
        return {
          variant: 'success',
          icon: 'compass-drafting',
          themeClass: 'dept-theme-sur'
        }
      }
      if (unit.includes('地價')) {
        return {
          variant: 'warning',
          icon: 'coins',
          themeClass: 'dept-theme-val'
        }
      }
      if (unit.includes('資訊')) {
        return {
          variant: 'info',
          icon: 'server',
          themeClass: 'dept-theme-inf'
        }
      }
      if (unit.includes('行政')) {
        return {
          variant: 'secondary',
          icon: 'folder-open',
          themeClass: 'dept-theme-adm'
        }
      }
      if (unit.includes('人事')) {
        return {
          variant: 'danger',
          icon: 'user-tie',
          themeClass: 'dept-theme-hr'
        }
      }
      if (unit.includes('會計')) {
        return {
          variant: 'dark',
          icon: 'calculator',
          themeClass: 'dept-theme-acc'
        }
      }
      if (unit.includes('秘書') || unit.includes('主任')) {
        return {
          variant: 'danger',
          icon: 'landmark',
          themeClass: 'dept-theme-exec'
        }
      }
      return {
        variant: 'secondary',
        icon: 'building',
        themeClass: 'dept-theme-default'
      }
    },
    hasHrDetails () {
      return Boolean(
        this.userData.birthday ||
        this.userData.onboard_date ||
        this.userData.education ||
        this.userData.exam
      )
    },
    myUserId () {
      return this.user?.id || this.$store?.state?.user?.id || ''
    },
    isSelf () {
      return (this.userData.id || '').toUpperCase() === (this.myUserId || '').toUpperCase()
    },
    canSendMessage () {
      return Boolean(this.userData.id)
    }
  },
  watch: {
    raw: {
      handler (val) {
        if (Array.isArray(val) && val.length > 0 && val[0]) {
          this.userData = {
            id: '',
            name: '',
            sex: '',
            title: '',
            work: '',
            ext: '411',
            birthday: '',
            unit: '',
            ip: '',
            education: '',
            exam: '',
            cell: '',
            onboard_date: '',
            authority: 0,
            ...val[0]
          }
        }
      },
      deep: true
    },
    from (ip) {
      this.$fetch()
    }
  },
  beforeCreate () {
    // https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
    this.$options.components.LahUserAddCard = require('~/components/lah-user-add-card.vue').default
    this.$options.components.LahUserPhoto = require('~/components/lah-user-photo.vue').default
    this.$options.components.LahUserEditCard = require('~/components/lah-user-edit-card.vue').default
    this.$options.components.LahUserMessage = require('~/components/lah-user-message.vue').default
    this.$options.components.LahMessengerMessageInput = require('~/components/lah-messenger-message-input.vue').default
  },
  methods: {
    assignUserData (obj) {
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
          saved: (event) => {
            this.timestamp = Date.now()
            if (event?.detail) {
              this.assignUserData(event.detail)
            }
            this.$fetch()
            this.trigger('saved', event.detail)
          }
        }
      }), {
        title: `編輯 ${this.userData.id} ${this.userData.name}`,
        size: 'lg'
      })
    },
    toTWFormat (adDate) {
      if (!adDate || typeof adDate !== 'string') { return '' }
      let twDate = adDate.replace(/-/g, '/')
      if (twDate.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        twDate = parseInt(twDate.substring(0, 4)) - 1911 + twDate.substring(4)
      }
      return twDate
    },
    toADFormat (twDate) {
      if (!twDate || typeof twDate !== 'string') { return '' }
      let adDate = twDate.replace(/-/g, '/')
      if (adDate.match(/^\d{3}\/\d{2}\/\d{2}$/)) {
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
      this.trigger('click', this.userData)
    },
    copyText (text, label = '內容') {
      if (!text) { return }
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(String(text)).then(() => {
          this.notify(`已複製 ${label}「${text}」`, { type: 'info' })
        }).catch(() => {
          this.copyFallback(String(text), label)
        })
      } else {
        this.copyFallback(String(text), label)
      }
    },
    copyFallback (text, label) {
      const input = document.createElement('textarea')
      input.value = text
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      try {
        document.execCommand('copy')
        this.notify(`已複製 ${label}「${text}」`, { type: 'info' })
      } catch (err) {
        this.notify(`複製失敗：${err.message}`, { type: 'warning' })
      }
      document.body.removeChild(input)
    },
    copyFullContactCard () {
      const parts = []
      if (this.userData.name) { parts.push(this.userData.name) }
      if (this.userData.title) { parts.push(this.userData.title) }

      const details = []
      if (this.userData.unit) { details.push(`單位：${this.userData.unit}`) }
      if (this.userData.ext) { details.push(`分機：${this.userData.ext}`) }
      if (this.userData.ip && this.isAuthorized) { details.push(`電腦：${this.userData.ip}`) }
      if (this.userData.cell && this.isAuthorized) { details.push(`手機：${this.userData.cell}`) }
      if (this.userData.work) { details.push(`職掌：${this.userData.work}`) }

      const text = `${parts.join(' ')}（${details.join('、')}）`
      this.copyText(text, `${this.userData.name} 名片資訊`)
    },
    sendMessage () {
      if (!this.userData.id) { return }
      if (this.$store?.getters?.isDashboardActive) {
        this.$root.$emit('lah-messenger:user-chat', {
          userid: this.userData.id,
          username: this.userData.name
        })
        this.hideModal()
        return
      }

      const h = this.$createElement
      const component = this.$options.components.LahMessengerMessageInput || this.$options.components.LahUserMessage
      if (component) {
        this.modal(h(component, {
          props: {
            to: this.userData.id
          },
          on: {
            sent: () => { this.hideModalById('user-card-message-modal') }
          }
        }), {
          id: 'user-card-message-modal',
          size: 'md',
          title: `發送訊息給 ${this.userData.id} ${this.userData.name}`
        })
      } else {
        this.notify(`請透過即時通訊發送訊息給 ${this.userData.name}`, { type: 'info' })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-user-card {
  border-radius: 12px;
  background-color: #ffffff;
  transition: box-shadow 0.25s ease;
}

// 頂部課室專屬風格橫幅
.user-card-banner {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.dept-theme-reg {
  background: linear-gradient(135deg, rgba(13, 110, 253, 0.1) 0%, rgba(13, 202, 240, 0.05) 100%);
  border-bottom: 2px solid rgba(13, 110, 253, 0.25);
}
.dept-theme-sur {
  background: linear-gradient(135deg, rgba(25, 135, 84, 0.1) 0%, rgba(32, 201, 151, 0.05) 100%);
  border-bottom: 2px solid rgba(25, 135, 84, 0.25);
}
.dept-theme-val {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(253, 126, 20, 0.06) 100%);
  border-bottom: 2px solid rgba(255, 193, 7, 0.35);
}
.dept-theme-inf {
  background: linear-gradient(135deg, rgba(13, 202, 240, 0.12) 0%, rgba(102, 16, 242, 0.05) 100%);
  border-bottom: 2px solid rgba(13, 202, 240, 0.25);
}
.dept-theme-adm {
  background: linear-gradient(135deg, rgba(108, 117, 125, 0.1) 0%, rgba(173, 181, 189, 0.05) 100%);
  border-bottom: 2px solid rgba(108, 117, 125, 0.25);
}
.dept-theme-hr {
  background: linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(214, 51, 132, 0.05) 100%);
  border-bottom: 2px solid rgba(220, 53, 69, 0.25);
}
.dept-theme-acc {
  background: linear-gradient(135deg, rgba(33, 37, 41, 0.08) 0%, rgba(111, 66, 193, 0.05) 100%);
  border-bottom: 2px solid rgba(33, 37, 41, 0.25);
}
.dept-theme-exec {
  background: linear-gradient(135deg, rgba(214, 51, 132, 0.1) 0%, rgba(253, 126, 20, 0.06) 100%);
  border-bottom: 2px solid rgba(214, 51, 132, 0.25);
}
.dept-theme-default {
  background: linear-gradient(135deg, rgba(248, 249, 250, 1) 0%, rgba(233, 236, 239, 0.5) 100%);
  border-bottom: 2px solid #dee2e6;
}

// 在職即時光暈小點
.status-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #ffffff;
  display: inline-block;
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.8);
  animation: pulse-dot 1.8s infinite;
}
@keyframes pulse-dot {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.8);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

// 相片相框與懸浮放大
.photo-wrapper {
  width: 124px;
  min-width: 124px;
}
.photo-frame {
  width: 100%;
  height: 155px;
  background-color: #f8f9fa;
  border: 2px solid #ffffff;
  cursor: pointer;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15) !important;
    .photo-overlay {
      opacity: 1;
    }
    .user-portrait {
      transform: scale(1.04);
    }
  }
}
.user-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}
.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
  color: #ffffff;
  padding: 8px 4px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

// 帳號代碼與字型
.user-id-code {
  background-color: rgba(0, 0, 0, 0.05);
  color: #495057;
  font-size: 0.88rem;
  letter-spacing: 0.5px;
}

// 聯絡資訊磚網格
.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 8px;
}
.contact-item {
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
  &:hover {
    background-color: #ffffff;
    border-color: rgba(0, 0, 0, 0.15);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
}
.contact-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
  font-size: 0.9rem;
}
.bg-primary-soft {
  background-color: rgba(13, 110, 253, 0.1);
}
.bg-info-soft {
  background-color: rgba(13, 202, 240, 0.12);
}
.bg-success-soft {
  background-color: rgba(25, 135, 84, 0.1);
}
.contact-label {
  font-size: 0.72rem;
  color: #6c757d;
  line-height: 1.1;
}
.contact-value {
  font-size: 0.95rem;
  color: #212529;
  line-height: 1.2;
}
.btn-contact-action {
  margin-left: auto;
  padding: 2px 6px;
  font-size: 0.75rem;
  border-radius: 6px;
}

// 人事進階資訊卡片
.hr-info-card {
  border-color: rgba(0, 0, 0, 0.08) !important;
}

// 深色模式優化
.dark-mode {
  .lah-user-card {
    background-color: #2b3035;
    color: #e9ecef;
  }
  .user-id-code {
    background-color: rgba(255, 255, 255, 0.1);
    color: #f8f9fa;
  }
  .contact-item {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }
  .contact-value {
    color: #f8f9fa;
  }
  .hr-info-card {
    background-color: rgba(255, 255, 255, 0.03) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
  }
}
</style>
