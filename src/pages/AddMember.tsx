import { useState, FormEvent, useRef } from "react";
import { supabase } from "../lib/supabase";
import { UserPlus, X } from "lucide-react";

export function AddMember() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for live logic
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [contactNumber, setContactNumber] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");

  // Health Habits States
  const [alcoholic, setAlcoholic] = useState<boolean>(false);
  const [smokingHabit, setSmokingHabit] = useState<boolean>(false);
  const [teetotaler, setTeetotaler] = useState<boolean>(false);

  const balanceDue = totalAmount - amountPaid;
  const isPhoneValid = contactNumber.length === 10;

  const handleRemoveImage = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isPhoneValid) return;

    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const startDate = formData.get("date_of_joining") as string;
    const noOfMonths = Number(formData.get("no_of_months"));

    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + noOfMonths);

    let photoUrl: string | null = null;
    const photoFile = formData.get("photo") as File | null;

    if (photoFile && photoFile.size > 0) {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("member-photos")
        .upload(fileName, photoFile);

      if (!uploadError) {
        const { data } = supabase.storage
          .from("member-photos")
          .getPublicUrl(fileName);
        photoUrl = data.publicUrl;
      }
    }

    const { data: member, error: memberError } = await supabase
      .from("members")
      .insert({
        name: formData.get("name"),
        age: Number(formData.get("age")),
        height: Number(formData.get("height")),
        weight: Number(formData.get("weight")),
        blood_group: formData.get("blood_group"),
        contact_number: contactNumber,
        occupation: formData.get("occupation"),
        address: formData.get("address"),
        photo: photoUrl,
        alcoholic: alcoholic,
        smoking_habit: smokingHabit,
        teetotaler: teetotaler,
      })
      .select()
      .single();

    if (memberError || !member) {
      setMessage({
        type: "error",
        text: memberError?.message || "Failed to add member",
      });
      setIsSubmitting(false);
      return;
    }

    const { error: membershipError } = await supabase
      .from("memberships")
      .insert({
        member_id: member.id,
        package: formData.get("package"),
        no_of_months: noOfMonths,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        total_amount: totalAmount,
        amount_paid: amountPaid,
        payment_method: paymentMethod, // Added this field
      });

    if (membershipError) {
      setMessage({ type: "error", text: membershipError.message });
    } else {
      setMessage({ type: "success", text: "Member added successfully" });
      (e.target as HTMLFormElement).reset();
      handleRemoveImage();
      setTotalAmount(0);
      setAmountPaid(0);
      setContactNumber("");
      setAlcoholic(false);
      setSmokingHabit(false);
      setTeetotaler(false);
      setPaymentMethod("Cash");
    }
    setIsSubmitting(false);
  };

  const input = `w-full px-4 py-2 bg-[#334155] border border-[#2f4050] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f97316] transition-all`;
  const label = "block text-xs font-semibold text-slate-300 mb-1";

  return (
    <div className="bg-[#172033] min-h-screen py-10 px-4 text-white">
      <div className="max-w-5xl mx-auto bg-[#1e293b] p-8 rounded-xl border border-[#2f4050]">
        <div className="flex items-center gap-3 mb-6">
          <UserPlus className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl font-bold">Add New Member</h1>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-900/30 text-green-300 border border-green-600"
                : "bg-red-900/30 text-red-300 border border-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* PERSONAL DETAILS */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-slate-100">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <label className={label}>Profile Photo</label>
                <div className="flex items-center gap-6">
                  <div className="relative group w-28 h-28 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center bg-[#0f172a] overflow-hidden">
                    {preview ? (
                      <>
                        <img
                          src={preview}
                          className="w-full h-full object-cover"
                          alt="Preview"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-8 h-8 text-white" />
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-500 text-xs text-center px-2">
                        No photo uploaded
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="photo"
                      className="cursor-pointer px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-semibold rounded-lg transition"
                    >
                      Upload Photo
                    </label>
                    <input
                      id="photo"
                      type="file"
                      name="photo"
                      accept="image/*"
                      hidden
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setPreview(URL.createObjectURL(file));
                      }}
                    />
                    <p className="text-xs text-slate-400">
                      JPG / PNG • Max 2MB
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className={label}>Full Name</label>
                <input
                  name="name"
                  placeholder="e.g. John Doe"
                  required
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Date of Joining</label>
                <input
                  type="date"
                  name="date_of_joining"
                  required
                  className={input}
                />
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
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                  <option>O+</option>
                  <option>O-</option>
                </select>
              </div>
            </div>
          </section>

          {/* CONTACT DETAILS */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-slate-100">
              Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className={label}>Phone Number</label>
                <input
                  type="text"
                  name="contact_number"
                  placeholder="10-digit number"
                  value={contactNumber}
                  onChange={(e) =>
                    setContactNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  required
                  className={`${input} ${
                    contactNumber.length > 0 && !isPhoneValid
                      ? "border-red-500 ring-1 ring-red-500"
                      : ""
                  }`}
                />
                {contactNumber.length > 0 && !isPhoneValid && (
                  <p className="text-[10px] text-red-400 mt-1 absolute">
                    Must be exactly 10 digits
                  </p>
                )}
              </div>
              <div>
                <label className={label}>Occupation</label>
                <input
                  name="occupation"
                  placeholder="e.g. Shop owner, IT employee"
                  className={input}
                />
              </div>
              <div className="md:col-span-2">
                <label className={label}>Address</label>
                <textarea
                  name="address"
                  rows={3}
                  placeholder="House no, street, city, state"
                  className={input}
                />
              </div>
            </div>
          </section>

          {/* HEALTH HABITS */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-slate-100">
              Health Habits
            </h3>
            <div className="flex flex-wrap gap-8 bg-[#334155]/30 p-4 rounded-lg border border-[#2f4050]">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={alcoholic}
                  onChange={(e) => setAlcoholic(e.target.checked)}
                  className="w-5 h-5 rounded border-[#2f4050] bg-[#334155] text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  Alcoholic
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={smokingHabit}
                  onChange={(e) => setSmokingHabit(e.target.checked)}
                  className="w-5 h-5 rounded border-[#2f4050] bg-[#334155] text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  Smoking Habit
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={teetotaler}
                  onChange={(e) => setTeetotaler(e.target.checked)}
                  className="w-5 h-5 rounded border-[#2f4050] bg-[#334155] text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  Teetotaler
                </span>
              </label>
            </div>
          </section>

          {/* MEMBERSHIP DETAILS */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-slate-100">
              Membership Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={label}>Duration</label>
                <select name="no_of_months" required className={input}>
                  <option value="">Select duration</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1} Month(s)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Package</label>
                <select name="package" required className={input}>
                  <option value="">Select package</option>
                  <option>1 month</option>
                  <option>3 month</option>
                  <option>3+1 month</option>
                  <option>6 month</option>
                  <option>6+1 month</option>
                  <option>12 month</option>
                  <option>12+3 month</option>
                  <option>12+6 month</option>
                  <option>Personal Training</option>
                </select>
              </div>
              <div>
                <label className={label}>Total Package Amount (₹)</label>
                <input
                  type="number"
                  value={totalAmount || ""}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  required
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Amount Paid Now (₹)</label>
                <input
                  type="number"
                  value={amountPaid || ""}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  required
                  className={input}
                />
              </div>

              {/* BALANCE AND PAYMENT METHOD ROW */}
              <div className="flex flex-col md:flex-row gap-6 md:col-span-2">
                <div className="flex-1">
                  <label className={label}>Balance Amount (₹)</label>
                  <input
                    type="number"
                    readOnly
                    value={balanceDue}
                    className={`${input} bg-[#2d3a4d] border-slate-700 text-slate-400 cursor-not-allowed`}
                  />
                </div>
                <div className="flex-1">
                  <label className={label}>Payment Method</label>
                  <div className="flex items-center h-[42px] gap-6 bg-[#334155]/30 px-4 rounded-lg border border-[#2f4050]">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="payment_method"
                        value="Cash"
                        checked={paymentMethod === "Cash"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-orange-500 focus:ring-orange-500 bg-[#334155] border-[#2f4050]"
                      />
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                        Cash
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="payment_method"
                        value="GPay"
                        checked={paymentMethod === "GPay"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-orange-500 focus:ring-orange-500 bg-[#334155] border-[#2f4050]"
                      />
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                        GPay
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              disabled={isSubmitting || !isPhoneValid}
              className={`px-8 py-3 bg-orange-500 text-black font-semibold rounded-lg transition-all ${
                !isPhoneValid || isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-orange-600 active:scale-95"
              }`}
            >
              {isSubmitting ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
