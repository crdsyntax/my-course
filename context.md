# CONTEXT.md — Estado y Visión Técnica del Proyecto

> **Documento vivo y principal fuente de contexto.** Describe *qué es* el proyecto, su arquitectura,
> sus contratos, sus reglas de negocio y *dónde está* en cada momento. El **Tech Leader lo lee
> obligatoriamente en cada petición** antes de decidir (ver `.opencode/agent/tech-leader.md`).
> No es normativo: las reglas viven en `rules.md`. Si un dato de aquí viola `rules.md`, prevalece la
> regla. Guardián: Tech Leader. Marcar fecha y commit de referencia en cada actualización.

---

## 1. Metadatos del documento

| Campo | Valor |
|---|---|
| Última actualización | 2026-09-05 |
| Commit de referencia | `95346a2` (`docs(governance): enforce automatic commit and push per feature`) |
| Guardián | Tech Leader |
| Estado general | `MOCKUP_FRONTEND` — frontend funcional con datos en memoria; backend/DB pendientes |
| Repositorio | `github.com/crdsyntax/my-course` · branch `main` (trunk-based, integración automática) |

---

## 2. Visión general del producto y stack tecnológico

### 2.1 Producto
SPA de **facturación digital** ("Invoicing · Facturación Digital"): compone una factura (cabecera
emisor/cliente + líneas con impuestos y descuentos), la previsualiza, emite, descarga/visualiza su PDF
y administra un catálogo de productos. Orientada a régimen con IVA (gravado/exento/no gravable).

- **Público objetivo:** emisores (empresas) y su operación de facturación.
- **Alcance actual (demo/mock):** composición local + cálculo fiscal + preview/print. **Fuera de
  alcance hoy:** persistencia real, emisión electrónica ante autoridad fiscal, correlativos oficiales.
- **Idioma:** UI/mensajes en español; identificadores/código en inglés.
- **Código:** `invoicing` · versión `0.1.0` · paquete privado.

### 2.2 Stack actual (verificado en `package.json`/`tsconfig.json`)
| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| Frontend | React (SPA) | 19.x | `react-dom` 19; bootstrap en `main.tsx` con StrictMode |
| Build/dev | Vite | 5.4.x | plugin-react; SPA en `index.html` |
| Lenguaje | TypeScript | 5.6.x | `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`, `moduleDetection: force` |
| Estilos | Tailwind CSS | 3.4.x | `tailwind.config.ts` + `postcss.config.js`; reglas `@media print` en `index.css` |
| Formularios | react-hook-form + `@hookform/resolvers/zod` | 7.53 / 3.9 | resolver Zod, validación `mode: 'onBlur'` |
| Validación | Zod | 3.23 | schemas = fuente de tipos DTO (`z.infer`) |
| Data fetching/cache | @tanstack/react-query | 5.59 | `QueryClientProvider` global; mutaciones de facturas |
| **Backend** | — | — | **Pendiente** (API en `/api` o `VITE_INVOICING_API_URL`) |
| **Base de datos** | — | — | **Pendiente** |
| **Infraestructura** | — | — | **Pendiente** (deploy, dominio, CDN) |
| Calidad | — | — | Sin ESLint, sin test runner, sin CI (deudas D6–D9) |

### 2.3 Variables de entorno
| Variable | Default | Uso |
|---|---|---|
| `VITE_INVOICING_API_URL` | `/api` | Base URL del API de facturas (`services/invoice.api.ts:7`) |

> No existe `.env.example`: crearlo al añadir la primera variable y versionarlo. `.env` tampoco está
> en `.gitignore` (solo `*.local`) — añadirlo cuando exista `.env.example`.

---

## 3. Mapa de dominios, arquitectura e inventario de código

### 3.1 Arquitectura de alto nivel
```
main.tsx ─ QueryClientProvider ─ App (ProductCatalogProvider)
                                   └─ InvoiceForm
                                       ├─ InvoiceHeaderForm   (correlativo/divisa/fechas/cliente)
                                       ├─ ProductManager      (catálogo: form + list)
                                       ├─ InvoiceItemTable    (líneas + cálculo en vivo)
                                       ├─ InvoiceSummary      (totales + desglose IVA)
                                       ├─ InvoicePdfViewer    (visor de blob PDF)
                                       └─ InvoicePrintModal   (portal + print CSS)
features/invoicing  ── dominio de facturación (corazón fiscal)  [components|domain|hooks|services|state|types|utils]
features/products   ── catálogo de productos                     [components|hooks|state|types]
(futuro) shared kernel + capa de servicios reales / backend
```

