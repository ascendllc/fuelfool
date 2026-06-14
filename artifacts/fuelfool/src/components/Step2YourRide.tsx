import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  useGetVehicleYears,
  getGetVehicleYearsQueryKey,
  useGetVehicleMakes, 
  useGetVehicleModels, 
  useGetVehicleTrims, 
  useGetVehicleMpg,
  getGetVehicleMakesQueryKey,
  getGetVehicleModelsQueryKey,
  getGetVehicleTrimsQueryKey,
  getGetVehicleMpgQueryKey
} from "@workspace/api-client-react";

interface Step2Props {
  isActive: boolean;
  isComplete: boolean;
  onComplete: (mpg: number) => void;
}

export function Step2YourRide({ isActive, isComplete, onComplete }: Step2Props) {
  const [year, setYear] = useState<string>("");
  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [trim, setTrim] = useState<string>("");
  const [submittedTrimId, setSubmittedTrimId] = useState<string | null>(null);

  const { data: years, isLoading: loadingYears } = useGetVehicleYears({
    query: { enabled: isActive && !isComplete, queryKey: getGetVehicleYearsQueryKey() }
  });

  const { data: makes, isLoading: loadingMakes } = useGetVehicleMakes(
    { year },
    { query: { enabled: !!year, queryKey: getGetVehicleMakesQueryKey({ year }) } }
  );

  const { data: models, isLoading: loadingModels } = useGetVehicleModels(
    { year, make },
    { query: { enabled: !!year && !!make, queryKey: getGetVehicleModelsQueryKey({ year, make }) } }
  );

  const { data: trims, isLoading: loadingTrims } = useGetVehicleTrims(
    { year, make, model },
    { query: { enabled: !!year && !!make && !!model, queryKey: getGetVehicleTrimsQueryKey({ year, make, model }) } }
  );

  const { data: mpgData, isLoading: loadingMpg, error: mpgError } = useGetVehicleMpg(
    { id: submittedTrimId! },
    { query: { enabled: !!submittedTrimId, queryKey: getGetVehicleMpgQueryKey({ id: submittedTrimId! }) } }
  );

  const handleSubmit = () => {
    if (trim) setSubmittedTrimId(trim);
  };

  if (mpgData && isActive && !isComplete) {
    onComplete(mpgData.combined);
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
          <span className="mr-2 text-muted-foreground">2.</span> What's Your Ride?
        </h2>
        {isComplete && <CheckCircle2 className="h-6 w-6 text-success" />}
      </div>

      {!isComplete ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={(val) => { setYear(val); setMake(""); setModel(""); setTrim(""); }}>
                <SelectTrigger data-testid="select-year" disabled={loadingYears || !years}>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years?.map((y) => (
                    <SelectItem key={y.value} value={y.value}>{y.text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Make</Label>
              <Select value={make} onValueChange={(val) => { setMake(val); setModel(""); setTrim(""); }} disabled={!year || loadingMakes}>
                <SelectTrigger data-testid="select-make">
                  <SelectValue placeholder="Select Make" />
                </SelectTrigger>
                <SelectContent>
                  {makes?.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={model} onValueChange={(val) => { setModel(val); setTrim(""); }} disabled={!make || loadingModels}>
                <SelectTrigger data-testid="select-model">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  {models?.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Trim</Label>
              <Select value={trim} onValueChange={setTrim} disabled={!model || loadingTrims}>
                <SelectTrigger data-testid="select-trim">
                  <SelectValue placeholder="Select Trim" />
                </SelectTrigger>
                <SelectContent>
                  {trims?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {mpgError && (
            <p className="text-sm text-destructive" data-testid="error-mpg">
              Hmm, no MPG data for that one. EPA may not have the receipts.
            </p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!trim || loadingMpg}
            className="mt-4 hover-elevate hover:brightness-110 active:scale-95 transition-all"
            data-testid="button-submit-step2"
          >
            {loadingMpg ? "Looking up..." : "Look Up MPG"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">{year} {makes?.find(m => m.value === make)?.text || make} {models?.find(m => m.value === model)?.text || model}</div>
          <div className="text-3xl font-bold text-foreground" data-testid="display-mpg">
            {mpgData?.combined} <span className="text-lg text-muted-foreground font-normal">MPG combined</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {mpgData?.city} city / {mpgData?.highway} highway • {mpgData?.fuelType}
          </div>
        </div>
      )}
    </motion.div>
  );
}
