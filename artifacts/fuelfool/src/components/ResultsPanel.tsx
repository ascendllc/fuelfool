import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCostCounter } from "@/hooks/use-cost-counter";
import { useGetEvDealerships, getGetEvDealershipsQueryKey } from "@workspace/api-client-react";
import { Zap, MapPin, ExternalLink, Car, Share2, Mail, MessageSquare, Leaf, Tag } from "lucide-react";

interface VehicleInfo {
  year: string;
  make: string;
  model: string;
  vehicleId: string;
}

interface TradeInData {
  estimatedLow: number;
  estimatedHigh: number;
  estimatedAvg: number;
  estimatedMileage: number;
  vehicleAge: number;
  segment: string;
}

interface ResultsPanelProps {
  gasPrice: number;
  mpg: number;
  distance: number;
  duration: string;
  zip: string;
  vehicle?: VehicleInfo;
  onReset: () => void;
}

const COMPARISONS = [
  { name: "gas station hot dogs", price: 2.50 },
  { name: "coffees", price: 6.00 },
  { name: "fancy lattes", price: 8.00 },
  { name: "carwashes", price: 12.00 },
  { name: "pizzas", price: 14.00 },
  { name: "movie tickets", price: 16.00 },
];

const EV_MPGE = 100;
const KWH_PER_GALLON_EQUIV = 33.7;
const NATIONAL_FALLBACK_RATE = 0.16;
const CO2_PER_GALLON_KG = 8.887;
const GRID_KG_PER_KWH = 0.386;
const KG_CO2_PER_TREE_PER_YEAR = 21;
const ANNUAL_MILES = 15000;

