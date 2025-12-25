import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Edit, MessageCircle, CheckCircle, XCircle } from 'lucide-react';

type FilterType = 'all' | 'active' | 'expiring' | 'expired';

interface Membership {
  id: string;
  package: string;
  start_date: string;
  end_date: string;
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
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select(`
        id,
        name,
        contact_number,
        member_no,
        created_at,
        memberships (
          id,
          package,
          start_date,
          end_date
        )
      `)
      .order('created_at', { ascending: false });

    if (!error) setMembers(data || []);
    setLoading(false);
  };

  const getDaysUntilDue = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getMemberStatus = (membership?: Membership): FilterType => {
    if (!membership) return 'expired';
    const days = getDaysUntilDue(membership.end_date);
    if (days > 7) return 'active';
    if (days >= 0) return 'expiring';
    return 'expired';
  };

  const filteredMembers =
    filter === 'all'
      ? members
      : members.filter(m => {
          const latestMembership = m.memberships[m.memberships.length - 1];
          return getMemberStatus(latestMembership) === filter;
        });

  const counts = {
    all: members.length,
    active: members.filter(m => getMemberStatus(m.memberships[m.memberships.length - 1]) === 'active').length,
    expiring: members.filter(m => getMemberStatus(m.memberships[m.memberships.length - 1]) === 'expiring').length,
    expired: members.filter(m => getMemberStatus(m.memberships[m.memberships.length - 1]) === 'expired').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Members</h2>
        <p className="text-gray-400">Manage gym members and subscriptions</p>
      </div>

      {/* FILTER BUTTONS */}
      <div className="mb-6 flex flex-wrap gap-3">
        {(['all', 'active', 'expiring', 'expired'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === f
                ? 'bg-gray-400 text-black'
                : f === 'active'
                ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50 border border-green-500/50'
                : f === 'expiring'
                ? 'bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50 border border-yellow-500/50'
                : f === 'expired'
                ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50 border border-red-500/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* MEMBER LIST */}
      <div className="bg-gray-900 rounded-lg shadow-xl p-6 border border-gray-800">
        <h3 className="text-xl font-semibold mb-6">Members List</h3>

        {loading ? (
          <p className="text-gray-400 text-center py-8">Loading members...</p>
        ) : filteredMembers.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No members found.</p>
        ) : (
          <div className="space-y-3 max-h-[550px] overflow-y-auto">
            {filteredMembers.map(member => {
              const latestMembership = member.memberships[member.memberships.length - 1];
              const daysLeft = latestMembership ? getDaysUntilDue(latestMembership.end_date) : null;
              const isActive = daysLeft !== null ? daysLeft >= 0 : false;

              return (
                <div
                  key={member.id}
                  onClick={() => onSelectMember(member.id)}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-orange-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-semibold">{member.name}</h4>
                        {isActive ? (
                          <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 ml-2" />
                        )}
                      </div>

                      <div className="space-y-1 text-sm">
                        <p className="text-gray-400">
                          <span className="text-orange-500 font-medium">Member No:</span> {member.member_no}
                        </p>
                        <p className="text-gray-400">
                          <span className="text-orange-500 font-medium">Package:</span>{' '}
                          {latestMembership?.package || 'N/A'}
                        </p>
                        <p className="text-gray-400">
                          <span className="text-orange-500 font-medium">Joined:</span>{' '}
                          {latestMembership ? new Date(latestMembership.start_date).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className={`font-medium ${
                          daysLeft === null
                            ? 'text-gray-300'
                            : daysLeft < 0
                            ? 'text-red-500'
                            : daysLeft <= 7
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }`}>
                          <span className="text-gray-400">Expires:</span>{' '}
                          {daysLeft === null ? 'N/A' : daysLeft < 0 ? 'Expired' : `${daysLeft} days left`}
                        </p>
                      </div>
                    </div>

                    <div className="ml-4 flex gap-2">
                      <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition" title="Edit">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          window.open(`https://wa.me/${member.contact_number}`, '_blank');
                        }}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition"
                        title="WhatsApp"
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
    </div>
  );
}
