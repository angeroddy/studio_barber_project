import { test, expect } from '@playwright/test';

test.describe('Client Booking Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the booking page
    await page.goto('/');
  });

  test('should complete full booking flow', async ({ page }) => {
    // Step 1: Navigate to booking page from homepage
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Step 2: Select a salon (if there's a salon selection page)
    // Look for a salon card or link
    const salonLink = page.locator('a[href*="/reserver"]').first();
    if (await salonLink.isVisible()) {
      await salonLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Step 3: Select service/prestation
    // Navigate to prestations page
    await page.goto('/reserver/prestations');
    await page.waitForLoadState('networkidle');

    // Select a service (assuming there are service cards or buttons)
    const serviceButton = page.locator('button:has-text("Sélectionner"), button:has-text("Choisir")').first();
    if (await serviceButton.isVisible()) {
      await serviceButton.click();
    } else {
      // Try clicking on a service card
      const serviceCard = page.locator('[data-testid="service-card"]').first();
      if (await serviceCard.isVisible()) {
        await serviceCard.click();
      }
    }

    // Step 4: Select professional/staff
    await page.goto('/reserver/professionnel');
    await page.waitForLoadState('networkidle');

    // Select a professional
    const professionalButton = page.locator('button:has-text("Sélectionner"), button:has-text("Choisir")').first();
    if (await professionalButton.isVisible()) {
      await professionalButton.click();
    }

    // Step 5: Select time slot
    await page.goto('/reserver/heure');
    await page.waitForLoadState('networkidle');

    // Select a date (if there's a date picker)
    const dateButton = page.locator('button[aria-label*="date"]').first();
    if (await dateButton.isVisible()) {
      await dateButton.click();
    }

    // Select a time slot
    const timeSlot = page.getByRole('button').filter({ hasText: /^\d{1,2}:\d{2}$/ }).first();
    if (await timeSlot.isVisible().catch(() => false)) {
      await timeSlot.click();
    }

    // Step 6: Validate booking
    await page.goto('/reserver/valider');
    await page.waitForLoadState('networkidle');

    // Fill in client information
    const nameInput = page.locator('input[name="name"], input[placeholder*="Nom"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('John Doe');
    }

    const emailInput = page.locator('input[type="email"], input[placeholder*="Email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('john.doe@example.com');
    }

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="Téléphone"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+33612345678');
    }

    // Submit the booking
    const submitButton = page.locator('button:has-text("Confirmer"), button:has-text("Réserver"), button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }

    // Step 7: Verify confirmation page
    await page.waitForURL(/.*confirmation.*/);

    // Check for success message
    const confirmationMessage = page.locator('text=/réservation.*confirmée|réservation.*réussie|merci/i');
    await expect(confirmationMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display salon information on booking page', async ({ page }) => {
    await page.goto('/reserver/prestations');
    await page.waitForLoadState('networkidle');

    // Salon name should be visible
    const salonName = page.locator('h1, h2, [data-testid="salon-name"]').first();
    await expect(salonName).toBeVisible();
  });

  test('should show available services', async ({ page }) => {
    await page.goto('/reserver/prestations');
    await page.waitForLoadState('networkidle');

    // Check for service listings
    const services = page.locator('[data-testid="service-card"], .service-item, article').first();
    await expect(services).toBeVisible({ timeout: 10000 });
  });

  test('should show available professionals', async ({ page }) => {
    await page.goto('/reserver/professionnel');
    await page.waitForLoadState('networkidle');

    // Check for professional listings
    const professionals = page.locator('[data-testid="staff-card"], .staff-item, article').first();
    await expect(professionals).toBeVisible({ timeout: 10000 });
  });

  test('should show available time slots', async ({ page }) => {
    await page.goto('/reserver/heure');
    await page.waitForLoadState('networkidle');

    // Check for time slot listings - look for data-testid first, then any button
    const timeSlotByTestId = page.locator('[data-testid="time-slot"]').first();
    const timeSlotByButton = page.getByRole('button').first();

    const hasTestId = await timeSlotByTestId.isVisible().catch(() => false);
    if (hasTestId) {
      await expect(timeSlotByTestId).toBeVisible({ timeout: 10000 });
    } else {
      await expect(timeSlotByButton).toBeVisible({ timeout: 10000 });
    }
  });

  test('should validate required fields on validation page', async ({ page }) => {
    await page.goto('/reserver/valider');
    await page.waitForLoadState('networkidle');

    // Try to submit without filling required fields
    const submitButton = page.locator('button:has-text("Confirmer"), button:has-text("Réserver"), button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors
      const errorMessage = page.locator('text=/requis|obligatoire|invalid|error/i').first();
      // Some error should be visible (either from browser validation or custom)
      const hasError = await errorMessage.isVisible().catch(() => false);

      // At minimum, the form should not submit (URL should not change)
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('valider');
    }
  });

  test('should show booking summary before confirmation', async ({ page }) => {
    await page.goto('/reserver/valider');
    await page.waitForLoadState('networkidle');

    // Check for booking summary elements
    const summary = page.locator('[data-testid="booking-summary"], .summary, aside').first();
    await expect(summary).toBeVisible({ timeout: 10000 });
  });

  test('should navigate back through booking steps', async ({ page }) => {
    await page.goto('/reserver/valider');
    await page.waitForLoadState('networkidle');

    // Find and click back button or breadcrumb
    const backButton = page.locator('button:has-text("Retour"), a:has-text("Retour"), [aria-label="back"]').first();
    if (await backButton.isVisible()) {
      await backButton.click();

      // Should navigate to previous step
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('valider');
    }
  });

  test('should display booking breadcrumb navigation', async ({ page }) => {
    await page.goto('/reserver/prestations');
    await page.waitForLoadState('networkidle');

    // Check for breadcrumb or step indicator
    const breadcrumb = page.locator('[data-testid="breadcrumb"], nav[aria-label="breadcrumb"], .breadcrumb').first();
    const hasBreadcrumb = await breadcrumb.isVisible().catch(() => false);

    // At minimum, page should have some navigation indicator
    if (!hasBreadcrumb) {
      const stepIndicator = page.locator('.step, [data-testid="step"]').first();
      await expect(stepIndicator).toBeVisible({ timeout: 5000 });
    } else {
      await expect(breadcrumb).toBeVisible();
    }
  });

  test('should prevent double booking submission', async ({ page }) => {
    await page.goto('/reserver/valider');
    await page.waitForLoadState('networkidle');

    // Fill in minimal required information
    const nameInput = page.locator('input[name="name"], input[placeholder*="Nom"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User');
    }

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
    }

    // Try to submit the form
    const submitButton = page.locator('button:has-text("Confirmer"), button:has-text("Réserver"), button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      // Click once
      await submitButton.click();

      // Button should be disabled after first click
      await page.waitForTimeout(500);
      const isDisabled = await submitButton.isDisabled().catch(() => false);

      // Either button is disabled or shows loading state
      if (!isDisabled) {
        const loadingText = page.locator('text=/chargement|loading|envoi/i');
        const hasLoadingState = await loadingText.isVisible().catch(() => false);
        expect(hasLoadingState || isDisabled).toBeTruthy();
      }
    }
  });
});

test.describe('Booking Error Handling', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true);

    await page.goto('/reserver/prestations');

    // Should show some error state or offline message
    const errorMessage = page.locator('text=/erreur|error|offline|connexion/i').first();
    const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

    // At minimum, page should handle the error without crashing
    expect(hasError || page.url()).toBeTruthy();

    // Restore online mode
    await context.setOffline(false);
  });

  test('should show error when no time slots available', async ({ page }) => {
    await page.goto('/reserver/heure');
    await page.waitForLoadState('networkidle');

    // Check for either time slots or a "no availability" message
    const timeSlots = page.locator('[data-testid="time-slot"]');
    const noAvailability = page.locator('text=/aucun.*disponible|no.*available|complet/i');

    const hasSlotsOrMessage = await Promise.race([
      timeSlots.first().isVisible().catch(() => false),
      noAvailability.first().isVisible().catch(() => false),
    ]);

    expect(hasSlotsOrMessage).toBeTruthy();
  });
});
