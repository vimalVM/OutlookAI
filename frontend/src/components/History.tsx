import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Loader2, History as HistoryIcon, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';

interface SessionHistory {
  sessionId: string;
  domainId: string;
  confidenceBand: string;
  completedAt: string;
  questionCount: number;
}

export function History() {
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useOutletContext<{ isDark: boolean }>();

  useEffect(() => {
    api.get('/sessions').then((res) => {
      setSessions(res.data.sessions);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className={`animate-spin h-8 w-8 ${isDark ? 'text-[#e8a33d]' : 'text-gray-900'}`} /></div>;
  }

  return (
    <div className="w-full pb-10">
      <div className="mb-14">
        <h1 className={`font-headline-xl text-6xl mb-4 ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>Interview History</h1>
        <p className={`text-sm max-w-xl leading-relaxed ${isDark ? 'text-[#d6c4b0]' : 'text-gray-600'}`}>Review your past performance and track your progress.</p>
      </div>

      <div className="flex-1">
        {sessions.length === 0 ? (
          <div className={`rounded-xl p-16 flex flex-col items-center justify-center text-center border ${isDark ? 'bg-[#1a1b20] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-[#2a2b30]' : 'bg-gray-100'}`}>
              <HistoryIcon className={`h-8 w-8 ${isDark ? 'text-[#d6c4b0]' : 'text-gray-500'}`} />
            </div>
            <h3 className={`font-headline-md text-2xl mb-2 ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>No past interviews</h3>
            <p className={`text-sm mb-8 ${isDark ? 'text-[#d6c4b0]/70' : 'text-gray-500'}`}>You haven't completed any mock interviews yet.</p>
            <Link to="/" className={`inline-block font-medium text-sm px-8 py-3 rounded-lg transition-colors ${isDark ? 'bg-[#ffb956] hover:bg-[#e8a33d] text-[#121318]' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}>
              Start an Interview
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sessions.map((session) => (
              <Link 
                key={session.sessionId} 
                to={`/report/${session.sessionId}`}
                className={`rounded-xl p-6 transition-colors flex items-center justify-between group border ${isDark ? 'bg-[#1a1b20] border-white/5 hover:border-[#e8a33d]/30' : 'bg-white border-gray-200 hover:border-gray-900 shadow-sm'}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-[#2a2b30]' : 'bg-green-50'}`}>
                    <CheckCircle className={`h-6 w-6 ${isDark ? 'text-[#2f8c6d]' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <h3 className={`font-headline-md text-xl capitalize ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>{session.domainId.replace('-', ' ')}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-[#d6c4b0]/70' : 'text-gray-500'}`}>
                        <Clock className="h-4 w-4" />
                        {new Date(session.completedAt).toLocaleDateString()}
                      </div>
                      <div className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full ${
                        session.confidenceBand === 'strong' 
                          ? isDark ? 'bg-[#2f8c6d]/20 text-[#2f8c6d]' : 'bg-green-100 text-green-700'
                          : isDark ? 'bg-[#e8a33d]/20 text-[#e8a33d]' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {session.confidenceBand}
                      </div>
                    </div>
                  </div>
                </div>
                <ArrowRight className={`h-6 w-6 transition-colors transform group-hover:translate-x-1 ${isDark ? 'text-[#d6c4b0] group-hover:text-[#e8a33d]' : 'text-gray-400 group-hover:text-gray-900'}`} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
