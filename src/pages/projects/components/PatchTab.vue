<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  OButton, OTag, OTable, OPagination, OSelect, OOption,
  OCheckbox, OLink, OMessage, ODialog, OInput, OTextarea,
  OSwitch, OUpload, ODropdown, ODivider,
} from '@opensig/opendesign'
import { useAuth } from '../../../composables/useAuth'
import { MOCK_PATCHES } from '../../../mock/data'
import { t } from '../../../i18n/zh'

const props = defineProps<{ projectId: string }>()
const { isAdmin } = useAuth()

const patches = computed(() => MOCK_PATCHES.filter((p) => p.projectId === props.projectId))

// ─── Filters ──────────────────────────────────────────────────────────────────
const filters = reactive<{
  module: string | null
  patchType: string | null
  version: string | null
  mergeStatus: string | null
  hwRepoStatus: string | null
}>({ module: null, patchType: null, version: null, mergeStatus: null, hwRepoStatus: null })

const applied = reactive({ ...filters })

const moduleOptions    = [{ value: 'ACC', label: 'ACC' }, { value: 'ZIP', label: 'ZIP' }, { value: 'PCIe', label: 'PCIe' }]
const patchTypeOptions = [{ value: 'Bug', label: 'Bug' }, { value: 'Feature', label: 'Feature' }]
const versionOptions   = [{ value: '950', label: '950' }, { value: '950Pro', label: '950Pro' }]
const mergeOptions     = [{ value: 'true', label: '已合入' }, { value: 'false', label: '未合入' }]
const hwRepoOptions    = [{ value: 'all', label: '全合入' }, { value: 'partial', label: '部分合入' }, { value: 'none', label: '未合入' }]

const filtered = computed(() =>
  patches.value.filter((p) => {
    const matchModule    = !applied.module       || p.patchModule === applied.module
    const matchType      = !applied.patchType    || p.patchType.startsWith(applied.patchType)
    const matchVersion   = !applied.version      || p.productVersion === applied.version
    const matchMerge     = !applied.mergeStatus  || String(p.merged) === applied.mergeStatus
    const matchHwRepo    = !applied.hwRepoStatus || p.hwRepoStatus === applied.hwRepoStatus
    return matchModule && matchType && matchVersion && matchMerge && matchHwRepo
  })
)

const page = ref(1)
const pageSize = ref(10)
const pagedRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

const onPageChange = (val: { page: number; pageSize: number }) => {
  page.value = val.pageSize !== pageSize.value ? 1 : val.page
  pageSize.value = val.pageSize
}

