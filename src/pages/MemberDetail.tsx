import { useEffect, useState ,useRef} from "react";




import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  X,
  CheckCircle2,
  UserMinus,
  UserPlus,
  User,
  Camera
} from "lucide-react";

interface Membership {
  id: string;
  package: string;
  no_of_months: number;
  start_date: string;
  end_date: string;
  amount_paid: number;
  total_amount: number;
  payment_method: string;
}

interface Member {
  id: string;
  member_no: number;
  name: string;
  age: number;
  height: number;
  weight: number;
  blood_group: string;
  contact_number: string;
  address: string;
  photo: string;
  occupation?: string;
  alcoholic?: boolean;
  smoking_habit?: boolean;
  teetotaler?: boolean;
  is_inactive?: boolean;
  created_at: string;
}

interface MemberDetailProps {
  memberId: string;
  onBack: () => void;
}

export function MemberDetail({ memberId, onBack }: MemberDetailProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [memberForm, setMemberForm] = useState<Partial<Member>>({});

  // Changed types to string | number to handle empty input erasing
  const [historyForm, setHistoryForm] = useState({
    package: "",
    no_of_months: 0,
    start_date: "",
    end_date: "",
    amount_paid: "" as string | number,
    balance_amount: "" as string | number,
    total_amount: 0, // Store total to keep calculations consistent
    payment_method: "Cash",
  });

  useEffect(() => {
    fetchMember();
  }, [memberId]);

  useEffect(() => {
    if (member) {
      setMemberForm({
        contact_number: member.contact_number,
        occupation: member.occupation,
        address: member.address,
        age: member.age,
        height: member.height,
        weight: member.weight,
        blood_group: member.blood_group,
        alcoholic: !!member.alcoholic,
        smoking_habit: !!member.smoking_habit,
        teetotaler: !!member.teetotaler,
      });
    }
  }, [member]);
const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (historyForm.start_date && historyForm.no_of_months > 0) {
      const startDate = new Date(historyForm.start_date);
      const dueDate = new Date(
        startDate.setMonth(startDate.getMonth() + historyForm.no_of_months)
      );
      const formattedDueDate = dueDate.toISOString().split("T")[0];
      if (formattedDueDate !== historyForm.end_date) {
        setHistoryForm((prev) => ({ ...prev, end_date: formattedDueDate }));
      }
    }
  }, [historyForm.start_date, historyForm.no_of_months]);

  const handlePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !member) return;
  
    const fileExt = file.name.split(".").pop();
    const fileName = `${member.id}.${fileExt}`;
  
    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(fileName, file, {
        upsert: true,
      });
  
    if (uploadError) {
      console.error("Upload error:", uploadError);
      return;
    }
  
    const { error: updateError } = await supabase
      .from("members")
      .update({ photo: fileName })
      .eq("id", member.id);
  
    if (!updateError) {
      fetchMember(); // refresh UI
    }
  };
  

  const getPhotoUrl = (photo?: string | null) => {
    if (!photo) return undefined;
    if (photo.startsWith("http")) return photo;

    return `${
      import.meta.env.VITE_SUPABASE_URL
    }/storage/v1/object/public/member-photos/${photo}`;
  };

  const fetchMember = async () => {
    setLoading(true);
    const { data: memberData } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();
    if (memberData) setMember(memberData);

    const { data: membershipData } = await supabase
      .from("memberships")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    setMemberships(membershipData || []);
    setLoading(false);
  };

  const toggleInactivate = async () => {
    if (!member) return;
    const newStatus = !member.is_inactive;
    const { error } = await supabase
      .from("members")
      .update({ is_inactive: newStatus })
      .eq("id", memberId);

    if (!error) fetchMember();
  };

  const latestMembership = memberships[0];

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("members")
      .update(memberForm)
      .eq("id", memberId);

    if (error) {
      console.error("Supabase Error:", error.message);
      alert("Update failed: " + error.message);
    } else {
      setIsMemberModalOpen(false);
      fetchMember();
    }
  };

  const handleEditLatestHistory = () => {
    if (!latestMembership) return;
    setHistoryForm({
      package: latestMembership.package,
      no_of_months: latestMembership.no_of_months,
      start_date: latestMembership.start_date,
      end_date: latestMembership.end_date,
      amount_paid: latestMembership.amount_paid,
      balance_amount:
        Number(latestMembership.total_amount) -
        Number(latestMembership.amount_paid),
      total_amount: Number(latestMembership.total_amount),
      payment_method: latestMembership.payment_method || "Cash",
    });
    setIsHistoryModalOpen(true);
  };

  const handleUpdateHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latestMembership) return;

    const paid = Number(historyForm.amount_paid) || 0;
    const balance = Number(historyForm.balance_amount) || 0;
    const total = paid + balance;

    const { error } = await supabase
      .from("memberships")
      .update({
        package: historyForm.package,
        no_of_months: historyForm.no_of_months,
        start_date: historyForm.start_date,
        end_date: historyForm.end_date,
        amount_paid: paid,
        total_amount: total,
        payment_method: historyForm.payment_method,
      })
      .eq("id", latestMembership.id);

    if (error) {
      console.error("History Update Error:", error.message);
    } else {
      setIsHistoryModalOpen(false);
      fetchMember();
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-r-transparent"></div>
      </div>
    );

  if (!member)
    return <div className="p-8 text-white text-center">Member not found</div>;

  const getDaysUntilDue = (date: string) =>
    Math.ceil(
      (new Date(date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000
    );

  let status = "expired";
  if (member.is_inactive) {
    status = "inactive";
  } else if (latestMembership) {
    const days = getDaysUntilDue(latestMembership.end_date);
    status = days >= 7 ? "active" : days >= 0 ? "expiring" : "expired";
  }

  // Common class to hide number arrows
  const hideArrowsClass =
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 font-sans text-white">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg mb-6 hover:bg-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-orange-500/30 relative">
          <div className="absolute top-6 right-6 flex items-center space-x-2">
            <button
              onClick={toggleInactivate}
              title={member.is_inactive ? "Mark as Active" : "Mark as Inactive"}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all border border-white/10"
            >
              {member.is_inactive ? (
                <UserPlus className="h-5 w-5" />
              ) : (
                <UserMinus className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all border border-white/10"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-gradient-to-r from-orange-600 to-red-700 px-8 py-6">
       

<div className="relative group w-16 h-16 rounded-full bg-white/20 overflow-hidden flex items-center justify-center border-2 border-white/30 cursor-pointer">
  {member.photo ? (
    <img
      src={getPhotoUrl(member.photo)}
      alt={member.name}
      className="w-full h-full object-cover"
    />
  ) : (
    <User className="text-white" size={32} />
  )}

  {/* Hover Overlay */}
  <div
    onClick={() => fileInputRef.current?.click()}
    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
  >
    <Camera className="text-white" size={20} />
  </div>
</div>

<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handlePhotoChange}
/>


            <div className="flex items-center space-x-4">
              <span className="text-yellow-200 text-lg">
                ID: {member.member_no}
              </span>

              <span
                className={`px-4 py-1 rounded-full text-sm font-semibold border ${
                  status === "active"
                    ? "bg-green-900 text-green-200 border-green-700"
                    : status === "inactive"
                    ? "bg-red-600 text-white border-red-400"
                    : "bg-red-900 text-red-200 border-red-700"
                }`}
              >
                {status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
                <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-slate-400">Phone</p>
                      <p className="text-white">{member.contact_number}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-600">
                    <p className="text-xs text-slate-400">Address</p>
                    <p className="text-slate-200">{member.address}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-600">
                    <p className="text-xs text-slate-400">Occupation</p>
                    <p className="text-slate-200">
                      {member.occupation || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
                <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">
                  Personal Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <p className="text-slate-400">Age</p>
                    <p className="text-white">{member.age} years</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Height</p>
                    <p className="text-white">{member.height} cm</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Weight</p>
                    <p className="text-white">{member.weight} kg</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Blood Group</p>
                    <p className="text-white">{member.blood_group}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
                <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">
                  Health Habits
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <p className="text-slate-400">Alcoholic</p>
                    <p
                      className={
                        member.alcoholic ? "text-red-400" : "text-green-400"
                      }
                    >
                      {member.alcoholic ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Smoking Habit</p>
                    <p
                      className={
                        member.smoking_habit ? "text-red-400" : "text-green-400"
                      }
                    >
                      {member.smoking_habit ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Teetotaler</p>
                    <p
                      className={
                        member.teetotaler ? "text-green-400" : "text-red-400"
                      }
                    >
                      {member.teetotaler ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
                <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">
                  Membership Status
                </h3>
                {latestMembership ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <p className="text-slate-400">Joining Date</p>
                      <p className="text-white">
                        {new Date(
                          latestMembership.start_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-slate-400">Due Date</p>
                      <p className="text-white">
                        {new Date(
                          latestMembership.end_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-slate-400">Days Remaining</p>
                      <p
                        className={`text-xl font-bold ${
                          getDaysUntilDue(latestMembership.end_date) > 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {getDaysUntilDue(latestMembership.end_date)} days
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400">No active records</p>
                )}
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg border border-slate-600 relative overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-slate-600">
                <h3 className="text-sm font-semibold text-slate-300 uppercase">
                  Membership History
                </h3>
                {latestMembership && (
                  <button
                    onClick={handleEditLatestHistory}
                    className="p-1 text-slate-400 hover:text-orange-500 transition-colors"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase">
                      <th className="px-4 py-3">Package</th>
                      <th className="px-4 py-3">Months</th>
                      <th className="px-4 py-3">Renew Date</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberships.map((m, index) => (
                      <tr
                        key={m.id}
                        className="border-t border-slate-600/50 text-slate-200"
                      >
                        <td className="px-4 py-4 flex items-center gap-2">
                          {m.package}
                          {index === 0 && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </td>
                        <td className="px-4 py-4">{m.no_of_months}</td>
                        <td className="px-4 py-4">
                          {new Date(m.start_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          {new Date(m.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-xs border border-slate-600">
                            {m.payment_method || "Cash"}
                          </span>
                        </td>
                        <td className="px-4 py-4">₹{m.amount_paid}</td>
                        <td className="px-4 py-4 text-red-400 font-medium">
                          ₹{m.total_amount - m.amount_paid}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-orange-500 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-orange-500">
                Edit Member Details
              </h3>
              <button onClick={() => setIsMemberModalOpen(false)}>
                <X className="text-gray-400 hover:text-white" />
              </button>
            </div>
            <form
              onSubmit={handleUpdateMember}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">
                  Phone
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white"
                  value={memberForm.contact_number || ""}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      contact_number: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">
                  Occupation
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white"
                  value={memberForm.occupation || ""}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, occupation: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">
                  Address
                </label>
                <textarea
                  className="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white"
                  rows={2}
                  value={memberForm.address || ""}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, address: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">
                  Age
                </label>
                <input
                  type="number"
                  className={`w-full bg-slate-900 p-2 rounded border border-slate-700 text-white ${hideArrowsClass}`}
                  value={memberForm.age || ""}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      age: e.target.value === "" ? 0 : parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">
                  Height (cm)
                </label>
                <input
                  type="number"
                  className={`w-full bg-slate-900 p-2 rounded border border-slate-700 text-white ${hideArrowsClass}`}
                  value={memberForm.height || ""}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      height:
                        e.target.value === "" ? 0 : parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  className={`w-full bg-slate-900 p-2 rounded border border-slate-700 text-white ${hideArrowsClass}`}
                  value={memberForm.weight || ""}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      weight:
                        e.target.value === "" ? 0 : parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">
                  Blood Group
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white"
                  value={memberForm.blood_group || ""}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      blood_group: e.target.value,
                    })
                  }
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-6 bg-slate-900/50 p-3 rounded mt-2 border border-slate-700/50">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!memberForm.alcoholic}
                    onChange={(e) =>
                      setMemberForm({
                        ...memberForm,
                        alcoholic: e.target.checked,
                      })
                    }
                    className="accent-orange-500 w-4 h-4"
                  />
                  Alcoholic
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!memberForm.smoking_habit}
                    onChange={(e) =>
                      setMemberForm({
                        ...memberForm,
                        smoking_habit: e.target.checked,
                      })
                    }
                    className="accent-orange-500 w-4 h-4"
                  />
                  Smoking Habit
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!memberForm.teetotaler}
                    onChange={(e) =>
                      setMemberForm({
                        ...memberForm,
                        teetotaler: e.target.checked,
                      })
                    }
                    className="accent-orange-500 w-4 h-4"
                  />
                  Teetotaler
                </label>
              </div>

              <button
                type="submit"
                className="md:col-span-2 bg-orange-500 hover:bg-orange-600 py-3 rounded-lg font-bold text-white mt-4 shadow-lg transition-all active:scale-95"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-orange-500 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-orange-500">
                Edit Latest Membership
              </h3>
              <button onClick={() => setIsHistoryModalOpen(false)}>
                <X className="text-gray-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleUpdateHistory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">
                  Package
                </label>
                <select
                  className="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white"
                  value={historyForm.package}
                  onChange={(e) =>
                    setHistoryForm({ ...historyForm, package: e.target.value })
                  }
                >
                  <option value="1 month">1 month</option>
                  <option value="3 month">3 month</option>
                  <option value="3+1 month">3+1 month</option>
                  <option value="6 month">6 month</option>
                  <option value="6+3 month">6+3 month</option>
                  <option value="12 month">12 month</option>
                  <option value="12+3 month">12+3 month</option>
                  <option value="12+6 month">12+6 month</option>
                  <option value="Personal Training">Personal Training</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">
                  Payment Method
                </label>
                <select
                  className="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white"
                  value={historyForm.payment_method}
                  onChange={(e) =>
                    setHistoryForm({
                      ...historyForm,
                      payment_method: e.target.value,
                    })
                  }
                >
                  <option value="Cash">Cash</option>
                  <option value="GPay">GPay</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-bold uppercase">
                    Months
                  </label>
                  <input
                    type="number"
                    className={`w-full bg-slate-900 p-2 rounded border border-slate-700 text-white ${hideArrowsClass}`}
                    value={
                      historyForm.no_of_months === 0
                        ? ""
                        : historyForm.no_of_months
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setHistoryForm({
                        ...historyForm,
                        no_of_months: val === "" ? 0 : parseInt(val),
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-bold uppercase">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    className={`w-full bg-slate-900 p-2 rounded border border-slate-700 text-green-500 font-bold ${hideArrowsClass}`}
                    value={
                      historyForm.total_amount === 0
                        ? ""
                        : historyForm.total_amount
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const newTotal = val === "" ? 0 : parseFloat(val);
                      const currentPaid = Number(historyForm.amount_paid) || 0;
                      setHistoryForm({
                        ...historyForm,
                        total_amount: newTotal,
                        balance_amount: newTotal - currentPaid,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-bold uppercase">
                    Renew Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white"
                    value={historyForm.start_date}
                    onChange={(e) =>
                      setHistoryForm({
                        ...historyForm,
                        start_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-bold uppercase">
                    Due Date (Auto)
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white"
                    value={historyForm.end_date}
                    onChange={(e) =>
                      setHistoryForm({
                        ...historyForm,
                        end_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-bold uppercase">
                    Paid (₹)
                  </label>
                  <input
                    type="number"
                    className={`w-full bg-slate-900 p-2 rounded border border-slate-700 text-green-400 ${hideArrowsClass}`}
                    value={
                      historyForm.amount_paid === 0
                        ? ""
                        : historyForm.amount_paid
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const paidNum = val === "" ? 0 : parseFloat(val);
                      const total = Number(historyForm.total_amount) || 0;

                      setHistoryForm({
                        ...historyForm,
                        amount_paid: val === "" ? "" : paidNum, // Keep empty string if user cleared it
                        balance_amount: total - paidNum,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-bold uppercase text-red-400">
                    Balance Amount (₹)
                  </label>
                  <input
                    type="number"
                    className={`w-full bg-slate-900 p-2 rounded border border-slate-700 text-red-400 font-bold ${hideArrowsClass}`}
                    value={
                      historyForm.balance_amount === 0
                        ? ""
                        : historyForm.balance_amount
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const balanceNum = val === "" ? 0 : parseFloat(val);
                      const total = Number(historyForm.total_amount) || 0;

                      setHistoryForm({
                        ...historyForm,
                        balance_amount: val === "" ? "" : balanceNum,
                        amount_paid: total - balanceNum,
                      });
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95"
              >
                Update Membership History
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
