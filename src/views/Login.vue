<template>
  <div>
    <el-container>
      <el-header>
        <img src="https://www.markerhub.com/dist/images/logo/markerhub-logo.png"
             style="height: 60%; margin-top: 10px;"></el-header>
      <el-main>
        <el-form :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px" class="demo-ruleForm">
          <el-form-item label="账号" prop="username">
            <el-input v-model="ruleForm.username"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="ruleForm.password"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm('ruleForm')">登录</el-button>
            <el-button @click="resetForm('ruleForm')">重置</el-button>
          </el-form-item>
        </el-form>
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: "Login",
  data() {
      return {
        ruleForm: {
          username: 'markerhub',
          password: '111111'
        },
        rules: {
          username: [
            { required: true, message: '请输入账号', trigger: 'blur' },
            { min: 3, max: 15, message: '长度在 3 到 5 个字符', trigger: 'blur' }
          ],
          password: [
            { required: true, message: '请输入密码', trigger: 'change' },
            { min: 6, max: 16, message: '长度在 6 到 16 个字符', trigger: 'blur' }
          ]
        }
      };
    },
    methods: {
      submitForm(formName) {
        const _this = this
        this.$refs[formName].validate((valid) => {
          if (valid) {
            this.$axios.post("http://localhost:8081/login",this.ruleForm).then((res)=>{
              const token = res.headers['authorization']
              const userInfo = res.data.data
              _this.$store.commit('SET_TOKEN',token)
              _this.$store.commit('SET_USERINFO',userInfo)
              _this.$router.push("/blogs")
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
};
</script>

<style scoped>
  .el-header, .el-footer {
    background-color: #B3C0D1;
    color: #333;
    text-align: center;
    line-height: 60px;
  }
  
  .el-aside {
    /* background-color: #D3DCE6; */
    color: #333;
    text-align: center;
    line-height: 200px;
  }
  
  .el-main {
    /* background-color: #E9EEF3; */
    color: #333;
    text-align: center;
    line-height: 160px;
  }
  
  body > .el-container {
    margin-bottom: 40px;
  }
  
  .el-container:nth-child(5) .el-aside,
  .el-container:nth-child(6) .el-aside {
    line-height: 260px;
  }
  
  .el-container:nth-child(7) .el-aside {
    line-height: 320px;
  }
  .demo-ruleForm {
    max-width: 500px;
    margin: 0 auto;
  }
</style>