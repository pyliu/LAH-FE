<template>
  <div>
    <h4 v-if="$utils.empty(userData)" class="center">
      <lah-button v-if="isAuthorized" icon="user-plus" block size="lg" @click="add">新增</lah-button>
      <lah-fa-icon v-else variant="danger">找不到使用者資料</lah-fa-icon>
    </h4>
    <b-card v-else>
      <b-card-title>{{userData['name']}}</b-card-title>
      <b-card-sub-title>{{userData['title']}}</b-card-sub-title>
      <b-card-img
        :src="photoSrc"
        :alt="userData['name']"
        class="img-thumbnail float-right mx-auto ml-2 shadow-xl"
        style="max-width: 220px; cursor: pointer;"
        :title="isAuthorized ? '更新照片' : '放大顯示'"
        @click="photoClick"
      ></b-card-img>
      <b-card-text class="small">
        <lah-fa-icon
          icon="ban"
          variant="danger"
          action="breath"
          v-if="isLeft"
          class="mx-auto"
        >
          已離職【{{ userData["offboard_date"] }}】
        </lah-fa-icon>
        <div>ID：{{ userData["id"] }}</div>
        <div v-if="isAuthorized">電腦：{{ userData["ip"] }}</div>
        <div>分機：{{ userData["ext"] }}</div>
        <div v-if="isAuthorized">
          生日：{{ userData["birthday"] }}
          <b-badge v-if="birthAge !== false" :variant="birthAgeVariant" pill>{{ birthAge }}歲</b-badge>
        </div>
        <div>單位：{{ userData["unit"] }}</div>
        <div>工作：{{ userData["work"] }}</div>
        <div v-if="isAuthorized">學歷：{{ userData["education"] }}</div>
        <div v-if="isAuthorized">考試：{{ userData["exam"] }}</div>
        <div v-if="isAuthorized">手機：{{ userData["cell"] }}</div>
        <div v-if="isAuthorized">
          到職：{{ userData["onboard_date"] }}
          <b-badge v-if="workAge !== false" :variant="workAgeVariant" pill>{{ workAge }}年</b-badge>
        </div>
      </b-card-text>
    </b-card>

  </div>
</template>

<script>
import lahUserPhoto from '~/components/lah-user-photo.vue'
export default {
  name: 'lah-user-card',
  components: { lahUserPhoto },
  props: {
    raw: { type: Array, default: () => ([]) },
    id: { type: String, default: '' },
    name: { type: String, default: '' }
  },
  data: () => ({
    userData: {}
  }),
  computed: {
    isAuthorized () {
      return this.authority.isAdmin || this.authority.isSuper
    },
    isLeft () {
      return !this.$utils.empty(this.userData["offboard_date"])
    },
    birthAgeVariant () {
      const badge_age = this.birthAge
      if (badge_age < 30) {
        return "success"
      } else if (badge_age < 40) {
        return "primary"
      } else if (badge_age < 50) {
        return "warning"
      } else if (badge_age < 60) {
        return "danger"
      }
      return "dark"
    },
    birthAge () {
      let birth = this.userData['birthday']
      if (birth) {
        const now = new Date()
        birth = this.toADFormat(birth)
        let temp = Date.parse(birth)
        if (temp) {
          let born = new Date(temp)
          return ((now - born) / 31536000000).toFixed(1)
        }
      }
      return false
    },
    workAge () {
      let AP_ON_DATE = this.userData['onboard_date']
      const AP_OFF_JOB = this.isLeft ? 'Y' : 'N'
      let AP_OFF_DATE = this.userData['offboard_date']

      if (AP_ON_DATE !== undefined && AP_ON_DATE !== null) {
        AP_ON_DATE = AP_ON_DATE.date
          ? AP_ON_DATE.date.split(' ')[0]
          : AP_ON_DATE
        AP_ON_DATE = this.toADFormat(AP_ON_DATE)
        let temp = Date.parse(AP_ON_DATE)
        if (temp) {
          let on = new Date(temp)
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
      const work_age = this.workAge
      if (work_age < 5) {
        return "success"
      } else if (work_age < 10) {
        return "primary"
      } else if (work_age < 20) {
        return "warning"
      }
      return "danger"
    },
    photoSrc () {
      return `${this.apiSvrHttpUrl}/get_user_img.php?id=${this.userData['id']}&name=${this.userData['name']}`
    }
  },
  watch: {
    raw (array) {
      if (Array.isArray(array)) {
        if (array.length > 1) {
          this.userData = array.find((item, idx, array) => {
            return this.$utils.empty(item['offboard_date'])
          }) || {}
        } else {
          this.userData = array[0]
        }
      } else {
        this.$utils.warning('raw is not an array', array)
      }
    }
  },
  methods: {
    add () {
      if (this.isAuthorized) {
        this.modal(this.$createElement("lah-user-add-card", { props: { userId: this.userData['id'] || this.id } }), {
          title: `新增使用者`,
          size: "lg",
          noCloseOnBackdrop: true
        })
      }
    },
    toTWFormat (ad_date) {
      tw_date = ad_date.replace("/-/g", "/")
      // detect if it is AD date
      if (tw_date.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        // to TW date
        tw_date = parseInt(tw_date.substring(0, 4)) - 1911 + tw_date.substring(4)
      }
      return tw_date
    },
    toADFormat (tw_date) {
      let ad_date = tw_date.replace("/-/g", "/")
      // detect if it is TW date
      if (ad_date.match(/^\d{3}\/\d{2}\/\d{2}$/)) {
        // to AD date
        ad_date = parseInt(ad_date.substring(0, 3)) + 1911 + ad_date.substring(3)
      }
      return ad_date
    },
    photoClick () {
      this.modal(this.$createElement('lah-user-photo', {
        props: {
          userData: this.userData
        }
      }), {
        title: `${this.userData['id']} ${this.userData['name']} 照片`,
        size: 'lg'
      })
      // $emit to parent 
      this.trigger('click', this.userData)
    }
  },
  fetch () {
    (!this.$utils.empty(this.id) || !this.$utils.empty(this.name)) && 
    this.$axios.post(this.$consts.API.JSON.USER, {
      type: 'user_info',
      id: this.id,
      name: this.name
    }).then(res => {
      if (this.$utils.statusCheck(res.data.status)) {
        if (res.data.data_count > 1) {
          this.userData = res.data.raw.find((item, idx, array) => {
            return this.$utils.empty(item['offboard_date'])
          }) || {}
        } else {
          this.userData = res.data.raw[0]
        }
      } else {
        this.$utils.warn(res.data.message)
      }
    }).catch(err => {
      this.$utils.error(err)
    }).finally(() => {
        this.isBusy = false
    })
  },
  created() {
    this.userData = this.$utils.empty(this.raw) ? {} : this.raw[0]
  }
}
</script>

<style lang="scss" scoped>
</style>
