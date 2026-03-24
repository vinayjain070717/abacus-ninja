interface Props {
  onClose: () => void;
}

const shortcuts = [
  { key: '?', description: 'Toggle this help' },
  { key: 'Enter', description: 'Submit answer' },
  { key: 'N', description: 'Skip to next round (during feedback)' },
  { key: 'Escape', description: 'Close modal / Go back' },
  { key: '1-4', description: 'Select choice (in choice games)' },
];

export default function KeyboardShortcutsModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-6 max-w-sm w-full mx-4 border border-gray-700" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-primary mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-3">
          {shortcuts.map(s => (
            <div key={s.key} className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{s.description}</span>
              <kbd className="px-2 py-1 bg-surface-light rounded text-xs font-mono border border-gray-600">{s.key}</kbd>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2 bg-primary rounded-lg font-semibold text-sm hover:bg-primary-dark">
          Close
        </button>
      </div>
    </div>
  );
}
