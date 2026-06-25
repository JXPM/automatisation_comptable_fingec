# 📡 Monitoring fingec

Couverture en 4 axes, sans usine à gaz, sur le VPS Hostinger (Docker) :

| Axe | Outil | Alerte e-mail |
|---|---|---|
| Disponibilité (uptime) + expiration TLS | **Uptime Kuma** | ✅ (SMTP, configuré dans Kuma) |
| Erreurs applicatives (back + front) | **Sentry** (SaaS gratuit) | ✅ (e-mail Sentry) |
| Tentatives d'intrusion (bruteforce, accès refusés) | **Sentry** (via `security_event`) | ✅ (e-mail Sentry) |
| Métriques serveur (CPU/RAM/disque/conteneurs) | **Netdata** | dashboard (option : Netdata Cloud) |
| Logs des conteneurs en direct | **Dozzle** | dashboard |

> Les dashboards (Kuma, Netdata, Dozzle) **ne sont pas exposés publiquement** : ports
> publiés sur `127.0.0.1` uniquement, accès par **tunnel SSH**. Aucun changement Caddy requis.

---

## 1. Sentry (erreurs + sécurité) — ~10 min

Le code est déjà instrumenté et **inerte tant qu'aucun DSN n'est fourni**.

1. Crée un compte sur <https://sentry.io> (free tier ; choisir la région **UE** pour le RGPD).
2. Crée **deux projets** :
   - un projet **Python / FastAPI** → copie son **DSN** → `SENTRY_DSN` (dans le `.env` du backend).
   - un projet **React** → copie son **DSN** → `VITE_SENTRY_DSN` (injecté au **build** du frontend).
3. Dans `.env` (à côté de `docker-compose.yml`) :
   ```
   SENTRY_DSN=https://...ingest.de.sentry.io/...
   VITE_SENTRY_DSN=https://...ingest.de.sentry.io/...
   SENTRY_ENV=production
   ```
4. Redéploie (le DSN frontend est injecté au build, donc rebuild de l'image frontend) :
   ```
   docker compose up -d --build backend frontend
   ```
5. Dans Sentry → **Alerts** : règle « une nouvelle erreur » → e-mail. Les événements de
   sécurité remontent comme messages `security:login_blocked` / `security:*` (taggés
   `security_event`) → tu peux créer une alerte dédiée dessus.

**Ce qui est déjà capturé** : exceptions non gérées (back + front), et les événements
sécurité `login_blocked`, `forgot_password_blocked` (pics de bruteforce). Les `login_failed`,
`proxy_path_denied`, `proxy_client_denied` sont journalisés (visibles dans Dozzle/Netdata)
sans spammer Sentry.

---

## 2. Stack de monitoring (Uptime Kuma + Netdata + Dozzle)

Sur le VPS, depuis le dossier du dépôt :

```
docker compose -f docker-compose.monitoring.yml up -d
```

Puis, depuis **ton poste**, ouvre un tunnel SSH :

```
ssh -L 3001:127.0.0.1:3001 -L 19999:127.0.0.1:19999 -L 8888:127.0.0.1:8888 <user>@srv1713887
```

- **Uptime Kuma** → <http://localhost:3001>
- **Netdata** → <http://localhost:19999>
- **Dozzle** → <http://localhost:8888>

### 2.1 Uptime Kuma — premier lancement
1. Crée le compte admin (au premier accès).
2. **Settings → Notifications → Add** → type **Email (SMTP)** :
   - Gmail Workspace : hôte `smtp.gmail.com`, port `587`, STARTTLS, identifiant =
     adresse Fingec, mot de passe = **mot de passe d'application** (pas le mot de passe
     du compte). Destinataire : l'adresse qui doit recevoir les alertes.
3. **Add New Monitor** :
   - Type **HTTP(s)**, URL `https://app.fingec.fr/health`, mot-clé attendu `ok`,
     intervalle 60 s, notification = celle créée ci-dessus.
   - Active **Certificate Expiry Notification** (alerte avant expiration du TLS).
   - (option) 2ᵉ moniteur sur `https://n8n.fingec.fr` et `https://app.fingec.fr/`.
4. (interne) Un moniteur `http://fingec-backend:8000/health` est possible : Kuma est sur
   le réseau `pharmaclick_web` et joint les conteneurs par leur nom.

### 2.2 Netdata
Dashboard prêt à l'emploi (CPU, RAM, disque, réseau, conteneurs Docker). Pour des
**alertes e-mail de saturation VPS**, deux options :
- rattacher le nœud à **Netdata Cloud** (gratuit) → alertes par e-mail clé en main ;
- ou configurer `health_alarm_notify.conf` (msmtp) dans le conteneur — plus manuel.
Par défaut on s'en sert comme tableau de bord « coup d'œil » ; l'uptime/erreurs sont
déjà couverts par Kuma + Sentry.

### 2.3 Dozzle
Visualiseur de logs en direct de tous les conteneurs (`fingec-backend`, `fingec-n8n`…).
Pratique pour suivre les lignes `security:*` émises par le backend.

---

## 3. Rappel — événements de sécurité émis par le backend
Lignes loggées (logger `fingec.security`, visibles dans Dozzle) :

| Événement | Quand | Remonté à Sentry |
|---|---|---|
| `login_failed` | mauvais e-mail/mot de passe | non (bruit) |
| `login_blocked` | blocage rate-limit (5 échecs / 15 min) | ✅ alerte |
| `forgot_password_blocked` | blocage rate-limit (5 / h) | ✅ alerte |
| `proxy_path_denied` | non-admin tente un webhook n8n interdit | non |
| `proxy_client_denied` | action sur un client non attribué | non |
