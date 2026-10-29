<template>
  <BlogHeader />
  <main class="page editor-page">
    <h1 class="page-title">{{ isEdit ? '编辑文章' : '发表文章' }}</h1>
    <p class="muted">{{ isEdit ? (initialForm.status === 1 ? '当前已发布，公开可见' : '当前为草稿，仅自己可见') : '新文章默认保存为草稿，发布后访客可见' }}</p>
    <section v-loading="loading" class="surface" :aria-busy="loading">
      <div v-if="loadError" class="error-panel">
        <el-alert :title="loadError" type="error" :closable="false" show-icon />
        <el-button @click="loadBlog">重新加载</el-button>
      </div>
      <el-form v-else ref="editForm" :model="editForm" :rules="rules" :disabled="submitting || loading" label-position="top" @submit.prevent="submitForm()">
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="摘要" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="2" maxlength="1000" show-word-limit placeholder="可选，最多 1000 个字符" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <MdEditor v-model="editForm.content" :toolbars="toolbars" :sanitize="sanitizeMarkdown" v-bind="editorOptions" :read-only="submitting || loading" @on-save="submitForm()" />
        </el-form-item>
        <el-alert v-if="saveError" :title="saveError" type="error" :closable="false" show-icon class="save-error" />
        <div class="editor-actions">
        <el-button :disabled="loading || submitting" :loading="submitting && submittingStatus === 0" @click="submitForm(0)">{{ initialForm.status === 1 ? '转为草稿' : '保存草稿' }}</el-button>
        <el-button type="primary" :disabled="loading || submitting" :loading="submitting && submittingStatus === 1" @click="submitForm(1)">{{ initialForm.status === 1 ? '保存并发布' : '发布文章' }}</el-button>
        <el-button :disabled="submitting || loading" @click="resetForm">重置</el-button>
        </div>
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
import { articleValidationMessage, blogPayload, validateContent } from '../utils/blog'

const emptyForm = () => ({ id: '', title: '', description: '', content: '', status: 0 })

export default {
  name: 'BlogEditView',
  components: { BlogHeader, MdEditor },
  data() {
    return {
      editForm: emptyForm(),
      initialForm: emptyForm(),
      loading: false,
      submitting: false,
      submittingStatus: null,
      loadError: '',
      saveError: '',
      requestSequence: 0,
      editorOptions,
      toolbars: ['bold', 'italic', 'strikeThrough', '-', 'title', 'quote', 'unorderedList', 'orderedList', 'task', '-', 'codeRow', 'code', 'link', 'table', '-', 'revoke', 'next', 'save', '=', 'preview', 'fullscreen'],
      rules: {
        title: [{ required: true, whitespace: true, message: '请输入标题', trigger: 'blur' }, { max: 255, message: '标题不能超过 255 个字符', trigger: 'blur' }],
        description: [{ max: 1000, message: '摘要不能超过 1000 个字符', trigger: 'blur' }],
        content: [{ required: true, whitespace: true, message: '请输入文章内容', trigger: 'change' }, { validator: validateContent, trigger: 'change' }]
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
    return this.confirmLeave()
  },
  async beforeRouteUpdate(to, from) {
    if (to.params.blogId !== from.params.blogId) return this.confirmLeave()
  },
  methods: {
    sanitizeMarkdown,
    async confirmLeave() {
      if (!this.hasChanges || !this.$store.getters.isAuthenticated) return true
      try {
        await this.$confirm('文章尚未保存，确定离开吗？', '未保存的修改', { type: 'warning', confirmButtonText: '离开', cancelButtonText: '继续编辑' })
        return true
      } catch {
        return false
      }
    },
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
        this.editForm = { id: blog.id, title: blog.title || '', description: blog.description || '', content: blog.content || '', status: Number(blog.status) === 1 ? 1 : 0 }
        this.initialForm = { ...this.editForm }
      } catch (error) {
        if (sequence === this.requestSequence) this.loadError = error.message || '文章加载失败'
      } finally {
        if (sequence === this.requestSequence) this.loading = false
      }
    },
    async submitForm(status = this.editForm.status) {
      if (this.submitting || this.loading || this.loadError) return
      this.saveError = articleValidationMessage(this.editForm)
      if (this.saveError) return
      const valid = await this.$refs.editForm.validate().catch(() => false)
      if (!valid || this.submitting) return
      this.submitting = true
      this.submittingStatus = status
      this.editForm.status = status
      this.saveError = ''
      try {
        const payload = blogPayload(this.editForm, status)
        await this.$axios.post('/blog/edit', payload)
        this.initialForm = { ...this.editForm }
        this.$message.success(status === 1 ? '文章已发布' : '草稿已保存')
        await this.$router.push('/my/blogs')
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
.editor-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.editor-actions .el-button + .el-button { margin-left: 0; }
:deep(.md-editor) { width: 100%; min-height: 450px; }
</style>
