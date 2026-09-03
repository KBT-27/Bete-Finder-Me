import React from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { PropertyProvider, useProperties } from './context/PropertyContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { SyncStatusBar } from './components/common/SyncStatusBar';
import { HeroSection } from './components/home/HeroSection';
import { PropertyCategories } from './components/home/PropertyCategories';
import { BeteAISection } from './components/home/BeteAISection';
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
import { FloatingBeteAIButton } from './components/ai/FloatingBeteAIButton';
import { BeteAIAssistantModal } from './components/ai/BeteAIAssistantModal';

const MainContent: React.FC = () => {
  const { currentView, setCurrentView, openAIChatWithPrompt } = useProperties();

  return (
    <main className="min-h-screen flex flex-col justify-between">
      <div>
        {currentView === 'home' && (
          <>
            <HeroSection />
            <PropertyCategories />
            {/* Bete AI Ethiopian Real Estate Advisor */}
            <BeteAISection onOpenAIChat={openAIChatWithPrompt} />
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

const AppShell: React.FC = () => {
  const { isAIChatOpen, setIsAIChatOpen, aiInitialPrompt, openAIChatWithPrompt } = useProperties();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-amber-500 selection:text-white">
      <SyncStatusBar />
      <Navbar />
      <MainContent />

      {/* Global Bete AI Floating Action Button */}
      <FloatingBeteAIButton onClick={() => openAIChatWithPrompt()} />

      {/* Global Bete AI Assistant Modal */}
      <BeteAIAssistantModal 
        isOpen={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(false)} 
        initialPrompt={aiInitialPrompt} 
      />

      {/* Global Overlays & Modals */}
      <AuthModal />
      <PaymentModal />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PropertyProvider>
          <AppShell />
        </PropertyProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}