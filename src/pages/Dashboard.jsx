import { useEffect, useState, useMemo, useRef } from 'react'
import {
  FiUsers, FiMap, FiCheckSquare, FiCalendar,
  FiUserCheck, FiMapPin, FiNavigation
} from 'react-icons/fi'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'

const INDIA_GEOJSON_URL =
  'https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson'

const AREA_COLORS = {
  STATE: '#1e40af',
  DISTRICT: '#2563eb',
  TEHSIL: '#3b82f6',
  BLOCK: '#60a5fa',
  VILLAGE: '#16a34a',
  WARD: '#6366f1',
  BOOTH: '#dc2626',
}

const STATE_CENTERS = {
  'Andhra Pradesh': [15.9129, 79.74],
  'Arunachal Pradesh': [28.218, 94.7278],
  'Assam': [26.2006, 92.9376],
  'Bihar': [25.0961, 85.3131],
  'Chhattisgarh': [21.2787, 81.8661],
  'Goa': [15.2993, 74.124],
  'Gujarat': [22.2587, 71.1924],
  'Haryana': [29.0588, 76.0856],
  'Himachal Pradesh': [31.1048, 77.1734],
  'Jharkhand': [23.6102, 85.2799],
  'Karnataka': [15.3173, 75.7139],
  'Kerala': [10.8505, 76.2711],
  'Madhya Pradesh': [22.9734, 78.6569],
  'Maharashtra': [19.7515, 75.7139],
  'Manipur': [24.6637, 93.9063],
  'Meghalaya': [25.467, 91.3662],
  'Mizoram': [23.1645, 92.9376],
  'Nagaland': [26.1584, 94.5624],
  'Odisha': [20.9517, 85.0985],
  'Punjab': [31.1471, 75.3412],
  'Rajasthan': [27.0238, 74.2179],
  'Sikkim': [27.533, 88.5122],
  'Tamil Nadu': [11.1271, 78.6569],
  'Telangana': [18.1124, 79.0193],
  'Tripura': [23.9408, 91.9882],
  'Uttar Pradesh': [26.8467, 80.9462],
  'Uttarakhand': [30.0668, 79.0193],
  'West Bengal': [22.9868, 87.855],
  'Delhi': [28.7041, 77.1025],
  'Jammu and Kashmir': [33.7782, 76.5762],
  'Ladakh': [34.1526, 77.577],
  'Puducherry': [11.9416, 79.8083],
  'Chandigarh': [30.7333, 76.7794],
}

function createMarkerIcon(type) {
  const color = AREA_COLORS[type] || '#6b7280'
  const sizes = { STATE: 20, DISTRICT: 16, TEHSIL: 14, BLOCK: 13, WARD: 11, VILLAGE: 11, BOOTH: 10 }
  const size = sizes[type] || 10

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:${size * 2}px; height:${size * 2}px;
      background:${color}; border:3px solid #fff;
      border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,.35);
    "></div>`,
    iconSize: [size * 2, size * 2],
    iconAnchor: [size, size],
    popupAnchor: [0, -size],
  })
}

function buildMaskGeoJson(stateGeoJson) {
  const worldRing = [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]
  const feature = stateGeoJson.features[0]
  const geom = feature.geometry
  const holes = []

  if (geom.type === 'Polygon') {
    geom.coordinates.forEach(ring => holes.push(ring))
  } else if (geom.type === 'MultiPolygon') {
    geom.coordinates.forEach(polygon => polygon.forEach(ring => holes.push(ring)))
  }

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [worldRing, ...holes] },
    }],
  }
}

function FitToState({ geoJson }) {
  const map = useMap()
  useEffect(() => {
    if (!geoJson) return
    const layer = L.geoJSON(geoJson)
    const bounds = layer.getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] })
      map.setMaxBounds(bounds.pad(0.3))
      map.setMinZoom(map.getZoom() - 1)
    }
  }, [geoJson, map])
  return null
}

