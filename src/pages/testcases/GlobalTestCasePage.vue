<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  OButton, OTag, OTable, OPagination, OSelect, OOption,
  OCheckbox, OLink, OMessage,
} from '@opensig/opendesign'
import { useAuth } from '../../composables/useAuth'
import { MOCK_TEST_CASES, MOCK_PROJECTS, type TestCase } from '../../mock/data'
import { t } from '../../i18n/zh'

const { isAdmin, currentUser } = useAuth()

const baseCases = computed<TestCase[]>(() =>
  isAdmin.value
    ? MOCK_TEST_CASES
    : MOCK_TEST_CASES.filter((tc) => (currentUser.value?.projectIds ?? []).includes(tc.projectId))
)

// 初始值 null → placeholder 显示筛选分类名
const filters = reactive<{
  projectId: string | null; level: string | null; testType: string | null
  autoStatus: string | null; execResult: string | null
}>({ projectId: null, level: null, testType: null, autoStatus: null, execResult: null })
const applied = reactive({ ...filters })

const projectOptions = computed(() => MOCK_PROJECTS.map((p) => ({ value: p.id, label: p.name })))
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
const autoOptions    = [{ value: 'true', label: 'TRUE（已自动化）' }, { value: 'false', label: 'FALSE（未自动化）' }]
const execResultOpts = [
  { value: 'passed', label: 'Passed' }, { value: 'fail', label: 'Fail' },
  { value: 'block', label: 'Block' }, { value: 'unavailable', label: 'Unavailable' },
]

const filtered = computed<TestCase[]>(() =>
  baseCases.value.filter((tc) => {
    const matchProject = !applied.projectId  || tc.projectId === applied.projectId
    const matchLevel   = !applied.level      || tc.level === applied.level
    const matchType    = !applied.testType   || tc.testType === applied.testType
    const matchAuto    = !applied.autoStatus || String(tc.isAutomated) === applied.autoStatus
    const matchResult  = !applied.execResult || tc.lastExecResult === applied.execResult
    return matchProject && matchLevel && matchType && matchAuto && matchResult
  })
)

const page = ref(1); const pageSize = ref(10)
const pagedRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const onPageChange = (val: { page: number; pageSize: number }) => {
  page.value = val.pageSize !== pageSize.value ? 1 : val.page; pageSize.value = val.pageSize
}

const stats = computed(() => [
  { id: 'total',  label: t('tc.total'),     value: baseCases.value.length, mod: 'primary' },
  { id: 'passed', label: 'Passed',           value: baseCases.value.filter(tc => tc.lastExecResult === 'passed').length, mod: 'success' },
  { id: 'fail',   label: 'Fail',             value: baseCases.value.filter(tc => tc.lastExecResult === 'fail').length, mod: 'danger' },
  { id: 'auto',   label: t('tc.automation'), value: baseCases.value.filter(tc => tc.isAutomated).length, mod: 'warning' },
])

// 13 列完整定义 + 列宽，总宽度 ≈ 1880px
const columns = [
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
  { label: '操作',           key: 'action',    style: { width: '130px', minWidth: '130px' } },
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
  Object.assign(filters, { projectId: null, level: null, testType: null, autoStatus: null, execResult: null })
  handleQuery()
}
const selected = ref<Set<string>>(new Set())
const allChecked = computed(() => pagedRows.value.length > 0 && pagedRows.value.every(r => selected.value.has(r.id)))
const toggleAll = (v: boolean) => {
  if (v) pagedRows.value.forEach(r => selected.value.add(r.id))
  else   pagedRows.value.forEach(r => selected.value.delete(r.id))
}
const handleRun = () => {
  if (!selected.value.size) { OMessage.warning('请先选择用例'); return }
  OMessage.success(`已选 ${selected.value.size} 条用例，执行任务已提交`)
}
</script>

