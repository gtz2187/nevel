<template>
  <li class="node">
    <div class="node-line">
      <div class="node-meta">
        <input v-model="local.title" class="title-input" @change="emitUpdate" />
        <div class="row gap-8 muted">
          <span class="badge">{{ local.type }}</span>
          <select v-model="local.status" @change="emitUpdate">
            <option>规划中</option>
            <option>写作中</option>
            <option>待修改</option>
            <option>已完成</option>
            <option>已废弃</option>
          </select>
          <input v-model.number="local.targetWords" type="number" class="word-input" @change="emitUpdate" />
          <span>字</span>
        </div>
      </div>
      <div class="node-actions">
        <button v-if="local.type !== 'section'" @click="$emit('add-child', { parentId: local.id, type: local.type === 'volume' ? 'chapter' : 'section' })">+ 子级</button>
        <button @click="$emit('move', { id: local.id, dir: -1 })">↑</button>
        <button @click="$emit('move', { id: local.id, dir: 1 })">↓</button>
        <button class="danger" @click="$emit('remove', local.id)">删除</button>
        <button v-if="local.type === 'chapter' || local.type === 'section'" class="primary" @click="$emit('open-chapter', local)">进入正文</button>
      </div>
    </div>

    <textarea v-model="local.summary" rows="2" placeholder="摘要" class="summary" @change="emitUpdate"></textarea>

    <ul v-if="local.children.length > 0" class="list-reset children">
      <OutlineNodeItem
        v-for="child in local.children"
        :key="child.id"
        :node="child"
        @add-child="$emit('add-child', $event)"
        @open-chapter="$emit('open-chapter', $event)"
        @update-node="$emit('update-node', $event)"
        @remove="$emit('remove', $event)"
        @move="$emit('move', $event)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { OutlineNode } from '@shared/models';

const props = defineProps<{ node: OutlineNode }>();
const emit = defineEmits<{
  (e: 'add-child', payload: { parentId: string; type: OutlineNode['type'] }): void;
  (e: 'open-chapter', node: OutlineNode): void;
  (e: 'update-node', node: OutlineNode): void;
  (e: 'remove', id: string): void;
  (e: 'move', payload: { id: string; dir: -1 | 1 }): void;
}>();

const local = reactive<OutlineNode>(JSON.parse(JSON.stringify(props.node)));

watch(
  () => props.node,
  (value) => Object.assign(local, JSON.parse(JSON.stringify(value))),
  { deep: true }
);

function emitUpdate() {
  emit('update-node', JSON.parse(JSON.stringify(local)));
}
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
  align-items: flex-start;
  gap: 12px;
}
.node-meta {
  flex: 1;
  display: grid;
  gap: 8px;
}
.title-input {
  font-size: 15px;
  font-weight: 700;
}
.word-input {
  width: 100px;
}
.summary {
  margin-top: 10px;
  width: 100%;
}
.node-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.children {
  margin-top: 12px;
  padding-left: 18px;
  border-left: 1px dashed rgba(255,255,255,0.12);
  display: grid;
  gap: 10px;
}
</style>