function FitToMarkers({ areas, hasStateGeo }) {
  const map = useMap()
  useEffect(() => {
    if (hasStateGeo) return
    const valid = areas.filter(a => a.coordinates?.latitude && a.coordinates?.longitude)
    if (valid.length === 0) return
    const bounds = L.latLngBounds(valid.map(a => [a.coordinates.latitude, a.coordinates.longitude]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [areas, hasStateGeo, map])
  return null
}

export default function Dashboard() {
  const { role } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [areas, setAreas] = useState([])
  const [electionConfig, setElectionConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsRes, areasRes, configRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/area-map-stats'),
        api.get('/election-config'),
      ])
      if (statsRes.data.success) setStats(statsRes.data.data)
      if (areasRes.data.success) setAreas(areasRes.data.data || [])
      if (configRes.data.success) setElectionConfig(configRes.data.data)
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const isAdmin = role === 'SUPER_ADMIN' || role === 'STATE_ADMIN' || role === 'DISTRICT_ADMIN'

  return (
    <div className="space-y-6">
      <ConstituencyHeader config={electionConfig} isAdmin={isAdmin} />
      {isAdmin
        ? <AdminDashboard stats={stats} areas={areas} electionConfig={electionConfig} />
        : <WorkerDashboard />
      }
    </div>
  )
}

function ConstituencyHeader({ config, isAdmin }) {
  if (!config) {
    return (
      <div className="card bg-gradient-to-r from-primary-600 to-primary-800 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
            <FiMapPin className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Election CRM Dashboard</h1>
            <p className="text-primary-100 mt-1">
              {isAdmin
                ? 'Go to Settings → Election Configuration to set up your constituency.'
                : 'Welcome to the campaign management system.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-gradient-to-r from-primary-600 to-primary-800 text-white border-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
            <FiMapPin className="w-7 h-7" />
          </div>
          <div>
            <p className="text-primary-200 text-sm font-medium uppercase tracking-wider">
              {config.constituencyType?.replace('_', ' ')} Constituency
            </p>
            <h1 className="text-2xl font-bold">{config.constituencyName}</h1>
            <p className="text-primary-100 text-sm mt-0.5">
              {config.district}, {config.state}
              {config.constituencyNumber ? ` • #${config.constituencyNumber}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 md:gap-6">
          {config.candidateName && (
            <div className="text-right">
              <p className="text-primary-200 text-xs uppercase">Candidate</p>
              <p className="font-semibold">{config.candidateName}</p>
            </div>
          )}
          {config.partyName && (
            <div className="text-right">
              <p className="text-primary-200 text-xs uppercase">Party</p>
              <p className="font-semibold">{config.partyName}</p>
            </div>
          )}
          {config.electionDate && (
            <div className="text-right">
              <p className="text-primary-200 text-xs uppercase">Election Date</p>
              <p className="font-semibold">
                {new Date(config.electionDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AdminDashboard({ stats, areas, electionConfig }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUsers} title="Total Voters" value={stats?.totalVoters || 0} color="blue" />
        <StatCard icon={FiMap} title="Areas" value={stats?.totalAreas || 0} color="green" />
        <StatCard icon={FiUserCheck} title="Active Workers" value={stats?.activeWorkers || 0} color="purple" />
        <StatCard icon={FiCheckSquare} title="Tasks Completed" value={stats?.completedTasks || 0} color="orange" />
      </div>

      <ConstituencyMap areas={areas} electionConfig={electionConfig} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Task Completion Rate</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 transition-all" style={{ width: `${stats?.taskCompletionRate || 0}%` }} />
              </div>
            </div>
            <span className="text-2xl font-bold text-primary-600">{stats?.taskCompletionRate || 0}%</span>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Voter Consent Status</h3>
          <div className="space-y-3">
            {stats?.votersByConsent?.length > 0 ? (
              stats.votersByConsent.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <span className="text-gray-600">{item._id || 'Unknown'}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No voter data yet</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function ConstituencyMap({ areas, electionConfig }) {
  const [stateGeoJson, setStateGeoJson] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const geoRef = useRef(null)

  useEffect(() => {
    const stateName = electionConfig?.state
    if (!stateName) return

    setGeoLoading(true)
    fetch(INDIA_GEOJSON_URL)
      .then(res => res.json())
      .then(data => {
        const normalise = s => s?.toLowerCase().replace(/\s+/g, ' ').trim()
        const target = normalise(stateName)

        const feature = data.features.find(f => {
          const props = f.properties || {}
          return (
            normalise(props.ST_NM) === target ||
            normalise(props.NAME_1) === target ||
            normalise(props.name) === target ||
            normalise(props.state) === target
          )
        })

        if (feature) {
          setStateGeoJson({ type: 'FeatureCollection', features: [feature] })
        }
      })
      .catch(err => console.error('Failed to load state boundary:', err))
      .finally(() => setGeoLoading(false))
  }, [electionConfig?.state])

  const mapCenter = useMemo(() => {
    if (electionConfig?.state && STATE_CENTERS[electionConfig.state]) {
      return STATE_CENTERS[electionConfig.state]
    }
    return [22.9734, 78.6569]
  }, [electionConfig])

  const areasWithCoords = areas.filter(a => a.coordinates?.latitude && a.coordinates?.longitude)
  const areasWithoutCoords = areas.filter(a => !a.coordinates?.latitude || !a.coordinates?.longitude)

  const groupedByType = {}
  areas.forEach(area => {
    if (!groupedByType[area.type]) groupedByType[area.type] = []
    groupedByType[area.type].push(area)
  })
  const typeOrder = ['STATE', 'DISTRICT', 'TEHSIL', 'BLOCK', 'WARD', 'VILLAGE', 'BOOTH']
  const sortedTypes = typeOrder.filter(t => groupedByType[t])

  const maskGeoJson = useMemo(() => {
    if (!stateGeoJson) return null
    return buildMaskGeoJson(stateGeoJson)
  }, [stateGeoJson])

  const maskStyle = { color: 'transparent', fillColor: '#ffffff', fillOpacity: 1, weight: 0 }

  const stateStyle = {
    color: '#1e40af',
    weight: 2.5,
    fillColor: '#3b82f6',
    fillOpacity: 0.08,
    dashArray: '',
  }

  const stateHoverStyle = {
    weight: 3,
    fillOpacity: 0.18,
    fillColor: '#2563eb',
  }

  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: (e) => e.target.setStyle(stateHoverStyle),
      mouseout: (e) => e.target.setStyle(stateStyle),
    })

    const name = feature.properties?.ST_NM || feature.properties?.NAME_1 || feature.properties?.name || ''
    if (name) {
      layer.bindTooltip(name, { permanent: false, direction: 'center', className: 'state-tooltip' })
    }
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {electionConfig?.state || 'Constituency'} Map
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">
            {stateGeoJson
              ? `Showing ${electionConfig?.state} boundary`
              : geoLoading ? 'Loading map boundary...' : 'Set state in Election Config to see boundary'}
            {areasWithCoords.length > 0 && ` • ${areasWithCoords.length} area markers`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {stateGeoJson && (
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-4 h-2.5 rounded-sm inline-block border-2 border-blue-700" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }} />
              State Boundary
            </span>
          )}
          {sortedTypes.map(type => (
            <span key={type} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-3 h-3 rounded-full inline-block border-2 border-white shadow-sm"
                style={{ backgroundColor: AREA_COLORS[type] }}
              />
              {type} ({groupedByType[type].length})
            </span>
          ))}
        </div>
      </div>

      <div className="h-[500px] w-full relative z-0" style={{ backgroundColor: '#fff' }}>
        <MapContainer
          center={mapCenter}
          zoom={stateGeoJson ? 7 : 6}
          style={{ height: '100%', width: '100%', background: '#fff' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {maskGeoJson && (
            <GeoJSON key={`mask-${electionConfig?.state}`} data={maskGeoJson} style={() => maskStyle} />
          )}

          {stateGeoJson && (
            <>
              <FitToState geoJson={stateGeoJson} />
              <GeoJSON
                key={`state-${electionConfig?.state}`}
                data={stateGeoJson}
                style={stateStyle}
                onEachFeature={onEachFeature}
                ref={geoRef}
              />
            </>
          )}

          {!stateGeoJson && areasWithCoords.length > 0 && (
            <FitToMarkers areas={areasWithCoords} hasStateGeo={false} />
          )}

          {areasWithCoords.map(area => (
            <Marker
              key={area._id}
              position={[area.coordinates.latitude, area.coordinates.longitude]}
              icon={createMarkerIcon(area.type)}
            >
              <Popup>
                <div className="min-w-[200px] p-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: AREA_COLORS[area.type] }} />
                    <span className="font-bold text-gray-800">{area.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{area.type}{area.code ? ` • ${area.code}` : ''}</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Voters:</span><span className="font-semibold">{area.voterCount || 0}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Registered:</span><span className="font-semibold">{area.registeredVoters || 0}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Male / Female:</span><span className="font-semibold">{area.maleVoters || 0} / {area.femaleVoters || 0}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Workers:</span><span className="font-semibold">{area.workerCount || 0}</span></div>
                    {area.assignedManager && (
                      <div className="flex justify-between border-t pt-1 mt-1"><span className="text-gray-500">Manager:</span><span className="font-semibold">{area.assignedManager.name}</span></div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {areasWithoutCoords.length > 0 && (
        <div className="px-5 py-3 bg-amber-50 border-t border-amber-200">
          <p className="text-sm text-amber-700 flex items-center gap-2">
            <FiNavigation className="w-4 h-4 shrink-0" />
            <span>
              <strong>{areasWithoutCoords.length} areas</strong> without coordinates — edit them in Areas page to show on map.
            </span>
          </p>
        </div>
      )}

      {areas.length > 0 && (
        <div className="p-5 pt-3 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Area Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {areas.map(area => (
              <div key={area._id} className="rounded-lg border border-gray-200 p-2.5 hover:shadow-md hover:border-primary-300 transition-all">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: AREA_COLORS[area.type] }} />
                  <p className="text-sm font-medium text-gray-800 truncate">{area.name}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-semibold text-primary-600">{area.voterCount || 0}v</span>
                  <span>{area.workerCount || 0}w</span>
                  {!area.coordinates?.latitude && (
                    <span className="text-amber-500 ml-auto" title="No coordinates"><FiMapPin className="w-3 h-3" /></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function WorkerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
        <p className="text-gray-600">Your daily work overview</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={FiCheckSquare} title="My Tasks" value="View Tasks" color="blue" link="/tasks" />
        <StatCard icon={FiUsers} title="Voters" value="Manage Voters" color="green" link="/voters" />
        <StatCard icon={FiCalendar} title="Rallies" value="View Schedule" color="purple" link="/rallies" />
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, color, link }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  const content = (
    <>
      <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
    </>
  )

  if (link) return <a href={link} className="stat-card block">{content}</a>
  return <div className="stat-card">{content}</div>
}
