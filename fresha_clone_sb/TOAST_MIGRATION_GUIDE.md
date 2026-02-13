# Guide de Migration vers React-Hot-Toast

React-hot-toast est maintenant configuré dans l'application. Ce guide explique comment migrer les alertes manuelles.

## Configuration

- **Toaster** : Configuré dans `src/App.tsx`
- **Position** : top-right
- **Durée** : 4s (erreurs), 3s (succès)
- **Thème** : Fond sombre avec icônes colorées

## Pattern Actuel (À Remplacer)

### Avant

```typescript
import { useState } from 'react'

const [showSuccessAlert, setShowSuccessAlert] = useState(false)
const [showErrorAlert, setShowErrorAlert] = useState(false)
const [alertMessage, setAlertMessage] = useState("")

// Dans le handler
try {
  await someApiCall()
  setAlertMessage('Opération réussie !')
  setShowSuccessAlert(true)
  setTimeout(() => setShowSuccessAlert(false), 3000)
} catch (error) {
  setAlertMessage(error.message)
  setShowErrorAlert(true)
  setTimeout(() => setShowErrorAlert(false), 5000)
}

// Dans le JSX
{showSuccessAlert && (
  <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
    {alertMessage}
  </div>
)}

{showErrorAlert && (
  <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
    {alertMessage}
  </div>
)}
```

### Après

```typescript
import toast from 'react-hot-toast'

// Dans le handler
try {
  await someApiCall()
  toast.success('Opération réussie !')
} catch (error) {
  toast.error(error.message)
}

// Plus besoin de JSX pour les alertes !
```

## API de React-Hot-Toast

### Notifications de base

```typescript
import toast from 'react-hot-toast'

// Succès
toast.success('Salon créé avec succès !')

// Erreur
toast.error('Impossible de créer le salon')

// Info
toast('Information importante')

// Warning (custom)
toast('Attention !', { icon: '⚠️' })

// Chargement
const toastId = toast.loading('Création en cours...')
// Plus tard...
toast.success('Salon créé !', { id: toastId }) // Remplace le toast de chargement
```

### Notifications avec Promise

```typescript
toast.promise(
  saveData(),
  {
    loading: 'Sauvegarde en cours...',
    success: 'Données sauvegardées !',
    error: 'Erreur lors de la sauvegarde',
  }
)
```

### Notifications personnalisées

```typescript
toast.success('Opération réussie', {
  duration: 5000,
  position: 'bottom-center',
  style: {
    background: '#10b981',
    color: '#fff',
  },
  icon: '👏',
})
```

### Fermeture manuelle

```typescript
const toastId = toast.success('Message persistant')
// Plus tard...
toast.dismiss(toastId)
// Ou tout fermer
toast.dismiss()
```

## Fichiers à Migrer

Les fichiers suivants utilisent le pattern manuel et doivent être migrés :

### Pages CRUD (7 fichiers)

1. **src/pages/salon/crudSalon.tsx**
   - 2 instances de showSuccessAlert
   - 2 instances de showErrorAlert

2. **src/pages/staff/crudStaff.tsx**
   - 2 instances de showSuccessAlert
   - 2 instances de showErrorAlert

3. **src/pages/clients/crudClients.tsx**
   - 2 instances de showSuccessAlert
   - 2 instances de showErrorAlert

4. **src/pages/Services/crudService.tsx**
   - 2 instances de showSuccessAlert
   - 2 instances de showErrorAlert

5. **src/components/salon/ScheduleManagement.tsx**
   - Multiples alertes de succès/erreur

6. **src/components/salon/ClosedDayManagement.tsx**
   - Multiples alertes de succès/erreur

7. **src/pages/absences/OwnerAbsenceManagement.tsx**
   - Multiples alertes de succès/erreur

### Composants Formulaire

- **src/components/auth/SignInForm.tsx**
  - Alertes d'erreur de connexion

## Exemple de Migration Complète

### crudSalon.tsx - Avant

```typescript
const [showSuccessAlert, setShowSuccessAlert] = useState(false)
const [showErrorAlert, setShowErrorAlert] = useState(false)
const [alertMessage, setAlertMessage] = useState("")

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const response = await createSalon(formData)
    setAlertMessage('Salon créé avec succès !')
    setShowSuccessAlert(true)
    setTimeout(() => {
      setShowSuccessAlert(false)
      resetForm()
    }, 3000)
  } catch (error) {
    setAlertMessage(error.message || 'Erreur lors de la création')
    setShowErrorAlert(true)
    setTimeout(() => setShowErrorAlert(false), 5000)
  } finally {
    setLoading(false)
  }
}
```

### crudSalon.tsx - Après

```typescript
import toast from 'react-hot-toast'

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const response = await createSalon(formData)
    toast.success('Salon créé avec succès !')
    resetForm()
  } catch (error) {
    toast.error(error.message || 'Erreur lors de la création')
  } finally {
    setLoading(false)
  }
}

// Supprimer ces lignes :
// - const [showSuccessAlert, setShowSuccessAlert] = useState(false)
// - const [showErrorAlert, setShowErrorAlert] = useState(false)
// - const [alertMessage, setAlertMessage] = useState("")
// - Tous les JSX d'alertes conditionnelles
```

## Avantages de React-Hot-Toast

✅ **-90% de code** : Plus besoin de state pour les alertes
✅ **Stack automatique** : Plusieurs toasts s'empilent automatiquement
✅ **Animations fluides** : Animations intégrées
✅ **Accessible** : Support ARIA intégré
✅ **Responsive** : Adapté mobile
✅ **Queue intelligente** : Gestion automatique des toasts multiples
✅ **Customisable** : Styles et icônes personnalisables
✅ **Promise support** : toast.promise() pour les opérations async

## Checklist de Migration

- [ ] Supprimer useState pour showSuccessAlert
- [ ] Supprimer useState pour showErrorAlert
- [ ] Supprimer useState pour alertMessage
- [ ] Importer `import toast from 'react-hot-toast'`
- [ ] Remplacer setAlertMessage + setShowSuccessAlert par toast.success()
- [ ] Remplacer setAlertMessage + setShowErrorAlert par toast.error()
- [ ] Supprimer tous les setTimeout pour fermer les alertes
- [ ] Supprimer le JSX des alertes conditionnelles
- [ ] Tester les notifications

## Ressources

- [Documentation React-Hot-Toast](https://react-hot-toast.com/)
- [Exemples d'utilisation](https://react-hot-toast.com/docs)
