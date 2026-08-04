import type { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const DEMO_PASSWORD = "Huizemark2026!";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

let orderSeq = 0;
function nextOrderNumber() {
  orderSeq += 1;
  return `HM-2026-${String(orderSeq).padStart(4, "0")}`;
}

export async function seedDatabase(prisma: PrismaClient) {
  console.log("Seeding Huizemark Agent Ordering Hub…");

  // Clear existing data (idempotent local dev reseed)
  await prisma.auditLog.deleteMany();
  await prisma.savedFilter.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.orderFile.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderApproval.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---------------------------------------------------------------------
  // Branches
  // ---------------------------------------------------------------------
  const branchNames = [
    "Ballito Head Office",
    "Salt Rock",
    "Zimbali",
    "Umhlanga Rocks",
    "Sheffield Beach",
  ];
  const branches = await Promise.all(
    branchNames.map((name) => prisma.branch.create({ data: { name } }))
  );

  // ---------------------------------------------------------------------
  // Core / management users
  // ---------------------------------------------------------------------
  const admin = await prisma.user.create({
    data: {
      name: "System Administrator",
      email: "admin@huizemark.co.za",
      passwordHash,
      role: "ADMIN",
      initials: "SA",
      avatarColor: "#1B2A4A",
      branchId: branches[0].id,
      phone: "032 946 1000",
    },
  });

  const mienke = await prisma.user.create({
    data: {
      name: "Mienke",
      email: "mienke@huizemark.co.za",
      passwordHash,
      role: "MIENKE",
      initials: "M",
      avatarColor: "#F2801E",
      branchId: branches[0].id,
      phone: "082 111 2222",
    },
  });
  const mj = await prisma.user.create({
    data: {
      name: "MJ",
      email: "mj@huizemark.co.za",
      passwordHash,
      role: "MJ",
      initials: "MJ",
      avatarColor: "#1B2A4A",
      branchId: branches[0].id,
      phone: "082 222 3333",
    },
  });
  const nadia = await prisma.user.create({
    data: {
      name: "Nadia",
      email: "nadia@huizemark.co.za",
      passwordHash,
      role: "NADIA",
      initials: "N",
      avatarColor: "#F2801E",
      branchId: branches[0].id,
      phone: "082 333 4444",
    },
  });
  const chantal = await prisma.user.create({
    data: {
      name: "Chantal",
      email: "chantal@huizemark.co.za",
      passwordHash,
      role: "CHANTAL",
      initials: "C",
      avatarColor: "#1B2A4A",
      branchId: branches[0].id,
      phone: "082 444 5555",
    },
  });

  const managers = [mienke, mj, nadia, chantal];

  // ---------------------------------------------------------------------
  // Agents
  // ---------------------------------------------------------------------
  const agentNames = [
    "Sarah van der Merwe",
    "Thabo Nkosi",
    "Amanda Botha",
    "Kyle Pillay",
    "Lindiwe Zulu",
    "Ryan Naidoo",
    "Chloe Steyn",
    "Sipho Mahlangu",
    "Jessica du Toit",
    "Michael Govender",
    "Bianca Oosthuizen",
    "Andile Khumalo",
  ];
  const agents = await Promise.all(
    agentNames.map((name, i) =>
      prisma.user.create({
        data: {
          name,
          email: `${name.toLowerCase().split(" ")[0]}.${name
            .toLowerCase()
            .split(" ")
            .slice(-1)}@huizemark.co.za`,
          passwordHash,
          role: "AGENT",
          initials: initialsOf(name),
          avatarColor: i % 2 === 0 ? "#F2801E" : "#1B2A4A",
          branchId: branches[i % branches.length].id,
          phone: `08${Math.floor(1000000 + Math.random() * 8999999)}`,
        },
      })
    )
  );

  // ---------------------------------------------------------------------
  // Suppliers
  // ---------------------------------------------------------------------
  const supplierDefs = [
    {
      name: "Coastal Print Co.",
      contactPerson: "Devan Reddy",
      email: "orders@coastalprint.co.za",
      phone: "032 555 0101",
      whatsapp: "082 555 0101",
      address: "12 Compensation Rd, Ballito",
      avgTurnaroundDays: 4,
      rating: 4.7,
      notes: "Preferred supplier for boards, signage and print.",
    },
    {
      name: "North Coast Signs & Boards",
      contactPerson: "Petro Coetzee",
      email: "info@ncsigns.co.za",
      phone: "032 555 0202",
      whatsapp: "083 555 0202",
      address: "4 Industrial Cres, Ballito",
      avgTurnaroundDays: 5,
      rating: 4.5,
      notes: "Boards, droppers, directional signage.",
    },
    {
      name: "Apex Branded Apparel",
      contactPerson: "Justin Naidoo",
      email: "sales@apexapparel.co.za",
      phone: "031 555 0303",
      whatsapp: "084 555 0303",
      address: "22 Umhlanga Ridge, Umhlanga",
      avgTurnaroundDays: 10,
      rating: 4.3,
      notes: "Clothing, caps, jackets, welcome pack items.",
    },
    {
      name: "Studio Nine Design",
      contactPerson: "Kerry-Lee Adams",
      email: "hello@studionine.design",
      phone: "032 555 0404",
      whatsapp: "082 555 0404",
      address: "Remote / Design Studio",
      avgTurnaroundDays: 3,
      rating: 4.9,
      notes: "Artwork, social media designs, brochures.",
    },
    {
      name: "Dolphin Coast Couriers",
      contactPerson: "Wesley Pillay",
      email: "dispatch@dolphincoastcouriers.co.za",
      phone: "032 555 0505",
      whatsapp: "083 555 0505",
      address: "8 Link Rd, Ballito",
      avgTurnaroundDays: 1,
      rating: 4.6,
      notes: "Local and national courier services.",
    },
    {
      name: "Lens & Loft Media",
      contactPerson: "Tarryn Govender",
      email: "bookings@lensandloft.co.za",
      phone: "032 555 0606",
      whatsapp: "084 555 0606",
      address: "Umhlanga Rocks",
      avgTurnaroundDays: 2,
      rating: 4.8,
      notes: "Property photography, drone photography, video editing.",
    },
  ];
  const suppliers = await Promise.all(
    supplierDefs.map((s) => prisma.supplier.create({ data: s }))
  );
  const [printCo, signsCo, apparelCo, studioNine, courierCo, lensLoft] = suppliers;

  // ---------------------------------------------------------------------
  // Product categories + products
  // ---------------------------------------------------------------------
  const categoryDefs: {
    name: string;
    icon: string;
    products: {
      name: string;
      description: string;
      price?: number;
      priceOnRequest?: boolean;
      productionTimeDays: number;
      minOrderQty: number;
      sizes?: string[];
      finishes?: string[];
      personalisation?: string[];
      supplierId?: string;
      stockStatus?: string;
    }[];
  }[] = [
    {
      name: "Business Cards",
      icon: "CreditCard",
      products: [
        {
          name: "Standard Business Cards",
          description: "Premium matte-finish business cards on 400gsm stock.",
          price: 350,
          productionTimeDays: 3,
          minOrderQty: 100,
          sizes: ["89x51mm"],
          finishes: ["Matte", "Gloss", "Spot UV"],
          personalisation: ["Name", "Title", "Mobile Number", "Email"],
          supplierId: printCo.id,
        },
      ],
    },
    {
      name: "For Sale Boards",
      icon: "SignpostBig",
      products: [
        {
          name: "For Sale Board – Standard",
          description: "Weatherproof correx For Sale board with agent branding.",
          price: 480,
          productionTimeDays: 5,
          minOrderQty: 1,
          sizes: ["600x450mm", "900x600mm"],
          finishes: ["Correx", "Aluminium Composite"],
          supplierId: signsCo.id,
        },
      ],
    },
    {
      name: "To Let Boards",
      icon: "SignpostBig",
      products: [
        {
          name: "To Let Board – Standard",
          description: "Durable To Let board for rental listings.",
          price: 480,
          productionTimeDays: 5,
          minOrderQty: 1,
          sizes: ["600x450mm", "900x600mm"],
          finishes: ["Correx", "Aluminium Composite"],
          supplierId: signsCo.id,
        },
      ],
    },
    {
      name: "On Show Boards",
      icon: "SignpostBig",
      products: [
        {
          name: "On Show Board",
          description: "Eye-catching board for show day promotion.",
          price: 420,
          productionTimeDays: 4,
          minOrderQty: 1,
          sizes: ["600x450mm"],
          finishes: ["Correx"],
          supplierId: signsCo.id,
        },
      ],
    },
    {
      name: "Sold Stickers",
      icon: "Sticker",
      products: [
        {
          name: "Sold Sticker",
          description: "High-visibility 'Sold' overlay sticker for boards.",
          price: 65,
          productionTimeDays: 2,
          minOrderQty: 5,
          sizes: ["A4", "A3"],
          finishes: ["Gloss Vinyl"],
          supplierId: printCo.id,
        },
      ],
    },
    {
      name: "Sole Mandate Stickers",
      icon: "Sticker",
      products: [
        {
          name: "Sole Mandate Sticker",
          description: "Sole Mandate overlay sticker for boards.",
          price: 65,
          productionTimeDays: 2,
          minOrderQty: 5,
          sizes: ["A4", "A3"],
          finishes: ["Gloss Vinyl"],
          supplierId: printCo.id,
        },
      ],
    },
    {
      name: "Area Agent Boards",
      icon: "SignpostBig",
      products: [
        {
          name: "Area Agent Board",
          description: "Branded area agent promotional board.",
          price: 650,
          productionTimeDays: 6,
          minOrderQty: 1,
          sizes: ["900x600mm"],
          finishes: ["Aluminium Composite"],
          supplierId: signsCo.id,
        },
      ],
    },
    {
      name: "Plastic Droppers",
      icon: "Tag",
      products: [
        {
          name: "Plastic Board Dropper",
          description: "Clip-on plastic dropper for board detail (price/features).",
          price: 95,
          productionTimeDays: 3,
          minOrderQty: 2,
          sizes: ["Standard"],
          supplierId: signsCo.id,
        },
      ],
    },
    {
      name: "Directional Boards",
      icon: "Navigation",
      products: [
        {
          name: "Directional Arrow Board",
          description: "Roadside directional board with arrow signage.",
          price: 390,
          productionTimeDays: 5,
          minOrderQty: 1,
          sizes: ["600x450mm"],
          supplierId: signsCo.id,
        },
      ],
    },
    {
      name: "Name Badges",
      icon: "IdCard",
      products: [
        {
          name: "Agent Name Badge",
          description: "Magnetic acrylic name badge with Huizemark branding.",
          price: 180,
          productionTimeDays: 7,
          minOrderQty: 1,
          finishes: ["Magnetic Back", "Pin Back"],
          personalisation: ["Name", "Title"],
          supplierId: printCo.id,
        },
      ],
    },
    {
      name: "Branded Clothing",
      icon: "Shirt",
      products: [
        {
          name: "Branded Golf Shirt",
          description: "Embroidered Huizemark branded golf shirt.",
          price: 320,
          productionTimeDays: 10,
          minOrderQty: 1,
          sizes: ["S", "M", "L", "XL", "XXL"],
          personalisation: ["Name Embroidery"],
          supplierId: apparelCo.id,
        },
      ],
    },
    {
      name: "Caps",
      icon: "Shirt",
      products: [
        {
          name: "Branded Cap",
          description: "Embroidered six-panel cap with Huizemark logo.",
          price: 150,
          productionTimeDays: 8,
          minOrderQty: 1,
          sizes: ["One Size"],
          supplierId: apparelCo.id,
        },
      ],
    },
    {
      name: "Golf Shirts",
      icon: "Shirt",
      products: [
        {
          name: "Premium Golf Shirt",
          description: "Performance-fabric golf shirt, embroidered logo.",
          price: 340,
          productionTimeDays: 10,
          minOrderQty: 1,
          sizes: ["S", "M", "L", "XL", "XXL"],
          supplierId: apparelCo.id,
        },
      ],
    },
    {
      name: "Jackets",
      icon: "Shirt",
      products: [
        {
          name: "Branded Softshell Jacket",
          description: "Weatherproof softshell jacket with embroidered branding.",
          price: 650,
          productionTimeDays: 12,
          minOrderQty: 1,
          sizes: ["S", "M", "L", "XL", "XXL"],
          supplierId: apparelCo.id,
        },
      ],
    },
    {
      name: "Welcome Packs",
      icon: "Gift",
      products: [
        {
          name: "New Agent Welcome Pack",
          description: "Branded welcome pack for new agents (folder, pen, notebook, bottle).",
          priceOnRequest: true,
          productionTimeDays: 7,
          minOrderQty: 1,
          supplierId: apparelCo.id,
        },
      ],
    },
    {
      name: "Water Bottles",
      icon: "GlassWater",
      products: [
        {
          name: "Branded Water Bottle",
          description: "Stainless steel branded water bottle.",
          price: 145,
          productionTimeDays: 9,
          minOrderQty: 5,
          supplierId: apparelCo.id,
        },
      ],
    },
    {
      name: "Presentation Folders",
      icon: "FolderOpen",
      products: [
        {
          name: "Branded Presentation Folder",
          description: "A4 branded presentation folder with pockets.",
          price: 60,
          productionTimeDays: 5,
          minOrderQty: 25,
          supplierId: printCo.id,
        },
      ],
    },
    {
      name: "Flyers",
      icon: "FileText",
      products: [
        {
          name: "A5 Property Flyer",
          description: "Full colour double-sided A5 property flyer.",
          price: 4.5,
          productionTimeDays: 3,
          minOrderQty: 100,
          sizes: ["A5", "A4"],
          supplierId: printCo.id,
        },
      ],
    },
    {
      name: "Brochures",
      icon: "BookOpen",
      products: [
        {
          name: "Tri-fold Property Brochure",
          description: "Premium gloss tri-fold brochure.",
          price: 12,
          productionTimeDays: 4,
          minOrderQty: 50,
          supplierId: printCo.id,
        },
      ],
    },
    {
      name: "Property Booklets",
      icon: "BookOpen",
      products: [
        {
          name: "Luxury Listing Booklet",
          description: "Perfect-bound booklet for premium listings.",
          priceOnRequest: true,
          productionTimeDays: 6,
          minOrderQty: 10,
          supplierId: printCo.id,
        },
      ],
    },
    {
      name: "Listing Presentation Packs",
      icon: "Presentation",
      products: [
        {
          name: "Listing Presentation Pack",
          description: "Full branded pack for listing presentations.",
          priceOnRequest: true,
          productionTimeDays: 5,
          minOrderQty: 1,
          supplierId: studioNine.id,
        },
      ],
    },
    {
      name: "Agent Profile Boards",
      icon: "UserSquare",
      products: [
        {
          name: "Agent Profile Board",
          description: "Branded profile board for office display / boards.",
          price: 550,
          productionTimeDays: 6,
          minOrderQty: 1,
          supplierId: signsCo.id,
        },
      ],
    },
    {
      name: "Social Media Designs",
      icon: "Instagram",
      products: [
        {
          name: "Social Media Design Set",
          description: "Set of 5 branded social media tiles for a listing.",
          price: 480,
          productionTimeDays: 2,
          minOrderQty: 1,
          supplierId: studioNine.id,
        },
      ],
    },
    {
      name: "Property Photography",
      icon: "Camera",
      products: [
        {
          name: "Property Photography Shoot",
          description: "Full property photography shoot, edited images.",
          priceOnRequest: true,
          productionTimeDays: 3,
          minOrderQty: 1,
          supplierId: lensLoft.id,
        },
      ],
    },
    {
      name: "Drone Photography",
      icon: "Plane",
      products: [
        {
          name: "Drone Aerial Package",
          description: "Aerial drone photography and video package.",
          priceOnRequest: true,
          productionTimeDays: 3,
          minOrderQty: 1,
          supplierId: lensLoft.id,
        },
      ],
    },
    {
      name: "Video Editing",
      icon: "Video",
      products: [
        {
          name: "Property Video Edit",
          description: "Professional edit of walk-through / drone footage.",
          priceOnRequest: true,
          productionTimeDays: 4,
          minOrderQty: 1,
          supplierId: lensLoft.id,
        },
      ],
    },
    {
      name: "Printing",
      icon: "Printer",
      products: [
        {
          name: "General Printing",
          description: "Custom print job — specify requirements in the order notes.",
          priceOnRequest: true,
          productionTimeDays: 3,
          minOrderQty: 1,
          supplierId: printCo.id,
        },
      ],
    },
    {
      name: "Courier Services",
      icon: "Truck",
      products: [
        {
          name: "Local Courier",
          description: "Courier collection and delivery within the North Coast area.",
          price: 120,
          productionTimeDays: 1,
          minOrderQty: 1,
          supplierId: courierCo.id,
        },
      ],
    },
    {
      name: "Custom Order",
      icon: "Sparkles",
      products: [
        {
          name: "Custom Order Request",
          description: "Anything not listed above — describe your requirement.",
          priceOnRequest: true,
          productionTimeDays: 5,
          minOrderQty: 1,
        },
      ],
    },
  ];

  const categories: Record<string, string> = {};
  const products: Record<string, string> = {};

  for (let i = 0; i < categoryDefs.length; i++) {
    const c = categoryDefs[i];
    const slug = c.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const category = await prisma.productCategory.create({
      data: {
        name: c.name,
        slug,
        icon: c.icon,
        sortOrder: i,
        description: `${c.name} for Huizemark North Coast agents.`,
      },
    });
    categories[c.name] = category.id;

    for (const p of c.products) {
      const product = await prisma.product.create({
        data: {
          name: p.name,
          categoryId: category.id,
          description: p.description,
          price: p.price,
          priceOnRequest: !!p.priceOnRequest,
          productionTimeDays: p.productionTimeDays,
          minOrderQty: p.minOrderQty,
          sizesJson: JSON.stringify(p.sizes ?? []),
          finishesJson: JSON.stringify(p.finishes ?? []),
          personalisationOptions: JSON.stringify(p.personalisation ?? []),
          supplierId: p.supplierId,
          stockStatus: p.stockStatus ?? "MADE_TO_ORDER",
          imageUrl: null,
        },
      });
      products[p.name] = product.id;
    }
  }

  // ---------------------------------------------------------------------
  // Orders — spread across every stage of the pipeline
  // ---------------------------------------------------------------------

  type ApprovalPlan = { role: string; status: string; comment?: string; daysAgoResponded?: number };

  async function createOrder(opts: {
    agent: (typeof agents)[number];
    branchId: string;
    status: string;
    urgency: string;
    deliveryMethod: string;
    createdDaysAgo: number;
    items: { productName: string; quantity: number; size?: string; colour?: string; finish?: string; notes?: string }[];
    approvals: ApprovalPlan[];
    supplier?: string;
    motivation: string;
    trackingNumber?: string;
    courierName?: string;
    archived?: boolean;
  }) {
    const orderNumber = nextOrderNumber();
    const createdAt = daysAgo(opts.createdDaysAgo);
    const submitted = opts.status !== "DRAFT";

    const items = opts.items.map((it) => {
      const productId = products[it.productName];
      return { productId, name: it.productName, ...it };
    });

    let estimatedCost = 0;
    for (const it of items) {
      // crude price lookup happens after creation is fine — use flat estimate
      estimatedCost += it.quantity * 100;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        agentId: opts.agent.id,
        branchId: opts.branchId,
        status: opts.status,
        urgency: opts.urgency,
        deliveryMethod: opts.deliveryMethod,
        deliveryAddress:
          opts.deliveryMethod === "COLLECT_FROM_OFFICE"
            ? undefined
            : "123 Compensation Beach Rd, Ballito, 4420",
        agentContact: opts.agent.phone ?? undefined,
        motivation: opts.motivation,
        costCentre: `CC-${opts.branchId.slice(-4).toUpperCase()}`,
        estimatedCost,
        supplierId: opts.supplier,
        trackingNumber: opts.trackingNumber,
        courierName: opts.courierName,
        requiredApprovalsJson: JSON.stringify(opts.approvals.map((a) => a.role)),
        createdAt,
        submittedAt: submitted ? daysAgo(opts.createdDaysAgo - 0.2) : null,
        archived: !!opts.archived,
        requiredDate: daysFromNow(Math.max(3, 14 - opts.createdDaysAgo)),
        estimatedCompletionDate: daysFromNow(Math.max(1, 10 - opts.createdDaysAgo)),
        completedAt: opts.status === "COMPLETED" ? daysAgo(Math.max(0, opts.createdDaysAgo - 6)) : null,
      },
    });

    for (const it of items) {
      const productRecord = it.productId
        ? await prisma.product.findUnique({ where: { id: it.productId } })
        : null;
      const unit = productRecord?.price ?? 150;
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: it.productId,
          productNameSnapshot: it.name,
          quantity: it.quantity,
          size: it.size,
          colour: it.colour,
          finish: it.finish,
          customWording: it.notes,
          unitPriceEstimate: unit,
          lineTotalEstimate: unit * it.quantity,
        },
      });
    }

    const total = await prisma.orderItem.aggregate({
      where: { orderId: order.id },
      _sum: { lineTotalEstimate: true },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { estimatedCost: total._sum.lineTotalEstimate ?? 0 },
    });

    for (const a of opts.approvals) {
      const responder = managers.find((m) => m.role === a.role);
      await prisma.orderApproval.create({
        data: {
          orderId: order.id,
          approverRole: a.role,
          status: a.status,
          comment: a.comment,
          respondedAt:
            a.status !== "AWAITING_REVIEW" && a.daysAgoResponded !== undefined
              ? daysAgo(a.daysAgoResponded)
              : null,
          respondedById: a.status !== "AWAITING_REVIEW" ? responder?.id : null,
          required: true,
        },
      });
    }

    // Build a plausible status history leading up to the current status
    const historySteps: { status: string; note?: string; daysAgo: number }[] = [
      { status: "DRAFT", daysAgo: opts.createdDaysAgo, note: "Order created." },
    ];
    if (submitted) {
      historySteps.push({ status: "SUBMITTED", daysAgo: opts.createdDaysAgo - 0.1, note: "Order submitted for approval." });
      historySteps.push({ status: "AWAITING_APPROVAL", daysAgo: opts.createdDaysAgo - 0.1 });
    }
    const order_ = ["APPROVED","ORDERED_FROM_SUPPLIER","SUPPLIER_CONFIRMED","ARTWORK_IN_PREPARATION","ARTWORK_APPROVED","IN_MANUFACTURING","QUALITY_CHECK","READY_FOR_COLLECTION","RECEIVED_AT_OFFICE","BEING_PACKED","COURIER_BOOKED","BEING_COURIERED","OUT_FOR_DELIVERY","DELIVERED","COLLECTED_BY_AGENT","COMPLETED"];
    const idx = order_.indexOf(opts.status);
    if (opts.status === "CHANGES_REQUESTED") {
      historySteps.push({ status: "CHANGES_REQUESTED", daysAgo: opts.createdDaysAgo - 0.5, note: "Manager requested changes." });
    } else if (opts.status === "DECLINED") {
      historySteps.push({ status: "DECLINED", daysAgo: opts.createdDaysAgo - 0.5, note: "Order declined." });
    } else if (opts.status === "CANCELLED") {
      historySteps.push({ status: "CANCELLED", daysAgo: opts.createdDaysAgo - 0.5, note: "Cancelled by agent before manufacturing." });
    } else if (idx >= 0) {
      const span = opts.createdDaysAgo - 0.5;
      for (let i = 0; i <= idx; i++) {
        historySteps.push({
          status: order_[i],
          daysAgo: Math.max(0, span - i * (span / (idx + 2))),
        });
      }
    }

    for (const step of historySteps) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: step.status,
          note: step.note,
          changedById: pick([...managers, admin]).id,
          createdAt: daysAgo(step.daysAgo),
        },
      });
    }

    // Comments
    await prisma.comment.create({
      data: {
        orderId: order.id,
        userId: opts.agent.id,
        body: "Please let me know if any additional info is needed — happy to jump on a call.",
        createdAt: daysAgo(opts.createdDaysAgo - 0.05),
      },
    });

    // Notifications
    if (submitted) {
      for (const a of opts.approvals.filter((x) => x.status === "AWAITING_REVIEW")) {
        const m = managers.find((mm) => mm.role === a.role);
        if (m) {
          await prisma.notification.create({
            data: {
              userId: m.id,
              type: "APPROVAL_REQUIRED",
              title: `Approval required — ${orderNumber}`,
              body: `${opts.agent.name} submitted an order awaiting your approval.`,
              orderId: order.id,
              createdAt: daysAgo(opts.createdDaysAgo - 0.1),
            },
          });
        }
      }
      await prisma.notification.create({
        data: {
          userId: opts.agent.id,
          type: "ORDER_SUBMITTED",
          title: `Order submitted — ${orderNumber}`,
          body: `Your order has been submitted and is awaiting approval.`,
          orderId: order.id,
          read: Math.random() > 0.4,
          createdAt: daysAgo(opts.createdDaysAgo - 0.1),
        },
      });
    }
    if (opts.status === "DECLINED") {
      await prisma.notification.create({
        data: {
          userId: opts.agent.id,
          type: "ORDER_DECLINED",
          title: `Order declined — ${orderNumber}`,
          body: "One of your orders was declined. Open the order to see the reason.",
          orderId: order.id,
          createdAt: daysAgo(opts.createdDaysAgo - 0.5),
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: opts.agent.id,
        action: "ORDER_CREATED",
        entityType: "Order",
        entityId: order.id,
        orderNumber,
        newValue: opts.status,
        createdAt,
      },
    });

    return order;
  }

  // A spread of demo orders across every meaningful stage
  await createOrder({
    agent: agents[0],
    branchId: branches[0].id,
    status: "DRAFT",
    urgency: "NORMAL",
    deliveryMethod: "COLLECT_FROM_OFFICE",
    createdDaysAgo: 0.5,
    items: [{ productName: "Standard Business Cards", quantity: 200 }],
    approvals: [{ role: "MIENKE", status: "AWAITING_REVIEW" }],
    motivation: "New listing pack for upcoming show day.",
  });

  await createOrder({
    agent: agents[1],
    branchId: branches[1].id,
    status: "AWAITING_APPROVAL",
    urgency: "PRIORITY",
    deliveryMethod: "DELIVER_TO_OFFICE",
    createdDaysAgo: 2,
    items: [
      { productName: "For Sale Board – Standard", quantity: 3, size: "900x600mm" },
      { productName: "Plastic Board Dropper", quantity: 3 },
    ],
    approvals: [
      { role: "MIENKE", status: "AWAITING_REVIEW" },
      { role: "MJ", status: "AWAITING_REVIEW" },
    ],
    supplier: signsCo.id,
    motivation: "New sole mandate — 12 Ocean View Drive.",
  });

  await createOrder({
    agent: agents[2],
    branchId: branches[2].id,
    status: "CHANGES_REQUESTED",
    urgency: "NORMAL",
    deliveryMethod: "COURIER_TO_AGENT",
    createdDaysAgo: 4,
    items: [{ productName: "Branded Golf Shirt", quantity: 2, size: "M" }],
    approvals: [
      { role: "MIENKE", status: "CHANGES_REQUESTED", comment: "Please confirm sizes with the agent before we order — M seems too small based on last order.", daysAgoResponded: 3 },
    ],
    supplier: apparelCo.id,
    motivation: "Replacement uniform items.",
  });

  await createOrder({
    agent: agents[3],
    branchId: branches[3].id,
    status: "APPROVED",
    urgency: "NORMAL",
    deliveryMethod: "COLLECT_FROM_OFFICE",
    createdDaysAgo: 5,
    items: [{ productName: "A5 Property Flyer", quantity: 250 }],
    approvals: [
      { role: "MIENKE", status: "APPROVED", comment: "Looks good.", daysAgoResponded: 4 },
    ],
    supplier: printCo.id,
    motivation: "Open house flyers for weekend showing.",
  });

  await createOrder({
    agent: agents[4],
    branchId: branches[0].id,
    status: "IN_MANUFACTURING",
    urgency: "URGENT",
    deliveryMethod: "DELIVER_TO_OFFICE",
    createdDaysAgo: 7,
    items: [{ productName: "For Sale Board – Standard", quantity: 5, size: "600x450mm" }],
    approvals: [
      { role: "MIENKE", status: "APPROVED", daysAgoResponded: 6.5 },
      { role: "MJ", status: "APPROVED", daysAgoResponded: 6 },
    ],
    supplier: signsCo.id,
    motivation: "New development launch — 5 boards required urgently.",
  });

  await createOrder({
    agent: agents[5],
    branchId: branches[1].id,
    status: "READY_FOR_COLLECTION",
    urgency: "PRIORITY",
    deliveryMethod: "COLLECT_FROM_OFFICE",
    createdDaysAgo: 9,
    items: [{ productName: "Branded Cap", quantity: 10 }],
    approvals: [{ role: "NADIA", status: "APPROVED", daysAgoResponded: 8 }],
    supplier: apparelCo.id,
    motivation: "Team caps for regional agent day.",
  });

  await createOrder({
    agent: agents[6],
    branchId: branches[2].id,
    status: "BEING_COURIERED",
    urgency: "NORMAL",
    deliveryMethod: "COURIER_TO_AGENT",
    createdDaysAgo: 11,
    items: [{ productName: "Tri-fold Property Brochure", quantity: 150 }],
    approvals: [
      { role: "MIENKE", status: "APPROVED", daysAgoResponded: 10 },
      { role: "CHANTAL", status: "APPROVED", daysAgoResponded: 9.5 },
    ],
    supplier: printCo.id,
    trackingNumber: "DCC-88213-ZA",
    courierName: "Dolphin Coast Couriers",
    motivation: "Listing brochures for Zimbali estate property.",
  });

  await createOrder({
    agent: agents[7],
    branchId: branches[3].id,
    status: "DELIVERED",
    urgency: "NORMAL",
    deliveryMethod: "COURIER_TO_CLIENT",
    createdDaysAgo: 14,
    items: [{ productName: "Luxury Listing Booklet", quantity: 20 }],
    approvals: [
      { role: "MIENKE", status: "APPROVED", daysAgoResponded: 13 },
      { role: "MJ", status: "APPROVED", daysAgoResponded: 12.5 },
      { role: "NADIA", status: "APPROVED", daysAgoResponded: 12 },
    ],
    supplier: printCo.id,
    trackingNumber: "DCC-77410-ZA",
    courierName: "Dolphin Coast Couriers",
    motivation: "Premium listing booklets couriered direct to seller.",
  });

  await createOrder({
    agent: agents[8],
    branchId: branches[4].id,
    status: "COMPLETED",
    urgency: "NORMAL",
    deliveryMethod: "COLLECT_FROM_OFFICE",
    createdDaysAgo: 21,
    items: [{ productName: "Sold Sticker", quantity: 20 }],
    approvals: [{ role: "CHANTAL", status: "APPROVED", daysAgoResponded: 20 }],
    supplier: printCo.id,
    motivation: "Sold stickers for closed deals this month.",
  });

  await createOrder({
    agent: agents[9],
    branchId: branches[0].id,
    status: "COMPLETED",
    urgency: "NORMAL",
    deliveryMethod: "COLLECT_FROM_OFFICE",
    createdDaysAgo: 30,
    items: [{ productName: "Standard Business Cards", quantity: 500 }],
    approvals: [{ role: "MIENKE", status: "APPROVED", daysAgoResponded: 29 }],
    supplier: printCo.id,
    motivation: "Reprint — ran out of stock.",
    archived: true,
  });

  await createOrder({
    agent: agents[0],
    branchId: branches[0].id,
    status: "DECLINED",
    urgency: "NORMAL",
    deliveryMethod: "COLLECT_FROM_OFFICE",
    createdDaysAgo: 10,
    items: [{ productName: "Branded Softshell Jacket", quantity: 1 }],
    approvals: [
      { role: "MIENKE", status: "DECLINED", comment: "Jackets are only issued once per year per agent — you received one in February.", daysAgoResponded: 9 },
    ],
    supplier: apparelCo.id,
    motivation: "Requesting a second jacket for the season.",
  });

  await createOrder({
    agent: agents[1],
    branchId: branches[1].id,
    status: "CANCELLED",
    urgency: "NORMAL",
    deliveryMethod: "COLLECT_FROM_OFFICE",
    createdDaysAgo: 6,
    items: [{ productName: "Branded Water Bottle", quantity: 10 }],
    approvals: [{ role: "MJ", status: "APPROVED", daysAgoResponded: 5.5 }],
    supplier: apparelCo.id,
    motivation: "Giveaway items for open house — event was postponed.",
  });

  await createOrder({
    agent: agents[2],
    branchId: branches[2].id,
    status: "AWAITING_APPROVAL",
    urgency: "CRITICAL",
    deliveryMethod: "COURIER_TO_AGENT",
    createdDaysAgo: 1,
    items: [
      { productName: "For Sale Board – Standard", quantity: 1, size: "900x600mm" },
      { productName: "Directional Arrow Board", quantity: 4 },
    ],
    approvals: [
      { role: "MIENKE", status: "AWAITING_REVIEW" },
      { role: "MJ", status: "AWAITING_REVIEW" },
      { role: "NADIA", status: "AWAITING_REVIEW" },
      { role: "CHANTAL", status: "AWAITING_REVIEW" },
    ],
    supplier: signsCo.id,
    motivation: "Signage for weekend show day — critical, board deadline tomorrow.",
  });

  await createOrder({
    agent: agents[3],
    branchId: branches[3].id,
    status: "SUPPLIER_CONFIRMED",
    urgency: "NORMAL",
    deliveryMethod: "DELIVER_TO_OFFICE",
    createdDaysAgo: 8,
    items: [{ productName: "Agent Profile Board", quantity: 1 }],
    approvals: [{ role: "NADIA", status: "APPROVED", daysAgoResponded: 7 }],
    supplier: signsCo.id,
    motivation: "New agent onboarding — profile board for office wall.",
  });

  await createOrder({
    agent: agents[4],
    branchId: branches[4].id,
    status: "ARTWORK_IN_PREPARATION",
    urgency: "PRIORITY",
    deliveryMethod: "COLLECT_FROM_OFFICE",
    createdDaysAgo: 3,
    items: [{ productName: "Social Media Design Set", quantity: 1 }],
    approvals: [{ role: "CHANTAL", status: "APPROVED", daysAgoResponded: 2 }],
    supplier: studioNine.id,
    motivation: "New listing — social campaign assets.",
  });

  await createOrder({
    agent: agents[5],
    branchId: branches[0].id,
    status: "QUALITY_CHECK",
    urgency: "NORMAL",
    deliveryMethod: "COLLECT_FROM_OFFICE",
    createdDaysAgo: 12,
    items: [{ productName: "Branded Presentation Folder", quantity: 50 }],
    approvals: [
      { role: "MIENKE", status: "APPROVED", daysAgoResponded: 11 },
      { role: "MJ", status: "APPROVED", daysAgoResponded: 10.5 },
    ],
    supplier: printCo.id,
    motivation: "Restock presentation folders for listing packs.",
  });

  await createOrder({
    agent: agents[6],
    branchId: branches[1].id,
    status: "OUT_FOR_DELIVERY",
    urgency: "NORMAL",
    deliveryMethod: "COURIER_TO_AGENT",
    createdDaysAgo: 6,
    items: [{ productName: "Branded Cap", quantity: 4 }],
    approvals: [{ role: "NADIA", status: "APPROVED", daysAgoResponded: 5 }],
    supplier: apparelCo.id,
    trackingNumber: "DCC-90045-ZA",
    courierName: "Dolphin Coast Couriers",
    motivation: "Caps for new agents joining this month.",
  });

  await createOrder({
    agent: agents[7],
    branchId: branches[2].id,
    status: "COLLECTED_BY_AGENT",
    urgency: "NORMAL",
    deliveryMethod: "COLLECT_FROM_OFFICE",
    createdDaysAgo: 15,
    items: [{ productName: "To Let Board – Standard", quantity: 2 }],
    approvals: [{ role: "MJ", status: "APPROVED", daysAgoResponded: 14 }],
    supplier: signsCo.id,
    motivation: "New rental mandates — Zimbali estate.",
  });

  await createOrder({
    agent: agents[8],
    branchId: branches[3].id,
    status: "RECEIVED_AT_OFFICE",
    urgency: "NORMAL",
    deliveryMethod: "DELIVER_TO_OFFICE",
    createdDaysAgo: 9,
    items: [{ productName: "Agent Name Badge", quantity: 1 }],
    approvals: [{ role: "MIENKE", status: "APPROVED", daysAgoResponded: 8 }],
    supplier: printCo.id,
    motivation: "Replacement name badge — lost original.",
  });

  await createOrder({
    agent: agents[9],
    branchId: branches[4].id,
    status: "BEING_PACKED",
    urgency: "NORMAL",
    deliveryMethod: "COURIER_TO_AGENT",
    createdDaysAgo: 5,
    items: [{ productName: "New Agent Welcome Pack", quantity: 1 }],
    approvals: [
      { role: "MIENKE", status: "APPROVED", daysAgoResponded: 4.5 },
      { role: "NADIA", status: "APPROVED", daysAgoResponded: 4 },
    ],
    supplier: apparelCo.id,
    motivation: "Welcome pack for new agent starting next week.",
  });

  await createOrder({
    agent: agents[0],
    branchId: branches[0].id,
    status: "COURIER_BOOKED",
    urgency: "URGENT",
    deliveryMethod: "COURIER_TO_CLIENT",
    createdDaysAgo: 4,
    items: [{ productName: "Property Video Edit", quantity: 1 }],
    approvals: [{ role: "CHANTAL", status: "APPROVED", daysAgoResponded: 3 }],
    supplier: lensLoft.id,
    trackingNumber: "DCC-91120-ZA",
    courierName: "Dolphin Coast Couriers",
    motivation: "Video edit delivery for seller review.",
  });

  await createOrder({
    agent: agents[1],
    branchId: branches[1].id,
    status: "ARTWORK_APPROVED",
    urgency: "NORMAL",
    deliveryMethod: "COLLECT_FROM_OFFICE",
    createdDaysAgo: 6,
    items: [{ productName: "Listing Presentation Pack", quantity: 1 }],
    approvals: [
      { role: "MIENKE", status: "APPROVED", daysAgoResponded: 5.5 },
      { role: "MJ", status: "APPROVED", daysAgoResponded: 5 },
      { role: "NADIA", status: "APPROVED", daysAgoResponded: 4.5 },
      { role: "CHANTAL", status: "APPROVED", daysAgoResponded: 4 },
    ],
    supplier: studioNine.id,
    motivation: "High-value listing — full presentation pack, all approvals required.",
  });

  await createOrder({
    agent: agents[2],
    branchId: branches[2].id,
    status: "ORDERED_FROM_SUPPLIER",
    urgency: "NORMAL",
    deliveryMethod: "DELIVER_TO_OFFICE",
    createdDaysAgo: 3,
    items: [{ productName: "Drone Aerial Package", quantity: 1 }],
    approvals: [{ role: "NADIA", status: "APPROVED", daysAgoResponded: 2 }],
    supplier: lensLoft.id,
    motivation: "Aerial footage for Zimbali estate listing.",
  });

  const summary = `Seeded ${orderSeq} orders, ${agents.length} agents, ${suppliers.length} suppliers, ${categoryDefs.length} categories.`;
  console.log(summary);
  console.log("\nDemo login password for every account:", DEMO_PASSWORD);
  return { summary, orders: orderSeq, agents: agents.length, suppliers: suppliers.length, categories: categoryDefs.length };
}
