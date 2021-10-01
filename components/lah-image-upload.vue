<template lang="pug">
  div(
    ref="container"
    @dragover="dragover"
    @dragleave="dragleave"
    @drop="drop"
  )
    b-file(
      v-model="uploadFile"
      placeholder="僅支援上傳JPEG圖檔"
      drop-placeholder="放開以設定上傳檔案"
      browse-text="瀏覽"
      accept="image/jpeg"
    ): template(slot="file-name" slot-scope="{ names }"): b-badge(variant="primary") {{ names[0] }}
    hr
    h6.d-flex.align-items-center(ref="selectPreview")
      lah-fa-icon.my-auto(icon="eye" regular)
      span.mr-auto 預覽
      b-button.ml-1(
        @click="publish"
        variant="outline-success"
        title="預覽圖片"
        size="sm"
        v-if="!$utils.empty(encoded)"
      ): b-icon(icon="plus" scale="1.5")
    .d-flex.align-items-end(v-if="!$utils.empty(encoded)" ref="preview")
      b-img(
        :src="encoded"
        thumbnail
        fluid
      )
    hr
    h6
      lah-fa-icon.my-auto(icon="history")
      span 歷史圖片
      b-badge(pill) {{ imageMemento.length }}
    .d-flex.flex-wrap.align-items-center.justify-content-start: .memento-item(
      v-for="(memento, idx) in imageMementoReverse"
      v-if="!$utils.empty(memento)"
      :key="`imgMemento_${idx}`"
    )
      b-img.memento.my-1.mx-1(
        :src="memento"
        thumbnail
        fluid
        title="挑選這張圖片"
        @click="pick(memento)"
      )
      b-icon.removeIcon(
        icon="x-circle"
        title="移除這張照片"
        scale="1.25"
        @click="remove(memento)"
      )
</template>

<script>
export default {
  props: {
    modalId: { type: String, default: undefined }
  },
  data: () => ({
    uploadFile: undefined,
    encoded: ''
  }),
  computed: {
    imageMementoReverse () { return [...this.imageMemento].reverse() }
  },
  watch: {
    uploadFile (file) {
      file && this.upload()
    },
    imageMemento (arr) {
      this.setCache(this.imageMementoCacheKey, arr)
    }
  },
  methods: {
    upload () {
      if (this.uploadFile?.type === 'image/jpeg') {
        this.isBusy = true
        this.encoded = ''
        const filename = this.uploadFile.name
        const formData = new FormData()
        formData.append('file', this.uploadFile)
        formData.append('width', 400)
        formData.append('height', 300)
        formData.append('quality', 75)
        this.$upload.post(this.$consts.API.FILE.BASE64, formData).then(({ data }) => {
          if (!this.$utils.empty(data.encoded) && !this.$utils.empty(data.uri)) {
            this.encoded = `${data.uri}${data.encoded}`
            this.$store.commit('addImageMemento', this.encoded)
            if (this.$utils.statusCheck(data.status)) {
              this.notify(data.message, { title: '上傳圖檔結果', type: 'success' })
            } else {
              this.warning(data.message, { title: '上傳圖檔結果', type: 'warning' })
            }
          } else {
            this.warning('回傳的影像編碼有誤', { title: '上傳圖檔結果' })
          }
        }).catch((err) => {
          this.err(err)
        }).finally(() => {
          this.isBusy = false
        })
      } else {
        this.warning('僅支援JPEG圖檔上傳')
      }
    },
    publish () {
      this.$emit('publish', this.encoded)
      this.encoded = ''
      this.uploadFile = undefined
      this.hideModalById(this.modalId)
    },
    pick (memento) {
      this.encoded = memento
      if (this.skipPreview) {
        this.publish()
      } else {
        this.$nextTick(() => {
          if (this.$refs.selectPreview?.scrollIntoView) {
            this.$refs.selectPreview.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
            setTimeout(this.attention.bind(this, this.$refs.preview, { name: this.effect, speed: 'faster' }), 800)
          } else {
            this.$refs.container.scrollTop = 0
          }
        })
      }
    },
    remove (memento) {
      const removed = this.$utils.remove(this.imageMemento, (imageData) => {
        return this.$utils.equal(imageData, memento)
      })
      this.$store.commit('imageMemento', this.imageMemento)
    },
    dragover (event) {
      event.stopPropagation() // Stops some browsers from redirecting
      event.preventDefault()
      // Add some visual fluff to show the user can drop its files
      if (!event.currentTarget.classList.contains('dropable')) {
        event.currentTarget.classList.add('dropable')
      }
    },
    dragleave (event) { event.currentTarget.classList.remove('dropable') },
    drop (event) {
      event.stopPropagation() // Stops some browsers from redirecting
      event.preventDefault()
      if (event.dataTransfer.files.length > 0) {
        this.uploadFile = event.dataTransfer.files[0]
      } else {
        this.$utils.log('僅支援拖放實體檔案')
      }
      // Clean up
      event.currentTarget.classList.remove('dropable')
    }
  }
}
</script>

<style lang="scss" scoped>
.dropable {
  background-color: rgb(227, 255, 236);
  font-weight: bolder;
  border: 5px dashed gray;
}
.memento-item {
  position: relative;
  max-width: 135px;
  margin: 2px;
  .memento:hover {
    border: 5px dashed gray;
    padding: 2px;
    cursor: pointer;
  }
  .removeIcon {
    transition: all .5s;
    z-index: 1001;
    cursor: pointer;
    font-weight: 500;
    color: red;
    position: absolute;
    top: 0;
    right: 0;
    &:hover {
      font-size: 1.25rem;
      font-weight: 900;
    }
  }
}
</style>
