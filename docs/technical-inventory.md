# Technical Inventory — Invoicing · Facturación Digital

> Documento de **documentación como código**. Se actualiza en el **mismo commit** que el código que
> describe, conforme al skill `.agents/skills/technical-documentation-sync.md`. Fuente de contratos:
> schemas Zod y tipos de `src/`. Sin especificación formal previa: los criterios de aceptación son
> **derivados** de validaciones de schema, ramas de lógica pura y constraints (marcados `[DERIVADO]`).

| Campo | Valor |
|---|---|
| Proyecto | `invoicing` · v`0.1.0` · paquete privado |
| Commit de referencia | `7d358cd` |
| Fecha de auditoría | 2026-09-19 |
| Estado | `MOCKUP_FRONTEND` — SPA funcional; backend/DB/autenticación inexistentes |
| Alcance auditado | `src/**` completo (37 archivos), `package.json`, `tsconfig.json`, `vite.config.ts` |

---

## A. Arquitectura y Stack Tecnológico

### A.1 Runtime, frameworks y lenguaje

| Capa | Tecnología | Versión | Evidencia |
|---|---|---|---|
| Runtime navegador | SPA (DOM) | — | `index.html` (`#root`) |
| UI | React | 19.x | `package.json:16-17`, `src/main.tsx` |
| Build/dev | Vite + `@vitejs/plugin-react` | 5.4.x | `vite.config.ts:1-6` |
| Lenguaje | TypeScript | 5.6.x | `package.json:28` |
| Config TS | `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`, `moduleDetection: force`, `noEmit` | — | `tsconfig.json:15-20` |
| Estilos | Tailwind CSS + PostCSS | 3.4.x | `tailwind.config.ts`, `postcss.config.js`, `src/index.css` |
| Formularios | react-hook-form + `@hookform/resolvers/zod` | 7.53 / 3.9 | `package.json:14,18` |
| Validación | Zod | 3.23 | `package.json:19` |
| Data/estado remoto | `@tanstack/react-query` | 5.59 | `package.json:15`, `src/main.tsx:7,16` |

### A.2 ORM / query builder / motor de base de datos

- **No existen.** El repositorio es frontend puro (`rules.md` §6). No hay ORM, query builder, motor de
  BD, migraciones ni capa de persistencia.
- Persistencia actual: **estado en memoria de React** (`useState` en contextos) + **contrato REST
  objetivo** no implementado (`services/invoice.api.ts:7` → `VITE_INVOICING_API_URL` / `/api`).
- Toda mutación (`create`, `issue`, `cancel`, `downloadPdf`) apunta a un backend **inexistente**: falla
  en runtime. No aplican reglas de §6.1–§6.3 (modelado/transacciones/queries) hasta que exista capa de
  datos; citarlas como criterios diferidos.

### A.3 Seguridad y autenticación

- **Autenticación: ninguna.** No hay login, tokens, sesión, guards de ruta, ni interceptor de red.
- **Autorización: ninguna.** No hay RBAC/ABAC ni verificación de identidad del emisor.
- Validación de entrada: **Zod** en los dos bordes de formulario (resolver RHF). No hay validación de
  respuesta de red: `request<T>` hace cast directo `(await response.json()) as TResponse`
  (`invoice.api.ts:29`), sin parseo ni validación de schema.
- Manejo de errores de red: genérico y sin tipar (deuda D8) —
  `throw new Error(\`Invoice API error ${response.status}: ${await response.text()}\`)`
  (`invoice.api.ts:22-24`), expone texto crudo del servidor.
- Sin `ErrorBoundary` global. UI muestra texto fijo "Error al guardar la factura."
  (`InvoiceForm.tsx:69-71`), no el error real.
- Sin logging. Sin datos sensibles persistidos/logueados. `VITE_INVOICING_API_URL` es la única variable
  de entorno (`invoice.api.ts:7`).

### A.4 Convenciones de diseño aplicadas

- **Feature-first modular**: `src/features/<feature>/{types,domain,services,state,hooks,utils,components}`
  con barril público `index.ts` (`invoicing/index.ts`, `products/index.ts`).
- **Schema-first / contrato derivado**: los tipos de borde se derivan de Zod con `z.infer`
  (`invoice.schema.ts:68-73`, `product.schema.ts:25`); dominio separado en `*.types.ts`.
- **Lógica pura aislada**: `domain/invoiceCalculator.ts` sin React ni efectos; facade reactiva en
  `hooks/useInvoiceCalculations.ts` (`useMemo`).
- **Inversión de dependencia parcial**: UI depende de hooks; los hooks de mutación dependen de
  `invoiceApi` (abstracción de objeto). No hay interfaces de repositorio inyectables (DIP no formal).
- **Estado con dueño único por contexto**: `InvoiceDraftContext`, `ProductCatalogContext`. Excepción:
  `items` en `InvoiceForm` (doble fuente de verdad, D1).
