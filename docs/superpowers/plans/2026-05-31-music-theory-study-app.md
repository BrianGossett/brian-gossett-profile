# Music Theory Study App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/study` section to the existing React profile site with 4 study modes (Flashcards, Multiple Choice, Type-In, Matching) for 115 music theory terms, with sessionStorage-based progress tracking.

**Architecture:** Multi-route approach using existing React Router v7 setup. A shared `terms.ts` data file and `useStudySession` hook power all four mode components. Each mode is a self-contained component that reads/writes session state. No new packages needed.

**Tech Stack:** React 19, Chakra UI v3, React Router v7, TypeScript, Vite. Colors from `src/Theme.ts` `colors` export.

---

## File Map

| File | Action |
|---|---|
| `src/data/terms.ts` | Create — 115 terms as typed constants |
| `src/hooks/useStudySession.ts` | Create — sessionStorage read/write hook |
| `src/Pages/StudyPage/index.tsx` | Create — Study Hub |
| `src/Pages/StudyPage/FlashcardMode.tsx` | Create — flip card + swipe |
| `src/Pages/StudyPage/MultipleChoiceMode.tsx` | Create — 4-option quiz |
| `src/Pages/StudyPage/TypeInMode.tsx` | Create — type the term |
| `src/Pages/StudyPage/MatchingMode.tsx` | Create — match pairs |
| `src/Pages/ProfileRouting/index.tsx` | Modify — add 5 routes |
| `src/Components/Container/index.tsx` | Modify — add Study nav link |

---

### Task 1: Term data file

**Files:**
- Create: `src/data/terms.ts`

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: exits 0, no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/terms.ts
git commit -m "feat: add music theory terms data (115 terms, 9 categories)"
```

---

### Task 2: Session storage hook

**Files:**
- Create: `src/hooks/useStudySession.ts`

- [ ] **Step 1: Create the hook**

```ts
import { useState, useCallback } from "react"

const SESSION_KEY = "music-theory-study-session"

interface StudySession {
  mastered: number[]
  missed: number[]
  missedCounts: Record<number, number>
  streak: number
  lastMode: string
  lastCategory: string
  positions: {
    flashcards: number
    quiz: number
    type: number
    match: number
  }
}

const DEFAULT_SESSION: StudySession = {
  mastered: [],
  missed: [],
  missedCounts: {},
  streak: 0,
  lastMode: "flashcards",
  lastCategory: "all",
  positions: { flashcards: 0, quiz: 0, type: 0, match: 0 },
}

function load(): StudySession {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return { ...DEFAULT_SESSION }
    return { ...DEFAULT_SESSION, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SESSION }
  }
}

function save(session: StudySession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function useStudySession() {
  const [session, setSession] = useState<StudySession>(load)

  const update = useCallback((patch: Partial<StudySession>) => {
    setSession(prev => {
      const next = { ...prev, ...patch }
      save(next)
      return next
    })
  }, [])

  const markMastered = useCallback((id: number) => {
    setSession(prev => {
      const mastered = prev.mastered.includes(id) ? prev.mastered : [...prev.mastered, id]
      const missed = prev.missed.filter(x => x !== id)
      const next = { ...prev, mastered, missed, streak: prev.streak + 1 }
      save(next)
      return next
    })
  }, [])

  const markMissed = useCallback((id: number) => {
    setSession(prev => {
      const missed = prev.missed.includes(id) ? prev.missed : [...prev.missed, id]
      const missedCounts = { ...prev.missedCounts, [id]: (prev.missedCounts[id] ?? 0) + 1 }
      const next = { ...prev, missed, missedCounts, streak: 0 }
      save(next)
      return next
    })
  }, [])

  const setPosition = useCallback((mode: keyof StudySession["positions"], index: number) => {
    setSession(prev => {
      const next = { ...prev, positions: { ...prev.positions, [mode]: index } }
      save(next)
      return next
    })
  }, [])

  const setLastMode = useCallback((mode: string) => {
    update({ lastMode: mode })
  }, [update])

  const setLastCategory = useCallback((category: string) => {
    update({ lastCategory: category })
  }, [update])

  const resetSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession({ ...DEFAULT_SESSION })
  }, [])

  const weakTerms = Object.entries(session.missedCounts)
    .filter(([, count]) => count >= 2)
    .map(([id]) => Number(id))

  return {
    session,
    weakTerms,
    markMastered,
    markMissed,
    setPosition,
    setLastMode,
    setLastCategory,
    resetSession,
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useStudySession.ts
git commit -m "feat: add useStudySession hook for sessionStorage progress tracking"
```

---

### Task 3: Routing and nav link

**Files:**
- Modify: `src/Pages/ProfileRouting/index.tsx`
- Modify: `src/Components/Container/index.tsx`

- [ ] **Step 1: Add routes to ProfileRouting**

Replace `src/Pages/ProfileRouting/index.tsx` with:

```tsx
import { Routes, Route } from 'react-router'
import HomePage from '../HomePage'
import ExamplePage from '../ExamplePage'
import StudyHub from '../StudyPage'
import FlashcardMode from '../StudyPage/FlashcardMode'
import MultipleChoiceMode from '../StudyPage/MultipleChoiceMode'
import TypeInMode from '../StudyPage/TypeInMode'
import MatchingMode from '../StudyPage/MatchingMode'

const ProfileRouting = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/examples" element={<ExamplePage />} />
      <Route path="/study" element={<StudyHub />} />
      <Route path="/study/flashcards" element={<FlashcardMode />} />
      <Route path="/study/quiz" element={<MultipleChoiceMode />} />
      <Route path="/study/type" element={<TypeInMode />} />
      <Route path="/study/match" element={<MatchingMode />} />
      <Route path="*" element={<div style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', width: '100vw', height: '100vh' }}>404 Not Found</div>} />
    </Routes>
  )
}

export default ProfileRouting
```

- [ ] **Step 2: Add Study nav link to Header**

In `src/Components/Container/index.tsx`, add a Study link inside the `<Flex as="nav">`. Replace the nav Flex contents:

```tsx
// Change this import line — add NavLink from react-router:
import { NavLink } from "react-router"

