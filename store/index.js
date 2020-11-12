const state = () => ({
  ip: '0.0.0.0',
  // api call common json attrs
  apiJson: { status: 0, message: 'Vuex initialized', raw: [], data_count: 0 },
  toastCounter: 0,
  dayMilliseconds: 24 * 60 * 60 * 1000,
  LOADING_PATTERNS: [
    'ld-heartbeat', 'ld-beat', 'ld-blink', 'ld-bounce', 'ld-bounceAlt', 'ld-breath', 'ld-wrench', 'ld-surprise',
    'ld-clock', 'ld-jump', 'ld-hit', 'ld-fade', 'ld-flip', 'ld-float', 'ld-move-ltr', 'ld-tremble', 'ld-tick',
    'ld-move-rtl', 'ld-move-ttb', 'ld-move-btt', 'ld-move-fade-ltr', 'ld-move-fade-rtl', 'ld-move-fade-ttb',
    'ld-move-fade-btt', 'ld-dim', 'ld-swing', 'ld-wander', 'ld-pulse', 'ld-cycle', 'ld-cycle-alt', 'ld-damage',
    'ld-fade', 'ld-flip', 'ld-flip-h', 'ld-flip-v', 'ld-float', 'ld-jelly', 'ld-jelly-alt', 'ld-jingle',
    'ld-measure', 'ld-metronome', 'ld-orbit', 'ld-rubber-h', 'ld-rubber-v', 'ld-rush-btt', 'ld-rush-ttb',
    'ld-rush-ltr', 'ld-rush-rtl', 'ld-shake-h', 'ld-shake-v', 'ld-shiver', 'ld-skew', 'ld-skew-alt', 'ld-slide-btt',
    'ld-slide-ltr', 'ld-slide-rtl', 'ld-slide-ttb', 'ld-smash', 'ld-spin', 'ld-spin-fast', 'ld-squeeze',
    'ld-swim', 'ld-swing', 'ld-tick-alt', 'ld-vortex', 'ld-vortex-alt', 'ld-wander-h', 'ld-wander-v'
  ],
  LOADING_PREDEFINED: [
    'fa fa-snowflake ld-swim',
    'ld-spinner ld-orbit',
    'ld-pie ld-flip',
    'fas fa-sync ld-spin',
    'fas fa-spinner fa-spin',
    'fas fa-radiation-alt ld-cycle',
    'fas fa-radiation ld-spin-fast',
    'fas fa-asterisk ld-spin',
    'fas fa-bolt ld-bounce',
    'fas fa-biking ld-move-ltr',
    'fas fa-snowboarding ld-rush-ltr',
    'fas fa-yin-yang fa-spin',
    'fas fa-biohazard ld-metronome',
    'fas fa-baseball-ball ld-bounce',
    'fas fa-basketball-ball ld-beat',
    'fas fa-stroopwafel ld-metronome',
    'fas fa-fan ld-spin-fast',
    'fas fa-cog ld-swing',
    'fas fa-compact-disc ld-spin-fast',
    'fas fa-crosshairs ld-swim',
    'far fa-compass ld-tick',
    'fas fa-compass fa-pulse',
    'fas fa-anchor ld-swing',
    'fas fa-fingerprint ld-damage',
    'fab fa-angellist ld-metronome'
  ],
  LOADING_SHAPES_COLOR: ['text-primary', 'text-secondary', 'text-danger', 'text-info', 'text-warning', 'text-default', ''],
  ANIMATED_PATTERNS: ['bounce', 'flash', 'pulse', 'rubberBand', 'shake', 'headShake', 'swing', 'tada', 'wobble', 'jello', 'hinge'],
  ANIMATED_TRANSITIONS: [
    // rotate
    { in: 'animated rotateIn', out: 'animated rotateOut' },
    { in: 'animated rotateInDownLeft', out: 'animated rotateOutDownLeft' },
    { in: 'animated rotateInDownRight', out: 'animated rotateOutDownRight' },
    { in: 'animated rotateInUpLeft', out: 'animated rotateOutUpLeft' },
    { in: 'animated rotateInUpRight', out: 'animated rotateOutUpRight' },
    // bounce
    { in: 'animated bounceIn', out: 'animated bounceOut' },
    { in: 'animated bounceInUp', out: 'animated bounceOutDown' },
    { in: 'animated bounceInDown', out: 'animated bounceOutUp' },
    { in: 'animated bounceInRight', out: 'animated bounceOutLeft' },
    { in: 'animated bounceInLeft', out: 'animated bounceOutRight' },
    // fade
    { in: 'animated fadeIn', out: 'animated fadeOut' },
    { in: 'animated fadeInDown', out: 'animated fadeOutUp' },
    { in: 'animated fadeInDownBig', out: 'animated fadeOutUpBig' },
    { in: 'animated fadeInLeft', out: 'animated fadeOutRight' },
    { in: 'animated fadeInLeftBig', out: 'animated fadeOutRightBig' },
    { in: 'animated fadeInRight', out: 'animated fadeOutLeft' },
    { in: 'animated fadeInRightBig', out: 'animated fadeOutLeftBig' },
    { in: 'animated fadeInUp', out: 'animated fadeOutDown' },
    { in: 'animated fadeInUpBig', out: 'animated fadeOutDownBig' },
    // flip
    { in: 'animated flipInX', out: 'animated flipOutX' },
    { in: 'animated flipInY', out: 'animated flipOutY' },
    // lightspeed
    { in: 'animated lightSpeedIn', out: 'animated lightSpeedOut' },
    // roll
    { in: 'animated rollIn', out: 'animated rollOut' },
    // zoom
    { in: 'animated zoomIn', out: 'animated zoomOut' },
    { in: 'animated zoomInDown', out: 'animated zoomOutUp' },
    { in: 'animated zoomInLeft', out: 'animated zoomOutRight' },
    { in: 'animated zoomInRight', out: 'animated zoomOutLeft' },
    { in: 'animated zoomInUp', out: 'animated zoomOutDown' },
    // slide
    { in: 'animated slideInDown', out: 'animated slideOutUp' },
    { in: 'animated slideInUp', out: 'animated slideOutDown' },
    { in: 'animated slideInLeft', out: 'animated slideOutRight' },
    { in: 'animated slideInRight', out: 'animated slideOutLeft' }
  ],
  XHR_STATUS_CODE: {
    SUCCESS_WITH_NO_RECORD: 3,
    SUCCESS_WITH_MULTIPLE_RECORDS: 2,
    SUCCESS_NORMAL: 1,
    DEFAULT_FAIL: 0,
    UNSUPPORT_FAIL: -1,
    FAIL_WITH_LOCAL_NO_RECORD: -2,
    FAIL_NOT_VALID_SERVER: -3,
    FAIL_WITH_REMOTE_NO_RECORD: -4,
    FAIL_NO_AUTHORITY: -5,
    FAIL_JSON_ENCODE: -6,
    FAIL_NOT_FOUND: -7,
    FAIL_LOAD_ERROR: -8,
    FAIL_TIMEOUT: -9
  },
  API: {
    XLSX: {
      LANDING: '/api/xlsx/landing.php'
    },
    JSON: {
      QUERY: '/api/query_json_api.php',
      STATS: '/api/stats_json_api.php',
      SWITCH: '/api/switch_json_api.php',
      USER: '/api/user_json_api.php',
      MSSQL: '/api/mssql_json_api.php',
      LXHWEB: '/api/lxhweb_json_api.php'
    },
    FILE: {
      LOAD: '/api/load_file_api.php',
      EXPORT: '/api/export_file_api.php',
      XLSX: '/api/export_xlsx_api.php',
      TXT: '/api/export_tmp_txt.php',
      CSV: '/api/export_tmp_csv.php',
      DATA: '/api/export_txt_data.php'
    }
  }
})

