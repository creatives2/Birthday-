// =========================================================================
// ================= CUSTOMIZE THIS WEBSITE =================
// Everything you personally need to change lives in this file.
// You do NOT need to understand the rest of the code to edit this.
// =========================================================================

const CONFIG = {

  // ---------------------------------------------------------------------
  // NAMES
  // ---------------------------------------------------------------------
  name: "Sumukh",              // the name he must type in the terminal (case-insensitive)
  nicknames: {
    primary: "Sumukhiiii",     // used after the terminal recognizes him
    secondary: "Sumukhiyaaa"   // used elsewhere in messages, feel free to sprinkle it in below
  },

  // ---------------------------------------------------------------------
  // TERMINAL INTRO (the tiny secret screen before the universe opens)
  // ---------------------------------------------------------------------
  terminal: {
    header: "«««birthday_system.py»»»",
    prompt: "Enter your name:",
    lines: [
      "Checking...",
      "Found you.",
      "Loading...",
      "Almost there."
    ],
    welcomeLine: (nickname) => `Welcome, ${nickname}.`
  },

  // ---------------------------------------------------------------------
  // MUSIC
  // Put your song at assets/music/birthday-song.mp3 (or change the path)
  // ---------------------------------------------------------------------
  music: {
    src: "assets/music/birthday-song.mp3",
    label: "our song"
  },

  // ---------------------------------------------------------------------
  // PHOTOS
  // Regular floating photographs drifting through the universe.
  // Add/remove as many as you like.
  // ---------------------------------------------------------------------
  // "pair" groups photos that should float close together, like the two
  // alike smile photos below. Leave pair blank/omit it for a photo that
  // floats on its own.
  photos: [
    { src: "assets/photos/sumukh-01.jpg", caption: "The smile 🥰", pair: "smile" },
    { src: "assets/photos/sumukh-02.jpg", caption: "The smile 🥰", pair: "smile" },
    { src: "assets/photos/sumukh-03.jpg", caption: "" }
  ],

  // The childhood photo — its own tiny hidden planet
  childhoodPhoto: {
    src: "assets/photos/sumukh-childhood.jpg",
    message: "Look at this tiny human — already his sister's favorite person, long before he became mine too."
  },

  // Used in the final scene
  favoritePhoto: {
    src: "assets/photos/sumukh-favorite.jpg"
  },

  // The secret drawing — hidden until near the end
  ourDrawing: {
    src: "assets/art/our-drawing.jpg",
    revealMessage: "this little version of us exists somewhere in my heart."
  },

  // ---------------------------------------------------------------------
  // LITTLE FLOATING SURPRISES
  // Each one is a tiny interactive object. Add, remove, or edit freely.
  // type controls its shape: "moon" | "gift" | "star" | "planet"
  // ---------------------------------------------------------------------
  surprises: [
    {
      id: "dontTouch",
      type: "star",
      teaser: "don't touch this",
      message: "Hehe. Got you. Come here 🥰"
    },
    {
      id: "spoiled",
      type: "moon",
      teaser: null,
      message: "Okay, you're getting spoiled today."
    },
    {
      id: "aboutYou",
      type: "planet",
      teaser: null,
      message: "Yes. This entire tiny universe is about you."
    },
    {
      id: "stopBeingCute",
      type: "star",
      teaser: null,
      message: "Stop being so cute. I'm trying to be serious right now."
    },
    {
      id: "drinkWater",
      type: "moon",
      teaser: null,
      message: "Drink water, silly. I mean it."
    },
    {
      id: "gift",
      type: "gift",
      teaser: null,
      message: "One birthday hug, delivered digitally, because distance is being annoying today."
    },
    {
      id: "insideJoke",
      type: "star",
      teaser: null,
      message: "You know exactly what this one means. I'm not explaining it here."
    },
    {
      id: "favoriteThing",
      type: "planet",
      teaser: null,
      message: "One of my favorite things about you: the way you get excited about things you love. Never lose that."
    }
  ],

  // ---------------------------------------------------------------------
  // LONG DISTANCE SCENE
  // ---------------------------------------------------------------------
  distance: {
    message: "Different places. Same little universe."
  },

  // ---------------------------------------------------------------------
  // SPACE DREAM SEQUENCE
  // A slow cinematic camera flight with these lines appearing in order.
  // ---------------------------------------------------------------------
  spaceDream: {
    lines: [
      "Whatever direction life takes you...",
      "I hope you keep following the things that make you curious.",
      "Keep looking up."
    ]
  },

  // ---------------------------------------------------------------------
  // BIRTHDAY LETTER
  // Write your real message here. This is shown on its own quiet screen.
  // ---------------------------------------------------------------------
  letter: {
    heading: "for you",
    // ====== WRITE YOUR MESSAGE HERE ======
    body: `[ Write your birthday letter to him here. Replace this entire
placeholder with whatever you want to say. It can be short. It can be
long. It's yours. ]`
    // ======================================
  },

  // ---------------------------------------------------------------------
  // FINAL SCENE
  // ---------------------------------------------------------------------
  finalScene: {
    lines: [
      "Happy Birthday, my favorite human.",
      "You make my little universe brighter.",
      "Sumukhiiii ♡"
    ],
    oneMoreThingLabel: "one more thing...",
    // ====== WRITE YOUR SECRET FINAL MESSAGE HERE ======
    secretMessage: `[ Write your final secret message here. This is the
very last thing he sees. Make it count, or don't — it's already enough
that you made him a whole tiny universe. ]`
    // ===================================================
  },

  // ---------------------------------------------------------------------
  // COLORS
  // The cosmic palette + the soft pink accent used for warm/affectionate
  // moments. Pink should stay an accent, not take over.
  // ---------------------------------------------------------------------
  colors: {
    void: 0x05040a,          // deepest background black
    midnightNavy: 0x0c0f24,
    mutedPurple: 0x3a2b52,
    cream: 0xf3ead9,
    blushPink: 0xf0b8c6,     // soft pink accent (particles, glows, notes)
    blushPinkDeep: 0xd88fa3,
    gold: 0xe8c489
  },

  // ---------------------------------------------------------------------
  // PERFORMANCE
  // ---------------------------------------------------------------------
  performance: {
    starsHigh: 4500,
    starsLow: 1800,
    pinkParticlesHigh: 500,
    pinkParticlesLow: 180
  }
};