// 22 列（含勾选列）— 宽度基于实际内容平均长度测算（见 pixel 注释）
const columns = [
  { label: '',                     key: 'select',              style: { width: '72px',  minWidth: '72px'  } }, // checkbox（含 edge-padding 32px + 复选框 + 右padding 16px = 68px min）
  { label: '概述(SR粒度)',        key: 'title',               style: { width: '160px', minWidth: '160px' } }, // avg ~11汉字 ≈ 154+32=186px
  { label: '功能介绍(AR粒度)',    key: 'description',         style: { width: '180px', minWidth: '180px' } }, // link+2行截断
  { label: '关联社区Issue',       key: 'communityIssue',      style: { width: '110px', minWidth: '110px' } }, // "CVE-2026-1234" ≈ 104+32
  { label: '补丁类型',            key: 'patchType',           style: { width: '100px', minWidth: '100px' } }, // tag "Feature_1" ≈ 104px
  { label: '产品版本',            key: 'productVersion',      style: { width: '80px',  minWidth: '80px'  } }, // "950Pro" ≈ 48+32
  { label: '用户态/内核态',       key: 'userKernel',          style: { width: '80px',  minWidth: '80px'  } }, // 表头 ≈ 84px
  { label: '补丁模块',            key: 'patchModule',         style: { width: '80px',  minWidth: '80px'  } }, // "UACCE" ≈ 40+32
  { label: 'Commit OE',          key: 'commitOE',            style: { width: '200px', minWidth: '200px' } }, // 长句折行，约50char
  { label: 'PR前、后置补丁',      key: 'prRelated',           style: { width: '100px', minWidth: '100px' } }, // 表头宽 ≈ 100px
  { label: 'OE Merge tag',       key: 'oeMergeTag',          style: { width: '120px', minWidth: '120px' } }, // "6.6.0-119.0.0" ≈ 104+32
  { label: 'OE PR',              key: 'oePR',               style: { width: '200px', minWidth: '200px' } }, // 完整 PR URL
  { label: 'Commit upstream',    key: 'commitUpstream',      style: { width: '140px', minWidth: '140px' } }, // 16位hash ≈ 128+32
  { label: 'upstream Merge tag', key: 'upstreamMergeTag',    style: { width: '130px', minWidth: '130px' } }, // 表头 ≈ 136px
  { label: '主键',                key: 'mainKey',             style: { width: '110px', minWidth: '110px' } }, // "321138:13916" ≈ 96+32
  { label: '是否合入',            key: 'merged',              style: { width: '80px',  minWidth: '80px'  } }, // tag ≈ 58+32
  { label: '客户影响',            key: 'customerImpact',      style: { width: '120px', minWidth: '120px' } }, // avg ~9汉字 ≈ 126+32
  { label: '华为仓库合入状态',    key: 'hwRepoStatus',        style: { width: '100px', minWidth: '100px' } }, // tag "部分合入" ≈ 72+32
  { label: '客户侧合入状态',      key: 'customerMergeStatus', style: { width: '100px', minWidth: '100px' } }, // "已合入" ≈ 42+32，表头优先
  { label: '合入版本',            key: 'mergeVersion',        style: { width: '100px', minWidth: '100px' } }, // "main-5.10" ≈ 72+32
  { label: 'OS发布版本',          key: 'osReleaseVersion',    style: { width: '120px', minWidth: '120px' } }, // "22.03-LTS-SP3" ≈ 104+32
  { label: '操作',                key: 'action',              style: { width: '90px',  minWidth: '90px'  } }, // 编辑+删除 ≈ 80px
]

// ─── Stats ────────────────────────────────────────────────────────────────────
const stats = computed(() => [
  { id: 'total',    label: t('patch.total'),    value: patches.value.length, mod: 'primary' },
  { id: 'merged',  label: t('patch.merged'),   value: patches.value.filter(p => p.merged).length, mod: 'success' },
  { id: 'pending', label: t('patch.pending'),  value: patches.value.filter(p => !p.merged).length, mod: 'warning' },
  { id: 'selected', label: t('patch.selected'), value: 0, mod: 'danger' },
])

const hwRepoLabel = (s: string) => ({ all: '全合入', partial: '部分合入', none: '未合入' }[s] ?? s)
const hwRepoColor = (s: string) => ({ all: 'success', partial: 'warning', none: 'danger' }[s] ?? 'info')

const handleQuery = () => { Object.assign(applied, filters); page.value = 1 }
const handleClear = () => {
  Object.assign(filters, { module: null, patchType: null, version: null, mergeStatus: null, hwRepoStatus: null })
  handleQuery()
}

// ─── emit：通知父组件跳转到用例看板 ────────────────────────────────────────────
const emit = defineEmits<{ viewCases: [patchIds: string[]] }>()

// ─── 行级勾选 ─────────────────────────────────────────────────────────────────
// 官方推荐用法：v-model="selectedIds" + :value="row.id"
// OCheckbox 会自动处理数组的 push/filter，无需手动操作
const selectedIds = ref<string[]>([])

// 全选（带 setter，供 v-model 使用）
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

// ─── 合入补丁 ──────────────────────────────────────────────────────────────────
// 奇数次点击 = 成功；偶数次点击 = 失败（仅用于演示效果）
const mergeClickCount = ref(0)
const mergeResult = reactive({
  visible: false,
  success: false,
  logs: [] as string[],
})

