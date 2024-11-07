<template>
  <b-card>
    <b-card-title v-if="!noTitle">
      辦理情形
      <b-link :href="queryStatusUrl" target="_blank" title="開啟新視窗">
        <lah-fa-icon append icon="share-square" no-gutter />
      </b-link>
    </b-card-title>
    <b-list-group v-if="ready" flush compact>
      <b-list-group-item>
        <b-form-row>
          <b-col
            :title="bakedData.預定結案日期"
          >
            預定結案：<span v-html="bakedData.限辦期限" />
          </b-col>
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
            收件人員：
            <b-button pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.收件人員, bakedData.RM07_ID)">
              <lah-avatar :id="bakedData.RM07_ID" :name="bakedData.收件人員">
                {{ bakedData.收件人員 }}
              </lah-avatar>
            </b-button>
          </b-col>
          <b-col>收件時間：{{ bakedData.收件時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.移轉課長)">
        <b-form-row>
          <b-col>
            移轉課長：
            <b-button pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.移轉課長, bakedData.RM106)">
              <lah-avatar :id="bakedData.RM106" :name="bakedData.移轉課長">
                {{ bakedData.移轉課長 }}
              </lah-avatar>
            </b-button>
          </b-col>
          <b-col>移轉課長時間：{{ bakedData.移轉課長時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.移轉秘書)">
        <b-form-row>
          <b-col>
            移轉秘書：
            <b-button pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.移轉秘書, bakedData.RM107)">
              <lah-avatar :id="bakedData.RM107" :name="bakedData.移轉秘書">
                {{ bakedData.移轉秘書 }}
              </lah-avatar>
            </b-button>
          </b-col>
          <b-col>移轉秘書時間：{{ bakedData.移轉秘書時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.初審人員)">
        <b-form-row>
          <b-col>
            初審人員：
            <b-button pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.初審人員, bakedData.RM45)">
              <lah-avatar :id="bakedData.RM45" :name="bakedData.初審人員">
                {{ bakedData.初審人員 }}
              </lah-avatar>
            </b-button>
          </b-col>
          <b-col>初審時間：{{ bakedData.初審時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.複審人員)">
        <b-form-row>
          <b-col>
            複審人員：
            <b-button pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.複審人員, bakedData.RM47)">
              <lah-avatar :id="bakedData.RM47" :name="bakedData.複審人員">
                {{ bakedData.複審人員 }}
              </lah-avatar>
            </b-button>
          </b-col>
          <b-col>複審時間：{{ bakedData.複審時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.駁回日期)">
        <b-form-row>
          <b-col>駁回日期：{{ bakedData.駁回日期 }}</b-col>
          <b-col />
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
          <b-col>
            <span>通知補正：{{ bakedData.通知補正日期 }}</span>
            <lah-button
              v-if="hasFixData"
              pill
              @click="showFixDataText"
            >
              通知內容
            </lah-button>
          </b-col>
          <b-col>補正期滿：{{ bakedData.補正期滿日期 }} 天數：{{ bakedData.補正期限 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.補正日期)">
        <b-form-row>
          <b-col>補正日期：{{ bakedData.補正日期 }}</b-col>
          <b-col />
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.請示人員)">
        <b-form-row>
          <b-col>
            請示人員：
            <b-button pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.請示人員, bakedData.RM82)">
              <lah-avatar :id="bakedData.RM82" :name="bakedData.請示人員">
                {{ bakedData.請示人員 }}
              </lah-avatar>
            </b-button>
          </b-col>
          <b-col>請示日期：{{ bakedData.請示日期 }} {{ bakedData.請示時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.取消請示人員)">
        <b-form-row>
          <b-col>
            取消請示人員：
            <b-button pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.取消請示人員, bakedData.RM85)">
              <lah-avatar :id="bakedData.RM85" :name="bakedData.取消請示人員">
                {{ bakedData.取消請示人員 }}
              </lah-avatar>
            </b-button>
          </b-col>
          <b-col>取消請示日期：{{ bakedData.取消請示日期 }} {{ bakedData.取消請示時間 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.展期人員)">
        <b-form-row>
          <b-col>
            展期人員：
            <b-button pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.展期人員, bakedData.RM88)">
              <lah-avatar :id="bakedData.RM88" :name="bakedData.展期人員">
                {{ bakedData.展期人員 }}
              </lah-avatar>
            </b-button>
          </b-col>
          <b-col>展期日期：{{ bakedData.展期日期 }} 天數：{{ bakedData.展期天數 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.准登人員)">
        <b-form-row>
          <b-col>
            准登人員：
            <b-button pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.准登人員, bakedData.RM63)">
              <lah-avatar :id="bakedData.RM63" :name="bakedData.准登人員">
                {{ bakedData.准登人員 }}
              </lah-avatar>
            </b-button>
          </b-col>
          <b-col>准登日期：{{ bakedData.准登日期 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.登錄人員)">
        <b-form-row>
          <b-col>
            登錄人員：
            <b-button pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.登錄人員, bakedData.RM55)">
              <lah-avatar :id="bakedData.RM55" :name="bakedData.登錄人員">
                {{ bakedData.登錄人員 }}
              </lah-avatar>
            </b-button>
          </b-col>
          <b-col>登錄日期：{{ bakedData.登錄日期 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.校對人員)">
        <b-form-row>
          <b-col>
            校對人員：
            <b-button pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.校對人員, bakedData.RM57)">
              <lah-avatar :id="bakedData.RM57" :name="bakedData.校對人員">
                {{ bakedData.校對人員 }}
              </lah-avatar>
            </b-button>
          </b-col>
          <b-col>校對日期：{{ bakedData.校對日期 }}</b-col>
        </b-form-row>
      </b-list-group-item>
      <b-list-group-item v-if="!$utils.empty(bakedData.結案人員)">
        <b-form-row>
          <b-col>
            結案人員：
            <b-button pill variant="outline-secondary" size="sm" @click="userinfo(bakedData.結案人員, bakedData.RM59)">
              <lah-avatar :id="bakedData.RM59" :name="bakedData.結案人員">
                {{ bakedData.結案人員 }}
              </lah-avatar>
            </b-button>
          </b-col>
          <b-col>結案日期：{{ bakedData.結案日期 }}</b-col>
        </b-form-row>
      </b-list-group-item>
    </b-list-group>
  </b-card>
