<template>
  <li class="node">
    <div class="node-line">
      <div>
        <div class="title-sm">{{ node.title }}</div>
        <div class="muted">{{ node.type }} · {{ node.status }} · {{ node.targetWords }}字</div>
      </div>
      <div class="node-actions">
        <button v-if="node.type !== 'section'" @click="$emit('add-child', { parentId: node.id, type: node.type === 'volume' ? 'chapter' : 'section' })">+ 子级</button>
        <button v-if="node.type === 'chapter' || node.type === 'section'" class="primary" @click="$emit('open-chapter', node)">进入正文</button>
      </div>
    </div>
    <ul v-if="node.children.length > 0" class="list-reset children">
      <OutlineNodeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        @add-child="$emit('add-child', $event)"
        @open-chapter="$emit('open-chapter', $event)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import type { OutlineNode } from '@shared/models';

defineProps<{ node: OutlineNode }>();
defineEmits<{
  (e: 'add-child', payload: { parentId: string; type: OutlineNode['type'] }): void;
  (e: 'open-chapter', node: OutlineNode): void;
}>();
</script>

<style scoped>
.node {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255,255,255,0.04);
}
.node-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.node-actions {
  display: flex;
  gap: 8px;
}
.children {
  margin-top: 12px;
  padding-left: 18px;
  border-left: 1px dashed rgba(255,255,255,0.12);
  display: grid;
  gap: 10px;
}
</style>
