# Panacée CRM - Product Requirements Document

## Problem Statement
Application web responsive (mobile-first) CRM destinée à gérer les leads, inscriptions et performance commerciale d'une école professionnelle, avec logique centrée sur les marathons (campagnes).

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: JWT avec codes utilisateurs numériques

## User Personas
1. **Admin Principal** (Brown Lee Jean - 839271): Accès total, CRUD utilisateurs, création marathons, suppression directe
2. **Admins Secondaires** (Clerveaux Gabriel - 562814, Ermain Innocent - 947305): Accès complet sauf suppression
3. **Vendeurs** (Peterson - 1284, Maëva - 7391, Laguerre - 5602, Edjivenson - 8947): Ajout leads, dashboard personnel

## Core Requirements
- Toute donnée liée à une marathon (campagne)
- Login par code numérique
- Flux: Login → Sélection marathon → Dashboard
- CRUD leads avec statuts (Très intéressé / Inscrit)
- Promesses d'inscription (aujourd'hui / en retard)
- Dashboard vendeur et admin avec filtres
- Ranking basé sur inscrits
- Rapports avec graphiques
- Calcul jours restants (sans dimanches)

## What's Been Implemented (2026-04-17)
- ✅ Auth par code avec JWT
- ✅ Seed automatique des utilisateurs
- ✅ CRUD Marathons avec objectifs par vendeur
- ✅ CRUD Leads avec formation automatique
- ✅ Dashboard vendeur et admin avec filtres
- ✅ Promesses d'inscription (aujourd'hui/en retard)
- ✅ Ranking temps réel
- ✅ Rapports avec graphiques (BarChart, PieChart)
- ✅ Gestion utilisateurs (admin principal)
- ✅ Système de suppression (validation vendeur / direct admin)
- ✅ Calcul jours restants sans dimanches
- ✅ Alertes marathon fin proche
- ✅ Navigation responsive (sidebar desktop / bottom nav mobile)

## Prioritized Backlog
### P0 - Done
All core features implemented and tested

### P1 - Next
- Export rapports (CSV/PDF)
- Notifications push (promesses du jour)
- Filtrage avancé leads (date range)

### P2 - Future
- Commission module (non activé - futur)
- Statut "Participant" (non activé - futur)
- Historique modifications leads
- Mode hors-ligne (PWA)

## Next Tasks
1. Export des rapports en CSV/PDF
2. Notifications pour les promesses du jour
3. Recherche avancée multi-critères
