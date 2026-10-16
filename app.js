const currency = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const moneyFormat = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});
const dateTime = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});
const shortDate = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
});

const initialData = {
  products: [
    {
      id: "P-1001",
      name: "Martillo carpintero 16 oz",
      sku: "MAR-16OZ",
      category: "Herramientas manuales",
      price: 6990,
      cost: 4200,
      stock: 18,
      minStock: 10,
    },
    {
      id: "P-1002",
      name: "Taladro percutor 650 W",
      sku: "TAL-650",
      category: "Herramientas eléctricas",
      price: 42900,
      cost: 29900,
      stock: 7,
      minStock: 8,
    },
    {
      id: "P-1003",
      name: "Set de brocas y puntas",
      sku: "BRO-SET",
      category: "Accesorios",
      price: 8900,
      cost: 4900,
      stock: 24,
      minStock: 8,
    },
    {
      id: "P-1004",
      name: "Alargador eléctrico 10 m",
      sku: "ALA-10M",
      category: "Electricidad",
      price: 16900,
      cost: 9900,
      stock: 4,
      minStock: 6,
    },
    {
      id: "P-1005",
      name: "Tornillos para madera · 100 u",
      sku: "TOR-MAD100",
      category: "Fijaciones",
      price: 3200,
      cost: 1600,
      stock: 0,
      minStock: 6,
    },
    {
      id: "P-1006",
      name: "Guantes de seguridad",
      sku: "GUA-SEG",
      category: "Seguridad",
      price: 5900,
      cost: 3100,
      stock: 15,
      minStock: 5,
    },
  ],
  movements: [],
  sales: [],
  expenses: [],
  invoices: [],
  nextSale: 104,
  nextInvoice: 1,
};

function createInitialData() {
  const data = structuredClone(initialData);
  const now = Date.now();
  data.movements = [
    {
      id: "M-001",
      productId: "P-1001",
      type: "Entrada",
      quantity: 12,
      reference: "OC-2026-041",
      detail: "Reposición de proveedor",
      date: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: "M-002",
      productId: "P-1002",
      type: "Venta",
      quantity: 2,
      reference: "V-00103",
      detail: "Venta de mostrador",
      date: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: "M-003",
      productId: "P-1004",
      type: "Salida",
      quantity: 1,
      reference: "AJ-0008",
      detail: "Muestra para cliente",
      date: new Date(now - 1000 * 60 * 45).toISOString(),
    },
  ];
  data.sales = [
    {
      id: "V-00103",
      productId: "P-1002",
      quantity: 2,
      unitPrice: 42900,
      total: 85800,
      date: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
      detail: "Venta de mostrador",
    },
  ];
  return data;
}

let data = createInitialData();
let toastTimer;

function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}

function money(value) {
  return moneyFormat.format(Number(value) || 0);
}

