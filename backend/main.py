from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict

import yaml
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Building Blocks Editor API")

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_FILE = Path(__file__).parent / "graph_data.json"


class GraphStore(TypedDict):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]


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


def ensure_storage_file() -> None:
    if STORAGE_FILE.exists():
        return

    STORAGE_FILE.write_text(json.dumps({"nodes": [], "edges": []}, indent=2))


def load_graph() -> GraphStore:
    return json.loads(STORAGE_FILE.read_text())


def save_graph(data: GraphStore) -> None:
    STORAGE_FILE.write_text(json.dumps(data, indent=2))


def find_node(data: GraphStore, node_id: str) -> Optional[Dict[str, Any]]:
    return next((node for node in data["nodes"] if node["id"] == node_id), None)


def find_node_index(data: GraphStore, node_id: str) -> Optional[int]:
    return next(
        (index for index, node in enumerate(data["nodes"]) if node["id"] == node_id),
        None,
    )


def find_edge_index(data: GraphStore, edge_id: str) -> Optional[int]:
    return next(
        (index for index, edge in enumerate(data["edges"]) if edge["id"] == edge_id),
        None,
    )


def require_node(data: GraphStore, node_id: str) -> Dict[str, Any]:
    node = find_node(data, node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


def require_edge_index(data: GraphStore, edge_id: str) -> int:
    edge_index = find_edge_index(data, edge_id)
    if edge_index is None:
        raise HTTPException(status_code=404, detail="Edge not found")
    return edge_index


def build_adjacency(edges: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    children: Dict[str, List[str]] = {}
    for edge in edges:
        parent_id = edge["source"]
        child_id = edge["target"]
        children.setdefault(parent_id, []).append(child_id)
    return children


def build_tree_node(
    node_id: str,
    nodes_by_id: Dict[str, Dict[str, Any]],
    adjacency: Dict[str, List[str]],
) -> Optional[Dict[str, Any]]:
    node = nodes_by_id.get(node_id)
    if not node:
        return None

    return {
        "id": node["id"],
        "type": node["type"],
        "properties": node.get("properties", {}),
        "children": [
            build_tree_node(child_id, nodes_by_id, adjacency)
            for child_id in adjacency.get(node_id, [])
        ],
    }


def build_building_node(building: Dict[str, Any]) -> Dict[str, Any]:
    building_name = building.get("name", "Building")
    building_properties = {"label": building_name, **building}
    building_properties.setdefault("name", building_name)

    return {
        "id": "building-1",
        "type": "building",
        "position": None,
        "properties": building_properties,
    }


def build_loop_lookup(
    loops: List[Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    return {
        loop["identifier"]: loop
        for loop in loops
        if loop and loop.get("identifier")
    }


def build_curve_lookup(
    curves: List[Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    return {
        curve["identifier"]: curve
        for curve in curves
        if curve and curve.get("identifier")
    }


def normalize_sensor(sensor: Any) -> Dict[str, str]:
    if isinstance(sensor, str):
        return {
            "location": sensor,
            "occupation": "-",
            "setpoint": "-",
            "temperature": "-",
        }

    if isinstance(sensor, dict):
        sensor_location = sensor.get("location", sensor.get("temperature_register", "Unknown"))
        return {
            "location": sensor_location,
            "occupation": "✓"
            if sensor.get("occupation_register") or sensor.get("occupancy_schedule_override")
            else "✗",
            "setpoint": "✓" if sensor.get("setpoint_register") else "✗",
            "temperature": "✓" if sensor.get("temperature_register") else "✗",
        }

    return {
        "location": "Unknown",
        "occupation": "-",
        "setpoint": "-",
        "temperature": "-",
    }


def build_heating_curve(
    loop_data: Dict[str, Any],
    curves_by_id: Dict[str, Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    for curve_id in loop_data.get("heating_curves", []):
        curve = curves_by_id.get(curve_id)
        if not curve:
            continue

        sensors_list = curve.get("sensors", [])
        sensors = [normalize_sensor(sensor) for sensor in sensors_list]

        return {
            "id": curve_id,
            "label": curve.get("name", "Heating Curve"),
            "sensors_count": len(sensors_list),
            "equipment": ", ".join(curve.get("equipment", [])) if curve.get("equipment") else "N/A",
            "sensors": sensors,
        }

    return None


def append_loop_node(
    nodes: List[Dict[str, Any]],
    loop_id: str,
    loop_type: str,
    loop_data: Dict[str, Any],
    heating_curve: Optional[Dict[str, Any]],
) -> None:
    loop_name = loop_data.get("name", f"{loop_type} Loop")

    nodes.append(
        {
            "id": loop_id,
            "type": loop_type,
            "position": None,
            "properties": {"label": loop_name, **loop_data, "heating_curve": heating_curve},
        }
    )


def append_edge(
    edges: List[Dict[str, Any]],
    parent_id: str,
    child_id: str,
) -> None:
    edges.append(
        {
            "id": f"e-{parent_id}-{child_id}",
            "source": parent_id,
            "target": child_id,
            "sourceHandle": "bottom",
            "targetHandle": "top",
        }
    )


def next_loop_type(current_type: str) -> str:
    if current_type == "primary-hw":
        return "secondary-hw"
    if current_type == "secondary-hw":
        return "tertiary-hw"
    return "tertiary-hw"


def process_loop_tree(
    loop_id: str,
    loop_data: Dict[str, Any],
    parent_id: str,
    loop_type: str,
    loops_by_id: Dict[str, Dict[str, Any]],
    curves_by_id: Dict[str, Dict[str, Any]],
    nodes: List[Dict[str, Any]],
    edges: List[Dict[str, Any]],
) -> None:
    heating_curve = build_heating_curve(loop_data, curves_by_id)
    append_loop_node(nodes, loop_id, loop_type, loop_data, heating_curve)
    append_edge(edges, parent_id, loop_id)

    child_type = next_loop_type(loop_type)
    for downstream_id in loop_data.get("downstream_loops", []):
        downstream_loop = loops_by_id.get(downstream_id)
        if not downstream_loop:
            continue
        process_loop_tree(
            downstream_id,
            downstream_loop,
            loop_id,
            child_type,
            loops_by_id,
            curves_by_id,
            nodes,
            edges,
        )


# API Endpoints
ensure_storage_file()


@app.get("/")
async def root() -> Dict[str, str]:
    return {"message": "Building Blocks Editor API", "version": "1.0.0"}


@app.get("/api/graph", response_model=GraphData)
async def get_graph() -> GraphStore:
    return load_graph()


@app.post("/api/graph")
async def update_graph(graph: GraphData) -> Dict[str, str]:
    save_graph(graph.model_dump())
    return {"message": "Graph updated successfully"}


@app.get("/api/nodes")
async def get_nodes() -> Dict[str, List[Dict[str, Any]]]:
    data = load_graph()
    return {"nodes": data["nodes"]}


@app.post("/api/nodes")
async def create_node(node: NodeCreate) -> Dict[str, Any]:
    data = load_graph()

    if find_node(data, node.id):
        raise HTTPException(status_code=400, detail="Node ID already exists")

    node_data = node.model_dump()
    data["nodes"].append(node_data)
    save_graph(data)

    return {"message": "Node created", "node": node_data}


@app.get("/api/nodes/{node_id}")
async def get_node(node_id: str) -> Dict[str, Any]:
    data = load_graph()
    return require_node(data, node_id)


@app.put("/api/nodes/{node_id}")
async def update_node(node_id: str, update: NodeUpdate) -> Dict[str, Any]:
    data = load_graph()
    node = require_node(data, node_id)

    update_data = update.model_dump(exclude_unset=True)
    if "type" in update_data:
        node["type"] = update_data["type"]
    if "position" in update_data and update_data["position"]:
        node["position"] = update_data["position"]
    if "properties" in update_data and update_data["properties"]:
        node["properties"].update(update_data["properties"])

    save_graph(data)
    return {"message": "Node updated", "node": node}


@app.delete("/api/nodes/{node_id}")
async def delete_node(node_id: str) -> Dict[str, str]:
    data = load_graph()

    node_index = find_node_index(data, node_id)
    if node_index is None:
        raise HTTPException(status_code=404, detail="Node not found")

    data["nodes"].pop(node_index)
    data["edges"] = [
        edge
        for edge in data["edges"]
        if edge["source"] != node_id and edge["target"] != node_id
    ]

    save_graph(data)
    return {"message": "Node deleted", "id": node_id}


@app.get("/api/edges")
async def get_edges() -> Dict[str, List[Dict[str, Any]]]:
    data = load_graph()
    return {"edges": data["edges"]}


@app.post("/api/edges")
async def create_edge(edge: EdgeCreate) -> Dict[str, Any]:
    data = load_graph()

    node_ids = {node["id"] for node in data["nodes"]}
    if edge.source not in node_ids:
        raise HTTPException(status_code=404, detail=f"Source node {edge.source} not found")
    if edge.target not in node_ids:
        raise HTTPException(status_code=404, detail=f"Target node {edge.target} not found")

    if find_edge_index(data, edge.id) is not None:
        raise HTTPException(status_code=400, detail="Edge ID already exists")

    edge_data = edge.model_dump()
    data["edges"].append(edge_data)
    save_graph(data)

    return {"message": "Edge created", "edge": edge_data}


@app.delete("/api/edges/{edge_id}")
async def delete_edge(edge_id: str) -> Dict[str, str]:
    data = load_graph()

    edge_index = require_edge_index(data, edge_id)
    data["edges"].pop(edge_index)
    save_graph(data)

    return {"message": "Edge deleted", "id": edge_id}


@app.get("/api/tree")
async def get_tree_structure() -> Dict[str, Any]:
    data = load_graph()

    adjacency = build_adjacency(data["edges"])
    all_targets = {edge["target"] for edge in data["edges"]}
    roots = [node["id"] for node in data["nodes"] if node["id"] not in all_targets]
    nodes_by_id = {node["id"]: node for node in data["nodes"]}

    tree = [
        build_tree_node(root_id, nodes_by_id, adjacency)
        for root_id in roots
        if root_id
    ]

    return {"tree": tree, "roots": roots}


def process_yaml_to_graph(yaml_data: Dict[str, Any]) -> GraphStore:
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
    if "building" not in yaml_data:
        raise ValueError("YAML must contain 'building' key")

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

    building = yaml_data["building"]
    building_node = build_building_node(building)
    nodes.append(building_node)

    hot_water_loops = building.get("hot_water_loops", [])
    heating_curves = building.get("heating_curves", [])

    loops_by_id = build_loop_lookup(hot_water_loops)
    curves_by_id = build_curve_lookup(heating_curves)

    for loop in hot_water_loops:
        if not loop or not loop.get("identifier"):
            continue

        if not loop.get("primary", False):
            continue

        loop_id = loop["identifier"]
        process_loop_tree(
            loop_id,
            loop,
            building_node["id"],
            "primary-hw",
            loops_by_id,
            curves_by_id,
            nodes,
            edges,
        )

    return {"nodes": nodes, "edges": edges}


@app.post("/api/import/yaml")
async def import_yaml(file: UploadFile = File(...)) -> Dict[str, Any]:
    try:
        content = await file.read()
        yaml_data = yaml.safe_load(content)

        graph_data = process_yaml_to_graph(yaml_data)
        save_graph(graph_data)

        return {
            "message": "YAML imported successfully",
            "nodes_count": len(graph_data["nodes"]),
            "edges_count": len(graph_data["edges"]),
            "graph": graph_data,
        }
    except yaml.YAMLError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error processing YAML: {exc}")


@app.post("/api/import/yaml-file")
async def import_yaml_from_file(filepath: str) -> Dict[str, Any]:
    try:
        yaml_path = Path(filepath)
        if not yaml_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {filepath}")

        yaml_data = yaml.safe_load(yaml_path.read_text())

        graph_data = process_yaml_to_graph(yaml_data)
        save_graph(graph_data)

        return {
            "message": f"YAML imported successfully from {filepath}",
            "nodes_count": len(graph_data["nodes"]),
            "edges_count": len(graph_data["edges"]),
            "graph": graph_data,
        }
    except yaml.YAMLError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error processing YAML: {exc}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
