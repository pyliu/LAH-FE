<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header padding-override">
        公告期滿案件
      </h3>
    </lah-transition>
    <lah-transition fade>
      <lah-reg-b-table :baked-data="bakedData"></lah-reg-b-table>
    </lah-transition>
    <lah-transition class="center h3">
      <lah-fa-icon
        v-cloak
        v-if="queryCount === 0 && committed"
        action="bounce"
        icon="yahoo"
        prefix="fab"
      >
        無資料</lah-fa-icon
      >
    </lah-transition>
  </div>
</template>

<script>
export default {
  head: {
    title: "公告期滿案件-桃園市地政局",
  },
  data: () => ({
    bakedData: [],
    committed: false
  }),
  computed: {
    queryCount () { return this.bakedData.length }
  },
  mounted () {
    this.isBusy = true
    this.$axios.post(this.$consts.API.JSON.QUERY, {
      type: 'reg_rm30_H_case'
    }).then((res) => {
      this.bakedData = res.data.baked
      this.notify(res.data.message)
    }).catch(err => {
      this.alert(err.message)
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
    })
  }
};
</script>

<style>
</style>
