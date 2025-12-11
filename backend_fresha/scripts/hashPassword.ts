import { hashPassword } from '../src/utils/hash.util'

// Script pour hasher un mot de passe
async function main() {
  const password = process.argv[2]

  if (!password) {
    console.error('Usage: npm run hash-password <votre-mot-de-passe>')
    process.exit(1)
  }

  const hashedPassword = await hashPassword(password)

  console.log('\n===========================================')
  console.log('Mot de passe original:', password)
  console.log('Mot de passe hashé:', hashedPassword)
  console.log('===========================================\n')
  console.log('Copiez le mot de passe hashé et mettez-le dans la colonne "password" de votre utilisateur dans Neon')
  console.log('\n')
}

main()
