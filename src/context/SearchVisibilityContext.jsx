import { createContext, useContext, useMemo, useState } from 'react'

const SearchVisibilityContext = createContext(null)

export function SearchVisibilityProvider({ children }) {
  const [homeSearchVisible, setHomeSearchVisible] = useState(false)

  const value = useMemo(
    () => ({ homeSearchVisible, setHomeSearchVisible }),
    [homeSearchVisible]
  )

  return (
    <SearchVisibilityContext.Provider value={value}>
      {children}
    </SearchVisibilityContext.Provider>
  )
}

export function useSearchVisibility() {
  const ctx = useContext(SearchVisibilityContext)
  if (!ctx) {
    return { homeSearchVisible: false, setHomeSearchVisible: () => {} }
  }
  return ctx
}

