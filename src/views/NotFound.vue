<template>
  <BlogHeader />
  <main class="page">
    <el-result icon="warning" title="页面不存在" sub-title="请检查地址或返回文章列表">
      <template #extra><el-button type="primary" @click="$router.push('/blogs')">返回首页</el-button></template>
    </el-result>
  </main>
</template>

<script>
import BlogHeader from '../components/Header.vue'
export default { name: 'NotFoundView', components: { BlogHeader } }
</script>
