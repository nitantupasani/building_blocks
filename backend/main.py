from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import json
import yaml
from pathlib import Path

app = FastAPI(title="Building Blocks Editor API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],  # Vite and React default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data storage (in-memory for now, can be replaced with database)
STORAGE_FILE = Path(__file__).parent / "graph_data.json"

# Initialize storage
if not STORAGE_FILE.exists():
    initial_data = {
        "nodes": [],
        "edges": []
    }
    STORAGE_FILE.write_text(json.dumps(initial_data, indent=2))


# Pydantic models
class Position(BaseModel):
    x: float
    y: float


class NodeCreate(BaseModel):
    id: str
    type: str
    position: Optional[Position] = None
    properties: Dict[str, Any]


class NodeUpdate(BaseModel):
    type: Optional[str] = None
    position: Optional[Position] = None
    properties: Optional[Dict[str, Any]] = None


class EdgeCreate(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class GraphData(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]


# Helper functions
def load_graph() -> Dict:
    """Load graph data from storage"""
    return json.loads(STORAGE_FILE.read_text())


def save_graph(data: Dict):
    """Save graph data to storage"""
    STORAGE_FILE.write_text(json.dumps(data, indent=2))


# API Endpoints
@app.get("/")
async def root():
    return {"message": "Building Blocks Editor API", "version": "1.0.0"}


@app.get("/api/graph", response_model=GraphData)
async def get_graph():
    """Get the entire graph (nodes and edges)"""
    data = load_graph()
    return data


@app.post("/api/graph")
async def update_graph(graph: GraphData):
    """Replace the entire graph"""
    save_graph(graph.dict())
    return {"message": "Graph updated successfully"}


@app.get("/api/nodes")
async def get_nodes():
    """Get all nodes"""
    data = load_graph()
    return {"nodes": data["nodes"]}


@app.post("/api/nodes")
async def create_node(node: NodeCreate):
    """Create a new node"""
    data = load_graph()
    
    # Check if node ID already exists
    if any(n["id"] == node.id for n in data["nodes"]):
        raise HTTPException(status_code=400, detail="Node ID already exists")
    
    node_data = node.dict()
    data["nodes"].append(node_data)
    save_graph(data)
    
    return {"message": "Node created", "node": node_data}


@app.get("/api/nodes/{node_id}")
async def get_node(node_id: str):
    """Get a specific node by ID"""
    data = load_graph()
    node = next((n for n in data["nodes"] if n["id"] == node_id), None)
    
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    return node


@app.put("/api/nodes/{node_id}")
async def update_node(node_id: str, update: NodeUpdate):
    """Update a node's properties, type, or position"""
    data = load_graph()
    node = next((n for n in data["nodes"] if n["id"] == node_id), None)
    
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # Update fields if provided
    update_data = update.dict(exclude_unset=True)
    if "type" in update_data:
        node["type"] = update_data["type"]
    if "position" in update_data and update_data["position"]:
        node["position"] = update_data["position"]
    if "properties" in update_data and update_data["properties"]:
        node["properties"].update(update_data["properties"])
    
    save_graph(data)
    return {"message": "Node updated", "node": node}


@app.delete("/api/nodes/{node_id}")
async def delete_node(node_id: str):
    """Delete a node and its connected edges"""
    data = load_graph()
    
    # Find and remove the node
    node_index = next((i for i, n in enumerate(data["nodes"]) if n["id"] == node_id), None)
    if node_index is None:
        raise HTTPException(status_code=404, detail="Node not found")
    
    data["nodes"].pop(node_index)
    
    # Remove all edges connected to this node
    data["edges"] = [e for e in data["edges"] if e["source"] != node_id and e["target"] != node_id]
    
    save_graph(data)
    return {"message": "Node deleted", "id": node_id}


@app.get("/api/edges")
async def get_edges():
    """Get all edges"""
    data = load_graph()
    return {"edges": data["edges"]}


@app.post("/api/edges")
async def create_edge(edge: EdgeCreate):
    """Create a new edge/connection"""
    data = load_graph()
    
    # Verify source and target nodes exist
    node_ids = {n["id"] for n in data["nodes"]}
    if edge.source not in node_ids:
        raise HTTPException(status_code=404, detail=f"Source node {edge.source} not found")
    if edge.target not in node_ids:
        raise HTTPException(status_code=404, detail=f"Target node {edge.target} not found")
    
    # Check if edge already exists
    if any(e["id"] == edge.id for e in data["edges"]):
        raise HTTPException(status_code=400, detail="Edge ID already exists")
    
    edge_data = edge.dict()
    data["edges"].append(edge_data)
    save_graph(data)
    
    return {"message": "Edge created", "edge": edge_data}


@app.delete("/api/edges/{edge_id}")
async def delete_edge(edge_id: str):
    """Delete an edge"""
    data = load_graph()
    
    edge_index = next((i for i, e in enumerate(data["edges"]) if e["id"] == edge_id), None)
    if edge_index is None:
        raise HTTPException(status_code=404, detail="Edge not found")
    
    data["edges"].pop(edge_index)
    save_graph(data)
    
    return {"message": "Edge deleted", "id": edge_id}


@app.get("/api/tree")
async def get_tree_structure():
    """Get the graph as a tree structure (for visualization)"""
    data = load_graph()
    
    # Build adjacency list
    children = {}
    for edge in data["edges"]:
        parent = edge["source"]
        child = edge["target"]
        if parent not in children:
            children[parent] = []
        children[parent].append(child)
    
    # Find root nodes (nodes with no incoming edges)
    all_targets = {e["target"] for e in data["edges"]}
    roots = [n["id"] for n in data["nodes"] if n["id"] not in all_targets]
    
    def build_tree(node_id):
        node = next((n for n in data["nodes"] if n["id"] == node_id), None)
        if not node:
            return None
        
        tree_node = {
            "id": node["id"],
            "type": node["type"],
            "properties": node.get("properties", {}),
            "children": []
        }
        
        if node_id in children:
            tree_node["children"] = [build_tree(child_id) for child_id in children[node_id]]
        
        return tree_node
    
    tree = [build_tree(root_id) for root_id in roots if root_id]
    
    return {"tree": tree, "roots": roots}


# YAML Import Functions
def process_yaml_to_graph(yaml_data: Dict) -> Dict:
    """
    Convert YAML structure to graph format (nodes + edges).
    
    Structure:
    building:
      name: <building_name>
      hot_water_loops:
        - identifier: <id>
          name: <name>
          primary: true/false
          downstream_loops: [<id1>, <id2>, ...]
          heating_curves: [<id1>, <id2>, ...]
    
    Hierarchy:
    Building -> Primary HW Loops -> Secondary HW Loops -> Heating Curves -> Sensors
    """
    nodes = []
    edges = []
    
    if "building" not in yaml_data:
        raise ValueError("YAML must contain 'building' key")
    
    building = yaml_data["building"]
    building_name = building.get("name", "Building")
    building_id = "building-1"
    
    # Create building node
    nodes.append({
        "id": building_id,
        "type": "building",
        "position": None,
        "properties": {
            "label": building_name,
            "description": f"Building with {len(building.get('hot_water_loops', []))} hot water loops"
        }
    })
    
    # Process hot water loops
    hot_water_loops = building.get("hot_water_loops", [])
    heating_curves = building.get("heating_curves", [])
    
    # Build lookup tables
    loop_by_id = {}
    curve_by_id = {}
    
    for loop in hot_water_loops:
        if loop and loop.get("identifier"):
            loop_by_id[loop["identifier"]] = loop
    
    for curve in heating_curves:
        if curve and curve.get("identifier"):
            curve_by_id[curve["identifier"]] = curve
    
    def process_loop_heating_curves(loop_id, loop_data):
        """Process heating curves for a given loop"""
        # Return the first associated heating curve as an embedded object, or None
        for curve_id in loop_data.get("heating_curves", []):
            curve = curve_by_id.get(curve_id)
            if not curve:
                continue

            curve_name = curve.get("name", "Heating Curve")

            # Extract sensors data
            sensors_list = curve.get("sensors", [])
            sensors_data = []
            for sensor in sensors_list:
                if isinstance(sensor, str):
                    sensors_data.append({
                        "location": sensor,
                        "occupation": "-",
                        "setpoint": "-",
                        "temperature": "-"
                    })
                elif isinstance(sensor, dict):
                    sensor_location = sensor.get("location", sensor.get("temperature_register", "Unknown"))
                    sensors_data.append({
                        "location": sensor_location,
                        "occupation": "✓" if sensor.get("occupation_register") or sensor.get("occupancy_schedule_override") else "✗",
                        "setpoint": "✓" if sensor.get("setpoint_register") else "✗",
                        "temperature": "✓" if sensor.get("temperature_register") else "✗"
                    })

            return {
                "id": curve_id,
                "label": curve_name,
                "sensors_count": len(sensors_list),
                "equipment": ", ".join(curve.get("equipment", [])) if curve.get("equipment") else "N/A",
                "sensors": sensors_data
            }

        return None
    
    def process_loop(loop_id, loop_data, parent_id, loop_type):
        """Recursively process a loop and its downstream loops"""
        loop_name = loop_data.get("name", f"{loop_type} Loop")
        
        # Determine embedded heating curve (if any)
        heating_curve_obj = process_loop_heating_curves(loop_id, loop_data)

        nodes.append({
            "id": loop_id,
            "type": loop_type,
            "position": None,
            "properties": {
                "label": loop_name,
                "ahus": len(loop_data.get("ahus", [])),
                "boilers": len(loop_data.get("boilers", [])),
                "downstream_loops": len(loop_data.get("downstream_loops", [])),
                "heating_curves": len(loop_data.get("heating_curves", [])),
                "heating_curve": heating_curve_obj
            }
        })
        
        # Connect to parent
        edges.append({
            "id": f"e-{parent_id}-{loop_id}",
            "source": parent_id,
            "target": loop_id,
            "sourceHandle": "bottom",
            "targetHandle": "top"
        })
        
        # Process downstream loops first (if any)
        downstream_loops = loop_data.get("downstream_loops", [])
        if downstream_loops:
            # Determine child loop type
            if loop_type == "primary-hw":
                child_type = "secondary-hw"
            elif loop_type == "secondary-hw":
                child_type = "tertiary-hw"
            else:
                child_type = "tertiary-hw"  # Keep as tertiary for deeper nesting
            
            for downstream_id in downstream_loops:
                downstream_loop = loop_by_id.get(downstream_id)
                if downstream_loop:
                    process_loop(downstream_id, downstream_loop, loop_id, child_type)
        
        # Heating curve is already attached to the loop node properties by `process_loop`
    
    # Find and process primary loops
    for loop in hot_water_loops:
        if not loop or not loop.get("identifier"):
            continue
        
        is_primary = loop.get("primary", False)
        if is_primary:
            loop_id = loop["identifier"]
            process_loop(loop_id, loop, building_id, "primary-hw")
    
    return {"nodes": nodes, "edges": edges}


@app.post("/api/import/yaml")
async def import_yaml(file: UploadFile = File(...)):
    """
    Import graph from YAML file.
    Replaces current graph with data from YAML.
    """
    try:
        # Read and parse YAML
        content = await file.read()
        yaml_data = yaml.safe_load(content)
        
        # Convert YAML to graph structure
        graph_data = process_yaml_to_graph(yaml_data)
        
        # Save to storage
        save_graph(graph_data)
        
        return {
            "message": "YAML imported successfully",
            "nodes_count": len(graph_data["nodes"]),
            "edges_count": len(graph_data["edges"]),
            "graph": graph_data
        }
    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing YAML: {str(e)}")


@app.post("/api/import/yaml-file")
async def import_yaml_from_file(filepath: str):
    """
    Import graph from YAML file path on server.
    Useful for testing without uploading.
    """
    try:
        yaml_path = Path(filepath)
        if not yaml_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {filepath}")
        
        # Read and parse YAML
        yaml_data = yaml.safe_load(yaml_path.read_text())
        
        # Convert YAML to graph structure
        graph_data = process_yaml_to_graph(yaml_data)
        
        # Save to storage
        save_graph(graph_data)
        
        return {
            "message": f"YAML imported successfully from {filepath}",
            "nodes_count": len(graph_data["nodes"]),
            "edges_count": len(graph_data["edges"]),
            "graph": graph_data
        }
    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing YAML: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
