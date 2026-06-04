<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  OButton, OTag, OTable, OPagination, OSelect, OOption,
  OCheckbox, OLink, OMessage, OInput,
} from '@opensig/opendesign'
import { useAuth } from '../../composables/useAuth'
import { t } from '../../i18n/zh'

// ─── Extended patch type (local, independent of global mock) ─────────────────

interface PatchRow {
  id: string
  projectId: string
  title: string
  description: string
  communityIssue: string | null
  patchType: string
  productVersion: string
  userKernelMode: string | null
  patchModule: string
  commitOE: string
  prRelated: string | null
  oeMergeTag: string
  oePR: string
  commitUpstream: string
  upstreamMergeTag: string
  mainKey: string
  merged: boolean
  customerImpact: string
  hwRepoStatus: 'all' | 'partial' | 'none'
  customerMergeStatus: string
  mergeVersion: string
  osReleaseVersion: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ALL_PATCHES: PatchRow[] = [
  {
    id: 'pa1', projectId: 'p1',
    title: 'DAA算子内核态驱动支持',
    description: '内核ZIP驱动支持hash-agg算法类型对UACCE呈现',
    communityIssue: null, patchType: 'Bug_4', productVersion: '950',
    userKernelMode: null, patchModule: 'ACC',
    commitOE: 'crypto: hisilicon - enable error reporting again',
    prRelated: null, oeMergeTag: '6.6.0-94.0.0',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/16483',
    commitUpstream: '80736a97cf94eeb02da6de6cfbc5a74514c85a16',
    upstreamMergeTag: 'v6.18-rc1', mainKey: '321138:13916',
    merged: true, customerImpact: '无影响', hwRepoStatus: 'all',
    customerMergeStatus: '已合入', mergeVersion: 'main-5.10', osReleaseVersion: '24.03-LTS',
  },
  {
    id: 'pa2', projectId: 'p1',
    title: 'DAA算子内核态驱动支持',
    description: '内核ZIP驱动支持hash-agg算法类型对UACCE呈现',
    communityIssue: null, patchType: 'Bug_5', productVersion: '950',
    userKernelMode: null, patchModule: 'ACC',
    commitOE: 'crypto: hisilicon/zip - do not expose hashagg algorithm when uacce mode is 2',
    prRelated: null, oeMergeTag: '6.6.0-94.0.0',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/16483',
    commitUpstream: '', upstreamMergeTag: '', mainKey: '321139:14005',
    merged: true, customerImpact: '无影响', hwRepoStatus: 'all',
    customerMergeStatus: '已合入', mergeVersion: 'main-5.10', osReleaseVersion: '24.03-LTS',
  },
  {
    id: 'pa3', projectId: 'p1',
    title: 'DAA算子内核态驱动支持',
    description: '内核ZIP驱动支持hash-agg算法类型对UACCE呈现',
    communityIssue: null, patchType: 'Bug_7', productVersion: '950',
    userKernelMode: null, patchModule: 'ACC',
    commitOE: 'misc: uacce - fix a null pointer access issue when poweroff',
    prRelated: null, oeMergeTag: '6.6.0-119.0.0',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/18980',
    commitUpstream: '', upstreamMergeTag: '', mainKey: '324123:14218',
    merged: false, customerImpact: '修复空指针崩溃', hwRepoStatus: 'partial',
    customerMergeStatus: '待合入', mergeVersion: '', osReleaseVersion: '',
  },
  {
    id: 'pa4', projectId: 'p1',
    title: 'PCIe DPC中断注册优化',
    description: 'PCIe DPC中断注册机制改进，支持中断累加',
    communityIssue: 'I9X2K1', patchType: 'Feature_1', productVersion: '950',
    userKernelMode: '内核', patchModule: 'PCIe',
    commitOE: 'pcie/portdrv: add DPC interrupt support for RC port',
    prRelated: null, oeMergeTag: '6.6.0-90.0.0',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/15200',
    commitUpstream: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
    upstreamMergeTag: 'v6.17-rc2', mainKey: '318456:12001',
    merged: true, customerImpact: '提升中断注册可靠性', hwRepoStatus: 'all',
    customerMergeStatus: '已合入', mergeVersion: 'main-5.10', osReleaseVersion: '24.03-LTS',
  },
  {
    id: 'pa5', projectId: 'p1',
    title: 'ZIP压缩性能基准优化',
    description: 'ZIP驱动压缩性能基准测试路径优化',
    communityIssue: null, patchType: 'Bug_3', productVersion: '950',
    userKernelMode: null, patchModule: 'ZIP',
    commitOE: 'crypto: hisilicon/zip - fix perf benchmark path',
    prRelated: null, oeMergeTag: '6.6.0-120.0.0',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/19100',
    commitUpstream: '', upstreamMergeTag: '', mainKey: '325001:14500',
    merged: false, customerImpact: '性能提升约3%', hwRepoStatus: 'none',
    customerMergeStatus: '未合入', mergeVersion: '', osReleaseVersion: '',
  },
  {
    id: 'pa6', projectId: 'p3',
    title: 'UACCE设备注册加固',
    description: 'UACCE设备注册流程安全性加固，防止空指针访问',
    communityIssue: 'CVE-2026-1234', patchType: 'Bug_12', productVersion: '950Pro',
    userKernelMode: '内核', patchModule: 'UACCE',
    commitOE: 'uacce: fix device registration security issue',
    prRelated: null, oeMergeTag: '6.6.0-95.0.0',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/17000',
    commitUpstream: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
    upstreamMergeTag: 'v6.16-rc3', mainKey: '320001:13000',
    merged: true, customerImpact: '修复安全漏洞', hwRepoStatus: 'all',
    customerMergeStatus: '已合入', mergeVersion: 'sec-5.10', osReleaseVersion: '22.03-LTS-SP3',
  },
]

const { isAdmin, currentUser } = useAuth()

const basePatches = computed<PatchRow[]>(() =>
  isAdmin.value
    ? ALL_PATCHES
    : ALL_PATCHES.filter((p) => (currentUser.value?.projectIds ?? []).includes(p.projectId))
)

// ─── Filters — null 表示未选，不触发筛选 ──────────────────────────────────────
// 关键：初始值必须是 null，不能是 ''，否则 OSelect placeholder 不显示

const filters = reactive<{
  module: string | null
  mainKey: string
  patchType: string | null
  version: string | null
  mergeStatus: string | null
  hwRepoStatus: string | null
}>({
  module: null,
  mainKey: '',
  patchType: null,
  version: null,
  mergeStatus: null,
  hwRepoStatus: null,
})

const applied = reactive({ ...filters })

// 下拉选项（无"全部"空值选项——由 placeholder 承担该角色）
const moduleOptions   = [{ value: 'ACC', label: 'ACC' }, { value: 'ZIP', label: 'ZIP' }, { value: 'PCIe', label: 'PCIe' }, { value: 'UACCE', label: 'UACCE' }]
const patchTypeOptions= [{ value: 'Bug', label: 'Bug' }, { value: 'Feature', label: 'Feature' }, { value: 'cleanup', label: 'Cleanup' }]
const versionOptions  = [{ value: '950', label: '950' }, { value: '950Pro', label: '950Pro' }]
const mergeOptions    = [{ value: 'true', label: '已合入' }, { value: 'false', label: '未合入' }]
const hwRepoOptions   = [{ value: 'all', label: '全合入' }, { value: 'partial', label: '部分合入' }, { value: 'none', label: '未合入' }]

const filtered = computed<PatchRow[]>(() =>
  basePatches.value.filter((p) => {
    const matchModule   = !applied.module    || p.patchModule === applied.module
    const matchMainKey  = !applied.mainKey   || p.mainKey.includes(applied.mainKey)
    const matchType     = !applied.patchType || p.patchType.startsWith(applied.patchType)
    const matchVersion  = !applied.version   || p.productVersion === applied.version
    const matchMerge    = !applied.mergeStatus   || String(p.merged) === applied.mergeStatus
    const matchHwRepo   = !applied.hwRepoStatus  || p.hwRepoStatus === applied.hwRepoStatus
    return matchModule && matchMainKey && matchType && matchVersion && matchMerge && matchHwRepo
  })
)

// ─── Pagination ───────────────────────────────────────────────────────────────

const page = ref(1)
const pageSize = ref(10)
const pagedRows = computed(() => {
  const s = (page.value - 1) * pageSize.value
  return filtered.value.slice(s, s + pageSize.value)
})
const onPageChange = (val: { page: number; pageSize: number }) => {
  page.value = val.pageSize !== pageSize.value ? 1 : val.page
  pageSize.value = val.pageSize
}

// ─── Actions ──────────────────────────────────────────────────────────────────

const handleQuery = () => { Object.assign(applied, filters); page.value = 1 }

const handleClear = () => {
  Object.assign(filters, { module: null, mainKey: '', patchType: null, version: null, mergeStatus: null, hwRepoStatus: null })
  handleQuery()
}

// 行级勾选（与 PatchTab 保持一致：ref<string[]> + v-model 数组模式）
const selectedIds = ref<string[]>([])
const allChecked = computed({
  get: () => pagedRows.value.length > 0 && pagedRows.value.every(r => selectedIds.value.includes(r.id)),
  set: (v: boolean) => {
    if (v) {
      const ids = pagedRows.value.map(r => r.id)
      selectedIds.value = [...new Set([...selectedIds.value, ...ids])]
    } else {
      const ids = new Set(pagedRows.value.map(r => r.id))
      selectedIds.value = selectedIds.value.filter(id => !ids.has(id))
    }
  }
})

const stats = computed(() => [
  { id: 'total',    label: t('patch.total'),    value: basePatches.value.length, mod: 'primary' },
  { id: 'merged',   label: t('patch.merged'),   value: basePatches.value.filter(p => p.merged).length, mod: 'success' },
  { id: 'pending',  label: t('patch.pending'),  value: basePatches.value.filter(p => !p.merged).length, mod: 'warning' },
  { id: 'selected', label: t('patch.selected'), value: selectedIds.value.length, mod: 'danger' },
])

// 22 列（含勾选列）— 宽度基于实际内容平均长度测算（总宽 2452px）
const columns = [
  { label: '',                     key: 'select',              style: { width: '72px',  minWidth: '72px'  } },
  { label: '概述(SR粒度)',        key: 'title',               style: { width: '160px', minWidth: '160px' } },
  { label: '功能介绍(AR粒度)',    key: 'description',         style: { width: '180px', minWidth: '180px' } },
  { label: '关联社区Issue',       key: 'communityIssue',      style: { width: '110px', minWidth: '110px' } },
  { label: '补丁类型',            key: 'patchType',           style: { width: '100px', minWidth: '100px' } },
  { label: '产品版本',            key: 'productVersion',      style: { width: '80px',  minWidth: '80px'  } },
  { label: '用户态/内核态',       key: 'userKernelMode',      style: { width: '80px',  minWidth: '80px'  } },
  { label: '补丁模块',            key: 'patchModule',         style: { width: '80px',  minWidth: '80px'  } },
  { label: 'Commit OE',          key: 'commitOE',            style: { width: '200px', minWidth: '200px' } },
  { label: 'PR前、后置补丁',      key: 'prRelated',           style: { width: '100px', minWidth: '100px' } },
  { label: 'OE Merge tag',       key: 'oeMergeTag',          style: { width: '120px', minWidth: '120px' } },
  { label: 'OE PR',              key: 'oePR',                style: { width: '200px', minWidth: '200px' } },
  { label: 'Commit upstream',    key: 'commitUpstream',      style: { width: '140px', minWidth: '140px' } },
  { label: 'upstream Merge tag', key: 'upstreamMergeTag',    style: { width: '130px', minWidth: '130px' } },
  { label: '主键',                key: 'mainKey',             style: { width: '110px', minWidth: '110px' } },
  { label: '是否合入',            key: 'merged',              style: { width: '80px',  minWidth: '80px'  } },
  { label: '客户影响',            key: 'customerImpact',      style: { width: '120px', minWidth: '120px' } },
  { label: '华为仓库合入状态',    key: 'hwRepoStatus',        style: { width: '100px', minWidth: '100px' } },
  { label: '客户侧合入状态',      key: 'customerMergeStatus', style: { width: '100px', minWidth: '100px' } },
  { label: '合入版本',            key: 'mergeVersion',        style: { width: '100px', minWidth: '100px' } },
  { label: 'OS发布版本',          key: 'osReleaseVersion',    style: { width: '120px', minWidth: '120px' } },
  { label: '操作',                key: 'action',              style: { width: '90px',  minWidth: '90px'  } },
]

const hwRepoLabel = (s: string) => ({ all: '全合入', partial: '部分合入', none: '未合入' }[s] ?? s)
const hwRepoColor = (s: string) => ({ all: 'success', partial: 'warning', none: 'danger' }[s] ?? 'info')

const handleMerge = () => {
  if (!selectedIds.value.length) { OMessage.warning('请先选择补丁'); return }
  OMessage.success(`已选 ${selectedIds.value.length} 条，合入操作已触发`)
}
</script>

<template>
  <section class="patch-board">
    <!-- ── 页面标题 ── -->
    <div class="patch-board__header">
      <h2 class="patch-board__title">{{ t('nav.patches') }}</h2>
    </div>

