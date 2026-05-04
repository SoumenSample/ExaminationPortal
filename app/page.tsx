"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#mission", label: "Mission" },
  { href: "#programs", label: "Programs" },
  { href: "#contact", label: "Contact" },
]

const values = [
  "Transparency and accountability",
  "Merit combined with need-based support",
  "Complete non-discrimination based on religion, caste, or gender",
  "Inclusivity and focus on marginalized communities",
  "Sustainability and long-term impact",
]

const whyChooseUs = [
  "Talent Recognition: We identify genuine talent and provide deserving support.",
  "Holistic Development: Academic scholarships plus practical skill development.",
  "Youth Empowerment: Helping young people succeed through ability and hard work.",
  "Contribution to Nation Building: Preparing students to strengthen India as a Vishwa Guru.",
  "Complete Non-Discrimination: Equal respect across religion, caste, and gender.",
  "Transparent and technology-driven process.",
  "Pan India vision with strong grassroots presence.",
]

const whyChooseCards = [
  {
    title: "Talent Recognition",
    description:
      "We identify genuine talent and provide students the deserving platform, support, and encouragement.",
  },
  {
    title: "Holistic Development",
    description:
      "Academic scholarships are combined with practical skill development for balanced growth.",
  },
  {
    title: "Youth Empowerment",
    description:
      "We guide future generations toward success through ability, capacity, and hard work.",
  },
  {
    title: "Nation Building",
    description:
      "Students are prepared to contribute to society and to India as a Vishwa Guru.",
  },
]

const additionalWhyChooseCards = whyChooseUs.slice(4).map((point) => {
  const [title, ...rest] = point.split(":")

  return {
    title: title.trim(),
    description: rest.length > 0 ? rest.join(":").trim() : point,
  }
})

const allWhyChooseCards = [...whyChooseCards, ...additionalWhyChooseCards]

const programSteps = [
  {
    title: "Student Registration",
    description:
      "Students register through our app with a nominal non-refundable fee to support administration, exam conduction, and platform maintenance.",
  },
  {
    title: "Competitive Examination",
    description:
      "Registered students appear for a structured exam focused on academic knowledge and aptitude.",
  },
  {
    title: "Merit-Based Selection",
    description:
      "Top performers are selected based on merit and financial need to ensure fair opportunities.",
  },
  {
    title: "Scholarship Disbursement",
    description:
      "Selected students receive financial assistance for fees, books, uniforms, and other educational needs via direct bank transfer.",
  },
]

