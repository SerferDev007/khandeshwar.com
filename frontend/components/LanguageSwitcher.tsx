import { useLanguage } from './LanguageContext';
import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { useEffect } from 'react';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  // Log when component mounts and language changes
  useEffect(() => {
    console.log('[LanguageSwitcher] Component mounted with language:', language);
  }, []);

  useEffect(() => {
    console.log('[LanguageSwitcher] Language changed to:', language);
  }, [language]);

  const handleLanguageChange = (newLanguage: 'en' | 'mr') => {
    console.log('[LanguageSwitcher] Language change requested:', { from: language, to: newLanguage });
    setLanguage(newLanguage);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700">
          <Languages className="h-4 w-4 mr-2" />
          {language === 'en' ? 'EN' : 'मर'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className={language === 'en' ? 'bg-accent' : ''}
        >
          {t('language.english')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('mr')}
          className={language === 'mr' ? 'bg-accent' : ''}
        >
          {t('language.marathi')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}