function SharePanel({ cost, distance, evTripCost }: {
  cost: number;
  distance: number;
  evTripCost: number;
}) {
  const [copied, setCopied] = useState<"instagram" | "tiktok" | null>(null);

  const url = "https://www.fueltru.com";
  const text = `My ${distance}-mi trip costs $${cost.toFixed(2)} in gas. If I had an EV it would cost $${evTripCost.toFixed(2)}. Uncover your true driving cost at ${url}`;

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: "FuelTru — My True Trip Cost", text });
    } catch {}
  };

  const handleCopyFor = async (platform: "instagram" | "tiktok") => {
    const caption = `${text} #FuelTru #${platform === "tiktok" ? "TikTokFinance" : "GasPrices"}`;
    try {
      await navigator.clipboard.writeText(caption);
    } catch {
      const el = document.createElement("textarea");
      el.value = caption;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(platform);
    setTimeout(() => setCopied(null), 2500);
    const dest = platform === "tiktok" ? "https://www.tiktok.com/" : "https://www.instagram.com/";
    window.open(dest, "_blank", "noopener,noreferrer");
  };

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent("You need to see what your daily drive actually costs")}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(text)}`;

  const btnClass = "inline-flex items-center gap-2 rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/50 hover:bg-primary/5 active:scale-95 transition-all";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
      className="rounded-xl border border-primary/30 bg-card p-8 shadow-lg text-center"
    >
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
          <Share2 className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-2xl font-display font-bold text-foreground">Spread the Word</h3>
      </div>
      <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
        Know someone who has no idea what their daily commute actually costs them? Send them a reality check — and let FuelTru do the math.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {canNativeShare && (
          <Button
            onClick={handleNativeShare}
            size="lg"
            className="hover-elevate hover:brightness-110 active:scale-95 transition-all gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share My Results
          </Button>
        )}

        {/* X / Twitter */}
        <a href={xUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.733-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Post on X
        </a>

        {/* Facebook */}
        <a href={fbUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Share on Facebook
        </a>

        {/* Instagram — copy caption */}
        <button onClick={() => handleCopyFor("instagram")} className={btnClass}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          {copied === "instagram" ? "Copied! Open Instagram →" : "Copy for Instagram"}
        </button>

        {/* TikTok — copy caption */}
        <button onClick={() => handleCopyFor("tiktok")} className={btnClass}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
          </svg>
          {copied === "tiktok" ? "Copied! Open TikTok →" : "Copy for TikTok"}
        </button>

        {/* Email */}
        <a href={emailUrl} className={btnClass}>
          <Mail className="h-4 w-4" />
          Email
        </a>

        {/* SMS / Text */}
        <a href={smsUrl} className={btnClass}>
          <MessageSquare className="h-4 w-4" />
          Text a Friend
        </a>
      </div>
    </motion.div>
  );
}

export function ResultsPanel({ gasPrice, mpg, distance, duration, zip, vehicle, onReset }: ResultsPanelProps) {
  const [electricityRate, setElectricityRate] = useState(NATIONAL_FALLBACK_RATE);
  const [tradeIn, setTradeIn] = useState<TradeInData | null>(null);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? "https://workspaceapi-server-production-0761.up.railway.app";
    fetch(`${apiBase}/api/electricity-rate?zip=${zip}`)
      .then((r) => r.json())
      .then((data: { rate?: number }) => {
        if (typeof data.rate === "number" && data.rate > 0) {
          setElectricityRate(data.rate);
        }
      })
      .catch(() => {});
  }, [zip]);

  useEffect(() => {
    if (!vehicle) return;
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? "https://workspaceapi-server-production-0761.up.railway.app";
    const params = new URLSearchParams({
      vehicleId: vehicle.vehicleId,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
    });
    fetch(`${apiBase}/api/trade-in-value?${params}`)
      .then((r) => r.json())
      .then((data: TradeInData) => {
        if (typeof data.estimatedAvg === "number") setTradeIn(data);
      })
      .catch(() => {});
  }, [vehicle?.vehicleId]);

  const evCostPerMile = (KWH_PER_GALLON_EQUIV / EV_MPGE) * electricityRate;

  const gallons = distance / mpg;
  const cost = gallons * gasPrice;
  const animatedCost = useCostCounter(cost);

  const evTripCost = distance * evCostPerMile;
  const evSavings = cost - evTripCost;

  const gasCO2 = gallons * CO2_PER_GALLON_KG;
  const evKwh = (distance / EV_MPGE) * KWH_PER_GALLON_EQUIV;
  const evCO2 = evKwh * GRID_KG_PER_KWH;
  const co2Saved = gasCO2 - evCO2;

  const annualGasCO2 = (ANNUAL_MILES / mpg) * CO2_PER_GALLON_KG;
  const annualEvCO2 = (ANNUAL_MILES / EV_MPGE) * KWH_PER_GALLON_EQUIV * GRID_KG_PER_KWH;
  const annualCO2Saved = annualGasCO2 - annualEvCO2;
  const treesEquivalent = Math.round(annualCO2Saved / KG_CO2_PER_TREE_PER_YEAR);

  const { data: dealerships = [] } = useGetEvDealerships(
    { zip },
    { query: { queryKey: getGetEvDealershipsQueryKey({ zip }), staleTime: 1000 * 60 * 10 } }
  );

  const comparison = COMPARISONS.reduce((prev, curr) => {
    const qty = cost / curr.price;
    if (qty >= 0.5 && qty <= 10) return curr;
    return prev;
  }, COMPARISONS[0]);

  const comparisonQty = (cost / comparison.price).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="mt-8 space-y-6"
      data-testid="results-panel"
    >
      {/* Main cost card */}
      <div className="rounded-xl border border-ring bg-card p-8 shadow-xl text-center">
        <h2 className="text-3xl font-display font-bold text-foreground mb-6">The Damage</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
          <div className="p-4 bg-background rounded-lg border border-card-border">
            <div className="text-muted-foreground mb-1">Distance</div>
            <div className="font-bold text-foreground text-lg">{distance} mi</div>
          </div>
          <div className="p-4 bg-background rounded-lg border border-card-border">
            <div className="text-muted-foreground mb-1">Drive Time</div>
            <div className="font-bold text-foreground text-lg">{duration}</div>
          </div>
          <div className="p-4 bg-background rounded-lg border border-card-border">
            <div className="text-muted-foreground mb-1">Your MPG</div>
            <div className="font-bold text-foreground text-lg">{mpg}</div>
          </div>
          <div className="p-4 bg-background rounded-lg border border-card-border">
            <div className="text-muted-foreground mb-1">Gas Price</div>
            <div className="font-bold text-foreground text-lg">${gasPrice.toFixed(2)}</div>
          </div>
          <div className="p-4 bg-background rounded-lg border border-card-border">
            <div className="text-muted-foreground mb-1">Gallons Used</div>
            <div className="font-bold text-foreground text-lg">{gallons.toFixed(2)}</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-lg text-muted-foreground mb-2">Estimated Trip Cost</div>
          <div className="text-7xl font-bold text-primary tracking-tight font-display" data-testid="display-total-cost">
            ${animatedCost.toFixed(2)}
          </div>
        </div>

        <div className="text-lg text-foreground mb-8 bg-secondary/50 p-4 rounded-lg inline-block">
          That's roughly <span className="font-bold text-primary">{comparisonQty} {comparison.name}</span> you're burning per trip.
        </div>

        <div>
          <Button
            onClick={onReset}
            variant="outline"
            size="lg"
            className="hover-elevate transition-all"
            data-testid="button-start-over"
          >
            Start Over
          </Button>
        </div>
      </div>

      {/* EV comparison card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="rounded-xl border border-success/40 bg-card p-8 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15">
            <Zap className="h-5 w-5 text-success" />
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground">What If You Drove Electric?</h3>
        </div>

        <p className="text-muted-foreground mb-6 leading-relaxed">
          Electric vehicles average <strong className="text-foreground">{EV_MPGE} MPGe</strong> — nearly{" "}
          <strong className="text-foreground">{Math.round(EV_MPGE / mpg)}× more efficient</strong> than your{" "}
          {mpg} MPG vehicle. At your average state electricity rate of{" "}
          <strong className="text-foreground">${electricityRate.toFixed(2)}/kWh</strong>, EVs cost about{" "}
          <strong className="text-foreground">{(evCostPerMile * 100).toFixed(1)}¢ per mile</strong> to
          run — a fraction of what gasoline costs. They also have{" "}
          <strong className="text-foreground">far fewer moving parts</strong>, meaning dramatically lower
          maintenance: no oil changes, no transmission service, no exhaust repairs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-background rounded-lg border border-card-border text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">This Trip in Your Car</div>
            <div className="text-2xl font-bold text-primary">${cost.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">{mpg} MPG · gas</div>
          </div>
          <div className="p-4 bg-background rounded-lg border border-success/30 text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Same Trip in an EV</div>
            <div className="text-2xl font-bold text-success">${evTripCost.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">{EV_MPGE} MPGe · electric</div>
          </div>
          <div className="p-4 bg-background rounded-lg border border-success/50 bg-success/5 text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">You'd Save</div>
            <div className="text-2xl font-bold text-success">${evSavings.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">per trip</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground italic mb-6">
          Over 15,000 miles/year that's roughly{" "}
          <strong className="text-foreground not-italic">
            ${Math.round((evCostPerMile - gasPrice / mpg) * -15000).toLocaleString()} in annual fuel savings
          </strong>{" "}
          compared to your current vehicle.
        </p>

        {/* Carbon footprint section */}
        <div className="border-t border-card-border pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="h-4 w-4 text-success" />
            <span className="text-sm font-semibold text-success uppercase tracking-wide">Carbon Footprint</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-background rounded-lg border border-card-border text-center">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Your Car Emits</div>
              <div className="text-2xl font-bold text-primary">{gasCO2.toFixed(1)} kg</div>
              <div className="text-xs text-muted-foreground mt-1">CO₂ this trip</div>
            </div>
            <div className="p-4 bg-background rounded-lg border border-success/30 text-center">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">EV Would Emit</div>
              <div className="text-2xl font-bold text-success">{evCO2.toFixed(1)} kg</div>
              <div className="text-xs text-muted-foreground mt-1">CO₂ this trip</div>
            </div>
            <div className="p-4 bg-success/5 rounded-lg border border-success/50 text-center">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">CO₂ Saved</div>
              <div className="text-2xl font-bold text-success">{co2Saved.toFixed(1)} kg</div>
              <div className="text-xs text-muted-foreground mt-1">per trip</div>
            </div>
          </div>

          <div className="bg-success/5 border border-success/20 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Annually at {ANNUAL_MILES.toLocaleString()} miles:</span>{" "}
            your current vehicle emits roughly{" "}
            <strong className="text-foreground">{Math.round(annualGasCO2).toLocaleString()} kg of CO₂</strong>.
            An EV on the same mileage would emit only{" "}
            <strong className="text-foreground">{Math.round(annualEvCO2).toLocaleString()} kg</strong> — keeping{" "}
            <strong className="text-success">{Math.round(annualCO2Saved).toLocaleString()} kg of CO₂</strong> out
            of the atmosphere. That's the equivalent of planting{" "}
            <strong className="text-success">{treesEquivalent} trees</strong> every year.
          </div>
        </div>
      </motion.div>

      {/* Share card */}
      <SharePanel
        cost={cost}
        distance={distance}
        evTripCost={evTripCost}
      />

      {/* Dealerships + CarGurus card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        className="rounded-xl border border-card-border bg-card p-8 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground">Ready to Go Electric?</h3>
        </div>

        {/* Trade-in value estimate */}
        {vehicle && (
          <div className="mb-6 rounded-lg border border-ring/40 bg-background p-5">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-ring" />
              <span className="text-sm font-semibold text-ring uppercase tracking-wide">Your Trade-In Estimate</span>
            </div>
            {tradeIn ? (
              <>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  A <strong className="text-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</strong> in
                  average condition with roughly{" "}
                  <strong className="text-foreground">{tradeIn.estimatedMileage.toLocaleString()} miles</strong>{" "}
                  (about {tradeIn.vehicleAge} year{tradeIn.vehicleAge !== 1 ? "s" : ""} of average driving) is
                  typically worth:
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                  <div className="flex-1 w-full text-center p-4 rounded-lg bg-ring/8 border border-ring/30">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Trade-In Range</div>
                    <div className="text-2xl font-bold text-foreground">
                      ${tradeIn.estimatedLow.toLocaleString()} – ${tradeIn.estimatedHigh.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex-1 w-full text-center p-4 rounded-lg bg-success/8 border border-success/30">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Toward Your EV Down Payment</div>
                    <div className="text-2xl font-bold text-success">
                      ~${tradeIn.estimatedAvg.toLocaleString()}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Based on standard depreciation for a {tradeIn.segment.toLowerCase()} in your model year.
                  Trade-in offers from dealers typically run 10–20% below private-party sale price. Get
                  competing offers from{" "}
                  <a href="https://www.carmax.com/sell-my-car" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">CarMax</a>
                  {" "}or{" "}
                  <a href="https://www.carvana.com/sell-my-car" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Carvana</a>
                  {" "}before heading to a dealer.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground animate-pulse">Estimating trade-in value…</p>
            )}
          </div>
        )}

        {dealerships.length > 0 && (
          <>
            <p className="text-muted-foreground mb-4">
              Here are EV dealerships near ZIP <strong className="text-foreground">{zip}</strong>:
            </p>
            <div className="space-y-3 mb-6">
              {dealerships.map((d, i) => {
                const isBrand = d.isTesla || d.isRivian || d.isPolestar;
                const badge = d.isTesla ? "Closest Tesla" : d.isRivian ? "Closest Rivian" : d.isPolestar ? "Closest Polestar" : null;
                return (
                  <a
                    key={i}
                    href={d.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-all group ${
                      isBrand
                        ? "bg-primary/5 border-primary/40 hover:border-primary hover:bg-primary/10"
                        : "bg-background border-card-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{d.name}</span>
                        {badge && (
                          <span className="text-xs font-bold text-primary border border-primary/40 rounded px-1.5 py-0.5 shrink-0">{badge}</span>
                        )}
                        {d.distanceMiles !== undefined && (
                          <span className="text-xs text-muted-foreground shrink-0">({d.distanceMiles} mi away)</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{d.address}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                  </a>
                );
              })}
            </div>
          </>
        )}

        <div className="border-t border-card-border pt-5">
          <p className="text-muted-foreground mb-4 text-sm">
            Search and compare thousands of electric vehicles — new and used — all in one place:
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.autotrader.com/cars-for-sale/electric"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              <ExternalLink className="h-4 w-4" />
              AutoTrader
            </a>
            <a
              href="https://www.cargurus.com/shop/electric-cars"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              <ExternalLink className="h-4 w-4" />
              CarGurus
            </a>
            <a
              href="https://www.cars.com/electric-cars/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              <ExternalLink className="h-4 w-4" />
              Cars.com
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