<template>
  <section class="tc-board">
    <div class="tc-board__header">
      <h2 class="tc-board__title">{{ t('nav.testcases') }}</h2>
    </div>

    <!-- 筛选器：5 个 OSelect outline pill medium -->
    <div class="tc-board__filter">
      <OSelect v-model="filters.projectId" placeholder="所属项目" variant="outline" size="medium"
        class="tc-board__filter-sel" @change="handleQuery">
        <OOption v-for="o in projectOptions" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>
      <OSelect v-model="filters.level" placeholder="用例级别" variant="outline" size="medium"
        class="tc-board__filter-sel" @change="handleQuery">
        <OOption v-for="o in levelOptions" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>
      <OSelect v-model="filters.testType" placeholder="测试类型" variant="outline" size="medium"
        class="tc-board__filter-sel" @change="handleQuery">
        <OOption v-for="o in testTypeOptions" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>
      <OSelect v-model="filters.autoStatus" placeholder="自动化状态" variant="outline" size="medium"
        class="tc-board__filter-sel" @change="handleQuery">
        <OOption v-for="o in autoOptions" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>
      <OSelect v-model="filters.execResult" placeholder="用例执行结果" variant="outline" size="medium"
        class="tc-board__filter-sel tc-board__filter-sel--wide" @change="handleQuery">
        <OOption v-for="o in execResultOpts" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>
      <OLink color="primary" class="tc-board__filter-clear" @click="handleClear">清除筛选</OLink>
    </div>

    <div class="tc-board__toolbar">
      <OButton v-if="isAdmin" variant="solid" color="primary" size="medium">{{ t('tc.create') }}</OButton>
      <OButton variant="outline" size="medium">{{ t('tc.importBtn') }}</OButton>
      <OButton variant="outline" size="medium">{{ t('tc.exportBtn') }}</OButton>
    </div>

    <div class="tc-board__table-wrap">
      <OTable :columns="columns" :data="pagedRows">
        <template #header>
          <OCheckbox :model-value="allChecked" @update:model-value="toggleAll" />
        </template>
        <template #td_testId="{ row }">
          <span class="tc-board__cell-id">{{ row.testId }}</span>
        </template>
        <template #td_level="{ row }">
          <OTag color="info" size="medium" variant="outline">{{ row.level }}</OTag>
        </template>
        <template #td_precondition="{ row }">
          <span class="tc-board__cell-text">{{ row.precondition }}</span>
        </template>
        <template #td_testSteps="{ row }">
          <span class="tc-board__cell-text">{{ row.testSteps }}</span>
        </template>
        <template #td_expectedResult="{ row }">
          <span class="tc-board__cell-text">{{ row.expectedResult }}</span>
        </template>
        <template #td_automationScript="{ row }">
          <OLink v-if="row.automationScript !== '—'" color="primary" href="javascript:void(0)" class="tc-board__cell-script">
            {{ row.automationScript }}
          </OLink>
          <span v-else class="tc-board__muted">—</span>
        </template>
        <template #td_lastExecResult="{ row }">
          <OTag :color="execColor(row.lastExecResult)" size="medium">
            {{ execLabel(row.lastExecResult) }}
          </OTag>
        </template>
        <template #td_testType="{ row }">
          <span class="tc-board__cell-plain">{{ typeLabel(row.testType) }}</span>
        </template>
        <template #td_isAutomated="{ row }">
          <OTag :color="row.isAutomated ? 'success' : 'info'" size="medium" variant="outline">
            {{ row.isAutomated ? 'TRUE' : 'FALSE' }}
          </OTag>
        </template>
        <template #td_action>
          <div class="tc-board__action-cell">
            <OLink color="primary" href="javascript:void(0)">{{ t('action.edit') }}</OLink>
            <OLink color="danger" href="javascript:void(0)">{{ t('action.delete') }}</OLink>
          </div>
        </template>
      </OTable>
    </div>

    <div class="tc-board__bottom">
      <div class="tc-board__bottom-actions">
        <OButton variant="solid" color="primary" size="medium" @click="handleRun">{{ t('tc.run') }}</OButton>
        <OButton variant="outline" size="medium">{{ t('tc.toPipeline') }}</OButton>
        <OButton variant="outline" color="danger" size="medium">{{ t('tc.batchDelete') }}</OButton>
      </div>
      <OPagination :total="filtered.length" :page="page" :page-size="pageSize" :page-sizes="[10,20,50]" @change="onPageChange" />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.stat-card {
  flex: 1; padding: var(--o-r-gap-5) var(--o-r-gap-6);
  background-color: var(--o-color-fill2); border: 1px solid var(--o-color-control1);
  border-radius: var(--o-radius_control-m); border-left-width: 4px;
  display: flex; flex-direction: column; gap: var(--o-r-gap-2); min-width: 140px;
  &--primary { border-left-color: var(--o-color-primary1); .stat-card__num { color: var(--o-color-primary1); } }
  &--success { border-left-color: var(--o-color-success1); .stat-card__num { color: var(--o-color-success1); } }
  &--warning { border-left-color: var(--o-color-warning1); .stat-card__num { color: var(--o-color-warning1); } }
  &--danger  { border-left-color: var(--o-color-danger1);  .stat-card__num { color: var(--o-color-danger1);  } }
  &__num   { font-size: var(--o-r-font_size-h1); font-weight: var(--o-font_weight-bold); }
  &__label { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip1); }
}

