import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AbsencesPage() {
  const { isLoading, isOwner } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-4 border-gray-200 rounded-full border-t-[#EB549E] animate-spin"></div>
      </div>
    );
  }

  if (isOwner) {
    return <Navigate to="/gestion-absences" replace />;
  }

  return <Navigate to="/calendar" replace />;
}
