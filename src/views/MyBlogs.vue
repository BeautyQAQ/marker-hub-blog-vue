<template>
  <BlogHeader />
  <main class="page">
    <div class="management-heading">
      <h1 class="page-title">我的文章</h1>
      <RouterLink to="/blog/add">新建文章</RouterLink>
    </div>
    <section class="surface" v-loading="loading" :aria-busy="loading">
      <label class="status-filter">文章状态
        <select :value="statusFilter" aria-label="文章状态" @change="changeFilter($event.target.value)">
          <option value="">全部状态</option>
          <option value="0">草稿</option>
          <option value="1">已发布</option>
        </select>
      </label>
      <div v-if="error" class="error-panel">
        <el-alert :title="error" type="error" :closable="false" show-icon />
        <el-button @click="loadPage(currentPage)">重新加载</el-button>
      </div>
      <el-empty v-else-if="!loading && !blogs.length" description="暂无符合条件的文章" />
      <div v-else class="managed-articles">
        <article v-for="blog in blogs" :key="blog.id" class="managed-article">
          <div class="article-heading">
            <RouterLink :to="{ name: 'BlogDetail', params: { blogId: blog.id } }"><h2>{{ blog.title }}</h2></RouterLink>
            <span class="status-label" :class="{ draft: Number(blog.status) === 0 }">{{ Number(blog.status) === 1 ? '已发布' : '草稿' }}</span>
          </div>
          <p v-if="blog.description">{{ blog.description }}</p>
          <p class="muted">{{ blog.created }}</p>
          <div class="article-actions">
            <RouterLink :to="{ name: 'BlogEdit', params: { blogId: blog.id } }">编辑</RouterLink>
            <DeleteBlogButton :blog-id="blog.id" :title="blog.title" @deleted="afterDelete" />
          </div>
        </article>
      </div>
      <el-pagination v-if="total" background layout="prev, pager, next" :current-page="currentPage" :page-size="pageSize" :total="total" @current-change="changePage" />
    </section>
  </main>
</template>

<script>
import BlogHeader from '../components/Header.vue'
import DeleteBlogButton from '../components/DeleteBlogButton.vue'

export default {
  name: 'MyBlogsView',
  components: { BlogHeader, DeleteBlogButton },
  data: () => ({ blogs: [], currentPage: 1, pageSize: 5, total: 0, statusFilter: '', loading: false, error: '', requestSequence: 0 }),
  watch: {
    '$route.query': {
      immediate: true,
      handler(query) {
        this.statusFilter = ['0', '1'].includes(query.status) ? query.status : ''
        const page = Number(query.page)
        this.loadPage(Number.isSafeInteger(page) && page > 0 ? page : 1)
      }
    }
  },
  methods: {
    async navigate(page, status = this.statusFilter) {
      const query = { ...(status !== '' ? { status } : {}), ...(page > 1 ? { page: String(page) } : {}) }
      await this.$router.push({ name: 'MyBlogs', query })
    },
    changeFilter(status) { return this.navigate(1, status) },
    changePage(page) { return this.navigate(page) },
    async loadPage(currentPage) {
      const sequence = ++this.requestSequence
      this.currentPage = currentPage
      this.loading = true
      this.error = ''
      try {
        const params = { currentPage, pageSize: this.pageSize, ...(this.statusFilter !== '' ? { status: Number(this.statusFilter) } : {}) }
        const response = await this.$axios.get('/my/blogs', { params })
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
    },
    async afterDelete() {
      if (this.blogs.length === 1 && this.currentPage > 1) await this.navigate(this.currentPage - 1)
      else await this.loadPage(this.currentPage)
    }
  }
}
</script>

<style scoped>
.management-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; }
.status-filter { display: flex; align-items: center; gap: 12px; color: #606266; }
select { padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 5px; color: #303133; background: white; font: inherit; }
.managed-article { padding: 24px 0; border-bottom: 1px solid #ebeef5; overflow-wrap: anywhere; }
.article-heading { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
h2 { margin: 0; font-size: 19px; }
.status-label { padding: 3px 8px; border-radius: 4px; color: #529b2e; background: #f0f9eb; font-size: 13px; flex-shrink: 0; }
.status-label.draft { color: #b88230; background: #fdf6ec; }
.article-actions { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.el-pagination { justify-content: center; margin-top: 24px; }
</style>
