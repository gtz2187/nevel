<template>
  <div v-if="project" class="entity-layout">
    <section class="card card-pad list-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">人物库</div>
        <button class="primary" @click="newCharacter">+ 新建人物</button>
      </div>
      <input v-model="keyword" placeholder="搜索人物" style="width:100%; margin-bottom: 12px" />
      <button
        v-for="item in filtered"
        :key="item.id"
        class="entity-item"
        :class="{ active: selected?.id === item.id }"
        @click="select(item.id)"
      >
        <div class="title-sm">{{ item.name }}</div>
        <div class="muted">{{ item.importance }} · {{ item.faction || '未设阵营' }}</div>
      </button>
    </section>

    <section v-if="selectedDraft" class="card card-pad detail-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">人物档案</div>
        <button class="primary" @click="save">保存人物</button>
      </div>

      <div class="grid-2">
        <label class="field"><span class="muted">姓名</span><input v-model="selectedDraft.name" /></label>
        <label class="field"><span class="muted">重要程度</span>
          <select v-model="selectedDraft.importance">
            <option>主角</option><option>重要配角</option><option>次要配角</option><option>龙套</option>
          </select>
        </label>
        <label class="field"><span class="muted">性别</span><input v-model="selectedDraft.gender" /></label>
        <label class="field"><span class="muted">年龄</span><input v-model="selectedDraft.age" /></label>
        <label class="field"><span class="muted">种族</span><input v-model="selectedDraft.race" /></label>
        <label class="field"><span class="muted">职业/身份</span><input v-model="selectedDraft.occupation" /></label>
        <label class="field"><span class="muted">阵营</span><input v-model="selectedDraft.faction" /></label>
        <label class="field"><span class="muted">性格标签（逗号分隔）</span><input :value="selectedDraft.personalityTags.join(', ')" @change="onTagsChange" /></label>
      </div>

      <label class="field"><span class="muted">外貌</span><textarea v-model="selectedDraft.appearance" rows="4"></textarea></label>
      <label class="field"><span class="muted">背景故事</span><textarea v-model="selectedDraft.background" rows="8"></textarea></label>
      <label class="field"><span class="muted">备注</span><textarea v-model="selectedDraft.notes" rows="4"></textarea></label>

      <div class="card card-pad">
        <div class="title-sm">关系描述</div>
        <div class="muted">这版先做基础数据录入与保存。复杂拓扑图与拖拽连线位于后续扩展位。</div>
      </div>
    </section>

    <div v-else class="empty-state">请选择或创建一个人物</div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { randomUUID } from '@/utils/uuid';
import type { CharacterProfile } from '@shared/models';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const keyword = ref('');
const selectedId = ref<string | null>(null);
const selectedDraft = ref<CharacterProfile | null>(null);

watch(
  () => project.value?.characters,
  (value) => {
    if (!selectedId.value && value?.length) {
      select(value[0].id);
    }
  },
  { immediate: true }
);

const filtered = computed(() =>
  (project.value?.characters ?? []).filter((item) => item.name.includes(keyword.value))
);

function select(id: string) {
  selectedId.value = id;
  const item = project.value?.characters.find((character) => character.id === id);
  selectedDraft.value = item ? JSON.parse(JSON.stringify(item)) : null;
}

function onTagsChange(event: Event) {
  if (!selectedDraft.value) return;
  const value = (event.target as HTMLInputElement).value;
  selectedDraft.value.personalityTags = value.split(',').map((item) => item.trim()).filter(Boolean);
}

async function save() {
  if (!selectedDraft.value) return;
  await store.saveCharacter(selectedDraft.value);
}

async function newCharacter() {
  if (!project.value) return;
  await store.createCharacter({
    id: randomUUID(),
    name: '未命名人物',
    gender: '未知',
    age: '',
    race: '',
    occupation: '',
    faction: '',
    importance: '次要配角',
    appearance: '',
    background: '',
    personalityTags: [],
    skills: [],
    relationships: [],
    notes: '',
    aliases: [],
    appearanceCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  if (store.currentProject?.characters.length) {
    select(store.currentProject.characters[store.currentProject.characters.length - 1].id);
  }
}
</script>

<style scoped>
.entity-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
}
.list-pane, .detail-pane { min-height: 72vh; }
.entity-item {
  width: 100%;
  text-align: left;
  margin-bottom: 8px;
  padding: 12px;
  border-radius: 14px;
}
.entity-item.active {
  background: rgba(140, 128, 255, 0.22);
}
.field {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}
@media (max-width: 1200px) {
  .entity-layout { grid-template-columns: 1fr; }
}
</style>
