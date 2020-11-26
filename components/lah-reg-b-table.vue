<template>
  <b-table
    ref="bTable"
    :responsive="'lg'"
    :striped="true"
    :hover="true"
    :bordered="true"
    :borderless="false"
    :outlined="false"
    :small="true"
    :dark="false"
    :fixed="false"
    :foot-clone="false"
    :no-border-collapse="true"
    :head-variant="'dark'"
    :table-variant="tableVariant"
    :sticky-header="sticky"
    :caption="caption"
    :items="bakedData"
    :fields="tblFields"
    :style="style"
    :busy="busy"
    :tbody-tr-class="trClass"
    :tbody-transition-props="transProps"
    primary-key="收件字號"
    class="text-center"
    caption-top
  >
    <template v-slot:table-busy>
      <b-spinner
        class="align-middle"
        variant="danger"
        type="grow"
        small
        label="讀取中..."
      ></b-spinner>
    </template>

    <template v-slot:cell(RM01)="row">
      <div class="text-left" v-b-popover.hover.focus.d400="{ content: row.item['結案狀態'], variant: row.item['燈號'] }">
        <font-awesome-icon
          v-if="showIcon"
          :icon="['fas', icon]"
          :variant="iconVariant"
          class="mx-auto my-auto"
        />
        <span v-if="mute">{{ bakedContent(row) }}</span>
        <a v-else href="javascript:void(0)" @click="fetch(row.item)">{{ bakedContent(row) }}</a>
      </div>
    </template>

    <template v-slot:cell(收件字號)="row">
      <div class="text-left" v-b-popover.hover.focus.d400="{ content: row.item['結案狀態'], variant: row.item['燈號'] }">
        <font-awesome-icon
          v-if="showIcon"
          :icon="['fas', icon]"
          :variant="iconVariant"
          class="mx-auto my-auto"
        />
        <span v-if="mute">{{ bakedContent(row) }}</span>
        <a v-else href="javascript:void(0)" @click="fetch(row.item)">{{ row.item["收件字號"] }}</a>
      </div>
    </template>

    <template v-slot:cell(序號)="row">
      {{ row.index + 1 }}
    </template>

    <template v-slot:cell(燈號)="row">
      <font-awesome-icon
        :icon="['fas', 'circle']"
        :variant="row.item['燈號']"
        class="mx-auto my-auto"
      />
    </template>

    <template v-slot:cell(限辦時間)="row">
      <font-awesome-icon
        :icon="['fas', 'circle']"
        :variant="row.item['燈號']"
        class="mx-auto my-auto text-nowrap"
        v-b-popover.hover.focus.d400="{ content: row.item['預定結案日期'], variant: row.item['燈號'] }"
      />
      {{ row.value }}
    </template>

    <template v-slot:cell(RM07_1)="row">
      <span v-b-popover.hover.focus.d400="row.item['收件時間']">{{ row.item["RM07_1"] }}</span>
    </template>

    <template v-slot:cell(登記原因)="row">
      {{ reason(row) }}
    </template>
    <template v-slot:cell(RM09)="row">
      {{ reason(row) }}
    </template>

    <template v-slot:cell(初審人員)="{ item }">
      <a
        href="javascript:void(0)"
        @click="userinfo(item['初審人員'], item['RM45'])"
        v-b-popover.top.hover.focus.html="(item, item.ELAPSED_TIME['初審'])"
      >{{ item["初審人員"] }}</a>
    </template>
    <template v-slot:cell(複審人員)="{ item }">
      <a
        href="javascript:void(0)"
        @click="userinfo(item['複審人員'], item['RM47'])"
        v-b-popover.top.hover.focus.html="passedTime(item, item.ELAPSED_TIME['複審'])"
      >{{ item["複審人員"] }}</a>
    </template>
    <template v-slot:cell(收件人員)="{ item }">
      <a
        href="javascript:void(0)"
        @click="userinfo(item['收件人員'], item['RM96'])"
      >{{ item["收件人員"] }}</a>
    </template>
    <template v-slot:cell(作業人員)="{ item }">
      <a
        href="javascript:void(0)"
        @click="userinfo(item['作業人員'], item['RM30_1'])"
      >{{ item["作業人員"] }}</a>
    </template>
    <template v-slot:cell(准登人員)="{ item }">
      <a
        href="javascript:void(0)"
        @click="userinfo(item['准登人員'], item['RM63'])"
        v-b-popover.top.hover.focus.html="(item, item.ELAPSED_TIME['准登'])"
      >{{ item["准登人員"] }}</a>
    </template>
    <template v-slot:cell(登錄人員)="{ item }">
      <a
        href="javascript:void(0)"
        @click="userinfo(item['登錄人員'], item['RM55'])"
        v-b-popover.top.hover.focus.html="passedTime(item, item.ELAPSED_TIME['登簿'])"
      >{{ item["登錄人員"] }}</a>
    </template>
    <template v-slot:cell(校對人員)="{ item }">
      <a
        href="javascript:void(0)"
        @click="userinfo(item['校對人員'], item['RM57'])"
        v-b-popover.top.hover.focus.html="passedTime(item, item.ELAPSED_TIME['校對'])"
      >{{ item["校對人員"] }}</a>
    </template>
    <template v-slot:cell(結案人員)="{ item }">
      <a
        href="javascript:void(0)"
        @click="userinfo(item['結案人員'], item['RM59'])"
        v-b-popover.top.hover.focus.html="passedTime(item, item.ELAPSED_TIME['結案'])"
      >{{ item["結案人員"] }}</a>
    </template>
  </b-table>
