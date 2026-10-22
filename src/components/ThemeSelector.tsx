import { useState } from 'react';
import { Palette } from 'lucide-react';
import { THEMES, type Theme } from '@/lib/themes';

export function ThemeSelector({
  activeThemeId,
  setThemeId,
}: {
  activeThemeId: string;
  setThemeId: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme"
        className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center justify-center"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-slate-100 flex space-x-2 z-50 animate-in fade-in slide-in-from-top-2">
            {Object.values(THEMES).map((t: Theme) => (
              <button
                key={t.id}
                onClick={() => {
                  setThemeId(t.id);
                  setIsOpen(false);
                }}
                title={t.name}
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.gradient} transition-transform hover:scale-110 ${
                  activeThemeId === t.id ? 'ring-2 ring-offset-2 ring-slate-800' : ''
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
