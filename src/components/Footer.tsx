
import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import Logo from './Logo';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import FAQ from '../pages/FAQ';
import Terms from '../pages/Terms';
import Privacy from '../pages/Privacy';

const Footer = () => {
  return (
    <footer className="bg-lokaz-black text-white font-baloo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="md:col-span-1">
            <div className="mb-6">
              <Logo className="h-12 w-auto invert" />
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              La première plateforme de gestion locative connectée du Togo. 
              Trouvez, réservez et gérez vos locations en toute simplicité.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-white/10 hover:bg-lokaz-orange p-2 rounded-full transition-colors duration-200">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-lokaz-orange p-2 rounded-full transition-colors duration-200">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-lokaz-orange p-2 rounded-full transition-colors duration-200">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-lokaz-orange p-2 rounded-full transition-colors duration-200">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-lokaz-orange">Services</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Location mensuelle</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Location journalière</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Chap-Chap (à l'heure)</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Gestion immobilière</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Facturation automatique</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-lokaz-orange">Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Centre d'aide</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contactez-nous</a></li>
              <li>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-gray-300 hover:text-white transition-colors w-full text-left">FAQ</button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Foire Aux Questions (FAQ)</DialogTitle>
                    </DialogHeader>
                    <FAQ />
                  </DialogContent>
                </Dialog>
              </li>
              <li>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-gray-300 hover:text-white transition-colors w-full text-left">Conditions d'utilisation</button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Conditions d'utilisation</DialogTitle>
                    </DialogHeader>
                    <Terms />
                  </DialogContent>
                </Dialog>
              </li>
              <li>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-gray-300 hover:text-white transition-colors w-full text-left">Politique de confidentialité</button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Politique de confidentialité</DialogTitle>
                    </DialogHeader>
                    <Privacy />
                  </DialogContent>
                </Dialog>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-lokaz-orange">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-lokaz-orange mr-3 flex-shrink-0" />
                <span className="text-gray-300">Lomé, Togo</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-lokaz-orange mr-3 flex-shrink-0" />
                <span className="text-gray-300">+228 96 20 04 88</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-lokaz-orange mr-3 flex-shrink-0" />
                <span className="text-gray-300">lokazsu228@gmail.com</span>
              </div>
            </div>

            {/* Moyens de paiement */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3 text-lokaz-orange">Moyens de paiement acceptés</h4>
              <div className="flex space-x-2 text-xs">
                <span className="bg-lokaz-orange px-2 py-1 rounded text-white font-medium">TMoney</span>
                <span className="bg-lokaz-orange px-2 py-1 rounded text-white font-medium">Flooz</span>
                <span className="bg-lokaz-orange px-2 py-1 rounded text-white font-medium">Orange Money</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 Lokaz. Tous droits réservés. Plateforme développée avec ❤️ au Togo.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
