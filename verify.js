import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

const DATA_DIR = path.resolve('backend/data');
const UPLOADS_DIR = path.resolve('public/uploads');

console.log('====================================================');
console.log('      NAVA THARANGALU VALIDATION & SEEDING SCRIPT');
console.log('====================================================');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Check and write seeding datasets
const articlesFile = path.join(DATA_DIR, 'articles.json');
const breakingFile = path.join(DATA_DIR, 'breaking.json');
const adsFile = path.join(DATA_DIR, 'ads.json');
const epaperFile = path.join(DATA_DIR, 'epaper.json');
const videosFile = path.join(DATA_DIR, 'videos.json');
const galleriesFile = path.join(DATA_DIR, 'galleries.json');

// Write helpers
function checkAndSeed(filePath, data, label) {
  if (!fs.existsSync(filePath) || JSON.parse(fs.readFileSync(filePath, 'utf8')).length === 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ Seeded ${label} to ${path.basename(filePath)}`);
  } else {
    console.log(`- ${label} already seeded.`);
  }
}

// 1. Mock Telugu Articles
const mockArticles = [
  {
    id: 1,
    title: "అమరావతి లో కొత్త ఐటీ హబ్ ప్రారంభం - వేలాది యువతకు ఉద్యోగాలు",
    content: "ఆంధ్రప్రదేశ్ రాజధాని అమరావతి లో నూతన సమాచార సాంకేతిక (IT) కేంద్రాన్ని రాష్ట్ర ముఖ్యమంత్రి నేడు ప్రారంభించారు. ఈ కొత్త ఐటీ హబ్ ద్వారా సుమారు 10,000 మంది స్థానిక యువతకు సాఫ్ట్‌వేర్ రంగంలో ఉద్యోగ అవకాశాలు లభించనున్నాయి. పారిశ్రామిక వేత్తలను ఆకర్షించేందుకు ప్రభుత్వం కల్పించిన నూతన రాయితీలు ఈ అభివృద్ధికి దోహదపడ్డాయని అధికారులు తెలిపారు. రాబోయే రెండేళ్లలో మరిన్ని అంతర్జాతీయ సంస్థలు ఇక్కడ తమ కార్యాలయాలను స్థాపించేందుకు ఆసక్తి చూపుతున్నాయని ఐటీ శాఖ వెల్లడించింది.",
    description: "అమరావతి లో నూతన ఐటీ కేంద్రం ప్రారంభం కావడం వల్ల 10,000 మందికి ఉద్యోగ అవకాశాలు లభించనున్నాయి.",
    slug: "amaravati-new-it-hub-jobs",
    featuredImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80"
    ],
    author: "Reporter Amaravati",
    category: "andhra-pradesh",
    subcategory: "amaravati",
    tags: ["ఆంధ్రప్రదేశ్", "అమరావతి", "ఐటీహబ్", "ఉద్యోగాలు"],
    status: "Published",
    breakingStatus: true,
    featuredStatus: true,
    viewCount: 154,
    publishedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seoTitle: "అమరావతి ఐటీ హబ్ ప్రారంభం | నవ తరంగాలు",
    seoDescription: "అమరావతి ఐటీ హబ్ ప్రారంభం మరియు ఉద్యోగాల సమాచారం.",
    socialSharingImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    title: "హైదరాబాద్ మెట్రో రైలు రెండో దశ విస్తరణకు గ్రీన్ సిగ్నల్ - రూ. 8,000 కోట్ల బడ్జెట్",
    content: "తెలంగాణ ప్రభుత్వం హైదరాబాద్ మెట్రో రైలు ప్రాజెక్ట్ రెండో దశ విస్తరణకు పరిపాలనా అనుమతులు మంజూరు చేసింది. ఈ విస్తరణలో భాగంగా శంషాబాద్ విమానాశ్రయం మరియు గచ్చిబౌలి ఐటీ కారిడార్లకు కనెక్టివిటీ లభించనుంది. మొత్తం రూ. 8,000 కోట్ల వ్యయంతో సుమారు 45 కిలోమీటర్ల మేర కొత్త మార్గాలను నిర్మించనున్నారు. ప్రజా రవాణాను సులభతరం చేసేందుకు మరియు ట్రాఫిక్ సమస్యలను తగ్గించేందుకు ఈ ప్రాజెక్ట్ అత్యంత కీలకమని రవాణా శాఖ మంత్రి పేర్కొన్నారు.",
    description: "రూ. 8,000 కోట్ల బడ్జెట్‌తో శంషాబాద్ ఎయిర్‌పోర్టు మరియు ఐటీ హబ్‌లను కలుపుతూ హైదరాబాద్ మెట్రో విస్తరణ.",
    slug: "hyderabad-metro-phase-two-approved",
    featuredImage: "https://images.unsplash.com/photo-1557340381-358b3c79a957?auto=format&fit=crop&w=800&q=80",
    additionalImages: [],
    author: "Editor In-Chief",
    category: "telangana",
    subcategory: "hyderabad",
    tags: ["తెలంగాణ", "హైదరాబాద్", "మెట్రో", "రవాణా"],
    status: "Published",
    breakingStatus: false,
    featuredStatus: true,
    viewCount: 98,
    publishedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seoTitle: "హైదరాబాద్ మెట్రో రెండో దశ విస్తరణకు ఆమోదం",
    seoDescription: "హైదరాబాద్ మెట్రో విస్తరణ బడ్జెట్ వివరాలు.",
    socialSharingImage: "https://images.unsplash.com/photo-1557340381-358b3c79a957?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    title: "కేంద్ర బడ్జెట్‌లో గ్రామీణ రంగానికి భారీ కేటాయింపులు - వ్యవసాయ రంగానికి ఊతం",
    content: "కేంద్ర ప్రభుత్వం లోక్‌సభలో ప్రవేశపెట్టిన వార్షిక బడ్జెట్‌లో గ్రామీణ అభివృద్ధి మరియు వ్యవసాయ రంగానికి రికార్డు స్థాయిలో నిధులు కేటాయించింది. ప్రధానమంత్రి కిసాన్ సమ్మాన్ నిధి, ఉచిత పంటల బీమా పథకం, మరియు గ్రామీణ రోడ్ల విస్తరణకు నిధులను పెంచారు. సేంద్రీయ వ్యవసాయాన్ని ప్రోత్సహించేందుకు ప్రత్యేక క్లస్టర్లను ఏర్పాటు చేయనున్నట్లు బడ్జెట్ ప్రసంగంలో ఆర్థిక మంత్రి ప్రకటించారు. ఈ కేటాయింపులపై దేశవ్యాప్తంగా రైతుల నుండి సానుకూల స్పందన వ్యక్తమవుతోంది.",
    description: "కేంద్ర బడ్జెట్‌లో వ్యవసాయ మరియు గ్రామీణ రంగానికి పెరిగిన నిధులు, సేంద్రీయ వ్యవసాయానికి ప్రాధాన్యత.",
    slug: "budget-agriculture-rural-allocations",
    featuredImage: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    additionalImages: [],
    author: "Editor In-Chief",
    category: "national",
    subcategory: null,
    tags: ["జాతీయం", "బడ్జెట్", "వ్యవసాయం", "రైతులు"],
    status: "Published",
    breakingStatus: true,
    featuredStatus: false,
    viewCount: 42,
    publishedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seoTitle: "వ్యవసాయ బడ్జెట్ కేటాయింపులు",
    seoDescription: "కేంద్ర బడ్జెట్ మరియు గ్రామీణ రంగానికి నిధులు."
  },
  {
    id: 4,
    title: "సంక్రాంతి రేసులో స్టార్ హీరోల చిత్రాల సందడి - విడుదల తేదీలు ఖరారు",
    content: "తెలుగు ప్రేక్షకులు ఎంతగానో ఎదురుచూసే సంక్రాంతి సినిమా పండగ హంగామా మొదలైంది. టాలీవుడ్ స్టార్ హీరోల మూడు పెద్ద బడ్జెట్ చిత్రాలు జనవరి రెండో వారంలో థియేటర్లలోకి రానున్నాయి. ఈ చిత్రాల నిర్మాతలు అధికారిక విడుదల తేదీలను మరియు ప్రమోషనల్ ట్రైలర్లను ఈ రోజు విడుదల చేసారు. థియేటర్ల కేటాయింపు మరియు టికెట్ల ధరల విషయమై నిర్మాతల మండలి ప్రభుత్వ అధికారులతో చర్చలు జరుపుతోంది. పండగ సెలవుల్లో బాక్సాఫీస్ వద్ద భారీ కలెక్షన్ల వర్షం కురుస్తుందని విశ్లేషకులు భావిస్తున్నారు.",
    description: "సంక్రాంతి పండుగ వేళ భారీ బడ్జెట్ సినిమాల విడుదల తేదీలు మరియు బాక్సాఫీస్ అంచనాలు.",
    slug: "sankranti-movies-release-dates-telugu",
    featuredImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    additionalImages: [],
    author: "Reporter Amaravati",
    category: "cinema",
    subcategory: null,
    tags: ["సినిమా", "సంక్రాంతి", "టాలీవుడ్", "హీరోలు"],
    status: "Published",
    breakingStatus: false,
    featuredStatus: false,
    viewCount: 310,
    publishedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seoTitle: "సంక్రాంతి సినిమా వార్తలు | టాలీవుడ్"
  },
  {
    id: 5,
    title: "ప్రపంచ ఛాంపియన్‌షిప్‌లో భారత్‌కు స్వర్ణ పతకం - చరిత్ర సృష్టించిన క్రీడాకారులు",
    content: "అంతర్జాతీయ అథ్లెటిక్స్ ఛాంపియన్‌షిప్‌లో భారత్ అద్భుత ఘనత సాధించింది. పురుషుల జావలిన్ త్రో విభాగంలో భారత స్టార్ క్రీడాకారుడు అద్భుతమైన ప్రదర్శనతో 90.5 మీటర్ల దూరం విసిరి ప్రథమ స్థానాన్ని కైవసం చేసుకుని దేశానికి బంగారు పతకాన్ని అందించారు. ఈ విజయంతో భారత జట్టు ప్రపంచ పట్టికలో తన స్థానాన్ని మెరుగుపరుచుకుంది. క్రీడాకారుడి ప్రతిభను అభినందిస్తూ రాష్ట్రపతి మరియు ప్రధానమంత్రి ప్రత్యేక సందేశాలు పంపారు.",
    description: "జావలిన్ త్రో లో భారత్ కు బంగారు పతకం సాధించిన స్టార్ అథ్లెట్.",
    slug: "india-gold-medal-world-championships",
    featuredImage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    additionalImages: [],
    author: "Reporter Amaravati",
    category: "sports",
    subcategory: null,
    tags: ["క్రీడలు", "బంగారుపతకం", "జావలిన్", "భారత్"],
    status: "Published",
    breakingStatus: false,
    featuredStatus: true,
    viewCount: 140,
    publishedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seoTitle: "భారత క్రీడల స్వర్ణ పతకం"
  },
  {
    id: 6,
    title: "వ్యవసాయంలో డ్రోన్ల వినియోగం - ఖర్చులు తగ్గిస్తూ దిగుబడులు పెంచుతున్న రైతులు",
    content: "వ్యవసాయ రంగంలో సాంకేతిక పరిజ్ఞానం శరవేగంగా విస్తరిస్తోంది. ముఖ్యంగా ఉభయ తెలుగు రాష్ట్రాల్లో రైతులు డ్రోన్ల సహాయంతో పురుగుమందుల పిచికారీ చేయడంపై ఆసక్తి చూపుతున్నారు. ఇదివరకటితో పోలిస్తే సమయం వృధా కాకుండా, కూలీల కొరతను అధిగమిస్తూ, అతి తక్కువ ఖర్చుతో ఎరువులను చల్లుతున్నారు. ప్రభుత్వాలు కూడా రైతు సంఘాలకు రాయితీపై డ్రోన్లను అందజేస్తూ శిక్షణా శిబిరాలను ఏర్పాటు చేస్తున్నాయి.",
    description: "డ్రోన్ టెక్నాలజీతో స్మార్ట్ వ్యవసాయం - సమయం మరియు ఖర్చులు ఆదా.",
    slug: "drone-technology-agriculture-benefits",
    featuredImage: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    additionalImages: [],
    author: "Reporter Amaravati",
    category: "agriculture",
    subcategory: null,
    tags: ["వ్యవసాయం", "డ్రోన్", "రైతు", "సాంకేతికత"],
    status: "Published",
    breakingStatus: false,
    featuredStatus: false,
    viewCount: 55,
    publishedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seoTitle: "వ్యవసాయంలో డ్రోన్ సాంకేతిక పరిజ్ఞానం"
  }
];

checkAndSeed(articlesFile, mockArticles, 'Telugu News Articles');

// 2. Mock Breaking News
const mockBreaking = [
  { id: 1, text: "అమరావతి లో నూతన ఐటీ కేంద్రాన్ని ప్రారంభించిన ముఖ్యమంత్రి. వేలాది మందికి ఉద్యోగావకాశాలు.", priority: 3, active: true, startTime: null, expirationTime: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, text: "భారత క్రీడాకారుడికి ప్రపంచ అథ్లెటిక్స్ లో స్వర్ణ పతకం సాధన - రాష్ట్రపతి అభినందనలు.", priority: 2, active: true, startTime: null, expirationTime: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

checkAndSeed(breakingFile, mockBreaking, 'Breaking News Tickers');

// 3. Mock Ads
const mockAds = [
  { id: 1, name: "డెమో ఆఫర్లు", zone: "header-ad", imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=728&h=90&q=80", targetUrl: "https://google.com", active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, name: "డెమో సైడ్", zone: "sidebar-ad", imageUrl: "https://images.unsplash.com/photo-1444653300606-1d7ea01c802b?auto=format&fit=crop&w=300&h=250&q=80", targetUrl: "https://google.com", active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

checkAndSeed(adsFile, mockAds, 'Advertisements Banners');

// 4. Mock E-Papers
const mockEpaper = [
  { id: 1, title: "నవ తరంగాలు అమరావతి సంచిక", date: new Date().toISOString().split('T')[0], pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

checkAndSeed(epaperFile, mockEpaper, 'EPaper Publications');

// 5. Mock Videos
const mockVideos = [
  { id: 1, title: "అమరావతి ఐటీ హబ్ ప్రారంభోత్సవం - ముఖ్యమంత్రి ప్రసంగం", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnailUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=400&q=80", category: "Videos", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

checkAndSeed(videosFile, mockVideos, 'Video News Links');

// 6. Mock Photo Galleries
const mockGalleries = [
  { 
    id: 1, 
    title: "నవ తరంగాలు అమరావతి కార్యాలయం ఫోటోలు", 
    description: "విజయవాడ లో నూతనంగా ప్రారంభమైన నవ తరంగాలు ప్రధాన కార్యాలయ సుందర దృశ్యాలు.", 
    images: [
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80"
    ], 
    category: "Photo Gallery", 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  }
];

checkAndSeed(galleriesFile, mockGalleries, 'Photo Albums');

console.log('\nStarting Frontend Compilation/Build Verification...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✓ Frontend Vite Build Completed Successfully with Zero Errors!');
  console.log('\n====================================================');
  console.log(' VALIDATION SUCCESSFUL - APPLICATION IS READY FOR RUNNING!');
  console.log('====================================================');
} catch (e) {
  console.error('✕ Vite build failed. Please verify syntax in files.', e);
  process.exit(1);
}
