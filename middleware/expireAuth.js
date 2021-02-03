export default function ({
    store,
    redirect
  }) {
    // auth info not ready redirect to /
    if (store.state.svr === null) {
      return redirect('/')
    }
    const authority = store.state.svr.config.authority
    // not chief => redirect to personal page
    if (!authority.isChief && !authority.isAdmin && !authority.isSuper) {
      const myinfo = store.state.svr.user
      return redirect(`/expire/${myinfo.name}%20${myinfo.id}`)
    }
  }
  