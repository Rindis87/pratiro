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
      <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-4 bg-[#FDFCFB]">
        <div className="w-16 h-16 border-4 border-[rgba(42,64,54,0.15)] border-t-[#2A4036] rounded-full animate-spin" />
        <p className="text-[#5C5F5C] font-medium">Pratiro analyserer samtalen...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center bg-[#FDFCFB]">
        <p className="text-red-600">Noe gikk galt. Prøv igjen.</p>
        <Button onClick={onReset} className="mt-4">
          Start på nytt
        </Button>
      </div>
    );
  }

  // Determine score color
  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-amber-600';
    return 'text-[#2A4036]';
  };

  return (
    <div className="flex-1 min-h-0 p-4 md:p-8 overflow-y-auto bg-[#FDFCFB]">
      <div className="max-w-2xl mx-auto space-y-8 fade-in-up">
        {/* Header Score */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-[0_10px_30px_-5px_rgba(42,64,54,0.1)] mb-4 border-4 border-[rgba(42,64,54,0.15)]">
            <span className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
              {analysis.score}
            </span>
            <span className="text-xs text-[#7D786D] ml-1">/10</span>
          </div>
          <h2 className="text-2xl font-sans font-bold text-[#2A4036] mb-2">
            Pratiro Veiledning
          </h2>
          <p className="text-[#5C5F5C] italic">&ldquo;{analysis.mainFeedback}&rdquo;</p>
        </div>

        {/* Perspective Box */}
        {analysis.perspective && (
          <div className="bg-[rgba(42,64,54,0.04)] border border-[rgba(42,64,54,0.12)] p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-[rgba(42,64,54,0.06)] w-16 h-16 rounded-full blur-xl opacity-50" />
            <h3 className="text-[#2A4036] font-bold text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
              <PerspectiveIcon /> {perspectiveTitle}
            </h3>
            <p className="text-[#252825] leading-relaxed">{analysis.perspective}</p>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/[0.06]">
            <h3 className="text-green-700 font-bold text-sm uppercase mb-4 flex items-center gap-2">
              <StarIcon /> Bra jobba!
            </h3>
            {analysis.strengths.length > 0 ? (
              <ul className="space-y-2">
                {analysis.strengths.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[#252825]">
                    <span className="text-green-600 shrink-0">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#7D786D]">Ingen styrker identifisert.</p>
            )}
          </div>

          {/* Improvements */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/[0.06]">
            <h3 className="text-[#2A4036] font-bold text-sm uppercase mb-4 flex items-center gap-2">
              <TipsIcon /> Prøv dette neste gang
            </h3>
            {analysis.improvements.length > 0 ? (
              <ul className="space-y-2">
                {analysis.improvements.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[#252825]">
                    <span className="text-[#4A6359] shrink-0">→</span>
                    {point}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#7D786D]">Ingen forbedringsområder identifisert.</p>
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
