import { useEffect, useState } from 'react';
import { supabase, Member } from '../lib/supabase';
import { ArrowLeft, Phone } from 'lucide-react';

interface MemberDetailProps {
  memberId: string;
  onBack: () => void;
}

export function MemberDetail({ memberId, onBack }: MemberDetailProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMember();
  }, [memberId]);

  const fetchMember = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .maybeSingle();

    if (!error && data) {
      setMember(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black py-8 px-4 flex items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <div className="bg-slate-800 rounded-xl shadow-2xl p-8 text-center">
            <p className="text-slate-300">Member not found</p>
          </div>
        </div>
      </div>
    );
  }

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMemberStatus = (dueDate: string): 'active' | 'expiring' | 'expired' => {
    const daysUntilDue = getDaysUntilDue(dueDate);
    if (daysUntilDue >= 7) return 'active';
    if (daysUntilDue >= 0 && daysUntilDue < 7) return 'expiring';
    return 'expired';
  };

  const getStatusColor = (status: 'active' | 'expiring' | 'expired'): string => {
    switch (status) {
      case 'active':
        return 'bg-green-900 text-green-200 border-green-700';
      case 'expiring':
        return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'expired':
        return 'bg-red-900 text-red-200 border-red-700';
    }
  };

  const status = getMemberStatus(member.due_date);
  const daysUntilDue = getDaysUntilDue(member.due_date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-orange-500 border-opacity-30">
          <div className="bg-gradient-to-r from-orange-600 to-red-700 px-8 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{member.name}</h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-yellow-200">
                    <span className="text-lg">ID: {member.member_id}</span>
                  </div>
                  <div
                    className={`inline-block px-4 py-1 rounded-full text-sm font-semibold border ${getStatusColor(status)}`}
                  >
                    {status === 'active' ? 'Active' : status === 'expiring' ? 'Expiring Soon' : 'Expired'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-slate-400">Phone</p>
                      <p className="text-white font-medium">{member.contact_number}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-600">
                    <p className="text-xs text-slate-400 mb-1">Address</p>
                    <p className="text-slate-200">{member.address}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-600">
                    <p className="text-xs text-slate-400 mb-1">Occupation</p>
                    <p className="text-slate-200">{member.occupation}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <p className="text-slate-400">Age</p>
                    <p className="text-white font-medium">{member.age} years</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Height</p>
                    <p className="text-white font-medium">{member.height} cm</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Weight</p>
                    <p className="text-white font-medium">{member.weight} kg</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Blood Group</p>
                    <p className="text-white font-medium">{member.blood_group}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">Health Habits</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <p className="text-slate-400">Alcoholic</p>
                    <p className={`font-medium ${member.alcoholic ? 'text-red-400' : 'text-green-400'}`}>
                      {member.alcoholic ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Smoking Habit</p>
                    <p className={`font-medium ${member.smoking_habit ? 'text-red-400' : 'text-green-400'}`}>
                      {member.smoking_habit ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Teetotaler</p>
                    <p className={`font-medium ${member.teetotaler ? 'text-green-400' : 'text-red-400'}`}>
                      {member.teetotaler ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">Membership Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <p className="text-slate-400">Joining Date</p>
                    <p className="text-white font-medium">
                      {new Date(member.date_of_joining).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Due Date</p>
                    <p className="text-white font-medium">
                      {new Date(member.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Days Remaining</p>
                    <p
                      className={`font-bold text-lg ${
                        daysUntilDue < 0
                          ? 'text-red-400'
                          : daysUntilDue < 7
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} overdue` : `${daysUntilDue} days`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
              <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">Membership History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300">Package</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300">No of Months</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300">Join/Renew Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-600 hover:bg-slate-600 transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-medium">{member.package}</td>
                      <td className="px-4 py-3 text-slate-200">{member.no_of_months} months</td>
                      <td className="px-4 py-3 text-slate-200">
                        {new Date(member.date_of_joining).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {new Date(member.due_date).toLocaleDateString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