- **Transaccionalidad**: no aplica (sin persistencia). No hay saga/compensación.
- **Manejo tipado de excepciones**: **no implementado** (D8); se usa `Error` genérico.
- **Reglas de dependencia declaradas**: `components → hooks → state/services/domain → types`; el
  dominio no importa React. Violación vigente: `InvoiceItemTable` (invoicing) importa `Product`
  (products) y `ProductList`/`ProductForm`/`useProductForm`/`product.types` importan de `invoicing`
  (deuda D3/D10).

### A.5 Mapa de composición (runtime)

```
index.html
└─ src/main.tsx            StrictMode → QueryClientProvider(queryClient)
   └─ App.tsx              ProductCatalogProvider
      └─ InvoiceForm       useInvoiceForm + useCreateInvoice + useProductCatalog
         ├─ InvoiceHeaderForm   (controlled: value/onChange → form.setValue)
         ├─ ProductManager      → ProductForm (useProductForm) + ProductList
         ├─ InvoiceItemTable    (items locales, useState en InvoiceForm)
         ├─ InvoicePdfViewer    (pdfBlob={null} siempre)
         ├─ InvoiceSummary      (useInvoiceCalculations)
         └─ InvoicePrintModal   (portal, solo si previewInvoice != null)
```

---

## B. Inventario Exhaustivo de Funcionalidades

> No existen endpoints HTTP implementados en el código (no hay servidor). Los "entrypoints" son
> handlers de UI/eventos; se documenta además el **contrato REST objetivo** que consumen. No hay
> Guards: todas las funcionalidades son públicas dentro del árbol React. Los códigos HTTP se declaran
> como contrato objetivo; en el cliente actual solo se materializa el 400 (Zod vía resolver).

---

### Módulo `invoicing`

#### INV-001 — Editar cabecera de la factura

- **Descripción técnica**: actualiza el objeto `header` del borrador (correlativo, moneda, fechas,
  cliente parcial) y lo escribe en RHF con validación inmediata.
- **Entrypoint**: evento `onChange` de `InvoiceHeaderForm` → `form.setValue('header', header,
  { shouldValidate: true })` (`InvoiceForm.tsx:38-42`, `InvoiceHeaderForm.tsx:16-18`).
  Contrato REST objetivo: parte de `POST /invoices`.
- **Contratos (DTOs / Tipos)**:
  - Entrada: `InvoiceHeaderDTO` (= `invoiceHeaderSchema`) — `issuerSchema`, `customerSchema`,
    `issueDate`/`dueDate` regex `^\d{4}-\d{2}-\d{2}$`, `correlationCode` `min(1)`, `currency` enum
    (`invoice.schema.ts:7-21,42-54`).
  - Salida: ninguno (mutación de estado local).
- **Efectos secundarios / Persistencia**: solo `useForm` en memoria. **No persiste.**
  Archivos: `InvoiceHeaderForm.tsx:20-88` (renderiza `correlationCode`, `currency`, `issueDate`,
  `dueDate`, `customer.legalName`, `customer.taxId`), `InvoiceForm.tsx:41`.
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN un borrador montado WHEN `correlationCode` se envía vacío THEN resolver Zod
    invalida con "El correlativo es requerido" (400 lógico; `invoice.schema.ts:48`).
  - `[DERIVADO]` GIVEN `issueDate=2026-01-10` WHEN `dueDate=2026-01-05` (vencimiento anterior) THEN
    invalidación "La fecha de vencimiento no puede ser anterior a la de emisión"
    (`invoice.schema.ts:51-54`).
  - `[DERIVADO]` GIVEN `issueDate`/`dueDate` con formato distinto a `YYYY-MM-DD` THEN invalidación
    ("Fecha de emisión inválida" / "Fecha de vencimiento inválida"; `invoice.schema.ts:46-47`).
  - **BUG D11 (fallo actual)**: GIVEN el formulario renderizado WHEN el usuario intenta emitir THEN la
    validación **siempre falla**, porque `issuer.*` (todos `min 1`/email), `customer.address` y
    `customer.email` son requeridos por schema pero **no tienen control de entrada**
    (`InvoiceHeaderForm.tsx:20-88` vs `invoice.schema.ts:7-21`). No hay camino de éxito hoy.
  - GIVEN `currency` fuera de `USD|EUR|COP` WHEN se emite THEN 400 (enum; `invoice.schema.ts:49`).

#### INV-002 — Gestionar líneas de la factura (agregar / editar / eliminar)

- **Descripción técnica**: alta/baja/edición de ítems sobre el array local `items` del formulario.
- **Entrypoint**:
  - `+ Agregar ítem` → `addItem()` (`InvoiceItemTable.tsx:29-42,156-162`) → `onItemsChange`.
  - Edición de campos por fila → `updateItem(index, patch)` (`InvoiceItemTable.tsx:20-22,60-151`).
  - `✕` → `removeItem(index)` (`InvoiceItemTable.tsx:24-27,141-150`).
