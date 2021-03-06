export default {
  name: 'PullToLoad',
  props: {
    maxDistance: {
      type: Number,
      default: 50,
    },
    activeRange: {
      type: Number,
      default: 10,
    },
    pullSpeedRange: {
      type: Number,
      default: 2,
    },
    topFunction: {
      type: Function,
    },
    bottomFunction: {
      type: Function,
    },
    topLoadable: {
      type: Boolean,
      default: true,
    },
    bottomLoadable: {
      type: Boolean,
      default: true,
    },
    topPullHint: {
      type: String,
      default: 'pull down to load',
    },
    bottomPullHint: {
      type: String,
      default: 'pull up to load',
    },
    topReachHint: {
      type: String,
      default: 'release to load',
    },
    bottomReachHint: {
      type: String,
      default: 'release to load',
    },
    topActiveHint: {
      type: String,
      default: 'loading...',
    },
    bottomActiveHint: {
      type: String,
      default: 'loading...',
    },
  },
  data() {
    return {
      startY: 0,
      startScrollTop: 0,
      currentY: 0,
      topState: '',
      bottomState: '',
      direction: '',
      translate: 0,
      bottomReached: false,
      scrollContainer: null,
      topHint: this.topPullHint,
      bottomHint: this.bottomPullHint,
    }
  },
  watch: {
    /**
     * top area state description
     * @param {String} value - state
     */
    topState(value) {
      switch (value) {
        case 'pull': {
          this.topHint = this.topPullHint
          break
        }
        case 'reach': {
          this.topHint = this.topReachHint
          break
        }
        case 'active': {
          this.topHint = this.topActiveHint
          break
        }
        default: {
          return
        }
      }
    },
    /**
     * bottom area state description
     * @param {String} value - state
     */
    bottomState(value) {
      switch (value) {
        case 'pull': {
          this.bottomHint = this.bottomPullHint
          break
        }
        case 'reach': {
          this.bottomHint = this.bottomReachHint
          break
        }
        case 'active': {
          this.bottomHint = this.bottomActiveHint
          break
        }
        default: {
          return
        }
      }
    },
  },
  computed: {
    /**
     * computed container style object
     * @return {Object} container stylesheet
     */
    containerStyle() {
      return {
        transform: `translate3d(0, ${this.translate}px, 0)`,
      }
    },
  },
  methods: {
    /**
     * touch start event handler
     * @param {Object} e - event object
     */
    handleTouchStart(e) {
      this.startY = e.touches[0].clientY
      this.startScrollTop = this.getScrollTop(this.scrollContainer)
    },
    /**
     * touch move event handler
     * @param {Object} e - event object
     */
    handleTouchMove(e) {
      this.currentY = e.touches[0].clientY

      const maxDistance = this.maxDistance
      const distance = (this.currentY - this.startY) / this.pullSpeedRange

      this.direction = distance > 0 ? 'down' : 'up'
      if (
        typeof this.topFunction === 'function'
        && this.direction === 'down'
        && this.getScrollTop(this.scrollContainer) === 0
        && this.topLoadable
      ) {
        e.preventDefault()
        e.stopPropagation()

        this.translate =
          Math.abs(distance) <= maxDistance
            ? this.translate = distance
              : this.translate = (distance > 0)
                ? maxDistance
                  : -maxDistance

        if (this.translate < 0) {
          this.translate = 0
        }

        this.topState = this.translate >= (this.maxDistance - this.activeRange) ? 'reach' : 'pull'
      }

      if (this.direction === 'up') {
        this.bottomReached = this.bottomReached || this.isScrollToBootom()
      }

      if (
        typeof this.bottomFunction === 'function'
        && this.direction === 'up'
        && this.bottomReached
        && this.bottomLoadable
      ) {
        e.preventDefault()
        e.stopPropagation()

        this.translate =
          Math.abs(distance) <= maxDistance
            ? this.translate = distance
              : this.translate = (distance > 0)
                ? maxDistance
                  : -maxDistance

        if (this.translate > 0) {
          this.translate = 0
        }

        this.bottomState = this.translate <= -(this.maxDistance - this.activeRange) ? 'reach' : 'pull'
      }
    },
    /**
     * touch end event handler
     */
    handleTouchEnd() {
      if (
        this.direction === 'down'
        && this.getScrollTop(this.scrollContainer) === 0
        && this.translate > 0
      ) {
        if (
          this.translate >= this.maxDistance - this.activeRange
          && this.topState === 'reach'
        ) {
          this.topFunction.call(this.$parent)
          this.topState = 'active'

          this.translate = 50
        } else {
          this.topState = 'pull'
          this.translate = 0
        }
      }

      if (
        this.direction === 'up'
        && this.bottomReached
        && this.translate < 0
      ) {
        this.bottomReached = false

        if (
          this.translate <= -(this.maxDistance - this.activeRange)
          && this.bottomState === 'reach'
        ) {
          this.bottomFunction.call(this.$parent)
          this.bottomState = 'active'

          this.translate = -50
        } else {
          this.bottomState = 'pull'
          this.translate = 0
        }
      }
    },
    /**
     * check if scroll to bottom
     * @return {boolean} return scroll to bottom state
     */
    isScrollToBootom() {
      if (this.scrollContainer === window) {
        return document.body.scrollTop + document.documentElement.clientHeight
          === document.body.scrollHeight
      }

      return this.$el.getBoundingClientRect().bottom
        <= this.scrollContainer.getBoundingClientRect().bottom + 2 // add 2 pixel for optimize UE
    },
    /**
     * locate this element's scroll container
     * @param {Object} element - dom element
     * @return {Object} return scroll container
     */
    getScrollContainer(element) {
      let currentNode = element
      while (
        currentNode
        && currentNode.tagName !== 'html'
        && currentNode.tagName !== 'body'
        && currentNode.nodeType === 1
      ) {
        /**
         * Use document.defaultView.getComputedStyle instead of window.getComputedStyle
         * Because of cross-browser and cross-contexts support
         * e.g. window.getComputedStyle would fail for iframes in FireFox 3.6
         * In most of web browsers, document.defaultView === window returns true
         * Inspired by jQuery source code
         * Note by Rodrick Zhu
         */
        const overflowY = document.defaultView.getComputedStyle(currentNode).overflowY
        if (overflowY === 'scroll' || overflowY === 'auto') {
          return currentNode
        }
        currentNode = currentNode.parentNode
      }
      return window
    },
    /**
     * input a element and get this element's scroll top
     * @param {Object} element - dom element
     * @return {number} return scroll top
     */
    getScrollTop(element) {
      if (element === window) {
        return Math.max(window.pageYOffset || 0, document.documentElement.scrollTop)
      }
      return element.scrollTop
    },
    /**
     * clear loading state of top area
     */
    handleTopLoaded() {
      this.topState = 'pull'
      this.translate = 0
    },
    /**
     * clear loading state of top area
     */
    handleBottomLoaded() {
      this.bottomState = 'pull'
      this.translate = 0
    },
  },
  mounted() {
    this.scrollContainer = this.getScrollContainer(this.$el)
  },
}
