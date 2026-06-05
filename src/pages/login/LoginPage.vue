<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { OButton, OInput } from '@opensig/opendesign'
import { useAuth } from '../../composables/useAuth'
import { MOCK_USERS } from '../../mock/data'

const { login } = useAuth()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const codeForm = reactive({
  phone: '',
  code: '',
})

const isCodeValid = computed(() => codeForm.phone.trim() !== '' && codeForm.code.trim() !== '')

const handleLogin = async () => {
  loading.value = true
  await new Promise((r) => setTimeout(r, 800))
  const user = MOCK_USERS.find((u) => u.role === 'admin')
  if (user) {
    login(user)
    const redirect = (route.query.redirect as string) || '/projects'
    router.push(redirect)
  }
  loading.value = false
}

const getCode = () => {
  if (countdown.value > 0 || !codeForm.phone.trim()) return
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-card__site-name">openEuler</div>
      <div class="login-card__welcome">欢迎登录</div>

      <div class="login-card__form">
        <div class="login-card__field">
          <label class="login-card__label">手机号/邮箱地址</label>
          <OInput v-model="codeForm.phone" placeholder="请输入手机号或邮箱" size="large" clearable />
        </div>

        <div class="login-card__field">
          <label class="login-card__label">验证码</label>
          <div class="login-card__code-row">
            <OInput v-model="codeForm.code" placeholder="请输入验证码" size="large" clearable />
            <OButton
              variant="outline"
              color="primary"
              size="large"
              :disabled="countdown > 0 || !codeForm.phone.trim()"
              @click="getCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </OButton>
          </div>
        </div>

        <OButton
          variant="solid"
          color="primary"
          size="large"
          round="pill"
          class="login-card__submit"
          :loading="loading"
          :disabled="!isCodeValid"
          @click="handleLogin"
        >
          登录
        </OButton>
      </div>

      <div class="login-card__divider">
        <span class="login-card__divider-text">第三方账号登录</span>
      </div>

      <div class="login-card__social">
        <a class="login-card__social-link" href="https://github.com/login/oauth/authorize" target="_blank" rel="noopener">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.865 20.166 8.839 21.489C9.339 21.579 9.521 21.269 9.521 21.004C9.521 20.767 9.512 20.137 9.508 19.264C6.726 19.859 6.139 17.891 6.139 17.891C5.685 16.732 5.029 16.425 5.029 16.425C4.121 15.815 5.098 15.827 5.098 15.827C6.101 15.898 6.629 16.861 6.629 16.861C7.521 18.377 8.97 17.931 9.549 17.671C9.643 16.989 9.904 16.544 10.192 16.291C7.618 16.034 4.91 15.032 4.91 10.707C4.91 9.469 5.352 8.454 6.079 7.657C5.973 7.4 5.582 6.252 6.204 4.691C6.204 4.691 7.156 4.422 9.496 5.883C10.395 5.659 11.351 5.547 12.304 5.543C13.256 5.547 14.212 5.659 15.112 5.883C17.451 4.422 18.402 4.691 18.402 4.691C19.025 6.252 18.634 7.4 18.528 7.657C19.256 8.454 19.695 9.469 19.695 10.707C19.695 15.043 16.983 16.031 14.4 16.284C14.759 16.597 15.083 17.213 15.083 18.149C15.083 19.496 15.071 20.583 15.071 20.911C15.071 21.179 15.25 21.492 15.758 21.397C19.731 20.069 22.593 16.326 22.593 12C22.593 6.477 18.116 2 12.593 2L12 2Z" fill="currentColor"/></svg>
        </a>
        <a class="login-card__social-link" href="https://gitcode.com/oauth/authorize" target="_blank" rel="noopener">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.22-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.59 5 4.56 5 7.93 0 2.64-1.03 5.04-2.9 6.77z" fill="currentColor"/></svg>
        </a>
      </div>
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
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: var(--o-r-gap-8) var(--o-r-gap-6);
  background-color: var(--o-color-fill2);
  border-radius: var(--o-radius-m);
  box-shadow: var(--o-shadow-2);

  &__site-name {
    text-align: center;
    font-size: var(--o-r-font_size-h2);
    line-height: var(--o-r-line_height-h2);
    font-weight: var(--o-font_weight-bold);
    color: var(--o-color-primary1);
    letter-spacing: 1px;
    margin-bottom: var(--o-r-gap-2);
  }

  &__welcome {
    text-align: center;
    font-size: var(--o-r-font_size-h3);
    line-height: var(--o-r-line_height-h3);
    font-weight: var(--o-font_weight-medium);
    color: var(--o-color-info1);
    margin-bottom: var(--o-r-gap-1);
  }

  &__mode {
    text-align: center;
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    color: var(--o-color-info3);
    margin-bottom: var(--o-r-gap-6);
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
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    font-weight: var(--o-font_weight-medium);
    color: var(--o-color-info1);
  }

  &__code-row {
    display: flex;
    gap: var(--o-r-gap-3);

    .o-input {
      flex: 1;
    }
  }

  &__submit {
    width: 100%;
    height: var(--o-control_size-l);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
    font-weight: var(--o-font_weight-medium);
  }

  &__divider {
    position: relative;
    text-align: center;
    margin-top: var(--o-r-gap-7);

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      width: calc(50% - 72px);
      height: 1px;
      background-color: var(--o-color-control2);
    }

    &::before { left: 0; }
    &::after { right: 0; }
  }

  &__divider-text {
    display: inline-block;
    padding: 0 var(--o-r-gap-2);
    font-size: var(--o-r-font_size-tip1);
    line-height: var(--o-r-line_height-tip1);
    color: var(--o-color-info3);
    background-color: var(--o-color-fill2);
    position: relative;
    z-index: 1;
  }

  &__social {
    display: flex;
    justify-content: center;
    gap: var(--o-r-gap-5);
    margin-top: var(--o-r-gap-5);
  }

  &__social-link {
    width: var(--o-control_size-l);
    height: var(--o-control_size-l);
    border-radius: 50%;
    border: 1px solid var(--o-color-control1);
    background-color: var(--o-color-fill2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--o-color-info2);
    transition: all var(--o-duration-m1) var(--o-easing-standard);

    &:hover {
      border-color: var(--o-color-primary1);
      color: var(--o-color-primary1);
      box-shadow: var(--o-shadow-1);
      transform: translateY(-1px);
    }
  }
}
</style>