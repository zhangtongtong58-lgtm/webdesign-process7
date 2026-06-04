<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  OButton, OTag, OTable, OPagination, OSelect, OOption,
  OCheckbox, OLink, OMessage, ODialog, OInput, OTextarea,
  OSwitch, OUpload, ODropdown, ODivider,
} from '@opensig/opendesign'
import { useAuth } from '../../../composables/useAuth'
import { MOCK_TEST_CASES, type TestCase } from '../../../mock/data'
import { t } from '../../../i18n/zh'

// patchIds：从补丁看板"查看对应用例"传入，非空时只显示关联用例
const props = defineProps<{ projectId: string; patchIds?: string[] }>()
const { isAdmin } = useAuth()

const cases = computed<TestCase[]>(() => MOCK_TEST_CASES.filter((tc) => tc.projectId === props.projectId))

// ─── 筛选器 ───────────────────────────────────────────────────────────────────
const filters = reactive<{
  level: string | null; testType: string | null; autoStatus: string | null; execResult: string | null
}>({ level: null, testType: null, autoStatus: null, execResult: null })
const applied = reactive({ ...filters })

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

const filtered = computed<TestCase[]>(() =>
  cases.value.filter((tc) => {
    const matchPatch = !props.patchIds?.length || props.patchIds.includes(tc.patchId)
    const matchLevel  = !applied.level      || tc.level === applied.level
    const matchType   = !applied.testType   || tc.testType === applied.testType
    const matchAuto   = !applied.autoStatus || String(tc.isAutomated) === applied.autoStatus
    const matchResult = !applied.execResult || tc.lastExecResult === applied.execResult
    return matchPatch && matchLevel && matchType && matchAuto && matchResult
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
const columns = [
  { label: '',                 key: 'select',          style: { width: '72px',  minWidth: '72px'  } },
  { label: '名称',             key: 'name',             style: { width: '140px', minWidth: '140px' } },
  { label: '编号',             key: 'testId',           style: { width: '140px', minWidth: '140px' } },
  { label: '级别',             key: 'level',            style: { width: '100px', minWidth: '100px' } },
  { label: '预置条件',         key: 'precondition',     style: { width: '200px', minWidth: '200px' } },
  { label: '测试步骤',         key: 'testSteps',        style: { width: '200px', minWidth: '200px' } },
  { label: '预期结果',         key: 'expectedResult',   style: { width: '180px', minWidth: '180px' } },
  { label: '自动化脚本/路径',  key: 'automationScript', style: { width: '240px', minWidth: '240px' } },
  { label: '最后一次执行结果', key: 'lastExecResult',   style: { width: '120px', minWidth: '120px' } },
  { label: '特性',             key: 'feature',          style: { width: '120px', minWidth: '120px' } },
  { label: '最后执行人',       key: 'lastExecutor',     style: { width: '100px', minWidth: '100px' } },
  { label: '测试类型',         key: 'testType',         style: { width: '80px',  minWidth: '80px'  } },
  { label: '自动化类型',       key: 'isAutomated',      style: { width: '90px',  minWidth: '90px'  } },
  { label: '操作',             key: 'action',           style: { width: '90px',  minWidth: '90px'  } },
]

const execColor = (r: string) =>
  ({ passed: 'success', fail: 'danger', block: 'warning', unavailable: 'info', pending: 'info' }[r] ?? 'info')
const execLabel = (r: string) =>
  ({ passed: 'Passed', fail: 'Fail', block: 'Block', unavailable: 'Unavailable', pending: '—' }[r] ?? r)
const typeLabel = (tp: string) =>
  ({ functional: '功能', performance: '性能', reliability: '可靠性', compatibility: '兼容性',
     security: '安全性', serviceability: '可服务性', usability: '易用性' }[tp] ?? tp)

const handleQuery = () => { Object.assign(applied, filters); page.value = 1 }
const handleClear = () => {
  Object.assign(filters, { level: null, testType: null, autoStatus: null, execResult: null })
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
  name: string; testId: string; level: string
  precondition: string; testSteps: string; expectedResult: string
  automationScript: string; feature: string; testType: string; isAutomated: boolean
}

const EMPTY_CASE: AddCaseForm = {
  name: '', testId: '', level: '',
  precondition: '', testSteps: '', expectedResult: '',
  automationScript: '', feature: '', testType: '', isAutomated: false,
}

const addDialog = reactive({ visible: false, form: { ...EMPTY_CASE } as AddCaseForm })

const openAddDialog = () => {
  Object.assign(addDialog.form, { ...EMPTY_CASE })
  addDialog.visible = true
}

const handleAddConfirm = () => {
  if (!addDialog.form.name.trim()) { OMessage.warning('用例名称不能为空'); return }
  if (!addDialog.form.testId.trim()) { OMessage.warning('编号不能为空'); return }
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

// ─── emit：通知父组件跳转流水线并传入用例 ID ─────────────────────────────────
const emit = defineEmits<{ runPipeline: [caseIds: string[]] }>()

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

// ─── 跳转至流水线（携带选中用例 ID）────────────────────────────────────────────
const handleToPipeline = () => {
  if (!selectedIds.value.length) { OMessage.warning('请先勾选要执行的用例'); return }
  emit('runPipeline', [...selectedIds.value])
}

// ─── 批量删除 ─────────────────────────────────────────────────────────────────
const batchDeleteDialog = reactive({ visible: false })

const handleBatchDelete = () => {
  if (!selectedIds.value.length) { OMessage.warning('请先勾选要删除的用例'); return }
  batchDeleteDialog.visible = true
}

const confirmBatchDelete = () => {
  OMessage.success(`已删除 ${selectedIds.value.length} 条用例`)
  selectedIds.value = []
  batchDeleteDialog.visible = false
}
</script>

<template>
  <div class="tc-tab">
    <!-- 从补丁看板"查看对应用例"跳转时显示过滤提示 -->
    <div v-if="props.patchIds?.length" class="tc-tab__patch-notice">
      <span class="tc-tab__notice-icon">☑</span>
      <span>当前仅显示与选中 <strong>{{ props.patchIds.length }}</strong> 个补丁关联的用例</span>
    </div>

    <!-- 筛选器：OSelect outline pill medium -->
    <div class="tc-tab__filter">
      <OSelect v-model="filters.level" placeholder="用例级别" variant="outline" size="medium"
        class="tc-tab__sel" @change="handleQuery">
        <OOption v-for="o in levelOptions" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>
      <OSelect v-model="filters.testType" placeholder="测试类型" variant="outline" size="medium"
        class="tc-tab__sel" @change="handleQuery">
        <OOption v-for="o in testTypeOptions" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>
      <OSelect v-model="filters.autoStatus" placeholder="自动化状态" variant="outline" size="medium"
        class="tc-tab__sel" @change="handleQuery">
        <OOption v-for="o in autoOptions" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>
      <OSelect v-model="filters.execResult" placeholder="用例执行结果" variant="outline" size="medium"
        class="tc-tab__sel tc-tab__sel--wide" @change="handleQuery">
        <OOption v-for="o in execResultOpts" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>
      <OLink color="primary" class="tc-tab__clear" @click="handleClear">清除筛选</OLink>
    </div>

    <div class="tc-tab__toolbar">
      <OButton variant="solid" color="primary" size="medium" @click="openAddDialog">
        {{ t('tc.create') }}
      </OButton>
      <OButton variant="outline" size="medium" @click="importDialog.visible = true">
        {{ t('tc.importBtn') }}
      </OButton>
      <!-- 导出：下拉支持全部/所选 -->
      <ODropdown trigger="click">
        <OButton variant="outline" size="medium">
          {{ t('tc.exportBtn') }}
          <template #suffix>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-left:2px">
              <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
        </OButton>
        <template #dropdown>
          <div class="export-menu">
            <div class="export-menu__item" @click="handleExport('all')">导出全部</div>
            <div class="export-menu__item" @click="handleExport('selected')">
              导出所选
              <span v-if="selectedIds.length > 0" class="export-menu__count">（{{ selectedIds.length }}条）</span>
            </div>
          </div>
        </template>
      </ODropdown>
    </div>

    <div class="tc-tab__table-wrap">
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
          <OTag :color="row.isAutomated ? 'success' : 'info'" size="medium" variant="outline">
            {{ row.isAutomated ? 'TRUE' : 'FALSE' }}
          </OTag>
        </template>
        <template #td_action>
          <div class="tc-tab__action-cell">
            <OLink color="primary" href="javascript:void(0)">{{ t('action.edit') }}</OLink>
            <OLink color="danger" href="javascript:void(0)">{{ t('action.delete') }}</OLink>
          </div>
        </template>
      </OTable>
    </div>

    <div class="tc-tab__bottom">
      <div class="tc-tab__bottom-actions">
        <OButton variant="solid" color="primary" size="medium" @click="handleRun">
          {{ t('tc.run') }}
        </OButton>
        <OButton variant="outline" size="medium" @click="handleToPipeline">
          {{ t('tc.toPipeline') }}
        </OButton>
        <OButton variant="outline" color="danger" size="medium" @click="handleBatchDelete">
          {{ t('tc.batchDelete') }}
        </OButton>
      </div>
      <OPagination :total="filtered.length" :page="page" :page-size="pageSize" :page-sizes="[10,20,50]" @change="onPageChange" />
    </div>

    <!-- ── 执行结果面板（奇次成功/偶次失败）──────────────────────────────────── -->
    <transition name="exec-slide">
      <div v-if="execResult.visible"
           class="exec-panel"
           :class="execResult.success ? 'exec-panel--success' : 'exec-panel--fail'"
      >
        <div class="exec-panel__header">
          <OTag :color="execResult.success ? 'success' : 'danger'" size="medium">
            {{ execResult.success ? '测试通过' : '测试失败' }}
          </OTag>
          <span class="exec-panel__summary">
            共 {{ execResult.caseResults.length }} 条，
            通过 {{ execResult.caseResults.filter(c => c.status === 'pass').length }} 条
            <template v-if="!execResult.success">
              ，失败 {{ execResult.caseResults.filter(c => c.status === 'fail').length }} 条
            </template>
          </span>
          <OButton variant="text" size="small" @click="execResult.visible = false">关闭</OButton>
        </div>
        <div class="exec-panel__body">
          <div v-for="item in execResult.caseResults" :key="item.id" class="exec-panel__row">
            <OTag :color="item.status === 'pass' ? 'success' : 'danger'" size="medium">
              {{ item.status === 'pass' ? 'Pass' : 'Fail' }}
            </OTag>
            <span class="exec-panel__id">{{ item.id }}</span>
            <span class="exec-panel__name">{{ item.name }}</span>
            <span v-if="item.status === 'fail'" class="exec-panel__err">
              AssertionError: 执行结果与预期不符，请检查测试环境或用例配置
            </span>
          </div>
        </div>
      </div>
    </transition>
  </div>

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
          <label class="tc-form__label">级别</label>
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
          <label class="tc-form__label">特性</label>
          <OInput v-model="addDialog.form.feature" placeholder="例：PCIe DPC中断" clearable />
        </div>
        <div class="tc-form__field">
          <label class="tc-form__label">自动化类型</label>
          <div class="tc-form__switch-row">
            <OSwitch v-model="addDialog.form.isAutomated" />
            <span class="tc-form__switch-label">{{ addDialog.form.isAutomated ? 'TRUE（已自动化）' : 'FALSE（未自动化）' }}</span>
          </div>
        </div>
        <div class="tc-form__field tc-form__field--full">
          <label class="tc-form__label">自动化脚本/路径</label>
          <OInput v-model="addDialog.form.automationScript" placeholder="例：D06:/test_cases/pcie/test.py::TestCase::test_dpc" clearable />
        </div>
      </div>

      <ODivider />

      <!-- 测试内容 -->
      <div class="tc-form__section-title"><span class="tc-form__bar" />测试内容</div>
      <div class="tc-form__grid">
        <div class="tc-form__field tc-form__field--full">
          <label class="tc-form__label">预置条件</label>
          <OTextarea v-model="addDialog.form.precondition" placeholder="描述测试前的准备条件" :rows="3" />
        </div>
        <div class="tc-form__field tc-form__field--full">
          <label class="tc-form__label">测试步骤</label>
          <OTextarea v-model="addDialog.form.testSteps" placeholder="逐步描述测试操作" :rows="4" />
        </div>
        <div class="tc-form__field tc-form__field--full">
          <label class="tc-form__label">预期结果</label>
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
       OUpload draggable，支持 .xlsx / .xls / .csv
  ══ -->
  <ODialog v-model:visible="importDialog.visible" title="批量导入用例" size="medium">
    <div class="tc-import-body">
      <div class="tc-import-body__tips">
        <p class="tc-import-body__text">
          请按照模板格式准备 Excel 文件，支持 <strong>.xlsx</strong>、<strong>.xls</strong>、<strong>.csv</strong> 格式。
        </p>
        <OLink color="primary" href="javascript:void(0)" class="tc-import-body__tmpl">下载导入模板</OLink>
      </div>
      <ODivider />
      <OUpload
        v-model="importFiles"
        accept=".xlsx,.xls,.csv"
        draggable
        :multiple="false"
        :upload-request="handleImportUpload"
        btn-label="选择 Excel 文件"
        class="tc-import-body__upload"
      />
    </div>
    <template #footer>
      <div class="tc-dialog-footer">
        <OButton variant="outline" size="medium"
          @click="importDialog.visible = false; importFiles = []">取消</OButton>
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
  &__num   { font-size: var(--o-r-font_size-h1); font-weight: 700; }
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
  &__filter { display: flex; flex-wrap: wrap; align-items: center; gap: var(--o-r-gap-3); margin-bottom: var(--o-r-gap-4); }
  &__sel { width: 130px; }
  &__sel--wide { width: 150px; }
  &__clear { font-size: var(--o-r-font_size-tip1); color: var(--o-color-info3); cursor: pointer; white-space: nowrap; }
  &__toolbar { display: flex; gap: var(--o-r-gap-3); margin-bottom: var(--o-r-gap-4); }
  &__table-wrap { margin-bottom: var(--o-r-gap-3); }
  &__cell-id { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip2); font-family: monospace; white-space: nowrap; }
  &__cell-text { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; max-width: 200px; }
  &__cell-script { font-size: var(--o-r-font_size-tip2); font-family: monospace; word-break: break-all; max-width: 240px; display: block; }
  &__cell-plain { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); white-space: nowrap; }
  &__muted { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip1); }
  &__action-cell { display: flex; gap: var(--o-r-gap-2); white-space: nowrap; }
  &__bottom { display: flex; align-items: center; justify-content: space-between; margin-top: var(--o-r-gap-5); padding-top: var(--o-r-gap-4); border-top: 1px solid var(--o-color-control4); }
  &__bottom-actions { display: flex; gap: var(--o-r-gap-3); }
}