- **Contratos (DTOs / Tipos)**:
  - Entrada: `InvoiceItem` (`invoice.types.ts:23-35`) validado por `invoiceItemSchema`:
    `id min(1)`, `productId?`, `description min(1)`, `quantity positive`, `unitPrice nonnegative`,
    `discountRate [0,1]`, `taxRate [0,1]`, `taxCategory` enum, `refine` exento/no gravable ⇒
    `taxRate===0` (`invoice.schema.ts:23-40`).
  - Salida: `InvoiceItem[]` hacia `onItemsChange`.
- **Efectos secundarios / Persistencia**: `setItems` local en `InvoiceForm` (`InvoiceForm.tsx:17,49-54`).
  **No persiste.**
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN `items.length === 1` WHEN se pulsa `✕` THEN no se elimina (guarda `length<=1`;
    `InvoiceItemTable.tsx:25`); además el botón queda `disabled` (`:146`).
  - `[DERIVADO]` GIVEN `items.length === 0` WHEN se renderiza THEN estado vacío
    "No hay ítems registrados." (`InvoiceItemTable.tsx:16-18`).
  - `[DERIVADO]` GIVEN `quantity<=0`, `unitPrice<0`, o tasas fuera de `[0,1]` WHEN se emite THEN 400
    (`invoice.schema.ts:28-31`).
  - `[DERIVADO]` GIVEN `taxCategory` `EXEMPT|NON_TAXABLE` y `taxRate!=0` WHEN se emite THEN 400
    ("Un ítem exento o no gravable debe tener tasa de impuesto 0"; `invoice.schema.ts:34-40`).
  - **BUG D1 (fallo actual)**: GIVEN líneas editadas/añadidas en `InvoiceItemTable` WHEN se envía el
    formulario THEN el `draft` de RHF no contiene esos cambios (el submit usa `form.handleSubmit`,
    `InvoiceForm.tsx:26-29`, mientras `items` vive en `useState` separado `:17`): la factura creada no
    refleja las líneas. Criterio esperado: el contrato de salida debe contener exactamente las líneas
    visibles.

#### INV-003 — Seleccionar producto del catálogo en una línea

- **Descripción técnica**: al elegir un producto, copia `description`, `unitPrice`, `taxRate` y
  `taxCategory` del producto al ítem; al elegir "Manual", limpia `productId`.
- **Entrypoint**: `onChange` del `<select>` de producto (`InvoiceItemTable.tsx:65-89`).
- **Contratos (DTOs / Tipos)**: entrada `productId: string | ''`; salida parche parcial de
  `InvoiceItem`.
- **Efectos secundarios / Persistencia**: `updateItem` → `setItems` local (`InvoiceForm.tsx:17`).
  Lee `products` de `ProductCatalogContext` (`InvoiceForm.tsx:21,52`).
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN un `productId` existente WHEN se selecciona THEN el ítem recibe
    `productId, description=name, unitPrice, taxRate, taxCategory` del producto
    (`InvoiceItemTable.tsx:74-80`).
  - `[DERIVADO]` GIVEN `productId` inexistente/vacío WHEN se selecciona THEN `productId=undefined` y
    no se alteran los demás campos (`:70-73`).
  - `[DERIVADO]` GIVEN producto `EXEMPT` (taxRate 0) WHEN se copia THEN el ítem queda válido respecto
    al `refine` (`invoice.schema.ts:34-40`).
  - No existe validación de coherencia moneda-producto vs moneda-factura.

#### INV-004 — Cálculo fiscal en vivo (dominio puro)

- **Descripción técnica**: cálculo por línea y totales con desglose de IVA (categoría, tasa).
- **Entrypoint**: `useInvoiceCalculations(items)` (`useInvoiceCalculations.ts:19-27`), consumido por
  `InvoiceItemTable` (`:14`) y `InvoiceSummary` (`:11`) y `InvoicePrintModal` (`:20`).
- **Contratos (DTOs / Tipos)**:
  - Entrada: `ReadonlyArray<InvoiceItem>`.
  - Salida: `{ lines: ReadonlyArray<CalculatedLine>; totals: InvoiceTotals }`
    (`invoiceCalculator.ts:3-27`).
- **Lógica pura / fórmulas** (`invoiceCalculator.ts:29-89`):
  - `round2(x) = Math.round((x + Number.EPSILON) * 100) / 100`.
  - `gross = quantity * unitPrice`; `discountAmount = gross * discountRate`; `net = gross - discount`.
  - `isTaxable = (category === 'VAT')`; `taxableBase = taxable ? net : 0`;
    `taxAmount = round2(taxableBase * taxRate)`; `lineTotal = round2(net + taxAmount)`.
  - Totales: `subtotal=Σgross`, `totalDiscount=ΣdiscountAmount`, `taxableBase=ΣtaxableBase`,
    `totalTax=ΣtaxAmount`, `grandTotal=ΣlineTotal` (cada uno `round2`).
  - `taxBreakdown`: agrupación por clave `` `${category}:${taxRate}` `` con `Map`, **omitiendo**
    `taxableBase === 0` (`:63`).
