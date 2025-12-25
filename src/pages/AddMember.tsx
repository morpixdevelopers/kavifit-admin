import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus } from 'lucide-react';

export function AddMember() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    const startDate = formData.get('date_of_joining') as string;
    const noOfMonths = Number(formData.get('no_of_months'));
    const totalAmount = Number(formData.get('total_amount'));
    const amountPaid = Number(formData.get('amount_paid'));

    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + noOfMonths);

    /* 1️⃣ Upload Photo */
    let photoUrl: string | null = null;
    const photoFile = formData.get('photo') as File | null;

    // const { data: { session }, error } = await supabase.auth.getSession();

  


    if (photoFile && photoFile.size > 0) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(fileName, photoFile);

      if (uploadError) {
        setMessage({ type: 'error', text: uploadError.message });
        setIsSubmitting(false);
        return;
      }

      const { data } = supabase.storage
        .from('member-photos')
        .getPublicUrl(fileName);

      photoUrl = data.publicUrl;
    }

    /* 2️⃣ Insert Member */
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
        photo: photoUrl,
      })
      .select()
      .single();

    if (memberError || !member) {
      setMessage({ type: 'error', text: memberError?.message || 'Failed to add member' });
      setIsSubmitting(false);
      return;
    }

    /* 3️⃣ Insert Membership */
    const { error: membershipError } = await supabase
      .from('memberships')
      .insert({
        member_id: member.id,
        package: formData.get('package'),
        no_of_months: noOfMonths,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        total_amount: totalAmount,
        amount_paid: amountPaid,
      });

    if (membershipError) {
      setMessage({ type: 'error', text: membershipError.message });
      setIsSubmitting(false);
      return;
    }

    setMessage({ type: 'success', text: 'Member added successfully' });
    (e.target as HTMLFormElement).reset();
    setPreview(null);
    setIsSubmitting(false);
  };

  /* UI TOKENS */
  const input =
    `w-full px-4 py-2 bg-[#334155] border border-[#2f4050]
     rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f97316]`;

  const label = 'block text-xs font-semibold text-slate-300 mb-1';

  return (
    <div className="bg-[#172033] min-h-screen py-10 px-4 text-white">
      <div className="max-w-5xl mx-auto bg-[#1e293b] p-8 rounded-xl border border-[#2f4050]">

        <div className="flex items-center gap-3 mb-6">
          <UserPlus className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl font-bold">Add New Member</h1>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-300 border border-green-600'
              : 'bg-red-900/30 text-red-300 border border-red-600'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* PERSONAL */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div>
                <label className={label}>Full Name</label>
                <input name="name" placeholder="e.g. John Doe" required className={input} />
              </div>

              <div>
                <label className={label}>Date of Joining</label>
                <input type="date" name="date_of_joining" required className={input} />
              </div>

              <div>
                <label className={label}>Age</label>
                <input type="number" name="age" placeholder="e.g. 25" required className={input} />
              </div>

              <div>
                <label className={label}>Height (cm)</label>
                <input type="number" name="height" placeholder="e.g. 170" required className={input} />
              </div>

              <div>
                <label className={label}>Weight (kg)</label>
                <input type="number" name="weight" placeholder="e.g. 65" required className={input} />
              </div>

              <div>
                <label className={label}>Blood Group</label>
                <select name="blood_group" required className={input}>
                  <option value="">Select blood group</option>
                  <option>A+</option><option>A-</option>
                  <option>B+</option><option>B-</option>
                  <option>AB+</option><option>AB-</option>
                  <option>O+</option><option>O-</option>
                </select>
              </div>

              <div className="md:col-span-3">
  <label className={label}>Profile Photo</label>

  <div className="flex items-center gap-6">
    {/* PREVIEW */}
    <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-600
                    flex items-center justify-center bg-[#0f172a] overflow-hidden">
      {preview ? (
        <img
          src={preview}
          alt="Preview"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-slate-500 text-sm text-center px-2">
          No photo<br />uploaded
        </span>
      )}
    </div>

    {/* UPLOAD BUTTON */}
    <div className="flex flex-col gap-2">
      <label
        htmlFor="photo"
        className="cursor-pointer inline-flex items-center gap-2
                   px-4 py-2 bg-orange-500 hover:bg-orange-600
                   text-black font-semibold rounded-lg transition"
      >
        Upload Photo
      </label>

      <input
        id="photo"
        type="file"
        name="photo"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setPreview(URL.createObjectURL(file));
          }
        }}
      />

      <p className="text-xs text-slate-400">
        JPG / PNG • Max 2MB
      </p>
    </div>
  </div>
</div>

            </div>
          </section>

          {/* CONTACT */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className={label}>Phone Number</label>
                <input
                  name="contact_number"
                  placeholder="e.g. 9876543210"
                  required
                  className={input}
                />
              </div>

              <div className="md:col-span-2">
                <label className={label}>Address</label>
                <textarea
                  name="address"
                  rows={3}
                  placeholder="House no, street, city, state"
                  required
                  className={input}
                />
              </div>

            </div>
          </section>

          {/* MEMBERSHIP */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Membership Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <select name="no_of_months" required className={input}>
                <option value="">Select duration</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>{i + 1} Month(s)</option>
                ))}
              </select>

              <select name="package" required className={input}>
                <option value="">Select package</option>
                <option>Basic</option>
                <option>Standard</option>
                <option>Premium</option>
                <option>Elite</option>
              </select>

              <input
                type="number"
                name="total_amount"
                placeholder="Total package amount (₹)"
                required
                className={input}
              />

              <input
                type="number"
                name="amount_paid"
                placeholder="Amount paid now (₹)"
                required
                className={input}
              />

            </div>
          </section>

          <div className="flex justify-end">
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
  );
}
