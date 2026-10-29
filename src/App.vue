<template>
  <ElConfigProvider :locale="locale">
    <RouterView />
  </ElConfigProvider>
</template>

<script>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

export default {
  components: { ElConfigProvider },
  data: () => ({ locale: zhCn })
}
</script>
