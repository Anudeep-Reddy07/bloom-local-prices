import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Camera, Link as LinkIcon, X } from "lucide-react";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters").max(100, "Name too long"),
  category: z.enum(["fruit", "flower"]),
  price: z.number().positive("Price must be positive").max(999999, "Price too high"),
  quantity_unit: z.string().trim().min(1, "Unit is required").max(20, "Unit too long"),
  image_url: z.string().url("Invalid URL").optional().or(z.literal("")),
});

interface ProductFormProps {
  shopId: string;
  product: any;
  onSaved: () => void;
}

const ProductForm = ({ shopId, product, onSaved }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || "fruit",
    price: product?.price || "",
    quantity_unit: product?.quantity_unit || "kg",
    image_url: product?.image_url || "",
  });
  const [imagePreview, setImagePreview] = useState(product?.image_url || "");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image must be less than 5MB",
      });
      return;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("products").getPublicUrl(filePath);
      
      setFormData({ ...formData, image_url: data.publicUrl });
      setImagePreview(data.publicUrl);
      
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    }
  };

  const handleImageUrl = (url: string) => {
    setFormData({ ...formData, image_url: url });
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = productSchema.parse({
        ...formData,
        price: parseFloat(formData.price.toString()),
      });

      setLoading(true);

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(validated)
          .eq("id", product.id);

        if (error) throw error;
        toast({ title: "Product updated successfully!" });
      } else {
        const { error } = await supabase.from("products").insert([{
          ...validated,
          shop_id: shopId,
        }] as any);

        if (error) throw error;
        toast({ title: "Product added successfully!" });
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
      <h2 className="text-2xl font-bold">{product ? "Edit Product" : "Add Product"}</h2>
      
      <div>
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Mango, Rose"
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fruit">Fruit</SelectItem>
            <SelectItem value="flower">Flower</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (₹) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="quantity_unit">Unit *</Label>
          <Input
            id="quantity_unit"
            value={formData.quantity_unit}
            onChange={(e) => setFormData({ ...formData, quantity_unit: e.target.value })}
            placeholder="kg, piece, dozen"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Product Image</Label>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const url = prompt("Enter image URL:");
              if (url) handleImageUrl(url);
            }}
            disabled={loading}
            className="flex-1"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Paste URL
          </Button>
        </div>
        
        {imagePreview && (
          <div className="relative w-full h-40 rounded-lg overflow-hidden border">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => {
                setImagePreview("");
                setFormData({ ...formData, image_url: "" });
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {product ? "Update Product" : "Add Product"}
      </Button>
    </form>
  );
};

export default ProductForm;
