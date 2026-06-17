'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Offer {
  id: string
  title: string
  tag: string
  description: string
  price: string
  original_price: string
  features: string
  card_color: string
  valid_until: string
  is_active: boolean
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('special_offers')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        if (error) {
          console.warn('Offers fetch error:', error.message)
          setOffers([])
        } else {
          setOffers(data || [])
        }
      } catch (err) {
        console.warn('Offers load failed:', err)
        setOffers([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-white">

      {/* ── HEADER ── */}
      <div className="text-center py-16 px-8" style={{ background: 'linear-gradient(135deg,#FEF3C7,#fff)' }}>
        <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-4"
          style={{ background: '#F59E0B', color: '#fff' }}>
          🎉 Exclusive Deals
        </div>
        <h1 className="font-black text-4xl text-gray-900 mb-3">Special Offers</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-[15px] leading-[1.7]">
          Exclusive packages for your beloved pets — book via WhatsApp for instant confirmation.
        </p>
      </div>

      {/* ── BODY ── */}
      <div className="px-10 py-14 max-sm:px-5">
        <div className="max-w-6xl mx-auto">

          {/* Loading spinner */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-12 h-12 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin mb-4" />
              <p className="text-gray-400 font-semibold text-sm">Loading offers…</p>
            </div>
          )}

          {/* Coming Soon — no offers yet */}
          {!loading && offers.length === 0 && (
            <div className="text-center py-16" style={{ animation: 'fadeInUp .5s ease both' }}>
              {/* Icon */}
              <div className="relative inline-block mb-6">
                <div className="text-7xl">🎁</div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-white animate-bounce"
                  style={{ background: '#F59E0B' }}>!</div>
              </div>

              <h2 className="font-black text-3xl text-gray-900 mb-3">Special Offers Coming Soon!</h2>
              <p className="text-gray-500 text-base max-w-md mx-auto leading-[1.7] mb-8">
                We&apos;re preparing exciting deals and packages for your pets.
                Check back soon or contact us directly — we always have something special for our clients!
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
                <a href="https://wa.me/919483852691?text=Hi! I'd like to know about any current special offers at Paws Care %26 Heal."
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-white font-extrabold px-7 py-3.5 rounded-full transition-all hover:opacity-90"
                  style={{ background: '#25D366' }}>
                  📱 Ask on WhatsApp
                </a>
                <Link href="/book"
                  className="flex items-center gap-2 font-extrabold px-7 py-3.5 rounded-full border-2 border-gray-200 text-gray-800 hover:border-amber-400 hover:text-amber-500 transition-all">
                  📅 Book Appointment
                </Link>
              </div>

              {/* Ghost placeholder cards */}
              <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {['#F59E0B', '#5BC8D4', '#111827'].map((bg, i) => (
                  <div key={i} className="rounded-2xl h-44 opacity-10" style={{ background: bg }} />
                ))}
              </div>
            </div>
          )}

          {/* Live Offers Grid */}
          {!loading && offers.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5" style={{ animation: 'fadeInUp .5s ease both' }}>
              {offers.map(o => {
                const featureList = o.features ? o.features.split('\n').filter(Boolean) : []
                const waMsg = `Hi! I'm interested in the "${o.title}" offer at Paws Care & Heal Belagavi. Please share details.`
                return (
                  <div key={o.id}
                    className="rounded-[20px] p-6 flex flex-col justify-between transition-transform hover:-translate-y-1"
                    style={{ background: o.card_color || '#F59E0B' }}>

                    <div>
                      {/* Badge */}
                      {o.tag && (
                        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 text-white"
                          style={{ background: 'rgba(255,255,255,.25)' }}>
                          {o.tag}
                        </span>
                      )}

                      {/* Title */}
                      <h3 className="text-white font-black text-xl mb-2 leading-[1.3]">{o.title}</h3>

                      {/* Description */}
                      {o.description && (
                        <p className="text-white/80 text-sm mb-3 leading-relaxed">{o.description}</p>
                      )}

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-white font-black text-3xl">{o.price}</span>
                        {o.original_price && (
                          <span className="text-white/70 text-sm line-through">{o.original_price}</span>
                        )}
                      </div>

                      {/* Features */}
                      {featureList.length > 0 && (
                        <ul className="space-y-1.5 mb-5">
                          {featureList.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-[13px] text-white/90">
                              <span className="text-white font-bold flex-shrink-0">✓</span> {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Validity */}
                      {o.valid_until && (
                        <div className="text-xs text-white/60 mb-3">
                          ⏰ Valid till {new Date(o.valid_until).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </div>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-2">
                      <a href={`https://wa.me/919483852691?text=${encodeURIComponent(waMsg)}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 text-white font-extrabold text-sm py-3 rounded-full transition-all hover:opacity-90"
                        style={{ background: '#25D366' }}>
                        📱 Book on WhatsApp
                      </a>
                      <Link href="/book"
                        className="flex items-center justify-center gap-2 text-white font-bold text-sm py-3 rounded-full transition-all"
                        style={{ background: 'rgba(255,255,255,.2)' }}>
                        📅 Book Online
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>

      {/* ── FAQ — always visible ── */}
      {!loading && (
        <div className="px-10 pb-14 max-sm:px-5">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-black text-3xl mb-6">Common Questions</h2>
            <div className="space-y-3">
              {[
                ['Can these packages be used for any pet?', 'Yes! All packages apply to dogs, cats, and small animals unless specifically mentioned.'],
                ['How do I pay?', 'We accept cash, UPI (GPay, PhonePe, Paytm), and card at the clinic. Full payment at time of visit.'],
                ['Can I reschedule?', 'Yes! Inform us at least 24 hours in advance via WhatsApp or call to reschedule at no charge.'],
              ].map(([q, a]) => (
                <div key={q} className="bg-white rounded-2xl p-5 border border-gray-100"
                  style={{ boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
                  <div className="font-extrabold text-[15px] mb-2">❓ {q}</div>
                  <div className="text-gray-500 text-[13.5px]">{a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