### 3.2 Features y capas (convención vigente)
| Capa | Contenido | Regla |
|---|---|---|
| `types/*.types.ts` | Entidades de dominio e interfaces (`readonly`) | Sin lógica |
| `types/*.schema.ts` | Schemas Zod; DTOs por `z.infer` | Fuente de verdad de bordes |
| `domain/` | Lógica pura, sin efectos (`invoiceCalculator`) | 100% testeable, sin React |
| `services/` | I/O: API REST, blobs PDF | Nunca importa React |
| `state/` | Contextos de estado (borrador, catálogo) | Un solo dueño por estado |
| `hooks/` | Orquestación React (RHF, react-query, memo) | Puente UI ↔ dominio/servicios |
| `components/` | Presentación | Sin lógica de negocio |
| `utils/` | Utilidades puras (`format`, `buildInvoice`) | Sin efectos |
| `index.ts` | Barril público de la feature | API pública de la feature |

**Reglas de dependencia:** `components → hooks → state/services/domain → types`. El dominio nunca
importa React/RHF/react-query. Una feature no importa internas de otra (hoy violado: D3).

### 3.3 Inventario de archivos (mapa técnico completo)

**Raíz / bootstrap:**
| Archivo | Responsabilidad | Notas |
|---|---|---|
| `index.html` | Shell SPA (`<div id="root">`, título en español) | — |
| `src/main.tsx` | Bootstrap: StrictMode + `QueryClientProvider` | — |
| `src/App.tsx` | Composición raíz: `ProductCatalogProvider` + `InvoiceForm` | — |
| `src/index.css` | Tailwind + reglas `@media print` (`.print-area`/`.no-print`) | — |
| `vite.config.ts` | Vite + plugin-react | sin alias de rutas |
| `tailwind.config.ts`, `postcss.config.js` | Tailwind/PostCSS | — |

**Feature `invoicing` — `types/`:**
| Archivo | Contenido | Claves exportadas |
|---|---|---|
| `invoice.types.ts` | Entidades de dominio | `InvoiceStatus`, `TaxCategory`, `CurrencyCode`, `Issuer`, `Customer`, `InvoiceItem`, `InvoiceHeader`, `Invoice`, `InvoiceDraft` |
| `invoice.schema.ts` | Schemas Zod + DTOs | `issuerSchema`, `customerSchema`, `invoiceItemSchema`, `invoiceHeaderSchema`, `invoiceDraftSchema`, `invoiceSchema` + tipos `*DTO` |

**Feature `invoicing` — `domain/` (corazón fiscal, sin tests aún):**
| Archivo | Contenido | Claves exportadas |
|---|---|---|
| `invoiceCalculator.ts` | Cálculo puro por línea y totales | `calculateLine`, `calculateInvoiceTotals`, `CalculatedLine`, `TaxBreakdownEntry`, `InvoiceTotals` |

**Feature `invoicing` — `services/`:**
| Archivo | Contenido | Claves exportadas |
|---|---|---|
| `invoice.api.ts` | Cliente REST (`request<T>`, endpoints create/list/getById/cancel/issue/downloadPdf) | `invoiceApi`, `InvoiceApi`, re-export de `Invoice`/`InvoiceDraft` |
| `invoice-pdf.service.ts` | Utilidades de blob/descarga/visor | `downloadPdfBlob`, `fetchAndDownloadPdf`, `buildPdfViewerUrl`, `revokePdfViewerUrl` |

