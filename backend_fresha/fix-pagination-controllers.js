/**
 * Script pour corriger les controllers qui utilisent des services paginés
 * mais qui ne gèrent pas correctement la structure de réponse paginée
 */

const fs = require('fs');
const path = require('path');

// Liste des services paginés et leurs fonctions
const paginatedServices = {
  'booking.service.ts': ['getBookingsBySalon', 'getBookingsByStaff'],
  'salon.service.ts': ['getAllSalons', 'getSalonsByOwner'],
  'staff.service.ts': ['getStaffBySalon', 'getStaffByRole'],
  'crudService.service.ts': ['getServicesBySalon', 'getServicesByCategory'],
  'closedDay.service.ts': ['getClosedDaysBySalon'],
  'absence.service.ts': ['getAbsencesBySalon']
};

// Correspondance entre service et controller
const controllerMappings = {
  'getBookingsBySalon': { controller: 'booking.controller.ts', function: 'getBookingsBySalon' },
  'getBookingsByStaff': { controller: 'booking.controller.ts', function: 'getBookingsByStaff' },
  'getAllSalons': { controller: 'salon.controller.ts', function: 'getAllSalonsHandler' },
  'getSalonsByOwner': { controller: 'salon.controller.ts', function: 'getSalonsByOwnerHandler' },
  'getStaffBySalon': { controller: 'staff.controller.ts', function: 'getStaffBySalonController' },
  'getStaffByRole': { controller: 'staff.controller.ts', function: 'getStaffByRoleController' },
  'getServicesBySalon': { controller: 'crudServices.controller.ts', function: 'getServicesBySalonController' },
  'getServicesByCategory': { controller: 'crudServices.controller.ts', function: 'getServicesByCategoryController' },
  'getClosedDaysBySalon': { controller: 'closedDay.controller.ts', function: 'getClosedDaysBySalonController' },
  'getAbsencesBySalon': { controller: 'absence.controller.ts', function: 'getAbsencesBySalonController' }
};

console.log('🔍 Analyse des controllers pour corriger la pagination...\n');

// Fonction pour détecter et corriger les problèmes de pagination
function fixController(controllerPath, serviceFunction) {
  let content = fs.readFileSync(controllerPath, 'utf-8');
  let modified = false;

  // Pattern 1: Détecter "count: xxx.length" où xxx est le résultat d'un service paginé
  const lengthPattern = /count:\s*(\w+)\.length/g;
  const matches = content.matchAll(lengthPattern);

  for (const match of matches) {
    const varName = match[1];

    // Vérifier si cette variable vient d'un service paginé
    const assignmentRegex = new RegExp(`const\\s+${varName}\\s*=\\s*await\\s+\\w+\\.${serviceFunction}`, 'g');

    if (assignmentRegex.test(content)) {
      console.log(`  ✓ Trouvé problème de pagination dans ${path.basename(controllerPath)} (variable: ${varName})`);
      modified = true;
    }
  }

  return modified;
}

// Parcourir tous les controllers
const controllersDir = path.join(__dirname, 'src', 'controllers');
let issuesFound = 0;

for (const [serviceFunction, mapping] of Object.entries(controllerMappings)) {
  const controllerPath = path.join(controllersDir, mapping.controller);

  if (fs.existsSync(controllerPath)) {
    console.log(`📄 Vérification de ${mapping.controller}...`);
    const hasIssues = fixController(controllerPath, serviceFunction);

    if (hasIssues) {
      issuesFound++;
    }
  }
}

console.log(`\n✅ Analyse terminée. ${issuesFound} problème(s) de pagination détecté(s).`);
console.log('\n📝 Pour corriger automatiquement, les controllers doivent:');
console.log('   1. Extraire page et limit des query params');
console.log('   2. Passer ces paramètres au service');
console.log('   3. Retourner { success: true, ...result } au lieu de { success: true, data: result, count: result.length }');
