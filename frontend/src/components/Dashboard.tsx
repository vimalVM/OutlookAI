import { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '@/lib/api';
import { Code, BarChart, Server, LayoutTemplate, Users, Zap, Briefcase, Award, Search } from 'lucide-react';

const TECHNICAL_DOMAINS = [
  {
    id: 'frontend-engineering',
    title: 'Frontend Eng',
    icon: <Code className="h-5 w-5" />,
    description: 'Master architecture, state management, an...',
  },
  {
    id: 'data-science',
    title: 'Data Science',
    icon: <BarChart className="h-5 w-5" />,
    description: 'Statistical modeling, machine learnin...',
  },
  {
    id: 'system-design',
    title: 'System Design',
    icon: <Server className="h-5 w-5" />,
    description: 'Scaling distributed systems,...',
  },
  {
    id: 'product-management',
    title: 'Product Mgmt',
    icon: <LayoutTemplate className="h-5 w-5" />,
    description: 'Roadmapping, cross-functional leadership, and...',
  }
];

const BEHAVIORAL_DOMAINS = [
  {
    id: 'leadership',
    title: 'Leadership',
    icon: <Users className="h-5 w-5" />,
    description: 'Navigating culture, driving team alignment,...',
  },
  {
    id: 'conflict-resolution',
    title: 'Conflict Res',
    icon: <Zap className="h-5 w-5" />,
    description: 'Mediating disputes, managing difficu...',
  },
  {
    id: 'negotiation',
    title: 'Negotiation',
    icon: <Briefcase className="h-5 w-5" />,
    description: 'Strategies for total compensation discussion,...',
  },
  {
    id: 'first-time-manager',
    title: 'First-time Mgr',
    icon: <Award className="h-5 w-5" />,
    description: 'Transitioning from IC, delivering feedback, and...',
  }
];

export function Dashboard() {
  const [starting, setStarting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isDark } = useOutletContext<{ isDark: boolean }>();

  const filteredTech = useMemo(() => {
    return TECHNICAL_DOMAINS.filter(d => 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredBehavioral = useMemo(() => {
    return BEHAVIORAL_DOMAINS.filter(d => 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleStartSession = async (domainId: string) => {
    try {
      setStarting(domainId);
      const res = await api.post('/sessions', { domainId });
      const sessionId = res.data.sessionId;
      navigate(`/interview/${sessionId}`);
    } catch (err) {
      console.error(err);
      alert('Error starting session. Make sure the domain exists in the backend.');
      setStarting(null);
    }
  };

  const renderCard = (domain: any) => (
    <div 
      key={domain.id}
      className={`rounded-xl p-6 transition-colors flex flex-col justify-between cursor-pointer group ${isDark ? 'bg-[#1a1b20] border border-white/5 hover:border-[#e8a33d]/30' : 'bg-white border border-gray-200 hover:border-[#e8a33d] shadow-sm'}`}
      onClick={() => handleStartSession(domain.id)}
    >
      <div>
        <div className={`mb-6 ${isDark ? 'text-[#d6c4b0]' : 'text-gray-600'}`}>
          {domain.icon}
        </div>
        <h3 className={`font-headline-md text-2xl mb-3 leading-tight w-2/3 ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>
          {domain.title}
        </h3>
        <p className={`text-sm leading-relaxed mb-8 ${isDark ? 'text-[#d6c4b0]/70' : 'text-gray-500'}`}>
          {domain.description}
        </p>
      </div>
      
      <div className={`flex items-center text-[10px] font-bold tracking-[0.15em] uppercase transition-colors ${isDark ? 'text-[#d6c4b0] group-hover:text-[#e8a33d]' : 'text-gray-500 group-hover:text-[#e8a33d]'}`}>
        {starting === domain.id ? 'Starting...' : 'Start Track'} 
        <span className="ml-2 text-sm leading-none">→</span>
      </div>
    </div>
  );

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
