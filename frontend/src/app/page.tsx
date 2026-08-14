"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaBrain,
  FaChartLine,
  FaLaptopCode,
} from "react-icons/fa";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700">

        <section className="max-w-3xl mx-auto px-6 py-20">

            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="mt-2 text-4xl lg:text-5xl font-bold text-white leading-tight">
                Adaptive Quiz Recommendation
              </h1>

              <p className="mt-5 text-2xl text-blue-100 leading-relaxed">
                An E-Learning Platform using Decision Tree Algorithms
              </p>

              <div className="mt-12">

                <Link href="/login">
                  <button className="bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold shadow-lg hover:scale-105 transition duration-300">
                    Get Started
                  </button>
                </Link>

              </div>
            </motion.div>

        </section>

        <section className="bg-slate-100 py-20">

          <div className="max-w-7xl mx-auto px-6">

            <h2 className="text-4xl font-bold text-center mb-14 text-blue-700">
              Platform Features
            </h2>

            <div className="grid md:grid-cols-3 gap-8">

              <motion.div
                whileHover={{ y: -8 }}
                className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-lg"
              >
                <FaBrain
                  size={45}
                  className="text-white mb-5"
                />

                <h3 className="text-xl font-bold mb-3 text-white">
                  Adaptive Learning
                </h3>

                <p className="text-gray-100">
                  Students receive personalized learning paths based
                  on quiz performance and topic mastery.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -8 }}
                className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-lg"
              >
                <FaLaptopCode
                  size={45}
                  className="text-white mb-5"
                />

                <h3 className="text-xl font-bold mb-3">
                  Decision Tree Recommendation
                </h3>

                <p className="text-gray-100">
                  Machine learning identifies weak topics and
                  recommends the next best quiz automatically.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -8 }}
                className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-lg"
              >
                <FaChartLine
                  size={45}
                  className="text-white mb-5"
                />

                <h3 className="text-xl font-bold mb-3">
                  Learning Analytics
                </h3>

                <p className="text-gray-100">
                  Monitor student progress, mastery level,
                  recommendations and performance history.
                </p>
              </motion.div>

            </div>

          </div>

        </section>

        <section className="max-w-6xl mx-auto px-6 py-20">

          <div className="bg-white rounded-3xl shadow-xl p-10">

            <h2 className="text-4xl font-bold mb-8 text-center text-blue-700">
              Project Goals
            </h2>

            <ul className="space-y-5 text-lg text-gray-700">

              <li> ✓ Improve learning outcomes</li>

              <li> ✓ Identify weak topics</li>

              <li> ✓ Provide adaptive recommendations</li>

              <li> ✓ Support instructors with analytics</li>

              <li> ✓ Enhance personalized learning</li>

            </ul>

          </div>

        </section>

        <footer className="bg-slate-900 text-white py-8">

          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">

            <p className="font-semibold">
              Adaptive Learning Platform
            </p>

            <p className="text-gray-400 mt-3 md:mt-0">
              © 2026 Major Project • Decision Tree Recommendation System
            </p>

          </div>

        </footer>

      </div>
    </>
  );
}