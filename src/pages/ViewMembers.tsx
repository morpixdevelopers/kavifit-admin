import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Edit,
  MessageCircle,
  CheckCircle,
  XCircle,
  X,
  Search,
  UserMinus,
  User,
} from "lucide-react";

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
  is_inactive?: boolean;
}

interface ViewMembersProps {
  onSelectMember: (memberId: string) => void;
}

export function ViewMembers({ onSelectMember }: ViewMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (formData.start_date && formData.no_of_months > 0) {
      const start = new Date(formData.start_date);
      const end = new Date(
        start.setMonth(start.getMonth() + formData.no_of_months)
      );
      setFormData((prev) => ({
        ...prev,
        end_date: end.toISOString().split("T")[0],
      }));
    }
  }, [formData.start_date, formData.no_of_months]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select(
        `
        id, name, contact_number, member_no, created_at, is_inactive,
        memberships ( id, package, start_date, end_date, amount_paid, total_amount )
      `
      )
      .order("created_at", { ascending: false });

    if (!error && data) {
      const normalized = data.map((m: any) => ({
        ...m,
        memberships: m.memberships ?? [],
        is_inactive: m.is_inactive ?? false,
      }));
      setMembers(normalized);
    }
    setLoading(false);
  };

  const handleDeactivate = async (e: React.MouseEvent, memberId: string) => {
    e.stopPropagation();
    const confirm = window.confirm("Mark this member as Inactive?");
    if (confirm) {
      const { error } = await supabase
        .from("members")
        .update({ is_inactive: true })
        .eq("id", memberId);

      if (!error) fetchMembers();
      else alert("Error: " + error.message);
    }
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForEdit) return;

    if (selectedMemberForEdit.is_inactive) {
      await supabase
        .from("members")
        .update({ is_inactive: false })
        .eq("id", selectedMemberForEdit.id);
    }

    const totalAmount =
      Number(formData.amount_paid) + Number(formData.balance_amount);
    const { error } = await supabase.from("memberships").insert([
      {
        member_id: selectedMemberForEdit.id,
        package: formData.package,
        no_of_months: formData.no_of_months,
        start_date: formData.start_date,
        end_date: formData.end_date,
        amount_paid: formData.amount_paid,
        total_amount: totalAmount,
      },
    ]);

    if (!error) {
      setIsModalOpen(false);
      fetchMembers();
      alert("Membership Record Updated!");
    }
  };

  const getDaysUntilDue = (endDate: string) => {
    return Math.ceil(
      (new Date(endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const getLatestMembership = (m: Membership[]) =>
    m.length > 0 ? m[m.length - 1] : undefined;

  const getMemberStatus = (membership?: Membership): FilterType | "none" => {
    if (!membership) return "none";
    const days = getDaysUntilDue(membership.end_date);
    if (days > 7) return "active";
    if (days >= 0) return "expiring";
    return "expired";
  };

  const processedMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.member_no.toString().includes(searchQuery);
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    if (m.is_inactive) return false;
    return getMemberStatus(getLatestMembership(m.memberships)) === filter;
  });

  const counts = {
    all: members.length,
    active: members.filter(
      (m) =>
        !m.is_inactive &&
        getMemberStatus(getLatestMembership(m.memberships)) === "active"
    ).length,
    expiring: members.filter(
      (m) =>
        !m.is_inactive &&
        getMemberStatus(getLatestMembership(m.memberships)) === "expiring"
    ).length,
    expired: members.filter(
      (m) =>
        !m.is_inactive &&
        getMemberStatus(getLatestMembership(m.memberships)) === "expired"
    ).length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      {/* Header & Search */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Members</h2>
          <p className="text-gray-400">Manage gym members and subscriptions</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search name or ID..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-orange-500 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-3">
        {(["all", "active", "expiring", "expired"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-lg font-semibold border-2 transition-all ${
              filter === f
                ? "bg-orange-500 border-orange-500 text-white"
                : "bg-gray-800 border-transparent text-gray-400"
            }`}
          >
            {f.toUpperCase()} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Members List */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        {loading ? (
          <p className="text-center py-10 text-gray-500">Loading members...</p>
        ) : processedMembers.length === 0 ? (
          <p className="text-center py-10 text-gray-500">
            No members match your criteria.
          </p>
        ) : (
          <div className="space-y-3">
            {processedMembers.map((member) => {
              const latest = getLatestMembership(member.memberships);
              const daysLeft = latest ? getDaysUntilDue(latest.end_date) : null;
              const status = getMemberStatus(latest);

              return (
                <div
                  key={member.id}
                  onClick={() => onSelectMember(member.id)}
                  className="bg-gray-800 border border-gray-700 p-4 rounded-lg cursor-pointer hover:border-orange-500 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <User className="text-orange-500" size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">{member.name}</h4>
                          {member.is_inactive ? (
                            <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                              Inactive
                            </span>
                          ) : status === "active" || status === "expiring" ? (
                            <CheckCircle className="text-green-500 w-4 h-4" />
                          ) : (
                            <XCircle className="text-red-500 w-4 h-4" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          ID: {member.member_no} •{" "}
                          {latest?.package || "No Package"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {member.is_inactive
                            ? "Status: No longer a member"
                            : daysLeft === null
                            ? "Status: No record"
                            : daysLeft < 0
                            ? "Status: Expired"
                            : `Status: ${daysLeft} days left`}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!member.is_inactive && (
                        <button
                          onClick={(e) => handleDeactivate(e, member.id)}
                          className="p-2 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                          title="Set Inactive"
                        >
                          <UserMinus size={20} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMemberForEdit(member);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
                        title="Renew"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://wa.me/${member.contact_number}`);
                        }}
                        className="p-2 text-green-400 hover:bg-green-900/20 rounded transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RENEW MODAL with Freezed Header */}
      {isModalOpen && selectedMemberForEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-orange-500 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-orange-500">
                Update Membership
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleRenew} className="space-y-4">
              {/* FREEZED FIELDS (Read Only) */}
              <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 mb-2">
                <div>
                  <label className="block text-[10px] text-orange-400 uppercase font-bold mb-1">
                    Member Name
                  </label>
                  <div className="text-white font-semibold truncate">
                    {selectedMemberForEdit.name}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-orange-400 uppercase font-bold mb-1">
                    Admission No
                  </label>
                  <div className="text-white font-semibold">
                    {selectedMemberForEdit.member_no}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1 font-bold">
                  Package Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1 Month Premium"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-orange-500"
                  onChange={(e) =>
                    setFormData({ ...formData, package: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1 font-bold">
                    Months
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.no_of_months}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        no_of_months: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1 font-bold">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
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
                  <label className="block text-xs text-gray-400 uppercase mb-1 font-bold">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1 font-bold">
                    End Date (Auto)
                  </label>
                  <input
                    type="date"
                    readOnly
                    value={formData.end_date}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-orange-400 cursor-default"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1 font-bold">
                  Balance Due
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-red-400"
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
                className="w-full bg-orange-500 hover:bg-orange-600 font-bold py-3 rounded-lg mt-4 transition-colors"
              >
                {selectedMemberForEdit.is_inactive
                  ? "Reactivate & Add Record"
                  : "Add Membership Record"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
