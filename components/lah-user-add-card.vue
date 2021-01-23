<template>
  <b-card v-if="isAuthorized" body-border-variant="danger">
    <b-button-group class="d-flex justify-content-between">
      <lah-button icon="save" @click="save" :disabled="!checkRequired">新增</lah-button>
    </b-button-group>
    <hr />
    <b-card-group deck>
      <b-card no-body class="border-0">
        <b-form-group
          label="ID"
          label-for="id-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input
            id="id-input"
            v-model="userData['id']"
            trim
            :state="checkId"
          />
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
          <b-input
            id="onboard-input"
            v-model="userData['onboard_date']"
            trim
            :state="checkOnboardDate"
            placeholder="110/01/22"
          />
        </b-form-group>
      </b-card>
      <b-card no-body class="border-0">
        <!-- <b-form-group
          label="離職"
          label-for="offboard-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input
            id="offboard-input"
            :value="userData['offboard_date']"
            disabled
            trim
          />
        </b-form-group> -->
      </b-card>
    </b-card-group>
    <hr />
    <lah-user-card :raw="[userData]"></lah-user-card>
  </b-card>
</template>

<script>
import lahUserCard from "./lah-user-card.vue"
export default {
  components: { lahUserCard },
  props: {
    users: { type: Array, default: [] } // for duplication checking
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
      "主任",
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
      "主任室",
    ],
    sexOpts: [
      { value: 1, text: "男" },
      { value: 0, text: "女" },
    ],
  }),
  computed: {
    isAuthorized () {
      return this.authority.isAdmin || this.authority.isSuper
    },
    checkRequired () {
      return this.checkId === true &&
             this.checkName === true &&
             this.checkIp === true &&
             this.checkOnboardDate === true &&
             this.checkExt !== false &&
             this.checkBirthday !== false &&
             this.checkCell !== false
    },
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
    toTWFormat (ad_date) {
      tw_date = ad_date.replace("/-/g", "/")
      // detect if it is AD date
      if (tw_date.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        // to TW date
        tw_date =
          parseInt(tw_date.substring(0, 4)) - 1911 + tw_date.substring(4)
      }
      return tw_date
    },
    toADFormat (tw_date) {
      let ad_date = tw_date.replace("/-/g", "/")
      // detect if it is TW date
      if (ad_date.match(/^\d{3}\/\d{2}\/\d{2}$/)) {
        // to AD date
        ad_date =
          parseInt(ad_date.substring(0, 3)) + 1911 + ad_date.substring(3)
      }
      return ad_date
    },
    async update (prompt, config) {
      return new Promise((resolve, reject) => {
        this.confirm(prompt).then((answer) => {
          if (answer) {
            this.isBusy = true
            this.$axios
              .post(this.$consts.API.JSON.USER, config)
              .then((res) => {
                if (this.$utils.statusCheck(res.data.status)) {
                  this.notify(res.data.message, { type: "success" })
                  this.trigger("added", this.userData)
                } else {
                  this.notify(res.data.message, { type: "warning" })
                }
              })
              .catch((err) => {
                this.$utils.error(err)
                reject(err)
              })
              .finally(() => {
                this.isBusy = false
                resolve(answer)
              })
          } else {
            reject(answer)
          }
        })
      })
    },
    save () {
      this.update("確定要更新?", {
        type: "add_user",
        data: this.userData,
      })
    },
  },
  created() {
    this.userData["birthday"] = this.userData["onboard_date"] = this.$utils.now().split(" ")[0].replaceAll("-", "/")
  },
}
</script>

<style lang="scss" scoped>
</style>
