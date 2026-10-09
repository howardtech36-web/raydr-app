import { LatLng } from '../types/navigation';

export interface VectorPolygon {
  id: string;
  name: string;
  type: 'water' | 'boundary' | 'park';
  coordinates: [number, number][]; // [lat, lng]
}

export interface VectorRoad {
  id: string;
  name: string;
  type: 'highway' | 'arterial' | 'secondary' | 'local';
  coordinates: [number, number][]; // [lat, lng]
}

export interface VectorTown {
  name: string;
  coords: [number, number];
  tier: 1 | 2; // 1 = major city, 2 = town
}

// -------------------------------------------------------------
// WATER BODIES (Deep Obsidian Fill: #0D2229 with Cyan Glow Border)
// -------------------------------------------------------------
export const LAKE_COUNTY_WATER: VectorPolygon[] = [
  // Lake Michigan (North Expanse & Shoreline across Whiting, Hammond, Gary)
  {
    id: 'lake-michigan',
    name: 'Lake Michigan',
    type: 'water',
    coordinates: [
      [41.7400, -87.5260],
      [41.7000, -87.5260],
      [41.6920, -87.5100],
      [41.6880, -87.4980], // Whiting Casino / Beach
      [41.6650, -87.4600], // Pastrick Marina / East Chicago
      [41.6350, -87.4100], // Gary Harbor
      [41.6186, -87.2617], // Marquette Park & Beach
      [41.6150, -87.2100], // Porter County Line
      [41.7400, -87.2100],
      [41.7400, -87.5260],
    ],
  },
  // Cedar Lake Basin Perimeter
  {
    id: 'cedar-lake-basin',
    name: 'Cedar Lake',
    type: 'water',
    coordinates: [
      [41.3780, -87.4390],
      [41.3760, -87.4320],
      [41.3710, -87.4275],
      [41.3640, -87.4280],
      [41.3570, -87.4310],
      [41.3525, -87.4365],
      [41.3515, -87.4410],
      [41.3560, -87.4445],
      [41.3630, -87.4455],
      [41.3700, -87.4440],
      [41.3765, -87.4420],
      [41.3780, -87.4390],
    ],
  },
  // Wolf Lake (Hammond / State Line)
  {
    id: 'wolf-lake',
    name: 'Wolf Lake',
    type: 'water',
    coordinates: [
      [41.6800, -87.5260],
      [41.6750, -87.5080],
      [41.6620, -87.5050],
      [41.6560, -87.5180],
      [41.6620, -87.5260],
      [41.6800, -87.5260],
    ],
  },
  // Lake George (Hobart)
  {
    id: 'lake-george-hobart',
    name: 'Lake George',
    type: 'water',
    coordinates: [
      [41.5360, -87.2560],
      [41.5310, -87.2520],
      [41.5240, -87.2540],
      [41.5230, -87.2580],
      [41.5280, -87.2600],
      [41.5360, -87.2560],
    ],
  },
];

