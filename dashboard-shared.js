"use strict";
var DashboardShared = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/legacy.ts
  var legacy_exports = {};
  __export(legacy_exports, {
    MONTH_NAMES: () => MONTH_NAMES,
    applyTableColumnFilters: () => applyTableColumnFilters,
    attachAllTableColumnFilters: () => attachAllTableColumnFilters,
    attachTableColumnFilters: () => attachTableColumnFilters,
    buildClientPie: () => buildClientPie,
    buildItemPie: () => buildItemPie,
    buildMonthlyBarFromRows: () => buildMonthlyBarFromRows,
    filterByDate: () => filterByDate,
    fmt: () => fmt,
    fmt0: () => fmt0,
    fmt2: () => fmt2,
    getDualMonthCols: () => getDualMonthCols,
    getSortedMonths: () => getSortedMonths,
    sortTableDom: () => sortTableDom,
    sumMonthRows: () => sumMonthRows
  });

  // src/format.ts
  function fmt(n) {
    if (n == null || Number.isNaN(n)) return "—";
    return Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function fmt0(n) {
    return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function fmt2(n) {
    return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  var MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  // src/salesDateFilter.ts
  function getSortedMonths(selectedMonths) {
    return [...selectedMonths].sort((a, b) => {
      const [ay, am] = a.split("-").map(Number);
      const [by, bm] = b.split("-").map(Number);
      return ay * 100 + am - (by * 100 + bm);
    });
  }
  function getDualMonthCols(selectedMonths) {
    const byMonth = {};
    getSortedMonths(selectedMonths).forEach((mk) => {
      const [y, m] = mk.split("-").map(Number);
      if (!byMonth[m] || y > byMonth[m]) byMonth[m] = y;
    });
    return Object.entries(byMonth).map(([m, y]) => ({ m: +m, cur: +y, prev: +y - 1 })).sort((a, b) => a.cur * 100 + a.m - (b.cur * 100 + b.m));
  }
  function sumMonthRows(rows, year, month) {
    const matched = rows.filter((r) => Number(r.year) === year && Number(r.month) === month);
    return {
      cash: matched.reduce((a, r) => a + (r.cash || 0), 0),
      qty: matched.reduce((a, r) => a + (r.qty || 0), 0)
    };
  }
  function filterByDate(rows, filters) {
    if (filters.dateMode === "range") {
      const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const to = filters.dateTo ? new Date(filters.dateTo) : null;
      return rows.filter((r) => {
        if (!r.date) return false;
        const d = new Date(r.date);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    if (filters.dateMode === "months") {
      if (!filters.selectedMonths.size) return [];
      return rows.filter((r) => {
        let yr = Number(r.year);
        let mo = Number(r.month);
        if ((!mo || !yr) && r.date && r.date.length >= 7) {
          yr = yr || parseInt(r.date.substring(0, 4), 10);
          mo = mo || parseInt(r.date.substring(5, 7), 10);
        }
        return filters.selectedMonths.has(`${yr}-${mo}`);
      });
    }
    return rows;
  }

  // src/itemNames.ts
  function preferItemName(current, candidate) {
    const next = String(candidate ?? "").trim();
    if (!next) return current;
    if (!current.trim()) return next;
    return next.length > current.length ? next : current;
  }

  // src/pieData.ts
  function buildItemPie(rows) {
    const map = {};
    rows.forEach((r) => {
      if (!r.itemSKU) return;
      if (!map[r.itemSKU]) map[r.itemSKU] = { name: r.itemName || r.itemSKU, cash: 0, qty: 0 };
      map[r.itemSKU].name = preferItemName(map[r.itemSKU].name, r.itemName);
      map[r.itemSKU].cash += r.cash || 0;
      map[r.itemSKU].qty += r.qty || 0;
    });
    return Object.entries(map).map(([sku, it]) => ({
      label: it.name,
      value: it.cash,
      qty: it.qty,
      sku
    }));
  }
  function buildClientPie(rows) {
    const map = {};
    rows.forEach((r) => {
      if (!r.clientID) return;
      if (!map[r.clientID]) map[r.clientID] = { name: r.clientName || r.clientID, cash: 0, qty: 0 };
      map[r.clientID].cash += r.cash || 0;
      map[r.clientID].qty += r.qty || 0;
    });
    return Object.values(map).map((cl) => ({ label: cl.name, value: cl.cash, qty: cl.qty }));
  }
  function buildMonthlyBarFromRows(rows, selectedMonths) {
    const months = getSortedMonths(selectedMonths);
    const labels = months.map((mk) => {
      const [y, m] = mk.split("-");
      return `${MONTH_NAMES[+m - 1]} ${y}`;
    });
    const cashVals = months.map((mk) => {
      const [y, m] = mk.split("-");
      return rows.filter((r) => Number(r.year) === +y && Number(r.month) === +m).reduce((a, r) => a + (r.cash || 0), 0);
    });
    const qtyVals = months.map((mk) => {
      const [y, m] = mk.split("-");
      return rows.filter((r) => Number(r.year) === +y && Number(r.month) === +m).reduce((a, r) => a + (r.qty || 0), 0);
    });
    return { labels, cashVals, qtyVals };
  }

  // src/sortTableDom.ts
  function sortTableDom(th) {
    const table = th.closest("table");
    const tbody = table?.querySelector("tbody");
    if (!tbody) return;
    const idx = th.cellIndex;
    const asc = th.dataset.sd !== "asc";
    table.querySelectorAll("th.sortable").forEach((h) => {
      h.dataset.sd = "";
      const si2 = h.querySelector(".si");
      if (si2) si2.textContent = " ↕";
    });
    th.dataset.sd = asc ? "asc" : "desc";
    const si = th.querySelector(".si");
    if (si) si.textContent = asc ? " ↑" : " ↓";
    const rows = [...tbody.querySelectorAll("tr")];
    rows.sort((a, b) => {
      const ac = a.cells[idx];
      const bc = b.cells[idx];
      if (!ac || !bc) return 0;
      const av = ac.dataset.sv !== void 0 && ac.dataset.sv !== "" ? Number(ac.dataset.sv) : Number.NaN;
      const bv = bc.dataset.sv !== void 0 && bc.dataset.sv !== "" ? Number(bc.dataset.sv) : Number.NaN;
      if (!Number.isNaN(av) && !Number.isNaN(bv)) return asc ? av - bv : bv - av;
      const at = ac.textContent?.trim() ?? "";
      const bt = bc.textContent?.trim() ?? "";
      const an = parseFloat(at.replace(/,/g, ""));
      const bn = parseFloat(bt.replace(/,/g, ""));
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return asc ? an - bn : bn - an;
      return asc ? at.localeCompare(bt) : bt.localeCompare(at);
    });
    rows.forEach((r) => tbody.appendChild(r));
  }

  // src/tableColumnFilters.ts
  var COLUMN_PATTERNS = [
    { pattern: /^sku\b/i },
    { pattern: /^item\s*name/i },
    { pattern: /^price\b/i }
  ];
  function headerText(th) {
    const clone = th.cloneNode(true);
    clone.querySelectorAll(".si, .col-filter-wrap").forEach((el) => el.remove());
    return clone.textContent?.replace(/\s+/g, " ").trim() ?? "";
  }
  function findColumnIndex(ths, pattern) {
    return ths.findIndex((th) => pattern.test(headerText(th)));
  }
  function applyTableColumnFilters(table) {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    const filters = [...table.querySelectorAll("thead .col-filter")].map((inp) => {
      const q = inp.value.trim().toLowerCase();
      const modeBtn = inp.parentElement?.querySelector(".col-filter-mode");
      const mode = modeBtn?.dataset.mode ?? "in";
      return { ci: Number(inp.dataset.colIdx), q, mode };
    }).filter((f) => f.q !== "" && !Number.isNaN(f.ci));
    tbody.querySelectorAll("tr").forEach((tr) => {
      const cells = [...tr.querySelectorAll("td")];
      let vis = true;
      for (const f of filters) {
        const txt = (cells[f.ci]?.textContent ?? "").toLowerCase();
        const terms = f.q.split("&").map((t) => t.trim()).filter(Boolean);
        if (f.mode === "in" && !terms.some((t) => txt.includes(t))) {
          vis = false;
          break;
        }
        if (f.mode === "out" && terms.some((t) => txt.includes(t))) {
          vis = false;
          break;
        }
      }
      tr.style.display = vis ? "" : "none";
    });
    const footRow = table.querySelector("tfoot tr");
    if (!footRow) return;
    const footCells = [...footRow.querySelectorAll("td")];
    const visRows = [...tbody.querySelectorAll("tr")].filter(
      (r) => r.style.display !== "none"
    );
    footCells.forEach((fc, ci) => {
      if (ci <= 1) return;
      const vals = visRows.map((tr) => {
        const td = tr.querySelectorAll("td")[ci];
        const sv = td?.dataset?.sv;
        if (sv == null || sv === "") return null;
        const n = Number(sv);
        return Number.isFinite(n) && sv !== "-99999" && sv !== "-1" ? n : null;
      }).filter((v) => v !== null);
      if (!vals.length) return;
      const sum = vals.reduce((a, b) => a + b, 0);
      fc.textContent = Number.isInteger(sum) ? fmt0(sum) : fmt2(sum);
    });
  }
  function attachColumnFilter(table, th, colIdx) {
    if (th.querySelector(".col-filter-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "col-filter-wrap";
    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "col-filter";
    inp.placeholder = "▾ filter…";
    inp.dataset.colIdx = String(colIdx);
    inp.addEventListener("click", (e) => e.stopPropagation());
    inp.addEventListener("input", () => applyTableColumnFilters(table));
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "col-filter-mode";
    btn.textContent = "IN";
    btn.dataset.mode = "in";
    btn.title = "Toggle: show matching / hide matching";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const nowIn = btn.dataset.mode === "in";
      btn.dataset.mode = nowIn ? "out" : "in";
      btn.textContent = nowIn ? "OUT" : "IN";
      btn.classList.toggle("col-filter-mode-out", nowIn);
      applyTableColumnFilters(table);
    });
    wrap.appendChild(inp);
    wrap.appendChild(btn);
    th.appendChild(wrap);
  }
  function attachTableColumnFilters(table) {
    const ths = [...table.querySelectorAll("thead th")];
    if (!ths.length) return false;
    let attached = false;
    for (const { pattern } of COLUMN_PATTERNS) {
      const idx = findColumnIndex(ths, pattern);
      if (idx !== -1) {
        attachColumnFilter(table, ths[idx], idx);
        attached = true;
      }
    }
    return attached;
  }
  function attachAllTableColumnFilters(root) {
    let count = 0;
    root.querySelectorAll("table").forEach((table) => {
      if (attachTableColumnFilters(table)) count += 1;
    });
    return count;
  }
  return __toCommonJS(legacy_exports);
})();
