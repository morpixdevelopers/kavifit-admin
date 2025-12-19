import { useState, useEffect } from 'react';
import { supabase, Member } from '../lib/supabase';
import { Users, Edit, MessageCircle, CheckCircle, XCircle } from 'lucide-react';

type FilterType = 'all' | 'active' | 'expiring' | 'expired';

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
    const { data } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    setMembers(data || []);
    setLoading(false);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const end = new Date(dueDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getMemberStatus = (dueDate: string): FilterType => {
    const days = getDaysUntilDue(dueDate);
    if (days > 7) return 'active';
    if (days >= 0) return 'expiring';
    return 'expired';
  };

  const filteredMembers =
    filter === 'all'
      ? members
      : members.filter(m => getMemberStatus(m.due_date) === filter);

  const counts = {
    all: members.length,
    active: members.filter(m => getMemberStatus(m.due_date) === 'active').length,
    expiring: members.filter(m => getMemberStatus(m.due_date) === 'expiring').length,
    expired: members.filter(m => getMemberStatus(m.due_date) === 'expired').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">

      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Members</h2>
        <p className="text-gray-400">Manage gym members and subscriptions</p>
      </div>

      {/* FILTER BUTTONS – ADMIN DESIGN */}
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

      {/* MEMBER CARDS – ADMIN DESIGN */}
      <div className="bg-gray-900 rounded-lg shadow-xl p-6 border border-gray-800">
        <h3 className="text-xl font-semibold mb-6">Members List</h3>

        {loading ? (
          <p className="text-gray-400 text-center py-8">Loading members...</p>
        ) : filteredMembers.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No members found.</p>
        ) : (
          <div className="space-y-3 max-h-[550px] overflow-y-auto">
            {filteredMembers.map(member => {
              const daysLeft = getDaysUntilDue(member.due_date);
              const isActive = daysLeft > 0;

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
                          <span className="text-orange-500 font-medium">ID:</span>{' '}
                          {member.member_id}
                        </p>
                        <p className="text-gray-400">
                          <span className="text-orange-500 font-medium">Package:</span>{' '}
                          {member.package}
                        </p>
                        <p className="text-gray-400">
                          <span className="text-orange-500 font-medium">Joined:</span>{' '}
                          {new Date(member.date_of_joining).toLocaleDateString()}
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
  <span className="text-gray-400">Expires:</span>{' '}
  {daysLeft < 0 ? 'Expired' : `${daysLeft} days left`}
</p>

                      </div>
                    </div>

                    <div className="ml-4 flex gap-2">
                      <button
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
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
