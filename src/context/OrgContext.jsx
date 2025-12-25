import { createContext, useContext, useState, useEffect } from 'react'

const OrgContext = createContext(null)
const STORAGE_ID_KEY = 'selectedOrgId'
const STORAGE_DATA_KEY = 'selectedOrgData'

function useOrg() {
  const context = useContext(OrgContext)
  if (!context) {
    throw new Error('useOrg must be used within OrgProvider')
  }
  return context
}

const OrgProvider = ({ children }) => {
  const [selectedOrg, setSelectedOrg] = useState(() => {
    const savedOrgData = localStorage.getItem(STORAGE_DATA_KEY)
    if (savedOrgData) {
      try {
        return JSON.parse(savedOrgData)
      } catch (error) {
        localStorage.removeItem(STORAGE_DATA_KEY)
        return null
      }
    }
    return null
  })
  const [orgs, setOrgs] = useState([])

  useEffect(() => {
    if (!orgs.length) return

    const savedOrgId = localStorage.getItem(STORAGE_ID_KEY)
    if (!savedOrgId) return

    const org = orgs.find(o => o.id === parseInt(savedOrgId))
    if (org) {
      const freshOrg = { ...org }
      setSelectedOrg(current => (current && current.id === freshOrg.id ? current : freshOrg))
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(freshOrg))
    }
  }, [orgs])

  const selectOrg = (org) => {
    // Create a fresh copy to ensure React detects the change
    const freshOrg = org ? { ...org } : null
    setSelectedOrg(freshOrg)
    if (org) {
      localStorage.setItem(STORAGE_ID_KEY, org.id.toString())
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(freshOrg))
    } else {
      localStorage.removeItem(STORAGE_ID_KEY)
      localStorage.removeItem(STORAGE_DATA_KEY)
    }
  }

  const clearSelection = () => {
    setSelectedOrg(null)
    localStorage.removeItem(STORAGE_ID_KEY)
    localStorage.removeItem(STORAGE_DATA_KEY)
  }

  const value = {
    selectedOrg,
    orgs,
    setOrgs,
    selectOrg,
    clearSelection
  }

  return (
    <OrgContext.Provider value={value}>
      {children}
    </OrgContext.Provider>
  )
}

export { useOrg, OrgProvider }
