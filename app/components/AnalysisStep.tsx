'use client';

import { Analysis } from '../config/types';
import { Button } from './ui/Button';

interface AnalysisStepProps {
  analysis: Analysis | null;
  isAnalyzing: boolean;
  perspectiveTitle: string;
  onReset: () => void;
}

// Icons
const PerspectiveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const TipsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export default function AnalysisStep({
  analysis,
  isAnalyzing,
  perspectiveTitle,
  onReset,
}: AnalysisStepProps) {
  if (isAnalyzing) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-4 bg-slate-900">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-300 font-medium">Pratiro analyserer samtalen...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center bg-slate-900">
        <p className="text-red-400">Noe gikk galt. Prøv igjen.</p>
        <Button onClick={onReset} className="mt-4">
          Start på nytt
        </Button>
      </div>
    );
  }

  // Determine score color
  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-900">
      <div className="max-w-2xl mx-auto space-y-8 fade-in">
        {/* Header Score */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-full shadow-md mb-4 border-4 border-emerald-500/30">
            <span className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
              {analysis.score}
            </span>
            <span className="text-xs text-slate-500 ml-1">/10</span>
          </div>
          <h2 className="text-2xl font-brand font-bold text-white mb-2">
            Pratiro Veiledning
          </h2>
          <p className="text-slate-400 italic">&ldquo;{analysis.mainFeedback}&rdquo;</p>
        </div>

        {/* Perspective Box */}
        {analysis.perspective && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-emerald-500/10 w-16 h-16 rounded-full blur-xl opacity-50" />
            <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
              <PerspectiveIcon /> {perspectiveTitle}
            </h3>
            <p className="text-slate-200 leading-relaxed">{analysis.perspective}</p>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-slate-800/50 p-6 rounded-2xl shadow-sm border border-white/10">
            <h3 className="text-green-400 font-bold text-sm uppercase mb-4 flex items-center gap-2">
              <StarIcon /> Bra jobba!
            </h3>
            {analysis.strengths.length > 0 ? (
              <ul className="space-y-2">
                {analysis.strengths.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-200">
                    <span className="text-green-400 shrink-0">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Ingen styrker identifisert.</p>
            )}
          </div>

          {/* Improvements */}
          <div className="bg-slate-800/50 p-6 rounded-2xl shadow-sm border border-white/10">
            <h3 className="text-emerald-400 font-bold text-sm uppercase mb-4 flex items-center gap-2">
              <TipsIcon /> Prøv dette neste gang
            </h3>
            {analysis.improvements.length > 0 ? (
              <ul className="space-y-2">
                {analysis.improvements.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-200">
                    <span className="text-emerald-400 shrink-0">→</span>
                    {point}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Ingen forbedringsområder identifisert.</p>
            )}
          </div>
        </div>

        {/* Reset button */}
        <div className="text-center pt-6">
          <Button onClick={onReset} size="lg">
            Øv på en ny situasjon
          </Button>
        </div>
      </div>
    </div>
  );
}
