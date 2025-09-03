import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Login from "./components/Login";
import { LanguageProvider, useLanguage } from "./components/LanguageContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { DataProvider } from "./src/context/DataContext";
import templeImage from "/pics/templeImage.jpg";
import { Alert, AlertDescription } from "./components/ui/alert";
import { toast } from "sonner";

function AppContent() {
  const { t } = useLanguage();
  const {
    isAuthenticated,
    user,
    isLoading: authLoading,
    error: authError,
    logout,
  } = useAuth();

  // Handle login error display
  useEffect(() => {
    if (authError) {
      toast.error(authError);
    }
  }, [authError]);

  // Show loading spinner during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t("auth.loading")}</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(251, 146, 60, 0.9), rgba(245, 101, 101, 0.9)), url(${templeImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="w-full max-w-md">
          <Login />
        </div>
      </div>
    );
  }

  // Main application content
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Header
        currentUser={user}
        onLogout={() => logout()}
      />

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}