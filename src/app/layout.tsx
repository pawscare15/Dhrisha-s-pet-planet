import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatBot from '@/components/chatbot/ChatBot'

// UPDATED WITH REAL GOOGLE DATA
export const metadata: Metadata = {
  title: "Dhrisha's Pet Planet | Best Vet Clinic in Belagavi | 4.9★ Google",
  description:
    "Dhrisha's Pet Planet & Paws Care & Heal — Belagavi's #1 rated veterinary clinics (4.9★, 223+ reviews). Expert care for dogs, cats & small animals. #3270, Hari Nikunj, 2nd Cross, Bhagya Nagar, Belagavi 590 006. Call 094838 52691.",
  keywords: 'pet clinic belagavi, veterinary belgaum, dog cat doctor belagavi, dhrisha pet planet, paws care heal, bhagya nagar belagavi, best vet belagavi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-white text-gray-900 antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ChatBot />
      </body>
    </html>
  )
}
