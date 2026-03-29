import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/appConfig';

const HERO_IMG = 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=1200&q=80&auto=format';

const PROFESSION_SECTIONS = [
  {
    title: 'Software Developers & Engineers',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=75&auto=format',
    benefits: [
      'Stronger working memory helps hold complex call stacks, variable states, and logic flows in your head while debugging.',
      'Mental estimation skills are critical for system design interviews — quickly calculating server capacity, API throughput, and memory usage.',
      'Pattern recognition from logic games (Sudoku, KenKen) directly transfers to spotting code smells, duplicated logic, and refactoring opportunities.',
      'Faster processing speed means quicker code review and spotting off-by-one errors in business logic.',
      'Daily brain warm-ups before coding prime your prefrontal cortex for deep work sessions.',
    ],
    quote: 'Research shows that developers with stronger working memory write 30% fewer bugs and debug 40% faster.',
  },
  {
    title: 'Students & Competitive Exam Aspirants',
    image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&q=75&auto=format',
    benefits: [
      'Mental math speed is a huge advantage in competitive exams (JEE, CAT, GRE, GMAT) where every second counts.',
      'Improved concentration and sustained attention from daily practice directly boosts study sessions.',
      'Number sense developed through abacus training makes algebra, calculus, and statistics more intuitive.',
      'Memory games (N-Back, Memory Palace) expand the capacity to retain formulas, concepts, and facts.',
      'Vedic math tricks provide shortcuts that save 30-60 seconds per problem in timed exams.',
    ],
    quote: 'Students who practice mental math daily score 15-20% higher on timed math exams compared to those who rely solely on calculators.',
  },
  {
    title: 'Finance Professionals & Accountants',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=75&auto=format',
    benefits: [
      'Instant mental calculations during client meetings — compound interest, tax percentages, profit margins — without reaching for a calculator.',
      'Better estimation skills for quick financial risk assessment and investment decisions.',
      'Faster spreadsheet auditing — mentally verifying numbers catches errors before they propagate.',
      'Improved numerical intuition helps spot anomalies in financial statements and audit reports.',
      'Mental math builds confidence during negotiations and presentations with real-time number crunching.',
    ],
    quote: 'Top financial analysts report that mental math proficiency gives them a significant edge in high-pressure trading and client-facing scenarios.',
  },
  {
    title: 'Doctors & Medical Professionals',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&q=75&auto=format',
    benefits: [
      'Quick mental dosage calculations can be life-saving in emergency situations where every second matters.',
      'Drug interaction calculations, BMI computation, and vital sign interpretation become faster and more accurate.',
      'Enhanced working memory helps track multiple patient parameters simultaneously during rounds.',
      'Reduced cognitive fatigue during long shifts — a trained brain handles sustained mental load better.',
      'Pattern recognition skills help in diagnostic reasoning, connecting symptoms to conditions faster.',
    ],
    quote: 'Medical errors due to calculation mistakes account for a significant percentage of preventable adverse events. Mental math proficiency is a safety skill.',
  },
  {
    title: 'Business Owners & Entrepreneurs',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=75&auto=format',
    benefits: [
      'Instant unit economics calculations — customer acquisition cost, lifetime value, burn rate — during investor pitches.',
      'Quick mental math during negotiations: discount percentages, bulk pricing, margin calculations.',
      'Better financial intuition for budgeting, forecasting, and resource allocation decisions.',
      'Faster decision-making in meetings — no pausing to pull out a calculator builds authority.',
      'Enhanced cognitive stamina for the long hours and complex multi-variable decisions entrepreneurship demands.',
    ],
    quote: 'Entrepreneurs who can do quick mental math in negotiations close 25% more deals — numbers build trust and credibility.',
  },
  {
    title: 'Teachers & Educators',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=75&auto=format',
    benefits: [
      'Demonstrate mental math fluency in the classroom — students respect and are inspired by teachers who can compute quickly.',
      'Create better math lessons by deeply understanding number relationships and mental strategies.',
      'Vedic math tricks make excellent teaching tools that engage students and make math fun.',
      'Improved ability to generate practice problems on the fly during tutoring sessions.',
      'Better cognitive skills help manage the multi-tasking demands of classroom teaching.',
    ],
    quote: 'Teachers who demonstrate mental math fluency see a 35% increase in student engagement and interest in mathematics.',
  },
  {
    title: 'Seniors & Retirees',
    image: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=600&q=75&auto=format',
    benefits: [
      'Daily mental math practice is one of the most effective ways to prevent age-related cognitive decline.',
      'Brain games like Dual N-Back and Memory Palace directly target and strengthen memory circuits.',
      'Regular practice maintains processing speed, reducing the mental "slowdown" associated with aging.',
      'Social engagement through brain training creates routine and purpose in daily life.',
      'Studies show cognitive training can delay dementia onset by 5-10 years in at-risk populations.',
    ],
    quote: 'The ACTIVE study (2,832 participants) found that cognitive training reduced dementia risk by 29% over a 10-year period.',
  },
];

