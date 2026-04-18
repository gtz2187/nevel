<template>
  <div v-if="project" class="entity-layout">
    <section class="card card-pad list-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">人物库</div>
        <button class="primary" @click="newCharacter">+ 新建人物</button>
      </div>

      <div class="row gap-8" style="margin-bottom: 10px;">
        <button :class="['ghost', { primary: viewMode === 'list' }]" @click="viewMode = 'list'">列表</button>
        <button :class="['ghost', { primary: viewMode === 'graph' }]" @click="viewMode = 'graph'">关系图</button>
      </div>

      <input v-model="keyword" placeholder="搜索人物" style="width:100%; margin-bottom: 10px" />

      <div class="grid-2" style="margin-bottom: 12px;">
        <select v-model="importanceFilter">
          <option value="">全部重要程度</option>
          <option>主角</option>
          <option>重要配角</option>
          <option>次要配角</option>
          <option>龙套</option>
        </select>
        <input v-model="factionFilter" placeholder="按阵营筛选" />
      </div>

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

      <div v-if="viewMode === 'list'">
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

        <div class="card card-pad" style="margin-bottom:12px;">
          <div class="row" style="justify-content:space-between; margin-bottom:8px;">
            <div class="title-sm">人际关系</div>
            <button class="ghost" @click="addRelationship">+ 新增关系</button>
          </div>
          <div v-if="!selectedDraft.relationships.length" class="muted">暂无关系，点击“新增关系”建立人物连接。</div>
          <div v-for="(relation, index) in selectedDraft.relationships" :key="relation.id" class="relation-row">
            <select v-model="relation.targetCharacterId">
              <option value="">选择对方人物</option>
              <option v-for="candidate in relationCandidates" :key="candidate.id" :value="candidate.id">{{ candidate.name }}</option>
            </select>
            <input :value="relation.types.join(', ')" placeholder="关系类型（逗号分隔）" @change="onRelationTypesChange($event, relation.id)" />
            <label class="row gap-8 muted">
              <input type="checkbox" :checked="!relation.directional" @change="toggleBidirectional(relation.id, $event)" />
              双向
            </label>
            <input v-model="relation.description" placeholder="关系描述" />
            <button class="danger" @click="removeRelation(index)">删除</button>
          </div>
        </div>

        <label class="field"><span class="muted">备注</span><textarea v-model="selectedDraft.notes" rows="4"></textarea></label>
      </div>

      <div v-else class="graph-wrap">
        <div class="muted" style="margin-bottom: 8px;">关系图（当前人物为中心，展示一度关系）</div>
        <svg :viewBox="`0 0 ${graphSize} ${graphSize}`" class="graph-svg">
          <line
            v-for="edge in graphEdges"
            :key="edge.id"
            :x1="edge.x1"
            :y1="edge.y1"
            :x2="edge.x2"
            :y2="edge.y2"
            :class="['edge', { dashed: edge.directional }]"
          />

          <g v-for="node in graphNodes" :key="node.id" @click="select(node.id)" class="node-g">
            <circle :cx="node.x" :cy="node.y" :r="node.id === selectedDraft.id ? 34 : 28" :class="['node', node.id === selectedDraft.id ? 'center' : 'leaf']" />
            <text :x="node.x" :y="node.y + 4" text-anchor="middle" class="node-label">{{ node.label }}</text>
          </g>
        </svg>
      </div>

      <ModuleAIAssistant
        module-name="人物管理"
        purpose="打磨人物设定、关系张力和人物弧线"
        placeholder="例如：帮我检查这个人物是否立体，并补 3 条反差细节"
        suggested-question="请检查当前人物档案是否存在扁平化问题，并补充可直接落地的优化建议。"
      />
    </section>

    <div v-else class="empty-state">请选择或创建一个人物</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { randomUUID } from '@/utils/uuid';
import type { CharacterProfile, CharacterRelationship, Importance } from '@shared/models';
import ModuleAIAssistant from './ModuleAIAssistant.vue';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const keyword = ref('');
const selectedId = ref<string | null>(null);
const selectedDraft = ref<CharacterProfile | null>(null);
const viewMode = ref<'list' | 'graph'>('list');
const importanceFilter = ref<Importance | ''>('');
const factionFilter = ref('');

watch(
  () => project.value?.characters,
  (value) => {
    if (!selectedId.value && value?.length) {
      select(value[0].id);
      return;
    }
    if (selectedId.value && value?.some((item) => item.id === selectedId.value)) {
      const next = value.find((item) => item.id === selectedId.value);
      if (next) selectedDraft.value = deepClone(next);
    }
  },
  { immediate: true }
);

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  const faction = factionFilter.value.trim().toLowerCase();
  return (project.value?.characters ?? []).filter((item) => {
    const matchKeyword = !q || [item.name, item.faction, item.occupation, item.race].some((field) => String(field ?? '').toLowerCase().includes(q));
    const matchImportance = !importanceFilter.value || item.importance === importanceFilter.value;
    const matchFaction = !faction || String(item.faction ?? '').toLowerCase().includes(faction);
    return matchKeyword && matchImportance && matchFaction;
  });
});

