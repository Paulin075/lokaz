
import React from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Home, Users, Shield, Zap, Heart, Award } from 'lucide-react'

const About = () => {
  const features = [
    {
      icon: Home,
      title: "Logements de qualité",
      description: "Nous sélectionnons rigoureusement chaque propriété pour garantir votre confort et votre sécurité."
    },
    {
      icon: Users,
      title: "Communauté locale",
      description: "Connectez-vous avec des propriétaires et locataires de confiance partout au Togo."
    },
    {
      icon: Shield,
      title: "Sécurité garantie",
      description: "Transactions sécurisées, vérification des identités et support client 24/7."
    },
    {
      icon: Zap,
      title: "Chap-Chap",
      description: "Service express pour les locations urgentes à l'heure ou à la journée."
    }
  ]

  const stats = [
    { value: "500+", label: "Logements disponibles" },
    { value: "1000+", label: "Clients satisfaits" },
    { value: "50+", label: "Villes couvertes" },
    { value: "24/7", label: "Support client" }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-baloo text-lokaz-black mb-6">
            À propos de <span className="text-lokaz-orange">Lokaz</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Lokaz révolutionne la location immobilière au Togo en connectant propriétaires et locataires 
            sur une plateforme moderne, sécurisée et adaptée aux besoins locaux.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold font-baloo text-lokaz-black mb-6">
              Notre Mission
            </h2>
            <p className="text-gray-600 mb-4">
              Faciliter l'accès au logement pour tous les Togolais en proposant une plateforme 
              intuitive qui simplifie la recherche, la réservation et la gestion locative.
            </p>
            <p className="text-gray-600 mb-4">
              Nous croyons que chacun mérite un logement de qualité, et nous travaillons chaque jour 
              pour rendre cette vision réalité à travers la technologie et l'innovation.
            </p>
            <div className="flex items-center gap-4">
              <Heart className="h-8 w-8 text-lokaz-orange" />
              <span className="text-lokaz-orange font-semibold">
                Fait avec ❤️ pour le Togo
              </span>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=600&q=80"
              alt="Maison moderne au Togo"
              className="rounded-lg shadow-lg"
            />
            <div className="absolute -bottom-4 -right-4 bg-lokaz-orange text-white p-4 rounded-lg">
              <Award className="h-6 w-6 mb-2" />
              <div className="text-sm font-semibold">Certifié</div>
              <div className="text-xs">Plateforme de confiance</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-baloo text-lokaz-black text-center mb-12">
            Pourquoi choisir Lokaz ?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="bg-lokaz-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-lokaz-orange" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-lokaz-orange to-lokaz-orange-light rounded-2xl p-8 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold font-baloo mb-2">
                  {stat.value}
                </div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-baloo text-lokaz-black mb-8">
            Nos Valeurs
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="font-semibold text-xl mb-2">Confiance</h3>
              <p className="text-gray-600">
                Nous privilégions la transparence et l'honnêteté dans toutes nos interactions.
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="font-semibold text-xl mb-2">Innovation</h3>
              <p className="text-gray-600">
                Nous utilisons les dernières technologies pour améliorer votre expérience.
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="font-semibold text-xl mb-2">Impact Local</h3>
              <p className="text-gray-600">
                Nous contribuons au développement économique et social du Togo.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold font-baloo text-lokaz-black mb-4">
            Une question ? Contactez-nous !
          </h2>
          <p className="text-gray-600 mb-6">
            Notre équipe est là pour vous accompagner dans votre recherche de logement.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <div className="flex items-center gap-2">
              <span className="text-lokaz-orange">📧</span>
              <span>lokazsu228@gmail.com</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lokaz-orange">📞</span>
              <span>+228 96 20 04 88</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lokaz-orange">📍</span>
              <span>Lomé, Togo</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default About
