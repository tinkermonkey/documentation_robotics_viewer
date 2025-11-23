# Documentation Robotics Viewer

A React-based graph visualization tool for the documentation robotics meta-model. Uses [tldraw](https://tldraw.dev) for interactive graph display and [dagre.js](https://github.com/dagrejs/dagre) for automatic node layout.

## Features

- **Interactive Graph Visualization**: Powered by tldraw, allowing pan, zoom, and interaction with the graph
- **Automatic Layout**: Uses dagre.js to automatically arrange nodes in a hierarchical layout
- **Development Server**: Includes a mini Express server to serve the data model
- **Live Data**: Fetches and displays the documentation robotics meta-model from the API

## Project Structure

```
├── src/                      # React application source
│   ├── components/          # React components
│   │   └── GraphViewer.jsx  # Main graph visualization component
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # Application entry point
│   └── *.css                # Styling
├── server/                   # Development server
│   └── index.cjs            # Express server serving the data model API
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
npm install
```

### Development

Start both the API server and the development frontend:

```bash
npm start
```

Or run them separately:

```bash
# Terminal 1: Start the API server (port 3001)
npm run server

# Terminal 2: Start the frontend dev server (port 3000)
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
```

The production build will be output to the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## API Endpoints

The mini-server provides the following endpoints:

- `GET /api/data-model` - Returns the documentation robotics meta-model as JSON
- `GET /api/health` - Health check endpoint

## Data Model Format

The data model should follow this structure:

```json
{
  "nodes": [
    {
      "id": "unique-id",
      "label": "Display Name",
      "color": "blue",
      "description": "Optional description"
    }
  ],
  "edges": [
    {
      "source": "source-node-id",
      "target": "target-node-id"
    }
  ]
}
```

### Supported Colors

tldraw supports the following colors for nodes:
- `black`
- `blue`
- `green`
- `grey`
- `light-blue`
- `light-green`
- `light-red`
- `light-violet`
- `orange`
- `red`
- `violet`
- `yellow`

## Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **tldraw** - Interactive canvas and drawing library
- **dagre.js** - Graph layout algorithm
- **Express** - Mini API server for development
- **CORS** - Cross-origin resource sharing

## Customizing the Data Model

To customize the data model served by the API, edit the `dataModel` object in `server/index.cjs`.

## License

ISC
