<template>
  <div>
    <Header></Header>
    <div class="m-content">
      <el-form :model="editForm" :rules="rules" ref="editForm" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title"></el-input>
        </el-form-item>
        <el-form-item label="摘要" prop="description">
          <el-input v-model="editForm.description"></el-input>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <mavon-editor v-model="editForm.content"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm('editForm')">立即创建</el-button>
          <el-button @click="resetForm('editForm')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import Header from "../components/Header"

export default {
  name: 'BlogEdit',
  components: {Header},
  data() {
    return {
      editForm: {
        id: '',
        title: '',
        description: '',
        content: ''
      },
      rules: {
        title: [
          { required: true, message: '请输入标题', trigger: 'blur' },
          { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '请输入摘要', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '请输入文章内容', trigger: 'blur' }
        ]
      }
    };
  },
  created() {
    const blogId = this.$route.params.blogId
    const _this = this
    if(blogId){
      this.$axios.get('/blog/'+blogId).then(res => {
        const blog = res.data.data
        _this.editForm.id = blog.id
        _this.editForm.title = blog.title
        _this.editForm.description = blog.description
        _this.editForm.content = blog.content
      })
    }
  },
  methods: {
    submitForm(formName) {
      const _this = this
      
      this.$refs[formName].validate((valid) => {
        if (valid) {
          //这个请求需要权限,所以带上token值
          this.$axios.post('/blog/edit',_this.editForm,{
            headers: {
              "Authorization": localStorage.getItem("token")
            }
          }).then(res => {
            _this.$alert('操作成功','提示', {
              confirmButtonText: '确定',
              callback: action => {
                _this.$router.push('/blogs')
              }
            })
          })
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
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