- **Efectos secundarios / Persistencia**: ninguno (puro). Memoizado por referencia de `items`.
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN ítem `qty=2, unitPrice=100, discountRate=0.1, VAT, taxRate=0.19` THEN
    `gross=200, discount=20, net=180, taxableBase=180, taxAmount=34.2, lineTotal=214.2`.
  - `[DERIVADO]` GIVEN `EXEMPT` o `NON_TAXABLE` THEN `taxableBase=0`, `taxAmount=0`,
    `lineTotal=net`; la entrada se omite del `taxBreakdown` (`:63`).
  - `[DERIVADO]` GIVEN dos líneas VAT al mismo `taxRate` THEN se agrupan en una sola entrada de
    `taxBreakdown` con bases/cuotas sumadas (`:64-72`).
  - `[DERIVADO]` GIVEN `items=[]` THEN `subtotal=0`, `totalDiscount=0`, `taxableBase=0`, `totalTax=0`,
    `grandTotal=0`, `taxBreakdown=[]`.
  - `[DERIVADO]` GIVEN `discountRate=1` THEN `net=0`, `taxAmount=0`, `lineTotal=0`.
  - `[DERIVADO]` Todos los importes a 2 decimales vía `round2`.
  - **Sin tests** (D6): cobertura obligatoria del 100% de ramas pendiente (`rules.md` §8).

#### INV-005 — Crear y emitir factura (submit del formulario)

- **Descripción técnica**: valida el borrador con Zod; si es válido, construye una `Invoice` con
  `status='ISSUED'`, abre la previsualización y dispara la mutación `POST /invoices`.
- **Entrypoint**: `onSubmit` del `<form>` → `form.handleSubmit((draft) => …)`
  (`InvoiceForm.tsx:26-29,32,62-68`).
- **Contratos (DTOs / Tipos)**:
  - Entrada: `InvoiceDraftDTO` (`invoiceDraftSchema`: `header` + `items.min(1)`; `invoice.schema.ts:56-59`).
  - Salida (transformación): `Invoice` (`buildInvoice.ts:3-13`): `id=crypto.randomUUID()`,
    `header`, `items`, `status:'ISSUED'`, `createdAt=updatedAt=new Date().toISOString()`.
  - Persistencia: `invoiceApi.create(draft)` → `POST /invoices` con body `InvoiceDraft`, respuesta
    esperada `InvoiceDTO` (`invoice.api.ts:33-35`).
- **Orquestación / efectos secundarios**: `useCreateInvoice` (`useInvoiceMutations.ts:15-23`) —
  `onSuccess` invalida la query `['invoices']`. UI: `createMutation.isPending` deshabilita el botón y
  muestra "Guardando…" (`InvoiceForm.tsx:62-68`); `isError` muestra texto genérico (`:69-71`).
- **Persistencia**: **inexistente**; `POST /invoices` falla (backend ausente). Además `items` puede ir
  desincronizado (D1) y la validación siempre falla (D11). No hay transacción (no aplica sin backend).
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN borrador válido WHEN submit THEN se crea `Invoice` con `status='ISSUED'`,
    `createdAt===updatedAt` ISO-8601 y `id` UUID; se abre `InvoicePrintModal`; 201/200 esperado.
  - `[DERIVADO]` GIVEN `items=[]` WHEN submit THEN 400 "Debe incluir al menos un ítem"
    (`invoice.schema.ts:58`).
  - `[DERIVADO]` GIVEN fallo de red o 4xx/5xx WHEN submit THEN `isError=true` y se muestra error
    (texto genérico); no se navega ni se revierte el borrador.
  - `[DERIVADO]` GIVEN submit en curso WHEN se pulsa de nuevo THEN el botón está `disabled`
    (mitigación de doble submit por `isPending`).
  - **“Happy path” inalcanzable hoy** por D11; **payload incorrecto** por D1. Códigos 401/403/404/409
    no implementados (sin auth/backend); 500 no manejado de forma tipada.

#### INV-006 — Previsualizar e imprimir factura

- **Descripción técnica**: modal por portal que renderiza cabecera, líneas y totales reutilizando el
  cálculo puro; CSS `@media print` imprime solo `.print-area`.
- **Entrypoint**: render condicional de `InvoicePrintModal` (`InvoiceForm.tsx:74-81`); botón
  "Imprimir" → `window.print()` (`InvoicePrintModal.tsx:121-127`); "Cerrar" → `onClose`
  (`:113-120`).
- **Contratos (DTOs / Tipos)**: props `{ header: InvoiceHeader; items: ReadonlyArray<InvoiceItem>;
  status?: InvoiceStatus; onClose: () => void }` (`InvoicePrintModal.tsx:7-12`).
