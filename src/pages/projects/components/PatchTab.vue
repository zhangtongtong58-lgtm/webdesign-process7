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
  merged: boolean; customerImpact: string; hwRepoStatus: string
  customerMergeStatus: string; mergeVersion: string; osReleaseVersion: string
}

const EMPTY_FORM: AddPatchForm = {
  title: '', description: '', communityIssue: '',
  patchType: '', productVersion: '', userKernel: '', patchModule: '',
  commitOE: '', prRelated: '', oeMergeTag: '', oePR: '',
  commitUpstream: '', upstreamMergeTag: '',
  merged: false, customerImpact: '', hwRepoStatus: '',
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
    <!-- 筛选器 -->
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

    <!-- 工具栏 -->
    <div class="patch-tab__toolbar">
      <!-- 新增补丁 -->
      <OButton variant="solid" color="primary" size="medium" @click="openAddDialog">
        {{ t('patch.create') }}
      </OButton>
      <!-- 导入 Excel -->
      <OButton variant="outline" size="medium" @click="importDialog.visible = true">
        {{ t('action.import') }}
      </OButton>
      <!-- 导出：下拉支持全部/所选 -->
      <ODropdown trigger="click">
        <OButton variant="outline" size="medium">
          {{ t('action.export') }}
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
          <span class="patch-tab__desc-link">{{ row.description }}</span>
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
          <OLink v-if="row.oePR" color="primary" :href="row.oePR" target="_blank" class="patch-tab__pr-url">
            {{ row.oePR }}
          </OLink>
          <span v-else class="patch-tab__muted">—</span>
        </template>
        <template #td_commitUpstream="{ row }">
          <span class="patch-tab__cell-hash">{{ row.commitUpstream ? row.commitUpstream.slice(0, 12) : '—' }}</span>
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

    <!-- 底部操作区 -->
    <div class="patch-tab__bottom">
      <div class="patch-tab__bottom-actions">
        <!-- 合入补丁：奇次成功/偶次失败，结果面板在下方显示 -->
        <OButton variant="solid" color="primary" size="medium" @click="handleMerge">
          {{ t('patch.merge') }}
        </OButton>
        <!-- 查看对应用例：跳转到用例看板并过滤 -->
        <OButton variant="outline" size="medium" @click="handleViewCases">
          {{ t('patch.viewCases') }}
        </OButton>
        <!-- 批量删除：弹窗二次确认 -->
        <OButton variant="outline" color="danger" size="medium" @click="handleBatchDelete">
          {{ t('patch.batchDelete') }}
        </OButton>
      </div>
      <OPagination :total="filtered.length" :page="page" :page-size="pageSize" :page-sizes="[10,20,50]" @change="onPageChange" />
    </div>

    <!-- 合入结果面板（简化版）-->
    <div v-if="mergeResult.visible" class="merge-panel-wrapper">
      <div
        class="merge-panel"
        :class="mergeResult.success ? 'merge-panel--success' : 'merge-panel--fail'"
      >
        <div class="merge-panel__header">
          <OTag :color="mergeResult.success ? 'success' : 'danger'" size="medium">
            {{ mergeResult.success ? '合入成功' : '合入失败' }}
          </OTag>
          <OButton variant="text" size="small"
            @click="mergeResult.visible = false">关闭</OButton>
        </div>
        <div class="merge-panel__body">
          <template v-if="mergeResult.success">
            <p class="merge-panel__desc">以下补丁已成功合入，PR 链接如下：</p>
            <div class="merge-panel__links">
              <OLink
                v-for="(line, i) in mergeResult.logs.filter(l => l.startsWith('  http'))"
                :key="i"
                color="primary"
                :href="line.trim()"
                target="_blank"
                class="merge-panel__link"
              >{{ line.trim() }}</OLink>
            </div>
          </template>
          <template v-else>
            <p class="merge-panel__desc merge-panel__desc--err">
              合入失败：远程仓库拒绝了本次提交，请解决代码冲突后重新提交，或联系管理员处理。
            </p>
          </template>
        </div>
      </div>
    </div><!-- /.merge-panel-wrapper -->
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
          <label class="patch-form__label">功能介绍（AR粒度）</label>
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
          <label class="patch-form__label">用户态/内核态</label>
          <OSelect v-model="addDialog.form.userKernel" placeholder="请选择（可选）">
            <OOption value="用户态" label="用户态" />
            <OOption value="内核" label="内核" />
          </OSelect>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">补丁模块</label>
          <OSelect v-model="addDialog.form.patchModule" placeholder="请选择">
            <OOption value="ACC" label="ACC" />
            <OOption value="ZIP" label="ZIP" />
            <OOption value="PCIe" label="PCIe" />
            <OOption value="UACCE" label="UACCE" />
          </OSelect>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">关联社区Issue</label>
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
          <label class="patch-form__label">Commit OE</label>
          <OInput v-model="addDialog.form.commitOE" placeholder="例：crypto: hisilicon - enable error reporting again" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">OE Merge tag</label>
          <OInput v-model="addDialog.form.oeMergeTag" placeholder="例：6.6.0-94.0.0" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">OE PR</label>
          <OInput v-model="addDialog.form.oePR" placeholder="例：gitc URL" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">PR前、后置补丁</label>
          <OInput v-model="addDialog.form.prRelated" placeholder="可选" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">Commit upstream</label>
          <OInput v-model="addDialog.form.commitUpstream" placeholder="upstream commit hash（可选）" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">upstream Merge tag</label>
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
          <label class="patch-form__label">是否合入</label>
          <div class="patch-form__switch-row">
            <OSwitch v-model="addDialog.form.merged" />
            <span class="patch-form__switch-label">{{ addDialog.form.merged ? '已合入' : '未合入' }}</span>
          </div>
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">华为仓库合入状态</label>
          <OSelect v-model="addDialog.form.hwRepoStatus" placeholder="请选择">
            <OOption value="all" label="全合入" />
            <OOption value="partial" label="部分合入" />
            <OOption value="none" label="未合入" />
          </OSelect>
        </div>
        <div class="patch-form__field patch-form__field--full">
          <label class="patch-form__label">客户影响</label>
          <OTextarea v-model="addDialog.form.customerImpact" placeholder="描述此补丁对客户的影响（可选）" :rows="2" />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">客户侧合入状态<span class="patch-form__hint">（客户录入）</span></label>
          <OInput v-model="addDialog.form.customerMergeStatus" placeholder="例：已合入" clearable />
        </div>
        <div class="patch-form__field">
          <label class="patch-form__label">合入版本<span class="patch-form__hint">（客户录入）</span></label>
          <OInput v-model="addDialog.form.mergeVersion" placeholder="例：main-5.10" clearable />
        </div>
        <div class="patch-form__field patch-form__field--full">
          <label class="patch-form__label">OS发布版本<span class="patch-form__hint">（客户录入）</span></label>
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
       OUpload draggable，支持 .xlsx / .xls / .csv
       上传后预览文件列表，确认导入
  ══ -->
  <ODialog v-model:visible="importDialog.visible" title="批量导入补丁" size="medium">
    <div class="import-body">
      <!-- 说明 + 模板下载 -->
      <div class="import-body__tips">
        <p class="import-body__tip-text">
          请按照模板格式准备 Excel 文件，支持 <strong>.xlsx</strong>、<strong>.xls</strong>、<strong>.csv</strong> 格式。
        </p>
        <OLink color="primary" href="javascript:void(0)" class="import-body__template-link">
          下载导入模板
        </OLink>
      </div>

      <ODivider />

      <!-- OUpload：拖拽 + 点击上传，接受 Excel -->
      <OUpload
        v-model="importFiles"
        accept=".xlsx,.xls,.csv"
        draggable
        :multiple="false"
        :upload-request="handleImportUpload"
        btn-label="选择 Excel 文件"
        class="import-body__upload"
      />
    </div>

    <template #footer>
      <div class="patch-dialog-footer">
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

.patch-tab {
  padding-top: var(--o-r-gap-5);
  &__stats { display: flex; gap: var(--o-r-grid-column-gutter); margin-bottom: var(--o-r-gap-6); }
  &__filter { display: flex; flex-wrap: wrap; align-items: center; gap: var(--o-r-gap-3); margin-bottom: var(--o-r-gap-4); }
  &__sel { width: 130px; }
  &__sel--wide { width: 150px; }
  &__clear { font-size: var(--o-r-font_size-tip1); color: var(--o-color-info3); cursor: pointer; white-space: nowrap; }
  &__toolbar { display: flex; gap: var(--o-r-gap-3); margin-bottom: var(--o-r-gap-4); }
  &__table-wrap { margin-bottom: var(--o-r-gap-3); }
  &__desc-link { font-size: var(--o-r-font_size-tip1); max-width: 180px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  &__muted { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip1); white-space: nowrap; }
  &__cell-hash { color: var(--o-color-info3); font-size: var(--o-r-font_size-tip2); font-family: monospace; }
  &__pr-url {
    font-size: var(--o-r-font_size-tip2);
    word-break: break-all;
    display: block;
    line-height: var(--o-r-line_height-tip2);
  }
  &__bottom { display: flex; align-items: center; justify-content: space-between; margin-top: var(--o-r-gap-5); padding-top: var(--o-r-gap-4); border-top: 1px solid var(--o-color-control4); }
  &__bottom-actions { display: flex; gap: var(--o-r-gap-3); }
}

// ── 新增补丁表单 ────────────────────────────────────────────────────────────────
.patch-form {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-5);

  &__section-title {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    font-weight: 600;
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
    font-weight: 500;
  }

  &__required { color: var(--o-color-danger1); margin-right: var(--o-r-gap-1); }

  &__hint {
    color: var(--o-color-info4);
    font-weight: 400;
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
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-4);

  &__tips {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--o-r-gap-4);
    flex-wrap: wrap;
  }

  &__tip-text {
    margin: 0;
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    strong { color: var(--o-color-primary1); }
  }

  &__template-link {
    white-space: nowrap;
    font-size: var(--o-r-font_size-tip1);
  }

  &__upload { width: 100%; }
}

