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
import { MOCK_PROJECTS, MOCK_PIPELINE_TASKS, MOCK_TEST_CASES, type Project, type PipelineStatus } from '../../mock/data'
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

const projectOptions = computed(() =>
  visibleProjects.value.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.projectId})`,
  }))
)

const activeTab = ref('overview')

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
  status: '', owner: '', productVersion: '', cpuArch: '',
})
const syncForm = () => {
  const p = project.value
  if (!p) return
  form.name = p.name; form.description = p.description
  form.kernelVersion = p.kernelVersion; form.osVersion = p.osVersion
  form.status = p.status; form.owner = p.owner
  form.productVersion = p.productVersions[0] ?? ''; form.cpuArch = p.cpuArch
}
syncForm()
const handleSave = () => OMessage.success('保存成功')

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

// 将节点的时间段格式化为描述文字（显示在步骤标题下方）
const formatStepDesc = (node: LocalNode): string => {
  const ps = node.periods.filter(p => p.startDate)
  if (!ps.length) return '待设置'
  const first = ps[0]
  const dateStr = first.endDate ? `${first.startDate} → ${first.endDate}` : first.startDate
  return ps.length > 1 ? `${dateStr} 等${ps.length}个时间段` : dateStr
}

// 打开时深拷贝 localTimeline → editingTimeline（草稿）
// 用户点取消：草稿丢弃；点保存：写回 localTimeline
const timelineEditorVisible = ref(false)
const editingTimeline = ref<LocalNode[]>([])

const openTimelineEditor = () => {
  // 深拷贝，避免直接修改 localTimeline
  editingTimeline.value = localTimeline.value.map(n => ({
    ...n,
    periods: n.periods.map(p => ({ ...p })),
  }))
  timelineEditorVisible.value = true
}

const saveTimeline = () => {
  // 校验：所有时间段必须有开始日期
  for (const node of editingTimeline.value) {
    for (const p of node.periods) {
      if (!p.startDate.trim()) {
        OMessage.warning(`「${node.label}」中存在未填写的开始日期`)
        return
      }
    }
  }
  localTimeline.value = editingTimeline.value.map(n => ({
    ...n,
    periods: n.periods.map(p => ({ ...p })),
  }))
  timelineEditorVisible.value = false
  OMessage.success('时间计划已保存')
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
// 关键：用 { ...t } 展开每个 live task，让 Vue 追踪 buildStatus/isoStatus 等所有字段。
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
const pipelineColumns = computed(() => [
  { label: t('pipeline.colTaskId'),                                       key: 'taskId' },
  { label: `${t('pipeline.colBuild')}\n${t('pipeline.statusHint')}`,     key: 'buildStatus' },
  { label: `${t('pipeline.colIso')}\n${t('pipeline.statusHint')}`,       key: 'isoStatus' },
  { label: `${t('pipeline.colTest')}\n${t('pipeline.testHint')}`,        key: 'testStatus' },
  { label: `${t('pipeline.colStatus')}\n${t('pipeline.statusHint')}`,   key: 'pipelineStatus' },
  { label: t('pipeline.colStart'),     key: 'startedAt' },
  { label: t('pipeline.colEnd'),       key: 'endedAt' },
  { label: t('pipeline.colDuration'),  key: 'duration' },
  { label: t('pipeline.colExecutor'),  key: 'executor' },
])
const pipelineStatusColor = (s: PipelineStatus | string) => {
  const m: Record<string, string> = { success: 'success', failed: 'danger', running: 'warning', pending: 'info', cancelled: 'info' }
  return m[s] ?? 'info'
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
const dialogCaseColumns = [
  { label: '',         key: 'select',          style: { width: '52px',  minWidth: '52px'  } },
  { label: '用例名称', key: 'name',             style: { width: '130px', minWidth: '130px' } },
  { label: '用例编号', key: 'testId',           style: { width: '140px', minWidth: '140px' } },
  { label: '级别',     key: 'level',            style: { width: '80px',  minWidth: '80px'  } },
  { label: '预置条件',         key: 'precondition',     style: { width: '200px', minWidth: '200px' } },
  { label: '测试步骤',         key: 'testSteps',        style: { width: '200px', minWidth: '200px' } },
  { label: '预期结果',         key: 'expectedResult',   style: { width: '180px', minWidth: '180px' } },
  { label: '自动化脚本/路径',  key: 'automationScript', style: { width: '200px', minWidth: '200px' } },
  { label: '最后一次执行结果', key: 'lastExecResult',   style: { width: '120px', minWidth: '120px' } },
  { label: '特性',             key: 'feature',          style: { width: '120px', minWidth: '120px' } },
  { label: '最后执行人',       key: 'lastExecutor',     style: { width: '100px', minWidth: '100px' } },
  { label: '测试类型',         key: 'testType',         style: { width: '80px',  minWidth: '80px'  } },
  { label: '自动化类型',       key: 'isAutomated',      style: { width: '90px',  minWidth: '90px'  } },
]

// 用例展示辅助函数（与 TestCaseTab 保持一致）
const dlgExecColor = (r: string) =>
  ({ passed: 'success', fail: 'danger', block: 'warning', unavailable: 'info', pending: 'info' }[r] ?? 'info')
const dlgExecLabel = (r: string) =>
  ({ passed: 'Passed', fail: 'Fail', block: 'Block', unavailable: 'Unavailable', pending: '—' }[r] ?? r)
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
    buildStatus: 'running' as string,   // 包构建：立即开始
    isoStatus:   'pending' as string,   // ISO构建：待开始
    testStatus:  'pending' as string,   // 测试：待开始
    pipelineStatus: 'running' as string,
    startedAt: startStr,
    endedAt:  null as string | null,
    duration: null as string | null,
    executor: currentUser.value?.name ?? 'admin',
  })

  // 插到最前（最新的排第一）
  livePipelineTasks.value = [newTask, ...livePipelineTasks.value]

  // 关闭弹窗
  pipelineDialog.visible = false
  runPipelineCaseIds.value = []
  // 切换到流水线 tab 确保用户能看到进度
  activeTab.value = 'pipeline'

  OMessage.success(`流水线 ${newTask.taskId} 已启动（${buildMode}，${dialogSelectedIds.value.length} 个用例），包构建进行中...`)

  // ── 阶段一：包构建成功 → 开始 ISO 构建（3 秒后）──────────────────────────
  setTimeout(() => {
    newTask.buildStatus = 'success'
    newTask.isoStatus   = 'running'
    OMessage.success(`[${newTask.taskId}] 包构建成功，ISO构建进行中...`)
  }, 3000)

  // ── 阶段二：ISO构建成功 → 开始测试（再 4 秒后）────────────────────────────
  setTimeout(() => {
    newTask.isoStatus  = 'success'
    newTask.testStatus = 'running'
    OMessage.success(`[${newTask.taskId}] ISO构建成功，测试执行中...`)
  }, 7000)

  // ── 阶段三：测试完成，整体成功（再 4 秒后）──────────────────────────────────
  setTimeout(() => {
    newTask.testStatus     = 'success'
    newTask.pipelineStatus = 'success'
    const end = new Date()
    const endStr = `${end.getFullYear()}.${end.getMonth()+1}.${end.getDate()} ${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`
    newTask.endedAt  = endStr
    newTask.duration = '11分钟'
    OMessage.success(`[${newTask.taskId}] 流水线执行完成 ✓`)
  }, 11000)
}

// 文件上传模拟
const handleBuildUpload = async () => { await new Promise(r => setTimeout(r, 600)); return Promise.resolve() }

// ─── 新增项目弹窗 ─────────────────────────────────────────────────────────────
// 包含项目概览所有字段，除"项目ID"（ID由系统自动生成）

interface AddProjectForm {
  // 基本信息
  name: string
  description: string
  kernelVersion: string
  osVersion: string
  status: string
  owner: string
  // 硬件规格
  productVersion: string
  cpuArch: string
  // 时间计划（每个阶段的开始/结束日期）
  startDate: string
  devStartDate: string
  devEndDate: string
  testStartDate: string
  testEndDate: string
  deliverDate: string
}

const EMPTY_PROJECT: AddProjectForm = {
  name: '', description: '', kernelVersion: '', osVersion: '',
  status: 'active', owner: '',
  productVersion: '950', cpuArch: 'x86_64',
  startDate: '', devStartDate: '', devEndDate: '',
  testStartDate: '', testEndDate: '', deliverDate: '',
}

const addProjectDialog = reactive({
  visible: false,
  form: { ...EMPTY_PROJECT } as AddProjectForm,
})

const openAddProjectDialog = () => {
  Object.assign(addProjectDialog.form, { ...EMPTY_PROJECT })
  addProjectDialog.visible = true
}

const handleAddProjectConfirm = () => {
  if (!addProjectDialog.form.name.trim()) { OMessage.warning('项目名称不能为空'); return }
  if (!addProjectDialog.form.owner.trim()) { OMessage.warning('负责人不能为空'); return }
  OMessage.success(`项目「${addProjectDialog.form.name}」创建成功`)
  addProjectDialog.visible = false
}
</script>

<template>
  <section class="proj-detail">
    <!-- Admin notice -->
    <div v-if="isAdmin" class="proj-detail__notice">
      <span class="proj-detail__notice-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.0312 2.34969C13.6625 2.34969 15.2371 2.75343 16.6415 3.51339C16.9815 3.69739 17.108 4.12218 16.924 4.46218C16.74 4.80219 16.3152 4.92867 15.9752 4.74467C14.7742 4.09476 13.4284 3.74969 12.0312 3.74969C7.44721 3.74969 3.73118 7.46573 3.73118 12.0497C3.73118 16.6337 7.44721 20.3497 12.0312 20.3497C16.6151 20.3497 20.3312 16.6337 20.3312 12.0497C20.3312 9.98725 19.577 8.04389 18.234 6.53456C17.977 6.24575 18.0028 5.80329 18.2916 5.54629C18.5804 5.2893 19.0229 5.31509 19.2799 5.60391C20.8489 7.36716 21.7312 9.64078 21.7312 12.0497C21.7312 17.4069 17.3883 21.7497 12.0312 21.7497C6.67402 21.7497 2.33118 17.4069 2.33118 12.0497C2.33118 6.69253 6.67401 2.34969 12.0312 2.34969ZM13.1333 7.65356C13.1333 8.27889 12.6253 8.78685 12 8.78685C11.3747 8.78685 10.8667 8.27889 10.8667 7.65356C10.8667 7.02823 11.3747 6.52027 12 6.52027C12.6253 6.52027 13.1333 7.02823 13.1333 7.65356ZM12.7065 9.99663C12.6614 9.65479 12.3695 9.39036 12.0151 9.38905C11.6285 9.38762 11.314 9.69985 11.3125 10.0864L11.2875 16.85L11.2935 16.945C11.3386 17.2869 11.6305 17.5513 11.9849 17.5526C12.3715 17.5541 12.686 17.2418 12.6875 16.8552L12.7125 10.0916L12.7065 9.99663Z" fill="currentColor" fill-opacity="0.8"/>
        </svg>
      </span>
      <span>{{ t('project.adminNotice') }}</span>
    </div>

    <!-- Project selector row -->
    <div class="proj-detail__selector-row">
      <div class="proj-detail__selector-left">
        <span class="proj-detail__selector-label">项目</span>
        <OSelect v-model="selectedProjectId" class="proj-detail__selector" @change="syncForm">
          <OOption v-for="o in projectOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OTag color="success" size="medium" class="proj-detail__status-tag">{{ t('project.statusActive') }}</OTag>
      </div>
      <div class="proj-detail__selector-right">
        <OButton variant="outline" size="medium" round="pill">{{ t('project.generateReport') }}</OButton>
        <OButton v-if="isAdmin" variant="solid" color="primary" size="medium" round="pill" @click="openAddProjectDialog">{{ t('project.create') }}</OButton>
      </div>
    </div>

    <!-- Tabs -->
    <OTab v-model="activeTab">
      <!-- ── Tab 1: Overview ── -->
      <OTabPane value="overview" :label="t('project.overview')">
        <div class="proj-detail__overview">
          <!-- Left: basic info -->
          <OCard class="proj-detail__form-card">
            <div class="proj-detail__section-title">
              <span class="proj-detail__section-bar" />
              {{ t('project.basicInfo') }}
              <OTag color="success" size="medium">{{ t('project.statusActive') }}</OTag>
            </div>

            <ODivider darker />

            <div class="proj-detail__form-grid">
              <div class="proj-detail__form-field">
                <label class="proj-detail__form-label">
                  <span class="proj-detail__required">*</span>{{ t('project.nameField') }}
                </label>
                <OInput v-model="form.name" />
              </div>
              <div class="proj-detail__form-field">
                <label class="proj-detail__form-label">{{ t('project.idField') }}</label>
                <OInput :model-value="project?.projectId" disabled />
              </div>
              <div class="proj-detail__form-field proj-detail__form-field--full">
                <label class="proj-detail__form-label"><span class="proj-detail__required">*</span>{{ t('project.descField') }}</label>
                <OTextarea v-model="form.description" :rows="3" />
              </div>
              <div class="proj-detail__form-field">
                <label class="proj-detail__form-label"><span class="proj-detail__required">*</span>{{ t('project.kernelVersion') }}</label>
                <OInput v-model="form.kernelVersion" />
              </div>
              <div class="proj-detail__form-field">
                <label class="proj-detail__form-label"><span class="proj-detail__required">*</span>{{ t('project.osVersion') }}</label>
                <OInput v-model="form.osVersion" />
              </div>
              <div class="proj-detail__form-field">
                <label class="proj-detail__form-label"><span class="proj-detail__required">*</span>{{ t('project.statusField') }}</label>
                <OSelect v-model="form.status">
                  <OOption value="active" :label="t('project.statusActive')" />
                  <OOption value="planning" :label="t('project.statusPlanning')" />
                  <OOption value="archived" :label="t('project.statusArchived')" />
                </OSelect>
              </div>
              <div class="proj-detail__form-field">
                <label class="proj-detail__form-label"><span class="proj-detail__required">*</span>{{ t('project.ownerField') }}</label>
                <OInput v-model="form.owner" />
              </div>
              <div class="proj-detail__form-field">
                <label class="proj-detail__form-label"><span class="proj-detail__required">*</span>{{ t('project.productVersion') }}</label>
                <OSelect v-model="form.productVersion">
                  <OOption value="950" label="950" />
                  <OOption value="920" label="920" />
                </OSelect>
              </div>
              <div class="proj-detail__form-field">
                <label class="proj-detail__form-label"><span class="proj-detail__required">*</span>{{ t('project.cpuArch') }}</label>
                <OSelect v-model="form.cpuArch">
                  <OOption value="x86_64" label="x86_64" />
                  <OOption value="aarch64" label="aarch64" />
                </OSelect>
              </div>
            </div>
            <div class="proj-detail__form-footer">
              <OButton variant="solid" color="primary" @click="handleSave" round="pill">{{ t('action.save') }}</OButton>
            </div>
          </OCard>
        </div>

        <!-- Timeline -->
        <OCard class="proj-detail__timeline-card">
          <div class="proj-detail__timeline-header">
            <div class="proj-detail__section-title">
              <span class="proj-detail__section-bar" />
              {{ t('project.timeline') }}
            </div>
            <!-- 「编辑」按钮：打开统一时间计划编辑弹窗 -->
            <OButton variant="outline" size="medium" round="pill" @click="openTimelineEditor">
              编辑
            </OButton>
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
                :step-index="idx + 1"
                :title="node.label"
                :description="formatStepDesc(node)"
                :status="mapStepStatus(node.status)"
              />
            </OStep>
          </div>
        </OCard>
      </OTabPane>

      <!-- ── Tab 2: Patches ── -->
      <OTabPane value="patches" :label="t('project.patches')">
        <!-- @view-cases：用户点击"查看对应用例"，切换到用例看板并传入选中的 patchIds -->
        <PatchTab
          v-if="selectedProjectId"
          :project-id="selectedProjectId"
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
          <!-- 执行配置区（原弹窗内容移至此处） -->
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

            <!-- ② 用例选择区 -->
            <div class="pl-execute__section-title pl-execute__section-title--mt">
              <span class="pl-execute__bar" />用例选择区
              <span class="pl-execute__case-count">
                已选 <strong>{{ dialogSelectedIds.length }}</strong> / {{ dialogCases.length }} 个用例
              </span>
            </div>

            <!-- 筛选器 -->
            <div class="pl-execute__filter">
              <OSelect v-model="dialogFilter.level" placeholder="用例级别" variant="outline" size="medium"
                class="pl-execute__sel" @change="dialogPage = 1">
                <OOption v-for="o in dialogLevelOptions" :key="o.value" :value="o.value" :label="o.label" />
              </OSelect>
              <OSelect v-model="dialogFilter.testType" placeholder="测试类型" variant="outline" size="medium"
                class="pl-execute__sel" @change="dialogPage = 1">
                <OOption v-for="o in dialogTypeOptions" :key="o.value" :value="o.value" :label="o.label" />
              </OSelect>
              <OSelect v-model="dialogFilter.autoStatus" placeholder="自动化类型" variant="outline" size="medium"
                class="pl-execute__sel" @change="dialogPage = 1">
                <OOption v-for="o in dialogAutoOptions" :key="o.value" :value="o.value" :label="o.label" />
              </OSelect>
              <OSelect v-model="dialogFilter.execResult" placeholder="用例执行结果" variant="outline" size="medium"
                class="pl-execute__sel pl-execute__sel--wide" @change="dialogPage = 1">
                <OOption v-for="o in dialogResultOptions" :key="o.value" :value="o.value" :label="o.label" />
              </OSelect>
              <OLink color="primary" @click="clearDialogFilter">清除筛选</OLink>
            </div>

            <!-- 用例选择表格 -->
            <div class="pl-execute__table-wrap">
              <OTable :columns="dialogCaseColumns" :data="dialogPagedCases">
                <template #th_select>
                  <OCheckbox v-model="dialogAllChecked" />
                </template>
                <template #td_select="{ row }">
                  <OCheckbox v-model="dialogSelectedIds" :value="row.id" />
                </template>
                <template #td_name="{ row }">
                  <span class="pl-execute__cell-name">{{ row.name }}</span>
                </template>
                <template #td_testId="{ row }">
                  <span class="pl-execute__cell-id">{{ row.testId }}</span>
                </template>
                <template #td_level="{ row }">
                  <OTag color="info" size="medium" variant="outline">{{ row.level }}</OTag>
                </template>
                <template #td_precondition="{ row }">
                  <span class="pl-execute__cell-text">{{ row.precondition }}</span>
                </template>
                <template #td_testSteps="{ row }">
                  <span class="pl-execute__cell-text">{{ row.testSteps }}</span>
                </template>
                <template #td_expectedResult="{ row }">
                  <span class="pl-execute__cell-text">{{ row.expectedResult }}</span>
                </template>
                <template #td_automationScript="{ row }">
                  <span class="pl-execute__cell-script">{{ row.automationScript }}</span>
                </template>
                <template #td_lastExecResult="{ row }">
                  <OTag :color="dlgExecColor(row.lastExecResult)" size="medium">
                    {{ dlgExecLabel(row.lastExecResult) }}
                  </OTag>
                </template>
                <template #td_feature="{ row }">
                  <span class="pl-execute__cell-plain">{{ row.feature || '—' }}</span>
                </template>
                <template #td_lastExecutor="{ row }">
                  <span class="pl-execute__cell-plain">{{ row.lastExecutor || '—' }}</span>
                </template>
                <template #td_testType="{ row }">
                  <span class="pl-execute__cell-plain">{{ dlgTypeLabel(row.testType) }}</span>
                </template>
                <template #td_isAutomated="{ row }">
                  <OTag :color="row.isAutomated ? 'success' : 'info'" size="medium" variant="outline">
                    {{ row.isAutomated ? 'TRUE' : 'FALSE' }}
                  </OTag>
                </template>
              </OTable>
            </div>

            <!-- 分页 -->
            <div class="pl-execute__pagination">
              <OPagination
                :total="dialogCases.length"
                :page="dialogPage"
                :page-size="dialogPageSize"
                @change="onDialogPageChange"
              />
            </div>

            <!-- 底部操作按钮 -->
            <div class="pl-execute__footer">
              <OButton variant="outline" size="medium" round="pill" @click="pipelineDialog.visible = false">取消</OButton>
              <OButton variant="solid" color="primary" size="medium" round="pill" @click="executePipeline">执行流水线</OButton>
            </div>
          </div>

          <!-- 流水线历史记录表格 -->
          <h3 class="proj-detail__table-title">流水线历史记录表格</h3>

          <OTable :columns="pipelineColumns" :data="pipelineTasks">
            <template #td_buildStatus="{ row }">
              <OTag :color="pipelineStatusColor(row.buildStatus)" size="medium">
                {{ pipelineStatusLabel(row.buildStatus) }}
              </OTag>
            </template>
            <template #td_isoStatus="{ row }">
              <OTag :color="pipelineStatusColor(row.isoStatus)" size="medium" :variant="row.isoStatus === 'pending' ? 'outline' : 'filled'">
                {{ pipelineStatusLabel(row.isoStatus) }}
              </OTag>
            </template>
            <template #td_testStatus="{ row }">
              <OTag :color="pipelineStatusColor(row.testStatus)" size="medium" :variant="row.testStatus === 'pending' ? 'outline' : 'filled'">
                {{ pipelineStatusLabel(row.testStatus) }}
              </OTag>
            </template>
            <template #td_pipelineStatus="{ row }">
              <OTag :color="pipelineStatusColor(row.pipelineStatus)" size="medium">
                {{ pipelineStatusLabel(row.pipelineStatus) }}
              </OTag>
            </template>
            <template #td_endedAt="{ row }">{{ row.endedAt ?? t('misc.dash') }}</template>
            <template #td_duration="{ row }">{{ row.duration ?? t('misc.dash') }}</template>
          </OTable>
        </div>
      </OTabPane>
    </OTab>

    <!-- ══ 时间计划统一编辑弹窗
         入口：时间计划卡片右上角「编辑」按钮
         ODialog size="large"（内容较多，需要足够空间）
         editingTimeline 为草稿，取消时丢弃，保存时写回 localTimeline
    ══ -->
    <ODialog
      v-model:visible="timelineEditorVisible"
      title="编辑时间计划"
      size="large"
    >
      <div class="tl-editor">
        <div
          v-for="(node, nodeIdx) in editingTimeline"
          :key="node.id"
          class="tl-editor__node"
        >
          <!-- 节点分隔线（首节点上方不加）-->
          <ODivider v-if="nodeIdx > 0" darker class="tl-editor__divider" />

          <!-- 节点标题行：名称 + 固定/动态标识 -->
          <div class="tl-editor__node-header">
            <div class="tl-editor__node-title">
              <span class="tl-editor__section-bar" />
              <span>{{ node.label }}</span>
              <OTag v-if="node.isFixed" color="info" size="medium" variant="outline">固定节点</OTag>
              <OTag v-else color="primary" size="medium" variant="outline">可多时段</OTag>
            </div>
            <!-- 动态节点：新增时间段按钮 -->
            <OButton
              v-if="!node.isFixed"
              variant="text" color="primary" size="small" round="pill"
              @click="addEditPeriod(node)"
            >+ 新增时间段</OButton>
          </div>

          <!-- 时间段列表 -->
          <div class="tl-editor__periods">
            <div
              v-for="(period, pIdx) in node.periods"
              :key="period.id"
              class="tl-editor__period-row"
            >
              <!-- 序号（动态节点多时段时显示） -->
              <span v-if="!node.isFixed" class="tl-editor__period-idx">
                第{{ pIdx + 1 }}段
              </span>

              <!-- 开始日期 -->
              <div class="tl-editor__field">
                <label class="tl-editor__label">
                  <span class="tl-editor__required">*</span>开始日期
                </label>
                <OInput
                  v-model="period.startDate"
                  placeholder="YYYY-MM-DD"
                  clearable
                />
              </div>

              <span class="tl-editor__arrow">→</span>

              <!-- 结束日期 -->
              <div class="tl-editor__field">
                <label class="tl-editor__label">结束日期<span class="tl-editor__optional">（可选）</span></label>
                <OInput
                  v-model="period.endDate"
                  placeholder="YYYY-MM-DD"
                  clearable
                />
              </div>

              <!-- 删除按钮：动态节点且有多个时间段才显示 -->
              <OButton
                v-if="!node.isFixed && node.periods.length > 1"
                variant="text" color="danger" size="small" round="pill"
                class="tl-editor__del-btn"
                @click="deleteEditPeriod(node, period.id)"
              >删除</OButton>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="tl-dialog-footer">
          <OButton variant="outline" size="medium" round="pill"
            @click="timelineEditorVisible = false">取消</OButton>
          <OButton variant="solid" color="primary" size="medium" round="pill"
            @click="saveTimeline">保存</OButton>
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

        <!-- ② 用例选择区 -->
        <div class="pl-dialog__section-title">
          <span class="pl-dialog__bar" />用例选择区
          <span class="pl-dialog__case-count">
            已选 <strong>{{ dialogSelectedIds.length }}</strong> / {{ dialogCases.length }} 个用例
          </span>
        </div>

        <!-- 筛选器 -->
        <div class="pl-dialog__filter">
          <OSelect v-model="dialogFilter.level" placeholder="用例级别" variant="outline" round="pill" size="small"
            class="pl-dialog__filter-sel" @change="dialogPage = 1">
            <OOption v-for="o in dialogLevelOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
          <OSelect v-model="dialogFilter.testType" placeholder="测试类型" variant="outline" round="pill" size="small"
            class="pl-dialog__filter-sel" @change="dialogPage = 1">
            <OOption v-for="o in dialogTypeOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
          <OSelect v-model="dialogFilter.autoStatus" placeholder="自动化类型" variant="outline" round="pill" size="small"
            class="pl-dialog__filter-sel" @change="dialogPage = 1">
            <OOption v-for="o in dialogAutoOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
          <OSelect v-model="dialogFilter.execResult" placeholder="用例执行结果" variant="outline" round="pill" size="small"
            class="pl-dialog__filter-sel pl-dialog__filter-sel--wide" @change="dialogPage = 1">
            <OOption v-for="o in dialogResultOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
          <OLink color="primary" class="pl-dialog__filter-clear" @click="clearDialogFilter">清除筛选</OLink>
        </div>

        <!-- 用例表格（横向滚动，复用 TestCaseTab 设计）-->
        <div class="pl-dialog__table-wrap">
          <OTable :columns="dialogCaseColumns" :data="dialogPagedCases">
            <template #th_select>
              <OCheckbox v-model="dialogAllChecked" />
            </template>
            <template #td_select="{ row }">
              <OCheckbox v-model="dialogSelectedIds" :value="row.id" />
            </template>
            <!-- 用例名称：粗体，允许换行 -->
            <template #td_name="{ row }">
              <span class="pl-dialog__cell-name">{{ row.name }}</span>
            </template>
            <!-- 用例编号：等宽，辅助色 -->
            <template #td_testId="{ row }">
              <span class="pl-dialog__cell-id">{{ row.testId }}</span>
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
            <template #td_feature="{ row }">
              <span class="pl-dialog__cell-plain">{{ row.feature || '—' }}</span>
            </template>
            <template #td_lastExecutor="{ row }">
              <span class="pl-dialog__cell-plain">{{ row.lastExecutor || '—' }}</span>
            </template>
            <template #td_testType="{ row }">
              <span class="pl-dialog__cell-plain">{{ dlgTypeLabel(row.testType) }}</span>
            </template>
            <template #td_isAutomated="{ row }">
              <OTag :color="row.isAutomated ? 'success' : 'info'" size="medium" variant="outline">
                {{ row.isAutomated ? 'TRUE' : 'FALSE' }}
              </OTag>
            </template>
          </OTable>
        </div>

        <!-- 分页 -->
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
          <OButton variant="outline" size="medium" round="pill" @click="pipelineDialog.visible = false">取消</OButton>
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
            <label class="add-proj-form__label">项目描述</label>
            <OTextarea v-model="addProjectDialog.form.description" placeholder="请输入项目描述" :rows="3" />
          </div>
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">内核版本</label>
            <OInput v-model="addProjectDialog.form.kernelVersion" placeholder="例：5.10" clearable />
          </div>
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">OS版本</label>
            <OInput v-model="addProjectDialog.form.osVersion" placeholder="例：openEuler 24.03 LTS" clearable />
          </div>
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">项目状态</label>
            <OSelect v-model="addProjectDialog.form.status">
              <OOption value="active"   :label="t('project.statusActive')" />
              <OOption value="planning" :label="t('project.statusPlanning')" />
              <OOption value="archived" :label="t('project.statusArchived')" />
            </OSelect>
          </div>
        </div>

        <ODivider darker />

        <!-- 硬件规格 -->
        <div class="add-proj-form__section-title">
          <span class="add-proj-form__bar" />硬件规格
        </div>
        <div class="add-proj-form__grid">
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">产品版本</label>
            <OSelect v-model="addProjectDialog.form.productVersion">
              <OOption value="950"    label="950" />
              <OOption value="950Pro" label="950Pro" />
              <OOption value="920"    label="920" />
            </OSelect>
          </div>
          <div class="add-proj-form__field">
            <label class="add-proj-form__label">CPU架构</label>
            <OSelect v-model="addProjectDialog.form.cpuArch">
              <OOption value="x86_64"  label="x86_64" />
              <OOption value="aarch64" label="aarch64" />
            </OSelect>
          </div>
        </div>

        <ODivider darker />

        <!-- 时间计划 -->
        <div class="add-proj-form__section-title">
          <span class="add-proj-form__bar" />时间计划
          <span class="add-proj-form__hint">日期格式：YYYY-MM-DD</span>
        </div>
        <div class="add-proj-form__timeline">
          <!-- 启动 -->
          <div class="add-proj-form__timeline-row">
            <span class="add-proj-form__timeline-label">启动</span>
            <div class="add-proj-form__timeline-dates">
              <OInput v-model="addProjectDialog.form.startDate"
                placeholder="开始日期（必填）" clearable class="add-proj-form__date-input" />
            </div>
            <span class="add-proj-form__timeline-tag add-proj-form__timeline-tag--fixed">固定节点</span>
          </div>
          <!-- 开发 -->
          <div class="add-proj-form__timeline-row">
            <span class="add-proj-form__timeline-label">开发</span>
            <div class="add-proj-form__timeline-dates">
              <OInput v-model="addProjectDialog.form.devStartDate"
                placeholder="开始日期" clearable class="add-proj-form__date-input" />
              <span class="add-proj-form__arrow">→</span>
              <OInput v-model="addProjectDialog.form.devEndDate"
                placeholder="结束日期（可选）" clearable class="add-proj-form__date-input" />
            </div>
            <span class="add-proj-form__timeline-tag add-proj-form__timeline-tag--flex">可多时段</span>
          </div>
          <!-- 测试 -->
          <div class="add-proj-form__timeline-row">
            <span class="add-proj-form__timeline-label">测试</span>
            <div class="add-proj-form__timeline-dates">
              <OInput v-model="addProjectDialog.form.testStartDate"
                placeholder="开始日期" clearable class="add-proj-form__date-input" />
              <span class="add-proj-form__arrow">→</span>
              <OInput v-model="addProjectDialog.form.testEndDate"
                placeholder="结束日期（可选）" clearable class="add-proj-form__date-input" />
            </div>
            <span class="add-proj-form__timeline-tag add-proj-form__timeline-tag--flex">可多时段</span>
          </div>
          <!-- 交付 -->
          <div class="add-proj-form__timeline-row">
            <span class="add-proj-form__timeline-label">交付</span>
            <div class="add-proj-form__timeline-dates">
              <OInput v-model="addProjectDialog.form.deliverDate"
                placeholder="开始日期（必填）" clearable class="add-proj-form__date-input" />
            </div>
            <span class="add-proj-form__timeline-tag add-proj-form__timeline-tag--fixed">固定节点</span>
          </div>
        </div>

      </div>

      <template #footer>
        <div class="add-proj-footer">
          <OButton variant="outline" size="medium" round="pill" @click="addProjectDialog.visible = false">取消</OButton>
          <OButton variant="solid" color="primary" size="medium" round="pill" @click="handleAddProjectConfirm">确认创建</OButton>
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
  }

  // Overview layout
  &__overview {
    display: flex;
    gap: var(--o-r-grid-column-gutter);
    margin-top: var(--o-r-gap-5);

    @media (max-width: 1200px) { flex-direction: column; }
  }

  &__form-card { width: 100%; }

  &__section-title {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
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
    font-size: var(--o-r-font_size-text1);
    font-weight: var(--o-font_weight-bold);
    color: var(--o-color-info1);
    margin: 0 0 var(--o-r-gap-4) 0;
  }
}

// ── 执行配置区内联样式 ──────────────────────────────────────────────────────
.pl-execute {
  &__section-title {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    margin-bottom: var(--o-r-gap-4);

    &--mt { margin-top: var(--o-r-gap-5); }
  }

  &__bar {
    width: 4px;
    height: 16px;
    background-color: var(--o-color-primary1);
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__section-title {
    font-size: var(--o-r-font_size-text1);
    font-weight: var(--o-font_weight-bold);
    color: var(--o-color-info1);
  }

  &__case-count {
    margin-left: auto;
    font-size: var(--o-r-font_size-tip1);
    color: var(--o-color-info3);
    strong { color: var(--o-color-primary1); }
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
  &__cell-name { color: var(--o-color-info1); font-size: var(--o-r-font_size-tip1); font-weight: var(--o-font_weight-bold); line-height: var(--o-r-line_height-tip1); }
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

// ── 统一时间计划编辑弹窗 ────────────────────────────────────────────────────────
.tl-editor {
  display: flex;
  flex-direction: column;

  &__divider { margin: var(--o-r-gap-5) 0; }

  &__node { display: flex; flex-direction: column; gap: var(--o-r-gap-4); }

  // 节点标题行：节点名 + 标识 Tag + 新增按钮
  &__node-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__node-title {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
    font-weight: var(--o-font_weight-bold);
  }

  // 与页面节title相同的左侧色条
  &__section-bar {
    display: inline-block;
    width: 4px;
    height: 16px;
    background-color: var(--o-color-primary1);
    border-radius: 2px;
    flex-shrink: 0;
  }

  // 时间段列表
  &__periods { display: flex; flex-direction: column; gap: var(--o-r-gap-4); }

  // 单个时间段行：序号 + 开始日期 + 箭头 + 结束日期 + 删除
  &__period-row {
    display: flex;
    align-items: flex-end;
    gap: var(--o-r-gap-4);
    flex-wrap: wrap;
  }

  &__period-idx {
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    white-space: nowrap;
    padding-bottom: 6px; // 与 OInput 底部对齐
    min-width: 32px;
  }

  // 日期字段（label + OInput）
  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-2);
    flex: 1;
    min-width: 160px;
    max-width: 240px;
  }

  &__label {
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    font-weight: var(--o-font_weight-regular);
  }

  &__required { color: var(--o-color-danger1); margin-right: var(--o-r-gap-1); }
  &__optional { color: var(--o-color-info4); font-weight: var(--o-font_weight-regular); margin-left: 4px; }

  // 开始→结束 箭头分隔
  &__arrow {
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-tip1);
    padding-bottom: 8px; // 与 OInput 底部视觉对齐
    flex-shrink: 0;
  }

  // 删除按钮：右侧，底部对齐
  &__del-btn {
    align-self: flex-end;
    padding-bottom: 4px;
  }
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

  &__section-title {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
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

  &__filter-sel { width: 120px; }
  &__filter-sel--wide { width: 140px; }
  &__filter-clear {
    font-size: var(--o-r-font_size-tip1);
    color: var(--o-color-info3);
    cursor: pointer;
    white-space: nowrap;
  }

  // 表格
  &__table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

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
.add-proj-form {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-5);

  &__section-title {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    font-weight: var(--o-font_weight-bold);
  }

  &__bar {
    display: inline-block;
    width: 4px; height: 16px;
    background-color: var(--o-color-primary1);
    border-radius: 2px; flex-shrink: 0;
  }

  &__hint {
    margin-left: auto;
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-tip2);
    font-weight: var(--o-font_weight-regular);
  }

  // 2列网格
  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--o-r-gap-4) var(--o-r-grid-column-gutter);
  }

  &__field {
    width: calc(50% - var(--o-r-grid-column-gutter) / 2);
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-2);
    &--full { width: 100%; }
  }

  &__label {
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    font-weight: var(--o-font_weight-regular);
  }

  &__required { color: var(--o-color-danger1); margin-right: var(--o-r-gap-1); }

  // 时间计划：每行 = 标签 + 日期输入 + 类型标识
  &__timeline {
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-4);
  }

  &__timeline-row {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-4);
    flex-wrap: wrap;
  }

  &__timeline-label {
    width: 36px;
    flex-shrink: 0;
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    font-weight: var(--o-font_weight-bold);
  }

  &__timeline-dates {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-3);
    flex: 1;
    flex-wrap: wrap;
  }

  &__date-input { width: 180px; }

  &__arrow {
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-tip1);
    flex-shrink: 0;
  }

  // 节点类型标识
  &__timeline-tag {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: var(--o-radius_control-m);
    font-size: var(--o-r-font_size-tip2);
    line-height: var(--o-r-line_height-tip2);

    &--fixed {
      color: var(--o-color-info3);
      background-color: var(--o-color-fill3);
      border: 1px solid var(--o-color-control1);
    }

    &--flex {
      color: var(--o-color-primary1);
      background-color: var(--o-color-primary4-light);
      border: 1px solid var(--o-color-primary4);
    }
  }
}

// 弹窗底部
.add-proj-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--o-r-gap-3);
}
</style>

<!-- 弹窗/执行区内表格横向滚动：OTable 内置 overflow:hidden，必须全局覆盖 -->
<style>
.pl-dialog__table-wrap .o-table-wrap,
.pl-execute__table-wrap .o-table-wrap {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.pl-dialog__table-wrap table,
.pl-execute__table-wrap table {
  min-width: 1692px;
  table-layout: fixed;
}
.pl-dialog__table-wrap th,
.pl-execute__table-wrap th {
  white-space: normal;
  word-break: break-word;
}
.pl-dialog__table-wrap td:not(:first-child),
.pl-execute__table-wrap td:not(:first-child) {
  overflow: hidden;
}
.pl-dialog__table-wrap th:first-child,
.pl-dialog__table-wrap td:first-child,
.pl-execute__table-wrap th:first-child,
.pl-execute__table-wrap td:first-child {
  overflow: visible;
  text-align: center;
  padding-left: 16px;
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
.proj-detail__form-card .o-card-main-wrap,
.proj-detail__hw-card .o-card-main-wrap {
  justify-content: flex-start;
}

.proj-detail__form-card .proj-detail__form-footer,
.proj-detail__hw-card .proj-detail__form-footer {
  margin-top: auto;
}
</style>