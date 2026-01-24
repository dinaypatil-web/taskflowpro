# Theme System Documentation

## Overview

TaskFlow Pro includes a comprehensive theme system that allows users to choose between Light, Dark, and System themes. The theme system is built with modern CSS custom properties and Tailwind CSS dark mode support.

## Features

### 🎨 **Theme Options**
- **Light Theme**: Clean and bright interface with light backgrounds
- **Dark Theme**: Easy on the eyes with dark backgrounds and high contrast
- **System Theme**: Automatically matches the user's device preference

### 🔧 **Implementation Details**

#### Theme Context
- Located in `frontend/src/contexts/ThemeContext.tsx`
- Provides theme state management across the application
- Automatically saves theme preference to localStorage
- Listens for system theme changes when "System" is selected

#### Theme Toggle Component
- Located in `frontend/src/components/ui/ThemeToggle.tsx`
- Dropdown interface for theme selection
- Available in the dashboard header
- Smooth animations and modern glass morphism design

#### CSS Variables
The theme system uses CSS custom properties for consistent theming:

```css
:root {
  /* Light theme variables */
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --glass-bg: rgba(255, 255, 255, 0.25);
  --glass-border: rgba(255, 255, 255, 0.18);
}

.dark {
  /* Dark theme variables */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --glass-bg: rgba(0, 0, 0, 0.25);
  --glass-border: rgba(255, 255, 255, 0.1);
}
```

### 🎯 **Usage**

#### Using the Theme Hook
```tsx
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  )
}
```

#### Theme-Aware Styling
Use Tailwind's dark mode classes:
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content that adapts to theme
</div>
```

#### Glass Morphism Components
Use the predefined glass classes that automatically adapt to themes:
```tsx
<div className="glass-card">
  <h2 className="card-title">Themed Glass Card</h2>
</div>
```

### 📱 **Settings Integration**

The theme selector is integrated into the Settings page under the "Preferences" tab, providing users with:
- Visual theme preview cards
- Descriptive text for each theme option
- Immediate theme switching
- Persistent theme storage

### 🔄 **System Theme Detection**

When "System" theme is selected:
- Automatically detects the user's OS theme preference
- Listens for system theme changes in real-time
- Updates the application theme accordingly
- Provides seamless experience across different times of day

### ✨ **Modern Design Features**

- **Smooth Transitions**: All theme changes include smooth color transitions
- **Glass Morphism**: Backdrop blur effects that adapt to light/dark themes
- **Gradient Backgrounds**: Dynamic gradients that work in both themes
- **Consistent Branding**: Theme colors maintain brand identity
- **Accessibility**: High contrast ratios in both light and dark modes

## File Structure

```
frontend/src/
├── contexts/
│   └── ThemeContext.tsx          # Theme context and provider
├── components/
│   └── ui/
│       └── ThemeToggle.tsx       # Theme selection dropdown
├── app/
│   ├── globals.css               # Theme CSS variables and styles
│   └── settings/
│       └── page.tsx              # Settings page with theme selector
└── components/
    └── providers/
        └── Providers.tsx         # App providers including ThemeProvider
```

## Browser Support

The theme system supports all modern browsers with:
- CSS custom properties
- `prefers-color-scheme` media query
- Local storage
- CSS backdrop-filter (with fallbacks)

## Future Enhancements

Potential future improvements:
- Custom theme colors
- High contrast mode
- Reduced motion preferences
- Theme scheduling (automatic day/night switching)
- Per-component theme overrides