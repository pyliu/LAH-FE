export default {
  state: () => ({
    list: [], // [{...}, {...}, ...]
    list_by_id: {}, // { HB1234: [{}...], HB2134: [{}...], ... } 
    is_overdue_mode: true
  }),
  getters: {
    list: state => state.list,
    list_count: state => state.list.length,
    list_by_id: state => state.list_by_id,
    list_by_id_count: state => Object.keys(state.list_by_id).length,
    is_overdue_mode: state => state.is_overdue_mode
  },
  mutations: {
    list(state, jsonPayload) {
      state.list = jsonPayload || []
    },
    list_by_id(state, jsonPayload) {
      state.list_by_id = jsonPayload || {}
    },
    is_overdue_mode(state, flagPayload) {
      state.is_overdue_mode = flagPayload
    }
  },
  namespaced: true,
  strict: false
}
