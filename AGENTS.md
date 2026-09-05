# AGENTS.md — Orquestación Operativa del Entorno Multi-Agente

> Documento de **orquestación**, no normativo. Jerarquía: `rules.md` (reglas) → `context.md`
> (estado/visión) → `AGENTS.md` (cómo se orquestan los roles). Todo agente lee `rules.md` y `context.md`
> al inicio de cada tarea; si un dato de `context.md` viola `rules.md`, prevalece la regla.

---

## 1. Modelo de colaboración

Cuatro roles especializados viven en `.opencode/agent/` y se invocan por **delegación** desde la sesión
principal (orquestador/usuario) o encadenados entre sí:

| Agente | Archivo | Función | Aporta | Rechaza |
|---|---|---|---|---|
| **Tech Leader** | `.opencode/agent/tech-leader.md` | Arquitectura y gobernanza | Contratos, decisiones, plan de deuda | Diseños que violan `rules.md`/`context.md` |
| **Frontend Developer** | `.opencode/agent/frontend-developer.md` | Implementación UI/estado | Código atómico tipado, estados UI | Hardcoding, tipos inseguros, doble fuente de verdad |
| **QA Engineer** | `.opencode/agent/qa-engineer.md` | Calidad adversarial | Tests, hallazgos, veredicto | Features sin pruebas/edge cases o con bugs ALTO+ |
| **Git & DevOps** | `.opencode/agent/git-devops.md` | Integridad de repo y CI | Revisión de diffs, pipelines, hygiene | Commits no convencionales, secretos, `main` roto |

Cadena de aprobación típica de una feature:

```
Usuaria/o ─▶ Tech Leader (diseño/contrato)
              └─▶ Frontend Developer (átomos) ─▶ QA (veredicto) ─▶ Git & DevOps (integración) ─▶ main
                    ◀── rechazo con causa ───────────┘
```

Un agente solo entrega a su siguiente eslabón si su salida cumple el DoD del Anexo B de `rules.md`.

## 2. Protocolo de ejecución obligatorio (4 fases)

Definido en `rules.md` §2. Resumen operativo:

1. **Planificación**: leer `context.md` + `rules.md`; declarar problema → causa → solución → archivos →
   riesgos → tests. Diseño aprobado por Tech Leader si toca arquitectura/contratos.
2. **Modularidad atómica**: una unidad de trabajo = un commit coherente, compilable y reversible.
3. **Ámbito estricto**: prohibido ampliar alcance o refactorizar "de paso". Fuera de ámbito = tarea nueva.
4. **Validación/Confirmación**: `lint → typecheck → tests → build` con evidencia y salida en el formato
   del rol (definido en cada agente). No se declara fin sin evidencia.

## 3. Reglas de encadenamiento y escalado

- **Integración automática (OBLIGATORIA)**: el agente Git & DevOps **commitea y hace push con cada
  funcionalidad creada y validada**, sin esperar petición explícita del usuario (regla normativa:
  `rules.md` §9.1). El push va al branch activo y solo se detiene si exige `--force`/rebase manual.
  La **creación de ramas nuevas y de PR** sigue requiriendo petición explícita del usuario.
- **Un solo dueño por pieza de estado**: si dos agentes tocan el mismo estado, el Tech Leader asigna el
  dueño antes de empezar (hoy: bug D1 en `items` del borrador).
- **Handoff con contexto**: quien entrega incluye siempre el *formato de salida* de su rol; quien recibe
  continúa desde ahí, sin re-explorar lo ya validado.
- **Escalada**: ante conflicto entre reglas, duda de contrato o hallazgo que bloquea, el agente escala al
  Tech Leader (que a su vez reporta al usuario con opciones). Ningún agente resuelve en silencio una
  ambigüedad de producto o seguridad.
- **Regla de no agravar deuda**: al tocar una zona con deuda ABIERTA (D1–D10, `context.md` §6.2), el
  agente lo declara; si la deuda bloquea la tarea, primero se planifica su cierre (§6.4 `context.md`).

## 4. Mapas de trabajo típicos

| Petición | Orquestación sugerida |
|---|---|
| "Refactor de items del borrador" | Frontend (D1) → QA (regresiones + tests) → Git & DevOps (commit/PR) |
| "Definir contrato del API de facturas" | Tech Leader (especificación) → QA (criterios de aceptación) → Git & DevOps (mock/env) |
| "Instalar ESLint y hooks" | Git & DevOps (config) → Tech Leader (reglas a activar) → Frontend (auto-fix) |
| "Escribir tests del cálculo fiscal" | QA (Vitest + cobertura) → Frontend (fix si aparece) → Git & DevOps (CI) |
| "Decidir backend/DB" | Tech Leader (ADR-lite en `context.md` §6.4) → usuarios (decisión) → plan de ruta |

## 5. Comandos de validación vigentes

Ejecutar siempre desde la raíz del repo (antes de cualquier merge):

```bash
npm run typecheck   # tsc -b --noEmit (estricto)
npm run build       # tsc -b && vite build
npm run lint        # pendiente: eslint no instalado/configurado (D7) — reportar, no ignorar
```

> Sin test runner aún (D6): el QA declara la carencia y compensa con revisión estática adversarial hasta
> incorporar Vitest. Cualquier configuración nueva se registra en `context.md`.
