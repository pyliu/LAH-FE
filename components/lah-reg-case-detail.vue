<template>
  <div>
    <!-- header flow table -->
    <lah-reg-b-table
      v-if="bakedData !== undefined"
      :bakedData="[bakedData]"
      type="flow"
      :mute="true"
    ></lah-reg-b-table>
    <!-- detail info card -->
    <b-card no-body>
      
    <!--<b-tabs card :end="tabsAtEnd" :pills="tabsAtEnd">
        
    <b-tab>
        <template v-slot:title>
            <strong>收件資料</strong>
            <b-link variant="muted" @click.stop="$utils.openNewWindow(case_data_url, $event)" :title="'收件資料 on ' + apServer">
                <lah-fa-icon icon="external-link-alt" variant="primary"></lah-fa-icon>
            </b-link>
        </template>
        <b-card-body>
            <b-form-row class="mb-1">
                <b-col>    
                    <lah-transition appear>
                        <div v-show="show_op_card" class="mr-1 float-right" style="width:400px">
                            <lah-fa-icon icon="user" variant="dark" prefix="far"> 作業人員</lah-fa-icon>
                            <lah-user-card @not-found="handleNotFound" :id="bakedData.RM30_1"></lah-user-card>
                        </div>
                    </lah-transition>
                    <div v-if="bakedData.跨所 == 'Y'"><span class='bg-info text-white rounded p-1'>跨所案件 ({{bakedData.資料收件所}} => {{bakedData.資料管轄所}})</span></div>
                    收件字號：
                    <a :title="'收件資料 on ' + ap_server" href="javascript:void(0)" @click="openNewWindow(case_data_url, $event)">
                        {{bakedData.收件字號}}
                    </a> <br/>
                    收件時間：{{bakedData.收件時間}} <br/>
                    測量案件：{{bakedData.測量案件}} <br/>
                    限辦期限：<span v-html="bakedData.限辦期限"></span> <br/>
                    作業人員：<span class='user_tag'>{{bakedData.作業人員}}</span> <br/>
                    辦理情形：{{bakedData.辦理情形}} <br/>
                    登記原因：{{bakedData.登記原因}} <br/>
                    區域：{{area}}【{{bakedData.RM10}}】 <br/>
                    段小段：{{bakedData.段小段}}【{{bakedData.段代碼}}】 <br/>
                    地號：{{bakedData.地號}} <br/>
                    建號：{{bakedData.建號}} <br/>
                    件數：{{bakedData.件數}} <br/>
                    登記處理註記：{{bakedData.登記處理註記}} <br/>
                    地價處理註記：{{bakedData.地價處理註記}} <br/>
                    手機號碼：{{bakedData.手機號碼}}
                </b-col>
            </b-form-row>
        </b-card-body>
    </b-tab>
    <b-tab>
        <template v-slot:title>
            <strong>辦理情形</strong>
            <b-link variant="muted" @click.stop="openNewWindow(case_status_url, $event)" :title="'案件辦理情形 on ' + ap_server"><lah-fa-icon icon="external-link-alt" variant="primary"></lah-fa-icon></b-link>
        </template>
        <b-card-body>
            <b-list-group flush compact>
                <b-list-group-item>
                    <b-form-row>
                        <b-col :title="bakedData.預定結案日期">預定結案：<span v-html="bakedData.限辦期限"></span></b-col>
                        <b-col :title="bakedData.結案與否">
                            結案與否：
                            <span v-if="is_ongoing" class='text-danger'><strong>尚未結案！</strong></span>
                            <span v-else class='text-success'><strong>已結案</strong></span>
                        </b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.代理人統編)">
                    <b-form-row>
                        <b-col>代理人統編：{{bakedData.代理人統編}}</b-col>
                        <b-col>代理人姓名：{{bakedData.代理人姓名}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.權利人統編)">
                    <b-form-row>
                        <b-col>權利人統編：{{bakedData.權利人統編}}</b-col>
                        <b-col>權利人姓名：{{bakedData.權利人姓名}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.義務人統編)">
                    <b-form-row>
                        <b-col>義務人統編：{{bakedData.義務人統編}}</b-col>
                        <b-col>義務人姓名：{{bakedData.義務人姓名}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item>
                    <b-form-row>
                        <b-col>登記原因：{{bakedData.登記原因}}</b-col>
                        <b-col>辦理情形：<span :class="bakedData.紅綠燈背景CSS">{{bakedData.辦理情形}}</span></b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item>
                    <b-form-row>
                        <b-col>收件人員：<span class='user_tag'  :data-id="bakedData.收件人員ID" :data-name="bakedData.收件人員">{{bakedData.收件人員}}</span></b-col>
                        <b-col>收件時間：{{bakedData.收件時間}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.移轉課長)">
                    <b-form-row>
                        <b-col>移轉課長：<span class='user_tag' >{{bakedData.移轉課長}}</span></b-col>
                        <b-col>移轉課長時間：{{bakedData.移轉課長時間}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.移轉秘書)">
                    <b-form-row>
                        <b-col>移轉秘書：<span class='user_tag' >{{bakedData.移轉秘書}}</span></b-col>
                        <b-col>移轉秘書時間：{{bakedData.移轉秘書時間}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.初審人員)">
                    <b-form-row>
                        <b-col>初審人員：<span class='user_tag' >{{bakedData.初審人員}}</span></b-col>
                        <b-col>初審時間：{{bakedData.初審時間}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.複審人員)">
                    <b-form-row>
                        <b-col>複審人員：<span class='user_tag' >{{bakedData.複審人員}}</span></b-col>
                        <b-col>複審時間：{{bakedData.複審時間}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.駁回日期)">
                    <b-form-row>
                        <b-col>駁回日期：{{bakedData.駁回日期}}</b-col>
                        <b-col></b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.公告日期)">
                    <b-form-row>
                        <b-col>公告日期：{{bakedData.公告日期}}</b-col>
                        <b-col>公告到期：{{bakedData.公告期滿日期}} 天數：{{bakedData.公告天數}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.通知補正日期)">
                    <b-form-row>
                        <b-col>通知補正：{{bakedData.通知補正日期}}</b-col>
                        <b-col>補正期滿：{{bakedData.補正期滿日期}} 天數：{{bakedData.補正期限}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.補正日期)">
                    <b-form-row>
                        <b-col>補正日期：{{bakedData.補正日期}}</b-col>
                        <b-col></b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.請示人員)">
                    <b-form-row>
                        <b-col>請示人員：<span class='user_tag' >{{bakedData.請示人員}}</span></b-col>
                        <b-col>請示時間：{{bakedData.請示時間}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.展期人員)">
                    <b-form-row>
                        <b-col>展期人員：<span class='user_tag' >{{bakedData.展期人員}}</span></b-col>
                        <b-col>展期日期：{{bakedData.展期日期}} 天數：{{bakedData.展期天數}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.准登人員)">
                    <b-form-row>
                        <b-col>准登人員：<span class='user_tag' >{{bakedData.准登人員}}</span></b-col>
                        <b-col>准登日期：{{bakedData.准登日期}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.登錄人員)">
                    <b-form-row>
                        <b-col>登錄人員：<span class='user_tag' >{{bakedData.登錄人員}}</span></b-col>
                        <b-col>登錄日期：{{bakedData.登錄日期}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.校對人員)">
                    <b-form-row>
                        <b-col>校對人員：<span class='user_tag' >{{bakedData.校對人員}}</span></b-col>
                        <b-col>校對日期：{{bakedData.校對日期}}</b-col>
                    </b-form-row>
                </b-list-group-item>
                <b-list-group-item v-if="!empty(bakedData.結案人員)">
                    <b-form-row>
                        <b-col>結案人員：<span class='user_tag' >{{bakedData.結案人員}}</span></b-col>
                        <b-col>結案日期：{{bakedData.結案日期}}</b-col>
                    </b-form-row>
                </b-list-group-item>
            </b-list-group>
        </b-card-body>
    </b-tab>
    <b-tab lazy>
        <template v-slot:title>
            <lah-fa-icon icon="chart-line" class="text-success"> <strong>案件時間線</strong></lah-fa-icon>
        </template>
        <lah-reg-case-timeline ref="timeline" :baked-data="bakedData"></lah-reg-case-temp-mgt>
    </b-tab>
    <b-tab v-if="isAdmin" lazy>
        <template v-slot:title>
            <lah-fa-icon icon="database" class="text-secondary"> <strong>狀態管理</strong></lah-fa-icon>
        </template>
        <lah-reg-case-state-mgt :baked-data="bakedData"></lah-reg-case-state-mgt>
    </b-tab>
    <b-tab v-if="isAdmin" lazy>
        <template v-slot:title>
            <lah-fa-icon icon="buffer" prefix="fab" class="text-secondary"> <strong>暫存檔管理</strong></lah-fa-icon>
        </template>
        <lah-reg-case-temp-mgt :baked-data="bakedData"></lah-reg-case-temp-mgt>
    </b-tab>
    </b-tabs>-->
    
    </b-card>
  </div>
</template>

<script>
import regCaseBase from "~/assets/js/reg-case-mixin.js";
export default {
  mixins: [regCaseBase]
};
</script>

<style lang="scss" scoped></style>
