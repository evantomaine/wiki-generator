import { DocumentAnalysisResult, ExtractedConcept } from "../types";

export const initialDocuments: DocumentAnalysisResult[] = [
  {
    fileName: "LlerenaMalia_AnAquaristsComprehensiveGuidetoOctopusHusbandry.pdf",
    docTitle: "An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry",
    language: "English",
    documentType: "Comprehensive Aquarist Guide",
    ocrDetected: true,
    summary:
      "A specialized treatise by Malia Llerena covering the captive husbandry, life-support engineering, behavioral ecology, sensory enrichment, and veterinary care of octopuses in small-scale aquarium environments.",
    mainTopics: [
      "Octopus Husbandry",
      "Aquarium Engineering",
      "Water Chemistry",
      "Cephalopod Nutrition",
      "Environmental Enrichment",
      "Senescence Management",
    ],
    concepts: [],
  },
];

export const initialConcepts: ExtractedConcept[] = [
  {
    id: "octo-c1",
    name: "Octopus Escape Prevention and Enclosure Security",
    aliases: ["Tank Security", "Lid Clamping", "Escape Proofing"],
    category: "Aquarium Engineering",
    summary:
      "Critical protocols for eliminating gaps, weighting lids, securing plumbing, and deploying artificial turf barriers to prevent octopus escapes.",
    markdownContent: `---
title: "Octopus Escape Prevention and Enclosure Security"
category: "Aquarium Engineering"
aliases:
  - "Tank Security"
  - "Lid Clamping"
  - "Escape Proofing"
tags:
  - "aquarium/hardware"
  - "husbandry/security"
source_document: "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
sources:
  - "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
related:
  - "[[Aquarium Filtration Systems and Dissolved Oxygen]]"
  - "[[Cognitive and Environmental Enrichment for Octopuses]]"
  - "[[Substrate, Rockwork, and Den Architecture]]"
language: "English"
---

# Octopus Escape Prevention and Enclosure Security

> [!WARNING] The Chitinous Beak Constraint
> An octopus can squeeze its hydrostatic body through any aperture larger than its rigid chitinous beak and eye cartilage. Enclosure design must assume any unsealed opening exceeding 5mm is an escape hazard.

## 🛡️ Structural Requirements
- **Lid Clamping**: Lids must be constructed from heavy acrylic or polycarbonate and mechanically clamped or weighted. Octopuses possess formidable hydraulic arm strength and can lift unweighted tank covers.
- **Gasket Seals**: Closed-cell foam, neoprene gaskets, or Velcro rims should line the perimeter of the lid.
- **Astroturf / Artificial Turf Barriers**: Lining the top rim with stiff artificial turf provides a tactile deterrent that suction cups cannot adhere to effectively.

## 🚰 Plumbing & Overflow Protection
- **Mesh Screen Guards**: All intake strainers, weir boxes, and drain bulkheads must be protected with fine plastic mesh to prevent the animal from crawling into plumbing or sump chambers.
- **Anti-Siphon Holes**: Siphon breaks must be securely screened; unscreened return pipes are common avenues for investigative exploration.

## 🔗 Connected Concepts
- High security demands must be balanced with [[Cognitive and Environmental Enrichment for Octopuses]] to reduce exploratory escape attempts.
- Intakes must remain clear while maintaining flow for [[Aquarium Filtration Systems and Dissolved Oxygen]].
- A secure retreat must be provided within [[Substrate, Rockwork, and Den Architecture]].`,
    suggestedTags: ["#aquarium/hardware", "#husbandry/security"],
    relatedConceptNames: [
      "Aquarium Filtration Systems and Dissolved Oxygen",
      "Cognitive and Environmental Enrichment for Octopuses",
      "Substrate, Rockwork, and Den Architecture",
    ],
    sourceDocument: "An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry",
    sourcePages: "pp. 8-15",
    language: "English",
  },
  {
    id: "octo-c2",
    name: "Cephalopod Water Chemistry and Nitrogenous Waste Management",
    aliases: ["Water Quality", "Cephalopod Nitrogen Cycle", "Denitrification"],
    category: "Water Chemistry",
    summary:
      "stringent chemical parameters required for cephalopods, including total ammonia nitrogen elimination, high pH stability, and strict copper avoidance.",
    markdownContent: `---
title: "Cephalopod Water Chemistry and Nitrogenous Waste Management"
category: "Water Chemistry"
aliases:
  - "Water Quality"
  - "Cephalopod Nitrogen Cycle"
  - "Denitrification"
tags:
  - "chemistry/water-quality"
  - "husbandry/cephalopods"
source_document: "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
sources:
  - "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
related:
  - "[[Aquarium Filtration Systems and Dissolved Oxygen]]"
  - "[[Safe Handling, Chemical Sensitivity, and Copper Toxicity]]"
  - "[[Cephalopod Pathology, Quarantine, and Common Ailments]]"
language: "English"
---

# Cephalopod Water Chemistry and Nitrogenous Waste Management

> [!INFO] Metabolic Waste Sensitivity
> Cephalopods have exceptionally high protein metabolic rates, producing substantial ammonia ($NH_3/NH_4^+$) and consuming significant dissolved oxygen compared to typical marine teleost fishes.

## 🧪 Crucial Water Parameters
| Parameter | Optimal Range | Tolerance Limit | Notes |
| :--- | :--- | :--- | :--- |
| **Salinity (S)** | 33 - 35 ppt | 32 - 36 ppt | Octopuses are strictly stenohaline osmoconformers. |
| **pH** | 8.1 - 8.3 | 7.9 - 8.4 | Drop in pH drastically impairs hemocyanin oxygen-binding. |
| **Ammonia ($NH_3$)** | 0.00 ppm | < 0.05 ppm | Highly neurotoxic; damages branchial lamellae. |
| **Nitrite ($NO_2^-$)** | 0.00 ppm | < 0.1 ppm | Disrupts oxygen transport. |
| **Nitrate ($NO_3^-$)** | < 10 ppm | < 20 ppm | Chronic high nitrate causes lethargy and inappetence. |
| **Temperature** | Species dependent (16-24°C) | Stable $\\pm 1^\\circ\\text{C}$ | Chiller essential for temperate species (*O. bimaculoides*). |

## 📉 The Root Effect in Hemocyanin
Octopus blood relies on copper-based hemocyanin rather than hemoglobin. Hemocyanin exhibits a profound Bohr and Root effect; even mild acidosis (pH < 7.9) severely inhibits oxygen saturation in the gills, leading to tissue hypoxia despite adequate water oxygenation.

## 🔗 Cross-References
- Managed directly by [[Aquarium Filtration Systems and Dissolved Oxygen]].
- Extremely vulnerable to trace metals detailed in [[Safe Handling, Chemical Sensitivity, and Copper Toxicity]].
- Poor water quality triggers [[Cephalopod Pathology, Quarantine, and Common Ailments]].`,
    suggestedTags: ["#chemistry/water-quality", "#husbandry/cephalopods"],
    relatedConceptNames: [
      "Aquarium Filtration Systems and Dissolved Oxygen",
      "Safe Handling, Chemical Sensitivity, and Copper Toxicity",
      "Cephalopod Pathology, Quarantine, and Common Ailments",
    ],
    sourceDocument: "An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry",
    sourcePages: "pp. 16-24",
    language: "English",
  },
  {
    id: "octo-c3",
    name: "Aquarium Filtration Systems and Dissolved Oxygen",
    aliases: ["Life Support Systems", "Protein Skimming", "Aeration"],
    category: "Aquarium Engineering",
    summary:
      "Life-support architecture combining oversized protein skimmers, carbon adsorption, vigorous biological filtration, and near-saturation dissolved oxygen.",
    markdownContent: `---
title: "Aquarium Filtration Systems and Dissolved Oxygen"
category: "Aquarium Engineering"
aliases:
  - "Life Support Systems"
  - "Protein Skimming"
  - "Aeration"
tags:
  - "engineering/filtration"
  - "husbandry/equipment"
source_document: "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
sources:
  - "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
related:
  - "[[Cephalopod Water Chemistry and Nitrogenous Waste Management]]"
  - "[[Octopus Escape Prevention and Enclosure Security]]"
  - "[[Safe Handling, Chemical Sensitivity, and Copper Toxicity]]"
language: "English"
---

# Aquarium Filtration Systems and Dissolved Oxygen

> [!TIP] Supersized Protein Skimming
> An octopus aquarium requires a protein skimmer rated for at least **2x to 3x** the actual system volume to rapidly strip dissolved organics and ink ejections before bacterial bloom consumes oxygen.

## ⚙️ Filtration Components
1. **Oversized Fractionator (Skimmer)**: Essential for gas exchange and immediate ink removal during alarm discharges.
2. **Activated Carbon**: High-grade granular activated carbon (GAC) neutralizes ink pigments, toxins, and organic compounds. Carbon must be replaced monthly.
3. **Biological Media**: High surface area ceramic media or live rock in sump chambers to support aerobic nitrifying colonies.
4. **Dissolved Oxygen (> 90% Saturation)**: Strong surface agitation and supplemental air stones or venturi injectors prevent localized stagnation.

## ⚡ Emergency Power Backup
Because octopuses consume oxygen at intense metabolic rates, a power outage of as little as 60-90 minutes in a sealed tank can prove fatal. Battery-powered aerators or uninterruptible power supplies (UPS) are mandatory life-support safeguards.

## 🔗 Cross-References
- Maintains target metrics established in [[Cephalopod Water Chemistry and Nitrogenous Waste Management]].
- Plumbing interfaces must adhere to [[Octopus Escape Prevention and Enclosure Security]].
- Adsorption media mitigates risks outlined in [[Safe Handling, Chemical Sensitivity, and Copper Toxicity]].`,
    suggestedTags: ["#engineering/filtration", "#husbandry/equipment"],
    relatedConceptNames: [
      "Cephalopod Water Chemistry and Nitrogenous Waste Management",
      "Octopus Escape Prevention and Enclosure Security",
      "Safe Handling, Chemical Sensitivity, and Copper Toxicity",
    ],
    sourceDocument: "An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry",
    sourcePages: "pp. 25-34",
    language: "English",
  },
  {
    id: "octo-c4",
    name: "Enriched Cephalopod Feeding Protocols and Live Prey",
    aliases: ["Octopus Nutrition", "Feeding Protocols", "Live Feeding"],
    category: "Nutrition and Feeding",
    summary:
      "Nutritional strategies centering on live marine crustaceans and mollusks, prey enrichment, feeding frequency, and preventing nutritional deficiencies.",
    markdownContent: `---
title: "Enriched Cephalopod Feeding Protocols and Live Prey"
category: "Nutrition and Feeding"
aliases:
  - "Octopus Nutrition"
  - "Feeding Protocols"
  - "Live Feeding"
tags:
  - "nutrition/feeding"
  - "husbandry/diet"
source_document: "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
sources:
  - "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
related:
  - "[[Cognitive and Environmental Enrichment for Octopuses]]"
  - "[[Cephalopod Water Chemistry and Nitrogenous Waste Management]]"
  - "[[Senescence, Reproductive Exhaustion, and Life-Cycle Management]]"
language: "English"
---

# Enriched Cephalopod Feeding Protocols and Live Prey

> [!ABSTRACT] Obligate Carnivorous Diet
> Octopuses require high protein (> 70% dry matter) and low lipid (< 5%) nutrition rich in polyunsaturated fatty acids (EPA and DHA), naturally provided by live decapod crustaceans and bivalves.

## 🦀 Preferred Dietary Items
- **Crustaceans**: Live fiddler crabs (*Uca* spp.), shore crabs (*Pachygrapsus* spp.), emerald crabs, and live marine shrimp (*Palaemonetes*).
- **Mollusks**: Live clams, mussels, and small snails (provides mechanical exercise for beak and radula drilling).
- **Marine Fish**: Occasional fresh, un-frozen silversides or lancefish (avoid fish treated with preservatives).

## 🥩 Foraging Stimulation
Rather than broadcast or hand-feeding pre-killed food, live prey stimulates natural stalking, color-shifting, and tentacle-probing behaviors. Hard-shelled prey naturally wears down the beak, preventing overgrowth.

## 🔗 Cross-References
- Acts as a cornerstone for [[Cognitive and Environmental Enrichment for Octopuses]] through puzzle boxes and foraging jars.
- Uneaten food items must be promptly removed to prevent spikes in [[Cephalopod Water Chemistry and Nitrogenous Waste Management]].
- Feeding cessation marks the onset of [[Senescence, Reproductive Exhaustion, and Life-Cycle Management]].`,
    suggestedTags: ["#nutrition/feeding", "#husbandry/diet"],
    relatedConceptNames: [
      "Cognitive and Environmental Enrichment for Octopuses",
      "Cephalopod Water Chemistry and Nitrogenous Waste Management",
      "Senescence, Reproductive Exhaustion, and Life-Cycle Management",
    ],
    sourceDocument: "An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry",
    sourcePages: "pp. 35-44",
    language: "English",
  },
  {
    id: "octo-c5",
    name: "Cognitive and Environmental Enrichment for Octopuses",
    aliases: ["Enrichment", "Octopus Puzzles", "Mental Stimulation"],
    category: "Behavioral Ecology",
    summary:
      "Methods of environmental and psychological enrichment, including screw-top puzzle jars, tactile mazes, and habitat reconfiguration to prevent stereotypic distress.",
    markdownContent: `---
title: "Cognitive and Environmental Enrichment for Octopuses"
category: "Behavioral Ecology"
aliases:
  - "Enrichment"
  - "Octopus Puzzles"
  - "Mental Stimulation"
tags:
  - "behavior/cognition"
  - "husbandry/enrichment"
source_document: "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
sources:
  - "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
related:
  - "[[Enriched Cephalopod Feeding Protocols and Live Prey]]"
  - "[[Octopus Escape Prevention and Enclosure Security]]"
  - "[[Substrate, Rockwork, and Den Architecture]]"
language: "English"
---

# Cognitive and Environmental Enrichment for Octopuses

> [!INFO] Complex Nervous System
> Octopuses possess over 500 million neurons—two thirds situated within the arms—demanding continuous tactile, visual, and cognitive stimulation in captive settings.

## 🧩 Enrichment Categories
1. **Food Presentation Devices**: Clear plastic jars with screw tops or child-proof latches containing a live crab. The octopus must observe the prey, learn to grip and turn the lid with suckers.
2. **Tactile Exploration**: Textured silicone toys, floating wiffle balls, PVC puzzle tube labyrinths, and nesting shells.
3. **Habitat Rearrangement**: Moving non-structural shells, flat rocks, and kelp fronds every few weeks stimulates novel den construction and territorial patrol.

## 🛑 Mitigating Boredom and Stereotypic Behavior
Under-stimulated octopuses exhibit signs of boredom, pacing along seams, obsessive lid pushing, or autotomy (self-mutilation/arm eating in extreme deprivation). Regular interactive enrichment dramatically reduces escape attempts.

## 🔗 Cross-References
- Synergizes with [[Enriched Cephalopod Feeding Protocols and Live Prey]].
- Diverts energy away from breach attempts described in [[Octopus Escape Prevention and Enclosure Security]].
- Utilizes structural elements from [[Substrate, Rockwork, and Den Architecture]].`,
    suggestedTags: ["#behavior/cognition", "#husbandry/enrichment"],
    relatedConceptNames: [
      "Enriched Cephalopod Feeding Protocols and Live Prey",
      "Octopus Escape Prevention and Enclosure Security",
      "Substrate, Rockwork, and Den Architecture",
    ],
    sourceDocument: "An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry",
    sourcePages: "pp. 45-56",
    language: "English",
  },
  {
    id: "octo-c6",
    name: "Substrate, Rockwork, and Den Architecture",
    aliases: ["Den Construction", "Aquarium Aquascaping", "Live Rock"],
    category: "Aquarium Engineering",
    summary:
      "Design principles for natural and artificial dens, including non-collapsible rock structures, aragonite substrate depth, and visual barriers.",
    markdownContent: `---
title: "Substrate, Rockwork, and Den Architecture"
category: "Aquarium Engineering"
aliases:
  - "Den Construction"
  - "Aquarium Aquascaping"
  - "Live Rock"
tags:
  - "aquarium/aquascape"
  - "husbandry/habitat"
source_document: "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
sources:
  - "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
related:
  - "[[Octopus Escape Prevention and Enclosure Security]]"
  - "[[Photoperiod, Lighting Spectrum, and Stress Mitigation]]"
  - "[[Cognitive and Environmental Enrichment for Octopuses]]"
language: "English"
---

# Substrate, Rockwork, and Den Architecture

> [!TIP] Non-Collapsible Foundation
> Never rest heavy rocks directly onto sand. Octopuses are vigorous excavators and can undermine boulders, causing rock falls that can crush the animal or crack aquarium glass.

## 🪨 Structural Rules
- **Base Placement**: Live rock or artificial masonry must rest directly onto the bottom glass or PVC grid before substrate is added.
- **Mortar & Epoxy**: Interlock key boulders with aquarium-safe hydraulic cement or epoxy putty.
- **Substrate**: 5–8 cm depth of coarse aragonite sand mixed with crushed coral, sea shells, and smooth pebbles. The octopus will collect pebbles to barricade its den opening at night.

## 🏰 Den Specifications
- Provide at least two dark, snug cavities where the octopus can curl up with only its eyes exposed.
- Opaque PVC elbows, terracotta urns, or natural basalt caves positioned away from direct water turbulence and glare.

## 🔗 Cross-References
- Prevents structural damage that compromises [[Octopus Escape Prevention and Enclosure Security]].
- Complements ambient light reduction in [[Photoperiod, Lighting Spectrum, and Stress Mitigation]].
- Furnishes materials for [[Cognitive and Environmental Enrichment for Octopuses]].`,
    suggestedTags: ["#aquarium/aquascape", "#husbandry/habitat"],
    relatedConceptNames: [
      "Octopus Escape Prevention and Enclosure Security",
      "Photoperiod, Lighting Spectrum, and Stress Mitigation",
      "Cognitive and Environmental Enrichment for Octopuses",
    ],
    sourceDocument: "An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry",
    sourcePages: "pp. 57-65",
    language: "English",
  },
  {
    id: "octo-c7",
    name: "Photoperiod, Lighting Spectrum, and Stress Mitigation",
    aliases: ["Lighting", "Photoperiod", "Cephalopod Vision"],
    category: "Husbandry Management",
    summary:
      "Lighting guidelines tailored to cephalopod ocular sensitivity, including dimmable red spectrums, twilight transitions, and stable 10-12 hour photoperiods.",
    markdownContent: `---
title: "Photoperiod, Lighting Spectrum, and Stress Mitigation"
category: "Husbandry Management"
aliases:
  - "Lighting"
  - "Photoperiod"
  - "Cephalopod Vision"
tags:
  - "lighting/photoperiod"
  - "husbandry/stress"
source_document: "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
sources:
  - "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
related:
  - "[[Substrate, Rockwork, and Den Architecture]]"
  - "[[Cephalopod Pathology, Quarantine, and Common Ailments]]"
  - "[[Cognitive and Environmental Enrichment for Octopuses]]"
language: "English"
---

# Photoperiod, Lighting Spectrum, and Stress Mitigation

> [!NOTE] High Retinal Sensitivity
> Octopuses possess rhabdomeric photoreceptors highly adapted for low-light benthic conditions. Intense reef lighting (PAR > 100) causes chronic retinal distress and forces perpetual retreat into dark crevices.

## 💡 Recommended Lighting Parameters
- **Intensity**: Dim to moderate (15 - 40 PAR).
- **Ramping**: Use dimmers to provide 30-minute sunrise/sunset transitions. Instant on/off switches trigger sudden alarm responses, ink ejections, and wall collisions.
- **Red Night Lights**: Cephalopods have single-pigment vision insensitive to deep red light (> 650 nm). Red LED fixtures allow nocturnal observation without disturbing the animal.
- **Photoperiod**: Strict 10 to 12 hour diurnal cycle; erratic lighting disrupts circadian hormonal secretion.

## 🔗 Cross-References
- Coordinates with retreat design in [[Substrate, Rockwork, and Den Architecture]].
- Chronic lighting stress predisposes the animal to [[Cephalopod Pathology, Quarantine, and Common Ailments]].
- Timed illumination facilitates observational study during [[Cognitive and Environmental Enrichment for Octopuses]].`,
    suggestedTags: ["#lighting/photoperiod", "#husbandry/stress"],
    relatedConceptNames: [
      "Substrate, Rockwork, and Den Architecture",
      "Cephalopod Pathology, Quarantine, and Common Ailments",
      "Cognitive and Environmental Enrichment for Octopuses",
    ],
    sourceDocument: "An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry",
    sourcePages: "pp. 66-72",
    language: "English",
  },
  {
    id: "octo-c8",
    name: "Senescence, Reproductive Exhaustion, and Life-Cycle Management",
    aliases: ["Senescence", "Octopus Lifespan", "End of Life Care"],
    category: "Cephalopod Biology",
    summary:
      "Understanding the genetically programmed senescence driven by the optic gland, managing post-reproductive decline, and ethical end-of-life care.",
    markdownContent: `---
title: "Senescence, Reproductive Exhaustion, and Life-Cycle Management"
category: "Cephalopod Biology"
aliases:
  - "Senescence"
  - "Octopus Lifespan"
  - "End of Life Care"
tags:
  - "biology/senescence"
  - "husbandry/welfare"
source_document: "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
sources:
  - "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
related:
  - "[[Enriched Cephalopod Feeding Protocols and Live Prey]]"
  - "[[Cephalopod Pathology, Quarantine, and Common Ailments]]"
  - "[[Safe Handling, Chemical Sensitivity, and Copper Toxicity]]"
language: "English"
---

# Senescence, Reproductive Exhaustion, and Life-Cycle Management

> [!WARNING] Semelparous Biology
> Most octopus species live only 1 to 2 years. Reproduction triggers irreversible neuroendocrine senescence controlled by steroid hormones secreted by the optic glands.

## ⏳ Signs of Natural Senescence
1. **Inappetence**: Voluntary refusal of all prey items.
2. **Loss of Coordination**: White lesions on arm tips, uncoordinated suckers, inability to grip surfaces.
3. **Continuous Brooding (Females)**: Complete maternal dedication to aerating egg clusters without eating.
4. **Wandering**: Diurnal aimless roaming outside of protective dens.

## 🏥 Palliative Aquarist Protocols
- Eliminate high-velocity flow and buffer powerhead intakes.
- Offer soft target foods (squid strips, peeled shrimp) gently with forceps.
- When quality of life degrades severely, humane euthanasia is conducted using magnesium chloride ($MgCl_2$) followed by ethanol immersion under veterinary standards.

## 🔗 Cross-References
- Differentiated from dietary starvation in [[Enriched Cephalopod Feeding Protocols and Live Prey]].
- Must not be confused with treatable infections in [[Cephalopod Pathology, Quarantine, and Common Ailments]].
- Chemical protocols align with guidelines in [[Safe Handling, Chemical Sensitivity, and Copper Toxicity]].`,
    suggestedTags: ["#biology/senescence", "#husbandry/welfare"],
    relatedConceptNames: [
      "Enriched Cephalopod Feeding Protocols and Live Prey",
      "Cephalopod Pathology, Quarantine, and Common Ailments",
      "Safe Handling, Chemical Sensitivity, and Copper Toxicity",
    ],
    sourceDocument: "An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry",
    sourcePages: "pp. 73-82",
    language: "English",
  },
  {
    id: "octo-c9",
    name: "Cephalopod Pathology, Quarantine, and Common Ailments",
    aliases: ["Octopus Diseases", "Ulceration", "Quarantine Protocol"],
    category: "Veterinary Care",
    summary:
      "Diagnosis and quarantine protocols for bacterial skin ulcerations, parasite infestations, branchial edema, and physical trauma.",
    markdownContent: `---
title: "Cephalopod Pathology, Quarantine, and Common Ailments"
category: "Veterinary Care"
aliases:
  - "Octopus Diseases"
  - "Ulceration"
  - "Quarantine Protocol"
tags:
  - "veterinary/pathology"
  - "husbandry/quarantine"
source_document: "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
sources:
  - "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
related:
  - "[[Cephalopod Water Chemistry and Nitrogenous Waste Management]]"
  - "[[Safe Handling, Chemical Sensitivity, and Copper Toxicity]]"
  - "[[Senescence, Reproductive Exhaustion, and Life-Cycle Management]]"
language: "English"
---

# Cephalopod Pathology, Quarantine, and Common Ailments

> [!INFO] Open Circulatory Vulnerability
> Cephalopods have thin, delicate skin with active chromatophores and lack keratinized scales. Skin abrasions rapidly progress to systemic *Vibrio* or *Pseudomonas* bacteremia if water quality slips.

## 🩹 Common Pathologies
- **Bacterial Ulcerative Dermatitis**: Whitish eroded patches on mantle or arms. Treatment requires pristine water parameters, antibiotic therapy (*Enrofloxacin* under veterinary prescription), or topical betadine swabs.
- **Branchial Edema**: Swollen gills and labored pumping caused by ammonia burn or extreme salinity shock.
- **Physical Abrasion**: Sucker tear or mantle laceration from sharp rock edges or rough mesh strainers.

## 🛡️ Quarantine Protocols
- Quarantine all new arrivals for a minimum of 14 to 21 days in a dedicated life-support system.
- Never use prophylactic copper, formalin, or organophosphates in cephalopod quarantine tanks.

## 🔗 Cross-References
- Prevented through strict adherence to [[Cephalopod Water Chemistry and Nitrogenous Waste Management]].
- Contraindicated medications detailed in [[Safe Handling, Chemical Sensitivity, and Copper Toxicity]].
- Must be evaluated against terminal [[Senescence, Reproductive Exhaustion, and Life-Cycle Management]].`,
    suggestedTags: ["#veterinary/pathology", "#husbandry/quarantine"],
    relatedConceptNames: [
      "Cephalopod Water Chemistry and Nitrogenous Waste Management",
      "Safe Handling, Chemical Sensitivity, and Copper Toxicity",
      "Senescence, Reproductive Exhaustion, and Life-Cycle Management",
    ],
    sourceDocument: "An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry",
    sourcePages: "pp. 83-94",
    language: "English",
  },
  {
    id: "octo-c10",
    name: "Safe Handling, Chemical Sensitivity, and Copper Toxicity",
    aliases: ["Copper Toxicity", "Chemical Sensitivity", "Safe Handling"],
    category: "Veterinary Care",
    summary:
      "Extreme susceptibility to trace heavy metals (especially copper), chemical residues, household aerosols, and safe capture and transfer techniques.",
    markdownContent: `---
title: "Safe Handling, Chemical Sensitivity, and Copper Toxicity"
category: "Veterinary Care"
aliases:
  - "Copper Toxicity"
  - "Chemical Sensitivity"
  - "Safe Handling"
tags:
  - "veterinary/toxicology"
  - "husbandry/safety"
source_document: "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
sources:
  - "[[An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry]]"
related:
  - "[[Cephalopod Water Chemistry and Nitrogenous Waste Management]]"
  - "[[Aquarium Filtration Systems and Dissolved Oxygen]]"
  - "[[Cephalopod Pathology, Quarantine, and Common Ailments]]"
language: "English"
---

# Safe Handling, Chemical Sensitivity, and Copper Toxicity

> [!WARNING] Lethal Copper Threshold (< 0.02 ppm)
> Copper ions ($Cu^{2+}$) are violently toxic to cephalopods at concentrations that standard aquarium test kits cannot even detect. Never use aquariums, equipment, or rockwork previously treated with copper medications.

## 🧪 Chemical Hazard Avoidance
- **Brass & Bronze Fittings**: All plumbing components must be strictly schedule 40/80 PVC, silicone, acrylic, or titanium. Never expose brass pump impellers or bronze valves to water.
- **Aerosols & Cleansers**: Glass cleansers containing ammonia, room air fresheners, insect sprays, and hand lotions absorb into water rapidly and induce instantaneous neurotoxicity.
- **Adsorption**: Running poly-filter pads and virgin activated carbon permanently guards against inadvertent contamination.

## 🧤 Capture & Transfer Protocols
- Never use abrasive nylon nets; nets abrade delicate skin and chromatophore layers.
- Use water-filled clear plastic pitchers or soft silicone containers so the animal remains submerged throughout any inter-tank transfer.

## 🔗 Cross-References
- Directly corrupts parameters in [[Cephalopod Water Chemistry and Nitrogenous Waste Management]].
- Requires carbon adsorption specified in [[Aquarium Filtration Systems and Dissolved Oxygen]].
- Chemical injury leads directly to [[Cephalopod Pathology, Quarantine, and Common Ailments]].`,
    suggestedTags: ["#veterinary/toxicology", "#husbandry/safety"],
    relatedConceptNames: [
      "Cephalopod Water Chemistry and Nitrogenous Waste Management",
      "Aquarium Filtration Systems and Dissolved Oxygen",
      "Cephalopod Pathology, Quarantine, and Common Ailments",
    ],
    sourceDocument: "An Aquarist's Comprehensive Guide to Octopus Husbandry- For Small Scale Aquaristry",
    sourcePages: "pp. 95-102",
    language: "English",
  },
];
