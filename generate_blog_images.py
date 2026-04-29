import os
import time
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PROMPTS = [
    # 1 — Sadat City overview 2026
    ("blog-1.jpg", "Photorealistic aerial drone view of a modern planned residential compound in Egypt, golden hour sunset lighting, wide tree-lined streets, green parks between beige and white apartment buildings, warm amber sky, 16mm wide lens, cinematic composition"),
    # 2 — Project 865 progress
    ("blog-2.jpg", "Photorealistic construction site of a modern mid-rise apartment building in Egypt, construction workers in hard hats, tower crane against bright blue sky, concrete skeleton structure, scaffolding, progress and activity, warm daylight, 24mm wide lens"),
    # 3 — Golden Zone guide
    ("blog-3.jpg", "Photorealistic modern Egyptian planned city neighborhood at golden hour, wide well-maintained boulevard lined with palm trees, clean white and beige residential buildings, welcoming suburban atmosphere, aspirational mood, 35mm cinematic lens"),
    # 4 — How to choose a developer
    ("blog-4.jpg", "Photorealistic professional Egyptian real estate developer and client at a modern office table reviewing architectural blueprints and a contract, handshake moment, warm office lighting, trust and professionalism, shallow depth of field"),
    # 5 — Zone 14 investment
    ("blog-5.jpg", "Photorealistic aerial view of a developing Egyptian residential district, mix of completed and under-construction buildings, wide roads, bright afternoon sun, growth and potential, bird's eye perspective"),
    # 6 — Off-plan vs ready property
    ("blog-6.jpg", "Photorealistic split-image comparison: left side shows architectural blueprints and a construction site model, right side shows a beautifully finished bright modern apartment interior, clean white walls, natural light, Egypt real estate concept"),
    # 7 — Project 868 launch
    ("blog-7.jpg", "Photorealistic luxury modern apartment building exterior at dusk in Egypt, elegant facade with white and cream cladding, glass balconies with warm interior lights glowing, upscale residential tower, beautiful twilight sky with purple and orange tones"),
    # 8 — Zone 21 guide
    ("blog-8.jpg", "Photorealistic bird's eye aerial view of a dense but well-planned Egyptian residential zone, wide roads intersecting, apartment buildings with balconies, green strips along streets, vibrant activity, warm afternoon light"),
    # 9 — Mortgage guide
    ("blog-9.jpg", "Photorealistic Egyptian couple signing home purchase documents at a bank, smiling financial advisor across the table, modern bank interior, warm lighting, happy and secure atmosphere, real estate financing concept"),
    # 10 — Technology zone
    ("blog-10.jpg", "Photorealistic modern industrial technology park in Egypt, clean warehouse-style factory buildings with glass facades, wide paved roads, Egyptian flag, bright daylight, economic activity and growth, wide establishing shot"),
    # 11 — Payment plans guide
    ("blog-11.jpg", "Photorealistic hand holding a pen over a real estate payment schedule spreadsheet on a bright desk, calculator and keys visible, clean minimalist composition, financial planning concept, warm neutral tones"),
    # 12 — Distinguished district
    ("blog-12.jpg", "Photorealistic quiet upscale Egyptian residential street, detached villas and townhouses behind low walls, mature trees lining the sidewalk, sunny daytime, tranquil and prestigious neighborhood atmosphere, wide angle"),
    # 13 — Delivery commitment
    ("blog-13.jpg", "Photorealistic Egyptian family receiving keys to a new apartment from a developer representative, smiling, bright modern lobby, moving boxes in background, joyful handover moment, warm sunlight streaming through glass doors"),
    # 14 — Central axis impact
    ("blog-14.jpg", "Photorealistic wide new Egyptian expressway under construction through a city, fresh lanes being paved, construction equipment, modern residential buildings rising on both sides, progress and momentum, bright blue sky"),
    # 15 — Apartment vs villa
    ("blog-15.jpg", "Photorealistic side-by-side comparison: modern high-rise apartment building on the left, modern detached villa with garden on the right, Egypt residential real estate, clear blue sky, clean architectural photography"),
    # 16 — Industrial zones
    ("blog-16.jpg", "Photorealistic large Egyptian industrial zone with rows of factory buildings, wide truck access roads, smoke-free clean production facility exteriors, workers and vehicles, bright daylight, economic powerhouse atmosphere"),
    # 17 — Textile complex
    ("blog-17.jpg", "Photorealistic large spinning and weaving factory interior in Egypt, rows of industrial looms in operation, colorful threads and fabric rolls, workers in safety gear, bright overhead lighting, industrial scale production"),
    # 18 — Customer stories
    ("blog-18.jpg", "Photorealistic happy Egyptian family inside their brand-new apartment, parents and two children exploring the fresh bright rooms, sunlight through large windows, warm emotional moment, move-in day, modern interior"),
    # 19 — Master plan explained
    ("blog-19.jpg", "Photorealistic urban master plan model on a large table, miniature city blocks color-coded by zone type, architect pointing at the model, bright studio lighting, urban planning and development concept, overhead shot"),
    # 20 — Green belt lifestyle
    ("blog-20.jpg", "Photorealistic lush green park inside an Egyptian residential compound, families walking on wide pathways, children playing, palm trees and flowering plants, warm afternoon sunlight, vibrant community atmosphere"),
    # 21 — Sadat vs New Capital
    ("blog-21.jpg", "Photorealistic comparison aerial photograph of two modern Egyptian cities, one established with mature greenery and filled apartment buildings, one brand new with glass towers under construction, split perspective, aspirational mood"),
    # 22 — Sustainable building
    ("blog-22.jpg", "Photorealistic modern Egyptian apartment building with green sustainability features, solar panels on rooftop, extensive balcony gardens, energy-efficient glass, lush surrounding landscape, eco-friendly architecture, bright daylight"),
    # 23 — Sadat vs 6th October
    ("blog-23.jpg", "Photorealistic wide Egyptian city boulevard at golden hour, modern apartment buildings on both sides, palm trees, clean streets, cars, prosperous and developed urban scene, comparing two great cities, warm cinematic light"),
    # 24 — Apartment size guide
    ("blog-24.jpg", "Photorealistic bright modern Egyptian apartment interior with good spatial layout clearly visible, open-plan living and dining area, two bedroom doors visible, natural daylight, clean and spacious, interior photography"),
    # 25 — Cairo-Alex road advantage
    ("blog-25.jpg", "Photorealistic aerial view of the Cairo-Alexandria Desert Road in Egypt, wide multi-lane highway cutting through desert landscape, distant city visible, sunset glow, strategic infrastructure, wide cinematic shot"),
    # 26 — Compounds guide
    ("blog-26.jpg", "Photorealistic gated residential compound entrance in Egypt, elegant gate with security booth, manicured garden inside, white modern apartment buildings visible behind, clean professional atmosphere, bright daylight"),
    # 27 — ROI calculation
    ("blog-27.jpg", "Photorealistic financial data on a laptop screen showing property investment ROI chart rising upward, Egyptian pound banknotes and house keys beside the laptop, warm desk lighting, investment success concept"),
    # 28 — Al-Ahram 10 years
    ("blog-28.jpg", "Photorealistic multiple completed Egyptian residential buildings in a row, all pristine and occupied, green landscaping in front, proud developer milestone scene, golden hour lighting, wide establishing shot showing scale of development"),
    # 29 — Malls and commercial
    ("blog-29.jpg", "Photorealistic modern Egyptian shopping mall exterior, glass and steel facade, palm tree-lined entrance, families entering, wide parking lot, bright afternoon sun, modern retail and commercial hub"),
    # 30 — Commercial unit investment
    ("blog-30.jpg", "Photorealistic ground-floor commercial retail shops in an Egyptian apartment building, glass storefronts with warm interior lights, people walking by on a wide sidewalk, evening atmosphere, urban commercial street scene"),
    # 31 — Sports clubs leisure
    ("blog-31.jpg", "Photorealistic outdoor swimming pool inside an Egyptian residential compound, surrounded by sun loungers and palm trees, families relaxing, bright blue water, sunny day, leisure and quality of life concept"),
    # 32 — Universities education
    ("blog-32.jpg", "Photorealistic Egyptian university campus with modern academic buildings, students walking across a wide courtyard, green lawns, palm trees, bright blue sky, academic and aspirational atmosphere"),
    # 33 — Construction phases
    ("blog-33.jpg", "Photorealistic series of Egyptian construction phase images: excavation pit, concrete skeleton, brick walls, finished building exterior, shown as clear step-by-step progression, infographic-style real photography"),
    # 34 — After-sale support
    ("blog-34.jpg", "Photorealistic friendly Egyptian customer service representative at a modern office reception desk speaking with a satisfied client, warm lighting, professional and caring atmosphere, real estate company branding visible"),
    # 35 — Private university guide
    ("blog-35.jpg", "Photorealistic modern private Egyptian university building, contemporary glass and concrete architecture, students in casual attire on steps, bright sunny day, academic achievement and aspiration"),
    # 36 — Contract due diligence
    ("blog-36.jpg", "Photorealistic Egyptian lawyer or notary reviewing a real estate contract document, close-up of hands on official papers, pen and official stamp visible, professional legal setting, bright office lighting"),
    # 37 — Schools family living
    ("blog-37.jpg", "Photorealistic Egyptian primary school exterior with children in uniform entering through the gate, parents walking alongside, cheerful school environment, bright morning sun, safe family neighborhood concept"),
    # 38 — Healthcare facilities
    ("blog-38.jpg", "Photorealistic clean modern Egyptian hospital or medical center exterior, white building with green medical cross signage, ambulance parked outside, professional healthcare atmosphere, bright daylight"),
    # 39 — Family vs investor mindset
    ("blog-39.jpg", "Photorealistic dual-concept image: on one side a warm Egyptian family home interior with family gathered, on the other side a real estate investment chart on a tablet, balance between lifestyle and investment"),
    # 40 — Transportation links
    ("blog-40.jpg", "Photorealistic busy Egyptian highway interchange with multiple lanes and overpasses, cars and trucks in motion, city skyline visible in background, infrastructure connectivity, aerial perspective, bright daylight"),
    # 41 — Property market 2025-2026
    ("blog-41.jpg", "Photorealistic real estate market trend visualization, rising bar chart overlaid on aerial Egyptian city photo, upward arrow, growth indicators, modern data analytics concept, professional infographic style"),
    # 42 — Utilities services
    ("blog-42.jpg", "Photorealistic Egyptian utility infrastructure inside a modern residential building, neat electrical panel, water pipes, gas meter, clean and organized utility room, technical inspection concept, bright lighting"),
    # 43 — Infrastructure and property values
    ("blog-43.jpg", "Photorealistic Egyptian urban development transformation, before and after: dusty unpaved road becoming a modern wide boulevard, infrastructure upgrade progress, compelling contrast, optimistic tone"),
    # 44 — Why Al-Ahram chose Sadat City
    ("blog-44.jpg", "Photorealistic confident Egyptian real estate developer standing in front of a completed residential project with arms crossed, proud achievement, buildings behind him, construction complete, warm golden hour light"),
    # 45 — Egypt new cities advantages
    ("blog-45.jpg", "Photorealistic panoramic view of a thriving Egyptian new city, wide boulevards, modern apartment towers, shopping centers, green parks, busy and vibrant, shot from a high vantage point, afternoon sunlight"),
    # 46 — Noise and environment
    ("blog-46.jpg", "Photorealistic peaceful Egyptian residential street early morning, no traffic, birds, trees along the sidewalk, warm soft light, quiet and serene suburban atmosphere, life away from city noise"),
    # 47 — Future expansion 2030
    ("blog-47.jpg", "Photorealistic architectural rendering style: futuristic Egyptian city expansion with new residential districts under development, cranes, new roads being built into the desert, ambitious scale, golden sunrise light"),
    # 48 — GAFI investment incentives
    ("blog-48.jpg", "Photorealistic Egyptian government official shaking hands with an investor at a formal signing ceremony, official documents and Egyptian flag visible, professional conference room setting, investment and partnership concept"),
    # 49 — Mosques religious community
    ("blog-49.jpg", "Photorealistic beautiful modern Egyptian mosque with elegant minarets, surrounded by a well-maintained courtyard and palm trees, worshippers entering, warm afternoon sunlight, community and spiritual atmosphere"),
    # 50 — Egypt real estate outlook 2026
    ("blog-50.jpg", "Photorealistic futuristic modern residential apartment buildings in Egypt, innovative contemporary architecture with curved facades and green terraces, smart city concept, hopeful forward-looking mood, golden afternoon light, aspirational and modern"),
]

output_dir = "src/assets/images/blog"
os.makedirs(output_dir, exist_ok=True)

total = len(PROMPTS)
for i, (filename, prompt) in enumerate(PROMPTS, 1):
    target = os.path.join(output_dir, filename)
    if os.path.exists(target):
        print(f"[{i}/{total}] Skipping {filename} (already exists)")
        continue

    print(f"[{i}/{total}] Generating {filename}...")
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-preview-image-generation",
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )

        saved = False
        for part in response.parts:
            if part.inline_data:
                image = part.as_image()
                image.save(target)
                print(f"  ✓ Saved {target}")
                saved = True
                break

        if not saved:
            print(f"  ✗ No image data returned for {filename}")

    except Exception as e:
        print(f"  ✗ Error generating {filename}: {e}")

    if i < total:
        time.sleep(4)

print("\nDone!")
