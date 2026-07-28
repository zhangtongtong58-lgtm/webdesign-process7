<script setup lang="ts">
import { computed, reactive, ref, nextTick } from 'vue'
import {
  OButton, OTag, OTable, OPagination, OSelect, OOption,
  OCheckbox, OLink, OMessage, ODialog, OInput, OTextarea,
  OSwitch, OUpload, ODropdown, ODivider,
} from '@opensig/opendesign'
import { useAuth } from '../../../composables/useAuth'
import { MOCK_TEST_CASES, MOCK_PATCHES, type TestCase } from '../../../mock/data'
import { t } from '../../../i18n/zh'

// patchIds：从补丁看板"查看对应用例"传入，非空时只显示关联用例
const props = defineProps<{ projectId: string; patchIds?: string[] }>()
const { isAdmin } = useAuth()

const cases = computed<TestCase[]>(() => MOCK_TEST_CASES.filter((tc) => tc.projectId === props.projectId))

// ─── 筛选器 ───────────────────────────────────────────────────────────────────
const filters = reactive<{
  testCaseModule: string | null; level: string | null; testType: string | null; autoStatus: string | null; execResult: string | null; uniqueId: string | null
}>({ testCaseModule: null, level: null, testType: null, autoStatus: null, execResult: null, uniqueId: null })
const applied = reactive({ ...filters })

const moduleOptions = [{ value: 'ACC', label: 'ACC' }, { value: 'ZIP', label: 'ZIP' }, { value: 'PCIe', label: 'PCIe' }, { value: 'UACCE', label: 'UACCE' }]
const mainKeyOptions = computed(() =>
  [...new Set(MOCK_PATCHES.filter(p => p.projectId === props.projectId).map(p => p.mainKey))].sort().map(k => ({ value: k, label: k }))
)
const levelOptions    = [
  { value: 'Level 1', label: 'Level 1' }, { value: 'Level 1/2', label: 'Level 1/2' },
  { value: 'Level 0/1/2/3', label: 'Level 0/1/2/3' }, { value: 'Level 2', label: 'Level 2' },
]
const testTypeOptions = [
  { value: 'functional', label: '功能' }, { value: 'performance', label: '性能' },
  { value: 'reliability', label: '可靠性' }, { value: 'compatibility', label: '兼容性' },
  { value: 'security', label: '安全性' }, { value: 'serviceability', label: '可服务性' },
  { value: 'usability', label: '易用性' },
]
const autoOptions    = [{ value: 'true', label: 'TRUE' }, { value: 'false', label: 'FALSE' }]
const execResultOpts = [
  { value: 'passed', label: 'Passed' }, { value: 'fail', label: 'Fail' },
  { value: 'block', label: 'Block' }, { value: 'unavailable', label: 'Unavailable' },
]
const uniqueIdOptions = computed(() =>
  [...new Set(cases.value.map(tc => tc.testId))].sort().map(id => ({ value: id, label: id }))
)

const filtered = computed<TestCase[]>(() =>
  cases.value.filter((tc) => {
    const matchPatch = !props.patchIds?.length || props.patchIds.includes(tc.patchId)
    const matchModule = !applied.testCaseModule || tc.testCaseModule === applied.testCaseModule
    const matchLevel  = !applied.level      || tc.level === applied.level
    const matchType   = !applied.testType   || tc.testType === applied.testType
    const matchAuto   = !applied.autoStatus || String(tc.isAutomated) === applied.autoStatus
    const matchResult = !applied.execResult || tc.lastExecResult === applied.execResult
    const matchUid    = !applied.uniqueId   || tc.testId === applied.uniqueId
    return matchPatch && matchModule && matchLevel && matchType && matchAuto && matchResult && matchUid
  })
)

const page = ref(1); const pageSize = ref(10)
const pagedRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const onPageChange = (val: { page: number; pageSize: number }) => {
  page.value = val.pageSize !== pageSize.value ? 1 : val.page; pageSize.value = val.pageSize
}

const stats = computed(() => [
  { id: 'total',  label: t('tc.total'),     value: cases.value.length, mod: 'primary' },
  { id: 'passed', label: 'Passed',           value: cases.value.filter(tc => tc.lastExecResult === 'passed').length, mod: 'success' },
  { id: 'fail',   label: 'Fail',             value: cases.value.filter(tc => tc.lastExecResult === 'fail').length, mod: 'danger' },
  { id: 'auto',   label: t('tc.automation'), value: cases.value.filter(tc => tc.isAutomated).length, mod: 'warning' },
])

