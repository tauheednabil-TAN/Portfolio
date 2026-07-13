import React, { useState, useEffect } from "react";
import { Coffee, Video, Calendar, User, Mail, FileText, Check, Clock, Globe } from "lucide-react";
import { SceneState } from "../types.js";

interface BookingPanelProps {
  onStateChange: (state: SceneState, text: string) => void;
}

interface TimeSlot {
  label: string;
  startIso: string;
  endIso: string;
}

interface DayOption {
  dateStr: string; // "YYYY-MM-DD"
  displayDay: string; // "Monday, Jul 14"
  slots: TimeSlot[];
}

export default function BookingPanel({ onStateChange }: BookingPanelProps) {
  const [days, setDays] = useState<DayOption[]>([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"meet" | "in_person">("meet");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userTimezone, setUserTimezone] = useState("UTC");

  useEffect(() => {
    // Detect visitor timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(tz);
    } catch (e) {
      setUserTimezone("UTC");
    }
    generateAvailableSlots();
  }, []);

  const generateAvailableSlots = () => {
    const list: DayOption[] = [];
    const now = new Date();
    let currentDay = new Date(now);

    // Generate the next 5 business days (skipping Sat/Sun)
    let daysCount = 0;
    while (daysCount < 5) {
      currentDay.setDate(currentDay.getDate() + 1);
      const dayOfWeek = currentDay.getDay();

      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sat/Sun
        const dateStr = currentDay.toISOString().split("T")[0];
        const displayDay = currentDay.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });

        // Compute slots in Copenhagen time (10:00 to 18:00)
        // Denmark is CEST (UTC+2) in July. Let's make slots from 10:00 to 18:00 Copenhagen Time
        // We will construct these times in Copenhagen Time zone, then convert them to Local Browser Times
        const daySlots: TimeSlot[] = [];
        for (let hour = 10; hour < 18; hour++) {
          // Construct top of the hour slot (e.g. 10:00 - 10:30)
          const startTop = new Date(`${dateStr}T${hour.toString().padStart(2, "0")}:00:00Z`);
          // Adjust for Copenhagen offset (Denmark is UTC+2 in summer, UTC+1 in winter). Let's adjust -2 hours for summer relative to UTC
          startTop.setHours(startTop.getHours() - 2); // Convert Denmark Time back to UTC base

          const endTop = new Date(startTop);
          endTop.setMinutes(endTop.getMinutes() + 30);

          daySlots.push({
            label: `${hour.toString().padStart(2, "0")}:00 - ${hour.toString().padStart(2, "0")}:30`,
            startIso: startTop.toISOString(),
            endIso: endTop.toISOString(),
          });

          // Construct half past the hour slot (e.g. 10:30 - 11:00)
          const startHalf = new Date(`${dateStr}T${hour.toString().padStart(2, "0")}:30:00Z`);
          startHalf.setHours(startHalf.getHours() - 2); // Adjust -2 hours for Denmark summer

          const endHalf = new Date(startHalf);
          endHalf.setMinutes(endHalf.getMinutes() + 30);

          daySlots.push({
            label: `${hour.toString().padStart(2, "0")}:30 - ${(hour + 1).toString().padStart(2, "0")}:00`,
            startIso: startHalf.toISOString(),
            endIso: endHalf.toISOString(),
          });
        }

        list.push({
          dateStr,
          displayDay,
          slots: daySlots,
        });
        daysCount++;
      }
    }
    setDays(list);
  };

  const formatLocalTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name.trim() || !email.trim()) return;

    setSubmitting(true);
    onStateChange("thinking", "Drafting calendar invite...");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_name: name,
          visitor_email: email,
          note,
          mode,
          start_ts: selectedSlot.startIso,
          end_ts: selectedSlot.endIso,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        onStateChange("celebrate", `YAY! Meeting submitted with ${name}! Check email confirmation once Nabil approves! ☕`);
      } else {
        throw new Error("Failed to submit");
      }
    } catch (err) {
      console.error(err);
      onStateChange("confused", "Oh no! There was a glitch in the booking machine! 😅 Let's try picking another slot.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setNote("");
    setSelectedSlot(null);
    setSuccess(false);
    onStateChange("idle", "Ready to book a 30-minute chat? Pick a time!");
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] font-sans text-stone-100">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold font-display text-stone-50 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-amber-500 animate-pulse" /> Meet with Tauheed
        </h2>
        <p className="text-xs md:text-sm text-stone-400 mt-1">
          Tauheed lives and works in Copenhagen (Central European Time). Below, select a 30-minute time slot, converted automatically to your local timezone!
        </p>
      </div>

      {success ? (
        <div className="text-center py-10 bg-amber-500/5 border border-dashed border-amber-500/30 rounded-2xl max-w-lg mx-auto p-5 animate-comic-pop">
          <span className="text-4xl">🎉</span>
          <h3 className="text-lg font-bold font-display text-amber-400 mt-3">Booking Request Submitted!</h3>
          <p className="text-xs text-stone-300 mt-2 max-w-md mx-auto leading-relaxed">
            Excellent! Nabil has received your request. A notification email has been dispatched. Once approved, a Google Calendar invite containing a Google Meet link will be automatically scheduled!
          </p>
          <button
            onClick={resetForm}
            className="mt-6 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-stone-50 font-bold rounded-xl cursor-pointer text-xs transition-colors"
          >
            Book Another Slot
          </button>
        </div>
      ) : (
        <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar Day & Slot Selector */}
          <div>
            <label className="text-xs font-bold text-stone-300 uppercase font-mono flex items-center gap-1.5 mb-2.5">
              <Calendar className="w-4 h-4 text-amber-500" /> 1. Select a Day
            </label>

            {/* Days Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
              {days.map((d, idx) => (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDayIdx(idx);
                    setSelectedSlot(null);
                  }}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl flex-shrink-0 cursor-pointer transition-all ${
                    selectedDayIdx === idx
                      ? "bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-md"
                      : "bg-zinc-900/40 text-stone-300 border border-white/5 hover:bg-zinc-800"
                  }`}
                >
                  {d.displayDay}
                </button>
              ))}
            </div>

            <label className="text-xs font-bold text-stone-300 uppercase font-mono flex items-center gap-1.5 mb-2.5">
              <Clock className="w-4 h-4 text-amber-500" /> 2. Pick a 30-Min Slot
            </label>

            {/* Timezone display */}
            <div className="text-[10px] text-stone-400 flex items-center gap-1.5 mb-2.5 font-mono">
              <Globe className="w-3.5 h-3.5 text-stone-500" />
              <span>Displaying times in your zone: <strong className="text-amber-400">{userTimezone}</strong></span>
            </div>

            {/* Slots Grid */}
            {days[selectedDayIdx] && (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-white/5 rounded-xl p-2.5 bg-black/10">
                {days[selectedDayIdx].slots.map((slot) => {
                  const isChosen = selectedSlot?.startIso === slot.startIso;
                  return (
                    <button
                      key={slot.startIso}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        onStateChange("welcome", `Great choice! ${formatLocalTime(slot.startIso)} on ${days[selectedDayIdx].displayDay}. Fill out your details!`);
                      }}
                      className={`px-2 py-2.5 text-xs font-semibold rounded-lg text-center cursor-pointer transition-all border ${
                        isChosen
                          ? "bg-amber-600 text-stone-50 border-amber-500/30 font-bold shadow-lg"
                          : "bg-zinc-900/40 text-stone-300 border-white/5 hover:bg-zinc-800 hover:border-amber-500/25"
                      }`}
                    >
                      {formatLocalTime(slot.startIso)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Visitor Details Input */}
          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold text-stone-300 uppercase font-mono flex items-center gap-1.5 border-b border-white/5 pb-2">
              <User className="w-4 h-4 text-amber-500" /> 3. Enter Your Details
            </label>

            {/* Name Input */}
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-stone-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-950/40 border border-white/10 rounded-xl focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-stone-100 text-xs md:text-sm placeholder-stone-500"
              />
            </div>

            {/* Email Input */}
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-stone-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your Email"
                className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-950/40 border border-white/10 rounded-xl focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-stone-100 text-xs md:text-sm placeholder-stone-500"
              />
            </div>

            {/* Booking Mode */}
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => setMode("meet")}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === "meet"
                    ? "bg-amber-600/20 border-amber-500/40 text-amber-300 font-bold"
                    : "bg-zinc-900/40 border-white/5 text-stone-300 hover:bg-zinc-800"
                }`}
              >
                <Video className="w-4 h-4" />
                Google Meet
              </button>
              <button
                type="button"
                onClick={() => setMode("in_person")}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === "in_person"
                    ? "bg-amber-600/20 border-amber-500/40 text-amber-300 font-bold"
                    : "bg-zinc-900/40 border-white/5 text-stone-300 hover:bg-zinc-800"
                }`}
              >
                <Coffee className="w-4 h-4" />
                Copenhagen 🇩🇰
              </button>
            </div>

            {/* Note Textarea */}
            <div className="relative">
              <span className="absolute left-3 top-3 text-stone-500">
                <FileText className="w-4 h-4" />
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What would you like to chat about? (Skills, Hire, Project ideas...)"
                rows={3}
                className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-950/40 border border-white/10 rounded-xl focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-stone-100 text-xs md:text-sm placeholder-stone-500 resize-none"
              />
            </div>

            {/* Confirm booking Button */}
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="w-full py-3 bg-amber-600 text-stone-50 font-bold rounded-xl border border-amber-500/30 hover:bg-amber-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:hover:scale-100 font-display text-xs md:text-sm mt-2 shadow-lg shadow-amber-900/10"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting request...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Request Sync Session</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
