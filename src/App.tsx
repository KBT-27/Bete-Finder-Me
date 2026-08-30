import React from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { PropertyProvider, useProperties } from './context/PropertyContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HeroSection } from './components/home/HeroSection';
import { PropertyCategories } from './components/home/PropertyCategories';
import { FeaturedProperties } from './components/home/FeaturedProperties';
import { PopularLocations } from './components/home/PopularLocations';
import { WhyChooseUs } from './components/home/WhyChooseUs';
import { LatestProperties } from './components/home/LatestProperties';
import { PropertiesView } from './components/properties/PropertiesView';
import { PropertyDetailsView } from './components/properties/PropertyDetailsView';
import { PostPropertyView } from './components/properties/PostPropertyView';
import { PlansPricingView } from './components/plans/PlansPricingView';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { ResetPasswordView } from './components/auth/ResetPasswordView';
import { PaymentModal } from './components/payment/PaymentModal';

const MainContent: React.FC = () => {
  const { currentView, setCurrentView } = useProperties();

  return (
    <main className="min-h-screen flex flex-col justify-between">
      <div>
        {currentView === 'home' && (
          <>
            <HeroSection />
            <PropertyCategories />
            <FeaturedProperties />
            <PopularLocations />
            <WhyChooseUs />
            <LatestProperties />
          </>
        )}

        {currentView === 'properties' && <PropertiesView />}

        {currentView === 'details' && <PropertyDetailsView />}

        {currentView === 'post' && <PostPropertyView />}

        {currentView === 'pricing' && <PlansPricingView />}

        {currentView === 'dashboard' && <UserDashboard />}

        {currentView === 'reset-password' && (
          <div className="py-16 px-4 max-w-7xl mx-auto flex items-center justify-center min-h-[70vh]">
            <ResetPasswordView 
              onSuccess={() => setCurrentView('home')} 
              onCancel={() => setCurrentView('home')}
            />
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PropertyProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-amber-500 selection:text-white">
            <Navbar />
            <MainContent />

            {/* Global Overlays & Modals */}
            <AuthModal />
            <PaymentModal />
          </div>
        </PropertyProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}