- **Efectos secundarios / Persistencia**: portal en `document.body`, sin persistencia. Muestra
  `issuer.legalName/taxId/address` y `customer.legalName/taxId/address`
  (`InvoicePrintModal.tsx:42-55`) y desglose de totales (`:91-110`).
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN `previewInvoice != null` WHEN render THEN modal `role="dialog"`
    `aria-modal="true"` visible.
  - `[DERIVADO]` GIVEN "Cerrar" WHEN click THEN `onClose` y el modal desaparece.
  - `[DERIVADO]` GIVEN "Imprimir" WHEN click THEN `window.print()` respeta `.print-area`/`.no-print`
    (`index.css:5-23`: solo `.print-area` visible; controles ocultos).
  - `[DERIVADO]` GIVEN `status` omitido THEN por defecto `'ISSUED'` (`:17`).

#### INV-007 — Descargar PDF de factura

- **Descripción técnica**: obtiene el blob del PDF por REST, resuelve nombre de archivo y dispara la
  descarga vía Object URL temporal revocado.
- **Entrypoint**: `useDownloadInvoicePdf().mutate(invoice)` (`useInvoiceMutations.ts:45-52`), no
  consumido por ningún componente hoy.
- **Contratos (DTOs / Tipos)**: entrada `Invoice`; pasos: `invoiceApi.downloadPdf(id)` →
  `GET /invoices/:id/pdf` con header `Accept: application/pdf` → `Blob`
  (`invoice.api.ts:52-61`). Nombre por defecto `invoice-${correlationCode}` (`.pdf`).
- **Efectos secundarios / Persistencia**: `downloadPdfBlob` crea `<a download>`, click sintético y
  `URL.revokeObjectURL` (`invoice-pdf.service.ts:8-17`); `resolveFilename` exige sufijo `.pdf`
  (`:3-6`).
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN id válido WHEN descarga THEN se genera blob y se descarga
    `invoice-<correlationCode>.pdf`.
  - `[DERIVADO]` GIVEN `suggestedName` sin `.pdf` WHEN se resuelve THEN se usa
    `${fallbackName}.pdf` (`invoice-pdf.service.ts:4-5`).
  - `[DERIVADO]` GIVEN respuesta no-OK WHEN descarga THEN `throw new Error(\`Invoice PDF error
    ${status}\`)` (`invoice.api.ts:57-59`) — error genérico (D8).
  - **No cableado** en UI; backend inexistente.

#### INV-008 — Visor de PDF (blob)

- **Descripción técnica**: crea un Object URL desde `Blob` y lo revoca al desmontar/cambiar blob.
- **Entrypoint**: `InvoicePdfViewer` (`InvoicePdfViewer.tsx:9-37`), invocado con `pdfBlob={null}`
  (`InvoiceForm.tsx:57`) → siempre placeholder.
- **Contratos (DTOs / Tipos)**: props `{ pdfBlob: Blob | null; correlationCode: string }`.
- **Efectos secundarios / Persistencia**: `buildPdfViewerUrl`/`revokePdfViewerUrl`
  (`invoice-pdf.service.ts:29-35`) dentro de `useEffect` con cleanup (`InvoicePdfViewer.tsx:12-20`).
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN `pdfBlob=null` WHEN render THEN placeholder "Vista previa del PDF no
    disponible" y `url=null` (`:22-28`).
  - `[DERIVADO]` GIVEN `pdfBlob` no nulo WHEN render THEN `<iframe title="Factura <código>">` con el
    Object URL.
  - `[DERIVADO]` GIVEN cambio de `pdfBlob`/unmount THEN se revoca el Object URL previo (sin fugas;
    `rules.md` §5.4).

#### INV-009 — Listar facturas

- **Descripción técnica**: query de colección de facturas.
- **Entrypoint**: `useInvoiceList()` (`useInvoiceMutations.ts:8-13`), **no consumido** en UI.
- **Contratos**: `invoiceApi.list()` → `GET /invoices` → `ReadonlyArray<InvoiceDTO>`
  (`invoice.api.ts:36-38`). `queryKey = ['invoices']`.
- **Persistencia**: backend inexistente.
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN consulta OK WHEN resuelve THEN `InvoiceDTO[]` validada solo por cast (sin
    schema; riesgo de datos no validados).
  - `[DERIVADO]` GIVEN fallo WHEN query THEN estado de error de react-query (no renderizado: hook no
    usado).
  - Paginación/orden/filtros: no implementados (aplicaría `rules.md` §6.3 con backend).

#### INV-010 — Consultar factura por id

- **Descripción técnica**: lectura de una factura puntual.
- **Entrypoint**: `invoiceApi.getById(id)` (`invoice.api.ts:39-41`), **no consumido** en UI.
- **Contratos**: `GET /invoices/:id` (`encodeURIComponent(id)`) → `InvoiceDTO`.
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN id inexistente WHEN consulta THEN 404 del backend (contrato objetivo; no
    implementado en cliente ni mapeado).
  - Validación de `InvoiceDTO` de respuesta: ausente (cast directo).

