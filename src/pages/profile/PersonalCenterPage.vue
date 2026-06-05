<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  OButton, OTag, OInput, OLink, OMessage, ODivider,
  ODialog, OSelect, OOption, OTable,
} from '@opensig/opendesign'
import { useAuth } from '../../composables/useAuth'

const { currentUser, isAdmin, logout, switchRole } = useAuth()
const router = useRouter()

const handleLogout = () => { logout(); router.push('/login') }

// ─── 个人信息 ─────────────────────────────────────────────────────────────────
const displayName = computed(() => currentUser.value?.name ?? '')
const displayRole = computed(() => currentUser.value?.role === 'admin' ? '管理员' : '普通用户')

// ─── 绑定邮箱弹窗 ─────────────────────────────────────────────────────────────
const emailDialog = reactive({ visible: false, email: '', code: '', countdown: 0 })
let emailTimer: ReturnType<typeof setInterval> | null = null

const openEmailDialog = () => {
  emailDialog.email = ''; emailDialog.code = ''; emailDialog.countdown = 0
  emailDialog.visible = true
}
const sendEmailCode = () => {
  if (!emailDialog.email.trim()) { OMessage.warning('请输入邮箱地址'); return }
  if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(emailDialog.email)) { OMessage.warning('请输入有效的邮箱地址'); return }
  OMessage.success('验证码已发送至邮箱')
  emailDialog.countdown = 60
  emailTimer = setInterval(() => {
    emailDialog.countdown--
    if (emailDialog.countdown <= 0) { clearInterval(emailTimer!); emailTimer = null }
  }, 1000)
}
const confirmBindEmail = () => {
  if (!emailDialog.email.trim()) { OMessage.warning('请输入邮箱地址'); return }
  if (!emailDialog.code.trim()) { OMessage.warning('请输入验证码'); return }
  OMessage.success('邮箱绑定成功')
  emailDialog.visible = false
}

// ─── 解除手机绑定弹窗 ─────────────────────────────────────────────────────────
const phoneDialog = reactive({ visible: false, code: '', countdown: 0 })
const phone = '138****8888'
let phoneTimer: ReturnType<typeof setInterval> | null = null

const openPhoneDialog = () => { phoneDialog.code = ''; phoneDialog.countdown = 0; phoneDialog.visible = true }
const sendPhoneCode = () => {
  OMessage.success(`验证码已发送至 ${phone}`)
  phoneDialog.countdown = 60
  phoneTimer = setInterval(() => {
    phoneDialog.countdown--
    if (phoneDialog.countdown <= 0) { clearInterval(phoneTimer!); phoneTimer = null }
  }, 1000)
}
const confirmUnbindPhone = () => {
  if (!phoneDialog.code.trim()) { OMessage.warning('请输入验证码'); return }
  OMessage.success('手机号已解除绑定')
  phoneDialog.visible = false
}

// ─── 第三方账号绑定弹窗 ────────────────────────────────────────────────────────
const thirdDialog = reactive({ visible: false, platform: '', account: '', bound: false })
const openThirdDialog = (platform: string) => {
  thirdDialog.platform = platform; thirdDialog.account = ''; thirdDialog.visible = true
}
const confirmBindThird = () => {
  if (!thirdDialog.account.trim()) { OMessage.warning(`请输入 ${thirdDialog.platform} 账号`); return }
  OMessage.success(`${thirdDialog.platform} 账号绑定成功`)
  thirdDialog.visible = false
}

// ─── 协议签署弹窗 ─────────────────────────────────────────────────────────────
const protocolDialog = reactive({ visible: false })
const protocolSigned = ref(false)
const confirmSign = () => { protocolSigned.value = true; OMessage.success('协议签署成功'); protocolDialog.visible = false }

// ─── 权限管理：合并为一张表 ──────────────────────────────────────────────────────
// 字段：用户名 / 角色（管理者/超级管理员/普通用户）/ 活跃项目 / 操作
interface PermRow { id: string; name: string; role: string; project: string }

