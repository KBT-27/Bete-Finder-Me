import React, { useEffect, useState } from 'react';
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
import { PaymentModal } from './components/payment/PaymentModal';
import { neon } from './lib/neon'; // የኒዮን ክላየንት ማካተቻ

const MainContent: React.FC = () => {
  const { currentView } = useProperties();
  const [todos, setTodos] = useState<any[]>([]);

  // ከኒዮን ዳታቤዝ መረጃዎችን የሚቀበል ኮድ
  useEffect(() => {
    async function fetchTodos() {
      try {
        const { data } = await neon
          .from('todos')
          .select('*')
          .order('id', { ascending: false });

        if (data) {
          setTodos(data);
        }
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    }

    fetchTodos();
  }, []);

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
            
            {/* ከኒዮን ዳታቤዝ የመጡትን ቶዶዎች በሆም ገጽ ላይ ማሳያ (መሞከሪያ) */}
            <div className="p-6 bg-white my-4 mx-auto max-w-4xl rounded-lg shadow">
              <h3 className="text-xl font-bold mb-3">የ Neon Todos ዝርዝር:</h3>
              {todos.length > 0 ? (
                <ul className="list-disc pl-5">
                  {todos.map((todo) => (
                    <li key={todo.id}>{todo.title || JSON.stringify(todo)}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">ምንም መረጃ የለም ወይም ሠንጠረዡ ባዶ ነው።</p>
              )}
            </div>
          </>
        )}

        {currentView === 'properties' && <PropertiesView />}

        {currentView === 'details' && <PropertyDetailsView />}

        {currentView === 'post' && <PostPropertyView />}

        {currentView === 'pricing' && <PlansPricingView />}

        {currentView === 'dashboard' && <UserDashboard />}
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