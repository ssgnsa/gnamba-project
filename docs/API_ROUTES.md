# Inventaire des routes API

Ce fichier liste toutes les occurrences de `/api` et `/api/v1` détectées dans `src/`.

- [src/lib/mediaUtils.ts](src/lib/mediaUtils.ts#L1)
  - [L1](src/lib/mediaUtils.ts#L1) import { apiClient } from "../api/client";
  - [L31](src/lib/mediaUtils.ts#L31) `/api/media/usage?media_id=${encodeURIComponent(mediaId)}`
  - [L56](src/lib/mediaUtils.ts#L56) `">("/api/media/usage", {`
  - [L106](src/lib/mediaUtils.ts#L106) `/api/media/usage/${encodeURIComponent(usageId)}`
  - [L124](src/lib/mediaUtils.ts#L124) `"/api/media/brand-assets",`
  - [L229](src/lib/mediaUtils.ts#L229) `/api/media/usage?entity_type=${encodeURIComponent(entityType)}&usage_type=${encodeURIComponent(usageType)}${entityId ? `&entity_id=${encodeURIComponent(entityId)}` : ""}`

- [src/lib/supabase.ts](src/lib/supabase.ts#L22)
  - [L22](src/lib/supabase.ts#L22) message d'erreur indiquant `src/api/client.ts` comme alternative

- [src/lib/**tests**/mediaUtils.test.ts](src/lib/__tests__/mediaUtils.test.ts#L5)
  - [L5](src/lib/__tests__/mediaUtils.test.ts#L5) vi.mock("../../api/client", ...)
  - [L13](src/lib/__tests__/mediaUtils.test.ts#L13) import { apiClient } from "../../api/client";
  - [L140](src/lib/__tests__/mediaUtils.test.ts#L140) "/api/media/usage?media_id=m1",

- [src/pages/Utilisateurs.tsx](src/pages/Utilisateurs.tsx#L22)
  - [L22](src/pages/Utilisateurs.tsx#L22) import { apiClient } from "../api/client";

- [src/pages/public/LoginPage.tsx](src/pages/public/LoginPage.tsx#L8)
  - [L8](src/pages/public/LoginPage.tsx#L8) import { apiClient } from "../../api/client";

- [src/lib/sentry.ts](src/lib/sentry.ts#L43)
  - [L43](src/lib/sentry.ts#L43) retourne `${url.origin}/api/${projectId}/envelope/?sentry_key=${publicKey}`

- [src/pages/public/ResetPasswordPage.tsx](src/pages/public/ResetPasswordPage.tsx#L66)
  - [L66](src/pages/public/ResetPasswordPage.tsx#L66) "/api/auth/reset-password",

- [src/api/client.settings.test.ts](src/api/client.settings.test.ts#L30)
  - [L30](src/api/client.settings.test.ts#L30) "http://localhost:8000/api/settings",

- [src/api/client.ts](src/api/client.ts#L110)
  - [L110](src/api/client.ts#L110) "/api/auth/login",
  - [L128](src/api/client.ts#L128) "/api/auth/me"
  - [L132](src/api/client.ts#L132) "/api/auth/refresh"
  - [L140](src/api/client.ts#L140) "/api/auth/logout"
  - [L150](src/api/client.ts#L150) "/api/users"
  - [L154](src/api/client.ts#L154) "/api/users" (POST)
  - [L161](src/api/client.ts#L161) `/api/users/${id}`
  - [L169](src/api/client.ts#L169) `/api/users/${id}`
  - [L180](src/api/client.ts#L180) "/api/settings"
  - [L186](src/api/client.ts#L186) "/api/settings"
  - [L199](src/api/client.ts#L199) "/api/site-content"
  - [L206](src/api/client.ts#L206) `/api/media${suffix}`
  - [L210](src/api/client.ts#L210) `/api/media/${id}`
  - [L230](src/api/client.ts#L230) "/api/media" (POST)
  - [L237](src/api/client.ts#L237) `/api/media/${id}` (PUT)
  - [L248](src/api/client.ts#L248) `/api/media/${id}` (DELETE)
  - [L252](src/api/client.ts#L252) `/api/media/${id}/restore`
  - [L259](src/api/client.ts#L259) `/api/media/${id}/purge`
  - [L269](src/api/client.ts#L269) `/api/media/${id}/replace`
  - [L278](src/api/client.ts#L278) "/api/media/brand-assets"

- [src/context/SiteContentContext.tsx](src/context/SiteContentContext.tsx#L9)
  - [L9](src/context/SiteContentContext.tsx#L9) import { apiClient } from "../api/client";

- [src/context/SettingsContext.tsx](src/context/SettingsContext.tsx#L10)
  - [L10](src/context/SettingsContext.tsx#L10) import { apiClient } from "../api/client";

- [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L15)
  - [L15](src/context/AuthContext.tsx#L15) import from "../services/api/client";

- [src/pages/Media.tsx](src/pages/Media.tsx#L20)
  - [L20](src/pages/Media.tsx#L20) import { apiClient } from "../api/client";

- [src/data/client.ts](src/data/client.ts#L6)
  - [L6](src/data/client.ts#L6) commentaire: autorisé via `src/api/client.ts`
  - [L9](src/data/client.ts#L9) import { apiClient } from "../api/client";
  - [L25](src/data/client.ts#L25) message d'erreur recommandant `src/api/client.ts`

- [src/services/api/client.ts](src/services/api/client.ts#L95)
  - [L95](src/services/api/client.ts#L95) "/api/v1/auth/login"
  - [L105](src/services/api/client.ts#L105) "/api/v1/auth/refresh"
  - [L111](src/services/api/client.ts#L111) "/api/v1/auth/me"
  - [L115](src/services/api/client.ts#L115) "/api/v1/auth/logout"
  - [L122](src/services/api/client.ts#L122) "/api/v1/users"
  - [L125](src/services/api/client.ts#L125) "/api/v1/users" (POST)

- [src/lib/ollama.ts](src/lib/ollama.ts#L105)
  - [L105](src/lib/ollama.ts#L105) fetch(`${this.baseUrl}/api/tags`)
  - [L129](src/lib/ollama.ts#L129) fetch(`${this.baseUrl}/api/tags`)
  - [L165](src/lib/ollama.ts#L165) fetch(`${this.baseUrl}/api/chat`)
  - [L207](src/lib/ollama.ts#L207) fetch(`${this.baseUrl}/api/chat`)
  - [L279](src/lib/ollama.ts#L279) fetch(`${this.baseUrl}/api/generate`)
  - [L312](src/lib/ollama.ts#L312) fetch(`${this.baseUrl}/api/embed`)

- [src/components/media/MediaUploader.tsx](src/components/media/MediaUploader.tsx#L4)
  - [L4](src/components/media/MediaUploader.tsx#L4) import { apiClient } from "../../api/client";

- [src/components/media/MediaDetailModal.tsx](src/components/media/MediaDetailModal.tsx#L16)
  - [L16](src/components/media/MediaDetailModal.tsx#L16) import { apiClient } from "../../api/client";

- [src/components/media/MediaPicker.tsx](src/components/media/MediaPicker.tsx#L4)
  - [L4](src/components/media/MediaPicker.tsx#L4) import { apiClient } from "../../api/client";

## Remarques

- Le code contient déjà `src/services/api/client.ts` qui utilise `/api/v1/*` — il faut normaliser toutes les autres références vers ce client.
- Prochaine action recommandée : remplacer tous les appels directs `"/api/..."` dans `src/api/client.ts` et autres modules par des appels à `src/services/api/client.ts` ou harmoniser les chemins sur `/api/v1`.

---

Généré automatiquement — réviser et valider avant modifications de masse.
