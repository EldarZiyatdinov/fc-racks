import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { JsonPage } from '@/pages/JsonPage'
import { LayoutPlanPage } from '@/pages/layout/LayoutPlanPage'
import { LayoutTablePage } from '@/pages/layout/LayoutTablePage'
import { LayoutWizardPage } from '@/pages/layout/LayoutWizardPage'
import { TemplatesFormPage } from '@/pages/templates/TemplatesFormPage'
import { TemplatesVisualPage } from '@/pages/templates/TemplatesVisualPage'
import { ViewerPage } from '@/pages/ViewerPage'

// HashRouter: GitHub Pages не умеет отдавать index.html на произвольный путь.
function App() {
  return (
    <TooltipProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/templates" replace />} />
            <Route path="templates" element={<TemplatesVisualPage />} />
            <Route path="templates/form" element={<TemplatesFormPage />} />
            <Route path="layout" element={<LayoutPlanPage />} />
            <Route path="layout/wizard" element={<LayoutWizardPage />} />
            <Route path="layout/table" element={<LayoutTablePage />} />
            <Route path="view/:buildingId?/:floorId?/:rowId?" element={<ViewerPage />} />
            <Route path="json" element={<JsonPage />} />
            <Route path="*" element={<Navigate to="/templates" replace />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  )
}

export default App
