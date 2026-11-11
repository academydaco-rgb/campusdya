export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8010";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem("academia_token"); } catch { return null; }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = "Ocurrió un error";
    try { const j = await res.json(); detail = j.detail || detail; } catch { /* ignore */ }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ── Caché de GET (en memoria) con TTL: navegar de ida y vuelta es instantáneo.
//    Se limpia tras cualquier mutación (post/put/del). No cachea tiempo real.
type CacheEntry = { ts: number; data: unknown };
const _getCache = new Map<string, CacheEntry>();
const _CACHE_TTL = 60_000;
const _NO_CACHE = /(me\/ping|online-users|unread_count|notifications|\/search)/;

function _clearCache() { _getCache.clear(); }

async function cachedGet<T>(p: string): Promise<T> {
  const can = typeof window !== "undefined" && !_NO_CACHE.test(p);
  if (can) {
    const hit = _getCache.get(p);
    if (hit && Date.now() - hit.ts < _CACHE_TTL) return hit.data as T;
  }
  const data = await request<T>(p);
  if (can) _getCache.set(p, { ts: Date.now(), data });
  return data;
}

export const api = {
  get: <T,>(p: string) => cachedGet<T>(p),
  post: <T,>(p: string, body?: unknown) => {
    _clearCache();
    return request<T>(p, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
  },
  put: <T,>(p: string, body?: unknown) => {
    _clearCache();
    return request<T>(p, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined });
  },
  del: <T,>(p: string) => {
    _clearCache();
    return request<T>(p, { method: "DELETE" });
  },
  clearCache: _clearCache,
};

// ───────── Tipos ─────────
export interface UserT { id: string; email: string; name: string; role: string; status: string; avatar_url?: string | null; bio?: string | null; whatsapp?: string | null; profile_type?: string | null; }
export interface DiplomaCardT { id: string; title: string; slug: string; cover_url?: string | null; order: number; enrolled: boolean; progress?: number | null; }
export interface PhaseT { id: string; name: string; slug: string; description?: string | null; icon?: string | null; color?: string | null; order: number; diplomas: DiplomaCardT[]; }
export interface UniverseT { phases: PhaseT[]; sin_fase: DiplomaCardT[]; }
export interface DiplomaOutT { id: string; title: string; slug: string; cover_url?: string | null; order: number; total_lessons?: number; completed_lessons?: number; progress?: number; }
export interface LessonLiteT { id: string; title: string; slug?: string | null; duration_seconds: number; order: number; completed: boolean; }
export interface ModuleOutT { id: string; title: string; description?: string | null; cover_url?: string | null; order: number; route?: string | null; lessons: LessonLiteT[]; }
export interface DiplomaTeacherT { id: string; name: string; photo_url?: string | null; bio?: string | null; whatsapp?: string | null; }
export interface DiplomaDetailT {
  id: string; title: string; slug: string; description?: string | null; cover_url?: string | null;
  teacher?: DiplomaTeacherT | null;
  hero_image_url?: string | null; intro_video_url?: string | null; badge_image_url?: string | null;
  has_routes?: boolean; chosen_route?: "A" | "B" | null; route_a_name?: string | null; route_b_name?: string | null;
  modules: ModuleOutT[]; total_lessons: number; completed_lessons: number; progress: number;
}
export interface LessonDetailT {
  id: string; title: string; videopress_url?: string | null; content?: string | null;
  duration_seconds: number; completed: boolean; diploma_id: string; module_id: string; diploma_slug?: string | null; materials?: { nombre: string; url: string }[] | null;
}
export interface TeacherT { id: string; name: string; bio?: string | null; photo_url?: string | null; whatsapp?: string | null; order?: number; status?: string; diplomas?: { title: string; slug: string; cover_url?: string | null }[] | null; }
export interface LiveClassT { id: string; title: string; description?: string | null; videopress_url?: string | null; cover_url?: string | null; happened_at?: string | null; diploma_id?: string | null; phase_id?: string | null; status?: string; }
export interface ToolT { id: string; title: string; image_url?: string | null; link_url?: string | null; link_label?: string | null; category?: string | null; order?: number; status?: string; }
export interface OnlineUserT { id: string; name: string; avatar_url?: string | null; }
export interface CommunityTopT { id: string; name: string; avatar_url?: string | null; count: number; }
export type DayRange = [string, string];
export interface AttentionCfgT { available: boolean; schedule?: Record<string, DayRange[]> | null; }
export interface CasoExitoT { id: string; title: string; description?: string | null; videopress_url?: string | null; external_url?: string | null; cover_url?: string | null; order?: number; status?: string; }
export interface ProviderT { id: string; title: string; description?: string | null; videopress_url?: string | null; cover_url?: string | null; whatsapp?: string | null; order?: number; status?: string; }
export interface FeedbackT { id: string; user_id: string; body: string; results?: string | null; rating?: number | null; image_url?: string | null; status: string; created_at: string; author_name?: string | null; author_avatar?: string | null; author_bio?: string | null; }

