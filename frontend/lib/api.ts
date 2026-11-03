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

export const api = {
  get: <T,>(p: string) => request<T>(p),
  post: <T,>(p: string, body?: unknown) =>
    request<T>(p, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T,>(p: string, body?: unknown) =>
    request<T>(p, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  del: <T,>(p: string) => request<T>(p, { method: "DELETE" }),
};

// ───────── Tipos ─────────
export interface UserT { id: string; email: string; name: string; role: string; status: string; avatar_url?: string | null; }
export interface DiplomaCardT { id: string; title: string; slug: string; cover_url?: string | null; order: number; enrolled: boolean; }
export interface PhaseT { id: string; name: string; slug: string; description?: string | null; icon?: string | null; color?: string | null; order: number; diplomas: DiplomaCardT[]; }
export interface UniverseT { phases: PhaseT[]; sin_fase: DiplomaCardT[]; }
export interface DiplomaOutT { id: string; title: string; slug: string; cover_url?: string | null; order: number; }
export interface LessonLiteT { id: string; title: string; slug?: string | null; duration_seconds: number; order: number; completed: boolean; }
export interface ModuleOutT { id: string; title: string; description?: string | null; cover_url?: string | null; order: number; lessons: LessonLiteT[]; }
export interface DiplomaTeacherT { id: string; name: string; photo_url?: string | null; bio?: string | null; whatsapp?: string | null; }
export interface DiplomaDetailT {
  id: string; title: string; slug: string; description?: string | null; cover_url?: string | null;
  teacher?: DiplomaTeacherT | null;
  modules: ModuleOutT[]; total_lessons: number; completed_lessons: number; progress: number;
}
export interface LessonDetailT {
  id: string; title: string; videopress_url?: string | null; content?: string | null;
  duration_seconds: number; completed: boolean; diploma_id: string; module_id: string; diploma_slug?: string | null;
}
export interface TeacherT { id: string; name: string; bio?: string | null; photo_url?: string | null; whatsapp?: string | null; order?: number; status?: string; }
export interface LiveClassT { id: string; title: string; description?: string | null; videopress_url?: string | null; cover_url?: string | null; happened_at?: string | null; diploma_id?: string | null; phase_id?: string | null; status?: string; }
export interface FeedbackT { id: string; user_id: string; body: string; results?: string | null; rating?: number | null; image_url?: string | null; status: string; created_at: string; author_name?: string | null; }

// ───────── Tipos admin ─────────
export interface AdminDiplomaT { id: string; title: string; slug: string; description?: string | null; cover_url?: string | null; status: string; order: number; phase_id?: string | null; teacher_id?: string | null; badge_image_url?: string | null; }
export interface AdminModuleT { id: string; diploma_id: string; title: string; description?: string | null; cover_url?: string | null; order: number; status: string; }
export interface AdminLessonT { id: string; module_id: string; title: string; slug?: string | null; videopress_url?: string | null; content?: string | null; duration_seconds: number; order: number; status: string; materials?: unknown[] | null; }
export interface PhaseLiteT { id: string; name: string; slug: string; order: number; icon?: string | null; color?: string | null; description?: string | null; }
export interface EnrollmentT { id: string; user_id: string; diploma_id: string; expires_at?: string | null; }

export interface ScheduleT { id: string; title: string; description?: string | null; starts_at: string; ends_at?: string | null; diploma_id?: string | null; module_id?: string | null; live_url?: string | null; teacher_id?: string | null; }
export interface MyBadgeT { id: string; name: string; description?: string | null; icon?: string | null; image_url?: string | null; awarded_at?: string | null; diploma_title?: string | null; diploma_slug?: string | null; }


export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  let token: string | null = null;
  try { token = typeof window !== "undefined" ? localStorage.getItem("academia_token") : null; } catch { token = null; }
  const res = await fetch(`${API_URL}/api/admin/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    let detail = "No se pudo subir la imagen";
    try { const j = await res.json(); detail = j.detail || detail; } catch { /* ignore */ }
    throw new Error(detail);
  }
  const j = await res.json();
  return j.url as string;
}

export async function uploadImageUser(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  let token: string | null = null;
  try { token = typeof window !== "undefined" ? localStorage.getItem("academia_token") : null; } catch { token = null; }
  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    let detail = "No se pudo subir la imagen";
    try { const j = await res.json(); detail = j.detail || detail; } catch { /* ignore */ }
    throw new Error(detail);
  }
  const j = await res.json();
  return j.url as string;
}

export interface AnnouncementT { id: string; title: string; body: string; image_url?: string | null; status: string; starts_at: string; expires_at?: string | null; created_at: string; teacher_id?: string | null; teacher_name?: string | null; teacher_photo_url?: string | null; }
