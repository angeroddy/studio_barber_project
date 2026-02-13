# Guide d'Utilisation des Hooks Réutilisables

## useCrud - Hook CRUD Générique

Hook réutilisable pour gérer les opérations CRUD (Create, Read, Update, Delete) avec gestion d'état intégrée.

### Utilisation Basique

```typescript
import { useCrud } from '@/hooks/useCrud'
import { salonService } from '@/services/salon.service'

interface Salon {
  id: string
  name: string
  address: string
  // ...
}

function SalonManagement() {
  const {
    items: salons,
    currentItem: currentSalon,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
  } = useCrud<Salon>({
    fetchAll: () => salonService.getMySalons(),
    create: (data) => salonService.createSalon(data),
    update: (id, data) => salonService.updateSalon(id, data),
    delete: (id) => salonService.deleteSalon(id),
    resourceName: 'salon', // Pour les messages toast personnalisés
  })

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleCreate = async (data: CreateSalonData) => {
    const newSalon = await create(data)
    if (newSalon) {
      // Succès - toast automatique affiché
      closeModal()
    }
  }

  return (
    <div>
      {loading && <Spinner />}
      {salons.map(salon => (
        <SalonCard
          key={salon.id}
          salon={salon}
          onEdit={(data) => update(salon.id, data)}
          onDelete={() => remove(salon.id)}
        />
      ))}
    </div>
  )
}
```

### API complète

```typescript
const {
  // State
  items,              // T[] - Liste des items
  currentItem,        // T | null - Item actuellement sélectionné
  loading,            // boolean - État de chargement
  error,              // string | null - Message d'erreur

  // Actions
  fetchAll,           // () => Promise<void> - Charger tous les items
  fetchById,          // (id: string) => Promise<void> - Charger un item par ID
  create,             // (data) => Promise<T | null> - Créer un item
  update,             // (id, data) => Promise<T | null> - Modifier un item
  remove,             // (id) => Promise<boolean> - Supprimer un item
  setCurrentItem,     // (item) => void - Définir l'item actuel
  clearError,         // () => void - Effacer l'erreur
} = useCrud<T>({ /* config */ })
```

### Fonctionnalités

✅ Gestion automatique du loading
✅ Gestion automatique des erreurs
✅ Toast notifications automatiques
✅ État local synchronisé
✅ Optimistic updates
✅ Messages personnalisables via resourceName
✅ TypeScript support complet

---

## useForm - Hook de Gestion de Formulaire

Hook réutilisable pour gérer les formulaires avec validation, état dirty, et soumission.

### Utilisation Basique

```typescript
import { useForm } from '@/hooks/useForm'

interface SalonFormData {
  name: string
  address: string
  email: string
  phone: string
}

function SalonForm() {
  const form = useForm<SalonFormData>({
    initialValues: {
      name: '',
      address: '',
      email: '',
      phone: '',
    },
    onSubmit: async (values) => {
      await salonService.createSalon(values)
      toast.success('Salon créé !')
    },
    validate: (values) => {
      const errors: any = {}
      if (!values.name) errors.name = 'Le nom est requis'
      if (!values.email) errors.email = 'L\'email est requis'
      else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.email = 'Email invalide'
      }
      return errors
    },
    resetAfterSubmit: true, // Reset le formulaire après soumission réussie
  })

  return (
    <form onSubmit={form.handleSubmit}>
      <div>
        <input
          {...form.getFieldProps('name')}
          type="text"
          placeholder="Nom du salon"
        />
        {form.touched.name && form.errors.name && (
          <span className="error">{form.errors.name}</span>
        )}
      </div>

      <div>
        <input
          {...form.getFieldProps('email')}
          type="email"
          placeholder="Email"
        />
        {form.touched.email && form.errors.email && (
          <span className="error">{form.errors.email}</span>
        )}
      </div>

      <button type="submit" disabled={form.isSubmitting || !form.isValid}>
        {form.isSubmitting ? 'Envoi...' : 'Créer'}
      </button>
    </form>
  )
}
```

### API complète

```typescript
const {
  // State
  values,             // T - Valeurs actuelles du formulaire
  errors,             // Partial<Record<keyof T, string>> - Erreurs de validation
  touched,            // Partial<Record<keyof T, boolean>> - Champs touchés
  isSubmitting,       // boolean - Formulaire en cours de soumission
  isDirty,            // boolean - Formulaire modifié

  // Handlers
  handleChange,       // Gérer le changement d'input
  handleBlur,         // Gérer le blur d'input
  handleSubmit,       // Gérer la soumission du formulaire
  setFieldValue,      // Définir une valeur programmatiquement
  setFieldError,      // Définir une erreur programmatiquement
  setFieldTouched,    // Marquer un champ comme touché
  setValues,          // Remplacer toutes les valeurs
  resetForm,          // Réinitialiser le formulaire

  // Utilities
  getFieldProps,      // Obtenir les props d'un champ (spread dans input)
  isValid,            // boolean - Formulaire valide (pas d'erreurs)
} = useForm<T>({ /* config */ })
```

