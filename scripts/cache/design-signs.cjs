/* ============================================================================
   THE ASTROLAB ATLAS — SIGNS DATA TABLE  (drop-in for the constellation renderer)
   ----------------------------------------------------------------------------
   One record per zodiac territory. The renderer (buildProjector + render) needs
   NO per-sign geometry tuning — it gnomonic-projects each field on its own mean
   direction and auto-fits to the hero box. To add/replace a sign, edit only data.

   Record shape:
     stars  : [{ id, ra (HOURS, 0–24), dec (DEGREES), mag, faint? }]
     lines  : [[idA, idB], …]   stick-figure; ids MUST match a star id above
     sigil  : { k, paths:[…] }  glyph in local coords (~±70), drawn at field centre
     ed     : editorial copy (HTML allowed in eyebrow/name/attr)

   Star positions are J2000 equatorial coordinates from standard bright-star data
   (rounded). Line-figures follow the conventional IAU asterisms. Sigils are
   stylised engravings — refine freely; they do not affect projection.
   ============================================================================ */
const SIGNS = {

  aries: {
    plate:'Plate I / XII',
    stars:[
      {id:'hamal',    ra:2.119, dec:23.46, mag:2.00},
      {id:'sheratan', ra:1.911, dec:20.81, mag:2.64},
      {id:'mesarthim',ra:1.892, dec:19.29, mag:3.86},
      {id:'b41',      ra:2.832, dec:27.26, mag:3.61},
      {id:'delta',    ra:3.215, dec:19.73, mag:4.35, faint:true},
      {id:'epsilon',  ra:2.998, dec:21.34, mag:4.63, faint:true}
    ],
    lines:[['b41','hamal'],['hamal','sheratan'],['sheratan','mesarthim']],
    sigil:{k:1.0,paths:['M3,40 C3,4 -26,10 -30,-24 C-32,-44 -52,-40 -47,-18','M-3,40 C-3,4 26,10 30,-24 C32,-44 52,-40 47,-18']},
    ed:{eyebrow:'Territory <b>I</b> · Cardinal Fire',name:'The Forge of<em>First Fire</em>',
        tagline:'Where the year is struck into being.',
        attr:'Courage <span class="sep">·</span> Ignition <span class="sep">·</span> Beginning',
        lede:'The first territory, where the wheel catches and turns over — the raw spark before form, before doubt, before the long elaboration of everything that follows.',
        plaque:'Begin the reading',
        cap:'<span><b>Aries</b> — the Ram</span><span>441 sq. degrees</span><span>α Hamal · the Ram\u2019s Brow</span><span>Ptolemy, 2\u207F\u1D48 century</span>'}
  },

  taurus: {
    plate:'Plate II / XII',
    stars:[
      {id:'aldebaran',ra:4.599, dec:16.51, mag:0.85},
      {id:'elnath',   ra:5.438, dec:28.61, mag:1.65},
      {id:'zeta',     ra:5.627, dec:21.14, mag:3.00},
      {id:'theta2',   ra:4.477, dec:15.87, mag:3.40},
      {id:'gamma',    ra:4.330, dec:15.63, mag:3.65},
      {id:'delta',    ra:4.382, dec:17.54, mag:3.76},
      {id:'epsilon',  ra:4.477, dec:19.18, mag:3.53},
      {id:'lambda',   ra:4.011, dec:12.49, mag:3.40},
      {id:'xi',       ra:3.452, dec:9.73,  mag:3.70},
      {id:'omicron',  ra:3.413, dec:9.03,  mag:3.60}
    ],
    lines:[['zeta','aldebaran'],['aldebaran','theta2'],['theta2','gamma'],['gamma','delta'],
      ['delta','epsilon'],['epsilon','elnath'],['gamma','lambda'],['lambda','xi'],['xi','omicron']],
    sigil:{k:1.0,paths:['M0,20 m-24,0 a24,24 0 1,0 48,0 a24,24 0 1,0 -48,0','M-30,-12 C-22,-40 22,-40 30,-12']},
    ed:{eyebrow:'Territory <b>II</b> · Fixed Earth',name:'The Standing<em>Field</em>',
        tagline:'Where nothing is hurried and nothing is lost.',
        attr:'Patience <span class="sep">·</span> Devotion <span class="sep">·</span> Abundance',
        lede:'The second territory, where the spark of the first hardens into ground — the slow, rooted wealth of a thing that simply refuses to be rushed.',
        plaque:'Begin the reading',
        cap:'<span><b>Taurus</b> — the Bull</span><span>797 sq. degrees</span><span>α Aldebaran · the Eye</span><span>Ptolemy, 2\u207F\u1D48 century</span>'}
  },

  gemini: {
    plate:'Plate III / XII',
    stars:[
      {id:'castor',  ra:7.577, dec:31.89, mag:1.58},
      {id:'pollux',  ra:7.755, dec:28.03, mag:1.16},
      {id:'alhena',  ra:6.629, dec:16.40, mag:1.90},
      {id:'wasat',   ra:7.335, dec:21.98, mag:3.50},
      {id:'mebsuta', ra:6.732, dec:25.13, mag:3.00},
      {id:'mekbuda', ra:7.068, dec:20.57, mag:3.79},
      {id:'tejat',   ra:6.383, dec:22.51, mag:2.87},
      {id:'propus',  ra:6.248, dec:22.51, mag:3.31},
      {id:'alzirr',  ra:6.755, dec:12.90, mag:3.35},
      {id:'kappa',   ra:7.741, dec:24.40, mag:3.57},
      {id:'theta',   ra:6.883, dec:33.96, mag:3.60},
      {id:'iota',    ra:7.430, dec:27.79, mag:3.78},
      {id:'tau',     ra:7.186, dec:30.25, mag:4.41},
      {id:'lambda',  ra:7.300, dec:16.54, mag:3.58},
      {id:'nu',      ra:6.490, dec:20.21, mag:4.13}
    ],
    lines:[['castor','tau'],['tau','mebsuta'],['mebsuta','nu'],['nu','tejat'],['tejat','propus'],
      ['pollux','wasat'],['wasat','mekbuda'],['mekbuda','alhena'],['wasat','lambda'],['lambda','alzirr'],
      ['castor','pollux'],['pollux','kappa'],['castor','iota'],['iota','theta']],
    sigil:{k:1.12,paths:['M-30,-56 L-30,56','M30,-56 L30,56','M-44,-50 C-20,-64 20,-64 44,-50','M-44,50 C-20,64 20,64 44,50']},
    ed:{eyebrow:'Territory <b>III</b> · Mutable Air',name:'The Hall of<em>Two Lights</em>',
        tagline:'Where every answer arrives already twinned.',
        attr:'Curiosity <span class="sep">·</span> Exchange <span class="sep">·</span> Duality',
        lede:'The third territory, where the single self first discovers it is two — and learns that nothing true can be said only once, or from only one side.',
        plaque:'Begin the reading',
        cap:'<span><b>Gemini</b> — the Twins</span><span>514 sq. degrees</span><span>α Castor · β Pollux</span><span>Ptolemy, 2\u207F\u1D48 century</span>'}
  },

  cancer: {
    plate:'Plate IV / XII',
    stars:[
      {id:'tarf',  ra:8.275, dec:9.19,  mag:3.52},
      {id:'delta', ra:8.745, dec:18.15, mag:3.94},
      {id:'gamma', ra:8.722, dec:21.47, mag:4.66},
      {id:'alpha', ra:8.975, dec:11.86, mag:4.25},
      {id:'iota',  ra:8.778, dec:28.76, mag:4.02}
    ],
    lines:[['tarf','delta'],['delta','gamma'],['gamma','iota'],['delta','alpha']],
    sigil:{k:1.0,paths:[
      'M30,-13 C-4,-13 -4,3 16,3','M-30,13 C4,13 4,-3 -16,-3',
      'M16,3 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0','M-16,-3 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0']},
    ed:{eyebrow:'Territory <b>IV</b> · Cardinal Water',name:'The Sheltering<em>Tide</em>',
        tagline:'Where the shore keeps what the sea returns.',
        attr:'Memory <span class="sep">·</span> Refuge <span class="sep">·</span> Tenderness',
        lede:'The fourth territory, where feeling first builds itself a shell — the soft thing that learns to carry its own home, and to guard what it loves behind a patient wall.',
        plaque:'Begin the reading',
        cap:'<span><b>Cancer</b> — the Crab</span><span>506 sq. degrees</span><span>the Beehive within</span><span>Ptolemy, 2\u207F\u1D48 century</span>'}
  },

  leo: {
    plate:'Plate V / XII',
    stars:[
      {id:'regulus',ra:10.139,dec:11.97, mag:1.35},
      {id:'denebola',ra:11.818,dec:14.57,mag:2.11},
      {id:'algieba',ra:10.333,dec:19.84, mag:2.00},
      {id:'zosma',  ra:11.235,dec:20.52, mag:2.56},
      {id:'epsilon',ra:9.764, dec:23.77, mag:2.98},
      {id:'zeta',   ra:10.278,dec:23.42, mag:3.44},
      {id:'eta',    ra:10.122,dec:16.76, mag:3.50},
      {id:'theta',  ra:11.237,dec:15.43, mag:3.34},
      {id:'mu',     ra:9.880, dec:26.01, mag:3.88}
    ],
    lines:[['regulus','eta'],['eta','algieba'],['algieba','zeta'],['zeta','mu'],['mu','epsilon'],
      ['algieba','zosma'],['zosma','denebola'],['denebola','theta'],['theta','regulus'],['zosma','theta']],
    sigil:{k:1.0,paths:[
      'M-12,-2 m-9,0 a9,9 0 1,0 18,0 a9,9 0 1,0 -18,0',
      'M-3,-5 C16,-18 32,2 21,17 C15,25 4,21 4,12']},
    ed:{eyebrow:'Territory <b>V</b> · Fixed Fire',name:'The Sovereign<em>Light</em>',
        tagline:'Where the fire learns it has a face.',
        attr:'Radiance <span class="sep">·</span> Courage <span class="sep">·</span> Sovereignty',
        lede:'The fifth territory, where the warmth of the world gathers into a single bright centre and dares to be seen — the heart that rules by being most fully itself.',
        plaque:'Begin the reading',
        cap:'<span><b>Leo</b> — the Lion</span><span>947 sq. degrees</span><span>α Regulus · the Heart</span><span>Ptolemy, 2\u207F\u1D48 century</span>'}
  },

  virgo: {
    plate:'Plate VI / XII',
    stars:[
      {id:'spica',  ra:13.420,dec:-11.16,mag:0.98},
      {id:'beta',   ra:11.845,dec:1.76,  mag:3.60},
      {id:'gamma',  ra:12.694,dec:-1.45, mag:2.74},
      {id:'delta',  ra:12.926,dec:3.40,  mag:3.38},
      {id:'epsilon',ra:13.036,dec:10.96, mag:2.83},
      {id:'zeta',   ra:13.578,dec:-0.60, mag:3.38},
      {id:'eta',    ra:12.332,dec:-0.67, mag:3.89},
      {id:'iota',   ra:14.269,dec:-6.00, mag:4.07},
      {id:'mu',     ra:14.717,dec:-5.66, mag:3.88}
    ],
    lines:[['beta','eta'],['eta','gamma'],['gamma','delta'],['delta','epsilon'],
      ['gamma','spica'],['spica','zeta'],['spica','iota'],['iota','mu']],
    sigil:{k:1.0,paths:[
      'M-30,-18 L-30,18','M-12,-18 L-12,18','M6,-18 L6,18',
      'M-30,-18 C-30,-26 -12,-26 -12,-18','M-12,-18 C-12,-26 6,-26 6,-18',
      'M6,18 C6,26 24,26 24,10 C24,-2 8,-2 8,8']},
    ed:{eyebrow:'Territory <b>VI</b> · Mutable Earth',name:'The Quiet<em>Harvest</em>',
        tagline:'Where care is the only perfect language.',
        attr:'Precision <span class="sep">·</span> Service <span class="sep">·</span> Discernment',
        lede:'The sixth territory, where the abundance of summer is sorted, weighed and made useful — the patient art of improving a thing without ever needing to be thanked.',
        plaque:'Begin the reading',
        cap:'<span><b>Virgo</b> — the Maiden</span><span>1294 sq. degrees</span><span>α Spica · the Ear of Grain</span><span>Ptolemy, 2\u207F\u1D48 century</span>'}
  },

  libra: {
    plate:'Plate VII / XII',
    stars:[
      {id:'alpha', ra:14.848,dec:-16.04,mag:2.75},
      {id:'beta',  ra:15.283,dec:-9.38, mag:2.61},
      {id:'gamma', ra:15.586,dec:-14.79,mag:3.91},
      {id:'sigma', ra:15.067,dec:-25.28,mag:3.29}
    ],
    lines:[['alpha','beta'],['beta','gamma'],['gamma','alpha'],['alpha','sigma']],
    sigil:{k:1.0,paths:['M-32,16 L32,16','M-32,0 L-10,0','M10,0 L32,0','M-10,0 C-10,-16 10,-16 10,0']},
    ed:{eyebrow:'Territory <b>VII</b> · Cardinal Air',name:'The Weighing<em>Hall</em>',
        tagline:'Where every truth must answer to another.',
        attr:'Balance <span class="sep">·</span> Justice <span class="sep">·</span> Grace',
        lede:'The seventh territory, the first to face outward — where the self meets its equal and learns that fairness is not a feeling but a discipline, held level against the weight of the other.',
        plaque:'Begin the reading',
        cap:'<span><b>Libra</b> — the Scales</span><span>538 sq. degrees</span><span>β Zubeneschamali</span><span>Ptolemy, 2\u207F\u1D48 century</span>'}
  },

  scorpius: {
    plate:'Plate VIII / XII',
    stars:[
      {id:'antares',ra:16.490,dec:-26.43,mag:1.06},
      {id:'beta',   ra:16.090,dec:-19.81,mag:2.62},
      {id:'delta',  ra:16.005,dec:-22.62,mag:2.29},
      {id:'pi',     ra:15.981,dec:-26.11,mag:2.90},
      {id:'sigma',  ra:16.353,dec:-25.59,mag:2.88},
      {id:'tau',    ra:16.598,dec:-28.22,mag:2.82},
      {id:'epsilon',ra:16.836,dec:-34.29,mag:2.29},
      {id:'mu',     ra:16.864,dec:-38.05,mag:3.00},
      {id:'zeta',   ra:16.911,dec:-42.36,mag:3.62},
      {id:'eta',    ra:17.203,dec:-43.24,mag:3.32},
      {id:'theta',  ra:17.622,dec:-42.99,mag:1.86},
      {id:'iota',   ra:17.793,dec:-40.13,mag:3.03},
      {id:'kappa',  ra:17.708,dec:-39.03,mag:2.39},
      {id:'lambda', ra:17.560,dec:-37.10,mag:1.62},
      {id:'upsilon',ra:17.512,dec:-37.30,mag:2.70}
    ],
    lines:[['beta','delta'],['delta','pi'],['delta','sigma'],['sigma','antares'],['antares','tau'],
      ['tau','epsilon'],['epsilon','mu'],['mu','zeta'],['zeta','eta'],['eta','theta'],
      ['theta','iota'],['iota','kappa'],['kappa','lambda'],['lambda','upsilon']],
    sigil:{k:1.0,paths:[
      'M-30,-18 L-30,18','M-12,-18 L-12,18','M6,-18 L6,16',
      'M-30,-18 C-30,-26 -12,-26 -12,-18','M-12,-18 C-12,-26 6,-26 6,-18',
      'M6,16 L24,16','M24,16 L16,9','M24,16 L16,23']},
    ed:{eyebrow:'Territory <b>VIII</b> · Fixed Water',name:'The Deepest<em>Water</em>',
        tagline:'Where nothing stays buried forever.',
        attr:'Intensity <span class="sep">·</span> Devotion <span class="sep">·</span> Transformation',
        lede:'The eighth territory, the dark water beneath the still water — where love and loss turn out to be the same current, and what is destroyed here returns wearing a truer face.',
        plaque:'Begin the reading',
        cap:'<span><b>Scorpius</b> — the Scorpion</span><span>497 sq. degrees</span><span>α Antares · the Rival of Mars</span><span>Ptolemy, 2\u207F\u1D48 century</span>'}
  },

  sagittarius: {
    plate:'Plate IX / XII',
    stars:[
      {id:'epsilon',ra:18.403,dec:-34.38,mag:1.85},
      {id:'delta',  ra:18.350,dec:-29.83,mag:2.70},
      {id:'lambda', ra:18.466,dec:-25.42,mag:2.81},
      {id:'sigma',  ra:18.921,dec:-26.30,mag:2.05},
      {id:'zeta',   ra:19.044,dec:-29.88,mag:2.60},
      {id:'phi',    ra:18.763,dec:-26.99,mag:3.17},
      {id:'tau',    ra:19.115,dec:-27.67,mag:3.32},
      {id:'gamma2', ra:18.097,dec:-30.42,mag:2.99},
      {id:'eta',    ra:18.293,dec:-36.76,mag:3.11}
    ],
    lines:[['delta','gamma2'],['delta','epsilon'],['epsilon','eta'],['epsilon','zeta'],['zeta','tau'],
      ['tau','sigma'],['sigma','phi'],['phi','lambda'],['lambda','delta']],
    sigil:{k:1.0,paths:['M-24,24 L18,-18','M18,-18 L4,-16','M18,-18 L16,-4','M-10,2 L8,20']},
    ed:{eyebrow:'Territory <b>IX</b> · Mutable Fire',name:'The Long<em>Horizon</em>',
        tagline:'Where the arrow is loosed before the target is known.',
        attr:'Freedom <span class="sep">·</span> Vision <span class="sep">·</span> Faith',
        lede:'The ninth territory, where the intensity of the depths turns outward and upward into a search — the restless aim at something larger than the self, fired toward a horizon that keeps receding.',
        plaque:'Begin the reading',
        cap:'<span><b>Sagittarius</b> — the Archer</span><span>867 sq. degrees</span><span>ε Kaus Australis</span><span>Ptolemy, 2\u207F\u1D48 century</span>'}
  },

  capricornus: {
    plate:'Plate X / XII',
    stars:[
      {id:'alpha', ra:20.300,dec:-12.51,mag:3.57},
      {id:'beta',  ra:20.351,dec:-14.78,mag:3.05},
      {id:'psi',   ra:20.768,dec:-25.27,mag:4.13},
      {id:'omega', ra:20.864,dec:-26.92,mag:4.10},
      {id:'zeta',  ra:21.444,dec:-22.41,mag:3.74},
      {id:'delta', ra:21.784,dec:-16.13,mag:2.85},
      {id:'gamma', ra:21.668,dec:-16.66,mag:3.69},
      {id:'theta', ra:21.099,dec:-17.23,mag:4.07}
    ],
    lines:[['alpha','beta'],['beta','psi'],['psi','omega'],['omega','zeta'],['zeta','delta'],
      ['delta','gamma'],['gamma','theta'],['theta','alpha']],
    sigil:{k:1.0,paths:['M-28,-16 L-12,16','M-12,16 C-12,-8 8,-12 8,4','M8,4 C8,18 24,18 26,4 C28,-8 14,-10 12,2']},
    ed:{eyebrow:'Territory <b>X</b> · Cardinal Earth',name:'The Cold<em>Summit</em>',
        tagline:'Where the long climb is the whole of the reward.',
        attr:'Discipline <span class="sep">·</span> Ambition <span class="sep">·</span> Endurance',
        lede:'The tenth territory, the high and stony peak above the tree line — where time is the only currency and the patient, solitary climb toward mastery is undertaken for its own austere sake.',
        plaque:'Begin the reading',
        cap:'<span><b>Capricornus</b> — the Sea-Goat</span><span>414 sq. degrees</span><span>δ Deneb Algedi</span><span>Ptolemy, 2\u207F\u1D48 century</span>'}
  },

  aquarius: {
    plate:'Plate XI / XII',
    stars:[
      {id:'beta',  ra:21.526,dec:-5.57, mag:2.90},
      {id:'alpha', ra:22.096,dec:-0.32, mag:2.95},
      {id:'gamma', ra:22.361,dec:-1.39, mag:3.84},
      {id:'zeta',  ra:22.481,dec:-0.02, mag:3.65},
      {id:'eta',   ra:22.587,dec:-0.12, mag:4.04},
      {id:'pi',    ra:22.412,dec:1.38,  mag:4.66},
      {id:'delta', ra:22.911,dec:-15.82,mag:3.27},
      {id:'lambda',ra:22.876,dec:-7.58, mag:3.74},
      {id:'tau',   ra:22.827,dec:-13.59,mag:4.01},
      {id:'phi',   ra:23.232,dec:-6.05, mag:4.22}
    ],
    lines:[['beta','alpha'],['alpha','gamma'],['gamma','zeta'],['zeta','eta'],['gamma','pi'],['zeta','pi'],
      ['alpha','lambda'],['lambda','phi'],['lambda','tau'],['tau','delta']],
    sigil:{k:1.0,paths:['M-30,-8 l10,-7 l10,7 l10,-7 l10,7','M-30,11 l10,-7 l10,7 l10,-7 l10,7']},
    ed:{eyebrow:'Territory <b>XI</b> · Fixed Air',name:'The Pouring<em>Light</em>',
        tagline:'Where the gift is poured out for those not yet born.',
        attr:'Vision <span class="sep">·</span> Freedom <span class="sep">·</span> Belonging',
        lede:'The eleventh territory, where the lone summit gives way to the wide human field — the cool, far-seeing mind that pours its strange water out for a future it will not live to drink.',
        plaque:'Begin the reading',
        cap:'<span><b>Aquarius</b> — the Water-Bearer</span><span>980 sq. degrees</span><span>β Sadalsuud</span><span>Ptolemy, 2\u207F\u1D48 century</span>'}
  },

  pisces: {
    plate:'Plate XII / XII',
    stars:[
      {id:'alpha',  ra:2.033, dec:2.76,  mag:3.82},
      {id:'xi',     ra:1.892, dec:3.19,  mag:4.61},
      {id:'nu',     ra:1.683, dec:5.49,  mag:4.44},
      {id:'mu',     ra:1.503, dec:6.14,  mag:4.84},
      {id:'zeta',   ra:1.224, dec:7.57,  mag:5.21},
      {id:'epsilon',ra:1.045, dec:7.89,  mag:4.27},
      {id:'delta',  ra:0.811, dec:7.59,  mag:4.44},
      {id:'omega',  ra:23.993,dec:6.86,  mag:4.03},
      {id:'gamma',  ra:23.286,dec:3.28,  mag:3.69},
      {id:'kappa',  ra:23.460,dec:1.26,  mag:4.94},
      {id:'lambda', ra:23.703,dec:1.79,  mag:4.49},
      {id:'tx',     ra:23.761,dec:3.49,  mag:4.90},
      {id:'iota',   ra:23.660,dec:5.63,  mag:4.13},
      {id:'theta',  ra:23.470,dec:6.38,  mag:4.27},
      {id:'s7',     ra:23.466,dec:5.38,  mag:5.05},
      {id:'eta',    ra:1.524, dec:15.35, mag:3.62},
      {id:'omicron',ra:1.756, dec:9.16,  mag:4.26}
    ],
    lines:[['alpha','xi'],['xi','nu'],['nu','mu'],['mu','zeta'],['zeta','epsilon'],['epsilon','delta'],
      ['delta','omega'],['omega','gamma'],['gamma','kappa'],['kappa','lambda'],['lambda','tx'],['tx','iota'],
      ['iota','theta'],['theta','s7'],['s7','gamma'],['epsilon','omicron'],['omicron','eta']],
    sigil:{k:0.94,paths:['M-46,-78 C-92,-44 -92,44 -46,78','M46,-78 C92,-44 92,44 46,78','M-78,0 L78,0']},
    ed:{eyebrow:'Territory <b>XII</b> · Mutable Water',name:'The Dreaming<em>Ocean</em>',
        tagline:'Where every tide remembers the shape of a life.',
        attr:'Compassion <span class="sep">·</span> Imagination <span class="sep">·</span> Surrender',
        lede:'The twelfth and final territory, where the self loosens its outline and dissolves back into the great water — remembering everything at once, and holding none of it.',
        plaque:'Begin the reading',
        cap:'<span><b>Pisces</b> — the Fishes</span><span>889 sq. degrees</span><span>α Alrescha · the Knot</span><span>Ptolemy, 2\u207F\u1D48 century</span>'}
  }

};

if (typeof module !== 'undefined' && module.exports) module.exports = SIGNS;
