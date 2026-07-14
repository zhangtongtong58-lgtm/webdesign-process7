<script setup lang="ts">
import { computed, reactive, ref, nextTick } from 'vue'
import {
  OButton, OTag, OTable, OPagination, OSelect, OOption,
  OCheckbox, OLink, OMessage, OInput, ODropdown, ODialog, OTextarea, ODivider,
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
  userKernel: string | null
  patchModule: string
  commitOE: string
  commitIdOE: string
  prRelated: string | null
  oeMergeTag: string
  oePR: string
  commitUpstream: string
  upstreamMergeTag: string
  mainKey: string
  merged: boolean
  customerImpact: string
  hwRepoStatus: 'merged' | 'unmerged'
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
    userKernel: null, patchModule: 'ACC',
    commitOE: 'crypto: hisilicon - enable error reporting again',
    commitIdOE: '5f3a1b2c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a',
    prRelated: null, oeMergeTag: '6.6.0-94.0.0',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/16483',
    commitUpstream: '80736a97cf94eeb02da6de6cfbc5a74514c85a16',
    upstreamMergeTag: 'v6.18-rc1', mainKey: '321138:13916',
    merged: true, customerImpact: '无影响', hwRepoStatus: 'merged',
    customerMergeStatus: '已合入', mergeVersion: 'main-5.10', osReleaseVersion: '24.03-LTS',
  },
  {
    id: 'pa2', projectId: 'p1',
    title: 'DAA算子内核态驱动支持',
    description: '内核ZIP驱动支持hash-agg算法类型对UACCE呈现',
    communityIssue: null, patchType: 'Bug_5', productVersion: '950',
    userKernel: null, patchModule: 'ACC',
    commitOE: 'crypto: hisilicon/zip - do not expose hashagg algorithm when uacce mode is 2',
    commitIdOE: '3e7c9d1a2b4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
    prRelated: null, oeMergeTag: '6.6.0-94.0.0',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/16483',
    commitUpstream: '', upstreamMergeTag: '', mainKey: '321139:14005',
    merged: true, customerImpact: '无影响', hwRepoStatus: 'merged',
    customerMergeStatus: '已合入', mergeVersion: 'main-5.10', osReleaseVersion: '24.03-LTS',
  },
  {
    id: 'pa3', projectId: 'p1',
    title: 'DAA算子内核态驱动支持',
    description: '内核ZIP驱动支持hash-agg算法类型对UACCE呈现',
    communityIssue: null, patchType: 'Bug_7', productVersion: '950',
    userKernel: null, patchModule: 'ACC',
    commitOE: 'misc: uacce - fix a null pointer access issue when poweroff',
    commitIdOE: '8a2b4c6d1e3f5a7b9c0d2e4f6a8b0c1d3e5f7a9b1c',
    prRelated: null, oeMergeTag: '6.6.0-119.0.0',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/18980',
    commitUpstream: '', upstreamMergeTag: '', mainKey: '324123:14218',
    merged: false, customerImpact: '修复空指针崩溃', hwRepoStatus: 'unmerged',
    customerMergeStatus: '待合入', mergeVersion: '', osReleaseVersion: '',
  },
  {
    id: 'pa4', projectId: 'p1',
    title: 'PCIe DPC中断注册优化',
    description: 'PCIe DPC中断注册机制改进，支持中断累加',
    communityIssue: 'I9X2K1', patchType: 'Feature_1', productVersion: '950',
    userKernel: '内核', patchModule: 'PCIe',
    commitOE: 'pcie/portdrv: add DPC interrupt support for RC port',
    commitIdOE: '1c3e5a7b9d1f2a4b6c8e0d2f4a6b8c0e2d4f6a8b0c2',
    prRelated: null, oeMergeTag: '6.6.0-90.0.0',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/15200',
    commitUpstream: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
    upstreamMergeTag: 'v6.17-rc2', mainKey: '318456:12001',
    merged: true, customerImpact: '提升中断注册可靠性', hwRepoStatus: 'merged',
    customerMergeStatus: '已合入', mergeVersion: 'main-5.10', osReleaseVersion: '24.03-LTS',
  },
  {
    id: 'pa5', projectId: 'p1',
    title: 'ZIP压缩性能基准优化',
    description: 'ZIP驱动压缩性能基准测试路径优化',
    communityIssue: null, patchType: 'Bug_3', productVersion: '950',
    userKernel: null, patchModule: 'ZIP',
    commitOE: 'crypto: hisilicon/zip - fix perf benchmark path',
    commitIdOE: '4d6f8a0b2c4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6',
    prRelated: null, oeMergeTag: '6.6.0-120.0.0',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/19100',
    commitUpstream: '', upstreamMergeTag: '', mainKey: '325001:14500',
    merged: false, customerImpact: '性能提升约3%', hwRepoStatus: 'unmerged',
    customerMergeStatus: '未合入', mergeVersion: '', osReleaseVersion: '',
  },
  {
    id: 'pa6', projectId: 'p3',
    title: 'UACCE设备注册加固',
    description: 'UACCE设备注册流程安全性加固，防止空指针访问',
    communityIssue: 'CVE-2026-1234', patchType: 'Bug_12', productVersion: '950Pro',
    userKernel: '内核', patchModule: 'UACCE',
    commitOE: 'uacce: fix device registration security issue',
    commitIdOE: '7e9a1c3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e',
    prRelated: null, oeMergeTag: '6.6.0-95.0.0',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/17000',
    commitUpstream: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
    upstreamMergeTag: 'v6.16-rc3', mainKey: '320001:13000',
    merged: true, customerImpact: '修复安全漏洞', hwRepoStatus: 'merged',
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
const hwRepoOptions   = [{ value: 'merged', label: '已合入' }, { value: 'unmerged', label: '未合入' }]

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
const columns = computed(() => {
  const base = [
    { label: '', key: 'select', style: { width: '72px', minWidth: '72px' } },
    { label: '概述(SR粒度)', key: 'title', style: { width: '160px', minWidth: '160px' } },
    { label: '功能介绍(AR粒度)', key: 'description', style: { width: '180px', minWidth: '180px' } },
    { label: '关联社区Issue', key: 'communityIssue', style: { width: '130px', minWidth: '130px' } },
    { label: '补丁类型', key: 'patchType', style: { width: '100px', minWidth: '100px' } },
    { label: '产品版本', key: 'productVersion', style: { width: '100px', minWidth: '100px' } },
    { label: '用户态/内核态', key: 'userKernel', style: { width: '120px', minWidth: '120px' } },
    { label: '补丁模块', key: 'patchModule', style: { width: '100px', minWidth: '100px' } },
    { label: 'Commit OE', key: 'commitOE', style: { width: '200px', minWidth: '200px' } },
    { label: 'Commit ID OE', key: 'commitIdOE', style: { width: '140px', minWidth: '140px' } },
    { label: 'PR前、后置补丁', key: 'prRelated', style: { width: '140px', minWidth: '140px' } },
    { label: 'OE Merge tag', key: 'oeMergeTag', style: { width: '120px', minWidth: '120px' } },
    { label: 'OE PR', key: 'oePR', style: { width: '200px', minWidth: '200px' } },
    { label: 'Commit upstream', key: 'commitUpstream', style: { width: '150px', minWidth: '150px' } },
    { label: 'upstream Merge tag', key: 'upstreamMergeTag', style: { width: '140px', minWidth: '140px' } },
    { label: '唯一标识符', key: 'mainKey', style: { width: '130px', minWidth: '130px' } },
    { label: '是否需要合入', key: 'merged', style: { width: '120px', minWidth: '120px' } },
    { label: '客户影响', key: 'customerImpact', style: { width: '120px', minWidth: '120px' } },
    { label: '华为合入状态', key: 'hwRepoStatus', style: { width: '120px', minWidth: '120px' } },
    { label: '客户合入状态', key: 'customerMergeStatus', style: { width: '120px', minWidth: '120px' } },
    { label: '合入版本', key: 'mergeVersion', style: { width: '100px', minWidth: '100px' } },
    { label: 'OS发布版本', key: 'osReleaseVersion', style: { width: '120px', minWidth: '120px' } },
    ...(isAdmin.value ? [{ label: '操作', key: 'action', style: { width: '150px', minWidth: '150px' } }] : []),
  ]
  return base
})

const hwRepoLabel = (s: string) => ({ merged: '已合入', unmerged: '未合入' }[s] ?? s)
const hwRepoColor = (s: string) => ({ merged: 'success', unmerged: 'danger' }[s] ?? 'info')
const custMergeLabel = (s: string) => ({ '已合入': '已合入', '未合入': '未合入' }[s] ?? s)
const custMergeColor = (s: string) => ({ '已合入': 'success', '未合入': 'danger' }[s] ?? 'info')

const batchDeleteDialog = reactive({ visible: false })
const deleteDialog = reactive({ visible: false, targetId: '', targetTitle: '' })

const handleBatchDelete = () => {
  if (!selectedIds.value.length) { OMessage.warning('请先选择补丁'); return }
  batchDeleteDialog.visible = true
}

const batchDeleteSecondConfirm = reactive({ visible: false })

const confirmBatchDelete = () => {
  batchDeleteDialog.visible = false
  nextTick(() => { batchDeleteSecondConfirm.visible = true })
}

const confirmBatchDeleteFinal = () => {
  OMessage.success(`已删除 ${selectedIds.value.length} 条补丁`)
  selectedIds.value = []
  batchDeleteSecondConfirm.visible = false
}

const allDeleteDialog = reactive({ visible: false })

const handleAllDelete = () => {
  allDeleteDialog.visible = true
}

const confirmAllDelete = () => {
  OMessage.success(`已删除全部 ${filtered.value.length} 条补丁`)
  selectedIds.value = []
  allDeleteDialog.visible = false
}

const handleDelete = (row: any) => {
  deleteDialog.targetId = row.id
  deleteDialog.targetTitle = row.title
  deleteDialog.visible = true
}

const confirmDelete = () => {
  OMessage.success(`补丁「${deleteDialog.targetTitle}」已删除`)
  deleteDialog.visible = false
}

const editDialog = reactive({
  visible: false,
  targetId: '',
  targetTitle: '',
  form: {
    mainKey: '', title: '', description: '', communityIssue: '',
    patchType: '', productVersion: '', userKernel: '', patchModule: '',
    commitOE: '', commitIdOE: '', prRelated: '', oeMergeTag: '', oePR: '',
    commitUpstream: '', upstreamMergeTag: '',
    merged: '', customerImpact: '', hwRepoStatus: '',
    customerMergeStatus: '', mergeVersion: '', osReleaseVersion: '',
  } as Record<string, string>,
})

const handleEdit = (row: any) => {
  editDialog.targetId = row.id
  editDialog.targetTitle = row.title
  Object.assign(editDialog.form, {
    mainKey: row.mainKey ?? '',
    title: row.title ?? '',
    description: row.description ?? '',
    communityIssue: row.communityIssue ?? '',
    patchType: row.patchType ?? '',
    productVersion: row.productVersion ?? '',
    userKernel: row.userKernel ?? '',
    patchModule: row.patchModule ?? '',
    commitOE: row.commitOE ?? '',
    commitIdOE: row.commitIdOE ?? '',
    prRelated: row.prRelated ?? '',
    oeMergeTag: row.oeMergeTag ?? '',
    oePR: row.oePR ?? '',
    commitUpstream: row.commitUpstream ?? '',
    upstreamMergeTag: row.upstreamMergeTag ?? '',
    merged: String(row.merged) ?? '',
    customerImpact: row.customerImpact ?? '',
    hwRepoStatus: row.hwRepoStatus ?? '',
    customerMergeStatus: row.customerMergeStatus ?? '',
    mergeVersion: row.mergeVersion ?? '',
    osReleaseVersion: row.osReleaseVersion ?? '',
  })
  editDialog.visible = true
}

const handleEditConfirm = () => {
  if (!editDialog.form.title.trim()) { OMessage.warning('概述(SR粒度)不能为空'); return }
  OMessage.success(`补丁「${editDialog.targetTitle}」已更新`)
  editDialog.visible = false
}

// ─── 导入弹窗（Excel批量上传）──────────────────────────────────────────────────
const importDialog = reactive({ visible: false })

// ─── 导出（下拉：全部 / 所选）─────────────────────────────────────────────────
const handleExport = (type: 'all' | 'selected') => {
  if (type === 'selected' && selectedIds.value.length === 0) {
    OMessage.warning('请先勾选要导出的补丁')
    return
  }
  const count = type === 'all' ? filtered.value.length : selectedIds.value.length
  OMessage.success(`已导出 ${count} 条补丁数据`)
}
</script>

<template>
  <section class="patch-board">
    <!-- ── 页面标题 ── -->
    <div class="patch-board__header">
      <h2 class="patch-board__title">{{ t('nav.patches') }}</h2>
    </div>

    <!-- ── 筛选器 + 操作按钮（同一行）
         spec: OSelect variant="outline" size="medium"
         初始值 null → placeholder 显示分类名；选中后显示选中值
    ── -->
    <div class="patch-board__filter-row">
      <div class="patch-board__filter">
<OSelect
        v-model="filters.module"
        placeholder="补丁模块"
        variant="outline"
        searchable
        
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
        searchable
        
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
        searchable
        
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
        searchable
        
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
        searchable
        
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

      <!-- 操作按钮（右侧） -->
      <div class="patch-board__actions">
        <OButton v-if="isAdmin" variant="outline" color="primary" size="medium" round="pill">
          {{ t('patch.create') }}
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
              <div class="more-menu__item" @click="importDialog.visible = true">{{ t('action.import') }}</div>
              <div class="more-menu__item" @click="handleExport('all')">{{ t('action.exportAll') }}</div>
              <div class="more-menu__item" @click="handleExport('selected')">{{ t('action.exportSelected') }}</div>
              <div class="more-menu__item more-menu__item--danger" @click="handleBatchDelete()">{{ t('patch.batchDelete') }}</div>
              <div class="more-menu__item more-menu__item--danger" @click="handleAllDelete()">全部删除</div>
            </div>
          </template>
        </ODropdown>
      </div>
    </div>

    <!-- ── 表格区域── -->
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
          {{ row.title }}
        </template>
        <template #td_description="{ row }">
          <span class="patch-board__cell-text">{{ row.description }}</span>
        </template>
        <template #td_communityIssue="{ row }">
          <OLink v-if="row.communityIssue" color="primary" href="javascript:void(0)">
            {{ row.communityIssue }}
          </OLink>
          <span v-else class="patch-board__muted">—</span>
        </template>
        <template #td_patchType="{ row }">
          <OTag color="normal" size="medium">{{ row.patchType }}</OTag>
        </template>
        <template #td_userKernel="{ row }">
          <span class="patch-board__muted">{{ row.userKernel ?? '—' }}</span>
        </template>
        <template #td_commitOE="{ row }">
          <span class="patch-board__cell-text">{{ row.commitOE }}</span>
        </template>
        <template #td_commitIdOE="{ row }">
          <span class="patch-board__cell-id">{{ row.commitIdOE ? row.commitIdOE.slice(0, 12) : '—' }}</span>
        </template>
        <template #td_prRelated="{ row }">
          <span class="patch-board__muted">{{ row.prRelated ?? '—' }}</span>
        </template>
        <template #td_oePR="{ row }">
          <OLink v-if="row.oePR" color="primary" :href="row.oePR" target="_blank" class="patch-board__link">
            {{ row.oePR }}
            <template #suffix>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2H14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 2L9 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13 9V13C13 13.5304 12.7893 14.0391 12.4142 14.4142C12.0391 14.7893 11.5304 15 11 15H3C2.46957 15 1.96086 14.7893 1.58579 14.4142C1.21071 14.0391 1 13.5304 1 13V5C1 4.46957 1.21071 3.96086 1.58579 3.58579C1.96086 3.21071 2.46957 3 3 3H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </template>
          </OLink>
          <span v-else class="patch-board__muted">—</span>
        </template>
        <template #td_commitUpstream="{ row }">
          <span class="patch-board__cell-id">{{ row.commitUpstream ? row.commitUpstream.slice(0, 12) : '—' }}</span>
        </template>
        <template #td_merged="{ row }">
          <OTag :color="row.merged ? 'success' : 'danger'" size="medium">
            {{ row.merged ? '是' : '否' }}
          </OTag>
        </template>
        <template #td_hwRepoStatus="{ row }">
          <OTag :color="hwRepoColor(row.hwRepoStatus)" size="medium">
            {{ hwRepoLabel(row.hwRepoStatus) }}
          </OTag>
        </template>
        <template #td_customerMergeStatus="{ row }">
          <OTag :color="custMergeColor(row.customerMergeStatus)" size="medium">
            {{ custMergeLabel(row.customerMergeStatus) }}
          </OTag>
        </template>
        <template #td_mergeVersion="{ row }">
          <span class="patch-board__muted">{{ row.mergeVersion || '—' }}</span>
        </template>
        <template #td_osReleaseVersion="{ row }">
          <span class="patch-board__muted">{{ row.osReleaseVersion || '—' }}</span>
        </template>
        <template v-if="isAdmin" #td_action="{ row }">
           <div class="patch-board__action-cell">
             <OLink color="primary" href="javascript:void(0)" @click="handleEdit(row)">{{ t('action.edit') }}</OLink>
             <OLink color="danger" href="javascript:void(0)" @click="handleDelete(row)">{{ t('action.delete') }}</OLink>
           </div>
         </template>
      </OTable>
    </div>

    <!-- ── 分页 ── -->
    <div class="patch-board__bottom">
      <OPagination
        :total="filtered.length"
        :page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        @change="onPageChange"
      />
    </div>
  </section>

  <!-- ══ 编辑补丁弹窗 ════════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="editDialog.visible" title="编辑补丁" size="large">
    <div class="patch-form">
      <div class="patch-form__section-title"><span class="patch-form__bar" />基本信息</div>
      <div class="patch-form__grid">
        <div class="patch-form__field">
          <label class="patch-form__label">唯一标识符</label>
          <OInput v-model="editDialog.form.mainKey" placeholder="例：321138:13916" clearable />
        </div>
        <div class="patch-form__field patch-form__field--full">
          <label class="patch-form__label"><span class="patch-form__required">*</span>概述（SR粒度）</label>
          <OInput v-model="editDialog.form.title" placeholder="请输入补丁概述" clearable />
        </div>
        <div class="patch-form__field patch-form__field--full">
          <label class="patch-form__label">功能介绍（AR粒度）</label>
          <OTextarea v-model="editDialog.form.description" placeholder="请详细描述功能" :rows="3" />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">补丁类型</label>
          <OSelect v-model="editDialog.form.patchType" placeholder="请选择">
            <OOption value="Bug" label="Bug" />
            <OOption value="Feature" label="Feature" />
            <OOption value="cleanup" label="Cleanup" />
          </OSelect>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">产品版本</label>
          <OSelect v-model="editDialog.form.productVersion" placeholder="请选择">
            <OOption value="950" label="950" />
            <OOption value="950Pro" label="950Pro" />
          </OSelect>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">用户态/内核态</label>
          <OSelect v-model="editDialog.form.userKernel" placeholder="请选择">
            <OOption value="用户态" label="用户态" />
            <OOption value="内核" label="内核" />
          </OSelect>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">补丁模块</label>
          <OSelect v-model="editDialog.form.patchModule" placeholder="请选择">
            <OOption value="ACC" label="ACC" />
            <OOption value="ZIP" label="ZIP" />
            <OOption value="PCIe" label="PCIe" />
            <OOption value="UACCE" label="UACCE" />
          </OSelect>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">关联社区Issue</label>
          <OInput v-model="editDialog.form.communityIssue" placeholder="例：I9X2K1" clearable />
        </div>
      </div>

      <ODivider />

      <div class="patch-form__section-title"><span class="patch-form__bar" />Commit / PR 信息</div>
      <div class="patch-form__grid">
        <div class="patch-form__field patch-form__field--full">
          <label class="patch-form__label">Commit OE</label>
          <OInput v-model="editDialog.form.commitOE" placeholder="例：crypto: hisilicon - enable error reporting again" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">Commit ID OE</label>
          <OInput v-model="editDialog.form.commitIdOE" placeholder="例：5f3a1b2c7d8e9f0a" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">OE Merge tag</label>
          <OInput v-model="editDialog.form.oeMergeTag" placeholder="例：6.6.0-94.0.0" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">OE PR</label>
          <OInput v-model="editDialog.form.oePR" placeholder="例：gitc URL" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">PR前、后置补丁</label>
          <OInput v-model="editDialog.form.prRelated" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">Commit upstream</label>
          <OInput v-model="editDialog.form.commitUpstream" placeholder="upstream commit hash" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">upstream Merge tag</label>
          <OInput v-model="editDialog.form.upstreamMergeTag" placeholder="例：v6.18-rc1" clearable />
        </div>
      </div>

      <ODivider />

      <div class="patch-form__section-title"><span class="patch-form__bar" />合入状态</div>
      <div class="patch-form__grid">
        <div class="patch-form__field">
          <label class="patch-form__label">是否需要合入</label>
          <OSelect v-model="editDialog.form.merged" placeholder="请选择">
            <OOption value="true" label="是" />
            <OOption value="false" label="否" />
          </OSelect>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">华为合入状态</label>
          <OSelect v-model="editDialog.form.hwRepoStatus" placeholder="请选择">
            <OOption value="merged" label="已合入" />
            <OOption value="unmerged" label="未合入" />
          </OSelect>
        </div>
        <div class="patch-form__field patch-form__field--full">
          <label class="patch-form__label">客户影响</label>
          <OTextarea v-model="editDialog.form.customerImpact" placeholder="描述此补丁对客户的影响" :rows="2" />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">客户侧合入状态</label>
          <OInput v-model="editDialog.form.customerMergeStatus" placeholder="例：已合入" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">合入版本</label>
          <OInput v-model="editDialog.form.mergeVersion" placeholder="例：main-5.10" clearable />
        </div>
        <div class="patch-form__field patch-form__field--full">
          <label class="patch-form__label">OS发布版本</label>
          <OInput v-model="editDialog.form.osReleaseVersion" placeholder="例：24.03-LTS" clearable />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="patch-dialog-footer">
        <OButton variant="outline" color="primary" size="medium" round="pill" @click="editDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="primary" size="medium" round="pill" @click="handleEditConfirm">确认保存</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 单条删除确认弹窗 ════════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="deleteDialog.visible" title="确认删除" size="small">
    <div class="patch-delete-body">
      <p class="patch-delete-body__text">
        确认删除补丁「<strong>{{ deleteDialog.targetTitle }}</strong>」？此操作不可恢复。
      </p>
    </div>
    <template #footer>
      <div class="patch-dialog-footer">
        <OButton variant="outline" color="primary" size="medium" round="pill" @click="deleteDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="danger" size="medium" round="pill" @click="confirmDelete">确认删除</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 批量删除确认弹窗 ════════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="batchDeleteDialog.visible" title="确认批量删除" size="small">
    <div class="patch-delete-body">
      <p class="patch-delete-body__text">
        确认删除选中的 <strong>{{ selectedIds.length }} 条</strong>补丁？此操作不可恢复。
      </p>
    </div>
    <template #footer>
      <div class="patch-dialog-footer">
        <OButton variant="outline" color="primary" size="medium" round="pill" @click="batchDeleteDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="danger" size="medium" round="pill" @click="confirmBatchDelete">确认删除</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 批量删除二次确认弹窗 ════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="batchDeleteSecondConfirm.visible" title="再次确认" size="small">
    <div class="patch-delete-body">
      <p class="patch-delete-body__text">
        此操作不可恢复！确认永久删除选中的 <strong>{{ selectedIds.length }} 条</strong>补丁？
      </p>
    </div>
    <template #footer>
      <div class="patch-dialog-footer">
        <OButton variant="outline" color="primary" size="medium" round="pill" @click="batchDeleteSecondConfirm.visible = false">取消</OButton>
        <OButton variant="solid" color="danger" size="medium" round="pill" @click="confirmBatchDeleteFinal">确认永久删除</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 全部删除确认弹窗 ════════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="allDeleteDialog.visible" title="确认全部删除" size="small">
    <div class="patch-delete-body">
      <p class="patch-delete-body__text">
        确认删除全部 <strong>{{ filtered.length }} 条</strong>补丁？此操作不可恢复。
      </p>
    </div>
    <template #footer>
      <div class="patch-dialog-footer">
        <OButton variant="outline" color="primary" size="medium" round="pill" @click="allDeleteDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="danger" size="medium" round="pill" @click="confirmAllDelete">确认删除</OButton>
      </div>
    </template>
  </ODialog>
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
    font-weight: var(--o-font_weight-bold);
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
    font-weight: var(--o-font_weight-bold);
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

  // ── 筛选器行（筛选器 + 操作按钮同一行）
  &__filter-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--o-r-gap-4);
    margin-bottom: var(--o-r-gap-4);
    flex-wrap: wrap;
  }

  // ── 筛选器
  // spec: OSelect size=medium(32px), variant=outline, round=pill
  // 对应参考图：胶囊形描边按钮，显示分类名 + 下箭头
  &__filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--o-r-gap-3);
    flex: 1;
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

  // ── 操作按钮（右侧）
  &__actions {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-3);
    flex-shrink: 0;
  }

  // ── 表格横向滚动
  // 结构：table-wrap(overflow-x:auto) > table-inner(min-width) > OTable(width:100%)
  // 横向滚动原理：
  // - table-inner 设固定宽度，table { width:100% } 填满该宽度而非压缩到视口宽
  // - table-wrap overflow: scroll 强制显示滚动条（不依赖溢出探测）
  // table-wrap：不需要设 overflow，由非 scoped CSS 让 OTable 内部滚动
  &__table-wrap {
    margin-bottom: var(--o-r-gap-5);
  }

  &__cell-text {
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    max-width: 180px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__cell-id {
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip2);
    font-family: var(--o-font_family-code);
    white-space: nowrap;
  }

  &__muted {
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip1);
  }

  &__link {
    color: var(--o-color-primary1);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    word-break: break-all;
    display: block;
  }

  &__bottom {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: var(--o-r-gap-5);
    padding-top: var(--o-r-gap-4);
    border-top: 1px solid var(--o-color-control4);
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
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.patch-board__table-wrap table {
  min-width: 3042px;
}
.patch-board__table-wrap th {
  white-space: nowrap;
}
.patch-board__table-wrap td {
  white-space: normal;
  word-break: break-word;
  padding: 8px 12px;
  line-height: var(--o-r-line_height-tip1);
  vertical-align: top;
  overflow: hidden;
  text-overflow: ellipsis;
}
.patch-board__table-wrap td:last-child {
  overflow: visible;
  text-overflow: unset;
  vertical-align: middle;
}
.patch-board__table-wrap th:last-child {
  overflow: visible;
  vertical-align: middle;
}
.patch-board__table-wrap th:first-child,
.patch-board__table-wrap td:first-child {
  overflow: visible;
  text-align: center;
  padding-left: 16px;
}
.patch-board__action-cell { display: flex; align-items: center; gap: var(--o-r-gap-3); white-space: nowrap; padding: 0 var(--o-r-gap-4); }
.patch-delete-body__text { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); }
.patch-dialog-footer { display: flex; justify-content: flex-end; gap: var(--o-r-gap-3); }
.patch-delete-body { padding: var(--o-r-gap-3) 0; }
.patch-delete-body__text strong { color: var(--o-color-danger1); }

.patch-form { display: flex; flex-direction: column; gap: var(--o-r-gap-5); max-height: 60vh; overflow-y: auto; padding-right: var(--o-r-gap-2); }
.patch-form__section-title { display: flex; align-items: center; gap: var(--o-r-gap-2); color: var(--o-color-info1); font-size: var(--o-r-font_size-text1); font-weight: var(--o-font_weight-bold); }
.patch-form__bar { display: inline-block; width: 4px; height: 16px; background-color: var(--o-color-primary1); border-radius: 2px; flex-shrink: 0; }
.patch-form__grid { display: flex; flex-wrap: wrap; gap: var(--o-r-gap-4) var(--o-r-grid-column-gutter); }
.patch-form__field { width: calc(50% - var(--o-r-grid-column-gutter) / 2); display: flex; flex-direction: column; gap: var(--o-r-gap-2); }
.patch-form__field--full { width: 100%; }
.patch-form__label { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); font-weight: var(--o-font_weight-regular); }
.patch-form__required { color: var(--o-color-danger1); margin-right: var(--o-r-gap-1); }

</style>