const permSearch = ref('')
const permRows = ref<PermRow[]>([
  { id: 'a1', name: 'Admin Manager', role: '超级管理员', project: '全部项目' },
  { id: 'a2', name: '张工',          role: '管理者',     project: 'Kernel-5.10' },
  { id: 'a3', name: '李工',          role: '管理者',     project: 'Security' },
  { id: 'u1', name: 'wWX1116002',    role: '普通用户',   project: 'PCIE/ACC' },
  { id: 'u2', name: 'xws0058756',    role: '普通用户',   project: 'ACC' },
  { id: 'u3', name: 'user001',       role: '普通用户',   project: '内核' },
  { id: 'u4', name: 'user002',       role: '普通用户',   project: '网络' },
  { id: 'u5', name: 'user003',       role: '普通用户',   project: '驱动' },
])

const filteredPerm = computed(() => {
  const kw = permSearch.value.toLowerCase()
  return permRows.value.filter(r => !kw || r.name.toLowerCase().includes(kw) || r.role.includes(kw))
})

// OTable 列定义（与用例看板风格一致）
const permColumns = [
  { label: '用户名',   key: 'name',    style: { width: '180px', minWidth: '180px' } },
  { label: '角色',     key: 'role',    style: { width: '120px', minWidth: '120px' } },
  { label: '活跃项目', key: 'project', style: { width: '180px', minWidth: '180px' } },
  { label: '操作',     key: 'action',  style: { width: '80px',  minWidth: '80px'  } },
]

const roleColor = (role: string) => {
  if (role === '超级管理员') return 'danger'
  if (role === '管理者') return 'primary'
  return 'info'
}

const removePerm = (id: string) => {
  permRows.value = permRows.value.filter(r => r.id !== id)
  OMessage.success('已移除成员')
}

// ─── 新增成员弹窗 ────────────────────────────────────────────────────────────
const addMemberDialog = reactive({ visible: false, name: '', role: '普通用户', project: '' })
const openAddMember = () => {
  Object.assign(addMemberDialog, { visible: true, name: '', role: '普通用户', project: '' })
}
const confirmAddMember = () => {
  if (!addMemberDialog.name.trim()) { OMessage.warning('请输入用户名'); return }
  if (!addMemberDialog.project.trim()) { OMessage.warning('请输入活跃项目'); return }
  permRows.value.push({
    id: `m${Date.now()}`,
    name: addMemberDialog.name,
    role: addMemberDialog.role,
    project: addMemberDialog.project,
  })
  OMessage.success('成员添加成功')
  addMemberDialog.visible = false
}
</script>

