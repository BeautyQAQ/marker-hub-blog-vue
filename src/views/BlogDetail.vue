<template>
  <BlogHeader />
  <main class="page">
    <article v-loading="loading" class="surface" :aria-busy="loading">
      <div v-if="error" class="error-panel">
        <el-alert :title="error" type="error" :closable="false" show-icon />
        <el-button @click="loadBlog">重新加载</el-button>
      </div>
      <template v-else-if="blog">
        <h1 class="page-title">{{ blog.title }}</h1>
        <p class="muted">{{ blog.description }}</p>
        <RouterLink v-if="ownBlog" :to="{ name: 'BlogEdit', params: { blogId: blog.id } }">编辑文章</RouterLink>
        <el-divider />
        <MdPreview id="blog-preview" :model-value="blog.content || ''" :sanitize="sanitizeMarkdown" v-bind="previewOptions" />
      </template>
    </article>
  </main>
</template>

<script>
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import BlogHeader from '../components/Header.vue'
import { sanitizeMarkdown } from '../utils/markdown'
import { previewOptions } from '../plugins/markdown'

export default {
  name: 'BlogDetailView',
  components: { BlogHeader, MdPreview },
  data: () => ({ blog: null, loading: false, error: '', requestSequence: 0, previewOptions }),
  computed: {
    ownBlog() {
      const userId = this.$store.getters.getUser.id
      return this.$store.getters.isAuthenticated && userId != null && this.blog?.userId != null && String(userId) === String(this.blog.userId)
    }
  },
  watch: {
    '$route.params.blogId': { immediate: true, handler: 'loadBlog' }
  },
  methods: {
    sanitizeMarkdown,
    async loadBlog() {
      const sequence = ++this.requestSequence
      this.loading = true
      this.error = ''
      this.blog = null
      try {
        const response = await this.$axios.get('/blog/' + encodeURIComponent(this.$route.params.blogId))
        if (sequence !== this.requestSequence) return
        const blog = response.data.data
        if (!blog || blog.id == null) throw new Error('文章不存在')
        this.blog = blog
      } catch (error) {
        if (sequence === this.requestSequence) this.error = error.message || '文章加载失败'
      } finally {
        if (sequence === this.requestSequence) this.loading = false
      }
    }
  }
}
</script>
