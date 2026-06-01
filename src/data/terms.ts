export type Category =
  | "Modes"
  | "Scales"
  | "Scale Degrees"
  | "Harmony"
  | "Voice Leading"
  | "Fugue"
  | "Rhythm"
  | "Form"
  | "Instruments"

export const ALL_CATEGORIES: Category[] = [
  "Modes", "Scales", "Scale Degrees", "Harmony",
  "Voice Leading", "Fugue", "Rhythm", "Form", "Instruments",
]

export interface Term {
  id: number
  term: string
  definition: string
  category: Category
}

export const ALL_TERMS: Term[] = [
  // ── Modes (1–7) ──────────────────────────────────────────────────────────
  { id: 1,  category: "Modes", term: "Ionian",      definition: "Identical to the major scale. Authentic mode on C. Pattern: T–T–S–T–T–T–S." },
  { id: 2,  category: "Modes", term: "Dorian",      definition: "Like natural minor with a raised ↑^6. Authentic mode on D. Color note: major 6th." },
  { id: 3,  category: "Modes", term: "Phrygian",    definition: "Like natural minor with a lowered ↓^2. Authentic mode on E. Color note: minor 2nd." },
  { id: 4,  category: "Modes", term: "Lydian",      definition: "Like major with a raised ↑^4. Authentic mode on F. Color note: augmented 4th." },
  { id: 5,  category: "Modes", term: "Mixolydian",  definition: "Like major with a lowered ↓^7. Authentic mode on G. Color note: minor 7th." },
  { id: 6,  category: "Modes", term: "Aeolian",     definition: "Identical to natural minor (no raised leading tone). Authentic mode on A." },
  { id: 7,  category: "Modes", term: "Locrian",     definition: "Has both ↓^2 and ↓^5, making it unusable due to the diminished 5th. Authentic mode on B." },

  // ── Scales (8–13, note: 11 not in source) ────────────────────────────────
  { id: 8,  category: "Scales", term: "Melodic minor scale",  definition: "Raised ^6 and ^7 ascending (borrowing the leading tone from major); descending is the same as natural minor." },
  { id: 9,  category: "Scales", term: "Harmonic minor scale", definition: "Natural minor with a raised ^7, creating a major V (dominant) chord. Produces an augmented 2nd between ^6 and ^7." },
  { id: 10, category: "Scales", term: "Natural minor scale",  definition: "Diatonic scale built T–S–T–T–S–T–T. No leading tone. Same notes as its relative major (e.g., A natural minor = C major)." },
  { id: 12, category: "Scales", term: "Octatonic Scale",      definition: "8-note scale with alternating whole tones and semitones. Symmetrical. Three distinct collections: OCT0,1 · OCT1,2 · OCT2,3." },
  { id: 13, category: "Scales", term: "Pentatonic Scale",     definition: "Any 5-note scale. Typically the major pentatonic C–D–E–G–A (do, re, mi, sol, la). Minor pentatonic starts on A." },

  // ── Scale Degrees (14–21) ─────────────────────────────────────────────────
  { id: 14, category: "Scale Degrees", term: "Tonic",       definition: "Scale-degree 1 (do). The most stable diatonic triad. Refers to both the scale degree and the chord built on ^1." },
  { id: 15, category: "Scale Degrees", term: "Dominant",    definition: "Scale-degree 5 (sol) and the major triad built on ^5. Unstable — contains the leading tone. V is the most important triad for defining a key." },
  { id: 16, category: "Scale Degrees", term: "Subdominant", definition: "Scale degree 4 (fa) and the triad built on ^4. IV in major, iv in minor. Typically pre-dominant function; can participate in a plagal I–IV–I progression." },
  { id: 17, category: "Scale Degrees", term: "Mediant",     definition: "Scale degree 3 (mi/me) and the triad on ^3. In major: iii (minor). In minor: III is the relative major — easy to tonicize. Ambiguous function in major." },
  { id: 18, category: "Scale Degrees", term: "Submediant",  definition: "Scale degree 6 (la/le) and the triad on ^6. vi in major (minor), VI in minor (usually major). Pre-dominant or tonic substitute. ^6 altered in modal mixture." },
  { id: 19, category: "Scale Degrees", term: "Supertonic",  definition: "Scale degree 2 (re) and the triad on ^2. ii in major (minor), iio in minor (diminished). Pre-dominant. Often in first inversion. Supports V/V." },
  { id: 20, category: "Scale Degrees", term: "Leading Tone", definition: "Scale degree 7 (ti) and the diminished triad (viio). Resolves upward to tonic. In minor, must be manually raised from te. Adding ^5 creates V7." },
  { id: 21, category: "Scale Degrees", term: "Subtonic",    definition: "Lowered scale degree 7 (te) and the major triad on ^7 (VII) in minor. V/III — pivot for modulating to the relative major. Common in pop progressions." },

  // ── Harmony (22–50) ───────────────────────────────────────────────────────
  { id: 22, category: "Harmony", term: "Secondary Dominant",        definition: "A V or V7 (and inversions) of a chord outside the main key. Creates strong pull to the chord it tonicizes. Common: V/V, V/vi, V/IV, V/ii. Cannot tonicize viio." },
  { id: 23, category: "Harmony", term: "Secondary Function",        definition: "Vague term no longer used by professional theorists. Ignore it." },
  { id: 24, category: "Harmony", term: "Tonicization",              definition: "Establishing a new key center briefly by emphasizing its ^4 and leading tone (its dominant 7th). Distinguished from modulation by brevity — usually just a few chords." },
  { id: 25, category: "Harmony", term: "Modulation",                definition: "A firmly established change of key. Requires the new key's scale, characteristic progressions, and at least one cadence to the new tonic. Distinguished from tonicization by duration." },
  { id: 26, category: "Harmony", term: "Modal mixture",             definition: "Mixing notes from parallel major and natural minor (e.g., C major + C minor). Most common: major-key pieces borrow ↓^3, ↓^6, ↓^7 from parallel minor. Typical chords: iiø7, iv, ♭VI." },
  { id: 27, category: "Harmony", term: "Cadential 6/4",             definition: "Looks like I6/4 but functions as an elaboration of the dominant — a root-position V with two non-harmonic tones (suspensions). Labeled V6/4–5/3. Common at cadences." },
  { id: 28, category: "Harmony", term: "Passing 6/4",               definition: "A 6/4 chord built on a passing tone in the bass. Prolongs tonic or pre-dominant. Chords on both sides always share the same harmonic function. Often involves voice exchange." },
  { id: 29, category: "Harmony", term: "Neighboring 6/4",           definition: "A 6/4 chord with a static bass (pedal) over which two upper voices have neighbor motion. Also called pedal 6/4. Most commonly prolongs I or V." },
  { id: 30, category: "Harmony", term: "Neapolitan sixth",          definition: "♭II6: a major triad on ra (↓^2), typically in first inversion. Chromatic predominant — a more dramatic version of iio6. ↓^2 resolves down to ^7. More common in minor." },
  { id: 31, category: "Harmony", term: "Italian augmented sixth",   definition: "It+6: contains the augmented sixth interval (le–fi, i.e., ↓^6–↑^4) plus do (^1). Resolves outward to ^5 in both outer voices. Chromatic predominant." },
  { id: 32, category: "Harmony", term: "German augmented sixth",    definition: "Ger+6: aug 6th (le–fi) + do + me (↓^3). Must resolve through a cadential 6/4 before V (to avoid parallel 5ths). Most resonant of the aug 6th chords." },
  { id: 33, category: "Harmony", term: "French augmented sixth",    definition: "Fr+6: aug 6th (le–fi) + do + re (^2). Can resolve directly to V. Sounds more dissonant than Italian due to the tritone within the chord." },
  { id: 34, category: "Harmony", term: "Ninth chord",               definition: "V7 plus a chordal 9th (the ^6 above the root, e.g., G–B–D–F–A is V9 in C). Can be major or minor 9th. The 9th replaces a doubled root and resolves downward by step." },
  { id: 35, category: "Harmony", term: "Pivot chord",               definition: "A single chord diatonic in both the old key and the new key, used to modulate smoothly. E.g., when modulating to V: vi6 becomes ii6, or I becomes IV." },
  { id: 36, category: "Harmony", term: "Quartal harmony",           definition: "A sonority built from stacked perfect 4ths (C–F–B♭–E♭). Quintal harmony uses stacked 5ths. Associated with Debussy and 20th-century composers." },
  { id: 37, category: "Harmony", term: "Tone cluster",              definition: "Three or more adjacent pitches sounded together (e.g., C–D–E simultaneously). Term coined by Henry Cowell, who had pianists use fists, palms, and forearms." },
  { id: 38, category: "Harmony", term: "Polychord",                 definition: "Two or more chords from different harmonic areas sounded simultaneously. Often two superimposed triads. Famous example: Stravinsky's Rite of Spring (E♭ chord over F♭ major)." },
  { id: 39, category: "Harmony", term: "Pitch class",               definition: "Notes an octave apart or enharmonically equivalent belong to the same pitch class. There are 12 pitch classes: C=0, C#/D♭=1, D=2 … B=11. Register doesn't matter." },
  { id: 40, category: "Harmony", term: "Pitch class set",           definition: "Meaningful groups of related pitch classes in atonal music. Named by size: trichord (3), tetrachord (4), pentachord (5), hexachord (6). Can be transposed or inverted." },
  { id: 41, category: "Harmony", term: "Set class",                 definition: "A family of pitch-class sets related by transposition and/or inversion. Has a prime form (most packed to the left) and an Allen Forte number (e.g., 3-11)." },
  { id: 42, category: "Harmony", term: "Twelve-tone row",           definition: "An ordered arrangement of all 12 pitch classes. Has four forms: Prime (P), Inversion (I), Retrograde (R), and Retrograde-Inversion (RI). 48 total row forms in the matrix." },
  { id: 43, category: "Harmony", term: "Enharmonically equivalent", definition: "Notes with the same pitch but different spelling (e.g., E and F♭). Allows modulation to distant keys. E.g., a V7 and Ger+6 are enharmonically the same; a viio7 can resolve four ways." },
  { id: 44, category: "Harmony", term: "Parallel keys",             definition: "Major and minor keys sharing the same tonic (same starting note). E.g., A major and A minor. Basis for modal mixture." },
  { id: 45, category: "Harmony", term: "Relative keys",             definition: "Keys sharing the same key signature but having different tonics. E.g., C major and A minor. The relative minor is a minor 3rd below the major." },
  { id: 46, category: "Harmony", term: "Closely related keys",      definition: "Keys differing from the primary key by no more than one accidental: the relative key, dominant key (and its relative), and subdominant key (and its relative). For C major: Am, G, Em, F, Dm." },
  { id: 47, category: "Harmony", term: "Chromatic mediants",        definition: "Third-related keys/chords where (1) root is a m3 or M3 from home, and (2) both are major or minor. Each shares one common tone with the original. E.g., from C major: E, E♭, A♭, A." },
  { id: 48, category: "Harmony", term: "Distantly related keys",    definition: "Any key outside the five closely related keys — those differing by more than one accidental. In C major, all keys except G, Em, F, Dm, and Am are distant." },
  { id: 49, category: "Harmony", term: "Circle of Fifths",          definition: "The arrangement of the 12 major (or minor) key tonics by ascending or descending perfect 5ths, forming a closed circle. Key signatures are arranged by adding/subtracting sharps or flats." },
  { id: 50, category: "Harmony", term: "Harmonic sequence",         definition: "A musical segment (chord or pair of chords) repeated and transposed regularly. Diatonic sequences stay in key (interval size preserved, quality may change). Chromatic sequences maintain both size and quality." },

  // ── Voice Leading (51–55) ─────────────────────────────────────────────────
  { id: 51, category: "Voice Leading", term: "Parallel fifths and octaves", definition: "Two voices moving in the same direction at a constant interval of a 5th or octave. Forbidden in tonal part-writing because perfect consonances reduce voice independence, making 4 voices sound like 3." },
  { id: 52, category: "Voice Leading", term: "Voice crossing",              definition: "In SATB writing, when a lower voice moves above a higher one (e.g., tenor above alto). Forbidden in exercises due to registral confusion. Occurs in actual repertoire but not recommended for beginners." },
  { id: 53, category: "Voice Leading", term: "Cross relation",              definition: "A chromatic contradiction between different voices in adjacent chords — the same pitch class in two different voices with different accidentals. Also called false relation. Best avoided in part-writing." },
  { id: 54, category: "Voice Leading", term: "Appoggiatura",                definition: "An accented non-chord tone (NCT) approached by leap and left by step. On the strong beat or strong part of a beat. Typically leaps up and falls stepwise to the chord tone." },
  { id: 55, category: "Voice Leading", term: "Escape tone",                 definition: "An unaccented non-chord tone (NCT) approached by step and left by leap in the opposite direction. Typically on the weak part of the beat. Also called échappée." },

  // ── Fugue (56–63) ────────────────────────────────────────────────────────
  { id: 56, category: "Fugue", term: "Fugal subject",     definition: "The main melodic theme of a fugue, stated by a single voice at the opening and then by each voice in turn. Typically emphasizes ^1 and ^5. May or may not modulate to the dominant." },
  { id: 57, category: "Fugue", term: "Real answer",       definition: "An exact transposition of the fugal subject up a 5th (or down a 4th) — used when ^5 does not appear prominently near the subject's beginning." },
  { id: 58, category: "Fugue", term: "Tonal answer",      definition: "A modified transposition of the subject where sol (^5) is answered by do (^1) rather than re (^2). Required when the subject starts on or prominently uses ^5, or when it modulates." },
  { id: 59, category: "Fugue", term: "Countersubject",    definition: "A melody in counterpoint to the fugal subject that recurs each time the subject appears. Should have distinct melody and rhythm from the subject. May be invertible at the octave." },
  { id: 60, category: "Fugue", term: "Fugal exposition",  definition: "The opening section of a fugue where each voice enters with the subject or answer in turn until all voices have entered. Ends with a cadence. A 'redundant' entry sometimes occurs." },
  { id: 61, category: "Fugue", term: "Episode",           definition: "A section between subject entries that develops subject material through fragmentation and sequencing. No full subject statement. May modulate and end with an elided cadence into the next subject entry." },
  { id: 62, category: "Fugue", term: "Stretto",           definition: "A technique where subject entries overlap — the answer enters before the subject is complete. Creates momentum and textural density. Effective in the middle or end of a fugue to build toward a climax." },
  { id: 63, category: "Fugue", term: "Retrograde",        definition: "Statement of the fugal subject's pitches in reverse order. Most common in canons and inventions. Example: Bach's Musical Offering has a canon where the second voice performs the melody backwards." },

  // ── Rhythm (64–75) ───────────────────────────────────────────────────────
  { id: 64, category: "Rhythm", term: "Simple meter",      definition: "Meter in which the beat divides into two and subdivides into four. Examples: 2/4 (simple duple), 3/4 (simple triple), 4/4 (simple quadruple)." },
  { id: 65, category: "Rhythm", term: "Compound meter",    definition: "Meter in which the beat divides into three and subdivides into six. Examples: 6/8 (compound duple), 9/8 (compound triple), 12/8 (compound quadruple)." },
  { id: 66, category: "Rhythm", term: "Asymmetrical meter", definition: "Meter with measures divided into unequal groupings, creating an uneven pulse. Examples: 5/8 (2+3 or 3+2) and 7/8 (2+2+3 or 3+2+2 etc.)." },
  { id: 67, category: "Rhythm", term: "Hypermeter",         definition: "Strong/weak accent patterns at levels beyond the notated meter — grouping measures into phrases (e.g., 4-bar hypermeasures). Western classical music typically groups by twos (and fours, eights)." },
  { id: 68, category: "Rhythm", term: "Harmonic rhythm",    definition: "The rate at which chords change relative to the note rate. Slow harmonic rhythm = few chord changes; fast = many. Harmonic rhythm typically accelerates approaching a cadence." },
  { id: 69, category: "Rhythm", term: "Hemiola",            definition: "Three beats of equal value in the time normally occupied by two. Example: in 6/4, two groups of three quarter notes vs. three groups of two. Also seen as 6/8 conflicting with 3/4." },
  { id: 70, category: "Rhythm", term: "Syncopation",        definition: "Temporary displacement of the regular metrical accent — emphasis shifts from a strong beat (or strong part of the beat) to a weak beat (or weak part of the beat)." },
  { id: 71, category: "Rhythm", term: "Anacrusis",          definition: "Also called upbeat or pickup note. A note or sequence of notes before the first downbeat of a piece. Does not occupy a bar number." },
  { id: 72, category: "Rhythm", term: "Agogic accent",      definition: "Stress given to a note through prolonged duration rather than loudness or metric position. Can occur on a strong or weak beat." },
  { id: 73, category: "Rhythm", term: "Elision",            definition: "A phrase structure where the last bar of one phrase simultaneously serves as the first bar of the next (8 = 1). Also called phrase overlap." },
  { id: 74, category: "Rhythm", term: "Suspension",         definition: "An accented non-chord tone: a consonant note held over the barline while the bass changes, creating dissonance, then resolving by step downward. Three stages: preparation (weak) / suspension (strong) / resolution (weak). Common types: 7–6, 4–3, 9–8, 2–3." },
  { id: 75, category: "Rhythm", term: "Retardation",        definition: "An accented non-chord tone approached by the same note and resolving upward by step. The opposite melodic contour of a suspension (which resolves down)." },

  // ── Form (76–100) ────────────────────────────────────────────────────────
  { id: 76, category: "Form", term: "Perfect authentic cadence",   definition: "PAC: V–I, both root position, ^1 in the highest melodic voice of the final I chord. The strongest cadence in tonal music. V7–I: the tritone (^4–^7) resolves, ^4↓^3 and ^7↑^1." },
  { id: 77, category: "Form", term: "Imperfect authentic cadence", definition: "IAC: V–I, both root position, ^3 or ^5 in the highest melodic voice of the final I chord. Less conclusive than PAC. Some extend this to V6/5–I, though modern theorists prefer root-position-only definition." },
  { id: 78, category: "Form", term: "Half Cadence",                definition: "HC: a phrase ending on dominant harmony. Preceded by any chord (I, pre-dominant, or secondary dominant). The ending V is the ultimate V, not a penultimate passing V." },
  { id: 79, category: "Form", term: "Phrygian half cadence",       definition: "A special HC: iv6–V in minor. Named for the le–sol half-step motion in the bass. Does not imply Phrygian mode. Often ends a lament bass. Precursor to augmented sixth chords." },
  { id: 80, category: "Form", term: "Plagal cadence",              definition: "PC: IV–I (also called the 'Amen cadence'). Post-cadential — typically follows a PAC for added finality. In major keys can borrow from minor: I–iv–I or I–iiø6/5–I." },
  { id: 81, category: "Form", term: "Deceptive cadence",           definition: "DC: V(7) resolves to vi (or VI in minor) instead of I. Both in root position. Cannot end a piece. A deceptive progression mid-phrase also creates a striking effect without being a formal cadence." },
  { id: 82, category: "Form", term: "Phrase",                      definition: "A relatively independent musical idea (melodic/harmonic) that ends with a cadence. Two phrases can form a period if the first ends with a weaker cadence (HC) and the second with a stronger one (PAC)." },
  { id: 83, category: "Form", term: "Motive",                      definition: "The smallest melodic or rhythmic identifiable idea. Can be a pitch pattern, a rhythmic pattern, or both. Example: the first four notes of Beethoven's 5th Symphony." },
  { id: 84, category: "Form", term: "Contrasting period",          definition: "A period in which the beginnings of both phrases use different musical material." },
  { id: 85, category: "Form", term: "Parallel period",             definition: "A period where both phrases begin with similar or identical material but end in different cadences. Antecedent (1st phrase) ends on HC or IAC; consequent (2nd phrase) ends on PAC. 'Question and answer' relationship." },
  { id: 86, category: "Form", term: "Double period",               definition: "Four phrases in two pairs. The cadence ending the second pair is stronger than the cadence ending the first pair." },
  { id: 87, category: "Form", term: "Binary form",                 definition: "Two-part form with two sections (A and B), each usually repeated: ||:A:||:B:||. B section may contrast or develop A material. Common in Baroque dances." },
  { id: 88, category: "Form", term: "Ternary form",                definition: "ABA form — statement, contrast, return. The B section contrasts with A through different melody, texture, or tonality. The returning A may be varied (A')." },
  { id: 89, category: "Form", term: "Rounded binary form",         definition: "A type of binary form: ||:A:||:BA':||. Material from the start of A returns near the middle of the second reprise (B section). Both A appearances are in the home key." },
  { id: 90, category: "Form", term: "Strophic",                    definition: "A large-scale song structure in which the same multi-phrase unit (strophe) repeats throughout: AAA. Common in hymns and 19th-century German Lied when a poem has multiple stanzas with the same meter." },
  { id: 91, category: "Form", term: "Rondo",                       definition: "Form featuring multiple returns of main theme A alternating with contrasting sections (B, C…). Full pattern: A–B–A–C–A–B–A. The A theme typically always returns in the home key." },
  { id: 92, category: "Form", term: "Sonata form",                 definition: "Exposition (≈A) → Development (≈B) → Recapitulation (≈A'). Exposition has Primary theme (tonic) + Transition + Secondary theme (non-tonic). Recap restates all material in tonic. Often has closing section." },
  { id: 93, category: "Form", term: "Sonata-rondo",                definition: "Hybrid form combining features of five-part rondo and sonata form. Main theme returns like a rondo, but the B section functions like a development." },
  { id: 94, category: "Form", term: "Ritornello form",             definition: "Baroque orchestral form. 'Ritornello' = 'little return.' A recurring tutti passage (ritornello) alternates with solo episodes. Common in Baroque concertos." },
  { id: 95, category: "Form", term: "Concerto form",               definition: "An instrumental composition for one or more soloists accompanied by orchestra. Standard three-movement structure (fast–slow–fast) became established in the early 18th century." },
  { id: 96, category: "Form", term: "Fugue",                       definition: "A contrapuntal composition in which a subject is introduced by each voice in turn (exposition), then developed through episodes and subject entries, often using stretto and other devices." },
  { id: 97, category: "Form", term: "Fugato",                      definition: "A fugal passage within a composition that is not itself a strict or complete fugue." },
  { id: 98, category: "Form", term: "Exposition (sonata form)",    definition: "The first large section of a sonata-form work. Establishes main themes and a tonal conflict: Primary theme in tonic, Secondary theme in a non-tonic key (typically dominant in major, relative major in minor)." },
  { id: 99, category: "Form", term: "Development section",         definition: "The middle section of sonata form. Harmonically unstable — modulates freely, fragments and develops themes from the exposition. Ends with a retransition back to the tonic for the recapitulation." },
  { id: 100, category: "Form", term: "Recapitulation",             definition: "The third large section of sonata form. Returns themes from the exposition, but crucially, the Secondary theme is now restated in the tonic key, resolving the tonal conflict of the exposition." },

  // ── Instruments & Terminology (101–116) ──────────────────────────────────
  { id: 101, category: "Instruments", term: "Geige",       definition: "German: Violin." },
  { id: 102, category: "Instruments", term: "Bratsche",    definition: "German: Viola." },
  { id: 103, category: "Instruments", term: "Posaune / Trombone", definition: "Posaune (German) and Trombone (Italian) both mean trombone. 'Trombe' = trumpet; the '-one' suffix makes it 'big trumpet.'" },
  { id: 104, category: "Instruments", term: "Pauken",      definition: "German: Timpani." },
  { id: 105, category: "Instruments", term: "Corni / Corno", definition: "Italian: Horn. A transposing instrument that sounds a perfect 5th lower than written (in F)." },
  { id: 106, category: "Instruments", term: "Fagotti / Fagotto", definition: "Italian: Bassoon." },
  { id: 107, category: "Instruments", term: "Cor Anglais", definition: "English Horn — a woodwind in the oboe family. Transposing instrument in F, sounds a perfect 5th lower than written." },
  { id: 108, category: "Instruments", term: "H-dur",       definition: "German: B major. In German, the note B is called H. H-moll = B minor." },
  { id: 109, category: "Instruments", term: "B-moll",      definition: "German: B♭ minor. In German, B♭ is called B (while natural B is H)." },
  { id: 110, category: "Instruments", term: "Con sordino", definition: "Italian: with mute. On piano, use the soft (una corda) pedal." },
  { id: 111, category: "Instruments", term: "Mit Dämpfer", definition: "German: with mute (lit. 'with damper'). Directive to muffle or deaden the tone of the instrument." },
  { id: 112, category: "Instruments", term: "Al niente",   definition: "Italian: 'to nothing.' Used with diminuendo to indicate the sound should fade beyond pianissimo to complete silence." },
  { id: 113, category: "Instruments", term: "Meno mosso",  definition: "Italian: 'with less motion,' i.e., slower. A direction occurring mid-movement. When the original tempo resumes, the direction is 'Tempo primo.'" },
  { id: 114, category: "Instruments", term: "Schnell",     definition: "German: fast, quickly. 'Doppelt so schnell' = twice as fast." },
  { id: 115, category: "Instruments", term: "Lebhaft",     definition: "German: lively, spirited (equivalent to vivace). From the verb leben (to live). Implies a fast tempo." },
  { id: 116, category: "Instruments", term: "Langsam",     definition: "German: slow, slowly. 'Sehr langsam' = very slow. 'Langsamer' = slower." },
]

export const TERM_COUNT = ALL_TERMS.length

export function getTermsByCategory(category: Category | "all"): Term[] {
  if (category === "all") return ALL_TERMS
  return ALL_TERMS.filter(t => t.category === category)
}

export function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = { all: ALL_TERMS.length }
  for (const cat of ALL_CATEGORIES) {
    counts[cat] = ALL_TERMS.filter(t => t.category === cat).length
  }
  return counts
}
