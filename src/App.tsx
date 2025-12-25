import { useState } from "react";
import { Navigation } from "./components/Navigation";
import { AddMember } from "./pages/AddMember";
import { ViewMembers } from "./pages/ViewMembers";
import { MemberDetail } from "./pages/MemberDetail";
import { Payments } from "./pages/PaymentDetails"; // Import your new page

function App() {
  // FIX: Added 'payments' and 'detail' to the state type
  const [currentPage, setCurrentPage] = useState<
    "add" | "view" | "detail" | "payments"
  >("view");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleNavigate = (
    page: "add" | "view" | "detail" | "payments",
    memberId?: string
  ) => {
    setCurrentPage(page);
    if (memberId) {
      setSelectedMemberId(memberId);
    }
  };

  const handleBackFromDetail = () => {
    setCurrentPage("view");
    setSelectedMemberId(null);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation now receives the correct current page */}
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />

      {currentPage === "add" && <AddMember />}

      {currentPage === "view" && (
        <ViewMembers onSelectMember={(id) => handleNavigate("detail", id)} />
      )}

      {/* FIX: Render the actual Payments component here */}
      {currentPage === "payments" && <Payments />}

      {currentPage === "detail" && selectedMemberId && (
        <MemberDetail
          memberId={selectedMemberId}
          onBack={handleBackFromDetail}
        />
      )}
    </div>
  );
}

export default App;
