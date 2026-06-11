# Spatial Features Coordinate System & Best Practices

**Created**: 2025-11-13 11:45:11 SGT
**Last Updated**: 2025-11-13 11:45:11 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

This document describes the spatial features system used in AppBase for managing geographic data in quotations and projects. It covers coordinate systems, storage format, transformation requirements, and best practices for implementing spatial feature displays.

**Key Concepts:**
- Geometries stored in **EPSG:3414 (SVY21)** - Singapore's official coordinate system
- Maps displayed in **EPSG:4326 (WGS84)** - Standard web mapping coordinate system
- Supabase `.select()` doesn't support PostGIS transformations - requires RPC functions
- Two patterns: Quotation (generic library) vs Project (parameterized filtering)

## 📚 Related Documentation

- [docs/01-system-architecture/DATABASE_POLICY.md](../01-system-architecture/DATABASE_POLICY.md) - RLS policies for spatial_features table
- [supabase/migrations/20250922_175957_add_spatial_features_coordinate_transformation.sql](../../supabase/migrations/20250922_175957_add_spatial_features_coordinate_transformation.sql) - Quotation spatial features RPC
- [supabase/migrations/20251113_113208_add_spatial_feature_transform_functions.sql](../../supabase/migrations/20251113_113208_add_spatial_feature_transform_functions.sql) - Project spatial features RPC

---

## 🗺️ Coordinate Systems Explained

### EPSG:3414 (SVY21) - Storage Format

**Why SVY21?**
- Official Singapore coordinate system used by Singapore Land Authority
- All Singapore government spatial data (OneMap, LTA, URA) uses SVY21
- Optimized for accuracy within Singapore's geographic bounds
- Used by civil engineering, surveying, and construction industries

**Coordinate Range:**
- X (Easting): ~15,000 to ~45,000 meters
- Y (Northing): ~25,000 to ~50,000 meters
- Example: `POINT(20000 30000)` represents a location in western Singapore

**In Database:**
```sql
-- Geometry column definition
geometry geometry(Geometry, 3414) NOT NULL

-- Sample data
INSERT INTO spatial_features (geometry, feature_type, entity_type)
VALUES (
  ST_GeomFromText('POLYGON((20000 30000, 20100 30000, 20100 30100, 20000 30100, 20000 30000))', 3414),
  'polygon',
  'project'
);
```

### EPSG:4326 (WGS84) - Display Format

**Why WGS84?**
- Standard coordinate system for web maps (Google Maps, Leaflet, MapBox)
- Uses latitude/longitude degrees
- Compatible with GPS devices and web mapping libraries
- Required by React Leaflet and OneMap tiles

**Coordinate Range:**
- Longitude: ~103.6 to ~104.0 (Singapore)
- Latitude: ~1.2 to ~1.5 (Singapore)
- Example: `POINT(103.8198 1.3521)` represents Singapore city center

**Transformation:**
```sql
-- Transform from SVY21 (3414) to WGS84 (4326)
ST_Transform(geometry, 4326)

-- Convert to GeoJSON for web display
ST_AsGeoJSON(ST_Transform(geometry, 4326))::jsonb
```

---

## 🚨 Critical Limitation: Supabase `.select()` Cannot Transform

### The Problem

Supabase's `.select()` query builder **does not support PostGIS functions like `ST_Transform`**:

```typescript
// ❌ THIS DOES NOT WORK
const { data } = await supabase
  .from('spatial_features')
  .select('id, ST_Transform(geometry, 4326) as geometry')  // ERROR!
  .eq('entity_type', 'project');
```

**Error:**
```
column "st_transform" does not exist
```

### The Solution: RPC Functions

You **must** create PostgreSQL functions that perform the transformation:

```sql
CREATE OR REPLACE FUNCTION get_spatial_features_wgs84()
RETURNS TABLE (
  id uuid,
  feature_type varchar(50),
  geometry jsonb,  -- Transformed to WGS84 GeoJSON
  ...
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sf.id,
    sf.feature_type,
    ST_AsGeoJSON(ST_Transform(sf.geometry, 4326))::jsonb as geometry,
    ...
  FROM spatial_features sf;
END;
$$;
```

Then call via `.rpc()`:

```typescript
// ✅ CORRECT
const { data } = await supabase
  .rpc('get_spatial_features_wgs84');
```

