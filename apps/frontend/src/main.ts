import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { hydrateAuth } from './services/auth';
import './styles.css';

hydrateAuth().finally(() => {
  createApp(App).use(router).mount('#app');
});