</template>

<script>
export default {
  props: {
    bakedData: { type: Array, default: [] },
    maxHeight: { type: Number, default: undefined },
    type: { type: String, default: '' },
    fields:  { type: Array, default: undefined },
    mute: { type: Boolean, default: false },
    noCaption: { type: Boolean, default: false },
    color: { type: Boolean, default: false },
    icon: { type: String, default: '' },
    iconVariant: { type: String, default: '' },
    busy: { type: Boolean, default: false },
    tableVariant: { type: String, default: '' }
  },
  data: () => ({
    transProps: {
      name: "rollIn",
    },
  }),
  computed: {
    tblFields: function () {
      if (!this.$utils.empty(this.fields)) return this.fields
      switch (this.type) {
        case "md":
          return [
            {
              key: "收件字號",
              sortable: this.sort
            },
            {
              key: "登記原因",
              sortable: this.sort
            },
            {
              key: "辦理情形",
              sortable: this.sort
            },
            {
              key: "初審人員",
              sortable: this.sort
            },
            {
              key: "作業人員",
              sortable: this.sort
            },
            {
              key: "收件時間",
              sortable: this.sort
            },
            {
              key: "限辦時間",
              sortable: this.sort
            },
            //{key: "預定結案日期", label:"限辦期限", sortable: this.sort}
          ]
        case "lg":
          return [
            {
              key: "收件字號",
              sortable: this.sort
            },
            {
              key: "收件日期",
              sortable: this.sort
            },
            {
              key: "登記原因",
              sortable: this.sort
            },
            {
              key: "辦理情形",
              sortable: this.sort
            },
            {
              key: "收件人員",
              label: "收件",
              sortable: this.sort
            },
            {
              key: "作業人員",
              label: "作業",
              sortable: this.sort
            },
            {
              key: "初審人員",
              label: "初審",
              sortable: this.sort
            },
            {
              key: "複審人員",
              label: "複審",
              sortable: this.sort
            },
            {
              key: "准登人員",
              label: "准登",
              sortable: this.sort
            },
            {
              key: "登錄人員",
              label: "登簿",
              sortable: this.sort
            },
            {
              key: "校對人員",
              label: "校對",
              sortable: this.sort
            },
            {
              key: "結案人員",
              label: "結案",
              sortable: this.sort
            },
          ]
        case "xl":
          return [
            //{key: "燈號", sortable: this.sort},
            {
              key: "序號",
              sortable: !this.sort
            },
            {
              key: "收件字號",
              sortable: this.sort
            },
            {
              key: "收件時間",
              sortable: this.sort
            },
            {
              key: "限辦時間",
              label: "限辦",
              sortable: this.sort
            },
            {
              key: "登記原因",
              sortable: this.sort
            },
            {
              key: "辦理情形",
              sortable: this.sort
            },
            {
              key: "收件人員",
              label: "收件",
              sortable: this.sort
            },
            {
              key: "作業人員",
              label: "作業",
              sortable: this.sort
            },
            {
              key: "初審人員",
              label: "初審",
              sortable: this.sort
            },
            {
              key: "複審人員",
              label: "複審",
              sortable: this.sort
            },
            {
              key: "准登人員",
              label: "准登",
              sortable: this.sort
            },
            {
              key: "登錄人員",
              label: "登簿",
              sortable: this.sort
            },
            {
              key: "校對人員",
              label: "校對",
              sortable: this.sort
            },
            {
              key: "結案人員",
              label: "結案",
              sortable: this.sort
            },
            //{key: "結案狀態", label: "狀態", sortable: this.sort}
          ]
        case "flow":
          return [
            {
              key: "辦理情形",
              sortable: this.sort
            },
            {
              key: "收件人員",
              label: "收件",
              sortable: this.sort
            },
            {
              key: "作業人員",
              label: "作業",
              sortable: this.sort
            },
            {
              key: "初審人員",
              label: "初審",
              sortable: this.sort
            },
            {
              key: "複審人員",
              label: "複審",
              sortable: this.sort
            },
            {
              key: "准登人員",
              label: "准登",
              sortable: this.sort
            },
            {
              key: "登錄人員",
              label: "登簿",
              sortable: this.sort
            },
            {
              key: "校對人員",
              label: "校對",
              sortable: this.sort
            },
            {
              key: "結案人員",
              label: "結案",
              sortable: this.sort
            },
          ]
        default:
          return [
            {
              key: "RM01",
              label: "收件字號",
              sortable: this.sort
            },
            {
              key: "RM07_1",
              label: "收件日期",
              sortable: this.sort
            },
            {
              key: "RM09",
              label: "登記原因",
              sortable: this.sort
            },
            {
              key: "辦理情形",
              sortable: this.sort
            },
          ]
      }
    },
    count () {
      return this.bakedData ? this.bakedData.length : 0
    },
    caption () {
      if (this.mute || this.noCaption) return ''
      return this.busy ? "讀取中" : "登記案件找到 " + this.count + "件"
    },
    sticky () {
      return this.maxHeight ? (this.count > 0 ? true : false) : false
    },
    style () {
      const parsed = parseInt(this.maxHeight)
      return isNaN(parsed) ? "" : `max-height: ${parsed}px`
    },
    showIcon () { return !this.$utils.empty(this.icon) },
    sort () {
      return this.$utils.empty(this.mute)
    },
  },
  methods: {
    fetch (data) {
      let id = `${data["RM01"]}${data["RM02"]}${data["RM03"]}`
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: "reg_case",
        id: id,
      }).then((res) => {
        if (!this.$utils.statusCheck(res.data.status)) {
          this.alert({
            title: "顯示登記案件詳情",
            message: res.data.message,
            type: "warning",
          })
        } else {
          const vnode = this.$createElement("lah-reg-case-detail", {
            props: {
              readyData: res.data.baked,
            }
          })
          this.modal(vnode, {
            title: `登記案件詳情 ${data["RM01"]}-${data["RM02"]}-${data["RM03"]}`,
            size: "xl",
          })
        }
      })
      .catch((err) => {
        this.$utils.error(err)
      })
    },
    userinfo (name, id = "") {
      name !== "XXXXXXXX" && this.modal({
        title: `${name} 使用者資訊${this.$utils.empty(id) ? "" : ` (${id})`}`,
        message: this.$createElement("lah-user-card", {
          props: {
            id: id,
            name: name,
          },
        }),
      })
    },
    bakedContent (row) {
      return row.item[row.field.label]
    },
    reason (row) {
      return (
        row.item["RM09"] +
        " : " +
        (this.$utils.empty(row.item["登記原因"])
          ? row.item["RM09_CHT"]
          : row.item["登記原因"])
      )
    },
    trClass (item, type) {
      if (item && type == "row")
        return this.color ? item["紅綠燈背景CSS"] : `filter-${item["燈號"]}`
    },
    passedTime (item, time_duration_secs) {
      if (isNaN(time_duration_secs) || this.$utils.empty(time_duration_secs))
        return false
      if (time_duration_secs == "0" && this.$utils.empty(item["結案代碼"])) {
        return '<i class="fa fa-tools ld ld-clock"></i> 作業中'
      }
      if (time_duration_secs < 60) return "耗時 " + time_duration_secs + " 秒"
      if (time_duration_secs < 3600)
        return (
          "耗時 " +
          Number.parseFloat(time_duration_secs / 60).toFixed(2) +
          " 分鐘"
        )
      return (
        "耗時 " +
        Number.parseFloat(time_duration_secs / 60 / 60).toFixed(2) +
        " 小時"
      )
    },
  }
}
</script>

<style lang="scss"></style>
