import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, MapPin } from "lucide-react";
import { z } from "zod";

const shopSchema = z.object({
  shop_name: z.string().trim().min(2, "Shop name must be at least 2 characters").max(100, "Shop name too long"),
  owner_name: z.string().trim().min(2, "Owner name must be at least 2 characters").max(100, "Owner name too long"),
  address: z.string().trim().min(5, "Please provide a complete address").max(500, "Address too long"),
  phone: z.string().trim().max(15, "Phone number too long").optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

interface ShopFormProps {
  shop: any;
  onSaved: () => void;
}

const ShopForm = ({ shop, onSaved }: ShopFormProps) => {
  const [formData, setFormData] = useState({
    shop_name: shop?.shop_name || "",
    owner_name: shop?.owner_name || "",
    address: shop?.address || "",
    phone: shop?.phone || "",
    latitude: shop?.latitude || 0,
    longitude: shop?.longitude || 0,
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setLocationLoading(false);
          toast({
            title: "Location captured",
            description: "Your current location has been set",
          });
        },
        (error) => {
          setLocationLoading(false);
          toast({
            variant: "destructive",
            title: "Location error",
            description: "Could not get your location. Please enter manually.",
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = shopSchema.parse(formData);
      setLoading(true);

      if (shop) {
        const { error } = await supabase
          .from("shops")
          .update(validated)
          .eq("id", shop.id);

        if (error) throw error;
        toast({ title: "Shop updated successfully!" });
      } else {
        const { error } = await supabase.from("shops").insert([{
          ...validated,
          seller_id: user?.id,
        }] as any);

        if (error) throw error;
        toast({ title: "Shop registered successfully!" });
      }

      onSaved();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold">{shop ? "Edit Shop" : "Register Shop"}</h2>
      
      <div>
        <Label htmlFor="shop_name">Shop Name *</Label>
        <Input
          id="shop_name"
          value={formData.shop_name}
          onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="owner_name">Owner Name *</Label>
        <Input
          id="owner_name"
          value={formData.owner_name}
          onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="address">Complete Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Street, Area, City, Pincode"
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone (Optional)</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+91..."
          disabled={loading}
        />
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <Label>Shop Location *</Label>
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={locationLoading || loading}
          className="w-full"
        >
          {locationLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 mr-2" />
          )}
          Use Current Location
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Latitude</Label>
            <Input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label className="text-xs">Longitude</Label>
            <Input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
              required
              disabled={loading}
            />
          </div>
        </div>
        
        {formData.latitude !== 0 && formData.longitude !== 0 && (
          <p className="text-xs text-muted-foreground">
            Location: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {shop ? "Update Shop" : "Register Shop"}
      </Button>
    </form>
  );
};

export default ShopForm;
