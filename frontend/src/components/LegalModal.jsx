import React from 'react';
import { X } from 'lucide-react';

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      ['Information we collect', 'We collect the details you provide when you create an account, request a reservation, contact our team, or subscribe to updates. This can include your name, contact details, booking preferences, and payment-related status.'],
      ['How we use information', 'We use this information to provide stays and experiences, process requests, send service messages, improve the website, and meet legal or security requirements. We do not sell guest information.'],
      ['Your choices', 'You can request access to, correction of, or deletion of your personal information by contacting the resort team. You can unsubscribe from promotional messages at any time.'],
      ['Data protection', 'We use reasonable administrative and technical safeguards. No online service can guarantee absolute security, so please contact us promptly if you believe your account has been compromised.'],
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    sections: [
      ['Reservations', 'Reservation details, rates, availability, cancellation terms, and guest requirements are confirmed during the booking process. Please review the confirmation before completing a reservation.'],
      ['Guest conduct', 'Guests must provide accurate information and follow resort, safety, and local regulations. We may decline or end a stay where conduct creates a safety, legal, or material property risk.'],
      ['Website use', 'Use this website lawfully and do not attempt to disrupt, reverse engineer, or gain unauthorized access to the service or another guest’s account.'],
      ['Changes and contact', 'We may update these terms as our services change. The latest version will be available here. Questions about a reservation or these terms can be sent to the resort team using the contact details in the footer.'],
    ],
  },
};

export default function LegalModal({ type, onClose }) {
  if (!type) return null;
  const content = CONTENT[type] || CONTENT.privacy;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title">
      <div className="legal-modal max-h-[85vh] w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-6 border-b border-[#e2ddd5] pb-5">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f6b66]">EQUALIRIO</p>
            <h2 id="legal-modal-title" className="text-3xl text-[#0e2a22]">{content.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="legal-close p-2 text-[#5f6b66]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-6 text-sm leading-7 text-[#5f6b66]">
          {content.sections.map(([heading, body]) => (
            <section key={heading}>
              <h3 className="mb-1 text-base font-semibold text-[#1a201e]">{heading}</h3>
              <p>{body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
