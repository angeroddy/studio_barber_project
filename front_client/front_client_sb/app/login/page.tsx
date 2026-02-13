'use client';

import { LoginForm } from "@/components/login-form"
import Link from "next/link"
import Logo2 from '@/public/logoApp.png';
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Login Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-white relative">
        

        <div className="flex justify-center gap-2 md:justify-start relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className=" text-white flex size-12 items-center justify-center">
              <Image
                src={Logo2}
                width={500}
                height={500}
                alt="Picture of the author"
              />
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center relative z-10">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 font-archivo relative z-10">
          <p>&copy; 2024 Studio Barber. Tous droits réservés.</p>
        </div>
      </div>

      {/* Right side - Rose Background */}
      <div className="relative hidden lg:flex bg-[#DE2788] justify-center items-center">
        {/* Texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url('/Vector (1).png')`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto'
          }}
        />

        {/* Text overlay */}
        <div className="relative z-10 flex justify-center items-center flex-col leading-none">
          <p className='font-archivo font-[1000] text-white m-0 text-[220px] leading-40 text-start tracking-[-20]'>STUDIO <br></br> <span className='font-archivo font-black text-white m-0 text-[220px] tracking-[-20]'>BARBER</span></p>

          <p className='text-white font-archivo font-[350] text-[45px] text-start' style={{
            marginRight: '60px'
          }}></p>
        </div>
      </div>
    </div>
  )
}
