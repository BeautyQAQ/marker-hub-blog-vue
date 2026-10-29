import {
  ElAlert, ElButton, ElCard, ElDivider, ElEmpty, ElForm, ElFormItem, ElInput,
  ElLoading, ElMessage, ElMessageBox, ElPagination, ElResult, ElTimeline, ElTimelineItem
} from 'element-plus'
import 'element-plus/es/components/alert/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/divider/style/css'
import 'element-plus/es/components/empty/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/loading/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/pagination/style/css'
import 'element-plus/es/components/result/style/css'
import 'element-plus/es/components/timeline/style/css'

export function installElement(app) {
  const components = { ElAlert, ElButton, ElCard, ElDivider, ElEmpty, ElForm, ElFormItem, ElInput, ElPagination, ElResult, ElTimeline, ElTimelineItem }
  for (const [name, component] of Object.entries(components)) app.component(name, component)
  app.directive('loading', ElLoading.directive)
  app.config.globalProperties.$message = ElMessage
  app.config.globalProperties.$confirm = ElMessageBox.confirm
}
