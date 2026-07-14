<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  OButton, OTag, OSelect, OOption, OInput, OTextarea,
  OTab, OTabPane, OTable, ODivider,
  OCard, OLink, OMessage, ODialog, OForm, OFormItem,
  OStep, OStepItem,
  ORadioGroup, ORadio, OCheckbox, OPagination, OUpload,
} from '@opensig/opendesign'
import { useAuth } from '../../composables/useAuth'
import { MOCK_PROJECTS, MOCK_PATCHES, MOCK_PIPELINE_TASKS, MOCK_TEST_CASES, type Project, type PipelineStatus } from '../../mock/data'
import { t } from '../../i18n/zh'
import PatchTab from './components/PatchTab.vue'
import TestCaseTab from './components/TestCaseTab.vue'

const { isAdmin, currentUser } = useAuth()
const router = useRouter()

const visibleProjects = computed<Project[]>(() =>
  isAdmin.value
    ? MOCK_PROJECTS
    : MOCK_PROJECTS.filter((p) => (currentUser.value?.projectIds ?? []).includes(p.id))
)

const selectedProjectId = ref(visibleProjects.value[0]?.id ?? '')
const project = computed<Project | undefined>(() =>
  MOCK_PROJECTS.find((p) => p.id === selectedProjectId.value)
)
const projStatusColor = computed(() =>
  ({ '开发中': 'primary', '测试中': 'warning', '已完成': 'success' }[project.value?.status ?? ''] ?? 'normal')
)
const projStatusClass = computed(() =>
  ({ '开发中': 'status-developing' }[project.value?.status ?? ''] ?? '')
)

const projectOptions = computed(() =>
  visibleProjects.value.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.projectId})`,
  }))
)

const activeTab = ref('overview')

const MODULE_OPTIONS = ['ACC', 'PCIe', 'ZIP', 'UACCE', 'Crypto', 'DPC', 'Network', 'QUIC', 'HTTP3', 'KVM', 'Scheduler', 'MMU']

const originalModules = ref<string[]>([])

const handleEditModuleAddOnly = (value: string | number) => {
  if (originalModules.value.includes(String(value))) {
    OMessage.warning('已有模块不可重复添加')
    return false
  }
  return true
}

// 跨 tab 通信：PatchTab 触发"查看对应用例"时，切换到用例看板并记录关联的 patchIds
const viewCasePatchIds = ref<string[]>([])
const handleViewCases = (patchIds: string[]) => {
  viewCasePatchIds.value = patchIds
  activeTab.value = 'testcases'
}

// 跨 tab 通信：TestCaseTab 触发"跳转至流水线"时，切换到流水线控制台并记录用例 IDs
const runPipelineCaseIds = ref<string[]>([])
const handleRunPipeline = (caseIds: string[]) => {
  runPipelineCaseIds.value = caseIds
  activeTab.value = 'pipeline'
}

// ─── 基本信息表单 ─────────────────────────────────────────────────────────────
const form = reactive({
  name: '', description: '', kernelVersion: '', osVersion: '',
  status: '', owner: '', productVersion: '', cpuArch: '', targetRepo: '',
  forkRepo: '',
  modules: [] as string[],
  pipelineId: '', pipelineName: '',
})
const syncForm = () => {
  const p = project.value
  if (!p) return
  form.name = p.name; form.description = p.description
  form.kernelVersion = p.kernelVersion; form.osVersion = p.osVersion
  form.status = p.status; form.owner = p.owner
  form.productVersion = p.productVersions[0] ?? ''; form.cpuArch = p.cpuArch
  form.targetRepo = p.targetRepo
  form.forkRepo = p.forkRepo
  form.modules = [...p.modules]
  form.pipelineId = p.pipelineId; form.pipelineName = p.pipelineName
}
syncForm()
const handleSave = () => {
  if (!editForm.targetRepo.trim()) { OMessage.warning('目标仓库不能为空'); return }
  OMessage.success('保存成功')
  editDialog.visible = false
}

const editDialog = reactive({ visible: false })
const editForm = reactive({
  name: '', description: '', kernelVersion: '', osVersion: '',
  status: '', owner: '', productVersion: '', cpuArch: '', targetRepo: '',
  forkRepo: '',
  modules: [] as string[],
  pipelineId: '', pipelineName: '',
})

const openEditDialog = () => {
  const p = project.value
  if (!p) return
  editForm.name = p.name; editForm.description = p.description
  editForm.kernelVersion = p.kernelVersion; editForm.osVersion = p.osVersion
  editForm.status = p.status; editForm.owner = p.owner
  editForm.productVersion = p.productVersions[0] ?? ''; editForm.cpuArch = p.cpuArch
  editForm.targetRepo = p.targetRepo
  editForm.forkRepo = p.forkRepo
  originalModules.value = [...p.modules]
  editForm.modules = []
  editForm.pipelineId = p.pipelineId; editForm.pipelineName = p.pipelineName
  initEditingTimeline()
  editDialog.visible = true
}

// ─── 出口评审报告 ─────────────────────────────────────────────────────────────
const reportDialog = reactive({ visible: false })

// 补丁统计
const patchStats = computed(() => {
  const patches = MOCK_PATCHES.filter(p => p.projectId === selectedProjectId.value)
  const total = patches.length
  const merged = patches.filter(p => p.status === 'merged').length
  const pending = patches.filter(p => p.status === 'pending').length
  const conflict = patches.filter(p => p.status === 'rejected').length
  return { total, merged, pending, conflict }
})

// 用例统计
const testCaseStats = computed(() => {
  const cases = MOCK_TEST_CASES.filter(tc => tc.projectId === selectedProjectId.value)
  const total = cases.length
  const passed = cases.filter(tc => tc.lastExecResult === 'passed').length
  const failed = cases.filter(tc => tc.lastExecResult === 'fail').length
  const blocked = cases.filter(tc => tc.lastExecResult === 'block').length
  const unavailable = cases.filter(tc => tc.lastExecResult === 'unavailable').length
  return { total, passed, failed, blocked, unavailable }
})

const openReportDialog = () => {
  reportDialog.visible = true
}

const handleEditConfirm = () => {
  if (!editForm.name.trim()) { OMessage.warning('项目名称不能为空'); return }
  if (!editForm.targetRepo.trim()) { OMessage.warning('目标仓库不能为空'); return }
  if (!editForm.forkRepo.trim()) { OMessage.warning('Fork仓库不能为空'); return }
  if (!originalModules.value.length && !editForm.modules.length) { OMessage.warning('模块不能为空'); return }
  Object.assign(form, editForm)
  form.modules = [...originalModules.value, ...editForm.modules]
  const tlOk = saveTimeline()
  if (!tlOk) return
  OMessage.success('保存成功')
  editDialog.visible = false
}

// ─── 时间计划本地数据（支持多时间段）────────────────────────────────────────
// 时间段接口：开发/测试节点可有多个 period
interface LocalPeriod {
  id: string
  startDate: string
  endDate: string
}
// 时间节点接口
interface LocalNode {
  id: string
  label: string
  status: 'done' | 'current' | 'pending'
  isFixed: boolean     // 启动/交付为固定节点，不可删除
  periods: LocalPeriod[]
}

const buildLocalTimeline = (): LocalNode[] => {
  const steps = project.value?.timeline ?? []
  return steps.map((s, idx) => ({
    id: s.id,
    label: s.label,
    status: s.status,
    isFixed: idx === 0 || idx === steps.length - 1,
    periods: [{ id: `${s.id}-p0`, startDate: s.startDate, endDate: s.endDate ?? '' }],
  }))
}

const localTimeline = ref<LocalNode[]>(buildLocalTimeline())

watch(selectedProjectId, () => { syncForm(); localTimeline.value = buildLocalTimeline() })

const isLineActive = (idx: number) =>
  idx > 0 && localTimeline.value[idx - 1]?.status === 'done'

// ─── OStep 辅助函数 ────────────────────────────────────────────────────────────
// 将本地状态映射到 OStepItem 的 status prop
// 规范：done→finished（success1 背景），current→processing（primary1 背景），pending→waiting（primary4 背景）
const mapStepStatus = (s: 'done' | 'current' | 'pending') =>
  ({ done: 'finished', current: 'processing', pending: 'waiting' } as const)[s]

// 将日期格式从 YYYY-MM-DD 转换为 YYYY/MM/DD
const formatDate = (date: string): string => {
  return date.replace(/-/g, '/')
}

// 将节点的时间段格式化为描述文字（显示在步骤标题下方）
const formatStepDesc = (node: LocalNode): string => {
  const ps = node.periods.filter(p => p.startDate)
  if (!ps.length) return '待设置'
  const first = ps[0]
  const startDate = formatDate(first.startDate)
  const endDate = first.endDate ? formatDate(first.endDate) : ''
  const dateStr = endDate ? `${startDate} → ${endDate}` : startDate
  return ps.length > 1 ? `${dateStr} 等${ps.length}个时间段` : dateStr
}

// 打开时深拷贝 localTimeline → editingTimeline（草稿）
// 用户点取消：草稿丢弃；点保存：写回 localTimeline
const timelineEditorVisible = ref(false)
const editingTimeline = ref<LocalNode[]>([])

const initEditingTimeline = () => {
  editingTimeline.value = localTimeline.value.map(n => ({
    ...n,
    periods: n.periods.map(p => ({ ...p })),
  }))
}

const openTimelineEditor = () => {
  initEditingTimeline()
  timelineEditorVisible.value = true
}

const saveTimeline = () => {
  for (const node of editingTimeline.value) {
    for (const p of node.periods) {
      if (!p.startDate.trim()) {
        OMessage.warning(`「${node.label}」中存在未填写的开始日期`)
        return false
      }
    }
  }
  localTimeline.value = editingTimeline.value.map(n => ({
    ...n,
    periods: n.periods.map(p => ({ ...p })),
  }))
  return true
}

// 在草稿中新增时间段（仅开发/测试动态节点）
const addEditPeriod = (node: LocalNode) => {
  node.periods.push({ id: `${node.id}-p${Date.now()}`, startDate: '', endDate: '' })
}

// 在草稿中删除时间段
const deleteEditPeriod = (node: LocalNode, periodId: string) => {
  if (node.periods.length === 1) { OMessage.warning('至少保留一个时间段'); return }
  node.periods = node.periods.filter(p => p.id !== periodId)
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

// 用户手动触发的"实时"流水线任务（状态随时间推进）
const livePipelineTasks = ref<any[]>([])

// 合并：实时任务排在前（最新执行的优先展示），历史 mock 数据排在后
// 关键：用 { ...t } 展开每个 live task，让 Vue 追踪 testStatus/pipelineStatus 等所有字段。
// 若不展开，computed 只依赖数组引用，setTimeout 修改字段时 computed 不会重新执行，UI 不更新。
const pipelineTasks = computed(() => {
  const live = livePipelineTasks.value
    .filter(t => t.projectId === selectedProjectId.value)
    .map(t => ({ ...t }))          // 展开 → 读取全部响应式属性 → 建立依赖
  return [
    ...live,
    ...MOCK_PIPELINE_TASKS.filter(t => t.projectId === selectedProjectId.value),
  ]
})

// 分页相关
const pipelinePageSize = 10
const pipelineCurrentPage = ref(1)
const pagedPipelineTasks = computed(() => {
  const start = (pipelineCurrentPage.value - 1) * pipelinePageSize
  return pipelineTasks.value.slice(start, start + pipelinePageSize)
})
const onPipelinePageChange = (val: { page: number }) => {
  pipelineCurrentPage.value = val.page
}
const pipelineTableMinWidth = computed(() => {
  const cols = pipelineColumns.value
  const w = cols.reduce((sum, c) => sum + (parseInt(c.style?.width || c.style?.minWidth || '100', 10)), 0)
  return `${w + 40}px`
})

const pipelineColumns = computed(() => [
  { label: t('pipeline.colTaskId'), key: 'taskId', style: { width: '130px', minWidth: '130px' } },
  { label: t('pipeline.colStatus'), key: 'pipelineStatus', style: { width: '100px', minWidth: '100px' } },
  { label: t('pipeline.colTest'), key: 'testStatus', style: { width: '100px', minWidth: '100px' } },
  { label: '软件包下载地址', key: 'packageDownloadUrl', style: { width: '220px', minWidth: '220px' } },
  { label: 'ISO下载地址', key: 'isoDownloadUrl', style: { width: '220px', minWidth: '220px' } },
  { label: t('pipeline.colStart'), key: 'startedAt', style: { width: '130px', minWidth: '130px' } },
  { label: t('pipeline.colEnd'), key: 'endedAt', style: { width: '130px', minWidth: '130px' } },
  { label: t('pipeline.colDuration'), key: 'duration', style: { width: '80px', minWidth: '80px' } },
  { label: t('pipeline.colExecutor'), key: 'executor', style: { width: '100px', minWidth: '100px' } },
  { label: t('pipeline.colAction'), key: 'action', style: { width: '120px', minWidth: '120px' } },
])
const pipelineStatusColor = (s: PipelineStatus | string) => {
  const m: Record<string, string> = { success: 'success', failed: 'danger', running: 'warning', pending: 'info', cancelled: 'info' }
  return m[s] ?? 'info'
}
const formatDateTime = (dt: string | null | undefined): { date: string; time: string } => {
  if (!dt) return { date: '—', time: '' }
  const [datePart, timePart] = dt.split(' ')
  const parts = datePart.split('.')
  const date = `${parts[0]}/${String(parts[1]).padStart(2, '0')}/${String(parts[2]).padStart(2, '0')}`
  return { date, time: timePart ?? '' }
}
const pipelineStatusLabel = (s: string) => {
  const m: Record<string, string> = {
    success: t('status.success'), failed: t('status.failed'),
    running: t('status.running'), pending: t('status.pending'), cancelled: t('status.cancelled'),
  }
  return m[s] ?? s
}

// ─── 一键执行流水线弹窗 ─────────────────────────────────────────────────────────

// 弹窗基础状态
const pipelineDialog = reactive({
  visible: false,
  buildMode: 'auto' as 'auto' | 'manual',
  uploadFiles: [] as any[],
})

// 弹窗内用例筛选
const dialogFilter = reactive<{
  level: string | null; testType: string | null; autoStatus: string | null; execResult: string | null
}>({ level: null, testType: null, autoStatus: null, execResult: null })

// 弹窗内用例选中
const dialogSelectedIds = ref<string[]>([])

watch(activeTab, (tab) => {
  if (tab === 'pipeline') {
    if (runPipelineCaseIds.value.length > 0) {
      dialogSelectedIds.value = [...runPipelineCaseIds.value]
    } else {
      dialogSelectedIds.value = MOCK_TEST_CASES
        .filter(tc => tc.projectId === selectedProjectId.value)
        .map(tc => tc.id)
    }
  }
})

// 弹窗内用例数据（当前项目 + 筛选）
const dialogCases = computed(() => {
  const all = MOCK_TEST_CASES.filter(tc => tc.projectId === selectedProjectId.value)
  return all.filter(tc => {
    const matchLevel  = !dialogFilter.level      || tc.level === dialogFilter.level
    const matchType   = !dialogFilter.testType   || tc.testType === dialogFilter.testType
    const matchAuto   = !dialogFilter.autoStatus || String(tc.isAutomated) === dialogFilter.autoStatus
    const matchResult = !dialogFilter.execResult || tc.lastExecResult === dialogFilter.execResult
    return matchLevel && matchType && matchAuto && matchResult
  })
})

// 弹窗内分页
const dialogPage = ref(1)
const dialogPageSize = 10
const dialogPagedCases = computed(() => {
  const s = (dialogPage.value - 1) * dialogPageSize
  return dialogCases.value.slice(s, s + dialogPageSize)
})
const onDialogPageChange = (val: { page: number }) => { dialogPage.value = val.page }

// 弹窗内全选
const dialogAllChecked = computed({
  get: () => dialogPagedCases.value.length > 0 && dialogPagedCases.value.every(c => dialogSelectedIds.value.includes(c.id)),
  set: (v: boolean) => {
    const pageIds = dialogPagedCases.value.map(c => c.id)
    if (v) dialogSelectedIds.value = [...new Set([...dialogSelectedIds.value, ...pageIds])]
    else {
      const set = new Set(pageIds)
      dialogSelectedIds.value = dialogSelectedIds.value.filter(id => !set.has(id))
    }
  }
})

// 弹窗内用例列（简化版，对应截图）
const dialogCaseColumns = computed(() => {
  if (!isAdmin.value) {
    return [
      { label: '', key: 'select', style: { width: '72px', minWidth: '72px' } },
      { label: '名称', key: 'name', style: { width: '160px', minWidth: '160px' } },
      { label: '用例模块', key: 'testCaseModule', style: { width: '100px', minWidth: '100px' } },
      { label: '最后一次执行结果', key: 'lastExecResult', style: { width: '140px', minWidth: '140px' } },
    ]
  }
  return [
    { label: '', key: 'select', style: { width: '72px', minWidth: '72px' } },
    { label: '名称', key: 'name', style: { width: '140px', minWidth: '140px' } },
    { label: '编号', key: 'testId', style: { width: '140px', minWidth: '140px' } },
    { label: '唯一标识符', key: 'mainKey', style: { width: '110px', minWidth: '110px' } },
    { label: '级别', key: 'level', style: { width: '100px', minWidth: '100px' } },
    { label: '预置条件', key: 'precondition', style: { width: '200px', minWidth: '200px' } },
    { label: '测试步骤', key: 'testSteps', style: { width: '200px', minWidth: '200px' } },
    { label: '预期结果', key: 'expectedResult', style: { width: '180px', minWidth: '180px' } },
    { label: '自动化脚本/路径', key: 'automationScript', style: { width: '240px', minWidth: '240px' } },
    { label: '最后一次执行结果', key: 'lastExecResult', style: { width: '160px', minWidth: '160px' } },
    { label: '用例模块', key: 'testCaseModule', style: { width: '100px', minWidth: '100px' } },
    { label: '最后执行人', key: 'lastExecutor', style: { width: '120px', minWidth: '120px' } },
    { label: '测试类型', key: 'testType', style: { width: '100px', minWidth: '100px' } },
    { label: '自动化类型', key: 'isAutomated', style: { width: '120px', minWidth: '120px' } },
  ]
})

const dialogTableMinWidth = computed(() => {
  const cols = dialogCaseColumns.value
  const w = cols.reduce((sum, c) => sum + (parseInt(c.style?.width || c.style?.minWidth || '100', 10)), 0)
  return `${w + 40}px`
})

const selectedCaseSummary = computed(() =>
  dialogCases.value.filter(c => dialogSelectedIds.value.includes(c.id)).slice(0, 5)
)

const caseEditDialog = reactive({ visible: false })

const openCaseEditDialog = () => { caseEditDialog.visible = true }

const dlgExecColor = (r: string) =>
  ({ passed: 'success', fail: 'danger', block: 'warning', unavailable: 'normal', pending: 'info' }[r] ?? 'info')
const dlgExecLabel = (r: string) =>
  ({ passed: '通过', fail: '失败', block: '阻塞', unavailable: '不可用', pending: '—' }[r] ?? r)
const dlgTypeLabel = (tp: string) =>
  ({ functional: '功能', performance: '性能', reliability: '可靠性', compatibility: '兼容性',
     security: '安全性', serviceability: '可服务性', usability: '易用性' }[tp] ?? tp)

// 弹窗筛选选项（复用 TestCaseTab 相同数据）
const dialogLevelOptions = [
  { value: 'Level 1', label: 'Level 1' }, { value: 'Level 1/2', label: 'Level 1/2' },
  { value: 'Level 0/1/2/3', label: 'Level 0/1/2/3' }, { value: 'Level 2', label: 'Level 2' },
]
const dialogTypeOptions = [
  { value: 'functional', label: '功能' }, { value: 'performance', label: '性能' },
  { value: 'reliability', label: '可靠性' }, { value: 'security', label: '安全性' },
  { value: 'compatibility', label: '兼容性' },
]
const dialogAutoOptions = [{ value: 'true', label: 'TRUE' }, { value: 'false', label: 'FALSE' }]
const dialogResultOptions = [
  { value: 'passed', label: 'Passed' }, { value: 'fail', label: 'Fail' },
  { value: 'block', label: 'Block' }, { value: 'unavailable', label: 'Unavailable' },
]

// 打开弹窗：若来自"跳转至流水线"则默认选中那些用例，否则全选
const openPipelineDialog = () => {
  pipelineDialog.visible = true
  pipelineDialog.buildMode = 'auto'
  pipelineDialog.uploadFiles = []
  Object.assign(dialogFilter, { level: null, testType: null, autoStatus: null, execResult: null })
  dialogPage.value = 1
  if (runPipelineCaseIds.value.length > 0) {
    dialogSelectedIds.value = [...runPipelineCaseIds.value]
  } else {
    dialogSelectedIds.value = MOCK_TEST_CASES
      .filter(tc => tc.projectId === selectedProjectId.value)
      .map(tc => tc.id)
  }
}

// 清除筛选
const clearDialogFilter = () => {
  Object.assign(dialogFilter, { level: null, testType: null, autoStatus: null, execResult: null })
  dialogPage.value = 1
}

// 执行流水线：创建新任务并用 setTimeout 按阶段推进状态
// 阶段顺序：包构建(running→success) → ISO构建(running→success) → 测试(running→success)
const executePipeline = () => {
  if (!dialogSelectedIds.value.length) { OMessage.warning('请至少选择一个用例'); return }
  const p = project.value
  if (!p?.pipelineId.trim() || !p?.pipelineName.trim()) {
    OMessage.warning('流水线ID和流水线名称均须填写方可启动流水线，请先在项目基本信息中补充')
    return
  }

  // 生成任务 ID
  const taskNo = String(livePipelineTasks.value.length + 1).padStart(3, '0')
  const buildMode = pipelineDialog.buildMode === 'auto' ? '自动编译' : '手动上传'
  const now = new Date()
  const startStr = `${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

  // 新建响应式任务对象（Vue 3 reactive 追踪 Set 字段变更）
  const newTask = reactive({
    id: `live-${Date.now()}`,
    projectId: selectedProjectId.value,
    taskId: `PL-${taskNo}`,
    testStatus:  'running' as string,
    pipelineStatus: 'running' as string,
    packageDownloadUrl: null as string | null,
    isoDownloadUrl: null as string | null,
    startedAt: startStr,
    endedAt:  null as string | null,
    duration: null as string | null,
    executor: currentUser.value?.name ?? 'admin',
  })

  livePipelineTasks.value = [newTask, ...livePipelineTasks.value]

  pipelineDialog.visible = false
  runPipelineCaseIds.value = []
  activeTab.value = 'pipeline'

  OMessage.success(`流水线 ${newTask.taskId} 已启动（${buildMode}，${dialogSelectedIds.value.length} 个用例），测试执行中...`)

  setTimeout(() => {
    newTask.packageDownloadUrl = `https://repo.openeuler.org/packages/${newTask.taskId}`
    newTask.isoDownloadUrl = `https://iso.openeuler.org/download/${newTask.taskId}`
    newTask.testStatus = 'running'
    OMessage.success(`[${newTask.taskId}] 测试执行中...`)
  }, 3000)

  setTimeout(() => {
    newTask.testStatus     = 'success'
    newTask.pipelineStatus = 'success'
    const end = new Date()
    const endStr = `${end.getFullYear()}.${end.getMonth()+1}.${end.getDate()} ${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`
    newTask.endedAt  = endStr
    newTask.duration = '8分钟'
    OMessage.success(`[${newTask.taskId}] 流水线执行完成 ✓`)
  }, 7000)
}