const getters = {
  dayMilliseconds: state => state.dayMilliseconds,
  loadingPatterns: state => state.LOADING_PATTERNS,
  loadingPredefined: state => state.LOADING_PREDEFINED,
  loadingShapeColor: state => state.LOADING_SHAPES_COLOR,
  animatedPatterns: state => state.ANIMATED_PATTERNS,
  animatedTransitions: state => state.ANIMATED_TRANSITIONS,
  xhrStatusCode: state => state.XHR_STATUS_CODE,
  apiEp: state => state.API,
  toastCounter: state => state.toastCounter,
  vue: state => this._vm,
  ip: state => state.ip,
  /*
  apiMessage: state => state.apiJson.message,
  apiStatus: state => state.apiJson.status,
  apiDataRaw: state => state.apiJson.raw,
  apiDataCount: state => state.apiJson.data_count,
  apiJson: state => state.apiJson
  */
}

// support async operation
const actions = {
  async nuxtServerInit ({ commit, dispatch }) {
    try {
      dispatch('ip');
    } catch (e) {
      console.error(e)
    }
  },
  async ip ({ commit, getters }) {
    const params = new URLSearchParams()
    params.append('type', 'ip')
    // expected json format is { status, ip, data_count, message }
    this.$axios.$post('/api/query_json_api.php', params).then(res => {
      commit('ip', res.data.ip)
      commit('apiResponse', res.data)
    }).catch((err) => {
      console.error(err)
    }).finally(() => {
      // e.g. 2020-11-11 16:25:23
      let now = new Date();
      console.log(
        now.getFullYear() + "-" +
        ("0" + (now.getMonth() + 1)).slice(-2) + "-" +
        ("0" + now.getDate()).slice(-2) + " " +
        ("0" + now.getHours()).slice(-2) + ":" +
        ("0" + now.getMinutes()).slice(-2) + ":" +
        ("0" + now.getSeconds()).slice(-2)
      )
    })
  }
}

// only sync operation
const mutations = {
  ip (state, ip) { state.ip = ip },
  apiResponse (state, json) { state.apiJson = json },
  addToastCounter (state, dontcare) { state.toastCounter++ }
}

export default {
  state,
  actions,
  mutations,
  getters,
  namespaced: true
}
