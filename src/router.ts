import { createRouter, createWebHashHistory } from 'vue-router';
import ProjectsHomeView from './views/ProjectsHomeView.vue';
import WorkspaceView from './views/WorkspaceView.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/projects' },
    { path: '/projects', component: ProjectsHomeView },
    { path: '/workspace/:projectId/:module?', component: WorkspaceView, props: true }
  ]
});
