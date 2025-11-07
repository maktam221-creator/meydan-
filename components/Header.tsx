
import React from 'react';
import HomeIcon from './icons/HomeIcon';
import UserIcon from './icons/UserIcon';

interface HeaderProps {
  setView: (view: 'feed' | 'profile') => void;
  currentView: 'feed' | 'profile';
  userAvatar: string;
}

const NavButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const Header: React.FC<HeaderProps> = ({ setView, currentView, userAvatar }) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-800/80 backdrop-blur-md border-b border-gray-700 z-50">
      <nav className="max-w-4xl mx-auto flex items-center justify-between h-16 px-4">
        <div className="text-2xl font-bold text-white tracking-wider">
          Meydan <span className="text-blue-500">ميدان</span>
        </div>
        <div className="flex items-center space-x-2">
          <NavButton
            icon={<HomeIcon className="h-6 w-6" />}
            label="Feed"
            isActive={currentView === 'feed'}
            onClick={() => setView('feed')}
          />
          <button onClick={() => setView('profile')} className="transition-transform duration-200 hover:scale-110">
             <img src={userAvatar} alt="Profile" className={`h-10 w-10 rounded-full border-2 ${currentView === 'profile' ? 'border-blue-500' : 'border-gray-600'}`} />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
