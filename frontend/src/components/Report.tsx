import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from './ui/Button';
import { Loader2, ArrowLeft, Trophy, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const bandColors = {
    strong: 'text-primary border-primary',
    comfortable: 'text-secondary-fixed border-secondary-fixed',
    developing: 'text-error border-error'
  };

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
        {/* Top Level Summary */}
        <div className="glass-panel p-8 rounded-xl flex items-center justify-between">
          <div>
            <h2 className="text-sm font-label-caps text-outline mb-2">OVERALL CONFIDENCE BAND</h2>
            <div className={cn("text-3xl font-headline-lg capitalize", bandColors[report.confidenceBand as keyof typeof bandColors].split(' ')[0])}>
              {report.confidenceBand}
            </div>
          </div>
          <div className="h-20 w-20 rounded-full border-4 flex items-center justify-center shadow-lg" 
               style={{ borderColor: 'currentColor', color: report.confidenceBand === 'strong' ? '#D4AF37' : report.confidenceBand === 'comfortable' ? '#ffe16d' : '#ffb4ab' }}>
            <Trophy className="h-8 w-8" />
          </div>
        </div>

        {/* Strengths & Growth */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-xl border-t-2 border-t-primary/50">
            <h3 className="flex items-center gap-2 font-headline-md text-on-surface mb-4">
              <TrendingUp className="h-5 w-5 text-primary" /> Key Strengths
            </h3>
            <ul className="space-y-3">
              {report.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                  <span className="text-on-surface-variant text-sm leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="glass-panel p-6 rounded-xl border-t-2 border-t-outline/30">
            <h3 className="flex items-center gap-2 font-headline-md text-on-surface mb-4">
              <AlertTriangle className="h-5 w-5 text-outline" /> Areas for Growth
            </h3>
            <ul className="space-y-3">
              {report.growthAreas.map((g: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-outline mt-2" />
                  <span className="text-on-surface-variant text-sm leading-relaxed">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {report.deliveryPatternFlag && (
          <div className="glass-panel p-6 rounded-xl bg-surface-tint/5 border-primary/20">
            <h4 className="font-label-caps text-primary mb-2">DELIVERY OBSERVATION</h4>
            <p className="text-on-surface text-sm">{report.deliveryPatternNote}</p>
          </div>
        )}

        {/* Breakdown */}
        <div>
          <h3 className="font-headline-md text-on-surface mb-6 mt-12">Question Breakdown</h3>
          <div className="space-y-6">
            {report.perQuestionBreakdown.map((q: any, i: number) => (
              <div key={i} className="glass-panel p-6 rounded-xl">
                <div className="mb-4">
                  <span className="text-xs font-label-caps text-outline block mb-1">QUESTION {i + 1}</span>
                  <p className="text-on-surface font-medium">{q.questionText}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-outline/10">
                  <div>
                    <h5 className="text-xs font-label-caps text-primary mb-2">STRENGTHS</h5>
                    <ul className="space-y-1">
                      {q.keyStrengths.map((s: string, idx: number) => (
                        <li key={idx} className="text-sm text-on-surface-variant">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-xs font-label-caps text-outline mb-2">OBSERVATIONS</h5>
                    <ul className="space-y-1">
                      {q.observations.map((o: string, idx: number) => (
                        <li key={idx} className="text-sm text-on-surface-variant">• {o}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
