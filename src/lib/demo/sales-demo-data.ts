import type {
  V2SalesRep, V2Lead, V2Deal, V2Activity, V2PipelineSummary,
  V2SalesForecast, V2GmailMessage, V2CalendarEvent, V2SalesData, DealStage,
} from "@/types/v2";

/* ── Sales Reps ── */
const REP_AMINE_ID = "rep_amine_001";
const REP_SARAH_ID = "rep_sarah_001";

export const demoReps: V2SalesRep[] = [
  {
    id: REP_AMINE_ID,
    name: "Amine Boukhelfa",
    email: "amine@boublenza.dz",
    role: "Senior Commercial",
    territory: "Europe & Middle East",
    quota: 1_200_000,
    phone: "+213 555 001 001",
    avatar: undefined,
    dealsWon: 8,
    dealsLost: 2,
    pipelineValue: 485_000,
    quotaAttainment: 62,
    activitiesCount: 47,
    googleConnected: false,
  },
  {
    id: REP_SARAH_ID,
    name: "Sarah Medjdoub",
    email: "sarah@boublenza.dz",
    role: "Junior Commercial",
    territory: "North Africa & Americas",
    quota: 800_000,
    phone: "+213 555 002 002",
    avatar: undefined,
    dealsWon: 4,
    dealsLost: 1,
    pipelineValue: 312_000,
    quotaAttainment: 41,
    activitiesCount: 32,
    googleConnected: false,
  },
];

/* ── Leads ── */
export const demoLeads: V2Lead[] = [
  { id: "lead_001", company: "Cargill GmbH", contactName: "Hans Mueller", contactEmail: "h.mueller@cargill.de", contactPhone: "+49 69 1234 5678", source: "trade_show", status: "qualified", repId: REP_AMINE_ID, repName: "Amine Boukhelfa", createdAt: "2025-01-15", updatedAt: "2025-02-01", notes: "Met at ANUGA 2024, interested in CARUMA bulk" },
  { id: "lead_002", company: "Barry Callebaut AG", contactName: "Sophie Keller", contactEmail: "s.keller@barry-callebaut.com", contactPhone: "+41 44 801 6000", source: "referral", status: "contacted", repId: REP_AMINE_ID, repName: "Amine Boukhelfa", createdAt: "2025-01-20", updatedAt: "2025-01-28", notes: "Referred by Swiss Trade Office" },
  { id: "lead_003", company: "Naturex SAS", contactName: "Pierre Lefebvre", contactEmail: "p.lefebvre@naturex.fr", contactPhone: "+33 4 90 23 96 89", source: "website", status: "qualified", repId: REP_AMINE_ID, repName: "Amine Boukhelfa", createdAt: "2025-01-10", updatedAt: "2025-02-05" },
  { id: "lead_004", company: "Olam International", contactName: "Rajesh Patel", contactEmail: "r.patel@olamgroup.com", contactPhone: "+65 6339 4100", source: "linkedin", status: "new", repId: REP_AMINE_ID, repName: "Amine Boukhelfa", createdAt: "2025-02-01", updatedAt: "2025-02-01" },
  { id: "lead_005", company: "ADM Trading", contactName: "James Wilson", contactEmail: "j.wilson@adm.com", contactPhone: "+1 312 634 8100", source: "trade_show", status: "qualified", repId: REP_SARAH_ID, repName: "Sarah Medjdoub", createdAt: "2025-01-08", updatedAt: "2025-02-03" },
  { id: "lead_006", company: "IFF Netherlands", contactName: "Pieter van der Berg", contactEmail: "p.vanderberg@iff.com", contactPhone: "+31 71 524 7111", source: "referral", status: "contacted", repId: REP_SARAH_ID, repName: "Sarah Medjdoub", createdAt: "2025-01-22", updatedAt: "2025-01-30" },
  { id: "lead_007", company: "Symrise AG", contactName: "Klaus Fischer", contactEmail: "k.fischer@symrise.com", contactPhone: "+49 5531 90 0", source: "website", status: "new", repId: REP_SARAH_ID, repName: "Sarah Medjdoub", createdAt: "2025-02-03", updatedAt: "2025-02-03" },
  { id: "lead_008", company: "Tate & Lyle PLC", contactName: "Emma Richardson", contactEmail: "e.richardson@tateandlyle.com", contactPhone: "+44 20 7977 2600", source: "linkedin", status: "converted", repId: REP_SARAH_ID, repName: "Sarah Medjdoub", createdAt: "2024-11-05", updatedAt: "2025-01-15", notes: "Converted → Deal for 20t CAROB EXTRACT" },
];

