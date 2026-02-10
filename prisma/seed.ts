import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (order matters for FK constraints)
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

  console.log("Seed completed!");
  console.log(`- ${products.length} products + costs`);
  console.log(`- ${clients.length} clients`);
  console.log(`- 55 orders + payments`);
  console.log(`- Production entries + targets (12 months)`);
  console.log(`- ${resellersData.length} resellers`);
  console.log(`- Expenses (12 × 8), Budgets (12 × 12), Cash entries`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
