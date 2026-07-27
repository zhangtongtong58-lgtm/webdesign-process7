<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { OSelect, OOption, OButton, OTag, OTable, OPagination, OMessage, ORadio, ORadioGroup, OCheckbox } from '@opensig/opendesign'
import { useAuth } from '../../composables/useAuth'
import {
  MOCK_PIPELINE_TASKS, MOCK_PROJECTS, type PipelineTask, type PipelineStatus,
} from '../../mock/data'

import { t } from '../../i18n/zh'
const { isAdmin, currentUser } = useAuth()

const baseRuns = computed<PipelineTask[]>(() =>
  isAdmin.value
    ? MOCK_PIPELINE_TASKS
    : MOCK_PIPELINE_TASKS.filter((r) =>
        (currentUser.value?.projectIds ?? []).includes(r.projectId)
      )
)

const filters = reactive({ status: '', projectId: '' })
const applied = reactive({ status: '', projectId: '' })

const statusOptions = [
  { value: '', label: t('filter.all') },
  { value: 'success', label: t('pipeline.success') },
  { value: 'failed', label: t('pipeline.failed') },
  { value: 'running', label: t('pipeline.running') },
  { value: 'pending', label: t('pipeline.pending') },
  { value: 'cancelled', label: t('pipeline.cancelled') },
]

const projectOptions = computed(() => [
  { value: '', label: t('filter.all') },
  ...MOCK_PROJECTS.map((p) => ({ value: p.id, label: p.name })),
])

const filtered = computed<PipelineTask[]>(() =>
  baseRuns.value.filter((r) => {
    const matchStatus = !applied.status || r.pipelineStatus === applied.status
    const matchProject = !applied.projectId || r.projectId === applied.projectId
    return matchStatus && matchProject
  })
)

const page = ref(1)
const pageSize = ref(10)
const pagedRows = computed(() => {
  const s = (page.value - 1) * pageSize.value
  return filtered.value.slice(s, s + pageSize.value)
})

const columns = computed(() => [
  { label: t('pipeline.project'), key: 'projectName' },
  { label: t('pipeline.patch'), key: 'patchTitle' },
  { label: t('pipeline.triggeredBy'), key: 'triggerBy' },
  { label: t('pipeline.status'), key: 'status' },
  { label: t('pipeline.stages'), key: 'stages' },
  { label: t('pipeline.startedAt'), key: 'startedAt' },
  { label: t('pipeline.duration'), key: 'duration' },
  { label: t('action.label'), key: 'action' },
])

const handleQuery = () => {
  Object.assign(applied, filters)
  page.value = 1
}

const handleReset = () => {
  Object.assign(filters, { status: '', projectId: '' })
  handleQuery()
}

const onPageChange = (val: { page: number; pageSize: number }) => {
  page.value = val.pageSize !== pageSize.value ? 1 : val.page
  pageSize.value = val.pageSize
}

const pipelineStatusColor = (s: PipelineStatus) => {
  const m: Record<string, string> = {
    success: 'success', failed: 'danger', running: 'warning', pending: 'info', cancelled: 'info',
  }
  return m[s] ?? 'info'
}

const stageStatusColor = (s: string) => {
  const m: Record<string, string> = {
    success: 'success', failed: 'danger', running: 'warning', pending: 'info', cancelled: 'info',
  }
  return m[s] ?? 'info'
}

// Stats
const stats = computed(() => ({
  total: baseRuns.value.length,
  success: baseRuns.value.filter((r) => r.status === 'success').length,
  failed: baseRuns.value.filter((r) => r.status === 'failed').length,
  running: baseRuns.value.filter((r) => r.status === 'running').length,
}))

// 执行配置表单
const executeForm = reactive({
  buildMode: 'auto',
  projectId: '',
  patchScope: 'all',
  executeMode: 'full',
})

const caseFilters = reactive({
  testCaseModule: '',
  level: '',
  testType: '',
  autoStatus: '',
  execResult: '',
})

