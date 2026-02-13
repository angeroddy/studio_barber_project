import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SignInForm from '../components/auth/SignInForm';
import { AuthProvider } from '../context/AuthContext';

// Mock the AuthContext
const mockLogin = vi.fn();
const mockStaffLogin = vi.fn();
const mockClearError = vi.fn();

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      login: mockLogin,
      staffLogin: mockStaffLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      user: null,
    }),
  };
});

// Mock the staffAuth service
vi.mock('../services/staffAuth.service', () => ({
  default: {
    firstLogin: vi.fn(() => Promise.resolve({
      token: 'test-token',
      user: { id: '1', email: 'staff@test.com' }
    })),
  },
}));

// Wrapper component to provide routing context
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SignInForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render login form with all elements', () => {
      renderWithRouter(<SignInForm />);

      expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeInTheDocument();
      expect(screen.getByText('Renseignez vos coordonnées pour accéder à votre espace')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('info@gmail.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Entrer votre mot de passe')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
    });

    it('should render toggle buttons for owner and staff login', () => {
      renderWithRouter(<SignInForm />);

      expect(screen.getByText('Propriétaire')).toBeInTheDocument();
      expect(screen.getByText('Employé')).toBeInTheDocument();
    });

    it('should show signup link for owner login type', () => {
      renderWithRouter(<SignInForm />);

      expect(screen.getByText("Pas encore de compte?")).toBeInTheDocument();
      expect(screen.getByText("S'inscrire")).toBeInTheDocument();
    });
  });

  describe('Owner Login', () => {
    it('should call owner login with correct credentials', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SignInForm />);

      const emailInput = screen.getByPlaceholderText('info@gmail.com');
      const passwordInput = screen.getByPlaceholderText('Entrer votre mot de passe');
      const submitButton = screen.getByRole('button', { name: /Se connecter/i });

      await user.type(emailInput, 'owner@test.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'owner@test.com',
          password: 'password123',
        });
      });
    });

    it('should not submit form with empty fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SignInForm />);

      const submitButton = screen.getByRole('button', { name: /Se connecter/i });
      await user.click(submitButton);

      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockStaffLogin).not.toHaveBeenCalled();
    });
  });

  describe('Staff Login', () => {
    it('should call staff login when staff tab is selected', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SignInForm />);

      const staffTab = screen.getByText('Employé');
      await user.click(staffTab);

      const emailInput = screen.getByPlaceholderText('info@gmail.com');
      const passwordInput = screen.getByPlaceholderText('Entrer votre mot de passe');
      const submitButton = screen.getByRole('button', { name: /Se connecter/i });

      await user.type(emailInput, 'staff@test.com');
      await user.type(passwordInput, 'staffpass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockStaffLogin).toHaveBeenCalledWith({
          email: 'staff@test.com',
          password: 'staffpass123',
        });
      });
    });

    it('should show first login option for staff', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SignInForm />);

      const staffTab = screen.getByText('Employé');
      await user.click(staffTab);

      expect(screen.getByText('Première connexion?')).toBeInTheDocument();
      expect(screen.getByText('Créer mon mot de passe')).toBeInTheDocument();
    });
  });

  describe('First Login Flow', () => {
    it('should show confirm password field in first login mode', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SignInForm />);

      // Switch to staff tab
      const staffTab = screen.getByText('Employé');
      await user.click(staffTab);

      // Click on "Créer mon mot de passe" button
      const firstLoginButton = screen.getByRole('button', { name: /Créer mon mot de passe/i });
      await user.click(firstLoginButton);

      expect(screen.getByText('Première connexion : créez votre mot de passe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Choisir un mot de passe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirmer votre mot de passe')).toBeInTheDocument();
    });

    it('should validate password match in first login', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SignInForm />);

      // Switch to staff tab and activate first login
      const staffTab = screen.getByText('Employé');
      await user.click(staffTab);

      const firstLoginButton = screen.getByRole('button', { name: /Créer mon mot de passe/i });
      await user.click(firstLoginButton);

      // Fill in mismatched passwords
      const emailInput = screen.getByPlaceholderText('info@gmail.com');
      const passwordInput = screen.getByPlaceholderText('Choisir un mot de passe');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirmer votre mot de passe');

      await user.type(emailInput, 'staff@test.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different123');

      const submitButton = screen.getByRole('button', { name: /Créer mon mot de passe/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
      });
    });

    it('should validate minimum password length in first login', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SignInForm />);

      // Switch to staff tab and activate first login
      const staffTab = screen.getByText('Employé');
      await user.click(staffTab);

      const firstLoginButton = screen.getByRole('button', { name: /Créer mon mot de passe/i });
      await user.click(firstLoginButton);

      // Fill in short password
      const emailInput = screen.getByPlaceholderText('info@gmail.com');
      const passwordInput = screen.getByPlaceholderText('Choisir un mot de passe');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirmer votre mot de passe');

      await user.type(emailInput, 'staff@test.com');
      await user.type(passwordInput, '123');
      await user.type(confirmPasswordInput, '123');

      const submitButton = screen.getByRole('button', { name: /Créer mon mot de passe/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Le mot de passe doit contenir au moins 6 caractères')).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SignInForm />);

      const passwordInput = screen.getByPlaceholderText('Entrer votre mot de passe') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      // Find and click the eye icon (visibility toggle)
      const toggleButtons = screen.getAllByRole('button');
      const visibilityToggle = toggleButtons.find(btn =>
        btn.querySelector('svg')
      );

      if (visibilityToggle) {
        await user.click(visibilityToggle);
        expect(passwordInput.type).toBe('text');

        await user.click(visibilityToggle);
        expect(passwordInput.type).toBe('password');
      }
    });
  });

  describe('Login Type Switching', () => {
    it('should clear errors when switching login type', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SignInForm />);

      const ownerTab = screen.getByText('Propriétaire');
      const staffTab = screen.getByText('Employé');

      await user.click(staffTab);
      expect(mockClearError).toHaveBeenCalled();

      await user.click(ownerTab);
      expect(mockClearError).toHaveBeenCalledTimes(2);
    });

    it('should reset form state when switching between normal and first login', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SignInForm />);

      // Switch to staff tab
      const staffTab = screen.getByText('Employé');
      await user.click(staffTab);

      // Enter some data
      const emailInput = screen.getByPlaceholderText('info@gmail.com');
      const passwordInput = screen.getByPlaceholderText('Entrer votre mot de passe');
      await user.type(emailInput, 'staff@test.com');
      await user.type(passwordInput, 'password123');

      // Switch to first login
      const firstLoginButton = screen.getByRole('button', { name: /Créer mon mot de passe/i });
      await user.click(firstLoginButton);

      // Password should be cleared
      const newPasswordInput = screen.getByPlaceholderText('Choisir un mot de passe') as HTMLInputElement;
      expect(newPasswordInput.value).toBe('');
    });
  });
});
