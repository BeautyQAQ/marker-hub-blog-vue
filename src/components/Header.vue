<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink to="/blogs" class="brand">博客</RouterLink>
      <nav aria-label="主导航">
        <RouterLink to="/blogs">主页</RouterLink>
        <RouterLink v-if="hasLogin" to="/blog/add">发表文章</RouterLink>
        <RouterLink v-if="hasLogin" to="/my/blogs">我的文章</RouterLink>
        <template v-if="hasLogin">
          <span class="user-name">{{ user.username || '已登录' }}</span>
          <el-button text type="danger" :loading="loggingOut" @click="logout">退出</el-button>
        </template>
        <RouterLink v-else to="/login">登录</RouterLink>
      </nav>
    </div>
  </header>
</template>

<script>
export default {
  name: 'BlogHeader',
  data: () => ({ loggingOut: false }),
  computed: {
    user() { return this.$store.getters.getUser },
    hasLogin() { return this.$store.getters.isAuthenticated }
  },
  methods: {
    async logout() {
      if (this.loggingOut) return
      this.loggingOut = true
      const token = this.$store.state.token
      let navigationSucceeded = false
      try {
        // Let the editor's unsaved-changes guard run before ending the session.
        if (this.$route?.name !== 'Login') {
          const navigationFailure = await this.$router.push('/login')
          if (navigationFailure) return
        }
        navigationSucceeded = true
        await this.$axios.post('/logout', null, { headers: { Authorization: token } })
      } catch {
        // Always end the local session, including when the server is unavailable.
      } finally {
        if (navigationSucceeded && this.$store.state.token === token) this.$store.commit('REMOVE_INFO')
        this.loggingOut = false
      }
    }
  }
}
</script>

<style scoped>
.site-header { background: white; border-bottom: 1px solid #e4e7ed; }
.header-inner { max-width: 1000px; margin: 0 auto; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.brand { font-size: 22px; font-weight: 700; color: #303133; }
nav { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }
.user-name { color: #606266; font-size: 14px; }
@media (max-width: 600px) { .header-inner { padding: 16px 12px; } nav { gap: 12px; } }
</style>
