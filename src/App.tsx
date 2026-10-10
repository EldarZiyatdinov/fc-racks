import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { JsonPage } from '@/pages/JsonPage'
import { LayoutPlanPage } from '@/pages/layout/LayoutPlanPage'
import { RacksPage } from '@/pages/RacksPage'
import { ViewerPage } from '@/pages/ViewerPage'

// HashRouter: GitHub Pages не умеет отдавать index.html на произвольный путь.
function App() {
  return (
    <TooltipProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/racks" replace />} />
            <Route path="racks" element={<RacksPage />} />
            <Route path="layout" element={<LayoutPlanPage />} />
            <Route path="view/:buildingId?/:floorId?/:rowId?" element={<ViewerPage />} />
            <Route path="json" element={<JsonPage />} />
            <Route path="*" element={<Navigate to="/racks" replace />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  )
}

export default App