// 14 列（含勾选列）
const columns = computed(() => {
  if (!isAdmin.value) {
    return [
      { label: '', key: 'select', width: 72, minWidth: 72 },
      { label: '名称', key: 'name', width: 160, minWidth: 160 },
      { label: '用例模块', key: 'testCaseModule', width: 100, minWidth: 100 },
      { label: '最后一次执行结果', key: 'lastExecResult', width: 140, minWidth: 140 },
    ]
  }
  return [
    { label: '', key: 'select', width: 72, minWidth: 72 },
    { label: '名称', key: 'name', width: 140, minWidth: 140 },
    { label: '编号', key: 'testId', width: 140, minWidth: 140 },
    { label: '唯一标识符', key: 'mainKey', width: 110, minWidth: 110 },
    { label: '级别', key: 'level', width: 100, minWidth: 100 },
    { label: '预置条件', key: 'precondition', width: 200, minWidth: 200 },
    { label: '测试步骤', key: 'testSteps', width: 200, minWidth: 200 },
    { label: '预期结果', key: 'expectedResult', width: 180, minWidth: 180 },
    { label: '自动化脚本/路径', key: 'automationScript', width: 240, minWidth: 240 },
    { label: '最后一次执行结果', key: 'lastExecResult', width: 160, minWidth: 160 },
    { label: '用例模块', key: 'testCaseModule', width: 100, minWidth: 100 },
    { label: '最后执行人', key: 'lastExecutor', width: 120, minWidth: 120 },
    { label: '测试类型', key: 'testType', width: 100, minWidth: 100 },
    { label: '自动化类型', key: 'isAutomated', width: 120, minWidth: 120 },
    { label: '操作', key: 'action', width: 150, minWidth: 150 },
  ]
})

const tableMinWidth = computed(() => {
  // 固定表格宽度：非管理员 2892px，管理员 3282px
  return isAdmin.value ? '3282px' : '2892px'
})

const execColor = (r: string) =>
  ({ passed: 'success', fail: 'danger', block: 'warning', unavailable: 'normal', pending: 'info' }[r] ?? 'info')
const execLabel = (r: string) =>
  ({ passed: '通过', fail: '失败', block: '阻塞', unavailable: '不可用', pending: '—' }[r] ?? r)
const typeLabel = (tp: string) =>
  ({ functional: '功能', performance: '性能', reliability: '可靠性', compatibility: '兼容性',
     security: '安全性', serviceability: '可服务性', usability: '易用性' }[tp] ?? tp)

const handleQuery = () => { Object.assign(applied, filters); page.value = 1 }
const handleClear = () => {
  Object.assign(filters, { testCaseModule: null, level: null, testType: null, autoStatus: null, execResult: null, uniqueId: null })
  handleQuery()
}

// ─── 行级勾选（与 PatchTab 相同模式）─────────────────────────────────────────
const selectedIds = ref<string[]>([])
const allChecked = computed({
  get: () => pagedRows.value.length > 0 && pagedRows.value.every(r => selectedIds.value.includes(r.id)),
  set: (v: boolean) => {
    if (v) {
      const pageIds = pagedRows.value.map(r => r.id)
      selectedIds.value = [...new Set([...selectedIds.value, ...pageIds])]
    } else {
      const pageIds = new Set(pagedRows.value.map(r => r.id))
      selectedIds.value = selectedIds.value.filter(id => !pageIds.has(id))
    }
  }
})

// ─── 新增用例弹窗 ──────────────────────────────────────────────────────────────
// 包含除"最后一次执行结果"和"最后执行人"外的所有字段
interface AddCaseForm {
  name: string; testId: string; mainKey: string; level: string
  precondition: string; testSteps: string; expectedResult: string
  automationScript: string; testCaseModule: string; testType: string; isAutomated: string
}

const EMPTY_CASE: AddCaseForm = {
  name: '', testId: '', mainKey: '', level: '',
  precondition: '', testSteps: '', expectedResult: '',
  automationScript: '', testCaseModule: '', testType: '', isAutomated: '',
}

const addDialog = reactive({ visible: false, form: { ...EMPTY_CASE } as AddCaseForm })

const openAddDialog = () => {
  Object.assign(addDialog.form, { ...EMPTY_CASE })
  addDialog.visible = true
}

const handleAddConfirm = () => {
  if (!addDialog.form.name.trim()) { OMessage.warning('用例名称不能为空'); return }
  if (!addDialog.form.testId.trim()) { OMessage.warning('编号不能为空'); return }
  if (!addDialog.form.mainKey) { OMessage.warning('请选择唯一标识符'); return }
  if (!addDialog.form.testType) { OMessage.warning('请选择测试类型'); return }
  OMessage.success('用例新增成功')
  addDialog.visible = false
}

// ─── 导入弹窗 ────────────────────────────────────────────────────────────────
const importDialog = reactive({ visible: false })
const importFiles = ref<any[]>([])

const handleImportUpload = async () => {
  await new Promise(r => setTimeout(r, 800))
  return Promise.resolve()
}

const handleImportConfirm = () => {
  if (!importFiles.value.length) { OMessage.warning('请先上传 Excel 文件'); return }
  OMessage.success(`已成功导入 ${importFiles.value.length} 个文件`)
  importFiles.value = []
  importDialog.visible = false
}

// ─── 导出 ────────────────────────────────────────────────────────────────────
const handleExport = (type: 'all' | 'selected') => {
  if (type === 'selected' && selectedIds.value.length === 0) {
    OMessage.warning('请先勾选要导出的用例')
    return
  }
  const count = type === 'all' ? filtered.value.length : selectedIds.value.length
  OMessage.success(`已导出 ${count} 条用例数据`)
}

