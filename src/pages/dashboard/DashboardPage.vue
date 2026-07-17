<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { OCard, OButton, OTag, OLink } from '@opensig/opendesign'
import { useAuth } from '../../composables/useAuth'
import {
  MOCK_PROJECTS,
  MOCK_PATCHES,
  MOCK_PIPELINE_TASKS,
  MOCK_TEST_CASES,
  type PipelineTask,
  type Patch,
} from '../../mock/data'

import { t } from '../../i18n/zh'
const { currentUser, isAdmin } = useAuth()
const router = useRouter()

const visibleProjects = computed(() =>
  isAdmin.value
    ? MOCK_PROJECTS
    : MOCK_PROJECTS.filter((p) => currentUser.value?.projectIds.includes(p.id))
)

const visiblePatches = computed<Patch[]>(() => {
  const allPatches = isAdmin.value
    ? MOCK_PATCHES
    : MOCK_PATCHES.filter((p) => currentUser.value?.projectIds.includes(p.projectId))
  return allPatches.slice(0, 5)
})

const activeRuns = computed<PipelineTask[]>(() =>
  MOCK_PIPELINE_TASKS.filter((r) => r.pipelineStatus === 'running')
)

const stats = computed(() => {
  const patches = isAdmin.value
    ? MOCK_PATCHES
    : MOCK_PATCHES.filter((p) => currentUser.value?.projectIds.includes(p.projectId))
  const tests = isAdmin.value
    ? MOCK_TEST_CASES
    : MOCK_TEST_CASES.filter((tc) => currentUser.value?.projectIds.includes(tc.projectId))

  return [
    {
      id: 'projects',
      label: t('dashboard.stat.projects'),
      value: visibleProjects.value.length,
      color: 'primary',
    },
    {
      id: 'patches',
      label: t('dashboard.stat.patches'),
      value: patches.length,
      color: 'info',
    },
    {
      id: 'testcases',
      label: t('dashboard.stat.testcases'),
      value: tests.length,
      color: 'success',
    },
    {
      id: 'pipelines',
      label: t('dashboard.stat.pipelines'),
      value: MOCK_PIPELINE_TASKS.length,
      color: 'warning',
    },
  ]
})

const patchStatusColor = (status: string) => {
  const map: Record<string, string> = {
    open: 'info',
    in_review: 'warning',
    merged: 'success',
    rejected: 'danger',
    closed: 'info',
  }
  return map[status] ?? 'info'
}

const pipelineStatusColor = (status: string) => {
  const map: Record<string, string> = {
    success: 'success',
    failed: 'danger',
    running: 'warning',
    pending: 'info',
    cancelled: 'info',
  }
  return map[status] ?? 'info'
}
</script>

