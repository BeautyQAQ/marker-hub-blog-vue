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
        <p v-if="Number(blog.status) === 0" class="draft-note">草稿 · 仅自己可见</p>
        <div v-if="ownBlog" class="article-actions">
          <RouterLink :to="{ name: 'BlogEdit', params: { blogId: blog.id } }">编辑文章</RouterLink>
          <DeleteBlogButton :blog-id="blog.id" :title="blog.title" @deleted="$router.push('/my/blogs')" />
        </div>
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
import DeleteBlogButton from '../components/DeleteBlogButton.vue'

export default {
  name: 'BlogDetailView',
  components: { BlogHeader, MdPreview, DeleteBlogButton },
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

<style scoped>
.article-actions { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.draft-note { color: #b88230; }
</style>