const retryPipeline = (task: PipelineTask) => {
  const idx = livePipelineTasks.value.findIndex(t => t.id === task.id)
  if (idx !== -1) {
    livePipelineTasks.value.splice(idx, 1)
  }
  const taskNo = String(livePipelineTasks.value.length + MOCK_PIPELINE_TASKS.filter(t => t.projectId === selectedProjectId.value).length + 1).padStart(3, '0')
  const now = new Date()
  const startStr = `${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const newTask = reactive({
    id: `live-retry-${Date.now()}`,
    projectId: selectedProjectId.value,
    taskId: `PL-${taskNo}`,
    testStatus:  'running' as string,
    pipelineStatus: 'running' as string,
    packageDownloadUrl: null as string | null,
    isoDownloadUrl: null as string | null,
    startedAt: startStr,
    endedAt:  null as string | null,
    duration: null as string | null,
    executor: currentUser.value?.name ?? 'admin',
    testLink: undefined as string | undefined,
  })
  livePipelineTasks.value = [newTask, ...livePipelineTasks.value]
  OMessage.success(`重试流水线 ${newTask.taskId}，测试执行中...`)
  setTimeout(() => {
    newTask.packageDownloadUrl = `https://repo.openeuler.org/packages/${newTask.taskId}`
    newTask.isoDownloadUrl = `https://iso.openeuler.org/download/${newTask.taskId}`
    OMessage.success(`[${newTask.taskId}] 测试执行中...`)
  }, 3000)
  setTimeout(() => {
    newTask.testStatus = 'success'
    newTask.testLink = `https://test.openeuler.org/${newTask.taskId}`
    newTask.pipelineStatus = 'success'
    const end = new Date()
    const endStr = `${end.getFullYear()}.${end.getMonth()+1}.${end.getDate()} ${String(end.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    newTask.endedAt = endStr
    newTask.duration = '8分钟'
    OMessage.success(`[${newTask.taskId}] 流水线执行完成 ✓`)
  }, 7000)
}

// 文件上传模拟
const handleBuildUpload = async () => { await new Promise(r => setTimeout(r, 600)); return Promise.resolve() }

// ─── 新增项目弹窗 ─────────────────────────────────────────────────────────────
// 包含项目概览所有字段，除"项目ID"（ID由系统自动生成）

interface TimelinePeriod {
  id: string
  startDate: string
  endDate: string
}

interface AddProjectForm {
  name: string
  description: string
  kernelVersion: string
  osVersion: string
  status: string
  owner: string
  targetRepo: string
  forkRepo: string
  modules: string[]
  pipelineId: string
  pipelineName: string
  // 硬件规格
  productVersion: string
  cpuArch: string
  // 时间计划（每个阶段的时间段数组）
  startDate: string
  devPeriods: TimelinePeriod[]
  testPeriods: TimelinePeriod[]
  deliverDate: string
}

const EMPTY_PROJECT: AddProjectForm = {
  name: '', description: '', kernelVersion: '', osVersion: '',
  status: '开发中', owner: '',
  targetRepo: '',
  forkRepo: '',
  modules: [],
  pipelineId: '', pipelineName: '',
  productVersion: '950', cpuArch: 'x86_64',
  startDate: '',
  devPeriods: [{ id: 'dev-p0', startDate: '', endDate: '' }],
  testPeriods: [{ id: 'test-p0', startDate: '', endDate: '' }],
  deliverDate: '',
}

const addProjectDialog = reactive({
  visible: false,
  form: { ...EMPTY_PROJECT } as AddProjectForm,
})

const openAddProjectDialog = () => {
  addProjectDialog.form = {
    ...EMPTY_PROJECT,
    devPeriods: [{ id: 'dev-p0', startDate: '', endDate: '' }],
    testPeriods: [{ id: 'test-p0', startDate: '', endDate: '' }],
  }
  addProjectDialog.visible = true
}

const handleAddProjectConfirm = () => {
  if (!addProjectDialog.form.name.trim()) { OMessage.warning('项目名称不能为空'); return }
  if (!addProjectDialog.form.owner.trim()) { OMessage.warning('负责人不能为空'); return }
  if (!addProjectDialog.form.targetRepo.trim()) { OMessage.warning('目标仓库不能为空'); return }
  if (!addProjectDialog.form.forkRepo.trim()) { OMessage.warning('Fork仓库不能为空'); return }
  if (!addProjectDialog.form.modules.length) { OMessage.warning('模块不能为空'); return }
  if (!addProjectDialog.form.startDate.trim()) { OMessage.warning('启动开始日期不能为空'); return }
  
  // 验证开发时间段
  for (const period of addProjectDialog.form.devPeriods) {
    if (!period.startDate.trim()) { OMessage.warning('开发开始日期不能为空'); return }
    if (!period.endDate.trim()) { OMessage.warning('开发结束日期不能为空'); return }
  }
  
  // 验证测试时间段
  for (const period of addProjectDialog.form.testPeriods) {
    if (!period.startDate.trim()) { OMessage.warning('测试开始日期不能为空'); return }
    if (!period.endDate.trim()) { OMessage.warning('测试结束日期不能为空'); return }
  }
  
  if (!addProjectDialog.form.deliverDate.trim()) { OMessage.warning('交付开始日期不能为空'); return }
  
  OMessage.success(`项目「${addProjectDialog.form.name}」创建成功`)
  addProjectDialog.visible = false
}
</script>

<template>
  <section class="proj-detail">
        <!-- Project selector row -->
    <div class="proj-detail__selector-row">
      <div class="proj-detail__selector-left">
        <span class="proj-detail__selector-label">项目</span>
        <OSelect v-model="selectedProjectId" class="proj-detail__selector" @change="syncForm">
          <OOption v-for="o in projectOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OTag :color="projStatusColor" size="medium" class="proj-detail__status-tag" :class="projStatusClass">{{ project?.status }}</OTag>
      </div>
      <div class="proj-detail__selector-right">
        <OButton variant="outline" color="primary" size="medium" round="pill" @click="openReportDialog">{{ t('project.generateReport') }}</OButton>
        <OButton v-if="isAdmin" variant="solid" color="primary" size="medium" round="pill" @click="openAddProjectDialog">{{ t('project.create') }}</OButton>
      </div>
    </div>

    <!-- Tabs -->
    <OTab v-model="activeTab">
      <!-- ── Tab 1: Overview ── -->
      <OTabPane value="overview" :label="t('project.overview')">
        <!-- 概览区统一操作栏 -->
        <div class="proj-detail__overview-bar">
          <OButton v-if="isAdmin" variant="outline" color="primary" size="medium" round="pill" @click="openEditDialog">编辑</OButton>
        </div>
        <div class="proj-detail__overview">
          <!-- Left: basic info -->
          <OCard class="proj-detail__form-card">
            <div class="proj-detail__section-title">
              <span class="proj-detail__section-bar" />
              {{ t('project.basicInfo') }}
            </div>

            <ODivider darker />

            <div class="proj-detail__info-grid">
              <div class="proj-detail__info-field">
                <label class="proj-detail__info-label">{{ t('project.nameField') }}</label>
                <span class="proj-detail__info-value">{{ project?.name || '—' }}</span>
              </div>
              <div class="proj-detail__info-field">
                <label class="proj-detail__info-label">{{ t('project.idField') }}</label>
                <span class="proj-detail__info-value">{{ project?.projectId || '—' }}</span>
              </div>
              <div class="proj-detail__info-field">
                <label class="proj-detail__info-label">{{ t('project.kernelVersion') }}</label>
                <span class="proj-detail__info-value">{{ project?.kernelVersion || '—' }}</span>
              </div>
              <div class="proj-detail__info-field">
                <label class="proj-detail__info-label">{{ t('project.osVersion') }}</label>
                <span class="proj-detail__info-value">{{ project?.osVersion || '—' }}</span>
              </div>
              <div class="proj-detail__info-field">
                <label class="proj-detail__info-label">{{ t('project.ownerField') }}</label>
                <span class="proj-detail__info-value">{{ project?.owner || '—' }}</span>
              </div>
              <div class="proj-detail__info-field">
                <label class="proj-detail__info-label">{{ t('project.productVersion') }}</label>
                <span class="proj-detail__info-value">{{ project?.productVersions[0] || '—' }}</span>
              </div>
              <div class="proj-detail__info-field">
                <label class="proj-detail__info-label">流水线ID</label>
                <span class="proj-detail__info-value">{{ project?.pipelineId || '—' }}</span>
              </div>
              <div class="proj-detail__info-field">
                <label class="proj-detail__info-label">流水线名称</label>
                <span class="proj-detail__info-value">{{ project?.pipelineName || '—' }}</span>
              </div>
              <div class="proj-detail__info-field">
                <label class="proj-detail__info-label">{{ t('project.moduleField') }}</label>
                <div class="proj-detail__info-value proj-detail__module-tags">
                  <OTag v-for="m in project?.modules" :key="m" color="primary" size="medium" variant="outline">{{ m }}</OTag>
                  <span v-if="!project?.modules?.length">—</span>
                </div>
              </div>
              <div class="proj-detail__info-field">
                <label class="proj-detail__info-label">{{ t('project.cpuArch') }}</label>
                <span class="proj-detail__info-value">{{ project?.cpuArch || '—' }}</span>
              </div>
              <div class="proj-detail__info-field proj-detail__info-field--full">
                <label class="proj-detail__info-label">{{ t('project.descField') }}</label>
                <span class="proj-detail__info-value">{{ project?.description || '—' }}</span>
              </div>
              <div class="proj-detail__info-field">
                <label class="proj-detail__info-label">目标仓库</label>
                <OLink v-if="project?.targetRepo" color="primary" :href="project.targetRepo" target="_blank" class="proj-detail__external-link">
                  {{ project.targetRepo }}
                  <template #suffix>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 2H14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M14 2L9 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M13 9V13C13.5304 14.0391 12.7893 14.7893 12.4142 14.4142C12.0391 14.7893 11.5304 15 11 15H3C2.46957 15 1.96086 14.7893 1.58579 14.4142C1.21071 14.0391 1 13.5304 1 13V5C1.46957 1.21071 3.96086 1.58579 3.58579C1.96086 3.21071 2.46957 3 3 3H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </template>
                </OLink>
                <span v-else class="proj-detail__info-value">—</span>
              </div>
              <div class="proj-detail__info-field">
                <label class="proj-detail__info-label">Fork仓库</label>
                <OLink v-if="project?.forkRepo" color="primary" :href="project.forkRepo" target="_blank" class="proj-detail__external-link">
                  {{ project.forkRepo }}
                  <template #suffix>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 2H14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M14 2L9 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M13 9V13C13.5304 14.0391 12.7893 14.7893 12.4142 14.4142C12.0391 14.7893 11.5304 15 11 15H3C2.46957 15 1.96086 14.7893 1.58579 14.4142C1.21071 14.0391 1 13.5304 1 13V5C1.46957 1.21071 3.96086 1.58579 3.58579C1.96086 3.21071 2.46957 3 3 3H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </template>
                </OLink>
                <span v-else class="proj-detail__info-value">—</span>
              </div>
            </div>
          </OCard>

          <!-- Timeline -->
          <OCard class="proj-detail__timeline-card">
            <div class="proj-detail__timeline-header">
              <div class="proj-detail__section-title">
                <span class="proj-detail__section-bar" />
                {{ t('project.timeline') }}
              </div>
            </div>

          <ODivider darker />

          <!-- ── 时间计划（OStep 水平步骤条，Direction=h, Dark=off）
               规范颜色映射：
                 done    → finished  （success1 背景 + info2 标题）
                 current → processing（primary1 背景 + primary1 标题）
                 pending → waiting   （primary4 背景 + info4 标题）
               连接线：完成段 primary1，等待段 control4
          ── -->
          <div class="proj-timeline-wrap">
            <OStep direction="h" class="proj-timeline-step">
              <OStepItem
                v-for="(node, idx) in localTimeline"
                :key="node.id"
                :step-index="idx"
                :title="node.label"
                :description="formatStepDesc(node)"
                :status="mapStepStatus(node.status)"
              />
            </OStep>
          </div>
          </OCard>
        </div>
      </OTabPane>

      <!-- ── Tab 2: Patches ── -->
      <OTabPane value="patches" :label="t('project.patches')">
        <!-- @view-cases：用户点击"查看对应用例"，切换到用例看板并传入选中的 patchIds -->
        <PatchTab
          v-if="selectedProjectId"
          :project-id="selectedProjectId"
          :target-repo="project?.targetRepo || ''"
          @view-cases="handleViewCases"
        />
      </OTabPane>

      <!-- ── Tab 3: Test Cases ── -->
      <OTabPane value="testcases" :label="t('project.testcases')">
        <TestCaseTab
          v-if="selectedProjectId"
          :project-id="selectedProjectId"
          :patch-ids="viewCasePatchIds"
          @run-pipeline="handleRunPipeline"
        />
      </OTabPane>

      <!-- ── Tab 4: Pipeline Console ── -->
      <OTabPane value="pipeline" :label="t('project.pipeline')">
        <div class="proj-detail__pipeline">
          <!-- 步骤状态图（OStep 水平步骤条，与时间计划样式一致） -->
          <div class="pl-steps-wrap">
            <OStep direction="h" class="pl-steps">
              <OStepItem :step-index="1" title="包构建" status="processing" />
              <OStepItem :step-index="2" title="ISO构建" status="processing" />
              <OStepItem :step-index="3" title="用例测试" status="processing" />
            </OStep>
          </div>

          <!-- 执行配置区（原弹窗内容移至此处，普通用户只读） -->
          <div class="proj-detail__pipeline-execute">
            <!-- ① 构建区 -->
            <div class="pl-execute__section-title">
              <span class="pl-execute__bar" />构建区
            </div>
            <div class="pl-execute__build-options">
              <div
                class="pl-execute__build-card"
                :class="{ 'pl-execute__build-card--active': pipelineDialog.buildMode === 'auto' }"
                @click="pipelineDialog.buildMode = 'auto'"
              >
                <ORadioGroup v-model="pipelineDialog.buildMode" direction="horizontal">
                  <ORadio value="auto">自动编译流水线</ORadio>
                </ORadioGroup>
                <p class="pl-execute__build-desc">
                  基线版本：openEuler-24.03-LTS，自动编译当前项目范围内待合入补丁，默认集群执行
                </p>
              </div>
              <div
                class="pl-execute__build-card"
                :class="{ 'pl-execute__build-card--active': pipelineDialog.buildMode === 'manual' }"
                @click="pipelineDialog.buildMode = 'manual'"
              >
                <ORadioGroup v-model="pipelineDialog.buildMode" direction="horizontal">
                  <ORadio value="manual">手动上传</ORadio>
                </ORadioGroup>
                <div v-if="pipelineDialog.buildMode === 'manual'" class="pl-execute__upload-area">
                  <OUpload
                    v-model="pipelineDialog.uploadFiles"
                    accept=".rpm,.tar.gz,.zip"
                    :multiple="false"
                    :upload-request="handleBuildUpload"
                    btn-label="选择构建包"
                  />
                </div>
              </div>
            </div>

            <!-- ② 用例测试区 -->
            <div class="pl-execute__section-title pl-execute__section-title--mt">
              <span class="pl-execute__bar" />用例测试区
              <span class="pl-execute__case-count">
                已选 <strong>{{ dialogSelectedIds.length }}</strong> / {{ dialogCases.length }} 个用例（默认全选该项目对应的所有用例）
              </span>
              <OButton variant="outline" color="primary" size="small" round="pill" @click="caseEditDialog.visible = true">编辑</OButton>
            </div>

            <div class="pl-execute__case-summary">
              <div v-for="c in selectedCaseSummary" :key="c.id" class="pl-execute__case-item">
                <OTag color="info" size="medium" variant="outline">{{ c.level }}</OTag>
                <span class="pl-execute__cell-name">{{ c.name }}</span>
                <span class="pl-execute__cell-id">{{ c.testId }}</span>
              </div>
              <div v-if="dialogSelectedIds.length > 5" class="pl-execute__case-more">
                ... 等 {{ dialogSelectedIds.length - 5 }} 个用例
              </div>
            </div>

            <!-- 底部操作按钮 -->
            <div class="pl-execute__footer">
              <OButton variant="outline" color="primary" size="medium" round="pill" @click="pipelineDialog.visible = false">取消</OButton>
              <OButton variant="solid" color="primary" size="medium" round="pill" @click="executePipeline">执行流水线</OButton>
            </div>
          </div>

          <!-- 流水线历史记录表格 -->
          <h3 class="proj-detail__table-title">流水线历史记录表格</h3>

          <div class="pipeline-table-container">
            <div class="pipeline-table-wrap" :style="{ '--pipeline-table-min-width': pipelineTableMinWidth, 'max-height': '600px' }">
            <OTable :columns="pipelineColumns" :data="pagedPipelineTasks">
              <template #td_taskId="{ row }">
                <span class="pipeline-task-id">{{ row.taskId }}</span>
              </template>
              <template #td_pipelineStatus="{ row }">
                <OTag :color="pipelineStatusColor(row.pipelineStatus)" size="medium">
                  {{ pipelineStatusLabel(row.pipelineStatus) }}
                </OTag>
              </template>
              <template #td_testStatus="{ row }">
                <div v-if="row.testStatus === 'success'" class="pl-status-cell">
                  <OTag color="success" size="medium">成功</OTag>
                  <OLink v-if="row.testLink" color="primary" :href="row.testLink" target="_blank" class="pl-status-link">
                    {{ row.testLink }}
                    <template #suffix>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 2H14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14 2L9 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M13 9V13C13 13.5304 12.7893 14.0391 12.4142 14.4142C12.0391 14.7893 11.5304 15 11 15H3C2.46957 15 1.96086 14.7893 1.58579 14.4142C1.21071 14.0391 1 13.5304 1 13V5C1 4.46957 1.21071 3.96086 1.58579 3.58579C1.96086 3.21071 2.46957 3 3 3H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </template>
                  </OLink>
                </div>
                <OTag v-else-if="row.testStatus === 'failed'" color="danger" size="medium">失败</OTag>
                <span v-else class="pl-execute__muted">—</span>
              </template>
              <template #td_packageDownloadUrl="{ row }">
                <OLink v-if="row.packageDownloadUrl" color="primary" :href="row.packageDownloadUrl" target="_blank" class="pl-status-link">
                  {{ row.packageDownloadUrl }}
                  <template #suffix>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 2H14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M14 2L9 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M13 9V13C13 13.5304 12.7893 14.0391 12.4142 14.4142C12.0391 14.7893 11.5304 15 11 15H3C2.46957 15 1.96086 14.7893 1.58579 14.4142C1.21071 14.0391 1 13.5304 1 13V5C1 4.46957 1.21071 3.96086 1.58579 3.58579C1.96086 3.21071 2.46957 3 3 3H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </template>
                </OLink>
                <span v-else class="pl-execute__muted">—</span>
              </template>
              <template #td_isoDownloadUrl="{ row }">
                <OLink v-if="row.isoDownloadUrl" color="primary" :href="row.isoDownloadUrl" target="_blank" class="pl-status-link">
                  {{ row.isoDownloadUrl }}
                  <template #suffix>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 2H14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M14 2L9 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M13 9V13C13 13.5304 12.7893 14.0391 12.4142 14.4142C12.0391 14.7893 11.5304 15 11 15H3C2.46957 15 1.96086 14.7893 1.58579 14.4142C1.21071 14.0391 1 13.5304 1 13V5C1 4.46957 1.21071 3.96086 1.58579 3.58579C1.96086 3.21071 2.46957 3 3 3H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </template>
                </OLink>
                <span v-else class="pl-execute__muted">—</span>
              </template>
              <template #td_startedAt="{ row }">
                <div class="pipeline-datetime">
                  <span class="pipeline-datetime__date">{{ formatDateTime(row.startedAt).date }}</span>
                  <span class="pipeline-datetime__time">{{ formatDateTime(row.startedAt).time }}</span>
                </div>
              </template>
              <template #td_endedAt="{ row }">
                <div class="pipeline-datetime">
                  <span class="pipeline-datetime__date">{{ formatDateTime(row.endedAt).date }}</span>
                  <span class="pipeline-datetime__time">{{ formatDateTime(row.endedAt).time }}</span>
                </div>
              </template>
              <template #td_duration="{ row }">{{ row.duration ?? t('misc.dash') }}</template>
              <template #td_action="{ row }">
                <OButton variant="outline" color="primary" size="small" round="pill" :disabled="row.pipelineStatus !== 'failed'" @click="retryPipeline(row)">{{ t('pipeline.retry') }}</OButton>
              </template>
            </OTable>
            </div>
            <!-- 分页器 -->
            <div class="proj-detail__pipeline-pagination">
              <OPagination
                :total="pipelineTasks.length"
                :page="pipelineCurrentPage"
                :page-size="pipelinePageSize"
                @change="onPipelinePageChange"
              />
            </div>
          </div>
        </div>
      </OTabPane>
    </OTab>

    <!-- ══ 编辑项目信息弹窗（基本信息 + 时间计划合并）══════════════════════════ -->
    <ODialog v-model:visible="editDialog.visible" title="编辑项目信息" size="exlarge">
      <div class="edit-proj-form">
        <!-- ① 基本信息 -->
        <div class="edit-proj-form__section-title">
          <span class="edit-proj-form__bar" />基本信息
        </div>
        <div class="edit-proj-form__grid">
          <div class="edit-proj-form__field">
            <label class="edit-proj-form__label"><span class="edit-proj-form__required">*</span>项目名称</label>
            <OInput v-model="editForm.name" placeholder="请输入项目名称" clearable />
          </div>
          <div class="edit-proj-form__field">
            <label class="edit-proj-form__label">项目ID</label>
            <OInput :model-value="project?.projectId" disabled />
          </div>
          <div class="edit-proj-form__field edit-proj-form__field--full">
            <label class="edit-proj-form__label">项目描述</label>
            <OTextarea v-model="editForm.description" placeholder="请输入项目描述" :rows="3" />
          </div>
          <div class="edit-proj-form__field">
            <label class="edit-proj-form__label"><span class="edit-proj-form__required">*</span>内核版本</label>
            <OInput v-model="editForm.kernelVersion" placeholder="例：5.10" clearable />
          </div>
          <div class="edit-proj-form__field">
            <label class="edit-proj-form__label"><span class="edit-proj-form__required">*</span>OS版本</label>
            <OInput v-model="editForm.osVersion" placeholder="例：openEuler 24.03 LTS" clearable />
          </div>
          <div class="edit-proj-form__field">
            <label class="edit-proj-form__label"><span class="edit-proj-form__required">*</span>项目状态</label>
            <OSelect v-model="editForm.status">
              <OOption value="开发中" label="开发中" />
              <OOption value="测试中" label="测试中" />
              <OOption value="已完成" label="已完成" />
            </OSelect>
          </div>
          <div class="edit-proj-form__field edit-proj-form__field--full">
            <label class="edit-proj-form__label"><span class="edit-proj-form__required">*</span>模块</label>
            <div class="edit-module-area">
              <div v-if="originalModules.length" class="edit-module-area__locked">
                <span class="edit-module-area__locked-label">已有模块：</span>
                <OTag v-for="m in originalModules" :key="m" color="primary" size="medium" variant="outline" class="edit-module-area__locked-tag">{{ m }}</OTag>
              </div>
              <div class="edit-module-area__add">
                <span class="edit-module-area__add-label">新增模块：</span>
                <OSelect v-model="editForm.modules" multiple :max-tag-count="3" :before-select="handleEditModuleAddOnly" clearable class="edit-module-area__add-select">
                  <OOption v-for="m in MODULE_OPTIONS" :key="m" :value="m" :label="m" :disabled="originalModules.includes(m)" />
                </OSelect>
              </div>
            </div>
          </div>
          <div class="edit-proj-form__field">
            <label class="edit-proj-form__label"><span class="edit-proj-form__required">*</span>负责人</label>
            <OInput v-model="editForm.owner" placeholder="请输入负责人" clearable />
          </div>
          <div class="edit-proj-form__field">
            <label class="edit-proj-form__label"><span class="edit-proj-form__required">*</span>产品版本</label>
            <OSelect v-model="editForm.productVersion">
              <OOption value="950" label="950" />
              <OOption value="950Pro" label="950Pro" />
              <OOption value="920" label="920" />
            </OSelect>
          </div>
          <div class="edit-proj-form__field">
            <label class="edit-proj-form__label"><span class="edit-proj-form__required">*</span>CPU架构</label>
            <OSelect v-model="editForm.cpuArch">
              <OOption value="x86_64" label="x86_64" />
              <OOption value="aarch64" label="aarch64" />
            </OSelect>
          </div>
          <div class="edit-proj-form__field edit-proj-form__field--full">
            <label class="edit-proj-form__label"><span class="edit-proj-form__required">*</span>目标仓库</label>
            <OInput v-model="editForm.targetRepo" placeholder="例：https://gitcode.com/openeuler/kernel" clearable />
          </div>
          <div class="edit-proj-form__field edit-proj-form__field--full">
            <label class="edit-proj-form__label"><span class="edit-proj-form__required">*</span>Fork仓库</label>
            <OInput v-model="editForm.forkRepo" placeholder="例：https://gitcode.com/zhangming/kernel" clearable />
          </div>
          <div class="edit-proj-form__field">
            <label class="edit-proj-form__label">流水线ID</label>
            <OInput v-model="editForm.pipelineId" placeholder="例：PL-001（非必填）" clearable />
          </div>
          <div class="edit-proj-form__field">
            <label class="edit-proj-form__label">流水线名称</label>
            <OInput v-model="editForm.pipelineName" placeholder="例：Kernel编译流水线（非必填）" clearable />
          </div>
        </div>

        <ODivider />

        <!-- ② 时间计划（OStep 步骤条 + 日期编辑） -->
        <div class="edit-proj-form__section-title">
          <span class="edit-proj-form__bar" />时间计划
        </div>

        <div class="edit-timeline-wrap">
          <OStep direction="h" class="edit-timeline-step">
            <OStepItem
              v-for="(node, idx) in editingTimeline"
              :key="node.id"
              :step-index="idx"
              :title="node.label"
              :status="mapStepStatus(node.status)"
            />
          </OStep>
        </div>

        <div class="edit-tl-cards">
          <div
            v-for="(node, nodeIdx) in editingTimeline"
            :key="node.id"
            class="edit-tl-card"
          >
            <div class="edit-tl-card__header">
              <div class="edit-tl-card__title">
                <span>{{ node.label }}</span>
                <span v-if="!node.isFixed" class="edit-tl-card__multi">可多时段</span>
              </div>
              <OButton
                v-if="!node.isFixed"
                variant="text" color="primary" size="small"
                @click="addEditPeriod(node)"
              >+ 新增时间段</OButton>
            </div>
            <ODivider class="edit-tl-card__divider" />
            <div class="edit-tl-periods">
              <div
                v-for="(period, pIdx) in node.periods"
                :key="period.id"
                class="edit-tl-period-row"
              >
                <div class="edit-tl-field">
                  <div class="edit-tl-label-row">
                    <label class="edit-tl-label"><span class="edit-proj-form__required">*</span>开始日期</label>
                    <span v-if="!node.isFixed" class="edit-tl-period-idx">第{{ pIdx + 1 }}段</span>
                    <OButton
                      v-if="!node.isFixed && node.periods.length > 1"
                      variant="text" color="danger" size="small"
                      class="edit-tl-del-btn"
                      @click="deleteEditPeriod(node, period.id)"
                    >删除</OButton>
                  </div>
                  <OInput v-model="period.startDate" placeholder="YYYY/MM/DD" clearable />
                </div>
                <div v-if="!node.isFixed" class="edit-tl-field">
                  <label class="edit-tl-label"><span class="edit-proj-form__required">*</span>结束日期</label>
                  <OInput v-model="period.endDate" placeholder="YYYY/MM/DD" clearable />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="edit-proj-footer">
          <OButton variant="outline" color="primary" size="medium" round="pill" @click="editDialog.visible = false">取消</OButton>
          <OButton variant="solid" color="primary" size="medium" round="pill" @click="handleEditConfirm">保存</OButton>
        </div>
      </template>
    </ODialog>

    <!-- ══ 用例编辑弹窗 ══════════════════════════════════════════════════════════
         入口：用例测试区的"编辑"按钮
         展示筛选器+用例看板表格，允许勾选/取消用例
    ══ -->
    <ODialog v-model:visible="caseEditDialog.visible" title="编辑用例选择" size="exlarge">
      <div class="pl-dialog">
        <div class="pl-dialog__section-title">
          <span class="pl-dialog__bar" />用例看板
          <span class="pl-dialog__case-count">
            已选 <strong>{{ dialogSelectedIds.length }}</strong> / {{ dialogCases.length }} 个用例
          </span>
        </div>

        <div class="pl-dialog__filter">
          <OSelect v-model="dialogFilter.level" placeholder="用例级别" variant="outline" searchable size="medium"
            class="pl-dialog__filter-sel" @change="dialogPage = 1">
            <OOption v-for="o in dialogLevelOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
          <OSelect v-model="dialogFilter.testType" placeholder="测试类型" variant="outline" searchable size="medium"
            class="pl-dialog__filter-sel" @change="dialogPage = 1">
            <OOption v-for="o in dialogTypeOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
          <OSelect v-model="dialogFilter.autoStatus" placeholder="自动化类型" variant="outline" searchable size="medium"
            class="pl-dialog__filter-sel" @change="dialogPage = 1">
            <OOption v-for="o in dialogAutoOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
          <OSelect v-model="dialogFilter.execResult" placeholder="用例执行结果" variant="outline" searchable size="medium"
            class="pl-dialog__filter-sel pl-dialog__filter-sel--wide" @change="dialogPage = 1">
            <OOption v-for="o in dialogResultOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
          <OLink color="primary" class="pl-dialog__filter-clear" @click="clearDialogFilter">清除筛选</OLink>
        </div>

        <div class="pl-dialog__table-wrap" :style="{ '--tc-table-min-width': dialogTableMinWidth }">
          <OTable :columns="dialogCaseColumns" :data="dialogPagedCases">
            <template #th_select>
              <OCheckbox v-model="dialogAllChecked" />
            </template>
            <template #td_select="{ row }">
              <OCheckbox v-model="dialogSelectedIds" :value="row.id" />
            </template>
            <template #td_name="{ row }">
              <span class="pl-dialog__cell-name">{{ row.name }}</span>
            </template>
            <template #td_testId="{ row }">
              <span class="pl-dialog__cell-id">{{ row.testId }}</span>
            </template>
            <template #td_mainKey="{ row }">
              <span class="pl-dialog__cell-id">{{ row.mainKey }}</span>
            </template>
            <template #td_level="{ row }">
              <OTag color="info" size="medium" variant="outline">{{ row.level }}</OTag>
            </template>
            <template #td_precondition="{ row }">
              <span class="pl-dialog__cell-text">{{ row.precondition }}</span>
            </template>
            <template #td_testSteps="{ row }">
              <span class="pl-dialog__cell-text">{{ row.testSteps }}</span>
            </template>
            <template #td_expectedResult="{ row }">
              <span class="pl-dialog__cell-text">{{ row.expectedResult }}</span>
            </template>
            <template #td_automationScript="{ row }">
              <span class="pl-dialog__cell-script">{{ row.automationScript }}</span>
            </template>
            <template #td_lastExecResult="{ row }">
              <OTag :color="dlgExecColor(row.lastExecResult)" size="medium">
                {{ dlgExecLabel(row.lastExecResult) }}
              </OTag>
            </template>
            <template #td_testCaseModule="{ row }">
              <span class="pl-dialog__cell-plain">{{ row.testCaseModule || '—' }}</span>
            </template>
            <template #td_lastExecutor="{ row }">
              <span class="pl-dialog__cell-plain">{{ row.lastExecutor || '—' }}</span>
            </template>
            <template #td_testType="{ row }">
              <span class="pl-dialog__cell-plain">{{ dlgTypeLabel(row.testType) }}</span>
            </template>
            <template #td_isAutomated="{ row }">
              <OTag :color="row.isAutomated ? 'success' : 'danger'" size="medium">
                {{ row.isAutomated ? 'TRUE' : 'FALSE' }}
              </OTag>
            </template>
          </OTable>
        </div>

        <div class="pl-dialog__pagination">
          <OPagination
            :total="dialogCases.length"
            :page="dialogPage"
            :page-size="dialogPageSize"
            @change="onDialogPageChange"
          />
        </div>
      </div>

      <template #footer>
        <div class="pl-dialog__footer">
          <OButton variant="outline" color="primary" size="medium" round="pill" @click="caseEditDialog.visible = false">确认</OButton>
        </div>
      </template>
    </ODialog>

    <!-- ══ 一键执行流水线弹窗 ══════════════════════════════════════════════════════
         入口：流水线控制台 tab 的"一键执行流水线"按钮
         分两区：① 构建区（自动/手动二选一）② 用例选择区（默认全选 or 来自跳转的用例）
    ══ -->
    <ODialog
      v-model:visible="pipelineDialog.visible"
      title="一键执行流水线"
      size="exlarge"
    >
      <div class="pl-dialog">

        <div v-if="!project?.pipelineId.trim() || !project?.pipelineName.trim()" class="pl-dialog__warning">
          <span class="pl-dialog__warning-icon">⚠</span>
          当前项目未配置流水线ID或流水线名称，无法启动流水线。请先在项目基本信息中补充这两项。
        </div>

        <!-- 步骤状态图（OStep 水平步骤条） -->
        <OStep direction="h" class="pl-dialog__steps">
          <OStepItem :step-index="1" title="包构建" status="processing" />
          <OStepItem :step-index="2" title="ISO构建" status="processing" />
          <OStepItem :step-index="3" title="用例测试" status="processing" />
        </OStep>

        <!-- ① 构建区 -->
        <div class="pl-dialog__section-title">
          <span class="pl-dialog__bar" />构建区
        </div>
        <ORadioGroup v-model="pipelineDialog.buildMode" class="pl-dialog__build-group">
          <!-- 自动编译 -->
          <div
            class="pl-dialog__build-card"
            :class="{ 'pl-dialog__build-card--active': pipelineDialog.buildMode === 'auto' }"
            @click="pipelineDialog.buildMode = 'auto'"
          >
            <ORadio value="auto" class="pl-dialog__build-radio">自动编译流水线</ORadio>
            <p class="pl-dialog__build-desc">
              基线版本：openEuler-24.03-LTS，自动编译当前项目范围内待合入补丁，默认集群执行
            </p>
          </div>
          <!-- 手动上传 -->
          <div
            class="pl-dialog__build-card"
            :class="{ 'pl-dialog__build-card--active': pipelineDialog.buildMode === 'manual' }"
            @click="pipelineDialog.buildMode = 'manual'"
          >
            <ORadio value="manual" class="pl-dialog__build-radio">手动上传</ORadio>
            <div v-if="pipelineDialog.buildMode === 'manual'" class="pl-dialog__upload-area">
              <OUpload
                v-model="pipelineDialog.uploadFiles"
                accept=".rpm,.tar.gz,.zip"
                :multiple="false"
                :upload-request="handleBuildUpload"
                btn-label="选择构建包"
              />
            </div>
          </div>
        </ORadioGroup>

        <ODivider />

        <!-- ② 用例测试区 -->
        <div class="pl-dialog__section-title">
          <span class="pl-dialog__bar" />用例测试区
          <span class="pl-dialog__case-count">
            已选 <strong>{{ dialogSelectedIds.length }}</strong> / {{ dialogCases.length }} 个用例（默认全选该项目对应的所有用例）
          </span>
          <OButton variant="outline" color="primary" size="small" round="pill" @click="caseEditDialog.visible = true">编辑</OButton>
        </div>

        <div class="pl-dialog__case-summary">
          <div v-for="c in selectedCaseSummary" :key="c.id" class="pl-dialog__case-item">
            <OTag color="info" size="medium" variant="outline">{{ c.level }}</OTag>
            <span class="pl-dialog__cell-name">{{ c.name }}</span>
            <span class="pl-dialog__cell-id">{{ c.testId }}</span>
          </div>
          <div v-if="dialogSelectedIds.length > 5" class="pl-dialog__case-more">
            ... 等 {{ dialogSelectedIds.length - 5 }} 个用例
          </div>
        </div>
      </div>

      <template #footer>
        <div class="pl-dialog__footer">
          <OButton variant="outline" color="primary" size="medium" round="pill" @click="pipelineDialog.visible = false">取消</OButton>
          <OButton variant="solid" color="primary" size="medium" round="pill" @click="executePipeline">
            执行流水线
          </OButton>
        </div>
      </template>
    </ODialog>

    <!-- ══ 新增项目弹窗 ══════════════════════════════════════════════════════════
         包含项目概览所有字段，除「项目ID」（系统自动生成）
         分三区：基本信息 / 硬件规格 / 时间计划
    ══ -->
    <ODialog v-model:visible="addProjectDialog.visible" title="新增项目" size="large">
      <div class="add-proj-form">

        <!-- 基本信息 -->
        <div class="add-proj-form__section-title">
          <span class="add-proj-form__bar" />基本信息
        </div>
        <div class="add-proj-form__grid">
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">
              <span class="add-proj-form__required">*</span>项目名称
            </label>
            <OInput v-model="addProjectDialog.form.name" placeholder="请输入项目名称" clearable />
          </div>
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">
              <span class="add-proj-form__required">*</span>负责人
            </label>
            <OInput v-model="addProjectDialog.form.owner" placeholder="请输入负责人姓名" clearable />
          </div>
          <div class="add-proj-form__field add-proj-form__field--full">
            <label class="add-proj-form__label">
              <span class="add-proj-form__required">*</span>项目描述
            </label>
            <OTextarea v-model="addProjectDialog.form.description" placeholder="请输入项目描述" :rows="3" />
          </div>
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">
              <span class="add-proj-form__required">*</span>内核版本
            </label>
            <OInput v-model="addProjectDialog.form.kernelVersion" placeholder="例：5.10" clearable />
          </div>
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">
              <span class="add-proj-form__required">*</span>OS版本
            </label>
            <OInput v-model="addProjectDialog.form.osVersion" placeholder="例：openEuler 24.03 LTS" clearable />
          </div>
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">
              <span class="add-proj-form__required">*</span>项目状态
            </label>
            <OSelect v-model="addProjectDialog.form.status">
              <OOption value="开发中" label="开发中" />
              <OOption value="测试中" label="测试中" />
              <OOption value="已完成" label="已完成" />
            </OSelect>
          </div>
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">
              <span class="add-proj-form__required">*</span>模块
            </label>
            <OSelect v-model="addProjectDialog.form.modules" multiple :max-tag-count="3" clearable>
              <OOption v-for="m in MODULE_OPTIONS" :key="m" :value="m" :label="m" />
            </OSelect>
          </div>
          <div class="add-proj-form__field add-proj-form__field--full">
            <label class="add-proj-form__label">
              <span class="add-proj-form__required">*</span>目标仓库
            </label>
            <OInput v-model="addProjectDialog.form.targetRepo" placeholder="例：https://gitcode.com/openeuler/kernel" clearable />
          </div>
          <div class="add-proj-form__field add-proj-form__field--full">
            <label class="add-proj-form__label">
              <span class="add-proj-form__required">*</span>Fork仓库
            </label>
            <OInput v-model="addProjectDialog.form.forkRepo" placeholder="例：https://gitcode.com/zhangming/kernel" clearable />
          </div>
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">流水线ID</label>
            <OInput v-model="addProjectDialog.form.pipelineId" placeholder="例：PL-001（非必填）" clearable />
          </div>
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">流水线名称</label>
            <OInput v-model="addProjectDialog.form.pipelineName" placeholder="例：Kernel编译流水线（非必填）" clearable />
          </div>
        </div>

        <ODivider darker />

        <!-- 硬件规格 -->
        <div class="add-proj-form__section-title">
          <span class="add-proj-form__bar" />硬件规格
        </div>
        <div class="add-proj-form__grid">
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">
              <span class="add-proj-form__required">*</span>产品版本
            </label>
            <OSelect v-model="addProjectDialog.form.productVersion">
              <OOption value="950"    label="950" />
              <OOption value="950Pro" label="950Pro" />
              <OOption value="920"    label="920" />
            </OSelect>
          </div>
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">
              <span class="add-proj-form__required">*</span>CPU架构
            </label>
            <OSelect v-model="addProjectDialog.form.cpuArch">
              <OOption value="x86_64"  label="x86_64" />
              <OOption value="aarch64" label="aarch64" />
            </OSelect>
          </div>
        </div>

        <ODivider darker />

        <!-- 时间计划（与编辑弹窗格式一致） -->
        <div class="add-proj-form__section-title">
          <span class="add-proj-form__bar" />时间计划
          <span class="add-proj-form__required">*</span>
          <span class="add-proj-form__hint">日期格式：YYYY/MM/DD</span>
        </div>

        <div class="add-tl-cards">
          <!-- 启动 -->
          <div class="add-tl-card">
            <div class="add-tl-card__header">
              <div class="add-tl-card__title">
                <span>启动</span>
              </div>
            </div>
            <ODivider class="add-tl-card__divider" />
            <div class="add-tl-periods">
              <div class="edit-tl-field">
                <label class="edit-tl-label"><span class="edit-proj-form__required">*</span>开始日期</label>
                <OInput v-model="addProjectDialog.form.startDate" placeholder="YYYY/MM/DD" clearable />
              </div>
            </div>
          </div>
          <!-- 开发 -->
          <div class="add-tl-card">
            <div class="add-tl-card__header">
              <div class="add-tl-card__title">
                <span>开发</span>
                <span class="edit-tl-card__multi">可多时段</span>
              </div>
              <OButton variant="text" color="primary" size="small" @click="addProjectDialog.form.devPeriods.push({ id: `dev-p${Date.now()}`, startDate: '', endDate: '' })">
                + 新增时间段
              </OButton>
            </div>
            <ODivider class="add-tl-card__divider" />
            <div class="add-tl-periods">
              <div v-for="(period, idx) in addProjectDialog.form.devPeriods" :key="period.id" class="edit-tl-period-row">
                <div class="edit-tl-field">
                  <div class="edit-tl-label-row">
                    <label class="edit-tl-label"><span class="edit-proj-form__required">*</span>开始日期</label>
                    <span class="edit-tl-period-idx">第{{ idx + 1 }}段</span>
                    <OButton v-if="addProjectDialog.form.devPeriods.length > 1" variant="text" color="danger" size="small" class="edit-tl-del-btn" @click="addProjectDialog.form.devPeriods.splice(idx, 1)">
                      删除
                    </OButton>
                  </div>
                  <OInput v-model="period.startDate" placeholder="YYYY/MM/DD" clearable />
                </div>
                <div class="edit-tl-field">
                  <label class="edit-tl-label"><span class="edit-proj-form__required">*</span>结束日期</label>
                  <OInput v-model="period.endDate" placeholder="YYYY/MM/DD" clearable />
                </div>
              </div>
            </div>
          </div>
          <!-- 测试 -->
          <div class="add-tl-card">
            <div class="add-tl-card__header">
              <div class="add-tl-card__title">
                <span>测试</span>
                <span class="edit-tl-card__multi">可多时段</span>
              </div>
              <OButton variant="text" color="primary" size="small" @click="addProjectDialog.form.testPeriods.push({ id: `test-p${Date.now()}`, startDate: '', endDate: '' })">
                + 新增时间段
              </OButton>
            </div>
            <ODivider class="add-tl-card__divider" />
            <div class="add-tl-periods">
              <div v-for="(period, idx) in addProjectDialog.form.testPeriods" :key="period.id" class="edit-tl-period-row">
                <div class="edit-tl-field">
                  <div class="edit-tl-label-row">
                    <label class="edit-tl-label"><span class="edit-proj-form__required">*</span>开始日期</label>
                    <span class="edit-tl-period-idx">第{{ idx + 1 }}段</span>
                    <OButton v-if="addProjectDialog.form.testPeriods.length > 1" variant="text" color="danger" size="small" class="edit-tl-del-btn" @click="addProjectDialog.form.testPeriods.splice(idx, 1)">
                      删除
                    </OButton>
                  </div>
                  <OInput v-model="period.startDate" placeholder="YYYY/MM/DD" clearable />
                </div>
                <div class="edit-tl-field">
                  <label class="edit-tl-label"><span class="edit-proj-form__required">*</span>结束日期</label>
                  <OInput v-model="period.endDate" placeholder="YYYY/MM/DD" clearable />
                </div>
              </div>
            </div>
          </div>
          <!-- 交付 -->
          <div class="add-tl-card">
            <div class="add-tl-card__header">
              <div class="add-tl-card__title">
                <span>交付</span>
              </div>
            </div>
            <ODivider class="add-tl-card__divider" />
            <div class="add-tl-periods">
              <div class="edit-tl-field">
                <label class="edit-tl-label"><span class="edit-proj-form__required">*</span>开始日期</label>
                <OInput v-model="addProjectDialog.form.deliverDate" placeholder="YYYY/MM/DD" clearable />
              </div>
            </div>
          </div>
        </div>

      </div>

      <template #footer>
        <div class="add-proj-footer">
          <OButton variant="outline" color="primary" size="medium" round="pill" @click="addProjectDialog.visible = false">取消</OButton>
          <OButton variant="solid" color="primary" size="medium" round="pill" @click="handleAddProjectConfirm">确认创建</OButton>
        </div>
      </template>
    </ODialog>

    <!-- ══ 出口评审报告弹窗 ════════════════════════════════════════════════════════ -->
    <ODialog v-model:visible="reportDialog.visible" title="出口评审报告" size="large">
      <div class="report-dialog">
        <!-- 基本信息 -->
        <div class="report-dialog__section">
          <div class="report-dialog__section-title">
            <span class="report-dialog__bar" />基本信息
          </div>
          <div class="report-dialog__info-grid">
            <div class="report-dialog__info-item">
              <span class="report-dialog__info-label">项目名称</span>
              <span class="report-dialog__info-value">{{ project?.name || '—' }}</span>
            </div>
            <div class="report-dialog__info-item">
              <span class="report-dialog__info-label">客户</span>
              <span class="report-dialog__info-value">{{ project?.customer || '—' }}</span>
            </div>
            <div class="report-dialog__info-item">
              <span class="report-dialog__info-label">硬件</span>
              <span class="report-dialog__info-value">{{ project?.cpuArch || '—' }}</span>
            </div>
            <div class="report-dialog__info-item">
              <span class="report-dialog__info-label">OS版本</span>
              <span class="report-dialog__info-value">{{ project?.osVersion || '—' }}</span>
            </div>
            <div class="report-dialog__info-item">
              <span class="report-dialog__info-label">内核版本</span>
              <span class="report-dialog__info-value">{{ project?.kernelVersion || '—' }}</span>
            </div>
            <div class="report-dialog__info-item">
              <span class="report-dialog__info-label">项目状态</span>
              <OTag :color="projStatusColor" size="medium" :class="projStatusClass">{{ project?.status || '—' }}</OTag>
            </div>
          </div>
        </div>

        <ODivider />

        <!-- 补丁统计 -->
        <div class="report-dialog__section">
          <div class="report-dialog__section-title">
            <span class="report-dialog__bar" />补丁统计
          </div>
          <div class="report-dialog__stats-grid">
            <div class="report-dialog__stat-card">
              <span class="report-dialog__stat-value">{{ patchStats.total }}</span>
              <span class="report-dialog__stat-label">总数</span>
            </div>
            <div class="report-dialog__stat-card report-dialog__stat-card--success">
              <span class="report-dialog__stat-value">{{ patchStats.merged }}</span>
              <span class="report-dialog__stat-label">已合入</span>
            </div>
            <div class="report-dialog__stat-card report-dialog__stat-card--warning">
              <span class="report-dialog__stat-value">{{ patchStats.pending }}</span>
              <span class="report-dialog__stat-label">待处理</span>
            </div>
            <div class="report-dialog__stat-card report-dialog__stat-card--danger">
              <span class="report-dialog__stat-value">{{ patchStats.conflict }}</span>
              <span class="report-dialog__stat-label">冲突</span>
            </div>
          </div>
        </div>

        <ODivider />

        <!-- 用例统计 -->
        <div class="report-dialog__section">
          <div class="report-dialog__section-title">
            <span class="report-dialog__bar" />用例统计
          </div>
          <div class="report-dialog__stats-grid">
            <div class="report-dialog__stat-card">
              <span class="report-dialog__stat-value">{{ testCaseStats.total }}</span>
              <span class="report-dialog__stat-label">总数</span>
            </div>
            <div class="report-dialog__stat-card report-dialog__stat-card--success">
              <span class="report-dialog__stat-value">{{ testCaseStats.passed }}</span>
              <span class="report-dialog__stat-label">通过</span>
            </div>
            <div class="report-dialog__stat-card report-dialog__stat-card--danger">
              <span class="report-dialog__stat-value">{{ testCaseStats.failed }}</span>
              <span class="report-dialog__stat-label">失败</span>
            </div>
            <div class="report-dialog__stat-card report-dialog__stat-card--warning">
              <span class="report-dialog__stat-value">{{ testCaseStats.blocked }}</span>
              <span class="report-dialog__stat-label">阻塞</span>
            </div>
            <div class="report-dialog__stat-card report-dialog__stat-card--info">
              <span class="report-dialog__stat-value">{{ testCaseStats.unavailable }}</span>
              <span class="report-dialog__stat-label">不可用</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="report-dialog__footer">
          <OButton variant="outline" color="primary" size="medium" round="pill" @click="reportDialog.visible = false">关闭</OButton>
        </div>
      </template>
    </ODialog>

  </section>
</template>

<style lang="scss" scoped>
.proj-detail {
  &__notice {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    padding: var(--o-r-gap-3) var(--o-r-gap-4);
    margin-bottom: var(--o-r-gap-4);
    background-color: var(--o-color-primary4-light);
    border-radius: var(--o-radius_control-m);
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
  }

  &__notice-icon { color: var(--o-color-primary1); font-size: var(--o-r-font_size-text1); }

  &__selector-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--o-r-gap-4);
  }

  &__selector-left {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-3);
  }

  &__selector { width: 240px; }
  &__selector-label {
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    flex-shrink: 0;
  }

  &__status-tag { flex-shrink: 0; }

  &__selector-right {
    display: flex;
    gap: var(--o-r-gap-3);

    // 按钮 hover 态：描边变实心填充
    :deep(.o-button--outline) {
      &:hover {
        background-color: var(--o-color-primary1) !important;
        color: var(--o-white) !important;
        border-color: var(--o-color-primary1) !important;
      }
    }
  }

  // Overview layout
  &__overview-bar {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--o-r-gap-5) !important;
    margin-bottom: var(--o-r-gap-5) !important;

    // 按钮 hover 态：描边变实心填充
    :deep(.o-button--outline) {
      &:hover {
        background-color: var(--o-color-primary1) !important;
        color: var(--o-white) !important;
        border-color: var(--o-color-primary1) !important;
      }
    }
  }

  &__overview {
    display: flex;
    flex-direction: column;
    gap: var(--o-r-grid-column-gutter);
    margin-top: var(--o-r-gap-5);
  }

  &__form-card { width: 100%; }
  &__timeline-card { width: 100%; margin-top: 0; }

  &__section-title {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-h3);
    line-height: var(--o-r-line_height-h3);
    font-weight: var(--o-font_weight-bold);
    margin-bottom: var(--o-r-gap-3);
  }

  &__section-bar {
    display: inline-block;
    width: 4px;
    height: 16px;
    background-color: var(--o-color-primary1);
    border-radius: 2px;
    flex-shrink: 0;
  }

  // __form-status 已移入 section-title 行内，无需独立样式

  &__form-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--o-r-gap-5) var(--o-r-grid-column-gutter);
    margin-bottom: var(--o-r-gap-5);
  }

  &__form-field {
    width: calc(50% - var(--o-r-grid-column-gutter) / 2);
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-2);

    &--full { width: 100%; }

    @media (max-width: 840px) { width: 100%; }
  }

  &__form-label {
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
  }

  &__required {
    color: var(--o-color-danger1);
    margin-right: var(--o-r-gap-1);
  }

  &__form-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--o-r-gap-4);
  }

  // ── 只读信息展示（替代原 disabled OInput）───────────────────────────────────────
  &__info-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--o-r-gap-4) var(--o-r-grid-column-gutter);
  }

  &__info-field {
    width: calc(50% - var(--o-r-grid-column-gutter) / 2);
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-1);

    &--full { width: 100%; }

    @media (max-width: 840px) { width: 100%; }
  }

  &__info-label {
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    font-weight: var(--o-font_weight-regular);

    &--inline {
      display: inline;
      margin-left: var(--o-r-gap-3);
    }
  }

  &__info-value {
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
    font-weight: var(--o-font_weight-regular);

    &--link {
      color: var(--o-color-primary1);
      word-break: break-all;
    }
  }

  &__module-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--o-r-gap-2);
  }

  &__timeline-card { margin-top: var(--o-r-gap-5); }

  &__timeline-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--o-r-gap-3);
  }

  &__pipeline { margin-top: var(--o-r-gap-5); }

  // 执行配置区（原弹窗内容）
  &__pipeline-execute {
    padding: var(--o-r-gap-5) var(--o-r-gap-6);
    margin-bottom: var(--o-r-gap-5);
    background-color: var(--o-color-fill2);
    border-radius: var(--o-radius_control-m);
    box-shadow: var(--o-shadow-1);
  }

  // 表格标题
  &__table-title {
    font-size: var(--o-r-font_size-h3);
    font-weight: var(--o-font_weight-bold);
    color: var(--o-color-info1);
    margin: 0 0 var(--o-r-gap-4) 0;
  }

  // 流水线表格容器（表格 + 分页器）
  &__pipeline-table-container {
    display: flex;
    flex-direction: column;
  }

  // 分页器
  &__pipeline-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--o-r-gap-4);
    padding: var(--o-r-gap-3) 0;
  }
}

// ── 执行配置区内联样式 ──────────────────────────────────────────────────────
.pl-execute {
  &__muted { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip1); }

  &__section-title {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    margin-bottom: var(--o-r-gap-4);
    font-size: var(--o-r-font_size-h3);
    line-height: var(--o-r-line_height-h3);
  }

  &__bar {
    width: 4px;
    height: 16px;
    background-color: var(--o-color-primary1);
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__section-title {
    font-size: var(--o-r-font_size-h3);
    font-weight: var(--o-font_weight-bold);
    color: var(--o-color-info1);
  }

  &__case-count {
    margin-left: auto;
    font-size: var(--o-r-font_size-tip1);
    color: var(--o-color-info3);
    strong { color: var(--o-color-primary1); }
  }

  &__case-summary {
    display: flex;
    flex-wrap: wrap;
    gap: var(--o-r-gap-3);
    padding: var(--o-r-gap-3) 0;
  }
  &__case-item {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    padding: var(--o-r-gap-2) var(--o-r-gap-3);
    background-color: var(--o-color-fill2);
    border: 1px solid var(--o-color-control1);
    border-radius: var(--o-radius_control-m);
  }
  &__case-more {
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip1);
    padding: var(--o-r-gap-2) 0;
  }

  &__build-options {
    display: flex;
    gap: var(--o-r-gap-5);
    margin-bottom: var(--o-r-gap-5);
  }

  &__build-card {
    flex: 1;
    padding: var(--o-r-gap-4) var(--o-r-gap-5);
    border: 2px solid var(--o-color-control1);
    border-radius: var(--o-radius_control-m);
    cursor: pointer;
    transition: all 0.2s;

    &:hover { border-color: var(--o-color-primary3); }

    &--active {
      border-color: var(--o-color-primary1);
      background-color: rgba(0, 47, 167, 0.02);
    }
  }

  &__build-desc {
    margin: var(--o-r-gap-3) 0 0 0;
    font-size: var(--o-r-font_size-tip1);
    color: var(--o-color-info3);
    line-height: var(--o-r-line_height-tip1);
  }

  &__upload-area { margin-top: var(--o-r-gap-3); }

  &__filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--o-r-gap-3);
    margin-bottom: var(--o-r-gap-5);
  }

  &__sel { width: 140px; }
  &__sel--wide { width: 160px; }

  &__table-wrap {
    margin-bottom: var(--o-r-gap-4);
    overflow-x: auto;
  }

  // ── 表格单元格统一样式 ────────────────────────────────────────────────
  &__cell-name { color: var(--o-color-info1); font-size: var(--o-r-font_size-tip1); font-weight: var(--o-font_weight-regular); line-height: var(--o-r-line_height-tip1); }
  &__cell-id { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip2); font-family: var(--o-font_family-code); white-space: nowrap; }
  &__cell-text { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); line-height: var(--o-r-line_height-tip1); word-break: break-all; }
  &__cell-script { color: var(--o-color-primary1); font-size: var(--o-r-font_size-tip2); font-family: var(--o-font_family-code); word-break: break-all; line-height: var(--o-r-line_height-tip2); }
  &__cell-plain { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); white-space: nowrap; }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--o-r-gap-5);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--o-r-gap-3);
    padding-top: var(--o-r-gap-4);
    border-top: 1px solid var(--o-color-control4);
  }
}


// ── 时间计划（OStep 水平步骤条）──────────────────────────────────────────────────
// 使用 Vue OStep/OStepItem 组件替代自定义实现
// 规范颜色完全由 OStep 组件内部通过 status prop 驱动，无需手写样式
// finished=success1背景+info2标题，processing=primary1背景+primary1标题，waiting=primary4背景+info4标题
.proj-timeline-wrap {
  padding: var(--o-r-gap-3) 0 var(--o-r-gap-4);
}

// OStep 全宽铺满卡片内容区
.proj-timeline-step {
  width: 100%;
}

.pl-steps-wrap {
  padding: var(--o-r-gap-4) 0 var(--o-r-gap-3);
  margin-bottom: var(--o-r-gap-5);
}

.pl-steps {
  width: 100%;
}

// ── 弹窗底部（取消 + 保存，右对齐）────────────────────────────────────────────
.tl-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--o-r-gap-3);
}

// ── 一键执行流水线弹窗 ────────────────────────────────────────────────────────
.pl-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-5);

  &__warning {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    padding: var(--o-r-gap-3) var(--o-r-gap-4);
    background-color: var(--o-color-warning4-light);
    border-radius: var(--o-radius_control-m);
    color: var(--o-color-warning1);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
  }

  &__warning-icon { font-size: var(--o-r-font_size-text1); }
  &__steps { padding: var(--o-r-gap-3) 0; }

  &__case-summary {
    display: flex;
    flex-wrap: wrap;
    gap: var(--o-r-gap-3);
    padding: var(--o-r-gap-3) 0;
  }
  &__case-item {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    padding: var(--o-r-gap-2) var(--o-r-gap-3);
    background-color: var(--o-color-fill2);
    border: 1px solid var(--o-color-control1);
    border-radius: var(--o-radius_control-m);
  }
  &__case-more {
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip1);
    padding: var(--o-r-gap-2) 0;
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-h3);
    font-weight: var(--o-font_weight-bold);
  }

  &__bar {
    display: inline-block;
    width: 4px; height: 16px;
    background-color: var(--o-color-primary1);
    border-radius: 2px; flex-shrink: 0;
  }

  &__case-count {
    margin-left: auto;
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip1);
    font-weight: var(--o-font_weight-regular);
    strong { color: var(--o-color-primary1); }
  }

  // 构建方式：两张卡片横排
  &__build-group {
    display: flex;
    gap: var(--o-r-grid-column-gutter);
  }

  &__build-card {
    flex: 1;
    padding: var(--o-r-gap-4) var(--o-r-gap-5);
    border: 1px solid var(--o-color-control1);
    border-radius: var(--o-radius_control-m);
    cursor: pointer;
    transition: border-color var(--o-duration-s) var(--o-easing-standard);
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-3);

    &--active {
      border-color: var(--o-color-primary1);
      background-color: var(--o-color-primary4-light);
    }
  }

  &__build-radio { font-weight: var(--o-font_weight-bold); pointer-events: none; }

  &__build-desc {
    margin: 0;
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
  }

  &__upload-area { margin-top: var(--o-r-gap-2); }

  // 筛选器
  &__filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--o-r-gap-3);
  }

  &__filter-sel { width: 140px; }
  &__filter-sel--wide { width: 160px; }
  &__filter-clear {
    font-size: var(--o-r-font_size-tip1);
    color: var(--o-color-info3);
    cursor: pointer;
    white-space: nowrap;
  }

  // 表格
  &__table-wrap { height: 476px; overflow-x: auto; overflow-y: auto; -webkit-overflow-scrolling: touch; }

  // ── 表格单元格统一样式（与 pl-execute 保持一致）─────────────────────
  &__cell-name {
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    font-weight: var(--o-font_weight-regular);
    display: block;
    word-break: break-all;
  }

  &__cell-id {
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip2);
    font-family: var(--o-font_family-code);
    white-space: nowrap;
  }

  &__cell-text {
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    max-width: 200px;
  }

  &__cell-script {
    color: var(--o-color-primary1);
    font-size: var(--o-r-font_size-tip2);
    font-family: var(--o-font_family-code);
    word-break: break-all;
    max-width: 200px;
    display: block;
    line-height: var(--o-r-line_height-tip2);
  }

  &__cell-plain {
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    white-space: nowrap;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--o-r-gap-3);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--o-r-gap-3);
  }
}

// ── 新增项目弹窗 ───────────────────────────────────────────────────────────────
// ── 弹窗CSS已移至全局 <style> 块（ODialog渲染到body层，scoped不生效）──
</style>

<!-- 弹窗/执行区内表格横向滚动：OTable 内置 overflow:hidden，必须全局覆盖 -->
<style>
.pl-dialog__table-wrap .o-table-wrap,
.pl-execute__table-wrap .o-table-wrap,
.pipeline-table-wrap .o-table-wrap {
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.pl-dialog__table-wrap table,
.pl-execute__table-wrap table,
.pipeline-table-wrap table {
  min-width: var(--pipeline-table-min-width);
}
.pl-dialog__table-wrap th,
.pl-execute__table-wrap th,
.pipeline-table-wrap th {
  white-space: nowrap;
  padding: 8px 12px;
}
.pl-dialog__table-wrap td,
.pl-execute__table-wrap td,
.pipeline-table-wrap td {
  white-space: normal;
  word-break: break-word;
  padding: 8px 12px;
  font-size: 12px;
}

/* 内容列允许折行 */
.pl-dialog__table-wrap td .pl-dialog__cell-text,
.pl-dialog__table-wrap td .pl-dialog__cell-script,
.pl-execute__table-wrap td .pl-execute__cell-text,
.pl-execute__table-wrap td .pl-execute__cell-script {
  white-space: normal;
  word-break: break-all;
}
.pl-dialog__table-wrap th:first-child,
.pl-dialog__table-wrap td:first-child,
.pl-execute__table-wrap th:first-child,
.pl-execute__table-wrap td:first-child,
.pipeline-table-wrap th:first-child,
.pipeline-table-wrap td:first-child {
  overflow: visible;
  text-align: left;
}
.pipeline-datetime {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}
.pipeline-datetime__date { color: var(--o-color-info1); font-size: var(--o-r-font_size-tip1); white-space: nowrap; }
.pipeline-datetime__time { color: var(--o-color-info1); font-size: var(--o-r-font_size-tip1); white-space: nowrap; }
.pipeline-task-id { white-space: nowrap; }
.status-developing.o-tag { background-color: #058EF0 !important; color: #fff !important; border-color: #058EF0 !important; }
.status-developing.o-tag .o-tag__text { color: #fff !important; }

.pl-status-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pl-status-link {
  color: var(--o-color-primary);
  text-decoration: none;
  font-size: 12px;
  white-space: nowrap;
}
.pl-status-link:hover {
  text-decoration: underline;
}
</style>

<!--
  非 scoped 全局样式：让 OCard 内部的 .o-card-main 参与 flex 垂直布局。
  根据 opendesign-components skill 规范，
  修改组件渲染类（.o-card-main）必须通过全局 CSS 而非 scoped :deep()。
  选择器精确限定在 .proj-detail__form-card / .proj-detail__hw-card 内，
  不影响其他 OCard 实例。
-->
<style>
/*
  两个"保存"按钮对齐 — 最终修复
  根因：OCard 内部 .o-card-main-wrap { justify-content: space-between }
        使 4+ 个子元素均匀分布，按钮不在底部。
  修复：
    ① 覆盖 justify-content 为 flex-start（内容靠顶）
    ② margin-top: auto 将 form-footer 推到底部（可靠）
    两条规则组合后 100% 生效，两等高卡片的按钮自然对齐。
*/
.pl-steps .o-step-line,
.pl-dialog__steps .o-step-line {
  background-color: var(--o-color-control4) !important;
}
.proj-detail__form-card .o-card-main-wrap,
.proj-detail__hw-card .o-card-main-wrap {
  justify-content: flex-start;
}

.proj-detail__form-card .proj-detail__form-footer,
.proj-detail__hw-card .proj-detail__form-footer {
  margin-top: auto;
}

/* ── 编辑项目信息弹窗 ── */
.o-dialog-exlarge .o-dlg-body {
  overflow: hidden;
}
.o-dialog-exlarge .o-dlg-body-content {
  overflow-y: auto !important;
  scrollbar-width: auto !important;
}
.o-dialog-exlarge .o-dlg-body-content::-webkit-scrollbar {
  display: initial !important;
}
.edit-proj-form {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-5);
  max-height: 70vh;
  overflow-y: auto;
  padding-right: var(--o-r-gap-2);
  padding-bottom: var(--o-r-gap-4);
}
.edit-proj-form__section-title {
  display: flex;
  align-items: center;
  gap: var(--o-r-gap-2);
  color: var(--o-color-info1);
  font-size: var(--o-r-font_size-text1);
  font-weight: var(--o-font_weight-bold);
}
.edit-proj-form__bar {
  display: inline-block;
  width: 4px; height: 16px;
  background-color: var(--o-color-primary1);
  border-radius: 2px; flex-shrink: 0;
}
.edit-proj-form__grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--o-r-gap-4) var(--o-r-grid-column-gutter);
}
.edit-proj-form__field {
  width: calc(50% - var(--o-r-grid-column-gutter) / 2);
  display: flex; flex-direction: column; gap: var(--o-r-gap-2);
}
.edit-proj-form__field--full { width: 100%; }
.edit-proj-form__label { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); font-weight: var(--o-font_weight-regular); }
.edit-proj-form__required { color: var(--o-color-danger1); margin-right: var(--o-r-gap-1); }

.edit-proj-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--o-r-gap-3);
}

/* ── 编辑弹窗模块区域 ── */
.edit-module-area {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-3);
}
.edit-module-area__locked {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--o-r-gap-2);
}
.edit-module-area__locked-label {
  color: var(--o-color-info3);
  font-size: var(--o-r-font_size-tip1);
  font-weight: var(--o-font_weight-regular);
  white-space: nowrap;
}
.edit-module-area__locked-tag {
  cursor: default;
}
.edit-module-area__add {
  display: flex;
  align-items: flex-start;
  gap: var(--o-r-gap-3);
}
.edit-module-area__add-label {
  color: var(--o-color-info3);
  font-size: var(--o-r-font_size-tip1);
  font-weight: var(--o-font_weight-regular);
  white-space: nowrap;
  line-height: var(--o-control_size-m);
}
.edit-module-area__add-select {
  flex: 1;
}

/* ─ 编辑弹窗时间计划（OStep 步骤条 + 卡片编辑区） ─ */
.edit-timeline-wrap {
  width: 100%;
  padding: var(--o-r-gap-3) 0;
}
.edit-timeline-step {
  width: 100%;
}
/* 连接线颜色统一 */
.edit-timeline-step :deep(.o-step-line) {
  background-color: var(--o-color-control4) !important;
}
.edit-tl-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--o-r-gap-5);
  padding-bottom: var(--o-r-gap-6);
}
.edit-tl-card {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-3);
  min-width: 0;
  background: var(--o-color-fill2);
  border-radius: var(--o-r-border_radius-tag);
  padding: var(--o-r-gap-4);
  border: 1px solid var(--o-color-control4);
  margin-bottom: var(--o-r-gap-2);
}
.edit-tl-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--o-r-gap-2);
  flex-wrap: wrap;
}
.edit-tl-card__title {
  display: flex;
  align-items: center;
  gap: var(--o-r-gap-2);
  color: var(--o-color-info1);
  font-size: var(--o-r-font_size-text1);
  font-weight: var(--o-font_weight-bold);
  line-height: var(--o-r-line_height-text1);
}
.edit-tl-card__multi {
  color: var(--o-color-info3);
  font-size: var(--o-r-font_size-tip2);
  white-space: nowrap;
}
.edit-tl-card__divider { margin: 0; }
.edit-tl-periods {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-4);
}
.edit-tl-period-row {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-2);
  padding: var(--o-r-gap-3) 0;
}
.edit-tl-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.edit-tl-period-idx {
  color: var(--o-color-info3);
  font-size: var(--o-r-font_size-tip2);
  white-space: nowrap;
}
.edit-tl-field {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-1);
  width: 100%;
}
.edit-tl-label {
  color: var(--o-color-info3);
  font-size: var(--o-r-font_size-tip1);
  font-weight: var(--o-font_weight-regular);
  line-height: var(--o-r-line_height-tip1);
  white-space: nowrap;
}
.edit-tl-del-btn { flex-shrink: 0; margin-left: auto; }

/* ── 流水线控制台时间计划编辑区（横向步骤条布局） ── */
.tl-editor {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-5);
}
.tl-editor__rail {
  display: flex;
  align-items: flex-start;
  padding: 0 var(--o-r-gap-4);
}
.tl-editor__rail-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--o-r-gap-2);
  flex-shrink: 0;
  width: 96px;
}
.tl-editor__rail-dot {
  width: 32px;
  height: 32px;
  border-radius: 100px;
  flex-shrink: 0;
}
.tl-editor__rail-dot--done { background: var(--o-color-success1); }
.tl-editor__rail-dot--current { background: var(--o-color-primary1); }
.tl-editor__rail-dot--pending { background: var(--o-color-primary4); }
.tl-editor__rail-label {
  font-size: var(--o-r-font_size-text1);
  line-height: var(--o-r-line_height-text1);
  white-space: nowrap;
  text-align: center;
}
.tl-editor__rail-label--done { color: var(--o-color-info2); }
.tl-editor__rail-label--current { color: var(--o-color-primary1); font-weight: var(--o-font_weight-bold); }
.tl-editor__rail-label--pending { color: var(--o-color-info4); }
.tl-editor__rail-line {
  flex: 1;
  height: 1px;
  background: var(--o-color-control4);
  margin-top: 16px;
  min-width: 24px;
}
.tl-editor__rail-line--done { background: var(--o-color-primary1); }
.tl-editor__cards {
  display: flex;
  gap: var(--o-r-gap-5);
  overflow-x: auto;
}
.tl-editor__card {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-3);
  min-width: 320px;
  flex: 1;
  background: var(--o-color-fill2);
  border-radius: var(--o-r-border_radius-tag);
  padding: var(--o-r-gap-4);
  border: 1px solid var(--o-color-control4);
}
.tl-editor__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--o-r-gap-2);
  flex-wrap: wrap;
}
.tl-editor__card-title {
  display: flex;
  align-items: center;
  gap: var(--o-r-gap-2);
  color: var(--o-color-info1);
  font-size: var(--o-r-font_size-text1);
  font-weight: var(--o-font_weight-bold);
  line-height: var(--o-r-line_height-text1);
}
.tl-editor__card-divider { margin: 0; }
.tl-editor__periods {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-4);
}
.tl-editor__period-row {
  display: flex;
  align-items: flex-end;
  gap: var(--o-r-gap-2);
  flex-wrap: wrap;
}
.tl-editor__period-idx {
  color: var(--o-color-info3);
  font-size: var(--o-r-font_size-tip2);
  white-space: nowrap;
  min-width: 48px;
  line-height: 32px;
  flex-shrink: 0;
}
.tl-editor__field {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-1);
  min-width: 140px;
  flex: 1;
}
.tl-editor__label {
  color: var(--o-color-info3);
  font-size: var(--o-r-font_size-tip1);
  font-weight: var(--o-font_weight-regular);
  line-height: var(--o-r-line_height-tip1);
  white-space: nowrap;
}
.tl-editor__required { color: var(--o-color-danger1); margin-right: var(--o-r-gap-1); }
.tl-editor__optional { color: var(--o-color-info4); }
.tl-editor__arrow {
  color: var(--o-color-info4);
  font-size: var(--o-r-font_size-text1);
  align-self: center;
  line-height: 32px;
  flex-shrink: 0;
}
.tl-editor__del-btn { align-self: flex-end; flex-shrink: 0; }

.tl-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--o-r-gap-3);
}

/* ── 新增项目弹窗 ── */
.add-proj-form {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-5);
}
.add-proj-form__section-title {
  display: flex;
  align-items: center;
  gap: var(--o-r-gap-2);
  color: var(--o-color-info1);
  font-size: var(--o-r-font_size-h3);
  font-weight: var(--o-font_weight-bold);
}
.add-proj-form__bar {
  display: inline-block;
  width: 4px; height: 16px;
  background-color: var(--o-color-primary1);
  border-radius: 2px; flex-shrink: 0;
}
.add-proj-form__hint {
  margin-left: auto;
  color: var(--o-color-info4);
  font-size: var(--o-r-font_size-tip2);
  font-weight: var(--o-font_weight-regular);
}
.add-proj-form__grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--o-r-gap-4) var(--o-r-grid-column-gutter);
}
.add-proj-form__field {
  width: calc(50% - var(--o-r-grid-column-gutter) / 2);
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-2);
}
.add-proj-form__field--full { width: 100%; }
.add-proj-form__label {
  color: var(--o-color-info2);
  font-size: var(--o-r-font_size-tip1);
  font-weight: var(--o-font_weight-regular);
}
.add-proj-form__required { color: var(--o-color-danger1); margin-right: var(--o-r-gap-1); }
/* 新增项目时间计划卡片（与编辑弹窗一致） */
.add-tl-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--o-r-gap-5);
}
.add-tl-card {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-3);
  min-width: 0;
  background: var(--o-color-fill2);
  border-radius: var(--o-r-border_radius-tag);
  padding: var(--o-r-gap-4);
  border: 1px solid var(--o-color-control4);
}
.add-tl-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--o-r-gap-2);
}
.add-tl-card__title {
  display: flex;
  align-items: center;
  gap: var(--o-r-gap-2);
  color: var(--o-color-info1);
  font-size: var(--o-r-font_size-text1);
  font-weight: var(--o-font_weight-bold);
}
.add-tl-card__divider { margin: 0; }
.add-tl-periods {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-3);
}

/* 时间段行样式（与编辑弹窗一致） */
.edit-tl-period-row {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-2);
}
.edit-tl-label-row {
  display: flex;
  align-items: center;
  gap: var(--o-r-gap-2);
}
.edit-tl-period-idx {
  color: var(--o-color-info3);
  font-size: var(--o-r-font_size-tip2);
  white-space: nowrap;
}
.edit-tl-del-btn {
  margin-left: auto;
}

.add-proj-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--o-r-gap-3);
}

/* ── 出口评审报告弹窗 ── */
.report-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-4);
}
.report-dialog__section {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-3);
}
.report-dialog__section-title {
  display: flex;
  align-items: center;
  gap: var(--o-r-gap-2);
  color: var(--o-color-info1);
  font-size: var(--o-r-font_size-text1);
  font-weight: var(--o-font_weight-bold);
}
.report-dialog__bar {
  display: inline-block;
  width: 4px;
  height: 16px;
  background-color: var(--o-color-primary1);
  border-radius: 2px;
  flex-shrink: 0;
}
.report-dialog__info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--o-r-gap-4);
}
.report-dialog__info-item {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-1);
}
.report-dialog__info-label {
  color: var(--o-color-info3);
  font-size: var(--o-r-font_size-tip1);
}
.report-dialog__info-value {
  color: var(--o-color-info1);
  font-size: var(--o-r-font_size-text1);
}
.report-dialog__stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--o-r-gap-4);
}
.report-dialog__stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--o-r-gap-2);
  padding: var(--o-r-gap-4) var(--o-r-gap-3);
  background-color: var(--o-color-fill2);
  border-radius: var(--o-radius_control-m);
  border: 1px solid var(--o-color-control4);
}
.report-dialog__stat-card--success {
  background-color: var(--o-color-success4-light);
  border-color: var(--o-color-success4);
}
.report-dialog__stat-card--warning {
  background-color: var(--o-color-warning4-light);
  border-color: var(--o-color-warning4);
}
.report-dialog__stat-card--danger {
  background-color: var(--o-color-danger4-light);
  border-color: var(--o-color-danger4);
}
.report-dialog__stat-card--info {
  background-color: var(--o-color-info4-light);
  border-color: var(--o-color-info4);
}
.report-dialog__stat-value {
  color: var(--o-color-info1);
  font-size: var(--o-r-font_size-h2);
  font-weight: var(--o-font_weight-bold);
}
.report-dialog__stat-label {
  color: var(--o-color-info2);
  font-size: var(--o-r-font_size-tip1);
}
.report-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--o-r-gap-3);
}
</style>