// Inside the Header's <Flex as="nav" gap={6}> block, add:
<Box as="a" href="#hero"       color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} style={{ textDecoration: "none", cursor: "pointer" }}>Home</Box>
<Box as="a" href="#about"      color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} style={{ textDecoration: "none", cursor: "pointer" }}>About</Box>
<Box as="a" href="#experience" color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} style={{ textDecoration: "none", cursor: "pointer" }}>Experience</Box>
<Box as="a" href="#contact"    color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} style={{ textDecoration: "none", cursor: "pointer" }}>Contact</Box>
<NavLink to="/study" style={({ isActive }) => ({ textDecoration: "none", color: isActive ? colors.accent : colors.textMuted, fontSize: "14px" })}>Study</NavLink>
```

Full updated `src/Components/Container/index.tsx`:

```tsx
import { Box, Flex, Text, VStack } from "@chakra-ui/react"
import { NavLink } from "react-router"
import { colors } from "../../Theme"

const PageContainer: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <VStack minHeight="100vh" minWidth="100vw" align="stretch" bg={colors.pageBg}>
      <Header />
      <Box as="main" flex="1">
        {children}
      </Box>
      <Footer />
    </VStack>
  )
}

export const Header = () => {
  return (
    <Flex
      as="header"
      bg={colors.navBg}
      borderBottom={`1px solid ${colors.border}`}
      px={8}
      py={4}
      align="center"
      gap={8}
    >
      <Text fontWeight="800" fontSize="lg" color={colors.accent} letterSpacing="0.5px">
        BG
      </Text>
      <Flex as="nav" gap={6}>
        <Box as="a" href="#hero"       color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} style={{ textDecoration: "none", cursor: "pointer" }}>Home</Box>
        <Box as="a" href="#about"      color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} style={{ textDecoration: "none", cursor: "pointer" }}>About</Box>
        <Box as="a" href="#experience" color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} style={{ textDecoration: "none", cursor: "pointer" }}>Experience</Box>
        <Box as="a" href="#contact"    color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} style={{ textDecoration: "none", cursor: "pointer" }}>Contact</Box>
        <NavLink
          to="/study"
          style={({ isActive }) => ({
            textDecoration: "none",
            fontSize: "14px",
            color: isActive ? colors.accent : colors.textMuted,
          })}
        >
          Study
        </NavLink>
      </Flex>
    </Flex>
  )
}

export const Footer = () => {
  return (
    <Box
      as="footer"
      bg={colors.navBg}
      borderTop={`1px solid ${colors.border}`}
      textAlign="center"
      py={5}
    >
      <Text fontSize="sm" color={colors.textMuted}>
        &copy; {new Date().getFullYear()} Brian Gossett. All rights reserved.
      </Text>
    </Box>
  )
}

export default PageContainer
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: exits 0. Note: build will fail until all StudyPage components exist — create placeholder files first if needed:

```bash
mkdir -p src/Pages/StudyPage
# Create temporary placeholder for each missing file:
echo 'const StudyHub = () => <div>hub</div>; export default StudyHub' > src/Pages/StudyPage/index.tsx
echo 'const FlashcardMode = () => <div>flash</div>; export default FlashcardMode' > src/Pages/StudyPage/FlashcardMode.tsx
echo 'const MultipleChoiceMode = () => <div>quiz</div>; export default MultipleChoiceMode' > src/Pages/StudyPage/MultipleChoiceMode.tsx
echo 'const TypeInMode = () => <div>type</div>; export default TypeInMode' > src/Pages/StudyPage/TypeInMode.tsx
echo 'const MatchingMode = () => <div>match</div>; export default MatchingMode' > src/Pages/StudyPage/MatchingMode.tsx
npm run build
```

Expected: exits 0 with all placeholders in place.

- [ ] **Step 4: Commit**

```bash
git add src/Pages/ProfileRouting/index.tsx src/Components/Container/index.tsx src/Pages/StudyPage/
git commit -m "feat: add study routes and Study nav link"
```

---

### Task 4: Study Hub

**Files:**
- Create: `src/Pages/StudyPage/index.tsx` (replaces placeholder)

- [ ] **Step 1: Write the Study Hub**

