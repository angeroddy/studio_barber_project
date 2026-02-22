'use client';

import { Button } from '@/components/ui/button';
import { Navbar01 } from '@/components/ui/shadcn-io/navbar-01';
import { InfiniteMarquee } from '@/components/ui/infinite-marquee';
import { AnimatedSection } from '@/components/ui/animated-section';
import { Footer2 } from '@/components/footer2';
import Link from 'next/link';


export default function Home() {
  return (
    <>
      <div className="relative w-full">
        <Navbar01 />
      </div>
      <main>
      <div className="main-section relative w-full min-h-125 sm:min-h-150 md:min-h-175 lg:h-200 overflow-hidden flex justify-center ">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/get.mp4" type="video/mp4" />
        </video>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 flex justify-center items-center flex-col leading-none px-4">
          <h1 className='font-archivo font-[1000] text-white m-0 text-[60px] sm:text-[80px] md:text-[120px] lg:text-[220px] leading-tight lg:leading-40 text-center lg:text-start tracking-tight lg:tracking-[-20]'>STUDIO <br></br> <span className='font-archivo font-black text-white m-0 text-[60px] sm:text-[80px] md:text-[120px] lg:text-[220px] tracking-tight lg:tracking-[-20]'>BARBER</span></h1>

          <p className='text-white font-archivo font-[350] text-[18px] sm:text-[24px] md:text-[32px] lg:text-[45px] text-center lg:text-start mt-2 lg:mt-0 lg:mr-15'>PLUS QU&apos;UNE COUPE, UN RITUEL</p>
          <Link href="/reserver">
            <Button variant="outline" className="cursor-pointer font-archivo font-black bg-[#DE2788] mt-4 text-white rounded-none border-none text-sm sm:text-base md:text-lg lg:text-xl px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 whitespace-nowrap">PRENDRE UN RENDEZ-VOUS </Button>
          </Link>
        </div>

      </div>
      <InfiniteMarquee
        speed={1}
        className="font-archivo font-black text-[16px] sm:text-[20px] md:text-[24px] lg:text-[30px] text-white flex justify-center items-center bg-[#DE2788] h-12.5 sm:h-13.75 lg:h-15 w-full"
      >
        <span className="px-6">STUDIO BARBER • CHAMPIONNET • CLEMENCEAU •</span>
      </InfiniteMarquee>
      <div id="salons" className="other-section flex bg-white relative" >
        
        <div
          className="flex justify-center items-center salons-section p-4 sm:p-6 md:p-8 lg:p-10 flex-col relative w-full"

        >
          <AnimatedSection variant="fadeIn" delay={0.2}>
            <h2 className='text-black font-archivo text-[32px] sm:text-[40px] md:text-[50px] lg:text-[60px] font-black leading-tight lg:leading-15 relative z-10 text-center'> DEUX BARBERSHOPS</h2>
          </AnimatedSection>
          <AnimatedSection variant="fadeIn" delay={0.4}>
            <p className='text-black font-archivo flex items-center gap-2 text-[18px] sm:text-[22px] md:text-[26px] lg:text-[28px] mt-2'>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin sm:w-6 sm:h-6 md:w-7 md:h-7">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              A grenoble
            </p>
          </AnimatedSection>
          <div className="salon-cont flex flex-col lg:flex-row justify-center items-center relative z-10 mt-6 sm:mt-8 lg:mt-10 w-full gap-8 sm:gap-10 lg:gap-20">
            <AnimatedSection variant="slideLeft" delay={0.3} className="left flex-col flex justify-center items-start w-full lg:w-auto">
              <div className="box w-full sm:w-87.5 md:w-100 lg:w-125 h-75 sm:h-87.5 md:h-100 lg:h-125 bg-white relative group overflow-hidden cursor-pointer" style={{
                backgroundImage: `url('/Championnet.avif')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                {/* Badge "HORAIRES" */}
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-[#DE2788] text-white px-3 py-1.5 sm:px-4 sm:py-2 font-monument text-xs sm:text-sm flex items-center gap-2 z-20 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  HORAIRES
                </div>

                {/* Overlay au hover */}
                <div className="absolute inset-0 bg-[#DE2788] opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex flex-col items-center justify-center animate-show-once px-4">
                  <h3 className="text-white font-monument text-xl sm:text-2xl lg:text-3xl mb-4 sm:mb-6">HORAIRES</h3>
                  <div className="text-white font-archivo text-sm sm:text-base space-y-1 text-center">
                    <p className="font-semibold mt-2">Lundi</p>
                    <p>Fermé</p>
                    <p className="font-semibold mt-2">Mardi - Vendredi</p>
                    <p>10:00 - 12:00 / 13:00 - 19:00</p>
                    <p className="font-semibold mt-2">Samedi</p>
                    <p>10:00 - 12:00 / 13:00 - 17:00</p>
                    <p className="font-semibold mt-2">Dimanche</p>
                    <p>Fermé</p>
                  </div>
                </div>
              </div>
              <p className='text-black font-cygrotesk mt-2 text-[16px] sm:text-[18px] lg:text-[20px]'>STUDIO BARBER
                CHAMPIONNET <br></br> <span className='font-archivo'>42 Rue Lesdiguières, Grenoble</span></p>
              <Link href="/reserver">
                <Button variant="outline" className="cursor-pointer bg-[#DE2788] mt-4 text-white rounded-none border-none text-sm sm:text-base md:text-lg px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-4 whitespace-nowrap font-archivo">PRENDRE UN RENDEZ-VOUS </Button>
              </Link>
            </AnimatedSection>
            <AnimatedSection variant="slideRight" delay={0.3} className="right flex-col flex justify-center items-start w-full lg:w-auto">
              <div className="box w-full sm:w-87.5 md:w-100 lg:w-125 h-75 sm:h-87.5 md:h-100 lg:h-125 bg-white relative group overflow-hidden cursor-pointer" style={{
                backgroundImage: `url('/Clemenceau.avif')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                {/* Badge "HORAIRES" */}
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-[#DE2788] text-white px-3 py-1.5 sm:px-4 sm:py-2 font-monument text-xs sm:text-sm flex items-center gap-2 z-20 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  HORAIRES
                </div>

                {/* Overlay au hover */}
                <div className="absolute inset-0 bg-[#DE2788] opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex flex-col items-center justify-center animate-show-once px-4">
                  <h3 className="text-white font-monument text-xl sm:text-2xl lg:text-3xl mb-4 sm:mb-6">HORAIRES</h3>
                  <div className="text-white font-archivo text-sm sm:text-base space-y-1 text-center">
                    <p className="font-semibold mt-2">Lundi</p>
                    <p>Fermé</p>
                    <p className="font-semibold mt-2">Mardi - Vendredi</p>
                    <p>10:00 - 12:00 / 13:00 - 19:00</p>
                    <p className="font-semibold mt-2">Samedi</p>
                    <p>10:00 - 12:00 / 13:00 - 17:00</p>
                    <p className="font-semibold mt-2">Dimanche</p>
                    <p>Fermé</p>
                  </div>
                </div>
              </div>
              <p className='text-black font-cygrotesk mt-2 text-[16px] sm:text-[18px] lg:text-[20px]'>STUDIO BARBER
                CLEMENCEAU <br></br> <span className='font-archivo'>47 Boulevard Clemenceau, Grenoble</span></p>
              <Link href="/reserver">
                <Button variant="outline" className="cursor-pointer bg-[#DE2788] mt-4 text-white rounded-none border-none text-sm sm:text-base md:text-lg px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-4 whitespace-nowrap font-archivo">PRENDRE UN RENDEZ-VOUS </Button>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </div>
      <div id="services" className="other-section flex bg-white relative py-10 sm:py-14 md:py-16 lg:py-20">
        
        <div
          className="flex justify-center items-center salons-section px-4 sm:px-6 md:px-8 lg:px-10 flex-col relative w-full"

        >
          <h2 className='text-black font-archivo text-[32px] sm:text-[40px] md:text-[48px] lg:text-[55px] font-black leading-tight lg:leading-11 relative z-10 text-center'> GALERIE DE <br></br> PRESTATIONS</h2>
          <p className='text-gray-600 font-archivo text-base sm:text-lg mt-4 mb-6 sm:mb-8 text-center relative z-10'>Découvrez nos réalisations</p>
          <div className="gallery-container max-w-6xl w-full mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-10">
            {/* Grande image à gauche */}
            <div className="md:col-span-1 md:row-span-2 relative group overflow-hidden border-4 border-transparent hover:border-[#DE2788] transition-all duration-300">
              <div
                className="w-full h-75 sm:h-100 md:h-150 bg-gray-800 transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: `url('/gallery/hair1.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent group-hover:from-[#DE2788]/90 group-hover:via-[#DE2788]/40 transition-all duration-300 flex items-end p-4 sm:p-6">
                  <div className="text-white transform translate-y-0 group-hover:-translate-y-2 transition-transform duration-300">
                    <h3 className="font-archivo font-black text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 uppercase">Coupe Signature</h3>
                    <p className="font-archivo text-sm sm:text-base opacity-90">Coiffure tendance et personnalisée</p>
                  </div>
                </div>
                {/* Badge */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#DE2788] text-white px-3 py-1.5 sm:px-4 sm:py-2 font-archivo font-black text-xs uppercase">
                  Populaire
                </div>
              </div>
            </div>

            {/* Grille 2x2 à droite */}
            <div className="relative group overflow-hidden border-4 border-transparent hover:border-[#DE2788] transition-all duration-300">
              <div
                className="w-full h-60 sm:h-70 md:h-72.5 bg-gray-800 transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: `url('/gallery/hair2.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent group-hover:from-[#DE2788]/90 group-hover:via-[#DE2788]/40 transition-all duration-300 flex items-end p-4 sm:p-6">
                  <div className="text-white transform translate-y-0 group-hover:-translate-y-2 transition-transform duration-300">
                    <h3 className="font-archivo font-black text-lg sm:text-xl mb-1 uppercase">Coupe Moderne</h3>
                    <p className="font-archivo text-xs sm:text-sm opacity-90">Style urbain</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden border-4 border-transparent hover:border-[#DE2788] transition-all duration-300">
              <div
                className="w-full h-60 sm:h-70 md:h-72.5 bg-gray-800 transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: `url('/gallery/hair1.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent group-hover:from-[#DE2788]/90 group-hover:via-[#DE2788]/40 transition-all duration-300 flex items-end p-4 sm:p-6">
                  <div className="text-white transform translate-y-0 group-hover:-translate-y-2 transition-transform duration-300">
                    <h3 className="font-archivo font-black text-lg sm:text-xl mb-1 uppercase">Fade Dégradé</h3>
                    <p className="font-archivo text-xs sm:text-sm opacity-90">Dégradé parfait</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden border-4 border-transparent hover:border-[#DE2788] transition-all duration-300">
              <div
                className="w-full h-60 sm:h-70 md:h-72.5 bg-gray-800 transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: `url('/gallery/hair2.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent group-hover:from-[#DE2788]/90 group-hover:via-[#DE2788]/40 transition-all duration-300 flex items-end p-4 sm:p-6">
                  <div className="text-white transform translate-y-0 group-hover:-translate-y-2 transition-transform duration-300">
                    <h3 className="font-archivo font-black text-lg sm:text-xl mb-1 uppercase">Coloration</h3>
                    <p className="font-archivo text-xs sm:text-sm opacity-90">Couleur tendance</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden border-4 border-transparent hover:border-[#DE2788] transition-all duration-300">
              <div
                className="w-full h-60 sm:h-70 md:h-72.5 bg-gray-800 transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: `url('/gallery/hair1.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent group-hover:from-[#DE2788]/90 group-hover:via-[#DE2788]/40 transition-all duration-300 flex items-end p-4 sm:p-6">
                  <div className="text-white transform translate-y-0 group-hover:-translate-y-2 transition-transform duration-300">
                    <h3 className="font-archivo font-black text-lg sm:text-xl mb-1 uppercase">Rasage</h3>
                    <p className="font-archivo text-xs sm:text-sm opacity-90">À l&apos;ancienne</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Section Tarifs */}
      <div id="tarifs" className="tarifs-section flex bg-white relative py-10 sm:py-14 md:py-16 lg:py-20">
        
        <div className="flex justify-center items-center flex-col relative w-full px-4 sm:px-6 md:px-8 lg:px-10">
          <AnimatedSection variant="fadeIn" delay={0.2}>
            <h2 className='text-black font-archivo text-[32px] sm:text-[40px] md:text-[50px] lg:text-[60px] font-black leading-tight lg:leading-15 relative z-10 text-center mb-4'>TARIFS</h2>
          </AnimatedSection>
          <AnimatedSection variant="fadeIn" delay={0.3}>
            <p className='text-black font-archivo text-base sm:text-lg lg:text-[20px] mb-8 sm:mb-10 lg:mb-12 text-center opacity-80'>Des prestations de qualité à prix justes</p>
          </AnimatedSection>

          {/* Tableau des tarifs */}
          <AnimatedSection variant="slideUp" delay={0.4} className="relative z-10 max-w-4xl w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Colonne 1 - Services principaux */}
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-white border-2 border-[#DE2788] p-4 sm:p-6 hover:bg-[#DE2788] hover:text-white transition-all duration-300 group cursor-pointer">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <h3 className="font-archivo font-black text-base sm:text-lg lg:text-xl mb-1">COUPE</h3>
                      <p className="font-archivo text-xs sm:text-sm opacity-70">Coupe tendance et personnalisée</p>
                    </div>
                    <span className="font-archivo font-black text-2xl sm:text-3xl">20€</span>
                  </div>
                </div>

                <div className="bg-white border-2 border-[#DE2788] p-4 sm:p-6 hover:bg-[#DE2788] hover:text-white transition-all duration-300 group cursor-pointer">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <h3 className="font-archivo font-black text-base sm:text-lg lg:text-xl mb-1">COUPE + BARBE</h3>
                      <p className="font-archivo text-xs sm:text-sm opacity-70">Forfait complet</p>
                    </div>
                    <span className="font-archivo font-black text-2xl sm:text-3xl">20€</span>
                  </div>
                </div>

                <div className="bg-white border-2 border-[#DE2788] p-4 sm:p-6 hover:bg-[#DE2788] hover:text-white transition-all duration-300 group cursor-pointer">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <h3 className="font-archivo font-black text-base sm:text-lg lg:text-xl mb-1">COUPE ENFANT</h3>
                      <p className="font-archivo text-xs sm:text-sm opacity-70">-12 ans</p>
                    </div>
                    <span className="font-archivo font-black text-2xl sm:text-3xl">15€</span>
                  </div>
                </div>

                <div className="bg-white border-2 border-[#DE2788] p-4 sm:p-6 hover:bg-[#DE2788] hover:text-white transition-all duration-300 group cursor-pointer">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <h3 className="font-archivo font-black text-base sm:text-lg lg:text-xl mb-1">BARBE</h3>
                      <p className="font-archivo text-xs sm:text-sm opacity-70">Taille et entretien</p>
                    </div>
                    <span className="font-archivo font-black text-2xl sm:text-3xl">10€</span>
                  </div>
                </div>
              </div>

              {/* Colonne 2 - Services complémentaires */}
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-white border-2 border-[#DE2788] p-4 sm:p-6 hover:bg-[#DE2788] hover:text-white transition-all duration-300 group cursor-pointer">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <h3 className="font-archivo font-black text-base sm:text-lg lg:text-xl mb-1">CONTOURS DE TÊTE</h3>
                      <p className="font-archivo text-xs sm:text-sm opacity-70">Finitions précises</p>
                    </div>
                    <span className="font-archivo font-black text-2xl sm:text-3xl">10€</span>
                  </div>
                </div>

                <div className="bg-white border-2 border-[#DE2788] p-4 sm:p-6 hover:bg-[#DE2788] hover:text-white transition-all duration-300 group cursor-pointer">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <h3 className="font-archivo font-black text-base sm:text-lg lg:text-xl mb-1">CIRE SB</h3>
                      <p className="font-archivo text-xs sm:text-sm opacity-70">Styling professionnel</p>
                    </div>
                    <span className="font-archivo font-black text-2xl sm:text-3xl">5€</span>
                  </div>
                </div>

                <div className="bg-white border-2 border-[#DE2788] p-4 sm:p-6 hover:bg-[#DE2788] hover:text-white transition-all duration-300 group cursor-pointer">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <h3 className="font-archivo font-black text-base sm:text-lg lg:text-xl mb-1">CIRE OSSION</h3>
                      <p className="font-archivo text-xs sm:text-sm opacity-70">Produit premium</p>
                    </div>
                    <span className="font-archivo font-black text-2xl sm:text-3xl">10€</span>
                  </div>
                </div>

                <div className="bg-white border-2 border-[#DE2788] p-4 sm:p-6 hover:bg-[#DE2788] hover:text-white transition-all duration-300 group cursor-pointer">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <h3 className="font-archivo font-black text-base sm:text-lg lg:text-xl mb-1">POUDRE COIFFANTE</h3>
                      <p className="font-archivo text-xs sm:text-sm opacity-70">Texture et volume</p>
                    </div>
                    <span className="font-archivo font-black text-2xl sm:text-3xl">10€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-8 sm:mt-10 lg:mt-12">
              <Link href="/reserver">
                <Button variant="outline" className="cursor-pointer bg-[#DE2788] text-white rounded-none border-none text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 font-archivo font-black transition-colors duration-300">
                  RÉSERVER MA COUPE
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Section Itinéraire */}
      <div id="itineraire" className="itinerary-section flex bg-white relative py-10 sm:py-14 md:py-16 lg:py-20">
        
        <div className="flex justify-center items-center flex-col relative w-full px-4 sm:px-6 md:px-8 lg:px-10">
          <AnimatedSection variant="fadeIn" delay={0.2}>
            <h2 className='text-black font-archivo text-[32px] sm:text-[40px] md:text-[50px] lg:text-[60px] font-black leading-tight lg:leading-15 relative z-10 text-center mb-4'>
              COMMENT NOUS TROUVER
            </h2>
          </AnimatedSection>
          <AnimatedSection variant="fadeIn" delay={0.3}>
            <p className='text-black font-archivo text-base sm:text-lg lg:text-[20px] mb-10 sm:mb-12 lg:mb-16 text-center opacity-80'>
              Deux adresses à Grenoble pour vous servir
            </p>
          </AnimatedSection>

          {/* Grid des deux salons */}
          <div className="relative z-10 max-w-7xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
              {/* Salon Championnet */}
              <AnimatedSection variant="slideLeft" delay={0.4}>
                <div className="bg-white border-4 border-[#DE2788] p-5 sm:p-6 md:p-8 hover:shadow-2xl transition-all duration-300">
                <h2 className="font-archivo font-black text-xl sm:text-2xl lg:text-3xl text-black mb-4 sm:mb-6">STUDIO BARBER CHAMPIONNET</h2>

                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DE2788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-1 sm:w-6 sm:h-6">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div>
                      <p className="font-archivo text-base sm:text-lg text-black font-bold">Adresse</p>
                      <p className="font-archivo text-sm sm:text-base text-gray-700">42 Rue Lesdiguières, 38000 Grenoble</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DE2788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-1 sm:w-6 sm:h-6">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <div>
                      <p className="font-archivo text-base sm:text-lg text-black font-bold">Téléphone</p>
                      <p className="font-archivo text-sm sm:text-base text-gray-700">04 76 XX XX XX</p>
                    </div>
                  </div>
                </div>

                {/* Carte Google Maps */}
                <div className="w-full h-48 sm:h-56 md:h-64 bg-gray-200 mb-4 sm:mb-6 overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2811.5!2d5.7245!3d45.1885!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDExJzE4LjYiTiA1wrA0MycyOC4yIkU!5e0!3m2!1sfr!2sfr!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <Button variant="outline" className="w-full cursor-pointer bg-[#DE2788] text-white rounded-none border-none text-base sm:text-lg px-5 py-3 sm:px-6 sm:py-4 font-archivo font-black hover:bg-black transition-colors duration-300">
                  Y ALLER
                </Button>
              </div>
              </AnimatedSection>

              {/* Salon Clemenceau */}
              <AnimatedSection variant="slideRight" delay={0.4}>
                <div className="bg-white border-4 border-[#DE2788] p-5 sm:p-6 md:p-8 hover:shadow-2xl transition-all duration-300">
                <h2 className="font-archivo font-black text-xl sm:text-2xl lg:text-3xl text-black mb-4 sm:mb-6">STUDIO BARBER CLEMENCEAU</h2>

                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DE2788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-1 sm:w-6 sm:h-6">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div>
                      <p className="font-archivo text-base sm:text-lg text-black font-bold">Adresse</p>
                      <p className="font-archivo text-sm sm:text-base text-gray-700">47 Boulevard Clemenceau, 38100 Grenoble</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DE2788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-1 sm:w-6 sm:h-6">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <div>
                      <p className="font-archivo text-base sm:text-lg text-black font-bold">Téléphone</p>
                      <p className="font-archivo text-sm sm:text-base text-gray-700">04 76 XX XX XX</p>
                    </div>
                  </div>
                </div>

                {/* Carte Google Maps */}
                <div className="w-full h-48 sm:h-56 md:h-64 bg-gray-200 mb-4 sm:mb-6 overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2811.8!2d5.7312!3d45.1872!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDExJzE0LjAiTiA1wrA0Myc1Mi4zIkU!5e0!3m2!1sfr!2sfr!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <Button variant="outline" className="w-full cursor-pointer bg-[#DE2788] text-white rounded-none border-none text-base sm:text-lg px-5 py-3 sm:px-6 sm:py-4 font-archivo font-black hover:bg-black transition-colors duration-300">
                  Y ALLER
                </Button>
              </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </div>

      {/* Section Contact */}
      <div id="contact" className="contact-section flex bg-[#DE2788] relative py-10 sm:py-14 md:py-16 lg:py-20">
        
        <div className="flex justify-center items-center flex-col relative w-full px-4 sm:px-6 md:px-8 lg:px-10">
          <AnimatedSection variant="fadeIn" delay={0.2}>
            <h2 className='text-white font-archivo text-[32px] sm:text-[40px] md:text-[50px] lg:text-[60px] font-black leading-tight lg:leading-15 relative z-10 text-center mb-4'>
              CONTACTEZ-NOUS
            </h2>
          </AnimatedSection>
          <AnimatedSection variant="fadeIn" delay={0.3}>
            <p className='text-white font-archivo text-base sm:text-lg lg:text-[20px] mb-10 sm:mb-12 lg:mb-16 text-center opacity-90'>
              Une question ? Besoin d&apos;un rendez-vous ? Écrivez-nous
            </p>
          </AnimatedSection>

          {/* Formulaire de contact */}
          <AnimatedSection variant="scaleUp" delay={0.4} className="relative z-10 max-w-3xl w-full">
            <div className="bg-white p-5 sm:p-7 md:p-10">
              <form className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="font-archivo font-bold text-black text-base sm:text-lg mb-2 block">
                      NOM COMPLET
                    </label>
                    <input
                      type="text"
                      placeholder="Votre nom"
                      className="w-full border-2 border-gray-300 p-3 sm:p-4 font-archivo text-sm sm:text-base focus:border-[#DE2788] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="font-archivo font-bold text-black text-base sm:text-lg mb-2 block">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      placeholder="votre@email.com"
                      className="w-full border-2 border-gray-300 p-3 sm:p-4 font-archivo text-sm sm:text-base focus:border-[#DE2788] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-archivo font-bold text-black text-base sm:text-lg mb-2 block">
                    TÉLÉPHONE
                  </label>
                  <input
                    type="tel"
                    placeholder="06 XX XX XX XX"
                    className="w-full border-2 border-gray-300 p-3 sm:p-4 font-archivo text-sm sm:text-base focus:border-[#DE2788] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="font-archivo font-bold text-black text-base sm:text-lg mb-2 block">
                    SALON
                  </label>
                  <select className="w-full border-2 border-gray-300 p-3 sm:p-4 font-archivo text-sm sm:text-base focus:border-[#DE2788] focus:outline-none transition-colors">
                    <option>Sélectionnez un salon</option>
                    <option>Studio Barber Championnet</option>
                    <option>Studio Barber Clemenceau</option>
                  </select>
                </div>

                <div>
                  <label className="font-archivo font-bold text-black text-base sm:text-lg mb-2 block">
                    MESSAGE
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Votre message..."
                    className="w-full border-2 border-gray-300 p-3 sm:p-4 font-archivo text-sm sm:text-base focus:border-[#DE2788] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full cursor-pointer bg-black text-white rounded-none border-none text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 font-archivo font-black hover:bg-gray-900 transition-colors duration-300"
                >
                  ENVOYER LE MESSAGE
                </Button>
              </form>

              {/* Informations complémentaires */}
              <div className="mt-8 sm:mt-10 lg:mt-12 pt-6 sm:pt-8 border-t-2 border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
                  <div>
                    <div className="flex justify-center mb-2 sm:mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#DE2788] flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                      </div>
                    </div>
                    <h3 className="font-archivo font-bold text-black text-base sm:text-lg mb-1">TÉLÉPHONE</h3>
                    <p className="font-archivo text-sm sm:text-base text-gray-700">04 76 XX XX XX</p>
                  </div>

                  <div>
                    <div className="flex justify-center mb-2 sm:mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#DE2788] flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <rect width="20" height="16" x="2" y="4" rx="2"/>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                      </div>
                    </div>
                    <h3 className="font-archivo font-bold text-black text-base sm:text-lg mb-1">EMAIL</h3>
                    <p className="font-archivo text-sm sm:text-base text-gray-700">contact@studiobarber.fr</p>
                  </div>

                  <div>
                    <div className="flex justify-center mb-2 sm:mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#DE2788] flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                      </div>
                    </div>
                    <h3 className="font-archivo font-bold text-black text-base sm:text-lg mb-1">HORAIRES</h3>
                    <p className="font-archivo text-sm sm:text-base text-gray-700">Mar-Sam: 10h-19h</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Footer */}
      <Footer2
        logo={{
          src: "/logoApp.png",
          alt: "Studio Barber Logo",
          title: "STUDIO BARBER",
          url: "/"
        }}
        className="bg-white border-t-4 border-[#DE2788] py-20"
        tagline="PLUS QU'UNE COUPE, UN RITUEL"
        menuItems={[
          {
            title: "Nos Salons",
            links: [
              { text: "Championnet", url: "/reserver/prestations?salon=championnet" },
              { text: "Clemenceau", url: "/reserver/prestations?salon=clemenceau" },
              { text: "Réserver", url: "/reserver" },
              { text: "Nos Tarifs", url: "/#tarifs" },
            ],
          },
          {
            title: "Services",
            links: [
              { text: "Coupe Homme", url: "/#services" },
              { text: "Barbe", url: "/#services" },
              { text: "Coupe Enfant", url: "/#services" },
              { text: "Styling", url: "/#services" },
            ],
          },
          {
            title: "Informations",
            links: [
              { text: "Contact", url: "/#contact" },
              { text: "Horaires", url: "/#itineraire" },
              { text: "FAQ", url: "/#contact" },
            ],
          },
          {
            title: "Suivez-nous",
            links: [
              { text: "Instagram", url: "/#contact" },
              { text: "Facebook", url: "/#contact" },
              { text: "TikTok", url: "/#contact" },
            ],
          },
        ]}
        copyright="© 2024 Studio Barber. Tous droits réservés."
        bottomLinks={[
          { text: "Mentions légales", url: "/mentions-legales" },
          { text: "Politique de confidentialité", url: "/politique-confidentialite" },
        ]}
      />
      </main>
    </>
  );
}
