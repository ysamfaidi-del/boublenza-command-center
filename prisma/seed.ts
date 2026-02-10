import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (order matters for FK constraints)
  // Trading tables first
  await prisma.auditLog.deleteMany();
  await prisma.qualityTest.deleteMany();
  await prisma.vaRBacktest.deleteMany();
  await prisma.tradingLimit.deleteMany();
  await prisma.pnLAttribution.deleteMany();
  await prisma.settlementTransaction.deleteMany();
  await prisma.tradingPosition.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.derivative.deleteMany();
  await prisma.futuresContract.deleteMany();
  await prisma.marketData.deleteMany();
  // Original tables
  await prisma.cashEntry.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.productCost.deleteMany();
  await prisma.productionTarget.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.reseller.deleteMany();
  await prisma.stockEntry.deleteMany();
  await prisma.productionEntry.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.client.deleteMany();
  await prisma.product.deleteMany();

  // ══════════════════════════════════════════════════════
  // PRODUCTS
  // ══════════════════════════════════════════════════════
  const caruma = await prisma.product.create({
    data: { name: "CARUMA", category: "food", unit: "kg", pricePerKg: 4.5 },
  });
  const carani = await prisma.product.create({
    data: { name: "CARANI", category: "animal_feed", unit: "kg", pricePerKg: 2.0 },
  });
  const extract = await prisma.product.create({
    data: { name: "CAROB EXTRACT", category: "extract", unit: "kg", pricePerKg: 8.5 },
  });
  const products = [caruma, carani, extract];

  // ══════════════════════════════════════════════════════
  // PRODUCT COSTS (per kg, realistic for carob processing)
  // ══════════════════════════════════════════════════════
  const costData = [
    { productId: caruma.id, rawMaterialCost: 1.20, laborCost: 0.65, energyCost: 0.35, packagingCost: 0.25, overheadCost: 0.30 },
    { productId: carani.id, rawMaterialCost: 0.60, laborCost: 0.30, energyCost: 0.20, packagingCost: 0.15, overheadCost: 0.20 },
    { productId: extract.id, rawMaterialCost: 2.50, laborCost: 1.20, energyCost: 0.80, packagingCost: 0.40, overheadCost: 0.50 },
  ];
  for (const c of costData) {
    await prisma.productCost.create({ data: c });
  }

  // ══════════════════════════════════════════════════════
  // PRODUCTION TARGETS (per product per month)
  // ══════════════════════════════════════════════════════
  const now = new Date();
  const carumaTargets = [18000, 20000, 22000, 23000, 21000, 18000, 16000, 17000, 20000, 24000, 25000, 24000];
  const caraniTargets = [8000, 9000, 9500, 10000, 9000, 8000, 7500, 7500, 9000, 10000, 11000, 10500];
  const extractTargets = [3000, 3500, 3800, 4000, 3500, 3000, 2800, 2800, 3500, 4000, 4500, 4200];

  for (let m = 0; m < 12; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + m, 1);
    await prisma.productionTarget.create({
      data: { productId: caruma.id, month: d.getMonth() + 1, year: d.getFullYear(), quantity: carumaTargets[m], capacity: 40000 },
    });
    await prisma.productionTarget.create({
      data: { productId: carani.id, month: d.getMonth() + 1, year: d.getFullYear(), quantity: caraniTargets[m], capacity: 40000 },
    });
    await prisma.productionTarget.create({
      data: { productId: extract.id, month: d.getMonth() + 1, year: d.getFullYear(), quantity: extractTargets[m], capacity: 40000 },
    });
  }

  // ══════════════════════════════════════════════════════
  // CLIENTS
  // ══════════════════════════════════════════════════════
  const clientsData = [
    { name: "Danone Algérie", country: "Algérie", city: "Alger", email: "import@danone.dz" },
    { name: "Cevital SPA", country: "Algérie", city: "Béjaïa", email: "achat@cevital.dz" },
    { name: "Groupe Benamor", country: "Algérie", city: "Guelma", email: "supply@benamor.dz" },
    { name: "Carrefour France", country: "France", city: "Paris", email: "bio@carrefour.fr" },
    { name: "Naturalia SAS", country: "France", city: "Lyon", email: "sourcing@naturalia.fr" },
    { name: "Bio Suisse AG", country: "Suisse", city: "Zürich", email: "import@biosuisse.ch" },
    { name: "Mercadona SA", country: "Espagne", city: "Valencia", email: "compras@mercadona.es" },
    { name: "Ülker Gıda", country: "Turquie", city: "Istanbul", email: "tedarik@ulker.com.tr" },
    { name: "Dr. Oetker GmbH", country: "Allemagne", city: "Bielefeld", email: "einkauf@oetker.de" },
    { name: "Whole Foods Market", country: "USA", city: "Austin", email: "sourcing@wholefoods.com" },
    { name: "Morinaga & Co", country: "Japon", city: "Tokyo", email: "import@morinaga.co.jp" },
    { name: "Royal Canin", country: "France", city: "Aimargues", email: "ingredients@royalcanin.com" },
    { name: "Mars Petcare", country: "USA", city: "Franklin", email: "procurement@mars.com" },
    { name: "Barilla Group", country: "Italie", city: "Parma", email: "acquisti@barilla.com" },
    { name: "Fazer Group", country: "Finlande", city: "Helsinki", email: "sourcing@fazer.com" },
  ];
  const clients = [];
  for (const c of clientsData) {
    clients.push(await prisma.client.create({ data: c }));
  }

  // ══════════════════════════════════════════════════════
  // PRODUCTION ENTRIES — 12 months
  // ══════════════════════════════════════════════════════
  const baseProduction: Record<string, number[]> = {
    [caruma.id]: [18000, 19500, 21000, 22000, 20000, 17000, 15000, 16000, 19000, 22500, 24000, 23000],
    [carani.id]: [8000, 8500, 9000, 9500, 8800, 7500, 7000, 7200, 8500, 9800, 10500, 10000],
    [extract.id]: [3000, 3200, 3500, 3800, 3400, 2800, 2500, 2700, 3200, 3800, 4200, 4000],
  };
  const shifts = ["morning", "afternoon", "night"];
  const qualities = ["A", "A", "A", "B", "A", "A", "B", "A"];

  for (const [productId, monthlyQty] of Object.entries(baseProduction)) {
    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + m, 1);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      const dailyQty = monthlyQty[m] / daysInMonth;
      for (let d = 1; d <= daysInMonth; d += 3) {
        const variation = 0.8 + Math.random() * 0.4;
        await prisma.productionEntry.create({
          data: {
            productId,
            quantity: Math.round(dailyQty * 3 * variation),
            date: new Date(monthDate.getFullYear(), monthDate.getMonth(), d),
            shift: shifts[Math.floor(Math.random() * shifts.length)],
            quality: qualities[Math.floor(Math.random() * qualities.length)],
          },
        });
      }
    }
  }

  // ══════════════════════════════════════════════════════
  // ORDERS + PAYMENTS — 55 orders across 12 months
  // ══════════════════════════════════════════════════════
  const orderStatuses = ["draft", "confirmed", "in_production", "shipped", "delivered", "delivered", "delivered", "cancelled"];

  for (let i = 0; i < 55; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.round((500 + Math.random() * 9500) / 100) * 100;
    const unitPrice = product.pricePerKg * (0.9 + Math.random() * 0.2);
    const total = quantity * unitPrice;
    const monthOffset = Math.floor(Math.random() * 12);
    const orderDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1 + Math.floor(Math.random() * 28));
    const status = monthOffset > 2
      ? (Math.random() > 0.1 ? "delivered" : "cancelled")
      : orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 15 + Math.floor(Math.random() * 30));

    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        status,
        totalAmount: Math.round(total),
        currency: ["Algérie"].includes(client.country) ? "DZD" : "USD",
        createdAt: orderDate,
        deliveryDate: status === "delivered" ? deliveryDate : null,
        lines: {
          create: { productId: product.id, quantity, unitPrice: Math.round(unitPrice * 100) / 100 },
        },
      },
    });

    // Stock out
    if (["shipped", "delivered"].includes(status)) {
      await prisma.stockEntry.create({
        data: { productId: product.id, quantity, type: "out", reason: "sale", date: orderDate },
      });
    }

    // Payment tracking
    if (status !== "cancelled") {
      const dueDate = new Date(orderDate);
      dueDate.setDate(dueDate.getDate() + 30 + Math.floor(Math.random() * 30));

      if (status === "delivered") {
        const rand = Math.random();
        if (rand < 0.82) {
          const receivedDate = new Date(dueDate);
          receivedDate.setDate(receivedDate.getDate() - Math.floor(Math.random() * 15));
          await prisma.payment.create({
            data: { orderId: order.id, amount: Math.round(total), method: ["wire_transfer", "wire_transfer", "lc", "check"][Math.floor(Math.random() * 4)], status: "received", dueDate, receivedDate },
          });
        } else if (rand < 0.93) {
          await prisma.payment.create({
            data: { orderId: order.id, amount: Math.round(total * (0.4 + Math.random() * 0.3)), method: "wire_transfer", status: "partial", dueDate, receivedDate: new Date(dueDate.getTime() - 5 * 86400000) },
          });
        } else {
          await prisma.payment.create({
            data: { orderId: order.id, amount: Math.round(total), method: "wire_transfer", status: "overdue", dueDate },
          });
        }
      } else {
        await prisma.payment.create({
          data: { orderId: order.id, amount: Math.round(total), method: "wire_transfer", status: "pending", dueDate },
        });
      }
    }
  }

  // Stock in entries
  for (const product of products) {
    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + m, 15);
      const qty = product.name === "CARUMA" ? 20000 + Math.random() * 5000
        : product.name === "CARANI" ? 8000 + Math.random() * 3000
        : 3000 + Math.random() * 1500;
      await prisma.stockEntry.create({
        data: { productId: product.id, quantity: Math.round(qty), type: "in", reason: "production", date: monthDate },
      });
    }
  }

  // ══════════════════════════════════════════════════════
  // RESELLERS
  // ══════════════════════════════════════════════════════
  const resellersData = [
    { name: "Naturex S.A.", country: "France", type: "distributeur", status: "actif", since: new Date("2023-01-15"), contactName: "Pierre Dumont", totalRevenue: 485000, totalOrders: 18, avgOrderValue: 26944, lastOrderDate: new Date(Date.now() - 2 * 86400000), growthRate: 18.5, paymentScore: 95, productsHandled: "CARUMA,CARANI,CAROB EXTRACT", target: 550000 },
    { name: "Cargill BV", country: "Pays-Bas", type: "grossiste", status: "actif", since: new Date("2024-03-01"), contactName: "Hans van der Berg", totalRevenue: 372000, totalOrders: 12, avgOrderValue: 31000, lastOrderDate: new Date(Date.now() - 3 * 86400000), growthRate: 12.3, paymentScore: 92, productsHandled: "CARUMA,CARANI", target: 420000 },
    { name: "Döhler GmbH", country: "Allemagne", type: "distributeur", status: "actif", since: new Date("2024-07-15"), contactName: "Klaus Fischer", totalRevenue: 298000, totalOrders: 15, avgOrderValue: 19867, lastOrderDate: new Date(Date.now() - 5 * 86400000), growthRate: 22.1, paymentScore: 78, productsHandled: "CARANI,CAROB EXTRACT", target: 350000 },
    { name: "Barry Callebaut", country: "Suisse", type: "distributeur", status: "onboarding", since: new Date("2025-11-01"), contactName: "Marc Lehmann", totalRevenue: 68000, totalOrders: 3, avgOrderValue: 22667, lastOrderDate: new Date(Date.now() - 8 * 86400000), growthRate: 0, paymentScore: 88, productsHandled: "CARUMA", target: 200000 },
    { name: "Tate & Lyle", country: "UK", type: "agent", status: "onboarding", since: new Date("2026-01-10"), contactName: "Sarah Mitchell", totalRevenue: 24000, totalOrders: 1, avgOrderValue: 24000, lastOrderDate: new Date(Date.now() - 15 * 86400000), growthRate: 0, paymentScore: 70, productsHandled: "CARANI", target: 150000 },
  ];
  for (const r of resellersData) {
    await prisma.reseller.create({ data: r });
  }

  // ══════════════════════════════════════════════════════
  // EXPENSES — Monthly operating costs (12 months)
  // ══════════════════════════════════════════════════════
  const expenseCategories = [
    { category: "raw_material", label: "Caroube brute (achat)", baseAmount: 45000 },
    { category: "labor", label: "Salaires & charges", baseAmount: 28000 },
    { category: "energy", label: "Électricité & gaz", baseAmount: 8500 },
    { category: "packaging", label: "Emballage & conditionnement", baseAmount: 5500 },
    { category: "transport", label: "Transport & logistique", baseAmount: 12000 },
    { category: "rent", label: "Loyer usine Tlemcen", baseAmount: 4500 },
    { category: "maintenance", label: "Maintenance équipements", baseAmount: 3000 },
    { category: "other", label: "Frais généraux & admin", baseAmount: 6000 },
  ];

  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + m, 1);
    for (const exp of expenseCategories) {
      const variation = 0.85 + Math.random() * 0.3;
      await prisma.expense.create({
        data: { category: exp.category, label: exp.label, amount: Math.round(exp.baseAmount * variation), date: monthDate, recurring: true },
      });
    }
  }

  // ══════════════════════════════════════════════════════
  // BUDGETS — Annual budget by category (monthly)
  // ══════════════════════════════════════════════════════
  const budgetItems = [
    { category: "revenue", label: "CA CARUMA", baseMonthly: 90000 },
    { category: "revenue", label: "CA CARANI", baseMonthly: 18000 },
    { category: "revenue", label: "CA CAROB EXTRACT", baseMonthly: 34000 },
    { category: "cogs", label: "Matières premières", baseMonthly: 45000 },
    { category: "cogs", label: "Main d'oeuvre directe", baseMonthly: 18000 },
    { category: "cogs", label: "Énergie", baseMonthly: 8500 },
    { category: "cogs", label: "Emballage", baseMonthly: 5500 },
    { category: "opex", label: "Transport & logistique", baseMonthly: 12000 },
    { category: "opex", label: "Loyer", baseMonthly: 4500 },
    { category: "opex", label: "Maintenance", baseMonthly: 3000 },
    { category: "opex", label: "Frais généraux", baseMonthly: 6000 },
    { category: "opex", label: "Salaires admin", baseMonthly: 10000 },
  ];

  for (let m = 0; m < 12; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + m, 1);
    for (const b of budgetItems) {
      const seasonality = 0.9 + Math.sin((m - 3) * Math.PI / 6) * 0.15;
      await prisma.budget.create({
        data: { category: b.category, label: b.label, month: d.getMonth() + 1, year: d.getFullYear(), amount: Math.round(b.baseMonthly * seasonality) },
      });
    }
  }

  // ══════════════════════════════════════════════════════
  // CASH ENTRIES — Cash flow tracking (12 months)
  // ══════════════════════════════════════════════════════
  let runningBalance = 320000;
  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + m, 1);

    const salesInflow = 100000 + Math.random() * 50000 + Math.sin(m * 0.5) * 20000;
    runningBalance += salesInflow;
    await prisma.cashEntry.create({
      data: { type: "inflow", category: "sales", label: "Encaissements clients", amount: Math.round(salesInflow), date: monthDate, balance: Math.round(runningBalance) },
    });

    const expenseOutflow = 85000 + Math.random() * 20000;
    runningBalance -= expenseOutflow;
    await prisma.cashEntry.create({
      data: { type: "outflow", category: "expense", label: "Charges d'exploitation", amount: Math.round(expenseOutflow), date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5), balance: Math.round(runningBalance) },
    });

    const salaries = 28000 + Math.random() * 2000;
    runningBalance -= salaries;
    await prisma.cashEntry.create({
      data: { type: "outflow", category: "expense", label: "Salaires", amount: Math.round(salaries), date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 25), balance: Math.round(runningBalance) },
    });

    if (m === 3) {
      runningBalance -= 50000;
      await prisma.cashEntry.create({
        data: { type: "outflow", category: "investment", label: "Achat broyeur industriel", amount: 50000, date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10), balance: Math.round(runningBalance) },
      });
    }
    if (m === 6) {
      runningBalance += 80000;
      await prisma.cashEntry.create({
        data: { type: "inflow", category: "loan", label: "Crédit bancaire BNA", amount: 80000, date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 12), balance: Math.round(runningBalance) },
      });
    }
    if (m % 3 === 2) {
      const tax = 12000 + Math.random() * 5000;
      runningBalance -= tax;
      await prisma.cashEntry.create({
        data: { type: "outflow", category: "tax", label: "Impôts & taxes", amount: Math.round(tax), date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 20), balance: Math.round(runningBalance) },
      });
    }
  }

  // ══════════════════════════════════════════════════════
  // TRADING DESK DATA
  // ══════════════════════════════════════════════════════

  // ── MARKET DATA (250 days for VaR) ──────────────────
  // Simulate realistic Brownian motion with mean reversion
  const instruments = [
    { name: "COCOA_USD", base: 8800, vol: 0.015, drift: 0.0002 },
    { name: "CAROB_USD", base: 4200, vol: 0.012, drift: 0.0001 },
    { name: "SUGAR_USD", base: 580, vol: 0.018, drift: -0.0001 },
    { name: "EURUSD", base: 1.085, vol: 0.005, drift: 0 },
    { name: "EURGBP", base: 0.855, vol: 0.004, drift: 0 },
    { name: "EURDZD", base: 145.5, vol: 0.003, drift: 0.0003 },
    { name: "COFFEE_USD", base: 4200, vol: 0.02, drift: 0 },
    { name: "PALM_OIL_USD", base: 950, vol: 0.016, drift: -0.0001 },
  ];

  const marketDataBatch: Array<{ source: string; instrument: string; date: Date; open: number; high: number; low: number; close: number; volume: number }> = [];

  for (const inst of instruments) {
    let price = inst.base;
    for (let d = 250; d >= 0; d--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const dailyReturn = inst.drift + inst.vol * (Math.random() * 2 - 1) * Math.sqrt(1);
      // Mean reversion factor: pull back towards base
      const meanRev = 0.002 * (inst.base - price) / inst.base;
      price = price * (1 + dailyReturn + meanRev);
      const open = price * (1 + (Math.random() - 0.5) * inst.vol * 0.3);
      const high = Math.max(price, open) * (1 + Math.random() * inst.vol * 0.5);
      const low = Math.min(price, open) * (1 - Math.random() * inst.vol * 0.5);
      const volume = inst.name.includes("USD") && !inst.name.includes("EUR")
        ? Math.round(5000 + Math.random() * 15000)
        : Math.round(100000 + Math.random() * 500000);

      marketDataBatch.push({
        source: inst.name.startsWith("EUR") ? "FRANKFURTER" : "ICE",
        instrument: inst.name,
        date,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(price * 100) / 100,
        volume,
      });
    }
  }

  // Batch insert market data (much faster)
  for (let i = 0; i < marketDataBatch.length; i += 50) {
    const chunk = marketDataBatch.slice(i, i + 50);
    await prisma.marketData.createMany({ data: chunk, skipDuplicates: true });
  }
  console.log(`- ${marketDataBatch.length} market data points (${instruments.length} instruments × ~180 days)`);

  // ── TRADES ──────────────────────────────────────────
  const tradeClients = clients.slice(0, 10); // Use first 10 clients as counterparties
  const tradeInstruments = ["CARUMA", "CARANI", "CAROB EXTRACT"];
  const tradeStatuses = ["open", "open", "open", "closed", "settled", "settled"];
  const tradeMethods: Array<"physical" | "futures" | "swap"> = ["physical", "physical", "physical", "futures", "swap"];

  const trades = [];
  for (let i = 0; i < 40; i++) {
    const client = tradeClients[Math.floor(Math.random() * tradeClients.length)];
    const instrument = tradeInstruments[Math.floor(Math.random() * tradeInstruments.length)];
    const side = Math.random() > 0.3 ? "sell" : "buy"; // Mostly selling (exporter)
    const quantity = Math.round((1000 + Math.random() * 19000) / 500) * 500;
    const basePrice = instrument === "CARUMA" ? 4.5 : instrument === "CARANI" ? 2.0 : 8.5;
    const price = Math.round(basePrice * (0.92 + Math.random() * 0.16) * 100) / 100;
    const monthsAgo = Math.floor(Math.random() * 10);
    const tradeDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1 + Math.floor(Math.random() * 28));
    const status = monthsAgo > 4 ? "settled" : monthsAgo > 2 ? (Math.random() > 0.3 ? "closed" : "open") : "open";
    const markPrice = Math.round(basePrice * (0.95 + Math.random() * 0.12) * 100) / 100;
    const pnlSign = side === "sell" ? 1 : -1;
    const pnlRealized = status === "settled" ? Math.round(pnlSign * quantity * (markPrice - price) * 100) / 100 : 0;
    const pnlUnrealized = status === "open" ? Math.round(pnlSign * quantity * (markPrice - price) * 100) / 100 : 0;

    const settlementDate = status === "settled"
      ? new Date(tradeDate.getTime() + (15 + Math.floor(Math.random() * 30)) * 86400000)
      : null;

    const trade = await prisma.trade.create({
      data: {
        tradeRef: `TRD-${tradeDate.getFullYear()}-${String(i + 1).padStart(4, "0")}`,
        counterpartyId: client.id,
        instrument,
        side,
        quantity,
        price,
        currency: client.country === "Algérie" ? "DZD" : "USD",
        tradeDate,
        settlementDate,
        method: tradeMethods[Math.floor(Math.random() * tradeMethods.length)],
        status,
        pnlRealized,
        pnlUnrealized,
      },
    });
    trades.push({ ...trade, markPrice });

    // Create position for open trades
    if (status === "open") {
      await prisma.tradingPosition.create({
        data: {
          tradeId: trade.id,
          instrument,
          side: side === "sell" ? "short" : "long",
          quantity,
          avgPrice: price,
          markPrice,
          currency: trade.currency,
          unrealizedPnl: pnlUnrealized,
          realizedPnl: 0,
          deltaExposure: quantity * markPrice * (side === "sell" ? -1 : 1),
          openDate: tradeDate,
          status: "open",
        },
      });
    }

    // Settlement for settled trades
    if (status === "settled" && settlementDate) {
      await prisma.settlementTransaction.create({
        data: {
          tradeId: trade.id,
          date: settlementDate,
          amount: Math.round(quantity * price),
          currency: trade.currency,
          method: Math.random() > 0.3 ? "wire_transfer" : "lc",
          status: "settled",
          reference: `STL-${settlementDate.getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
        },
      });
    }
  }
  console.log(`- ${trades.length} trades + positions + settlements`);

  // ── DERIVATIVES ─────────────────────────────────────
  const derivativeData = [
    { type: "call", underlying: "COCOA", side: "buy", quantity: 50, strike: 9000, expiry: 90, premium: 320, notional: 450000, delta: 0.45, gamma: 0.02, vega: 85, theta: -12, rho: 0.15 },
    { type: "put", underlying: "COCOA", side: "buy", quantity: 30, strike: 8500, expiry: 60, premium: 180, notional: 255000, delta: -0.35, gamma: 0.03, vega: 72, theta: -15, rho: -0.12 },
    { type: "forward", underlying: "EURUSD", side: "sell", quantity: 500000, strike: 1.09, expiry: 120, premium: 0, notional: 500000, delta: -1, gamma: 0, vega: 0, theta: -2, rho: -0.8 },
    { type: "swap", underlying: "COCOA", side: "buy", quantity: 100, strike: null, expiry: 180, premium: 0, notional: 880000, delta: 1, gamma: 0, vega: 0, theta: 0, rho: 0.05 },
    { type: "call", underlying: "CAROB", side: "sell", quantity: 80, strike: 4500, expiry: 45, premium: 150, notional: 360000, delta: -0.55, gamma: -0.025, vega: -65, theta: 18, rho: -0.1 },
    { type: "put", underlying: "EURUSD", side: "buy", quantity: 300000, strike: 1.07, expiry: 75, premium: 4500, notional: 300000, delta: -0.25, gamma: 0.015, vega: 45, theta: -8, rho: -0.3 },
  ];

  for (const d of derivativeData) {
    const mtm = d.notional * (d.delta * 0.02 + (d.gamma || 0) * 0.0004) + d.premium * (Math.random() * 0.4 - 0.2);
    await prisma.derivative.create({
      data: {
        type: d.type,
        underlying: d.underlying,
        side: d.side,
        quantity: d.quantity,
        strike: d.strike,
        expiry: new Date(now.getTime() + d.expiry * 86400000),
        premium: d.premium,
        notional: d.notional,
        delta: d.delta,
        gamma: d.gamma,
        vega: d.vega,
        theta: d.theta,
        rho: d.rho,
        markToMarket: Math.round(mtm),
        status: "active",
      },
    });
  }
  console.log(`- ${derivativeData.length} derivative positions`);

  // ── FUTURES CURVE ───────────────────────────────────
  const futuresMonths = ["2026-03", "2026-06", "2026-09", "2026-12", "2027-03", "2027-06"];
  const futuresSymbols = [
    { symbol: "CC", underlying: "COCOA", exchange: "ICE", basePrice: 8800 },
    { symbol: "SB", underlying: "SUGAR", exchange: "ICE", basePrice: 580 },
    { symbol: "KC", underlying: "COFFEE", exchange: "ICE", basePrice: 4200 },
  ];

  for (const sym of futuresSymbols) {
    let contango = 0;
    for (let i = 0; i < futuresMonths.length; i++) {
      contango += sym.basePrice * (0.005 + Math.random() * 0.008); // Contango curve
      const settlement = Math.round((sym.basePrice + contango) * 100) / 100;
      const spread = sym.basePrice * 0.002;
      await prisma.futuresContract.create({
        data: {
          exchange: sym.exchange,
          symbol: sym.symbol,
          contractMonth: futuresMonths[i],
          underlying: sym.underlying,
          bid: Math.round((settlement - spread) * 100) / 100,
          ask: Math.round((settlement + spread) * 100) / 100,
          settlement,
          openInterest: Math.round(10000 + Math.random() * 50000),
          volume: Math.round(2000 + Math.random() * 15000),
          priorSettlement: Math.round((settlement - sym.basePrice * 0.003 * (Math.random() - 0.5)) * 100) / 100,
          date: new Date(),
        },
      });
    }
  }
  console.log(`- ${futuresMonths.length * futuresSymbols.length} futures contracts`);

  // ── TRADING LIMITS ──────────────────────────────────
  const limitEntries = [
    { entity: "desk", entityRef: "physical_desk", riskType: "notional", limitAmount: 5000000, currentUsage: 2850000 },
    { entity: "desk", entityRef: "derivatives_desk", riskType: "notional", limitAmount: 3000000, currentUsage: 1740000 },
    { entity: "desk", entityRef: "physical_desk", riskType: "var", limitAmount: 250000, currentUsage: 145000 },
    { entity: "desk", entityRef: "derivatives_desk", riskType: "var", limitAmount: 150000, currentUsage: 82000 },
    { entity: "product", entityRef: "CARUMA", riskType: "concentration", limitAmount: 2500000, currentUsage: 1620000 },
    { entity: "product", entityRef: "CARANI", riskType: "concentration", limitAmount: 1500000, currentUsage: 780000 },
    { entity: "product", entityRef: "CAROB EXTRACT", riskType: "concentration", limitAmount: 2000000, currentUsage: 1350000 },
    ...tradeClients.slice(0, 5).map((c) => ({
      entity: "counterparty" as const,
      entityRef: c.id,
      riskType: "notional",
      limitAmount: 800000 + Math.round(Math.random() * 400000),
      currentUsage: Math.round(200000 + Math.random() * 500000),
    })),
  ];

  for (const lim of limitEntries) {
    await prisma.tradingLimit.create({
      data: {
        ...lim,
        utilizationPct: Math.round((lim.currentUsage / lim.limitAmount) * 1000) / 10,
        breached: lim.currentUsage > lim.limitAmount * 0.9,
      },
    });
  }
  console.log(`- ${limitEntries.length} trading limits`);

  // ── VaR BACKTESTING (90 days) ───────────────────────
  const varBatch: Array<{ date: Date; method: string; confidence: number; horizon: number; varForecast: number; realizedPnl: number; breach: boolean; portfolio: string }> = [];
  for (let d = 90; d >= 1; d--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const baseVar95 = 85000 + Math.random() * 30000;
    const baseVar99 = baseVar95 * 1.45;
    const realizedPnl = (Math.random() - 0.48) * baseVar95 * 2.5; // Slight positive skew

    varBatch.push(
      { date, method: "historical", confidence: 0.95, horizon: 1, varForecast: Math.round(baseVar95), realizedPnl: Math.round(realizedPnl), breach: Math.abs(realizedPnl) > baseVar95, portfolio: "total" },
      { date, method: "historical", confidence: 0.99, horizon: 1, varForecast: Math.round(baseVar99), realizedPnl: Math.round(realizedPnl), breach: Math.abs(realizedPnl) > baseVar99, portfolio: "total" },
    );
  }
  await prisma.vaRBacktest.createMany({ data: varBatch, skipDuplicates: true });
  console.log(`- ${varBatch.length} VaR backtest points`);

  // ── P&L ATTRIBUTION (30 days) ───────────────────────
  const attrBatch: Array<{ date: Date; portfolio: string; marketMove: number; carry: number; spread: number; theta: number; vega: number; gamma: number; fx: number; other: number; total: number }> = [];
  for (let d = 30; d >= 1; d--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const marketMove = Math.round((Math.random() - 0.45) * 40000);
    const carry = Math.round(1500 + Math.random() * 2000);
    const spread = Math.round(800 + Math.random() * 1200);
    const theta = Math.round(-500 - Math.random() * 1500);
    const vega = Math.round((Math.random() - 0.5) * 8000);
    const gamma = Math.round((Math.random() - 0.5) * 3000);
    const fx = Math.round((Math.random() - 0.5) * 12000);
    const other = Math.round((Math.random() - 0.5) * 2000);
    const total = marketMove + carry + spread + theta + vega + gamma + fx + other;

    attrBatch.push({ date, portfolio: "total", marketMove, carry, spread, theta, vega, gamma, fx, other, total });
  }
  await prisma.pnLAttribution.createMany({ data: attrBatch });
  console.log(`- ${attrBatch.length} P&L attribution entries`);

  // ── QUALITY TESTS ───────────────────────────────────
  const testTypes = [
    { testType: "moisture", spec: "< 8%", range: [4, 10], unit: "%" },
    { testType: "particle_size", spec: "200-400 µm", range: [180, 420], unit: " µm" },
    { testType: "color", spec: "L* > 45", range: [38, 55], unit: "" },
    { testType: "purity", spec: "> 98%", range: [95, 99.8], unit: "%" },
    { testType: "microbiological", spec: "< 100 CFU/g", range: [10, 150], unit: " CFU/g" },
  ];

  const qualityBatch: Array<{ product: string; lotNumber: string; testType: string; spec: string; actual: string; numericActual: number; result: string; testDate: Date; certifiedBy: string }> = [];
  for (let m = 0; m < 6; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 10);
    for (const prod of ["CARUMA", "CARANI", "CAROB EXTRACT"]) {
      for (const test of testTypes) {
        const val = test.range[0] + Math.random() * (test.range[1] - test.range[0]);
        const numericActual = Math.round(val * 10) / 10;
        const specNum = parseFloat(test.spec.replace(/[^0-9.]/g, ""));
        const pass = test.spec.startsWith("<") ? numericActual < specNum : test.spec.startsWith(">") ? numericActual > specNum : true;
        qualityBatch.push({
          product: prod,
          lotNumber: `LOT-${prod.substring(0, 3)}-${monthDate.getFullYear()}${String(monthDate.getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`,
          testType: test.testType,
          spec: test.spec,
          actual: `${numericActual}${test.unit}`,
          numericActual,
          result: pass ? "pass" : (Math.random() > 0.5 ? "marginal" : "fail"),
          testDate: monthDate,
          certifiedBy: ["Dr. Amel Benali", "Ing. Karim Messaoudi", "Dr. Nadia Zerrouki"][Math.floor(Math.random() * 3)],
        });
      }
    }
  }
  await prisma.qualityTest.createMany({ data: qualityBatch });
  console.log(`- ${qualityBatch.length} quality test results`);

  // ── AUDIT LOG ───────────────────────────────────────
  const auditActions = ["create", "update", "approve", "export"];
  const auditEntities = ["trade", "order", "settlement", "position", "limit"];
  const auditBatch: Array<{ userId: string; action: string; entity: string; entityId: string; details: string; timestamp: Date }> = [];
  for (let d = 30; d >= 0; d--) {
    const numEntries = 3 + Math.floor(Math.random() * 5);
    for (let j = 0; j < numEntries; j++) {
      auditBatch.push({
        userId: ["admin", "trader1", "risk_mgr", "ops"][Math.floor(Math.random() * 4)],
        action: auditActions[Math.floor(Math.random() * auditActions.length)],
        entity: auditEntities[Math.floor(Math.random() * auditEntities.length)],
        entityId: `ref-${Math.floor(Math.random() * 9999)}`,
        details: JSON.stringify({ source: "system", automated: Math.random() > 0.5 }),
        timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, Math.floor(Math.random() * 10) + 8),
      });
    }
  }
  await prisma.auditLog.createMany({ data: auditBatch });
  console.log(`- ${auditBatch.length} audit log entries`);

  console.log("\nSeed completed!");
  console.log(`- ${products.length} products + costs`);
  console.log(`- ${clients.length} clients`);
  console.log(`- 55 orders + payments`);
  console.log(`- Production entries + targets (12 months)`);
  console.log(`- ${resellersData.length} resellers`);
  console.log(`- Expenses (12 × 8), Budgets (12 × 12), Cash entries`);
  console.log(`- TRADING: ${trades.length} trades, ${derivativeData.length} derivatives, ${futuresMonths.length * futuresSymbols.length} futures`);
  console.log(`- RISK: ${varBatch.length} VaR points, ${attrBatch.length} P&L attributions, ${limitEntries.length} limits`);
  console.log(`- QUALITY: ${qualityBatch.length} tests, ${auditBatch.length} audit logs`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
