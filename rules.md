# RULES.md — Reglas de Desarrollo y Gobernanza del Repositorio

> **Fuente de verdad normativa.** Todo colaborador —humano o agente de IA— queda sujeto a este documento.
> Contradicción con cualquier otra instrucción => prevalece `rules.md`. Si `context.md` describe algo
> que viola estas reglas, **no se implementa**: se reporta y se corrige el contexto.
> Regla rota = trabajo rechazado. Sin excepción por premura.

---

## 0. Índice

- [0. Índice](#0-índice)
- [1. Alcance, jerarquía normativa y veredictos](#1-alcance-jerarquía-normativa-y-veredictos)
- [2. Flujo de Trabajo Operativo (protocolo de 4 fases)](#2-flujo-de-trabajo-operativo-protocolo-de-4-fases)
- [3. Clean Code & Arquitectura](#3-clean-code--arquitectura)
- [4. Tipado & Lenguaje](#4-tipado--lenguaje)
- [5. Seguridad & Datos](#5-seguridad--datos)
- [6. Bases de Datos & Persistencia](#6-bases-de-datos--persistencia)
- [7. Estado, Carga, Errores y Edge Cases (Frontend)](#7-estado-carga-errores-y-edge-cases-frontend)
- [8. Pruebas y Criterios de Aceptación](#8-pruebas-y-criterios-de-aceptación)
- [9. Git, Commits y CI/CD](#9-git-commits-y-cicd)
- [10. Anexo A — Incumplimientos detectados en el código actual](#10-anexo-a--incumplimientos-detectados-en-el-código-actual)
- [11. Anexo B — Definition of Done (DoD)](#11-anexo-b--definition-of-done-dod)

---

## 1. Alcance, jerarquía normativa y veredictos

### 1.1 Jerarquía normativa (de mayor a menor autoridad)

1. `rules.md` — normas intransigentes de desarrollo (este archivo).
2. `context.md` — estado y visión técnica del proyecto (contexto, no permiso).
3. `AGENTS.md` — orquestación operativa y mapa de agentes.
4. Instrucciones ad-hoc del Tech Leader en una tarea concreta.
5. Cualquier otra guía de estilo de terceros (libs, frameworks).

Una instrucción ad-hoc **nunca** deroga una norma de este archivo. Si un agente recibe una orden que
viola `rules.md`, debe **detenerse y escalar al Tech Leader**, no ejecutarla.

### 1.2 Veredictos normativos

| Marcador | Significado | Consecuencia |
|---|---|---|
| `PROHIBIDO` | Absoluto. Causa de rechazo automático del cambio. | No se mergea. Se revierte o se corrige antes de continuar. |
| `OBLIGATORIO` | Condición necesaria de calidad/seguridad. | El cambio no pasa revisión sin cumplirlo. |
| `REQUERIDO` | Convención exigible cuando aplica al dominio. | Se exige salvo justificación documentada aprobada por TL. |
| `RECOMENDADO` | Buena práctica preferente. | No bloquea, pero genera observación en revisión. |

### 1.3 Agentes sujetos a esta norma

Tech Leader, Frontend Developer, QA Engineer y Git & DevOps Engineer (definidos en `AGENTS.md`),
además de cualquier colaborador humano. Las reglas se aplican **por rol** donde se indique;
donde no se indique, aplican a todos por igual.

---

## 2. Flujo de Trabajo Operativo (protocolo de 4 fases)

> Este protocolo es obligatorio para **toda** tarea de implementación, sin importar su tamaño aparente.
> Saltarse una fase o fusionar fases sin aprobación constituye incumplimiento.

### Fase 1 — Planificación
- Leer `context.md` y `rules.md` antes de tocar código.
- Redactar el **plan de ataque**: problema → causa raíz → solución propuesta → archivos afectados →
  riesgos → estrategia de pruebas.
- Identificar contratos (tipos/DTOs/API/DB) que el cambio toca y declararlos explícitamente.
- **Toda decisión de arquitectura se aprueba por el Tech Leader antes de escribir implementación.**

### Fase 2 — Modularidad atómica
- Dividir la entrega en **commits/unidades atómicas**: una unidad = un cambio coherente, compilable y
  reversible (concepto de "átomo").
- Cada átomo debe: compilar en aislamiento (`npm run typecheck`), no romper tests existentes y poder
  revertirse sin dejar estado inconsistente.
- PROHIBIDO: un solo commit que mezcle refactor + feature + fix + cambio de configuración.

### Fase 3 — Ámbito estricto
- PROHIBIDO ampliar el alcance de la tarea sin re-planificar y obtener aprobación.
- Prohibido "de paso": refactorizar código ajeno al átomo, renombrar símbolos no relacionados,
  "mejorar" estilos o formatear archivos enteros no tocados funcionalmente.
- Todo cambio fuera de ámbito se descarta o se convierte en tarea separada registrada en `context.md`
  (mapa de ruta / deuda técnica).

### Fase 4 — Validación / Confirmación
- Ejecutar la cadena de validación completa del Anexo B (DoD): lint, typecheck, tests, build.
- Autorevisar el diff contra `rules.md` línea por línea antes de declarar fin.
- Declarar resultado en el **formato de salida del rol** (ver `AGENTS.md`): qué se hizo, evidencia de
  validación, desviaciones, impacto.
- No se declara "terminado" si no se aporta **evidencia de ejecución** de cada comando de validación.

---

## 3. Clean Code & Arquitectura

### 3.1 SOLID (aplicado a React/TS por feature)
- **S — Responsabilidad única:** un módulo/componente/hook hace una cosa. Un componente que pinta y
  además orquesta estado global viola esta regla (separar *presentación* de *lógica/estado*).
- **O — Abierto/Cerrado:** extender comportamiento por composición o estrategia; PROHIBIDO modificar
  código estable para añadir casos; añadir casos debe ser aditivo (switch/union exhaustivo tipado).
- **L — Sustitución:** un contrato (interfaz/DTO) debe poder sustituirse por su implementación sin
  efectos laterales; los contratos no dependen de implementaciones.
- **I — Segregación:** las props/interfaces se definen **mínimas por consumidor**; no pasar objetos
  enteros cuando el componente usa 3 campos. PROHIBIDO `interface TodoProps { everything: ... }`.
- **D — Inversión:** depender de abstracciones propias del dominio (interfaces de repositorio/servicio),
  no de implementaciones concretas acopladas (p. ej., `fetch` directo dentro de un componente).

### 3.2 DRY con criterio (no copia barata)
- PROHIBIDO duplicar lógica de dominio, validación, defaults o utilidades. La duplicación se resuelve
  **extrayendo al punto único de verdad** (factory, util, hook o capa compartida).
- La extracción se hace **después de la segunda ocurrencia real**, no antes (regla "Rule of Three"):
  primero se generaliza por semántica de dominio, no por similitud de texto.
- `RECOMENDADO`: preferir composición sobre herencia; PROHIBIDO cadenas de herencia > 2 niveles.

### 3.3 KISS
- La solución más simple que cumple el contrato y pasa los tests es la correcta.
- PROHIBIDO: abstracciones especulativas, "engine" sin casos de uso, genéricos anidados sin necesidad,
  config innecesaria, dependencias nuevas sin justificación escrita en la PR.

### 3.4 Early Returns y flujo lineal
- OBLIGATORIO usar *early returns / guard clauses*: validar y salir antes de la lógica principal.
- PROHIBIDO anidamiento profundo (`if`/ternarios anidados > 2 niveles): extraer a funciones con nombre.
- PROHIBIDO `else` redundante tras un `return`; preferir ternarios solo cuando la expresión es corta y
  sin efectos secundarios.

### 3.5 Prohibiciones absolutas de higiene
- PROHIBIDO código muerto: exports sin consumidor, ramas inalcanzables, parámetros sin uso,
  comentarios que describen "lo que hace" en vez de "por qué" (el qué lo dice el código tipado).
- PROHIBIDO código comentado persistido en el árbol (`git` guarda historia; el comentario muerto no).
- PROHIBIDO duplicar imports de la misma ruta o importar desde barriles intermedios que causen ciclos.
- `console.log` residual: PROHIBIDO (usar utilidad de logging central si se necesita diagnóstico).
- OBLIGATORIO que el código compile y pase `noUnusedLocals`/`noUnusedParameters` (ya activos en tsconfig).

---

## 4. Tipado & Lenguaje

### 4.1 Tipado estricto
- El proyecto usa TypeScript en modo estricto (`strict: true`, `noUncheckedIndexedAccess`,
  `verbatimModuleSyntax`). Toda función declara **tipos explícitos en entradas y retornos**;
  PROHIBIDO apoyarse en inferencia para firmas públicas de módulo.
- PROHIBIDO: `any`, `as unknown as X`, dobles castings, `@ts-ignore`/`@ts-expect-error` (requieren
  justificación aprobada por TL y comentario con issue de seguimiento).
- `unknown` está permitido **solo** en bordes de confianza (parseo de red, `catch`) y siempre se
  estrecha con validación (Zod) antes de usarlo; PROHIBIDO cast directo sin validar.
- Indexación con `noUncheckedIndexedAccess` devuelve `T | undefined`: manejar el caso o usar acceso
  seguro; PROHIBIDO `!` (non-null assertion) salvo invariante demostrada con comentario `// invariant:`.

### 4.2 Contratos
- OBLIGATORIO: los contratos entre capas y con el backend se modelan con `interface`/`type` **readonly**
  en las fronteras y con **schema Zod** para todo lo que cruza un borde (red, storage, input de usuario).
- Regla de derivación: **el schema Zod es la fuente**; los tipos de runtime (DTO) se derivan con
  `z.infer`. Está prohibido declarar a mano un tipo que contradiga su schema.
- Los tipos de dominio puros (entidades) e interfaces de entrada/salida (DTOs) viven separados:
  `types/*.types.ts` (dominio) y `types/*.schema.ts` (bordes). PROHIBIDO mezclarlos en un archivo.
- PROHIBIDO `enum` de TypeScript en contratos compartidos; usar union types de string literals
  (preferible) o `as const`, y validarlos con `z.enum`.

### 4.3 Nombres y estructura
- Nombres en inglés para código (identificadores, archivos, tipos); **UI/mensajes al usuario en
  español** (convención actual del repo). PROHIBIDO mezclar idiomas dentro del mismo símbolo.
- Un tipo exportado de una feature no se reexporta como si fuera propio en otra feature (ver 3.5/10).

---

## 5. Seguridad & Datos

### 5.1 Validación y sanitización en bordes
- OBLIGATORIO validar con Zod **todo** input que entra por un borde: formularios (resolver RHF),
  respuesta de red, `localStorage`, `query params`, payload de eventos.
- PROHIBIDO confiar en datos recibidos: la validación de esquema es la única frontera de confianza.
- `RECOMENDADO`: transformaciones (trim, normalización de moneda/decimales, fechas) se declaran como
  `preprocess`/`transform` dentro del propio schema, no dispersas en los componentes.

### 5.2 Logs y datos sensibles
- PROHIBIDO loguear, imprimir o persistir datos sensibles: NIT/RUT, email, dirección, tokens,
  payloads completos de API, credenciales o secretos.
- PROHIBIDO commitear secretos, `.env`, `*.local`, keys. Los secretos viven en variables de entorno
  del runtime/CI y se referencian por nombre (p. ej., `import.meta.env.VITE_*`), nunca inline.
- `RECOMENDADO`: registrar solo referencias/IDs y códigos de error; si se necesita diagnóstico, usar
  redacción (masking).

### 5.3 Manejo centralizado de errores
- OBLIGATORIO un **manejo de errores tipado y centralizado** por feature (clases de error propias que
  extiendan `Error` con `code` y campos tipados), no `throw new Error('...')` dispersos con strings.
- En el borde de red, traducir respuestas HTTP a errores de dominio tipados (timeout, 4xx, 5xx, red)
  y mapearlos a estados UI conocidos.
- `RECOMENDADO` un ErrorBoundary global + estados de error locales por feature; PROHIBIDO mostrar el
  texto crudo de un error interno al usuario final.

### 5.4 Consumo responsable de recursos
- `PROHIBIDO` crear Object URLs sin revocar (`URL.revokeObjectURL`) en ciclo de vida adecuado
  (unmount/efecto); hoy ya existe utilidad en `invoice-pdf.service.ts`, úsala y extiéndela.
- `RECOMENDADO`: limpiar listeners, timers y suscripciones en `useEffect` cleanup.

---

## 6. Bases de Datos & Persistencia

> El repositorio es hoy **frontend puro** (sin backend ni DB). Las reglas de esta sección son
> vinculantes en cuanto exista capa de datos (backend, BFF, IndexedDB/localStorage estructurado).
> Hasta entonces no se diseñan migraciones ni queries "para cuando exista backend": eso es
> abstracción especulativa (KISS) y queda prohibido.

### 6.1 Modelado
- Normalización hasta la 3FN por defecto; denormalización solo por caso de lectura de alto volumen,
  aprobada por TL y documentada en `context.md`.
- Modelos de dinero: PROHIBIDO operar moneda como `number` en coma flotante para cálculos. Se define
  en `context.md` la estrategia (decimal/centavos/integer + schema de transform) **antes** de persistir.
  El frontend actual usa `number` con redondeo a 2 decimales: aceptado **solo** como capa de vista
  mientras no haya persistencia; cualquier persistencia nueva migra a la estrategia definida.
- IDs: UUID v4 generado en cliente (`crypto.randomUUID()`) para drafts; el backend es dueño de los IDs
  definitivos de entidades persistidas.

### 6.2 Mutaciones y transacciones
- OBLIGATORIO: toda mutación compuesta (multi-escritura, multi-tabla, multi-request) se envuelve en
  **transacción atómica** en el backend; si el medio no soporta transacciones, se diseña
  compensación/saga documentada.
- OBLIGATORIO declarar la operación por su semántica de negocio (`issue`, `cancel`) y respetar la
  máquina de estados de la entidad (`DRAFT→ISSUED→PAID | CANCELLED`); PROHIBIDO transiciones inválidas
  o actualizaciones que esquiven la máquina de estados.

### 6.3 Queries
- PROHIBIDO `SELECT *` / proyecciones sin lista de columnas explícita.
- PROHIBIDO problemas N+1: cargar colecciones anidadas exige `JOIN`/`INCLUDE`/batch planificado.
- `RECOMENDADO`: paginación en toda colección que pueda crecer; orden y filtros se expresan de forma
  tipada y sin interpolación de SQL crudo del usuario (parametrización obligatoria).

---

## 7. Estado, Carga, Errores y Edge Cases (Frontend)

- PROHIBIDO **hardcodear datos** de negocio en componentes (productos, tarifas, catálogos, seed data):
  viven en un contexto/servicio/capa de datos con su fuente declarada. El `SEED_PRODUCTS` actual es
  deuda conocida registrada en `context.md` y debe migrar a API/catálogo remoto.
- PROHIBIDO ocultar estados de asincronía: toda operación async declara y renderiza
  `pending | error | success` + vacío (empty state). Prohibido dejar botones sin `disabled` en pending.
- PROHIBIDO doble fuente de verdad para la misma pieza de estado (ver Anexo A, bug del `items` local en
  `InvoiceForm`). El estado se define en un único dueño y los demás lo consumen.
- OBLIGATORIO cubrir edge cases de UI: listas vacías, mínimos (no eliminar el último ítem de línea),
  límites (0..1 en tasas/descuentos), fechas inválidas (vencimiento < emisión), decimales, monedas.
- `RECOMENDADO` optimizar para Core Web Vitals: sin `layout shift` brusco en tablas/skeleton, sin
  trabajos pesados en el hilo principal (cálculos en `useMemo` sobre colecciones pequeñas está bien),
  lazy de vistas pesadas (visor PDF) cuando aplique.

---

## 8. Pruebas y Criterios de Aceptación

- OBLIGATORIO: una **feature no se da por buena sin pruebas** (unitarias de dominio + integración de
  borde + al menos smoke e2e del flujo crítico según el riesgo). El repo **no tiene test runner aún**:
  se incorpora Vitest (unit/integration) + Testing Library y se declara en `context.md` como decisión
  técnica pendiente antes de escribir la primera feature nueva.
- OBLIGATORIO: la **lógica de dominio pura** (p. ej., `invoiceCalculator.ts`) tendrá cobertura del 100%
  de ramas en cuanto exista runner; es el módulo de mayor valor de negocio y menor coste de testear.
- OBLIGATORIO: cada feature nueva define sus **criterios de aceptación** (Given/When/Then o checklist)
  ANTES de implementar; el QA los valida antes de aprobar.
- El QA es un **adversario**: buscará fallos lógicos, entradas maliciosas/malformadas, condiciones de
  carrera (doble submit), fuga de datos y regresiones. Sus hallazgos **bloquean** el merge.
- Prohibido simular que se probó: la evidencia de ejecución de tests es parte del DoD.

---

## 9. Git, Commits y CI/CD

### 9.1 Estrategia de ramas y política de commit+push automático
- Modelo **Trunk-based simplificado**: `main` siempre desplegable. Ramas `feat/<slug>` con vida corta
  (< 2 días de trabajo) y PR obligatoria para features complejas; en el flujo actual de un solo
  desarrollador las funcionalidades validadas aterrizan en `main` vía integración automática.
- **OBLIGATORIO — integración automática**: el agente Git & DevOps **commitea y hace push con cada
  funcionalidad creada y validada** (DoD aprobado), **sin esperar petición explícita del usuario**.
  Secuencia: higiene del diff → commits convencionales atómicos → push al branch activo → reporte.
  Esta regla es obligatoria en toda la cadena de orquestación (ver `AGENTS.md` §3).
- El push automático se ejecuta SOLO si el cambio cumple el DoD (Anexo B) y no contiene secretos ni
  artefactos; si el push exige `--force`/rebase/resolución manual de conflictos, el agente se detiene
  y escala al usuario. PROHIBIDO forzar el remoto o reescribir historia compartida.
- Los agentes solo **crean ramas nuevas o abren PR** cuando el usuario lo solicita explícitamente.
- PROHIBIDO push de secretos, artefactos de build (`dist`), `node_modules`, `*.tsbuildinfo`
  (ya en `.gitignore`; mantenerlo).

### 9.2 Commits (Conventional Commits)
- Formato obligatorio: `tipo(ámbito): descripción` — tipos `feat|fix|refactor|test|docs|chore|build|ci|perf|revert`.
  - `feat(invoicing): validar vencimiento posterior a emisión`
- PROHIBIDO commits vacíos, mensajes genéricos ("cambios", "fix", "update"), ni commits que mezclen
  tipos. Un commit = un átomo (Fase 2).

### 9.3 Validaciones y CI/CD
- En cuanto exista CI: OBLIGATORIO pipeline que ejecute `lint → typecheck → test → build` y bloquee
  el merge ante cualquier fallo. Sin CI, los agentes ejecutan la misma cadena localmente como DoD.
- `RECOMENDADO`: `lint-staged` + `husky` (pre-commit: lint+typecheck de archivos staged) — es deuda de
  infraestructura pendiente registrada en `context.md`.
- Despliegues: sin intervención manual insegura; el artefacto se genera por build reproducible y el
  deploy se dispara por CI sobre `main` (o preview por PR). Variables por entorno, nunca en repo.

---

## 10. Anexo A — Incumplimientos detectados en el código actual

> Registro vivo de deuda que los agentes deben respetar (no agravar) y que el roadmap de `context.md`
> debe cerrar. Referencias verificadas a fecha de escaneo.

| # | Severidad | Deuda | Evidencia | Regla violada |
|---|---|---|---|---|
| D1 | ALTA | **Bug de doble fuente de verdad**: los ítems se editan en `useState` local de `InvoiceForm` pero el submit usa los `items` internos de react-hook-form → la factura creada no refleja las líneas editadas/agregadas | `InvoiceForm.tsx:17,26-29` vs `useInvoiceForm.ts:41-45` | §7 doble fuente de verdad |
| D2 | MEDIA | Duplicación de defaults de borrador vacío (2 definiciones divergentes de draft/item vacío) | `InvoiceDraftContext.tsx:12-22`, `useInvoiceForm.ts:9-29`, `InvoiceItemTable.tsx:29-42` | §3.2 DRY |
| D3 | MEDIA | Acoplamiento cross-feature: `products` importa tipos y utilidades desde `invoicing` (enums de dominio, `formatCurrency`) | `products/types/product.types.ts:1`, `products/hooks/useProductForm.ts:5,45`, `products/components/ProductList.tsx:2` | §3.1/S + §4.3 (kernel compartido ausente) |
| D4 | MEDIA | Dinero como `number` en coma flotante en el dominio persistible | `types/*.types.ts`, `domain/invoiceCalculator.ts` | §6.1 |
| D5 | MEDIA | `SEED_PRODUCTS` hardcodeado como datos de negocio en estado | `ProductCatalogContext.tsx:12-43` | §7 no hardcodear |
| D6 | ALTA | Sin capa de test (ni runner, ni unit/integration/e2e) pese a dominio crítico fiscal | repo completo | §8 |
| D7 | MEDIA | Sin ESLint config ni dependencia `eslint` instalada aunque `npm run lint` existe | `package.json:10`, `devDependencies` | §9.3 / DoD |
| D8 | MEDIA | Errores de red como `Error` genérico con texto crudo del servidor sin tipar ni mapear | `services/invoice.api.ts:22-24` | §5.3 |
| D9 | BAJA | `npm run build` llama a `tsc -b` sin referencia project → comprueba correcto estado de `tsconfig.tsbuildinfo`; revisar si `tsc -b` requiere `tsconfig.node.json` para Vite 5 | `tsconfig.json`, `vite.config.ts` | DoD |
| D10 | BAJA | Doble definición de enums duplicados en schemas (`currencyEnum`, `taxCategoryEnum`) replicados entre features | `invoicing/types/invoice.schema.ts:3-4`, `products/types/product.schema.ts:3-4` | §3.2 DRY |

**Tratamiento de esta tabla:** ningún agente debe *agravar* D1–D10; al tocar una zona afectada se
propone el cierre de la deuda como tarea separada (Fase 3: ámbito estricto). El Tech Leader actualiza
la tabla y el estado de cada ítem en `context.md`.

---

## 11. Anexo B — Definition of Done (DoD)

Una tarea **solo** está terminada si cumple TODO esto, con evidencia:

- [ ] Planificación aprobada (Fase 1) cuando tocó arquitectura o contratos.
- [ ] Commits atómicos, Conventional Commits, sin mezcla de tipos (Fase 2).
- [ ] Sin cambios fuera de ámbito (Fase 3).
- [ ] `npm run typecheck` pasa sin errores.
- [ ] `npm run lint` pasa (una vez exista config ESLint; mientras tanto, revisión manual de §3–§4).
- [ ] Tests nuevos (si aplica) y suite existente en verde (cuando exista runner).
- [ ] `npm run build` produce el bundle sin errores.
- [ ] Autorevisión del diff contra `rules.md`: cero violaciones de `PROHIBIDO`/`OBLIGATORIO`.
- [ ] Edge cases y estados carga/error/vacío cubiertos (si toca UI).
- [ ] Sin datos sensibles ni secretos en el diff; `.env`/`*.local` sin trackear.
- [ ] Resultado reportado en el formato de salida del rol (qué / evidencia / desviaciones / impacto).
