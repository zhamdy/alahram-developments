// inject-blog-batch1.js — posts 1–10
const fs = require('fs');
const path = require('path');

const AR = path.join(__dirname, '../src/assets/i18n/ar.json');
const EN = path.join(__dirname, '../src/assets/i18n/en.json');

const arPosts = {
  "post1": {
    "title": "مدينة السادات 2026: نظرة شاملة على مدينة المستقبل",
    "excerpt": "تعرف على مدينة السادات وأبرز مناطقها وخدماتها وأسباب تحوّلها إلى وجهة استثمارية رائدة في مصر",
    "content1": "مدينة السادات مدينة مخططة تقع في محافظة منوفية على بُعد نحو 90 كيلومتراً شمال غرب القاهرة، تربطها بالعاصمة طريق القاهرة-الإسكندرية الصحراوي بسهولة تامة. أُسِّست في سبعينيات القرن الماضي لتخفيف الضغط عن القاهرة، وباتت اليوم واحدة من أكثر المدن الجديدة نمواً وحيوية في مصر.",
    "content2": "تضم المدينة أحياء سكنية متنوعة تمتد عبر مناطق مرقّمة بدءاً من المنطقة الأولى وحتى المنطقة الحادية والعشرين، إلى جانب مناطق صناعية ضخمة تستوعب المئات من المصانع والشركات. هذا التوازن بين السكن والصناعة والخدمات يمنح المدينة استقراراً اقتصادياً يعكس قيمتها العقارية.",
    "content3": "في 2026، تشهد مدينة السادات طفرة عمرانية لافتة مع توسع المشاريع السكنية وتحديث شبكة الطرق والمرافق. الأهرام للتطوير العقاري رصدت هذا النمو مبكراً وأنشأت مشاريعها في أفضل مواقع المدينة لتوفر لعملائها استثماراً آمناً في المستقبل."
  },
  "post2": {
    "title": "تحديث سير العمل في مشروع 865 — أبريل 2026",
    "excerpt": "آخر تطورات البناء في مشروع 865 بالمنطقة الذهبية وجدول التسليم المحدّث",
    "content1": "يواصل مشروع 865 مسيرته وفق الجدول الزمني المحدد، إذ اكتملت أعمال الهيكل الخرساني لجميع المباني وجرى الانتهاء من أعمال العزل والمرافق الأساسية. تسير فرق التشطيب الداخلي في ثلاثة مبانٍ بالتوازي لضمان الالتزام بموعد التسليم.",
    "content2": "يضم المشروع وحدات سكنية بمساحات تتراوح بين 120 و190 متراً مربعاً بتصميمات عصرية وتشطيبات عالية الجودة. تشمل المرافق المشتركة حديقة مركزية ومنطقة ألعاب للأطفال وموقف سيارات مغطى، مما يوفر بيئة سكنية متكاملة.",
    "content3": "التسليم مقرر في الربع الثالث من 2026. يُعدّ مشروع 865 نموذجاً على التزام الأهرام للتطوير العقاري بمواعيد التسليم وجودة التنفيذ. للاستفسار عن الوحدات المتبقية أو خطط السداد، تواصل معنا مباشرة."
  },
  "post3": {
    "title": "المنطقة الذهبية بمدينة السادات: دليلك الكامل",
    "excerpt": "كل ما تحتاج معرفته عن المنطقة الذهبية — موقعها وخدماتها وأسباب تصدّرها قائمة أفضل مناطق الاستثمار",
    "content1": "تُعرف المنطقة 21 بمدينة السادات شعبياً بـ«المنطقة الذهبية» نظراً لموقعها المميز في قلب المدينة وقربها من الجامعات والمستشفيات والمراكز التجارية. تتميز شوارعها بالاتساع والتخطيط المنتظم مع وفرة من المساحات الخضراء التي ترفع جودة الحياة فيها.",
    "content2": "تحتضن المنطقة الذهبية عدداً من أبرز مشاريع الإسكان المتكاملة في مدينة السادات، وتستقطب شريحة واسعة من الأسر المتوسطة والمستثمرين الباحثين عن عوائد إيجارية مجزية. يرتفع الطلب على الوحدات السكنية فيها باستمرار بسبب القرب من مؤسسات التعليم العالي والمنطقة التكنولوجية.",
    "content3": "الأهرام للتطوير العقاري تمتلك حضوراً راسخاً في المنطقة الذهبية بمشاريع متعددة تلبي احتياجات مختلف شرائح العملاء. إذا كنت تفكر في الاستثمار أو السكن في قلب مدينة السادات، فالمنطقة الذهبية هي نقطة البداية الصحيحة."
  },
  "post4": {
    "title": "كيف تختار المطور العقاري المناسب؟ 7 معايير لا تتنازل عنها",
    "excerpt": "دليل عملي لتقييم المطورين العقاريين قبل الشراء وحماية حقوقك كمشترٍ في السوق المصري",
    "content1": "اختيار المطور العقاري المناسب لا يقل أهمية عن اختيار الوحدة ذاتها. أول المعايير التي يجب التحقق منها: سجل المطور في تسليم المشاريع السابقة في المواعيد المحددة، وجودة التنفيذ في مشاريعه المكتملة، ومدى وضوح العقود وخلوّها من البنود المبهمة.",
    "content2": "تحقق كذلك من ترخيص المطور لدى الجهات الرسمية كوزارة الإسكان وهيئة المجتمعات العمرانية الجديدة، ومن امتلاكه الأرض بعقد موثق. اطلب الاطلاع على تراخيص البناء وعقود الأرض قبل التوقيع، وتجنب الاعتماد على الوعود الشفهية وحدها.",
    "content3": "الأهرام للتطوير العقاري تعمل في مدينة السادات منذ سنوات بسجل واضح في التسليم والجودة. كل مشاريعنا مرخصة ومسجلة لدى الجهات المختصة، وعقودنا شفافة تحمي حقوق المشتري بالكامل. اسأل، تحقق، ثم اقرر."
  },
  "post5": {
    "title": "المنطقة 14 بمدينة السادات: فرصة استثمارية في طور النضج",
    "excerpt": "تعرف على خصائص المنطقة 14 وأسباب اهتمام المستثمرين بها كموقع واعد ذي أسعار تنافسية",
    "content1": "تقع المنطقة 14 في الجزء الغربي من مدينة السادات وتشهد توسعاً عمرانياً ملحوظاً خلال السنوات الأخيرة. تمتاز بأسعارها التي لا تزال تنافسية قياساً بالمنطقة الذهبية، مما يجعلها خياراً جذاباً للمستثمر الباحث عن عوائد مرتفعة على المدى المتوسط.",
    "content2": "تتوفر في المنطقة 14 خدمات أساسية جيدة من مدارس حكومية وخاصة ومراكز صحية ومحلات تجارية. مع استمرار مشاريع البنية التحتية الجديدة في المنطقة، يتوقع خبراء العقارات أن تشهد أسعارها ارتفاعاً ملموساً خلال الثلاث سنوات القادمة.",
    "content3": "للمستثمر الذي يبحث عن نقطة دخول مناسبة قبل ارتفاع الأسعار، تمثل المنطقة 14 فرصة حقيقية. الأهرام للتطوير العقاري تتابع عن كثب التطورات في مختلف مناطق مدينة السادات وتقدم لعملائها مشورة استثمارية مبنية على بيانات حقيقية."
  },
  "post6": {
    "title": "وحدة تحت الإنشاء أم وحدة جاهزة؟ كيف تختار في مدينة السادات",
    "excerpt": "مقارنة عملية بين مزايا ومخاطر شراء وحدة قيد الإنشاء مقابل وحدة جاهزة للسكن في مدينة السادات",
    "content1": "الوحدة قيد الإنشاء (أوف بلان) تتيح للمشتري الدخول بسعر أقل مع خطط سداد ممتدة، وهي الخيار الأمثل لمن يملك وقتاً كافياً قبل الحاجة للسكن أو يهدف للاستثمار وانتظار ارتفاع القيمة. لكنها تحمل مخاطر التأخير في التسليم أو التغيير في المواصفات.",
    "content2": "الوحدة الجاهزة تمنح المشتري الدخول الفوري والتحقق المباشر من جودة التنفيذ والتشطيب قبل الدفع. سعرها أعلى عادة، لكنها تُجنّب المشتري مخاطر التأخير. هي الخيار الأنسب لمن يحتاج سكناً فورياً أو يريد تأجير الوحدة من اليوم الأول.",
    "content3": "في مدينة السادات، تُقدم الأهرام للتطوير العقاري كلا الخيارين: مشاريع قيد الإنشاء بأسعار تنافسية وخطط سداد مرنة، ووحدات جاهزة للتسليم الفوري. قرارك يعتمد على وضعك المالي وأهدافك — نحن هنا لمساعدتك في الاختيار الصحيح."
  },
  "post7": {
    "title": "إطلاق مشروع 868 — وحدات فاخرة بالمنطقة الذهبية",
    "excerpt": "الأهرام للتطوير العقاري تطلق مشروع 868 بتصميمات معمارية حديثة وتشطيبات سوبر لوكس",
    "content1": "تُعلن الأهرام للتطوير العقاري عن إطلاق مشروع 868 في المنطقة الذهبية بمدينة السادات. يجمع المشروع بين التصميم المعماري العصري والموقع الاستراتيجي، ويقدم وحدات سكنية متنوعة المساحات تبدأ من 125 متراً مربعاً وتصل إلى 210 أمتار مربعة.",
    "content2": "صُمِّم المشروع وفق أحدث معايير الاستدامة، ويضم حديقة مركزية ومسبحاً ونادياً رياضياً ومنطقة تجارية متكاملة. التشطيبات سوبر لوكس بمواد مستوردة عالية الجودة، والأبواب والنوافذ مزدوجة العزل الحراري والصوتي.",
    "content3": "للاحتفاء بالإطلاق، تقدم الأهرام خطط سداد تصل إلى 8 سنوات بأقل دفعة مقدمة. الوحدات محدودة — سجّل اهتمامك الآن لضمان حقك في أسعار الإطلاق قبل أي تعديل."
  },
  "post8": {
    "title": "المنطقة 21 بمدينة السادات: دليل السكن والاستثمار",
    "excerpt": "استكشاف معمّق لمنطقة 21 — خدماتها ومشاريعها وأسباب تميّزها عن سائر مناطق مدينة السادات",
    "content1": "المنطقة 21 أو المنطقة الذهبية هي النواة السكنية الأكثر نضجاً في مدينة السادات. تتميز بشبكة طرق مكتملة وتوفر كثيف للخدمات يشمل مستشفيات حكومية وخاصة، ومدارس دولية، وجامعات، ومراكز تجارية متعددة الأنشطة.",
    "content2": "يرتفع الطلب الإيجاري في المنطقة 21 بفضل قربها من الجامعات الخاصة التي تستقطب الطلاب من محافظات منوفية والجيزة والإسكندرية. هذا يجعل الاستثمار فيها مجزياً للباحث عن دخل إيجاري منتظم إلى جانب ارتفاع القيمة طويل الأمد.",
    "content3": "الأهرام للتطوير العقاري تمتلك مشاريع رائدة داخل المنطقة 21 تلبي أعلى التوقعات. سواء كنت تبحث عن وحدة للسكن أو الاستثمار، فلدينا الحل المناسب لك في أفضل مواقع المنطقة الذهبية."
  },
  "post9": {
    "title": "دليل التمويل العقاري في مصر: كيف تحصل على قرض بأفضل الشروط",
    "excerpt": "خطوات عملية للحصول على تمويل عقاري مناسب في مصر وأبرز شروط البنوك وصندوق الإسكان الاجتماعي",
    "content1": "التمويل العقاري أداة فعّالة تتيح لك امتلاك وحدتك بقسط شهري بدلاً من دفع كامل الثمن مرة واحدة. في مصر، يمكنك اللجوء إلى البنوك التجارية أو صندوق الإسكان الاجتماعي ودعم التمويل العقاري حسب دخلك ونوع الوحدة المطلوبة.",
    "content2": "لضمان قبول طلب التمويل، احرص على: أن يكون دخلك الشهري الموثق كافياً لتغطية القسط (لا يتجاوز 40% من الدخل الصافي)، وأن تكون الوحدة مسجلة رسمياً أو قابلة للتسجيل، وأن يكون لديك الدفعة المقدمة جاهزة (تتراوح بين 10% و20% عادة).",
    "content3": "الأهرام للتطوير العقاري تتعاون مع عدد من البنوك لتسهيل إجراءات التمويل على عملائها. يمكننا مساعدتك في تقدير قدرتك الشرائية وتوجيهك نحو أنسب خيارات التمويل المتاحة لوحداتنا في مدينة السادات."
  },
  "post10": {
    "title": "المنطقة التكنولوجية بمدينة السادات: محرك النمو الاقتصادي الجديد",
    "excerpt": "كيف تُسهم المنطقة التكنولوجية في رفع الطلب على العقارات السكنية وتنشيط الاقتصاد المحلي لمدينة السادات",
    "content1": "أُنشئت المنطقة التكنولوجية في مدينة السادات لاستيعاب الشركات الصناعية والتقنية ذات التقنية المتوسطة والعالية، وهي تجتذب حالياً استثمارات ضخمة من شركات الإلكترونيات والصناعات الخفيفة والخدمات اللوجستية. هذا التوسع الصناعي يخلق آلاف فرص العمل لصالح سكان المدينة والمحافظات المجاورة.",
    "content2": "الأثر المباشر للمنطقة التكنولوجية على سوق العقارات السكني واضح: ارتفاع الطلب على الوحدات للسكن والإيجار من العمالة الوافدة، وزيادة الكثافة السكانية التي تستدعي مزيداً من الخدمات والتجارة. هذه الدورة الاقتصادية المتكاملة ترفع من قيمة العقارات السكنية المحيطة.",
    "content3": "المستثمر الذكي يرصد العلاقة بين النمو الصناعي والطلب السكني. مشاريع الأهرام للتطوير العقاري تقع في المواقع التي تستفيد مباشرة من هذا النمو، مما يضمن لك عوائد مجزية سواء من الارتفاع في القيمة أو العائد الإيجاري."
  }
};

