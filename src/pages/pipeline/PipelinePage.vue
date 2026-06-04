<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { OSelect, OOption, OButton, OTag, OTable, OPagination } from '@opensig/opendesign'
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
      <OSelect v-model="filters.projectId" :placeholder="t('filter.project')" class="pipeline-page__field">
        <OOption v-for="opt in projectOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
      </OSelect>
      <OSelect v-model="filters.status" :placeholder="t('filter.status')" class="pipeline-page__field">
        <OOption v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
      </OSelect>
      <div class="pipeline-page__btns">
        <OButton variant="solid" color="primary" @click="handleQuery" round="pill">{{ t('action.query') }}</OButton>
        <OButton variant="outline" @click="handleReset" round="pill">{{ t('action.reset') }}</OButton>
      </div>
      <OButton v-if="isAdmin" variant="solid" color="primary" class="pipeline-page__trigger" round="pill">
        {{ t('pipeline.trigger') }}
      </OButton>
    </div>

    <!-- Table -->
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
          <OButton v-if="isAdmin" variant="text" size="medium" round="pill">{{ t('action.rerun') }}</OButton>
        </div>
      </template>
    </OTable>

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
    font-weight: 700;
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
