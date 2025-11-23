const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Sample data model representing a documentation robotics meta-model
const dataModel = {
  nodes: [
    {
      id: 'document',
      label: 'Document',
      color: 'blue',
      description: 'Root document entity'
    },
    {
      id: 'section',
      label: 'Section',
      color: 'green',
      description: 'Document section'
    },
    {
      id: 'paragraph',
      label: 'Paragraph',
      color: 'orange',
      description: 'Text paragraph'
    },
    {
      id: 'heading',
      label: 'Heading',
      color: 'violet',
      description: 'Section heading'
    },
    {
      id: 'metadata',
      label: 'Metadata',
      color: 'red',
      description: 'Document metadata'
    },
    {
      id: 'author',
      label: 'Author',
      color: 'yellow',
      description: 'Content author'
    },
    {
      id: 'reference',
      label: 'Reference',
      color: 'light-blue',
      description: 'Cross-reference'
    },
    {
      id: 'annotation',
      label: 'Annotation',
      color: 'light-green',
      description: 'Content annotation'
    }
  ],
  edges: [
    { source: 'document', target: 'section' },
    { source: 'document', target: 'metadata' },
    { source: 'section', target: 'heading' },
    { source: 'section', target: 'paragraph' },
    { source: 'paragraph', target: 'reference' },
    { source: 'paragraph', target: 'annotation' },
    { source: 'metadata', target: 'author' },
    { source: 'section', target: 'section' }
  ]
}

// API endpoint to get the data model
app.get('/api/data-model', (req, res) => {
  res.json(dataModel)
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`Mini-server running on http://localhost:${PORT}`)
  console.log(`API endpoint: http://localhost:${PORT}/api/data-model`)
})