// ─── 执行测试：奇次成功/偶次失败（结果面板展示）────────────────────────────────
const execClickCount = ref(0)
const execResult = reactive({
  visible: false,
  success: false,
  caseResults: [] as { name: string; id: string; status: 'pass' | 'fail' }[],
})

const handleRun = () => {
  if (!selectedIds.value.length) { OMessage.warning('请先勾选要执行的用例'); return }
  execClickCount.value++
  const isSuccess = execClickCount.value % 2 === 1
  execResult.success = isSuccess
  execResult.visible = true

  const selectedCases = cases.value.filter(c => selectedIds.value.includes(c.id))
  execResult.caseResults = selectedCases.map(c => ({
    name: c.name,
    id: c.testId,
    status: isSuccess ? 'pass' : (Math.random() > 0.4 ? 'fail' : 'pass'),
  }))
}

const editDialog = reactive({
  visible: false,
  form: { ...EMPTY_CASE } as AddCaseForm,
  targetId: '',
  targetName: '',
})

const handleEdit = (row: any) => {
  editDialog.targetId = row.id
  editDialog.targetName = row.name
  Object.assign(editDialog.form, {
    name: row.name ?? '',
    testId: row.testId ?? '',
    mainKey: row.mainKey ?? '',
    level: row.level ?? '',
    precondition: row.precondition ?? '',
    testSteps: row.testSteps ?? '',
    expectedResult: row.expectedResult ?? '',
    automationScript: row.automationScript ?? '',
    testCaseModule: row.testCaseModule ?? '',
    testType: row.testType ?? '',
    isAutomated: String(row.isAutomated) ?? '',
  })
  editDialog.visible = true
}

const handleEditConfirm = () => {
  if (!editDialog.form.name.trim()) { OMessage.warning('用例名称不能为空'); return }
  OMessage.success(`用例「${editDialog.targetName}」已更新`)
  editDialog.visible = false
}

// ─── 批量删除 ─────────────────────────────────────────────────────────────────
const batchDeleteDialog = reactive({ visible: false })
const deleteDialog = reactive({ visible: false, targetId: '', targetName: '' })

const handleDelete = (row: any) => {
  deleteDialog.targetId = row.id
  deleteDialog.targetName = row.name
  deleteDialog.visible = true
}

const confirmDelete = () => {
  OMessage.success(`用例「${deleteDialog.targetName}」已删除`)
  deleteDialog.visible = false
}

const handleBatchDelete = () => {
  if (!selectedIds.value.length) { OMessage.warning('请先勾选要删除的用例'); return }
  batchDeleteDialog.visible = true
}

const batchDeleteSecondConfirm = reactive({ visible: false })

const confirmBatchDelete = () => {
  batchDeleteDialog.visible = false
  nextTick(() => { batchDeleteSecondConfirm.visible = true })
}

const confirmBatchDeleteFinal = () => {
  OMessage.success(`已删除 ${selectedIds.value.length} 条用例`)
  selectedIds.value = []
  batchDeleteSecondConfirm.visible = false
}

const allDeleteDialog = reactive({ visible: false })

const handleAllDelete = () => {
  allDeleteDialog.visible = true
}

const confirmAllDelete = () => {
  OMessage.success(`已删除全部 ${filtered.value.length} 条用例`)
  selectedIds.value = []
  allDeleteDialog.visible = false
}
</script>

