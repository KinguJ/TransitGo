import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">TransitGo</h3>
            <p className="text-sm text-gray-400">
              Making public transportation simple and accessible for everyone.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm hover:text-white">Help & Support</a></li>
              <li><a href="#" className="text-sm hover:text-white">FAQ</a></li>
              <li><a href="#" className="text-sm hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="text-sm hover:text-white">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2">
              <li className="text-sm">Email: support@transitgo.com</li>
              <li className="text-sm">Phone: (555) 123-4567</li>
              <li className="text-sm">Hours: 24/7 Support</li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">Facebook</a>
              <a href="#" className="hover:text-white">Instagram</a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} TransitGo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 