const moduleOptions = [
  { value: '', label: '用例模块' },
  { value: 'ACC', label: 'ACC' }, { value: 'ZIP', label: 'ZIP' },
  { value: 'PCIe', label: 'PCIe' }, { value: 'UACCE', label: 'UACCE' },
]
const levelOptions = [
  { value: '', label: '用例级别' },
  { value: 'Level 1', label: 'Level 1' }, { value: 'Level 1/2', label: 'Level 1/2' },
  { value: 'Level 0/1/2/3', label: 'Level 0/1/2/3' }, { value: 'Level 2', label: 'Level 2' },
]
const testTypeOptions = [
  { value: '', label: '测试类型' },
  { value: 'functional', label: '功能' }, { value: 'performance', label: '性能' },
  { value: 'reliability', label: '可靠性' }, { value: 'compatibility', label: '兼容性' },
]
const autoOptions = [{ value: '', label: '自动化类型' }, { value: 'true', label: 'TRUE' }, { value: 'false', label: 'FALSE' }]
const execResultOpts = [
  { value: '', label: '用例执行结果' },
  { value: 'passed', label: 'Passed' }, { value: 'fail', label: 'Fail' },
]

const selectedCaseIds = ref<string[]>([])
const allCasesSelected = computed(() => selectedCaseIds.value.length > 0)

const handleTrigger = () => {
  if (executeForm.projectId) {
    const project = MOCK_PROJECTS.find((p) => p.id === executeForm.projectId)
    if (!project?.pipelineId.trim() || !project?.pipelineName.trim()) {
      OMessage.warning('流水线ID和流水线名称均须填写方可启动流水线，请先在项目基本信息中补充')
      return
    }
    OMessage.success(`已触发流水线执行：${project?.name}`)
  } else {
    OMessage.warning('请先配置执行参数')
  }
}

const handleClearCaseFilter = () => {
  Object.assign(caseFilters, { testCaseModule: '', level: '', testType: '', autoStatus: '', execResult: '' })
}
</script>