function dateOnly(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function productFor(id) {
  return data.products.find((product) => product.id === id);
}

function expenseFor(id) {
  return data.expenses.find((expense) => expense.id === id);
}

function statusFor(product) {
  if (product.stock <= 0) return ["Agotado", "out"];
  if (product.stock <= product.minStock) return ["Stock bajo", "low"];
  return ["En stock", "ok"];
}

function movementSymbol(type) {
  return type === "Entrada"
    ? ["+", "in"]
    : type === "Venta"
      ? ["↗", "sale"]
      : ["−", "out"];
}

function render() {
  renderDashboard();
  renderInventory();
  renderMovements();
  renderSales();
  renderHistory();
  renderReports();
  renderInvoices();
  updateClock();
}

function statCard(label, value, note, icon) {
  return `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></article>`;
}

function renderDashboard() {
  const low = data.products.filter(
    (product) => product.stock <= product.minStock,
  );
  const totalUnits = data.products.reduce(
    (sum, product) => sum + product.stock,
    0,
  );
  const inventoryValue = data.products.reduce(
    (sum, product) => sum + product.stock * product.cost,
    0,
  );
  const today = new Date().toDateString();
  const todaysSales = data.sales.filter(
    (sale) => new Date(sale.date).toDateString() === today,
  );
  const revenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
  document.querySelector("#dashboard-stats").innerHTML = [
    statCard(
      "Productos activos",
      data.products.length,
      `<strong>${low.length} requieren atención</strong>`,
      "▦",
    ),
    statCard(
      "Unidades disponibles",
      currency.format(totalUnits),
      "En todos los productos",
      "◫",
    ),
    statCard(
      "Valor del inventario",
      money(inventoryValue),
      "A costo de compra",
      "$",
    ),
    statCard(
      "Ventas de hoy",
      money(revenue),
      `${todaysSales.length} operaciones registradas`,
      "↗",
    ),
  ].join("");
  document.querySelector("#low-stock-count").textContent = low.length;
  document.querySelector("#low-stock-list").innerHTML = low.length
    ? low
        .slice(0, 4)
        .map(
          (product) =>
            `<div class="low-stock-item"><span class="product-chip">${escapeHtml(product.name.slice(0, 2).toUpperCase())}</span><div class="low-stock-meta"><strong>${escapeHtml(product.name)}</strong><span>Mínimo ${product.minStock} unidades</span></div><span class="low-stock-value">${product.stock} uds.</span></div>`,
        )
        .join("")
    : '<div class="empty-state">Todo el inventario está en niveles saludables.</div>';
  document.querySelector("#recent-movements").innerHTML = recentMovements(5);
  document.querySelector("#banner-date").textContent = new Intl.DateTimeFormat(
    "es-CL",
    { day: "2-digit", month: "short", year: "numeric" },
  )
    .format(new Date())
    .toUpperCase();
}

function recentMovements(limit) {
  return (
    [...data.movements]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
      .map((movement) => {
        const product = productFor(movement.productId);
        const [symbol, color] = movementSymbol(movement.type);
        const sign = movement.type === "Entrada" ? "+" : "−";
        return `<div class="recent-item"><span class="movement-symbol ${color}">${symbol}</span><div class="recent-meta"><strong>${escapeHtml(product?.name || "Producto eliminado")}</strong><span>${escapeHtml(movement.type)} · ${dateTime.format(new Date(movement.date))}</span></div><span class="recent-amount">${sign}${movement.quantity}</span></div>`;
      })
      .join("") ||
    '<div class="empty-state">Los movimientos recientes aparecerán aquí.</div>'
  );
}

function renderInventory() {
  const query = (document.querySelector("#inventory-search")?.value || "")
    .trim()
    .toLowerCase();
  const filter = document.querySelector("#inventory-filter")?.value || "all";
  const products = data.products.filter((product) => {
    const matchesText = `${product.name} ${product.sku} ${product.category}`
      .toLowerCase()
      .includes(query);
    const matchesFilter =
      filter === "all" ||
      (filter === "low" &&
        product.stock > 0 &&
        product.stock <= product.minStock) ||
      (filter === "out" && product.stock <= 0);
    return matchesText && matchesFilter;
  });
  document.querySelector("#inventory-count").textContent =
    `${products.length} productos`;
  document
    .querySelector("#inventory-empty")
    .classList.toggle("hidden", products.length > 0);
  document.querySelector("#inventory-rows").innerHTML = products
    .map((product) => {
      const [label, state] = statusFor(product);
      const width = Math.min(
        100,
        Math.round((product.stock / Math.max(product.minStock * 2, 1)) * 100),
      );
      return `<tr><td><strong>${escapeHtml(product.name)}</strong></td><td class="sku">${escapeHtml(product.sku)}</td><td>${escapeHtml(product.category)}</td><td>${money(product.price)}</td><td><div class="stock-cell"><span>${product.stock} uds.</span><span class="stock-track"><span class="stock-fill ${state}" style="width:${width}%"></span></span></div></td><td><span class="status ${state}">${label}</span></td><td><button class="row-menu" data-action="product-menu" data-id="${escapeHtml(product.id)}" aria-label="Acciones para ${escapeHtml(product.name)}">···</button></td></tr>`;
    })
    .join("");
}

function movementRowsFor(search, filter) {
  const query = (search || "").trim().toLowerCase();
  return [...data.movements]
    .filter((movement) => {
      const product = productFor(movement.productId);
      const text =
        `${product?.name || ""} ${movement.reference} ${movement.detail}`.toLowerCase();
      return (
        text.includes(query) && (filter === "all" || movement.type === filter)
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function movementRowsHtml(movements) {
  return movements
    .map((movement) => {
      const product = productFor(movement.productId);
      const [symbol, color] = movementSymbol(movement.type);
      const quantity =
        movement.type === "Entrada"
          ? `+${movement.quantity}`
          : `−${movement.quantity}`;
      return `<tr><td>${dateTime.format(new Date(movement.date))}</td><td><strong>${escapeHtml(product?.name || "Producto eliminado")}</strong><small>${escapeHtml(product?.sku || "")}</small></td><td><span class="movement-symbol ${color}">${symbol}</span> ${escapeHtml(movement.type)}</td><td>${quantity} uds.</td><td class="sku">${escapeHtml(movement.reference)}</td><td>${escapeHtml(movement.detail || "—")}</td></tr>`;
    })
    .join("");
}

function renderMovements() {
  const movements = movementRowsFor(
    document.querySelector("#movement-search")?.value,
    document.querySelector("#movement-filter")?.value || "all",
  );
  document.querySelector("#movement-count").textContent =
    `${movements.length} registros`;
  document
    .querySelector("#movement-empty")
    .classList.toggle("hidden", movements.length > 0);
  document.querySelector("#movement-rows").innerHTML =
    movementRowsHtml(movements);
}

function renderSales() {
  const today = new Date().toDateString();
  const todaysSales = data.sales.filter(
    (sale) => new Date(sale.date).toDateString() === today,
  );
  const query = (
    document.querySelector("#sales-search")?.value || ""
  ).toLowerCase();
  const sales = [...data.sales]
    .filter((sale) =>
      `${sale.id} ${productFor(sale.productId)?.name || ""}`
        .toLowerCase()
        .includes(query),
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const units = todaysSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const total = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
  document.querySelector("#sales-stats").innerHTML = [
    statCard(
      "Ventas de hoy",
      todaysSales.length,
      "Operaciones registradas",
      "↗",
    ),
    statCard(
      "Unidades vendidas",
      currency.format(units),
      "Durante el día de hoy",
      "▦",
    ),
    statCard("Ingresos de hoy", money(total), "Importe bruto registrado", "$"),
  ].join("");
  document
    .querySelector("#sales-empty")
    .classList.toggle("hidden", sales.length > 0);
  document.querySelector("#sales-rows").innerHTML = sales
    .map(
      (sale) =>
        `<tr><td>${dateTime.format(new Date(sale.date))}</td><td><strong>${escapeHtml(sale.id)}</strong></td><td>${escapeHtml(productFor(sale.productId)?.name || "Producto eliminado")}</td><td>${sale.quantity}</td><td>${money(sale.unitPrice)}</td><td><strong>${money(sale.total)}</strong></td></tr>`,
    )
    .join("");
}

function renderHistory() {
  const filter = document.querySelector("#history-filter")?.value || "all";
  const movements = movementRowsFor(
    document.querySelector("#history-search")?.value,
    filter,
  );
  const totals = ["Entrada", "Salida", "Venta"].map((type) => [
    type,
    data.movements.filter((movement) => movement.type === type).length,
  ]);
  document.querySelector("#history-summary").innerHTML =
    totals
      .map(
        ([label, count], index) =>
          `${index ? '<span class="history-divider"></span>' : ""}<div class="history-metric"><strong>${count}</strong><span>${label}${count === 1 ? "" : "s"}</span></div>`,
      )
      .join("") +
    '<span class="history-divider"></span><div class="history-metric"><strong>' +
    data.movements.length +
    "</strong><span>Registros totales</span></div>";
  document.querySelector("#history-count").textContent =
    `${movements.length} registros`;
  document
    .querySelector("#history-empty")
    .classList.toggle("hidden", movements.length > 0);
  document.querySelector("#history-rows").innerHTML =
    movementRowsHtml(movements);
}

function formatReportPeriod(range, start, end) {
  const startLabel = start
    ? new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(start)
    : "el inicio";
  const endLabel = end
    ? new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(end)
    : "hoy";
  return `${startLabel} · ${endLabel}`;
}

function reportRangeFor(period) {
  const now = new Date();
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  const start = new Date(end);

  if (period === "daily") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (period === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (period === "yearly") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    const startInput = document.querySelector("#report-start");
    const endInput = document.querySelector("#report-end");
    if (startInput.value)
      start.setTime(new Date(`${startInput.value}T00:00:00`).getTime());
    if (endInput.value)
      end.setTime(new Date(`${endInput.value}T23:59:59.999`).getTime());
  }

  return { start, end };
}

function reportDataFor(period) {
  const { start, end } = reportRangeFor(period);
  const sales = data.sales.filter(
    (sale) => new Date(sale.date) >= start && new Date(sale.date) <= end,
  );
  const expenses = data.expenses.filter(
    (expense) =>
      new Date(expense.date) >= start && new Date(expense.date) <= end,
  );
  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const cost = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const units = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  return {
    start,
    end,
    sales,
    expenses,
    revenue,
    cost,
    units,
    profit: revenue - cost,
  };
}

function reportBuckets(period, start, end) {
  const bucketCount =
    period === "weekly"
      ? 7
      : period === "monthly"
        ? 12
        : period === "yearly"
          ? 12
          : Math.min(30, Math.max(1, Math.ceil((end - start) / 86400000) + 1));
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const date = new Date(start);
    if (period === "weekly") date.setDate(start.getDate() + index);
    else if (period === "monthly") date.setMonth(start.getMonth() + index, 1);
    else if (period === "yearly") date.setMonth(start.getMonth() + index);
    else date.setDate(start.getDate() + index);
    return { date, sales: 0, expenses: 0, profit: 0 };
  });

  for (const sale of data.sales) {
    const saleDate = new Date(sale.date);
    if (saleDate < start || saleDate > end) continue;
    const index =
      period === "monthly"
        ? saleDate.getMonth() -
          start.getMonth() +
          (saleDate.getFullYear() - start.getFullYear()) * 12
        : period === "yearly"
          ? saleDate.getMonth() - start.getMonth()
          : Math.floor((saleDate - start) / 86400000);
    const bucket = buckets[Math.max(0, Math.min(buckets.length - 1, index))];
    if (bucket) {
      bucket.sales += sale.total;
      bucket.profit += sale.total;
    }
  }

  for (const expense of data.expenses) {
    const expenseDate = new Date(expense.date);
    if (expenseDate < start || expenseDate > end) continue;
    const index =
      period === "monthly"
        ? expenseDate.getMonth() -
          start.getMonth() +
          (expenseDate.getFullYear() - start.getFullYear()) * 12
        : period === "yearly"
          ? expenseDate.getMonth() - start.getMonth()
          : Math.floor((expenseDate - start) / 86400000);
    const bucket = buckets[Math.max(0, Math.min(buckets.length - 1, index))];
    if (bucket) {
      bucket.expenses += expense.amount;
      bucket.profit -= expense.amount;
    }
  }

  return buckets.map((bucket) => ({
    label:
      period === "monthly"
        ? new Intl.DateTimeFormat("es-PE", { month: "short" }).format(
            bucket.date,
          )
        : period === "yearly"
          ? new Intl.DateTimeFormat("es-PE", { month: "short" }).format(
              bucket.date,
            )
          : new Intl.DateTimeFormat("es-PE", {
              day: "2-digit",
              month: "short",
            }).format(bucket.date),
    sales: bucket.sales,
    expenses: bucket.expenses,
    profit: bucket.profit,
  }));
}

function chartPoints(series, width, height, padding, max) {
  if (!series.length) return "";
  const range = max || 1;
  return series
    .map((value, index) => {
      const x =
        padding +
        index * ((width - padding * 2) / Math.max(series.length - 1, 1));
      const y = height - padding - (value / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function renderFinancialChart(period) {
  const svg = document.querySelector("#financial-chart");
  const { start, end } = reportRangeFor(period);
  const buckets = reportBuckets(period, start, end);
  const values = buckets.map((bucket) => bucket.sales);
  const expenseValues = buckets.map((bucket) => bucket.expenses);
  const profitValues = buckets.map((bucket) => bucket.profit);
  const max = Math.max(...values, ...expenseValues, ...profitValues, 1);
  const width = 760;
  const height = 260;
  const padding = 28;
  const salesPath = chartPoints(values, width, height, padding, max);
  const expensePath = chartPoints(expenseValues, width, height, padding, max);
  const profitPath = chartPoints(profitValues, width, height, padding, max);
  const steps = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const value = max * (1 - ratio);
    const y = padding + ratio * (height - padding * 2);
    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" /><text x="8" y="${y + 4}">${money(value).replace("S/", "S/ ")}</text>`;
  }).join("");
  const xLabels = buckets
    .map(
      (bucket, index) =>
        `<text x="${padding + index * ((width - padding * 2) / Math.max(buckets.length - 1, 1))}" y="245" text-anchor="middle">${escapeHtml(bucket.label)}</text>`,
    )
    .join("");
  svg.innerHTML = `<g class="chart-grid">${steps}</g><path d="${salesPath}" fill="none" stroke="#1555a6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path><path d="${expensePath}" fill="none" stroke="#d36a5d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path><path d="${profitPath}" fill="none" stroke="#2a9d7d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>${xLabels}`;
}

function renderReports() {
  const period = document.querySelector("#report-period")?.value || "daily";
  const report = reportDataFor(period);
  const totalUnits = data.products.reduce(
    (sum, product) => sum + product.stock,
    0,
  );
  const inventoryValue = data.products.reduce(
    (sum, product) => sum + product.stock * product.cost,
    0,
  );
  const lowCount = data.products.filter(
    (product) => product.stock <= product.minStock,
  ).length;
  document.querySelector("#report-stats").innerHTML = [
    statCard(
      "Ventas",
      money(report.revenue),
      `${report.sales.length} operaciones`,
      "↗",
    ),
    statCard(
      "Gastos",
      money(report.cost),
      `${report.expenses.length} registros`,
      "−",
    ),
    statCard(
      "Utilidad",
      money(report.profit),
      report.profit >= 0 ? "Resultado neto" : "Pérdida acumulada",
      "◫",
    ),
    statCard(
      "Unidades vendidas",
      currency.format(report.units),
      period === "custom"
        ? "En el rango elegido"
        : "En el período seleccionado",
      "▦",
    ),
  ].join("");
  document.querySelector("#report-generated-date").textContent =
    dateTime.format(new Date());
  document.querySelector("#report-range-title").textContent =
    period === "daily"
      ? "Resumen diario"
      : period === "weekly"
        ? "Resumen semanal"
        : period === "monthly"
          ? "Resumen mensual"
          : period === "yearly"
            ? "Resumen anual"
            : "Reporte personalizado";
  document.querySelector("#report-range-label").textContent =
    `Desde ${formatReportPeriod(period, report.start, report.end)}`;
  const products = [...data.products]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);
  document.querySelector("#report-products").innerHTML =
    products
      .map(
        (product, index) =>
          `<div class="report-product"><span class="report-rank">0${index + 1}</span><div><strong>${escapeHtml(product.name)}</strong><small>${product.stock} unidades disponibles</small></div><span class="report-product-value">${money(product.stock * product.cost)}</span></div>`,
      )
      .join("") ||
    '<div class="empty-state">No hay productos registrados.</div>';
  document.querySelector("#report-activity").innerHTML = recentMovements(4);
  document.querySelector("#print-report").dataset.lowCount = lowCount;
  renderFinancialChart(period);
  document.querySelector("#report-start").max = localDateValue();
  document.querySelector("#report-end").max = localDateValue();
  if (!document.querySelector("#report-start").value)
    document.querySelector("#report-start").value = dateOnly(report.start);
  if (!document.querySelector("#report-end").value)
    document.querySelector("#report-end").value = dateOnly(report.end);
  document
    .querySelector("#report-period")
    .setAttribute("aria-label", "Tipo de reporte");
}

function renderInvoices() {
  const invoices = [...data.invoices].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  document.querySelector("#invoice-count").textContent =
    `${invoices.length} emitidas`;
  document
    .querySelector("#invoice-empty")
    .classList.toggle("hidden", invoices.length > 0);
  document.querySelector("#invoice-rows").innerHTML = invoices
    .slice(0, 20)
    .map(
      (invoice) =>
        `<tr><td><strong>${escapeHtml(invoice.number)}</strong></td><td>${escapeHtml(new Intl.DateTimeFormat("es-CL").format(new Date(`${invoice.date}T12:00:00`)))}</td><td>${escapeHtml(invoice.customerName)}</td><td>${invoice.lines.reduce((sum, line) => sum + line.quantity, 0)}</td><td><strong>${money(invoice.total)}</strong></td><td><button class="button button-outline invoice-print-button" data-action="print-invoice" data-id="${escapeHtml(invoice.id)}">Imprimir</button></td></tr>`,
    )
    .join("");
}

function updateClock() {
  document.querySelector("#today-label").textContent = new Intl.DateTimeFormat(
    "es-CL",
    { weekday: "long", day: "2-digit", month: "long" },
  )
    .format(new Date())
    .toUpperCase();
  document.querySelector("#footer-clock").textContent = new Intl.DateTimeFormat(
    "es-CL",
    { dateStyle: "medium" },
  ).format(new Date());
}

function showView(name) {
  document
    .querySelectorAll(".view")
    .forEach((view) =>
      view.classList.toggle("active", view.id === `view-${name}`),
    );
  document
    .querySelectorAll(".nav-link")
    .forEach((link) =>
      link.classList.toggle("active", link.dataset.view === name),
    );
  const current =
    document.querySelector(`.nav-link[data-view="${name}"] span:nth-child(2)`)
      ?.textContent || "Resumen";
  document.querySelector("#breadcrumb-current").textContent = current;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toast(message) {
  const element = document.querySelector("#toast");
  element.textContent = message;
  element.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("visible"), 2600);
}

function openModal(title, subtitle, fields, submitText, onSubmit) {
  const root = document.querySelector("#modal-root");
  root.innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-head"><div><h2 id="modal-title">${title}</h2><p>${subtitle}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Cerrar">×</button></header><form class="modal-form"><div class="form-grid">${fields}</div><div class="modal-actions"><button type="button" class="button-muted" data-action="close-modal">Cancelar</button><button type="submit" class="button-submit">${submitText}</button></div></form></section></div>`;
  root
    .querySelector(".modal")
    .addEventListener("click", (event) => event.stopPropagation());
  root.querySelector(".modal-backdrop").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeModal();
  });
  root.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    onSubmit(values);
  });
  root.querySelector("input,select")?.focus();
}

function closeModal() {
  document.querySelector("#modal-root").innerHTML = "";
}

function field(label, name, options = {}) {
  const {
    type = "text",
    placeholder = "",
    value = "",
    min = "",
    step = "",
    required = true,
    full = false,
    hint = "",
  } = options;
  const fullClass = full ? " full" : "";
  const requiredAttr = required ? "required" : "";
  const input =
    type === "select"
      ? `<select name="${name}" ${requiredAttr}>${options.choices || ""}</select>`
      : `<input name="${name}" type="${type}" placeholder="${placeholder}" value="${value}" ${min !== "" ? `min="${min}"` : ""} ${step !== "" ? `step="${step}"` : ""} ${requiredAttr}>`;
  return `<div class="form-field${fullClass}"><label for="field-${name}">${label}</label>${input.replace(`name="${name}"`, `id="field-${name}" name="${name}"`)}${hint ? `<p class="form-hint">${hint}</p>` : ""}</div>`;
}

function showProductForm() {
  const fields =
    field("Nombre del producto", "name", {
      placeholder: "Ej. Martillo carpintero 16 oz",
      full: true,
    }) +
    field("SKU", "sku", { placeholder: "Ej. CAF-250" }) +
    field("Categoría", "category", {
      placeholder: "Ej. Herramientas manuales",
    }) +
    field("Precio de venta", "price", { type: "number", min: "0", step: "1" }) +
    field("Costo de compra", "cost", { type: "number", min: "0", step: "1" }) +
    field("Stock inicial", "stock", {
      type: "number",
      min: "0",
      step: "1",
      value: "0",
    }) +
    field("Aviso de stock bajo", "minStock", {
      type: "number",
      min: "0",
      step: "1",
      value: "5",
    });
  openModal(
    "Añadir producto",
    "Completa los datos para crear una nueva referencia.",
    fields,
    "Guardar producto",
    (values) => {
      if (
        data.products.some(
          (product) =>
            product.sku.toLowerCase() === values.sku.trim().toLowerCase(),
        )
      )
        return toast("Ya existe un producto con ese SKU.");
      const product = {
        id: `P-${Date.now().toString().slice(-7)}`,
        name: values.name.trim(),
        sku: values.sku.trim().toUpperCase(),
        category: values.category.trim(),
        price: Number(values.price),
        cost: Number(values.cost),
        stock: Number(values.stock),
        minStock: Number(values.minStock),
      };
      data.products.push(product);
      if (product.stock > 0)
        data.movements.push({
          id: `M-${Date.now()}`,
          productId: product.id,
          type: "Entrada",
          quantity: product.stock,
          reference: "STOCK-INICIAL",
          detail: "Carga inicial de inventario",
          date: new Date().toISOString(),
        });
      closeModal();
      render();
      toast("Producto añadido al inventario.");
    },
  );
}

function showMovementForm() {
  if (!data.products.length)
    return toast("Añade un producto antes de registrar movimientos.");
  const choices = data.products
    .map(
      (product) =>
        `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} · ${product.stock} uds.</option>`,
    )
    .join("");
  const fields =
    field("Tipo de movimiento", "type", {
      type: "select",
      choices:
        '<option value="Entrada">Entrada</option><option value="Salida">Salida</option>',
    }) +
    field("Producto", "productId", { type: "select", choices }) +
    field("Cantidad", "quantity", { type: "number", min: "1", step: "1" }) +
    field("Referencia", "reference", {
      placeholder: "Ej. OC-2026-042",
      required: false,
    }) +
    field("Detalle", "detail", {
      placeholder: "Motivo o comentario",
      full: true,
      required: false,
    });
  openModal(
    "Registrar movimiento",
    "Ajusta las existencias y deja constancia del motivo.",
    fields,
    "Guardar movimiento",
    (values) => {
      const product = productFor(values.productId);
      const quantity = Number(values.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1)
        return toast("Revisa el producto y la cantidad ingresada.");
      if (values.type === "Salida" && quantity > product.stock)
        return toast(`Solo hay ${product.stock} unidades disponibles.`);
      product.stock += values.type === "Entrada" ? quantity : -quantity;
      data.movements.push({
        id: `M-${Date.now()}`,
        productId: product.id,
        type: values.type,
        quantity,
        reference:
          values.reference.trim() ||
          `MOV-${String(data.movements.length + 1).padStart(4, "0")}`,
        detail:
          values.detail.trim() ||
          (values.type === "Entrada"
            ? "Ingreso de inventario"
            : "Salida de inventario"),
        date: new Date().toISOString(),
      });
      closeModal();
      render();
      toast(`${values.type} de ${quantity} unidades registrada.`);
    },
  );
}

function showSaleForm() {
  const available = data.products.filter((product) => product.stock > 0);
  if (!available.length)
    return toast("No hay productos disponibles para vender.");
  const choices = available
    .map(
      (product) =>
        `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} · ${product.stock} uds.</option>`,
    )
    .join("");
  const fields =
    field("Producto", "productId", { type: "select", choices, full: true }) +
    field("Cantidad", "quantity", {
      type: "number",
      min: "1",
      step: "1",
      value: "1",
    }) +
    field("Precio unitario", "unitPrice", {
      type: "number",
      min: "0",
      step: "1",
      value: String(available[0].price),
    }) +
    field("Detalle", "detail", {
      placeholder: "Ej. Venta de mostrador",
      full: true,
      required: false,
    });
  openModal(
    "Registrar venta",
    "La venta se registrará durante esta sesión y el stock se actualizará automáticamente.",
    fields,
    "Confirmar venta",
    (values) => {
      const product = productFor(values.productId);
      const quantity = Number(values.quantity);
      const unitPrice = Number(values.unitPrice);
      if (
        !product ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        unitPrice < 0
      )
        return toast("Revisa las cantidades y el precio ingresado.");
      if (quantity > product.stock)
        return toast(`Solo hay ${product.stock} unidades disponibles.`);
      const saleId = `V-${String(data.nextSale++).padStart(5, "0")}`;
      const date = new Date().toISOString();
      const detail = values.detail.trim() || "Venta de mostrador";
      const sale = {
        id: saleId,
        productId: product.id,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
        date,
        detail,
      };
      product.stock -= quantity;
      data.sales.push(sale);
      data.movements.push({
        id: `M-${Date.now()}`,
        productId: product.id,
        type: "Venta",
        quantity,
        reference: saleId,
        detail,
        date,
      });
      closeModal();
      render();
      toast(`Venta ${saleId} registrada correctamente.`);
    },
  );
  document
    .querySelector("#field-productId")
    .addEventListener("change", (event) => {
      document.querySelector("#field-unitPrice").value =
        productFor(event.target.value)?.price ?? "";
    });
}

function invoiceProductOptions(selectedId) {
  return data.products
    .filter((product) => product.stock > 0)
    .map(
      (product) =>
        `<option value="${escapeHtml(product.id)}" ${product.id === selectedId ? "selected" : ""}>${escapeHtml(product.name)} · ${product.stock} uds.</option>`,
    )
    .join("");
}

function invoiceLineMarkup(index, selectedId) {
  const product =
    productFor(selectedId) || data.products.find((item) => item.stock > 0);
  const removeButton =
    index === 0
      ? ""
      : `<button type="button" class="invoice-remove-line" data-index="${index}" aria-label="Quitar artículo">×</button>`;
  return `<div class="invoice-line" data-index="${index}"><div class="invoice-line-heading"><strong>Artículo ${String(index + 1).padStart(2, "0")}</strong>${removeButton}</div><div class="invoice-line-fields"><label class="form-field"><span>Producto</span><select name="productId-${index}" required>${invoiceProductOptions(product?.id)}</select></label><label class="form-field"><span>Cantidad</span><input name="quantity-${index}" type="number" min="1" max="${product?.stock || 1}" value="1" step="1" required></label><label class="form-field"><span>Precio neto</span><input name="netPrice-${index}" type="number" min="0" value="${product?.price || 0}" step="1" required></label></div></div>`;
}

function invoiceDraftTotals() {
  const root = document.querySelector("#modal-root");
  if (!root.querySelector("#invoice-lines")) return;
  let subtotal = 0;
  root.querySelectorAll(".invoice-line").forEach((line) => {
    subtotal +=
      (Number(line.querySelector('[name^="quantity-"]').value) || 0) *
      (Number(line.querySelector('[name^="netPrice-"]').value) || 0);
  });
  const taxRate = Number(root.querySelector('[name="taxRate"]').value) || 0;
  const tax = Math.round((subtotal * taxRate) / 100);
  root.querySelector("#invoice-subtotal").textContent = money(subtotal);
  root.querySelector("#invoice-tax").textContent = money(tax);
  root.querySelector("#invoice-total").textContent = money(subtotal + tax);
}

function localDateValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function showInvoiceForm() {
  if (!data.products.some((product) => product.stock > 0))
    return toast("No hay productos disponibles para facturar.");
  const number = `F-${String(data.nextInvoice).padStart(5, "0")}`;
  const fields =
    field("Folio", "invoiceNumber", { value: number, full: true }) +
    field("Fecha de emisión", "invoiceDate", {
      type: "date",
      value: localDateValue(),
    }) +
    field("Forma de pago", "paymentMethod", {
      type: "select",
      choices:
        "<option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Crédito</option>",
    }) +
    field("Nombre o razón social del emisor", "issuerName", {
      value: "NEYRA FERRETERÍA",
      full: true,
    }) +
    field("RUT del emisor", "issuerRut", { placeholder: "76.123.456-7" }) +
    field("Dirección del emisor", "issuerAddress", {
      placeholder: "Dirección comercial",
    }) +
    field("Nombre o razón social del cliente", "customerName", {
      placeholder: "Nombre del cliente",
      full: true,
    }) +
    field("RUT del cliente", "customerRut", { placeholder: "12.345.678-9" }) +
    field("Dirección del cliente", "customerAddress", {
      placeholder: "Dirección del cliente",
      required: false,
    }) +
    `<div class="form-field full"><div class="invoice-section-label"><label>Detalle de artículos</label><span>Precios netos, sin IVA</span></div><div id="invoice-lines">${invoiceLineMarkup(0, data.products.find((product) => product.stock > 0)?.id)}</div><button type="button" class="invoice-add-line" data-action="add-invoice-line">＋ Añadir artículo</button></div>` +
    field("IVA (%)", "taxRate", {
      type: "number",
      min: "0",
      step: "0.1",
      value: "19",
    }) +
    field("Observaciones", "notes", {
      placeholder: "Opcional",
      required: false,
    }) +
    `<div class="invoice-totals form-field full"><div><span>Neto</span><strong id="invoice-subtotal">$0</strong></div><div><span>IVA</span><strong id="invoice-tax">$0</strong></div><div class="invoice-grand-total"><span>Total</span><strong id="invoice-total">$0</strong></div></div>`;
  openModal(
    "Emitir factura",
    "Completa los datos del emisor y del cliente para generar el documento.",
    fields,
    "Emitir factura",
    (values) => {
      const lines = [
        ...document.querySelectorAll("#invoice-lines .invoice-line"),
      ].map((line) => ({
        product: productFor(values[`productId-${line.dataset.index}`]),
        quantity: Number(values[`quantity-${line.dataset.index}`]),
        netPrice: Number(values[`netPrice-${line.dataset.index}`]),
      }));
      if (
        lines.some(
          (line) =>
            !line.product ||
            !Number.isInteger(line.quantity) ||
            line.quantity < 1 ||
            !Number.isFinite(line.netPrice) ||
            line.netPrice < 0,
        )
      )
        return toast("Revisa los artículos, cantidades y precios.");
      const requested = new Map();
      lines.forEach((line) =>
        requested.set(
          line.product.id,
          (requested.get(line.product.id) || 0) + line.quantity,
        ),
      );
      for (const [productId, quantity] of requested) {
        const product = productFor(productId);
        if (quantity > product.stock)
          return toast(
            `Stock insuficiente para ${product.name}: quedan ${product.stock} unidades.`,
          );
      }

      const netSubtotal = lines.reduce(
        (sum, line) => sum + line.quantity * line.netPrice,
        0,
      );
      const taxRate = Number(values.taxRate);
      const taxTotal = Math.round((netSubtotal * taxRate) / 100);
      const invoice = {
        id: `I-${Date.now()}`,
        number: values.invoiceNumber,
        date: values.invoiceDate,
        issuerName: values.issuerName.trim(),
        issuerRut: values.issuerRut.trim(),
        issuerAddress: values.issuerAddress.trim(),
        customerName: values.customerName.trim(),
        customerRut: values.customerRut.trim(),
        customerAddress: values.customerAddress.trim(),
        paymentMethod: values.paymentMethod,
        taxRate,
        netSubtotal,
        taxTotal,
        total: netSubtotal + taxTotal,
        notes: values.notes.trim(),
        lines: lines.map((line) => ({
          productId: line.product.id,
          name: line.product.name,
          sku: line.product.sku,
          quantity: line.quantity,
          netPrice: line.netPrice,
          netTotal: line.quantity * line.netPrice,
        })),
      };
      let allocatedTax = 0;
      invoice.lines.forEach((line, index) => {
        const lineTax =
          index === invoice.lines.length - 1
            ? taxTotal - allocatedTax
            : netSubtotal
              ? Math.round((taxTotal * line.netTotal) / netSubtotal)
              : 0;
        allocatedTax += lineTax;
        line.total = line.netTotal + lineTax;
        line.tax = lineTax;
        const saleId = `V-${String(data.nextSale++).padStart(5, "0")}`;
        const detail = `Factura ${invoice.number}`;
        const date = new Date(`${invoice.date}T12:00:00`).toISOString();
        productFor(line.productId).stock -= line.quantity;
        data.sales.push({
          id: saleId,
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: Math.round(line.total / line.quantity),
          total: line.total,
          date,
          detail,
        });
        data.movements.push({
          id: `M-${Date.now()}-${index}`,
          productId: line.productId,
          type: "Venta",
          quantity: line.quantity,
          reference: invoice.number,
          detail,
          date,
        });
      });
      data.invoices.push(invoice);
      data.nextInvoice += 1;
      closeModal();
      render();
      showInvoicePreview(invoice);
    },
  );
  const root = document.querySelector("#modal-root");
  root.querySelector(".modal").classList.add("invoice-modal");
  root.querySelector('[name="invoiceNumber"]').readOnly = true;
  root
    .querySelector("#invoice-lines")
    .addEventListener("input", invoiceDraftTotals);
  root.querySelector("#invoice-lines").addEventListener("change", (event) => {
    if (event.target.name.startsWith("productId-")) {
      const line = event.target.closest(".invoice-line");
      const product = productFor(event.target.value);
      line.querySelector('[name^="netPrice-"]').value = product?.price || 0;
      line.querySelector('[name^="quantity-"]').max = product?.stock || 1;
    }
    invoiceDraftTotals();
  });
  root
    .querySelector('[name="taxRate"]')
    .addEventListener("input", invoiceDraftTotals);
  root.querySelector(".modal").addEventListener("click", (event) => {
    if (event.target.closest('[data-action="add-invoice-line"]')) {
      const lines = root.querySelector("#invoice-lines");
      const index = lines.querySelectorAll(".invoice-line").length;
      lines.insertAdjacentHTML(
        "beforeend",
        invoiceLineMarkup(
          index,
          data.products.find((product) => product.stock > 0)?.id,
        ),
      );
      invoiceDraftTotals();
    }
    if (event.target.closest('[data-action="remove-invoice-line"]')) {
      event.target.closest(".invoice-line").remove();
      root.querySelectorAll(".invoice-line").forEach((line, index) => {
        line.dataset.index = index;
        line.querySelector("strong").textContent =
          `Artículo ${String(index + 1).padStart(2, "0")}`;
        line.querySelectorAll("select,input").forEach((control) => {
          control.name = control.name.replace(/-\d+$/, `-${index}`);
        });
        const removeButton = line.querySelector(".invoice-remove-line");
        if (index === 0) removeButton?.remove();
        else if (removeButton) removeButton.dataset.index = index;
      });
      invoiceDraftTotals();
    }
  });
  invoiceDraftTotals();
}

function invoiceMarkup(invoice) {
  const invoiceDate = new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
  }).format(new Date(`${invoice.date}T12:00:00`));
  return `<div class="invoice-paper-header"><div><span class="invoice-paper-brand">NEYRA</span><h1>Factura comercial</h1><p>Folio ${escapeHtml(invoice.number)}</p></div><div class="invoice-paper-date"><strong>Fecha de emisión</strong><span>${escapeHtml(invoiceDate)}</span></div></div><div class="invoice-party-grid"><section><span>EMISOR</span><strong>${escapeHtml(invoice.issuerName)}</strong><p>RUT: ${escapeHtml(invoice.issuerRut)}</p><p>${escapeHtml(invoice.issuerAddress)}</p></section><section><span>CLIENTE</span><strong>${escapeHtml(invoice.customerName)}</strong><p>RUT: ${escapeHtml(invoice.customerRut)}</p><p>${escapeHtml(invoice.customerAddress || "—")}</p></section></div><table><thead><tr><th>SKU</th><th>DESCRIPCIÓN</th><th>CANT.</th><th>PRECIO NETO</th><th>NETO</th></tr></thead><tbody>${invoice.lines.map((line) => `<tr><td>${escapeHtml(line.sku)}</td><td>${escapeHtml(line.name)}</td><td>${line.quantity}</td><td>${money(line.netPrice)}</td><td>${money(line.netTotal)}</td></tr>`).join("")}</tbody></table><div class="invoice-paper-bottom"><div><span>Forma de pago</span><strong>${escapeHtml(invoice.paymentMethod)}</strong>${invoice.notes ? `<span>Observaciones: ${escapeHtml(invoice.notes)}</span>` : ""}</div><div class="invoice-paper-totals"><div><span>Neto</span><strong>${money(invoice.netSubtotal)}</strong></div><div><span>IVA (${invoice.taxRate}%)</span><strong>${money(invoice.taxTotal)}</strong></div><div class="invoice-paper-grand"><span>Total</span><strong>${money(invoice.total)}</strong></div></div></div><p class="invoice-paper-legal">Documento comercial no tributario. No reemplaza una factura electrónica autorizada por el SII.</p>`;
}

function showInvoicePreview(invoice) {
  const root = document.querySelector("#modal-root");
  root.innerHTML = `<div class="modal-backdrop"><section class="modal invoice-success-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-success-title"><header class="modal-head"><div><p class="eyebrow">DOCUMENTO EMITIDO</p><h2 id="invoice-success-title">Factura ${escapeHtml(invoice.number)}</h2><p>Registrada correctamente y descontada del inventario.</p></div><button class="modal-close" type="button" data-action="close-invoice-preview" aria-label="Cerrar">×</button></header><div class="invoice-success-body"><div><span>CLIENTE</span><strong>${escapeHtml(invoice.customerName)}</strong></div><div><span>ARTÍCULOS</span><strong>${invoice.lines.reduce((sum, line) => sum + line.quantity, 0)}</strong></div><div class="invoice-success-total"><span>TOTAL</span><strong>${money(invoice.total)}</strong></div><p>Documento comercial no tributario. Puedes imprimirlo o guardarlo como PDF.</p></div><div class="modal-actions"><button type="button" class="button-muted" data-action="close-invoice-preview">Cerrar</button><button type="button" class="button-submit" data-action="print-current-invoice">Imprimir / Guardar PDF</button></div></section></div>`;
  root
    .querySelectorAll('[data-action="close-invoice-preview"]')
    .forEach((button) =>
      button.addEventListener("click", () => closeInvoicePreview()),
    );
  root
    .querySelector('[data-action="print-current-invoice"]')
    .addEventListener("click", () => printInvoice(invoice));
  root.querySelector(".modal-backdrop").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeInvoicePreview();
  });
}

function closeInvoicePreview() {
  document.querySelector("#modal-root").innerHTML = "";
  document.querySelector("#invoice-paper")?.remove();
}

function printInvoice(invoice) {
  let paper = document.querySelector("#invoice-paper");
  if (!paper) {
    paper = document.createElement("article");
    paper.id = "invoice-paper";
    document.body.append(paper);
  }
  paper.innerHTML = invoiceMarkup(invoice);
  document.body.classList.add("printing-invoice");
  window.print();
  document.body.classList.remove("printing-invoice");
}

function printSavedInvoice(id) {
  const invoice = data.invoices.find((item) => item.id === id);
  if (invoice) printInvoice(invoice);
}

function showProductActions(id) {
  const product = productFor(id);
  if (!product) return;
  const choices = data.products
    .map(
      (item) =>
        `<option value="${escapeHtml(item.id)}" ${item.id === id ? "selected" : ""}>${escapeHtml(item.name)} · ${item.stock} uds.</option>`,
    )
    .join("");
  const fields =
    field("Producto", "productId", { type: "select", choices }) +
    field("Tipo de ajuste", "type", {
      type: "select",
      choices:
        '<option value="Entrada">Agregar unidades</option><option value="Salida">Quitar unidades</option><option value="Modificar">Fijar cantidad exacta</option>',
    }) +
    field("Cantidad", "quantity", {
      type: "number",
      min: "0",
      step: "1",
      value: String(product.stock),
    }) +
    field("Referencia", "reference", {
      placeholder: "Opcional",
      required: false,
      full: true,
    });
  openModal(
    "Ajustar existencias",
    product.name,
    fields,
    "Guardar ajuste",
    (values) => {
      const selected = productFor(values.productId);
      const quantity = Number(values.quantity);
      if (!selected || !Number.isInteger(quantity) || quantity < 0)
        return toast("Ingresa una cantidad válida.");
      if (values.type === "Salida" && quantity > selected.stock)
        return toast(`Solo hay ${selected.stock} unidades disponibles.`);
      const previousStock = selected.stock;
      selected.stock =
        values.type === "Modificar"
          ? quantity
          : values.type === "Entrada"
            ? selected.stock + quantity
            : selected.stock - quantity;
      data.movements.push({
        id: `M-${Date.now()}`,
        productId: selected.id,
        type: values.type === "Modificar" ? "Ajuste" : values.type,
        quantity:
          values.type === "Modificar"
            ? Math.abs(selected.stock - previousStock)
            : quantity,
        reference:
          values.reference.trim() ||
          `AJ-${String(data.movements.length + 1).padStart(4, "0")}`,
        detail:
          values.type === "Modificar"
            ? `Cantidad fijada en ${selected.stock} unidades`
            : values.type === "Entrada"
              ? "Ajuste por ingreso de stock"
              : "Ajuste por salida de stock",
        date: new Date().toISOString(),
      });
      closeModal();
      render();
      toast("Existencias actualizadas y movimiento registrado.");
    },
  );
}

function showExpenseForm() {
  const fields =
    field("Descripción", "description", {
      placeholder: "Ej. Compra de cartuchos",
      full: true,
    }) +
    field("Categoría", "category", {
      placeholder: "Ej. Compra, transporte, sueldo",
      full: true,
    }) +
    field("Monto", "amount", { type: "number", min: "0", step: "0.01" }) +
    field("Fecha", "date", { type: "date", value: localDateValue() });
  openModal(
    "Registrar gasto",
    "Añade un egreso para analizarlo en los reportes.",
    fields,
    "Guardar gasto",
    (values) => {
      const amount = Number(values.amount);
      if (
        !values.description.trim() ||
        !values.category.trim() ||
        !Number.isFinite(amount) ||
        amount < 0
      )
        return toast("Revisa la descripción, categoría y monto.");
      data.expenses.push({
        id: `G-${Date.now()}`,
        description: values.description.trim(),
        category: values.category.trim(),
        amount,
        date: new Date(`${values.date}T12:00:00`).toISOString(),
      });
      closeModal();
      render();
      toast("Gasto registrado correctamente.");
    },
  );
}

function printReport() {
  const totalUnits = data.products.reduce(
    (sum, product) => sum + product.stock,
    0,
  );
  const inventoryValue = data.products.reduce(
    (sum, product) => sum + product.stock * product.cost,
    0,
  );
  const salesTotal = data.sales.reduce((sum, sale) => sum + sale.total, 0);
  const lowStock = data.products.filter(
    (product) => product.stock <= product.minStock,
  );
  const movements = [...data.movements].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  const report = document.createElement("article");
  report.id = "report-paper";
  report.innerHTML = `<p class="eyebrow">NEYRA · CONTROL DE INVENTARIO</p><h1>Reporte de stock y ventas</h1><p class="print-subtitle">Generado el ${escapeHtml(dateTime.format(new Date()))} · Período completo</p><div class="print-kpis"><div class="print-kpi"><span>Productos</span><strong>${data.products.length}</strong></div><div class="print-kpi"><span>Unidades disponibles</span><strong>${currency.format(totalUnits)}</strong></div><div class="print-kpi"><span>Valor en bodega</span><strong>${money(inventoryValue)}</strong></div><div class="print-kpi"><span>Ventas acumuladas</span><strong>${money(salesTotal)}</strong></div></div><h2>Inventario actual</h2><table><thead><tr><th>PRODUCTO</th><th>SKU</th><th>CATEGORÍA</th><th>STOCK</th><th>MÍNIMO</th><th>PRECIO</th><th>ESTADO</th></tr></thead><tbody>${data.products.map((product) => `<tr><td>${escapeHtml(product.name)}</td><td>${escapeHtml(product.sku)}</td><td>${escapeHtml(product.category)}</td><td>${product.stock}</td><td>${product.minStock}</td><td>${money(product.price)}</td><td>${product.stock <= 0 ? "Agotado" : product.stock <= product.minStock ? "Stock bajo" : "En stock"}</td></tr>`).join("")}</tbody></table><h2>Movimientos recientes</h2><table><thead><tr><th>FECHA</th><th>PRODUCTO</th><th>TIPO</th><th>CANTIDAD</th><th>REFERENCIA</th><th>DETALLE</th></tr></thead><tbody>${
    movements
      .slice(0, 30)
      .map(
        (movement) =>
          `<tr><td>${escapeHtml(dateTime.format(new Date(movement.date)))}</td><td>${escapeHtml(productFor(movement.productId)?.name || "Producto eliminado")}</td><td>${escapeHtml(movement.type)}</td><td>${movement.type === "Entrada" ? "+" : "−"}${movement.quantity}</td><td>${escapeHtml(movement.reference)}</td><td>${escapeHtml(movement.detail)}</td></tr>`,
      )
      .join("") || '<tr><td colspan="6">Sin movimientos registrados</td></tr>'
  }</tbody></table><h2>Ventas</h2><table><thead><tr><th>FECHA</th><th>VENTA</th><th>PRODUCTO</th><th>UNIDADES</th><th>PRECIO UNITARIO</th><th>TOTAL</th></tr></thead><tbody>${
    [...data.sales]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(
        (sale) =>
          `<tr><td>${escapeHtml(dateTime.format(new Date(sale.date)))}</td><td>${escapeHtml(sale.id)}</td><td>${escapeHtml(productFor(sale.productId)?.name || "Producto eliminado")}</td><td>${sale.quantity}</td><td>${money(sale.unitPrice)}</td><td>${money(sale.total)}</td></tr>`,
      )
      .join("") || '<tr><td colspan="6">Sin ventas registradas</td></tr>'
  }</tbody></table><p class="print-footer">${lowStock.length} productos con stock bajo o agotado · Reporte generado localmente por Neyra.</p>`;
  document.querySelector("#report-paper")?.remove();
  document.body.append(report);
  document.body.classList.add("printing");
  window.print();
  document.body.classList.remove("printing");
  report.remove();
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) return showView(viewButton.dataset.view);
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  if (actionButton.dataset.action === "new-product") showProductForm();
  if (actionButton.dataset.action === "new-movement") showMovementForm();
  if (actionButton.dataset.action === "new-sale") showSaleForm();
  if (actionButton.dataset.action === "new-expense") showExpenseForm();
  if (actionButton.dataset.action === "close-modal") closeModal();
  if (actionButton.dataset.action === "product-menu")
    showProductActions(actionButton.dataset.id);
  if (actionButton.dataset.action === "print-invoice")
    printSavedInvoice(actionButton.dataset.id);
});

document
  .querySelector("#inventory-search")
  .addEventListener("input", renderInventory);
document
  .querySelector("#inventory-filter")
  .addEventListener("change", renderInventory);
document
  .querySelector("#movement-search")
  .addEventListener("input", renderMovements);
document
  .querySelector("#movement-filter")
  .addEventListener("change", renderMovements);
document
  .querySelector("#history-search")
  .addEventListener("input", renderHistory);
document
  .querySelector("#history-filter")
  .addEventListener("change", renderHistory);
document.querySelector("#sales-search").addEventListener("input", renderSales);
document
  .querySelector("#report-period")
  .addEventListener("change", renderReports);
document
  .querySelector("#report-start")
  .addEventListener("change", renderReports);
document.querySelector("#report-end").addEventListener("change", renderReports);
document.querySelector("#print-report").addEventListener("click", printReport);
document
  .querySelector("#new-expense")
  .addEventListener("click", showExpenseForm);
document
  .querySelector("#new-invoice")
  .addEventListener("click", showInvoiceForm);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (document.querySelector('[data-action="print-current-invoice"]'))
    closeInvoicePreview();
  else closeModal();
});

render();
