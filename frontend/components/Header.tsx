import React from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { User as UserIcon, LogOut, Settings, UserCog } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "./LanguageContext";

interface User {
  id: string;
  username: string;
  email: string;
  role: "Admin" | "Treasurer" | "Viewer";
  status: "Active" | "Inactive";
}

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
}

export default function Header({
  currentUser,
  onLogout,
}: HeaderProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // NEW: fallback to persisted user during reload gap
  const [storedUser, setStoredUser] = React.useState<User | null>(null);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("auth"); // { token, user }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user) setStoredUser(parsed.user as User);
      }
    } catch {
      // ignore
    }
  }, []);

  // Prefer prop (fresh) else persisted (avoids empty UI after refresh)
  const effectiveUser: User | null = currentUser ?? storedUser;

  React.useEffect(() => {
    console.log("effectiveUser", effectiveUser);
  }, [effectiveUser]);

  const getAvailableTabs = () => [
    { key: "dashboard", label: t("nav.dashboard"), path: "/admin/dashboard" },
    { key: "donations", label: t("nav.donations"), path: "/admin/donations" },
    { key: "expenses", label: t("nav.expenses"), path: "/admin/expenses" },
    { key: "rent", label: t("nav.rentManagement"), path: "/admin/rent" },
    { key: "reports", label: t("nav.reports"), path: "/admin/reports" },
    { key: "users", label: t("nav.users"), path: "/admin/users" },
  ];

  const isActiveTab = (path: string) => {
    return location.pathname === path;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-500";
      case "Treasurer":
        return "bg-blue-500";
      case "Viewer":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "Admin":
        return t("users.admin");
      case "Treasurer":
        return t("users.treasurer");
      case "Viewer":
        return t("users.viewer");
      default:
        return role;
    }
  };

  const username = effectiveUser?.username ?? "";
  const role = (effectiveUser?.role ?? "Viewer") as User["role"];
  const email = effectiveUser?.email ?? "";

  return (
    <header className="bg-blue-600 text-white p-4 shadow-lg header">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className={`text-white text-xl ${
                language === "mr" ? "temple-title-marathi" : ""
              }`}
            >
              {t("header.title")}
            </h1>
            <p className="text-blue-100 text-sm">{t("header.subtitle")}</p>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex gap-4">
              {getAvailableTabs().map((tab) => (
                <Button
                  key={tab.key}
                  variant={isActiveTab(tab.path) ? "secondary" : "ghost"}
                  onClick={() => navigate(tab.path)}
                  className={`${
                    isActiveTab(tab.path)
                      ? "bg-white text-blue-600 hover:bg-gray-100"
                      : "text-white hover:bg-blue-700"
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </nav>

            <LanguageSwitcher />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-blue-700 flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm">{username}</div>
                      <Badge
                        className={`${getRoleColor(role)} text-white text-xs`}
                        variant="secondary"
                      >
                        {getRoleLabel(role)}
                      </Badge>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm">
                  <div className="text-xs text-gray-500">
                    {t("user.signedInAs")}
                  </div>
                  <div>{email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  {t("user.settings")}
                </DropdownMenuItem>
                {role === "Admin" && (
                  <DropdownMenuItem onClick={() => navigate("/admin/users")}>
                    <UserCog className="h-4 w-4 mr-2" />
                    {t("user.userManagement")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("user.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
