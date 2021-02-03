export default function ({
    store,
    redirect
  }) {
    store.commit('lastMessage', '檢查使用者資訊')
    // auth info not ready redirect to /
    if (store.state.svr === null || store.state.svr.user === null) {
      store.commit('lastMessage', `找不到 ${store.state.ip} 對應使用者資訊，請確認您的帳號已經建立。`)
      return redirect('/error')
    }
    store.commit('lastMessage', '檢查使用者權限')
    const authority = store.state.svr.config.authority
    // not chief => redirect to personal page
    if (!authority.isChief && !authority.isAdmin && !authority.isSuper) {
      const myinfo = store.state.svr.user
      return redirect(`/expire/${myinfo.name}%20${myinfo.id}`)
    }
  }
  