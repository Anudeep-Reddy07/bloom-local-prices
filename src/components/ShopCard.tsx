import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity_unit: string;
  image_url: string | null;
}

interface ShopCardProps {
  shop: {
    id: string;
    shop_name: string;
    owner_name: string;
    address: string;
    latitude: number;
    longitude: number;
    phone: string | null;
    distance?: number;
  };
}

const ShopCard = ({ shop }: ShopCardProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchProducts();
    fetchReviews();
  }, [shop.id]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shop.id);
    
    if (data) setProducts(data);
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("rating")
      .eq("shop_id", shop.id);

    if (data && data.length > 0) {
      const avg = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
      setAverageRating(avg);
      setReviewCount(data.length);
    }
  };


  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">{shop.shop_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{shop.owner_name}</p>
          </div>
          {shop.distance !== undefined && (
            <Badge variant="secondary" className="ml-2">
              <MapPin className="w-3 h-3 mr-1" />
              {shop.distance < 1 
                ? `${(shop.distance * 1000).toFixed(0)}m`
                : `${shop.distance.toFixed(1)}km`}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <MapPin className="w-4 h-4" />
          <span>{shop.address}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">
            {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}
          </span>
          <span className="text-sm text-muted-foreground">
            ({reviewCount} reviews)
          </span>
        </div>

        {products.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Products:</p>
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <span>{product.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                  <span className="font-medium text-primary">₹{product.price}/{product.quantity_unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                View Reviews
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <ReviewList shopId={shop.id} />
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1">
                Add Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ReviewForm shopId={shop.id} onSaved={() => fetchReviews()} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopCard;
