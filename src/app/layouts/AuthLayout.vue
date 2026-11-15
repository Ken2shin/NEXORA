<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ShieldCheck, Zap, TrendingUp, Heart } from 'lucide-vue-next'
</script>

<template>
  <div class="auth-page-container">
    <header class="auth-top-bar">
      <div class="top-bar-inner">
        <div class="brand-left">
          <img src="/brand/logo.svg" alt="NEXORA" class="top-logo" />
        </div>
        <div class="slogan-center">
          <h2 class="hero-slogan">Tu plataforma de servicios, <span>más cerca de ti.</span></h2>
        </div>
        <div class="badges-right">
          <div class="feature-badge">
            <ShieldCheck :size="20" class="badge-icon" />
            <span>Seguro y confiable</span>
          </div>
          <div class="feature-badge">
            <Zap :size="20" class="badge-icon" />
            <span>Rápido y eficiente</span>
          </div>
          <div class="feature-badge">
            <TrendingUp :size="20" class="badge-icon" />
            <span>Gestión inteligente</span>
          </div>
          <div class="feature-badge">
            <Heart :size="20" class="badge-icon" />
            <span>Una mejor experiencia</span>
          </div>
        </div>
      </div>
    </header>

    <main class="auth-stage">
      <div class="stage-bg-image">
        <img src="/images/auth/login-bg.jpg" alt="Edificio empresarial NEXORA" class="bg-photo" />
        <div class="bg-gradient-tint"></div>
      </div>

      <div class="auth-card-wrapper">
        <RouterView />
      </div>
    </main>

    <footer class="auth-bottom-bar">
      <span>NEXORA © 2025 · Todos los derechos reservados.</span>
    </footer>
  </div>
</template>

<style scoped>
.auth-page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-app);
}

.auth-top-bar {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 16px 40px;
  position: relative;
  z-index: 20;
  box-shadow: 0 2px 10px rgba(8, 123, 250, 0.04);
}

.top-bar-inner {
  max-width: 1480px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.top-logo {
  height: 52px;
  width: auto;
}

.slogan-center {
  flex: 1;
  text-align: center;
}

.hero-slogan {
  font-size: 23px;
  font-weight: 800;
  color: var(--color-blue-title);
  letter-spacing: -0.4px;
  white-space: nowrap;
}

.hero-slogan span {
  color: var(--color-primary);
}

.badges-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.feature-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.badge-icon {
  color: var(--color-primary);
}

.auth-stage {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px 24px;
  min-height: calc(100vh - 130px);
}

.stage-bg-image {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 1;
}

.bg-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: saturate(1.1) brightness(0.95);
}

.bg-gradient-tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(8, 123, 250, 0.25) 0%, rgba(23, 54, 108, 0.45) 100%);
}

.auth-card-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 500px;
}

.auth-bottom-bar {
  padding: 16px 24px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  position: relative;
  z-index: 20;
}

@media (max-width: 1280px) {
  .hero-slogan {
    font-size: 20px;
  }

  .badges-right {
    gap: 12px;
  }

  .feature-badge {
    font-size: 12.5px;
  }
}

@media (max-width: 1024px) {
  .badges-right {
    display: none;
  }

  .slogan-center {
    text-align: right;
  }
}

@media (max-width: 768px) {
  .auth-top-bar {
    padding: 12px 20px;
  }

  .top-bar-inner {
    flex-direction: column;
    gap: 10px;
  }

  .top-logo {
    height: 44px;
  }

  .slogan-center {
    text-align: center;
  }

  .hero-slogan {
    font-size: 17px;
    white-space: normal;
  }

  .auth-stage {
    padding: 24px 16px;
  }
}
</style>