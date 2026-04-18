<template>
  <div class="chrome glass">
    <div class="traffic">
      <button class="dot red" @click="close" aria-label="close"></button>
      <button class="dot yellow" @click="minimize" aria-label="minimize"></button>
      <button class="dot green" @click="maximize" aria-label="maximize"></button>
    </div>
    <div class="title">墨者</div>
    <div class="actions"><slot /></div>
  </div>
</template>

<script setup lang="ts">
async function close() {
  await window.mozheDesktop?.closeWindow();
}
async function minimize() {
  await window.mozheDesktop?.minimizeWindow();
}
async function maximize() {
  await window.mozheDesktop?.maximizeWindow();
}
</script>

<style scoped>
.chrome {
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  align-items: center;
  height: 54px;
  padding: 0 14px;
  border-radius: 20px;
  margin-bottom: 16px;
  -webkit-app-region: drag;
  border: 1px solid rgba(55, 128, 83, 0.22);
}
.traffic {
  display: flex;
  gap: 8px;
  align-items: center;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  padding: 0;
  min-width: 12px;
  -webkit-app-region: no-drag;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48);
}
.red { background: #ff5f57; }
.yellow { background: #febc2e; }
.green { background: #28c840; }
.title {
  text-align: center;
  color: #29553d;
  font-size: 13px;
  letter-spacing: 0.12em;
  font-weight: 600;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
