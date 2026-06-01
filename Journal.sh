# Créer un nouveau dépôt GitHub 
git init
git branch -M main
git add .
git commit -m "first commit"
gh repo create automatisation_comptable_fingec --public
git remote add origin https://github.com/JXPM/automatisation_comptable_fingec.git
git push --set-upstream origin main

#fichier Maj et push
git status
git add .
git commit -m "maj de readme"
git push origin main










● Bash(python3 -c "import sys; sys.path.insert(0, 'backend'); import main; print('OK', main.UPLOAD_DIR,
      main.ALLOWED_ORIGINS)")                            
  ⎿  OK /home/johan/automatisation_comptable_fingec/tmp_upload ['http://localhost:5173']
                                  
● Now the Render Blueprint at the repo root :                                                                          
                                                         
● Write(render.yaml)                                                                                                   
  ⎿  Wrote 23 lines to render.yaml                                               
       1 # Render Blueprint — https://render.com/docs/blueprint-spec                                                   
       2 # Déployer : Render Dashboard → New + → Blueprint → sélectionner ce repo.                                     
       3 #                                                                                                             
       4 # Le free tier dort après 15 min d'inactivité (premier appel ~30s).                                           
       5 # Les disques persistants ne sont dispos qu'à partir du plan Standard ;                                       
       6 # en free tier, logs.json/output/ disparaissent au redémarrage du service.
       7                                                                                                               
       8 services:                                                               
       9   - type: web
      10     name: fingec-api            
     … +13 lines (ctrl+o to expand)

● Bash(python3 -m pytest backend/tests/ -q 2>&1 | tail -5)
  ⎿  .......................................                                  [100%]
     39 passed in 1.05s                            
                                                    
● Bash(cd frontend && npx tsc --noEmit 2>&1 | tail -5)                                                                 
  ⎿  (No output)                                         
                                                                                                                       
● Tout est OK : 39/39 tests, tsc propre, build vérifié.                                                                
                                                                                                                       
  Fichiers ajoutés / modifiés pour Render                                                                              
                                                                                                                       
  ┌─────────────────┬───────────────────────────────────────────────────────────────────────────────────────────────┐  
  │     Fichier     │                                             Rôle                                              │
  ├─────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤  
  │ render.yaml     │ Blueprint : web service Python (free tier), build pip install, start uvicorn, healthcheck sur │
  │                 │  /logs                                                                                        │
  ├─────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤  
  │ backend/main.py │ Variables d'env BACKEND_DATA_DIR et FRONTEND_ORIGINS (CORS comma-separated). Fallback :       │
  │                 │ comportement local inchangé                                                                   │  
  └─────────────────┴───────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                                                       
  Étapes de déploiement (ordre exact)                                            
                
  1. Push sur GitHub                                                                                                   
  git add .github render.yaml backend/main.py frontend/
  git commit -m "ci: github actions + render blueprint + vercel SPA config"                                            
  git push                                                                       
  Vérifier que le workflow CI passe vert dans l'onglet Actions.                                                        
                                         
  2. Déploiement Render (backend)                                                                                      
  - Render Dashboard → New + → Blueprint → connecter le repo → Render lit render.yaml automatiquement.
  - À la fin, tu obtiens une URL publique du genre https://fingec-api.onrender.com.                                    
  - Note : free tier dort après 15 min ; le 1er appel après dodo prend ~30 s.      
                                                                                                                       
  3. Déploiement Vercel (frontend)                                                                                     
  - Vercel → Add New Project → repo GitHub → Root Directory: frontend.                                                 
  - Settings → Environment Variables : ajouter                                                                         
    - VITE_API_URL = https://fingec-api.onrender.com (sans slash final, l'URL exacte de l'étape 2)                     
  - Deploy. Tu auras https://<projet>.vercel.app.                                                                      
                                                                                                                       
  4. Refermer le CORS (retour sur Render)                                                                              
  - Render → service fingec-api → Environment → ajouter                                                                
    - FRONTEND_ORIGINS = http://localhost:5173,https://<projet>.vercel.app                                             
  - Save → Render redéploie.                                                                                           
                                                                                                                       
  À savoir (limitations free tier)                                                                                     
                                                                                                                       
  - logs.json, tmp_upload/, output/ disparaissent à chaque redémarrage Render (pas de disque persistant en free). Pour 
  persister il faudra passer en plan Standard ($7/mo) avec un Disk monté sur /var/data, et changer
  BACKEND_DATA_DIR=/var/data.                                                                                          
  - L'endpoint DELETE /logs est limité à localhost (volontaire) → renvoie 403 depuis le front en prod, c'est attendu.
                                                                                                                       
  Quand tu auras les URLs réelles (Render + Vercel), dis-moi et je peux ouvrir une PR pour figer FRONTEND_ORIGINS dans 
  render.yaml directement plutôt que de devoir le set à la main dans le dashboard.                                     
                                                                                  