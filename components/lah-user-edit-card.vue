<template>
  <b-card v-if="!$utils.empty(userData) && isAuthorized" body-border-variant="danger">
    <b-button-group class="d-flex justify-content-between">
      <lah-button icon="save" @click="save" :disabled="isLeft || !checkRequired">{{isLeft ? '已離職(無法變更資料)' : '儲存變更'}}</lah-button>
      <lah-button icon="user-circle" regular v-if="!isLeft" variant="secondary" @click="upload">上傳個人圖檔</lah-button>
      <lah-button icon="sign-in-alt" v-if="isLeft" variant="success" action="move-fade-ltr" @click="onboard">復職</lah-button>
      <lah-button icon="sign-out-alt" v-if="!isLeft" variant="danger" action="move-fade-ltr" @click="offboard">離職</lah-button>
    </b-button-group>
    <hr/>
    <b-card-group deck>
      <b-card no-body class="border-0">
        <b-form-group
          label="ID"
          label-for="id-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input id="id-input" :value="userData['id']" disabled trim />
        </b-form-group>
      </b-card>
      <b-card no-body class="border-0">
        <b-form-group
          label="姓名"
          label-for="name-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input id="name-input" v-model="userData['name']" :state="checkName" trim />
        </b-form-group>
      </b-card>
    </b-card-group>

    <b-card-group deck>
      <b-card no-body class="border-0">
        <b-form-group
          label="性別"
          label-for="sex-select"
          label-cols-sm="2"
          label-size="md"
        >
          <b-select
            id="sex-select"
            v-model="userData['sex']"
            :options="sexOpts"
          ></b-select>
        </b-form-group>
      </b-card>
      <b-card no-body class="border-0">
        <b-form-group
          label="職稱"
          label-for="work-title-select"
          label-cols-sm="2"
          label-size="md"
        >
          <b-select
            id="work-title-select"
            v-model="userData['title']"
            :options="workTitleOpts"
          ></b-select>
        </b-form-group>
      </b-card>
    </b-card-group>
    
    <b-card-group deck>
      <b-card no-body class="border-0">
        <b-form-group
          label="電腦"
          label-for="ip-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input id="ip-input" v-model="userData['ip']" :state="checkIp" trim />
        </b-form-group>
      </b-card>
      <b-card no-body class="border-0">
        <b-form-group
          label="分機"
          label-for="ext-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input id="ext-input" v-model="userData['ext']" :state="checkExt" trim />
        </b-form-group>
      </b-card>
    </b-card-group>

    <b-card-group deck>
      <b-card no-body class="border-0">
        <b-form-group
          label="生日"
          label-for="bd-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input id="bd-input" v-model="userData['birthday']" :state="checkBirthday" trim />
        </b-form-group>
      </b-card>
      <b-card no-body class="border-0">
        <b-form-group
          label="課室"
          label-for="unit-select"
          label-cols-sm="2"
          label-size="md"
        >
          <b-select
            id="unit-select"
            v-model="userData['unit']"
            :options="unitOpts"
          ></b-select>
        </b-form-group>
      </b-card>
    </b-card-group>

    <b-card-group deck>
      <b-card no-body class="border-0">
        <b-form-group
          label="工作"
          label-for="work-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input id="work-input" v-model="userData['work']" trim />
        </b-form-group>
      </b-card>
      <b-card no-body class="border-0">
        <b-form-group
          label="教育"
          label-for="edu-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input id="edu-input" v-model="userData['education']" trim />
        </b-form-group>
      </b-card>
    </b-card-group>

    <b-card-group deck>
      <b-card no-body class="border-0">
        <b-form-group
          label="考試"
          label-for="exam-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input id="exam-input" v-model="userData['exam']" trim />
        </b-form-group>
      </b-card>
      <b-card no-body class="border-0">
        <b-form-group
          label="手機"
          label-for="cell-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input id="cell-input" v-model="userData['cell']" :state="checkCell" trim />
        </b-form-group>
      </b-card>
    </b-card-group>

    <b-card-group deck>
      <b-card no-body class="border-0">
        <b-form-group
          label="到職"
          label-for="onboard-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input id="onboard-input" v-model="userData['onboard_date']" trim :state="checkOnboardDate" placeholder="110/01/22" />
        </b-form-group>
      </b-card>
      <b-card no-body class="border-0">
        <b-form-group
          label="離職"
          label-for="offboard-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input id="offboard-input" :value="userData['offboard_date']" disabled trim />
        </b-form-group>
      </b-card>
    </b-card-group>
    <!--
    <b-card-img
      :src="photoUrl(userData)"
      :alt="userData['name']"
      class="img-thumbnail float-right mx-auto ml-2 shadow-xl"
      style="max-width: 220px"
    ></b-card-img>
    -->
    <hr/>
    <lah-user-card :raw="[userData]"></lah-user-card>
  </b-card>
