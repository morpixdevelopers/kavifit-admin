import { Dumbbell } from "lucide-react";

// FIX: Updated interface to include all possible page types
interface NavigationProps {
  currentPage: "add" | "view" | "detail" | "payments";
  onNavigate: (page: "add" | "view" | "detail" | "payments") => void;
  memberId?: string; // Added to match the prop being passed in App.tsx
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="bg-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Dumbbell className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold">Kavifit Gym Manager</span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => onNavigate("add")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === "add"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Add Member
            </button>
            <button
              onClick={() => onNavigate("view")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === "view" || currentPage === "detail"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              View Members
            </button>
            <button
              onClick={() => onNavigate("payments")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === "payments"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Payment Details
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