<template>
  <section class="pipeline-page">
    <!-- Stats -->
    <div class="pipeline-page__stats">
      <div class="pipeline-page__stat">
        <span class="pipeline-page__stat-val">{{ stats.total }}</span>
        <span class="pipeline-page__stat-lbl">{{ t('pipeline.total') }}</span>
      </div>
      <div class="pipeline-page__stat pipeline-page__stat--success">
        <span class="pipeline-page__stat-val">{{ stats.success }}</span>
        <span class="pipeline-page__stat-lbl">{{ t('pipeline.success') }}</span>
      </div>
      <div class="pipeline-page__stat pipeline-page__stat--fail">
        <span class="pipeline-page__stat-val">{{ stats.failed }}</span>
        <span class="pipeline-page__stat-lbl">{{ t('pipeline.failed') }}</span>
      </div>
      <div class="pipeline-page__stat pipeline-page__stat--running">
        <span class="pipeline-page__stat-val">{{ stats.running }}</span>
        <span class="pipeline-page__stat-lbl">{{ t('pipeline.running') }}</span>
      </div>
    </div>

    <!-- Filter -->
    <div class="pipeline-page__filter">
      <OSelect v-model="filters.projectId" :placeholder="t('filter.project')" searchable class="pipeline-page__field">
        <OOption v-for="opt in projectOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
      </OSelect>
      <OSelect v-model="filters.status" :placeholder="t('filter.status')" searchable class="pipeline-page__field">
        <OOption v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
      </OSelect>
      <div class="pipeline-page__btns">
        <OButton variant="solid" color="primary" @click="handleQuery" round="pill">{{ t('action.query') }}</OButton>
        <OButton variant="outline" color="primary" @click="handleReset" round="pill">{{ t('action.reset') }}</OButton>
      </div>
    </div>

    <!-- 执行配置区（普通用户只读） -->
    <div class="pipeline-page__execute">
      <div class="pipeline-page__section">
        <span class="pipeline-page__section-bar"></span>
        <span class="pipeline-page__section-title">构建区</span>
      </div>
      <div class="pipeline-page__build-options">
        <div class="pipeline-page__build-option" :class="{ 'pipeline-page__build-option--active': executeForm.buildMode === 'auto' }" @click="executeForm.buildMode = 'auto'">
          <ORadioGroup v-model="executeForm.buildMode" direction="horizontal">
            <ORadio value="auto">自动编译流水线</ORadio>
          </ORadioGroup>
          <p class="pipeline-page__build-desc">基线版本：openEuler-24.03-LTS，自动编译当前项目范围内符合入补丁，默认集群执行</p>
        </div>
        <div class="pipeline-page__build-option" :class="{ 'pipeline-page__build-option--active': executeForm.buildMode === 'manual' }" @click="executeForm.buildMode = 'manual'">
          <ORadioGroup v-model="executeForm.buildMode" direction="horizontal">
            <ORadio value="manual">手动上传</ORadio>
          </ORadioGroup>
        </div>
      </div>

      <div class="pipeline-page__section pipeline-page__section--mt">
        <span class="pipeline-page__section-bar"></span>
        <span class="pipeline-page__section-title">用例选择区</span>
        <span class="pipeline-page__section-count">已选 {{ selectedCaseIds.length }} / 7 个用例</span>
      </div>
      <div class="pipeline-page__case-filter">
        <OSelect v-model="caseFilters.testCaseModule" placeholder="用例模块" variant="outline" searchable size="medium" class="pipeline-page__case-sel">
          <OOption v-for="o in moduleOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="caseFilters.level" placeholder="用例级别" variant="outline" searchable size="medium" class="pipeline-page__case-sel">
          <OOption v-for="o in levelOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="caseFilters.testType" placeholder="测试类型" variant="outline" searchable size="medium" class="pipeline-page__case-sel">
          <OOption v-for="o in testTypeOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="caseFilters.autoStatus" placeholder="自动化类型" variant="outline" searchable size="medium" class="pipeline-page__case-sel">
          <OOption v-for="o in autoOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="caseFilters.execResult" placeholder="用例执行结果" variant="outline" searchable size="medium" class="pipeline-page__case-sel">
          <OOption v-for="o in execResultOpts" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OButton variant="text" color="primary" size="medium" round="pill" @click="handleClearCaseFilter">清除筛选</OButton>
      </div>

      <div class="pipeline-page__execute-footer">
        <OButton variant="outline" color="primary" size="medium" round="pill" @click="handleReset">取消</OButton>
        <OButton variant="solid" color="primary" size="medium" round="pill" @click="handleTrigger">执行流水线</OButton>
      </div>
    </div>

    <!-- Table -->
    <div class="pipeline-page__table-section">
      <h3 class="pipeline-page__table-title">流水线历史记录表格</h3>
      <OTable :columns="columns" :data="pagedRows">
      <template #td_status="{ row }">
        <OTag :color="pipelineStatusColor(row.status)" size="medium">{{ row.status }}</OTag>
      </template>
      <template #td_stages="{ row }">
        <div class="pipeline-page__stage-row">
          <div
            v-for="stage in row.stages"
            :key="stage.name"
            class="pipeline-page__stage-dot"
            :title="stage.name"
          >
            <OTag :color="stageStatusColor(stage.status)" size="medium">
              {{ stage.name.charAt(0) }}
            </OTag>
          </div>
        </div>
      </template>
      <template #td_duration="{ row }">
        {{ row.duration ? `${row.duration}s` : '-' }}
      </template>
      <template #td_action="{ row }">
        <div class="pipeline-page__action-cell">
          <OButton variant="text" color="primary" size="medium" round="pill">{{ t('action.detail') }}</OButton>
          <OButton v-if="isAdmin && row.status === 'running'" variant="text" color="danger" size="medium" round="pill">
            {{ t('action.cancel') }}
          </OButton>
          <OButton v-if="isAdmin" variant="text" color="primary" size="medium" round="pill">{{ t('action.rerun') }}</OButton>
        </div>
      </template>
    </OTable>
    </div>

    <div class="pipeline-page__pagination">
      <OPagination
        :total="filtered.length"
        :page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        @change="onPageChange"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.pipeline-page {
  &__stats {
    display: flex;
    gap: var(--o-r-gap-6);
    padding: var(--o-r-gap-5) var(--o-r-gap-6);
    margin-bottom: var(--o-r-gap-6);
    background-color: var(--o-color-fill2);
    border-radius: var(--o-radius_control-m);
    box-shadow: var(--o-shadow-1);

    @media (max-width: 840px) { flex-wrap: wrap; }
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--o-r-gap-2);
    flex: 1;

    &--success .pipeline-page__stat-val { color: var(--o-color-success1); }
    &--fail .pipeline-page__stat-val { color: var(--o-color-danger1); }
    &--running .pipeline-page__stat-val { color: var(--o-color-warning1); }
  }

  &__stat-val {
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-h2);
    line-height: var(--o-r-line_height-h2);
    font-weight: var(--o-font_weight-bold);
  }

  &__stat-lbl {
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
  }

  &__filter {
    display: flex;
    flex-wrap: wrap;
    gap: var(--o-r-gap-4);
    padding: var(--o-r-gap-5);
    margin-bottom: var(--o-r-gap-5);
    background-color: var(--o-color-fill2);
    border-radius: var(--o-radius_control-m);
    box-shadow: var(--o-shadow-1);
    align-items: center;
  }

  &__field {
    width: 200px;
    @media (max-width: 840px) { width: 100%; }
  }

  &__btns {
    display: flex;
    gap: var(--o-r-gap-3);
  }

  &__trigger {
    margin-left: auto;
  }

  &__execute {
    padding: var(--o-r-gap-5) var(--o-r-gap-6);
    margin-bottom: var(--o-r-gap-5);
    background-color: var(--o-color-fill2);
    border-radius: var(--o-radius_control-m);
    box-shadow: var(--o-shadow-1);
  }

  &__section {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    margin-bottom: var(--o-r-gap-4);

    &--mt {
      margin-top: var(--o-r-gap-5);
    }
  }

  &__section-bar {
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

  &__section-count {
    margin-left: auto;
    font-size: var(--o-r-font_size-tip1);
    color: var(--o-color-info3);
  }

  &__build-options {
    display: flex;
    gap: var(--o-r-gap-5);
    margin-bottom: var(--o-r-gap-5);
  }

  &__build-option {
    flex: 1;
    padding: var(--o-r-gap-4) var(--o-r-gap-5);
    border: 2px solid var(--o-color-control1);
    border-radius: var(--o-radius_control-m);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--o-color-primary3);
    }

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

  &__case-filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--o-r-gap-3);
    margin-bottom: var(--o-r-gap-5);
  }

  &__case-sel {
    width: 140px;
  }

  &__execute-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--o-r-gap-4);
    border-top: 1px solid var(--o-color-control4);
  }

  &__table-section {
    margin-bottom: var(--o-r-gap-4);
  }

  &__table-title {
    font-size: var(--o-r-font_size-text1);
    font-weight: var(--o-font_weight-bold);
    color: var(--o-color-info1);
    margin: 0 0 var(--o-r-gap-4) 0;
  }

  &__stage-row {
    display: flex;
    gap: var(--o-r-gap-2);
    flex-wrap: wrap;
  }

  &__stage-dot {
    display: inline-flex;
  }

  &__action-cell {
    display: flex;
    gap: var(--o-r-gap-2);
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--o-r-gap-5);
  }
}
</style>