// ── 新增用例表单 ───────────────────────────────────────────────────────────────
.tc-form {
  display: flex; flex-direction: column; gap: var(--o-r-gap-5);
  &__section-title {
    display: flex; align-items: center; gap: var(--o-r-gap-2);
    color: var(--o-color-info1); font-size: var(--o-r-font_size-text1); font-weight: 600;
  }
  &__bar { display: inline-block; width: 4px; height: 16px; background-color: var(--o-color-primary1); border-radius: 2px; flex-shrink: 0; }
  &__grid { display: flex; flex-wrap: wrap; gap: var(--o-r-gap-4) var(--o-r-grid-column-gutter); }
  &__field {
    width: calc(50% - var(--o-r-grid-column-gutter) / 2);
    display: flex; flex-direction: column; gap: var(--o-r-gap-2);
    &--full { width: 100%; }
  }
  &__label { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); font-weight: 500; }
  &__required { color: var(--o-color-danger1); margin-right: var(--o-r-gap-1); }
  &__switch-row { display: flex; align-items: center; gap: var(--o-r-gap-3); padding-top: 4px; }
  &__switch-label { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); }
}

// ── 导入弹窗 ──────────────────────────────────────────────────────────────────
.tc-import-body {
  display: flex; flex-direction: column; gap: var(--o-r-gap-4);
  &__tips { display: flex; align-items: center; justify-content: space-between; gap: var(--o-r-gap-4); flex-wrap: wrap; }
  &__text { margin: 0; color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); strong { color: var(--o-color-primary1); } }
  &__tmpl { white-space: nowrap; font-size: var(--o-r-font_size-tip1); }
  &__upload { width: 100%; }
}