```tsx
import { Box, Flex, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { ALL_CATEGORIES, getCategoryCounts, getTermsByCategory, type Category } from "../../data/terms"
import { useStudySession } from "../../hooks/useStudySession"

const MODES = [
  { key: "flashcards", path: "/study/flashcards", icon: "🃏", name: "Flashcards",       desc: "Swipe right if you know it, left if you don't. Tracks mastered terms." },
  { key: "quiz",       path: "/study/quiz",       icon: "🎯", name: "Multiple Choice", desc: "4 options per question. Great for quick recognition." },
  { key: "type",       path: "/study/type",       icon: "🔤", name: "Type the Term",   desc: "See the definition, type the term from memory." },
  { key: "match",      path: "/study/match",      icon: "🔗", name: "Matching",        desc: "Match terms to definitions. 8 pairs per round." },
] as const

const StudyHub = () => {
  const navigate = useNavigate()
  const { session, weakTerms, resetSession, setLastMode, setLastCategory } = useStudySession()
  const counts = getCategoryCounts()
  const selectedCat = (session.lastCategory ?? "all") as Category | "all"
  const selectedMode = session.lastMode ?? "flashcards"
  const filteredTerms = getTermsByCategory(selectedCat)
  const remaining = filteredTerms.filter(t => !session.mastered.includes(t.id)).length
  const modeObj = MODES.find(m => m.key === selectedMode) ?? MODES[0]
  const position = session.positions[selectedMode as keyof typeof session.positions] ?? 0

  const handleStart = () => {
    navigate(modeObj.path)
  }

  return (
    <PageContainer>
      <Box maxW="900px" mx="auto" w="100%" px={6} py={10}>
        <Text as="h1" fontSize="2xl" fontWeight="800" color={colors.textPrimary} mb={1}>
          Music Theory Study
        </Text>
        <Text fontSize="sm" color={colors.textMuted} mb={8}>
          {counts.all} terms · {ALL_CATEGORIES.length} categories
        </Text>

        {/* Session banner */}
        {(session.mastered.length > 0 || session.missed.length > 0) && (
          <Flex
            bg={colors.surface}
            border={`1px solid ${colors.accentDim}`}
            borderRadius="xl"
            p={5}
            mb={8}
            align="center"
            gap={6}
            flexWrap="wrap"
          >
            <StatItem value={session.mastered.length} label="Mastered" color={colors.accent} />
            <Divider />
            <StatItem value={session.missed.length} label="Missed" color="#ff6b6b" />
            <Divider />
            <StatItem value={`${session.streak}🔥`} label="Streak" color="#ffd93d" />
            <Divider />
            <StatItem value={remaining} label="Remaining" color={colors.textMuted} />
            {weakTerms.length > 0 && (
              <Box
                ml="auto"
                bg="#2d1b1b"
                border="1px solid #ff6b6b40"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="xs"
                color="#ff6b6b"
              >
                ⚠ {weakTerms.length} weak terms
              </Box>
            )}
            <Box
              as="button"
              onClick={resetSession}
              fontSize="xs"
              color={colors.textMuted}
              cursor="pointer"
              textDecoration="underline"
              background="none"
              border="none"
              _hover={{ color: colors.accent }}
            >
              Reset session
            </Box>
          </Flex>
        )}

        {/* Category filter */}
        <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>
          Study Category
        </Text>
        <Wrap gap={2} mb={8}>
          <WrapItem>
            <CategoryPill
              label={`All Terms (${counts.all})`}
              active={selectedCat === "all"}
              onClick={() => setLastCategory("all")}
            />
          </WrapItem>
          {ALL_CATEGORIES.map(cat => (
            <WrapItem key={cat}>
              <CategoryPill
                label={`${cat} (${counts[cat]})`}
                active={selectedCat === cat}
                onClick={() => setLastCategory(cat)}
              />
            </WrapItem>
          ))}
        </Wrap>

        {/* Mode cards */}
        <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>
          Study Mode
        </Text>
        <Flex gap={4} mb={8} flexWrap="wrap">
          {MODES.map(mode => (
            <ModeCard
              key={mode.key}
              mode={mode}
              selected={selectedMode === mode.key}
              isLast={session.lastMode === mode.key}
              onClick={() => setLastMode(mode.key)}
            />
          ))}
        </Flex>

        {/* Start button */}
        <Box
          as="button"
          onClick={handleStart}
          w="100%"
          bg={colors.accent}
          color={colors.pageBg}
          border="none"
          borderRadius="lg"
          py={4}
          fontSize="md"
          fontWeight="800"
          cursor="pointer"
          _hover={{ bg: colors.accentSoft }}
          mb={2}
        >
          Start {modeObj.name} — {selectedCat === "all" ? "All Terms" : selectedCat}
        </Box>
        {position > 0 && (
          <Text textAlign="center" fontSize="xs" color={colors.textMuted}>
            Continuing from card {position + 1} of {filteredTerms.length}
          </Text>
        )}
      </Box>
    </PageContainer>
  )
}

const StatItem = ({ value, label, color }: { value: string | number; label: string; color: string }) => (
  <Box>
    <Text fontSize="xl" fontWeight="800" color={color}>{value}</Text>
    <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color={colors.textMuted}>{label}</Text>
  </Box>
)

const Divider = () => <Box w="1px" h="36px" bg={colors.border} />

const CategoryPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <Box
    as="button"
    onClick={onClick}
    bg={active ? colors.accentDim : colors.surface}
    border={`1px solid ${active ? colors.accent : colors.border}`}
    borderRadius="full"
    px={3}
    py={1}
    fontSize="xs"
    color={active ? colors.accent : colors.textMuted}
    cursor="pointer"
    _hover={{ borderColor: colors.accentSoft }}
  >
    {label}
  </Box>
)

interface ModeCardProps {
  mode: typeof MODES[number]
  selected: boolean
  isLast: boolean
  onClick: () => void
}

const ModeCard = ({ mode, selected, isLast, onClick }: ModeCardProps) => (
  <Box
    flex="1"
    minW="180px"
    bg={selected ? colors.deepBlue : colors.surface}
    border={`1px solid ${selected ? colors.accent : colors.border}`}
    borderRadius="xl"
    p={5}
    cursor="pointer"
    onClick={onClick}
    position="relative"
    _hover={{ borderColor: colors.accent }}
  >
    {isLast && (
      <Box
        position="absolute"
        top={3}
        right={3}
        bg={colors.accentDim}
        border={`1px solid ${colors.accentDim}`}
        borderRadius="full"
        px={2}
        py="2px"
        fontSize="10px"
        color={colors.accent}
      >
        Last used
      </Box>
    )}
    <Text fontSize="2xl" mb={2}>{mode.icon}</Text>
    <Text fontWeight="700" fontSize="sm" color={colors.textPrimary} mb={1}>{mode.name}</Text>
    <Text fontSize="xs" color={colors.textMuted} lineHeight="1.5">{mode.desc}</Text>
  </Box>
)

export default StudyHub
```

- [ ] **Step 2: Verify build and visual check**

```bash
npm run build && npm run dev
```

Open `http://localhost:5173/study`. Expected: hub with category pills, mode cards, start button. Session banner hidden on first visit (no data yet).

- [ ] **Step 3: Commit**

```bash
git add src/Pages/StudyPage/index.tsx
git commit -m "feat: add Study Hub with category filter and mode selector"
```

---

### Task 5: Flashcard Mode

**Files:**
- Create: `src/Pages/StudyPage/FlashcardMode.tsx` (replaces placeholder)

- [ ] **Step 1: Write the component**

