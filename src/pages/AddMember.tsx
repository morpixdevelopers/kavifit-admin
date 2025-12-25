import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus } from 'lucide-react';

export function AddMember() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    const startDate = formData.get('date_of_joining') as string;
    const noOfMonths = Number(formData.get('no_of_months'));

    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + noOfMonths);

    /* -----------------------------
       1. INSERT MEMBER
    ------------------------------*/
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        name: formData.get('name'),
        age: Number(formData.get('age')),
        height: Number(formData.get('height')),
        weight: Number(formData.get('weight')),
        blood_group: formData.get('blood_group'),
        contact_number: formData.get('contact_number'),
        address: formData.get('address'),
      })
      .select()
      .single();

    if (memberError || !member) {
      setMessage({ type: 'error', text: memberError?.message || 'Failed to add member' });
      setIsSubmitting(false);
      return;
    }

    /* -----------------------------
       2. INSERT MEMBERSHIP
    ------------------------------*/
    const { error: membershipError } = await supabase
      .from('memberships')
      .insert({
        member_id: member.id,
        package: formData.get('package'),
        no_of_months: noOfMonths,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      });

    if (membershipError) {
      setMessage({ type: 'error', text: membershipError.message });
      setIsSubmitting(false);
      return;
    }

    setMessage({ type: 'success', text: 'Member added successfully' });
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  /* UI TOKENS */
  const pageBg = 'bg-[#172033]';
  const cardBg = 'bg-[#1e293b]';
  const inputBg = 'bg-[#334155]';
  const borderClr = 'border-[#2f4050]';
  const focusRing = 'focus:ring-[#f97316]';

  const label = 'block text-xs font-semibold text-slate-300 mb-1';
  const input =
    `w-full px-4 py-2 ${inputBg} border ${borderClr} rounded-lg text-white
     focus:outline-none focus:ring-2 ${focusRing}`;

  return (
    <div className={`${pageBg} min-h-screen py-10 px-4 text-white`}>
      <div className="max-w-5xl mx-auto">
        <div className={`${cardBg} rounded-xl border ${borderClr} shadow-xl p-8`}>
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-bold">Add New Member</h1>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-900/30 text-green-300 border border-green-600'
                  : 'bg-red-900/30 text-red-300 border border-red-600'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">

            {/* PERSONAL DETAILS */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={label}>Full Name</label>
                  <input name="name" required className={input} />
                </div>

                <div>
                  <label className={label}>Date of Joining</label>
                  <input type="date" name="date_of_joining" required className={input} />
                </div>

                <div>
                  <label className={label}>Age</label>
                  <input type="number" name="age" required className={input} />
                </div>

                <div>
                  <label className={label}>Height (cm)</label>
                  <input type="number" name="height" required className={input} />
                </div>

                <div>
                  <label className={label}>Weight (kg)</label>
                  <input type="number" name="weight" required className={input} />
                </div>

                <div>
                  <label className={label}>Blood Group</label>
                  <select name="blood_group" required className={input}>
                    <option value="">Select</option>
                    <option>A+</option><option>A-</option>
                    <option>B+</option><option>B-</option>
                    <option>AB+</option><option>AB-</option>
                    <option>O+</option><option>O-</option>
                  </select>
                </div>
              </div>
            </section>

            {/* CONTACT */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={label}>Phone Number</label>
                  <input name="contact_number" required className={input} />
                </div>

                <div className="md:col-span-2">
                  <label className={label}>Address</label>
                  <textarea name="address" rows={3} required className={input} />
                </div>
              </div>
            </section>

            {/* MEMBERSHIP */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Membership Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={label}>Number of Months</label>
                  <select name="no_of_months" required className={input}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i} value={i + 1}>{i + 1} Month(s)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={label}>Package</label>
                  <select name="package" required className={input}>
                    <option>Basic</option>
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>Elite</option>
                  </select>
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-4">
              <button
                disabled={isSubmitting}
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-black font-semibold rounded-lg"
              >
                {isSubmitting ? 'Adding...' : 'Add Member'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