#### INV-011 — Emitir factura (transición de estado)

- **Descripción técnica**: mutación semántica `issue` sobre una factura existente.
- **Entrypoint**: `useIssueInvoice()` (`useInvoiceMutations.ts:25-33`), **no consumido** en UI.
- **Contratos**: `invoiceApi.issue(id)` → `PATCH /invoices/:id/issue` → `InvoiceDTO`
  (`invoice.api.ts:47-51`). Máquina de estados objetivo: `DRAFT → ISSUED`.
- **Persistencia**: inexistente.
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN factura `DRAFT` WHEN `issue` THEN pasa a `ISSUED` (200) e invalida
    `['invoices']`.
  - `[DERIVADO]` GIVEN factura `ISSUED|PAID|CANCELLED` WHEN `issue` THEN 409 (transición inválida;
    `rules.md` §6.2) — no implementado.
  - `[DERIVADO]` GIVEN id inexistente THEN 404; sin sesión THEN 401; sin permiso THEN 403 — no
    implementados (sin auth).

#### INV-012 — Anular factura (transición de estado)

- **Descripción técnica**: mutación semántica `cancel`.
- **Entrypoint**: `useCancelInvoice()` (`useInvoiceMutations.ts:35-43`), **no consumido** en UI.
- **Contratos**: `invoiceApi.cancel(id)` → `PATCH /invoices/:id/cancel` → `InvoiceDTO`
  (`invoice.api.ts:42-46`). Transición objetivo: `ISSUED → CANCELLED` (según `context.md` §4.3).
- **Persistencia**: inexistente.
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN factura `ISSUED` WHEN `cancel` THEN `CANCELLED` (200) e invalida
    `['invoices']`.
  - `[DERIVADO]` GIVEN factura `DRAFT|PAID|CANCELLED` WHEN `cancel` THEN 409 — no implementado.
  - `[DERIVADO]` GIVEN id inexistente THEN 404 — no implementado.

#### INV-013 — Validación de borde del borrador (guard de formulario)

- **Descripción técnica**: resolución Zod del formulario completo en cada blur/submit.
- **Entrypoint**: `useForm<InvoiceDraftDTO>({ resolver: zodResolver(invoiceDraftSchema), mode:
  'onBlur' })` (`useInvoiceForm.ts:41-45`); expone `formState.errors`.
- **Contratos**: `invoiceDraftSchema` (`invoice.schema.ts:56-59`).
- **Efectos secundarios / Persistencia**: estado interno RHF; errores pasados a `InvoiceHeaderForm`
  como `Record<string, unknown>` (`InvoiceForm.tsx:40`) — **no se renderizan** con detalle (solo
  `aria-invalid` en correlativo).
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN un campo inválido WHEN blur THEN `errors` contiene la clave (400 lógico).
  - `[DERIVADO]` GIVEN `mode:'onBlur'` WHEN se teclea sin blur THEN no se valida aún.
  - `[DERIVADO]` GIVEN `items.length<1` WHEN submit THEN error en `items` (no mostrado en UI).

#### INV-014 — Gestión del estado del borrador (contexto)

- **Descripción técnica**: estado compartido del borrador con mutadores.
- **Entrypoint**: `useInvoiceDraft()` → `{ draft, setDraft, clearDraft }`
  (`InvoiceDraftContext.tsx:39-45`).
- **Contratos**: `InvoiceDraftContextValue` (`:4-8`).
- **Efectos secundarios / Persistencia**: `useState<InvoiceDraft>(EMPTY_DRAFT)` (`:25`); `clearDraft`
  restablece `EMPTY_DRAFT` (`:31`). **No consumido por `InvoiceForm` hoy** (que usa RHF) →
  `InvoiceDraftProvider` no está montado en `App.tsx`. Duplicación de defaults (D2).
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN uso fuera del provider WHEN `useInvoiceDraft` THEN throw
    "useInvoiceDraft must be used within an InvoiceDraftProvider" (`:41-43`).
  - `[DERIVADO]` GIVEN `clearDraft` WHEN invoca THEN `draft === EMPTY_DRAFT`.

---

### Módulo `products`

#### PROD-001 — Registrar producto en el catálogo

- **Descripción técnica**: valida el formulario de producto con Zod y, si es válido, lo agrega al
  catálogo en memoria y resetea el formulario con nuevo `id`.
- **Entrypoint**: `onSubmit` de `ProductForm` → `form.handleSubmit(submit)`
  (`ProductForm.tsx:16-17`) → `useProductForm.submit(product)` → `onCreated(product)` →
  `addProduct` (`useProductForm.ts:10,28-40`, `ProductForm.tsx:9-10`).
- **Contratos (DTOs / Tipos)**:
  - Entrada: `ProductDTO` (`productSchema`): `id min(1)`, `name min(1)`, `description min(1)`,
    `sku min(1)`, `unitPrice nonnegative`, `taxRate [0,1]`, `taxCategory` enum, `currency` enum,
    `refine` exento/no gravable ⇒ `taxRate===0` (`product.schema.ts:6-23`).
  - Salida: `Product` agregado a `products` (`ProductCatalogContext.tsx:48-50`).