/* ── Deals ── */
export const demoDeals: V2Deal[] = [
  // Amine — 8 deals across stages
  { id: "deal_001", title: "Cargill CARUMA 50t", value: 225_000, currency: "USD", stage: "negociation", probability: 70, product: "CARUMA", quantity: 50, repId: REP_AMINE_ID, repName: "Amine Boukhelfa", leadCompany: "Cargill GmbH", expectedClose: "2025-03-15", createdAt: "2025-01-20" },
  { id: "deal_002", title: "Barry Callebaut CARANI Trial", value: 18_000, currency: "USD", stage: "proposition", probability: 50, product: "CARANI", quantity: 9, repId: REP_AMINE_ID, repName: "Amine Boukhelfa", leadCompany: "Barry Callebaut AG", expectedClose: "2025-03-30", createdAt: "2025-01-25" },
  { id: "deal_003", title: "Naturex Extract 15t", value: 127_500, currency: "USD", stage: "qualification", probability: 30, product: "CAROB_EXTRACT", quantity: 15, repId: REP_AMINE_ID, repName: "Amine Boukhelfa", leadCompany: "Naturex SAS", expectedClose: "2025-04-15", createdAt: "2025-02-01" },
  { id: "deal_004", title: "Olam CARUMA 100t", value: 450_000, currency: "USD", stage: "prospection", probability: 10, product: "CARUMA", quantity: 100, repId: REP_AMINE_ID, repName: "Amine Boukhelfa", leadCompany: "Olam International", expectedClose: "2025-06-30", createdAt: "2025-02-05" },
  { id: "deal_005", title: "UAE Food Co CARANI 30t", value: 60_000, currency: "USD", stage: "closing", probability: 90, product: "CARANI", quantity: 30, repId: REP_AMINE_ID, repName: "Amine Boukhelfa", expectedClose: "2025-02-20", createdAt: "2024-12-10" },
  { id: "deal_006", title: "Turkish Confectionery CARUMA", value: 135_000, currency: "USD", stage: "won", probability: 100, product: "CARUMA", quantity: 30, repId: REP_AMINE_ID, repName: "Amine Boukhelfa", closedAt: "2025-01-28", createdAt: "2024-11-15" },
  { id: "deal_007", title: "Italian Bakery CARANI", value: 42_000, currency: "USD", stage: "won", probability: 100, product: "CARANI", quantity: 21, repId: REP_AMINE_ID, repName: "Amine Boukhelfa", closedAt: "2025-01-10", createdAt: "2024-10-20" },
  { id: "deal_008", title: "Greek Import CARUMA 10t", value: 45_000, currency: "USD", stage: "lost", probability: 0, product: "CARUMA", quantity: 10, repId: REP_AMINE_ID, repName: "Amine Boukhelfa", closedAt: "2025-01-05", createdAt: "2024-09-15", notes: "Lost to Brazilian supplier" },
  // Sarah — 6 deals
  { id: "deal_009", title: "ADM CARUMA 40t", value: 180_000, currency: "USD", stage: "proposition", probability: 50, product: "CARUMA", quantity: 40, repId: REP_SARAH_ID, repName: "Sarah Medjdoub", leadCompany: "ADM Trading", expectedClose: "2025-04-01", createdAt: "2025-01-12" },
  { id: "deal_010", title: "Tate & Lyle Extract 20t", value: 170_000, currency: "USD", stage: "closing", probability: 85, product: "CAROB_EXTRACT", quantity: 20, repId: REP_SARAH_ID, repName: "Sarah Medjdoub", leadCompany: "Tate & Lyle PLC", expectedClose: "2025-02-25", createdAt: "2024-12-01" },
  { id: "deal_011", title: "Moroccan Distributor CARANI", value: 24_000, currency: "USD", stage: "negociation", probability: 65, product: "CARANI", quantity: 12, repId: REP_SARAH_ID, repName: "Sarah Medjdoub", expectedClose: "2025-03-10", createdAt: "2025-01-18" },
  { id: "deal_012", title: "Brazilian Ingredients CARUMA", value: 90_000, currency: "USD", stage: "qualification", probability: 25, product: "CARUMA", quantity: 20, repId: REP_SARAH_ID, repName: "Sarah Medjdoub", expectedClose: "2025-05-15", createdAt: "2025-02-02" },
  { id: "deal_013", title: "Tunisian Food Co CARANI 15t", value: 30_000, currency: "USD", stage: "won", probability: 100, product: "CARANI", quantity: 15, repId: REP_SARAH_ID, repName: "Sarah Medjdoub", closedAt: "2025-01-20", createdAt: "2024-11-01" },
  { id: "deal_014", title: "Egyptian Bakery CARUMA", value: 67_500, currency: "USD", stage: "won", probability: 100, product: "CARUMA", quantity: 15, repId: REP_SARAH_ID, repName: "Sarah Medjdoub", closedAt: "2025-02-01", createdAt: "2024-12-05" },
];