**Feature `invoicing` — `state/`, `hooks/`, `utils/`, `components/`:**
| Archivo | Contenido | Claves exportadas |
|---|---|---|
| `state/InvoiceDraftContext.tsx` | Contexto de borrador (`draft`, `setDraft`, `clearDraft`) | `InvoiceDraftProvider`, `useInvoiceDraft` — contiene `EMPTY_DRAFT` (deuda D2) |
| `hooks/useInvoiceForm.ts` | RHF + zodResolver sobre `invoiceDraftSchema` | `useInvoiceForm`, `UseInvoiceFormResult` — contiene `DEFAULT_DRAFT` (deuda D2) |
| `hooks/useInvoiceCalculations.ts` | Facade memo de cálculo | `useInvoiceCalculations` |
| `hooks/useInvoiceMutations.ts` | react-query: lista/crear/emitir/cancelar/descargar PDF | `useInvoiceList`, `useCreateInvoice`, `useIssueInvoice`, `useCancelInvoice`, `useDownloadInvoicePdf` |
| `utils/buildInvoice.ts` | `draft → Invoice` (status `ISSUED`) | `buildInvoiceFromDraft` |
| `utils/format.ts` | `Intl.NumberFormat('es-CO')` cacheado por divisa | `formatCurrency` |
| `components/InvoiceForm.tsx` | Orquestador del formulario completo + submit | `InvoiceForm` — **contiene bug D1 (items)** |
| `components/InvoiceHeaderForm.tsx` | Cabecera controlada (correlativo, divisa, fechas, cliente parcial) | `InvoiceHeaderForm` — **no expone campos obligatorios → bug D11** |
| `components/InvoiceItemTable.tsx` | Tabla de líneas + selector de producto + cálculo en vivo | `InvoiceItemTable` |
| `components/InvoiceSummary.tsx` | Totales y desglose IVA | `InvoiceSummary` |
| `components/InvoicePdfViewer.tsx` | Visor `<iframe>` de blob (crea/revoca Object URL) | `InvoicePdfViewer` |
| `components/InvoicePrintModal.tsx` | Portal modal imprimible (print CSS) | `InvoicePrintModal` |
| `components/InvoiceStatusBadge.tsx` | Píldora de estado (estilos/labels) | `InvoiceStatusBadge` |
| `index.ts` | Barril público de la feature | componentes/hooks/servicios/state/tipos |

**Feature `products`:**
| Archivo | Contenido | Claves exportadas |
|---|---|---|
| `types/product.types.ts` | Entidad `Product` | `Product` — **importa `CurrencyCode`/`TaxCategory` de invoicing (D3)** |
| `types/product.schema.ts` | `productSchema` + `ProductDTO` | `productSchema`, `ProductDTO` — enums duplicados (D10) |
| `state/ProductCatalogContext.tsx` | Contexto de catálogo + `addProduct`/`getById` | `ProductCatalogProvider`, `useProductCatalog` — contiene `SEED_PRODUCTS` (D5) |
| `hooks/useProductForm.ts` | RHF + zodResolver sobre `productSchema` | `useProductForm` |
| `components/ProductForm.tsx` | Alta de producto | `ProductForm` |
| `components/ProductList.tsx` | Tabla de catálogo (usa `formatCurrency` de invoicing → D3) | `ProductList` |
| `components/ProductManager.tsx` | Compone `ProductForm` + `ProductList` | `ProductManager` |
| `index.ts` | Barril público | componentes/hook/contexto/tipos/schema |

### 3.4 Mapa de dependencias críticas del código
| Consumidor | Proveedor | Nota |
|---|---|---|
| `products` (types/hooks/UI) | `invoicing` (enums + `formatCurrency`) | Deuda D3: extraer a `shared/` |
| `invoicing/components/InvoiceItemTable` | `products` (tipo `Product`) | Acoplamiento UI→UI entre features |
| `InvoiceForm` / `useInvoiceForm` | RHF interno vs `useState` local | Bug D1 (doble fuente de verdad) |

---

## 4. Reglas de negocio y dominio fiscal

### 4.1 Flujo de facturación (semántica)
1. El usuario compone la cabecera (correlativo, divisa, fechas, cliente) y las líneas (producto del
   catálogo o manual) con cantidad, precio, descuento y tasa/categoría de impuesto.
2. Los cálculos se reflejan en vivo (tabla y resumen) mediante `useInvoiceCalculations`.
3. Al enviar: se construye `Invoice` (status `ISSUED`) y se dispara la mutación `POST /invoices`.
4. Previsualización/impresión vía `InvoicePrintModal`; PDF real (blob) vía `GET /invoices/:id/pdf`.

### 4.2 Reglas de cálculo (verificadas en `domain/invoiceCalculator.ts`)
- Por línea: `gross = qty × unitPrice`; `discount = gross × discountRate`;
  `net = gross − discount`; **solo `VAT` genera base imponible y cuota**;
  `taxAmount = round2(net × taxRate)`; `lineTotal = round2(net + taxAmount)`.
- Totales: subtotal, descuento total, base imponible, cuota total y **desglose por (taxCategory,
  taxRate)** (agrupado con `Map`, omitiendo bases 0).