const handleMerge = () => {
  if (!selectedIds.value.length) { OMessage.warning('请先勾选要合入的补丁'); return }
  mergeClickCount.value++
  const isSuccess = mergeClickCount.value % 2 === 1
  mergeResult.success = isSuccess
  mergeResult.visible = true

  const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const selectedList = patches.value.filter(p => selectedIds.value.includes(p.id))

  if (isSuccess) {
    mergeResult.logs = [
      `[${now}] 开始合入 ${selectedList.length} 个补丁...`,
      ...selectedList.map(p => `[INFO]  检查补丁: ${p.title}`),
      '[INFO]  代码检查通过，开始提交...',
      '',
      ...selectedList.map(p =>
        `[OK]    合入成功: ${p.title}`
      ),
      '',
      '─── 合入完成，PR 链接如下 ───',
      ...selectedList.map(p =>
        `  ${p.oePR || `https://gitcode.com/openeuler/kernel/pull/${Math.floor(Math.random() * 20000)}`}`
      ),
    ]
  } else {
    mergeResult.logs = [
      `[${now}] 开始合入 ${selectedList.length} 个补丁...`,
      '[INFO]  正在检查代码冲突...',
      '',
      '[ERROR] 合入失败：远程仓库拒绝了本次提交',
      '[ERROR] error: failed to push some refs to remote',
      '[HINT]  Updates were rejected because the remote contains work that you do not have locally.',
      '[HINT]  Integrate the remote changes (e.g. git pull ...) before pushing again.',
      '',
      '请解决代码冲突后重新提交，或联系管理员处理。',
    ]
  }
}

// ─── 查看对应用例 ──────────────────────────────────────────────────────────────
const handleViewCases = () => {
  if (!selectedIds.value.length) { OMessage.warning('请先勾选要查看用例的补丁'); return }
  emit('viewCases', [...selectedIds.value])
}

// ─── 批量删除弹窗 ──────────────────────────────────────────────────────────────
const batchDeleteDialog = reactive({ visible: false })

const handleBatchDelete = () => {
  if (!selectedIds.value.length) { OMessage.warning('请先勾选要删除的补丁'); return }
  batchDeleteDialog.visible = true
}

const confirmBatchDelete = () => {
  OMessage.success(`已删除 ${selectedIds.value.length} 条补丁`)
  selectedIds.value = []
  batchDeleteDialog.visible = false
}

// ─── 新增补丁弹窗 ──────────────────────────────────────────────────────────────
// 包含除主键外的所有字段；主键由系统自动生成
interface AddPatchForm {
  title: string; description: string; communityIssue: string
  patchType: string; productVersion: string; userKernel: string; patchModule: string
  commitOE: string; prRelated: string; oeMergeTag: string; oePR: string
  commitUpstream: string; upstreamMergeTag: string
  merged: string; customerImpact: string; hwRepoStatus: string
  customerMergeStatus: string; mergeVersion: string; osReleaseVersion: string
}

const EMPTY_FORM: AddPatchForm = {
  title: '', description: '', communityIssue: '',
  patchType: '', productVersion: '', userKernel: '', patchModule: '',
  commitOE: '', prRelated: '', oeMergeTag: '', oePR: '',
  commitUpstream: '', upstreamMergeTag: '',
  merged: '', customerImpact: '', hwRepoStatus: '',
  customerMergeStatus: '', mergeVersion: '', osReleaseVersion: '',
}

const addDialog = reactive({
  visible: false,
  form: { ...EMPTY_FORM } as AddPatchForm,
})

const openAddDialog = () => {
  Object.assign(addDialog.form, { ...EMPTY_FORM })
  addDialog.visible = true
}

const handleAddConfirm = () => {
  if (!addDialog.form.title.trim()) { OMessage.warning('概述(SR粒度)不能为空'); return }
  if (!addDialog.form.patchType)    { OMessage.warning('请选择补丁类型'); return }
  if (!addDialog.form.productVersion) { OMessage.warning('请选择产品版本'); return }
  OMessage.success('补丁新增成功')
  addDialog.visible = false
}

// ─── 导入弹窗（Excel批量上传）──────────────────────────────────────────────────
const importDialog = reactive({ visible: false })
const importFiles = ref<any[]>([])

const handleImportUpload = async (file: any) => {
  // 模拟上传处理
  await new Promise(r => setTimeout(r, 800))
  return Promise.resolve()
}

