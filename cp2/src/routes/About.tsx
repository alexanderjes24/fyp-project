import React from "react";
import { Link } from "react-router-dom";
import Footer from '../components/Footer';
// Import necessary Lucide Icons
import { Shield, Lightbulb, Globe } from 'lucide-react'; 

// Define the component using React.FC (Functional Component)
const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      
  
      {/* --- Section Divider --- */}
      <div className="border-t border-gray-100"></div>

      {/* 💡 Second Layer: Core Values (Section replaced by div) */}
      <div className="py-20 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Our Commitment to Ethical Growth
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600">
              We are dedicated to helping you achieve personal growth, mindfulness, and a healthier lifestyle through innovative digital solutions.
            </p>
            </div>

            {/* Visual Grid for Core Values */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
                
                {/* Value 1: Privacy (Shield Icon) */}
                <div className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-100 shadow-sm transition hover:shadow-md">
                    <div className={`p-3 rounded-full bg-indigo-500/10 text-indigo-500 mb-4`}>
                        <Shield className="w-6 h-6" /> 
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Unmatched Privacy
                    </h3>
                    <p className="text-gray-600 text-sm">
                        Your data is yours alone. We ensure complete confidentiality using decentralized technology.
                    </p>
                </div>

                {/* Value 2: Empowerment (Lightbulb Icon) */}
                <div className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-100 shadow-sm transition hover:shadow-md">
                    <div className={`p-3 rounded-full bg-green-500/10 text-green-500 mb-4`}>
                        <Lightbulb className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Client Empowerment
                    </h3>
                    <p className="text-gray-600 text-sm">
                        We provide tools and knowledge for you to drive your own path toward wellness and growth.
                    </p>
                </div>

                {/* Value 3: Accessibility (Globe Icon) */}
                <div className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-100 shadow-sm transition hover:shadow-md">
                    <div className={`p-3 rounded-full bg-sky-500/10 text-sky-500 mb-4`}>
                        <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Global Accessibility
                    </h3>
                    <p className="text-gray-600 text-sm">
                        Ethical counseling services made available regardless of your location or background.
                    </p>
                </div>
            </div>
            
            <div className="max-w-4xl mx-auto text-center mt-20">
                <h2 className="text-4xl font-bold text-indigo-600 mb-6">
                    Unlock Personalized Self-Discovery
                </h2>
                <p className="text-gray-700 text-lg mb-10 leading-relaxed">
                    Our platform provides personalized insights and guidance to help you explore your strengths, understand your emotions, and track your progress. Whether you're looking to improve your mental wellness, set meaningful goals, or simply find balance in your daily life, we're here to guide you every step of the way.
                </p>
                
                <Link to="/quiz">
                    <button className="bg-indigo-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-600 transition-all transform hover:scale-[1.02]">
                        Take the Assessment
                    </button>
                </Link>
            </div>
        </div>
      </div>
      
      {/* --- Section Divider --- */}
      <div className="border-t border-gray-100"></div>

      {/* 📖 Third Layer: Our Vision (Section replaced by div) */}
      <div className="px-6 py-20 md:py-24 bg-sky-50">
        <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-indigo-600 mb-6">
              Our Vision: Privacy and Empowerment
            </h2>
            <p className="text-gray-700 max-w-4xl mx-auto text-lg leading-relaxed">
              We believe that everyone deserves access to tools and guidance for self-discovery and growth. By combining technology with thoughtful design, we create an environment where individuals can reflect, learn, and thrive. Our mission is to empower you to make informed decisions about your personal development, to celebrate progress, and to encourage continuous learning. Together, we strive to build a community focused on mindfulness, well-being, and positive change.
            </p>
        </div>
      </div>

      {/* Footer */}
      <Footer/>
    </div>
  );
}

export default About;