<template>
  <b-card v-if="!$utils.empty(userData) && isAuthorized">
    <div>
      <b-button v-if="isLeft" block size="lg" variant="danger">復職</b-button>
      <hr v-if="isLeft"/>
      <b-form-group
        label="ID"
        label-for="id-input"
        label-cols-sm="1"
        label-size="md"
      >
        <b-input id="id-input" v-model="userData['id']" disabled trim />
      </b-form-group>
      <b-form-group
        label="姓名"
        label-for="name-input"
        label-cols-sm="1"
        label-size="md"
      >
        <b-input id="name-input" v-model="userData['name']" trim />
      </b-form-group>
      <b-form-group
        label="職稱"
        label-for="work-title-select"
        label-cols-sm="1"
        label-size="md"
      >
        <b-select
          id="work-title-select"
          v-model="userData['title']"
          :options="workTitleOpts"
        ></b-select>
      </b-form-group>
      <b-form-group
        label="電腦IP"
        label-for="ip-input"
        label-cols-sm="1"
        label-size="md"
      >
        <b-input id="ip-input" v-model="userData['ip']" trim />
      </b-form-group>
      <b-form-group
        label="分機"
        label-for="ext-input"
        label-cols-sm="1"
        label-size="md"
      >
        <b-input id="ext-input" v-model="userData['ext']" trim />
      </b-form-group>
      <b-form-group
        label="生日"
        label-for="bd-input"
        label-cols-sm="1"
        label-size="md"
      >
        <b-input id="bd-input" v-model="userData['birthday']" trim />
      </b-form-group>
      <b-form-group
        label="課室"
        label-for="unit-select"
        label-cols-sm="1"
        label-size="md"
      >
        <b-select
          id="unit-select"
          v-model="userData['unit']"
          :options="unitOpts"
        ></b-select>
      </b-form-group>
      <b-form-group
        label="工作"
        label-for="work-input"
        label-cols-sm="1"
        label-size="md"
      >
        <b-input id="work-input" v-model="userData['work']" trim />
      </b-form-group>
      <b-form-group
        label="教育"
        label-for="edu-input"
        label-cols-sm="1"
        label-size="md"
      >
        <b-input id="edu-input" v-model="userData['education']" trim />
      </b-form-group>
      <b-form-group
        label="考試"
        label-for="exam-input"
        label-cols-sm="1"
        label-size="md"
      >
        <b-input id="exam-input" v-model="userData['exam']" trim />
      </b-form-group>
      <b-form-group
        label="手機"
        label-for="cell-input"
        label-cols-sm="1"
        label-size="md"
      >
        <b-input id="cell-input" v-model="userData['cell']" trim />
      </b-form-group>
      <b-form-group
        label="到職"
        label-for="onboard-input"
        label-cols-sm="1"
        label-size="md"
      >
        <b-input id="onboard-input" v-model="userData['onboard_date']" trim />
      </b-form-group>
      <b-form-group
        label="離職"
        label-for="offboard-input"
        label-cols-sm="1"
        label-size="md"
      >
        <b-input id="offboard-input" v-model="userData['offboard_date']" trim />
      </b-form-group>
    </div>
    <!--
    <b-card-img
      :src="photoUrl(userData)"
      :alt="userData['name']"
      class="img-thumbnail float-right mx-auto ml-2 shadow-xl"
      style="max-width: 220px"
    ></b-card-img>
    -->
  </b-card>
</template>

<script>
export default {
  props: {
    raw: { type: Array, default: () => [] },
    id: { type: String, default: "" },
    name: { type: String, default: "" },
  },
  data: () => ({
    userData: {},
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
  }),
  watch: {
    raw(array) {
      if (Array.isArray(array)) {
        if (array.length > 1) {
          this.userData =
            array.find((item, idx, array) => {
              return this.$utils.empty(item["offboard_date"])
            }) || {}
        } else {
          this.userData = array[0]
        }
      } else {
        this.$utils.warning("raw is not an array", array)
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
  },
  methods: {
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
    // Object.assign makes object data reactively 
    this.userData = this.$utils.empty(this.raw) ? {} : Object.assign({}, this.raw[0])
  },
  mounted() {
  },
}
</script>

<style lang="scss" scoped>
</style>