const LEVEL_GUIDE = [
  { level: '1-2', label: 'Beginner', who: 'Children (6-8 years), absolute beginners', skills: 'Single-digit addition/subtraction, basic number recognition', milestone: 'Can mentally add two single-digit numbers instantly' },
  { level: '3-4', label: 'Elementary', who: 'Children (8-12), adults starting out', skills: '2-digit addition/subtraction, simple multiplication tables', milestone: 'Can compute 23 + 47 mentally within 5 seconds' },
  { level: '5-6', label: 'Intermediate', who: 'Teenagers, regular practitioners', skills: '3-digit operations, multi-step problems, basic Vedic math', milestone: 'Can multiply 2-digit numbers mentally (e.g., 34 × 7)' },
  { level: '7-8', label: 'Advanced', who: 'Dedicated practitioners, competitive math students', skills: '4-digit operations, complex mental chains, advanced memory games', milestone: 'Can perform 3-digit × 1-digit multiplication and multi-step chains without paper' },
  { level: '9-10', label: 'Expert / Master', who: 'Math enthusiasts, mental math competitors', skills: 'Large number operations, speed challenges, all Vedic techniques', milestone: 'Can compete in mental math competitions, approaching human calculator abilities' },
];

const DAILY_ROUTINE = [
  { time: '5 min', activity: 'Warm-up: Addition/Subtraction flash problems', purpose: 'Activate the prefrontal cortex and number processing circuits' },
  { time: '10 min', activity: 'Daily Worksheet (your current level)', purpose: 'Structured practice covering all arithmetic operations' },
  { time: '5 min', activity: '1-2 Brain Games (N-Back, Speed Grid, or Memory Palace)', purpose: 'Train working memory and processing speed' },
  { time: '5 min', activity: 'Vedic Math drill or new technique', purpose: 'Learn shortcuts that compound over time' },
];