// -------------------------------------------------------------
// MAJOR HIGHWAYS & EXPRESSWAYS (Base: #1E2638, Accent: #3B82F6)
// -------------------------------------------------------------
export const LAKE_COUNTY_HIGHWAYS: VectorRoad[] = [
  // I-80 / I-94 Borman Expressway (East-West Major Freight Spine)
  {
    id: 'hwy-i80-94',
    name: 'I-80 / I-94 (Borman Expy)',
    type: 'highway',
    coordinates: [
      [41.5845, -87.5260],
      [41.5842, -87.5098], // Calumet Ave
      [41.5838, -87.4725], // Indianapolis Blvd
      [41.5832, -87.4520], // Kennedy Ave
      [41.5824, -87.4320], // Cline Ave
      [41.5810, -87.4100], // Burr St
      [41.5802, -87.3556], // Grant St
      [41.5794, -87.3340], // Broadway
      [41.5788, -87.3180], // I-65 Interchange
      [41.5780, -87.2510], // Central Ave / Ripley
      [41.5760, -87.2100], // Porter Co line
    ],
  },
  // I-65 Corridor (North-South Spine)
  {
    id: 'hwy-i65',
    name: 'I-65',
    type: 'highway',
    coordinates: [
      [41.5950, -87.3180], // Gary terminus
      [41.5788, -87.3180], // I-80/94 Junction
      [41.5450, -87.3180], // Ridge Rd / 37th Ave
      [41.5200, -87.3180], // 61st Ave (Exit 255)
      [41.4710, -87.3195], // US-30 Southlake Mall (Exit 253)
      [41.4420, -87.3150], // 93rd Ave (Exit 250)
      [41.4250, -87.3130], // 109th Ave (Exit 249)
      [41.3850, -87.3110], // US-231 (Exit 247)
      [41.2950, -87.3050], // IN-2 Lowell (Exit 240)
      [41.2300, -87.3030], // Roselawn / Demotte
      [41.1600, -87.3020], // South Lake County Line
    ],
  },
  // US-41 (Indianapolis Blvd - North-South Commercial Spine)
  {
    id: 'hwy-us41',
    name: 'US-41 (Indianapolis Blvd)',
    type: 'highway',
    coordinates: [
      [41.6850, -87.4850], // Whiting
      [41.6320, -87.4760], // East Chicago
      [41.5950, -87.4690], // Hammond 165th St
      [41.5838, -87.4725], // I-80/94 Borman
      [41.5580, -87.4700], // Ridge Rd Highland
      [41.5510, -87.4705], // 45th St Highland
      [41.5200, -87.4715], // Main St Griffith/Schererville
      [41.4912, -87.4729], // US-30 Crossroads Schererville
      [41.4650, -87.4725], // 77th Ave
      [41.4480, -87.4725], // 93rd Ave St. John
      [41.4200, -87.4728], // 109th Ave St. John
      [41.3750, -87.4730], // 133rd Ave / Cedar Lake junction
      [41.3400, -87.4730], // 151st Ave
      [41.2950, -87.4730], // IN-2 Belshaw / Lowell junction
      [41.1600, -87.4725], // South County Line
    ],
  },
  // US-30 (Lincoln Highway - East-West Retail & Freight Corridor)
  {
    id: 'hwy-us30',
    name: 'US-30 (Lincoln Hwy)',
    type: 'highway',
    coordinates: [
      [41.4925, -87.5260], // IL State Line (Dyer)
      [41.4920, -87.5080], // Calumet Ave Dyer
      [41.4912, -87.4729], // US-41 Crossroads Schererville
      [41.4915, -87.4100], // Burr St
      [41.4910, -87.3640], // Taft St (IN-55)
      [41.4702, -87.3345], // Broadway (IN-53) Merrillville
      [41.4710, -87.3195], // I-65 Southlake Mall
      [41.4700, -87.2750], // Colorado St Hobart
      [41.4680, -87.2100], // Porter Co line (Deep River)
    ],
  },
  // Cline Avenue Expressway (IN-912)
  {
    id: 'hwy-cline-ave',
    name: 'Cline Ave (IN-912)',
    type: 'highway',
    coordinates: [
      [41.6550, -87.4420], // Pastrick Marina
      [41.6310, -87.4520], // Columbus Dr East Chicago
      [41.6050, -87.4420], // Chicago Ave
      [41.5824, -87.4320], // I-80/94 Borman
      [41.5600, -87.4320], // Ridge Rd Griffith
    ],
  },
  // US-231 (Crown Point Square to I-65)
  {
    id: 'hwy-us231',
    name: 'US-231',
    type: 'highway',
    coordinates: [
      [41.4450, -87.4320], // St. John junction
      [41.4280, -87.3950], // Crown Point West
      [41.4172, -87.3638], // Crown Point Historic Square
      [41.4050, -87.3350], // Broadway south
      [41.3850, -87.3110], // I-65 Exit 247
      [41.3500, -87.2700], // Southeast to Hebron
      [41.3200, -87.2100], // Porter Co line
    ],
  },
  // IN-2 (Lowell Southern Corridor)
  {
    id: 'hwy-in2',
    name: 'IN-2',
    type: 'highway',
    coordinates: [
      [41.2900, -87.5260], // IL State Line
      [41.2920, -87.4730], // US-41 Junction
      [41.2920, -87.4200], // Lowell Downtown (Commercial Ave)
      [41.2950, -87.3650], // Clay St
      [41.2950, -87.3050], // I-65 Exit 240
      [41.3000, -87.2100], // Porter Co line (Hebron)
    ],
  },
  // I-90 (Indiana Toll Road)
  {
    id: 'hwy-i90',
    name: 'I-90 (Indiana Toll Road)',
    type: 'highway',
    coordinates: [
      [41.6920, -87.5260], // IL State Line / Chicago Skyway
      [41.6700, -87.4800], // Hammond / Whiting
      [41.6350, -87.4100], // East Chicago
      [41.6050, -87.3400], // Gary West
      [41.5950, -87.2500], // Gary East
      [41.5850, -87.2100], // Porter Co line
    ],
  },
];

