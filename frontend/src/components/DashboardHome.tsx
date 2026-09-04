import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Loader2, LayoutDashboard, Target, Activity, Clock } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';

interface SessionHistory {
  sessionId: string;
  domainId: string;
  confidenceBand: string;
  completedAt: string;
}

export function DashboardHome() {
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useOutletContext<{ isDark: boolean }>();

  useEffect(() => {
    api.get('/sessions').then((res) => {
      setSessions(res.data.sessions || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className={`animate-spin h-8 w-8 ${isDark ? 'text-[#e8a33d]' : 'text-gray-900'}`} /></div>;
  }

  const strongMatches = sessions.filter(s => s.confidenceBand === 'strong').length;
  const passingMatches = sessions.filter(s => s.confidenceBand === 'strong' || s.confidenceBand === 'comfortable').length;
  const recentSessions = sessions.slice(0, 3);

  return (
    <div className="w-full pb-10">
      <div className="mb-14">
        <h1 className={`font-headline-xl text-6xl mb-4 ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>Overview</h1>
        <p className={`text-sm max-w-xl leading-relaxed ${isDark ? 'text-[#d6c4b0]' : 'text-gray-600'}`}>
          Welcome to your coaching dashboard. Track your interview readiness and review your past performance metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className={`rounded-xl p-6 border flex flex-col ${isDark ? 'bg-[#1a1b20] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-[10px] font-bold tracking-[0.15em] uppercase ${isDark ? 'text-[#d6c4b0]' : 'text-gray-500'}`}>Total Sessions</h3>
            <LayoutDashboard className={`h-4 w-4 ${isDark ? 'text-[#e8a33d]' : 'text-gray-900'}`} />
          </div>
          <div className={`text-4xl font-headline-md ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>{sessions.length}</div>
          <p className={`text-xs mt-2 ${isDark ? 'text-[#d6c4b0]/70' : 'text-gray-500'}`}>Completed mock interviews</p>
        </div>

        <div className={`rounded-xl p-6 border flex flex-col ${isDark ? 'bg-[#1a1b20] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-[10px] font-bold tracking-[0.15em] uppercase ${isDark ? 'text-[#d6c4b0]' : 'text-gray-500'}`}>Strong Matches</h3>
            <Target className={`h-4 w-4 ${isDark ? 'text-[#2f8c6d]' : 'text-green-600'}`} />
          </div>
          <div className={`text-4xl font-headline-md ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>{strongMatches}</div>
          <p className={`text-xs mt-2 ${isDark ? 'text-[#d6c4b0]/70' : 'text-gray-500'}`}>Interviews with high confidence</p>
        </div>

        <div className={`rounded-xl p-6 border flex flex-col ${isDark ? 'bg-[#1a1b20] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-[10px] font-bold tracking-[0.15em] uppercase ${isDark ? 'text-[#d6c4b0]' : 'text-gray-500'}`}>Readiness</h3>
            <Activity className={`h-4 w-4 ${isDark ? 'text-[#ffb956]' : 'text-orange-500'}`} />
          </div>
          <div className={`text-4xl font-headline-md ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>
            {sessions.length > 0 ? Math.round((passingMatches / sessions.length) * 100) : 0}%
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-[#d6c4b0]/70' : 'text-gray-500'}`}>Overall pass rate</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center gap-2 text-[10px] font-bold tracking-[0.15em] uppercase ${isDark ? 'text-[#e8a33d]' : 'text-gray-900'}`}>
            <Clock className="w-4 h-4" />
            Recent Activity
          </div>
          <Link to="/history" className={`text-xs transition-colors ${isDark ? 'text-[#e3e1e9] hover:text-[#e8a33d]' : 'text-gray-600 hover:text-gray-900'}`}>View All →</Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className={`rounded-xl p-10 border text-center ${isDark ? 'bg-[#1a1b20] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className={`text-sm mb-4 ${isDark ? 'text-[#d6c4b0]' : 'text-gray-600'}`}>You haven't completed any interviews yet.</p>
            <Link to="/" className={`inline-block font-medium text-sm px-6 py-2.5 rounded-lg transition-colors ${isDark ? 'bg-[#ffb956] hover:bg-[#e8a33d] text-[#121318]' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}>
              Start an Interview
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recentSessions.map(session => (
              <Link 
                key={session.sessionId}
                to={`/report/${session.sessionId}`}
                className={`rounded-xl p-5 border transition-colors flex items-center justify-between group ${isDark ? 'bg-[#1a1b20] border-white/5 hover:border-[#e8a33d]/30' : 'bg-white border-gray-200 hover:border-gray-900 shadow-sm'}`}
              >
                <div>
                  <h4 className={`font-headline-md text-xl capitalize ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>{session.domainId.replace('-', ' ')}</h4>
                  <p className={`text-xs mt-1 ${isDark ? 'text-[#d6c4b0]/70' : 'text-gray-500'}`}>{new Date(session.completedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full ${
                    session.confidenceBand === 'strong' 
                      ? isDark ? 'bg-[#2f8c6d]/20 text-[#2f8c6d]' : 'bg-green-100 text-green-700'
                      : isDark ? 'bg-[#e8a33d]/20 text-[#e8a33d]' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {session.confidenceBand}
                  </span>
                  <span className={`transition-colors ${isDark ? 'text-[#d6c4b0] group-hover:text-[#e8a33d]' : 'text-gray-400 group-hover:text-gray-900'}`}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