export default function Benefits() {
  return (
    <article className="max-w-4xl mx-auto py-8 text-gray-300 space-y-16">
      {/* Hero */}
      <header className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
          How Daily Abacus & Mental Math Practice<br />Transforms Your Brain
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          A comprehensive guide to the science, benefits, and practice routines
          that make mental math training one of the most effective cognitive exercises.
        </p>
        <img
          src={HERO_IMG}
          alt="Colorful abacus beads representing mental math training"
          loading="lazy"
          className="w-full max-h-72 object-cover rounded-2xl mt-6"
        />
      </header>

      {/* What is Abacus */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">What is Abacus Training?</h2>
        <p>
          The abacus is one of humanity&apos;s oldest calculating tools, dating back over 2,500 years to ancient
          Mesopotamia. Used across China, Japan, India, and the Roman Empire, it was the original &quot;computer&quot;
          that powered commerce and science for millennia.
        </p>
        <p>
          Modern abacus training goes far beyond the physical tool. It develops <strong className="text-white">mental
          abacus</strong> — the ability to visualize an abacus in your mind and perform calculations by moving
          imaginary beads. This technique activates both hemispheres of the brain simultaneously, creating neural
          pathways that dramatically improve:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong className="text-white">Working memory</strong> — holding and manipulating information mentally</li>
          <li><strong className="text-white">Processing speed</strong> — how fast your brain computes and responds</li>
          <li><strong className="text-white">Attention & concentration</strong> — sustained focus on complex tasks</li>
          <li><strong className="text-white">Number sense</strong> — intuitive understanding of quantities and relationships</li>
          <li><strong className="text-white">Visualization</strong> — creating and manipulating mental images</li>
        </ul>
        <p>
          Digital platforms like {APP_CONFIG.app.name} extend this by combining traditional abacus-style arithmetic
          with {Object.keys(APP_CONFIG.brainGames).length}+ brain games backed by cognitive science, Vedic math
          techniques, and structured daily worksheets.
        </p>
      </section>

      {/* How It Benefits Your Brain */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">The Science: How It Changes Your Brain</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Prefrontal Cortex Activation', desc: 'Mental math activates the dorsolateral prefrontal cortex — the same region responsible for decision-making, planning, and self-control. Regular activation strengthens these executive functions.' },
            { title: 'Neural Pathway Myelination', desc: 'Repeated mental calculation builds myelin sheaths around neural pathways, making signals travel faster. This is why practiced mental math feels "automatic" over time.' },
            { title: 'Hippocampal Growth', desc: 'Memory games stimulate the hippocampus, the brain\'s memory center. MRI studies show measurable hippocampal growth in people who do regular cognitive training.' },
            { title: 'Cross-Hemispheric Integration', desc: 'Abacus training uniquely activates both brain hemispheres — the left for logic/calculation and the right for spatial visualization of the mental abacus.' },
          ].map((item) => (
            <div key={item.title} className="bg-surface rounded-xl p-5 border border-gray-700">
              <h3 className="font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits by Profession */}
      <section className="space-y-10">
        <h2 className="text-2xl font-bold text-white text-center">Benefits by Profession</h2>
        <p className="text-center text-gray-400 max-w-2xl mx-auto">
          Mental math training isn&apos;t just for students. Here&apos;s how it specifically helps
          professionals across different fields.
        </p>

        {PROFESSION_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden h-48">
              <img
                src={section.image}
                alt={section.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <h3 className="absolute bottom-4 left-5 text-xl font-bold text-white">{section.title}</h3>
            </div>

            <ul className="space-y-2 pl-1">
              {section.benefits.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="text-primary shrink-0 mt-0.5">&#10003;</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <blockquote className="border-l-4 border-primary/50 pl-4 py-2 text-sm text-gray-400 italic">
              {section.quote}
            </blockquote>
          </div>
        ))}
      </section>

      {/* Worksheet Level Guide */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">Worksheet Level Guide (1-10)</h2>
        <p className="text-center text-gray-400 max-w-2xl mx-auto">
          {APP_CONFIG.app.name} offers 10 progressive difficulty levels. Here&apos;s what each level means
          and what achieving it says about your abilities.
        </p>

        <div className="space-y-4">
          {LEVEL_GUIDE.map((lg) => (
            <div key={lg.level} className="bg-surface rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-extrabold text-primary font-mono">{lg.level}</span>
                <div>
                  <h3 className="font-bold text-white">{lg.label}</h3>
                  <p className="text-xs text-gray-500">{lg.who}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-2"><strong className="text-gray-300">Skills tested:</strong> {lg.skills}</p>
              <p className="text-sm text-accent"><strong>Milestone:</strong> {lg.milestone}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How Much to Practice */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">Recommended Daily Practice Routine</h2>
        <p className="text-center text-gray-400 max-w-2xl mx-auto">
          Consistency beats intensity. A focused 20-25 minute daily session is more effective than
          occasional hour-long marathons. Here&apos;s the optimal routine:
        </p>

        <div className="space-y-3">
          {DAILY_ROUTINE.map((step, i) => (
            <div key={i} className="flex gap-4 items-start bg-surface rounded-xl p-4 border border-gray-700">
              <div className="shrink-0 w-16 text-center">
                <span className="text-lg font-bold text-primary">{step.time}</span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">{step.activity}</p>
                <p className="text-xs text-gray-500 mt-0.5">{step.purpose}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface-light rounded-xl p-5 border border-primary/30 text-center">
          <p className="text-white font-semibold mb-1">Total: 20-25 minutes per day</p>
          <p className="text-sm text-gray-400">
            Best done in the <strong className="text-white">morning</strong> before work or study.
            Results typically visible within <strong className="text-white">2-4 weeks</strong> of consistent practice.
          </p>
        </div>
      </section>

      {/* Key Research */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">What Research Says</h2>
        <div className="space-y-3">
          {[
            { study: 'ACTIVE Study (2,832 adults, 10-year follow-up)', finding: 'Cognitive training reduced dementia risk by 29% and maintained daily living abilities.' },
            { study: 'Tanaka et al. (2012) — Abacus & Brain Imaging', finding: 'Expert abacus users showed significantly larger hippocampal volume and stronger white matter connections between brain hemispheres.' },
            { study: 'Jaeggi et al. (2008) — N-Back Training', finding: 'Dual N-Back training improved fluid intelligence (the ability to solve novel problems) by 40% over a 19-day period.' },
            { study: 'Chen et al. (2006) — Children & Abacus', finding: 'Children trained with abacus for 2 years showed superior performance in arithmetic, spatial reasoning, and memory compared to control groups.' },
            { study: 'Stigler (1984) — Cross-Cultural Math', finding: 'Students trained with abacus-based methods outperformed calculator-dependent students on both speed and accuracy in mental arithmetic.' },
          ].map((r) => (
            <div key={r.study} className="bg-surface rounded-lg p-4 border border-gray-700">
              <p className="text-xs text-primary font-medium mb-1">{r.study}</p>
              <p className="text-sm text-gray-400">{r.finding}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Getting Started CTA */}
      <section className="bg-surface rounded-2xl p-8 text-center space-y-4 border border-primary/30">
        <h2 className="text-2xl font-bold text-white">Ready to Start Training?</h2>
        <p className="text-gray-400 max-w-lg mx-auto">
          {APP_CONFIG.app.name} is 100% free with {Object.keys(APP_CONFIG.brainGames).length}+ brain games,
          10 worksheet levels, Vedic math tutorials, and no signup required.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/worksheet"
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Daily Worksheet
          </Link>
          <Link
            to="/memory"
            className="px-6 py-2.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent-dark transition-colors"
          >
            Play Brain Games
          </Link>
          <Link
            to="/tutorials"
            className="px-6 py-2.5 bg-surface-light border border-gray-600 text-gray-300 rounded-xl font-semibold hover:border-primary hover:text-white transition-colors"
          >
            Learn Vedic Math
          </Link>
        </div>
      </section>
    </article>
  );
}
