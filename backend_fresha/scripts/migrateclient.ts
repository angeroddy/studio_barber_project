import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface OldClientData {
  'ID du client': number;
  'Prénom': string;
  'Nom de famille': string;
  'Nom complet': string;
  'Bloqué': string;
  'Motif du blocage': string;
  'Genre': string;
  'Numéro de portable': string;
  'Téléphone': string;
  'E-mail': string;
  'Accepte les communications à caractère marketing': string;
  'Accepte les communications SMS à caractère marketing': string;
  'Adresse': string;
  'Numéro': string;
  'Lieu': string;
  'Ville': string;
  'Pays': string;
  'Code postal': string;
  'Date de naissance': string;
  'Ajouté': string;
  'Remarque': string;
  'Source de parrainage': string;
}

async function migrateClients(jsonFilePath: string) {
  // Lire le fichier JSON
  const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
  const clients: OldClientData[] = JSON.parse(fileContent);

  console.log(`📊 ${clients.length} clients à migrer\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors: { client: string; error: string }[] = [];

  for (const oldClient of clients) {
    try {
      // Préparer les données
      const rawEmail = oldClient['E-mail']?.trim();
      const phone = oldClient['Numéro de portable']?.trim() || 
                   oldClient['Téléphone']?.trim() || 
                   '';
      const firstName = oldClient['Prénom']?.trim() || 'Prénom';
      const lastName = oldClient['Nom de famille']?.trim() || '';
      const marketing = oldClient['Accepte les communications à caractère marketing'] === 'Oui';
      const notes = oldClient['Remarque']?.trim() || null;

      // Générer un email unique si manquant
      let email: string;
      if (rawEmail && rawEmail.includes('@')) {
        email = rawEmail.toLowerCase();
      } else if (phone) {
        // Utiliser le téléphone pour créer un email temporaire
        const cleanPhone = phone.replace(/\s/g, '');
        email = `${cleanPhone}@temp.client.com`;
      } else {
        // Dernier recours : utiliser l'ID
        email = `client_${oldClient['ID du client']}@temp.client.com`;
      }

      // Vérifier si le client existe déjà (par email ou téléphone)
      const existingClient = await prisma.client.findFirst({
        where: {
          OR: [
            { email },
            ...(phone ? [{ phone }] : [])
          ]
        }
      });

      if (existingClient) {
        skipCount++;
        console.log(`⊘ Client déjà existant: ${firstName} ${lastName} (${email})`);
        continue;
      }

      // Créer le nouveau client
      await prisma.client.create({
        data: {
          email,
          firstName,
          lastName,
          phone,
          marketing,
          notes,
          salonId: null, // NULL car on ne connaît pas encore le salon
          password: null, // Le client devra créer son mot de passe
        }
      });

      successCount++;
      console.log(`✓ Migré: ${firstName} ${lastName} (${email})`);

    } catch (error: any) {
      errorCount++;
      const clientName = oldClient['Nom complet'] || `${oldClient['Prénom']} ${oldClient['Nom de famille']}`;
      errors.push({
        client: clientName,
        error: error.message
      });
      console.error(`✗ Erreur pour ${clientName}:`, error.message);
    }
  }

  // Résumé de la migration
  console.log('\n' + '='.repeat(50));
  console.log('📈 RÉSUMÉ DE LA MIGRATION');
  console.log('='.repeat(50));
  console.log(`Total de clients dans le JSON : ${clients.length}`);
  console.log(`✓ Succès                      : ${successCount}`);
  console.log(`⊘ Ignorés (doublons)          : ${skipCount}`);
  console.log(`✗ Erreurs                     : ${errorCount}`);
  console.log('='.repeat(50));

  if (errors.length > 0) {
    console.log('\n❌ ERREURS DÉTAILLÉES:');
    errors.forEach(({ client, error }, index) => {
      console.log(`${index + 1}. ${client}`);
      console.log(`   └─ ${error}\n`);
    });
  }

  // Statistiques des emails
  const tempEmailCount = await prisma.client.count({
    where: {
      email: {
        contains: '@temp.client.com'
      }
    }
  });

  if (tempEmailCount > 0) {
    console.log(`\n⚠️  ATTENTION: ${tempEmailCount} clients ont un email temporaire`);
    console.log('   Ces clients devront mettre à jour leur email lors de leur première connexion');
  }
}

// Nouveau - Option 2 (chemin relatif)
const JSON_FILE_PATH = 'scripts/clients.json'; // ← Change le chemin si nécessaire

migrateClients(JSON_FILE_PATH)
  .then(() => {
    console.log('\n✅ Migration terminée avec succès');
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors de la migration:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });