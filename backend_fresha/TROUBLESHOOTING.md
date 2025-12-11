# Guide de dépannage - Authentification

## Problème: La connexion échoue avec un utilisateur créé manuellement

### Cause
Quand vous créez un utilisateur manuellement dans Neon, le mot de passe doit être **hashé avec bcrypt**. Si vous avez mis un mot de passe en clair (ex: "password123"), la connexion échouera car le backend compare le mot de passe hashé.

### Solution

#### Étape 1: Générer un mot de passe hashé

Dans le terminal, exécutez:

```bash
cd backend_fresha
npm run hash-password VotreMotDePasse
```

Par exemple, pour hasher le mot de passe "admin123":
```bash
npm run hash-password admin123
```

Vous verrez quelque chose comme:
```
===========================================
Mot de passe original: admin123
Mot de passe hashé: $2b$10$xyz123abc456...
===========================================
```

#### Étape 2: Mettre à jour la base de données

1. Allez sur [Neon Console](https://console.neon.tech)
2. Sélectionnez votre projet
3. Allez dans "SQL Editor"
4. Exécutez cette requête:

```sql
UPDATE "User"
SET password = '$2b$10$xyz123abc456...'  -- Remplacez par le hash généré
WHERE email = 'votre.email@example.com';
```

#### Étape 3: Tester la connexion

1. Démarrez le backend:
```bash
npm run dev
```

2. Démarrez le frontend:
```bash
cd ../fresha_clone_sb
npm run dev
```

3. Ouvrez http://localhost:5173 et essayez de vous connecter avec:
   - Email: votre.email@example.com
   - Mot de passe: VotreMotDePasse (celui que vous avez hashé)

## Autres vérifications

### 1. Vérifier que le backend tourne

Ouvrez http://localhost:3000/health dans votre navigateur.
Vous devriez voir:
```json
{
  "status": "OK",
  "message": "Backend is running"
}
```

### 2. Vérifier les CORS

L'URL du frontend doit être http://localhost:5173 (définie dans `src/app.ts`)

### 3. Vérifier les logs d'erreur

- **Backend**: Regardez dans le terminal où tourne `npm run dev`
- **Frontend**: Ouvrez la Console du navigateur (F12 > Console)

### 4. Exemple de requête manuelle

Testez l'API directement avec curl:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre.email@example.com",
    "password": "VotreMotDePasse"
  }'
```

Vous devriez recevoir:
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Messages d'erreur courants

### "Email ou mot de passe incorrect"
- Le mot de passe n'est pas correctement hashé dans la BD
- L'email n'existe pas dans la BD
- Le mot de passe saisi est incorrect

### "Network Error"
- Le backend n'est pas démarré
- Le backend tourne sur un autre port que 3000

### "CORS Error"
- Vérifiez que l'URL dans `backend_fresha/src/app.ts` correspond à celle du frontend
