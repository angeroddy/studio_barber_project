# 🚀 Démarrage Rapide - Déploiement en 30 minutes

Guide ultra-rapide pour déployer votre application Fresha Clone et la partager avec vos clients.

---

## 📋 Prérequis (5 minutes)

1. ✅ Compte GitHub: [github.com/signup](https://github.com/signup)
2. ✅ Compte Render: [render.com](https://render.com) (Sign up avec GitHub)
3. ✅ Compte Vercel: [vercel.com](https://vercel.com) (Sign up avec GitHub)

---

## 🔥 Déploiement Express

### ÉTAPE 1: Pusher sur GitHub (5 min)

```bash
# Dans le dossier du projet
git add .
git commit -m "Ready for deployment"
git push origin main

# Si pas encore de remote GitHub:
# 1. Créer un nouveau repo sur github.com
# 2. git remote add origin https://github.com/VOTRE_USERNAME/fresha-clone.git
# 3. git push -u origin main
```

---

### ÉTAPE 2: Déployer le Backend - Render (10 min)

1. **Aller sur Render.com** → Dashboard → "New +" → "Web Service"

2. **Connecter le repo GitHub** → Sélectionner `Fresha-Clone-Project`

3. **Configuration:**
   - Name: `fresha-backend`
   - Root Directory: `backend_fresha`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
   - Plan: **Free**

4. **Variables d'environnement** (cliquer "Advanced"):

```
DATABASE_URL = postgresql://neondb_owner:npg_xP8cICgFeyH9@ep-rapid-mountain-abzgzzcw-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET = votre_secret_super_long_123456789
JWT_EXPIRES_IN = 7d
REFRESH_TOKEN_SECRET = autre_secret_different_987654321
NODE_ENV = production
PORT = 5000
```

5. **Créer** → Attendre 5 min → **Noter l'URL** (ex: `https://fresha-backend.onrender.com`)

---

### ÉTAPE 3: Déployer le Frontend - Vercel (10 min)

1. **Aller sur Vercel.com** → "Add New..." → "Project"

2. **Importer** votre repo GitHub

3. **Configuration:**
   - Framework: Next.js ✅ (auto-détecté)
   - Root Directory: `front_client/front_client_sb`
   - Build Command: `npm run build` (auto)
   - Output Directory: `.next` (auto)

4. **Variables d'environnement:**

```
NEXT_PUBLIC_API_URL = https://VOTRE_BACKEND.onrender.com/api
NEXT_PUBLIC_API_BASE_URL = https://VOTRE_BACKEND.onrender.com
```

**⚠️ IMPORTANT:** Remplacer `VOTRE_BACKEND.onrender.com` par votre vraie URL Render !

5. **Deploy** → Attendre 3 min → **Copier l'URL Vercel**

---

### ÉTAPE 4: Configurer CORS (5 min)

**Dans `backend_fresha/src/app.ts`**, ajouter votre URL Vercel:

```typescript
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://VOTRE_APP.vercel.app'  // ← Ajouter cette ligne
    ],
    credentials: true,
  })
);
```

**Puis redéployer:**

```bash
git add backend_fresha/src/app.ts
git commit -m "Add Vercel to CORS"
git push origin main
```

Render va automatiquement redéployer le backend (2-3 min).

---

## ✅ Vérification

### Tester le backend:
```
https://VOTRE_BACKEND.onrender.com/health
```
**Réponse attendue:** `{"status":"OK","message":"Backend is running"}`

### Tester le frontend:
```
https://VOTRE_APP.vercel.app
```
**Résultat attendu:** Page d'accueil s'affiche correctement

---

## 🎉 Partager avec vos clients

**Envoyer simplement ce message:**

> Bonjour,
>
> Voici le lien pour tester l'application Fresha Clone:
>
> 🔗 **https://VOTRE_APP.vercel.app**
>
> N'hésitez pas à me faire vos retours !

---

## ⚠️ Points importants

- **Premier chargement lent?** Normal sur Render gratuit (service en veille). Attendre 30-60 sec.
- **Erreur CORS?** Vérifier que vous avez bien ajouté l'URL Vercel dans `app.ts`
- **Variables d'environnement?** Elles sont différentes entre dev et prod!

---

## 🔧 Mises à jour

Après chaque modification du code:

```bash
git add .
git commit -m "Description de la modif"
git push origin main
```

**Render et Vercel redéploieront automatiquement!** 🚀

---

## 📚 Documentation complète

Pour plus de détails, consulter: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Temps total estimé:** 30 minutes
**Coût:** 0€ (plans gratuits)
**Difficultés:** Aucune, tout est automatisé ! 😎