    <!-- ── 筛选器
         spec: OSelect variant="outline" size="medium"
         初始值 null → placeholder 显示分类名；选中后显示选中值
    ── -->
    <div class="patch-board__filter">
      <OSelect
        v-model="filters.module"
        placeholder="补丁模块"
        variant="outline"
       
        size="medium"
        class="patch-board__filter-sel"
        @change="handleQuery"
      >
        <OOption v-for="o in moduleOptions" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>

      <!-- 主键用 OInput，spec: size=small，round=pill，inline -->
      <OInput
        v-model="filters.mainKey"
        placeholder="主键"
        size="medium"
       
        class="patch-board__filter-input"
        clearable
        @change="handleQuery"
      />

      <OSelect
        v-model="filters.patchType"
        placeholder="补丁类型"
        variant="outline"
       
        size="medium"
        class="patch-board__filter-sel"
        @change="handleQuery"
      >
        <OOption v-for="o in patchTypeOptions" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>

      <OSelect
        v-model="filters.version"
        placeholder="产品版本"
        variant="outline"
       
        size="medium"
        class="patch-board__filter-sel"
        @change="handleQuery"
      >
        <OOption v-for="o in versionOptions" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>

      <OSelect
        v-model="filters.mergeStatus"
        placeholder="合入状态"
        variant="outline"
       