```tsx
import { useEffect, useState, useCallback } from "react"
import { Box, Flex, Text, VStack } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { getTermsByCategory, type Term } from "../../data/terms"
import { useStudySession } from "../../hooks/useStudySession"

const FlashcardMode = () => {
  const navigate = useNavigate()
  const { session, markMastered, markMissed, setPosition, setLastMode } = useStudySession()
  const category = (session.lastCategory ?? "all") as Parameters<typeof getTermsByCategory>[0]
  const allTerms = getTermsByCategory(category)
  const [index, setIndex] = useState(session.positions.flashcards)
  const [flipped, setFlipped] = useState(false)
  const [gotIt, setGotIt] = useState<number>(session.mastered.length)
  const [missed, setMissed] = useState<number>(session.missed.length)

  useEffect(() => { setLastMode("flashcards") }, [setLastMode])

  const term: Term | undefined = allTerms[index]

  const advance = useCallback((knew: boolean) => {
    if (!term) return
    if (knew) { markMastered(term.id); setGotIt(g => g + 1) }
    else { markMissed(term.id); setMissed(m => m + 1) }
    const next = index + 1
    setIndex(next)
    setPosition("flashcards", next)
    setFlipped(false)
  }, [term, index, markMastered, markMissed, setPosition])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); setFlipped(f => !f) }
      if (e.key === "ArrowRight" && flipped) advance(true)
      if (e.key === "ArrowLeft"  && flipped) advance(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [flipped, advance])

  const progress = allTerms.length > 0 ? (index / allTerms.length) * 100 : 0
  const remaining = allTerms.length - index

  if (!term) {
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={10} textAlign="center">
          <Text fontSize="3xl" mb={4}>🎉</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={2}>All done!</Text>
          <Text fontSize="sm" color={colors.textMuted} mb={8}>
            {gotIt} got it · {missed} missed · {allTerms.length} total
          </Text>
          <ActionBtn onClick={() => { setIndex(0); setPosition("flashcards", 0); setFlipped(false) }}>
            Restart Deck
          </ActionBtn>
          <Box mt={4}>
            <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" textDecoration="underline">
              Back to Hub
            </Box>
          </Box>
        </Box>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Box maxW="680px" mx="auto" px={6} py={8}>
        {/* Top bar */}
        <Flex align="center" gap={3} mb={7}>
          <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>
            ← Back
          </Box>
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🃏 Flashcards</Text>
          <Box ml="auto" bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={3} py="2px" fontSize="xs" color={colors.accent}>
            {category === "all" ? "All Terms" : category}
          </Box>
        </Flex>

        {/* Progress */}
        <Flex align="center" gap={3} mb={2}>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">Card {index + 1} of {allTerms.length}</Text>
          <Box flex={1} h="6px" bg={colors.border} borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${progress}%`} bg={colors.accent} borderRadius="full" />
          </Box>
          {session.streak > 0 && <Text fontSize="xs" color="#ffd93d" whiteSpace="nowrap">🔥 {session.streak}</Text>}
        </Flex>

        {/* Mini stats */}
        <Flex gap={4} mb={6}>
          <Text fontSize="xs" color="#2cb67d">{gotIt} got it</Text>
          <Text fontSize="xs" color="#ff6b6b">{missed} missed</Text>
          <Text fontSize="xs" color={colors.textMuted}>{remaining} remaining</Text>
        </Flex>

        {/* Card */}
        <Box
          bg={flipped ? colors.deepBlue : colors.surface}
          border={`1px solid ${flipped ? colors.accentDim : colors.border}`}
          borderRadius="2xl"
          p={10}
          minH="240px"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          cursor="pointer"
          onClick={() => setFlipped(f => !f)}
          mb={6}
          position="relative"
          _hover={{ borderColor: colors.accentDim }}
        >
          {!flipped ? (
            <>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} mb={5}>
                Click to reveal definition
              </Text>
              <Text fontSize="2xl" fontWeight="800" color={colors.textPrimary}>{term.term}</Text>
              <Text fontSize="xs" color={colors.accent} textTransform="uppercase" letterSpacing="wider" mt={3}>{term.category}</Text>
            </>
          ) : (
            <>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} mb={5}>Definition</Text>
              <Text fontSize="sm" color={colors.textMuted} lineHeight="1.8" maxW="480px">{term.definition}</Text>
            </>
          )}
          <Text position="absolute" bottom={3} right={4} fontSize="xs" color={colors.border}>
            {flipped ? "click to flip back" : "click to flip"}
          </Text>
        </Box>

        {/* Swipe buttons */}
        <Flex align="center" justify="center" gap={8} mb={6}>
          <VStack gap={2}>
            <Box
              as="button"
              onClick={() => flipped && advance(false)}
              w="64px" h="64px"
              borderRadius="full"
              border={`2px solid #ff6b6b`}
              color="#ff6b6b"
              fontSize="xl"
              bg="transparent"
              cursor={flipped ? "pointer" : "not-allowed"}
              opacity={flipped ? 1 : 0.3}
              _hover={flipped ? { bg: "#ff6b6b20" } : {}}
              display="flex" alignItems="center" justifyContent="center"
            >
              ✕
            </Box>
            <Text fontSize="xs" color={colors.textMuted} textTransform="uppercase" letterSpacing="wider">Still learning</Text>
          </VStack>

          <Text fontSize="sm" color={colors.textMuted}>{flipped ? "Know it?" : "Flip first"}</Text>

          <VStack gap={2}>
            <Box
              as="button"
              onClick={() => flipped && advance(true)}
              w="64px" h="64px"
              borderRadius="full"
              border={`2px solid #2cb67d`}
              color="#2cb67d"
              fontSize="xl"
              bg="transparent"
              cursor={flipped ? "pointer" : "not-allowed"}
              opacity={flipped ? 1 : 0.3}
              _hover={flipped ? { bg: "#2cb67d20" } : {}}
              display="flex" alignItems="center" justifyContent="center"
            >
              ✓
            </Box>
            <Text fontSize="xs" color={colors.textMuted} textTransform="uppercase" letterSpacing="wider">Got it!</Text>
          </VStack>
        </Flex>

        <Text textAlign="center" fontSize="xs" color={colors.border}>
          Space to flip · ← still learning · → got it
        </Text>
      </Box>
    </PageContainer>
  )
}

const ActionBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <Box
    as="button"
    onClick={onClick}
    w="100%"
    bg={colors.accent}
    color={colors.pageBg}
    border="none"
    borderRadius="lg"
    py={4}
    fontSize="md"
    fontWeight="800"
    cursor="pointer"
    _hover={{ bg: colors.accentSoft }}
  >
    {children}
  </Box>
)

export default FlashcardMode
```

- [ ] **Step 2: Verify build and visual check**

```bash
npm run build && npm run dev
```

Navigate to `http://localhost:5173/study`, select Flashcards, click Start. Expected: card shows term, click flips to definition, ✓/✕ buttons work after flip, progress bar advances.

- [ ] **Step 3: Commit**

```bash
git add src/Pages/StudyPage/FlashcardMode.tsx
git commit -m "feat: add Flashcard mode with flip, swipe, and keyboard shortcuts"
```

---

### Task 6: Multiple Choice Mode

**Files:**
- Create: `src/Pages/StudyPage/MultipleChoiceMode.tsx` (replaces placeholder)

- [ ] **Step 1: Write the component**