<template>
  <div class="tc-tab">
    <!-- 从补丁看板"查看对应用例"跳转时显示过滤提示 -->
    <div v-if="props.patchIds?.length" class="tc-tab__patch-notice">
      <span class="tc-tab__notice-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.0312 2.34969C13.6625 2.34969 15.2371 2.75343 16.6415 3.51339C16.9815 3.69739 17.108 4.12218 16.924 4.46218C16.74 4.80219 16.3152 4.92867 15.9752 4.74467C14.7742 4.09476 13.4284 3.74969 12.0312 3.74969C7.44721 3.74969 3.73118 7.46573 3.73118 12.0497C3.73118 16.6337 7.44721 20.3497 12.0312 20.3497C16.6151 20.3497 20.3312 16.6337 20.3312 12.0497C20.3312 9.98725 19.577 8.04389 18.234 6.53456C17.977 6.24575 18.0028 5.80329 18.2916 5.54629C18.5804 5.2893 19.0229 5.31509 19.2799 5.60391C20.8489 7.36716 21.7312 9.64078 21.7312 12.0497C21.7312 17.4069 17.3883 21.7497 12.0312 21.7497C6.67402 21.7497 2.33118 17.4069 2.33118 12.0497C2.33118 6.69253 6.67401 2.34969 12.0312 2.34969ZM13.1333 7.65356C13.1333 8.27889 12.6253 8.78685 12 8.78685C11.3747 8.78685 10.8667 8.27889 10.8667 7.65356C10.8667 7.02823 11.3747 6.52027 12 6.52027C12.6253 6.52027 13.1333 7.02823 13.1333 7.65356ZM12.7065 9.99663C12.6614 9.65479 12.3695 9.39036 12.0151 9.38905C11.6285 9.38762 11.314 9.69985 11.3125 10.0864L11.2875 16.85L11.2935 16.945C11.3386 17.2869 11.6305 17.5513 11.9849 17.5526C12.3715 17.5541 12.686 17.2418 12.6875 16.8552L12.7125 10.0916L12.7065 9.99663Z" fill="currentColor" fill-opacity="0.8"/>
        </svg>
      </span>
      <span>当前仅显示与选中 <strong>{{ props.patchIds.length }}</strong> 个补丁关联的用例</span>
    </div>

    <!-- 筛选器 + 操作按钮（同一行） -->
    <div class="tc-tab__filter-row">
      <div class="tc-tab__filter">
        <OSelect v-model="filters.testCaseModule" placeholder="用例模块" variant="outline" searchable size="medium"
          class="tc-tab__sel" @change="handleQuery">
          <OOption v-for="o in moduleOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="filters.level" placeholder="用例级别" variant="outline" searchable size="medium"
          class="tc-tab__sel" @change="handleQuery">
          <OOption v-for="o in levelOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="filters.testType" placeholder="测试类型" variant="outline" searchable size="medium"
          class="tc-tab__sel" @change="handleQuery">
          <OOption v-for="o in testTypeOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="filters.autoStatus" placeholder="自动化状态" variant="outline" searchable size="medium"
          class="tc-tab__sel" @change="handleQuery">
          <OOption v-for="o in autoOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="filters.execResult" placeholder="用例执行结果" variant="outline" searchable size="medium"
          class="tc-tab__sel tc-tab__sel--wide" @change="handleQuery">
          <OOption v-for="o in execResultOpts" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="filters.uniqueId" placeholder="唯一标识符" variant="outline" searchable size="medium"
          class="tc-tab__sel tc-tab__sel--wide" @change="handleQuery">
          <OOption v-for="o in uniqueIdOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OLink color="primary" class="tc-tab__clear" @click="handleClear">清除筛选</OLink>
      </div>

      <div class="tc-tab__actions">
        <OButton v-if="isAdmin" variant="outline" color="primary" size="medium" round="pill" @click="openAddDialog">
          {{ t('tc.create') }}
        </OButton>
        <OButton variant="outline" color="primary" size="medium" round="pill" @click="handleRun()">
          执行测试
        </OButton>
        <ODropdown v-if="isAdmin" trigger="click">
          <OButton variant="outline" color="primary" size="medium" round="pill">
            更多操作
            <template #suffix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.250616 0.205025C2.94745e-05 0.455612 -0.0208527 0.848918 0.187969 1.12329L0.250616 1.19497L5.26695 6.21131C5.36737 6.31173 5.38172 6.46563 5.30999 6.58133L5.26695 6.63558L0.205025 11.6975C-0.0683418 11.9709 -0.0683418 12.4141 0.205025 12.6875C0.455612 12.938 0.848918 12.9589 1.12329 12.7501L1.19497 12.6875L6.2569 7.62553C6.88585 6.99658 6.91895 5.99741 6.35621 5.32949L6.2569 5.22136L1.24057 0.205025C0.967198 -0.0683418 0.523983 -0.0683418 0.250616 0.205025Z" fill="currentColor" fill-opacity="0.8" transform="matrix(0,1,1,0,5.55376,8.62259)"/>
              </svg>
            </template>
          </OButton>
          <template #dropdown>
            <div class="more-menu">
              <div class="more-menu__item" @click="importDialog.visible = true">{{ t('tc.importBtn') }}</div>
              <div class="more-menu__item" @click="handleExport('all')">导出全部</div>
              <div class="more-menu__item" @click="handleExport('selected')">
                导出所选
                <span v-if="selectedIds.length > 0" class="more-menu__count">（{{ selectedIds.length }}条）</span>
              </div>
              <div class="more-menu__item more-menu__item--danger" @click="handleBatchDelete()">批量删除</div>
              <div class="more-menu__item more-menu__item--danger" @click="handleAllDelete()">全部删除</div>
            </div>
          </template>
        </ODropdown>
      </div>
    </div>

    <div class="tc-tab__table-wrap" :style="{ '--tc-table-min-width': tableMinWidth }">
      <OTable :columns="columns" :data="pagedRows">
        <!-- 勾选列 -->
        <template #th_select>
          <OCheckbox v-model="allChecked" />
        </template>
        <template #td_select="{ row }">
          <OCheckbox v-model="selectedIds" :value="row.id" />
        </template>
        <template #td_testId="{ row }">
          <span class="tc-tab__cell-id">{{ row.testId }}</span>
        </template>
        <template #td_mainKey="{ row }">
          <span class="tc-tab__cell-id">{{ row.mainKey }}</span>
        </template>
        <template #td_level="{ row }">
          <OTag color="info" size="medium" variant="outline">{{ row.level }}</OTag>
        </template>
        <template #td_precondition="{ row }">
          <span class="tc-tab__cell-text">{{ row.precondition }}</span>
        </template>
        <template #td_testSteps="{ row }">
          <span class="tc-tab__cell-text">{{ row.testSteps }}</span>
        </template>
        <template #td_expectedResult="{ row }">
          <span class="tc-tab__cell-text">{{ row.expectedResult }}</span>
        </template>
        <template #td_automationScript="{ row }">
          <OLink v-if="row.automationScript !== '—'" color="primary" href="javascript:void(0)" class="tc-tab__cell-script">
            {{ row.automationScript }}
          </OLink>
          <span v-else class="tc-tab__muted">—</span>
        </template>
        <template #td_lastExecResult="{ row }">
          <OTag :color="execColor(row.lastExecResult)" size="medium">{{ execLabel(row.lastExecResult) }}</OTag>
        </template>
        <template #td_testType="{ row }">
          <span class="tc-tab__cell-plain">{{ typeLabel(row.testType) }}</span>
        </template>
        <template #td_isAutomated="{ row }">
          <OTag :color="row.isAutomated ? 'success' : 'danger'" size="medium">
            {{ row.isAutomated ? 'TRUE' : 'FALSE' }}
          </OTag>
        </template>
        <template #td_testCaseModule="{ row }">
          <span class="tc-tab__cell-plain">{{ row.testCaseModule }}</span>
        </template>
        <template v-if="isAdmin" #td_action="{ row }">
           <div class="tc-tab__action-cell">
             <OLink color="primary" href="javascript:void(0)" @click="handleEdit(row)">{{ t('action.edit') }}</OLink>
             <OLink color="danger" href="javascript:void(0)" @click="handleDelete(row)">{{ t('action.delete') }}</OLink>
           </div>
         </template>
      </OTable>
    </div>

    <div class="tc-tab__bottom">
      <OPagination :total="filtered.length" :page="page" :page-size="pageSize" :page-sizes="[10,20,50]" @change="onPageChange" />
    </div>

    <!-- 执行结果弹窗 -->
    <ODialog v-model:visible="execResult.visible" :title="execResult.success ? '测试通过' : '测试失败'" class="result-dialog">
      <div class="exec-dialog-body">
        <p class="exec-dialog-body__summary">
          共 {{ execResult.caseResults.length }} 条，
          通过 {{ execResult.caseResults.filter(c => c.status === 'pass').length }} 条
          <template v-if="!execResult.success">
            ，失败 {{ execResult.caseResults.filter(c => c.status === 'fail').length }} 条
          </template>
        </p>
        <div class="exec-dialog-body__list">
          <div v-for="item in execResult.caseResults" :key="item.id" class="exec-dialog-body__row">
            <OTag :color="item.status === 'pass' ? 'success' : 'danger'" size="medium">
              {{ item.status === 'pass' ? 'Pass' : 'Fail' }}
            </OTag>
            <span class="exec-dialog-body__id">{{ item.id }}</span>
            <span class="exec-dialog-body__name">{{ item.name }}</span>
            <span v-if="item.status === 'fail'" class="exec-dialog-body__err">
              AssertionError: 执行结果与预期不符，请检查测试环境或用例配置
            </span>
          </div>
        </div>
      </div>
    </ODialog>
  </div>

  <!-- ══ 编辑用例弹窗 ════════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="editDialog.visible" title="编辑用例" size="large">
    <div class="tc-form">
      <div class="tc-form__section-title"><span class="tc-form__bar" />基本信息</div>
      <div class="tc-form__grid">
        <div class="tc-form__field">
          <label class="tc-form__label"><span class="tc-form__required">*</span>用例名称</label>
          <OInput v-model="editDialog.form.name" placeholder="请输入用例名称" clearable />
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label">编号</label>
          <OInput v-model="editDialog.form.testId" placeholder="例：PCIE_DPC_FUNC_003" clearable />
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label">唯一标识符</label>
          <OInput v-model="editDialog.form.mainKey" placeholder="例：321138:13916" clearable />
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label">级别</label>
          <OSelect v-model="editDialog.form.level" placeholder="请选择">
            <OOption v-for="o in levelOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label">测试类型</label>
          <OSelect v-model="editDialog.form.testType" placeholder="请选择">
            <OOption v-for="o in testTypeOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label">用例模块</label>
          <OSelect v-model="editDialog.form.testCaseModule" placeholder="请选择">
            <OOption v-for="o in moduleOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label">自动化类型</label>
          <OSelect v-model="editDialog.form.isAutomated" placeholder="请选择">
            <OOption value="true" label="TRUE" />
            <OOption value="false" label="FALSE" />
          </OSelect>
        </div>
        <div class="tc-form__field tc-form__field--full">
          <label class="tc-form__label">自动化脚本/路径</label>
          <OInput v-model="editDialog.form.automationScript" placeholder="例：D06:/test_cases/pcie/test.py::TestCase::test_dpc" clearable />
        </div>
      </div>

      <ODivider />

      <div class="tc-form__section-title"><span class="tc-form__bar" />测试内容</div>
      <div class="tc-form__grid">
        <div class="tc-form__field tc-form__field--full">
          <label class="tc-form__label">预置条件</label>
          <OTextarea v-model="editDialog.form.precondition" placeholder="描述测试前的准备条件" :rows="3" />
        </div>
        <div class="tc-form__field tc-form__field--full">
          <label class="tc-form__label">测试步骤</label>
          <OTextarea v-model="editDialog.form.testSteps" placeholder="逐步描述测试操作" :rows="4" />
        </div>
        <div class="tc-form__field tc-form__field--full">
          <label class="tc-form__label">预期结果</label>
          <OTextarea v-model="editDialog.form.expectedResult" placeholder="描述期望的测试结果" :rows="3" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="tc-dialog-footer">
        <OButton variant="outline" size="medium" @click="editDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="primary" size="medium" @click="handleEditConfirm">确认保存</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 单条删除确认弹窗 ════════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="deleteDialog.visible" title="确认删除" size="small">
    <div class="tc-delete-body">
      <p class="tc-delete-body__text">
        确认删除用例「<strong>{{ deleteDialog.targetName }}</strong>」？此操作不可恢复。
      </p>
    </div>
    <template #footer>
      <div class="tc-dialog-footer">
        <OButton variant="outline" size="medium" @click="deleteDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="danger" size="medium" @click="confirmDelete">确认删除</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 批量删除确认弹窗 ════════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="batchDeleteDialog.visible" title="确认批量删除" size="small">
    <div class="tc-delete-body">
      <p class="tc-delete-body__text">
        确认删除选中的 <strong>{{ selectedIds.length }} 条</strong>用例？此操作不可恢复。
      </p>
    </div>
    <template #footer>
      <div class="tc-dialog-footer">
        <OButton variant="outline" size="medium" @click="batchDeleteDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="danger" size="medium" @click="confirmBatchDelete">确认删除</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 批量删除二次确认弹窗 ════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="batchDeleteSecondConfirm.visible" title="再次确认" size="small">
    <div class="tc-delete-body">
      <p class="tc-delete-body__text">
        此操作不可恢复！确认永久删除选中的 <strong>{{ selectedIds.length }} 条</strong>用例？
      </p>
    </div>
    <template #footer>
      <div class="tc-dialog-footer">
        <OButton variant="outline" size="medium" @click="batchDeleteSecondConfirm.visible = false">取消</OButton>
        <OButton variant="solid" color="danger" size="medium" @click="confirmBatchDeleteFinal">确认永久删除</OButton>
      </div>
    </template>
  </ODialog> ════════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="allDeleteDialog.visible" title="确认全部删除" size="small">
    <div class="tc-delete-body">
      <p class="tc-delete-body__text">
        确认删除全部 <strong>{{ filtered.length }} 条</strong>用例？此操作不可恢复。
      </p>
    </div>
    <template #footer>
      <div class="tc-dialog-footer">
        <OButton variant="outline" size="medium" @click="allDeleteDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="danger" size="medium" @click="confirmAllDelete">确认删除</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 新增用例弹窗 ══════════════════════════════════════════════════════════
       包含除"最后一次执行结果"和"最后执行人"外的所有字段
       ODialog size="large" + 分区表单（2列网格）
  ══ -->
  <ODialog v-model:visible="addDialog.visible" title="新增用例" size="large">
    <div class="tc-form">
      <!-- 基本信息 -->
      <div class="tc-form__section-title"><span class="tc-form__bar" />基本信息</div>
      <div class="tc-form__grid">
        <div class="tc-form__field">
          <label class="tc-form__label"><span class="tc-form__required">*</span>用例名称</label>
          <OInput v-model="addDialog.form.name" placeholder="请输入用例名称" clearable />
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label"><span class="tc-form__required">*</span>编号</label>
          <OInput v-model="addDialog.form.testId" placeholder="例：PCIE_DPC_FUNC_003" clearable />
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label"><span class="tc-form__required">*</span>唯一标识符</label>
          <OSelect v-model="addDialog.form.mainKey" placeholder="请选择">
            <OOption v-for="o in mainKeyOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label"><span class="tc-form__required">*</span>级别</label>
          <OSelect v-model="addDialog.form.level" placeholder="请选择">
            <OOption v-for="o in levelOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label"><span class="tc-form__required">*</span>测试类型</label>
          <OSelect v-model="addDialog.form.testType" placeholder="请选择">
            <OOption v-for="o in testTypeOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label"><span class="tc-form__required">*</span>用例模块</label>
          <OSelect v-model="addDialog.form.testCaseModule" placeholder="请选择">
            <OOption v-for="o in moduleOptions" :key="o.value" :value="o.value" :label="o.label" />
          </OSelect>
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label"><span class="tc-form__required">*</span>自动化类型</label>
          <OSelect v-model="addDialog.form.isAutomated" placeholder="请选择">
            <OOption value="true" label="TRUE" />
            <OOption value="false" label="FALSE" />
          </OSelect>
        </div>
        <div class="tc-form__field tc-form__field--full">
          <label class="tc-form__label"><span class="tc-form__required">*</span>自动化脚本/路径</label>
          <OInput v-model="addDialog.form.automationScript" placeholder="例：D06:/test_cases/pcie/test.py::TestCase::test_dpc" clearable />
        </div>
      </div>

      <ODivider />

      <!-- 测试内容 -->
      <div class="tc-form__section-title"><span class="tc-form__bar" />测试内容</div>
      <div class="tc-form__grid">
        <div class="tc-form__field tc-form__field--full">
          <label class="tc-form__label"><span class="tc-form__required">*</span>预置条件</label>
          <OTextarea v-model="addDialog.form.precondition" placeholder="描述测试前的准备条件" :rows="3" />
        </div>
        <div class="tc-form__field tc-form__field--full">
          <label class="tc-form__label"><span class="tc-form__required">*</span>测试步骤</label>
          <OTextarea v-model="addDialog.form.testSteps" placeholder="逐步描述测试操作" :rows="4" />
        </div>
        <div class="tc-form__field tc-form__field--full">
          <label class="tc-form__label"><span class="tc-form__required">*</span>预期结果</label>
          <OTextarea v-model="addDialog.form.expectedResult" placeholder="描述期望的测试结果" :rows="3" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="tc-dialog-footer">
        <OButton variant="outline" size="medium" @click="addDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="primary" size="medium" @click="handleAddConfirm">确认新增</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 导入弹窗（Excel批量上传）════════════════════════════════════════════════
       OUpload 点击上传，支持 .xlsx / .xls / .csv
  ══ -->
  <ODialog v-model:visible="importDialog.visible" title="批量导入用例" size="medium" class="import-dialog">
    <div class="tc-import-body">
      <p class="tc-import-body__text">
        请按照模板格式准备 Excel 文件，支持 <strong>.xlsx</strong>、<strong>.xls</strong>、<strong>.csv</strong> 格式。
        <OLink color="primary" href="javascript:void(0)" class="tc-import-body__tmpl">下载导入模板</OLink>
      </p>
      <OUpload
        v-model="importFiles"
        accept=".xlsx,.xls,.csv"
        :multiple="false"
        :upload-request="handleImportUpload"
        btn-label="选择 Excel 文件"
        class="tc-import-body__upload"
      />
    </div>
    <template #footer>
      <div class="tc-dialog-footer">
        <OButton variant="solid" color="primary" size="medium" @click="handleImportConfirm">
          确认导入
        </OButton>
      </div>
    </template>
  </ODialog>
