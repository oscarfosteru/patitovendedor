"use client";
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import logo from '../../public/assets/logo.png';
import { Bars3Icon, XMarkIcon, UserIcon, HomeIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openNav, setOpenNav] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (!user && pathname !== '/login') {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  return (
    <html lang="es">
      <body className={`${inter.className} bg-pink-50`}>
        <nav className="navbar">
          <div className="logo">
            <Link href="/">
              <Image src={logo} alt="Patito Vendedor" width={60} height={60} />
            </Link>
            <span>Sunflowext</span>
          </div>
          <button onClick={() => setOpenNav(!openNav)}>
            {openNav ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
          <div className={`navbar-collapse ${openNav ? 'block' : 'hidden'}`}>
            <ul>
              <li><Link href="/crear-cuenta">Crear Cuenta</Link></li>
              <li><Link href="/"> Inicio</Link></li>
              <li><Link href="/perfil"> Perfil</Link></li>
              <li><Link href="/login">Iniciar Sesión</Link></li>
            </ul>
          </div>
        </nav>
        <main className="container mx-auto p-4">{children}</main>

        <style jsx>{`
          body {
            font-family: 'Inter', sans-serif;
            background-color: #fce7f3; /* bg-pink-50 */
            color: #333; /* text-gray-900 */
          }

          .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center; 
            height: 10vh;
            background: linear-gradient(to right, #bfe0ed, #bfe0ed); /* bg-gradient-to-r from-pink-300 to-purple-300 */
            padding: 0.5rem 1rem;
          }

          .navbar .logo {
            display: flex;
            align-items: center;
          }

          .navbar .logo img {
            margin-right: 0.5rem;
          }

          .navbar .logo span {
            font-weight: 800;
            font-size: 1.875rem; /* text-3xl */
            color:rgb(255, 204, 122);
          }

          .navbar button {
            background: transparent;
            border: none;
            color:white;
            font-size: 1.5rem;
            border
          }

          .navbar-collapse {
            position: absolute;
            top: 10%;
            color:white;
            right: 0;
            background: linear-gradient(to right, #bfe0ed, #bfe0ed);
            border-radius: 0.5rem;
            width: 12rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10;
          }

          .navbar-collapse ul {
            list-style: none;
            padding: 1rem;
          }

          .navbar-collapse li {
            font-weight: 500;
            margin-bottom: 1rem;
          }

          .navbar-collapse li a {
            text-decoration: none;
            color: white;
            display: flex;
            align-items: center;
            transition: color 0.3s ease;
          }

          .navbar-collapse li a:hover {
            color: #bfe0ed; /* hover:text-pink-400 */
          }

          .navbar-collapse .icon {
            margin-right: 0.5rem;
          }

          @media (max-width: 768px) {
            .navbar-collapse {
              display: ${openNav ? 'block' : 'none'};
            }
          }
        `}</style>
      </body>
    </html>
  );
}
