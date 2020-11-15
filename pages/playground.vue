<template>
  <div class="container">
    <div>
      <font-awesome-layers class="fa-10x anim-appear-1s">
        <font-awesome-icon icon="circle" />
        <font-awesome-icon
          icon="charging-station"
          transform="shrink-6"
          :style="{ color: 'white' }"
        />
      </font-awesome-layers>
      <h3 class="title">測試</h3>
      <div>
        <lah-countdown-button :auto-start="true" variant="outline-secondary" badge-variant="danger" :click="clickCountdownButton">
          <font-awesome-layers class="fa-2x">
            <font-awesome-icon :icon="['far', 'circle']" />
            <font-awesome-icon
              icon="times"
              transform="shrink-6"
              :style="{ color: 'red' }"
            />
          </font-awesome-layers>
        </lah-countdown-button>
        <font-awesome-layers class="fa-5x">
          <font-awesome-icon icon="circle" />
          <font-awesome-icon
            icon="check"
            transform="shrink-6"
            :style="{ color: 'white' }"
          />
        </font-awesome-layers>

        Power Transforms:
        <font-awesome-icon icon="spinner" transform="shrink-6 left-4" />
        <font-awesome-icon icon="spinner" :transform="{ rotate: 42 }" />

        Masking:
        <font-awesome-icon icon="coffee" :mask="['far', 'circle']" />

        Symbols:
        <font-awesome-icon icon="edit" symbol />
        <font-awesome-icon icon="edit" symbol="edit-icon" />

        Layers:
        <font-awesome-layers class="fa-lg text-success">
          <font-awesome-icon icon="circle" />
          <font-awesome-icon
            icon="check"
            transform="shrink-6"
            :style="{ color: 'white' }"
          />
        </font-awesome-layers>

        Layers text:
        <font-awesome-layers full-width class="fa-4x">
          <font-awesome-icon icon="question" />
          <font-awesome-layers-text
            class="text-danger"
            transform="down-2 shrink-8"
            value="pyliu"
          />
        </font-awesome-layers>

        Counters:
        <font-awesome-layers full-width class="fa-4x">
          <font-awesome-icon icon="envelope" />
          <font-awesome-layers-text counter value="1" position="top-right" />
        </font-awesome-layers>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  head: {
    title: "測試-桃園市地政局",
  },
  methods: {
    clickCountdownButton () {
      this.$log(this.$el)
      this.notify('click countdown button!')
    }
  }
};
</script>

<style>
</style>
