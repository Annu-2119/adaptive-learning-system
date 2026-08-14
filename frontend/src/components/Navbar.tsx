"use client";

import Link from "next/link";
import { FaGraduationCap } from "react-icons/fa";

export default function Navbar() {
  return (
    <nav className=" bg-white text-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        <div className="flex items-center gap-2">
          <FaGraduationCap size={28} />
          <span className="font-bold text-xl">
            Adaptive Learning Platform
          </span>
        </div>

        <div className="font-bold space-x-6">
          <Link href="/">Home</Link>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </div>

      </div>
    </nav>
  );
}