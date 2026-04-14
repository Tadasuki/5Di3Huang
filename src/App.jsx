import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import HomePage from './components/home/HomePage'
import TimelineView from './components/timeline/TimelineView'
import MapView from './components/map/MapView'
import ToolsView from './components/tools/ToolsView'
import LeaderComparePage from './components/tools/LeaderComparePage'
import AboutView from './components/about/AboutView'
import LeaderDetail from './components/leader/LeaderDetail'
import DynastyDetail from './components/dynasty/DynastyDetail'
import RegionalRegimeDetail from './components/regional/RegionalRegimeDetail'
import EventDetail from './components/event/EventDetail'
import EventTypeView from './components/event/EventTypeView'
import EventsView from './components/event/EventsView'
import FactionDetail from './components/faction/FactionDetail'
import FamilyDetail from './components/family/FamilyDetail'
import ErrorBoundary from './components/common/ErrorBoundary'
import { SearchVisibilityProvider } from './context/SearchVisibilityContext'

function App() {
  return (
    <SearchVisibilityProvider>
      <div className="app">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/timeline" element={<TimelineView />} />
            <Route path="/map" element={<MapView />} />
          <Route path="/tools" element={<ToolsView />} />
          <Route path="/tools/leader-compare" element={<LeaderComparePage />} />
          <Route path="/about" element={<AboutView />} />
          <Route path="/dynasty/:id" element={<DynastyDetail />} />
          <Route path="/regional/:id" element={<RegionalRegimeDetail />} />
          <Route path="/leader/:id" element={<ErrorBoundary><LeaderDetail /></ErrorBoundary>} />
          <Route path="/faction/:id" element={<FactionDetail />} />
          <Route path="/family/:id" element={<FamilyDetail />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/events" element={<EventsView />} />
          <Route path="/events/type/:type" element={<EventTypeView />} />
        </Routes>
      </main>
        <Footer />
      </div>
    </SearchVisibilityProvider>
  )
}

export default App
