import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Plus, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ShopForm from "@/components/ShopForm";
import ProductForm from "@/components/ProductForm";
import ProductList from "@/components/ProductList";
import logo from "@/assets/logo.png";

interface Shop {
  id: string;
  shop_name: string;
  owner_name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
}

const SellerDashboard = () => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchShop();
    }
  }, [user]);

  const fetchShop = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("seller_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      setShop(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading shop",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShopSaved = () => {
    setShopDialogOpen(false);
    fetchShop();
  };

  const handleProductSaved = () => {
    setProductDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Market Bloom" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-gradient">Market Bloom - Seller</h1>
          </div>
          <Button variant="outline" onClick={signOut} size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!shop ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Register Your Shop</h2>
            <p className="text-muted-foreground mb-6">
              Create your shop profile to start adding products and reaching customers
            </p>
            <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-fresh">
                  <Plus className="w-4 h-4 mr-2" />
                  Register Shop
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <ShopForm shop={null} onSaved={handleShopSaved} />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div>
            <div className="bg-card rounded-lg shadow-card p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{shop.shop_name}</h2>
                  <p className="text-muted-foreground">{shop.owner_name}</p>
                  <p className="text-sm text-muted-foreground mt-2">{shop.address}</p>
                  {shop.phone && <p className="text-sm text-muted-foreground">📞 {shop.phone}</p>}
                </div>
                <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Edit Shop</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <ShopForm shop={shop} onSaved={handleShopSaved} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Products</h3>
              <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-vibrant">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <ProductForm shopId={shop.id} product={null} onSaved={handleProductSaved} />
                </DialogContent>
              </Dialog>
            </div>

            <ProductList shopId={shop.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