</template>

<style lang="scss" scoped>
.stat-card {
  flex: 1; padding: var(--o-r-gap-5) var(--o-r-gap-6);
  background-color: var(--o-color-fill2); border: 1px solid var(--o-color-control1);
  border-radius: var(--o-radius_control-m); border-left-width: 4px;
  display: flex; flex-direction: column; gap: var(--o-r-gap-2); min-width: 120px;
  &--primary { border-left-color: var(--o-color-primary1); .stat-card__num { color: var(--o-color-primary1); } }
  &--success { border-left-color: var(--o-color-success1); .stat-card__num { color: var(--o-color-success1); } }
  &--warning { border-left-color: var(--o-color-warning1); .stat-card__num { color: var(--o-color-warning1); } }
  &--danger  { border-left-color: var(--o-color-danger1);  .stat-card__num { color: var(--o-color-danger1);  } }
  &__num   { font-size: var(--o-r-font_size-h1); font-weight: var(--o-font_weight-bold); }
  &__label { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip1); }
}

.tc-tab {
  padding-top: var(--o-r-gap-5);
  &__patch-notice {
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
    strong { color: var(--o-color-primary1); }
  }
  &__notice-icon { color: var(--o-color-primary1); }
  &__stats { display: flex; gap: var(--o-r-grid-column-gutter); margin-bottom: var(--o-r-gap-6); }
  &__filter { display: flex; flex-wrap: wrap; align-items: center; gap: var(--o-r-gap-3); flex: 1; min-width: 0; }
  &__sel { width: 130px; }
  &__sel--wide { width: 150px; }
  &__clear { font-size: var(--o-r-font_size-tip1); color: var(--o-color-info3); cursor: pointer; white-space: nowrap; }

  &__filter-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--o-r-gap-4);
    flex-wrap: wrap;
    margin-bottom: var(--o-r-gap-5);
  }
  &__filter { display: flex; flex-wrap: wrap; gap: var(--o-r-gap-3); align-items: center; flex: 1; min-width: 0; }
  &__actions {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-3);
    flex-shrink: 0;

    // 按钮 hover 态：描边变实心填充
    :deep(.o-button--outline) {
      &:hover {
        background-color: var(--o-color-primary1) !important;
        color: var(--o-white) !important;
        border-color: var(--o-color-primary1) !important;
      }
    }
  }
  &__table-wrap {
    margin-bottom: var(--o-r-gap-5);
  }

  // ── 表格单元格统一样式 ────────────────────────────────────────────────
  &__cell-id { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip2); font-family: var(--o-font_family-code); white-space: nowrap; }
  &__cell-text { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); line-height: var(--o-r-line_height-tip1); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; max-width: 200px; }
  &__cell-script { color: var(--o-color-primary1); font-size: var(--o-r-font_size-tip2); font-family: var(--o-font_family-code); word-break: break-all; max-width: 240px; display: block; line-height: var(--o-r-line_height-tip2); }
  &__cell-plain { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); white-space: nowrap; }
  &__muted { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip1); }
  &__action-cell { display: flex; gap: var(--o-r-gap-2); white-space: nowrap; }
  &__bottom { display: flex; align-items: center; justify-content: flex-end; margin-top: var(--o-r-gap-5); padding-top: var(--o-r-gap-4); border-top: 1px solid var(--o-color-control4); }
}

