import { expandTuples } from './catalogShared.ts';
import { CATALOG_PART_A } from './catalogPartA.ts';
import { CATALOG_PART_B } from './catalogPartB.ts';

export type BodyArchetype =
  | 'hypercar'
  | 'supercar'
  | 'sports'
  | 'coupe'
  | 'sedan'
  | 'suv'
  | 'muscle';

export interface CarSpec {
  id: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  archetype: BodyArchetype;
  hp: number;
  torque: number;
  top: number;
  acc: string;
  engine: string;
  fuel: string;
  price: string;
  defaultColor: string;
  image: string;
  description: string;
}

const baseCars: Omit<CarSpec, 'id' | 'archetype' | 'defaultColor'>[] = [
  { brand: 'BMW', model: 'M3 Competition', year: 2025, type: 'Sports Car', hp: 523, torque: 650, top: 250, acc: '3.5 s', engine: '3.0L Twin-Turbo Inline-6', fuel: 'Petrol', price: '$80,200', image: '/src/assets/images/diag_bmw_m3_comp_1795015697466.jpg', description: 'A powerful performance sedan with sporty handling and everyday practicality.' },
  { brand: 'BMW', model: 'M4 Competition', year: 2025, type: 'Sports Car', hp: 523, torque: 650, top: 250, acc: '3.4 s', engine: '3.0L Twin-Turbo Inline-6', fuel: 'Petrol', price: '$83,200', image: '/src/assets/images/diag_bmw_m4_comp_1795015698704.jpg', description: 'A performance coupe built for speed, precision and driver excitement.' },
  { brand: 'BMW', model: 'M5', year: 2025, type: 'Sedan', hp: 717, torque: 1000, top: 305, acc: '3.5 s', engine: '4.4L V8 Hybrid', fuel: 'Hybrid', price: '$119,500', image: '/src/assets/images/diag_bmw_m5_1795015699021.jpg', description: 'A high-performance executive sedan combining power and luxury.' },
  { brand: 'BMW', model: 'X5', year: 2025, type: 'SUV', hp: 375, torque: 520, top: 243, acc: '5.5 s', engine: '3.0L Inline-6', fuel: 'Petrol', price: '$65,700', image: '/src/assets/images/diag_bmw_x5_1795015699617.jpg', description: 'A luxury SUV offering comfort, space and advanced technology.' },
  { brand: 'BMW', model: 'X7', year: 2025, type: 'SUV', hp: 375, torque: 520, top: 250, acc: '5.8 s', engine: '3.0L Inline-6', fuel: 'Petrol', price: '$83,500', image: '/src/assets/images/diag_bmw_x7_1795015699992.jpg', description: 'A large premium SUV with three rows and luxury features.' },
  { brand: 'BMW', model: 'i7', year: 2025, type: 'Electric', hp: 536, torque: 745, top: 240, acc: '4.7 s', engine: 'Dual Electric Motors', fuel: 'Electric', price: '$105,700', image: '/src/assets/images/diag_bmw_i7_1795015701125.jpg', description: 'An electric luxury flagship with advanced comfort technology.' },
  { brand: 'Mercedes-Benz', model: 'S-Class', year: 2025, type: 'Sedan', hp: 442, torque: 560, top: 250, acc: '4.9 s', engine: '3.0L Inline-6', fuel: 'Petrol', price: '$117,750', image: '/src/assets/images/diag_mb_s_class_1795015701487.jpg', description: 'Flagship luxury sedan with exceptional comfort and refinement.' },
  { brand: 'Mercedes-Benz', model: 'AMG G 63', year: 2025, type: 'SUV', hp: 577, torque: 850, top: 220, acc: '4.5 s', engine: '4.0L Twin-Turbo V8', fuel: 'Petrol', price: '$186,100', image: '/src/assets/images/diag_mb_amg_g63_1795015702756.jpg', description: 'An iconic luxury off-road SUV with powerful performance.' },
  { brand: 'Mercedes-Benz', model: 'AMG GT', year: 2025, type: 'Sports Car', hp: 577, torque: 800, top: 315, acc: '3.2 s', engine: '4.0L Twin-Turbo V8', fuel: 'Petrol', price: '$137,550', image: '/src/assets/images/diag_mb_amg_gt_1795015704081.jpg', description: 'A luxury performance car with sporty styling and engineering.' },
  { brand: 'Mercedes-Benz', model: 'EQS', year: 2025, type: 'Electric', hp: 355, torque: 800, top: 210, acc: '6.2 s', engine: 'Electric Motor', fuel: 'Electric', price: '$104,400', image: '/src/assets/images/diag_mb_eqs_1795015704644.jpg', description: 'An electric luxury sedan featuring modern technology.' },
  { brand: 'Land Rover', model: 'Range Rover', year: 2025, type: 'SUV', hp: 395, torque: 550, top: 225, acc: '5.8 s', engine: '3.0L Inline-6', fuel: 'Petrol', price: '$107,900', image: '/src/assets/images/diag_lr_range_rover_1795015704110.jpg', description: 'Luxury SUV combining elegance and all-terrain capability.' },
  { brand: 'Land Rover', model: 'Range Rover Sport', year: 2025, type: 'SUV', hp: 395, torque: 550, top: 225, acc: '5.5 s', engine: '3.0L Inline-6', fuel: 'Petrol', price: '$83,700', image: '/src/assets/images/diag_lr_rr_sport_1795015705167.jpg', description: 'A sporty luxury SUV designed for performance and comfort.' },
  { brand: 'Land Rover', model: 'Defender 110', year: 2025, type: 'SUV', hp: 395, torque: 550, top: 210, acc: '6.0 s', engine: '3.0L Inline-6', fuel: 'Petrol', price: '$60,800', image: '/src/assets/images/diag_lr_defender_110_1795015745411.jpg', description: 'A versatile off-road SUV built for adventure.' },
  { brand: 'Porsche', model: '911 Carrera', year: 2025, type: 'Sports Car', hp: 388, torque: 450, top: 295, acc: '4.1 s', engine: '3.0L Twin-Turbo Flat-6', fuel: 'Petrol', price: '$120,100', image: '/src/assets/images/diag_porsche_911_carrera_1795015744673.jpg', description: 'An iconic sports car combining timeless design and performance.' },
  { brand: 'Porsche', model: '911 GT3 RS', year: 2025, type: 'Sports Car', hp: 518, torque: 465, top: 296, acc: '3.2 s', engine: '4.0L Flat-6', fuel: 'Petrol', price: '$241,300', image: '/src/assets/images/diag_porsche_911_gt3rs_1795015745453.jpg', description: 'A track-focused machine designed for extreme driving performance.' },
  { brand: 'Porsche', model: 'Cayenne', year: 2025, type: 'SUV', hp: 348, torque: 500, top: 248, acc: '6.0 s', engine: '3.0L V6', fuel: 'Petrol', price: '$84,700', image: '/src/assets/images/diag_porsche_cayenne_1795015746881.jpg', description: 'A sporty luxury SUV combining comfort and dynamic driving.' },
  { brand: 'Porsche', model: 'Taycan Turbo S', year: 2025, type: 'Electric', hp: 938, torque: 1100, top: 260, acc: '2.4 s', engine: 'Dual Electric Motors', fuel: 'Electric', price: '$209,000', image: '/src/assets/images/diag_porsche_taycan_turbos_1795015746358.jpg', description: 'A high-performance electric sports sedan.' },
  { brand: 'Porsche', model: 'Macan Electric', year: 2025, type: 'Electric', hp: 630, torque: 1130, top: 260, acc: '3.3 s', engine: 'Dual Electric Motors', fuel: 'Electric', price: '$105,300', image: '/src/assets/images/diag_porsche_macan_ev_1795015747230.jpg', description: 'An electric SUV with Porsche performance and design.' },
  { brand: 'Pagani', model: 'Zonda R', year: 2010, type: 'Hypercar', hp: 740, torque: 710, top: 350, acc: '2.7 s', engine: '6.0L V12', fuel: 'Petrol', price: '$1,900,000', image: '/src/assets/images/diag_pagani_zonda_r_1795015746953.jpg', description: 'An exclusive track hypercar featuring handcrafted engineering.' },
  { brand: 'Pagani', model: 'Huayra', year: 2022, type: 'Hypercar', hp: 730, torque: 1000, top: 370, acc: '3.0 s', engine: '6.0L Twin-Turbo V12', fuel: 'Petrol', price: '$1,400,000', image: '/src/assets/images/diag_pagani_huayra_1795015747370.jpg', description: 'A beautifully engineered hypercar with advanced aerodynamics.' },
  { brand: 'Pagani', model: 'Utopia', year: 2024, type: 'Hypercar', hp: 852, torque: 1100, top: 350, acc: 'Approx. 3 s', engine: '6.0L Twin-Turbo V12', fuel: 'Petrol', price: '$2,190,000', image: '/src/assets/images/diag_pagani_utopia_1795015747831.jpg', description: 'A modern hypercar combining art, engineering and performance.' },
  { brand: 'Ferrari', model: '296 GTB', year: 2025, type: 'Supercar', hp: 819, torque: 740, top: 330, acc: '2.9 s', engine: '3.0L V6 Hybrid', fuel: 'Hybrid', price: '$342,205', image: '/src/assets/images/diag_ferrari_296_gtb_1795015749250.jpg', description: 'A hybrid Ferrari combining advanced technology and performance.' },
  { brand: 'Ferrari', model: 'SF90 Stradale', year: 2025, type: 'Supercar', hp: 986, torque: 800, top: 340, acc: '2.5 s', engine: 'V8 Hybrid', fuel: 'Hybrid', price: '$524,815', image: '/src/assets/images/diag_ferrari_sf90_stradale_1795015749561.jpg', description: 'A powerful hybrid supercar with advanced performance.' },
  { brand: 'Lamborghini', model: 'Revuelto', year: 2025, type: 'Supercar', hp: 1001, torque: 725, top: 350, acc: '2.5 s', engine: 'V12 Hybrid', fuel: 'Hybrid', price: '$608,358', image: '/src/assets/images/diag_lambo_revuelto_1795015750608.jpg', description: 'A flagship hybrid Lamborghini with dramatic styling.' },
  { brand: 'Lamborghini', model: 'Huracan', year: 2024, type: 'Supercar', hp: 631, torque: 565, top: 325, acc: '2.9 s', engine: '5.2L V10', fuel: 'Petrol', price: '$249,865', image: '/src/assets/images/diag_lambo_huracan_1795015767273.jpg', description: 'A celebrated V10 Lamborghini sports car.' },
  { brand: 'Lamborghini', model: 'Urus SE', year: 2025, type: 'SUV', hp: 789, torque: 950, top: 312, acc: '3.4 s', engine: '4.0L V8 Hybrid', fuel: 'Hybrid', price: '$258,000', image: '/src/assets/images/diag_lambo_urus_se_1795015769038.jpg', description: 'A high-performance luxury SUV with hybrid technology.' },
  { brand: 'Bugatti', model: 'Chiron', year: 2024, type: 'Hypercar', hp: 1500, torque: 1600, top: 420, acc: '2.4 s', engine: '8.0L Quad-Turbo W16', fuel: 'Petrol', price: '$3,000,000', image: '/src/assets/images/diag_bugatti_chiron_1795015768819.jpg', description: 'An iconic hypercar known for extraordinary performance.' },
  { brand: 'Bugatti', model: 'Tourbillon', year: 2026, type: 'Hypercar', hp: 1800, torque: 1000, top: 445, acc: 'Under 2 s (claimed)', engine: 'V16 Hybrid', fuel: 'Hybrid', price: '$4,100,000', image: '/src/assets/images/diag_bugatti_tourbillon_1795015771012.jpg', description: 'A next-generation hypercar with hybrid engineering.' },
  { brand: 'McLaren', model: '750S', year: 2025, type: 'Supercar', hp: 740, torque: 800, top: 332, acc: '2.8 s', engine: '4.0L Twin-Turbo V8', fuel: 'Petrol', price: '$324,000', image: '/src/assets/images/diag_mclaren_750s_1795015770656.jpg', description: 'A lightweight supercar focused on driving performance.' },
  { brand: 'McLaren', model: 'Artura', year: 2025, type: 'Supercar', hp: 690, torque: 720, top: 330, acc: '3.0 s', engine: '3.0L V6 Hybrid', fuel: 'Hybrid', price: '$254,100', image: '/src/assets/images/diag_mclaren_artura_1795015771795.jpg', description: 'A hybrid supercar with advanced lightweight construction.' },
  { brand: 'Aston Martin', model: 'DB12', year: 2025, type: 'Sports Car', hp: 671, torque: 800, top: 325, acc: '3.6 s', engine: '4.0L Twin-Turbo V8', fuel: 'Petrol', price: '$248,000', image: '/src/assets/images/diag_aston_db12_1795015771686.jpg', description: 'A grand touring car with luxury and powerful performance.' },
  { brand: 'Rolls-Royce', model: 'Phantom', year: 2025, type: 'Luxury Sedan', hp: 563, torque: 900, top: 250, acc: '5.3 s', engine: '6.75L Twin-Turbo V12', fuel: 'Petrol', price: '$517,750', image: '/src/assets/images/diag_rr_phantom_1795015773273.jpg', description: 'A flagship luxury car focused on craftsmanship and comfort.' },
  { brand: 'Rolls-Royce', model: 'Cullinan', year: 2025, type: 'SUV', hp: 563, torque: 850, top: 250, acc: '5.2 s', engine: '6.75L Twin-Turbo V12', fuel: 'Petrol', price: '$410,350', image: '/src/assets/images/diag_rr_cullinan_1795015772933.jpg', description: 'A premium SUV with exclusive luxury and refined design.' },
  { brand: 'Tesla', model: 'Model S Plaid', year: 2025, type: 'Electric', hp: 1020, torque: 1420, top: 322, acc: '2.1 s', engine: 'Tri-Motor Electric', fuel: 'Electric', price: '$89,990', image: '/src/assets/images/diag_tesla_model_s_plaid_1795015773249.jpg', description: 'An electric performance sedan with advanced technology.' },
  { brand: 'Tesla', model: 'Model 3', year: 2025, type: 'Electric', hp: 450, torque: 600, top: 260, acc: '3.1 s', engine: 'Electric Motors', fuel: 'Electric', price: '$42,490', image: '/src/assets/images/diag_tesla_model_3_1795015773840.jpg', description: 'A popular electric sedan designed for everyday driving.' },
  { brand: 'Toyota', model: 'Supra', year: 2025, type: 'Sports Car', hp: 382, torque: 500, top: 250, acc: '3.9 s', engine: '3.0L Turbo Inline-6', fuel: 'Petrol', price: '$56,250', image: '/src/assets/images/diag_toyota_supra_1795015774010.jpg', description: 'A sporty coupe with exciting performance.' },
  { brand: 'Toyota', model: 'Land Cruiser', year: 2025, type: 'SUV', hp: 326, torque: 630, top: 180, acc: '6.7 s', engine: 'Hybrid Turbo Engine', fuel: 'Hybrid', price: '$56,700', image: '/src/assets/images/diag_toyota_land_cruiser_1795015792457.jpg', description: 'An iconic off-road SUV built for durability.' },
  { brand: 'Honda', model: 'Civic Type R', year: 2025, type: 'Sports Car', hp: 315, torque: 420, top: 272, acc: '5.4 s', engine: '2.0L Turbo', fuel: 'Petrol', price: '$45,595', image: '/src/assets/images/diag_honda_civic_typer_1795015794869.jpg', description: 'A performance hatchback with precision handling.' },
  { brand: 'Nissan', model: 'GT-R', year: 2024, type: 'Sports Car', hp: 565, torque: 633, top: 315, acc: '2.9 s', engine: '3.8L Twin-Turbo V6', fuel: 'Petrol', price: '$121,090', image: '/src/assets/images/diag_nissan_gtr_1795015795142.jpg', description: 'A legendary Japanese performance car.' },
  { brand: 'Ford', model: 'Mustang GT', year: 2025, type: 'Muscle Car', hp: 480, torque: 563, top: 250, acc: '4.4 s', engine: '5.0L V8', fuel: 'Petrol', price: '$45,460', image: '/src/assets/images/diag_ford_mustang_gt_1795015794946.jpg', description: 'An iconic American muscle car.' },
  { brand: 'Chevrolet', model: 'Corvette Z06', year: 2025, type: 'Sports Car', hp: 670, torque: 623, top: 315, acc: '2.6 s', engine: '5.5L V8', fuel: 'Petrol', price: '$112,700', image: '/src/assets/images/diag_corvette_z06_1795015796970.jpg', description: 'A high-performance American sports car.' },
  { brand: 'Dodge', model: 'Charger Daytona', year: 2025, type: 'Electric', hp: 670, torque: 850, top: 220, acc: '3.3 s', engine: 'Electric Motors', fuel: 'Electric', price: '$59,595', image: '/src/assets/images/diag_dodge_charger_ev_1795015797424.jpg', description: 'An electric performance car inspired by muscle-car heritage.' },
  { brand: 'Audi', model: 'RS7', year: 2025, type: 'Sports Sedan', hp: 621, torque: 850, top: 305, acc: '3.4 s', engine: '4.0L Twin-Turbo V8', fuel: 'Petrol', price: '$127,800', image: '/src/assets/images/diag_audi_rs7_1795015797707.jpg', description: 'A powerful luxury performance sedan.' },
  { brand: 'Audi', model: 'R8', year: 2024, type: 'Supercar', hp: 602, torque: 560, top: 330, acc: '3.2 s', engine: '5.2L V10', fuel: 'Petrol', price: '$158,600', image: '/src/assets/images/diag_audi_r8_1795015797845.jpg', description: "Audi's legendary V10 supercar." },
  { brand: 'Lexus', model: 'LC 500', year: 2025, type: 'Luxury Coupe', hp: 471, torque: 540, top: 270, acc: '4.4 s', engine: '5.0L V8', fuel: 'Petrol', price: '$100,425', image: '/src/assets/images/diag_lexus_lc500_1795015799166.jpg', description: 'A luxury coupe with elegant styling and a V8 engine.' },
  { brand: 'Hyundai', model: 'IONIQ 5 N', year: 2025, type: 'Electric', hp: 641, torque: 770, top: 260, acc: '3.4 s', engine: 'Dual Electric Motors', fuel: 'Electric', price: '$66,100', image: '/src/assets/images/diag_hyundai_ioniq5n_1795015799487.jpg', description: 'A performance electric car with sporty driving features.' },
  { brand: 'BYD', model: 'Seal', year: 2025, type: 'Electric', hp: 523, torque: 670, top: 200, acc: '3.8 s', engine: 'Dual Electric Motors', fuel: 'Electric', price: '$45,000', image: '/src/assets/images/diag_byd_seal_1795015801747.jpg', description: 'An electric sedan offering technology and performance.' },
  { brand: 'Mahindra', model: 'Thar', year: 2025, type: 'SUV', hp: 150, torque: 320, top: 155, acc: 'Varies', engine: 'Turbo Engine', fuel: 'Petrol/Diesel', price: '$15,500', image: '/src/assets/images/diag_mahindra_thar_1795015800090.jpg', description: 'A popular adventure-oriented off-road SUV.' },
  { brand: 'Tata', model: 'Harrier', year: 2025, type: 'SUV', hp: 170, torque: 350, top: 195, acc: 'Varies', engine: 'Diesel Engine', fuel: 'Diesel', price: '$18,500', image: '/src/assets/images/diag_tata_harrier_1795015800473.jpg', description: 'A premium Indian SUV with modern features.' },
];

