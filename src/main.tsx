import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initStorageShield } from './services/storageShield';
import { initAppSyncService } from './services/appSyncService';

// 1. Inicializar el Escudo de Almacenamiento Local (Protección Absoluta e Inviolabilidad)
initStorageShield();

// 2. Inicializar el motor de Actualizaciones Centralizadas Automáticas en tiempo real (Firebase)
initAppSyncService();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