```tsx
import { useState, useEffect, useMemo } from "react"
import { Box, Flex, Text, VStack } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { getTermsByCategory, ALL_TERMS, type Term } from "../../data/terms"
import { useStudySession } from "../../hooks/useStudySession"

const QUIZ_SIZE = 40

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getDistractors(correct: Term, pool: Term[]): Term[] {
  const same = pool.filter(t => t.id !== correct.id && t.category === correct.category)
  const other = pool.filter(t => t.id !== correct.id && t.category !== correct.category)
  const candidates = shuffle([...same, ...other])
  return candidates.slice(0, 3)
}

const MultipleChoiceMode = () => {
  const navigate = useNavigate()
  const { session, markMastered, markMissed, setPosition, setLastMode } = useStudySession()
  const category = (session.lastCategory ?? "all") as Parameters<typeof getTermsByCategory>[0]
  const filteredTerms = getTermsByCategory(category)

  const questions = useMemo(() => {
    const pool = filteredTerms.length >= 4 ? filteredTerms : ALL_TERMS
    return shuffle(filteredTerms).slice(0, Math.min(QUIZ_SIZE, filteredTerms.length)).map(term => ({
      term,
      options: shuffle([term, ...getDistractors(term, pool)]),
    }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)

  useEffect(() => { setLastMode("quiz") }, [setLastMode])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const q = questions[index]
      if (!q) return
      const keys: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 }
      if (selected === null && e.key.toLowerCase() in keys) {
        const optIndex = keys[e.key.toLowerCase()]
        if (q.options[optIndex]) pick(q.options[optIndex].id)
      }
      if (e.key === "Enter" && selected !== null) advance()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  })

  const q = questions[index]

  function pick(id: number) {
    if (selected !== null || !q) return
    setSelected(id)
    if (id === q.term.id) { markMastered(q.term.id); setCorrect(c => c + 1) }
    else { markMissed(q.term.id); setWrong(w => w + 1) }
  }

  function advance() {
    const next = index + 1
    setIndex(next)
    setSelected(null)
    setPosition("quiz", next)
  }

  if (!q) {
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={10} textAlign="center">
          <Text fontSize="3xl" mb={4}>🎯</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={2}>Quiz Complete!</Text>
          <Text fontSize="sm" color={colors.textMuted} mb={2}>{correct} / {questions.length} correct</Text>
          <Text fontSize="xs" color={colors.textMuted} mb={8}>{wrong} wrong · {Math.round(correct / questions.length * 100)}%</Text>
          <ActionBtn onClick={() => navigate("/study")}>Back to Hub</ActionBtn>
        </Box>
      </PageContainer>
    )
  }

  const progress = (index / questions.length) * 100
  const letters = ["A", "B", "C", "D"]

  return (
    <PageContainer>
      <Box maxW="680px" mx="auto" px={6} py={8}>
        <Flex align="center" gap={3} mb={7}>
          <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>← Back</Box>
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🎯 Multiple Choice</Text>
          <Box ml="auto" bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={3} py="2px" fontSize="xs" color={colors.accent}>
            {category === "all" ? "All Terms" : category}
          </Box>
        </Flex>

        <Flex align="center" gap={3} mb={6}>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">Q {index + 1} of {questions.length}</Text>
          <Box flex={1} h="6px" bg={colors.border} borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${progress}%`} bg={colors.accent} borderRadius="full" />
          </Box>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">{correct} ✓ &nbsp; {wrong} ✕</Text>
        </Flex>

        {/* Question */}
        <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={8} mb={5}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={4}>What is this term?</Text>
          <Text fontSize="md" fontWeight="700" color={colors.textPrimary} lineHeight="1.6">{q.term.definition}</Text>
        </Box>

        {/* Options */}
        <VStack gap={3} mb={5}>
          {q.options.map((opt, i) => {
            const isSelected = selected === opt.id
            const isCorrect = opt.id === q.term.id
            const revealed = selected !== null
            let borderColor = colors.border
            let bg = colors.surface
            let textColor = colors.textMuted
            if (revealed && isCorrect) { borderColor = "#2cb67d"; bg = "#0d2a1e"; textColor = colors.textPrimary }
            else if (revealed && isSelected && !isCorrect) { borderColor = "#ff6b6b"; bg = "#2a0d0d"; textColor = colors.textPrimary }

            return (
              <Box
                key={opt.id}
                as="button"
                onClick={() => pick(opt.id)}
                w="100%"
                bg={bg}
                border={`1px solid ${borderColor}`}
                borderRadius="lg"
                p={4}
                display="flex"
                alignItems="flex-start"
                gap={3}
                cursor={selected !== null ? "default" : "pointer"}
                textAlign="left"
                _hover={selected === null ? { borderColor: colors.accentSoft } : {}}
              >
                <Box
                  w="26px" h="26px"
                  borderRadius="full"
                  border={`1px solid ${borderColor}`}
                  display="flex" alignItems="center" justifyContent="center"
                  fontSize="xs" fontWeight="700"
                  color={revealed && (isCorrect || isSelected) ? borderColor : colors.textMuted}
                  flexShrink={0}
                  mt="1px"
                >
                  {revealed && isCorrect ? "✓" : revealed && isSelected ? "✕" : letters[i]}
                </Box>
                <Text fontSize="sm" color={textColor}>{opt.term}</Text>
              </Box>
            )
          })}
        </VStack>

        {/* Feedback */}
        {selected !== null && (
          <Box
            bg={selected === q.term.id ? "#0d2a1e" : "#2a0d0d"}
            border={`1px solid ${selected === q.term.id ? "#2cb67d40" : "#ff6b6b40"}`}
            borderRadius="lg"
            p={4}
            mb={5}
            display="flex"
            gap={3}
          >
            <Text fontSize="lg">{selected === q.term.id ? "✅" : "❌"}</Text>
            <Text fontSize="sm" color={colors.textMuted} lineHeight="1.6">
              {selected === q.term.id
                ? <><Text as="span" color={colors.textPrimary} fontWeight="700">Correct!</Text> {q.term.definition.slice(0, 80)}…</>
                : <><Text as="span" color={colors.textPrimary} fontWeight="700">Not quite.</Text> The answer is <Text as="span" color={colors.textPrimary} fontWeight="700">{q.term.term}</Text>.</>
              }
            </Text>
          </Box>
        )}

        {selected !== null && (
          <ActionBtn onClick={advance}>
            {index + 1 < questions.length ? "Next Question →" : "See Results →"}
          </ActionBtn>
        )}

        <Text textAlign="center" fontSize="xs" color={colors.border} mt={3}>
          A B C D to select · Enter for next
        </Text>
      </Box>
    </PageContainer>
  )
}

const ActionBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <Box
    as="button"
    onClick={onClick}
    w="100%"
    bg={colors.accent}
    color={colors.pageBg}
    border="none"
    borderRadius="lg"
    py={4}
    fontSize="md"
    fontWeight="800"
    cursor="pointer"
    _hover={{ bg: colors.accentSoft }}
  >
    {children}
  </Box>
)

