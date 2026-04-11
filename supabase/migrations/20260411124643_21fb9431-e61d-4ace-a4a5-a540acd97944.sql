
-- Create items table
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'outros',
  location TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'reserved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Anyone can view active items
CREATE POLICY "Anyone can view active items"
  ON public.items FOR SELECT USING (true);

-- Users can create their own items
CREATE POLICY "Users can create their own items"
  ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own items
CREATE POLICY "Users can update their own items"
  ON public.items FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own items
CREATE POLICY "Users can delete their own items"
  ON public.items FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_items_status ON public.items(status);
CREATE INDEX idx_items_category ON public.items(category);
CREATE INDEX idx_items_user_id ON public.items(user_id);

-- Storage bucket for item images
INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true);

CREATE POLICY "Item images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'item-images');

CREATE POLICY "Authenticated users can upload item images"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'item-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own item images"
  ON storage.objects FOR UPDATE USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own item images"
  ON storage.objects FOR DELETE USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);
