# Testing the Real Building YAML

The backend has been updated to parse the actual building YAML structure with:

## YAML Structure Understood:
```yaml
building:
  name: <building_name>
  hot_water_loops:
    - identifier: <uuid>
      name: <loop_name>
      primary: true/false
      downstream_loops: [<uuid>, ...]  # Only for primary loops
      heating_curves: [<uuid>, ...]    # Only for secondary loops
      ahus: [<uuid>, ...]
      boilers: [...]
  heating_curves:
    - identifier: <uuid>
      name: <curve_name>
      sensors:
        - location: <location_string>
          occupation_register: <uuid>
          setpoint_register: <uuid>
          temperature_register: <uuid>
```

## Graph Hierarchy Created:
1. **Building** (root node)
2. **Primary HW Loops** - Connected to building
   - Loops with `primary: true`
3. **Secondary HW Loops** - Connected to their parent primary loop
   - Loops referenced in `downstream_loops` of primary
   - Loops with `primary: false`
4. **Tertiary HW (Heating Curves)** - Connected to secondary loops
   - Referenced in `heating_curves` array of secondary loops
5. **Sensors** - Connected to heating curves
   - Extracted from `sensors` array in each heating curve

## How to Test:

1. **Start the servers** (if not running):
   ```bash
   # Backend (already running on port 8000)
   # Frontend should be on port 5174
   ```

2. **Upload the real YAML**:
   - In the browser at `http://localhost:5174`
   - Click "Choose YAML"
   - Select `/home/nitant/mpl_canvas_editor/example_yaml_building.yaml`
   - Click "Upload"
   - Click "Draw Graph" to apply auto-layout

3. **Expected Result**:
   - 1 Building node at the top
   - Primary HW loops below it
   - Secondary HW loops branching from each primary
   - Heating curves (Tertiary) below secondaries
   - Sensors at the bottom connected to each heating curve

## Notes:
- Comments in YAML (lines starting with `#`) are automatically ignored
- Nodes without `identifier` are skipped
- Only sensors with valid data are created
- Auto-layout arranges everything in a tree structure
- All positions are calculated by the frontend