- Redondeo: `Math.round((x + Number.EPSILON) * 100) / 100` — 2 decimales.
- Invariantes de schema:
  - `EXEMPT`/`NON_TAXABLE` ⇒ `taxRate === 0` (refine sobre el ítem/producto).
  - `dueDate >= issueDate` (refine sobre el header).
  - `items.length >= 1`; `quantity > 0`; `unitPrice >= 0`; `discountRate, taxRate ∈ [0, 1]`.
  - Fechas en formato `YYYY-MM-DD` (regex); emails válidos; strings `min(1)`.
  - `createdAt`/`updatedAt` en ISO-8601 datetime (`z.string().datetime()`).

### 4.3 Máquina de estados de la factura
```
DRAFT ──issue──▶ ISSUED ──▶ PAID
                   │
                   └──cancel──▶ CANCELLED
```
- Transiciones inválidas prohibidas (§6.2 rules). Hoy solo `issue`/`cancel` están expuestas en el API.
- Endpoints: `PATCH /invoices/:id/issue` y `PATCH /invoices/:id/cancel` (REST, semántica de negocio).

### 4.4 Catálogo de productos
- Entidad `Product`: `id, name, description, sku, unitPrice, taxRate, taxCategory, currency`.
- Estado actual: **en memoria** (`SEED_PRODUCTS` en el contexto; 3 productos demo) — deuda D5.
- Interacción: al elegir producto en una línea, se copian `description`, `unitPrice`, `taxRate` y
  `taxCategory` al ítem (`InvoiceItemTable`).

---

## 5. Modelado de datos y contratos clave

### 5.1 Modelo de dominio (estado actual)
```text
Issuer { id, legalName, taxId, address, email }          (readonly)
Customer{ id, legalName, taxId, address, email }         (readonly)
InvoiceHeader { issuer, customer, issueDate(YYYY-MM-DD), dueDate, correlationCode, currency }
InvoiceItem   { id, productId?, description, quantity, unitPrice, discountRate[0..1],
                taxRate[0..1], taxCategory }
Invoice       { id, header, items[], status, createdAt, updatedAt }
InvoiceDraft  { header, items[] }                        // forma pre-persistencia (UI)
Product       { id, name, description, sku, unitPrice, taxRate[0..1], taxCategory, currency }
```
> Convención: campos de entidad persistida en `readonly`; los mutables en borradores son editables.

### 5.2 Enumeraciones (dominio fiscal — fuente única pendiente de kernel compartido)
| Enum | Valores |
|---|---|
| `InvoiceStatus` | `DRAFT` · `ISSUED` · `CANCELLED` · `PAID` |
| `TaxCategory` | `VAT` (gravado) · `EXEMPT` (exento) · `NON_TAXABLE` (no gravable) |
| `CurrencyCode` | `USD` · `EUR` · `COP` |

> Los `z.enum` están **duplicados** en `invoice.schema.ts` y `product.schema.ts` (deuda D10): al cerrar
> D3 deben centralizarse en el kernel compartido.

### 5.3 Contratos REST (contrato objetivo; backend pendiente)
| Método | Ruta | Entrada | Salida |
|---|---|---|---|
| POST | `/invoices` | `InvoiceDraft` | `InvoiceDTO` |
| GET | `/invoices` | — | `InvoiceDTO[]` |
| GET | `/invoices/:id` | — | `InvoiceDTO` |
| PATCH | `/invoices/:id/issue` | — | `InvoiceDTO` |
| PATCH | `/invoices/:id/cancel` | — | `InvoiceDTO` |
| GET | `/invoices/:id/pdf` | `Accept: application/pdf` | `Blob` |

Fuente real: `invoice.api.ts`. **El API no existe**: toda llamada falla hoy; el "éxito" es simulado
por el flujo UI. Decisión: definir contrato + backend o mock (MSW).

### 5.4 Decisiones técnicas pendientes (open questions)
| Decisión | Opciones | Impacto | Dueño |
|---|---|---|---|
| Modelado de dinero en persistencia | integer centavos / decimal string / librería | Regla `rules.md` §6.1 | Tech Leader |
| Backend | Node+Nest/Fastify, BFF, serverless | Contratos §5.3 | Tech Leader |
| Catálogo remoto | API real vs MSW vs IndexedDB | Cierra D5 | Tech Leader + Frontend |
| Test runner | Vitest + Testing Library (unit/integration) + Playwright (e2e) | Cierra D6 | QA + Tech Leader |
| Lint/format | ESLint 9 flat config + Prettier + husky/lint-staged | Cierra D7 | Git & DevOps |
| Gestor de paquetes | npm (actual) vs bun (`bun.lock` huérfano detectado) | Reproducibilidad | Git & DevOps + Tech Leader |