<template>
  <div class="profile">

    <!-- 页面顶部：标题 -->
    <div class="profile__page-header">
      <h1 class="profile__page-title">个人中心</h1>
    </div>

    <!-- ── 个人信息 ── -->
    <section class="profile__section">
      <h2 class="profile__section-title">个人信息</h2>
      <p class="profile__section-desc">您可以在这里进行个人基础信息的修改操作</p>
      <ODivider />
      <div class="profile__form-rows">
        <div class="profile__form-row">
          <span class="profile__form-label">用户名</span>
          <OInput :model-value="displayName" disabled class="profile__form-input" />
        </div>
        <div class="profile__form-row">
          <span class="profile__form-label">所属角色</span>
          <OInput :model-value="displayRole" disabled class="profile__form-input" />
          <OButton variant="outline" size="medium" round="pill" color="primary" @click="switchRole">
            切换为{{ isAdmin ? '普通用户' : '管理者' }}视图
          </OButton>
        </div>
      </div>
      <p class="profile__role-hint">此按钮仅用于不同身份的效果展示，不作为实际的角色权限变更</p>
    </section>

    <!-- ── 账号设置 ── -->
    <section class="profile__section">
      <h2 class="profile__section-title">账号设置</h2>
      <p class="profile__section-desc">您可以在这里进行账号绑定、安全协议签署、消息接收等修改操作</p>
      <ODivider />

      <!-- 邮箱和手机号绑定 -->
      <div class="profile__account-group">
        <h3 class="profile__account-subtitle">邮箱和手机号绑定</h3>
        <div class="profile__account-list">
          <div class="profile__account-item">
            <span class="profile__account-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.15615 4.21297C5.59848 2.80087 7.85643 2.68519 9.30316 3.94477L9.45693 4.08684L14.4285 8.95429L14.5665 9.09814C15.6703 10.3246 15.6286 12.2251 14.4538 13.5102L14.312 13.6568L13.7577 14.1994L13.6702 14.2723C13.3946 14.4662 13.0112 14.4376 12.7678 14.1889C12.5243 13.9402 12.5014 13.5514 12.7096 13.2769L12.7931 13.1843L13.3346 12.6544L13.4596 12.5215C14.0903 11.793 14.1393 10.764 13.563 10.0775L13.4525 9.95815L8.47541 5.0852L8.35129 4.97302C7.45724 4.22758 6.04949 4.31857 5.13556 5.21335C4.23598 6.09408 4.13337 7.44432 4.88661 8.3161L5.00176 8.43874L6.93103 10.3277L7.00576 10.4137C7.20547 10.6851 7.18493 11.069 6.94152 11.3176C6.69802 11.5663 6.30974 11.5974 6.03094 11.3951L5.94621 11.3232L4.02526 9.44209L3.88175 9.29308C2.59224 7.87262 2.70014 5.63847 4.15615 4.21297ZM11.1224 9.90042C10.8789 9.6518 10.4956 9.62313 10.22 9.81705L10.1325 9.88994L9.57814 10.4326L9.43639 10.5792C8.26154 11.8642 8.21986 13.7648 9.32371 14.9912L9.46167 15.1351L14.4332 20.0025L14.587 20.1446C16.0338 21.4042 18.2917 21.2885 19.734 19.8764C21.19 18.4509 21.2979 16.2167 20.0084 14.7963L19.8649 14.6473L17.944 12.7662L17.8592 12.6943C17.5804 12.4919 17.1922 12.5231 16.9487 12.7718C16.7053 13.0204 16.6847 13.4042 16.8844 13.6757L16.9591 13.7617L18.8884 15.6506L19.0036 15.7733C19.7568 16.645 19.6542 17.9953 18.7546 18.876C17.8407 19.7708 16.4329 19.8618 15.5389 19.1163L15.4148 19.0042L10.4377 14.1312L10.3272 14.0118C9.75092 13.3253 9.7999 12.2964 10.4306 11.5678L10.5556 11.4349L11.0971 10.9051L11.1806 10.8124C11.3887 10.538 11.3659 10.1491 11.1224 9.90042Z" fill="currentColor" fill-opacity="0.8"/>
              </svg>
            </span>
            <span class="profile__account-label">邮箱地址</span>
            <span class="profile__account-value">{{ emailDialog.email || '未绑定' }}</span>
            <OLink color="primary" @click="openEmailDialog">绑定</OLink>
          </div>
          <div class="profile__account-item">
            <span class="profile__account-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.15615 4.21297C5.59848 2.80087 7.85643 2.68519 9.30316 3.94477L9.45693 4.08684L14.4285 8.95429L14.5665 9.09814C15.6703 10.3246 15.6286 12.2251 14.4538 13.5102L14.312 13.6568L13.7577 14.1994L13.6702 14.2723C13.3946 14.4662 13.0112 14.4376 12.7678 14.1889C12.5243 13.9402 12.5014 13.5514 12.7096 13.2769L12.7931 13.1843L13.3346 12.6544L13.4596 12.5215C14.0903 11.793 14.1393 10.764 13.563 10.0775L13.4525 9.95815L8.47541 5.0852L8.35129 4.97302C7.45724 4.22758 6.04949 4.31857 5.13556 5.21335C4.23598 6.09408 4.13337 7.44432 4.88661 8.3161L5.00176 8.43874L6.93103 10.3277L7.00576 10.4137C7.20547 10.6851 7.18493 11.069 6.94152 11.3176C6.69802 11.5663 6.30974 11.5974 6.03094 11.3951L5.94621 11.3232L4.02526 9.44209L3.88175 9.29308C2.59224 7.87262 2.70014 5.63847 4.15615 4.21297ZM11.1224 9.90042C10.8789 9.6518 10.4956 9.62313 10.22 9.81705L10.1325 9.88994L9.57814 10.4326L9.43639 10.5792C8.26154 11.8642 8.21986 13.7648 9.32371 14.9912L9.46167 15.1351L14.4332 20.0025L14.587 20.1446C16.0338 21.4042 18.2917 21.2885 19.734 19.8764C21.19 18.4509 21.2979 16.2167 20.0084 14.7963L19.8649 14.6473L17.944 12.7662L17.8592 12.6943C17.5804 12.4919 17.1922 12.5231 16.9487 12.7718C16.7053 13.0204 16.6847 13.4042 16.8844 13.6757L16.9591 13.7617L18.8884 15.6506L19.0036 15.7733C19.7568 16.645 19.6542 17.9953 18.7546 18.876C17.8407 19.7708 16.4329 19.8618 15.5389 19.1163L15.4148 19.0042L10.4377 14.1312L10.3272 14.0118C9.75092 13.3253 9.7999 12.2964 10.4306 11.5678L10.5556 11.4349L11.0971 10.9051L11.1806 10.8124C11.3887 10.538 11.3659 10.1491 11.1224 9.90042Z" fill="currentColor" fill-opacity="0.8"/>
              </svg>
            </span>
            <span class="profile__account-label">绑定手机</span>
            <span class="profile__account-value">{{ phone }}</span>
            <OLink color="primary" @click="openPhoneDialog">解除绑定</OLink>
            <OLink color="primary" @click="openPhoneDialog">修改</OLink>
          </div>
        </div>
      </div>

      <!-- 第三方账号绑定 -->
      <div class="profile__account-group">
        <h3 class="profile__account-subtitle">第三方账号绑定</h3>
        <div class="profile__account-list">
          <div class="profile__account-item">
            <span class="profile__account-icon profile__account-icon--github">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.15615 4.21297C5.59848 2.80087 7.85643 2.68519 9.30316 3.94477L9.45693 4.08684L14.4285 8.95429L14.5665 9.09814C15.6703 10.3246 15.6286 12.2251 14.4538 13.5102L14.312 13.6568L13.7577 14.1994L13.6702 14.2723C13.3946 14.4662 13.0112 14.4376 12.7678 14.1889C12.5243 13.9402 12.5014 13.5514 12.7096 13.2769L12.7931 13.1843L13.3346 12.6544L13.4596 12.5215C14.0903 11.793 14.1393 10.764 13.563 10.0775L13.4525 9.95815L8.47541 5.0852L8.35129 4.97302C7.45724 4.22758 6.04949 4.31857 5.13556 5.21335C4.23598 6.09408 4.13337 7.44432 4.88661 8.3161L5.00176 8.43874L6.93103 10.3277L7.00576 10.4137C7.20547 10.6851 7.18493 11.069 6.94152 11.3176C6.69802 11.5663 6.30974 11.5974 6.03094 11.3951L5.94621 11.3232L4.02526 9.44209L3.88175 9.29308C2.59224 7.87262 2.70014 5.63847 4.15615 4.21297ZM11.1224 9.90042C10.8789 9.6518 10.4956 9.62313 10.22 9.81705L10.1325 9.88994L9.57814 10.4326L9.43639 10.5792C8.26154 11.8642 8.21986 13.7648 9.32371 14.9912L9.46167 15.1351L14.4332 20.0025L14.587 20.1446C16.0338 21.4042 18.2917 21.2885 19.734 19.8764C21.19 18.4509 21.2979 16.2167 20.0084 14.7963L19.8649 14.6473L17.944 12.7662L17.8592 12.6943C17.5804 12.4919 17.1922 12.5231 16.9487 12.7718C16.7053 13.0204 16.6847 13.4042 16.8844 13.6757L16.9591 13.7617L18.8884 15.6506L19.0036 15.7733C19.7568 16.645 19.6542 17.9953 18.7546 18.876C17.8407 19.7708 16.4329 19.8618 15.5389 19.1163L15.4148 19.0042L10.4377 14.1312L10.3272 14.0118C9.75092 13.3253 9.7999 12.2964 10.4306 11.5678L10.5556 11.4349L11.0971 10.9051L11.1806 10.8124C11.3887 10.538 11.3659 10.1491 11.1224 9.90042Z" fill="currentColor" fill-opacity="0.8"/>
              </svg>
            </span>
            <span class="profile__account-label">GitHub</span>
            <span class="profile__account-value"></span>
            <OLink color="primary" @click="openThirdDialog('GitHub')">绑定</OLink>
          </div>
          <div class="profile__account-item">
            <span class="profile__account-icon profile__account-icon--gitee">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.15615 4.21297C5.59848 2.80087 7.85643 2.68519 9.30316 3.94477L9.45693 4.08684L14.4285 8.95429L14.5665 9.09814C15.6703 10.3246 15.6286 12.2251 14.4538 13.5102L14.312 13.6568L13.7577 14.1994L13.6702 14.2723C13.3946 14.4662 13.0112 14.4376 12.7678 14.1889C12.5243 13.9402 12.5014 13.5514 12.7096 13.2769L12.7931 13.1843L13.3346 12.6544L13.4596 12.5215C14.0903 11.793 14.1393 10.764 13.563 10.0775L13.4525 9.95815L8.47541 5.0852L8.35129 4.97302C7.45724 4.22758 6.04949 4.31857 5.13556 5.21335C4.23598 6.09408 4.13337 7.44432 4.88661 8.3161L5.00176 8.43874L6.93103 10.3277L7.00576 10.4137C7.20547 10.6851 7.18493 11.069 6.94152 11.3176C6.69802 11.5663 6.30974 11.5974 6.03094 11.3951L5.94621 11.3232L4.02526 9.44209L3.88175 9.29308C2.59224 7.87262 2.70014 5.63847 4.15615 4.21297ZM11.1224 9.90042C10.8789 9.6518 10.4956 9.62313 10.22 9.81705L10.1325 9.88994L9.57814 10.4326L9.43639 10.5792C8.26154 11.8642 8.21986 13.7648 9.32371 14.9912L9.46167 15.1351L14.4332 20.0025L14.587 20.1446C16.0338 21.4042 18.2917 21.2885 19.734 19.8764C21.19 18.4509 21.2979 16.2167 20.0084 14.7963L19.8649 14.6473L17.944 12.7662L17.8592 12.6943C17.5804 12.4919 17.1922 12.5231 16.9487 12.7718C16.7053 13.0204 16.6847 13.4042 16.8844 13.6757L16.9591 13.7617L18.8884 15.6506L19.0036 15.7733C19.7568 16.645 19.6542 17.9953 18.7546 18.876C17.8407 19.7708 16.4329 19.8618 15.5389 19.1163L15.4148 19.0042L10.4377 14.1312L10.3272 14.0118C9.75092 13.3253 9.7999 12.2964 10.4306 11.5678L10.5556 11.4349L11.0971 10.9051L11.1806 10.8124C11.3887 10.538 11.3659 10.1491 11.1224 9.90042Z" fill="currentColor" fill-opacity="0.8"/>
              </svg>
            </span>
            <span class="profile__account-label">gitcode</span>
            <span class="profile__account-value"></span>
            <OLink color="primary" @click="openThirdDialog('gitcode')">绑定</OLink>
          </div>
        </div>
      </div>

      <!-- 协议签署 -->
      <div class="profile__account-group">
        <h3 class="profile__account-subtitle">协议签署</h3>
        <div class="profile__account-list">
          <div class="profile__account-item">
            <span class="profile__account-value profile__account-value--protocol">
              当前协议签署状态：
              <OLink v-if="!protocolSigned" color="primary" href="javascript:void(0)"
                @click="protocolDialog.visible = true">未签署</OLink>
              <OTag v-else color="success" size="medium">已签署</OTag>
            </span>
            <OButton v-if="!protocolSigned" variant="text" color="primary" size="medium" round="pill"
              @click="protocolDialog.visible = true">去签署</OButton>
          </div>
        </div>
      </div>

      <!-- 退出登录 -->
      <div class="profile__logout">
        <OButton variant="outline" size="medium" round="pill" color="danger" @click="handleLogout">
          退出登录
        </OButton>
      </div>
    </section>

    <!-- ── 权限管理（仅管理员可见）── -->
    <section v-if="isAdmin" class="profile__section">
      <h2 class="profile__section-title">权限管理</h2>
      <ODivider />

      <!-- 工具栏：搜索 + 新增成员 -->
      <div class="profile__perm-toolbar">
        <OInput
          v-model="permSearch"
          placeholder="搜索用户名/角色"
          clearable
          class="profile__perm-search"
        />
        <OButton variant="solid" color="primary" size="medium" round="pill" @click="openAddMember">
          + 新增成员
        </OButton>
      </div>

      <!-- OTable：与用例看板风格一致 -->
      <div class="profile__perm-table-wrap">
        <OTable :columns="permColumns" :data="filteredPerm">
          <template #td_role="{ row }">
            <OTag :color="roleColor(row.role)" size="medium" variant="outline">{{ row.role }}</OTag>
          </template>
          <template #td_action="{ row }">
            <OButton variant="text" color="danger" size="small" round="pill"
              @click="removePerm(row.id)">移除</OButton>
          </template>
        </OTable>
      </div>
    </section>

  </div>

  <!-- ══ 绑定邮箱弹窗 ══════════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="emailDialog.visible" title="绑定邮箱" size="small">
    <div class="p-dialog-body">
      <div class="p-dialog-field">
        <label class="p-dialog-label"><span class="p-dialog-required">*</span>邮箱地址</label>
        <OInput v-model="emailDialog.email" placeholder="请输入邮箱地址" clearable />
      </div>
      <div class="p-dialog-field">
        <label class="p-dialog-label"><span class="p-dialog-required">*</span>验证码</label>
        <div class="p-dialog-code-row">
          <OInput v-model="emailDialog.code" placeholder="请输入验证码" clearable />
          <OButton variant="outline" size="medium" round="pill"
            :disabled="emailDialog.countdown > 0" @click="sendEmailCode">
            {{ emailDialog.countdown > 0 ? `${emailDialog.countdown}s 后重发` : '发送验证码' }}
          </OButton>
        </div>
      </div>
      <p class="p-dialog-hint">验证码将发送至您填写的邮箱，有效期 10 分钟</p>
    </div>
    <template #footer>
      <div class="p-dialog-footer">
        <OButton variant="outline" size="medium" round="pill" @click="emailDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="primary" size="medium" round="pill" @click="confirmBindEmail">确认绑定</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 解除手机绑定弹窗 ══════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="phoneDialog.visible" title="解除手机绑定" size="small">
    <div class="p-dialog-body">
      <p class="p-dialog-desc">即将解除手机号 <strong>{{ phone }}</strong> 的绑定，请先验证身份。</p>
      <div class="p-dialog-field">
        <label class="p-dialog-label"><span class="p-dialog-required">*</span>验证码</label>
        <div class="p-dialog-code-row">
          <OInput v-model="phoneDialog.code" placeholder="请输入验证码" clearable />
          <OButton variant="outline" size="medium" round="pill"
            :disabled="phoneDialog.countdown > 0" @click="sendPhoneCode">
            {{ phoneDialog.countdown > 0 ? `${phoneDialog.countdown}s 后重发` : '发送验证码' }}
          </OButton>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="p-dialog-footer">
        <OButton variant="outline" size="medium" round="pill" @click="phoneDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="danger" size="medium" round="pill" @click="confirmUnbindPhone">确认解绑</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 第三方账号绑定弹窗（GitHub / gitcode 共用）══════════════════════════ -->
  <ODialog v-model:visible="thirdDialog.visible" :title="`绑定 ${thirdDialog.platform} 账号`" size="small">
    <div class="p-dialog-body">
      <div class="p-dialog-field">
        <label class="p-dialog-label"><span class="p-dialog-required">*</span>{{ thirdDialog.platform }} 账号</label>
        <OInput v-model="thirdDialog.account"
          :placeholder="`请输入 ${thirdDialog.platform} 用户名`" clearable />
      </div>
      <p class="p-dialog-hint">
        绑定后可使用 {{ thirdDialog.platform }} 账号快速登录本平台
      </p>
    </div>
    <template #footer>
      <div class="p-dialog-footer">
        <OButton variant="outline" size="medium" round="pill" @click="thirdDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="primary" size="medium" round="pill" @click="confirmBindThird">确认绑定</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 协议签署弹窗 ══════════════════════════════════════════════════════════ -->
  <ODialog v-model:visible="protocolDialog.visible" title="开发者协议" size="medium">
    <div class="p-dialog-body">
      <div class="p-protocol-content">
        <p><strong>一、协议说明</strong></p>
        <p>本协议是您与能效提升工作台（以下简称"本平台"）之间关于使用平台服务的法律协议。请仔细阅读以下条款，继续使用即表示同意。</p>
        <p><strong>二、用户权责</strong></p>
        <p>1. 用户须保证提交的补丁和测试用例符合开源社区规范，不得包含恶意代码或侵权内容。</p>
        <p>2. 用户应对账号下的所有操作负责，不得共享账号或将账号转让他人。</p>
        <p>3. 用户同意平台收集必要的使用数据用于改善服务质量，数据处理遵循隐私政策。</p>
        <p><strong>三、平台权利</strong></p>
        <p>平台保留在违规情况下暂停或终止用户账号的权利，并有权对提交内容进行审核。</p>
        <p><strong>四、免责声明</strong></p>
        <p>平台不对因系统故障、网络中断等不可控因素导致的数据损失承担责任。</p>
      </div>
    </div>
    <template #footer>
      <div class="p-dialog-footer">
        <OButton variant="outline" size="medium" round="pill" @click="protocolDialog.visible = false">暂不签署</OButton>
        <OButton variant="solid" color="primary" size="medium" round="pill" @click="confirmSign">同意并签署</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 新增成员弹窗（管理员 + 普通用户合并）══════════════════════════════════ -->
  <ODialog v-model:visible="addMemberDialog.visible" title="新增成员" size="small">
    <div class="p-dialog-body">
      <div class="p-dialog-field">
        <label class="p-dialog-label"><span class="p-dialog-required">*</span>用户名</label>
        <OInput v-model="addMemberDialog.name" placeholder="请输入用户名" clearable />
      </div>
      <div class="p-dialog-field">
        <label class="p-dialog-label"><span class="p-dialog-required">*</span>角色</label>
        <OSelect v-model="addMemberDialog.role">
          <OOption value="超级管理员" label="超级管理员" />
          <OOption value="管理者" label="管理者" />
          <OOption value="普通用户" label="普通用户" />
        </OSelect>
      </div>
      <div class="p-dialog-field">
        <label class="p-dialog-label"><span class="p-dialog-required">*</span>活跃项目</label>
        <OInput v-model="addMemberDialog.project" placeholder="请输入活跃项目" clearable />
      </div>
    </div>
    <template #footer>
      <div class="p-dialog-footer">
        <OButton variant="outline" size="medium" round="pill" @click="addMemberDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="primary" size="medium" round="pill" @click="confirmAddMember">确认添加</OButton>
      </div>
    </template>
  </ODialog>

