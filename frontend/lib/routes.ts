import type { ModuleOutT } from "@/lib/api";

export type RouteKey = "A" | "B";
export interface LabeledModule { module: ModuleOutT; label: string; route: RouteKey | null; colorIdx: number; }
export type Segment =
  | { kind: "common"; item: LabeledModule }
  | { kind: "fork"; key: string; A: LabeledModule[]; B: LabeledModule[] };

/** Agrupa los módulos: los comunes van en fila y cada tramo seguido de módulos A/B forma una bifurcación. */
export function buildSegments(modules: ModuleOutT[], hasRoutes: boolean): Segment[] {
  const segs: Segment[] = [];
  let n = 0, a = 0, b = 0;
  for (const m of modules) {
    const r = hasRoutes && (m.route === "A" || m.route === "B") ? (m.route as RouteKey) : null;
    if (!r) {
      n += 1;
      segs.push({ kind: "common", item: { module: m, label: String(n).padStart(2, "0"), route: null, colorIdx: (n - 1) % 4 } });
      continue;
    }
    let last = segs[segs.length - 1];
    if (!last || last.kind !== "fork") {
      last = { kind: "fork", key: m.id, A: [], B: [] };
      segs.push(last);
    }
    if (r === "A") { a += 1; last.A.push({ module: m, label: `A${a}`, route: "A", colorIdx: 0 }); }
    else { b += 1; last.B.push({ module: m, label: `B${b}`, route: "B", colorIdx: 1 }); }
  }
  return segs;
}

/** Módulos que recorre un estudiante: los comunes + una sola ruta (para anterior / siguiente). */
export function pathModules(modules: ModuleOutT[], hasRoutes: boolean, route: RouteKey): ModuleOutT[] {
  if (!hasRoutes) return modules;
  return modules.filter((m) => m.route !== (route === "A" ? "B" : "A"));
}
