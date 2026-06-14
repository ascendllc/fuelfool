import { Router } from "express";

const router = Router();
const FE_BASE = "https://www.fueleconomy.gov/ws/rest/vehicle";
const FE_HEADERS = { Accept: "application/json" };

async function fetchFuelEconomy<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { headers: FE_HEADERS });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

type MenuItem = { value: string; text: string };
type MenuResponse = { menuItem: MenuItem | MenuItem[] };
type OptionsItem = { value: string | number; text: string };
type OptionsResponse = { menuItem: OptionsItem | OptionsItem[] };
type VehicleData = {
  comb08?: number;
  city08?: number;
  highway08?: number;
  fuelType?: string;
  fuelType1?: string;
};

function normalizeMenuItems(data: MenuResponse | null): MenuItem[] {
  if (!data?.menuItem) return [];
  return Array.isArray(data.menuItem) ? data.menuItem : [data.menuItem];
}

router.get("/vehicle/years", async (_req, res) => {
  try {
    const data = await fetchFuelEconomy<MenuResponse>(`${FE_BASE}/menu/year`);
    const items = normalizeMenuItems(data);
    return res.json(items.map((i) => ({ value: String(i.value), text: String(i.text) })));
  } catch {
    return res.status(500).json({ error: "Failed to fetch vehicle years." });
  }
});

router.get("/vehicle/makes", async (req, res) => {
  const year = req.query.year as string;
  if (!year) return res.status(400).json({ error: "Year is required." });

  try {
    const data = await fetchFuelEconomy<MenuResponse>(`${FE_BASE}/menu/make?year=${encodeURIComponent(year)}`);
    const items = normalizeMenuItems(data);
    return res.json(items.map((i) => ({ value: String(i.value), text: String(i.text) })));
  } catch {
    return res.status(500).json({ error: "Failed to fetch vehicle makes." });
  }
});

router.get("/vehicle/models", async (req, res) => {
  const year = req.query.year as string;
  const make = req.query.make as string;
  if (!year || !make) return res.status(400).json({ error: "Year and make are required." });

  try {
    const data = await fetchFuelEconomy<MenuResponse>(
      `${FE_BASE}/menu/model?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`
    );
    const items = normalizeMenuItems(data);
    return res.json(items.map((i) => ({ value: String(i.value), text: String(i.text) })));
  } catch {
    return res.status(500).json({ error: "Failed to fetch vehicle models." });
  }
});

router.get("/vehicle/trims", async (req, res) => {
  const year = req.query.year as string;
  const make = req.query.make as string;
  const model = req.query.model as string;
  if (!year || !make || !model) return res.status(400).json({ error: "Year, make, and model are required." });

  try {
    const data = await fetchFuelEconomy<OptionsResponse>(
      `${FE_BASE}/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
    );
    if (!data?.menuItem) return res.json([]);
    const items = Array.isArray(data.menuItem) ? data.menuItem : [data.menuItem];
    return res.json(items.map((i) => ({ id: String(i.value), text: String(i.text) })));
  } catch {
    return res.status(500).json({ error: "Failed to fetch vehicle trims." });
  }
});

router.get("/vehicle/mpg", async (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: "Vehicle ID is required." });

  try {
    const data = await fetchFuelEconomy<VehicleData>(`${FE_BASE}/${encodeURIComponent(id)}`);
    if (!data) return res.status(404).json({ error: "No MPG data found for that vehicle. The EPA may not have records for it." });

    const combined = Number(data.comb08 ?? 0);
    const city = Number(data.city08 ?? 0);
    const highway = Number(data.highway08 ?? 0);
    const fuelType = data.fuelType ?? data.fuelType1 ?? "Regular Gasoline";

    return res.json({ combined, city, highway, fuelType });
  } catch {
    return res.status(500).json({ error: "Failed to fetch vehicle MPG." });
  }
});

export default router;
