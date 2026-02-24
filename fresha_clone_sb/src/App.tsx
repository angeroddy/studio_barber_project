import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import './App.css'
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/home";
import SignUp from "./pages/AuthPages/SignUp";
import SignIn from "./pages/AuthPages/SignIn";
import ClientSetPassword from "./pages/AuthPages/ClientSetPassword";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CrudService from "./pages/Services/crudService";
import CrudStaff from "./pages/staff/crudStaff";
import StaffSchedulePage from "./pages/staff/StaffSchedulePage";
import Calendrier from "./pages/calendrier/calendrier";
import CrudSalon from "./pages/salon/crudSalon";
import CrudClients from "./pages/clients/crudClients";
import AbsencesPage from "./pages/absences/AbsencesPage";
import OwnerAbsencesPage from "./pages/absences/OwnerAbsencesPage";
import SalonSettings from "./pages/Settings/SalonSettings";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <ScrollToTop />
        <Routes>

          {/* Routes protégées avec Dashboard Layout */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<CrudService />} />
            <Route path="/equipe" element={<CrudStaff />} />
            <Route path="/planification" element={<StaffSchedulePage />} />
            <Route path="/calendar" element={<Calendrier />} />
            <Route path="/calendrier" element={<Calendrier />} />
            <Route path="/salons" element={<CrudSalon />} />
            <Route path="/clients" element={<CrudClients />} />
            <Route path="/absences" element={<AbsencesPage />} />
            <Route path="/gestion-absences" element={<OwnerAbsencesPage />} />
            <Route path="/parametres" element={<SalonSettings />} />
          </Route>

          {/* Routes publiques d'authentification */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/set-password" element={<ClientSetPassword />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App
