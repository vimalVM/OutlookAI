import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '@/lib/api';
import { Code, Users, BarChart, Server, LayoutTemplate, Zap, Briefcase, Award, Search, Loader2 } from 'lucide-react';

interface DomainItem {
  id: string;
  domain: string;
  type: string;
  questionCount: number;
}

const DOMAIN_METADATA: Record<string, { title: string; icon: React.ReactNode; description: string }> = {
  'frontend-development': {
    title: 'Frontend Eng',
    icon: <Code className="h-5 w-5" />,
    description: 'Master React, JavaScript core, web performance, and state management.',
  },
  'data-science': {
    title: 'Data Science',
    icon: <BarChart className="h-5 w-5" />,
    description: 'Statistical modeling, machine learning algorithms, and data insights.',
  },
  'system-design': {
    title: 'System Design',
    icon: <Server className="h-5 w-5" />,
    description: 'Scaling distributed systems, load balancing, databases, and microservices.',
  },
  'product-management': {
    title: 'Product Mgmt',
    icon: <LayoutTemplate className="h-5 w-5" />,
    description: 'Roadmapping, cross-functional leadership, prioritization, and product strategy.',
  },
  'behavioral': {
    title: 'Behavioral',
    icon: <Users className="h-5 w-5" />,
    description: 'Master STAR method scenarios, team conflicts, and self-awareness questions.',
  },
  'leadership': {
    title: 'Leadership',
    icon: <Award className="h-5 w-5" />,
    description: 'Navigating culture, driving team alignment, vision, and strategic goals.',
  },
  'conflict-resolution': {
    title: 'Conflict Res',
    icon: <Zap className="h-5 w-5" />,
    description: 'Mediating disputes, managing difficult conversations, and technical stalemates.',
  },
  'negotiation': {
    title: 'Negotiation',
    icon: <Briefcase className="h-5 w-5" />,
    description: 'Strategies for compensation discussions, scope alignment, and deadlines.',
  },
  'first-time-manager': {
    title: 'First-time Mgr',
    icon: <Users className="h-5 w-5" />,
    description: 'Transitioning from IC, delivering feedback, 1-on-1s, and team growth.',
  },
};

