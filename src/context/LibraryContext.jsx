import { createContext, useContext, useState, useEffect } from 'react'

const LibraryContext = createContext()
const STORAGE_ID_KEY = 'selectedLibraryId'
const STORAGE_DATA_KEY = 'selectedLibraryData'

export function useLibrary() {
  const context = useContext(LibraryContext)
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider')
  }
  return context
}

export function LibraryProvider({ children }) {
  const [selectedLibrary, setSelectedLibrary] = useState(() => {
    const savedLibraryData = localStorage.getItem(STORAGE_DATA_KEY)
    if (savedLibraryData) {
      try {
        return JSON.parse(savedLibraryData)
      } catch (error) {
        localStorage.removeItem(STORAGE_DATA_KEY)
        return null
      }
    }
    return null
  })
  const [libraries, setLibraries] = useState([])

  useEffect(() => {
    if (!libraries.length) return

    const savedLibraryId = localStorage.getItem(STORAGE_ID_KEY)
    if (!savedLibraryId) return

    const library = libraries.find(lib => lib.id === parseInt(savedLibraryId))
    if (library) {
      const freshLibrary = { ...library }
      setSelectedLibrary(current => (current && current.id === freshLibrary.id ? current : freshLibrary))
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(freshLibrary))
    }
  }, [libraries])

  const selectLibrary = (library) => {
    // Create a fresh copy to ensure React detects the change
    const freshLibrary = library ? { ...library } : null
    setSelectedLibrary(freshLibrary)
    if (library) {
      localStorage.setItem(STORAGE_ID_KEY, library.id.toString())
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(freshLibrary))
    } else {
      localStorage.removeItem(STORAGE_ID_KEY)
      localStorage.removeItem(STORAGE_DATA_KEY)
    }
  }

  const clearLibrary = () => {
    setSelectedLibrary(null)
    localStorage.removeItem(STORAGE_ID_KEY)
    localStorage.removeItem(STORAGE_DATA_KEY)
  }

  return (
    <LibraryContext.Provider value={{
      selectedLibrary,
      libraries,
      setLibraries,
      selectLibrary,
      clearLibrary
    }}>
      {children}
    </LibraryContext.Provider>
  )
}
