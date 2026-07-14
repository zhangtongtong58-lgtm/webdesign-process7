<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { OInput, OSelect, OOption, OButton, OTag, OCard } from '@opensig/opendesign'
import { useAuth } from '../../composables/useAuth'
import { MOCK_PROJECTS, type Project } from '../../mock/data'

import { t } from '../../i18n/zh'
const { currentUser, isAdmin } = useAuth()
const router = useRouter()

const baseProjects = computed<Project[]>(() =>
  isAdmin.value
    ? MOCK_PROJECTS
    : MOCK_PROJECTS.filter((p) => currentUser.value?.projectIds.includes(p.id))
)

const filters = reactive({ keyword: '', status: '', language: '' })
const applied = reactive({ keyword: '', status: '', language: '' })

const statusOptions = [
  { value: '', label: t('filter.all') },
  { value: '开发中', label: '开发中' },
  { value: '测试中', label: '测试中' },
  { value: '已完成', label: '已完成' },
]

const languageOptions = computed(() => {
  const langs = [...new Set(MOCK_PROJECTS.map((p) => p.language))]
  return [{ value: '', label: t('filter.all') }, ...langs.map((l) => ({ value: l, label: l }))]
})

const filteredProjects = computed(() =>
  baseProjects.value.filter((p) => {
    const kw = applied.keyword.toLowerCase()
    const matchKw = !kw || p.name.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw)
    const matchStatus = !applied.status || p.status === applied.status
    const matchLang = !applied.language || p.language === applied.language
    return matchKw && matchStatus && matchLang
  })
)

const handleQuery = () => {
  applied.keyword = filters.keyword
  applied.status = filters.status
  applied.language = filters.language
}

const handleReset = () => {
  filters.keyword = ''
  filters.status = ''
  filters.language = ''
  handleQuery()
}

const statusColor = (status: string) => {
  const map: Record<string, string> = { '开发中': 'primary', '测试中': 'warning', '已完成': 'success' }
  return map[status] ?? 'info'
}
const statusClass = (status: string) => status === '开发中' ? 'status-developing' : ''
</script>

<template>
  <section class="project-list">
    <div class="project-list__toolbar">
      <OInput
        v-model="filters.keyword"
        :placeholder="t('project.searchPlaceholder')"
        clearable
        class="project-list__search"
      />
      <OSelect v-model="filters.status" :placeholder="t('filter.status')" searchable class="project-list__select">
        <OOption v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
      </OSelect>
      <OSelect v-model="filters.language" :placeholder="t('filter.language')" searchable class="project-list__select">
        <OOption v-for="opt in languageOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
      </OSelect>
      <div class="project-list__btns">
        <OButton variant="solid" color="primary" @click="handleQuery" round="pill">{{ t('action.query') }}</OButton>
        <OButton variant="outline" color="primary" @click="handleReset" round="pill">{{ t('action.reset') }}</OButton>
      </div>
      <OButton v-if="isAdmin" variant="solid" color="primary" class="project-list__create" round="pill">
        + {{ t('project.create') }}
      </OButton>
    </div>

    <div class="project-list__count">
      {{ t('project.total') }}: {{ filteredProjects.length }}
    </div>

    <div v-if="filteredProjects.length" class="project-list__grid">
      <OCard
        v-for="proj in filteredProjects"
        :key="proj.id"
        class="project-list__card"
      >
        <div class="project-list__card-head">
          <div class="project-list__card-name-row">
            <span class="project-list__card-name">{{ proj.name }}</span>
            <OTag :color="statusColor(proj.status)" size="medium" :class="statusClass(proj.status)">{{ proj.status }}</OTag>
          </div>
          <OTag color="info" size="medium" variant="outline">{{ proj.language }}</OTag>
        </div>

        <p class="project-list__card-desc">{{ proj.description }}</p>

        <div class="project-list__card-metrics">
          <div class="project-list__metric">
            <span class="project-list__metric-val">{{ proj.patchCount }}</span>
            <span class="project-list__metric-lbl">{{ t('project.patches') }}</span>
          </div>
          <div class="project-list__metric">
            <span class="project-list__metric-val">{{ proj.testCount }}</span>
            <span class="project-list__metric-lbl">{{ t('project.tests') }}</span>
          </div>
          <div class="project-list__metric">
            <span
              class="project-list__metric-val"
              :class="proj.passRate >= 90 ? 'project-list__metric-val--good' : 'project-list__metric-val--warn'"
            >
              {{ proj.passRate }}%
            </span>
            <span class="project-list__metric-lbl">{{ t('project.passRate') }}</span>
          </div>
        </div>

        <div class="project-list__card-footer">
          <span class="project-list__card-updated">{{ t('project.updated') }}: {{ proj.lastUpdated }}</span>
          <div class="project-list__card-actions">
            <OButton
              variant="text"
              color="primary"
              size="medium"
              @click="() => router.push(`/projects/${proj.id}`)"
            >
              {{ t('action.detail') }}
            </OButton>
            <OButton v-if="isAdmin" variant="text" size="medium" round="pill">{{ t('action.edit') }}</OButton>
          </div>
        </div>
      </OCard>
    </div>

    <div v-else class="project-list__empty">
      <p>{{ t('project.empty') }}</p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.project-list {
  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--o-r-gap-4);
    padding: var(--o-r-gap-5);
    margin-bottom: var(--o-r-gap-5);
    background-color: var(--o-color-fill2);
    border-radius: var(--o-radius_control-m);
    box-shadow: var(--o-shadow-1);
  }

  &__search {
    width: 240px;
    @media (max-width: 840px) { width: 100%; }
  }

  &__select {
    width: 160px;
    @media (max-width: 840px) { width: 100%; }
  }

  &__btns {
    display: flex;
    gap: var(--o-r-gap-3);
  }

  &__create {
    margin-left: auto;
  }

  &__count {
    margin-bottom: var(--o-r-gap-4);
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--o-r-grid-column-gutter);

    @media (max-width: 1200px) { grid-template-columns: 1fr; }
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-4);
  }

  &__card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--o-r-gap-3);
  }

  &__card-name-row {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-3);
  }

  &__card-name {
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-h4);
    line-height: var(--o-r-line_height-h4);
    font-weight: var(--o-font_weight-bold);
  }

  &__card-desc {
    margin: 0;
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__card-metrics {
    display: flex;
    gap: var(--o-r-gap-6);
    padding: var(--o-r-gap-4);
    background-color: var(--o-color-fill3);
    border-radius: var(--o-radius_control-m);
  }

  &__metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--o-r-gap-1);
  }

  &__metric-val {
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-h3);
    line-height: var(--o-r-line_height-h3);
    font-weight: var(--o-font_weight-bold);

    &--good { color: var(--o-color-success1); }
    &--warn { color: var(--o-color-warning1); }
  }

  &__metric-lbl {
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
  }

  &__card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--o-color-control1);
    padding-top: var(--o-r-gap-3);
  }

  &__card-updated {
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
  }

  &__card-actions {
    display: flex;
    gap: var(--o-r-gap-2);
  }

  &__empty {
    display: flex;
    justify-content: center;
    padding: var(--o-r-gap-10) 0;
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
  }
}
</style>