---

## 6. Dependencias críticas y servicios de terceros

| Dependencia | Crítica para | Riesgo/Nota |
|---|---|---|
| `@tanstack/react-query` | caché y mutaciones de facturas | Sin backend, toda mutación falla; no enmascarar el error |
| `react-hook-form` + `zod` | integridad del borrador | Contrato UI↔dominio; no duplicar schemas |
| `Intl.NumberFormat` (`es-CO`) | formato de moneda | Formateadores cacheados por divisa en `utils/format.ts` |
| `crypto.randomUUID()` | IDs de drafts/líneas | Requiere contexto seguro (https/localhost) |
| Backend `/api` | persistencia real | **Servicio inexistente** → no desplegable como producto real |
| Visor/PDF | generación PDF (blob) | Hoy solo descarga/visor de blob; generación real es backend |

---

## 7. Convenciones del repositorio

### 7.1 Código y estructura
- Feature-first: todo código vive en `src/features/<feature>/` con sus capas (`types`, `domain`,
  `services`, `state`, `hooks`, `utils`, `components`) y un barril `index.ts` público.
- Identificadores en inglés; UI/mensajes en español. Sin comentarios que describan "el qué".
- Tipos de dominio en `*.types.ts`; DTOs derivados de Zod en `*.schema.ts`. `readonly` en fronteras.
- Dominio puro sin React; servicios sin React; componentes sin lógica de negocio.

### 7.2 Estado, errores y asincronía
- Una pieza de estado = un dueño. Sin doble fuente de verdad (D1 es el contraejemplo vigente).
- Operaciones async: estados `pending | error | success | empty` explícitos; botones deshabilitados en
  pending; errores tipados y mapeados (D8 pendiente), nunca texto crudo interno al usuario.
- Object URLs del visor PDF: crear y revocar en `useEffect` (ya implementado en `InvoicePdfViewer`).

### 7.3 Runbook de comandos (desde la raíz)
```bash
npm install          # instalar dependencias (node_modules ausente hoy)
npm run dev          # servidor Vite de desarrollo
npm run typecheck    # tsc -b --noEmit (estricto) — DoD obligatorio
npm run build        # tsc -b && vite build — DoD obligatorio
npm run lint         # ROTO hoy: eslint no instalado ni configurado (D7) — reportar, no ignorar
npm run preview      # previsualizar el build
```
> Sin tests (D6): el QA compensa con revisión estática adversarial hasta incorporar Vitest.

### 7.4 Git y entrega
- Trunk-based: `main` desplegable; ramas `feat/<slug>` para features complejas. PR solo si el usuario
  lo pide.
- **Integración automática (regla `rules.md` §9.1):** Git & DevOps commitea y hace push con cada
  funcionalidad validada, sin esperar orden. Se detiene si el push exige `--force`/rebase.
- Conventional Commits; un commit = un átomo. Prohibido secretos/artefactos (`dist`, `node_modules`,
  `*.tsbuildinfo`, `.env`).

---

## 8. Estado actual del desarrollo y mapa de rutas técnico

### 8.1 Estado por área
| Área | Estado | Comentario |
|---|---|---|
| Cabecera de factura (UI) | Funcional (mock) | **Bug D11**: no expone campos obligatorios del schema |
| Líneas e ítems | Funcional (mock) | **Bug D1**: items locales desincronizados del submit |
| Cálculo fiscal | **Completado (dominio puro)** | `invoiceCalculator.ts` sin tests aún (D6) |
| Catálogo de productos | Funcional (en memoria) | `SEED_PRODUCTS`; sin persistencia (D5) |
| Emitir/previsualizar/PDF | Parcial (mock) | Preview/print local + blob; API inexistente |
| Backend / DB / infraestructura | No iniciado | Decisiones §5.4 |
| Calidad (lint/tests/CI) | No iniciado | Deudas D6–D9 |

