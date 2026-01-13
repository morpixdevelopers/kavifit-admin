import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  UserPlus,
  RefreshCw,
  TrendingUp,
  Wallet,
  MessageCircle,
  Users,
  IndianRupee,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";

export function Payments() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [listTab, setListTab] = useState<"pending" | "paid">("pending");
  const [showAllTime, setShowAllTime] = useState(false);

  const [stats, setStats] = useState({
    newMembers: 0,
    renewals: 0,
    earnedAmount: 0,
    balanceAmount: 0,
    allTimeEarnings: 0,
    totalGymMembers: 0,
  });

  const [paidMembers, setPaidMembers] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);

  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const fetchDashboardData = async () => {
    setLoading(true);
    const start = new Date(selectedYear, selectedMonth, 1).toISOString();
    const end = new Date(
      selectedYear,
      selectedMonth + 1,
      0,
      23,
      59,
      59
    ).toISOString();

    try {
      const { count: activeMemberCount } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("is_inactive", false);

      const { data: allEarnings } = await supabase
        .from("memberships")
        .select("amount_paid");

      const allTimeTotal =
        allEarnings?.reduce((sum, m) => sum + Number(m.amount_paid), 0) || 0;

      const { data: memberships, error } = await supabase
        .from("memberships")
        .select(
          `
          id,
          amount_paid, 
          total_amount, 
          member_id, 
          created_at,
          start_date,
          payment_method,
          members (name, contact_number)
        `
        )
        .gte("start_date", start)
        .lte("start_date", end)
        .order("start_date", { ascending: true });

      if (error) throw error;

      if (memberships) {
        let monthlyEarned = 0;
        let monthlyBalance = 0;
        let newCount = 0;
        let renewCount = 0;
        const paidList: any[] = [];
        const pendingList: any[] = [];

        const seenInThisBatch = new Set();

        for (const m of memberships) {
          const amtPaid = Number(m.amount_paid);
          const total = Number(m.total_amount);
          const bal = total - amtPaid;

          monthlyEarned += amtPaid;
          monthlyBalance += bal;

          if (bal <= 0) paidList.push(m);
          else pendingList.push(m);

          const { count } = await supabase
            .from("memberships")
            .select("*", { count: "exact", head: true })
            .eq("member_id", m.member_id)
            .lt("start_date", m.start_date);

          if ((count && count > 0) || seenInThisBatch.has(m.member_id)) {
            renewCount++;
          } else {
            newCount++;
            seenInThisBatch.add(m.member_id);
          }
        }

        setStats({
          newMembers: newCount,
          renewals: renewCount,
          earnedAmount: monthlyEarned,
          balanceAmount: monthlyBalance,
          allTimeEarnings: allTimeTotal,
          totalGymMembers: activeMemberCount || 0,
        });
        setPaidMembers(paidList);
        setPendingMembers(pendingList);
      }
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const openWhatsApp = (phone: string, name: string, balance: number) => {
    const msg = `Hi ${name}, Friendly reminder regarding your pending balance of ₹${balance}. \nThank you! \n Kavifit Gym.`;
    window.open(
      `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8 text-white font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Payments Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              Manage finances and member tracking
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-slate-800 border border-slate-700 px-5 py-3 rounded-2xl shadow-lg border-b-2 border-b-blue-500">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-[10px] uppercase font-black tracking-widest">
                  Active Members
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.totalGymMembers}
              </p>
            </div>

            {/* FIXED TOTAL EARNINGS CARD - Removed shaking by adding w-[220px] and relative positioning */}
            <div className="bg-slate-800 border border-slate-700 px-5 py-3 rounded-2xl shadow-lg border-b-2 border-b-green-500 min-w-[220px] relative">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <IndianRupee className="h-4 w-4" />
                <span className="text-[10px] uppercase font-black tracking-widest">
                  Total Earnings
                </span>
              </div>

              <div className="flex items-center h-8">
                {showAllTime ? (
                  <p className="text-2xl font-bold text-white">
                    ₹{stats.allTimeEarnings.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-slate-600 tracking-[0.2em]">
                    ••••••
                  </p>
                )}

                <button
                  onClick={() => setShowAllTime(!showAllTime)}
                  className="ml-auto p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  {showAllTime ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DATE SELECTOR */}
        <div className="flex items-center bg-slate-800/50 border border-slate-700 p-2 rounded-2xl mb-10 w-fit">
          <button
            onClick={handlePrevMonth}
            className="p-3 hover:bg-slate-700 text-orange-500 rounded-xl transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2 px-4 border-x border-slate-700">
            <CalendarIcon className="h-4 w-4 text-orange-500 mr-1" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent border-none text-white font-bold focus:ring-0 cursor-pointer outline-none uppercase text-sm tracking-widest"
            >
              {months.map((m, i) => (
                <option key={m} value={i} className="bg-slate-800">
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none text-white font-bold focus:ring-0 cursor-pointer outline-none text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-slate-800">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-3 hover:bg-slate-700 text-orange-500 rounded-xl transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-r-transparent"></div>
          </div>
        ) : (
          <>
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <UserPlus className="h-8 w-8 text-blue-500 mb-4" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
                  New Joining
                </p>
                <h2 className="text-4xl font-bold mt-2">{stats.newMembers}</h2>
              </div>

              <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <RefreshCw className="h-8 w-8 text-purple-500 mb-4" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
                  Renewals
                </p>
                <h2 className="text-4xl font-bold mt-2">{stats.renewals}</h2>
              </div>

              <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                <TrendingUp className="h-8 w-8 text-green-500 mb-4" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest text-green-500/80">
                  Earned This Month
                </p>
                <h2 className="text-4xl font-bold mt-2 text-green-400">
                  ₹{stats.earnedAmount.toLocaleString()}
                </h2>
              </div>

              <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <Wallet className="h-8 w-8 text-orange-500 mb-4" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest text-orange-500/80">
                  Balance To Receive
                </p>
                <h2 className="text-4xl font-bold mt-2 text-orange-500">
                  ₹{stats.balanceAmount.toLocaleString()}
                </h2>
              </div>
            </div>

            {/* TABS & LIST */}
            <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl mb-10">
              <div className="flex bg-slate-800/50">
                <button
                  onClick={() => setListTab("pending")}
                  className={`flex-1 py-5 font-black text-xs uppercase tracking-[0.2em] transition-all ${
                    listTab === "pending"
                      ? "text-orange-500 bg-orange-500/5 border-b-2 border-orange-500"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Pending Balance ({pendingMembers.length})
                </button>
                <button
                  onClick={() => setListTab("paid")}
                  className={`flex-1 py-5 font-black text-xs uppercase tracking-[0.2em] transition-all ${
                    listTab === "paid"
                      ? "text-green-500 bg-green-500/5 border-b-2 border-green-500"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Fully Paid ({paidMembers.length})
                </button>
              </div>

              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-[10px] uppercase tracking-[0.3em] border-b border-slate-700">
                        <th className="px-6 py-5">Member Details</th>
                        <th className="px-6 py-5 text-center">Method</th>
                        <th className="px-6 py-5 text-center">Paid</th>
                        <th className="px-6 py-5 text-center">
                          {listTab === "pending" ? "Balance" : "Total"}
                        </th>
                        {listTab === "pending" && (
                          <th className="px-6 py-5 text-right">Reminder</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/40">
                      {(listTab === "pending"
                        ? pendingMembers
                        : paidMembers
                      ).map((m, i) => (
                        <tr
                          key={i}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-6">
                            <p className="font-bold text-white text-lg">
                              {m.members?.name}
                            </p>
                            <p className="text-xs text-slate-500 font-mono mt-1">
                              {m.members?.contact_number}
                            </p>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {m.payment_method || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-center text-slate-300 font-medium">
                            ₹{m.amount_paid}
                          </td>
                          <td
                            className={`px-6 py-6 text-center font-bold text-xl ${
                              listTab === "pending"
                                ? "text-red-400"
                                : "text-green-400"
                            }`}
                          >
                            ₹
                            {listTab === "pending"
                              ? m.total_amount - m.amount_paid
                              : m.total_amount}
                          </td>
                          {listTab === "pending" && (
                            <td className="px-6 py-6 text-right">
                              <button
                                onClick={() =>
                                  openWhatsApp(
                                    m.members?.contact_number,
                                    m.members?.name,
                                    m.total_amount - m.amount_paid
                                  )
                                }
                                className="bg-green-500/10 text-green-500 p-3 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-lg"
                              >
                                <MessageCircle className="h-6 w-6" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