### Utilisation avec getFieldProps (Recommandé)

```typescript
<input {...form.getFieldProps('name')} type="text" />
// Équivalent à :
<input
  name="name"
  value={form.values.name}
  onChange={form.handleChange}
  onBlur={form.handleBlur}
  type="text"
/>
```

### Validation

La fonction `validate` reçoit les valeurs actuelles et retourne un objet d'erreurs :

```typescript
validate: (values) => {
  const errors: Partial<Record<keyof T, string>> = {}

  // Validation du nom
  if (!values.name) {
    errors.name = 'Nom requis'
  } else if (values.name.length < 3) {
    errors.name = 'Le nom doit contenir au moins 3 caractères'
  }

  // Validation de l'email
  if (!values.email) {
    errors.email = 'Email requis'
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
    errors.email = 'Email invalide'
  }

  // Validation du téléphone
  if (values.phone && !/^\d{10}$/.test(values.phone)) {
    errors.phone = 'Le téléphone doit contenir 10 chiffres'
  }

  return errors
}
```

### Modification de Valeurs Programmatiquement

```typescript
// Définir une seule valeur
form.setFieldValue('name', 'Nouveau nom')

// Remplacer toutes les valeurs (édition)
form.setValues({
  name: salon.name,
  address: salon.address,
  email: salon.email,
  phone: salon.phone,
})

// Définir une erreur manuellement
form.setFieldError('email', 'Cet email est déjà utilisé')
```

### Fonctionnalités

✅ Gestion automatique de l'état du formulaire
✅ Validation synchrone avec feedback
✅ Support des champs touched (afficher erreurs après blur)
✅ État dirty (détecter les modifications)
✅ Support des checkboxes et inputs number
✅ Réinitialisation après soumission (optionnelle)
✅ TypeScript support complet
✅ Helper getFieldProps pour réduire le boilerplate

---

## Combinaison useCrud + useForm

Exemple complet de CRUD avec formulaire :

```typescript
function SalonManagement() {
  const crud = useCrud<Salon>({
    fetchAll: () => salonService.getMySalons(),
    create: (data) => salonService.createSalon(data),
    update: (id, data) => salonService.updateSalon(id, data),
    delete: (id) => salonService.deleteSalon(id),
    resourceName: 'salon',
  })

  const form = useForm<SalonFormData>({
    initialValues: {
      name: '',
      address: '',
      email: '',
      phone: '',
    },
    onSubmit: async (values) => {
      if (isEditing && crud.currentItem) {
        await crud.update(crud.currentItem.id, values)
      } else {
        await crud.create(values)
      }
      setShowModal(false)
    },
    validate: validateSalonForm,
  })

  useEffect(() => {
    crud.fetchAll()
  }, [])

  // Charger les données dans le formulaire pour édition
  const handleEdit = (salon: Salon) => {
    crud.setCurrentItem(salon)
    form.setValues({
      name: salon.name,
      address: salon.address,
      email: salon.email,
      phone: salon.phone,
    })
    setShowModal(true)
  }

  return (
    <div>
      <SalonList
        salons={crud.items}
        loading={crud.loading}
        onEdit={handleEdit}
        onDelete={crud.remove}
      />

      <Modal show={showModal}>
        <form onSubmit={form.handleSubmit}>
          <input {...form.getFieldProps('name')} />
          {form.touched.name && form.errors.name && (
            <span>{form.errors.name}</span>
          )}
          {/* ... autres champs ... */}
          <button type="submit" disabled={form.isSubmitting}>
            Enregistrer
          </button>
        </form>
      </Modal>
    </div>
  )
}
```

## Migration des Composants Existants

### Avant

```typescript
const [salons, setSalons] = useState<Salon[]>([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [formData, setFormData] = useState({ name: '', address: '' })
const [formErrors, setFormErrors] = useState<any>({})

useEffect(() => {
  fetchSalons()
}, [])

const fetchSalons = async () => {
  setLoading(true)
  try {
    const data = await salonService.getMySalons()
    setSalons(data)
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
  setFormData({ ...formData, [e.target.name]: e.target.value })
}

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  // validation manuelle...
  // soumission...
}
```

### Après

```typescript
const crud = useCrud<Salon>({ /* config */ })
const form = useForm<SalonFormData>({ /* config */ })

useEffect(() => {
  crud.fetchAll()
}, [])

// C'est tout ! 🎉
```

## Ressources

- Code source : `src/hooks/useCrud.ts` et `src/hooks/useForm.ts`
- Exemple d'utilisation combinée : Voir ci-dessus
