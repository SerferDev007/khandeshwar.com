import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "./LanguageContext";

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  error?: string;
}

export default function Login({ onLogin, error }: LoginProps) {
  const { t, language } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    onLogin(username, password);
    setIsLoading(false);
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
          <CardTitle className="text-2xl text-orange-600">{t('login.welcome')}</CardTitle>
          <p className={`text-sm text-gray-600 mt-2 ${
            language === 'mr' ? 'temple-title-marathi' : ''
          }`}>
            {t('header.title')}
          </p>
          <p className="text-xs text-gray-500">{t('header.subtitle')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-600">{t('login.invalidCredentials')}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('login.username')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder={t('login.enterUsername')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t('login.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('login.enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600" 
              disabled={isLoading}
            >
              {isLoading ? t('login.signingIn') : t('login.signIn')}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>{t('login.demoCredentials')}</p>
            <p>Admin: admin / admin123</p>
            <p>Treasurer: treasurer / treasurer123</p>
            <p>Viewer: viewer / viewer123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}