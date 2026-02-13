# Testing Guide - Fresha Clone Project

This guide covers all testing implementations across the backend and frontend applications.

## Table of Contents

- [Backend Tests (Jest)](#backend-tests-jest)
- [Frontend Tests (Vitest)](#frontend-tests-vitest)
- [E2E Tests (Playwright)](#e2e-tests-playwright)
- [Running All Tests](#running-all-tests)
- [CI/CD Integration](#cicd-integration)

---

## Backend Tests (Jest)

### Location
`backend_fresha/src/__tests__/`

### Test Files
- `auth.test.ts` - Authentication flow tests (login, register, JWT)
- `booking.test.ts` - Booking creation and management tests
- `availability.test.ts` - Availability checking and time slot tests

### Running Backend Tests

```bash
cd backend_fresha

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### What's Tested

#### Authentication (`auth.test.ts`)
- ✅ User registration with validation
  - Valid registration
  - Duplicate email rejection
  - Invalid email format
  - Weak password rejection
  - Missing required fields
- ✅ User login
  - Valid credentials
  - Invalid email
  - Invalid password
  - Email format validation
- ✅ Protected routes
  - Valid JWT token access
  - Missing token rejection
  - Invalid token rejection
  - Expired token rejection
- ✅ JWT token validation
  - Token generation
  - Token verification
  - Token payload integrity

#### Booking Management (`booking.test.ts`)
- ✅ Booking creation
  - Successful booking creation
  - Non-existent salon rejection
  - Non-existent staff rejection
  - Non-existent service rejection
  - Conflicting booking detection (staff already booked)
  - Client creation for new clients
  - Existing client reuse
- ✅ Booking retrieval
  - Get booking by ID
  - 404 for non-existent bookings
- ✅ Booking updates
  - Update booking status
- ✅ Booking deletion
  - Delete booking successfully

#### Availability Checking (`availability.test.ts`)
- ✅ Staff availability
  - Available when no conflicts
  - Unavailable when booking conflict exists
  - Unavailable when staff on approved absence
  - Exclude specific booking when checking
- ✅ Available time slots
  - Return available slots for a day
  - Empty array when salon is closed
  - Empty array for exceptional closure days
  - Missing parameter validation
  - Invalid date format rejection
  - Non-existent service rejection
- ✅ Time slot filtering
  - Exclude already booked slots

### Test Configuration

**File:** `backend_fresha/jest.config.js`

Key features:
- TypeScript support via ts-jest
- Node environment
- Mock setup for Sentry and logger
- 30-second timeout for database operations
- Coverage reporting

---

## Frontend Tests (Vitest)

### Location
`fresha_clone_sb/src/__tests__/`

### Test Files
- `SignInForm.test.tsx` - Authentication UI component tests

### Running Frontend Tests

```bash
cd fresha_clone_sb

# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### What's Tested

#### Sign In Form (`SignInForm.test.tsx`)
- ✅ Component rendering
  - All form elements visible
  - Owner/Staff toggle buttons
  - Signup link for owners
- ✅ Owner login flow
  - Submit with valid credentials
  - Empty field validation
- ✅ Staff login flow
  - Switch to staff tab
  - Submit with staff credentials
  - First login option visibility
- ✅ First login flow
  - Confirm password field display
  - Password match validation
  - Minimum password length validation
- ✅ Password visibility toggle
  - Toggle between text/password input types
- ✅ Login type switching
  - Error clearing on switch
  - Form state reset

### Test Configuration

**File:** `fresha_clone_sb/vitest.config.ts`

Key features:
- React plugin for JSX support
- jsdom environment for DOM testing
- Global test utilities
- CSS support
- Coverage reporting with v8
- Path alias support (@/ → src/)

**Setup File:** `fresha_clone_sb/src/__tests__/setup.ts`

Includes:
- Testing Library cleanup
- Window.matchMedia mock
- IntersectionObserver mock
- Environment variables setup

---

## E2E Tests (Playwright)

### Location
`front_client/front_client_sb/e2e/`

### Test Files
- `booking-flow.spec.ts` - Complete client booking flow

### Running E2E Tests

```bash
cd front_client/front_client_sb

# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

### What's Tested

#### Client Booking Flow (`booking-flow.spec.ts`)
- ✅ Complete booking flow
  - Homepage to confirmation
  - Salon selection
  - Service selection
  - Professional selection
  - Time slot selection
  - Client information form
  - Booking confirmation
- ✅ Individual page tests
  - Salon information display
  - Available services display
  - Available professionals display
  - Available time slots display
- ✅ Form validation
  - Required field validation
  - Booking summary display
- ✅ Navigation
  - Back button functionality
  - Breadcrumb navigation
- ✅ Error prevention
  - Double submission prevention
- ✅ Error handling
  - Network error handling
  - No availability messaging

### Test Configuration

**File:** `front_client/front_client_sb/playwright.config.ts`

Key features:
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile device testing (Pixel 5, iPhone 12)
- Automatic dev server startup
- Screenshot on failure
- Trace on retry
- Parallel execution
- CI/CD optimizations

---

## Running All Tests

### Complete Test Suite

Run all tests across the entire project:

```bash
# Backend tests
cd backend_fresha && npm test && cd ..

# Frontend unit tests
cd fresha_clone_sb && npm test && cd ..

# E2E tests
cd front_client/front_client_sb && npm run test:e2e && cd ../..
```

### Coverage Reports

Generate coverage reports for all projects:

```bash
# Backend coverage
cd backend_fresha && npm run test:coverage

# Frontend coverage
cd fresha_clone_sb && npm run test:coverage
```

Coverage reports will be generated in:
- Backend: `backend_fresha/coverage/`
- Frontend: `fresha_clone_sb/coverage/`

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd backend_fresha && npm ci
      - name: Run tests
        run: cd backend_fresha && npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend_fresha/coverage/coverage-final.json

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd fresha_clone_sb && npm ci
      - name: Run tests
        run: cd fresha_clone_sb && npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd front_client/front_client_sb && npm ci
      - name: Install Playwright browsers
        run: cd front_client/front_client_sb && npx playwright install --with-deps
      - name: Run E2E tests
        run: cd front_client/front_client_sb && npm run test:e2e
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: front_client/front_client_sb/playwright-report/
```

---

## Best Practices

### Writing Tests

1. **Keep tests isolated** - Each test should be independent
2. **Use descriptive names** - Test names should describe what they test
3. **Mock external dependencies** - Don't rely on real APIs or databases
4. **Test user behavior** - Focus on what users do, not implementation details
5. **Keep tests maintainable** - Don't duplicate code, use helper functions

### Running Tests Locally

1. **Before committing** - Run relevant tests
2. **Before deploying** - Run full test suite
3. **After dependencies update** - Verify nothing broke
4. **During development** - Use watch mode for rapid feedback

### Debugging Failed Tests

#### Backend (Jest)
```bash
# Run specific test file
npm test auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should successfully register"

# Run with verbose output
npm test -- --verbose
```

#### Frontend (Vitest)
```bash
# Run specific test file
npm test -- SignInForm.test.tsx

# Run with UI for debugging
npm run test:ui
```

#### E2E (Playwright)
```bash
# Run in debug mode
npm run test:e2e:debug

# Run specific test
npm run test:e2e -- booking-flow.spec.ts

# Run with headed browser
npm run test:e2e -- --headed
```

---

## Coverage Goals

Target coverage percentages:
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

---

## Next Steps

1. **Add more unit tests** for individual services and components
2. **Integration tests** for API endpoints with real database
3. **Performance tests** for critical booking flows
4. **Accessibility tests** using @axe-core/playwright
5. **Visual regression tests** using Playwright screenshots

---

## Troubleshooting

### Common Issues

#### "Cannot find module" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Tests timing out
- Increase timeout in test config
- Check for unresolved promises
- Verify mock implementations

#### E2E tests failing
- Ensure dev server is running
- Check for port conflicts
- Verify browser installation: `npx playwright install`

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
