
import { Link } from "react-router-dom";
import Footer from '../components/Footer';
// Import necessary Lucide Icons
import { Shield, Globe, Fingerprint, Lock, Zap } from 'lucide-react'; 

// Define the component using React.FC (Functional Component)
const About = () => {
    return (
        <div className="min-h-screen bg-white text-gray-800">
            
            {/* --- Section Divider --- */}
            <div className="border-t border-gray-100"></div>

            {/* 💡 Section 1: Core Values and User Focus */}
            <div className="py-20 md:py-24 bg-white">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                            Therapy Made Simple & Secure
                        </h1>
                        <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600">
                            We are dedicated to providing a user-friendly platform that prioritizes your wellness and ensures your journey is completely confidential.
                        </p>
                    </div>

                    {/* Visual Grid for Core Values */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
                        
                        {/* Value 1: Privacy (Shield Icon) - REMAINS */}
                        <div className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-100 shadow-sm transition hover:shadow-md">
                            <div className={`p-3 rounded-full bg-indigo-500/10 text-indigo-500 mb-4`}>
                                <Shield className="w-6 h-6" /> 
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Unmatched Privacy
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Your therapeutic data is kept off-chain, ensuring complete confidentiality using decentralized technology.
                            </p>
                        </div>

                        {/* Value 2: User-Friendly (Lightbulb Icon) - UPDATED */}
                        <div className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-100 shadow-sm transition hover:shadow-md">
                            <div className={`p-3 rounded-full bg-green-500/10 text-green-500 mb-4`}>
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Seamless Experience
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Access appointments, notes, and progress tracking through a clean, simple interface, removing technical barriers.
                            </p>
                        </div>

                        {/* Value 3: Accessibility (Globe Icon) - REMAINS */}
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
                </div>
            </div>
            
            {/* --- Section Divider --- */}
            <div className="border-t border-gray-100"></div>
            
            {/* 🔒 NEW SECTION: Explaining Hybrid Blockchain Security (Hashing) */}
            <div className="px-6 py-20 md:py-24 bg-indigo-50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="text-left">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-indigo-700 mb-6">
                                The Science of Confidentiality: Hybrid Security
                            </h2>
                            <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                                Our platform uses a **Hybrid Blockchain Architecture** to deliver unparalleled security without compromising speed or ease of use. This is how we protect your sensitive conversations:
                            </p>
                            
                            <div className="space-y-6">
                                {/* Feature 1: Off-Chain Storage */}
                                <div className="flex items-start">
                                    <Lock className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1 mr-4" />
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">Data is Never Public</h3>
                                        <p className="text-gray-600">Your actual medical records, notes, and discussions are **never** stored on the blockchain. They remain securely encrypted on private servers.</p>
                                    </div>
                                </div>
                                
                                {/* Feature 2: Blockchain Proofs */}
                                <div className="flex items-start">
                                    <Fingerprint className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1 mr-4" />
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">Immutable Hashing (The Fingerprint)</h3>
                                        <p className="text-gray-600">We create a unique, one-way cryptographic fingerprint (a **hash**) of each record. This tiny hash is the only piece of data stored on the blockchain.</p>
                                    </div>
                                </div>
                                
                                {/* Feature 3: Verification */}
                                <div className="flex items-start">
                                    <Shield className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1 mr-4" />
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">Tamper-Proof Verification</h3>
                                        <p className="text-gray-600">You can instantly verify that your records have **never been altered** since they were created, simply by checking the live hash against the blockchain proof.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Image Placeholder or Diagram Explanation */}
                        <div className="hidden md:block">
                            <div className="bg-white p-8 rounded-xl shadow-2xl border border-indigo-200">

                                <p className="text-center text-sm mt-4 text-gray-500">
                                    This separation ensures privacy (data off-chain) and integrity (proof on-chain).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* --- Section Divider --- */}
            <div className="border-t border-gray-100"></div>
            
            {/* 📖 Section 3: Call to Action (Previously Vision) */}
            <div className="max-w-4xl mx-auto text-center mt-20 px-6 lg:px-8">
                <h2 className="text-4xl font-bold text-indigo-600 mb-6">
                    Unlock Personalized Self-Discovery
                </h2>
                <p className="text-gray-700 text-lg mb-10 leading-relaxed">
                    Our mission is to empower you to make informed decisions about your personal development. Whether you're looking to improve your mental wellness, set meaningful goals, or simply find balance in your daily life, we're here to guide you every step of the way.
                </p>
                
                <Link to="/quiz">
                    <button className="bg-indigo-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-600 transition-all transform hover:scale-[1.02]">
                        Take the Assessment
                    </button>
                </Link>
            </div>

            <div className="pt-20">
                <Footer/>
            </div>
        </div>
    );
}

export default About;