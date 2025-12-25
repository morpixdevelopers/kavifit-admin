import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Phone } from 'lucide-react';

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
}

interface Membership {
  id: string;
  package: string;
  no_of_months: number;
  start_date: string;
  end_date: string;
}

interface MemberDetailProps {
  memberId: string;
  onBack: () => void;
}

export function MemberDetail({ memberId, onBack }: MemberDetailProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [memberId]);

  const fetchData = async () => {
    setLoading(true);

    const { data: memberData } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    const { data: membershipData } = await supabase
      .from('memberships')
      .select('*')
      .eq('member_id', memberId)
      .order('start_date', { ascending: false });

    setMember(memberData);
    setMemberships(membershipData || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-r-transparent" />
      </div>
    );
  }

  if (!member) return null;

  const activeMembership = memberships[0];

  const getDaysUntilDue = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / 86400000);
  };

  const daysUntilDue = activeMembership
    ? getDaysUntilDue(activeMembership.end_date)
    : -999;

  const status =
    daysUntilDue >= 7 ? 'active' : daysUntilDue >= 0 ? 'expiring' : 'expired';

  const getStatusColor = () => {
    if (status === 'active') return 'bg-green-900 text-green-200 border-green-700';
    if (status === 'expiring') return 'bg-yellow-900 text-yellow-200 border-yellow-700';
    return 'bg-red-900 text-red-200 border-red-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-orange-500/30">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-orange-600 to-red-700 px-8 py-6">
            <h1 className="text-4xl font-bold text-white mb-2">{member.name}</h1>
            <div className="flex items-center space-x-4">
              <span className="text-lg text-yellow-200">
                ID: {member.member_no}
              </span>
              {activeMembership && (
                <span
                  className={`inline-block px-4 py-1 rounded-full text-sm font-semibold border ${getStatusColor()}`}
                >
                  {status === 'active'
                    ? 'Active'
                    : status === 'expiring'
                    ? 'Expiring Soon'
                    : 'Expired'}
                </span>
              )}
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* CONTACT */}
            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
              <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">
                Contact Information
              </h3>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="text-white font-medium">{member.contact_number}</p>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-600">
                <p className="text-xs text-slate-400 mb-1">Address</p>
                <p className="text-slate-200">{member.address}</p>
              </div>
            </div>

            {/* PERSONAL */}
            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
              <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">
                Personal Information
              </h3>
              <div className="space-y-3">
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

            {/* MEMBERSHIP */}
            {activeMembership && (
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">
                  Membership Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <p className="text-slate-400">Package</p>
                    <p className="text-white">{activeMembership.package}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Duration</p>
                    <p className="text-white">
                      {activeMembership.no_of_months} months
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Start Date</p>
                    <p className="text-white">
                      {new Date(activeMembership.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Due Date</p>
                    <p className="text-white">
                      {new Date(activeMembership.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Days Remaining</p>
                    <p
                      className={`font-bold ${
                        daysUntilDue < 0
                          ? 'text-red-400'
                          : daysUntilDue < 7
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {daysUntilDue < 0
                        ? `${Math.abs(daysUntilDue)} overdue`
                        : `${daysUntilDue} days`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORY */}
            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
              <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">
                Membership History
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left px-4 py-2">Package</th>
                    <th className="px-4 py-2">Months</th>
                    <th className="px-4 py-2">Start</th>
                    <th className="px-4 py-2">End</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.map(m => (
                    <tr key={m.id} className="border-b border-slate-600">
                      <td className="px-4 py-2">{m.package}</td>
                      <td className="px-4 py-2">{m.no_of_months}</td>
                      <td className="px-4 py-2">
                        {new Date(m.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        {new Date(m.end_date).toLocaleDateString()}
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
  );
}
