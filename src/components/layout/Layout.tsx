import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import KeyboardShortcutsModal from '../shared/KeyboardShortcutsModal';
import FocusTimer from '../shared/FocusTimer';
import ErrorBoundary from '../shared/ErrorBoundary';
import SupportModal from '../shared/SupportModal';
import { APP_CONFIG } from '../../config/appConfig';
import { useAppStore } from '../../store/appStore';
import { useStreak } from '../../hooks/useStreak';

const navItems = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/addition', label: 'Add / Sub', icon: '±' },
  { to: '/multiplication', label: 'Multiply', icon: '×' },
  { to: '/division', label: 'Division', icon: '÷' },
  { to: '/worksheet', label: 'Worksheet', icon: '📋' },
  { to: '/custom-worksheet', label: 'Custom', icon: '✎' },
  { to: '/memory', label: 'Brain Games', icon: '🧠' },
  { to: '/abacus', label: 'Abacus', icon: '⚬' },
  { to: '/tutorials', label: 'Tutorials', icon: '📖' },
  { to: '/timed-challenge', label: 'Timed', icon: '⏱' },
  { to: '/benefits', label: 'Benefits', icon: '🎯' },
];

export default function Layout() {
  const { cycle, theme } = useTheme(APP_CONFIG.theme.default);
  const { showHelp, closeHelp, toggleHelp } = useKeyboardShortcuts({
    onToggleSound: () => useAppStore.getState().toggleSound(),
    onCycleMode: () => {
      const modes = ['normal', 'speed', 'zen'] as const;
      const cur = useAppStore.getState().gameMode;
      const idx = modes.indexOf(cur);
      useAppStore.getState().setGameMode(modes[(idx + 1) % modes.length]);
    },
  });
  const [focusTimerOpen, setFocusTimerOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const toggleSound = useAppStore((s) => s.toggleSound);
  const gameMode = useAppStore((s) => s.gameMode);
  const setGameMode = useAppStore((s) => s.setGameMode);
  const { currentStreak, bestStreak, hasPracticedToday } = useStreak();
  const [streakPopover, setStreakPopover] = useState(false);

  const modeIcon = gameMode === 'speed' ? '⚡' : gameMode === 'zen' ? '🧘' : '▶';
  const nextMode = () => {
    const modes = ['normal', 'speed', 'zen'] as const;
    const idx = modes.indexOf(gameMode);
    setGameMode(modes[(idx + 1) % modes.length]);
  };

  const themeIcon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '◐';

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <header className="bg-surface border-b border-gray-700 px-4 py-3 flex items-center justify-between gap-2">
        <NavLink to="/" className="text-xl font-bold tracking-tight shrink-0">
          <span className="text-primary">{APP_CONFIG.app.nameFirst}</span>
          <span className="text-accent">{APP_CONFIG.app.nameSecond}</span>
        </NavLink>
        <div className="flex items-center gap-1 shrink-0">
          {currentStreak >= 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setStreakPopover((o) => !o)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light flex items-center gap-1"
                title={`${currentStreak} day streak`}
                aria-label="Practice streak"
              >
                <span className="text-lg" aria-hidden>🔥</span>
                <span className="text-sm font-bold text-orange-400">{currentStreak}</span>
              </button>
              {streakPopover && (
                <div className="absolute right-0 top-full mt-1 bg-surface border border-gray-700 rounded-lg shadow-xl p-3 z-50 w-48 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-gray-400">Current streak</span><span className="font-bold text-orange-400">{currentStreak} days</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Best streak</span><span className="font-bold text-yellow-400">{bestStreak} days</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Practiced today</span><span className={`font-bold ${hasPracticedToday ? 'text-green-400' : 'text-red-400'}`}>{hasPracticedToday ? 'Yes' : 'Not yet'}</span></div>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={cycle}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light"
            title={`Theme: ${theme}`}
            aria-label="Cycle theme"
          >
            <span className="text-lg" aria-hidden>
              {themeIcon}
            </span>
          </button>
          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light"
            title={soundEnabled ? 'Sound on' : 'Sound off'}
            aria-label="Toggle sound"
          >
            <span className="text-lg" aria-hidden>{soundEnabled ? '🔊' : '🔇'}</span>
          </button>
          <button
            type="button"
            onClick={nextMode}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light flex items-center gap-1"
            title={`Mode: ${APP_CONFIG.gameModes[gameMode].label}`}
            aria-label="Cycle game mode"
          >
            <span className="text-lg" aria-hidden>{modeIcon}</span>
            <span className="text-[10px] font-bold uppercase hidden sm:inline">{gameMode}</span>
          </button>
          <button
            type="button"
            onClick={toggleHelp}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light font-mono text-sm font-bold"
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            ?
          </button>
          <button
            type="button"
            onClick={() => setFocusTimerOpen((o) => !o)}
            className={`p-2 rounded-lg text-sm ${focusTimerOpen ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-surface-light'}`}
            title="Focus timer"
            aria-label="Toggle focus timer"
          >
            ⏲
          </button>
        </div>
        <nav className="hidden md:flex gap-1 flex-1 justify-end min-w-0">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white hover:bg-surface-light'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <nav className="md:hidden bg-surface border-b border-gray-700 px-2 py-2 flex gap-1 overflow-x-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-surface-light'
              }`
            }
          >
            <span className="mr-1">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {focusTimerOpen && (
        <div className="focus-timer-panel fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6">
          <FocusTimer />
        </div>
      )}

      {showHelp && <KeyboardShortcutsModal onClose={closeHelp} />}
      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}

      <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full outline-none">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <footer className="bg-surface border-t border-gray-700 px-4 py-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <span>&copy; {new Date().getFullYear()} {APP_CONFIG.app.name} &middot; Free Brain Training</span>
          <div className="flex items-center gap-4">
            <NavLink to="/privacy" className="hover:text-gray-300 transition-colors">
              Privacy Policy
            </NavLink>
            {APP_CONFIG.donation.enabled && (
              <button
                type="button"
                onClick={() => setSupportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors font-medium"
              >
                <span aria-hidden>❤️</span> Support Us
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
