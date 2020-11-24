<template>
<div> test </div>
</template>

<script>
import regCaseBase from "~/assets/js/reg-case-mixin.js";
export default {
  mixins: [regCaseBase],
  mounted () {
      this.$utils.log(this.bakedData)
  }
};
</script>

<style lang="scss" scoped>
</style>
