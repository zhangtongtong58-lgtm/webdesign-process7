<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { t } from '../i18n/zh'

const { currentUser, logout } = useAuth()
const router  = useRouter()
const route   = useRoute()

const navItems = computed(() => [
  { key: 'projects',  label: t('nav.projects'),  path: '/projects' },
  { key: 'patches',   label: t('nav.patches'),   path: '/patches' },
  { key: 'testcases', label: t('nav.testcases'), path: '/testcases' },
])

const activeKey = computed(() => {
  const p = route.path
  if (p.startsWith('/projects'))  return 'projects'
  if (p.startsWith('/patches'))   return 'patches'
  if (p.startsWith('/testcases')) return 'testcases'
  return 'projects'
})

const userInitial = computed(() => currentUser.value?.name?.charAt(0) ?? 'U')
</script>

<template>
  <div class="shell">

    <!--
      ONavigation PC 顶导（Light，Dark=off）
      规格：高 72px | 白色背景 | 毛玻璃阴影
      左侧：Logo区（间距 40px）+ 主导航菜单（间距 32px）
      右侧：用户头像
      激活菜单项：底部 2px 主色指示线
    -->
    <header class="shell__nav">
      <!-- 左侧：品牌 + 菜单 -->
      <div class="shell__nav-left">
        <!-- Logo：16px grid 图标 + 品牌名，对应 ONavigation Logo GROUP -->
        <div class="shell__logo">
          <svg class="shell__logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span class="shell__logo-name">{{ t('app.name') }}</span>
        </div>

        <!-- 主导航菜单：水平排列，间距 32px（规范值） -->
        <nav class="shell__menu">
          <button
            v-for="item in navItems"
            :key="item.key"
            class="shell__nav-item"
            :class="{ 'shell__nav-item--active': activeKey === item.key }"
            @click="router.push(item.path)"
          >{{ item.label }}</button>
        </nav>
      </div>

      <!-- 右侧：用户头像 -->
      <div class="shell__nav-right">
        <div
          class="shell__avatar"
          :title="currentUser?.name"
          @click="router.push('/profile')"
        >{{ userInitial }}</div>
      </div>
    </header>

    <!-- 页面内容区 -->
    <main class="shell__content">
      <router-view />
    </main>

  </div>
</template>

<style lang="scss" scoped>
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--o-color-fill1);

  // ── ONavigation PC 顶导 ─────────────────────────────────────────────────────
  // 规格：1920×72px，padding 0 216px（此处内部工具用 gap-8=48px）
  &__nav {
    flex-shrink: 0;
    height: 72px;
    // Light 模式：白色背景（spec: rgba(255,255,255,1)）
    background-color: rgba(255, 255, 255, 1);
    // 阴影：spec 精确值 0px 3px 9px 0px rgba(0,18,85,0.078)
    box-shadow: 0px 3px 9px 0px rgba(0, 18, 85, 0.078);
    backdrop-filter: blur(4.53px);
    -webkit-backdrop-filter: blur(4.53px);
    display: flex;
    align-items: stretch;   // 子项撑满高度，激活线才能到底部
    justify-content: space-between;
    padding: 0 var(--o-r-gap-8);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  // 左侧区域：Logo + 菜单，gap=40px（spec 值）
  &__nav-left {
    display: flex;
    align-items: center;
    gap: 40px;
  }

  // Logo 区：品牌图标 + 文字
  &__logo {
    display: flex;
    align-items: center;
    gap: var(--o-r-gap-2);
    cursor: pointer;
    user-select: none;
  }

  &__logo-icon {
    flex-shrink: 0;
    color: var(--o-color-primary1);
  }

  &__logo-name {
    // 品牌文字：color-info1，16px，600
    color: var(--o-color-info1);
    font-size: var(--o-r-font_size-text1);
    line-height: var(--o-r-line_height-text1);
    font-weight: 600;
    white-space: nowrap;
  }

  // 主导航菜单：水平，间距 32px（spec 值）
  &__menu {
    display: flex;
    align-items: stretch;
    gap: 32px;
    height: 100%;
  }

  // 菜单项：16px / 400 / 行高 24px（规范精确值）
  // 激活态：底部 2px 指示线（spec: Active 底部 2px 品牌蓝）
  &__nav-item {
    position: relative;
    display: flex;
    align-items: center;
    // 规范：menu item 高 48px，padding-bottom 24px 留激活线空间
    // 这里 height: 100%（=72px），激活线 absolute bottom:0
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    // 规范字体：16px / 400 / rgba(0,0,0,1)
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;
    color: rgba(0, 0, 0, 1);
    transition: color var(--o-duration-s) var(--o-easing-standard);

    &:hover {
      color: var(--o-color-primary1);
    }

    // 激活态：主色文字 + 底部 2px 指示线
    &--active {
      color: var(--o-color-primary1);
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background-color: var(--o-color-primary1);
        border-radius: 1px 1px 0 0;
      }
    }
  }

  // 右侧操作区：间距 20px（spec 值）
  &__nav-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  // 用户头像：32px 圆形，color-primary1 填充
  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--o-color-primary1);
    color: var(--o-color-white);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--o-r-font_size-tip2);
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    transition: opacity var(--o-duration-s) var(--o-easing-standard);

    &:hover { opacity: 0.85; }
  }

  // 内容区：占满剩余高度，纵向可滚动
  &__content {
    flex: 1;
    overflow-y: auto;
    padding: var(--o-r-gap-5);
    // 内容最大宽度对齐，保持可读性
    min-height: 0;
  }
}
</style>
