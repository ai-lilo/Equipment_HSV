-- ============================================================
-- Storage Policies: equipment-photos Bucket
-- Im Supabase SQL Editor ausführen
-- Benötigt für Foto-Upload via Anon-Key
-- ============================================================

-- Hochladen erlauben
CREATE POLICY "Alle hochladen equipment-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'equipment-photos');

-- Überschreiben erlauben (upsert: true beim Re-Upload)
CREATE POLICY "Alle aktualisieren equipment-photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'equipment-photos')
WITH CHECK (bucket_id = 'equipment-photos');

-- Löschen erlauben (Foto wird beim Equipment-Löschen entfernt)
CREATE POLICY "Alle loeschen equipment-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'equipment-photos');