const handleImportConfirm = () => {
  if (!importFiles.value.length) { OMessage.warning('请先上传 Excel 文件'); return }
  OMessage.success(`已成功导入 ${importFiles.value.length} 个文件`)
  importFiles.value = []
  importDialog.visible = false
}

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
  <div class="patch-tab">
    <!-- 筛选器 + 操作按钮（同一行） -->
    <div class="patch-tab__filter-row">
      <div class="patch-tab__filter">
        <OSelect v-model="filters.module" placeholder="补丁模块" variant="outline" size="medium"
          class="patch-tab__sel" @change="handleQuery">
          <OOption v-for="o in moduleOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="filters.patchType" placeholder="补丁类型" variant="outline" size="medium"
          class="patch-tab__sel" @change="handleQuery">
          <OOption v-for="o in patchTypeOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="filters.version" placeholder="产品版本" variant="outline" size="medium"
          class="patch-tab__sel" @change="handleQuery">
          <OOption v-for="o in versionOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="filters.mergeStatus" placeholder="合入状态" variant="outline" size="medium"
          class="patch-tab__sel" @change="handleQuery">
          <OOption v-for="o in mergeOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OSelect v-model="filters.hwRepoStatus" placeholder="华为仓库状态" variant="outline" size="medium"
          class="patch-tab__sel patch-tab__sel--wide" @change="handleQuery">
          <OOption v-for="o in hwRepoOptions" :key="o.value" :value="o.value" :label="o.label" />
        </OSelect>
        <OLink color="primary" class="patch-tab__clear" @click="handleClear">清除筛选</OLink>
      </div>

      <div class="patch-tab__actions">
        <OButton variant="solid" color="primary" size="medium" @click="openAddDialog">
          {{ t('patch.create') }}
        </OButton>
        <OButton variant="outline" size="medium" @click="handleMerge()">
          {{ t('patch.merge') }}
        </OButton>
        <OButton variant="outline" size="medium" @click="handleViewCases()">
          {{ t('patch.viewCases') }}
        </OButton>
        <ODropdown trigger="click">
          <OButton variant="outline" size="medium">
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
              <div class="more-menu__item" @click="handleExport('all')">{{ t('action.export') }}</div>
              <div class="more-menu__item more-menu__item--danger" @click="handleBatchDelete()">{{ t('patch.batchDelete') }}</div>
            </div>
          </template>
        </ODropdown>
      </div>
    </div>

    <!-- 表格 -->
    <div class="patch-tab__table-wrap">
      <OTable :columns="columns" :data="pagedRows">
        <!-- 勾选列：全选 header + 每行 checkbox
             官方用法：全选用 v-model(boolean)；行选用 v-model(array) + :value
             OCheckbox 内部自动处理数组的 push/filter，最可靠 -->
        <template #th_select>
          <OCheckbox v-model="allChecked" />
        </template>
        <template #td_select="{ row }">
          <OCheckbox v-model="selectedIds" :value="row.id" />
        </template>
        <template #td_description="{ row }">
          <span class="patch-tab__cell-text">{{ row.description }}</span>
        </template>
        <template #td_communityIssue="{ row }">
          <OLink v-if="row.communityIssue" color="primary" href="javascript:void(0)">{{ row.communityIssue }}</OLink>
          <span v-else class="patch-tab__muted">—</span>
        </template>
        <template #td_patchType="{ row }">
          <OTag color="danger" size="medium">{{ row.patchType }}</OTag>
        </template>
        <template #td_userKernel="{ row }">
          <span class="patch-tab__muted">{{ row.userKernel ?? '—' }}</span>
        </template>
        <template #td_prRelated="{ row }">
          <span class="patch-tab__muted">{{ row.prRelated ?? '—' }}</span>
        </template>
        <template #td_oePR="{ row }">
          <OLink v-if="row.oePR" color="primary" :href="row.oePR" target="_blank" class="patch-tab__link">
            {{ row.oePR }}
          </OLink>
          <span v-else class="patch-tab__muted">—</span>
        </template>
        <template #td_commitUpstream="{ row }">
          <span class="patch-tab__cell-id">{{ row.commitUpstream ? row.commitUpstream.slice(0, 12) : '—' }}</span>
        </template>
        <template #td_merged="{ row }">
          <OTag :color="row.merged ? 'success' : 'warning'" size="medium">{{ row.merged ? '已合入' : '未合入' }}</OTag>
        </template>
        <template #td_hwRepoStatus="{ row }">
          <OTag :color="hwRepoColor(row.hwRepoStatus)" size="medium">{{ hwRepoLabel(row.hwRepoStatus) }}</OTag>
        </template>
        <template #td_mergeVersion="{ row }">
          <span class="patch-tab__muted">{{ row.mergeVersion || '—' }}</span>
        </template>
        <template #td_osReleaseVersion="{ row }">
          <span class="patch-tab__muted">{{ row.osReleaseVersion || '—' }}</span>
        </template>
        <template #td_action>
          <div style="display:flex;gap:8px;white-space:nowrap">
            <OLink color="primary" href="javascript:void(0)">{{ t('action.edit') }}</OLink>
            <OLink color="danger" href="javascript:void(0)">{{ t('action.delete') }}</OLink>
          </div>
        </template>
      </OTable>
    </div>

    <!-- 分页 -->
    <div class="patch-tab__bottom">
      <OPagination :total="filtered.length" :page="page" :page-size="pageSize" :page-sizes="[10,20,50]" @change="onPageChange" />
    </div>

    <!-- 合入结果弹窗 -->
    <ODialog v-model:visible="mergeResult.visible" :title="mergeResult.success ? '合入成功' : '合入失败'" class="result-dialog">
      <div class="merge-dialog-body">
        <template v-if="mergeResult.success">
          <p class="merge-dialog-body__desc">以下补丁已成功合入，PR 链接如下：</p>
          <div class="merge-dialog-body__links">
            <OLink
              v-for="(line, i) in mergeResult.logs.filter(l => l.startsWith('  http'))"
              :key="i"
              color="primary"
              :href="line.trim()"
              target="_blank"
              class="merge-dialog-body__link"
            >{{ line.trim() }}</OLink>
          </div>
        </template>
        <template v-else>
          <p class="merge-dialog-body__desc merge-dialog-body__desc--err">
            合入失败：远程仓库拒绝了本次提交，请解决代码冲突后重新提交，或联系管理员处理。
          </p>
        </template>
      </div>
    </ODialog>
  </div>

  <!-- ══ 批量删除确认弹窗 ════════════════════════════════════════════════════════
       ODialog size="small" + 二次确认文字 + 取消/删除按钮
  ══ -->
  <ODialog v-model:visible="batchDeleteDialog.visible" title="确认批量删除" size="small">
    <div class="batch-delete-body">
      <p class="batch-delete-body__text">
        确认删除选中的 <strong>{{ selectedIds.length }} 条</strong>补丁？此操作不可恢复。
      </p>
    </div>
    <template #footer>
      <div class="patch-dialog-footer">
        <OButton variant="outline" size="medium" @click="batchDeleteDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="danger" size="medium" @click="confirmBatchDelete">确认删除</OButton>
      </div>
    </template>
  </ODialog>
  ══ -->
  <ODialog v-model:visible="addDialog.visible" title="新增补丁" size="large">
    <div class="patch-form">

      <!-- 基本信息 -->
      <div class="patch-form__section-title">
        <span class="patch-form__bar" />基本信息
      </div>
      <div class="patch-form__grid">
        <div class="patch-form__field patch-form__field--full">
          <label class="patch-form__label"><span class="patch-form__required">*</span>概述（SR粒度）</label>
          <OInput v-model="addDialog.form.title" placeholder="请输入补丁概述" clearable />
        </div>
        <div class="patch-form__field patch-form__field--full">
          <label class="patch-form__label"><span class="patch-form__required">*</span>功能介绍（AR粒度）</label>
          <OTextarea v-model="addDialog.form.description" placeholder="请详细描述功能" :rows="3" />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>补丁类型</label>
          <OSelect v-model="addDialog.form.patchType" placeholder="请选择">
            <OOption value="Bug" label="Bug" />
            <OOption value="Feature" label="Feature" />
            <OOption value="cleanup" label="Cleanup" />
          </OSelect>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>产品版本</label>
          <OSelect v-model="addDialog.form.productVersion" placeholder="请选择">
            <OOption value="950" label="950" />
            <OOption value="950Pro" label="950Pro" />
          </OSelect>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>用户态/内核态</label>
          <OSelect v-model="addDialog.form.userKernel" placeholder="请选择（可选）">
            <OOption value="用户态" label="用户态" />
            <OOption value="内核" label="内核" />
          </OSelect>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>补丁模块</label>
          <OSelect v-model="addDialog.form.patchModule" placeholder="请选择">
            <OOption value="ACC" label="ACC" />
            <OOption value="ZIP" label="ZIP" />
            <OOption value="PCIe" label="PCIe" />
            <OOption value="UACCE" label="UACCE" />
          </OSelect>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>关联社区Issue</label>
          <OInput v-model="addDialog.form.communityIssue" placeholder="例：I9X2K1（可选）" clearable />
        </div>
      </div>

      <ODivider />

      <!-- Commit / PR 信息 -->
      <div class="patch-form__section-title">
        <span class="patch-form__bar" />Commit / PR 信息
      </div>
      <div class="patch-form__grid">
        <div class="patch-form__field patch-form__field--full">
          <label class="patch-form__label"><span class="patch-form__required">*</span>Commit OE</label>
          <OInput v-model="addDialog.form.commitOE" placeholder="例：crypto: hisilicon - enable error reporting again" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>OE Merge tag</label>
          <OInput v-model="addDialog.form.oeMergeTag" placeholder="例：6.6.0-94.0.0" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>OE PR</label>
          <OInput v-model="addDialog.form.oePR" placeholder="例：gitc URL" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>PR前、后置补丁</label>
          <OInput v-model="addDialog.form.prRelated" placeholder="可选" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>Commit upstream</label>
          <OInput v-model="addDialog.form.commitUpstream" placeholder="upstream commit hash（可选）" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>upstream Merge tag</label>
          <OInput v-model="addDialog.form.upstreamMergeTag" placeholder="例：v6.18-rc1（可选）" clearable />
        </div>
      </div>

      <ODivider />

      <!-- 合入状态 -->
      <div class="patch-form__section-title">
        <span class="patch-form__bar" />合入状态
      </div>
      <div class="patch-form__grid">
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>是否合入</label>
          <OSelect v-model="addDialog.form.merged" placeholder="请选择">
            <OOption :value="true" label="已合入" />
            <OOption :value="false" label="未合入" />
          </OSelect>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>华为仓库合入状态</label>
          <OSelect v-model="addDialog.form.hwRepoStatus" placeholder="请选择">
            <OOption value="all" label="全合入" />
            <OOption value="partial" label="部分合入" />
            <OOption value="none" label="未合入" />
          </OSelect>
        </div>
        <div class="patch-form__field patch-form__field--full">
          <label class="patch-form__label"><span class="patch-form__required">*</span>客户影响</label>
          <OTextarea v-model="addDialog.form.customerImpact" placeholder="描述此补丁对客户的影响（可选）" :rows="2" />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>客户侧合入状态<span class="patch-form__hint">（客户录入）</span></label>
          <OInput v-model="addDialog.form.customerMergeStatus" placeholder="例：已合入" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label"><span class="patch-form__required">*</span>合入版本<span class="patch-form__hint">（客户录入）</span></label>
          <OInput v-model="addDialog.form.mergeVersion" placeholder="例：main-5.10" clearable />
        </div>
        <div class="patch-form__field patch-form__field--full">
          <label class="patch-form__label"><span class="patch-form__required">*</span>OS发布版本<span class="patch-form__hint">（客户录入）</span></label>
          <OInput v-model="addDialog.form.osReleaseVersion" placeholder="例：24.03-LTS" clearable />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="patch-dialog-footer">
        <OButton variant="outline" size="medium" @click="addDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="primary" size="medium" @click="handleAddConfirm">确认新增</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 导入弹窗（Excel批量上传）════════════════════════════════════════════════
       OUpload 点击上传，支持 .xlsx / .xls / .csv
       上传后预览文件列表，确认导入
  ══ -->
  <ODialog v-model:visible="importDialog.visible" title="批量导入补丁" size="medium" class="import-dialog">
    <div class="import-body">
      <p class="import-body__text">
        请按照模板格式准备 Excel 文件，支持 <strong>.xlsx</strong>、<strong>.xls</strong>、<strong>.csv</strong> 格式。
        <OLink color="primary" href="javascript:void(0)" class="import-body__template-link">下载导入模板</OLink>
      </p>
      <OUpload
        v-model="importFiles"
        accept=".xlsx,.xls,.csv"
        :multiple="false"
        :upload-request="handleImportUpload"
        btn-label="选择 Excel 文件"
        class="import-body__upload"
      />
    </div>

    <template #footer>
      <div class="patch-dialog-footer">
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

