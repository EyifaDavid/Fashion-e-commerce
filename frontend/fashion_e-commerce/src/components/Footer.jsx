// components/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-black text-gray-100 py-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

        {/* Brand */}
        <div>
          <h2 className="text-xl font-bold">Pangaia</h2>
          <p className="text-sm mt-2 text-gray-400">
            Your go-to for stylish, affordable fashion.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-semibold mb-2">Shop</h3>
          <ul className="space-y-1 text-sm text-gray-400">
            <li><a href="/Men">Men</a></li>
            <li><a href="/Women">Women</a></li>
            <li><a href="#">Accessories</a></li>
          </ul>
        </div>

        {/* About */}
        <div>
          <h3 className="font-semibold mb-2">Company</h3>
          <ul className="space-y-1 text-sm text-gray-400">
            <li><a href="/About">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h3 className="font-semibold mb-2">Follow Us</h3>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-white">Instagram</a>
            <a href="#" className="hover:text-white">Twitter</a>
            <a href="#" className="hover:text-white">Facebook</a>
          </div>
        </div>

      </div>

      <div className="mt-10 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} FashionHub. All rights reserved.
      </div>
    </footer>
  );
}