// -------------------------------------------------------------
// CEDAR LAKE & CROWN POINT GRID & ARTERIALS (Line Weight: #182030)
// -------------------------------------------------------------
export const LAKE_COUNTY_ARTERIALS: VectorRoad[] = [
  // 133rd Avenue (Major Cedar Lake East-West Corridor)
  {
    id: 'art-133rd-ave',
    name: '133rd Ave',
    type: 'arterial',
    coordinates: [
      [41.3750, -87.5260], // IL line
      [41.3750, -87.4730], // US-41
      [41.3750, -87.4550], // Parrish Ave
      [41.3750, -87.4420], // Morse St / North Cedar Lake
      [41.3750, -87.4260], // King Rd
      [41.3750, -87.3650], // Main St Crown Point South
      [41.3750, -87.3110], // I-65 junction
      [41.3750, -87.2100], // Porter Co line
    ],
  },
  // Morse Street (West Cedar Lake Corridor)
  {
    id: 'art-morse-st',
    name: 'Morse St',
    type: 'arterial',
    coordinates: [
      [41.4200, -87.4420], // 109th Ave
      [41.3950, -87.4420], // 117th Ave
      [41.3750, -87.4420], // 133rd Ave
      [41.3650, -87.4420], // 141st Ave (West Shore)
      [41.3450, -87.4420], // 151st Ave
      [41.3100, -87.4420], // Belshaw / 181st Ave
    ],
  },
  // Parrish Avenue (Cedar Lake & St. John North-South)
  {
    id: 'art-parrish-ave',
    name: 'Parrish Ave',
    type: 'arterial',
    coordinates: [
      [41.4650, -87.4550], // 85th Ave St. John
      [41.4450, -87.4550], // W 93rd Ave
      [41.4200, -87.4550], // W 109th Ave
      [41.3950, -87.4550], // 117th Ave
      [41.3750, -87.4550], // 133rd Ave
      [41.3500, -87.4550], // 147th Ave
      [41.3300, -87.4550], // 159th Ave
    ],
  },
  // W 93rd Avenue (St. John to Crown Point Corridor)
  {
    id: 'art-93rd-ave',
    name: 'W 93rd Ave',
    type: 'arterial',
    coordinates: [
      [41.4450, -87.5260], // IL line
      [41.4450, -87.4725], // US-41 St. John
      [41.4450, -87.4550], // Parrish Ave
      [41.4430, -87.4100], // Burr St
      [41.4420, -87.3650], // Main St Crown Point North
      [41.4420, -87.3325], // Broadway
      [41.4420, -87.3150], // I-65 Exit 250
      [41.4420, -87.2100], // Porter Co line
    ],
  },
  // W 101st Avenue (Crown Point & St. John Grid)
  {
    id: 'art-101st-ave',
    name: 'W 101st Ave',
    type: 'arterial',
    coordinates: [
      [41.4320, -87.5000],
      [41.4320, -87.4725], // US-41
      [41.4320, -87.4550], // Parrish Ave
      [41.4320, -87.4100], // Burr St
      [41.4320, -87.3650], // Main St
      [41.4320, -87.3325], // Broadway
      [41.4320, -87.2600],
    ],
  },
  // W 109th Avenue (Major Regional East-West Arterial)
  {
    id: 'art-109th-ave',
    name: 'W 109th Ave',
    type: 'arterial',
    coordinates: [
      [41.4200, -87.5260], // IL line
      [41.4200, -87.4728], // US-41 St. John
      [41.4200, -87.4550], // Parrish Ave
      [41.4200, -87.4420], // Morse St
      [41.4200, -87.4100], // Burr St
      [41.4200, -87.3650], // Crown Point South Main St
      [41.4200, -87.3340], // Broadway Crown Point
      [41.4250, -87.3130], // I-65 Exit 249
      [41.4150, -87.2600], // Winfield / Randolph St
      [41.4150, -87.2100], // Porter Co line
    ],
  },
  // Broadway / IN-53 (Gary to Crown Point Square)
  {
    id: 'art-broadway',
    name: 'Broadway (IN-53)',
    type: 'arterial',
    coordinates: [
      [41.6050, -87.3340], // Gary 5th Ave
      [41.5794, -87.3340], // I-80/94 Borman
      [41.5520, -87.3342], // Ridge Rd (37th Ave)
      [41.5200, -87.3340], // 61st Ave Merrillville
      [41.4702, -87.3345], // US-30
      [41.4420, -87.3325], // 93rd Ave
      [41.4172, -87.3638], // Crown Point Square
      [41.3850, -87.3350], // South to US-231
    ],
  },
  // Main Street Crown Point (North-South Spine)
  {
    id: 'art-main-st-cp',
    name: 'Main St (Crown Point)',
    type: 'arterial',
    coordinates: [
      [41.4700, -87.3650], // 73rd Ave
      [41.4420, -87.3650], // 93rd Ave
      [41.4172, -87.3638], // Historic Court House Square
      [41.3750, -87.3650], // 133rd Ave
      [41.3400, -87.3650], // 151st Ave
    ],
  },
  // Cedar Lake Basin Loop (Lake Shore Dr / Constitution Ave / South Shore Dr)
  {
    id: 'art-cedar-lake-loop',
    name: 'Cedar Lake Shoreline Dr',
    type: 'secondary',
    coordinates: [
      [41.3780, -87.4420], // North Shore / 133rd Ave
      [41.3750, -87.4320], // Constitution Ave / Town Hall
      [41.3650, -87.4260], // East Shore Dr
      [41.3530, -87.4330], // South Shore Dr
      [41.3550, -87.4440], // Lauerman St
      [41.3680, -87.4460], // West Lake Shore Dr
      [41.3780, -87.4420], // Loop complete
    ],
  },
  // Ridge Road (Business US-6 / 37th Ave)
  {
    id: 'art-ridge-rd',
    name: 'Ridge Rd',
    type: 'arterial',
    coordinates: [
      [41.5580, -87.5260], // IL Line (Munster)
      [41.5580, -87.5085], // Calumet Ave
      [41.5580, -87.4700], // US-41 Highland
      [41.5600, -87.4320], // Cline Ave Griffith
      [41.5520, -87.3342], // Broadway Gary
      [41.5520, -87.2550], // Lake George / Hobart
      [41.5520, -87.2100], // Porter Co line
    ],
  },
  // Calumet Avenue (Munster & Hammond)
  {
    id: 'art-calumet-ave',
    name: 'Calumet Ave',
    type: 'arterial',
    coordinates: [
      [41.6850, -87.5080], // Lake Michigan
      [41.6350, -87.5080], // Hammond Downtown
      [41.5842, -87.5098], // I-80/94
      [41.5580, -87.5085], // Ridge Rd
      [41.5450, -87.5090], // 45th St Munster
      [41.4920, -87.5080], // US-30 Dyer
    ],
  },
  // 45th Street (Munster, Highland, Griffith)
  {
    id: 'art-45th-st',
    name: '45th St',
    type: 'secondary',
    coordinates: [
      [41.5450, -87.5260], // IL line
      [41.5450, -87.5090], // Calumet Ave
      [41.5510, -87.4705], // US-41
      [41.5450, -87.4320], // Cline Ave
      [41.5450, -87.3900], // Griffith / Burr
    ],
  },
  // 61st Avenue (Merrillville & Hobart)
  {
    id: 'art-61st-ave',
    name: '61st Ave',
    type: 'secondary',
    coordinates: [
      [41.5200, -87.4100], // Burr St
      [41.5200, -87.3650], // Taft St
      [41.5200, -87.3340], // Broadway
      [41.5200, -87.3180], // I-65 Exit 255
      [41.5200, -87.2550], // Hobart Downtown
    ],
  },
  // Taft Street / IN-55
  {
    id: 'art-taft-st',
    name: 'Taft St (IN-55)',
    type: 'arterial',
    coordinates: [
      [41.5520, -87.3640], // Ridge Rd
      [41.4910, -87.3640], // US-30
      [41.4420, -87.3640], // 93rd Ave
      [41.4170, -87.3640], // Crown Point
    ],
  },
  // Burr Street
  {
    id: 'art-burr-st',
    name: 'Burr St',
    type: 'secondary',
    coordinates: [
      [41.5810, -87.4100], // I-80/94
      [41.5520, -87.4100], // Ridge Rd
      [41.4915, -87.4100], // US-30
      [41.4420, -87.4100], // 93rd Ave
      [41.4200, -87.4100], // 109th Ave
    ],
  },
];