.patch-tab {
  padding-top: var(--o-r-gap-5);
  &__stats { display: flex; gap: var(--o-r-grid-column-gutter); margin-bottom: var(--o-r-gap-6); }
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
  }
  &__table-wrap {
    margin-bottom: var(--o-r-gap-5);
  }

  // ── 表格单元格统一样式 ────────────────────────────────────────────────
  &__cell-text { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); line-height: var(--o-r-line_height-tip1); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; max-width: 180px; }
  &__cell-id { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip2); font-family: var(--o-font_family-code); white-space: nowrap; }
  &__muted { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip1); }
  &__link { color: var(--o-color-primary1); font-size: var(--o-r-font_size-tip1); word-break: break-all; display: block; line-height: var(--o-r-line_height-tip1); }
  &__bottom { display: flex; align-items: center; justify-content: flex-end; margin-top: var(--o-r-gap-5); padding-top: var(--o-r-gap-4); border-top: 1px solid var(--o-color-control4); }
}

// ── 新增补丁表单 ────────────────────────────────────────────────────────────────
.patch-form {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-5);
  max-height: 60vh;
  overflow-y: auto;
  padding-right: var(--o-r-gap-2);

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

  // 2列网格
  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--o-r-gap-4) var(--o-r-grid-column-gutter);
  }

  &__field {
    width: calc(50% - var(--o-r-grid-column-gutter) / 2);
    display: flex; flex-direction: column; gap: var(--o-r-gap-2);
    &--full { width: 100%; }
  }

  &__label {
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    font-weight: var(--o-font_weight-regular);
  }

  &__required { color: var(--o-color-danger1); margin-right: var(--o-r-gap-1); }

  &__hint {
    color: var(--o-color-info4);
    font-weight: var(--o-font_weight-regular);
    margin-left: 4px;
  }

  &__switch-row {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-3);
    padding-top: 4px;
  }

  &__switch-label {
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
  }
}

