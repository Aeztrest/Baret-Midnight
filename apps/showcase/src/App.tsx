import { Route, Routes } from "react-router-dom";
import { Header, Footer } from "./components/Chrome";
import HomePage from "./pages/HomePage";
import DemoPage from "./pages/DemoPage";
import DocsPage from "./pages/DocsPage";
import InstallPage from "./pages/InstallPage";
import ShowcasePage from "./pages/ShowcasePage";
import ScenarioPage from "./pages/ScenarioPage";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/showcase" element={<ShowcasePage />} />
          <Route path="/showcase/:slug" element={<ScenarioPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/install" element={<InstallPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
