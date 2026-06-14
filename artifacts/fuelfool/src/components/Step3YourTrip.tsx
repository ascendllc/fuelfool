import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useGetTripDistance, getGetTripDistanceQueryKey } from "@workspace/api-client-react";

interface Step3Props {
  isActive: boolean;
  isComplete: boolean;
  onComplete: (distance: number, duration: string) => void;
}

function isMapsLoaded(): boolean {
  return (
    typeof google !== "undefined" &&
    typeof google.maps !== "undefined" &&
    typeof google.maps.places !== "undefined"
  );
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isMapsLoaded()) {
      resolve();
      return;
    }
    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function Step3YourTrip({ isActive, isComplete, onComplete }: Step3Props) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [submittedParams, setSubmittedParams] = useState<{ origin: string; destination: string } | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const originRef = useRef<HTMLInputElement>(null);
  const destRef = useRef<HTMLInputElement>(null);
  const autocompleteSetupRef = useRef(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

  useEffect(() => {
    if (!isActive || isComplete || !apiKey) return;
    loadGoogleMapsScript(apiKey)
      .then(() => setMapsLoaded(true))
      .catch(() => setMapsLoaded(false));
  }, [isActive, isComplete, apiKey]);

  useEffect(() => {
    if (!mapsLoaded || !isActive || isComplete || autocompleteSetupRef.current) return;
    if (!isMapsLoaded()) return;

    autocompleteSetupRef.current = true;

    if (originRef.current) {
      const originAC = new google.maps.places.Autocomplete(originRef.current, { types: ["geocode"] });
      originAC.addListener("place_changed", () => {
        const place = originAC.getPlace();
        if (place.formatted_address) setOrigin(place.formatted_address);
      });
    }

    if (destRef.current) {
      const destAC = new google.maps.places.Autocomplete(destRef.current, { types: ["geocode"] });
      destAC.addListener("place_changed", () => {
        const place = destAC.getPlace();
        if (place.formatted_address) setDestination(place.formatted_address);
      });
    }
  }, [mapsLoaded, isActive, isComplete]);

  const { data: tripData, isLoading, error } = useGetTripDistance(
    submittedParams!,
    { query: { enabled: !!submittedParams, queryKey: getGetTripDistanceQueryKey(submittedParams!) } }
  );

  const handleSubmit = () => {
    if (origin && destination) {
      setSubmittedParams({ origin, destination });
    }
  };

  if (tripData && isActive && !isComplete) {
    onComplete(tripData.miles, tripData.duration);
  }

  if (!isActive && !isComplete) return null;

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
          <div className="space-y-2">
            <Label htmlFor="origin">Starting from...</Label>
            <Input
              id="origin"
              ref={originRef}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="123 Main St, City, State"
              data-testid="input-origin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              ref={destRef}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="456 Pizza Blvd, City, State"
              data-testid="input-destination"
            />
          </div>
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
        <div className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground truncate">{origin} → {destination}</div>
          <div className="text-3xl font-bold text-foreground" data-testid="display-distance">
            {tripData?.miles} <span className="text-lg text-muted-foreground font-normal">miles</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Est. drive time: {tripData?.duration}
          </div>
        </div>
      )}
    </motion.div>
  );
}
