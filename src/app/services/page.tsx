'use client'
import { useEffect } from 'react'
import Link from 'next/link'

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

const CLINIC_SERVICES = [
  { name: 'Physical Examinations',          desc: 'Thorough health check-ups to keep your pet in the best shape.',                                          emoji: '🩺' },
  { name: 'Minor Soft Tissue Surgeries',    desc: 'Expert care for minor surgical procedures performed with precision and care.',                             emoji: '🩹' },
  { name: 'Vaccinations',                   desc: 'Protect your pet with core and lifestyle-specific vaccines.',                                              emoji: '💉' },
  { name: 'Grooming Services',              desc: 'Bathing, brushing, nail trimming & more to keep them looking and feeling great.',                          emoji: '✂️' },
  { name: 'Deworming & Tick Treatments',    desc: 'Safe & effective protection against parasites.',                                                           emoji: '🛡️' },
  { name: 'Diagnostics',                    desc: 'Blood tests, X-rays and more for accurate diagnosis and treatment.',                                       emoji: '🔬' },
  { name: 'Animal Birth Control Surgeries', desc: 'Spay & neuter procedures for a healthier, happier life.',                                                 emoji: '🐾' },
  { name: 'Pet Prescription Diets & Nutrition', desc: 'Specialized diets & nutrition plans for better health.',                                              emoji: '🥣' },
]

export default function ServicesPage() {
  useReveal()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="text-center py-16 px-8" style={{ background: '#FEF3C7' }}>
        <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-4" style={{ background: '#F59E0B', color: '#fff' }}>🩺 Expert Veterinary Care</div>
        <h1 className="font-black text-4xl text-gray-900 mb-3">Our Services</h1>
        <p className="text-gray-500 max-w-xl mx-auto text-[15px] leading-[1.7]">
          Comprehensive veterinary care at Dhrisha&rsquo;s Pet Planet &amp; Paws Care &amp; Heal — dedicated to keeping your beloved pets healthy and happy in Belagavi.
        </p>
      </div>

      {/* Services Grid */}
      <div className="px-10 py-14 max-sm:px-5">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black text-3xl mb-8 reveal">Our Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {CLINIC_SERVICES.map(s => (
              <div key={s.name} className="rounded-[20px] p-6 relative overflow-hidden cursor-default transition-transform hover:-translate-y-1 reveal"
                style={{ background: '#5BC8D4' }}>
                <div className="text-white font-black text-lg mb-2">
                  {s.emoji} {s.name}
                </div>
                {s.desc && (
                  <div className="text-white/88 text-sm leading-[1.65] mb-3">{s.desc}</div>
                )}
                <div className="mt-4">
                  <Link href="/book" className="inline-flex items-center gap-1.5 bg-white/95 text-gray-900 font-bold text-sm px-4 py-2.5 rounded-full transition-all hover:bg-white">
                    Book now →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-12 px-8" style={{ background: '#F59E0B' }}>
        <h2 className="font-black text-2xl text-gray-900 mb-3">Ready to Book?</h2>
        <p className="text-gray-900/70 mb-6">Online booking is free and instant. Or reach us on WhatsApp!</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/book" className="bg-gray-900 text-white font-extrabold px-8 py-3.5 rounded-full transition-all hover:bg-gray-700">📅 Book Now</Link>
          <a href="https://wa.me/919483852691" target="_blank" rel="noreferrer"
            className="font-extrabold px-8 py-3.5 rounded-full text-white transition-all hover:opacity-90" style={{ background: '#25D366' }}>📱 WhatsApp</a>
        </div>
      </div>
    </div>
  )
}
