<template>
  <div>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">使用者資訊管理</div>
            <lah-button
              icon="question"
              variant="outline-success"
              no-border
              no-icon-gutter
              @click="$bvModal.show('help-modal')"
              title="說明"
            />
            <lah-help-modal :modal-id="'help-modal'" size="lg">
              <ul>
                <li>
                  <div class="d-inline-flex justify-content-around">
                    選取編輯好的XLSX檔案，點擊 <lah-button icon="upload" variant="outline-primary" class="mx-1 mt-n1" no-icon-gutter /> 上傳更新本地資料庫(dimension.db)
                  </div>
                </li>
                <li>
                  <div class="d-inline-flex justify-content-around">
                    亦可利用下方 <lah-button icon="search" variant="outline-primary" class="mx-1 mt-n1" no-icon-gutter /> 方式編輯或新增。
                  </div>
                </li>
              </ul>
            </lah-help-modal>
          </div>
          <div></div>
        </div>
      </lah-transition>
    </lah-header>

    <section>
      <h4 class="font-weight-bold text-right">
        <lah-fa-icon icon="exclamation-circle" variant="warning" action="breath">
          重複資料會被更新，<b-link href="/xlsx/user_import.tpl.xlsx" target="_blank">範例檔點此下載</b-link>
        </lah-fa-icon>
      </h4>
      <div>
        <b-form-group label="匯入使用者檔案" label-for="file-land_data_upload" label-cols-sm="2" label-size="lg" title="*.xlsx">
          <b-input-group id="file-land_data_upload" size="lg">
            <b-form-file ref="file-land_data_upload" v-model="userXlsx" placeholder="請選擇XLSX檔案" drop-placeholder="放開以設定上傳檔案" accept=".xlsx, .XLSX"></b-form-file>
            <template #append>
              <lah-button icon="upload" variant="outline-primary" size="lg" @click="upload"/>
            </template>
          </b-input-group>
        </b-form-group>
      </div>
      <hr class="my-5" />
        <b-form-group label="搜尋" label-for="input-keyword" label-cols-sm="2" label-size="lg">
          <b-input-group id="input-keyword" size="lg">
            <b-form-input
              v-model="keyword"
              type="text"
            />
            <template #append>
              <lah-button icon="search" variant="outline-primary" @click="search"/>
            </template>
          </b-input-group>
        </b-form-group>
      <hr class="my-5" />
    </section>
  </div>
</template>

<script>
export default {
  head: {
    title: "樣板頁面-桃園市地政局",
  },
  fetchOnServer: false,
  data: () => ({
    userXlsx: null,
    keyword: ''
  }),
  methods: {
    upload () {
      
    },
    search () {

    }
  }
}
</script>

<style lang="scss" scoped>
</style>
