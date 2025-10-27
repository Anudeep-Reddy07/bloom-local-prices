-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true);

-- Create RLS policies for product images
CREATE POLICY "Anyone can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'products');

CREATE POLICY "Sellers can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'products' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'seller'
  )
);

CREATE POLICY "Sellers can update their product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'products' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'seller'
  )
);

CREATE POLICY "Sellers can delete their product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'products' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'seller'
  )
);