// ── 新增用例表单 ───────────────────────────────────────────────────────────────
.tc-form {
  display: flex; flex-direction: column; gap: var(--o-r-gap-5);
  max-height: 60vh;
  overflow-y: auto;
  padding-right: var(--o-r-gap-2);
  &__section-title {
    display: flex; align-items: center; gap: var(--o-r-gap-2);
    color: var(--o-color-info1); font-size: var(--o-r-font_size-text1); font-weight: var(--o-font_weight-bold);
  }
  &__bar { display: inline-block; width: 4px; height: 16px; background-color: var(--o-color-primary1); border-radius: 2px; flex-shrink: 0; }
  &__grid { display: flex; flex-wrap: wrap; gap: var(--o-r-gap-4) var(--o-r-grid-column-gutter); }
  &__field {
    width: calc(50% - var(--o-r-grid-column-gutter) / 2);
    display: flex; flex-direction: column; gap: var(--o-r-gap-2);
    &--full { width: 100%; }
  }
  &__label { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); font-weight: var(--o-font_weight-regular); }
  &__required { color: var(--o-color-danger1); margin-right: var(--o-r-gap-1); }
  &__switch-row { display: flex; align-items: center; gap: var(--o-r-gap-3); padding-top: 4px; }
  &__switch-label { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); }
}

