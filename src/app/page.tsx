'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import { INSTITUTIONS } from '@/lib/constants';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Türk Hukuk Sistemine
                <span className="block text-gradient">Kapsamlı Erişim</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                11 farklı hukuk kurumundan anlık arama yapın. AI destekli analiz ile 
                hukuki kararları kolayca anlayın ve özetleyin.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link href="/auth/register">
                <Button size="lg" className="px-8 py-4">
                  Ücretsiz Başlayın
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="px-8 py-4">
                  Demo İzle
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 011.5 1.5V14a1.5 1.5 0 01-1.5 1.5H9m8.5-3.5V10a1.5 1.5 0 00-1.5-1.5H15" />
                  </svg>
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">11</div>
                <div className="text-gray-600">Hukuk Kurumu</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">1M+</div>
                <div className="text-gray-600">Karar Arşivi</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">3</div>
                <div className="text-gray-600">AI Asistan</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-secondary-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-primary-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Güçlü Özellikler
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hukuki araştırmalarınızı hızlandıran modern araçlar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🔍',
                title: 'Kapsamlı Arama',
                description: 'Tüm kurumları tek seferde arayın veya spesifik kurumlarda detaylı arama yapın'
              },
              {
                icon: '🤖',
                title: 'AI Destekli Analiz',
                description: 'ChatGPT, Claude ve Gemini ile hukuki metinleri analiz edin ve özetleyin'
              },
              {
                icon: '⚡',
                title: 'Hızlı Sonuçlar',
                description: 'Gelişmiş algoritma ile saniyeler içinde en ilgili sonuçları bulun'
              },
              {
                icon: '📊',
                title: 'Akıllı Filtreleme',
                description: 'Tarih aralığı, daire, karar türü gibi kriterlere göre sonuçları filtreleyin'
              },
              {
                icon: '💾',
                title: 'Kaydetme ve Paylaşım',
                description: 'Önemli kararları kaydedin ve ekibinizle kolayca paylaşın'
              },
              {
                icon: '📱',
                title: 'Responsive Tasarım',
                description: 'Masaüstü, tablet ve mobil cihazlarda mükemmel deneyim'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutions Section */}
      <section id="institutions" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Desteklenen Kurumlar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Türkiye'nin en önemli hukuk kurumlarına tek platformdan erişim
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {INSTITUTIONS.map((institution, index) => (
              <motion.div
                key={institution.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 ${institution.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                    {institution.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900">{institution.name}</h3>
                </div>
                <p className="text-sm text-gray-600">{institution.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Hukuki Araştırmalarınızı Hızlandırın
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Bugün başlayın ve Türk hukuk sistemindeki tüm kaynaklara anında erişim sağlayın
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4">
                Ücretsiz Hesap Oluştur
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Y</span>
                </div>
                <span className="text-xl font-bold">Yargı SaaS</span>
              </div>
              <p className="text-gray-400">
                Türk hukuk sistemine kapsamlı erişim sağlayan modern platform
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Ürün</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Özellikler</Link></li>
                <li><Link href="#institutions" className="hover:text-white transition-colors">Kurumlar</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Fiyatlandırma</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Destek</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Yardım Merkezi</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API Dokümantasyonu</Link></li>
                <li><Link href="#contact" className="hover:text-white transition-colors">İletişim</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Yasal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Kullanım Şartları</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">KVKK</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Yargı SaaS. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}