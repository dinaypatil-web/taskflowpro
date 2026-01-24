'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  const currentTheme = themes.find(t => t.value === theme) || themes[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105"
        aria-label="Toggle theme"
      >
        <currentTheme.icon className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-20 glass-card min-w-[140px] animate-slide-down">
            <div className="py-2">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center px-4 py-2 text-sm transition-colors duration-200 ${
                    theme === themeOption.value
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-white/10 dark:hover:bg-white/5'
                  }`}
                >
                  <themeOption.icon className="w-4 h-4 mr-3" />
                  {themeOption.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}