// ── 导入弹窗 ──────────────────────────────────────────────────────────────────
.tc-import-body {
  display: flex; flex-direction: column; gap: var(--o-r-gap-3);
  &__text { margin: 0; color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); line-height: var(--o-r-line_height-tip1); strong { color: var(--o-color-primary1); } }
  &__tmpl { margin-left: var(--o-r-gap-2); white-space: nowrap; font-size: var(--o-r-font_size-tip1); }
  &__upload { width: 100%; }
}

// ── 弹窗底部 ──────────────────────────────────────────────────────────────────
.tc-dialog-footer {
  display: flex; justify-content: flex-end; gap: var(--o-r-gap-3);
}

// ── 结果弹窗（高度自适应）────────────────────────────────────────────────────
.result-dialog {
  :deep(.o-dialog__body) {
    max-height: none;
  }
}

// ── 导入弹窗（高度自适应 + 紧凑布局）────────────────────────────────────────────
.import-dialog {
  :deep(.o-dialog__body) {
    max-height: none !important;
    padding: 16px 20px !important;
  }
}

// ── 执行结果弹窗内容 ──────────────────────────────────────────────────────────
.exec-dialog-body {
  &__summary {
    margin: 0 0 var(--o-r-gap-3) 0;
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
  }
  &__list {
    max-height: 300px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-2);
  }
  &__row {
    display: flex;
    align-items: flex-start;
    gap: var(--o-r-gap-3);
    padding: var(--o-r-gap-2) 0;
    border-bottom: 1px solid var(--o-color-control4);
    &:last-child { border-bottom: none; }
  }
  &__id {
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip2);
    font-family: var(--o-font_family-code);
    white-space: nowrap;
    min-width: 140px;
  }
  &__name {
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-tip1);
    flex: 1;
  }
  &__err {
    color: var(--o-color-danger1);
    font-size: var(--o-r-font_size-tip2);
    line-height: var(--o-r-line_height-tip2);
  }
}