- **Efectos secundarios / Persistencia**: `setProducts(current => [...current, product])`
  (`ProductCatalogContext.tsx:48-50`). En memoria; sin persistencia (D5 `SEED_PRODUCTS`).
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN formulario válido WHEN submit THEN producto agregado al final del catálogo y
    formulario reseteado (`name/description/sku=''`, `unitPrice=0`, `taxRate=0.19`,
    `taxCategory='VAT'`, `currency='USD'`, nuevo `id`) (`useProductForm.ts:30-39`).
  - `[DERIVADO]` GIVEN `name/description/sku` vacíos WHEN submit THEN 400 lógico; **sin render de
    error** en UI (no hay `<span>` de error en `ProductForm`).
  - `[DERIVADO]` GIVEN `unitPrice<0` WHEN submit THEN 400 ("El precio no puede ser negativo").
  - `[DERIVADO]` GIVEN `taxCategory` `EXEMPT|NON_TAXABLE` y `taxRate!=0` THEN 400
    ("Un producto exento o no gravable debe tener tasa 0"; `product.schema.ts:17-23`).
  - `[DERIVADO]` GIVEN `taxRate` fuera de `[0,1]` THEN 400.
  - `[DERIVADO]` El `id` se genera con `crypto.randomUUID()` en `defaultValues` y en el `reset`
    (`:16,31`); no hay unicidad de `sku`, ni deduplicación, ni validación de `id` discreto.

#### PROD-002 — Listar catálogo de productos

- **Descripción técnica**: tabla del catálogo con formato de moneda e indicador de impuesto.
- **Entrypoint**: `ProductList` (`ProductList.tsx:4-39`), compuesto por `ProductManager`
  (`ProductManager.tsx:4-11`).
- **Contratos**: lee `products` de `useProductCatalog`; sin props.
- **Efectos secundarios / Persistencia**: ninguno (render). Usa `formatCurrency(unitPrice, currency)`
  de `invoicing` (`ProductList.tsx:2,29`) — acoplamiento D3.
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN `products=[]` WHEN render THEN "No hay productos registrados."
    (`:7-9`).
  - `[DERIVADO]` GIVEN producto `VAT` WHEN render THEN muestra `<taxRate*100>%`; GIVEN `EXEMPT` o
    `NON_TAXABLE` THEN muestra "Ex." (`:30-32`).
  - `[DERIVADO]` GIVEN moneda del producto WHEN render THEN importe con `Intl.NumberFormat('es-CO')`
    con estilo de moneda de esa divisa (`format.ts:5-14`).

#### PROD-003 — Obtener producto por id

- **Descripción técnica**: búsqueda en el catálogo por id.
- **Entrypoint**: `useProductCatalog().getById(id)` (`ProductCatalogContext.tsx:52-55`), **no
  consumido** en UI (la tabla de ítems busca directamente en `products`).
- **Contratos**: `(id: string) => Product | undefined`.
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN id existente THEN retorna el `Product`; GIVEN id inexistente THEN
    `undefined` (retorno tipado como opcional).
  - Complejidad `O(n)` con `useCallback` dependiente de `products` (`:52-55`).

#### PROD-004 — Estado global del catálogo (contexto)

- **Descripción técnica**: provider de catálogo con seed y mutador.
- **Entrypoint**: `ProductCatalogProvider` montado en `App.tsx:6`; `useProductCatalog()`
  (`ProductCatalogContext.tsx:67-73`).
- **Contratos**: `ProductCatalogContextValue { products, addProduct, getById }` (`:4-8`).
- **Efectos secundarios / Persistencia**: `useState(SEED_PRODUCTS)` (`:46`) con 3 productos hardcoded
  (`:12-43`) — deuda D5. `value` memoizado (`:57-60`).
- **Criterios de aceptación (actuales)**:
  - `[DERIVADO]` GIVEN uso fuera del provider THEN throw "useProductCatalog must be used within a
    ProductCatalogProvider" (`:69-71`).
  - `[DERIVADO]` GIVEN estado inicial THEN `products` contiene los 3 seeds `seed-1..3`.

---

### Flujos transversales (mapeo de capas)

#### Flujo F1 — Composición y emisión de factura (end-to-end actual)

