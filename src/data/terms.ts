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
  id: number;
  category: string;
  term: string;
  definition: string;
}

export const ALL_TERMS: Term[] = [
  // ── Modes (1–7) ──────────────────────────────────────────────────────────
  {
    id: 1,
    category: "Modes",
    term: "Ionian",
    definition: "The name assigned by Glarean in the Dodecachordon (1547) to the authentic mode on C, which uses the diatonic octave species c′–c″ divided at g′ and consisting of a 5th (tone–tone–semitone–tone) plus a 4th (tone–tone–semitone). Therefore, c′–d′–e′–f′–g′ + g′–a′–b′–c″. Simply, the melodic mode with a pitch series corresponding to that of the major scale.",
  },
  {
    id: 2,
    category: "Modes",
    term: "Dorian",
    definition: "The common name for the first of the eight church modes, the authentic mode on D. In the Middle Ages and Renaissance the Dorian mode was described in two ways: as the diatonic octave species from d to d′, divided at A and composed of a 5th (tone–semitone–tone–tone) plus a 4th (tone–semitone–tone), thus d–e–f–g–a + a–b–c′–d′; and as a mode whose Final was d and whose Ambitus was c–d′.",
  },
  {
    id: 3,
    category: "Modes",
    term: "Phrygian",
    definition: "The common name for the third of the eight church modes, the authentic mode on E. In the Middle Ages and Renaissance the Phrygian mode was described in two ways: as the diatonic octave species from e to e′, divided at b and composed of a second species of 5th (semitone–tone–tone–tone) plus a second species of 4th (semitone–tone–tone), thus e–f–g–a–b + b–c′–d′–e′; and as a mode whose Final was e and whose Ambitus was d–e′.",
  },
  {
    id: 4,
    category: "Modes",
    term: "Lydian",
    definition: "The common name for the fifth of the eight church modes, the authentic mode on F. In the Middle Ages and Renaissance the Lydian mode was described in two ways: as the diatonic octave species from f to f′, divided at c′ and consisting of a third species of 5th (tone–tone–tone–semitone) plus a third species of 4th (tone–tone–semitone), thus f–g–a–b–c′ + c′–d′–e′–f′; and as a mode whose Final was f and whose Ambitus was f–f′ (or f–g′).",
  },
  {
    id: 5,
    category: "Modes",
    term: "Mixolydian",
    definition: "The common name for the seventh of the eight church modes, the authentic mode on G. In the Middle Ages and Renaissance the Mixolydian mode was described in two ways: as the diatonic octave species from g to g′, divided at d′ and composed of a fourth species of 5th (tone–tone–semitone–tone) plus a first species of 4th (tone–semitone–tone), thus g–a–b–c′–d′+ d′–e′–f′–g′; and as a mode whose Final was g and whose Ambitus was f–g′.",
  },
  {
    id: 6,
    category: "Modes",
    term: "Aeolian",
    definition: "The name assigned by Glarean in the Dodecachordon (1547) to the authentic mode on A, which uses the diatonic octave species a–a′, divided at e′ and composed of a first species of 5th (tone–tone–semitone–tone) plus a second species of 4th (semitone–tone–tone), thus a–b–c′–d′–e′ + e′–f′–g′–a′. With this octave species identical to that of the natural minor scale on A, the Aeolian mode, together with its plagal counterpart, the Hypoaeolian, closely resembles the descending melodic minor scale.",
  },
  {
    id: 7,
    category: "Modes",
    term: "Locrian",
    definition: "The term commonly used when referring to the octave species from B to b divided at f and consisting of a diminished 5th plus an augmented 4th, B–c–d–e–f + f–g–a–b.",
  },

  // ── Scales (8–13) ─────────────────────────────────────────────────────────
  {
    id: 8,
    category: "Scales",
    term: "Melodic Minor Scale",
    definition: "The melodic minor scale has a raised scale-degree 6 and a raised ^7 when it is ascending, borrowing the leading-tone from the major scale; in descending, though, it is the same as the natural minor scale.",
  },
  {
    id: 9,
    category: "Scales",
    term: "Harmonic Minor Scale",
    definition: "The harmonic minor scale is same as natural minor scale but it has a raised scale-degree 7, in accordance with the need for a major triad on the dominant, V (the Dominant chord).",
  },
  {
    id: 10,
    category: "Scales",
    term: "Natural Minor Scale",
    definition: "A diatonic scale whose octave, in its natural form, is built of the following ascending intervals, in which T stands for a whole tone and S for a semitone: T–S–T–T–S–T–T. This scale does not have the leading tone. In many musical traditions, that's not a problem (e.g., Chinese folk music). In Western music, the natural minor scale is not used as frequently as the harmonic minor. The natural minor scale has the same notes as its relative major. E.g., C major scale, rotated to start on A.",
  },
  {
    id: 12,
    category: "Scales",
    term: "Octatonic Scale",
    definition: "It typically refers to an 8-note scale with alternating whole tones and semitones. It's a symmetrical scale but can be exploited for major and minor triads. There are three distinct OCT collections, labeled OCT0,1, OCT1,2, and OCT2,3.",
  },
  {
    id: 13,
    category: "Scales",
    term: "Pentatonic Scale",
    definition: "Any five-note scale, but typically refers to the major pentatonic C-D-E-G-A and its transpositions and permutations. (do, re, mi, sol, la) The \"minor\" pentatonic starts on A.",
  },

  // ── Scale Degrees (14–21) ─────────────────────────────────────────────────
  {
    id: 14,
    category: "Scale Degrees",
    term: "Tonic",
    definition: "Scale-degree 1 (do). Refers to the scale-degree and the chord built on ^1. The most stable of all the diatonic triads.",
  },
  {
    id: 15,
    category: "Scale Degrees",
    term: "Dominant",
    definition: "Scale-degree 5 (sol): scale-degree 5 and the major triad built on ^5. Unstable b/c it contains the Leading-tone, and wants to resolve to tonic. When a chordal 7th is added, the tritone between fa and ti wants to resolve even more. V is the most important triad for defining a key.",
  },
  {
    id: 16,
    category: "Scale Degrees",
    term: "Subdominant",
    definition: "Scale degree 4 (fa) and the triad built on ^4. Can be major (IV) in a major key or minor (iv) in a minor key. Typically has Pre-dominant function but can also participate in a plagal I-IV-I or I-iv-I progression.",
  },
  {
    id: 17,
    category: "Scale Degrees",
    term: "Mediant",
    definition: "Scale degree 3 (mi/me) and the triad built on ^3. In a major key, iii is minor. In a minor key, III is the relative, therefore easy to tonicize and modulate to. In sonata form, it's common to go i-III or i-III-v in the exposition. In major, iii is not common and its function may be ambiguous. It can be a tonic substitute, a dominant substitute, or participate in a descending-5th sequence.",
  },
  {
    id: 18,
    category: "Scale Degrees",
    term: "Submediant",
    definition: "Scale degree 6 (la/le) and the triad built on ^6. It's minor (vi) in major keys and usually major (VI) in minor keys. vi and VI may have pre-dominant function, or it may act as a tonic substitute. When using modal mixture (borrowing from parallel minor), ^6 is important, because it is one of the scale degrees that's altered.",
  },
  {
    id: 19,
    category: "Scale Degrees",
    term: "Supertonic",
    definition: "Scale degree 2 (re) and the triad built on ^2. It's minor (ii) in major keys and diminished (iio) in minor keys. Pre-dominant function. Often happens in first inversion. ^2 also supports V/V, so V(7)/V can be thought of as an inflected/more intense version of the diatonic ii(7) chord. Within Renaissance contrapuntal cadences and species counterpoint, ^2-1 in the bass is standard.",
  },
  {
    id: 20,
    category: "Scale Degrees",
    term: "Leading Tone",
    definition: "Scale degree 7 (ti) and the diminished triad it supports: has a weaker dominant function (when compared to V); unstable because of the diminished (viio) quality and tritone (ti-fa) that pulls towards tonic. If you add ^5 (sol) you get a dominant (V7) chord which has an even stronger pull towards tonic. The LT is a tendency tone that resolves upward, but in an inner voice it can go down to ^5. In minor, the leading tone, ti, has to be manually raised from te.",
  },
  {
    id: 21,
    category: "Scale Degrees",
    term: "Subtonic",
    definition: "Scale degree lowered 7 (te) and the triad built on ^7 which has a major (VII) quality in minor keys. This \"natural\" VII is V/III, and is a good pivot when modulating from a minor key to its relative major. In popular music, it's used more frequently: Double plagal ♭VII–IV–I; Subtonic shuttle I–♭VII; Aeolian shuttle i–♭VII–♭VI–♭VII; Aeolian cadence ♭VI–♭VII–i (or I).",
  },

  // ── Harmony (22–36) ───────────────────────────────────────────────────────
  {
    id: 22,
    category: "Harmony",
    term: "Secondary Dominant",
    definition: "A dominant (V or V7 and its inversions) of a key outside the main key of a passage. The secondary dominant creates a strong pull to the chord it tonicizes. For example, a V/V chord resolves to a V. Common SDs include V/V, V/vi, V/IV, V/III in minor, V/ii. The viio triad cannot be tonicized.",
  },
  {
    id: 23,
    category: "Harmony",
    term: "Secondary Function",
    definition: "This term is vague and no longer in use by professional theorists. You can ignore this.",
  },
  {
    id: 24,
    category: "Harmony",
    term: "Tonicization",
    definition: "The act of establishing a new key center, or of giving a degree other than ^1 the role of tonic. This is accomplished by emphasizing the crucial properties of that tonic, in particular its fourth scale degree and leading note, both of which are part of its dominant 7th chord. The term 'tonicization' is sometimes used in a local context to characterize modulation at a low level, where a new key is touched on only briefly. Extended tonicization refers to a few chords in a row that all belong to a temporary new key.",
  },
  {
    id: 25,
    category: "Harmony",
    term: "Modulation",
    definition: "In tonal music, a firmly established change of key, as opposed to a passing reference to another key, known as a 'tonicization'. The scale and characteristic harmonic progressions of the new key must be present, and there will usually be at least one cadence to the new tonic. Firm establishment also depends on these features having a certain duration; however, the exact amount of time required for a 'firm' modulation is not specific.",
  },
  {
    id: 26,
    category: "Harmony",
    term: "Modal Mixture (Borrowing)",
    definition: "Modal mixture (or borrowing) is the harmonic technique of mixing the notes from the parallel major and natural-minor modes (e.g., C major and C minor). This results in changing the chord qualities and/or harmonic \"color\" to achieve expressive effects not available in the main scale itself. In the majority of cases, this occurs in major-key pieces where notes from the parallel minor are borrowed. Borrowed scale-degrees include ^b3, ^b6, ^b7. Pre-dominant chords like iiø7, iv, bVI are common.",
  },
  {
    id: 27,
    category: "Harmony",
    term: "Cadential 6/4",
    definition: "A chord that looks like a I 6/4 chord but functions as an elaboration of the dominant because it is really a root-position dominant chord with two non-harmonic tones (suspensions and/or passing tones). When these two non-harmony tones resolve, we can clearly see the expected V chord. To convey the chord's dominant function as well as its voice leading, the preferred label for the cadential 6/4 and its resolution is V 6/4 – 5/3. As its name suggests, this chord is especially common at cadences.",
  },
  {
    id: 28,
    category: "Harmony",
    term: "Passing 6/4 Chord",
    definition: "The passing (pass.) 6/4 chord is a 6/4 chord built on a passing tone in the bass. It's most commonly found prolonging tonic or predominant harmonies. Importantly, the chords on both sides of the pass.6/4 are always the same function (e.g., iv6−pass.6/4−iio6), not of different function. P6/4 often involves a voice exchange.",
  },
  {
    id: 29,
    category: "Harmony",
    term: "Neighboring / Pedal Six-Four Chord",
    definition: "This is a chord that consists of a static bass over which two voices have upper-neighbor motion. The name \"pedal\" reflects the static pedal in the bass. It's most commonly found prolonging I or V.",
  },
  {
    id: 30,
    category: "Harmony",
    term: "Neapolitan Sixth (♭II6)",
    definition: "The Neapolitan sixth (♭II6) is a chromatically predominant chord. It is a major triad built on ra (↓^2) and is typically found in first inversion. The Neapolitan sixth is essentially a chromatic version of a iio6 chord. It's a chromatic predominant. It functions the same and can be used in the same context, but it has a more dramatic effect because of its chromatic root, ra (↓^2). Like iio6, it is typically used in a cadential context. ♭II6 can be found in major and minor keys but is more common in minor keys. Due to the similarities between ♭II6 and iio6, both are approached harmonically in the same way. The ^b2 needs to resolve down to ^7, sometimes passing through ^1.",
  },
  {
    id: 31,
    category: "Harmony",
    term: "Italian Augmented Sixth (It.+6)",
    definition: "Augmented sixth chords are a category of chromatic pre-dominant harmonies whose name is derived from the inclusion of a very specific interval: the augmented sixth between le and fi (↓^6–↑^4). Typically in the outer voices. Each augmented sixth chord (Italian, German, and French) contains one or two other scale degrees in addition to this interval. Augmented sixth chords can occur in both major and minor keys, but they're more common in minor. The tendency tones (fi and le) resolve outward to an octave, ^5 in both soprano and bass (root-position V). The Italian augmented sixth contains le, do, and fi.",
  },
  {
    id: 32,
    category: "Harmony",
    term: "German Augmented Sixth (Ger.+6)",
    definition: "Augmented sixth chords are a category of chromatic pre-dominant harmonies whose name is derived from the inclusion of a very specific interval: the augmented sixth between le and fi (↓^6–↑^4). Typically in the outer voices. Each augmented sixth chord (Italian, German, and French) contains one or two other scale degrees in addition to this interval. Augmented sixth chords can occur in both major and minor keys, but they're more common in minor. The tendency tones (fi and le) resolve outward to an octave, ^5 in both soprano and bass (root-position V). The Ger.+6 first has to go to a cadential 6/4.",
  },
  {
    id: 33,
    category: "Harmony",
    term: "French Augmented Sixth (Fr.+6)",
    definition: "Augmented sixth chords are a category of chromatic pre-dominant harmonies whose name is derived from the inclusion of a very specific interval: the augmented sixth between le and fi (↓^6–↑^4). Typically in the outer voices. Each augmented sixth chord (Italian, German, and French) contains one or two other scale degrees in addition to this interval. Augmented sixth chords can occur in both major and minor keys, but they're more common in minor. The tendency tones (fi and le) resolve outward to an octave, ^5 in both soprano and bass (root-position V). The French augmented sixth contains le, do, re, and fi.",
  },
  {
    id: 34,
    category: "Harmony",
    term: "Ninth Chord",
    definition: "Adding ^6 to V7 produces the dominant ninth chord (e.g., G-B-D-F-A is V9 in C major). The A is the added note, the chordal 9th. You can also have a minor 9th, Ab. The 9th replaces a doubled root, and resolves downward by step.",
  },
  {
    id: 35,
    category: "Harmony",
    term: "Pivot Chord",
    definition: "The point where the original key and the new key are momentarily fused; a single chord that is diatonic in both the existing key and the new key, thus smoothly connecting the two keys. If modulating to V, for instance, common pivots are: vi6 becoming ii6, I becoming IV.",
  },
  {
    id: 36,
    category: "Harmony",
    term: "Quartal Harmony",
    definition: "A quartal harmony is a sonority derived from stacked 4ths, typically perfect 4ths, while a quintal harmony is a sonority derived from stacked 5ths. C-F-Bb-Eb, etc. Debussy, for instance, used this sonority a lot.",
  },

  // ── 20th-Century Techniques (37–43) ───────────────────────────────────────
  {
    id: 37,
    category: "20th-Century Techniques",
    term: "Tone Cluster",
    definition: "Any collection of three or more adjacent pitches may correctly be referred to as a tone cluster. A combination of notes sounded together, each of which is a scale degree apart from one or two neighboring tones in the group. Example, C-D-E struck simultaneously are a tone cluster. The term was coined by the American composer Henry Cowell, whose early experiments called for pianists to play certain passages with fists, palms, and frequently, the entire forearm.",
  },
  {
    id: 38,
    category: "20th-Century Techniques",
    term: "Polychord",
    definition: "A polychord consists of two or more chords from different harmonic areas, sounded simultaneously. The components of a polychord are called chordal units. A variety of polychords may be built from superimposed triads, seventh chords and other tertian sonorities. A polychord typically consists of two triads sounding simultaneously. A polychord could also consist of two seventh chords, or a seventh chord and triad. Additionally, a polychord could conceivably consist of more than two triads or seventh chords, since the prefix \"poly\" means \"many\". Perhaps the most famous polychord is the \"Rite of Spring\" chord by Stravinsky, an E♭ chord sounding over an F♭ major chord, which occurs during the \"Dance of the Adolescents.\"",
  },
  {
    id: 39,
    category: "20th-Century Techniques",
    term: "Pitch Class",
    definition: "Notes an octave apart or enharmonically equivalent belong to the same pitch class. There are 12 pitch classes in all. Register doesn't matter. E.g., middle C and the soprano high C and the low cello C all belong to the same pitch class. C=0; C#/Db=1; etc.",
  },
  {
    id: 40,
    category: "20th-Century Techniques",
    term: "Pitch Class Set",
    definition: "Term used to describe pitch structures in atonal music; meaningful groups of related pitch classes. E.g., a set with three notes is a trichord, a set with four notes is a tetrachord, etc. A set with six notes is a hexachord. A set can be transposed or inverted. To find sets, one needs to segment the musical surface and see if there are consistent trichords/tetrachords/pentachords/hexachords that repeat, either vertically or horizontally.",
  },
  {
    id: 41,
    category: "20th-Century Techniques",
    term: "Set Class",
    definition: "A family of pitch-class sets related by transposition and/or inversion. A set class has a prime form and an Allen Forte number. Prime forms of sets are ordered from most packed to the left to least packed.",
  },
  {
    id: 42,
    category: "20th-Century Techniques",
    term: "Twelve-Tone Row",
    definition: "A twelve-tone row or twelve-tone series is an ordered arrangement of the twelve pitch classes. Twelve-tone music thus involves a basic row which consists of the aggregate (the total chromatic) and which is presented in a particular ordering. There is a Prime form, an Inverted form, a Retrograde form, and Retrograde-Inv. There are 48 in all, which form a matrix.",
  },
  {
    id: 43,
    category: "20th-Century Techniques",
    term: "Enharmonically Equivalent",
    definition: "Notes that have the same pitch (same key on the piano) but are spelled differently, like E and Fb, are said to be enharmonic (or enharmonically equivalent). By respelling a note, you can modulate to distantly related keys. E.g., a V7 and a Ger.+6 are the \"same\" if you respell an +6 into a minor 7th. Another example: a viio7 chord can resolve four ways depending on the spelling.",
  },

  // ── Key Relationships (44–50) ─────────────────────────────────────────────
  {
    id: 44,
    category: "Key Relationships",
    term: "Parallel Keys",
    definition: "Major and minor keys that share the same starting note, i.e., the same tonic. E.g., A major and A minor.",
  },
  {
    id: 45,
    category: "Key Relationships",
    term: "Relative Keys",
    definition: "Scales that share the same key signatures, e.g., E minor and G major. (Keys sharing the same notes [key signatures] but having different tonics. Such as c minor and Eb major.)",
  },
  {
    id: 46,
    category: "Key Relationships",
    term: "Closely Related Keys",
    definition: "Relative key, dominant key (and its relative), and subdominant key (and its relative). Key signatures one degree \"sharper\" or \"flatter\" than the starting key. For C major: A minor, G major, E minor, F major, D minor. (Keys that differ from the primary key by no more than one accidental are called closely related keys. Such as G major and D major.)",
  },
  {
    id: 47,
    category: "Key Relationships",
    term: "Chromatic Mediants",
    definition: "Compared to the home key, there are four third-related keys, meeting these two conditions: 1. the root is a m3 or M3 from the home key; 2. both major or minor triads. (Chords that have bass notes a major or minor third away [both up and down], where each chord has same quality as the original chord and each chord shares one common tone with the original. For example, for a C major triad [C E G], there are four such chords, [E G# B, Eb G Bb, Ab C Eb, A C# E]; in a c-minor chord [C Eb G], there are four minor triads, they would be [Eb Gb Bb, E G B, Ab Cb Eb, A C E].)",
  },
  {
    id: 48,
    category: "Key Relationships",
    term: "Distantly Related Keys",
    definition: "Anything outside of the five closely related keys. (Keys that differ from the primary key by more than one accidental are called distantly related keys. In C major, all keys other than G, e, F, d, and a are distant.)",
  },
  {
    id: 49,
    category: "Key Relationships",
    term: "Circle of Fifths",
    definition: "The arrangement of the tonics of the 12 major or minor keys by ascending or descending perfect 5ths, thus making a closed circle. Example: a descending circle-of-fifth sequence is most common. Key signatures are arranged by adding or subtracting fifths.",
  },
  {
    id: 50,
    category: "Key Relationships",
    term: "Harmonic Sequence",
    definition: "Diatonic sequences repeat a musical segment (this \"segment\" can be a single chord or a pair of chords) and are transposed in a regular pattern within a key. Common diatonic sequences including descending fifths, descending thirds (Pachelbel), ascending 5-6; ascending-fifth sequences are less common. The outer voices form a linear intervallic pattern, e.g., 10-8 10-8, 10-7 10-7, 5-8 5-8. Chromatic sequences may include applied (secondary) dominants. These sequences avoid strict transposition of both interval size and quality. Chromatic sequences differ from diatonic sequences in that both the size and quality of the interval of transposition is maintained throughout the sequence. Diatonic sequences preserve the interval size, but not the quality, to ensure that they stay within a single key. With all sequences, the voice leading must be consistent within every voice. Chord voicings should match between all corresponding components.",
  },

  // ── Voice Leading (51–55, 74–75) ──────────────────────────────────────────
  {
    id: 51,
    category: "Voice Leading",
    term: "Parallel Fifths and Octaves",
    definition: "The simultaneous melodic movement of two or more parts in the same direction and at a distance of a fifth or an octave. Components of bad voice leading containing parallel motion between two+ voices. The Perfect 5th and the octave are both perfect consonances, which do not promote independence of voices. Leads to musically thin voicings by making 4 voices sound like 3.",
  },
  {
    id: 52,
    category: "Voice Leading",
    term: "Voice Crossing",
    definition: "In four-part writing (SATB), when two voices \"swap\", e.g., when the Tenor plays a note that's higher than the Alto. Normally the Alto's register should be higher than the Tenor's. In pedagogical exercises this is forbidden, because it can cause registral confusion. But it does happen in actual repertoire from the medieval times through the 19th century. When the alto crosses above the soprano, the upper melody can be masked. It is common in Bach chorales but not recommended for beginning composition students.",
  },
  {
    id: 53,
    category: "Voice Leading",
    term: "Cross Relation",
    definition: "Also known as a false relation; chromatic contradiction between two notes sounded together or in different voices of adjacent chords. When a pitch in one voice is followed by a chromatic alternation of the same pitch in another voice. Often happens in minor keys. Best avoided in part-writing. Example: C-natural in Alto part, followed immediately by a C# in the Tenor part on the next beat.",
  },
  {
    id: 54,
    category: "Voice Leading",
    term: "Appoggiatura",
    definition: "Type of accented non-chord tone that is approached by leap and left by step. It is usually on the beat or on the strong part of a beat. Usually you leap up to this note and let it fall by step to the \"true\" chord tone. Abbreviation: (app.) Example: a C major chord is going to a G major chord; the top voice of C chord leaps from G (part of the C chord) to the note E, followed by a step down to D (part of the G chord). Because its purpose was mainly expressive, the typical appoggiatura in 17th- and 18th-century music occurred on the beat, rather than before it, \"leaning\" on the principal note, as suggested by the term's etymology. The most common sign for the appoggiatura was a small note indicating the precise pitch of the ornament; but the duration of the app. could be longer or very short, which depended upon the context and was governed by broadly acknowledged conventions. Appoggiaturas were not always written out in Baroque music, even where their performance was taken for granted.",
  },
  {
    id: 55,
    category: "Voice Leading",
    term: "Escape Tone",
    definition: "Type of non-chord tone that is approached by step and left by leap in opposite direction. Usually happens on the weak part of the beat. Abbreviation: (ech.) Example: a C major chord is going to a G major chord; CM chord's top voice has an escape tone from C going step up to D (the escape tone), which leaps down to B, part of the GM chord. An escape tone (ET) or echappée is a particular type of unaccented incomplete neighbor tone that is approached stepwise from a chord tone and resolved by skip in the opposite direction back to the next harmony.",
  },
  {
    id: 74,
    category: "Voice Leading",
    term: "Suspension",
    definition: "Accented non-chord tone. Because it is on the strong beat, figured bass symbols are given below the continuo line. A means of creating tension by letting a consonant note hold over the bar line while the underlying harmony changes (i.e., the bass changes). 7-6 and 4-3 and 9-8 are upper-voice suspensions while 2-3 is a bass suspension. A suspension has three stages: weak-beat preparation / strong-beat dissonant suspension / weak-beat consonant resolution.",
  },
  {
    id: 75,
    category: "Voice Leading",
    term: "Retardation",
    definition: "Is usually an accented non-chord tone, meaning it occurs on a downbeat. A retardation is approached by the same note and resolves up by step. The opposite melodic contour compared to a suspension.",
  },

  // ── Fugue / Counterpoint (56–63) ──────────────────────────────────────────
  {
    id: 56,
    category: "Fugue",
    term: "Fugal Subject",
    definition: "Melodic material presented at the beginning of a fugue by a single voice, which is stated by each voice in turn in the exposition. The subject usually emphasizes certain pitches, e.g., ^1 and ^5. It could be a compound melody or be stepwise. It may or may not modulate to the dominant. The rhythm is often striking and memorable. Order of entry in a three- or four-voice fugue can be bottom to top, top to bottom, or any combination.",
  },
  {
    id: 57,
    category: "Fugue",
    term: "Real Answer",
    definition: "An exact transposition of the subject, which means it will be the subject stated in the dominant, transposed up a fifth or down a fourth. A real answer may occur when ^5 does not appear prominently near the subject's beginning.",
  },
  {
    id: 58,
    category: "Fugue",
    term: "Tonal Answer",
    definition: "We need a tonal answer if the subject: starts on sol (^5) or otherwise uses it prominently at the outset — in this case, we must adjust the transposed version such that sol (^5) is not transposed up to re (^2), but instead to do (^1); includes any other V–I suggestion at start — prominent dominant note in subject becomes tonic note in answer, so T → D progressions often become D → T and vice versa; or modulates — in this case, split the subject into two phrases, one in each key, and adapt accordingly. If the subject modulates at its end to the dominant, the answer must modulate back to the tonic.",
  },
  {
    id: 59,
    category: "Fugue",
    term: "Countersubject",
    definition: "A melody in counterpoint to the subject that returns to accompany the subject each time it returns. May be invertible at the octave, at the fifth, or even the tenth. Good to have the countersubject start with a rest to set it off / make its entry easily audible. Should have a distinct melody and rhythm. For invertible counterpoint: Avoid fifths, because fifths invert to fourths, which have special rules in two-voice writing. Stick to unisons (/ octaves), thirds (/ sixths), and in the case of seventh chords, also seconds (sevenths).",
  },
  {
    id: 60,
    category: "Fugue",
    term: "Fugal Exposition",
    definition: "Initial section of the fugue, where the Subject enters, followed by Answer, followed by an alternation of Subject and Answer entries until all the voices have entered and come to a cadence. A \"redundant\" entry sometimes occurs. The first part of a fugue, during which each of the voices enters with the subject or answer. Note that this is distinct from the use of the term \"exposition\" in sonata form; they both refer to a first section setting out the main material, but they otherwise differ.",
  },
  {
    id: 61,
    category: "Fugue",
    term: "Episode",
    definition: "A section in which material from the subject is \"developed\"; it does not contain a full statement of the fugue subject, but instead reworks the subject or other prominent ideas through fragmentation and sequencing. It may modulate and end with a cadence that simultaneously elides into an entry of the subject.",
  },
  {
    id: 62,
    category: "Fugue",
    term: "Stretto",
    definition: "In a fugue, stretto is the technique of writing overlapping subject entries, is the imitation of the subject in close succession, so that the answer enters before the subject is completed. Creates momentum and textural density; good for the middle/end portion of a fugue, as a means of building to a climax.",
  },
  {
    id: 63,
    category: "Fugue",
    term: "Retrograde",
    definition: "Statement of the subject's pitches in reverse order; most often found in canon or invention. Example: Bach's Musical Offering includes a two-voice canon in which the second voice performs the melodic line of first voice backwards.",
  },

  // ── Rhythm & Meter (64–73) ────────────────────────────────────────────────
  {
    id: 64,
    category: "Rhythm & Meter",
    term: "Simple Meter",
    definition: "Simple meters are meters in which the beat divides into two, and then further subdivides into four. Examples: A simple triple meter contains three beats, each of which divides into two (and further subdivides into four). A simple quadruple meter contains four beats, each of which divides into two (and further subdivides into four).",
  },
  {
    id: 65,
    category: "Rhythm & Meter",
    term: "Compound Meter",
    definition: "Compound meters are meters in which the beat divides into three and then further subdivides into six. 6/8 is an example of compound meter, as is 9/8. Compound meters can be duple, triple, or quadruple, just like simple meters.",
  },
  {
    id: 66,
    category: "Rhythm & Meter",
    term: "Asymmetrical Meter",
    definition: "Asymmetrical meters contain measures which are divided into unequal groupings of beats or divisions, creating an uneven metrical pulse. 5/8 is an example of asymmetrical meter, as is 7/8.",
  },
  {
    id: 67,
    category: "Rhythm & Meter",
    term: "Hypermeter",
    definition: "Refers to the use of strong/weak metrical accent patterns at levels beyond the notated meter. Western classical music typically does this grouping by twos (and so then fours, eights, etc.), just like it does with metrical grouping within the notated meter. Grouping in threes is rarer in Western classical music, partly because it's rare to see grouping in 3s at more than one metrical level at all (within or beyond the meter). By conducting hypermeasures, a conductor can indicate not only the tempo of music, but also how measures are grouped into phrases.",
  },
  {
    id: 68,
    category: "Rhythm & Meter",
    term: "Harmonic Rhythm",
    definition: "The rate at which the chords change in a musical phrase, in relation to the rate of notes. Thus, a passage in common time with a stream of sixteenth notes and chord changes every bar has a slow harmonic rhythm and a fast \"surface\" rhythm (16 notes per chord change), while a phrase (still in common time) with mostly half notes and chord changes twice a measure has a fast harmonic rhythm and a slow surface rhythm (1 note per chord change). Harmonic rhythm tends to speed up going into a cadence.",
  },
  {
    id: 69,
    category: "Rhythm & Meter",
    term: "Hemiola",
    definition: "Refers to three beats of equal value in the time normally occupied by two beats. E.g., in a 6/4 bar, you can have one layer that groups three quarter notes together (\"normal\") and another layer that groups two quarter notes together (going against the \"normal\" grouping). Another example: 6/8 versus 3/4.",
  },
  {
    id: 70,
    category: "Rhythm & Meter",
    term: "Syncopation",
    definition: "When a temporary displacement of the regular metrical accent occurs, causing the emphasis to shift from a strong beat (or the strong part of the beat) to a weak beat (or the weak part of the beat).",
  },
  {
    id: 71,
    category: "Rhythm & Meter",
    term: "Anacrusis",
    definition: "Also called \"upbeat\" or a pickup note. It refers to a note or sequence of notes that occurs before the first downbeat in a piece of music. It does not occupy a bar number.",
  },
  {
    id: 72,
    category: "Rhythm & Meter",
    term: "Agogic Accent",
    definition: "Stress given to a note through prolonged duration. It relies on a longer duration rather than loudness or metric position. It may occur on a strong beat or a weak beat.",
  },
  {
    id: 73,
    category: "Rhythm & Meter",
    term: "Elision",
    definition: "Refers to a phrase structure where the last bar of one phrase serves as the first bar of the next phrase, e.g., the PAC or IAC of the previous phrase (the 8th bar) is simultaneously the first bar of the next phrase. 8 = 1. Also called \"phrase overlap\".",
  },

  // ── Cadences (76–81) ──────────────────────────────────────────────────────
  {
    id: 76,
    category: "Cadences",
    term: "Perfect Authentic Cadence (PAC)",
    definition: "A conventional formula that signals the end of a musical idea or phrase, has the harmonic progression V–I, both chords are in root position, and the tonic note is in the main melodic voice of the final I chord: i.e., perfect closure needs ^1 on top. Considered the strongest cadence in tonal music. When it's V7-I, the dissonant chordal 7th of V7 (^4) falls to ^3, simultaneously the leading tone (likely) resolves to ^1: the tritone propels the dissonant dominant to a consonant triad.",
  },
  {
    id: 77,
    category: "Cadences",
    term: "Imperfect Authentic Cadence (IAC)",
    definition: "A conventional formula that signals the end of a musical idea or phrase, has the harmonic progression V–I, both chords are in root position, and ^3 or ^5 is in the main melodic voice of the final I chord: i.e., imperfect closure does not need ^1 on top. Considered the next strongest cadence in tonal music, after the PAC. Sometimes textbooks consider V6/5 to I an IAC, although this definition is contested; nowadays theorists prefer the stricter definition where both V and I need to be in root position. This is because V6/5 to I is a linear motion, V6/5 being a Neighbor chord to I.",
  },
  {
    id: 78,
    category: "Cadences",
    term: "Half Cadence (HC)",
    definition: "When a phrase ends on dominant harmony. It may be preceded by I, although a pre-dominant or secondary dominant makes it stronger. It is also often at the end of the first phrase of a period (i.e., the antecedent ends on V, answered by a stronger AC in the consequent phrase). This V that marks the HC is an ultimate V, and not a penultimate V. A sonata exposition's Primary/Main theme may end on a HC, but never the S theme(s).",
  },
  {
    id: 79,
    category: "Cadences",
    term: "Phrygian Half Cadence",
    definition: "Is a special name given to the iv6-V HC in minor because of the le-sol bass, i.e., the half step. It does not imply that the music is actually in Phrygian mode. It often happens as the last stage of a lament bass formula. The PHC is the precursor to augmented sixth chords (instead of a M6th to an octave, it's an aug.6th to an octave).",
  },
  {
    id: 80,
    category: "Cadences",
    term: "Plagal Cadence (PC)",
    definition: "Also known as the \"amen cadence\". IV chord (subdominant) going to I (tonic) and it can be used in major or minor. In a major key, it's easy to borrow from the parallel minor (mixture) and do I-iv-I or even I – iiø6/5 – I. Some theorists don't consider this a \"true\" cadence because it's post-cadential, i.e., confirming a previous PAC. It can be added on after the PAC to give it even greater finality.",
  },
  {
    id: 81,
    category: "Cadences",
    term: "Deceptive Cadence (DC)",
    definition: "The phrase ends with V(7) going to vi (or VI in minor), both in root position. Occasionally IV6 can substitute for vi because they both have ^6 in the bass. A DC can't be conclusive and a stronger AC needs to eventually happen for a piece to end. Relatedly, a deceptive progression/motion is when a V(7) goes to vi but it's in the middle of a phrase, so not a cadence per se but still has a striking effect. VI and i / vi and I = two common tones, that's why vi can sub for tonic.",
  },

  // ── Form (82–100) ─────────────────────────────────────────────────────────
  {
    id: 82,
    category: "Form",
    term: "Phrase",
    definition: "It is a melodic/harmonic statement that ends with a cadence. It is a relatively independent music idea. Two phrases can make up a period if the first phrase ends with a relatively weak cadence (HC) and the second phrase ends with a stronger cadence (PAC).",
  },
  {
    id: 83,
    category: "Form",
    term: "Motive",
    definition: "It is the smallest melodic or rhythmic identifiable idea. A motive can consist of a pitch pattern, a rhythmic pattern, or both. One of the most famous examples is the first four notes of Beethoven's 5th Symphony.",
  },
  {
    id: 84,
    category: "Form",
    term: "Contrasting Period",
    definition: "The beginning of both phrases of the period are not similar.",
  },
  {
    id: 85,
    category: "Form",
    term: "Parallel Period",
    definition: "Both phrases begin with similar or identical material the same way but end in different cadences. The first cadence is weaker or less conclusive (called the antecedent) — usually it is a HC or a IAC and the second cadence it is more conclusive (it is called the consequent) — usually a PAC. These can be thought of as being in a \"question and answer\" relationship.",
  },
  {
    id: 86,
    category: "Form",
    term: "Double Period",
    definition: "Consist typically of four phrases in two pairs and needs to have contrasting cadences. The cadence at the end of the second pair being stronger than the cadence at the end of the first pair.",
  },
  {
    id: 87,
    category: "Form",
    term: "Binary Form",
    definition: "See class handout for a complete definition.",
  },
  {
    id: 88,
    category: "Form",
    term: "Ternary Form",
    definition: "ABA form - the idea of statement-contrast-return. The B section can contrast with the A sections by using different melodic material, texture, tonality or a combination of these. See Class handout for a more complete definition.",
  },
  {
    id: 89,
    category: "Form",
    term: "Rounded Binary Form",
    definition: "ll: A :ll: B A' :ll — A type of binary form where the material at the start of reprise 1 returns somewhere near the middle of reprise 2. Both appearances of \"A\" music are expected to be in the home key. See Class handout for a more complete definition.",
  },
  {
    id: 90,
    category: "Form",
    term: "Strophic",
    definition: "A large-scale song structure, in which the same basic multi-phrase unit is repeated throughout (AAA). The basic unit that is repeated is called a strophe. In 19th-century German Lied, if the poem has several stanzas with the same meter/foot, the musical setting will likely be strophic. This is a simpler structure compared to 'through-composed', where a text is given music that does not repeat much. In strophic songs repeat signs are often enough so the composer doesn't have to write out identical music several times. Many hymns are strophic as well.",
  },
  {
    id: 91,
    category: "Form",
    term: "Rondo",
    definition: "See Class handout for a complete definition.",
  },
  {
    id: 92,
    category: "Form",
    term: "Sonata Form",
    definition: "A complex large-scale musical form that can be understood as an elaborate version of rounded binary form with a balanced component. The larger level names are as follows: Exposition (≈A), Development (≈B), and Recapitulation (≈A′). In general terms, the exposition contains two main sections (primary and secondary) separated by a transition. The secondary theme is presented in a non-tonic key in the exposition, and crucially, it is restated in the recapitulation in the tonic key. The exposition and recapitulation often end with a large suffix (closing section). See Class handout for a more complete definition, including the characteristics of each section and likely tonal schemes.",
  },
  {
    id: 93,
    category: "Form",
    term: "Sonata-Rondo",
    definition: "Sonata rondo form combines features of the five-part rondo and sonata form. See Class handout for a more complete definition. By adding in these extra appearances of A, the form reads off as ABACAB'A, hence the alternation of A with \"other\" material that characterizes the rondo.",
  },
  {
    id: 94,
    category: "Form",
    term: "Ritornello Form",
    definition: "Ritornello can be translated in Italian to mean \"little return\". See Class handout and uploaded book for a more complete definition.",
  },
  {
    id: 95,
    category: "Form",
    term: "Concerto Form",
    definition: "Concerto is, from the late Baroque era, mostly understood as an instrumental composition, written for one or more soloists accompanied by an orchestra or other ensemble. The typical three-movement structure, a slow movement (e.g., lento or adagio) preceded and followed by fast movements (e.g. presto or allegro), became a standard from the early 18th century.",
  },
  {
    id: 96,
    category: "Form",
    term: "Fugue",
    definition: "See Class handout for a complete definition and description of 'fugue', also the uploaded reading in OneDrive.",
  },
  {
    id: 97,
    category: "Form",
    term: "Fugato",
    definition: "A fugal passage in a composition that is not a strict or complete fugue.",
  },
  {
    id: 98,
    category: "Form",
    term: "Exposition (Sonata Form)",
    definition: "The first large section in a sonata-form work. It establishes the main themes of the movement and sets up a tonal conflict that is later resolved in the work. This conflict often takes the form of differing key centers (such as when the primary theme is in tonic and the secondary theme is in the dominant). [NEEDS more description.] Refer to our class hand-out.",
  },
  {
    id: 99,
    category: "Form",
    term: "Development Section",
    definition: "Middle section of sonata form that is unstable, and that may or may not explore thematic material established in the exposition. [NEEDS more description.] Refer to our class hand-out.",
  },
  {
    id: 100,
    category: "Form",
    term: "Recapitulation",
    definition: "A section of a sonata-form work that brings back themes from the exposition and resolves the tonal conflict established in the exposition. It is the third large section of Sonata form. It is a varied repetition of the exposition, so it also consists of Main theme area, Transition, Secondary/subordinate theme area and optional Closing theme. The main difference between the recapitulation and the exposition is that in the recapitulation, the secondary theme(s) doesn't modulate to the dominant key or the relative minor (or any other key), and it stays in tonic. So the TR is recomposed to not modulate. Occasionally the S theme(s) can come back in a non-tonic key. This is rare and poses a tonal problem.",
  },

  // ── Orchestral Terms (101–116) ────────────────────────────────────────────
  {
    id: 101,
    category: "Orchestral Terms",
    term: "Geige",
    definition: "(German): Violin.",
  },
  {
    id: 102,
    category: "Orchestral Terms",
    term: "Bratsche",
    definition: "(German): Viola.",
  },
  {
    id: 103,
    category: "Orchestral Terms",
    term: "Posaune / Trombone",
    definition: "Posaune (German), Trombone (Italian): Trombone. [Trombe = trumpet; -one ending makes it \"big trumpet\", trombone]",
  },
  {
    id: 104,
    category: "Orchestral Terms",
    term: "Pauken",
    definition: "(German): Timpani.",
  },
  {
    id: 105,
    category: "Orchestral Terms",
    term: "Corni / Corno",
    definition: "Corni / Corno (Italian): Horn, a transposing instrument (down a fifth, in F).",
  },
  {
    id: 106,
    category: "Orchestral Terms",
    term: "Fagotti / Fagotto",
    definition: "Fagotti / Fagotto (Italian): Bassoon.",
  },
  {
    id: 107,
    category: "Orchestral Terms",
    term: "Cor Anglais",
    definition: "(Italian): English Horn (woodwind instrument, family of Oboe), it is in F, transposes down a fifth.",
  },
  {
    id: 108,
    category: "Orchestral Terms",
    term: "H-dur",
    definition: "(German): B major (b minor: H-moll), the note B is H in German.",
  },
  {
    id: 109,
    category: "Orchestral Terms",
    term: "B-moll",
    definition: "(German): Bb minor, Bb is B in German.",
  },
  {
    id: 110,
    category: "Orchestral Terms",
    term: "Con Sordino",
    definition: "(Italian): with mute. Use soft pedal on piano.",
  },
  {
    id: 111,
    category: "Orchestral Terms",
    term: "Mit Dämpfer",
    definition: "[German, dampen] A directive to musicians to perform the indicated passage while muffling, deadening or restraining the tone of the instrument (i.e., with mute).",
  },
  {
    id: 112,
    category: "Orchestral Terms",
    term: "Al Niente",
    definition: "An Italian term meaning 'to nothing'. Often used with diminuendo to indicate that the sound should fade away (beyond pianissimo) to nothing.",
  },
  {
    id: 113,
    category: "Orchestral Terms",
    term: "Meno Mosso",
    definition: "\"With less motion\"; hence, \"rather slower\". A direction which generally occurs in the middle of a movement. Example: Beethoven uses 'Meno mosso e moderato' in the Fugue for strings in B♭, op. 133, and 'Assai meno presto'—'very much less quick'—in the Trio of Symphony No. 7. Schumann uses 'Poco meno mosso', with its German equivalent 'Etwas langsamer', in Kreisleriana, Nos. 2 and 3. When the former tempo is resumed, the direction is Tempo primo.",
  },
  {
    id: 114,
    category: "Orchestral Terms",
    term: "Schnell",
    definition: "[German; tempo indication] In a rapid manner, quickly, fast. For example, \"doppelt so schnell\" means 'twice as fast', at double speed.",
  },
  {
    id: 115,
    category: "Orchestral Terms",
    term: "Lebhaft",
    definition: "[German] meaning vivace, lively, spirited. Comes from the verb leben (to live). The tempo will likely be fast, although a range of tempi (on the fast side) may be allowed. Example: Schumann's Davidsbündlertänze, op. 6/1.",
  },
  {
    id: 116,
    category: "Orchestral Terms",
    term: "Langsam",
    definition: "[German] slow, slowly. One often sees sehr langsam, very slow; langsamer = slower. From Proto-West Germanic langasam (\"lengthy, long-lasting\").",
  },
];
export const TERM_COUNT = ALL_TERMS.length

export function getCategories(): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const t of ALL_TERMS) {
    if (!seen.has(t.category)) {
      seen.add(t.category)
      result.push(t.category)
    }
  }
  return result
}

export function getTermsByCategory(category: string | "all"): Term[] {
  if (category === "all") return ALL_TERMS
  return ALL_TERMS.filter(t => t.category === category)
}

export function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = { all: ALL_TERMS.length }
  for (const t of ALL_TERMS) {
    counts[t.category] = (counts[t.category] ?? 0) + 1
  }
  return counts
}