        size="medium"
        class="patch-board__filter-sel"
        @change="handleQuery"
      >
        <OOption v-for="o in mergeOptions" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>

      <OSelect
        v-model="filters.hwRepoStatus"
        placeholder="华为仓库状态"
        variant="outline"
       
        size="medium"
        class="patch-board__filter-sel patch-board__filter-sel--wide"
        @change="handleQuery"
      >
        <OOption v-for="o in hwRepoOptions" :key="o.value" :value="o.value" :label="o.label" />
      </OSelect>

      <OLink color="primary" class="patch-board__filter-clear" @click="handleClear">
        清除筛选
      </OLink>
    </div>

    <!-- ── 工具栏 ── -->
    <div class="patch-board__toolbar">
      <OButton v-if="isAdmin" variant="solid" color="primary" size="medium">
        {{ t('patch.create') }}
      </OButton>
      <OButton variant="outline" size="medium">{{ t('action.import') }}</OButton>
      <OButton variant="outline" size="medium">{{ t('action.export') }}</OButton>
    </div>

    <div class="patch-board__table-wrap">
      <OTable :columns="columns" :data="pagedRows">
        <!-- 勾选列：th_select / td_select（与 PatchTab 相同模式，不用 #header 避免覆盖列标题） -->
        <template #th_select>
          <OCheckbox v-model="allChecked" />
        </template>
        <template #td_select="{ row }">
          <OCheckbox v-model="selectedIds" :value="row.id" />
        </template>

