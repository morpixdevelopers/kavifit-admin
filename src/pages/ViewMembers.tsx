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
  photo?: string | null;
}

interface ViewMembersProps {
  onSelectMember: (memberId: string) => void;
}

export function ViewMembers({ onSelectMember }: ViewMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  /* ---------------- MODAL STATE ---------------- */
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

  /* ---------------- HELPERS ---------------- */
  const getPhotoUrl = (photo?: string | null) => {
    if (!photo) return null;
    if (photo.startsWith("http")) return photo;

    // 👉 CHANGE BUCKET NAME IF NEEDED
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/member-photos/${photo}`;
  };

  const getDaysUntilDue = (endDate: string) =>
    Math.ceil(
      (new Date(endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

  const getLatestMembership = (m: Membership[]) =>
    m.length > 0 ? m[m.length - 1] : undefined;

  const getMemberStatus = (membership?: Membership): FilterType | "none" => {
    if (!membership) return "none";
    const days = getDaysUntilDue(membership.end_date);
    if (days > 7) return "active";
    if (days >= 0) return "expiring";
    return "expired";
  };

  /* ---------------- FETCH MEMBERS ---------------- */
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("members")
      .select(
        `
        id,
        name,
        contact_number,
        member_no,
        created_at,
        is_inactive,
        photo,
        memberships (
          id,
          package,
          start_date,
          end_date,
          amount_paid,
          total_amount
        )
      `
      )
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMembers(
        data.map((m: any) => ({
          ...m,
          memberships: m.memberships ?? [],
          is_inactive: m.is_inactive ?? false,
        }))
      );
    }

    setLoading(false);
  };

  /* ---------------- RENEW MEMBERSHIP ---------------- */
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

  /* ---------------- FILTER + SEARCH ---------------- */
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

  /* ---------------- UI ---------------- */
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Members</h2>
          <p className="text-gray-400">Manage gym members</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search name or ID..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* FILTERS */}
      <div className="mb-6 flex flex-wrap gap-3">
        {(['all', 'active', 'expiring', 'expired'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === f
                ? f === 'all'
                  ? 'bg-gray-400 text-black'
                  : f === 'active'
                  ? 'bg-green-500 text-white'
                  : f === 'expiring'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-red-500 text-white'
                : f === 'active'
                ? 'bg-green-900/30 text-green-300 border border-green-500/50'
                : f === 'expiring'
                ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/50'
                : f === 'expired'
                ? 'bg-red-900/30 text-red-300 border border-red-500/50'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>
      {/* MEMBERS LIST */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-3">
        {processedMembers.map((member) => {
          const latest = getLatestMembership(member.memberships);
          const daysLeft = latest ? getDaysUntilDue(latest.end_date) : null;

          return (
            <div
              key={member.id}
              onClick={() => onSelectMember(member.id)}
              className="bg-gray-800 border border-gray-700 p-4 rounded-lg hover:border-orange-500 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  {/* PHOTO */}
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-orange-500/40 bg-slate-800 flex items-center justify-center">
                    {member.photo ? (
                      <img
                        src={getPhotoUrl(member.photo)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="text-orange-500" />
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold">{member.name}</h4>
                    <p className="text-sm text-gray-400">
                      ID: {member.member_no} • {latest?.package || "No Package"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {daysLeft === null
                        ? "No record"
                        : daysLeft < 0
                        ? "Expired"
                        : `${daysLeft} days left`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMemberForEdit(member);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-blue-400 hover:bg-blue-900/20 rounded"
                  >
                    <Edit size={18} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://wa.me/${member.contact_number}`);
                    }}
                    className="p-2 text-green-400 hover:bg-green-900/20 rounded"
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RENEW MODAL (unchanged logic) */}
      {isModalOpen && selectedMemberForEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-orange-500 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-orange-500">Update Membership</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleRenew} className="space-y-3">
              <input
                placeholder="Package"
                required
                className="w-full bg-slate-900 border border-slate-700 p-2 rounded"
                onChange={(e) =>
                  setFormData({ ...formData, package: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Amount Paid"
                className="w-full bg-slate-900 border border-slate-700 p-2 rounded"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount_paid: parseFloat(e.target.value) || 0,
                  })
                }
              />

              <button className="w-full bg-orange-500 py-2 rounded font-bold">
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
