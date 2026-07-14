<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  OButton, OTag, OInput, OLink, OMessage, ODivider,
  ODialog, OSelect, OOption,
} from '@opensig/opendesign'
import { useAuth } from '../../composables/useAuth'

const { currentUser, isAdmin, logout, switchRole } = useAuth()
const router = useRouter()

const handleLogout = () => { logout(); router.push('/login') }

// ─── 个人信息 ─────────────────────────────────────────────────────────────────
const displayName = computed(() => currentUser.value?.name ?? 'ToniZhang')
const displayRole = computed(() => currentUser.value?.role === 'admin' ? '管理员' : '普通用户')
const company = ref('')

const handleSaveProfile = () => {
  OMessage.success('个人信息保存成功')
}

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
const phone = '+86138****5987'
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


</script>

<template>
  <div class="profile">

    <!-- ── 个人信息 ── -->
    <section class="profile__section">
      <h2 class="profile__section-title">个人信息</h2>
      <p class="profile__section-desc">您可以在这里进行个人基础信息的修改操作</p>
      <ODivider />

      <div class="profile__info-rows">
        <!-- 用户名 -->
        <div class="profile__info-row">
          <span class="profile__info-label">用户名</span>
          <span class="profile__info-value">{{ displayName }}</span>
        </div>

        <!-- 所属角色 -->
        <div class="profile__info-row">
          <span class="profile__info-label">
            所属角色
            <span class="profile__info-tip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </span>
          </span>
          <span class="profile__info-value">{{ displayRole === '管理员' ? '管理员' : '暂无角色' }}</span>
          <OButton v-if="isAdmin" variant="text" color="primary" size="small" @click="switchRole">
            切换为普通用户视图
          </OButton>
        </div>

        <!-- 企业/组织 -->
        <div class="profile__info-row">
          <span class="profile__info-label">企业/组织</span>
          <OInput v-model="company" placeholder="请输入你的公司" class="profile__info-input" />
        </div>
      </div>

      <div class="profile__save-row">
        <OButton variant="solid" color="primary" size="medium" round="pill" @click="handleSaveProfile">保存修改</OButton>
      </div>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M2 7l10 7 10-7" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </span>
            <span class="profile__account-label">邮箱地址</span>
            <span class="profile__account-value profile__account-value--muted">{{ emailDialog.email || '未绑定' }}</span>
            <OLink color="primary" @click="openEmailDialog">绑定</OLink>
          </div>
          <div class="profile__account-item">
            <span class="profile__account-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <line x1="12" y1="18" x2="12" y2="18.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" fill="currentColor"/>
              </svg>
            </span>
            <span class="profile__account-label">Github</span>
            <span class="profile__account-value"></span>
            <OLink color="primary" @click="openThirdDialog('Github')">绑定</OLink>
          </div>
          <div class="profile__account-item">
            <span class="profile__account-icon profile__account-icon--atomgit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#C71D23"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="9" font-weight="bold">A</text>
              </svg>
            </span>
            <span class="profile__account-label">AtomGit</span>
            <span class="profile__account-value">tonizhang58</span>
            <OLink color="primary">解除绑定</OLink>
          </div>
        </div>
      </div>

      <!-- 账号安全 -->
      <div class="profile__account-group">
        <h3 class="profile__account-subtitle">账号安全</h3>

        <div class="profile__security-row">
          <div class="profile__security-info">
            <h4 class="profile__security-title">登录密码</h4>
            <p class="profile__security-desc">通过验证手机号、邮箱等方式修改密码，修改成功后需要重新登录</p>
          </div>
          <OLink color="primary">修改</OLink>
        </div>

        <div class="profile__security-row">
          <div class="profile__security-info">
            <h4 class="profile__security-title">已签署协议</h4>
            <p class="profile__security-desc">
              《<OLink color="primary">隐私声明</OLink>》与《<OLink color="primary">法律声明</OLink>》签署于2026年5月18日
            </p>
          </div>
        </div>
      </div>

      <!-- 注销账号 -->
      <div class="profile__account-group">
        <h3 class="profile__account-subtitle">注销账号</h3>
        <div class="profile__security-row">
          <div class="profile__security-info">
            <p class="profile__security-desc">永久删除账号和所有数据，请谨慎操作</p>
          </div>
          <OLink color="danger">注销</OLink>
        </div>
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
          <OButton variant="outline" color="primary" size="medium" round="pill"
            :disabled="emailDialog.countdown > 0" @click="sendEmailCode">
            {{ emailDialog.countdown > 0 ? `${emailDialog.countdown}s 后重发` : '发送验证码' }}
          </OButton>
        </div>
      </div>
      <p class="p-dialog-hint">验证码将发送至您填写的邮箱，有效期 10 分钟</p>
    </div>
    <template #footer>
      <div class="p-dialog-footer">
        <OButton variant="outline" color="primary" size="medium" round="pill" @click="emailDialog.visible = false">取消</OButton>
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
          <OButton variant="outline" color="primary" size="medium" round="pill"
            :disabled="phoneDialog.countdown > 0" @click="sendPhoneCode">
            {{ phoneDialog.countdown > 0 ? `${phoneDialog.countdown}s 后重发` : '发送验证码' }}
          </OButton>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="p-dialog-footer">
        <OButton variant="outline" color="primary" size="medium" round="pill" @click="phoneDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="danger" size="medium" round="pill" @click="confirmUnbindPhone">确认解绑</OButton>
      </div>
    </template>
  </ODialog>

  <!-- ══ 第三方账号绑定弹窗 ═══════════════════════════════════════════════════ -->
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
        <OButton variant="outline" color="primary" size="medium" round="pill" @click="thirdDialog.visible = false">取消</OButton>
        <OButton variant="solid" color="primary" size="medium" round="pill" @click="confirmBindThird">确认绑定</OButton>
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
  margin: 0 auto;

  // ── 区块通用 ──────────────────────────────────────────────────────────────
  &__section {
    background-color: #fff;
    border-radius: var(--o-radius_control-m);
    padding: var(--o-r-gap-6);
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

  // ── 个人信息行 ────────────────────────────────────────────────────────────
  &__info-rows {
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-5);
    margin-top: var(--o-r-gap-5);
  }

  &__info-row {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-4);
  }

  &__info-label {
    width: 100px;
    flex-shrink: 0;
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-1);
  }

  &__info-tip {
    color: var(--o-color-info4);
    display: inline-flex;
    align-items: center;
  }

  &__info-value {
    flex: 1;
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);

    &--muted { color: var(--o-color-info3); }
  }

  &__info-input {
    width: 360px;
  }

  // ── 用户头像 ──────────────────────────────────────────────────────────────
  &__avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: var(--o-color-primary4);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  // ── 保存按钮 ──────────────────────────────────────────────────────────────
  &__save-row {
    margin-top: var(--o-r-gap-6);
    padding-top: var(--o-r-gap-4);
  }

  // ── 账号设置列表样式 ─────────────────────────────────────────────────────
  &__account-group {
    margin-top: var(--o-r-gap-5);

    &:first-of-type { margin-top: var(--o-r-gap-4); }
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
    flex-shrink: 0;

    &--gitee { background-color: #fff0f0; }
    &--github { background-color: var(--o-color-fill3); }
    &--openatom { background-color: #e6f4ff; }
    &--atomgit { background-color: #fff0f0; }
  }

  &__account-label {
    width: 100px;
    flex-shrink: 0;
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-text1);
  }

  &__account-value {
    flex: 1;
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
  }

  // ── 账号安全行 ────────────────────────────────────────────────────────────
  &__security-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: var(--o-r-gap-4) 0;
    border-bottom: 1px solid var(--o-color-control4);
    gap: var(--o-r-gap-4);

    &:last-child { border-bottom: none; }
  }

  &__security-info {
    flex: 1;
  }

  &__security-title {
    margin: 0 0 var(--o-r-gap-1) 0;
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    font-weight: var(--o-font_weight-bold);
  }

  &__security-desc {
    margin: 0;
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
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

.p-dialog-code-row {
  display: flex;
  gap: var(--o-r-gap-3);
  align-items: center;
}

.p-dialog-hint {
  margin: 0;
  color: var(--o-color-info4);
  font-size: var(--o-r-font_size-tip2);
  line-height: var(--o-r-line_height-tip2);
}

.p-dialog-desc {
  margin: 0;
  color: var(--o-color-info2);
  font-size: var(--o-r-font_size-text1);
  line-height: var(--o-r-line_height-text1);
  strong { color: var(--o-color-info1); }
}

.p-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--o-r-gap-3);
}
</style>
