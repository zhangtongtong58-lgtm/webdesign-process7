<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { OButton, OSelect, OOption, OTag } from '@opensig/opendesign'
import { useAuth } from '../../composables/useAuth'
import { MOCK_USERS } from '../../mock/data'
import { t } from '../../i18n/zh'
const { login } = useAuth()
const router = useRouter()
const route = useRoute()

const form = reactive({ role: 'admin' as 'admin' | 'member' })
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''

  await new Promise((r) => setTimeout(r, 600))

  const user = MOCK_USERS.find((u) => u.role === form.role)
  if (user) {
    login(user)
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } else {
    errorMsg.value = t('login.error.invalidRole')
  }
  loading.value = false
}
</script>

<template>
  <div class="login-page">
    <div class="login-page__card">
      <div class="login-page__logo">
        <!-- 品牌图标：线性 SVG，color-primary1 -->
        <svg class="login-page__logo-svg" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <h1 class="login-page__title">{{ t('app.name') }}</h1>
      </div>

      <p class="login-page__subtitle">{{ t('login.subtitle') }}</p>

      <div class="login-page__form">
        <div class="login-page__field">
          <label class="login-page__label">{{ t('login.roleSelect') }}</label>
          <OSelect v-model="form.role" class="login-page__select">
            <OOption value="admin" :label="t('login.roleAdmin')" />
            <OOption value="member" :label="t('login.roleMember')" />
          </OSelect>
        </div>

        <div v-if="form.role === 'admin'" class="login-page__preview-card login-page__preview-card--admin">
          <OTag color="primary" size="medium">{{ t('role.admin') }}</OTag>
          <p class="login-page__preview-name">{{ t('login.previewAdmin') }}</p>
          <p class="login-page__preview-desc">{{ t('login.previewAdminDesc') }}</p>
        </div>

        <div v-else class="login-page__preview-card login-page__preview-card--member">
          <OTag color="info" size="medium">{{ t('role.member') }}</OTag>
          <p class="login-page__preview-name">{{ t('login.previewMember') }}</p>
          <p class="login-page__preview-desc">{{ t('login.previewMemberDesc') }}</p>
        </div>

        <p v-if="errorMsg" class="login-page__error">{{ errorMsg }}</p>

        <OButton
          variant="solid"
          color="primary"
          class="login-page__submit"
          :loading="loading"
          @click="handleLogin"
        >
          {{ t('login.enter') }}
        </OButton>
      </div>

      <p class="login-page__hint">{{ t('login.hint') }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--o-color-fill1);

  &__card {
    width: 100%;
    max-width: 440px;
    padding: var(--o-r-gap-8);
    background-color: var(--o-color-fill2);
    border-radius: var(--o-radius_control-l);
    box-shadow: var(--o-shadow-2);
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--o-r-gap-3);
    margin-bottom: var(--o-r-gap-4);
  }

  &__logo-svg {
    color: var(--o-color-primary1);
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    color: var(--o-color-primary1);
    font-size: var(--o-r-font_size-h2);
    line-height: var(--o-r-line_height-h2);
    font-weight: 700;
  }

  &__subtitle {
    text-align: center;
    margin: 0 0 var(--o-r-gap-7);
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-5);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--o-r-gap-2);
  }

  &__label {
    color: var(--o-color-info2);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
    font-weight: 500;
  }

  &__select {
    width: 100%;
  }

  &__preview-card {
    padding: var(--o-r-gap-4);
    border-radius: var(--o-radius_control-m);
    border: 1px solid var(--o-color-control1);

    &--admin {
      border-color: var(--o-color-primary1);
      background-color: var(--o-color-fill3);
    }

    &--member {
      background-color: var(--o-color-fill3);
    }
  }

  &__preview-name {
    margin: var(--o-r-gap-2) 0 var(--o-r-gap-1);
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
    font-weight: 600;
  }

  &__preview-desc {
    margin: 0;
    color: var(--o-color-info3);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
  }

  &__error {
    margin: 0;
    color: var(--o-color-danger1);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
  }

  &__submit {
    width: 100%;
  }

  &__hint {
    margin: var(--o-r-gap-5) 0 0;
    text-align: center;
    color: var(--o-color-info4);
    font-size: var(--o-r-font_size-text2);
    line-height: var(--o-r-line_height-text2);
  }
}
</style>
