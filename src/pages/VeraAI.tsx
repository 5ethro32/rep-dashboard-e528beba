
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VeraChat from '@/components/vera-ai/VeraChat';
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { Home, BarChart2, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const VeraAI: React.FC = () => {
  const { user } = useAuth();
  const firstName = user?.email?.split('@')[0] || 'User';
  
  return (
    <div className="flex h-screen bg-finance-darkBg text-white">
      {/* Sidebar */}
      <Sidebar defaultCollapsed={false}>
        <SidebarHeader className="border-b border-gray-800">
          <div className="p-4">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-finance-red to-rose-500">
              VeraAI
            </h2>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <div className="space-y-1 px-3">
              <Link 
                to="/rep-performance"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <Home size={18} />
                <span>Rep Performance</span>
              </Link>
              
              <Link 
                to="/account-performance"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <BarChart2 size={18} />
                <span>Account Performance</span>
              </Link>
              
              <Link 
                to="/vera-ai"
                className="flex items-center gap-3 rounded-md px-3 py-2 bg-gray-800 text-white transition-colors"
              >
                <MessageCircle size={18} />
                <span>VeraAI Chat</span>
              </Link>
            </div>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter>
          <div className="p-4">
            <UserProfileButton />
          </div>
        </SidebarFooter>
      </Sidebar>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="py-6 px-8 border-b border-white/10">
          <h1 className="text-3xl font-bold">
            Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-finance-red">
              {firstName}
            </span>
          </h1>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <VeraChat />
        </div>
      </main>
    </div>
  );
};

export default VeraAI;
