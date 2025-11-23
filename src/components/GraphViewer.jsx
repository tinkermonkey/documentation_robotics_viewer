import React, { useEffect, useState } from 'react'
import { Tldraw, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import dagre from 'dagre'
import './GraphViewer.css'

const GraphViewer = ({ dataModel }) => {
  const [editor, setEditor] = useState(null)

  useEffect(() => {
    if (!editor || !dataModel) return

    // Clear existing shapes
    editor.selectAll()
    editor.deleteShapes(editor.getSelectedShapeIds())

    // Create shapes from data model
    createGraphShapes(editor, dataModel)
  }, [editor, dataModel])

  const createGraphShapes = (editor, dataModel) => {
    if (!dataModel.nodes || !dataModel.edges) {
      console.warn('Invalid data model structure')
      return
    }

    // Create a new directed graph for dagre layout
    const g = new dagre.graphlib.Graph()
    g.setGraph({
      rankdir: 'TB', // Top to bottom
      nodesep: 100,
      ranksep: 100,
      marginx: 50,
      marginy: 50,
    })
    g.setDefaultEdgeLabel(() => ({}))

    // Define node dimensions
    const nodeWidth = 200
    const nodeHeight = 100

    // Add nodes to dagre graph
    dataModel.nodes.forEach((node) => {
      g.setNode(node.id, {
        label: node.label || node.id,
        width: nodeWidth,
        height: nodeHeight,
      })
    })

    // Add edges to dagre graph
    dataModel.edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target)
    })

    // Calculate layout
    dagre.layout(g)

    // Create tldraw shapes for nodes - using simple note shapes
    const shapeIds = {}
    g.nodes().forEach((nodeId) => {
      const node = g.node(nodeId)
      const dataNode = dataModel.nodes.find((n) => n.id === nodeId)
      
      const shapeId = createShapeId()
      shapeIds[nodeId] = shapeId

      // Create note shape - note shapes are simple cards with text
      editor.createShape({
        id: shapeId,
        type: 'note',
        x: node.x - nodeWidth / 2,
        y: node.y - nodeHeight / 2,
        props: {
          color: dataNode?.color || 'blue',
        },
      })
    })

    // Create tldraw arrows for edges - using x/y coordinates instead of bindings
    g.edges().forEach((edge) => {
      const sourceNode = g.node(edge.v)
      const targetNode = g.node(edge.w)
      
      const arrowId = createShapeId()
      
      // Calculate start and end points
      const startX = sourceNode.x
      const startY = sourceNode.y + nodeHeight / 2
      const endX = targetNode.x
      const endY = targetNode.y - nodeHeight / 2
      
      editor.createShape({
        id: arrowId,
        type: 'arrow',
        x: 0,
        y: 0,
        props: {
          start: {
            x: startX,
            y: startY,
          },
          end: {
            x: endX,
            y: endY,
          },
          color: 'black',
        },
      })
    })

    // Zoom to fit all shapes
    editor.zoomToFit({ duration: 300 })
  }

  return (
    <div className="graph-viewer">
      <Tldraw
        onMount={(editor) => {
          setEditor(editor)
        }}
      />
    </div>
  )
}

export default GraphViewer
