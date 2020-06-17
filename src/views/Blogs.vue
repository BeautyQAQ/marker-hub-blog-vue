<template>
  <div class="m-content">
      <Header></Header>
      <div class="block">
        <el-timeline>
          <el-timeline-item :key="blog.id" :timestamp="blog.created" placement="top" v-for="blog in blogs">
            <el-card>
              <router-link :to="{name:'BlogDetail', params:{blogId:blog.id}}">
                <h4>{{ blog.title }}</h4>
              </router-link>
              <p>{{ blog.description }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-pagination
        background
        layout="prev, pager, next"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change=page>
        </el-pagination>
      </div>
  </div>
</template>

<script>
import Header from '../components/Header'
export default {
  name: 'Blogs',
  components: {Header},
  data() {
    return {
      blogs: {},
      currentPage: 1,
      total: 0,
      pageSize: 5
    }
  },
  mounted() {
      this.page(1)
  },
  methods: {
    page(currentPage) {
      const _this = this
      this.$axios.get("/blogs?currentPage="+currentPage).then(res => {
        _this.blogs = res.data.data.records
        _this.currentPage = res.data.data.current
        _this.total = res.data.data.total
        _this.pageSize = res.data.data.size
      })
    }
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