<template>
  <div class="delete-action">
    <el-button type="danger" plain :loading="busy" @click="removeBlog">删除</el-button>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
  </div>
</template>

<script>
export default {
  name: 'DeleteBlogButton',
  props: { blogId: { type: [String, Number], required: true }, title: { type: String, default: '' } },
  emits: ['deleted'],
  data: () => ({ busy: false, error: '' }),
  methods: {
    async removeBlog() {
      if (this.busy) return
      this.busy = true
      try {
        try {
          await this.$confirm('确定删除《' + this.title + '》吗？删除后将不再展示。', '删除文章', { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' })
        } catch {
          return
        }
        this.error = ''
        try {
          await this.$axios.delete('/blog/' + encodeURIComponent(this.blogId))
          this.$message.success('文章已删除')
          this.$emit('deleted', this.blogId)
        } catch (error) {
          this.error = error.message || '删除失败，请重试'
        }
      } finally {
        this.busy = false
      }
    }
  }
}
</script>

<style scoped>
.delete-action { display: flex; align-items: start; gap: 12px; flex-wrap: wrap; }
.el-alert { max-width: 100%; }
</style>
