import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/home";
import SignUp from "./pages/AuthPages/SignUp";
import SignIn from "./pages/AuthPages/SignIn";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CrudService from "./pages/Services/crudService";
import CrudStaff from "./pages/staff/crudStaff";
import StaffSchedulePage from "./pages/staff/StaffSchedulePage";
import Calendrier from "./pages/calendrier/calendrier";
import CrudSalon from "./pages/salon/crudSalon";
import CrudClients from "./pages/clients/crudClients";

function App() {
  return (
    <Router>
      <AuthProvider>
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
            <Route path="/salons" element={<CrudSalon />} />
            <Route path="/clients" element={<CrudClients />} />
          </Route>

          {/* Routes publiques d'authentification */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App