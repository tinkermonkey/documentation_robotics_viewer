import React, { useEffect, useState } from 'react'
import GraphViewer from './components/GraphViewer'
import './App.css'

function App() {
  const [dataModel, setDataModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDataModel()
  }, [])

  const fetchDataModel = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/data-model')
      if (!response.ok) {
        throw new Error('Failed to fetch data model')
      }
      const data = await response.json()
      setDataModel(data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching data model:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Documentation Robotics Viewer</h1>
        <button onClick={fetchDataModel} className="refresh-button">
          Refresh
        </button>
      </header>
      <div className="app-content">
        {loading && <div className="message">Loading data model...</div>}
        {error && <div className="message error">Error: {error}</div>}
        {!loading && !error && dataModel && (
          <GraphViewer dataModel={dataModel} />
        )}
      </div>
    </div>
  )
}

export default App
