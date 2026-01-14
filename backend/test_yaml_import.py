#!/usr/bin/env python3
"""
Test script to import YAML and create a graph.
Run this after starting the server with: python main.py
"""

import requests
import json

API_BASE = "http://localhost:8000"

def test_yaml_import():
    """Test importing from the example YAML file"""
    
    # Method 1: Import from file path (server-side)
    print("=" * 60)
    print("Testing YAML import from server file path...")
    print("=" * 60)
    
    response = requests.post(
        f"{API_BASE}/api/import/yaml-file",
        params={"filepath": "example_graph.yaml"}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Success!")
        print(f"  Nodes created: {result['nodes_count']}")
        print(f"  Edges created: {result['edges_count']}")
        print(f"\n{result['message']}\n")
    else:
        print(f"✗ Failed: {response.status_code}")
        print(f"  {response.text}\n")
        return
    
    # Get the graph to verify
    print("=" * 60)
    print("Fetching graph to verify...")
    print("=" * 60)
    
    response = requests.get(f"{API_BASE}/api/graph")
    if response.status_code == 200:
        graph = response.json()
        print(f"\nNodes in graph: {len(graph['nodes'])}")
        for node in graph['nodes']:
            print(f"  - {node['id']} ({node['type']}): {node['properties'].get('label', 'No label')}")
        
        print(f"\nEdges in graph: {len(graph['edges'])}")
        for edge in graph['edges']:
            print(f"  - {edge['source']} → {edge['target']}")
        
        print("\n✓ Graph imported successfully!")
        print("  Refresh your browser to see the graph in the UI.\n")
    else:
        print(f"✗ Failed to fetch graph: {response.status_code}\n")

def test_yaml_upload():
    """Test uploading a YAML file"""
    print("=" * 60)
    print("Testing YAML upload...")
    print("=" * 60)
    
    with open("example_graph.yaml", "rb") as f:
        response = requests.post(
            f"{API_BASE}/api/import/yaml",
            files={"file": ("example_graph.yaml", f, "application/x-yaml")}
        )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Upload successful!")
        print(f"  Nodes: {result['nodes_count']}, Edges: {result['edges_count']}\n")
    else:
        print(f"✗ Upload failed: {response.status_code}")
        print(f"  {response.text}\n")

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("Building Blocks Editor - YAML Import Test")
    print("=" * 60 + "\n")
    
    try:
        # Test if server is running
        response = requests.get(f"{API_BASE}/")
        print(f"✓ Server is running: {response.json()['message']}\n")
        
        # Run the import test
        test_yaml_import()
        
        # Uncomment to test file upload instead
        # test_yaml_upload()
        
    except requests.ConnectionError:
        print("✗ Error: Cannot connect to server.")
        print("  Make sure the server is running: python main.py\n")
    except Exception as e:
        print(f"✗ Error: {e}\n")