/* ── Activities ── */
export const demoActivities: V2Activity[] = [
  { id: "act_01", type: "call", subject: "Follow-up on CARUMA pricing", repName: "Amine Boukhelfa", leadCompany: "Cargill GmbH", dealTitle: "Cargill CARUMA 50t", completed: true, createdAt: "2025-02-10" },
  { id: "act_02", type: "email", subject: "Sent product spec sheets", repName: "Amine Boukhelfa", leadCompany: "Barry Callebaut AG", completed: true, createdAt: "2025-02-08" },
  { id: "act_03", type: "meeting", subject: "Factory tour with Naturex team", repName: "Amine Boukhelfa", leadCompany: "Naturex SAS", dueDate: "2025-02-15", completed: false, createdAt: "2025-02-05" },
  { id: "act_04", type: "task", subject: "Prepare Q1 forecast report", repName: "Amine Boukhelfa", dueDate: "2025-02-12", completed: false, createdAt: "2025-02-01" },
  { id: "act_05", type: "note", subject: "UAE Food Co confirmed final terms", repName: "Amine Boukhelfa", dealTitle: "UAE Food Co CARANI 30t", completed: true, createdAt: "2025-02-09" },
  { id: "act_06", type: "call", subject: "Intro call with ADM procurement", repName: "Sarah Medjdoub", leadCompany: "ADM Trading", dealTitle: "ADM CARUMA 40t", completed: true, createdAt: "2025-02-07" },
  { id: "act_07", type: "email", subject: "Contract draft sent to Tate & Lyle", repName: "Sarah Medjdoub", leadCompany: "Tate & Lyle PLC", dealTitle: "Tate & Lyle Extract 20t", completed: true, createdAt: "2025-02-06" },
  { id: "act_08", type: "meeting", subject: "Lunch with Moroccan distributor", repName: "Sarah Medjdoub", dueDate: "2025-02-14", completed: false, createdAt: "2025-02-04" },
  { id: "act_09", type: "task", subject: "Update CRM lead statuses", repName: "Sarah Medjdoub", dueDate: "2025-02-11", completed: false, createdAt: "2025-02-03" },
  { id: "act_10", type: "call", subject: "Brazilian market research call", repName: "Sarah Medjdoub", leadCompany: "Brazilian Ingredients", completed: true, createdAt: "2025-02-05" },
];

/* ── Pipeline Summary ── */
export const demoPipeline: V2PipelineSummary = {
  totalPipeline: 1_664_000,
  weightedValue: 821_750,
  winRate: 67,
  avgDealSize: 118_857,
  avgCycleDays: 52,
  dealsByStage: [
    { stage: "prospection", count: 1, value: 450_000 },
    { stage: "qualification", count: 2, value: 217_500 },
    { stage: "proposition", count: 2, value: 198_000 },
    { stage: "negociation", count: 2, value: 249_000 },
    { stage: "closing", count: 2, value: 230_000 },
    { stage: "won", count: 4, value: 274_500 },
    { stage: "lost", count: 1, value: 45_000 },
  ],
};

