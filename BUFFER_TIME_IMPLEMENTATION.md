# Implémentation des Temps Tampons (Buffer Time)

## Vue d'ensemble

J'ai implémenté la fonctionnalité de **buffer time** (temps tampon) qui permet de gérer automatiquement les intervalles entre les rendez-vous, comme sur Fresha. Cette fonctionnalité empêche que les rendez-vous soient trop serrés et donne du temps pour la préparation, le nettoyage ou les pauses.

## ✅ Ce qui a été implémenté (Backend)

### 1. **Modèle de données** ([schema.prisma](backend_fresha/prisma/schema.prisma:84-106))

Trois nouveaux champs ont été ajoutés au modèle `Service` :

```prisma
model Service {
  // ... champs existants
  bufferBefore    Int  @default(0) // Temps bloqué AVANT le service (en minutes)
  bufferAfter     Int  @default(0) // Temps bloqué APRÈS le service (en minutes)
  processingTime  Int  @default(0) // Temps de traitement supplémentaire (en minutes)
}
```

**Explication :**
- **`bufferBefore`** : Temps bloqué avant le service (ex: 5 min pour la préparation)
- **`bufferAfter`** : Temps bloqué après le service (ex: 10 min pour le nettoyage)
- **`processingTime`** : Temps de service additionnel (ex: le service prend parfois plus de temps que prévu)

### 2. **Logique de calcul des créneaux** ([booking.service.ts](backend_fresha/src/services/booking.service.ts:845-874))

La fonction `getAvailableSlots` a été modifiée pour :

1. **Récupérer les temps tampons** du service
2. **Calculer la durée totale bloquée** :
   ```
   Durée totale = bufferBefore + duration + processingTime + bufferAfter
   ```
3. **Utiliser cette durée** pour détecter les conflits et bloquer les créneaux

**Exemple concret :**
- Service "Coupe simple" : 30 minutes
- bufferBefore : 5 minutes
- bufferAfter : 10 minutes
- processingTime : 5 minutes
- **Durée totale bloquée** : 50 minutes

Si un client réserve à 10h00 :
- Le créneau 10h00-10h50 est bloqué
- Le service réel commence à 10h05 (après bufferBefore)
- Le service se termine à 10h40 (10h05 + 30 + 5)
- Le créneau reste bloqué jusqu'à 10h50 (pour le nettoyage)
- Le prochain client peut réserver à partir de 10h50

### 3. **Interfaces TypeScript** ([service.service.ts](fresha_clone_sb/src/services/service.service.ts:4-19))

Les interfaces frontend ont été mises à jour :

```typescript
export interface Service {
  // ... champs existants
  bufferBefore?: number;
  bufferAfter?: number;
  processingTime?: number;
}
```

## 📋 Ce qu'il reste à faire (Frontend)

### Interface utilisateur pour configurer les temps tampons

Vous devez créer un formulaire ou une section dans l'interface de gestion des services pour permettre aux propriétaires de salons de configurer ces temps tampons.

#### Exemple d'implémentation recommandée :