// ───────── Tipos admin ─────────
export interface AdminDiplomaT { id: string; title: string; slug: string; description?: string | null; cover_url?: string | null; status: string; order: number; phase_id?: string | null; teacher_id?: string | null; badge_image_url?: string | null; hero_image_url?: string | null; intro_video_url?: string | null; has_routes?: boolean; route_a_name?: string | null; route_b_name?: string | null; }
export interface AdminModuleT { id: string; diploma_id: string; title: string; description?: string | null; cover_url?: string | null; route?: string | null; order: number; status: string; }
export interface AdminLessonT { id: string; module_id: string; title: string; slug?: string | null; videopress_url?: string | null; content?: string | null; duration_seconds: number; order: number; status: string; materials?: unknown[] | null; }
export interface PhaseLiteT { id: string; name: string; slug: string; order: number; icon?: string | null; color?: string | null; description?: string | null; }
export interface EnrollmentT { id: string; user_id: string; diploma_id: string; expires_at?: string | null; }

export interface ScheduleT { id: string; title: string; description?: string | null; starts_at: string; ends_at?: string | null; diploma_id?: string | null; module_id?: string | null; live_url?: string | null; teacher_id?: string | null; }
export interface MyBadgeT { id: string; name: string; description?: string | null; icon?: string | null; image_url?: string | null; code?: string | null; awarded_at?: string | null; diploma_title?: string | null; diploma_slug?: string | null; }
export interface ContinueT { diploma_slug: string; diploma_title: string; lesson_id: string; lesson_title: string; progress: number; }
export interface InProgressT { diploma_slug: string; diploma_title: string; cover_url?: string | null; total_lessons: number; completed_lessons: number; progress: number; lesson_id?: string | null; lesson_title?: string | null; }


// Sube una imagen con reintentos automáticos si el servidor responde 5xx o hay
// fallo de red (el droplet a veces da 503 bajo carga). No reintenta errores 4xx.
async function uploadWithRetry(path: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  let token: string | null = null;
  try { token = typeof window !== "undefined" ? localStorage.getItem("academia_token") : null; } catch { token = null; }
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    let retryable = false;
    try {
      const res = await fetch(`${API_URL}${path}`, { method: "POST", headers, body: fd });
      if (res.ok) { const j = await res.json(); return j.url as string; }
      if (res.status >= 500) {
        retryable = true;
        lastErr = new Error("El servidor está ocupado. Reintentando…");
      } else {
        let detail = "No se pudo subir la imagen";
        try { const j = await res.json(); detail = j.detail || detail; } catch { /* ignore */ }
        throw new Error(detail); // 4xx: no reintentar
      }
    } catch (e) {
      if (e instanceof TypeError) {
        retryable = true;
        lastErr = new Error("Fallo de red al subir la imagen.");
      } else {
        throw e;
      }
    }
    if (!retryable) break;
    if (attempt < 3) await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
  }
  throw lastErr || new Error("No se pudo subir la imagen");
}

export async function uploadImage(file: File): Promise<string> {
  return uploadWithRetry("/api/admin/upload", file);
}

export async function uploadFile(file: File): Promise<{ url: string; name: string }> {
  const fd = new FormData();
  fd.append("file", file);
  let token: string | null = null;
  try { token = typeof window !== "undefined" ? localStorage.getItem("academia_token") : null; } catch { token = null; }
  const res = await fetch(`${API_URL}/api/admin/upload-file`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    let detail = "No se pudo subir el archivo";
    try { const j = await res.json(); detail = j.detail || detail; } catch { /* ignore */ }
    throw new Error(detail);
  }
  const j = await res.json();
  return { url: j.url as string, name: (j.name as string) || file.name };
}

export async function uploadImageUser(file: File): Promise<string> {
  return uploadWithRetry("/api/upload", file);
}

export interface AnnouncementT { id: string; title: string; body: string; image_url?: string | null; status: string; starts_at: string; expires_at?: string | null; created_at: string; teacher_id?: string | null; teacher_name?: string | null; teacher_photo_url?: string | null; }