export default function Home() {
  const mobileMenuRef = useRef<HTMLDetailsElement | null>(null)
  const [activeSection, setActiveSection] = useState("#home")

  useEffect(() => {
    const sectionIds = navLinks.map((link) => link.href.replace("#", ""))
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null)

    const updateActiveFromHash = () => {
      if (window.location.hash) {
        setActiveSection(window.location.hash)
      }
    }

    const updateActiveFromScroll = () => {
      const scrollMarker = window.scrollY + 180
      let currentSection = "#home"

      for (const section of sections) {
        if (section.offsetTop <= scrollMarker) {
          currentSection = `#${section.id}`
        }
      }

      setActiveSection(currentSection)
    }

    updateActiveFromHash()
    updateActiveFromScroll()
    window.addEventListener("hashchange", updateActiveFromHash)
    window.addEventListener("scroll", updateActiveFromScroll, { passive: true })

    return () => {
      window.removeEventListener("hashchange", updateActiveFromHash)
      window.removeEventListener("scroll", updateActiveFromScroll)
    }
  }, [])

  const getNavLinkClass = (href: string) =>
    activeSection === href
      ? "rounded-full px-4 py-2 font-bold text-slate-700 underline decoration-2 underline-offset-8 decoration-[#f37314]"
      : "rounded-full px-4 py-2 hover:bg-slate-100"

  const closeMobileMenu = () => {
    mobileMenuRef.current?.removeAttribute("open")
  }

  return (
    <div className="bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 bg-transparent">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-8">
          <div className="hidden items-center gap-4 md:grid md:grid-cols-[auto_1fr_auto]">
            <a href="#home" className="justify-self-start">
              <Image
                src="/logo.png"
                alt="Divyanshi Saksharta Mission Foundation logo"
                width={72}
                height={72}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-300"
                priority
              />
            </a>

            <nav className="justify-self-center rounded-full border border-slate-200 bg-white px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.15)]">
              <ul className="flex flex-wrap items-center justify-center gap-1 text-base font-semibold text-slate-600 md:gap-3">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setActiveSection(link.href)}
                      className={getNavLinkClass(link.href)}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="justify-self-end">
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-bold text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.12)] hover:bg-slate-100"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[#f37314] px-7 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(243,115,20,0.35)] hover:bg-[#dd640f]"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>

          <details ref={mobileMenuRef} className="group rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.12)] md:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Divyanshi Saksharta Mission Foundation logo"
                  width={52}
                  height={52}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-300"
                />
                <p className="text-sm font-extrabold text-slate-800">Divyanshi Saksharta Mission Foundation</p>
              </div>

              <span className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 shadow-sm group-open:hidden" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>

              <span className="hidden rounded-lg border border-slate-300 bg-white p-2 text-slate-700 shadow-sm group-open:inline" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
            </summary>

            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setActiveSection(link.href)
                    closeMobileMenu()
                  }}
                  className={`block rounded-xl px-4 py-2 font-semibold hover:bg-slate-100 ${
                    activeSection === link.href ? "text-slate-700 underline decoration-2 underline-offset-8  decoration-[#f37314]" : "text-slate-700"
                  }`}
                >
                  {link.label}
                </a>
              ))}

              <div className="flex gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={closeMobileMenu}
                  className="w-full rounded-xl bg-[#f37314] px-4 py-2 text-center text-sm font-bold text-white hover:bg-[#dd640f]"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </details>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-20 top-48 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-[38rem] h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />

        <section id="home" className="px-4 pb-20 pt-10 md:px-8 md:pt-14">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <article className="max-w-xl">
              <p className="inline-flex rounded-full bg-blue-100 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Welcome to Divyanshi Saksharta Mission Foundation
              </p>

              <h1 className="mt-5 text-4xl font-black uppercase leading-[1.05] text-blue-700 md:text-[3.4rem]">
                Better Education For Better World
              </h1>

              <p className="mt-6 text-sm leading-7 text-slate-600 md:text-base">
                Divyanshi Saksharta Mission Foundation supports underprivileged school and college-going students across
                Pan India through merit-based scholarships and practical skill development opportunities.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-full bg-rose-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-[0_10px_20px_rgba(244,63,94,0.35)] hover:bg-rose-400"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Login
                </Link>
              </div>
            </article>

            <aside className="relative">
              <div className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-slate-200 shadow-[0_24px_60px_rgba(37,99,235,0.16)]">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: "url('/hero-bg.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/45 via-slate-900/20 to-blue-900/35" />

                <div className="relative grid min-h-[300px] place-items-center p-6 md:min-h-[350px] md:p-10">
                  <div className="relative rounded-full border-4 border-white/95 bg-slate-900/70 p-3 shadow-[0_16px_30px_rgba(15,23,42,0.35)]">
                    <Image
                      src="/logo.png"
                      alt="Foundation emblem"
                      width={170}
                      height={170}
                      className="h-32 w-32 rounded-full object-cover md:h-40 md:w-40"
                    />
                  </div>
                </div>

                <div className="absolute bottom-6 right-6 rounded-xl bg-white/90 px-4 py-2 text-xs font-bold text-slate-800">
                  शिक्षित भारत, संगठित भारत, विकसित भारत
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="about" className="px-4 py-16 md:px-8">
          <div className="mx-auto w-full max-w-7xl rounded-[2rem] border border-slate-200 bg-[#fffdf8] p-8 shadow-[0_20px_45px_rgba(15,23,42,0.07)] md:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">About Us</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">Who We Are</h2>

            <div className="mt-10 grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
                <p className="leading-8 text-slate-700">
                  Divyanshi Saksharta Mission Foundation is a Section 8 Company registered under the Companies Act
                  2013. Founded in early 2026, we believe every child and young person deserves equal opportunity to
                  learn, grow, and succeed.
                </p>
                <p className="mt-4 leading-8 text-slate-700">
                  We focus on both academic scholarships and practical skill development to prepare the future
                  generation for real-world success.
                </p>
              </article>

              <article className="rounded-2xl border border-amber-300 bg-amber-100/60 p-6 md:p-7">
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-amber-800">Legal Details</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-800">
                  <li>
                    <span className="font-bold">CIN:</span> U88900WR2026NPL293005
                  </li>
                  <li>
                    <span className="font-bold">Registered Office:</span> Holding No-199, Dolui Para, Backside of
                    Karai Factory, Makhla, Hooghly, Serampur Uttarpara, West Bengal - 712245, India.
                  </li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="mission" className="px-4 py-16 md:px-8">
          <div className="mx-auto w-full max-w-7xl rounded-[2rem] border border-slate-200 bg-[#f8fbff] p-8 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-12">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Our Direction</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">Mission, Vision, Philosophy</h2>
              <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-amber-500" />
            </div>

            <div className="relative mt-12 grid gap-10 lg:grid-cols-3 lg:gap-6">

              <article className="mx-auto flex h-[300px] w-[300px] flex-col items-center justify-center rounded-full border-2 border-rose-300 bg-white p-8 text-center shadow-[0_16px_30px_rgba(251,113,133,0.18)]">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-sm font-black text-rose-700">1</span>
                <h3 className="text-xl font-black uppercase text-rose-700">Mission</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  To provide merit-based scholarships and skill development opportunities to underprivileged students so
                  they can pursue education without financial hurdles and build a confident, capable future.
                </p>
              </article>

              <article className="mx-auto flex h-[300px] w-[300px] flex-col items-center justify-center rounded-full border-2 border-sky-300 bg-white p-8 text-center shadow-[0_16px_30px_rgba(56,189,248,0.2)]">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-black text-sky-700">2</span>
                <h3 className="text-xl font-black uppercase text-sky-700">Vision</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  To create a Pan India movement where talent is recognized and given its deserving platform. We aim to
                  guide the youth generation toward success through ability, capacity, and hard work.
                </p>
              </article>

              <article className="mx-auto flex h-[300px] w-[300px] flex-col items-center justify-center rounded-full border-2 border-amber-300 bg-white p-8 text-center shadow-[0_16px_30px_rgba(251,191,36,0.2)]">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-700">3</span>
                <h3 className="text-xl font-black uppercase text-amber-700">Philosophy</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Recognizing true talent (Pratibha) and giving it the deserving position it merits while guiding youth
                  toward the right path to realize full potential and serve the nation.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-8">
          <div className="mx-auto w-full max-w-7xl rounded-[2rem] bg-slate-900 p-8 text-slate-100 md:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Our Values</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">What Guides Every Decision</h2>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {values.map((value, index) => (
                <div key={value} className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">Value {index + 1}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">{value}</p>
                </div>
              ))}
            </div>

            <p className="mt-7 max-w-5xl text-sm leading-7 text-slate-300">
              This institution is fully dedicated to the nation, society, and especially the youth generation without
              any discrimination based on religion, caste, or gender.
            </p>
          </div>
        </section>

        <section id="programs" className="px-4 py-16 md:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Our Programs</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">Student Registration and Scholarship Process</h2>
            <p className="mt-4 max-w-4xl leading-8 text-slate-700">
              We operate a simple, transparent, and technology-driven process through our mobile app.
            </p>

            <div className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
                <p className="font-bold text-emerald-700">Age 8-12 years</p>
                <p className="mt-2 text-slate-700">Rs 100</p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm">
                <p className="font-bold text-sky-700">Age 13-16 years</p>
                <p className="mt-2 text-slate-700">Rs 150</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm">
                <p className="font-bold text-amber-700">Age 17-22 years</p>
                <p className="mt-2 text-slate-700">Rs 200</p>
              </div>
            </div>

            <div className="mt-10 space-y-5">
              {programSteps.map((step, index) => (
                <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
                  <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
                    <div className="h-9 w-9 rounded-full bg-slate-900 text-center text-sm font-bold leading-9 text-white">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-700">{step.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-8">
          <div className="mx-auto w-full max-w-7xl rounded-[2rem] border border-sky-200 bg-[#eaf4fd] p-6 md:p-10">
            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-900 md:text-4xl">Why Choose Us?</h2>
              <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-orange-500" />
            </div>

            <div className="mx-auto mt-8 grid w-full max-w-5xl gap-4 md:grid-cols-2">
              {allWhyChooseCards.map((item, index) => (
                <article
                  key={item.title}
                  className={`rounded-2xl border border-sky-100 bg-white p-5 shadow-sm ${
                    index === allWhyChooseCards.length - 1 && allWhyChooseCards.length % 2 !== 0
                      ? "md:col-span-2 md:mx-auto md:w-[48%]"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-10 w-10 rounded-xl bg-sky-100 text-center text-sm font-bold leading-10 text-sky-700">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-800">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="px-4 py-16 md:px-8">
          <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_20px_45px_rgba(15,23,42,0.08)] md:p-9">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Contact and Office Details</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">Registered Office</h2>

              <p className="mt-5 leading-8 text-slate-700">
                Holding No-199, Dolui Para, Backside of Karai Factory, Makhla, Hooghly, Serampur Uttarpara, West
                Bengal - 712245, India.
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-700">
                Email: divyanshidsmf@gmail.com
                <br />
                WhatsApp / Mobile: 6291000845
              </p>
            </article>

            <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7 md:p-9">
              <h3 className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Donations, Partnerships, and Queries
              </h3>
              <p className="mt-4 leading-8 text-slate-700">
                We welcome donations, CSR partnerships, school collaborations, volunteers, and student registrations.
                Together, let us build a skilled and educated youth for a stronger India.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500"
                >
                  Register Student
                </Link>
                <a
                  href="https://wa.me/916291000845"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-emerald-300 bg-white px-6 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  WhatsApp Us
                </a>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="bg-[#050f2b] px-4 pt-14 text-slate-300 md:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 pb-10 md:grid-cols-3">
          <div>
            <Image
              src="/logo.png"
              alt="Divyanshi Saksharta Mission Foundation logo"
              width={70}
              height={70}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-300"
            />
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Divyanshi Saksharta Mission Foundation is dedicated to supporting underprivileged students through
              scholarships and skill development opportunities across India.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Quick Links</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="#home" className="hover:text-white">Home</a></li>
              <li><a href="#about" className="hover:text-white">About</a></li>
              <li><a href="#mission" className="hover:text-white">Mission</a></li>
              <li><a href="#programs" className="hover:text-white">Programs</a></li>
              <li><a href="#contact" className="hover:text-white">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Contact Info</h3>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-400">
              <li>divyanshidsmf@gmail.com</li>
              <li>+91 6291000845</li>
              <li>
                Holding No-199, Dolui Para, Makhla, Hooghly, Serampur Uttarpara, West Bengal - 712245, India.
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 py-6 text-center text-sm text-slate-400">
          <p>© 2026 Divyanshi Saksharta Mission Foundation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}