### 8.2 Registro de deuda técnica (evidencia detallada en `rules.md` Anexo A)
| ID | Deuda | Estado |
|---|---|---|
| D1 | Doble fuente de verdad en `items` (`InvoiceForm.tsx:17` `useState` vs `useInvoiceForm.ts:41` RHF): las líneas editadas no llegan al submit | **ABIERTA — prioridad 1** |
| D11 | **NUEVO — CRÍTICO**: `InvoiceHeaderForm` no renderiza `issuer.*`, `customer.address` ni `customer.email`, pero `invoiceHeaderSchema` los exige → la validación impide emitir | **ABIERTA — prioridad 1** |
| D2 | Defaults de draft/item duplicados (context, hook, tabla) | ABIERTA |
| D3 | Acoplamiento cross-feature `products → invoicing` (sin kernel compartido) | ABIERTA |
| D4 | Dinero como `number` en coma flotante | ABIERTA |
| D5 | Catálogo `SEED_PRODUCTS` hardcodeado | ABIERTA |
| D6 | Sin test runner ni suite | ABIERTA |
| D7 | ESLint sin instalar/configurar pese a script `lint` | ABIERTA |
| D8 | Errores de red genéricos sin tipar (`invoice.api.ts:22-24`) | ABIERTA |
| D9 | Revisar cadena `tsc -b`/tsconfig para Vite | ABIERTA |
| D10 | Enums duplicados en schemas de ambas features | ABIERTA |

### 8.3 Mapa de ruta técnico (orden sugerido)
1. **Cerrar D1 y D11** (bugs que bloquean la emisión) — refactor a única fuente de verdad y completar
   el formulario de cabecera; con tests.
2. **Cerrar D6/D7** — Vitest + Testing Library y ESLint flat config; habilitar DoD real.
3. **Cerrar D2/D10** — factories de draft/item + enums únicos en kernel compartido.
4. **Cerrar D3** — extraer `shared/` (enums, `formatCurrency`, tipos base) y revertir imports.
5. **Decidir §5.4** (backend, dinero, catálogo remoto) y **cerrar D5/D8**.
6. Habilitar CI/CD (§9.3 rules) y desplegar preview por PR.

### 8.4 Criterio de entrada para nueva feature
- No iniciar implementación si el área tiene deuda ABIERTA que la afecta: cerrar la deuda primero o
  registrar excepción aprobada por Tech Leader.

---

## 9. Registro de decisiones técnicas (ADR-lite)

> Toda decisión de arquitectura se registra aquí por el Tech Leader al tomarla.

| Fecha | Decisión | Motivo | Dueño | Estado |
|---|---|---|---|---|
| 2026-09-05 | Gobernanza multi-agente: 4 roles (`.opencode/agent/`), `rules.md` normativo, `context.md` vivo | Base operativa del proyecto | Tech Leader | Vigente |
| 2026-09-05 | Trunk-based + integración automática (commit+push por feature) | Flujo unipersonal ágil; `rules.md` §9.1 | Git & DevOps | Vigente |
| — | (próximas: dinero, backend, catálogo remoto, test runner, lint — ver §5.4) | — | — | Pendiente |

---

## 10. Glosario de dominio

| Término | Significado |
|---|---|
| **Draft** | Borrador de factura pre-persistencia (`InvoiceDraft`) |
| **Correlativo** | Código secuencial de la factura (`correlationCode`) |
| **Base imponible** | Monto sobre el que se aplica IVA (solo líneas `VAT`, tras descuento) |
| **Desglose de IVA** | Suma de cuotas agrupada por (categoría, tasa) |
| **Emitida / Anulada / Pagada** | Estados `ISSUED` / `CANCELLED` / `PAID` del ciclo de vida |
| **Kernel compartido** | Módulo `shared/` futuro donde viven enums y utilidades comunes (cierra D3) |
| **Borde de confianza** | Toda entrada/salida que cruza la app (form, red, storage): se valida con Zod |

---

## 11. Cómo mantener este documento

- **Quién:** Tech Leader (guardián); Frontend/QA/DevOps proponen cambios de estado/deuda.
- **Cuándo:** al cerrar un hito, cambiar un contrato, decidir arquitectura, registrar/cerrar deuda o
  mover código de lugar (actualizar el inventario §3.3).
- **Qué tocar tras cada cambio de código relevante:** §3.3 (inventario), §5 (contratos), §8.2 (deuda),
  §9 (ADR), §1 (fecha + commit de referencia).
- **Regla de oro:** si una decisión nueva contradice `rules.md`, se actualiza `rules.md` (no se anota
  aquí una excepción silenciosa).