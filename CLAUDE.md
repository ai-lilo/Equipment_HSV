# Equipment HSV – Inventarverwaltung Hundesportverein Pegnitz

## Projektziel

Web-App zur Verwaltung von Vereins-Equipment im **Hundesportverein Pegnitz**.
Mitglieder sollen schnell finden können, wo sich Equipment befindet.
Die Lagerstruktur wird dauerhaft gepflegt und ist für alle einsehbar.

---

## Technischer Stack

| | |
|---|---|
| **Framework** | Vite + React + TypeScript |
| **UI** | TailwindCSS |
| **Datenbank** | Supabase (PostgreSQL, cloud-hosted) |
| **Deployment** | GitHub Pages (statisches Frontend) |
| **Backend-Logik** | Supabase Client-SDK (direkt aus dem Browser) |

**Warum kein Next.js / SQLite:**
GitHub Pages hostet ausschließlich statische Dateien — kein Node.js-Server, keine API Routes.
Vite + React erzeugt ein reines Static Build (`dist/`), das direkt auf GitHub Pages läuft.
Supabase übernimmt Datenbank, Auth und Row-Level-Security vollständig als Cloud-Service.

---

## Authentifizierung

- **Kein Passwort** — Benutzername reicht aus (Daten nicht vertraulich, Benutzerkreis bekannt)
- Admin legt Benutzer manuell in Supabase an und teilt den Benutzernamen mit
- Login: Benutzername eingeben → Supabase prüft ob Benutzer existiert → Session via localStorage
- Rollen werden über Supabase Row-Level-Security (RLS) serverseitig durchgesetzt
- Es gibt genau **einen Admin**: Sabine (neupert.sabine@outlook.com)

---

## Benutzerrollen

| Rolle | Rechte |
|---|---|
| **Besucher** | Suchen und Ansehen |
| **Mitglied** | + Equipment hinzufügen, bearbeiten, Lagerort ändern |
| **Admin** | + Räume/Schränke erstellen/ändern/löschen, Equipment löschen, Benutzer verwalten |

---

## Vereinskontext

- **Verein**: Hundesportverein Pegnitz
- **Standort**: Ein Standort (Pegnitz)
- **Sportarten** (auswählbar, optional):
  - Rallye Obedience
  - Obedience
  - THS
  - Hoopers
  - Treibball
  - allg. Turnierzubehör

---

## Lagerstruktur

```
Raum
└── Schrank (optional)
    └── Equipment
```

- Räume und Schränke werden von Admin verwaltet
- Equipment ohne Schrank erscheint direkt unter dem Raum
- Baumstruktur ist einklappbar

Beispiele:
- Halle → Schrank A → Hürden Set
- Vereinsheim → Materialschrank → Pylonen
- Garage → (kein Schrank) → Treibball

---

## Datenmodell

### User
- id, username (unique), role (VISITOR | MEMBER | ADMIN), createdAt, pushSubscription (JSON, nullable)

### Room
- id, name, createdAt, updatedAt

### Cabinet
- id, name, roomId (FK), createdAt, updatedAt

### Equipment
- id, name, count, roomId (FK), cabinetId (FK, nullable)
- sport (nullable), description (nullable)
- status (OK | DEFECT | IN_REPAIR)
- defectNote (nullable)
- updatedAt (automatisch bei jedem Speichern)

### ChangeLog
- id, equipmentId (FK), userId (FK), field, oldValue, newValue, changedAt

### Sport (Enum oder Tabelle)
- Rallye Obedience, Obedience, THS, Hoopers, Treibball, allg. Turnierzubehör

---

## Funktionen

### Equipment-Verwaltung
- Pflichtfelder: Name, Anzahl, Raum
- Optionale Felder: Schrank, Sportart, Beschreibung
- `updatedAt` wird bei jedem Speichern automatisch gesetzt
- Farbliche Kennzeichnung bei unvollständigem Lagerort

### Defekt / In Reparatur
- Equipment kann als `DEFECT` oder `IN_REPAIR` markiert werden
- Bei Defekt-Meldung: **Push-Nachricht an Admin**
- Wenn Status wieder auf `OK` gesetzt wird: **Push-Nachricht an alle Mitglieder**

### Änderungshistorie
- Jede Änderung (Feld, alter Wert, neuer Wert, Benutzer, Zeitstempel) wird protokolliert
- Für Admin einsehbar

### Suche
- Unscharfe Suche (fuzzy) über: Equipment-Name, Raum, Schrank, Sportart
- Suchleiste immer sichtbar

### Filter
- Nach Sportart
- Nach Raum

### QR-Code
- Pro Raum und pro Schrank gibt es einen druckbaren QR-Code
- QR-Code öffnet die App gefiltert auf genau diesen Ort

### PDF-Export
- Komplette Inventarliste als PDF exportierbar (zum Ausdrucken)

---

## UI / UX

- **Dunkel-/Hellmodus** (Toggle)
- Responsive / mobilfreundlich
- Große Buttons, übersichtliche Formulare
- Einfache Bedienung für technisch unerfahrene Nutzer
- Baumstruktur einklappbar
- Leere Räume optional ausblendbar
- Klare Icons (z.B. lucide-react)
- Saubere Fehlermeldungen

## Bestätigungsdialoge (Pflicht)
- Equipment löschen
- Raum löschen
- Schrank löschen
- Lagerort ändern

---

## Deployment (GitHub Pages)

1. `vite build` erzeugt `dist/` (statische Dateien)
2. GitHub Actions deployt `dist/` automatisch auf GitHub Pages bei jedem Push auf `main`
3. Supabase-Zugangsdaten kommen aus GitHub Secrets (als `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`)
4. Push-Nachrichten laufen über einen Supabase Edge Function (serverless, kein eigener Server nötig)

---

## Projektstruktur (Ziel)

```
Equipment_HSV/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx         # Hauptübersicht (Baumstruktur)
│   │   ├── Equipment.tsx
│   │   ├── Rooms.tsx
│   │   └── Admin.tsx
│   ├── components/
│   │   ├── tree/                 # Baumstruktur-Komponenten
│   │   ├── equipment/            # Equipment-Formulare, Karten
│   │   ├── ui/                   # Buttons, Dialoge, Badges
│   │   └── layout/               # Navigation, Header
│   ├── lib/
│   │   ├── supabase.ts           # Supabase-Client
│   │   ├── auth.ts               # Login-Logik
│   │   └── push.ts               # Push-Benachrichtigungen
│   ├── hooks/                    # Custom React Hooks
│   ├── types/                    # TypeScript-Typen
│   └── main.tsx
├── public/
│   └── sw.js                     # Service Worker (Push)
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions: build + deploy
├── CLAUDE.md
└── README.md
```

---

## Konventionen

- Alle UI-Texte auf **Deutsch**
- Fachbegriffe aus dem Hundesport werden ohne Erklärung verwendet
- Keine unnötigen Kommentare im Code
- Alle Datenbankzugriffe über Supabase Client-SDK (kein direktes SQL im Frontend)
- Rollen werden über Supabase RLS serverseitig durchgesetzt (nie nur client-seitig)
- Umgebungsvariablen: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (nie im Code hardcoden)

---

## Zukünftige Erweiterungen (nicht im MVP)

- Equipment-Reservierung für Trainingstage
- Mehrsprachigkeit
