-- Security: RLS-Policies härten
-- Im Supabase Dashboard > SQL Editor ausführen

-- 1. Hilfsfunktion: Rolle des eingeloggten Users ermitteln
--    SECURITY DEFINER: läuft als DB-Owner, umgeht RLS beim Lookup selbst
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM users WHERE email = auth.email()
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Alte Schreib-Policies entfernen (waren: using (true) = jeder darf alles)
DROP POLICY IF EXISTS "Alle schreiben rooms" ON rooms;
DROP POLICY IF EXISTS "Alle schreiben cabinets" ON cabinets;
DROP POLICY IF EXISTS "Alle schreiben equipment" ON equipment;
DROP POLICY IF EXISTS "Alle schreiben change_log" ON change_log;
DROP POLICY IF EXISTS "Alle schreiben users" ON users;

-- 3. Neue Schreib-Policies: nur eingeloggte User (nicht anonymous)
CREATE POLICY "auth_write_rooms" ON rooms
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_write_cabinets" ON cabinets
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_write_equipment" ON equipment
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_write_change_log" ON change_log
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. Users-Tabelle: nur ADMIN darf schreiben
CREATE POLICY "admin_write_users" ON users
  FOR ALL USING (get_my_role() = 'ADMIN')
  WITH CHECK (get_my_role() = 'ADMIN');

-- 5. Storage-Policies: nur eingeloggte User
DROP POLICY IF EXISTS "Alle hochladen equipment-photos" ON storage.objects;
DROP POLICY IF EXISTS "Alle aktualisieren equipment-photos" ON storage.objects;
DROP POLICY IF EXISTS "Alle loeschen equipment-photos" ON storage.objects;

CREATE POLICY "auth_upload_photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'equipment-photos' AND auth.role() = 'authenticated');

CREATE POLICY "auth_update_photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'equipment-photos' AND auth.role() = 'authenticated');

CREATE POLICY "auth_delete_photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'equipment-photos' AND auth.role() = 'authenticated');
