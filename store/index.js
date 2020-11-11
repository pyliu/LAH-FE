// import axios from 'axios'
// axios.defaults.transformRequest = [data => {
//   const params = new URLSearchParams()
//   for ([key, value] in Object.entries(data)) {
//     params.append(key, value)
//   }
//   return params.toString()
// }]

const state = () => {
  return {
    ip: undefined,
    // api call common json attrs
    apiJson: undefined
  }
}

const getters = {
  ip: state => state.ip,
  apiMessage: state => state.apiJson.message,
  apiStatus: state => state.apiJson.status,
  apiDataRaw: state => state.apiJson.raw,
  apiDataCount: state => state.apiJson.data_count,
  apiJson: state => state.apiJson
}

// support async operation
const actions = {
  async nuxtServerInit({
    commit,
    dispatch
  }) {
    return await dispatch('ip')
  },
  async ip({
    commit,
    state
  }) {
    try {
    //   const params = new URLSearchParams()
    //   params.append('type', 'ip')
      /**
       * json format is { status, ip, data_count, message }
       */
      //   const json = await axios.post('/api/query_json_api.php', params)
      //   commit('apiResponse', json)
    } catch (e) {
      console.error(e)
    }
  }
}

// only sync operation
const mutations = {
  apiResponse(state, objPayload) {
    state.apiJson = objPayload
  }
}

export default {
  state,
  actions,
  mutations,
  getters,
  namespaced: true
}
