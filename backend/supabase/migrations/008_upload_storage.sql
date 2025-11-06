-- Créer le bucket pour les uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true);

-- Politique: Les utilisateurs authentifiés peuvent uploader leurs propres fichiers
CREATE POLICY "Authenticated users can upload their own files" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: Lecture publique des fichiers
CREATE POLICY "Public can view uploaded files" 
ON storage.objects FOR SELECT USING (bucket_id = 'uploads');

-- Politique: Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own files" 
ON storage.objects FOR DELETE TO authenticated 
USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Créer un index pour améliorer les performances
CREATE INDEX idx_storage_objects_user_folder 
ON storage.objects (bucket_id, (storage.foldername(name))[1]) 
WHERE bucket_id = 'uploads';
