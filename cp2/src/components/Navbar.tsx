import { Link, useLocation } from 'react-router-dom';

const NavBar = () => {
  const location = useLocation(); // Get the current path

  // Function to check if a link is active
  const getNavLinkClass = (path: string) =>
    location.pathname === path
      ? " pb-1"
      : "text-gray-600 hover:text-black";

  return (
    <>
      {/* Mobile Navigation */}
      <div className="md:hidden flex justify-around bg-white shadow-lg py-3 fixed bottom-0 w-full">
        <Link to="/" className={getNavLinkClass("/")}>Home</Link>
        <Link to="/" className={getNavLinkClass("/")}>Home</Link>
        <Link to="/" className={getNavLinkClass("/")}>Home</Link>
        <Link to="/" className={getNavLinkClass("/")}>Home</Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex justify-between items-center w-full bg-white shadow-lg p-4">
        {/* Left Section - Logo */}
        <div className="flex items-center space-x-2">
          <Link to="/" className={`${getNavLinkClass("/")} font-bold text-3xl`}>THERAPYMIND</Link>
        </div>


        {/* Right Section - Search Bar & Icons */}
        <div className="flex items-center space-x-4">
          <Link to="/" className={getNavLinkClass("/")}>Home</Link>
          <Link to="/about" className={getNavLinkClass("/about")}>About</Link>
          <Link to="/services" className={getNavLinkClass("/services")}>Services</Link>
          <Link to="/therapist" className={getNavLinkClass("/therapist")}>Therapist</Link>
          <Link
            to="/Login"
            className="border border-black rounded-md px-4 py-1 hover:bg-black hover:text-white transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </>
  );
};

export default NavBar;