| Etapa | Artefacto | Evidencia |
|---|---|---|
| Contrato de entrada | `invoiceDraftSchema` (Zod) | `invoice.schema.ts:56-59` |
| Orquestación (UI/controller) | `InvoiceForm.handleSubmit` + `InvoiceHeaderForm` + `InvoiceItemTable` | `InvoiceForm.tsx:26-42` |
| Lógica pura | `calculateLine` / `calculateInvoiceTotals` | `invoiceCalculator.ts:34-89` |
| Transformación | `buildInvoiceFromDraft` (`status='ISSUED'`) | `buildInvoice.ts:3-13` |
| Persistencia (contrato) | `invoiceApi.create` → `POST /invoices` | `invoice.api.ts:33-35` |
| Estado remoto | `useCreateInvoice` (invalida `['invoices']`) | `useInvoiceMutations.ts:15-23` |
| Contrato de salida | `InvoiceDTO` (esperado) / `Invoice` (preview) | `invoice.schema.ts:61-73` |
| Corte actual | “Happy path” bloqueado por D11; payload desincronizado por D1; backend inexistente | `rules.md` Anexo A |

#### Flujo F2 — Alta de producto en catálogo

| Etapa | Artefacto | Evidencia |
|---|---|---|
| Contrato de entrada | `productSchema` (Zod) | `product.schema.ts:6-23` |
| Orquestación | `ProductForm` → `useProductForm.submit` | `ProductForm.tsx:8-17`, `useProductForm.ts:12-42` |
| Estado (dueño) | `ProductCatalogContext.addProduct` | `ProductCatalogContext.tsx:48-50` |
| Persistencia | En memoria (`useState`) — sin persistencia | `ProductCatalogContext.tsx:46` |
| Contrato de salida | `Product` en `products` | `product.types.ts:3-12` |

#### Flujos F3–F5 — Listar / consultar / transicionar facturas

`useInvoiceList`, `invoiceApi.getById`, `useIssueInvoice`, `useCancelInvoice` existen y están
exportados (`invoicing/index.ts:11-17,19`) pero **no tienen entrypoint UI**. Su contrato es el declarado
en §INV-009 a §INV-012; su materialización depende del backend inexistente.

---

### Deuda técnica detectada en esta auditoría (referencia `rules.md` Anexo A)

| ID | Evidencia verificada | Impacto en inventario |
|---|---|---|
| D1 | `InvoiceForm.tsx:17` (`useState`) vs `InvoiceForm.tsx:26-29` (submit RHF) | INV-002/005: contrato de salida inconsistente |
| D11 | `InvoiceHeaderForm.tsx:20-88` vs `invoice.schema.ts:7-21` | INV-001/005: happy path inalcanzable |
| D2 | defaults en `InvoiceDraftContext.tsx:12-22`, `useInvoiceForm.ts:9-29`, `InvoiceItemTable.tsx:29-42` | INV-002/014 |
| D3 | `product.types.ts:1`, `useProductForm.ts:5`, `ProductList.tsx:2`, `InvoiceItemTable.tsx:3` | PROD-002/003, cross-feature |
| D4 | `invoice.types.ts:27-33`, `invoiceCalculator.ts` (uso de `number`) | INV-004 |
| D5 | `ProductCatalogContext.tsx:12-43` | PROD-001/004 |
| D6 | sin runner/tests (verificado: 0 archivos `*.test.*`/`*.spec.*`) | todos los criterios `[DERIVADO]` sin verificación |
| D7 | `package.json:10` (`lint`) sin dependencia `eslint` | DoD |
| D8 | `invoice.api.ts:22-24,57-59` | INV-005/007/009-012 |
| D10 | `invoice.schema.ts:3-4` vs `product.schema.ts:3-4` | contratos duplicados |

---

## C. Contrato REST objetivo (no implementado)

Base URL: `import.meta.env.VITE_INVOICING_API_URL ?? '/api'` (`invoice.api.ts:7`).

| ID | Método | Ruta | Entrada | Salida | Códigos objetivo |
|---|---|---|---|---|---|
| INV-005 | POST | `/invoices` | `InvoiceDraft` (JSON) | `InvoiceDTO` | 201, 400, 401, 403, 409, 500 |
| INV-009 | GET | `/invoices` | — | `InvoiceDTO[]` | 200, 401, 403, 500 |
| INV-010 | GET | `/invoices/:id` | — | `InvoiceDTO` | 200, 401, 403, 404, 500 |
| INV-011 | PATCH | `/invoices/:id/issue` | — | `InvoiceDTO` | 200, 401, 403, 404, 409, 500 |
| INV-012 | PATCH | `/invoices/:id/cancel` | — | `InvoiceDTO` | 200, 401, 403, 404, 409, 500 |
| INV-007 | GET | `/invoices/:id/pdf` | `Accept: application/pdf` | `Blob` | 200, 401, 403, 404, 500 |

`request<T>`: setea `Content-Type: application/json`; serializa body si `!== undefined`; `204`
→ `undefined`; `!ok` → `Error` genérico; resto → `response.json()` con cast (`invoice.api.ts:11-30`).

## D. Criterios diferidos por ausencia de capa de datos

No evaluables hasta que exista backend (declarado en `rules.md` §6 y `context.md` §5.4): modelado de
dinero (`D4`), transacciones atómicas en mutaciones compuestas, constraints de unicidad de
`correlationCode`, paginación/orden/filtros, N+1, y mapeo tipado de errores HTTP (D8).
