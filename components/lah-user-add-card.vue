<template lang="pug">
  b-card(v-if="isAuthorized" body-border-variant="danger")
    b-card-group(deck)
      b-card.border-0(no-body)
        b-form-group(
          label="ID"
          label-for="id-input"
          label-cols-sm="2"
          label-size="md"
        ): b-input(
          id="id-input"
          v-model="userData['id']"
          trim
          :state="checkId"
          :formatter="formatter"
          @input="findDuplication"
          v-b-popover.hover.focus.top.html="checkIdFeedback"
        )
      b-card.border-0(no-body)
        b-form-group(
          label="姓名"
          label-for="name-input"
          label-cols-sm="2"
          label-size="md"
        ): b-input(
          id="name-input"
          v-model="userData['name']"
          :state="checkName"
          trim
        )

    b-card-group(deck)
      b-card.border-0(no-body)
        b-form-group(
          label="性別"
          label-for="sex-select"
          label-cols-sm="2"
          label-size="md"
        ): b-select(
          id="sex-select"
          v-model="userData['sex']"
          :options="sexOpts"
          :state="checkSex"
        )
      b-card.border-0(no-body)
        b-form-group(
          label="課室"
          label-for="unit-select"
          label-cols-sm="2"
          label-size="md"
        ): b-select(
          id="unit-select"
          v-model="userData['unit']"
          :options="unitOpts"
          :state="checkDept"
        )

    b-card-group(deck)
      b-card.border-0(no-body)
        b-form-group(
          label="電腦"
          label-for="ip-input"
          label-cols-sm="2"
          label-size="md"
        ): b-input(
          id="ip-input"
          v-model="userData['ip']"
          :state="checkIp"
          trim
          placeholder="範例：192.168.XX.XX"
        )
      b-card.border-0(no-body)
        b-form-group(
          label="權限"
          label-for="ext-input"
          label-cols-sm="2"
          label-size="md"
        ): b-checkbox-group(
        v-model="authorities"
        :options="authOpts"
      )

    .d-flex.justify-content-end.mb-2.toogle-block(@click="showOthers = !showOthers" style="cursor: pointer" title="切換其他欄位顯示")
      .mr-1 {{ showOthers ? '隱藏其他資訊欄位' : '顯示其他資訊欄位' }}
      lah-fa-icon(
        :icon="showOthers ? 'angle-double-up' : 'angle-double-down'"
        :action="showOthers ? 'move-fade-btt' : 'move-fade-ttb'"
      )

    lah-transition(zoom): .p-4.optional-border(v-show="showOthers")

      b-card-group(deck)
        b-card.border-0(no-body)
          b-form-group(
            label="分機"
            label-for="ext-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input(
            id="ext-input"
            v-model="userData['ext']"
            :state="checkExt"
            trim
          )
        b-card.border-0(no-body)
          b-form-group(
            label="手機"
            label-for="cell-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input(
            id="cell-input"
            v-model="userData['cell']"
            :state="checkCell"
            trim
          )

      b-card-group(deck)
        b-card.border-0(no-body)
          b-form-group(
            label="職稱"
            label-for="work-title-select"
            label-cols-sm="2"
            label-size="md"
          ): b-select(
            id="work-title-select"
            v-model="userData['title']"
            :options="workTitleOpts"
          )
        b-card.border-0(no-body)
          b-form-group(
            label="生日"
            label-for="bd-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input(
            id="bd-input"
            v-model="userData['birthday']"
            :state="checkBirthday"
            placeholder="範例：066/05/23"
            trim
          )

      b-card-group(deck)
        b-card.border-0(no-body)
          b-form-group(
            label="考試"
            label-for="exam-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input(
            id="exam-input"
            v-model="userData['exam']"
            placeholder="範例：107年資訊處理高考三級"
            trim
          )
        b-card.border-0(no-body)
          b-form-group(
            label="教育"
            label-for="edu-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input(
            id="edu-input"
            v-model="userData['education']"
            placeholder="範例：台北科技大學資訊工程研究所"
            trim
          )

      b-card-group(deck)
        b-card.border-0(no-body)
          b-form-group(
            label="工作"
            label-for="work-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input(
            id="work-input"
            v-model="userData['work']"
            placeholder="範例：資訊系統管理"
            trim
          )
        b-card.border-0(no-body)
          b-form-group(
            label="到職"
            label-for="onboard-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input(
            id="onboard-input"
            v-model="userData['onboard_date']"
            trim
            :state="checkOnboardDate"
            placeholder="範例：110/06/01"
          )

      //- b-card-group(deck)
      //-   b-card.border-0(no-body)
      //-     b-form-group(
      //-       label="離職"
      //-       label-for="offboard-input"
      //-       label-cols-sm="2"
      //-       label-size="md"
      //-     ): b-input(
      //-       id="offboard-input"
      //-       :value="userData['offboard_date']"
      //-       disabled
      //-       trim
      //-     )
    hr
    .d-flex.justify-content-center: lah-button(icon="save" @click="save" :disabled="!checkRequired" block) 新增
</template>

<script>
import userBase from '~/components/lah-user-base.js'