export default MultipleChoiceMode
```

- [ ] **Step 2: Verify build and visual check**

```bash
npm run build && npm run dev
```

Navigate to `http://localhost:5173/study/quiz`. Expected: definition shown, 4 options with letters A–D, correct answer turns green on click, wrong turns red with correct revealed.

- [ ] **Step 3: Commit**

```bash
git add src/Pages/StudyPage/MultipleChoiceMode.tsx
git commit -m "feat: add Multiple Choice mode with feedback and keyboard shortcuts"
```

---

### Task 7: Type-In Mode

**Files:**
- Create: `src/Pages/StudyPage/TypeInMode.tsx` (replaces placeholder)

- [ ] **Step 1: Write the component**

```tsx
import { useState, useEffect, useRef, useMemo } from "react"
import { Box, Flex, Input, Text, VStack } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { getTermsByCategory, type Term } from "../../data/terms"
import { useStudySession } from "../../hooks/useStudySession"

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "").trim()
}

function isMatch(input: string, term: Term): boolean {
  const n = normalize(input)
  const t = normalize(term.term)
  if (n === t) return true
  // Accept if input contains core word (first significant word of term)
  const core = normalize(term.term.split(" ")[0])
  if (core.length >= 5 && n.includes(core)) return true
  return false
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const TypeInMode = () => {
  const navigate = useNavigate()
  const { session, markMastered, markMissed, setPosition, setLastMode } = useStudySession()
  const category = (session.lastCategory ?? "all") as Parameters<typeof getTermsByCategory>[0]
  const filteredTerms = getTermsByCategory(category)

  // Weak terms first, then remaining, then mastered
  const ordered = useMemo(() => {
    const weak = filteredTerms.filter(t => (session.missedCounts[t.id] ?? 0) >= 2)
    const rest = filteredTerms.filter(t => !session.mastered.includes(t.id) && !weak.find(w => w.id === t.id))
    const mastered = filteredTerms.filter(t => session.mastered.includes(t.id))
    return [...shuffle(weak), ...shuffle(rest), ...shuffle(mastered)]
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [index, setIndex] = useState(session.positions.type)
  const [value, setValue] = useState("")
  const [result, setResult] = useState<"correct" | "wrong" | null>(null)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLastMode("type") }, [setLastMode])
  useEffect(() => { inputRef.current?.focus() }, [index])

  const term: Term | undefined = ordered[index]

  function check() {
    if (!term || result !== null) return
    const matched = isMatch(value, term)
    setResult(matched ? "correct" : "wrong")
    if (matched) { markMastered(term.id); setCorrect(c => c + 1) }
    else { markMissed(term.id); setWrong(w => w + 1) }
  }

  function giveUp() {
    if (!term || result !== null) return
    setResult("wrong")
    markMissed(term.id)
    setWrong(w => w + 1)
  }

  function advance() {
    const next = index + 1
    setIndex(next)
    setPosition("type", next)
    setValue("")
    setResult(null)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (result === null) check()
        else advance()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  })

  const progress = ordered.length > 0 ? (index / ordered.length) * 100 : 0

  if (!term) {
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={10} textAlign="center">
          <Text fontSize="3xl" mb={4}>🔤</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={2}>All done!</Text>
          <Text fontSize="sm" color={colors.textMuted} mb={8}>{correct} correct · {wrong} wrong</Text>
          <ActionBtn onClick={() => navigate("/study")}>Back to Hub</ActionBtn>
        </Box>
      </PageContainer>
    )
  }

  const isCorrect = result === "correct"
  const isWrong = result === "wrong"

  return (
    <PageContainer>
      <Box maxW="680px" mx="auto" px={6} py={8}>
        <Flex align="center" gap={3} mb={7}>
          <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>← Back</Box>
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🔤 Type the Term</Text>
          <Box ml="auto" bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={3} py="2px" fontSize="xs" color={colors.accent}>
            {category === "all" ? "All Terms" : category}
          </Box>
        </Flex>

        <Flex align="center" gap={3} mb={6}>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">Q {index + 1} of {ordered.length}</Text>
          <Box flex={1} h="6px" bg={colors.border} borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${progress}%`} bg={colors.accent} borderRadius="full" />
          </Box>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">{correct} ✓ &nbsp; {wrong} ✕</Text>
        </Flex>

        {/* Definition */}
        <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={8} mb={5}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={4}>Name this term</Text>
          <Text fontSize="md" color={colors.textMuted} lineHeight="1.7">{term.definition}</Text>
        </Box>

        {/* Input */}
        <VStack align="stretch" gap={2} mb={5}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} fontWeight="700">Your Answer</Text>
          <Flex gap={3}>
            <Input
              ref={inputRef}
              value={value}
              onChange={e => result === null && setValue(e.target.value)}
              placeholder="Type the term…"
              bg={isCorrect ? "#0d2a1e" : isWrong ? "#2a0d0d" : colors.surface}
              border={`1px solid ${isCorrect ? "#2cb67d" : isWrong ? "#ff6b6b" : colors.border}`}
              borderRadius="lg"
              color={colors.textPrimary}
              fontSize="md"
              p={4}
              h="auto"
              _focus={{ borderColor: colors.accent }}
              _placeholder={{ color: colors.textMuted }}
              readOnly={result !== null}
            />
            <Box
              as="button"
              onClick={result === null ? check : advance}
              bg={colors.accent}
              color={colors.pageBg}
              border="none"
              borderRadius="lg"
              px={5}
              fontSize="sm"
              fontWeight="800"
              cursor="pointer"
              whiteSpace="nowrap"
              _hover={{ bg: colors.accentSoft }}
            >
              {result === null ? "Check" : "Next →"}
            </Box>
          </Flex>
          {result === null && (
            <Text fontSize="xs" color={colors.textMuted}>
              Spelling doesn't have to be perfect. &nbsp;
              <Box as="button" onClick={giveUp} fontSize="xs" color={colors.accent} background="none" border="none" cursor="pointer" textDecoration="underline">
                Give up &amp; show answer
              </Box>
            </Text>
          )}
        </VStack>

        {/* Feedback */}
        {result !== null && (
          <Box
            bg={isCorrect ? "#0d2a1e" : "#2a0d0d"}
            border={`1px solid ${isCorrect ? "#2cb67d40" : "#ff6b6b40"}`}
            borderRadius="lg"
            p={4}
            display="flex"
            gap={3}
          >
            <Text fontSize="lg">{isCorrect ? "✅" : "❌"}</Text>
            <Box>
              <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} mb={1}>
                {isCorrect ? `✓ ${term.term}` : `Answer: ${term.term}${value ? ` (you typed: "${value}")` : ""}`}
              </Text>
              <Text fontSize="xs" color={colors.textMuted} lineHeight="1.5">
                {isCorrect ? `${term.category} · ${term.definition.slice(0, 80)}…` : term.definition.slice(0, 120) + "…"}
              </Text>
            </Box>
          </Box>
        )}

        <Text textAlign="center" fontSize="xs" color={colors.border} mt={4}>
          Enter to check · Enter again for next
        </Text>
      </Box>
    </PageContainer>
  )
}

const ActionBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <Box
    as="button"
    onClick={onClick}
    w="100%"
    bg={colors.accent}
    color={colors.pageBg}
    border="none"
    borderRadius="lg"
    py={4}
    fontSize="md"
    fontWeight="800"
    cursor="pointer"
    _hover={{ bg: colors.accentSoft }}
  >
    {children}
  </Box>
)

export default TypeInMode
```

- [ ] **Step 2: Verify build and visual check**

```bash
npm run build && npm run dev
```

Navigate to `http://localhost:5173/study/type`. Expected: definition shown, input field focused, Enter checks answer, fuzzy match accepts "neapolitan" for "Neapolitan Sixth".

- [ ] **Step 3: Commit**

```bash
git add src/Pages/StudyPage/TypeInMode.tsx
git commit -m "feat: add Type-In mode with fuzzy matching and give-up option"
```

---

### Task 8: Matching Mode

**Files:**
- Create: `src/Pages/StudyPage/MatchingMode.tsx` (replaces placeholder)

- [ ] **Step 1: Write the component**

```tsx
import { useState, useEffect, useMemo } from "react"
import { Box, Flex, Text } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { getTermsByCategory, type Term } from "../../data/terms"
import { useStudySession } from "../../hooks/useStudySession"

const ROUND_SIZE = 8

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface MatchItem {
  id: number
  text: string
  type: "term" | "def"
  matched: boolean
  wrongFlash: boolean
}

const MatchingMode = () => {
  const navigate = useNavigate()
  const { session, markMastered, setPosition, setLastMode } = useStudySession()
  const category = (session.lastCategory ?? "all") as Parameters<typeof getTermsByCategory>[0]
  const filteredTerms = getTermsByCategory(category)

  const shuffledAll = useMemo(() => shuffle(filteredTerms), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [roundIndex, setRoundIndex] = useState(session.positions.match)
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null)
  const [selectedDef, setSelectedDef] = useState<number | null>(null)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [roundComplete, setRoundComplete] = useState(false)

  useEffect(() => { setLastMode("match") }, [setLastMode])

  const roundTerms: Term[] = useMemo(() => {
    const start = roundIndex * ROUND_SIZE
    return shuffledAll.slice(start, start + ROUND_SIZE)
  }, [shuffledAll, roundIndex])

  const [items, setItems] = useState<{ terms: MatchItem[]; defs: MatchItem[] }>(() => buildRound(roundTerms))

  useEffect(() => {
    setItems(buildRound(roundTerms))
    setSelectedTerm(null)
    setSelectedDef(null)
    setWrongAttempts(0)
    setRoundComplete(false)
  }, [roundIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  function buildRound(terms: Term[]): { terms: MatchItem[]; defs: MatchItem[] } {
    return {
      terms: shuffle(terms.map(t => ({ id: t.id, text: t.term, type: "term" as const, matched: false, wrongFlash: false }))),
      defs:  shuffle(terms.map(t => ({ id: t.id, text: t.definition.slice(0, 120) + (t.definition.length > 120 ? "…" : ""), type: "def" as const, matched: false, wrongFlash: false }))),
    }
  }

  function selectTerm(id: number) {
    if (items.terms.find(t => t.id === id)?.matched) return
    setSelectedTerm(id)
    if (selectedDef !== null) attemptMatch(id, selectedDef)
  }

  function selectDef(id: number) {
    if (items.defs.find(d => d.id === id)?.matched) return
    setSelectedDef(id)
    if (selectedTerm !== null) attemptMatch(selectedTerm, id)
  }

  function attemptMatch(termId: number, defId: number) {
    if (termId === defId) {
      // Correct
      setItems(prev => ({
        terms: prev.terms.map(t => t.id === termId ? { ...t, matched: true } : t),
        defs:  prev.defs.map(d => d.id === defId ? { ...d, matched: true } : d),
      }))
      markMastered(termId)
      setSelectedTerm(null)
      setSelectedDef(null)
      // Check round complete
      setItems(prev => {
        const allMatched = prev.terms.every(t => t.matched || t.id === termId)
        if (allMatched) setTimeout(() => setRoundComplete(true), 300)
        return prev
      })
    } else {
      // Wrong — flash both red then deselect
      setWrongAttempts(w => w + 1)
      setItems(prev => ({
        terms: prev.terms.map(t => t.id === termId ? { ...t, wrongFlash: true } : t),
        defs:  prev.defs.map(d => d.id === defId ? { ...d, wrongFlash: true } : d),
      }))
      setTimeout(() => {
        setItems(prev => ({
          terms: prev.terms.map(t => ({ ...t, wrongFlash: false })),
          defs:  prev.defs.map(d => ({ ...d, wrongFlash: false })),
        }))
        setSelectedTerm(null)
        setSelectedDef(null)
      }, 350)
    }
  }

  function nextRound() {
    const next = roundIndex + 1
    setRoundIndex(next)
    setPosition("match", next)
  }

  const matched = items.terms.filter(t => t.matched).length
  const total = roundTerms.length
  const progress = total > 0 ? (matched / total) * 100 : 0
  const totalRounds = Math.ceil(filteredTerms.length / ROUND_SIZE)
  const isLastRound = (roundIndex + 1) >= totalRounds

  if (roundTerms.length === 0) {
    return (
      <PageContainer>
        <Box maxW="900px" mx="auto" px={6} py={10} textAlign="center">
          <Text fontSize="3xl" mb={4}>🔗</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={2}>All rounds complete!</Text>
          <ActionBtn onClick={() => navigate("/study")}>Back to Hub</ActionBtn>
        </Box>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Box maxW="900px" mx="auto" px={6} py={8}>
        <Flex align="center" gap={3} mb={7}>
          <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>← Back</Box>
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🔗 Matching</Text>
          <Box ml="auto" bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={3} py="2px" fontSize="xs" color={colors.accent}>
            {category === "all" ? "All Terms" : category} · Round {roundIndex + 1} of {totalRounds}
          </Box>
        </Flex>

        <Flex align="center" gap={3} mb={2}>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">{matched} of {total} matched</Text>
          <Box flex={1} h="6px" bg={colors.border} borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${progress}%`} bg={colors.accent} borderRadius="full" style={{ transition: "width 0.3s" }} />
          </Box>
        </Flex>

        <Text fontSize="xs" color={colors.textMuted} mb={6}>
          Click a term, then click its definition. Wrong pairs flash red.
        </Text>

        {roundComplete ? (
          <Box bg="#0d2a1e" border="1px solid #2cb67d40" borderRadius="xl" p={8} textAlign="center" mb={6}>
            <Text fontSize="2xl" fontWeight="800" color="#2cb67d" mb={2}>Round Complete! 🎉</Text>
            <Text fontSize="sm" color={colors.textMuted} mb={6}>
              {total} / {total} matched · {wrongAttempts} wrong {wrongAttempts === 1 ? "attempt" : "attempts"}
            </Text>
            {isLastRound ? (
              <ActionBtn onClick={() => navigate("/study")}>All Done — Back to Hub</ActionBtn>
            ) : (
              <ActionBtn onClick={nextRound}>Next Round →</ActionBtn>
            )}
          </Box>
        ) : (
          <>
            {/* Column labels */}
            <Flex gap={4} mb={2}>
              <Box flex={1} textAlign="center">
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} fontWeight="700">Terms</Text>
              </Box>
              <Box flex={1} textAlign="center">
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} fontWeight="700">Definitions</Text>
              </Box>
            </Flex>

            {/* Two columns */}
            <Flex gap={4} mb={6}>
              <Box flex={1} display="flex" flexDirection="column" gap={3}>
                {items.terms.map(item => (
                  <MatchCell
                    key={item.id}
                    item={item}
                    isSelected={selectedTerm === item.id}
                    onClick={() => !item.matched && selectTerm(item.id)}
                  />
                ))}
              </Box>
              <Box flex={1} display="flex" flexDirection="column" gap={3}>
                {items.defs.map(item => (
                  <MatchCell
                    key={item.id}
                    item={item}
                    isSelected={selectedDef === item.id}
                    onClick={() => !item.matched && selectDef(item.id)}
                  />
                ))}
              </Box>
            </Flex>

            <Text textAlign="center" fontSize="xs" color={colors.border}>
              {wrongAttempts} wrong {wrongAttempts === 1 ? "attempt" : "attempts"} this round
            </Text>
          </>
        )}
      </Box>
    </PageContainer>
  )
}