        <template #td_title="{ row }">
          <span class="patch-board__cell-title">{{ row.title }}</span>
        </template>
        <template #td_description="{ row }">
          <span class="patch-board__cell-desc">{{ row.description }}</span>
        </template>
        <template #td_communityIssue="{ row }">
          <OLink v-if="row.communityIssue" color="primary" href="javascript:void(0)" class="patch-board__cell-mono">
            {{ row.communityIssue }}
          </OLink>
          <span v-else class="patch-board__dash">—</span>
        </template>
        <template #td_patchType="{ row }">
          <OTag color="danger" size="medium">{{ row.patchType }}</OTag>
        </template>
        <template #td_userKernelMode="{ row }">
          <span class="patch-board__muted">{{ row.userKernelMode ?? '—' }}</span>
        </template>
        <template #td_prRelated="{ row }">
          <span class="patch-board__muted">{{ row.prRelated ?? '—' }}</span>
        </template>
        <template #td_oePR="{ row }">
          <OLink v-if="row.oePR" color="primary" :href="row.oePR" target="_blank" class="patch-board__pr-url">
            {{ row.oePR }}
          </OLink>
          <span v-else class="patch-board__muted">—</span>
        </template>
        <template #td_commitUpstream="{ row }">
          <span class="patch-board__cell-hash">
            {{ row.commitUpstream ? row.commitUpstream.slice(0, 16) : '—' }}
          </span>
        </template>
        <template #td_merged="{ row }">
          <OTag :color="row.merged ? 'success' : 'warning'" size="medium">
            {{ row.merged ? '已合入' : '未合入' }}
          </OTag>
        </template>
        <template #td_hwRepoStatus="{ row }">
          <OTag :color="hwRepoColor(row.hwRepoStatus)" size="medium">
            {{ hwRepoLabel(row.hwRepoStatus) }}
          </OTag>
        </template>
        <template #td_mergeVersion="{ row }">
          <span class="patch-board__muted">{{ row.mergeVersion || '—' }}</span>
        </template>
        <template #td_osReleaseVersion="{ row }">
          <span class="patch-board__muted">{{ row.osReleaseVersion || '—' }}</span>
        </template>
        <template #td_action>
          <div class="patch-board__action-cell">
            <OLink color="primary" href="javascript:void(0)">编辑</OLink>
            <OLink color="danger" href="javascript:void(0)">删除</OLink>
          </div>
        </template>
      </OTable>
    </div>