const enPosts = {
  "post1": {
    "title": "Sadat City 2026: A Complete Overview of Egypt's Rising Urban Hub",
    "excerpt": "Discover Sadat City — its zones, infrastructure, services, and why it has become a leading investment destination in Egypt",
    "content1": "Sadat City is a planned urban center located in Monufia Governorate, approximately 90 kilometers northwest of Cairo, connected to the capital by the Cairo-Alexandria Desert Road. Founded in the 1970s to relieve pressure on Cairo, it has grown into one of Egypt's most dynamic and fastest-growing new cities.",
    "content2": "The city encompasses diverse residential districts spanning numbered zones from Zone 1 through Zone 21, alongside large industrial areas housing hundreds of factories and companies. This balance between residential, industrial, and service sectors gives the city an economic stability that underpins its real estate value.",
    "content3": "In 2026, Sadat City is experiencing a notable construction boom as residential projects expand and road and utility networks are upgraded. Al-Ahram Developments identified this growth early and established its projects in the city's prime locations, offering clients a sound investment in the city's future."
  },
  "post2": {
    "title": "Project 865 Construction Update — April 2026",
    "excerpt": "Latest progress on Project 865 in the Golden Zone and the updated delivery schedule",
    "content1": "Project 865 continues on schedule, with the reinforced concrete structure complete across all buildings and waterproofing and utility rough-in works finished. Interior finishing teams are working in parallel across three buildings to meet the committed handover date.",
    "content2": "The project offers residential units ranging from 120 to 190 square meters, with contemporary designs and high-quality finishes. Shared amenities include a landscaped central garden, a children's play area, and a covered car park, creating a fully integrated living environment.",
    "content3": "Delivery is planned for Q3 2026. Project 865 reflects Al-Ahram Developments' commitment to on-time delivery and construction quality. Contact us directly to inquire about remaining units or available payment plans."
  },
  "post3": {
    "title": "The Golden Zone in Sadat City: Your Complete Guide",
    "excerpt": "Everything you need to know about the Golden Zone — its location, services, and why it tops the list of Sadat City's best investment areas",
    "content1": "Zone 21 in Sadat City is popularly known as the 'Golden Zone' due to its prime central location and proximity to universities, hospitals, and commercial centers. Its streets are wide and well-planned, with an abundance of green spaces that raise the quality of life for residents.",
    "content2": "The Golden Zone hosts some of Sadat City's most prominent integrated housing projects and attracts a wide range of middle-class families and investors seeking solid rental yields. Demand for residential units remains consistently high, driven by the zone's proximity to higher education institutions and the technology district.",
    "content3": "Al-Ahram Developments has a strong presence in the Golden Zone with multiple projects serving different client segments. Whether you are looking to invest or to live in the heart of Sadat City, the Golden Zone is the right starting point."
  },
  "post4": {
    "title": "How to Choose the Right Real Estate Developer: 7 Non-Negotiable Criteria",
    "excerpt": "A practical guide to evaluating real estate developers before you buy and protecting your rights as a buyer in Egypt's market",
    "content1": "Choosing the right developer is as important as choosing the unit itself. The first criteria to verify: the developer's track record of delivering previous projects on time, the build quality of completed projects, and whether contracts are clear and free of ambiguous clauses.",
    "content2": "Also verify that the developer is licensed by official authorities such as the Ministry of Housing and the New Urban Communities Authority, and that land ownership is backed by a notarized title. Request to review building permits and land contracts before signing — never rely on verbal promises alone.",
    "content3": "Al-Ahram Developments has operated in Sadat City for years with a clear track record in delivery and quality. All our projects are licensed and registered with the relevant authorities, and our contracts are fully transparent to protect buyers. Ask, verify, then decide."
  },
  "post5": {
    "title": "Zone 14 in Sadat City: A Maturing Investment Opportunity",
    "excerpt": "Discover Zone 14's characteristics and why investors are eyeing it as a promising location with competitive pricing",
    "content1": "Zone 14 sits in the western part of Sadat City and has been seeing notable urban expansion in recent years. Its prices remain competitive relative to the Golden Zone, making it an attractive entry point for investors targeting above-average returns over the medium term.",
    "content2": "Zone 14 has solid basic services including government and private schools, health centers, and retail outlets. With ongoing infrastructure projects in the area, real estate experts anticipate meaningful price appreciation over the next three years as development accelerates.",
    "content3": "For the investor seeking a well-priced entry before prices rise, Zone 14 represents a genuine opportunity. Al-Ahram Developments closely monitors developments across all Sadat City zones and provides clients with investment guidance based on real market data."
  },
  "post6": {
    "title": "Off-Plan vs Ready Property in Sadat City: How to Choose",
    "excerpt": "A practical comparison of the advantages and risks of buying off-plan versus a move-in-ready unit in Sadat City",
    "content1": "An off-plan unit lets you enter at a lower price with extended payment plans — the ideal choice if you have time before you need to move in, or if your goal is capital appreciation. The trade-off is exposure to delivery delays or specification changes.",
    "content2": "A ready unit offers immediate occupancy and lets you verify construction quality and finishes directly before payment. It typically commands a higher price but eliminates delay risk. It is the better option if you need housing now or want to start earning rental income from day one.",
    "content3": "Al-Ahram Developments offers both options in Sadat City: under-construction projects with competitive prices and flexible payment plans, and move-in-ready units available immediately. Your decision depends on your financial position and goals — we are here to help you choose correctly."
  },
  "post7": {
    "title": "Project 868 Launch — Premium Units in the Golden Zone",
    "excerpt": "Al-Ahram Developments launches Project 868 featuring modern architectural design and super-deluxe finishes",
    "content1": "Al-Ahram Developments announces the launch of Project 868 in the Golden Zone of Sadat City. The project combines contemporary architectural design with a strategic location, offering residential units ranging from 125 to 210 square meters.",
    "content2": "Designed to the latest sustainability standards, the project features a central garden, swimming pool, sports club, and integrated commercial area. Finishes are super-deluxe with imported materials, and all windows and doors feature dual thermal and acoustic insulation.",
    "content3": "To mark the launch, Al-Ahram is offering payment plans of up to 8 years with the lowest down payment. Units are limited — register your interest now to secure launch pricing before any revision."
  },
  "post8": {
    "title": "Zone 21 in Sadat City: Your Living and Investment Guide",
    "excerpt": "An in-depth look at Zone 21 — its services, projects, and what sets it apart from other zones in Sadat City",
    "content1": "Zone 21, the Golden Zone, is the most mature residential core of Sadat City. It benefits from a complete road network and a dense service provision including government and private hospitals, international schools, universities, and multi-purpose commercial centers.",
    "content2": "Rental demand in Zone 21 is sustained by its proximity to private universities that attract students from Monufia, Giza, and Alexandria. This makes investing in the zone rewarding for those seeking steady rental income alongside long-term capital appreciation.",
    "content3": "Al-Ahram Developments owns leading projects within Zone 21 that meet the highest expectations. Whether you are looking to live or invest, we have the right solution in the Golden Zone's best locations."
  },
  "post9": {
    "title": "Egypt Real Estate Mortgage Guide: How to Get the Best Terms",
    "excerpt": "Practical steps for securing the right property financing in Egypt, including bank requirements and the Social Housing Fund",
    "content1": "A mortgage lets you own your unit through monthly installments rather than a single lump sum. In Egypt, you can approach commercial banks or the Social Housing and Mortgage Finance Fund depending on your income level and the type of unit you are targeting.",
    "content2": "To improve your approval odds: ensure your documented monthly income is sufficient to cover the installment (typically no more than 40% of net income), confirm the unit is officially registered or registrable, and have your down payment ready — usually between 10% and 20% of the purchase price.",
    "content3": "Al-Ahram Developments works with a number of banks to streamline the financing process for our clients. We can help you estimate your purchasing power and guide you to the most suitable financing options available for our Sadat City projects."
  },
  "post10": {
    "title": "Sadat City Technology Zone: The New Driver of Economic Growth",
    "excerpt": "How Sadat City's technology zone is boosting residential property demand and energizing the local economy",
    "content1": "Sadat City's technology zone was established to accommodate medium and high-tech industrial and technical companies, and is currently attracting major investment from electronics manufacturers, light industries, and logistics service providers. This industrial expansion is creating thousands of jobs for residents of the city and surrounding governorates.",
    "content2": "The direct impact on the residential real estate market is clear: rising demand for units from incoming workers, increasing population density that calls for more services and retail, and an integrated economic cycle that pushes up the value of surrounding residential properties.",
    "content3": "The smart investor tracks the relationship between industrial growth and residential demand. Al-Ahram Developments' projects are positioned to benefit directly from this growth, ensuring strong returns for you — whether from capital appreciation or rental yield."
  }
};

function injectPosts(filePath, newPosts) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(raw);
  if (!json.blog) throw new Error('No blog key in ' + filePath);
  // Merge new posts into existing posts (preserving any already-written ones)
  json.blog.posts = { ...(json.blog.posts || {}), ...newPosts };
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
  console.log('Updated', filePath);
}

injectPosts(AR, arPosts);
injectPosts(EN, enPosts);
console.log('Batch 1 (posts 1-10) done.');