```tsx
// Dans votre formulaire de création/édition de service

<div className="space-y-4">
  <h3 className="text-lg font-semibold">Temps tampons</h3>
  <p className="text-sm text-gray-600">
    Configurez les temps de préparation et de nettoyage pour éviter que les rendez-vous soient trop serrés
  </p>

  {/* Temps avant */}
  <div>
    <label className="block text-sm font-medium">
      Temps de préparation (avant le service)
    </label>
    <input
      type="number"
      min="0"
      step="5"
      value={formData.bufferBefore || 0}
      onChange={(e) => setFormData({
        ...formData,
        bufferBefore: parseInt(e.target.value)
      })}
      className="mt-1 block w-full rounded-md border-gray-300"
    />
    <p className="text-xs text-gray-500 mt-1">
      Temps bloqué avant le rendez-vous pour la préparation (en minutes)
    </p>
  </div>

  {/* Temps de traitement supplémentaire */}
  <div>
    <label className="block text-sm font-medium">
      Temps de traitement supplémentaire
    </label>
    <input
      type="number"
      min="0"
      step="5"
      value={formData.processingTime || 0}
      onChange={(e) => setFormData({
        ...formData,
        processingTime: parseInt(e.target.value)
      })}
      className="mt-1 block w-full rounded-md border-gray-300"
    />
    <p className="text-xs text-gray-500 mt-1">
      Temps supplémentaire estimé pour réaliser le service (en minutes)
    </p>
  </div>

  {/* Temps après */}
  <div>
    <label className="block text-sm font-medium">
      Temps de nettoyage (après le service)
    </label>
    <input
      type="number"
      min="0"
      step="5"
      value={formData.bufferAfter || 0}
      onChange={(e) => setFormData({
        ...formData,
        bufferAfter: parseInt(e.target.value)
      })}
      className="mt-1 block w-full rounded-md border-gray-300"
    />
    <p className="text-xs text-gray-500 mt-1">
      Temps bloqué après le rendez-vous pour le nettoyage (en minutes)
    </p>
  </div>

  {/* Résumé visuel */}
  <div className="bg-blue-50 p-4 rounded-lg">
    <p className="text-sm font-medium">Durée totale bloquée</p>
    <p className="text-2xl font-bold text-blue-600">
      {(formData.bufferBefore || 0) +
       (formData.duration || 0) +
       (formData.processingTime || 0) +
       (formData.bufferAfter || 0)} minutes
    </p>
    <p className="text-xs text-gray-600 mt-2">
      = {formData.bufferBefore || 0} min (préparation) +
      {formData.duration || 0} min (service) +
      {formData.processingTime || 0} min (traitement) +
      {formData.bufferAfter || 0} min (nettoyage)
    </p>
  </div>
</div>
```

## 🎯 Cas d'usage

### Exemple 1 : Coupe de cheveux standard
- Durée : 30 min
- bufferBefore : 5 min (préparer la chaise, les outils)
- bufferAfter : 10 min (nettoyer la zone, balayer les cheveux)
- processingTime : 0 min
- **Total bloqué : 45 min**

### Exemple 2 : Coloration complexe
- Durée : 90 min
- bufferBefore : 10 min (préparer les produits)
- bufferAfter : 15 min (nettoyage approfondi)
- processingTime : 15 min (le service peut déborder)
- **Total bloqué : 130 min**

### Exemple 3 : Service express
- Durée : 15 min
- bufferBefore : 0 min
- bufferAfter : 5 min (nettoyage rapide)
- processingTime : 0 min
- **Total bloqué : 20 min**

## 🔍 Comment tester

1. **Créer un service avec des temps tampons** via l'interface admin
   - Ex : "Coupe simple", 30 min, bufferBefore=5, bufferAfter=10

2. **Faire une réservation** pour ce service
   - Le système bloque 45 minutes au total

3. **Essayer de réserver juste après**
   - Le prochain créneau disponible devrait être 45 min après le début de la 1ère réservation

4. **Vérifier dans le calendrier**
   - La réservation doit bloquer le temps complet (avec les buffers)

## 📝 Notes importantes

- Les temps tampons sont **optionnels** (par défaut à 0)
- Ils sont pris en compte **automatiquement** lors du calcul des créneaux disponibles
- Le client voit l'heure de début du service réel (après bufferBefore)
- Le calendrier bloque le temps complet (avec les buffers)
- Compatible avec les réservations multi-services

## 🚀 Prochaines étapes

1. ✅ Backend implémenté
2. ✅ Migration de base de données effectuée
3. ✅ Logique de calcul des créneaux mise à jour
4. ⏳ Interface utilisateur à créer (voir exemple ci-dessus)
5. ⏳ Tests à effectuer

## 📚 Référence Fresha

Comme sur Fresha, vous pouvez maintenant :
- Ajouter du temps avant un service (preparation)
- Ajouter du temps après un service (blocked time)
- Ajouter du temps de traitement supplémentaire (processing time)
- Empêcher les rendez-vous trop serrés automatiquement
