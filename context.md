# CONTEXT.md — Estado y Visión Técnica del Proyecto

> **Documento vivo.** Describe *qué es* el proyecto, su arquitectura, sus contratos y *dónde está*.
> No es normativo: las reglas viven en `rules.md`. Su guardián es el **Tech Leader**, que lo actualiza
> al cerrar cada hito, al cambiar un contrato o al registrar deuda técnica.
> Marcar siempre fecha y commit de referencia en cada actualización.

---

## 1. Metadatos del documento

| Campo | Valor |
|---|---|
| Última actualización | 2026-09-05 |
| Commit de referencia | `2062add` (Initial commit) |
| Guardián | Tech Leader |
| Estado general | `MOCKUP_FRONTEND` — frontend funcional con datos en memoria; backend/DB pendientes |

---

## 2. Visión general del producto y stack tecnológico

### 2.1 Producto
SPA de **facturación digital** ("Invoicing · Facturación Digital") que permite componer una factura
(cabecera emisor/cliente + líneas con impuestos y descuentos), previsualizarla, emitirla, descargar su
PDF y administrar un catálogo de productos. Orientado a régimen con IVA (estados exento/no gravable/gravado).

- Público objetivo: emisores (empresas) y su operación de facturación.
- Idioma de negocio actual: español (UI y mensajes); identificadores en inglés.
- Código: `invoicing`, versión `0.1.0`, paquete privado.

