<template>
  <BlogHeader />
  <main class="page">
    <section class="surface login-panel">
      <h1 class="page-title">登录</h1>
      <el-form ref="loginForm" :model="form" :rules="rules" label-position="top" @submit.prevent="submitForm">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" autocomplete="username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password autocomplete="current-password" placeholder="请输入密码" />
        </el-form-item>
        <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="login-error" />
        <el-button type="primary" native-type="submit" :loading="submitting">登录</el-button>
        <el-button :disabled="submitting" @click="resetForm">重置</el-button>
      </el-form>
    </section>
  </main>
</template>

<script>
import BlogHeader from '../components/Header.vue'

export default {
  name: 'LoginView',
  components: { BlogHeader },
  data() {
    return {
      form: { username: '', password: '' },
      submitting: false,
      error: '',
      rules: {
        username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      }
    }
  },
  methods: {
    async submitForm() {
      if (this.submitting) return
      const valid = await this.$refs.loginForm.validate().catch(() => false)
      if (!valid || this.submitting) return
      this.submitting = true
      this.error = ''
      try {
        const response = await this.$axios.post('/login', this.form, { skipAuthRedirect: true, headers: { Authorization: null } })
        const token = response.headers.authorization
        const user = response.data.data
        if (!token || !user || typeof user !== 'object' || Array.isArray(user)) {
          throw new Error('登录响应缺少用户信息或令牌')
        }
        this.$store.commit('SET_TOKEN', token)
        this.$store.commit('SET_USERINFO', user)
        const redirect = this.$route.query.redirect
        const target = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/blogs'
        await this.$router.push(target)
      } catch (error) {
        this.error = error.message || '登录失败，请重试'
      } finally {
        this.submitting = false
      }
    },
    resetForm() {
      this.$refs.loginForm.resetFields()
      this.error = ''
    }
  }
}
</script>

<style scoped>
.login-panel { max-width: 440px; margin: 24px auto; }
.login-error { margin-bottom: 20px; }
</style>
