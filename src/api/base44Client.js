// KKD Music — Client API Base44
// Connexion au vrai backend Base44 (base de données, auth, fonctions, intégrations)
import { createClient } from '@base44/sdk';

export const base44 = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID,
  serverUrl: import.meta.env.VITE_BASE44_BACKEND_URL || 'https://base44.app',
});