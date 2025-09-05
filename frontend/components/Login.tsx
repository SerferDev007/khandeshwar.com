import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "./LanguageContext";
import { useAuth } from "../src/context/AuthContext";
import { useEffect } from "react";

export default function Login() {
  const { t, language } = useLanguage();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Log component mount and language change
  useEffect(() => {
    console.log('[Login] Component mounted with language:', language);
  }, []);

  useEffect(() => {
    console.log('[Login] Language changed to:', language);
  }, [language]);

  // Log authentication state changes
  useEffect(() => {
    console.log('[Login] Auth state changed:', { isLoading, hasError: !!error });
    if (error) {
      console.error('[Login] Authentication error:', error);
    }
  }, [isLoading, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Login] Form submission started:', { 
      email: email.replace(/(.{3}).*@/, '$1***@'), // Partially hide email for privacy
      hasPassword: !!password 
    });
    
    if (!email || !password) {
      console.warn('[Login] Form submission blocked - missing credentials');
      return;
    }

    try {
      console.log('[Login] Attempting login...');
      await login({ email, password });
      console.log('[Login] Login attempt completed');
    } catch (error) {
      console.error('[Login] Login error caught:', error);
      // Error is handled by the auth context and displayed via toast
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    console.log('[Login] Email field updated:', newEmail.length > 0 ? 'has value' : 'empty');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    console.log('[Login] Password field updated:', newPassword.length > 0 ? 'has value' : 'empty');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    console.log('[Login] Password visibility toggled:', !showPassword ? 'visible' : 'hidden');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-2xl border-0 login">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-orange-600">
            {t("login.welcome")}
          </CardTitle>
          <p
            className={`text-xl sm:text-xl md:text-[20px] font-yatra font-bold text-gray-600 leading-tight mt-2 ${
              language === "mr" ? "temple-title-marathi" : ""
            }`}
          >
            {t("header.title")}
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-1" htmlFor="email">
                {t("Email")}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("Enter Email")}
                  value={email}
                  onChange={handleEmailChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="mb-1" htmlFor="password">
                {t("Password")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.enterPassword")}
                  value={password}
                  onChange={handlePasswordChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={isLoading}
            >
              {isLoading ? t("login.signingIn") : t("login.signIn")}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>{t("Test Credentials")}</p>
            <p>Email: admin@example.com</p>
            <p>Password: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