</template>

<style lang="scss" scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-5);
  max-width: 900px;
  margin: 0 auto;      // 水平居中

  // ── 页面标题行 ────────────────────────────────────────────────────────────
  &__page-header {
    padding-bottom: var(--o-r-gap-4);
    border-bottom: 1px solid var(--o-color-control4);
  }

  &__page-title {
    margin: 0;
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-h2);
    line-height: var(--o-r-line_height-h2);
    font-weight: var(--o-font_weight-bold);
  }

  // ── 区块通用 ──────────────────────────────────────────────────────────────
  &__section {
    background-color: var(--o-color-fill2);
    border-radius: var(--o-radius_control-m);
    padding: var(--o-r-gap-6);
    margin-bottom: var(--o-r-gap-5);
  }

  &__section-title {
    margin: 0;
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-h4);
    line-height: var(--o-r-line_height-h4);
    font-weight: var(--o-font_weight-bold);
  }

  &__section-desc {
    margin: var(--o-r-gap-2) 0 0 0;
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
  }

  // ── 表单行 ────────────────────────────────────────────────────────────────
  &__form-rows {
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-4);
    margin-top: var(--o-r-gap-4);
  }

  &__form-row {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-4);
  }

  &__form-label {
    width: 80px;
    flex-shrink: 0;
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
  }

  &__form-input { flex: 1; }

  &__role-hint {
    margin: var(--o-r-gap-2) 0 0 0;
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-tip2);
    line-height: var(--o-r-line_height-tip2);
  }

  // ── 账号设置列表样式 ─────────────────────────────────────────────────────
  &__account-group {
    margin-top: var(--o-r-gap-5);
    padding-top: var(--o-r-gap-4);
    border-top: 1px solid var(--o-color-control3);

    &:first-of-type { margin-top: var(--o-r-gap-4); border-top: none; }
  }

  &__account-subtitle {
    margin: 0 0 var(--o-r-gap-3) 0;
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    font-weight: var(--o-font_weight-bold);
  }

  &__account-list {
    display: flex;
    flex-direction: column;
  }

  &__account-item {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-4);
    padding: var(--o-r-gap-3) 0;
    border-bottom: 1px solid var(--o-color-control4);

    &:last-child { border-bottom: none; }
  }

  &__account-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: var(--o-color-fill3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--o-r-font_size-tip1);
    flex-shrink: 0;

    &--github { color: #24292e; }
    &--gitee { color: #c71d23; }
  }

  &__account-label {
    width: 80px;
    flex-shrink: 0;
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-text1);
  }

  &__account-value {
    flex: 1;
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);

    &--protocol { color: var(--o-color-info2); font-size: var(--o-r-font_size-tip1); }
  }

  // ── 退出登录按钮 ─────────────────────────────────────────────────────────
  &__logout {
    margin-top: var(--o-r-gap-5);
    padding-top: var(--o-r-gap-4);
    border-top: 1px solid var(--o-color-control4);
    display: flex;
    justify-content: flex-end;
  }

  // ── 权限管理（两列）──────────────────────────────────────────────────────
  &__perm {
    display: flex;
    gap: var(--o-r-grid-column-gutter);
    margin-top: var(--o-r-gap-4);

    @media (max-width: 840px) { flex-direction: column; }
  }

  &__perm-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-3);
    border: 1px solid var(--o-color-control1);
    border-radius: var(--o-radius_control-m);
    padding: var(--o-r-gap-4);
  }

  &__perm-col-title {
    margin: 0;
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
    font-weight: var(--o-font_weight-bold);
  }

  &__perm-search { width: 100%; }

  // 工具栏（搜索 + 新增成员同行）
  &__perm-toolbar {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-3);
    margin-bottom: var(--o-r-gap-4);
  }

  // 管理者列表
  &__perm-list {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--o-color-control1);
    border-radius: var(--o-radius_control-m);
    overflow: hidden;
  }

  &__perm-item {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-3);
    padding: var(--o-r-gap-3) var(--o-r-gap-4);
    background-color: var(--o-color-fill3);
    border-bottom: 1px solid var(--o-color-control4);
    &:last-child { border-bottom: none; }
  }

  &__perm-item-name {
    flex: 1;
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
  }

  // 用户表格
  &__perm-user-table {
    border: 1px solid var(--o-color-control1);
    border-radius: var(--o-radius_control-m);
    overflow: hidden;
  }

  &__perm-user-header {
    display: flex;
    align-items: center;
    padding: var(--o-r-gap-3) var(--o-r-gap-4);
    background-color: var(--o-color-fill3);
    border-bottom: 1px solid var(--o-color-control1);
    span {
      color: var(--o-color-info2);
      font-size: var(--o-r-font_size-tip1);
      font-weight: var(--o-font_weight-bold);
    }
  }

  &__perm-user-row {
    display: flex;
    align-items: center;
    padding: var(--o-r-gap-3) var(--o-r-gap-4);
    background-color: var(--o-color-fill2);
    border-bottom: 1px solid var(--o-color-control4);
    &:last-child { border-bottom: none; }
  }

  // 三列宽度
  &__perm-user-name-col   { flex: 1.2; color: var(--o-color-info1); font-size: var(--o-r-font_size-text1); }
  &__perm-user-proj-col   { flex: 1.5; color: var(--o-color-info2); font-size: var(--o-r-font_size-text1); }
  &__perm-user-action-col {
    flex: 0 0 56px;
    text-align: right;
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip1);
    font-weight: var(--o-font_weight-bold);
  }

  &__perm-footer {
    padding-top: var(--o-r-gap-2);
    border-top: 1px solid var(--o-color-control4);
  }

  &__perm-empty {
    padding: var(--o-r-gap-5);
    text-align: center;
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-tip1);
  }
}

