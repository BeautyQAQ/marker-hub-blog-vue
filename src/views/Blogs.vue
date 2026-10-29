<template>
  <BlogHeader />
  <main class="page">
    <h1 class="page-title">文章列表</h1>
    <section v-loading="loading" class="surface" aria-label="文章列表" :aria-busy="loading">
      <div v-if="error" class="error-panel">
        <el-alert :title="error" type="error" :closable="false" show-icon />
        <el-button @click="page(currentPage)">重新加载</el-button>
      </div>
      <el-empty v-else-if="!loading && !blogs.length" description="暂无文章" />
      <el-timeline v-else>
        <el-timeline-item v-for="blog in blogs" :key="blog.id" :timestamp="blog.created" placement="top">
          <el-card shadow="hover">
            <RouterLink :to="{ name: 'BlogDetail', params: { blogId: blog.id } }"><h2 class="blog-title">{{ blog.title }}</h2></RouterLink>
            <p>{{ blog.description }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-pagination v-if="total" background layout="prev, pager, next" :current-page="currentPage" :page-size="pageSize" :total="total" @current-change="page" />
    </section>
  </main>
</template>

<script>
import BlogHeader from '../components/Header.vue'

export default {
  name: 'BlogsView',
  components: { BlogHeader },
  data: () => ({ blogs: [], currentPage: 1, total: 0, pageSize: 5, loading: false, error: '', requestSequence: 0 }),
  mounted() { this.page(1) },
  methods: {
    async page(currentPage) {
      const sequence = ++this.requestSequence
      this.loading = true
      this.error = ''
      try {
        const response = await this.$axios.get('/blogs', { params: { currentPage } })
        if (sequence !== this.requestSequence) return
        const data = response.data.data
        if (!data || !Array.isArray(data.records)) throw new Error('文章列表响应格式不正确')
        this.blogs = data.records
        this.currentPage = Number(data.current) || currentPage
        this.total = Number(data.total) || 0
        this.pageSize = Number(data.size) || 5
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
.blog-title { font-size: 19px; margin: 0 0 12px; }
.el-pagination { justify-content: center; margin-top: 24px; }
</style>
