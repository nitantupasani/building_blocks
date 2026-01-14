# Building Blocks Editor - Python Backend

Python backend service for the Building Blocks Editor using FastAPI.

## Setup

### 1. Install Python Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run the Backend

```bash
# From the backend directory
python main.py
```

The API will be available at `http://localhost:8000`

### 3. API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Graph Operations
- `GET /api/graph` - Get entire graph (nodes + edges)
- `POST /api/graph` - Update entire graph

### Node Operations
- `GET /api/nodes` - Get all nodes
- `POST /api/nodes` - Create a node
- `GET /api/nodes/{id}` - Get specific node
- `PUT /api/nodes/{id}` - Update node (properties, type, position)
- `DELETE /api/nodes/{id}` - Delete node and connected edges

### Edge Operations
- `GET /api/edges` - Get all edges
- `POST /api/edges` - Create an edge
- `DELETE /api/edges/{id}` - Delete edge

### Tree Operations
- `GET /api/tree` - Get hierarchical tree structure

## Data Format

### Node Structure
```json
{
  "id": "1",
  "type": "building",
  "position": {"x": 100, "y": 50},
  "properties": {
    "label": "Building 1",
    "address": "123 Main St",
    "floors": 5
  }
}
```

### Edge Structure
```json
{
  "id": "e1-2",
  "source": "1",
  "target": "2",
  "sourceHandle": "bottom",
  "targetHandle": "top"
}
```

## Storage

Data is stored in `graph_data.json` in the backend directory. This is a simple file-based storage for development. For production, consider using:
- PostgreSQL
- MongoDB
- Redis

## Development

### Environment Variables

Create a `.env` file (optional):
```
HOST=0.0.0.0
PORT=8000
```

### CORS

CORS is configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (React dev server)

Add additional origins in `main.py` if needed.
