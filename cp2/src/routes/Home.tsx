import { Link } from "react-router-dom";

import home from '../assets/home.png';

export default function Home(){
    return(
        <div>
            {/* --- Enhanced Header (now a div) --- */}
            <div className="bg-gradient-to-br bg-sky-50 py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
                    
                    {/* Left Side: Text and Buttons */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left md:w-1/2">
                        <p className="text-sm font-semibold text-indigo-500 uppercase tracking-widest mb-2">
                            The Future of Wellness
                        </p>
                        
                        {/* HEADLINE CHANGE: font-extrabold -> font-bold, lg:text-6xl -> lg:text-5xl */}
                        <h2 className="text-5xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                            Secure. Private. <span className="text-indigo-500">Ethical Online Counseling.</span>
                        </h2>
                        
                        {/* SUBHEADLINE CHANGE: Removed Markdown bolding (**) */}
                        <p className="text-lg text-gray-950 max-w-xl mb-8">
                            Experience online therapy on the Go , Intergrated with secure decentralized technology verification.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center md:justify-start">
                            <Link to="/quiz">
                                <button className="w-full sm:w-auto bg-indigo-500 text-white font-medium px-8 py-3 rounded-xl shadow-lg hover:bg-indigo-600 transition transform hover:scale-[1.02]">
                                    Get Started
                                </button>
                            </Link>
                            <Link to="/about">
                                <button className="w-full sm:w-auto border border-gray-300 text-indigo-500 font-medium px-8 py-3 rounded-xl hover:bg-sky-100 transition">
                                    Learn More
                                </button>
                            </Link>
                        </div>
                    </div>
                    {/* Right Side: Image/Illustration */}
                    <div className="md:w-1/2 mt-12 md:mt-0">
                        {/* BACKGROUND: Changed indigo-200 to indigo-500/10, indigo-300 to indigo-500 */}
                        <div className="w-full h-80 lg:h-96 bg-indigo-500/10 rounded-2xl flex items-center justify-center overflow-hidden transition duration-500 hover:scale-105 ">
                            <img 
                                src={home} 
                                alt="Decentralized Therapy Illustration"
                                className="w-full h-full object-cover rounded-2xl" 
                            />
                        </div>
                    </div>

                </div>
            </div>
            {/* --- End of Enhanced Header (div) --- */}

            {/* --- 1. Clinical Proof Section (now a div) --- */}
            <div className="py-20 md:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
                    
                    {/* Left Side: Text and CTA */}
                    <div className="md:w-1/2 text-center md:text-left">
                        {/* TEXT: Changed green-600 to green-500 */}
                        <h3 className="text-4xl font-bold text-gray-900 mb-6">
                            A Clinical Approach That <span className="text-green-500">Works.</span>
                        </h3>
                        <p className="text-lg text-gray-600 mb-8 max-w-lg">
                            Since our inception, we have been committed to providing clinically-proven and evidence-based results, supporting thousands of clients in improving their overall mental wellbeing.
                        </p>
                        {/* Button removed as per the previous version, leaving this comment for context */}
                        
                    </div>

                    {/* Right Side: Results Visuals */}
                    <div className="md:w-1/2 flex justify-center md:justify-end relative h-64 md:h-auto">
                        
                        {/* Anxiety Improvement */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl w-56 h-56 flex flex-col items-center justify-center border-t-4 border-green-500 absolute bottom-0 left-0 md:relative md:left-auto">
                            {/* BORDER/SVG COLOR: Changed green-600/700 to green-500/600 */}
                            <div className="w-24 h-24 text-green-500 mb-2">
                                <svg viewBox="0 0 36 36" className="circular-chart green">
                                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e6e6e6" strokeWidth="3.8"/>
                                    {/* STROKE COLOR: Changed #10B981 (green-600) to green-500 equivalent (simplified, but kept same style) */}
                                    <path className="circle" strokeDasharray="69, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#34D399" strokeWidth="3.8" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <p className="text-4xl font-extrabold text-green-600">69%</p>
                            <p className="text-sm text-gray-500 text-center mt-1">report improved anxiety symptoms</p>
                        </div>

                        {/* Depression Improvement */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl w-56 h-56 flex flex-col items-center justify-center border-t-4 border-indigo-500 absolute top-0 right-0 md:relative md:top-auto md:right-auto md:ml-8 mt-12 md:mt-0">
                            {/* BORDER/SVG COLOR: Changed indigo-600/700 to indigo-500/600 */}
                            <div className="w-24 h-24 text-indigo-500 mb-2">
                                <svg viewBox="0 0 36 36" className="circular-chart indigo">
                                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e6e6e6" strokeWidth="3.8"/>
                                    {/* STROKE COLOR: Changed #4F46E5 (indigo-600) to indigo-500 equivalent (simplified, but kept same style) */}
                                    <path className="circle" strokeDasharray="73, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366F1" strokeWidth="3.8" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <p className="text-4xl font-extrabold text-indigo-600">73%</p>
                            <p className="text-sm text-gray-500 text-center mt-1">report improved depression symptoms</p>
                        </div>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-500 mt-12">* Based on client reports after 6 weeks of therapy.</p>
            </div>

            {/* --- 2. Testimonials Carousel Section (now a div) --- */}
            {/* BACKGROUND: Changed indigo-50 to sky-50 (a lighter shade of the color scheme) */}
            <div className="py-20 md:py-24 bg-sky-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Hear From Our Clients
                    </h3>
                    
                    {/* Testimonial Grid (Simulating Carousel for simplicity) */}
                    <div className="flex justify-center gap-6 overflow-x-auto p-4">

                        {/* Testimonial Card 1 */}
                        <div className="w-full sm:w-80 flex-shrink-0 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                            {/* STARS: Kept yellow-500 */}
                            <div className="flex text-yellow-500 mb-4">
                                ★★★★★
                            </div>
                            <p className="text-gray-700 italic mb-6">
                                "Jeff gave me confidence from our very first session that he had the right knowledge and tools to help me cope with some debilitating 24/7 anxiety I was experiencing."
                            </p>
                            {/* TEXT: Changed green-600 to green-500 */}
                            <p className="font-semibold text-sm text-green-500">
                                Fortune 500 Employee
                            </p>
                        </div>

                        {/* Testimonial Card 2 */}
                        <div className="w-full sm:w-80 flex-shrink-0 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                            <div className="flex text-yellow-500 mb-4">
                                ★★★★★
                            </div>
                            <p className="text-gray-700 italic mb-6">
                                "He really listens to me, gives me great feedback. He makes me feel heard and understood. He is so nice and supportive."
                            </p>
                            {/* TEXT: Changed green-600 to green-500 */}
                            <p className="font-semibold text-sm text-green-500">
                                Fortune 50 Employee
                            </p>
                        </div>

                        {/* Testimonial Card 3 */}
                        <div className="w-full sm:w-80 flex-shrink-0 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                            <div className="flex text-yellow-500 mb-4">
                                ★★★★★
                            </div>
                            <p className="text-gray-700 italic mb-6">
                                "Brian is a thoughtful, insightful, and caring therapist who is always respectful and encouraging. He has made a great difference in my journey this year."
                            </p>
                            {/* TEXT: Changed green-600 to green-500 */}
                            <p className="font-semibold text-sm text-green-500">
                                Leading Technology Company Employee
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            
        </div>
    )
}