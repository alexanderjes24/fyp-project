
const Footer = () => {
  return (
    <footer className="bg-gray-50 py-20 w-full font-semibold ">
      <div className="w-full px-6 flex flex-col md:flex-row md:justify-between md:items-start gap-8 text-gray-700 max-w-7xl mx-auto">
        
        {/* Left Section - Brand Info */}
        <div className="md:w-1/3">
          <h2 className="text-xl font-bold flex items-center">
            <img alt="logo" className="w-8 h-8 mr-2" /> TherapyMind
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            TherapyMind is a safe and supportive platform offering online therapy, 
            self-help tools, and mental wellness resources designed to help you grow 
            and heal at your own pace.
          </p>

          {/* Social Icons */}
          <div className="flex space-x-4 mt-4 text-xl">
            <img alt="social" />
          </div>
        </div>

        {/* Useful Sections */}
        <div className="flex flex-wrap justify-between md:w-2/3 gap-12">

          <div>
            <h3 className="font-bold mb-2">Platform</h3>
            <ul className="space-y-1 text-sm">
              <li>About Us</li>
              <li>Our Therapists</li>
              <li>How It Works</li>
              <li>Success Stories</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-2">Resources</h3>
            <ul className="space-y-1 text-sm">
              <li>Mental Health Articles</li>
              <li>Therapy Exercises</li>
              <li>Guided Journaling</li>
              <li>Self-Care Tools</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-2">Support</h3>
            <ul className="space-y-1 text-sm">
              <li>Contact Support</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Emergency Resources</li>
            </ul>
          </div>

        </div>
      </div>

      {/* Footer Bottom */}
      <div className="mt-10 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 px-6 w-full max-w-7xl mx-auto">
        <p>© TherapyMind 2025. All rights reserved.</p>

        <div className="flex mt-4 md:mt-0">
          <img alt="payments" />
        </div>
      </div>
    </footer>
  )
}

export default Footer
