# Wiselink Ops Tools

Internal Wiselink web app for electronics-distribution operations. Staff upload Excel workbooks; each tool transforms them and downloads a result (or, for one Plexus flow, sends email).

Live site: [https://tech.wiselinkapp.com](https://tech.wiselinkapp.com)

This is a **Create React App** frontend. Most tools parse and write `.xlsx` entirely in the browser. Two quotation tools POST files to Wiselink backends and download the response.

## Who this is for

Wiselink operations staff working with EMS customers (**Plexus**, **Jabil**), ecommerce stock pricing, supplier quotations, and PO reschedules.

If you are a coding agent: treat this README as the product spec. Spreadsheet column indexes are hardcoded and brittle — change a parser only with the matching input template in mind.

## Domain terms

| Term | Meaning |
|---|---|
| **CPN** | Customer part number |
| **MPN** | Manufacturer part number |
| **MOQ** | Minimum order quantity |
| **LT** | Lead time |
| **JIT** | Just-in-time program flag in Plexus forecasts |
| **CPO** | Customer purchase order |
| **Stock code** | Internal Wiselink item code |

## Run locally

Yarn is the package manager. Keep `yarn.lock`. Do not reintroduce `package-lock.json`.

```bash
yarn install
yarn start          # http://localhost:3000
yarn build          # production bundle in build/
yarn test
```

`package.json` `"homepage"` is `https://tech.wiselinkapp.com`. Production is a GitHub Pages SPA (`public/404.html` + redirect script in `public/index.html`).

## Architecture

```
Browser
  ├── Client-side tools (xlsx / ExcelJS + file-saver)
  │     Plexus JIT, Plexus/Jabil forecast diff, stock pricing,
  │     price compile, reschedule
  ├── EmailJS (Plexus Email)
  └── HTTP backends
        POST https://worker.wiselinkapp.com/upload   Transfer Quotation
        POST https://157.245.198.24/update           Input Supplier Price
```

- **Routing:** React Router v6 in `src/App.js`. Sidebar labels/paths come from `src/routes.js` (nav only — not the actual `<Route>` table).
- **UI:** MUI + Emotion. Shared layout in `src/App.js` (persistent left drawer) and `src/components/Sidebar.js`.
- **Styles:** `src/styles.js` + `src/useClasses.js`. Fonts: Airbnb Cereal in `src/fonts/`.
- **Excel:** SheetJS `xlsx` reads the **first sheet** as binary string (`FileReader.readAsBinaryString`). Rescheduler writes with `exceljs`.
- **No app backend in this repo.** Quotation transforms live on separate services.

## Repo map

```
src/
  App.js                 Shell, theme, real <Route> table
  routes.js              Sidebar metadata (path, name, icon, unused component field)
  components/Sidebar.js  Collapsible nav: Plexus / Jabil / Ecommerce / Quotation / Admin
  views/                 One screen per tool (see table below)
  utils.js               excelDateToJSDate (used by Plexus JIT)
  styles.js              Shared layout styles for upload screens
  assets/Format.png      Screenshot of required price-list layout (Compile + Input Supplier Price)
public/
  index.html             Title "Wiselink"; GitHub Pages SPA redirect
  404.html               GitHub Pages path restore
```

## Routes

Sidebar grouping is UX-only. Quotation tools live under `/admin/...` URLs.

| Sidebar | Path | View file | Processing |
|---|---|---|---|
| Plexus → JIT Program | `/plexus/jit` | `views/Nexus.js` | Client |
| Plexus → Forecast | `/plexus/forecast` | `views/PlexusForecast.js` | Client |
| Plexus → Email | `/plexus/email` | `views/PlexusEmail.js` | EmailJS |
| Jabil → Forecast | `/jabil/forecast` | `views/JabilForecast.js` | Client |
| Ecommerce → Online Stock Pricing | `/ecommerce/online-stock-pricing` | `views/Compare.js` | Client |
| Ecommerce → Compile | `/ecommerce/compile` | `views/Compile.js` | Client |
| Quotation → Transfer Quotation | `/admin/transfer-quotation` | `views/QuotationCompare.js` | Backend |
| Quotation → Input Supplier Price | `/admin/input-supplier-price` | `views/QuotationCompile.js` | Backend |
| Admin → Reschedule | `/admin/reschedule` | `views/Rescheduler.js` | Client |

`/` is registered in `App.js` with a React Router v5 `render` prop, which **does nothing in v6**. Landing on `/` shows an empty main pane.

`src/routes.js` `component` for `/plexus/email` is wrongly set to `PlexusForecast`. `App.js` is the source of truth and mounts `PlexusEmail`.

---

## Tools

Every client-side parser uses **0-based column indexes** on the first worksheet. Header rows are skipped as noted.

### 1. Plexus JIT Program — `Nexus.js`

Builds a JIT working file: filter JIT lines, join MPN master data, insert Excel formulas for balances / late commit / weeks late.

**Inputs**

1. **Plexus forecast file** — keep original headers. Rows where column F (index `5`) is `"JIT"` are kept. Dates in columns D (`3`), M (`12`), P (`15`) are parsed (Excel serial or `M/D/YYYY`).
2. **MPN list** — keyed by column A (Plexus part number):

   | Col | Field |
   |---|---|
   | A `0` | Plexus part number (join key = forecast `PlexusPartNumber`) |
   | B `1` | MPN |
   | C `2` | MOQ |
   | D `3` | LT |
   | E `4` | Manufacturer |

**Behavior**

- Groups consecutive rows that share column E (index `4`, MPN in the forecast).
- Inserts two blank rows between groups. On the first blank row after a group, writes the looked-up MPN into `PlexusPartNumber`.
- Appends columns: Committed Qty, Commit ETA, Balance Qty, Balance Qty with Commit Qty, MOQ, LT, Late Commit ETA, Week Counter, plus Manufacturer at column Z.
- First row of a group: `Balance Qty = H+I+O-N`, `Balance Qty with Commit = H+I+O+R-N`. Later rows roll from the previous row’s T/U.
- `Late Commit ETA = IF(S>P,1,"")`, `Week Counter = INT((TODAY()-P)/7)`.

**Output:** `Data.xlsx`

### 2. Plexus Forecast Comparison — `PlexusForecast.js`

Diffs two Plexus forecasts by **facility + part**.

**Inputs:** Old file, New file. Data starts at row 2 (index `1`).

| Col | Field |
|---|---|
| C `2` | Facility / site |
| E `4` | Part number |

Key = `facilityNumber + partNumber`.

**Output:** `Plexus_Forecast_Comparison.xlsx` with three blocks:

1. In old, not in new (`NOT IN FORECAST`)
2. `NEWLY AWARDED PARTS` (in new, not in old)
3. `EXISTING BUSINESS` (intersection)

### 3. Plexus Email — `PlexusEmail.js`

Reads buyer booking details and sends EmailJS messages grouped by recipient email.

**Input columns** (row 2 onward; empty row aborts with a format alert):

| Col | Field |
|---|---|
| A `0` | CPN |
| B `1` | Stock code (sent as MPN in the email table) |
| D `3` | Brand / manufacturer |
| E `4` | Buyer name |
| F `5` | Email |

**Current send behavior (important):** `to_email` is hardcoded to `darryleong95@gmail.com`; the real row email is commented out. The loop `break`s after the first recipient. The CC text field is unused. EmailJS service/template/user IDs are inlined in the view.

### 4. Jabil Forecast Comparison — `JabilForecast.js`

Same three-block diff as Plexus, different columns and start row.

**Inputs:** Old file, New file. Data starts at row 4 (index `3`).

| Col | Field |
|---|---|
| C `2` | Buyer part code |
| D `3` | MPN |

Key = `buyerPartCode + ',' + mpn`.

**Output:** `Jabil_Forecast_Comparison.xlsx`

### 5. Online Stock Pricing — `Compare.js`

Joins a stock list with the **latest** customer and supplier prices by date.

**Inputs**

| File | Columns (row 2+) | Date rule |
|---|---|---|
| Stock list | A `0` stock code | Order of this list is the output order |
| Customer price | A stock code, B CPO date, C MOQ, D price | Keep row with newest B |
| Supplier price | A receive date, B stock code, C price | Keep row with newest A; skip rows where A is `Forwarder :` |

**Output:** `Data.xlsx` with `Stock Code (Max 30 Chars)`, `MOQ`, `Supplier Price`, `Customer Price`. Missing values become `-`.

### 6. Compile (Price Multiplier) — `Compile.js`

Merges one or two quantity-break price sheets and applies per-quantity markup.

**Input layout** (shown on-screen via `assets/Format.png`):

- Row 1: column A is a label (e.g. MPN); remaining headers are **integer quantities**.
- Later rows: A = part name; other cells = unit price at that quantity.

File 2 is optional (disabled until file 1 is loaded). If both are present, for each part × quantity the **lower** price is kept; parts only in one file are copied through.

Each quantity gets a markup field (default `1`). Output price = `unitPrice * markup`.

**Output:** `Data.xlsx` (`MPN` + quantity columns).

### 7. Transfer Quotation — `QuotationCompare.js`

Merges an old system quotation export into a new quotation file when **CPN and MPN match**. Output follows the new file’s template.

**Request**

```
POST https://worker.wiselinkapp.com/upload
multipart/form-data
  file1 = old quotation
  file2 = new quotation
```

Downloads the blob using `Content-Disposition` filename when present. Shows a MUI backdrop spinner while waiting.

### 8. Input Supplier Price — `QuotationCompile.js`

Fills supplier prices into an input workbook from a price list. UI requires the Compile-style format (`assets/Format.png`).

**Request**

```
POST https://157.245.198.24/update
multipart/form-data
  file       = input file
  price_list = price list
responseType: arraybuffer
```

**Output:** always downloaded as `output.xlsx`.

### 9. Reschedule Report — `Rescheduler.js`

Aligns system delivery schedule with customer reschedule requests by **PO + CPN**.

**Input:** starts at row 3 (index `2`).

| Col | System side | Col | Customer side |
|---|---|---|---|
| A `0` | Line | I `8` | CPN |
| B `1` | CPO / PO | K `10` | PO |
| C `2` | CPN | L `11` | Report line |
| D `3` | Stock code | M `12` | Open PO qty |
| E `4` | Del qty | N `13` | Reschedule date |
| F `5` | Del date (Excel serial) | O `14` | Action request |
| G `6` | Stock | | |
| H `7` | Remarks | | |

Join key: `PO + "_____" + CPN`. System and customer lines for the same key are sorted by date and written side by side (`-` if one side has fewer rows).

**Output:** `Rescheduled.xlsx` via ExcelJS (styled headers: SYSTEM SCHEDULE vs CUSTOMER RESCHEDULE).

---

## Conventions for code changes

1. **`App.js` owns routes.** Update `src/routes.js` in the same change or the sidebar will point at the wrong path/label. Do not trust `routes.js` `component`.
2. **Do not “fix” spreadsheet indexes** without a sample file. Ops templates are the contract.
3. **Client vs server:** keep JIT / forecast / pricing / reschedule in-browser unless there is a reason to add a backend. Quotation merge/price-fill already live elsewhere.
4. **Yarn only.** `yarn.lock` is the lockfile.
5. Several views mutate React state in place (`array.push` / object mutation) instead of `setState`. Preserve behavior unless you are deliberately rewriting that tool.
6. `src/utils.js` `excelDateToJSDate` passes `Date` constructor args in a nonstandard order (`year, date-1, month+1`). Plexus JIT depends on it.
7. EmailJS credentials and the hardcoded recipient in `PlexusEmail.js` are currently in source. Do not expand blast radius (the `break` after the first send is load-bearing until that is intended).

## Scripts (package.json)

| Script | What |
|---|---|
| `yarn start` | CRA dev server |
| `yarn build` | Production build (`build/`) |
| `yarn test` | CRA test runner |
| `yarn tailwind` | Watches `src/index.css` → `dist/output.css` (not wired into the CRA bundle; UI is MUI/Emotion) |
