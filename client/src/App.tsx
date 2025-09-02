import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import AlumniDirectory from "./components/AlumniDirectory";
import JobBoard from "./components/JobBoard";
import EventsMeetups from "./components/EventsMeetups";
import Recognition from "./components/Recognition";
import Layout from "./components/Layout";
import Home from "./pages/Homepage";
import Newspage from "./components/News/Newspage";
import Directormsg from "./components/Directormsg";
import StoryPage from "./components/SuccessStory/story";
import { LogOut } from "lucide-react";
import StoryDetails from "./components/SuccessStory/Storydetails";
import Gallery from "./components/Gallery";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/index" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/news" element={<Newspage />} />
        <Route path="/news/:id" element={<Newspage />} />
        <Route path="/directormsg" element={<Directormsg />} />
        
        <Route path="/successstory" element={<StoryPage />} />
        <Route path="/story/:id" element={<StoryDetails />} />
        <Route path="/gallery" element={<Gallery />} />
            
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/alumni" element={
              <ProtectedRoute>
                <Layout>
                  <AlumniDirectory />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/jobs" element={
              <ProtectedRoute>
                <Layout>
                  <JobBoard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/events" element={
              <ProtectedRoute>
                <Layout>
                  <EventsMeetups />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/recognition" element={
              <ProtectedRoute>
                <Layout>
                  <Recognition />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