    <!-- ── 底部操作 + 分页 ── -->
    <div class="patch-board__bottom">
      <div class="patch-board__bottom-actions">
        <OButton variant="solid" color="primary" size="medium" @click="handleMerge">
          {{ t('patch.merge') }}
        </OButton>
        <OButton variant="outline" size="medium">{{ t('patch.viewCases') }}</OButton>
        <OButton variant="outline" color="danger" size="medium">
          {{ t('patch.batchDelete') }}
        </OButton>
      </div>
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
// ── 统计卡片（spec: OCard icon 型，padding top/bottom=gap-5, left/right=gap-6）
.stat-card {
  flex: 1;
  padding: var(--o-r-gap-5) var(--o-r-gap-6);
  background-color: var(--o-color-fill2);
  border: 1px solid var(--o-color-control1);
  border-radius: var(--o-radius_control-m);
  border-left-width: 4px;
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-2);
  min-width: 140px;

  &--primary { border-left-color: var(--o-color-primary1);  .stat-card__num { color: var(--o-color-primary1); } }
  &--success { border-left-color: var(--o-color-success1);  .stat-card__num { color: var(--o-color-success1); } }
  &--warning { border-left-color: var(--o-color-warning1);  .stat-card__num { color: var(--o-color-warning1); } }
  &--danger  { border-left-color: var(--o-color-danger1);   .stat-card__num { color: var(--o-color-danger1);  } }

  &__num {
    font-size: var(--o-r-font_size-h1);
    line-height: var(--o-r-line_height-h1);
    font-weight: 700;
  }
  &__label {
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
  }
}

