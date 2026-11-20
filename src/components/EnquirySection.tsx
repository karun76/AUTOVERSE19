import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitAutoverseEnquiry } from '../lib/supabase';

export const EnquirySection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitted(false);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Please enter your name, email address, and message.');
      return;
    }

    setSubmitting(true);
    try {
      await submitAutoverseEnquiry({ name, email, message });
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to submit your enquiry. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="enquiry" className="py-14 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium tracking-wider text-[#d6b45d] mb-2">
              Concierge & Feedback
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Send an Enquiry
            </h2>
            <p className="text-sm text-[#a7adba] leading-relaxed mt-3 max-w-md">
              Have a question about vehicle specifications, want to request a marque addition, or share feedback on the 3D Showroom? Send us a direct note.
            </p>
          </div>

          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="bg-[#12161f] border border-white/10 rounded-xl p-6 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="enquiry-name"
                    className="block text-xs font-medium text-[#d1d5df] mb-1.5"
                  >
                    Name
                  </label>
                  <input
                    id="enquiry-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full h-11 px-3.5 bg-[#0b0e14] border border-white/10 rounded-lg text-sm text-white placeholder:text-[#7f8798] focus:outline-none focus:border-[#d6b45d]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="enquiry-email"
                    className="block text-xs font-medium text-[#d1d5df] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="enquiry-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 bg-[#0b0e14] border border-white/10 rounded-lg text-sm text-white placeholder:text-[#7f8798] focus:outline-none focus:border-[#d6b45d]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="enquiry-message"
                  className="block text-xs font-medium text-[#d1d5df] mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="enquiry-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your vehicle enquiry or feedback..."
                  className="w-full p-3.5 bg-[#0b0e14] border border-white/10 rounded-lg text-sm text-white placeholder:text-[#7f8798] focus:outline-none focus:border-[#d6b45d] resize-y"
                />
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-red-950/50 border border-red-500/40 text-xs text-red-200"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {submitted && (
                <div
                  role="status"
                  className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-200"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" aria-hidden="true" />
                  <span>
                    Thank you! Your enquiry has been saved.
                  </span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 px-6 rounded-lg bg-[#d6b45d] text-[#090b10] text-xs font-semibold hover:bg-[#e2c26d] disabled:opacity-60 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{submitting ? 'Sending...' : 'Submit Enquiry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
