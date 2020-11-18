export default ({ $axios, store }, inject) => {
  const consts = {
    animateAttentionSeekers:  ['bounce', 'flash', 'pulse', 'rubberBand', 'shakeX', 'shakeY', 'headShake', 'swing', 'tada', 'wobble', 'jello', 'heartBeat'],
    loadingAction: [ //(https://loading.io/animation/)
      'ld-heartbeat', 'ld-beat', 'ld-blink', 'ld-bounce', 'ld-bounceAlt', 'ld-breath', 'ld-wrench', 'ld-surprise',
      'ld-clock', 'ld-jump', 'ld-hit', 'ld-fade', 'ld-flip', 'ld-float', 'ld-move-ltr', 'ld-tremble', 'ld-tick',
      'ld-move-rtl', 'ld-move-ttb', 'ld-move-btt', 'ld-move-fade-ltr', 'ld-move-fade-rtl', 'ld-move-fade-ttb',
      'ld-move-fade-btt', 'ld-dim', 'ld-swing', 'ld-wander', 'ld-pulse', 'ld-cycle', 'ld-cycle-alt', 'ld-damage',
      'ld-fade', 'ld-flip', 'ld-flip-h', 'ld-flip-v', 'ld-float', 'ld-jelly', 'ld-jelly-alt', 'ld-jingle',
      'ld-measure', 'ld-metronome', 'ld-orbit', 'ld-rubber-h', 'ld-rubber-v', 'ld-rush-btt', 'ld-rush-ttb',
      'ld-rush-ltr', 'ld-rush-rtl', 'ld-shake-h', 'ld-shake-v', 'ld-shiver', 'ld-skew', 'ld-skew-alt', 'ld-slide-btt',
      'ld-slide-ltr', 'ld-slide-rtl', 'ld-slide-ttb', 'ld-smash', 'ld-spin', 'ld-spin-fast', 'ld-squeeze',
      'ld-swim', 'ld-swing', 'ld-tick-alt', 'ld-vortex', 'ld-vortex-alt', 'ld-wander-h', 'ld-wander-v',
      'ld-shadow', 'ld-shadow-a', 'ld-radio', 'ld-boradcast'
    ],
    loadingShapeSet: [
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
    loadingShapeColor: ['text-primary', 'text-secondary', 'text-danger', 'text-info', 'text-warning', 'text-default', ''],
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
  }
  // all injected var can be used by this.${varname} in Vue and ${varname} in Nuxt, e.g. this.$http (Vue), $http (Nuxt)
  inject('consts', consts)
  inject('http', $axios)
  inject('log', console.log.bind(console))
  inject('error', console.error.bind(console))
  inject('warn', console.warn.bind(console))
  inject('assert', console.assert.bind(console))
  // get ip address and save it to store at FE
  store.dispatch('ip')
}
