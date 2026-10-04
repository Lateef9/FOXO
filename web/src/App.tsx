import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AnonymisePage } from "./pages/AnonymisePage";
import { MemberPage } from "./pages/MemberPage";
import { MembersPage } from "./pages/MembersPage";
import { PrintPage } from "./pages/PrintPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/print/:playbookId" element={<PrintPage />} />
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<MembersPage />} />
                <Route
                  path="/members/:id/anonymise"
                  element={<AnonymisePage />}
                />
                <Route path="/members/:id" element={<MemberPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