.tc-board {
  &__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--o-r-gap-5); }
  &__title { margin: 0; color: var(--o-color-info1); font-size: var(--o-r-font_size-h3); line-height: var(--o-r-line_height-h3); font-weight: var(--o-font_weight-bold); }
  &__header-actions { display: flex; gap: var(--o-r-gap-3); }
  &__stats { display: flex; gap: var(--o-r-grid-column-gutter); margin-bottom: var(--o-r-gap-6); }
  &__filter { display: flex; flex-wrap: wrap; align-items: center; gap: var(--o-r-gap-3); margin-bottom: var(--o-r-gap-4); }
  &__filter-sel { width: 130px; }
  &__filter-sel--wide { width: 150px; }
  &__filter-clear { font-size: var(--o-r-font_size-tip1); color: var(--o-color-info3); cursor: pointer; white-space: nowrap; }
  &__toolbar { display: flex; gap: var(--o-r-gap-3); margin-bottom: var(--o-r-gap-4); }
  &__table-wrap { margin-bottom: var(--o-r-gap-3); }
  &__cell-id { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip2); font-family: var(--o-font_family-code); white-space: nowrap; }
  &__cell-text { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; max-width: 200px; }
  &__cell-script { font-size: var(--o-r-font_size-tip2); font-family: var(--o-font_family-code); word-break: break-all; max-width: 240px; display: block; }
  &__cell-plain { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); white-space: nowrap; }
  &__muted { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip1); }
  &__action-cell { display: flex; gap: var(--o-r-gap-2); white-space: nowrap; }
  &__bottom { display: flex; align-items: center; justify-content: space-between; padding-top: var(--o-r-gap-4); border-top: 1px solid var(--o-color-control4); }
  &__bottom-actions { display: flex; gap: var(--o-r-gap-3); }
}
</style>

<!-- 横向滚动：覆盖 OTable 内置 overflow:hidden，与补丁看板方案完全一致 -->
<style>
.tc-board__table-wrap .o-table-wrap {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.tc-board__table-wrap table {
  min-width: 1880px;
  table-layout: fixed;
  word-break: break-all;
}
.tc-board__table-wrap th {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tc-board__table-wrap td {
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 内容列允许折行（预置条件/步骤/预期结果/脚本路径） */
.tc-board__table-wrap td .tc-board__cell-text,
.tc-board__table-wrap td .tc-board__cell-script {
  white-space: normal;
  word-break: break-all;
}
</style>