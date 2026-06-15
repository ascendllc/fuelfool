import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetTripDistance, getGetTripDistanceQueryKey } from "@workspace/api-client-react";

interface Step3Props {
  isActive: boolean;
  isComplete: boolean;
  onComplete: (distance: number, duration: string) => void;
}

type Suggestion = { description: string; placeId: string };

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function fetchSuggestions(q: string): Promise<Suggestion[]> {
  if (!q || q.trim().length < 2) return [];
  try {
    const res = await fetch(`${API_BASE}/api/autocomplete?q=${encodeURIComponent(q.trim())}`);
    if (!res.ok) return [];
    return await res.json() as Suggestion[];
  } catch {
    return [];
  }
}

function useAddressAutocomplete() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useCallback((input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!input || input.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(input);
      setSuggestions(results);
      setOpen(results.length > 0);
    }, 220);
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
    setOpen(false);
  }, []);

  return { suggestions, open, query, clear };
}

export function Step3YourTrip({ isActive, isComplete, onComplete }: Step3Props) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [submittedParams, setSubmittedParams] = useState<{ origin: string; destination: string } | null>(null);
  const [isRoundTrip, setIsRoundTrip] = useState(true);

  const originAC = useAddressAutocomplete();
  const destAC = useAddressAutocomplete();

  const { data: tripData, isLoading, error } = useGetTripDistance(
    submittedParams!,
    { query: { enabled: !!submittedParams, queryKey: getGetTripDistanceQueryKey(submittedParams!) } }
  );

  const effectiveMiles = tripData ? (isRoundTrip ? tripData.miles * 2 : tripData.miles) : 0;

  function parseDurationToMinutes(dur: string): number {
    let total = 0;
    const hours = dur.match(/(\d+)\s*hour/);
    const mins = dur.match(/(\d+)\s*min/);
    if (hours) total += parseInt(hours[1]) * 60;
    if (mins) total += parseInt(mins[1]);
    return total;
  }

  function formatMinutes(total: number): string {
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} hr`;
    return `${h} hr ${m} min`;
  }

  function getEffectiveDuration(dur: string): string {
    if (!isRoundTrip) return dur;
    return formatMinutes(parseDurationToMinutes(dur) * 2);
  }

  const handleSubmit = () => {
    if (origin && destination) setSubmittedParams({ origin, destination });
  };

  useEffect(() => {
    if (tripData && isActive && !isComplete) {
      onComplete(effectiveMiles, getEffectiveDuration(tripData.duration));
    }
  }, [tripData, isActive, isComplete, isRoundTrip]);

  if (!isActive && !isComplete) return null;

  const RoundTripToggle = (
    <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
      <Checkbox
        id="round-trip"
        checked={isRoundTrip}
        onCheckedChange={(checked) => setIsRoundTrip(checked === true)}
        className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <span className="text-sm font-medium text-foreground">Round Trip</span>
    </label>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 ${
        isActive && !isComplete ? "border-ring shadow-active" : "border-card-border"
      } ${isComplete ? "bg-card/50" : ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          <span className="mr-2 text-muted-foreground">3.</span> Where's the money going?
        </h2>
        {isComplete && <CheckCircle2 className="h-6 w-6 text-success" />}
      </div>

      {!isComplete ? (
        <div className="space-y-4">
          <AddressField
            id="origin"
            label="Starting from..."
            value={origin}
            placeholder="123 Main St, City, State"
            testId="input-origin"
            suggestions={originAC.suggestions}
            open={originAC.open}
            onChange={(val) => { setOrigin(val); originAC.query(val); }}
            onSelect={(val) => { setOrigin(val); originAC.clear(); }}
            onBlur={() => setTimeout(originAC.clear, 150)}
          />
          <AddressField
            id="destination"
            label="Destination"
            value={destination}
            placeholder="456 Pizza Blvd, City, State"
            testId="input-destination"
            suggestions={destAC.suggestions}
            open={destAC.open}
            onChange={(val) => { setDestination(val); destAC.query(val); }}
            onSelect={(val) => { setDestination(val); destAC.clear(); }}
            onBlur={() => setTimeout(destAC.clear, 150)}
          />
          {RoundTripToggle}
          {error && (
            <p className="text-sm text-destructive" data-testid="error-trip">
              We couldn't find a driving route between those two locations. Check your addresses and try again.
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!origin || !destination || isLoading}
            className="hover-elevate hover:brightness-110 active:scale-95 transition-all"
            data-testid="button-submit-step3"
          >
            {isLoading ? "Calculating..." : "Calculate My Trip"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          <div className="text-sm text-muted-foreground truncate">{origin} → {destination}</div>
          <div>
            <div className="text-3xl font-bold text-foreground" data-testid="display-distance">
              {effectiveMiles} <span className="text-lg text-muted-foreground font-normal">miles</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {isRoundTrip ? `${tripData?.miles} mi each way` : "one way"} · Est. {tripData && getEffectiveDuration(tripData.duration)}
            </div>
          </div>
          {RoundTripToggle}
        </div>
      )}
    </motion.div>
  );
}

interface AddressFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  testId: string;
  suggestions: Suggestion[];
  open: boolean;
  onChange: (val: string) => void;
  onSelect: (val: string) => void;
  onBlur: () => void;
}

function AddressField({ id, label, value, placeholder, testId, suggestions, open, onChange, onSelect, onBlur }: AddressFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          data-testid={testId}
          autoComplete="off"
        />
        <AnimatePresence>
          {open && suggestions.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg overflow-hidden"
            >
              {suggestions.map((s) => (
                <li
                  key={s.placeId}
                  onMouseDown={() => onSelect(s.description)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-popover-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary opacity-70" />
                  <span className="truncate">{s.description}</span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