// ── 弹窗通用样式 ──────────────────────────────────────────────────────────────
.p-dialog-body {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-4);
  padding: var(--o-r-gap-3) 0;
}

.p-dialog-field {
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-2);
}

.p-dialog-label {
  color: var(--o-color-info2);
  font-size: var(--o-r-font_size-tip1);
  font-weight: var(--o-font_weight-regular);
}

.p-dialog-required {
  color: var(--o-color-danger1);
  margin-right: var(--o-r-gap-1);
}

// 验证码行：输入框 + 发送按钮
.p-dialog-code-row {
  display: flex;
  gap: var(--o-r-gap-3);
  align-items: center;
}

// 提示文字
.p-dialog-hint {
  margin: 0;
  color: var(--o-color-info4);
  font-size: var(--o-r-font_size-tip2);
  line-height: var(--o-r-line_height-tip2);
}

// 确认描述
.p-dialog-desc {
  margin: 0;
  color: var(--o-color-info2);
  font-size: var(--o-r-font_size-text1);
  line-height: var(--o-r-line_height-text1);
  strong { color: var(--o-color-info1); }
}

// 协议正文
.p-protocol-content {
  max-height: 280px;
  overflow-y: auto;
  padding-right: var(--o-r-gap-2);
  display: flex;
  flex-direction: column;
  gap: var(--o-r-gap-3);
  p { margin: 0; color: var(--o-color-info2); font-size: var(--o-r-font_size-text1); line-height: var(--o-r-line_height-text1); }
  strong { color: var(--o-color-info1); }
}

// 弹窗底部
.p-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--o-r-gap-3);
}
</style>