// LAYER: Frontend (Vue Application Bootstrap)
// This file initializes the Vue 3 application instance and mounts it to the DOM.

import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

// Create and mount the Vue application
const app = createApp(App);
app.mount('#app');
