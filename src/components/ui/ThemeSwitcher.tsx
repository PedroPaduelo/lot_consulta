import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeSwitcher: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-24 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>;
  }

  const themes = [
    { name: 'light', icon: Sun, title: 'Claro' },
    { name: 'dark', icon: Moon, title: 'Escuro' },
    { name: 'system', icon: Monitor, title: 'Sistema' },
  ];

  return (
    <div className="flex items-center space-x-1 rounded-lg bg-muted-light dark:bg-muted-dark p-1">
      {themes.map((t) => (
        <button
          key={t.name}
          onClick={() => setTheme(t.name)}
          className={`p-1.5 rounded-md transition-colors duration-200 flex-1 flex justify-center items-center ${ // Ensure buttons fill space
            theme === t.name
              ? 'bg-surface-light dark:bg-surface-dark shadow-sm text-primary-light dark:text-primary-dark'
              : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-gray-200 dark:hover:bg-gray-600' // Adjusted hover colors
          }`}
          aria-label={`Mudar para tema ${t.title}`}
          title={`Mudar para tema ${t.title}`}
        >
          <t.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
