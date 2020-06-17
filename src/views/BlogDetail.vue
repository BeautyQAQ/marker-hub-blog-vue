<template>
  <div>
    <Header></Header>
    <div class="m-content">
      <h2>{{ blog.title }}</h2>
      <el-link icon="el-icon-edit" v-if="ownBlog"><router-link :to="{name: 'BlogEdit', params:{blogId: blog.id}}">编辑</router-link></el-link>
      <el-divider></el-divider>
      <div class="content markdown-body" v-html="blog.content"></div>
    </div>
  </div>
</template>

<script>
import Header from '../components/Header';
import 'github-markdown-css/github-markdown.css' // 然后添加样式markdown-body

export default {
  name: 'BlogDetail',
  components: {Header},
  data() {
    return {
      blog:{
        userId: null,
        title: '',
        description: "",
        content: ""
      },
      ownBlog: false
    }
  },
  created() {
    const blogId = this.$route.params.blogId
    const _this = this
    this.$axios.get('/blog/'+blogId).then(res => {
      _this.blog = res.data.data
      var markdownIt = require('markdown-it')
      var md = new markdownIt()
      var result = md.render(_this.blog.content)
      _this.blog.content = result
      //判断是否为自己的文章
      _this.ownBlog = (_this.blog.userId === _this.$store.getters.getUser.id)
    })
  }
}
</script>

<style scoped>
.m-content{
    text-align: center;
    margin: 0 auto;
    max-width: 960px;
}
</style>