---

## 📊 Database Schema

### `spatial_features` Table

```sql
CREATE TABLE spatial_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_type VARCHAR(50) NOT NULL,           -- 'polygon', 'point', 'linestring'
  geometry geometry(Geometry, 3414) NOT NULL,  -- SRID 3414 (SVY21)
  area_hectares NUMERIC,
  area_msq NUMERIC,
  perimeter_m NUMERIC,
  entity_type VARCHAR(20),                     -- 'quotation' or 'project'
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Spatial index for performance
CREATE INDEX idx_spatial_features_geometry ON spatial_features USING GIST(geometry);
```

### `project_spatial_features` Table (Junction)

```sql
CREATE TABLE project_spatial_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_spatial_feature_id UUID REFERENCES spatial_features(id) ON DELETE CASCADE,
  project_part_id UUID REFERENCES project_cdw_parts(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `project_cdw_parts` Table

```sql
CREATE TABLE project_cdw_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  part_number INTEGER NOT NULL,
  part_name VARCHAR(255),
  part_type VARCHAR(100) NOT NULL,  -- CDW work type
  start_date DATE,
  end_date DATE,
  status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

**Part Types:**
- `Cable Detection Works (CDW)`
- `Trial Trench`
- `Excavation`
- `Cable Diversion`
- `Pipe laying`

---

## 🔄 Two Implementation Patterns

### Pattern 1: Quotation Spatial Features (Generic Library)

**Use Case:** Browse all available spatial features for linking to quotations

**Function:**
```sql
-- File: 20250922_175957_add_spatial_features_coordinate_transformation.sql
CREATE OR REPLACE FUNCTION public.get_spatial_features_wgs84()
RETURNS TABLE (...)
LANGUAGE sql
AS $$
  SELECT
    sf.id,
    sf.feature_type,
    ST_AsGeoJSON(ST_Transform(sf.geometry, 4326))::jsonb as geometry,
    sf.area_hectares,
    sf.area_msq,
    sf.perimeter_m,
    sf.created_at,
    sf.created_by
  FROM public.spatial_features sf
  WHERE sf.geometry IS NOT NULL
    AND (sf.is_deleted = FALSE OR sf.is_deleted IS NULL)
  ORDER BY sf.created_at DESC;
$$;
```

**Characteristics:**
- ✅ No parameters - fetches ALL spatial features
- ✅ Simple `LANGUAGE sql` for performance
- ✅ Flat structure - direct column returns
- ✅ Client-side filtering in JavaScript
- ✅ Used by quotation system as feature library

**Usage:**
```typescript
// Fetch all features
const { data: allFeatures } = await supabase.rpc('get_spatial_features_wgs84');

// Filter in JavaScript based on quotation needs
const relevantFeatures = allFeatures?.filter(feature =>
  matchesSearchCriteria(feature)
);
```

**Files:**
- Hook: `src/components/quotation/hooks/useQuotationSpatialFeatures.ts`
- Component: `src/components/quotation/cdw-parts/SpatialFeatureSelector.tsx`
- Service: `src/services/quotationService.ts`

---

### Pattern 2: Project Spatial Features (Parameterized)

**Use Case:** Display project-specific spatial features with part assignments

**Functions (3 specialized):**

#### 1. Get All Project Features
```sql
-- File: 20251113_113208_add_spatial_feature_transform_functions.sql
CREATE OR REPLACE FUNCTION get_project_spatial_features_wgs84()
RETURNS TABLE (
  id uuid,
  feature_type varchar(50),
  geometry jsonb,
  area_hectares numeric,
  area_msq numeric,
  perimeter_m numeric,
  entity_type varchar(20),
  is_deleted boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sf.id,
    sf.feature_type,
    ST_AsGeoJSON(ST_Transform(sf.geometry, 4326))::jsonb as geometry,
    sf.area_hectares,
    sf.area_msq,
    sf.perimeter_m,
    sf.entity_type,
    sf.is_deleted,
    sf.created_at,
    sf.updated_at
  FROM spatial_features sf
  WHERE sf.entity_type = 'project'
    AND sf.is_deleted = false
  ORDER BY sf.feature_type;
END;
$$;
```