// ── 弹窗底部 ──────────────────────────────────────────────────────────────────
.tc-dialog-footer {
  display: flex; justify-content: flex-end; gap: var(--o-r-gap-3);
}

// ── 执行结果面板 ──────────────────────────────────────────────────────────────
.exec-panel {
  margin-top: var(--o-r-gap-4);
  border-radius: var(--o-radius_control-m);
  border: 1px solid var(--o-color-control1);
  overflow: hidden;

  &--success { border-color: var(--o-color-success1); }
  &--fail    { border-color: var(--o-color-danger1);  }

  &__header {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-3);
    padding: var(--o-r-gap-3) var(--o-r-gap-4);
    background-color: var(--o-color-fill3);
  }

  &__summary {
    flex: 1;
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
  }

  &__body {
    padding: var(--o-r-gap-3) var(--o-r-gap-4);
    background-color: var(--o-color-fill2);
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-2);
    max-height: 240px;
    overflow-y: auto;
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
    font-family: monospace;
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

// 滑入动画
.exec-slide-enter-active { transition: all var(--o-duration-m1) var(--o-easing-standard); }
.exec-slide-enter-from   { opacity: 0; transform: translateY(-6px); }

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
  min-width: 1952px;  /* 1880 + 72(checkbox列) */
  table-layout: fixed;
  word-break: break-all;
}
.tc-tab__table-wrap th {
  white-space: normal;
  word-break: break-word;
}
/* checkbox 列：不裁剪，其余 td 正常截断 */
.tc-tab__table-wrap td:not(:first-child) {
  overflow: hidden;
  text-overflow: ellipsis;
}
.tc-tab__table-wrap th:first-child,
.tc-tab__table-wrap td:first-child {
  overflow: visible;
  text-align: center;
  padding-left: 16px;
}
.tc-tab__table-wrap td .tc-tab__cell-text,
.tc-tab__table-wrap td .tc-tab__cell-script {
  white-space: normal;
  word-break: break-all;
}
/* 导出下拉菜单 */
.export-menu { padding: 4px 0; min-width: 120px; }
.export-menu__item {
  padding: 8px 16px;
  font-size: 14px;
  color: rgba(0,0,0,.85);
  cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  transition: background-color .15s;
}
.export-menu__item:hover { background-color: rgba(0,0,0,.04); }
.export-menu__count { color: rgba(0,0,0,.45); font-size: 12px; }
</style>