// ── Layout ──
.patch-board {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--o-r-gap-5);
  }
  &__title {
    margin: 0;
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-h3);
    line-height: var(--o-r-line_height-h3);
    font-weight: 600;
  }
  &__header-actions {
    display: flex;
    gap: var(--o-r-gap-3);
  }

  &__stats {
    display: flex;
    gap: var(--o-r-grid-column-gutter);
    margin-bottom: var(--o-r-gap-6);
  }

  // ── 筛选器行
  // spec: OSelect size=medium(32px), variant=outline, round=pill
  // 对应参考图：胶囊形描边按钮，显示分类名 + 下箭头
  &__filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--o-r-gap-3);
    margin-bottom: var(--o-r-gap-4);
  }
  // OSelect medium spec 默认宽 104px，扩大以容纳中文标签
  &__filter-sel { width: 130px; }
  &__filter-sel--wide { width: 150px; }
  // OInput medium 与 OSelect 同高 32px
  &__filter-input { width: 130px; }
  &__filter-clear {
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    cursor: pointer;
    white-space: nowrap;
    color: var(--o-color-info3);
  }

  &__toolbar {
    display: flex;
    gap: var(--o-r-gap-3);
    margin-bottom: var(--o-r-gap-4);
  }

  // ── 表格横向滚动
  // 结构：table-wrap(overflow-x:auto) > table-inner(min-width) > OTable(width:100%)
  // 横向滚动原理：
  // - table-inner 设固定宽度，table { width:100% } 填满该宽度而非压缩到视口宽
  // - table-wrap overflow: scroll 强制显示滚动条（不依赖溢出探测）
  // table-wrap：不需要设 overflow，由非 scoped CSS 让 OTable 内部滚动
  &__table-wrap {
    margin-bottom: var(--o-r-gap-3);
  }

  // 单元格内容样式
  &__cell-title {
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-tip1);
    font-weight: 500;
    // 最大宽度限制，超长折行
    max-width: 110px;
    display: block;
    word-break: break-all;
  }
  &__cell-desc {
    font-size: var(--o-r-font_size-tip1);
    max-width: 160px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  &__cell-mono {
    font-size: var(--o-r-font_size-tip1);
    font-family: monospace;
    white-space: nowrap;
  }
  &__cell-link {
    font-size: var(--o-r-font_size-tip1);
    white-space: nowrap;
  }
  &__cell-hash {
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip2);
    font-family: monospace;
    max-width: 120px;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__pr-url {
    font-size: var(--o-r-font_size-tip2);
    word-break: break-all;
    display: block;
    line-height: var(--o-r-line_height-tip2);
  }
  &__muted {
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip1);
    white-space: nowrap;
  }
  &__dash {
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-tip1);
  }
  &__action-cell {
    display: flex;
    gap: var(--o-r-gap-2);
    white-space: nowrap;
  }

  // ── 底部栏：ODivider light（color-control4，同级分隔）
  &__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--o-r-gap-4);
    border-top: 1px solid var(--o-color-control4);
  }
  &__bottom-actions {
    display: flex;
    gap: var(--o-r-gap-3);
  }
}
</style>

<!-- 非 scoped：强制表头不换行，让列宽由内容决定而非被压缩，从而触发横向滚动 -->
<style>
/* ── 横向滚动核心修复 ───────────────────────────────────────────────────
   问题：OTable 内置 .o-table-wrap { overflow: hidden } 把 table 裁剪在容器内，
         外层容器的 overflow-x:scroll/auto 永远探测不到溢出，所以不出现滚动条。
   修法：覆盖 .o-table-wrap 的 overflow-x → auto，让 OTable 自身容器横向滚动；
         同时给 table 设 min-width，防止列被压缩。
   选择器 .patch-board__table-wrap .o-table-wrap 比 .o-table-wrap 权重高，无需 !important。
──────────────────────────────────────────────────────────────────────── */
.patch-board__table-wrap .o-table-wrap {
  overflow-x: auto;
  overflow-y: hidden; /* 保留原来的 hidden-y，不影响布局 */
  -webkit-overflow-scrolling: touch;
}
/* 21 列的表格至少 2000px；min-width 防止 width:100% 把列压缩到视口宽度 */
.patch-board__table-wrap table {
  min-width: 2572px;
  table-layout: fixed;  /* 严格按 column style.width 渲染，不自动撑宽 */
  word-break: break-all; /* 超长文字在列内换行，不破坏列宽 */
}
/* th：允许换行，不截断，列头完整显示 */
.patch-board__table-wrap th {
  white-space: normal;
  word-break: break-word;
}
/* td：数据单元格保持截断（防止长内容撑坏列宽）*/
.patch-board__table-wrap td {
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 强制文字在列内允许换行（适用于 commit/描述等需要折行的列） */
.patch-board__table-wrap td .patch-board__cell-desc,
.patch-board__table-wrap td .patch-board__cell-title {
  word-break: break-all;
  white-space: normal;
}
</style>
