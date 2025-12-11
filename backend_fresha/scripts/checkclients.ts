import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkClients() {
  try {
    // Compter tous les clients
    const totalClients = await prisma.client.count();
    console.log(`\n📊 Nombre total de clients dans la BD: ${totalClients}\n`);

    if (totalClients > 0) {
      // Afficher les 10 premiers clients
      const clients = await prisma.client.findMany({
        take: 10,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          createdAt: true
        }
      });

      console.log('👥 Les 10 premiers clients:');
      console.log('='.repeat(80));
      clients.forEach((client, index) => {
        console.log(`${index + 1}. ${client.firstName} ${client.lastName}`);
        console.log(`   Email: ${client.email}`);
        console.log(`   Tél: ${client.phone}`);
        console.log(`   Créé le: ${client.createdAt.toLocaleDateString('fr-FR')}`);
        console.log('');
      });
    } else {
      console.log('❌ Aucun client trouvé dans la base de données!');
    }

    // Compter les clients avec email temporaire
    const tempEmailCount = await prisma.client.count({
      where: {
        email: {
          contains: '@temp.client.com'
        }
      }
    });

    if (tempEmailCount > 0) {
      console.log(`\n⚠️  ${tempEmailCount} clients ont un email temporaire\n`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClients();
