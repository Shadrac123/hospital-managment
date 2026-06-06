/**
 * Compute age in years from an ISO date string (YYYY-MM-DD).
 * Returns null when the value is missing or invalid.
 */
export function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/** Format an ISO date string as a human-readable date (e.g. "15 Jun 1990"). */
export function formatDob(dateOfBirth?: string): string {
  if (!dateOfBirth) return '—';
  const d = new Date(dateOfBirth);
  if (isNaN(d.getTime())) return dateOfBirth;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Generate an HTML string suitable for printing as a Patient ID Card.
 *
 * @param patient   AppUser profile fields
 * @param bookings  Summary of bookings (id, status, date, doctorName)
 */
export function buildPatientCardHtml(
  patient: {
    uid: string;
    displayName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    emergencyContact?: { name: string; phone: string; relationship: string };
    photoURL?: string | null;
    isActive?: boolean;
  },
  bookings: { id: string; status: string; date: string; doctorName?: string | null }[],
): string {
  const age = calculateAge(patient.dateOfBirth);
  const dob = formatDob(patient.dateOfBirth);
  const shortId = patient.uid.slice(0, 8).toUpperCase();
  const totalBookings = bookings.length;
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const assigned = bookings.filter((b) => b.status === 'assigned').length;
  const completed = bookings.filter((b) => b.status === 'completed').length;

  const genderLabel: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
    prefer_not_to_say: 'Not specified',
  };

  const photoSection = patient.photoURL
    ? `<img src="${patient.photoURL}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #4f6ef7;" />`
    : `<div style="width:80px;height:80px;border-radius:50%;background:#4f6ef7;display:flex;align-items:center;justify-content:center;font-size:28px;color:#fff;font-weight:700;">${(patient.displayName || 'P').charAt(0).toUpperCase()}</div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Patient Card – ${patient.displayName}</title>
  <style>
    body { font-family: -apple-system, Arial, sans-serif; margin: 0; padding: 24px; background: #f4f6fb; color: #1a1f36; }
    .card { background: #fff; border-radius: 16px; padding: 28px; max-width: 480px; margin: 0 auto; box-shadow: 0 2px 12px rgba(0,0,0,0.09); }
    .header { display: flex; align-items: center; gap: 20px; border-bottom: 1px solid #e5e9f5; padding-bottom: 20px; margin-bottom: 20px; }
    .name { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
    .pid { font-size: 11px; color: #7b8db0; font-family: monospace; letter-spacing: 0.5px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
    .active { background: #e6f9f0; color: #1a9057; }
    .archived { background: #fef3e2; color: #c07004; }
    .section { margin-bottom: 18px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #7b8db0; margin-bottom: 10px; }
    .row { display: flex; gap: 8px; margin-bottom: 6px; font-size: 13px; }
    .row-label { color: #7b8db0; min-width: 110px; flex-shrink: 0; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; }
    .stat { background: #f4f6fb; border-radius: 10px; padding: 10px; text-align: center; }
    .stat-val { font-size: 20px; font-weight: 700; color: #4f6ef7; }
    .stat-lbl { font-size: 10px; color: #7b8db0; margin-top: 2px; }
    .footer { text-align: center; font-size: 10px; color: #b0b8d0; margin-top: 20px; border-top: 1px solid #e5e9f5; padding-top: 14px; }
    .hospital { font-size: 13px; font-weight: 700; color: #4f6ef7; }
  </style>
</head>
<body>
  <div class="card">
    <div style="text-align:center;margin-bottom:16px;">
      <div class="hospital">🏥 Hospital Management System</div>
      <div style="font-size:11px;color:#7b8db0;margin-top:2px;">Patient Identity Card</div>
    </div>

    <div class="header">
      ${photoSection}
      <div>
        <div class="name">${patient.displayName}</div>
        <div class="pid">ID: #${shortId}</div>
        <div style="margin-top:6px;">
          <span class="badge ${patient.isActive !== false ? 'active' : 'archived'}">
            ${patient.isActive !== false ? 'Active' : 'Archived'}
          </span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Basic Information</div>
      <div class="row"><span class="row-label">Date of Birth</span><span>${dob}${age !== null ? ` (Age ${age})` : ''}</span></div>
      <div class="row"><span class="row-label">Gender</span><span>${genderLabel[patient.gender ?? ''] ?? '—'}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Contact Information</div>
      <div class="row"><span class="row-label">Email</span><span>${patient.email}</span></div>
      <div class="row"><span class="row-label">Phone</span><span>${patient.phone || '—'}</span></div>
      <div class="row"><span class="row-label">Address</span><span>${patient.address || '—'}</span></div>
    </div>

    ${patient.emergencyContact ? `
    <div class="section">
      <div class="section-title">Emergency Contact</div>
      <div class="row"><span class="row-label">Name</span><span>${patient.emergencyContact.name}</span></div>
      <div class="row"><span class="row-label">Phone</span><span>${patient.emergencyContact.phone}</span></div>
      <div class="row"><span class="row-label">Relationship</span><span>${patient.emergencyContact.relationship}</span></div>
    </div>` : ''}

    <div class="section">
      <div class="section-title">Booking Summary</div>
      <div class="stats">
        <div class="stat"><div class="stat-val">${totalBookings}</div><div class="stat-lbl">Total</div></div>
        <div class="stat"><div class="stat-val">${pending}</div><div class="stat-lbl">Pending</div></div>
        <div class="stat"><div class="stat-val">${assigned}</div><div class="stat-lbl">Assigned</div></div>
        <div class="stat"><div class="stat-val">${completed}</div><div class="stat-lbl">Completed</div></div>
      </div>
    </div>

    <div class="footer">
      Printed: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} &nbsp;·&nbsp; Hospital Management System
    </div>
  </div>
</body>
</html>`;
}