// ── 批量删除确认弹窗 ──────────────────────────────────────────────────────────
.tc-delete-body {
  padding: var(--o-r-gap-3) 0;
  &__text {
    margin: 0;
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
    strong { color: var(--o-color-danger1); }
  }
}
</style>

<style>
.tc-tab__table-wrap .o-table-wrap {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.tc-tab__table-wrap table {
  min-width: var(--tc-table-min-width);
}
.tc-tab__table-wrap th {
  white-space: nowrap;
}
.tc-tab__table-wrap td {
  white-space: normal;
  word-break: break-word;
}
.tc-tab__table-wrap th:first-child,
.tc-tab__table-wrap td:first-child {
  text-align: left;
}
.tc-tab__table-wrap td .tc-tab__cell-text,
.tc-tab__table-wrap td .tc-tab__cell-script {
  white-space: normal;
  word-break: break-all;
}
/* 更多操作下拉菜单 */
.more-menu {
  padding: var(--o-r-gap-1) 0;
  min-width: 140px;
}
.more-menu__item {
  padding: 8px 16px;
  font-size: var(--o-r-font_size-tip1);
  color: var(--o-color-info1);
  cursor: pointer;
  transition: background-color 0.15s;
}
.more-menu__item:hover {
  background-color: var(--o-color-fill3);
}
.more-menu__item--danger {
  color: var(--o-color-danger1);
}
.more-menu__item--danger:hover {
  background-color: rgba(var(--o-danger1-rgb, 230, 0, 18), 0.06);
}
.more-menu__count {
  color: var(--o-color-info4);
  font-size: var(--o-r-font_size-tip2);
}

/* 全局样式：强制覆盖导入弹窗高度和内边距 */
.import-dialog .o-dialog__body {
  max-height: none !important;
  padding: 16px 20px !important;
}
</style>