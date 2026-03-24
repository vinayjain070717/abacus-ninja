import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/appConfig';
import { getDailyChallenge } from '../utils/dailyChallenge';

const cards = [
  {
    to: '/addition',
    title: 'Addition & Subtraction',
    desc: 'Flash Anzan & Static modes',
    color: 'from-blue-600 to-blue-800',
    icon: '±',
  },
  {
    to: '/multiplication',
    title: 'Multiplication',
    desc: 'All digit combinations',
    color: 'from-green-600 to-green-800',
    icon: '×',
  },
  {
    to: '/division',
    title: 'Division',
    desc: 'With & without remainder',
    color: 'from-purple-600 to-purple-800',
    icon: '÷',
  },
  {
    to: '/worksheet',
    title: 'Daily Worksheet',
    desc: 'Auto-generated & timed',
    color: 'from-orange-600 to-orange-800',
    icon: '📋',
  },
  {
    to: '/memory',
    title: 'Brain Games',
    desc: `${Object.keys(APP_CONFIG.brainGames).length} brain training games`,
    color: 'from-pink-600 to-pink-800',
    icon: '🧠',
  },
  {
    to: '/tutorials',
    title: 'Vedic Math & Tutorials',
    desc: 'Ancient tricks for lightning math',
    color: 'from-cyan-600 to-cyan-800',
    icon: '📖',
  },
];

const features = [
  { icon: '🧮', title: 'Mental Math Practice', desc: 'Addition, subtraction, multiplication & division with configurable difficulty' },
  { icon: '🧠', title: `${Object.keys(APP_CONFIG.brainGames).length}+ Brain Games`, desc: 'Memory, logic, speed & arithmetic games with easy, medium & hard modes' },
  { icon: '📋', title: 'Daily Worksheets', desc: 'Auto-generated level-based worksheets (1-10) with arithmetic & brain games' },
  { icon: '📐', title: 'Vedic Math Tricks', desc: '16 chapters of ancient Indian math techniques with interactive drills' },
  { icon: '🎯', title: 'Daily Challenge', desc: 'A new brain game challenge every day to keep your streak going' },
  { icon: '🔒', title: 'No Signup Required', desc: 'Start training instantly — no account, no data collection, 100% private' },
];

export default function Home() {
  const { nameFirst, nameSecond, tagline } = APP_CONFIG.app;
  const challenge = getDailyChallenge();
  const gameConfig = APP_CONFIG.brainGames[challenge.gameId as keyof typeof APP_CONFIG.brainGames];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-4">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
          <span className="text-primary">{nameFirst}</span>
          <span className="text-accent">{nameSecond}</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">{tagline}</p>
        <div className="flex gap-3 justify-center mt-6">
          <Link
            to="/worksheet"
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Daily Worksheet
          </Link>
          <Link
            to="/memory"
            className="px-6 py-2.5 bg-surface border border-gray-600 text-gray-300 rounded-xl font-semibold hover:border-primary hover:text-white transition-colors"
          >
            Explore Games
          </Link>
        </div>
      </section>

      {/* Daily Challenge */}
      {APP_CONFIG.dailyChallenge.enabled && (
        <section className="bg-surface rounded-2xl p-6 border border-primary/30">
          <h2 className="text-lg font-bold text-primary mb-2">🎯 Today&apos;s Challenge</h2>
          <p className="text-gray-400 text-sm mb-1">{gameConfig?.label ?? challenge.gameId}</p>
          <p className="text-gray-500 text-xs mb-4">{gameConfig?.description}</p>
          <Link
            to={`/memory?game=${challenge.gameId}`}
            className="inline-block px-6 py-2 bg-accent rounded-lg font-semibold hover:bg-accent-dark text-sm"
          >
            Play Now
          </Link>
        </section>
      )}

      {/* Main Feature Cards */}
      <section>
        <h2 className="sr-only">Practice Areas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className={`block bg-gradient-to-br ${card.color} rounded-xl p-6 hover:scale-[1.02] transition-transform`}
            >
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="text-lg font-bold mb-1">{card.title}</h3>
              <p className="text-sm text-white/70">{card.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features List -- crawlable text for SEO */}
      <section className="bg-surface rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Why {APP_CONFIG.app.name}?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="flex gap-3">
              <span className="text-2xl shrink-0" aria-hidden>{f.icon}</span>
              <div>
                <h3 className="font-semibold text-white text-sm">{f.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEO text block -- hidden for visual users but visible to crawlers via sr-only would hide it;
          instead we make it subtle but real content users might read */}
      <section className="text-center text-gray-500 text-xs space-y-2 pb-4">
        <p>
          {APP_CONFIG.app.name} is a free online mental math and brain training platform. Practice addition,
          subtraction, multiplication, and division with customizable speed and difficulty. Play {Object.keys(APP_CONFIG.brainGames).length}+ brain
          games including Number Memory, Dual N-Back, Sudoku, KenKen, Kakuro, and more. Learn Vedic math
          tricks from 16 chapters with interactive drills. Generate daily worksheets across 10 difficulty levels.
          No signup, no ads, no data collection. Works offline as a PWA.
        </p>
      </section>
    </div>
  );
}
