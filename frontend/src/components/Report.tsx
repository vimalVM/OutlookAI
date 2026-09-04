import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from './ui/Button';
import { Loader2, ArrowLeft, TrendingUp, AlertTriangle, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Circular progress ring component
function ScoreCircle({ percent, size = 80, stroke = 6, label }: { percent: number; size?: number; stroke?: number; label?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const getColor = (p: number) => {
    if (p >= 75) return '#22c55e'; // green
    if (p >= 50) return '#eab308'; // yellow
    if (p >= 25) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const color = getColor(percent);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-outline/10"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <motion.span
          className="absolute inset-0 flex items-center justify-center font-bold"
          style={{ color, fontSize: size * 0.22 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {percent}%
        </motion.span>
      </div>
      {label && <span className="text-[10px] font-label-caps text-on-surface-variant mt-1">{label}</span>}
    </div>
  );
}

export function Report() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sessions/${id}/report`)
      .then(res => {
        setReport(res.data.report);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        navigate('/');
      });
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-on-surface-variant">Report not available for this session.</p>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    );
  }

  const bandConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    strong: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', label: 'Strong' },
    comfortable: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30', label: 'Comfortable' },
    developing: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', label: 'Developing' },
  };

  const bandStyle = bandConfig[report.confidenceBand] || bandConfig.developing;
  const overallScore = report.overallScore ?? 0;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
        <h1 className="font-headline-xl text-on-surface mb-2">Interview Report</h1>
        <p className="text-on-surface-variant font-body-md">Session ID: {id?.slice(0, 8)}</p>
      </div>

      <div className="space-y-8">
        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-sm font-label-caps text-outline mb-3">OVERALL PERFORMANCE</h2>
              <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-3", bandStyle.bg, bandStyle.text, 'border', bandStyle.border)}>
                {bandStyle.label}
              </div>
              <p className="text-on-surface-variant text-sm mt-2 max-w-md">
                {overallScore >= 75
                  ? 'Excellent performance! You demonstrated strong knowledge across the questions.'
                  : overallScore >= 50
                  ? 'Good effort. With more preparation on specific areas, you can improve further.'
                  : overallScore >= 25
                  ? 'Some key concepts were missed. Review the breakdown below for targeted improvement.'
                  : 'Consider revisiting the fundamentals of this domain before your next attempt.'}
              </p>
            </div>
            <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
              <ScoreCircle percent={overallScore} size={120} stroke={8} />
            </div>
          </div>
        </motion.div>

        {/* Strengths & Growth */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 rounded-xl border-t-2 border-t-green-500/50"
          >
            <h3 className="flex items-center gap-2 font-headline-md text-on-surface mb-4">
              <TrendingUp className="h-5 w-5 text-green-500" /> Key Strengths
            </h3>
            <ul className="space-y-3">
              {report.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-on-surface-variant text-sm leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-6 rounded-xl border-t-2 border-t-orange-500/50"
          >
            <h3 className="flex items-center gap-2 font-headline-md text-on-surface mb-4">
              <AlertTriangle className="h-5 w-5 text-orange-500" /> Areas for Growth
            </h3>
            <ul className="space-y-3">
              {report.growthAreas.length > 0 ? report.growthAreas.map((g: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <XCircle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <span className="text-on-surface-variant text-sm leading-relaxed">{g}</span>
                </li>
              )) : (
                <li className="text-on-surface-variant text-sm">No major growth areas identified — great job!</li>
              )}
            </ul>
          </motion.div>
        </div>

        {report.deliveryPatternFlag && (
          <div className="glass-panel p-6 rounded-xl bg-surface-tint/5 border-primary/20">
            <h4 className="font-label-caps text-primary mb-2">DELIVERY OBSERVATION</h4>
            <p className="text-on-surface text-sm">{report.deliveryPatternNote}</p>
          </div>
        )}

        {/* Question Breakdown */}
        <div>
          <h3 className="font-headline-md text-on-surface mb-6 mt-12">Question Breakdown</h3>
          <div className="space-y-6">
            {report.perQuestionBreakdown.map((q: any, i: number) => {
              const qBandStyle = bandConfig[q.contentBand] || bandConfig.developing;
              const qPercent = q.correctnessPercent ?? 0;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  className="glass-panel p-6 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-label-caps text-outline">QUESTION {i + 1}</span>
                        <span className={cn("text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full", qBandStyle.bg, qBandStyle.text, 'border', qBandStyle.border)}>
                          {q.contentBand}
                        </span>
                      </div>
                      <p className="text-on-surface font-medium mb-3">{q.questionText}</p>
                    </div>
                    {/* Per-question score circle */}
                    <div className="relative flex items-center justify-center shrink-0" style={{ width: 56, height: 56 }}>
                      <ScoreCircle percent={qPercent} size={56} stroke={4} />
                    </div>
                  </div>
                  
                  {/* AI Reasoning */}
                  {q.reasoning && (
                    <div className="mt-4 p-4 rounded-lg bg-surface-container-high/50 border border-outline/10">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-label-caps text-primary">AI ANALYSIS</span>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{q.reasoning}</p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-outline/10">
                    <div>
                      <h5 className="text-xs font-label-caps text-green-500 mb-2">STRENGTHS</h5>
                      <ul className="space-y-1">
                        {q.keyStrengths.map((s: string, idx: number) => (
                          <li key={idx} className="text-sm text-on-surface-variant flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs font-label-caps text-orange-500 mb-2">OBSERVATIONS</h5>
                      <ul className="space-y-1">
                        {q.observations.length > 0 ? q.observations.map((o: string, idx: number) => (
                          <li key={idx} className="text-sm text-on-surface-variant flex items-start gap-2">
                            <XCircle className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                            <span>{o}</span>
                          </li>
                        )) : (
                          <li className="text-sm text-on-surface-variant">No observations</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-8">
          <Button onClick={() => navigate('/')} className="flex-1">
            Back to Dashboard
          </Button>
          <Button variant="secondary" onClick={() => navigate('/history')} className="flex-1">
            View All Interviews
          </Button>
        </div>
      </div>
    </div>
  );
}
