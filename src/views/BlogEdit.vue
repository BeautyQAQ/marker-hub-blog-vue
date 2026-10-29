<template>
  <BlogHeader />
  <main class="page editor-page">
    <h1 class="page-title">{{ isEdit ? '编辑文章' : '发表文章' }}</h1>
    <section v-loading="loading" class="surface" :aria-busy="loading">
      <div v-if="loadError" class="error-panel">
        <el-alert :title="loadError" type="error" :closable="false" show-icon />
        <el-button @click="loadBlog">重新加载</el-button>
      </div>
      <el-form v-else ref="editForm" :model="editForm" :rules="rules" label-position="top" @submit.prevent="submitForm">
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="摘要" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <MdEditor v-model="editForm.content" :toolbars="toolbars" :sanitize="sanitizeMarkdown" v-bind="editorOptions" :read-only="submitting" @on-save="submitForm" />
        </el-form-item>
        <el-alert v-if="saveError" :title="saveError" type="error" :closable="false" show-icon class="save-error" />
        <el-button type="primary" native-type="submit" :disabled="loading" :loading="submitting">{{ isEdit ? '保存修改' : '立即创建' }}</el-button>
        <el-button :disabled="submitting || loading" @click="resetForm">重置</el-button>
      </el-form>
    </section>
  </main>
</template>

<script>
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import BlogHeader from '../components/Header.vue'
import { sanitizeMarkdown } from '../utils/markdown'
import { editorOptions } from '../plugins/markdown'

const emptyForm = () => ({ id: '', title: '', description: '', content: '' })

export default {
  name: 'BlogEditView',
  components: { BlogHeader, MdEditor },
  data() {
    return {
      editForm: emptyForm(),
      initialForm: emptyForm(),
      loading: false,
      submitting: false,
      loadError: '',
      saveError: '',
      requestSequence: 0,
      editorOptions,
      toolbars: ['bold', 'italic', 'strikeThrough', '-', 'title', 'quote', 'unorderedList', 'orderedList', 'task', '-', 'codeRow', 'code', 'link', 'table', '-', 'revoke', 'next', 'save', '=', 'preview', 'fullscreen'],
      rules: {
        title: [{ required: true, whitespace: true, message: '请输入标题', trigger: 'blur' }, { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }],
        description: [{ required: true, whitespace: true, message: '请输入摘要', trigger: 'blur' }],
        content: [{ required: true, whitespace: true, message: '请输入文章内容', trigger: 'change' }]
      }
    }
  },
  computed: {
    isEdit() { return Boolean(this.$route.params.blogId) },
    hasChanges() { return JSON.stringify(this.editForm) !== JSON.stringify(this.initialForm) }
  },
  watch: { '$route.params.blogId': { immediate: true, handler: 'loadBlog' } },
  mounted() { window.addEventListener('beforeunload', this.warnBeforeUnload) },
  beforeUnmount() { window.removeEventListener('beforeunload', this.warnBeforeUnload) },
  async beforeRouteLeave() {
    if (!this.hasChanges || !this.$store.getters.isAuthenticated) return true
    try {
      await this.$confirm('文章尚未保存，确定离开吗？', '未保存的修改', { type: 'warning', confirmButtonText: '离开', cancelButtonText: '继续编辑' })
      return true
    } catch {
      return false
    }
  },
  methods: {
    sanitizeMarkdown,
    warnBeforeUnload(event) {
      if (!this.hasChanges) return
      event.preventDefault()
      event.returnValue = ''
    },
    async loadBlog() {
      const sequence = ++this.requestSequence
      this.loadError = ''
      this.saveError = ''
      this.editForm = emptyForm()
      this.initialForm = emptyForm()
      if (!this.isEdit) {
        this.loading = false
        return
      }
      this.loading = true
      try {
        const response = await this.$axios.get('/blog/' + encodeURIComponent(this.$route.params.blogId))
        if (sequence !== this.requestSequence) return
        const blog = response.data.data
        if (!blog || blog.id == null) throw new Error('文章不存在')
        const userId = this.$store.getters.getUser.id
        if (userId == null || blog.userId == null || String(userId) !== String(blog.userId)) throw new Error('只能编辑自己的文章')
        this.editForm = { id: blog.id, title: blog.title || '', description: blog.description || '', content: blog.content || '' }
        this.initialForm = { ...this.editForm }
      } catch (error) {
        if (sequence === this.requestSequence) this.loadError = error.message || '文章加载失败'
      } finally {
        if (sequence === this.requestSequence) this.loading = false
      }
    },
    async submitForm() {
      if (this.submitting || this.loading || this.loadError) return
      const valid = await this.$refs.editForm.validate().catch(() => false)
      if (!valid || this.submitting) return
      this.submitting = true
      this.saveError = ''
      try {
        const payload = { ...this.editForm }
        await this.$axios.post('/blog/edit', payload)
        this.initialForm = payload
        this.$message.success('操作成功')
        await this.$router.push('/blogs')
      } catch (error) {
        this.saveError = error.message || '保存失败，请重试'
      } finally {
        this.submitting = false
      }
    },
    resetForm() {
      this.editForm = { ...this.initialForm }
      this.saveError = ''
      this.$nextTick(() => this.$refs.editForm?.clearValidate())
    }
  }
}
</script>

<style scoped>
.editor-page { max-width: 1200px; }
.save-error { margin-bottom: 20px; }
:deep(.md-editor) { width: 100%; min-height: 450px; }
</style>
