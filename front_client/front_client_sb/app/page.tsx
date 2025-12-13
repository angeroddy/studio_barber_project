import { Button } from '@/components/ui/button';
import { Navbar01 } from '@/components/ui/shadcn-io/navbar-01';
import { InfiniteMarquee } from '@/components/ui/infinite-marquee';
import { InfiniteScrollTeam } from '@/components/ui/infinite-scroll-team';


export default function Home() {
  return (
    <>
      <div className="relative w-full">
        <Navbar01 />
      </div>
      <div className="main-section relative w-full min-h-[500px] sm:min-h-[600px] md:min-h-[700px] lg:h-200 overflow-hidden flex justify-center ">
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
        <div className="relative z-10 flex justify-center items-center flex-col leading-none">
          <p className='font-cygrotesk text-white m-0 text-[180px]'>STUDIO</p> <br></br>
          <p className='font-cygrotesk text-white m-0 text-[120px]'>BARBER</p> <br></br>
          <p className='text-white font-bebas font-[350] text-[60px] tracking-widest'>PLUS QU&apos;UNE COUPE, UN RITUEL</p>
          <Button variant="outline" className="cursor-pointer bg-[#DE2788]  mt-4 text-white rounded-none border-none text-xs sm:text-sm md:text-base lg:text-lg px-3 py-5 sm:px-4 sm:py-5 md:px-6 md:py-6  whitespace-nowrap font-monument">PRENDRE UN RENDEZ-VOUS </Button>
        </div>

      </div>
      <InfiniteMarquee
        speed={1}
        className="font-monument text-[30px] text-white flex justify-center items-center bg-[#DE2788] h-[60px] w-full"
      >
        ✶ STUDIO BARBER ✶ DEUX SALONS DE COIFFURE ✶ A GRENOBLE ✶ DES COUPES QUALITATIVES
      </InfiniteMarquee>
      <div className="other-section flex bg-black">
        <div
          className="flex justify-center items-center salons-section p-10 flex-col relative w-full"
          style={{
            backgroundImage: `url('/texture.webp')`,
            backgroundBlendMode: 'overlay',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <h1 className='text-white font-monument text-[55px] font-extrabold leading-11 relative z-10 text-center'> DEUX <br></br> SALONS</h1>
          <p className='text-white font-monument flex items-center gap-2 text-[20px] mt-2'>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin">
              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            A grenoble
          </p>
          <div className="salon-cont flex justify-center items-center relative z-10 mt-10 w-full gap-20">
            <div className="left flex-col flex justify-center items-start">
              <div className="box w-[500px] h-[500px] bg-white" style={{
                backgroundImage: `url('/Championnet.avif')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}></div>
              <p className='text-white font-cygrotesk mt-2 text-[20px]'>STUDIO BARBER
                CHAMPIONNET <br></br> <span className='font-monument'>42 Rue Lesdiguières, Grenoble</span></p>
              <Button variant="outline" className="cursor-pointer bg-[#DE2788]  mt-4 text-white rounded-none border-none text-xs sm:text-sm md:text-base lg:text-lg px-3 py-4 sm:px-4 sm:py-4 md:px-6 md:py-4  whitespace-nowrap font-monument">PRENDRE UN RENDEZ-VOUS </Button>
            </div>
            <div className="right flex-col flex justify-center items-start">
              <div className="box w-[500px] h-[500px] bg-white border-white" style={{
                backgroundImage: `url('/Clemenceau.avif')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}></div>
              <p className='text-white font-cygrotesk mt-2 text-[20px]'>STUDIO BARBER
                CLEMENCEAU <br></br> <span className='font-monument'>47 Boulevard Clemenceau, Grenoble</span></p>
              <Button variant="outline" className="cursor-pointer bg-[#DE2788]  mt-4 text-white rounded-none border-none text-xs sm:text-sm md:text-base lg:text-lg px-3 py-4 sm:px-4 sm:py-4 md:px-6 md:py-4  whitespace-nowrap font-monument">PRENDRE UN RENDEZ-VOUS </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="other-section flex bg-black">
        <div
          className="flex justify-center items-center salons-section p-10 flex-col relative w-full"
          style={{
            backgroundImage: `url('/texture.webp')`,
            backgroundBlendMode: 'overlay',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <h1 className='text-white font-monument text-[55px] font-extrabold leading-11 relative z-10 text-center'> GALERIE DE <br></br> PRESTATIONS</h1>
          <div className="gallery-container w-full mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            {/* Grande image à gauche */}
            <div className="md:col-span-1 md:row-span-2 relative group overflow-hidden">
              <div
                className="w-full h-[600px] bg-gray-800 transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url('/gallery/coupe-1.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 flex items-end p-6">
                  <div className="text-white">
                    <h3 className="font-monument text-2xl mb-2">COUPE CLASSIQUE</h3>
                    <p className="font-bebas text-sm opacity-80">Taille, mise en forme et finitions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grille 2x2 à droite */}
            <div className="relative group overflow-hidden">
              <div
                className="w-full h-[290px] bg-gray-800 transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url('/gallery/barbe-1.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 flex items-end p-6">
                  <div className="text-white">
                    <h3 className="font-monument text-xl mb-1">TAILLE BARBE</h3>
                    <p className="font-bebas text-xs opacity-80">Sculpture et entretien</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden">
              <div
                className="w-full h-[290px] bg-gray-800 transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url('/gallery/fade-1.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 flex items-end p-6">
                  <div className="text-white">
                    <h3 className="font-monument text-xl mb-1">FADE</h3>
                    <p className="font-bebas text-xs opacity-80">Dégradé précis et stylé</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden">
              <div
                className="w-full h-[290px] bg-gray-800 transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url('/gallery/coloration-1.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 flex items-end p-6">
                  <div className="text-white">
                    <h3 className="font-monument text-xl mb-1">COLORATION</h3>
                    <p className="font-bebas text-xs opacity-80">Couleur et style personnalisés</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden">
              <div
                className="w-full h-[290px] bg-gray-800 transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url('/gallery/rasage-1.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 flex items-end p-6">
                  <div className="text-white">
                    <h3 className="font-monument text-xl mb-1">RASAGE</h3>
                    <p className="font-bebas text-xs opacity-80">Rasage traditionnel au coupe-chou</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="other-section flex bg-black">
        <div
          className="flex justify-center items-center salons-section p-10 flex-col relative w-full"
          style={{
            backgroundImage: `url('/texture.webp')`,
            backgroundBlendMode: 'overlay',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <h1 className='text-white font-monument text-[55px] font-extrabold leading-11 relative z-10 text-center mb-10'> RENCONTRE  <br></br> L&apos;EQUIPE</h1>
          <div className="team-container w-full pb-6 relative z-10">
            <InfiniteScrollTeam speed={0.5}>
              {/* Team Member 1 */}
              <div className="cursor-pointer group relative bg-white rounded-2xl overflow-hidden w-[280px] flex-shrink-0 hover:shadow-2xl transition-all duration-300">
                <div className="relative h-[350px] overflow-hidden">
                  <div
                    className="w-full h-full bg-gray-200 transition-transform duration-500 group-hover:scale-110"
                    style={{
                      backgroundImage: `url('/team/barber-1.jpg')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6 bg-white">
                  <h3 className="font-monument text-xl text-black mb-1">KARIM BENZEMA</h3>
                  <p className="font-bebas text-gray-600 text-sm">Barbier Expert</p>
                </div>
              </div>

              {/* Team Member 2 */}
              <div className="cursor-pointer group relative bg-white rounded-2xl overflow-hidden w-[280px] flex-shrink-0 hover:shadow-2xl transition-all duration-300">
                <div className="relative h-[350px] overflow-hidden">
                  <div
                    className="w-full h-full bg-gray-200 transition-transform duration-500 group-hover:scale-110"
                    style={{
                      backgroundImage: `url('/team/barber-2.jpg')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6 bg-white">
                  <h3 className="font-monument text-xl text-black mb-1">MEHDI IBRAHIM</h3>
                  <p className="font-bebas text-gray-600 text-sm">Spécialiste Fade & Dégradé</p>
                </div>
              </div>

              {/* Team Member 3 */}
              <div className="cursor-pointer group relative bg-white rounded-2xl overflow-hidden w-[280px] flex-shrink-0 hover:shadow-2xl transition-all duration-300">
                <div className="relative h-[350px] overflow-hidden">
                  <div
                    className="w-full h-full bg-gray-200 transition-transform duration-500 group-hover:scale-110"
                    style={{
                      backgroundImage: `url('/team/barber-3.jpg')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6 bg-white">
                  <h3 className="font-monument text-xl text-black mb-1">SAMI YOUSSEF</h3>
                  <p className="font-bebas text-gray-600 text-sm">Expert en Coloration</p>
                </div>
              </div>

              {/* Team Member 4 */}
              <div className="cursor-pointer group relative bg-white rounded-2xl overflow-hidden w-[280px] flex-shrink-0 hover:shadow-2xl transition-all duration-300">
                <div className="relative h-[350px] overflow-hidden">
                  <div
                    className="w-full h-full bg-gray-200 transition-transform duration-500 group-hover:scale-110"
                    style={{
                      backgroundImage: `url('/team/barber-4.jpg')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6 bg-white">
                  <h3 className="font-monument text-xl text-black mb-1">AHMED HASSAN</h3>
                  <p className="font-bebas text-gray-600 text-sm">Maître Barbier</p>
                </div>
              </div>

              {/* Team Member 5 */}
              <div className="cursor-pointer group relative bg-white rounded-2xl overflow-hidden w-[280px] flex-shrink-0 hover:shadow-2xl transition-all duration-300">
                <div className="relative h-[350px] overflow-hidden">
                  <div
                    className="w-full h-full bg-gray-200 transition-transform duration-500 group-hover:scale-110"
                    style={{
                      backgroundImage: `url('/team/barber-5.jpg')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6 bg-white">
                  <h3 className="font-monument text-xl text-black mb-1">YOUSSEF MOHAMED</h3>
                  <p className="font-bebas text-gray-600 text-sm">Styliste Créatif</p>
                </div>
              </div>
            </InfiniteScrollTeam>
          </div>
        </div>
      </div>
    </>
  );
}
