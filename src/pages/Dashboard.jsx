import { useEffect, useState, useMemo, useRef } from 'react'
import {
  FiUsers, FiMap, FiCheckSquare, FiCalendar,
  FiUserCheck, FiMapPin, FiNavigation, FiHeart, FiInfo,
} from 'react-icons/fi'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMap,
  Circle,
  Tooltip as LeafletTooltip,
} from 'react-leaflet'
import L from 'leaflet'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'

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

/** ~26 km — visible “district” emphasis on state-level map without hiding the state outline. */
const DISTRICT_HIGHLIGHT_RADIUS_M = 26000

function normalisePlaceName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\bdistrict\b/gi, '')
    .trim()
}

/** Match Settings → District to a DISTRICT/TEHSIL area (uses saved coordinates when present). */
function findDistrictAreaRecord(areas, districtName) {
  if (!districtName?.trim() || !Array.isArray(areas)) return null
  const d = normalisePlaceName(districtName)
  if (!d) return null
  const tier = areas.filter((a) => a?.type === 'DISTRICT' || a?.type === 'TEHSIL')
  const exact = tier.find((a) => normalisePlaceName(a.name) === d)
  if (exact) return exact
  return (
    tier.find((a) => {
      const n = normalisePlaceName(a.name)
      return n.includes(d) || d.includes(n)
    }) || null
  )
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
  const color = AREA_COLORS[type] || '#64748b'
  const sizes = { STATE: 18, DISTRICT: 14, TEHSIL: 12, BLOCK: 11, WARD: 10, VILLAGE: 10, BOOTH: 9 }
  const size = sizes[type] || 9

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:${size * 2}px; height:${size * 2}px;
      background:${color};
      border:2px solid #fff;
      border-radius:50%;
      box-shadow:0 1px 2px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.18);
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
        : <WorkerDashboard stats={stats} electionConfig={electionConfig} />
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
        <p className="text-xs text-primary-100/85 mt-4 pt-3 border-t border-white/15 flex items-start gap-2 max-w-3xl">
          <FiInfo className="w-4 h-4 shrink-0 mt-0.5 opacity-90" />
          <span>
            Candidate name, party, election date and comparison chart rows are loaded from{' '}
            <strong>Settings → Election Configuration</strong> (database). Update there to change this banner — nothing here is hard-coded test data.
          </span>
        </p>
      </div>
    </div>
  )
}

const DEFAULT_CHART_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#db2777']

function formatSupportKey(key) {
  const labels = {
    STRONG_SUPPORTER: 'Strong supporter',
    SUPPORTER: 'Supporter',
    NEUTRAL: 'Neutral',
    OPPONENT: 'Opponent',
    UNKNOWN: 'Not set',
  }
  return labels[key] || key || 'Unknown'
}