interface MatchCellProps {
  item: MatchItem
  isSelected: boolean
  onClick: () => void
}

const MatchCell = ({ item, isSelected, onClick }: MatchCellProps) => {
  let borderColor = colors.border
  let bg = colors.surface
  let textColor = colors.textMuted

  if (item.matched) { borderColor = "#2cb67d"; bg = "#0d2a1e"; textColor = "#2cb67d" }
  else if (item.wrongFlash) { borderColor = "#ff6b6b"; bg = "#2a0d0d" }
  else if (isSelected) { borderColor = colors.accent; bg = colors.deepBlue }

  return (
    <Box
      onClick={item.matched ? undefined : onClick}
      bg={bg}
      border={`1px solid ${borderColor}`}
      borderRadius="lg"
      p={3}
      fontSize="xs"
      color={item.matched ? textColor : isSelected ? colors.textPrimary : colors.textMuted}
      cursor={item.matched ? "default" : "pointer"}
      minH="52px"
      display="flex"
      alignItems="center"
      lineHeight="1.4"
      style={{ transition: "all 0.12s", fontWeight: item.type === "term" ? 700 : 400 }}
      _hover={!item.matched ? { borderColor: colors.accentSoft } : {}}
    >
      {item.text}
    </Box>
  )
}

const ActionBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <Box
    as="button"
    onClick={onClick}
    w="100%"
    bg={colors.accent}
    color={colors.pageBg}
    border="none"
    borderRadius="lg"
    py={4}
    fontSize="md"
    fontWeight="800"
    cursor="pointer"
    _hover={{ bg: colors.accentSoft }}
  >
    {children}
  </Box>
)

export default MatchingMode
```

- [ ] **Step 2: Verify build and visual check**

```bash
npm run build && npm run dev
```

Navigate to `http://localhost:5173/study/match`. Expected: two columns (terms | definitions), clicking a term then correct definition locks them green, wrong pair flashes red, round complete banner appears after all 8 matched.

- [ ] **Step 3: Commit**

```bash
git add src/Pages/StudyPage/MatchingMode.tsx
git commit -m "feat: add Matching mode with 8-pair rounds and wrong-flash animation"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| 115 terms in 9 categories, TypeScript typed | Task 1 |
| sessionStorage hook: mastered, missed, missedCounts, streak, positions | Task 2 |
| Weak terms (missed 2+) | Task 2 — computed in hook |
| Routes: /study, /study/flashcards, /study/quiz, /study/type, /study/match | Task 3 |
| Study nav link in header | Task 3 |
| Hub: session banner, category filter, mode cards, start button, resume position | Task 4 |
| Flashcards: flip, ✕/✓ buttons, keyboard (Space/←/→), progress, streak | Task 5 |
| Flashcards: buttons disabled until flipped | Task 5 — opacity 0.3 + cursor not-allowed |
| Multiple choice: 4 options, same-category distractors, immediate feedback | Task 6 |
| Multiple choice: up to 40 questions (or all if fewer) | Task 6 — Math.min(QUIZ_SIZE, length) |
| Type-in: fuzzy match, give up link, weak terms first | Task 7 |
| Matching: 8 pairs per round, wrong flash, round complete screen | Task 8 |
| All modes write to session (markMastered/markMissed) | Tasks 5–8 |
| Dark theme using colors from Theme.ts | All tasks |

**Placeholder scan:** No TBDs or TODOs. All code blocks are complete and self-contained.

**Type consistency:**
- `useStudySession` returns `{ session, weakTerms, markMastered, markMissed, setPosition, setLastMode, setLastCategory, resetSession }` — used consistently across Tasks 4–8
- `getTermsByCategory` signature `(category: Category | "all"): Term[]` — used consistently
- `session.positions` keys: `"flashcards" | "quiz" | "type" | "match"` — match route keys used in `setPosition` calls