const selected = computed(() => project.value?.characters.find((character) => character.id === selectedId.value) ?? null);

const relationCandidates = computed(() =>
  (project.value?.characters ?? []).filter((item) => item.id !== selectedDraft.value?.id)
);

const graphSize = 560;
const graphNodes = computed(() => {
  if (!selectedDraft.value) return [] as Array<{ id: string; label: string; x: number; y: number }>;
  const centerX = graphSize / 2;
  const centerY = graphSize / 2;
  const related = selectedDraft.value.relationships
    .map((relation) => project.value?.characters.find((item) => item.id === relation.targetCharacterId))
    .filter((item): item is CharacterProfile => Boolean(item));

  const ring = related.map((item, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(related.length, 1);
    const radius = 190;
    return {
      id: item.id,
      label: item.name,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  });

  return [{ id: selectedDraft.value.id, label: selectedDraft.value.name, x: centerX, y: centerY }, ...ring];
});

const graphEdges = computed(() => {
  if (!selectedDraft.value) return [] as Array<{ id: string; x1: number; y1: number; x2: number; y2: number; directional: boolean }>;
  const center = graphNodes.value.find((node) => node.id === selectedDraft.value?.id);
  if (!center) return [];

  return selectedDraft.value.relationships
    .map((relation) => {
      const targetNode = graphNodes.value.find((node) => node.id === relation.targetCharacterId);
      if (!targetNode) return null;
      return {
        id: relation.id,
        x1: center.x,
        y1: center.y,
        x2: targetNode.x,
        y2: targetNode.y,
        directional: relation.directional
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
});

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function select(id: string) {
  selectedId.value = id;
  const item = project.value?.characters.find((character) => character.id === id);
  selectedDraft.value = item ? deepClone(item) : null;
}

function onTagsChange(event: Event) {
  if (!selectedDraft.value) return;
  const value = (event.target as HTMLInputElement).value;
  selectedDraft.value.personalityTags = value.split(',').map((item) => item.trim()).filter(Boolean);
}

function addRelationship() {
  if (!selectedDraft.value) return;
  const relation: CharacterRelationship = {
    id: randomUUID(),
    targetCharacterId: '',
    types: [],
    description: '',
    directional: true
  };
  selectedDraft.value.relationships.push(relation);
}

function removeRelation(index: number) {
  if (!selectedDraft.value) return;
  selectedDraft.value.relationships.splice(index, 1);
}

function onRelationTypesChange(event: Event, relationId: string) {
  if (!selectedDraft.value) return;
  const relation = selectedDraft.value.relationships.find((item) => item.id === relationId);
  if (!relation) return;
  const value = (event.target as HTMLInputElement).value;
  relation.types = value.split(',').map((item) => item.trim()).filter(Boolean);
}

function toggleBidirectional(relationId: string, event: Event) {
  if (!selectedDraft.value) return;
  const relation = selectedDraft.value.relationships.find((item) => item.id === relationId);
  if (!relation) return;
  const checked = (event.target as HTMLInputElement).checked;
  relation.directional = !checked;
}

async function save() {
  if (!selectedDraft.value) return;
  const cleaned = {
    ...selectedDraft.value,
    relationships: selectedDraft.value.relationships
      .filter((item) => item.targetCharacterId)
      .map((item) => ({
        ...item,
        types: item.types.filter(Boolean),
        description: item.description.trim()
      }))
  };
  await store.saveCharacter(cleaned);
  selectedDraft.value = deepClone(cleaned);
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
.relation-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto 1.6fr auto;
  gap: 8px;
  margin-bottom: 8px;
}
.graph-wrap {
  display: grid;
  align-content: start;
}
.graph-svg {
  width: 100%;
  height: auto;
  max-height: 72vh;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
}
.edge {
  stroke: rgba(255, 255, 255, 0.4);
  stroke-width: 2;
}
.edge.dashed {
  stroke-dasharray: 6;
}
.node {
  stroke-width: 2;
  cursor: pointer;
}
.node.center {
  fill: rgba(140, 128, 255, 0.6);
  stroke: rgba(255, 255, 255, 0.8);
}
.node.leaf {
  fill: rgba(255, 146, 214, 0.45);
  stroke: rgba(255, 255, 255, 0.5);
}
.node-label {
  font-size: 13px;
  fill: #ffffff;
  pointer-events: none;
}
@media (max-width: 1400px) {
  .relation-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 1200px) {
  .entity-layout { grid-template-columns: 1fr; }
}
</style>