// -------------------------------------------------------------
// LAKE COUNTY MUNICIPAL BOUNDARY OUTLINES
// -------------------------------------------------------------
export const LAKE_COUNTY_OUTLINE: VectorPolygon = {
  id: 'lake-county-perimeter',
  name: 'Lake County, Indiana',
  type: 'boundary',
  coordinates: [
    [41.1600, -87.5260], // SW Corner (Kankakee River / IL line)
    [41.6920, -87.5260], // NW Corner (IL line at Lake Michigan)
    [41.6920, -87.5000], // Whiting shoreline
    [41.6650, -87.4600], // East Chicago
    [41.6350, -87.4100], // Gary
    [41.6150, -87.2100], // NE Corner (Lake Michigan / Porter Co)
    [41.1600, -87.2100], // SE Corner (Kankakee River / Porter Co)
    [41.1600, -87.5260], // Close boundary
  ],
};

// -------------------------------------------------------------
// CYBER TOWNS & MUNICIPAL CENTROIDS
// -------------------------------------------------------------
export const LAKE_COUNTY_TOWNS: VectorTown[] = [
  { name: 'CROWN POINT', coords: [41.4172, -87.3638], tier: 1 },
  { name: 'CEDAR LAKE', coords: [41.3650, -87.4320], tier: 1 },
  { name: 'SCHERERVILLE', coords: [41.4912, -87.4729], tier: 1 },
  { name: 'MERRILLVILLE', coords: [41.4820, -87.3340], tier: 1 },
  { name: 'ST. JOHN', coords: [41.4480, -87.4725], tier: 1 },
  { name: 'HIGHLAND', coords: [41.5540, -87.4600], tier: 1 },
  { name: 'MUNSTER', coords: [41.5540, -87.5090], tier: 1 },
  { name: 'HAMMOND', coords: [41.6000, -87.4900], tier: 1 },
  { name: 'GARY', coords: [41.6000, -87.3400], tier: 1 },
  { name: 'HOBART', coords: [41.5320, -87.2550], tier: 1 },
  { name: 'LOWELL', coords: [41.2920, -87.4200], tier: 2 },
  { name: 'DYER', coords: [41.4950, -87.5150], tier: 2 },
  { name: 'GRIFFITH', coords: [41.5280, -87.4280], tier: 2 },
  { name: 'WINFIELD', coords: [41.4060, -87.2390], tier: 2 },
  { name: 'EAST CHICAGO', coords: [41.6400, -87.4550], tier: 2 },
  { name: 'WHITING', coords: [41.6780, -87.4920], tier: 2 },
];
