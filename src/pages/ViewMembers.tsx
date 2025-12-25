import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Edit, MessageCircle, CheckCircle, XCircle } from 'lucide-react';

type FilterType = 'all' | 'active' | 'expiring' | 'expired';

interface MemberWithMembership {
  id: string;
  name: string;
  contact_number: string;
  member_no: number;
  created_at: string;
  memberships: {
    package: string;
    start_date: string;
    end_date: string;
  }[];
}

interface ViewMembersProps {
  onSelectMember: (memberId: string) => void;
}

export function ViewMembers({ onSelectMember }: ViewMembersProps) {
  const [members, setMembers] = useState<MemberWithMembership[]>([]);
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
          package,
          start_date,
          end_date
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMembers(data);
    }

    setLoading(false);
  };

  const getDaysUntilDue = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getMemberStatus = (endDate: string): FilterType => {
    const days = getDaysUntilDue(endDate);
    if (days > 7) return 'active';
    if (days >= 0) return 'expiring';
    return 'expired';
  };

  const filteredMembers =
    filter === 'all'
      ? members
      : members.filter(m => {
          const membership = m.memberships[0];
          if (!membership) return false;
          return getMemberStatus(membership.end_date) === filter;
        });

  const counts = {
    all: members.length,
    active: members.filter(
      m => m.memberships[0] && getMemberStatus(m.memberships[0].end_date) === 'active'
    ).length,
    expiring: members.filter(
      m => m.memberships[0] && getMemberStatus(m.memberships[0].end_date) === 'expiring'
    ).length,
    expired: members.filter(
      m => m.memberships[0] && getMemberStatus(m.memberships[0].end_date) === 'expired'
    ).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">

      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Members</h2>
        <p className="text-gray-400">Manage gym members and subscriptions</p>
      </div>

      {/* FILTERS */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            filter === 'all'
              ? 'bg-gray-400 text-black'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All ({counts.all})
        </button>

        <button
          onClick={() => setFilter('active')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            filter === 'active'
              ? 'bg-green-500 text-white'
              : 'bg-green-900/30 text-green-300 hover:bg-green-900/50 border border-green-500/50'
          }`}
        >
          Active ({counts.active})
        </button>

        <button
          onClick={() => setFilter('expiring')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            filter === 'expiring'
              ? 'bg-yellow-500 text-black'
              : 'bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50 border border-yellow-500/50'
          }`}
        >
          Expiring ({counts.expiring})
        </button>

        <button
          onClick={() => setFilter('expired')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            filter === 'expired'
              ? 'bg-red-500 text-white'
              : 'bg-red-900/30 text-red-300 hover:bg-red-900/50 border border-red-500/50'
          }`}
        >
          Expired ({counts.expired})
        </button>
      </div>

      {/* MEMBER LIST */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading members...</p>
        ) : filteredMembers.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No members found.</p>
        ) : (
          <div className="space-y-3 max-h-[550px] overflow-y-auto">
            {filteredMembers.map(member => {
              const membership = member.memberships[0];
              if (!membership) return null;

              const daysLeft = getDaysUntilDue(membership.end_date);

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
                        {daysLeft >= 0 ? (
                          <CheckCircle className="text-green-500 w-5 h-5" />
                        ) : (
                          <XCircle className="text-red-500 w-5 h-5" />
                        )}
                      </div>

                      <div className="text-sm space-y-1 text-gray-400">
                        <p><span className="text-orange-500">Member No:</span> {member.member_no}</p>
                        <p><span className="text-orange-500">Package:</span> {membership.package}</p>
                        <p>
                          <span className="text-orange-500">Joined:</span>{' '}
                          {new Date(membership.start_date).toLocaleDateString()}
                        </p>
                        <p
                          className={`font-medium ${
                            daysLeft < 0
                              ? 'text-red-500'
                              : daysLeft <= 7
                              ? 'text-yellow-400'
                              : 'text-green-400'
                          }`}
                        >
                          Expires:{' '}
                          {daysLeft < 0 ? 'Expired' : `${daysLeft} days left`}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="p-2 text-blue-400 hover:bg-blue-900/20 rounded">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          window.open(`https://wa.me/${member.contact_number}`, '_blank');
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
    </div>
  );
}