</template>

<script>
import lahUserCard from './lah-user-card.vue'
import lahFaIcon from './lah-fa-icon.vue'
export default {
  components: { lahUserCard, lahFaIcon },
  props: {
    raw: { type: Array, default: () => [] },
    id: { type: String, default: "" },
    name: { type: String, default: "" },
  },
  data: () => ({
    userData: {
      id: "",
      name: "",
      sex: "1",
      title: "臨時人員",
      work: "打雜",
      ext: "153",
      birthday: "",
      unit: "行政課",
      ip: "192.168.XX.XX",
      education: "桃園市中壢區富台國民小學",
      exam: "未通過國家考試",
      cell: "",
      onboard_date: "",
      offboard_date: ""
    },
    workTitleOpts: [
      "臨時人員",
      "約僱人員",
      "工讀生",
      "身心專案",
      "促進就業方案人員",
      "工友",
      "技佐",
      "技工",
      "書記",
      "助理員",
      "辦事員",
      "測量助理",
      "測量員",
      "助理管理師",
      "技士",
      "課員",
      "管理師",
      "會計員",
      "人事管理員",
      "課長",
      "秘書",
      "主任"
    ],
    unitOpts: [
      "登記課",
      "測量課",
      "行政課",
      "地價課",
      "資訊課",
      "人事室",
      "會計室",
      "秘書室",
      "主任室"
    ],
    sexOpts: [
      { value: 1, text: "男" },
      { value: 0, text: "女" }
    ]
  }),
  watch: {
    raw(array) {
      if (Array.isArray(array)) {
        if (array.length > 1) {
          this.assignUserData(array.find((item, idx, array) => {
            return this.$utils.empty(item["offboard_date"])
          }))
        } else {
          this.assignUserData(array[0])
        }
      } else {
        this.$utils.warn("raw is not an array", array)
      }
    },
  },
  computed: {
    isAuthorized() {
      return this.authority.isAdmin || this.authority.isSuper
    },
    isLeft() {
      return !this.$utils.empty(this.userData["offboard_date"])
    },
    checkRequired () {
      return this.modified &&
             this.checkId === true &&
             this.checkName === true &&
             this.checkIp === true &&
             this.checkOnboardDate === true &&
             this.checkExt !== false &&
             this.checkBirthday !== false &&
             this.checkCell !== false
    },
    modified () { return !this.$utils.equal(this.userData, this.origUserData) },
    checkId () {
      if (this.$utils.empty(this.userData['id'])) {
        return false
      }
      // e.g. HB0010
      const regex = new RegExp(`^${this.svr.config.site}\\d{4,}$`, 'gm')
      return Boolean(this.userData['id'].match(regex))
    },
    checkName () {
      return !this.$utils.empty(this.userData['name']) && this.userData['name'].length > 1
    },
    checkIp () {
      const regex = new RegExp(`^(?!0)(?!.*\\.$)((1?\\d?\\d|25[0-5]|2[0-4]\\d)(\\.|$)){4}$`, 'gm')
      return Boolean(this.userData['ip'].match(regex))
    },
    checkExt () {
      if (this.$utils.empty(this.userData['ext'])) {
        return null
      }
      const regex = new RegExp(`^\\d{3,4}$`, 'gm')
      return Boolean(this.userData['ext'].match(regex))
    },
    checkBirthday () {
      if (this.$utils.empty(this.userData['birthday'])) {
        return null
      }
      const regex = new RegExp(`^\\d{3,4}/\\d{1,2}/\\d{1,2}$`, 'gm')
      return Boolean(this.userData['birthday'].match(regex))
    },
    checkCell () {
      if (this.$utils.empty(this.userData['cell'])) {
        return null
      }
      const regex = new RegExp(`^0\\d{9}$`, 'gm')
      return Boolean(this.userData['cell'].match(regex))
    },
    checkOnboardDate () {
      const regex = new RegExp(`^\\d{3,4}/\\d{1,2}/\\d{1,2}$`, 'gm')
      return Boolean(this.userData['onboard_date'].match(regex))
    }
  },
  methods: {
    assignUserData (array) {
      // Object.assign makes object data reactively
      if (!this.$utils.empty(array)) {
        this.userData = Object.assign(this.userData, array)
      }
    },
    toTWFormat: function (ad_date) {
      tw_date = ad_date.replace("/-/g", "/")
      // detect if it is AD date
      if (tw_date.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        // to TW date
        tw_date =
          parseInt(tw_date.substring(0, 4)) - 1911 + tw_date.substring(4)
      }
      return tw_date
    },
    toADFormat: function (tw_date) {
      let ad_date = tw_date.replace("/-/g", "/")
      // detect if it is TW date
      if (ad_date.match(/^\d{3}\/\d{2}\/\d{2}$/)) {
        // to AD date
        ad_date =
          parseInt(ad_date.substring(0, 3)) + 1911 + ad_date.substring(3)
      }
      return ad_date
    },
    photoUrl: function (user) {
      if (this.useAvatar) {
        return `http://${this.svr.ips[0]}/get_user_img.php?name=${user["name"]}_avatar`
      }
      return `http://${this.svr.ips[0]}/get_user_img.php?name=${user["name"]}`
    },
    async update (prompt, config) {
      return new Promise((resolve, reject) => {
        this.confirm(prompt).then((answer) => {
          if (answer) {
            this.isBusy = true
            this.$axios.post(this.$consts.API.JSON.USER, config).then((res) => {
              if (this.$utils.statusCheck(res.data.status)) {
                this.notify(res.data.message, { type: "success" })
                const today = this.$utils.now().split(' ')[0].replaceAll('-', '/')
                if (config.type === "user_onboard") {
                  this.userData['offboard_date'] = ''
                  this.userData['onboard_date'] = today
                } else if (config.type === "user_offboard") {
                  this.userData['offboard_date'] = today
                }
                resolve(this.userData)
              } else {
                this.notify(res.data.message, { type: "warning" })
                reject(res.data.message)
              }
            }).catch((err) => {
              this.$utils.error(err)
              reject(err)
            }).finally(() => {
              this.isBusy = false
            })
          } else {
            reject('user cancelled the confirmation!')
          }
        })
      })
    },
    save () {
      this.update('確定要更新?', {
        type: 'save_user_info',
        data: this.userData
      }).then((userData) => {
        this.trigger('saved', userData)
      })
    },
    offboard () {
      this.update('確定要設定為已離職?', {
        type: 'user_offboard',
        id: this.userData['id']
      }).then((userData) => {
        this.trigger('saved', userData)
      }).catch((error) => {
        this.$utils.warn(error)
      })
    },
    onboard () {
      const today = this.$utils.now().split(' ')[0]
      this.update(`確定要設定為復職? (到職日期會被設定為 ${today}，離職日期清空)`, {
        type: 'user_onboard',
        id: this.userData['id']
      }).then((userData) => {
        this.trigger('saved', userData)
      }).catch((error) => {
        this.$utils.warn(error)
      })
    },
    upload () {
      this.modal(this.$createElement('lah-fa-icon', {
        props: { icon: 'user-circle', variant: 'info' }
      }), {
        title: `上傳 ${this.userData.id} ${this.userData.name} 個人圖檔`,
        noCloseOnBackdrop: true
      })
    }
  },
  fetch() {
    (!this.$utils.empty(this.id) || !this.$utils.empty(this.name)) &&
      this.$axios
        .post(this.$consts.API.JSON.USER, {
          type: "user_info",
          id: this.id,
          name: this.name,
        })
        .then((res) => {
          if (this.$utils.statusCheck(res.data.status)) {
            if (res.data.data_count > 1) {
              this.userData =
                res.data.raw.find((item, idx, array) => {
                  return this.$utils.empty(item["offboard_date"])
                }) || {}
            } else {
              this.userData = res.data.raw[0]
            }
          } else {
            this.notify(res.data.message, { type: "warning" })
          }
        })
        .catch((err) => {
          this.$utils.error(err)
        })
        .finally(() => {
          this.isBusy = false
        })
  },
  created() {
    if (!this.$utils.empty(this.raw)) {
      this.assignUserData(this.raw[0])
      this.origUserData = Object.assign({}, this.userData)
    }
  },
  mounted() {
  },
}
</script>

<style lang="scss" scoped>
</style>