</template>

<script>
import lahAvatar from '~/components/lah-avatar.vue';
import regCaseBase from '~/components/lah-reg-case-base.js';
import lahUserCard from '~/components/lah-user-card.vue';

export default {
  name: 'LahRegCaseStatus',
  components: { lahUserCard, lahAvatar },
  mixins: [regCaseBase],
  props: {
    noTitle: { type: Boolean, default: false }
  },
  data: () => ({
    localCRCRDData: false
  }),
  computed: {
    ongoing () {
      // 'E' => 請示
      return this.ready && this.bakedData.結案與否 === 'N'
    },
    hasFixData () {
      return this.bakedCaseId && !this.$utils.empty(this.bakedData?.通知補正日期)
    },
    fixDataText () {
      return this.localCRCRDData?.RC05
    },
    bakedCaseId () {
      if (this.bakedData) {
        return `${this.bakedData.RM01}${this.bakedData.RM02}${this.bakedData.RM03}`
      }
      return false
    }
  },
  watch: {
    hasFixData (flag) {
      flag && this.getLocalFixData()
    }
  },
  methods: {
    userinfo (name, id = '') {
      this.modal(this.$createElement(lahUserCard, { props: { name, id } }), {
        title: `${id} ${name} 資訊`
      })
    },
    getLocalFixData () {
      this.isBusy = true
      this.localCRCRDData = false
      this.$axios.post(this.$consts.API.JSON.XCASE, {
        type: 'get_local_fix_data',
        id: this.bakedCaseId
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.localCRCRDData = { ...data.raw }
        } else {
          this.warning(data.message)
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    showFixDataText () {
      this.modal(this.fixDataText, {
        title: `${this.bakedData.RM01}-${this.bakedData.RM02}-${this.bakedData.RM03} 補正通知內容`
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
