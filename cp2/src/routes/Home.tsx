import { Link } from "react-router-dom";
import Footer from '../components/Footer'

export default function Home(){
    return(
        <div>
        <header className="flex flex-col items-center justify-center flex-grow text-center px-6 pt-40 py-20 bg-gradient-to-r from-indigo-100 to-indigo-50">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Secure. Private. Decentralized Therapy Platform.
        </h2>
        <p className="text-gray-600 max-w-2xl mb-6">
          Experience therapy with full privacy and control over your data — powered by blockchain.
        </p>
        <div className="flex gap-4">
          <Link to="/quiz">
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
            Get Started
          </button>
          </Link>
          <Link to="/about">
          <button className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition">
            Learn More
          </button>
          </Link>
        </div>
      </header>

      {/* Footer */}
      <Footer/>
    </div>
    )
}