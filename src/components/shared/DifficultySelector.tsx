import type { Difficulty } from '../../config/appConfig';

const OPTIONS: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: 'bg-green-600 text-white' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-600 text-white' },
  { value: 'hard', label: 'Hard', color: 'bg-red-600 text-white' },
];

export default function DifficultySelector({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
              value === opt.value ? opt.color : 'bg-surface-light text-gray-400 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
