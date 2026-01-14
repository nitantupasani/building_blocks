# Building Blocks Editor

A visual editor for building HVAC system hierarchies with React Flow frontend and Python FastAPI backend.

## Project Structure

```
mpl_canvas_editor/
├── frontend/          # React + Vite application
│   ├── src/
│   │   ├── api/      # Backend API integration
│   │   ├── nodes/    # Node components
│   │   ├── utils/    # Layout algorithms
│   │   └── App.jsx   # Main application
│   └── package.json
│
└── backend/          # Python FastAPI service
    ├── main.py       # API endpoints
    ├── graph_data.json  # Data storage
    └── requirements.txt
```

## Features

- **8 Node Types**: Building, Primary/Secondary/Tertiary HW/CHW Loops, Sensors
- **Directed Graph Connections**: Parent-child relationships with arrows
- **Auto-layout**: Hierarchical tree layout for nodes without positions
- **Custom Properties**: Each node type has specific properties
- **Expand/Collapse**: View detailed properties
- **Backend Integration**: REST API for persistent storage
- **Real-time Sync**: Auto-save changes to backend

## Quick Start

### 1. Start Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend runs at: `http://localhost:8000`

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

## Usage

### Frontend
- **Add Nodes**: Click buttons on the left or double-click canvas
- **Connect Nodes**: Drag from handles (circles on edges)
- **Edit Labels**: Double-click a node
- **Properties**: Click expand button (+ at bottom)
- **Context Menu**: Right-click to change type or delete

### Python API Integration

The frontend automatically:
- Loads graph from backend on startup
- Applies auto-layout for nodes without positions
- Saves changes every second (debounced)

### Manual API Usage

```python
import requests

# Create a building node
response = requests.post('http://localhost:8000/api/nodes', json={
    "id": "building-1",
    "type": "building",
    "position": None,  # Let frontend calculate
    "properties": {
        "label": "Main Building",
        "address": "123 Main St",
        "floors": 10,
        "area": 50000
    }
})

# Create a connection
requests.post('http://localhost:8000/api/edges', json={
    "id": "e-building-1-hw-1",
    "source": "building-1",
    "target": "hw-loop-1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
})

# Get entire graph
graph = requests.get('http://localhost:8000/api/graph').json()
print(graph)
```

## Hybrid Position Handling

The system uses a **hybrid approach**:

1. **Python sends positions (optional)**:
   - If node has `position: {x, y}` → Frontend uses it
   - If `position: null` → Frontend calculates using auto-layout

2. **User can drag to override**: Any manual positioning is saved back to Python

3. **Auto-layout on import**: If all positions are missing or (0,0), frontend automatically arranges nodes in a tree structure

## Development

### Frontend Environment Variables

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

### Backend Configuration

Edit `backend/main.py` to:
- Change CORS origins
- Switch from file storage to database
- Add authentication

## Node Types & Properties

| Type | Size | Properties |
|------|------|------------|
| Building | 240×140 | address, floors, area, description |
| Primary HW | 190×110 | flowRate, supplyTemp, returnTemp, pumpInfo |
| Primary CHW | 190×110 | flowRate, supplyTemp, returnTemp, chillerInfo |
| Secondary HW | 160×90 | flowRate, supplyTemp, returnTemp |
| Secondary CHW | 160×90 | flowRate, supplyTemp, returnTemp |
| Tertiary HW | 135×75 | flowRate, supplyTemp, returnTemp |
| Tertiary CHW | 135×75 | flowRate, supplyTemp, returnTemp |
| Sensor | 95×60 | sensorType, unit, range, location |

## API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation.
