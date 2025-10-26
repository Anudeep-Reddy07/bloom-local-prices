import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Search, MapPin, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ShopCard from "@/components/ShopCard";
import AveragePricePanel from "@/components/AveragePricePanel";
import logo from "@/assets/logo.png";

interface Shop {
  id: string;
  shop_name: string;
  owner_name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  distance?: number;
}

const BuyerDashboard = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    getUserLocation();
    fetchShops();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          toast({
            title: "Location access denied",
            description: "Showing all shops without distance sorting",
            variant: "destructive",
          });
        }
      );
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchShops = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select("*");

      if (error) throw error;

      let shopsWithDistance = data || [];
      
      if (userLocation) {
        shopsWithDistance = shopsWithDistance.map((shop) => ({
          ...shop,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            Number(shop.latitude),
            Number(shop.longitude)
          ),
        }));
        shopsWithDistance.sort((a, b) => ((a as any).distance || 0) - ((b as any).distance || 0));
      }

      setShops(shopsWithDistance);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading shops",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = shops.filter((shop) => {
    const query = searchQuery.toLowerCase();
    return (
      shop.shop_name.toLowerCase().includes(query) ||
      shop.owner_name.toLowerCase().includes(query) ||
      shop.address.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Market Bloom" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-gradient">Market Bloom</h1>
          </div>
          <Button variant="outline" onClick={signOut} size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Average Prices */}
          <div className="lg:col-span-1">
            <AveragePricePanel />
          </div>

          {/* Main Content - Shop Listings */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search shops, products, or locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={getUserLocation}>
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
              
              {userLocation && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Showing nearest shops first
                </p>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading shops...</p>
              </div>
            ) : filteredShops.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No shops found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredShops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
