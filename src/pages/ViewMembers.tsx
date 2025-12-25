import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Edit, MessageCircle, CheckCircle, XCircle, X } from "lucide-react";

type FilterType = "all" | "active" | "expiring" | "expired";

interface Membership {
  id: string;
  package: string;
  start_date: string;
  end_date: string;
  no_of_months?: number;
  amount_paid?: number;
  total_amount?: number;
}

interface Member {
  id: string;
  name: string;
  contact_number: string;
  member_no: number;
  created_at: string;
  memberships: Membership[];
}

interface ViewMembersProps {
  onSelectMember: (memberId: string) => void;
}

export function ViewMembers({ onSelectMember }: ViewMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] =
    useState<Member | null>(null);
  const [formData, setFormData] = useState({
    package: "",
    no_of_months: 1,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    amount_paid: 0,
    balance_amount: 0,
  });

  // AUTO-CALCULATE END DATE
  useEffect(() => {
    if (formData.start_date && formData.no_of_months > 0) {
      const start = new Date(formData.start_date);
      // Adding months: Date object handles overflow (e.g., Jan 31 + 1 month = March 3)
      const end = new Date(
        start.setMonth(start.getMonth() + formData.no_of_months)
      );

      // Format to YYYY-MM-DD for the date input
      const formattedEndDate = end.toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, end_date: formattedEndDate }));
    }
  }, [formData.start_date, formData.no_of_months]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select(
        `
        id, name, contact_number, member_no, created_at,
        memberships ( id, package, start_date, end_date, amount_paid, total_amount )
      `
      )
      .order("created_at", { ascending: false });

    if (!error && data) {
      const normalized = data.map((m: any) => ({
        ...m,
        memberships: m.memberships ?? [],
      }));
      setMembers(normalized);
    }
    setLoading(false);
  };

  const handleOpenEdit = (e: React.MouseEvent, member: Member) => {
    e.stopPropagation();
    setSelectedMemberForEdit(member);
    setIsModalOpen(true);
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForEdit) return;

    const totalAmountCalculated =
      Number(formData.amount_paid) + Number(formData.balance_amount);

    const { error } = await supabase.from("memberships").insert([
      {
        member_id: selectedMemberForEdit.id,
        package: formData.package,
        no_of_months: formData.no_of_months,
        start_date: formData.start_date,
        end_date: formData.end_date,
        amount_paid: formData.amount_paid,
        total_amount: totalAmountCalculated,
      },
    ]);

    if (!error) {
      setIsModalOpen(false);
      fetchMembers();
      alert("New membership record added!");
    } else {
      alert("Error: " + error.message);
    }
  };

  const getDaysUntilDue = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getLatestMembership = (memberships: Membership[]) =>
    memberships.length > 0 ? memberships[memberships.length - 1] : undefined;

  const getMemberStatus = (membership?: Membership): FilterType => {
    if (!membership) return "expired";
    const days = getDaysUntilDue(membership.end_date);
    if (days > 7) return "active";
    if (days >= 0) return "expiring";
    return "expired";
  };

  const filteredMembers =
    filter === "all"
      ? members
      : members.filter(
          (m) => getMemberStatus(getLatestMembership(m.memberships)) === filter
        );

  const counts = {
    all: members.length,
    active: members.filter(
      (m) => getMemberStatus(getLatestMembership(m.memberships)) === "active"
    ).length,
    expiring: members.filter(
      (m) => getMemberStatus(getLatestMembership(m.memberships)) === "expiring"
    ).length,
    expired: members.filter(
      (m) => getMemberStatus(getLatestMembership(m.memberships)) === "expired"
    ).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Members</h2>
        <p className="text-gray-400">Manage gym members and subscriptions</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {(["all", "active", "expiring", "expired"] as FilterType[]).map((f) => {
          // Define active colors for each specific button type
          const activeColors = {
            all: "bg-gray-400 text-black border-gray-400",
            active: "bg-black-600 text-green-500 border-green-600",
            expiring: "bg-black-500 text-yellow-500 border-yellow-500",
            expired: "bg-black-600 text-red-500 border-red-600",
          };

          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-lg font-semibold border-2 transition-colors ${
                filter === f
                  ? activeColors[f]
                  : "bg-gray-700 text-gray-300 border-transparent hover:bg-gray-600"
              }`}
            >
              {f.toUpperCase()} ({counts[f]})
            </button>
          );
        })}
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading members...</p>
        ) : filteredMembers.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No members found.</p>
        ) : (
          <div className="space-y-3 max-h-[550px] overflow-y-auto">
            {filteredMembers.map((member) => {
              const latest = getLatestMembership(member.memberships);
              const daysLeft = latest ? getDaysUntilDue(latest.end_date) : null;

              return (
                <div
                  key={member.id}
                  onClick={() => onSelectMember(member.id)}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-orange-500 cursor-pointer"
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold">{member.name}</h4>
                        {daysLeft !== null && daysLeft >= 0 ? (
                          <CheckCircle className="text-green-500 w-5 h-5" />
                        ) : (
                          <XCircle className="text-red-500 w-5 h-5" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        Admission No: {member.member_no}
                      </p>
                      <p className="text-sm text-gray-400">
                        Package: {latest?.package ?? "N/A"}
                      </p>
                      <p className="text-sm text-gray-400">
                        Expires:{" "}
                        {daysLeft === null
                          ? "N/A"
                          : daysLeft < 0
                          ? "Expired"
                          : `${daysLeft} days left`}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleOpenEdit(e, member)}
                        className="p-2 text-blue-400 hover:bg-blue-900/20 rounded"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://wa.me/${member.contact_number}`,
                            "_blank"
                          );
                        }}
                        className="p-2 text-green-400 hover:bg-green-900/20 rounded"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RENEW/EDIT MODAL */}
      {isModalOpen && selectedMemberForEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-orange-500 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-orange-500">
                Update Membership
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRenew} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedMemberForEdit.name}
                    className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-gray-300 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    Admission No
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedMemberForEdit.member_no}
                    className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-gray-300 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1">
                  Package
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Gym"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-orange-500 outline-none"
                  onChange={(e) =>
                    setFormData({ ...formData, package: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    No of Months
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.no_of_months}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-orange-500 outline-none"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        no_of_months: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-orange-500 outline-none"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount_paid: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    End Date (Auto)
                  </label>
                  <input
                    type="date"
                    required
                    readOnly
                    value={formData.end_date}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-orange-400 cursor-default"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1">
                  Balance Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-red-400 focus:border-orange-500 outline-none"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      balance_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg mt-4 transition-colors"
              >
                Add Membership Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