function SupporterCampaignCard({ snapshot }) {
  const s = snapshot || {}
  const decided = s.decidedVoters ?? 0
  const mainPct =
    decided > 0 ? s.supporterShareAmongDecidedPercent : s.supporterSharePercent
  const display = typeof mainPct === 'number' ? mainPct : parseFloat(mainPct) || 0
  const strong = s.strongSupporter ?? 0
  const sup = s.supporter ?? 0
  const total = s.totalVoters ?? 0

  return (
    <div className="card relative overflow-hidden border-primary-100/80 bg-gradient-to-br from-white to-primary-50/40">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden />
      <div className="flex items-center gap-2 text-primary-700 mb-2">
        <FiHeart className="w-5 h-5" />
        <h3 className="text-sm font-semibold uppercase tracking-wide">Supporter strength</h3>
      </div>
      <p className="text-xs text-gray-600 mb-4">
        From each voter&apos;s <strong>Support level</strong> (Strong supporter / Supporter / Neutral / Opponent). Update in{' '}
        <strong>Voters</strong> when you survey.
      </p>
      <div className="flex items-end gap-2">
        <span className="text-5xl font-bold text-primary-700 tabular-nums leading-none">{display}</span>
        <span className="text-xl font-semibold text-primary-600 mb-1">%</span>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        {decided > 0 ? (
          <>
            <strong>Campaign lean</strong> among classified voters (excludes &quot;Not set&quot;).{' '}
            <span className="text-gray-500">
              {strong + sup} supporters / {decided} classified · {total} voters in scope
            </span>
          </>
        ) : (
          <>
            Share of all voters: {s.supporterSharePercent ?? 0}% — set <strong>Support level</strong> on voters for a sharper read ({total} in scope).
          </>
        )}
      </p>
      <div className="mt-5 space-y-2 text-sm border-t border-gray-100 pt-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Opposition (est.)</span>
          <span className="font-semibold text-red-600">{s.oppositionSharePercent ?? 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Neutral</span>
          <span className="font-semibold text-amber-700">{s.neutralSharePercent ?? 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Support not set</span>
          <span className="font-semibold text-gray-500">{s.unknownSharePercent ?? 0}%</span>
        </div>
      </div>
    </div>
  )
}

function PastElectionBarChart({ stats, electionConfig }) {
  const primaryHex = useThemeStore((state) => state.primaryHex)
  const rows = electionConfig?.pastElectionComparison || []
  const snap = stats?.supporterSnapshot
  const campaignPct =
    snap && snap.decidedVoters > 0
      ? snap.supporterShareAmongDecidedPercent
      : snap?.supporterSharePercent ?? 0

  const campaignLabel =
    electionConfig?.partyName?.trim()
      ? `This campaign (${electionConfig.partyName})`
      : 'This campaign (field data)'

  const chartData = [
    ...rows.map((r, i) => ({
      key: `hist-${i}`,
      shortLabel: r.year ? `${r.label} (${r.year})` : r.label,
      value: Math.min(100, Math.max(0, Number(r.value) || 0)),
      fill: r.barColor?.trim() || DEFAULT_CHART_COLORS[i % DEFAULT_CHART_COLORS.length],
    })),
    {
      key: 'campaign',
      shortLabel: campaignLabel.length > 36 ? `${campaignLabel.slice(0, 34)}…` : campaignLabel,
      value: Math.min(100, Math.max(0, Number(campaignPct) || 0)),
      fill: primaryHex || '#2563eb',
    },
  ]

  if (rows.length === 0 && (!snap || (snap.totalVoters ?? 0) === 0)) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Past elections vs campaign</h3>
        <p className="text-sm text-gray-500 mb-4">
          Add historical bars in <strong>Settings → Election Config → Past election comparison</strong>, and set voter{' '}
          <strong>Support level</strong> to see your live bar.
        </p>
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center text-gray-500 text-sm">
          No comparison rows yet — configure in Election settings.
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Past elections vs campaign</h3>
      <p className="text-sm text-gray-500 mb-4">
        Bars from your saved comparison list (Election settings) appear first; the <strong>last bar</strong> is live supporter % from voters in your area scope (same as the map).
      </p>
      <div className="h-[300px] w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 64 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="shortLabel"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              interval={0}
              angle={-28}
              textAnchor="end"
              height={70}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" width={36} />
            <Tooltip
              formatter={(v) => [`${v}%`, 'Value']}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SupporterCampaignCard snapshot={stats?.supporterSnapshot} />
        <div className="xl:col-span-2 card">
          <PastElectionBarChart stats={stats} electionConfig={electionConfig} />
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Support level breakdown</h3>
        {stats?.supporterSnapshot?.breakdown?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.supporterSnapshot.breakdown.map((row) => (
              <div
                key={row._id || 'na'}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3"
              >
                <span className="text-sm text-gray-700">{formatSupportKey(row._id)}</span>
                <span className="text-lg font-bold text-gray-900 tabular-nums">{row.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No voters in scope yet.</p>
        )}
      </div>

      <ConstituencyMap areas={areas} electionConfig={electionConfig} dashboardStats={stats} />

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

function ConstituencyMap({ areas, electionConfig, dashboardStats }) {
  const [stateGeoJson, setStateGeoJson] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const geoRef = useRef(null)
  /** { lat, lng, label, source: 'area' | 'geocode' } — from CRM area coords or OSM Nominatim. */
  const [districtHighlight, setDistrictHighlight] = useState(null)

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

  useEffect(() => {
    const district = electionConfig?.district?.trim()
    const state = electionConfig?.state?.trim()
    if (!district || !state) {
      setDistrictHighlight(null)
      return
    }

    const areaRow = findDistrictAreaRecord(areas, district)
    const lat = areaRow?.coordinates?.latitude
    const lng = areaRow?.coordinates?.longitude
    if (lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      setDistrictHighlight({
        lat: Number(lat),
        lng: Number(lng),
        label: areaRow.name || district,
        source: 'area',
      })
      return
    }

    let cancelled = false
    const ac = new AbortController()
    const t = setTimeout(() => {
      const q = `${district}, ${state}, India`
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=in`,
        { signal: ac.signal, headers: { Accept: 'application/json' } }
      )
        .then((res) => res.json())
        .then((json) => {
          if (cancelled || !Array.isArray(json) || !json[0]) {
            if (!cancelled) setDistrictHighlight(null)
            return
          }
          const hit = json[0]
          setDistrictHighlight({
            lat: parseFloat(hit.lat),
            lng: parseFloat(hit.lon),
            label: district,
            source: 'geocode',
          })
        })
        .catch(() => {
          if (!cancelled) setDistrictHighlight(null)
        })
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(t)
      ac.abort()
    }
  }, [electionConfig?.district, electionConfig?.state, areas])

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

  const maskStyle = { color: 'transparent', fillColor: '#e8eefc', fillOpacity: 0.88, weight: 0 }

  const stateStyle = {
    color: '#1d4ed8',
    weight: 2.5,
    fillColor: '#3b82f6',
    fillOpacity: 0.14,
    dashArray: '',
  }

  const stateHoverStyle = {
    weight: 3,
    fillOpacity: 0.24,
    fillColor: '#2563eb',
  }

  const districtCircleStyle = {
    color: '#c2410c',
    weight: 2.5,
    fillColor: '#f59e0b',
    fillOpacity: 0.2,
  }

  const areaSumVoters = useMemo(
    () => areas.reduce((s, a) => s + (Number(a.voterCount) || 0), 0),
    [areas]
  )
  const areaSumRegistered = useMemo(
    () => areas.reduce((s, a) => s + (Number(a.registeredVoters) || 0), 0),
    [areas]
  )
  const areaSumWorkers = useMemo(
    () => areas.reduce((s, a) => s + (Number(a.workerCount) || 0), 0),
    [areas]
  )
  const areaSumMale = useMemo(
    () => areas.reduce((s, a) => s + (Number(a.maleVoters) || 0), 0),
    [areas]
  )
  const areaSumFemale = useMemo(
    () => areas.reduce((s, a) => s + (Number(a.femaleVoters) || 0), 0),
    [areas]
  )

  const headlineVoters =
    typeof dashboardStats?.totalVoters === 'number' ? dashboardStats.totalVoters : areaSumVoters

  const unitRows = useMemo(() => {
    const rows = areas.filter((a) => a.type !== 'STATE')
    const sorted = [...rows].sort(
      (a, b) => (Number(b.voterCount) || 0) - (Number(a.voterCount) || 0)
    )
    if (sorted.length > 0) return sorted
    return [...areas].sort((a, b) => (Number(b.voterCount) || 0) - (Number(a.voterCount) || 0))
  }, [areas])

  const scopeMismatch =
    typeof dashboardStats?.totalVoters === 'number' &&
    areaSumVoters !== dashboardStats.totalVoters

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
    <section className="card p-0 overflow-hidden border-slate-200/90 shadow-card">
      <header className="border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white px-6 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Geographic overview
            </p>
            <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">
              {electionConfig?.state || 'Constituency territory'}
              {electionConfig?.district?.trim() ? (
                <span className="font-normal text-slate-500"> · {electionConfig.district.trim()}</span>
              ) : null}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              {geoLoading
                ? 'Loading administrative boundary data…'
                : stateGeoJson
                  ? 'State outline, configured district emphasis, and mapped operational units. Use zoom controls to navigate; map does not capture page scroll.'
                  : 'Set the state under Settings → Election Configuration to load the administrative boundary. District name is used for the district highlight when coordinates are available.'}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Map status">
              {stateGeoJson && (
                <li className="inline-flex items-center rounded-md border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
                  State boundary
                </li>
              )}
              {districtHighlight && (
                <li className="inline-flex items-center rounded-md border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
                  District focus · {districtHighlight.label}
                  <span className="ml-1.5 font-normal text-slate-400">
                    {districtHighlight.source === 'area' ? 'CRM' : 'Geocoded'}
                  </span>
                </li>
              )}
              {areasWithCoords.length > 0 && (
                <li className="inline-flex items-center rounded-md border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
                  {areasWithCoords.length} mapped {areasWithCoords.length === 1 ? 'unit' : 'units'}
                </li>
              )}
            </ul>
          </div>
          <aside className="w-full shrink-0 rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 lg:w-64">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Legend</p>
            <ul className="mt-2.5 space-y-2 text-xs text-slate-700">
              {stateGeoJson && (
                <li className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-9 shrink-0 rounded-sm ring-1 ring-blue-600/35"
                    style={{ background: 'linear-gradient(180deg, rgba(59,130,246,0.35), rgba(37,99,235,0.2))' }}
                    aria-hidden
                  />
                  <span>Administrative boundary</span>
                </li>
              )}
              {districtHighlight && (
                <li className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full ring-2 ring-amber-600/40"
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.45)' }}
                    aria-hidden
                  />
                  <span>District emphasis</span>
                </li>
              )}
              {sortedTypes.map((type) => (
                <li key={type} className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: AREA_COLORS[type] }}
                    aria-hidden
                  />
                  <span className="font-medium text-slate-600">{type}</span>
                  <span className="ml-auto tabular-nums text-slate-500">{groupedByType[type].length}</span>
                </li>
              ))}
              {sortedTypes.length === 0 && !stateGeoJson && !districtHighlight && (
                <li className="text-slate-500">No layers yet</li>
              )}
            </ul>
          </aside>
        </div>
      </header>

      <div className="relative bg-gradient-to-br from-sky-50/80 via-slate-50 to-indigo-50/50 px-1 pb-1 pt-1 sm:px-2 sm:pb-2 sm:pt-2">
        {geoLoading && (
          <div
            className="absolute inset-1 z-[500] flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-[2px] sm:inset-2"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-lg">
              <div
                className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700"
                aria-hidden
              />
              <span className="text-sm font-medium text-slate-700">Loading boundary…</span>
            </div>
          </div>
        )}
        <div className="flex min-h-[min(22rem,55vh)] flex-col xl:h-[min(34rem,72vh)] xl:flex-row xl:items-stretch xl:gap-0">
          <div className="constituency-map-frame relative z-0 h-[min(28rem,62vh)] min-h-[20rem] w-full min-w-0 flex-1 overflow-hidden rounded-lg ring-1 ring-slate-200/80 shadow-md xl:h-full xl:min-h-0 xl:rounded-r-none xl:shadow-inner">
            <MapContainer
              center={mapCenter}
              zoom={stateGeoJson ? 7 : 6}
              className="h-full w-full bg-sky-50/40"
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
              zoomControl
            >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={20}
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

          {districtHighlight && (
            <Circle
              center={[districtHighlight.lat, districtHighlight.lng]}
              radius={DISTRICT_HIGHLIGHT_RADIUS_M}
              pathOptions={districtCircleStyle}
            >
              <LeafletTooltip
                direction="top"
                offset={[0, -6]}
                opacity={1}
                permanent={false}
                className="leaflet-district-tooltip"
              >
                <span className="font-medium">
                  District: {districtHighlight.label}
                  {electionConfig?.state ? ` · ${electionConfig.state}` : ''}
                </span>
              </LeafletTooltip>
            </Circle>
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
              <Popup className="crm-map-popup">
                <div className="px-4 py-3">
                  <div className="flex items-start gap-2.5 border-b border-slate-100 pb-2.5">
                    <span
                      className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-slate-200"
                      style={{ backgroundColor: AREA_COLORS[area.type] }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug text-slate-900">{area.name}</p>
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        {area.type}
                        {area.code ? ` · ${area.code}` : ''}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-3 space-y-2 text-[13px]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Voters</dt>
                      <dd className="font-semibold tabular-nums text-slate-900">{area.voterCount || 0}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Registered</dt>
                      <dd className="font-semibold tabular-nums text-slate-900">{area.registeredVoters || 0}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Male / female</dt>
                      <dd className="font-semibold tabular-nums text-slate-900">
                        {area.maleVoters || 0} / {area.femaleVoters || 0}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Workers</dt>
                      <dd className="font-semibold tabular-nums text-slate-900">{area.workerCount || 0}</dd>
                    </div>
                    {area.assignedManager && (
                      <div className="flex justify-between gap-4 border-t border-slate-100 pt-2">
                        <dt className="text-slate-500">Manager</dt>
                        <dd className="max-w-[55%] text-right font-medium text-slate-800">{area.assignedManager.name}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Popup>
            </Marker>
          ))}
            </MapContainer>
          </div>

          <aside className="flex w-full min-h-0 flex-col border-t border-slate-200/90 bg-white/95 xl:w-[min(26rem,100%)] xl:max-w-md xl:shrink-0 xl:border-l xl:border-t-0 xl:overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 px-4 py-4 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-100/90">
                {electionConfig?.constituencyType === 'VIDHANSABHA' ? 'Vidhan Sabha' : 'Constituency'} · voter tally
              </p>
              <h4 className="mt-1 text-lg font-semibold leading-snug">
                {electionConfig?.constituencyName?.trim() || 'Constituency scope'}
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-primary-100/95">
                Voters and workers by area unit (district / city / ward / booth as in your hierarchy). Colours match
                map markers.
              </p>
              <p className="mt-1 text-[11px] text-amber-100/90">
                क्षेत्र के अनुसार मतदाता संख्या — नीचे सूची में विवरण।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3">
              <div className="rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary-700/80">Total voters</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-primary-900">{headlineVoters}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">Dashboard scope</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/80">Registered</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-900">{areaSumRegistered}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">Sum on units</p>
              </div>
              <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-800/80">Workers</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-violet-900">{areaSumWorkers}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">Assigned</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900/80">Male / female</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-amber-950">
                  {areaSumMale} <span className="text-amber-700/80">/</span> {areaSumFemale}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">On listed units</p>
              </div>
            </div>

            {scopeMismatch && (
              <p className="mx-3 mb-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] leading-snug text-amber-900 ring-1 ring-amber-100">
                Listed units add up to <strong>{areaSumVoters}</strong> voters; dashboard total is{' '}
                <strong>{dashboardStats.totalVoters}</strong> (full query may include voters outside these area rows).
              </p>
            )}

            <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">By area / city</p>
                <span className="text-[10px] font-medium text-slate-400">{unitRows.length} rows</span>
              </div>
              <div className="max-h-[14rem] min-h-[8rem] flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3 xl:min-h-0 xl:max-h-none xl:flex-1">
                <table className="w-full border-collapse text-left text-[12px]">
                  <thead className="sticky top-0 z-[1] bg-slate-100/95 text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm backdrop-blur-sm">
                    <tr>
                      <th className="rounded-l-md px-2 py-2">Area</th>
                      <th className="px-1 py-2">Type</th>
                      <th className="px-1 py-2 text-right">Voters</th>
                      <th className="px-1 py-2 text-right">Reg.</th>
                      <th className="rounded-r-md px-2 py-2 text-right">Wkr</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {unitRows.map((row) => (
                      <tr key={row._id} className="hover:bg-primary-50/40">
                        <td className="max-w-[9rem] truncate px-2 py-2 font-medium" title={row.name}>
                          <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle ring-1 ring-white shadow-sm" style={{ backgroundColor: AREA_COLORS[row.type] }} />
                          {row.name}
                        </td>
                        <td className="whitespace-nowrap px-1 py-2 text-[10px] font-semibold text-slate-500">
                          {row.type}
                        </td>
                        <td className="px-1 py-2 text-right font-semibold tabular-nums text-primary-800">
                          {row.voterCount ?? 0}
                        </td>
                        <td className="px-1 py-2 text-right tabular-nums text-slate-600">{row.registeredVoters ?? 0}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-violet-700">{row.workerCount ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {unitRows.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs text-slate-500">No area rows in this scope yet.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {areasWithoutCoords.length > 0 && (
        <div className="border-t border-amber-200/80 bg-amber-50/50 px-6 py-3.5">
          <p className="flex items-start gap-2.5 text-sm leading-relaxed text-amber-950/80">
            <FiNavigation className="mt-0.5 h-4 w-4 shrink-0 text-amber-700/90" aria-hidden />
            <span>
              <span className="font-semibold">{areasWithoutCoords.length}</span>{' '}
              {areasWithoutCoords.length === 1 ? 'area has' : 'areas have'} no map coordinates. Add latitude and
              longitude under <strong className="font-semibold">Areas</strong> to include them on this view.
            </span>
          </p>
        </div>
      )}

      {areas.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-6 py-5">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Operational coverage</h4>
          <p className="mt-1 text-xs text-slate-500">Counts reflect your current data scope.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {areas.map((area) => (
              <div
                key={area._id}
                className="rounded-lg border border-slate-200/90 bg-white p-3 shadow-sm transition-shadow hover:border-slate-300 hover:shadow-md"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full ring-2 ring-slate-100"
                    style={{ backgroundColor: AREA_COLORS[area.type] }}
                  />
                  <p className="truncate text-sm font-medium text-slate-800">{area.name}</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold tabular-nums text-slate-700">{area.voterCount || 0} voters</span>
                  <span className="text-slate-400">·</span>
                  <span className="tabular-nums">{area.workerCount || 0} workers</span>
                  {!area.coordinates?.latitude && (
                    <span className="ml-auto text-amber-600" title="Coordinates not set">
                      <FiMapPin className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function WorkerDashboard({ stats, electionConfig }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-subtitle">Your daily work overview</p>
      </div>
      {stats?.supporterSnapshot != null && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SupporterCampaignCard snapshot={stats.supporterSnapshot} />
          <div className="lg:col-span-2 card">
            <PastElectionBarChart stats={stats} electionConfig={electionConfig} />
          </div>
        </div>
      )}
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
