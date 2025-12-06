/**
 * DebugApp Component
 * Debug/development version of the viewer with all data loading mechanisms
 * Integrates with new data loading, state management, and UI components
 */

import { useState } from 'react';
import GraphViewer from '../../core/components/GraphViewer';
import LayerPanel from '../../core/components/LayerPanel';
import { useModelStore } from '../../core/stores/modelStore';
import { DataLoader } from '../../core/services/dataLoader';
import { GitHubService } from '../../core/services/githubService';
import { LocalFileLoader } from '../../core/services/localFileLoader';
import { SpecParser } from '../../core/services/specParser';
import { loadDemoData } from '../../core/services/demoData';
import './DebugApp.css';

type ViewMode = 'schema' | 'instance';

function DebugApp() {
  const { model, loading, error, setModel, setLoading, setError } = useModelStore();
  const [viewMode, setViewMode] = useState<ViewMode>('schema');

  /**
   * Load demo data
   */
  const loadDemo = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Loading demo data...');

      const model = await loadDemoData();
      setModel(model);

      console.log('Demo model loaded successfully:', model);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading demo data:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load example-implementation YAML model from server
   */
  const loadExampleImplementation = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Loading example-implementation from server...');

      // Fetch the YAML files as JSON from the server
      const response = await fetch('http://localhost:3002/api/example-implementation');

      if (!response.ok) {
        throw new Error('Failed to load example implementation from server');
      }

      const files = await response.json();
      console.log(`Received ${Object.keys(files).length} YAML files from server`);

      // Parse the YAML data using DataLoader
      const dataLoader = new DataLoader(
        new GitHubService(),
        new LocalFileLoader(),
        new SpecParser()
      );

      // Use parseYAMLInstances directly with the file data
      const model = await dataLoader.parseYAMLInstances(files, '0.1.0');
      setModel(model);

      console.log('Example implementation loaded successfully:', model);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading example implementation:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load data from GitHub releases
   */
  const loadFromGitHub = async (version: string = 'latest') => {
    try {
      setLoading(true);
      setError('');

      console.log(`Loading model from GitHub (${version})...`);

      const dataLoader = new DataLoader(
        new GitHubService(),
        new LocalFileLoader(),
        new SpecParser()
      );

      const model = await dataLoader.loadFromGitHub(version);
      setModel(model);

      console.log('Model loaded successfully from GitHub:', model);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading from GitHub';
      setError(errorMessage);
      console.error('Error loading from GitHub:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load data from local files
   */
  const loadFromLocal = async (files: FileList) => {
    try {
      setLoading(true);
      setError('');

      console.log('Loading model from local files...');

      const dataLoader = new DataLoader(
        new GitHubService(),
        new LocalFileLoader(),
        new SpecParser()
      );

      const model = await dataLoader.loadFromLocal(files);
      setModel(model);

      console.log('Model loaded successfully:', model);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading from local files:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      loadFromLocal(files);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Documentation Robotics Viewer</h1>

        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          <button
            className={`toggle-button ${viewMode === 'schema' ? 'active' : ''}`}
            onClick={() => setViewMode('schema')}
          >
            📋 View Schema
          </button>
          <button
            className="toggle-button"
            disabled={true}
            title="Instance viewing coming soon"
          >
            📊 View Instances (Coming Soon)
          </button>
        </div>

        <div className="app-controls">
          <button
            onClick={loadDemo}
            disabled={loading}
            className="control-button primary"
          >
            {loading ? 'Loading...' : 'Load Demo Data'}
          </button>

          <button
            onClick={loadExampleImplementation}
            disabled={loading}
            className="control-button primary"
          >
            Load Example YAML Model
          </button>

          <button
            onClick={() => loadFromGitHub('latest')}
            disabled={loading}
            className="control-button"
          >
            Load from GitHub
          </button>

          <label className="file-input-label control-button">
            Load Files/ZIP
            <input
              type="file"
              multiple
              accept=".json,.yaml,.yml,.zip"
              onChange={handleFileChange}
              disabled={loading}
              className="file-input"
            />
          </label>

          <label className="file-input-label control-button">
            Load Folder
            {/* @ts-ignore */}
            <input
              type="file"
              {...({ webkitdirectory: 'true' } as any)}
              onChange={handleFileChange}
              disabled={loading}
              className="file-input"
            />
          </label>

          {model && (
            <div className="version-badge">
              v{model.version}
              {model.metadata?.type === 'schema-definitions' && (
                <span className="schema-badge"> (Schema)</span>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="app-content">
        <LayerPanel />

        <div className="viewer-container">
          {loading && (
            <div className="message-overlay">
              <div className="message-box">
                <div className="spinner"></div>
                <p>Loading data model...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="message-overlay">
              <div className="message-box error">
                <h3>Error</h3>
                <p>{error}</p>
                <button onClick={() => setError('')} className="control-button">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {!loading && !error && !model && (
            <div className="message-overlay">
              <div className="message-box welcome">
                <h2>Welcome to Documentation Robotics Viewer</h2>
                <p className="mode-notice">
                  Currently viewing in <strong>Schema Mode</strong> - displays the specification structure
                </p>
                <p>Load a model to get started:</p>
                <ul>
                  <li>Click <strong>"Load Demo Data"</strong> to see a sample visualization</li>
                  <li>Click <strong>"Load from GitHub"</strong> to load the specification schema from releases</li>
                  <li>Use <strong>"Load Files/ZIP"</strong> to open JSON/YAML files or ZIP archives</li>
                  <li>Use <strong>"Load Folder"</strong> to load a YAML model directory with manifest.yaml</li>
                </ul>
                <p className="info-note">
                  ℹ️ Schema mode shows the definition structure including all element types,
                  properties, and their constraints.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && model && (
            <GraphViewer model={model} />
          )}
        </div>
      </div>
    </div>
  );
}

export default DebugApp;