export function Dashboard() {
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isDark } = useOutletContext<{ isDark: boolean }>();

  useEffect(() => {
    api.get('/domains')
      .then((res) => {
        setDomains(res.data.domains || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch domains', err);
        setLoading(false);
      });
  }, []);

  const technicalDomains = useMemo(() => {
    return domains.filter(d => d.type === 'technical' || d.id.includes('tech') || d.id.includes('frontend') || d.id.includes('system') || d.id.includes('data') || d.id.includes('product'));
  }, [domains]);

  const behavioralDomains = useMemo(() => {
    return domains.filter(d => d.type === 'non_technical' || d.type === 'behavioral' || d.id === 'behavioral' || d.id.includes('leadership') || d.id.includes('conflict') || d.id.includes('negotiation') || d.id.includes('manager'));
  }, [domains]);

  const filteredTech = useMemo(() => {
    return technicalDomains.filter(d => {
      const meta = DOMAIN_METADATA[d.id];
      const title = meta ? meta.title : d.domain;
      const desc = meta ? meta.description : '';
      return title.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [technicalDomains, searchQuery]);

  const filteredBehavioral = useMemo(() => {
    return behavioralDomains.filter(d => {
      const meta = DOMAIN_METADATA[d.id];
      const title = meta ? meta.title : d.domain;
      const desc = meta ? meta.description : '';
      return title.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [behavioralDomains, searchQuery]);

  const handleStartSession = async (domainId: string) => {
    try {
      setStarting(domainId);
      const res = await api.post('/sessions', { domainId });
      const sessionId = res.data.sessionId;
      navigate(`/interview/${sessionId}`);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error?.message || 'Error starting session. Please try again.';
      alert(`Failed to start session: ${msg}`);
      setStarting(null);
    }
  };

  const renderCard = (domainItem: DomainItem) => {
    const meta = DOMAIN_METADATA[domainItem.id] || {
      title: domainItem.domain,
      icon: domainItem.type === 'technical' ? <Code className="h-5 w-5" /> : <Users className="h-5 w-5" />,
      description: `${domainItem.questionCount} scenarios tailored for your practice.`,
    };

    return (
      <div 
        key={domainItem.id}
        className={`rounded-xl p-6 transition-colors flex flex-col justify-between cursor-pointer group ${isDark ? 'bg-[#1a1b20] border border-white/5 hover:border-[#e8a33d]/30' : 'bg-white border border-gray-200 hover:border-[#e8a33d] shadow-sm'}`}
        onClick={() => handleStartSession(domainItem.id)}
      >
        <div>
          <div className={`mb-6 ${isDark ? 'text-[#d6c4b0]' : 'text-gray-600'}`}>
            {meta.icon}
          </div>
          <h3 className={`font-headline-md text-2xl mb-3 leading-tight ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>
            {meta.title}
          </h3>
          <p className={`text-sm leading-relaxed mb-8 ${isDark ? 'text-[#d6c4b0]/70' : 'text-gray-500'}`}>
            {meta.description}
          </p>
        </div>
        
        <div className={`flex items-center text-[10px] font-bold tracking-[0.15em] uppercase transition-colors ${isDark ? 'text-[#d6c4b0] group-hover:text-[#e8a33d]' : 'text-gray-500 group-hover:text-[#e8a33d]'}`}>
          {starting === domainItem.id ? 'Starting...' : 'Start Track'} 
          <span className="ml-2 text-sm leading-none">→</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className={`animate-spin h-8 w-8 ${isDark ? 'text-[#e8a33d]' : 'text-gray-900'}`} />
      </div>
    );
  }

  return (
    <div className="w-full pb-10 relative">
      <div className="absolute top-[-80px] right-0 hidden md:block">
        <div className="relative w-64">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-[#d6c4b0]/50' : 'text-gray-400'}`} />
          <input 
            type="text" 
            placeholder="Search domains..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-full pl-10 pr-4 py-2 text-sm outline-none transition-colors ${
              isDark 
                ? 'bg-[#1a1b20] border border-white/5 text-[#e3e1e9] placeholder:text-[#d6c4b0]/50 focus:border-[#e8a33d]/50' 
                : 'bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#e8a33d] shadow-sm'
            }`}
          />
        </div>
      </div>

      <div className="mb-14">
        <h1 className={`font-headline-xl text-6xl mb-4 ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>Choose your focus.</h1>
        <p className={`text-sm max-w-xl leading-relaxed ${isDark ? 'text-[#d6c4b0]' : 'text-gray-600'}`}>
          Select a domain to begin your guided coaching session. Each track is tailored with specialized scenarios and feedback rubrics.
        </p>
        
        {/* Mobile search bar */}
        <div className="mt-6 md:hidden">
          <div className="relative w-full max-w-sm">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-[#d6c4b0]/50' : 'text-gray-400'}`} />
            <input 
              type="text" 
              placeholder="Search domains..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-full pl-10 pr-4 py-3 text-sm outline-none transition-colors ${
                isDark 
                  ? 'bg-[#1a1b20] border border-white/5 text-[#e3e1e9] placeholder:text-[#d6c4b0]/50 focus:border-[#e8a33d]/50' 
                  : 'bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#e8a33d] shadow-sm'
              }`}
            />
          </div>
        </div>
      </div>

      {filteredTech.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6 text-[#e8a33d] text-[10px] font-bold tracking-[0.15em] uppercase">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            Technical Domains
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTech.map(renderCard)}
          </div>
        </div>
      )}

      {filteredBehavioral.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-6 text-[#2f8c6d] text-[10px] font-bold tracking-[0.15em] uppercase">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Leadership & Behavioral
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBehavioral.map(renderCard)}
          </div>
        </div>
      )}

      {filteredTech.length === 0 && filteredBehavioral.length === 0 && (
        <div className={`text-center py-12 ${isDark ? 'text-[#d6c4b0]' : 'text-gray-500'}`}>
          No domains found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}
