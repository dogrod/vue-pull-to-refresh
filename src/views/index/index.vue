<template lang="pug">
  .index
    pull-to-load(
      ref="ptl"
      :topFunction="topFunction"
      :bottomFunction="bottomFunction"
    )
      .index__content
        .index__top
          | I'm top
        .index__bottom
          | I'm bottom
</template>


<script>
import pullToLoad from '@/components/pull-to-load/pull-to-load.vue'

export default {
  components: {
    pullToLoad,
  },
  data() {
    return {
      topFunction() {
        alert('top')
        setTimeout(
          () => {
            this.$refs.ptl.handleTopLoaded()
          }, 500
        )
      },
      bottomFunction() {
        alert('bottom')
        setTimeout(
          () => {
            this.$refs.ptl.handleBottomLoaded()
          }, 500
        )
      },
    }
  },
}
</script>

<style lang="stylus">

.index
  position absolute
  top 50px
  left 0
  bottom 50px
  right 0
  overflow auto

  &__content
    display flex
    flex-direction column
    justify-content space-between

    height 800px
    background #ddd

</style>