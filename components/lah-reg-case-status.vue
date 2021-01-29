<template>
  <b-card>
    <b-card-title v-if="!noTitle">
      辦理情形
      <b-link :href="queryStatusUrl" target="_blank" title="開啟新視窗">
        <lah-fa-icon append icon="share-square" no-gutter/>
      </b-link>
    </b-card-title>
    <b-list-group flush compact v-if="ready">
      <b-list-group-item>
        <b-form-row>
          <b-col :title="bakedData.預定結案日期"
            >預定結案：<span v-html="bakedData.限辦期限"></span
          ></b-col>
          <b-col :title="bakedData.結案與否">
            結案與否：
            <span v-if="ongoing" class="text-danger"><strong>尚未結案！</strong></span>
            <span v-else class="text-success"><strong>已結案</strong></span>
          </b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.代理人統編)">
        <b-form-row>
          <b-col>代理人統編：{{ bakedData.代理人統編 }}</b-col>
          <b-col>代理人姓名：{{ bakedData.代理人姓名 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.權利人統編)">
        <b-form-row>
          <b-col>權利人統編：{{ bakedData.權利人統編 }}</b-col>
          <b-col>權利人姓名：{{ bakedData.權利人姓名 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.義務人統編)">
        <b-form-row>
          <b-col>義務人統編：{{ bakedData.義務人統編 }}</b-col>
          <b-col>義務人姓名：{{ bakedData.義務人姓名 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item>
        <b-form-row>
          <b-col>登記原因：{{ bakedData.登記原因 }}</b-col>
          <b-col>辦理情形：<span :class="bakedData.紅綠燈背景CSS">{{ bakedData.辦理情形 }}</span></b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item>
        <b-form-row>
          <b-col>
            收件人員：<b-button variant="outline-secondary" size="sm" @click="userinfo(bakedData.收件人員, bakedData.RM07_ID)">{{ bakedData.收件人員 }}</b-button>
          </b-col>
          <b-col>收件時間：{{ bakedData.收件時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.移轉課長)">
        <b-form-row>
          <b-col>
            移轉課長：<b-button variant="outline-secondary" size="sm" @click="userinfo(bakedData.移轉課長, bakedData.RM106)">{{ bakedData.移轉課長 }}</b-button>
          </b-col>
          <b-col>移轉課長時間：{{ bakedData.移轉課長時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.移轉秘書)">
        <b-form-row>
          <b-col>
            移轉秘書：<b-button variant="outline-secondary" size="sm" @click="userinfo(bakedData.移轉秘書, bakedData.RM107)">{{ bakedData.移轉秘書 }}</b-button>
          </b-col>
          <b-col>移轉秘書時間：{{ bakedData.移轉秘書時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.初審人員)">
        <b-form-row>
          <b-col>
            初審人員：<b-button variant="outline-secondary" size="sm" @click="userinfo(bakedData.初審人員, bakedData.RM45)">{{ bakedData.初審人員 }}</b-button>
          </b-col>
          <b-col>初審時間：{{ bakedData.初審時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.複審人員)">
        <b-form-row>
          <b-col>
            複審人員：<b-button variant="outline-secondary" size="sm" @click="userinfo(bakedData.複審人員, bakedData.RM47)">{{ bakedData.複審人員 }}</b-button>
          </b-col>
          <b-col>複審時間：{{ bakedData.複審時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.駁回日期)">
        <b-form-row>
          <b-col>駁回日期：{{ bakedData.駁回日期 }}</b-col>
          <b-col></b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.公告日期)">
        <b-form-row>
          <b-col>公告日期：{{ bakedData.公告日期 }}</b-col>
          <b-col>公告到期：{{ bakedData.公告期滿日期 }} 天數：{{ bakedData.公告天數 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.通知補正日期)">
        <b-form-row>
          <b-col>通知補正：{{ bakedData.通知補正日期 }}</b-col>
          <b-col>補正期滿：{{ bakedData.補正期滿日期 }} 天數：{{ bakedData.補正期限 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.補正日期)">
        <b-form-row>
          <b-col>補正日期：{{ bakedData.補正日期 }}</b-col>
          <b-col></b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.請示人員)">
        <b-form-row>
          <b-col>請示人員：<b-button variant="outline-secondary" size="sm" @click="userinfo(bakedData.請示人員, bakedData.RM82)">{{ bakedData.請示人員 }}</b-button></b-col>
          <b-col>請示日期：{{ bakedData.請示日期 }} {{ bakedData.請示時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.取消請示人員)">
        <b-form-row>
          <b-col>取消請示人員：<b-button variant="outline-secondary" size="sm" @click="userinfo(bakedData.取消請示人員, bakedData.RM85)">{{ bakedData.取消請示人員 }}</b-button></b-col>
          <b-col>取消請示日期：{{ bakedData.取消請示日期 }} {{ bakedData.取消請示時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.展期人員)">
        <b-form-row>
          <b-col>展期人員：<b-button variant="outline-secondary" size="sm" @click="userinfo(bakedData.展期人員, bakedData.RM85)">{{ bakedData.展期人員 }}</b-button></b-col>
          <b-col>展期日期：{{ bakedData.展期日期 }} 天數：{{ bakedData.展期天數 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.准登人員)">
        <b-form-row>
          <b-col>准登人員：<b-button variant="outline-secondary" size="sm" @click="userinfo(bakedData.准登人員, bakedData.RM63)">{{ bakedData.准登人員 }}</b-button></b-col>
          <b-col>准登日期：{{ bakedData.准登日期 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.登錄人員)">
        <b-form-row>
          <b-col>登錄人員：<b-button variant="outline-secondary" size="sm" @click="userinfo(bakedData.登錄人員, bakedData.RM55)">{{ bakedData.登錄人員 }}</b-button></b-col>
          <b-col>登錄日期：{{ bakedData.登錄日期 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.校對人員)">
        <b-form-row>
          <b-col>校對人員：<b-button variant="outline-secondary" size="sm" @click="userinfo(bakedData.校對人員, bakedData.RM57)">{{ bakedData.校對人員 }}</b-button></b-col>
          <b-col>校對日期：{{ bakedData.校對日期 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.結案人員)">
        <b-form-row>
          <b-col>結案人員：<b-button variant="outline-secondary" size="sm" @click="userinfo(bakedData.結案人員, bakedData.RM59)">{{ bakedData.結案人員 }}</b-button></b-col>
          <b-col>結案日期：{{ bakedData.結案日期 }}</b-col>
        </b-form-row>
      </b-list-group-item>
    </b-list-group>
  </b-card>
</template>

<script>
import regCaseBase from "~/assets/js/reg-case-base.js"
import lahUserCard from '~/components/lah-user-card.vue'
import lahAvatar from '~/components/lah-avatar.vue'

export default {
  name: "lah-reg-case-status",
  components: { lahUserCard, lahAvatar },
  mixins: [regCaseBase],
  props: {
    noTitle: { type: Boolean, default: false },
  },
  computed: {
    ongoing() {
      // 'E' => 請示
      return this.ready && this.bakedData.結案與否 === "N";
    },
  },
  methods: {
    userinfo (name, id = '') {
      this.modal(this.$createElement('lah-user-card', { props: { name: name, id: id } }), {
        title: `${id} ${name} 資訊`
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
