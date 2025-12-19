import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { AddMember } from './pages/AddMember';
import { ViewMembers } from './pages/ViewMembers';
import { MemberDetail } from './pages/MemberDetail';

function App() {
  const [currentPage, setCurrentPage] = useState<'add' | 'view' | 'detail'>('view');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleNavigate = (page: 'add' | 'view' | 'detail', memberId?: string) => {
    setCurrentPage(page);
    if (memberId) {
      setSelectedMemberId(memberId);
    }
  };

  const handleBackFromDetail = () => {
    setCurrentPage('view');
    setSelectedMemberId(null);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} memberId={selectedMemberId || undefined} />
      {currentPage === 'add' && <AddMember />}
      {currentPage === 'view' && <ViewMembers onSelectMember={(id) => handleNavigate('detail', id)} />}
      {currentPage === 'detail' && selectedMemberId && (
        <MemberDetail memberId={selectedMemberId} onBack={handleBackFromDetail} />
      )}
    </div>
  );
}

export default App;
