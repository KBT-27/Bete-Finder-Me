import React, { useEffect, useRef } from 'react';
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
import { OwnerFeedbackModal } from './components/feedback/OwnerFeedbackModal';

// Google AdSense Banner Component
const AdSenseBanner: React.FC = () => {
  const adRef = useRef<HTMLModElement | null>(null);
  const isPushedRef = useRef(false);

  useEffect(() => {
    // Avoid double-pushing if already initiated for this instance
    if (isPushedRef.current) return;

    const el = adRef.current;
    if (!el) return;

    // Check if element has already been processed by AdSense
    if (el.getAttribute('data-adsbygoogle-status') === 'done' || el.children.length > 0) {
      return;
    }

    // Ensure there is at least one unfilled ins.adsbygoogle in the DOM before pushing
    const pendingIns = document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])');
    if (pendingIns.length === 0) {
      return;
    }

    try {
      isPushedRef.current = true;
      if (typeof window !== 'undefined') {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e: any) {
      // Gracefully catch and ignore benign AdSense SPA duplicate push warnings
      const msg = e?.message || String(e);
      if (!msg.includes('already have ads in them')) {
        console.warn('AdSense notice:', msg);
      }
    }
  }, []);

  return (
    <div className="my-6 w-full overflow-hidden flex justify-center px-4">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', maxWidth: '728px' }}
        data-ad-client="ca-pub-7267372597438656"
        data-ad-slot="5231098149"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

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

        {/* AdSense Banner displayed across pages right above the footer section */}
        <AdSenseBanner />
      </div>

      <Footer />
    </main>
  );
};

const AppShell: React.FC = () => {
  const { 
    isAIChatOpen, 
    setIsAIChatOpen, 
    aiInitialPrompt, 
    openAIChatWithPrompt,
    isFeedbackOpen,
    setIsFeedbackOpen,
    openFeedbackModal
  } = useProperties();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-amber-500 selection:text-white">
      <SyncStatusBar />
      <Navbar />
      <MainContent />

      {/* Global Bete AI Floating Action Button with Touch Feedback */}
      <FloatingBeteAIButton 
        onClick={() => openAIChatWithPrompt()} 
        onOpenFeedback={() => openFeedbackModal()}
      />

      {/* Global Bete AI Assistant Modal */}
      <BeteAIAssistantModal 
        isOpen={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(false)} 
        initialPrompt={aiInitialPrompt} 
      />

      {/* Global Owner Direct Feedback Modal - pops up in the very front */}
      <OwnerFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
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