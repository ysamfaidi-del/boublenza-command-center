import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.reseller.deleteMany();
  await prisma.stockEntry.deleteMany();
  await prisma.productionEntry.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.client.deleteMany();
  await prisma.product.deleteMany();

  // Products
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

  // Clients
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

  // Production entries — 12 months
  const now = new Date();
  const baseProduction: Record<string, number[]> = {
    [caruma.id]: [18000, 19500, 21000, 22000, 20000, 17000, 15000, 16000, 19000, 22500, 24000, 23000],
    [carani.id]: [8000, 8500, 9000, 9500, 8800, 7500, 7000, 7200, 8500, 9800, 10500, 10000],
    [extract.id]: [3000, 3200, 3500, 3800, 3400, 2800, 2500, 2700, 3200, 3800, 4200, 4000],
  };

  const shifts = ["morning", "afternoon", "night"];
  const qualities = ["A", "A", "A", "B", "A", "A", "B", "A"]; // mostly A

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

  // Orders — ~50 orders across 12 months
  const statuses = ["draft", "confirmed", "in_production", "shipped", "delivered", "delivered", "delivered", "cancelled"];

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
      : statuses[Math.floor(Math.random() * statuses.length)];

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
          create: {
            productId: product.id,
            quantity,
            unitPrice: Math.round(unitPrice * 100) / 100,
          },
        },
      },
    });

    // Stock out for shipped/delivered orders
    if (["shipped", "delivered"].includes(status)) {
      await prisma.stockEntry.create({
        data: {
          productId: product.id,
          quantity,
          type: "out",
          reason: "sale",
          date: orderDate,
        },
      });
    }
  }

  // Stock in entries (from production)
  for (const product of products) {
    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + m, 15);
      const qty = product.name === "CARUMA" ? 20000 + Math.random() * 5000
        : product.name === "CARANI" ? 8000 + Math.random() * 3000
        : 3000 + Math.random() * 1500;

      await prisma.stockEntry.create({
        data: {
          productId: product.id,
          quantity: Math.round(qty),
          type: "in",
          reason: "production",
          date: monthDate,
        },
      });
    }
  }

  // Resellers / Distributeurs
  const resellersData = [
    {
      name: "Naturex S.A.",
      country: "France",
      type: "distributeur",
      status: "actif",
      since: new Date("2023-01-15"),
      contactName: "Pierre Dumont",
      totalRevenue: 485000,
      totalOrders: 18,
      avgOrderValue: 26944,
      lastOrderDate: new Date(Date.now() - 2 * 86400000),
      growthRate: 18.5,
      paymentScore: 95,
      productsHandled: "CARUMA,CARANI,CAROB EXTRACT",
      target: 550000,
    },
    {
      name: "Cargill BV",
      country: "Pays-Bas",
      type: "grossiste",
      status: "actif",
      since: new Date("2024-03-01"),
      contactName: "Hans van der Berg",
      totalRevenue: 372000,
      totalOrders: 12,
      avgOrderValue: 31000,
      lastOrderDate: new Date(Date.now() - 3 * 86400000),
      growthRate: 12.3,
      paymentScore: 92,
      productsHandled: "CARUMA,CARANI",
      target: 420000,
    },
    {
      name: "Döhler GmbH",
      country: "Allemagne",
      type: "distributeur",
      status: "actif",
      since: new Date("2024-07-15"),
      contactName: "Klaus Fischer",
      totalRevenue: 298000,
      totalOrders: 15,
      avgOrderValue: 19867,
      lastOrderDate: new Date(Date.now() - 5 * 86400000),
      growthRate: 22.1,
      paymentScore: 78,
      productsHandled: "CARANI,CAROB EXTRACT",
      target: 350000,
    },
    {
      name: "Barry Callebaut",
      country: "Suisse",
      type: "distributeur",
      status: "onboarding",
      since: new Date("2025-11-01"),
      contactName: "Marc Lehmann",
      totalRevenue: 68000,
      totalOrders: 3,
      avgOrderValue: 22667,
      lastOrderDate: new Date(Date.now() - 8 * 86400000),
      growthRate: 0,
      paymentScore: 88,
      productsHandled: "CARUMA",
      target: 200000,
    },
    {
      name: "Tate & Lyle",
      country: "UK",
      type: "agent",
      status: "onboarding",
      since: new Date("2026-01-10"),
      contactName: "Sarah Mitchell",
      totalRevenue: 24000,
      totalOrders: 1,
      avgOrderValue: 24000,
      lastOrderDate: new Date(Date.now() - 15 * 86400000),
      growthRate: 0,
      paymentScore: 70,
      productsHandled: "CARANI",
      target: 150000,
    },
  ];

  for (const r of resellersData) {
    await prisma.reseller.create({ data: r });
  }

  console.log("Seed completed successfully!");
  console.log(`- ${products.length} products`);
  console.log(`- ${clients.length} clients`);
  console.log(`- 55 orders`);
  console.log(`- Production entries for 12 months`);
  console.log(`- Stock movements`);
  console.log(`- ${resellersData.length} resellers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