// ── 弹窗底部操作区（取消 + 确认）──────────────────────────────────────────────────
.patch-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--o-r-gap-3);
}

// ── 合入结果面板（简化版）──────────────────────────────────────────────────────
.merge-panel {
  margin-top: var(--o-r-gap-4);
  border-radius: var(--o-radius_control-m);
  border: 1px solid var(--o-color-control1);
  overflow: hidden;

  &--success { border-color: var(--o-color-success1); }
  &--fail    { border-color: var(--o-color-danger1);  }

  // 标题行：状态 Tag + 关闭按钮
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--o-r-gap-3) var(--o-r-gap-4);
    background-color: var(--o-color-fill3);
  }

  // 内容区
  &__body {
    padding: var(--o-r-gap-4);
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-3);
    background-color: var(--o-color-fill2);
  }

  &__desc {
    margin: 0;
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    &--err { color: var(--o-color-danger1); }
  }

  // PR 链接列表
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

// 滑入动画
// 面板 wrapper：用 v-if 控制显隐，结合 animation 实现滑入效果
.merge-panel-wrapper {
  animation: mergeSlideIn var(--o-duration-m1) var(--o-easing-standard);
}
@keyframes mergeSlideIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
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

<!-- 导出下拉菜单全局样式（非 scoped，防止被 ODropdown 弹层作用域隔离） -->
<style>
.export-menu {
  padding: 4px 0;
  min-width: 120px;
}
.export-menu__item {
  padding: 8px 16px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.15s;
}
.export-menu__item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
.export-menu__count {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

/* ── 横向滚动（修复表格内容显示不全）─────────────────────────────────────────
   OTable 内置 .o-table-wrap { overflow: hidden }，必须通过全局 CSS 覆盖
   才能让 .o-table-wrap 自身横向滚动，使 21 列全部可访问。
─────────────────────────────────────────────────────────────────────────── */
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
</style>