#### 2. Get Assigned Features with Part Details
```sql
CREATE OR REPLACE FUNCTION get_assigned_project_spatial_features_wgs84(p_project_id uuid)
RETURNS TABLE (
  id uuid,
  project_spatial_feature_id uuid,
  project_part_id uuid,
  description text,
  created_at timestamptz,
  updated_at timestamptz,
  spatial_feature jsonb,  -- Nested object!
  project_part jsonb      -- Nested object!
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    psf.id,
    psf.project_spatial_feature_id,
    psf.project_part_id,
    psf.description,
    psf.created_at,
    psf.updated_at,
    jsonb_build_object(
      'id', sf.id,
      'feature_type', sf.feature_type,
      'geometry', ST_AsGeoJSON(ST_Transform(sf.geometry, 4326))::jsonb,
      'area_hectares', sf.area_hectares,
      'area_msq', sf.area_msq,
      'perimeter_m', sf.perimeter_m,
      'entity_type', sf.entity_type,
      'is_deleted', sf.is_deleted,
      'created_at', sf.created_at,
      'updated_at', sf.updated_at
    ) as spatial_feature,
    jsonb_build_object(
      'id', pcp.id,
      'part_number', pcp.part_number,
      'part_name', pcp.part_name,
      'part_type', pcp.part_type
    ) as project_part
  FROM project_spatial_features psf
  INNER JOIN spatial_features sf ON psf.project_spatial_feature_id = sf.id
  LEFT JOIN project_cdw_parts pcp ON psf.project_part_id = pcp.id
  WHERE sf.entity_type = 'project'
  ORDER BY psf.created_at;
END;
$$;
```

#### 3. Get Features for Specific Part
```sql
CREATE OR REPLACE FUNCTION get_part_spatial_features_wgs84(p_part_id uuid)
RETURNS TABLE (
  id uuid,
  project_spatial_feature_id uuid,
  project_part_id uuid,
  description text,
  spatial_feature jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    psf.id,
    psf.project_spatial_feature_id,
    psf.project_part_id,
    psf.description,
    jsonb_build_object(
      'id', sf.id,
      'feature_type', sf.feature_type,
      'geometry', ST_AsGeoJSON(ST_Transform(sf.geometry, 4326))::jsonb,
      'area_hectares', sf.area_hectares,
      'area_msq', sf.area_msq,
      'perimeter_m', sf.perimeter_m
    ) as spatial_feature
  FROM project_spatial_features psf
  INNER JOIN spatial_features sf ON psf.project_spatial_feature_id = sf.id
  WHERE psf.project_part_id = p_part_id;
END;
$$;
```

**Characteristics:**
- ✅ Parameterized - takes `p_project_id` or `p_part_id`
- ✅ `LANGUAGE plpgsql` for complex logic
- ✅ Nested JSONB structures using `jsonb_build_object()`
- ✅ Database-side filtering for performance
- ✅ Includes JOINs for related data

**Usage:**
```typescript
// Hook: useProjectCDW.ts
export const useProjectSpatialFeatures = () => {
  return useQuery({
    queryKey: ['spatial-features-project'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_project_spatial_features_wgs84');

      if (error) throw error;
      return data as SpatialFeature[];
    },
  });
};

export const useAssignedProjectSpatialFeatures = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['assigned-project-spatial-features', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .rpc('get_assigned_project_spatial_features_wgs84', {
          p_project_id: projectId
        });

      if (error) throw error;

      // Transform flat structure to nested (for component compatibility)
      return (data || []).map((item: any) => ({
        id: item.id,
        project_spatial_feature_id: item.project_spatial_feature_id,
        project_part_id: item.project_part_id,
        description: item.description,
        created_at: item.created_at,
        updated_at: item.updated_at,
        spatial_features: item.spatial_feature,
        project_cdw_parts: item.project_part,
      }));
    },
    enabled: !!projectId,
  });
};
```

**Files:**
- Hook: `src/hooks/useProjectCDW.ts`
- Component: `src/components/project-management/cdw-parts/ProjectSpatialFeatureSelector.tsx`
- Page: `src/pages/ProjectDetailPage.tsx`

---

## 🎨 Map Display Best Practices

### React Leaflet Integration

