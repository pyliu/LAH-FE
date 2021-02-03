export default function ({
    store,
    redirect
  }) {
    if (store.state.svr === null) {
      return redirect('/')
    }
    const authority = store.state.svr.config.authority
    // not admin => redirect to '/login'
    if (!authority.isChief && !authority.isAdmin && !authority.isSuper) {
      const myinfo = store.state.svr.user
      return redirect(`/expire/${myinfo.name}%20${myinfo.id}`)
    }
  }
  