### 2.2 Stack actual (verificado en `package.json`/`tsconfig.json`)
| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| Frontend | React (SPA) | 19.x | `react-dom` 19 |
| Build/dev | Vite | 5.4.x | plugin-react; SPA en `index.html` |
| Lenguaje | TypeScript | 5.6.x | `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `noUnusedLocals/Parameters` |
| Estilos | Tailwind CSS | 3.4.x | config `tailwind.config.ts` + `postcss.config.js` |
| Formularios | react-hook-form + `@hookform/resolvers/zod` | 7.53 / 3.9 | resolver Zod, validación `onBlur` |
| Validación | Zod | 3.23 | schemas = fuente de tipos DTO |
| Data fetching/cache | @tanstack/react-query | 5.59 | mutaciones de facturas; sin backend real aún |
| **Backend** | — | — | **Pendiente de definir** (API en `/api` o `VITE_INVOICING_API_URL`) |
| **Base de datos** | — | — | **Pendiente de definir** |
| **Infraestructura** | — | — | **Pendiente de definir** (deploy, dominio, CDN) |
| Calidad | — | — | Sin ESLint, sin test runner, sin CI (deuda D6–D9) |

### 2.3 Variables de entorno
| Variable | Default | Uso |
|---|---|---|
| `VITE_INVOICING_API_URL` | `/api` | Base URL del API de facturas (ver `services/invoice.api.ts:7`) |

> No existe `.env.example`: crear uno al añadir la primera variable nueva y versionarlo.

---

## 3. Mapa de dominios/módulos y arquitectura

### 3.1 Arquitectura de alto nivel
```
┌─ SPA React ─────────────────────────────────────────────────────┐
│ App (ProductCatalogProvider)                                    │
│  └─ InvoiceForm                                                 │
│      ├─ InvoiceHeaderForm       (emisor/cliente/fechas/divisa)  │
│      ├─ ProductManager          (catálogo)                      │
│      ├─ InvoiceItemTable        (líneas + cálculo en vivo)      │
│      ├─ InvoiceSummary / PdfViewer / PrintModal / StatusBadge   │
├─ features/invoicing  ── dominio de facturación (corazón fiscal) │
├─ features/products   ── catálogo de productos                   │
└─ (futuro) shared kernel + capa de servicios reales / backend    │
```

### 3.2 Descomposición por features (estructura física `src/features/`)
| Feature | Responsabilidad | Carpetas |
|---|---|---|
| `invoicing` | Composición, cálculo y ciclo de vida de facturas; emisión/cancelación; PDF | `components`, `domain`, `hooks`, `services`, `state`, `types`, `utils`, `index.ts` |
| `products` | Catálogo de productos; alta desde formulario; selección en líneas | `components`, `hooks`, `state`, `types`, `index.ts` |

**Capas dentro de una feature (convención de `invoicing`):**
| Capa | Contenido | Regla |
|---|---|---|
| `types/*.types.ts` | Entidades de dominio e interfaces (`readonly`) | Sin lógica |
| `types/*.schema.ts` | Schemas Zod; DTOs por `z.infer` | Fuente de verdad de bordes |
| `domain/` | Lógica pura, funciones sin efectos (`invoiceCalculator`) | 100% testeable, sin React |
| `services/` | I/O: API REST, blobs PDF | Nunca importa React |
| `state/` | Contextos de estado (borrador, catálogo) | Un solo dueño por estado |
| `hooks/` | Orquestación React (RHF, react-query, memo) | Puente entre UI y dominio/servicios |
| `components/` | Presentación | Sin lógica de negocio |
| `utils/` | Utilidades puras reutilizables (`format`, `buildInvoice`) | Sin efectos |
| `index.ts` | Barril público de la feature | API de exportación de la feature |

### 3.3 Reglas de dependencia (arquitectura)
- Flujo de dependencia permitido: `components → hooks → state/services/domain → types`.
- PROHIBIDO que una feature importe internas de otra (`products` importa de `invoicing` hoy: deuda D3).
  Los elementos realmente compartidos (enums `CurrencyCode`, `TaxCategory`, `formatCurrency`) migran a
  un **kernel compartido** (ej. `src/shared/` o `src/features/_shared/`) cuando se cierre D3.
- El dominio (`domain/`, `utils/`, `types/`) **nunca** importa React ni react-hook-form ni react-query.

### 3.4 Mapa de dependencias críticas del código
| Consumidor | Proveedor | Nota |
|---|---|---|
| `products` (types/hooks/UI) | `invoicing` (enums + `formatCurrency`) | Deuda D3: extraer a shared |
| `invoicing/components/InvoiceItemTable` | `products` (tipo `Product`) | acoplamiento UI→UI entre features; evaluar contrato DTO |

---

## 4. Modelado de datos y contratos clave

### 4.1 Modelo de dominio (estado actual)
```text
Issuer { id, legalName, taxId, address, email }
Customer{ id, legalName, taxId, address, email }
InvoiceHeader { issuer, customer, issueDate(YYYY-MM-DD), dueDate, correlationCode, currency }
InvoiceItem   { id, productId?, description, quantity, unitPrice, discountRate[0..1],
                taxRate[0..1], taxCategory }
Invoice       { id, header, items[], status, createdAt, updatedAt }
InvoiceDraft  { header, items[] }            // forma pre-persistencia (UI)
Product       { id, name, description, sku, unitPrice, taxRate[0..1], taxCategory, currency }
```

### 4.2 Enumeraciones (dominio fiscal — fuente única pendiente de kernel compartido)
| Enum | Valores |
|---|---|
| `InvoiceStatus` | `DRAFT`, `ISSUED`, `CANCELLED`, `PAID` |
| `TaxCategory` | `VAT` (gravado), `EXEMPT` (exento), `NON_TAXABLE` (no gravable) |
| `CurrencyCode` | `USD`, `EUR`, `COP` |

**Máquina de estados de la factura:** `DRAFT → ISSUED → (PAID | CANCELLED)`.
Transiciones inválidas prohibidas (§6.2 rules). Semántica hoy:
- `issue` → `ISSUED`; `cancel` → `CANCELLED` (endpoints REST `/invoices/:id/issue|cancel`, PATCH).

### 4.3 Reglas de cálculo fiscal (verificadas en `domain/invoiceCalculator.ts`)
- Por línea: `gross = qty × price`; `discount = gross × discountRate`;
  `net = gross − discount`; **solo `VAT` genera base imponible y cuota**;
  `taxAmount = round2(net × taxRate)`; `lineTotal = round2(net + taxAmount)`.
- Totales: subtotal, descuento total, base, cuota total y **desglose por (taxCategory, taxRate)**.
- Redondeo: `Math.round((x + EPSILON) * 100) / 100` (2 decimales).
- Invariante (schema): `EXEMPT`/`NON_TAXABLE` ⇒ `taxRate === 0`. `dueDate >= issueDate`. ≥1 línea.

### 4.4 Contratos REST (contrato objetivo; backend pendiente)
| Método | Ruta | Entrada | Salida |
|---|---|---|---|
| POST | `/invoices` | `InvoiceDraft` | `InvoiceDTO` |
| GET | `/invoices` | — | `InvoiceDTO[]` |
| GET | `/invoices/:id` | — | `InvoiceDTO` |
| PATCH | `/invoices/:id/issue` | — | `InvoiceDTO` |
| PATCH | `/invoices/:id/cancel` | — | `InvoiceDTO` |
| GET | `/invoices/:id/pdf` | `Accept: application/pdf` | `Blob` |

Fuente real: `invoice.api.ts`. **El API no existe aún**: toda llamada hoy falla; el estado de "éxito"
es simulado por el flujo UI. Decisión de arquitectura: definir contrato + backend o mock service worker.

### 4.5 Decisiones técnicas pendientes (open questions)
| Decisión | Opciones | Impacto | Dueño |
|---|---|---|---|
| Modelado de dinero en persistencia | integer centavos / decimal string / librería | Regla §6.1 | Tech Leader |
| Backend | Node+Nest/Fastify, BFF, serverless | Contratos §4.4 | Tech Leader |
| Catálogo remoto | API real vs MSW vs IndexedDB | Cierra D5 | Tech Leader + Frontend |
| Test runner | Vitest + Testing Library (unit/integration) + Playwright (e2e) | Cierra D6 | QA + Tech Leader |
| Lint/format | ESLint 9 flat config + Prettier + husky/lint-staged | Cierra D7 | Git & DevOps |

---

## 5. Dependencias críticas y servicios de terceros

| Dependencia | Crítica para | Riesgo/Nota |
|---|---|---|
| `@tanstack/react-query` | caché y mutaciones de facturas | Al no existir backend, toda mutación falla; no enmascarar el error |
| `react-hook-form` + `zod` | integridad del borrador | Contrato de UI↔dominio: no duplicar schemas |
| `Intl.NumberFormat` (`es-CO`) | formato de moneda | Formateadores cacheados por divisa en `utils/format.ts` |
| `crypto.randomUUID()` | IDs de drafts/líneas | Requiere contexto seguro (https/localhost) |
| Backend `/api` | persistencia real | **Servicio inexistente** → no desplegable como producto real |
| Visor/PDF | generación PDF (blob) | Hoy solo descarga/visor de blob; generación real es backend |

---

## 6. Estado actual del desarrollo y mapa de rutas técnico

### 6.1 Estado por área
| Área | Estado | Comentario |
|---|---|---|
| Formulario de factura (cabecera) | Funcional (mock) | Validación onBlur; ver bug D1 en ítems |
| Cálculo de impuestos/descuentos | **Completado (dominio puro)** | `invoiceCalculator.ts` sin tests aún |
| Catálogo de productos | Funcional (en memoria) | `SEED_PRODUCTS`; sin persistencia (D5) |
| Flujo emitir/previsualizar/PDF | Parcial (mock) | Preview local + descarga de blob; API inexistente |
| Backend / DB / infraestructura | No iniciado | Decisiones §4.5 |
| Calidad (lint/tests/CI) | No iniciado | Deudas D6–D9 |

### 6.2 Registro de deuda técnica (ver detalle y evidencia en `rules.md` Anexo A)
| ID | Deuda | Estado |
|---|---|---|
| D1 | Doble fuente de verdad en `items` (bug: líneas editadas no se persisten en submit) | **ABIERTA — prioridad 1** |
| D2 | Defaults de draft/item duplicados entre context, hook y tabla | ABIERTA |
| D3 | Acoplamiento cross-feature `products → invoicing` (sin kernel compartido) | ABIERTA |
| D4 | Dinero como `number` en coma flotante | ABIERTA |
| D5 | Catálogo `SEED_PRODUCTS` hardcodeado | ABIERTA |
| D6 | Sin test runner ni suite | ABIERTA |
| D7 | ESLint sin instalar/configurar pese a script `lint` | ABIERTA |
| D8 | Errores de red genéricos sin tipar | ABIERTA |
| D9 | Revisar cadena `tsc -b` / tsconfig para Vite | ABIERTA |
| D10 | Enums duplicados en schemas de ambas features | ABIERTA |

### 6.3 Mapa de ruta técnico (propuesta, orden sugerido)
1. **Cerrar D1** (bug de items) — refactor a única fuente de verdad (form + `watch`) con tests.
2. **Cerrar D6/D7** — incorporar Vitest+Testing Library y ESLint flat config; habilitar DoD real.
3. **Cerrar D2/D10** — factories de draft/item + enums únicos en kernel compartido.
4. **Cerrar D3** — extraer `shared/` (enums, `formatCurrency`, tipos base) y revertir imports.
5. **Decidir §4.5** (backend, dinero, catálogo remoto) y **cerrar D5/D8**.
6. Habilitar CI/CD (§9.3 rules) y desplegar preview por PR.

### 6.4 Criterio de entrada para nueva feature
- No iniciar implementación si el área que toca tiene una deuda ABIERTA que la afecta: primero cerrar
  la deuda o registrar excepción aprobada por Tech Leader.
- Registrar en esta sección toda decisión técnica tomada (ADR-lite): fecha, decisión, motivo, dueño.
