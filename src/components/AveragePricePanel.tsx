import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface AveragePrice {
  name: string;
  category: string;
  avgPrice: number;
  shopCount: number;
}

const AveragePricePanel = () => {
  const [averagePrices, setAveragePrices] = useState<AveragePrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAveragePrices();
  }, []);

  const normalizeProductName = (name: string): string => {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
  };

  const fetchAveragePrices = async () => {
    try {
      const { data: products } = await supabase.from("products").select("name, category, price");

      if (products) {
        const priceMap = new Map<string, { total: number; count: number; category: string }>();

        products.forEach((product) => {
          const normalizedName = normalizeProductName(product.name);
          const key = `${normalizedName}-${product.category}`;

          if (priceMap.has(key)) {
            const existing = priceMap.get(key)!;
            existing.total += parseFloat(product.price.toString());
            existing.count += 1;
          } else {
            priceMap.set(key, {
              total: parseFloat(product.price.toString()),
              count: 1,
              category: product.category,
            });
          }
        });

        const averages: AveragePrice[] = Array.from(priceMap.entries()).map(([key, value]) => {
          const [name] = key.split("-");
          return {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            category: value.category,
            avgPrice: value.total / value.count,
            shopCount: value.count,
          };
        });

        averages.sort((a, b) => a.name.localeCompare(b.name));
        setAveragePrices(averages);
      }
    } catch (error) {
      console.error("Error fetching average prices:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="sticky top-24 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Average Prices
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : averagePrices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data available</p>
        ) : (
          <div className="space-y-3">
            {averagePrices.map((item, idx) => (
              <div key={idx} className="border-b pb-2 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{item.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-primary font-semibold text-base">
                    ₹{item.avgPrice.toFixed(2)}
                  </span>
                  <span>{item.shopCount} shop{item.shopCount > 1 ? "s" : ""}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AveragePricePanel;