<template>
  <section class="dashboard">
    <header class="dashboard__welcome">
      <h2 class="dashboard__greeting">{{ t('dashboard.greeting') }}，{{ currentUser?.name }}</h2>
      <p class="dashboard__desc">{{ t('dashboard.desc') }}</p>
    </header>

    <!-- Stats row -->
    <div class="dashboard__stats">
      <OCard v-for="stat in stats" :key="stat.id" class="dashboard__stat-card">
        <p class="dashboard__stat-label">{{ stat.label }}</p>
        <p class="dashboard__stat-value">{{ stat.value }}</p>
      </OCard>
    </div>

    <!-- Active pipelines -->
    <div v-if="activeRuns.length" class="dashboard__section">
      <div class="dashboard__section-header">
        <h3 class="dashboard__section-title">{{ t('dashboard.activePipelines') }}</h3>
        <OLink color="primary" href="javascript:void(0)" @click="() => router.push('/pipeline')">
          {{ t('action.viewAll') }}
        </OLink>
      </div>
      <div class="dashboard__active-runs">
        <OCard v-for="run in activeRuns" :key="run.id" class="dashboard__run-card">
          <div class="dashboard__run-header">
            <span class="dashboard__run-project">{{ run.projectName }}</span>
            <OTag color="warning" size="medium">{{ t('status.running') }}</OTag>
          </div>
          <p class="dashboard__run-title">{{ run.patchTitle }}</p>
          <p class="dashboard__run-meta">{{ t('dashboard.triggeredBy') }} {{ run.triggerBy }}</p>
        </OCard>
      </div>
    </div>

    <!-- My recent patches -->
    <div class="dashboard__section">
      <div class="dashboard__section-header">
        <h3 class="dashboard__section-title">
          {{ isAdmin ? t('dashboard.recentPatches') : t('dashboard.myPatches') }}
        </h3>
        <OLink color="primary" href="javascript:void(0)" @click="() => router.push('/patches')">
          {{ t('action.viewAll') }}
        </OLink>
      </div>
      <div class="dashboard__patch-list">
        <div v-for="patch in visiblePatches" :key="patch.id" class="dashboard__patch-item">
          <div class="dashboard__patch-main">
            <span class="dashboard__patch-title">{{ patch.title }}</span>
            <OTag :color="patchStatusColor(patch.status)" size="medium">{{ patch.status }}</OTag>
          </div>
          <div class="dashboard__patch-meta">
            <span>{{ patch.authorName }}</span>
            <span>{{ patch.updatedAt }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Projects quick access -->
    <div class="dashboard__section">
      <div class="dashboard__section-header">
        <h3 class="dashboard__section-title">{{ t('dashboard.myProjects') }}</h3>
        <OLink color="primary" href="javascript:void(0)" @click="() => router.push('/projects')">
          {{ t('action.viewAll') }}
        </OLink>
      </div>
      <div class="dashboard__project-grid">
        <OCard
          v-for="proj in visibleProjects.slice(0, 4)"
          :key="proj.id"
          class="dashboard__project-card"
        >
          <div class="dashboard__project-header">
            <span class="dashboard__project-name">{{ proj.name }}</span>
            <OTag
              :color="proj.status === '开发中' ? 'primary' : proj.status === '测试中' ? 'warning' : proj.status === '已完成' ? 'success' : 'normal'"
              :class="proj.status === '开发中' ? 'status-developing' : ''"
              size="medium"
            >
              {{ proj.status }}
            </OTag>
          </div>
          <p class="dashboard__project-desc">{{ proj.description }}</p>
          <div class="dashboard__project-meta">
            <span>{{ t('project.patches') }}: {{ proj.patchCount }}</span>
            <span>{{ t('project.tests') }}: {{ proj.testCount }}</span>
            <span>{{ t('project.passRate') }}: {{ proj.passRate }}%</span>
          </div>
          <OButton
            variant="text"
            color="primary"
            size="medium"
            @click="() => router.push(`/projects/${proj.id}`)"
          >
            {{ t('action.detail') }} →
          </OButton>
        </OCard>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.dashboard {
  &__welcome {
    margin-bottom: var(--o-r-gap-7);
  }

  &__greeting {
    margin: 0 0 var(--o-r-gap-2);
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-h2);
    line-height: var(--o-r-line_height-h2);
    font-weight: var(--o-font_weight-bold);
  }

  &__desc {
    margin: 0;
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
  }

  &__stats {
    display: flex;
    gap: var(--o-r-grid-column-gutter);
    margin-bottom: var(--o-r-gap-7);

    @media (max-width: 840px) {
      flex-wrap: wrap;
    }
  }

  &__stat-card {
    flex: 1;
    min-width: 120px;
  }

  &__stat-label {
    margin: 0 0 var(--o-r-gap-2);
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
  }

  &__stat-value {
    margin: 0;
    color: var(--o-color-primary1);
    font-size: var(--o-r-font_size-h1);
    line-height: var(--o-r-line_height-h1);
    font-weight: var(--o-font_weight-bold);
  }

  &__section {
    margin-bottom: var(--o-r-gap-8);
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--o-r-gap-4);
  }

  &__section-title {
    margin: 0;
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-h4);
    line-height: var(--o-r-line_height-h4);
    font-weight: var(--o-font_weight-bold);
  }

  &__active-runs {
    display: flex;
    gap: var(--o-r-grid-column-gutter);
    flex-wrap: wrap;
  }

  &__run-card {
    flex: 1;
    min-width: 240px;
  }

  &__run-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--o-r-gap-2);
  }

  &__run-project {
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
    font-weight: var(--o-font_weight-bold);
  }

  &__run-title {
    margin: 0 0 var(--o-r-gap-2);
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
  }

  &__run-meta {
    margin: 0;
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
  }

  &__patch-list {
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-3);
    padding: var(--o-r-gap-4);
    background-color: var(--o-color-fill2);
    border-radius: var(--o-radius_control-m);
    border: 1px solid var(--o-color-control1);
  }

  &__patch-item {
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-1);
    padding-bottom: var(--o-r-gap-3);
    border-bottom: 1px solid var(--o-color-control1);

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  &__patch-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--o-r-gap-3);
  }

  &__patch-title {
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
    flex: 1;
  }

  &__patch-meta {
    display: flex;
    gap: var(--o-r-gap-4);
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
  }

  &__project-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--o-r-grid-column-gutter);

    @media (max-width: 840px) {
      grid-template-columns: 1fr;
    }
  }

  &__project-card {
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-3);
  }

  &__project-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__project-name {
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-h5);
    line-height: var(--o-r-line_height-h5);
    font-weight: var(--o-font_weight-bold);
  }

  &__project-desc {
    margin: 0;
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__project-meta {
    display: flex;
    gap: var(--o-r-gap-4);
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
  }
}
</style>