```tsx
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Render spatial features
const renderFeatureOnMap = (feature: SpatialFeature) => {
  let geometry = feature.geometry;

  // Parse if string
  if (typeof geometry === 'string') {
    try {
      geometry = JSON.parse(geometry);
    } catch (e) {
      console.error('Failed to parse geometry:', e);
      return null;
    }
  }

  const geoJsonFeature = {
    type: 'Feature' as const,
    properties: {
      id: feature.id,
      name: feature.feature_type,
    },
    geometry: geometry
  };

  return (
    <GeoJSON
      key={feature.id}
      data={geoJsonFeature}
      style={{
        color: '#3b82f6',
        weight: 2,
        fillOpacity: 0.2,
      }}
    />
  );
};

// Map component
<MapContainer
  center={[1.3521, 103.8198]}  // Singapore center (WGS84)
  zoom={11}
  scrollWheelZoom={true}
>
  <TileLayer
    url="https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png"
    attribution='<a href="https://www.onemap.gov.sg/">OneMap</a>'
    maxZoom={19}
    minZoom={8}
  />
  {features.map(renderFeatureOnMap)}
</MapContainer>
```

### OneMap Basemaps

```typescript
// src/services/oneMapService.ts
public baseMaps: Record<string, BaseMapConfig> = {
  default: {
    name: 'Default',
    url: 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png',
    attribution: '...',
  },
  landlot: {
    name: 'Landlot',
    url: 'https://www.onemap.gov.sg/maps/tiles/LandLot/{z}/{x}/{y}.png',
    attribution: '...',
  },
  grey: {
    name: 'Grey',
    url: 'https://www.onemap.gov.sg/maps/tiles/Grey/{z}/{x}/{y}.png',
    attribution: '...',
  },
};
```

---

## ⚙️ Implementation Checklist

When implementing spatial features in a new module:

### 1. Database Setup

- [ ] Create junction table (e.g., `module_spatial_features`)
- [ ] Add foreign keys to `spatial_features` table
- [ ] Add `entity_type` value for filtering (e.g., 'project', 'quotation')
- [ ] Enable RLS policies (minimal pattern: `USING (true) WITH CHECK (true)`)

### 2. Create RPC Function(s)

- [ ] Decide: Generic library (Pattern 1) or Parameterized (Pattern 2)?
- [ ] Create function with `ST_Transform(geometry, 4326)`
- [ ] Return geometry as `::jsonb` for web consumption
- [ ] Match return types to actual database column types (`varchar` vs `text`)
- [ ] Grant `EXECUTE` permission to `authenticated` role
- [ ] Add function comments for documentation

### 3. TypeScript Hooks

- [ ] Create `useModuleSpatialFeatures()` hook
- [ ] Use `supabase.rpc()` not `.select()`
- [ ] Handle nested JSONB if using Pattern 2
- [ ] Add mutation hooks for assign/unassign operations
- [ ] Implement query invalidation for cache updates

### 4. Map Component

- [ ] Import React Leaflet components
- [ ] Fix default marker icons
- [ ] Parse geometry (handle string/object cases)
- [ ] Render with `<GeoJSON>` component
- [ ] Add OneMap basemap tiles
- [ ] Implement zoom controls and feature highlighting
- [ ] Add location search via OneMap API

### 5. Testing

- [ ] Verify coordinates display correctly (103.x, 1.x range for Singapore)
- [ ] Test map tiles load (not grey screen)
- [ ] Test feature selection and highlighting
- [ ] Test assign/unassign mutations
- [ ] Check console for coordinate sample logs
- [ ] Verify part filtering works correctly

---

## 🐛 Common Issues & Solutions

### Issue 1: Grey Map (No Tiles)

**Symptoms:**
- Map displays completely grey
- No roads or streets visible
- Features not rendering

**Causes:**
1. Coordinates still in SVY21 (20000, 30000) instead of WGS84 (103.8, 1.3)
2. Missing `ST_Transform()` in RPC function
3. Using `.select()` instead of `.rpc()`

**Solution:**
```sql
-- Check actual coordinate values
SELECT
  id,
  ST_AsText(geometry) as original,
  ST_AsText(ST_Transform(geometry, 4326)) as transformed
FROM spatial_features
LIMIT 1;

-- Should show transformation like:
-- original: POLYGON((20000 30000, ...))
-- transformed: POLYGON((103.761 1.287, ...))
```

