export const CLINIC_PHONE = '919483852691'

export function openWA(phone: string, message: string) {
  const clean = phone.replace(/\D/g, '')
  const num = clean.startsWith('91') ? clean : `91${clean}`
  if (typeof window !== 'undefined')
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank')
}

export function apptConfirmMsg(owner: string, pet: string, date: string, time: string) {
  return `🐾 *Dhrisha's Pet Planet — Appointment Confirmed!*\n\nDear ${owner},\n\n🐶 Pet: ${pet}\n📅 Date: ${date}\n⏰ Time: ${time}\n\n📍 Bhagya Nagar (9:30 AM–6:30 PM) / Hanuman Nagar (6:30 PM–8:30 PM)\n📞 094838 52691\n\nPlease arrive 5 minutes early. Thank you!`
}

export function reminderMsg(owner: string, pet: string, customMsg: string) {
  return customMsg ||
    `🐾 *Dhrisha's Pet Planet — Reminder*\n\nDear ${owner},\n\nThis is a friendly reminder for ${pet}'s next visit.\n\nPlease call 094838 52691 to book a slot.\n\nThank you! 🐾`
}

export function openClinicWA(msg?: string) {
  const m = msg || "Hi! I'd like to book an appointment at Dhrisha's Pet Planet in Belagavi."
  if (typeof window !== 'undefined')
    window.open(`https://wa.me/${CLINIC_PHONE}?text=${encodeURIComponent(m)}`, '_blank')
}
