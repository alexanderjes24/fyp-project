import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white text-gray-800 pt-15">
      {/* First Layer: Hero / About Us */}
      <header className="flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-r from-indigo-100 to-indigo-50">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-4">
          About Us
        </h1>
        <p className="text-lg md:text-xl max-w-2xl text-gray-700">
          We are dedicated to helping you achieve personal growth, mindfulness, and a healthier lifestyle through innovative digital solutions.
        </p>
      </header>

      {/* Second Layer: Learn More About Yourself */}
      <section className="px-6 py-20 bg-white flex flex-col items-center text-center">
        <h2 className="text-4xl font-bold text-indigo-700 mb-6">
          Learn More About Yourself
        </h2>
        <p className="text-gray-700 max-w-3xl text-lg mb-8">
          Our platform provides personalized insights and guidance to help you explore your strengths, understand your emotions, and track your progress. Whether you're looking to improve your mental wellness, set meaningful goals, or simply find balance in your daily life, we're here to guide you every step of the way.
        </p>
        <Link to="/quiz">
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
          Get Started
        </button>
        </Link>
      </section>

      {/* Third Layer: Long Paragraph / Story / Vision */}
      <section className="px-6 py-20 bg-indigo-50 flex flex-col items-center text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-indigo-800 mb-6">
          Our Vision
        </h2>
        <p className="text-gray-700 max-w-4xl text-lg leading-relaxed">
          We believe that everyone deserves access to tools and guidance for self-discovery and growth. By combining technology with thoughtful design, we create an environment where individuals can reflect, learn, and thrive. Our mission is to empower you to make informed decisions about your personal development, to celebrate progress, and to encourage continuous learning. Together, we strive to build a community focused on mindfulness, well-being, and positive change.
        </p>
      </section>

      {/* Optional Footer */}
      <footer className="px-6 py-8 bg-indigo-100 text-center text-gray-600">
        <p>&copy; {new Date().getFullYear()} YourCompany. All rights reserved.</p>
      </footer>
    </div>
  );
}