### Issue 2: Column Type Mismatch

**Symptoms:**
```
ERROR: structure of query does not match function result type
DETAIL: Returned type character varying(50) does not match expected type text
```

**Cause:**
Return type in function doesn't match actual column type in table.

**Solution:**
```sql
-- Check actual column types
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'spatial_features';

-- Update function to match:
CREATE OR REPLACE FUNCTION get_spatial_features_wgs84()
RETURNS TABLE (
  feature_type varchar(50),  -- NOT 'text' if column is varchar(50)
  entity_type varchar(20),   -- NOT 'text' if column is varchar(20)
  ...
)
```

### Issue 3: Features Not Appearing After Assignment

**Symptoms:**
- Assignment succeeds but feature doesn't show on map
- No error messages

**Cause:**
Query cache not invalidated after mutation.

**Solution:**
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['spatial-features-project'] });
  queryClient.invalidateQueries({ queryKey: ['assigned-project-spatial-features'] });
  queryClient.invalidateQueries({ queryKey: ['part-spatial-features'] });
  showSuccess('Feature assigned successfully');
}
```

---

## 📊 Performance Considerations

### Spatial Indexes

Always create GIST indexes on geometry columns:

```sql
CREATE INDEX idx_spatial_features_geometry
  ON spatial_features
  USING GIST(geometry);
```

### Query Optimization

**Pattern 1 (Quotation):** Acceptable to fetch all features since it's a browsable library
**Pattern 2 (Project):** Always filter by entity_type and use parameters

```sql
-- ❌ BAD: Fetches everything
SELECT * FROM spatial_features;

-- ✅ GOOD: Filters early
SELECT * FROM spatial_features
WHERE entity_type = 'project'
  AND is_deleted = false;
```

### Caching Strategy

```typescript
// Longer cache for reference data
staleTime: 5 * 60 * 1000,  // 5 minutes for generic library

// Shorter cache for project-specific data
staleTime: 1 * 60 * 1000,  // 1 minute for assignments
```

---

## 🔐 Security Notes

### RLS Policies

Spatial features use minimal RLS pattern:

```sql
ALTER TABLE spatial_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can CRUD spatial_features"
  ON spatial_features FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

**Why:** Access control is managed at APPLICATION level via module system, not database level.

### RPC Function Security

All functions use `SECURITY DEFINER`:

```sql
CREATE OR REPLACE FUNCTION get_spatial_features_wgs84()
...
SECURITY DEFINER  -- Executes with definer's permissions
AS $$
```

Grant only to authenticated users:

```sql
GRANT EXECUTE ON FUNCTION get_spatial_features_wgs84() TO authenticated;
```

---

## 📝 Example: Adding Spatial Features to New Module

```typescript
// 1. Create hook
export const useModuleSpatialFeatures = () => {
  return useQuery({
    queryKey: ['module-spatial-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_module_spatial_features_wgs84');

      if (error) throw error;
      return data;
    },
  });
};

// 2. Create component
const ModuleSpatialMap = () => {
  const { data: features = [] } = useModuleSpatialFeatures();

  return (
    <MapContainer center={[1.3521, 103.8198]} zoom={11}>
      <TileLayer url="https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png" />
      {features.map(feature => (
        <GeoJSON key={feature.id} data={{
          type: 'Feature',
          geometry: feature.geometry,
          properties: { id: feature.id }
        }} />
      ))}
    </MapContainer>
  );
};
```

---

## 🚀 Future Enhancements

1. **View-based approach:** Create materialized views with pre-transformed geometries
2. **Client-side transformation:** Use `proj4js` to transform in browser (reduces RPC calls)
3. **Geometry simplification:** Add `ST_Simplify()` for large polygons to improve performance
4. **Real-time updates:** Use Supabase Realtime for collaborative editing

---

## 📖 References

- **PostGIS Documentation:** https://postgis.net/docs/
- **EPSG:3414 (SVY21):** https://epsg.io/3414
- **EPSG:4326 (WGS84):** https://epsg.io/4326
- **OneMap API:** https://www.onemap.gov.sg/docs/
- **React Leaflet:** https://react-leaflet.js.org/
- **Supabase PostGIS:** https://supabase.com/docs/guides/database/extensions/postgis
