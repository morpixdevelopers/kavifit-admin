import { Dumbbell } from "lucide-react";

interface NavigationProps {
  currentPage: "add" | "view";
  onNavigate: (page: "add" | "view") => void;
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
                currentPage === "view"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              View Members
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
