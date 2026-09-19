---
name: technical-documentation-sync
description: Mantiene docs/technical-inventory.md sincronizado con el código. Usar OBLIGATORIAMENTE cuando se desarrolle, refactorice o elimine un endpoint, servicio, mutación de base de datos, DTO/schema Zod, controller/guard, entidad de persistencia o caso de uso del dominio. Deriva criterios de aceptación Given-When-Then cuando no existan y los publica en el mismo cambio atómico que el código.
---

# Skill — Sincronización Atómica de Documentación Técnica

## Principio normativo

El código y `docs/technical-inventory.md` son **una sola unidad atómica**. Un cambio de contrato,
flujo, persistencia o caso de uso que no actualice el inventario en el mismo commit **no cumple el
DoD** (extiende `rules.md` Anexo B). Prohibido actualizar el documento en un commit posterior.

## Trigger de activación (cualquiera de estos)

1. Alta, modificación o borrado de un **endpoint/RPC/evento**.
2. Alta, modificación o borrado de un **caso de uso de servicio** (`services/`, `domain/`).
3. Cambio en **DTOs/schemas Zod**, validaciones, enums, guardas de autorización o guards de ruta.
4. Cambio en **mutaciones/queries/transacciones**, constraints, migraciones o entidades de persistencia.
5. Cambio en la **máquina de estados** o en reglas de negocio del dominio fiscal.
6. Alta/borrado de un **módulo o feature** (`src/features/<feature>/`).

Si ninguna se cumple (estilos, copy de UI, tests puros), NO se toca el inventario.

## Workflow obligatorio

### Paso 1 — Análisis de impacto (determinístico)

Enumerar los archivos modificados y clasificarlos sin ambigüedad:

| Clase | Rutas | Qué extraer |
|---|---|---|
| DTO/Schema | `features/**/types/*.schema.ts`, `*.types.ts` | Campos, tipos, regex, refines, rangos, mensajes de error |
| Controller/Entrypoint | `features/**/components/*Form.tsx`, handlers, routers, guards | Verbo/ruta o evento, payload de entrada, handler invocado |
| Service/Orquestación | `features/**/hooks/*`, `services/*.ts` | Orquestación, estados async, ramas condicionales |
| Lógica pura | `features/**/domain/*.ts`, `utils/*.ts` | Fórmulas, redondeo, invariantes, ramas `if` |
| Persistencia | `services/*.api.ts`, migraciones, repositorios | Tablas/colecciones, transacciones, constraints, queries |
| Estado | `features/**/state/*.tsx` | Dueño del estado, mutadores, fuente de verdad |

### Paso 2 — Derivación de criterios de aceptación (si no existen)

Si el caso de uso **no** tiene especificación formal, redactar los criterios Given-When-Then técnicos
**inferidos exclusivamente de**:
- las restricciones del DTO/schema (→ HTTP 400),
- las ramas condicionales de la lógica pura y del servicio (→ éxito 200/201 o estados alternos),
- las guardas de autorización (→ 401/403),
- la máquina de estados y constraints de persistencia (→ 404/409/500),
- el manejo de concurrencia/errores (doble submit, conflicto de versión).

Formato obligatorio por caso de uso:

```
GIVEN <precondición de estado/persistencia>
WHEN  <acción sobre el entrypoint con entrada concreta>
THEN  <efecto observable + código de estado + mutación de persistencia>
```

Regla: cada `refine`, `min`, `max`, `regex`, `positive`, `nonnegative` y cada rama `return`/`throw`
del servicio DEBE tener al menos un criterio Given-When-Then asociado. Si un flujo carece de
entrypoint HTTP, usar el handler/evento real como `WHEN` y documentar el contrato REST objetivo como
criterio diferido.

### Paso 3 — Actualización atómica del inventario

Modificar `docs/technical-inventory.md` en el MISMO commit que el código, tocando solo las secciones
afectadas:
- §B módulo: descripción técnica, entrypoint, contratos (DTO entrada/salida), efectos/persistencia.
- Criterios de aceptación (añadir/editar los Given-When-Then derivados).
- Si cambia un contrato REST objetivo, actualizar la tabla de endpoints.
- Registrar la fecha y el commit de referencia en los metadatos del documento.

Prohibido reescribir secciones no afectadas (Fase 3 — ámbito estricto, `rules.md`).

### Paso 4 — Verificación de coherencia (bloqueante)

Antes de declarar fin, validar:
1. **Sin entidades de persistencia en contratos públicos**: los DTOs de entrada/salida no exponen
   entidades/ORM directamente; se mapean a tipos de contrato.
2. **Retornos estrictamente tipados**: ninguna firma pública devuelve `any`/`unknown` sin estrechar
   (Zod en bordes de red, `rules.md` §4.1).
3. **Sin doble fuente de verdad** declarada sin deuda registrada.
4. **Máquina de estados** respetada en el flujo documentado.
5. **Documento ↔ código**: cada entrypoint listado existe en el código y cada símbolo citado existe.

Si alguna verificación falla, el cambio se rechaza (no se mergea) y se escala al Tech Leader con
evidencia `archivo:línea`.

## Criterio de terminado del skill

- [ ] Archivos modificados clasificados en el Paso 1.
- [ ] Criterios Given-When-Then añadidos para todo contrato/rama tocada.
- [ ] `docs/technical-inventory.md` actualizado en el mismo commit.
- [ ] Verificación de coherencia (Paso 4) aprobada.
- [ ] Fecha + commit de referencia actualizados en el inventario.