// ── 导入弹窗 ────────────────────────────────────────────────────────────────────
.import-body {
  display: flex; flex-direction: column; gap: var(--o-r-gap-3);
  &__text { margin: 0; color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); line-height: var(--o-r-line_height-tip1); strong { color: var(--o-color-primary1); } }
  &__template-link { margin-left: var(--o-r-gap-2); white-space: nowrap; font-size: var(--o-r-font_size-tip1); }
  &__upload { width: 100%; }
}

// ── 导入弹窗（高度自适应 + 紧凑布局）───────────────────────────────────────────
.import-dialog {
  :deep(.o-dialog__body) {
    max-height: none !important;
    padding: 16px 20px !important;
  }
}

// ── 弹窗底部操作区（取消 + 确认）──────────────────────────────────────────────────
.patch-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--o-r-gap-3);
}

// ── 结果弹窗（高度自适应）────────────────────────────────────────────────────
.result-dialog {
  :deep(.o-dialog__body) {
    max-height: none;
  }
}

// ── 合入结果弹窗内容 ──────────────────────────────────────────────────────────
.merge-dialog-body {
  &__desc {
    margin: 0;
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    margin-bottom: var(--o-r-gap-3);
    &--err { color: var(--o-color-danger1); }
  }
  &__links {
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-2);
  }
  &__link {
    font-size: var(--o-r-font_size-tip1);
    word-break: break-all;
  }
}

// ── 批量删除确认弹窗内容 ────────────────────────────────────────────────────────
.batch-delete-body {
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

<!-- 全局样式：修复表格横向滚动 -->
<style>
.patch-tab__table-wrap .o-table-wrap {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.patch-tab__table-wrap table {
  min-width: 2572px;
  table-layout: fixed;
  word-break: break-all;
}
/* th：允许换行，不截断，列头完整显示 */
.patch-tab__table-wrap th {
  white-space: normal;
  word-break: break-word;
}
/* td 数据单元格截断——跳过第一列（checkbox 列），防止复选框被 overflow:hidden 裁掉 */
.patch-tab__table-wrap td:not(:first-child) {
  overflow: hidden;
  text-overflow: ellipsis;
}
/* checkbox 列：确保 overflow 可见、可点击 */
.patch-tab__table-wrap th:first-child,
.patch-tab__table-wrap td:first-child {
  overflow: visible;
  text-align: center;
  padding-left: 16px;
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

/* 全局样式：强制覆盖导入弹窗高度和内边距 */
.import-dialog .o-dialog__body {
  max-height: none !important;
  padding: 16px 20px !important;
}
</style>