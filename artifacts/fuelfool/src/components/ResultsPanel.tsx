import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCostCounter } from "@/hooks/use-cost-counter";

interface ResultsPanelProps {
  gasPrice: number;
  mpg: number;
  distance: number;
  duration: string;
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

export function ResultsPanel({ gasPrice, mpg, distance, duration, onReset }: ResultsPanelProps) {
  const gallons = distance / mpg;
  const cost = gallons * gasPrice;
  const animatedCost = useCostCounter(cost);

  // Find the funniest comparison
  const comparison = COMPARISONS.reduce((prev, curr) => {
    const qty = cost / curr.price;
    // We want a quantity that is somewhat meaningful, like between 0.5 and 5
    if (qty >= 0.5 && qty <= 10) return curr;
    return prev;
  }, COMPARISONS[0]);

  const comparisonQty = (cost / comparison.price).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="mt-8 rounded-xl border border-ring bg-card p-8 shadow-xl text-center"
      data-testid="results-panel"
    >
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
    </motion.div>
  );
}