const rawCars: Omit<CarSpec, 'id' | 'archetype' | 'defaultColor'>[] = [
  ...baseCars,
  ...expandTuples(CATALOG_PART_A),
  ...expandTuples(CATALOG_PART_B),
];

const brandColorPalette: Record<string, string> = {
  BMW: '#173e83',
  'Mercedes-Benz': '#9ea6b3',
  'Land Rover': '#19804b',
  Porsche: '#d6b45d',
  Pagani: '#c5ccd6',
  Ferrari: '#c60022',
  Lamborghini: '#d6b45d',
  Bugatti: '#164b9a',
  McLaren: '#e0661e',
  'Aston Martin': '#19804b',
  'Rolls-Royce': '#1f2430',
  Tesla: '#b81d2b',
  Toyota: '#c60022',
  Honda: '#c60022',
  Nissan: '#a6aeb9',
  Ford: '#173e83',
  Chevrolet: '#c60022',
  Dodge: '#b81d2b',
  Audi: '#9ea6b3',
  Lexus: '#313a4a',
  Hyundai: '#3a72b8',
  BYD: '#2a5a9e',
  Mahindra: '#9b2b2b',
  Tata: '#284a7e',
};

function inferArchetype(type: string, model: string): BodyArchetype {
  const t = type.toLowerCase();
  const m = model.toLowerCase();
  if (t.includes('hypercar')) return 'hypercar';
  if (t.includes('supercar')) return 'supercar';
  if (t.includes('suv') || m.includes('macan') || m.includes('ioniq 5')) return 'suv';
  if (t.includes('muscle') || m.includes('charger')) return 'muscle';
  if (t.includes('coupe') || m.includes('supra') || m.includes('gt-r') || m.includes('db12')) return 'coupe';
  if (t.includes('sedan') || m.includes('model s') || m.includes('model 3') || m.includes('eqs') || m.includes('i7') || m.includes('taycan') || m.includes('seal')) return 'sedan';
  return 'sports';
}

export const CARS: CarSpec[] = rawCars.map((car) => ({
  ...car,
  id: `${car.brand}-${car.model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  archetype: inferArchetype(car.type, car.model),
  defaultColor: brandColorPalette[car.brand] ?? '#c60022',
}));

export const BRANDS: string[] = ['All', ...Array.from(new Set(CARS.map((c) => c.brand)))];

export const CATEGORY_OPTIONS: string[] = [
  'All',
  'SUV',
  'Sedan',
  'Sports Car',
  'Supercar',
  'Hypercar',
  'Electric',
  'Coupe',
  'Muscle Car',
];