export default {
  name: 'LahUserAddCard',
  mixins: [userBase],
  data: () => ({
    users: [],
    foundUser: null,
    showOthers: false,
    authorities: [],
    authOpts: []
  }),
  fetch () {
    this.isBusy = true
    this.$axios.post(this.$consts.API.JSON.USER, {
      type: 'all_users'
    }).then(({ data }) => {
      if (this.$utils.statusCheck(data.status)) {
        this.users = data.raw
      } else {
        this.notify(data.message, { type: 'warning' })
      }
    }).catch((err) => {
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
    })
  },
  computed: {
    isAuthorized () { return this.authority.isAdmin },
    checkRequired () {
      return this.checkId === true &&
             this.checkName === true &&
             this.checkDept === true &&
             this.checkSex === true &&
             this.checkIp === true &&
             this.checkOnboardDate !== false &&
             this.checkExt !== false &&
             this.checkBirthday !== false &&
             this.checkCell !== false
    },
    checkSex () {
      return [0, 1].includes(parseInt(this.userData.sex))
    },
    checkDept () {
      return !this.$utils.empty(this.userData.unit)
    },
    checkIdFeedback () {
      return this.checkId ? '' : `<strong class="text-danger">${this.site}</strong>####`
    },
    checkId () {
      if (this.$utils.empty(this.userData.id) || !this.$utils.empty(this.foundUser) || this.userData.id.length < 6) {
        return false
      }
      return true
      // e.g. HB0010
      // const regex = new RegExp(`^${this.site}\\d{4,}$`, 'gm')
      // return Boolean(this.userData['id'].match(regex))
    },
    checkName () {
      if (!this.$utils.empty(this.foundUser)) {
        return false
      }
      return !this.$utils.empty(this.userData.name) && this.userData.name.length > 1
    },
    checkIp () {
      return this.$utils.isIPv4(this.userData.ip)
    },
    checkExt () {
      if (this.$utils.empty(this.userData.ext)) {
        return null
      }
      const regex = new RegExp('^\\d{3,4}$', 'gm')
      return Boolean(this.userData.ext.match(regex))
    },
    checkBirthday () {
      if (this.$utils.empty(this.userData.birthday)) {
        return null
      }
      const regex = new RegExp('^\\d{3,4}/\\d{1,2}/\\d{1,2}$', 'gm')
      return Boolean(this.userData.birthday.match(regex))
    },
    checkCell () {
      if (this.$utils.empty(this.userData.cell)) {
        return null
      }
      const regex = new RegExp('^0\\d{9}$', 'gm')
      return Boolean(this.userData.cell.match(regex))
    },
    checkOnboardDate () {
      if (this.$utils.empty(this.userData.onboard_date)) {
        return null
      }
      const regex = new RegExp('^\\d{3,4}/\\d{1,2}/\\d{1,2}$', 'gm')
      return Boolean(this.userData.onboard_date.match(regex))
    }
  },
  watch: {
    foundUser (val) {
      val && this.$bvToast.toast(`「${val.id} ${val.name}」使用者已存在，請選擇其他代碼！`, {
        title: '重複警訊',
        toaster: 'b-toaster-top-center',
        appendToast: false,
        variant: 'warning',
        // noAutoHide: true,
        // autoHideDelay: 10000,
        solid: true
      })
    }
  },
  created () {
    this.userData.id = this.id
    this.userData.name = this.name || ''
    // this.userData.birthday = this.userData.onboard_date = this.$utils.now().split(' ')[0].replaceAll('-', '/')
    this.findDuplication = this.$utils.debounce(() => {
      if (this.$utils.empty(this.users)) {
        this.foundUser = null
      } else {
        this.foundUser = this.users.find((user, idx, users) => {
          return this.userData.id === user.id
        })
      }
    }, 250)
    this.authOpts = [
      { value: this.$consts.AUTHORITY.DISABLED, text: '停用', disabled: true },
      { value: this.$consts.AUTHORITY.ADMIN, text: '系統管理' },
      { value: this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT, text: '訊息管理' },
      { value: this.$consts.AUTHORITY.USER_MANAGEMENT, text: '人員管理' },
      { value: this.$consts.AUTHORITY.CHIEF, text: '主管' },
      { value: this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION, text: '研考' }
    ]
  },
  methods: {
    formatter (val) { return val.toUpperCase() },
    findDuplication () {}, // placeholder for debounced method
    toTWFormat (adDate) {
      let twDate = adDate.replace('/-/g', '/')
      // detect if it is AD date
      if (twDate.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        // to TW date
        twDate =
          parseInt(twDate.substring(0, 4)) - 1911 + twDate.substring(4)
      }
      return twDate
    },
    toADFormat (twDate) {
      let adDate = twDate.replace('/-/g', '/')
      // detect if it is TW date
      if (adDate.match(/^\d{3}\/\d{2}\/\d{2}$/)) {
        // to AD date
        adDate =
          parseInt(adDate.substring(0, 3)) + 1911 + adDate.substring(3)
      }
      return adDate
    },
    callApi (prompt, config) {
      return new Promise((resolve, reject) => {
        this.confirm(prompt).then((answer) => {
          if (answer) {
            this.isBusy = true
            this.$axios
              .post(this.$consts.API.JSON.USER, config)
              .then(({ data }) => {
                if (this.$utils.statusCheck(data.status)) {
                  this.notify(data.message, { type: 'success' })
                  resolve(Object.assign({}, this.userData))
                  // clear id after added
                  this.userData.id = ''
                } else {
                  this.notify(data.message, { type: 'warning' })
                  reject(data.message)
                }
              })
              .catch((err) => {
                this.$utils.error(err)
                reject(err)
              })
              .finally(() => {
                this.isBusy = false
              })
          } else {
            reject('user cancelled the confirmation.')
          }
        })
      })
    },
    save () {
      this.callApi('確定要更新?', {
        type: 'add_user',
        data: this.userData
      }).then((userData) => {
        this.trigger('added', userData)
      }).catch((error) => {
        console.log(error)
      }).finally(() => {
        // clean input data
        this.userData = {
          ...{
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
            authority: 0
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.toogle-block:hover {
  font-weight: bolder;
  text-decoration: underline;
}
.optional-border {
  border-style: dashed;
  border-width: 2px;
  border-radius: .75rem;
  border-color: gray;
}
</style>