/* ── Forecasts ── */
export const demoForecasts: V2SalesForecast[] = [
  { period: "2025-Q1", weighted: 412_000, bestCase: 580_000, worstCase: 285_000, aiAdjusted: 445_000, repId: REP_AMINE_ID, repName: "Amine Boukhelfa" },
  { period: "2025-Q2", weighted: 305_000, bestCase: 450_000, worstCase: 180_000, aiAdjusted: 330_000, repId: REP_AMINE_ID, repName: "Amine Boukhelfa" },
  { period: "2025-Q1", weighted: 248_000, bestCase: 370_000, worstCase: 150_000, aiAdjusted: 265_000, repId: REP_SARAH_ID, repName: "Sarah Medjdoub" },
  { period: "2025-Q2", weighted: 195_000, bestCase: 310_000, worstCase: 120_000, aiAdjusted: 215_000, repId: REP_SARAH_ID, repName: "Sarah Medjdoub" },
  // Combined team forecasts
  { period: "2025-Q1", weighted: 660_000, bestCase: 950_000, worstCase: 435_000, aiAdjusted: 710_000 },
  { period: "2025-Q2", weighted: 500_000, bestCase: 760_000, worstCase: 300_000, aiAdjusted: 545_000 },
  { period: "2025-Q3", weighted: 420_000, bestCase: 680_000, worstCase: 250_000, aiAdjusted: 460_000 },
  { period: "2025-Q4", weighted: 380_000, bestCase: 620_000, worstCase: 220_000, aiAdjusted: 410_000 },
];

/* ── Gmail Demo Messages ── */
export const demoGmailMessages: V2GmailMessage[] = [
  { id: "gm_01", from: "h.mueller@cargill.de", subject: "Re: CARUMA pricing Q1 2025", snippet: "Hi Amine, thank you for the updated pricing sheet. We'd like to discuss the volume discount for 50t...", date: "2025-02-10T14:30:00Z", unread: true },
  { id: "gm_02", from: "procurement@uaefood.ae", subject: "PO #4521 — CARANI 30t confirmation", snippet: "Please find attached the purchase order for 30 tonnes of CARANI granules as agreed...", date: "2025-02-09T11:15:00Z", unread: false },
  { id: "gm_03", from: "s.keller@barry-callebaut.com", subject: "Factory visit scheduling", snippet: "Dear Amine, we would like to schedule a visit to your Tlemcen facility during the week of March 3rd...", date: "2025-02-08T09:45:00Z", unread: true },
  { id: "gm_04", from: "j.wilson@adm.com", subject: "Re: CARUMA sample shipment", snippet: "Sarah, the 5kg sample arrived in good condition. Our team will complete testing by Feb 20th...", date: "2025-02-07T16:20:00Z", unread: false },
  { id: "gm_05", from: "e.richardson@tateandlyle.com", subject: "Contract review — Carob Extract 20t", snippet: "Hi Sarah, our legal team has reviewed the contract draft. Two minor amendments on payment terms...", date: "2025-02-06T10:00:00Z", unread: true },
];

/* ── Calendar Demo Events ── */
export const demoCalendarEvents: V2CalendarEvent[] = [
  { id: "cal_01", title: "Cargill — Price negotiation call", start: "2025-02-14T10:00:00Z", end: "2025-02-14T11:00:00Z", attendees: ["h.mueller@cargill.de", "amine@boublenza.dz"], location: "Google Meet" },
  { id: "cal_02", title: "Naturex — Factory tour Tlemcen", start: "2025-02-17T09:00:00Z", end: "2025-02-17T12:00:00Z", attendees: ["p.lefebvre@naturex.fr", "amine@boublenza.dz"], location: "Boublenza Factory, Tlemcen" },
  { id: "cal_03", title: "Team Standup — Sales Pipeline Review", start: "2025-02-14T08:30:00Z", end: "2025-02-14T09:00:00Z", attendees: ["amine@boublenza.dz", "sarah@boublenza.dz"], location: "Google Meet" },
  { id: "cal_04", title: "ADM — Sample feedback call", start: "2025-02-21T15:00:00Z", end: "2025-02-21T15:30:00Z", attendees: ["j.wilson@adm.com", "sarah@boublenza.dz"], location: "Google Meet" },
  { id: "cal_05", title: "Tate & Lyle — Contract signing", start: "2025-02-25T14:00:00Z", end: "2025-02-25T15:00:00Z", attendees: ["e.richardson@tateandlyle.com", "sarah@boublenza.dz"], location: "Google Meet", description: "Final contract signing for 20t Carob Extract" },
];

/* ── Full Demo Data Bundle ── */
export function getDemoSalesData(): V2SalesData {
  return {
    reps: demoReps,
    deals: demoDeals,
    leads: demoLeads,
    activities: demoActivities,
    pipeline: demoPipeline,
    forecasts: demoForecasts,
  };
}
